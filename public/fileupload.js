'use strict'

blackHoleSuns.prototype.buildFilePanel = function () {
    const panel = `
    <div id="upload" class="card" style="display:none">
        <div class="card-header txt-def h5">
            <div class="row">
                <div class="col-7 txt-def h5">Bulk File Upload</div>
                <a href="https://bulk.blackholesuns.com/" class="col-7 text-right h6 txt-def">
                    <i class="fa fa-download"></i>&nbsp;Bulk Entry Sheet Download
                </a>
            </div>
        </div>

        <div class="card-body">
            <div class="row">
                <div class="col-7">
                    <input type="file" id="uploadedFile" class="form-control form-control-sm" accept=".csv">
                </div>
                <button id="fbtn-check" type="button" class="btn btn-sm btn-def">Check</button>&nbsp
                <button id="fbtn-submit" type="button" class="btn btn-sm btn-def">Submit</button>&nbsp
            </div>
            <br>

            <div class="progress">
                <div id="progress" class="progress-bar progress-bar-striped bg-success progress-bar-animated"
                    role="progressbar" style="width: 0%; display:none" aria-valuenow="0" aria-valuemin="0"
                    aria-valuemax="100"></div>
            </div>
            <br>

            <div class="row">
                <label class="col-7 h6 txt-inp-def">
                    <input id="ck-verbose" type="checkbox">
                    Verbose
                </label>
            </div>

            <div id="filestatus" class="card card-body text-danger scrollbar container-fluid" style="overflow-y: scroll; height:100px"></div>
        </div>
    </div>`

    $("#panels").append(panel)

    $("[id|='fbtn']").unbind("click")
    $("[id|='fbtn']").click(function () {
        if (bhs.saveUser()) {
            if (bhs.fileSelected)
                bhs.readTextFile(bhs.fileSelected, $(this).prop("id"))
            else
                $("#filestatus").prepend("<h7>No file selected</h7>")
        } else
            $("#filestatus").prepend("<h7>Invalid user info</h7>")
    })

    $("#uploadedFile").unbind("change")
    $("#uploadedFile").change(function () {
        bhs.fileSelected = this
    })
}

const inpCoordIdx = 5
var importTable = [{
        match: /platform/i,
        field: "platform",
        format: formatPlatform,
        group: 0
    }, {
        match: /galaxy/i,
        field: "galaxy",
        format: formatGalaxy,
        group: 0
    }, {
        match: /org/i,
        field: "org",
        format: formatOrg,
        group: 0
    }, {
        match: /type/i,
        field: "type",
        group: 0
    }, {
        match: /own/i,
        field: "owned",
        format: formatOwned,
        group: 0
    },
    /* {
        match: /traveler|player|your/i,
        field: "player",
        group: 0
    },*/
    { // 1st match
        match: /coord|addr/i,
        field: "addr",
        required: true,
        format: reformatAddress,
        validate: validateAddressTF,
        group: 1
    }, {
        match: /econ/i,
        field: "econ",
        format: formatEcon,
        group: 1
    }, {
        match: /reg/i,
        field: "reg",
        required: true,
        group: 1
    }, {
        match: /sys/i,
        field: "sys",
        required: true,
        group: 1
    }, {
        match: /sun/i,
        field: "sun",
        group: 1
    }, {
        match: /life/i,
        field: "life",
        format: formatLife,
        group: 1
    }, {
        match: /conf/i,
        field: "conflict",
        format: formatConflict,
        group: 1
    }, { // 2nd match
        match: /coord|addr/i,
        field: "addr",
        labelreq: true,
        format: reformatAddress,
        validate: validateAddressTF,
        group: 2
    }, {
        match: /econ/i,
        field: "econ",
        format: formatEcon,
        group: 2
    }, {
        match: /reg/i,
        field: "reg",
        labelreq: true,
        checkreq: checkZeroAddress,
        checkval: 10,
        checkgrp: 2,
        group: 2
    }, {
        match: /sys/i,
        field: "sys",
        labelreq: true,
        checkreq: checkZeroAddress,
        checkval: 10,
        checkgrp: 2,
        group: 2
    }, {
        match: /sun/i,
        field: "sun",
        group: 2
    }, {
        match: /life/i,
        field: "life",
        format: formatLife,
        group: 2
    }, {
        match: /conf/i,
        field: "conflict",
        format: formatConflict,
        group: 2
    }
]

/* type menu from spreadsheet
Black Hole
Base
DeadZone 
Single System
Edit
Delete
Delete Base
*/

var batch
var count = 0
var log = {}

blackHoleSuns.prototype.readTextFile = function (f, id) {
    let file = f.files[0]
    let reader = new FileReader()

    $("#status").empty()
    $("#filestatus").empty()
    bhs.setAdmin(false)

    let check = id == "fbtn-check"

    reader.onload = async function () {

        log._name = bhs.user._name
        log.galaxy = bhs.user.galaxy
        log.platform = bhs.user.platform
        log.time = firebase.firestore.Timestamp.now()
        log.file = file.name
        log.path = "fileupload/" + uuidv4() + file.name.replace(/.*(\..*)$/, "$1")
        log.log = ""

        if (!check)
            bhs.fbstorage.ref().child(log.path).put(file)

        batch = bhs.fs.batch()
        count = 0

        let allrows = reader.result.split(/\r?\n|\r/)

        let step = 1 / allrows.length * 100
        let width = 1
        let progress = $("#progress")
        progress.prop("width", width + "%")
        progress.show()

        let k = 0
        let found = false

        for (; k < allrows.length && !found; ++k) {
            found = true
            let row = allrows[k].split(/[,\t]/)

            for (let i = 0; i < importTable.length; ++i) {
                importTable[i].index = -1

                for (let j = 0; j < row.length; ++j) {
                    if (row[j].search(importTable[i].match) != -1) {
                        importTable[i].index = j
                        row[j] = ""
                        break
                    }
                }

                if ((importTable[i].required || importTable[i].lablereq) && importTable[i].index == -1) {
                    found = false
                    continue
                }
            }
        }

        if (!found) {
            bhs.filestatus("Missing required column labels.", 0)
            await bhs.fWriteLog(check)
            return
        }

        var entry = []
        let ok = true

        for (let i = k; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {}
            entry[2] = {}

            entry[0] = {}
            entry[0]._name = bhs.user._name
            entry[0].org = bhs.user.org ? bhs.user.org : ""
            entry[0].uid = bhs.user.uid
            entry[0].galaxy = bhs.user.galaxy
            entry[0].platform = bhs.user.platform
            entry[0].type = ""
            entry[0].owned = "mine"
            entry[0].version = bhs.user.version
            if (bhs.contest)
                entry[0].contest = bhs.contest.name

            width = Math.ceil(i * step)
            progress.css("width", width + "%")
            progress.text(i)

            let row = allrows[i].split(/[,\t]/)

            if (row.length < 3 || row[importTable[inpCoordIdx].index] == "")
                ok = false

            for (let j = 0; j < importTable.length && ok; ++j) {
                let idx = importTable[j].index
                if (idx >= 0) {
                    if (row[idx] == "") {
                        let grp = importTable[j].checkgrp
                        let val = importTable[j].checkval
                        if (importTable[j].required || importTable[j].checkreq &&
                            importTable[j].checkreq(entry[importTable[grp].group][importTable[val].field])) {
                            bhs.filestatus("row: " + (i + 1) + " missing " + importTable[j].match, 0)
                            ok = false
                        }
                    } else {
                        let v = row[idx]
                        if (importTable[j].format)
                            v = importTable[j].format(v)

                        if (importTable[j].validate)
                            ok = importTable[j].validate(v)

                        entry[importTable[j].group][importTable[j].field] = v

                        if (!ok) {
                            let s = importTable[j].group == 1 ? "bh " : importTable[j].group == 2 ? "exit " : ""
                            bhs.filestatus("row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field], 0)
                        }
                    }
                }
            }

            if (ok) {
                entry[1] = mergeObjects(entry[1], entry[0])
                entry[2] = mergeObjects(entry[2], entry[0])

                if (entry[0].type.match(/edit/i)) {
                    bhs.filestatus("row: " + (i + 1) + " editing disabled.", 0)
                    //     if (typeof entry[2].addr === "undefined")
                    //         bhs.filestatus("row: " + (i + 1) + " no edit address.", 0)
                    //     else
                    //         ok = await bhs.fBatchEdit(entry[1], entry[2].addr, check)
                    // xxx save both
                } else if (entry[0].type.match(/delete base/i))
                    ok = await bhs.fBatchDeleteBase(entry[1], check)

                else if (entry[0].type.match(/delete/i))
                    ok = await bhs.fBatchDelete(entry[1], check)

                else if (entry[0].type.match(/base/i) || entry[2].addr == "0000:0000:0000:0000") {
                    let basename = entry[2].sys ? entry[2].sys : entry[2].reg
                    if (!basename) {
                        bhs.filestatus("row: " + (i + 1) + " Base name required.", 0)
                    } else {
                        entry[2] = {}
                        entry[2].basename = basename

                        if (entry[0].type.match(/v.*/i))
                            entry[2].owned = "visited"
                        else if (entry[0].type.match(/s.*/i))
                            entry[2].owned = "station"
                        else
                            entry[2].owned = "mine"

                        entry[2] = mergeObjects(entry[2], entry[0])
                        entry[2] = mergeObjects(entry[2], entry[1])
                        ok = await bhs.fBatchWriteBase(entry[2], null, check, i, true);
                    }
                } else if (entry[0].type.match(/single/i) || !entry[2].addr) {
                    ok = await bhs.fBatchUpdate(entry[1], null, check, i);

                } else {
                    entry[1].deadzone = entry[0].type.match(/dead|dz/i) || entry[2].addr == entry[1].addr
                    entry[1].blackhole = !entry[1].deadzone

                    let str = validateBHAddress(entry[1].addr)
                    if (str != "") {
                        bhs.filestatus("row: " + (i + 1) + " invalid black hole address (" + str + ") " + entry[1].addr, 0)
                        ok = false
                    }

                    if (ok && !entry[1].deadzone && (str = validateExitAddress(entry[2].addr)) != "") {
                        bhs.filestatus("row: " + (i + 1) + " invalid exit address (" + str + ") " + entry[1].addr, 0)
                        ok = false
                    }

                    let err = bhs.validateDist(entry[1])
                    if (ok && err != "")
                        bhs.filestatus("row: " + (i + 1) + " invalid distance (" + err + ") " + entry[1].addr, 0)
                    else
                        ok = await bhs.fBatchUpdate(entry[1], entry[2], check, i)
                }
            }
        }

        if (!check) {
            await bhs.fWriteLog()
            await bhs.fCheckBatchSize(true)
        }

        progress.css("width", 100 + "%")
        progress.text("done")
    }

    reader.readAsText(file)
}

blackHoleSuns.prototype.fWriteLog = async function (check) {
    if (log.log != "" && !check)
        bhs.fs.collection("log").add(log)
}

blackHoleSuns.prototype.fBatchUpdate = async function (entry, exit, check, i, base) {
    if (check)
        return true

    let err = bhs.validateEntry(entry, base)
    if (err != "") {
        bhs.filestatus("row: " + (i + 1) + " black hole (" + err + ") " + entry.addr, 0)
        return
    }

    if (exit) {
        let err = bhs.validateEntry(exit)
        if (err != "") {
            bhs.filestatus("row: " + (i + 1) + " exit (" + err + ") " + entry.addr, 0)
            return
        }
    }

    delete entry.type
    delete entry.owned
    entry.xyzs = bhs.addressToXYZ(entry.addr)
    entry.dist = bhs.calcDist(entry.addr)

    if (entry.blackhole && exit) {
        entry.connection = exit.addr
        exit.dist = bhs.calcDist(exit.addr)
        entry.towardsCtr = entry.dist - exit.dist

        entry.x = {}
        entry.x.addr = exit.addr
        entry.x.xyzs = bhs.addressToXYZ(exit.addr)
        entry.x.dist = exit.dist
        entry.x.sys = exit.sys
        entry.x.reg = exit.reg
        entry.x.life = typeof exit.life !== "undefined" ? exit.life : ""
        entry.x.econ = typeof exit.econ !== "undefined" ? exit.econ : ""
    }

    entry.modded = firebase.firestore.Timestamp.now()

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
    batch.set(ref, entry, {
        merge: true
    })
    let ok = await bhs.fCheckBatchSize()

    if (ok && entry.blackhole && exit) {
        exit.modded = firebase.firestore.Timestamp.now()

        let ref = bhs.getStarsColRef(exit.galaxy, exit.platform, exit.addr)
        batch.set(ref, exit, {
            merge: true
        })
        ok = await bhs.fCheckBatchSize()
    }

    return ok
}

// blackHoleSuns.prototype.fBatchEdit = async function (b, entry, old, check) {
//     delete entry.type
//     delete entry.owned
//     entry.modded = firebase.firestore.Timestamp.now()

//     let ok = true

//     if (check) {
//         let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, old)
//         await ref.get().then(function (doc) {
//             if (!doc.exists)
//                 bhs.filestatus(entry.addr + " doesn't exist for edit.", 1)
//         }).catch(err=>{
        //     bhs.filestatus("ERROR: "+err.code, 0)
        //     console.log(err)
        // })
//     } else {
//         let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, old)
//         batch.delete(ref)
//         ok = await bhs.fCheckBatchSize()

//         if (ok) {
//             let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
//             batch.set(ref, entry)

//             bhs.filestatus(entry.addr + " edited", 1)
//             ok = await bhs.fCheckBatchSize()
//         }
//     }

//     return ok
// }

blackHoleSuns.prototype.fBatchDelete = async function (entry, check) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr)

    if (check) {
        await ref.get().then(function (doc) {
            if (!doc.exists)
                bhs.filestatus(entry.addr + " doesn't exist for delete.", 0)
        }).catch(err=>{
            bhs.filestatus("ERROR: "+err.code, 0)
            console.log(err)
        })
    } else {
        batch.delete(ref)
        return await bhs.fCheckBatchSize()
    }

    return true
}

blackHoleSuns.prototype.fBatchDeleteBase = async function (entry, check) {
    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr)

    if (check) {
        await ref.get().then(function (doc) {
            if (!doc.exists)
                bhs.filestatus(entry.addr + " base doesn't exist for delete.", 0)
        }).catch(err=>{
            bhs.filestatus("ERROR: "+err.code, 0)
            console.log(err)
        })
    } else {
        batch.delete(ref)
        return await bhs.fCheckBatchSize()
    }

    return true
}

blackHoleSuns.prototype.fBatchWriteBase = async function (entry, check) {
    if (!check) {
        delete entry.type
        entry.modded = firebase.firestore.Timestamp.now()
        entry.xyzs = bhs.addressToXYZ(entry.addr)
        bhs.updateBase(entry)

        // let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr)
        // batch.set(ref, entry, {
        //     merge: true
        // })
        bhs.filestatus(entry.addr + " base saved.", 1)
        // return await bhs.fCheckBatchSize()
    }

    return true
}

blackHoleSuns.prototype.fCheckBatchSize = async function (flush) {
    if (flush && count > 0 || ++count > 500) {
        return await batch.commit().then(() => {
            bhs.filestatus("Commited " + count, 1)
            batch = bhs.fs.batch()
            count = 0
            return true
        }).catch(err => {
            bhs.filestatus("ERROR: " + err.code, 0)
            console.log(err)
            return false
        })
    }

    return true
}

blackHoleSuns.prototype.filestatus = function (str, lvl) {
    if (lvl == 0)
        log.log += str + "\n"

    if (lvl == 0 || $("#ck-verbose").prop("checked") && lvl == 1)
        $("#filestatus").append("<h6>" + str + "</h6>")
}