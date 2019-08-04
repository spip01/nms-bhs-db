'use strict';

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
                <button id="fbtn-check" type="button" class="col-2 btn btn-sm btn-def">Check</button>&nbsp;
                <button id="fbtn-compare" type="button" class="col-2 btn btn-sm btn-def">Compare</button>&nbsp;
                <button id="fbtn-submit" type="button" class="col-2 btn btn-sm btn-def">Submit</button>&nbsp;
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
                <label class="col-7 h6 txt-inp-def">
                    <input id="ck-vverbose" type="checkbox">
                    Very Verbose
                </label>
            </div>

            <div id="filestatus" class="card card-body text-danger scrollbar container-fluid" style="overflow-y: scroll; height:100px"></div>
            <br>
            <div id="filelist" class="card card-body scrollbar container-fluid" style="overflow-y: scroll; height:100px; display:none"></div>
            </div>
    </div>`;

    $("#panels").append(panel);

    $("[id|='fbtn']").unbind("click");
    $("[id|='fbtn']").click(function () {
        if (bhs.saveUser()) {
            if (bhs.fileSelected)
                bhs.readTextFile(bhs.fileSelected, $(this).prop("id"));
            else
                $("#filestatus").prepend("<h7>No file selected</h7>");
        } else
            $("#filestatus").prepend("<h7>Invalid user info</h7>");
    });

    $("#uploadedFile").unbind("change");
    $("#uploadedFile").change(function () {
        bhs.fileSelected = this;
    });

    // if (document.domain == "localhost" || document.domain == "test-nms-bhs.firebaseapp.com")
    //     $("#filelist").show();
}

blackHoleSuns.prototype.buildFileList = function () {
    if (document.domain == "localhost" || document.domain == "test-nms-bhs.firebaseapp.com") {
        const file = `
        <div class="row border-bottom">
        <div class="col-14">fname</div>
        <div class="col-3">galaxy</div>
        <div class="col-3">platform</div>
        <div class="col-4">date</div>
        <a id="id-idname" class="btn-def btn btn-sm col-2" download="fname" href="">Download</a>
        </div>`;

        let ref = bhs.fs.collection("upload");
        ref = ref.where("_player", "==", bhs.user._name);
        ref.get().then(function (snapshot) {
            for (let i = 0; i < snapshot.size; ++i) {
                let d = snapshot.docs[i].data();
                let h = /fname/g [Symbol.replace](file, d._name);
                h = /galaxy/ [Symbol.replace](h, d._galaxy);
                h = /platform/ [Symbol.replace](h, d._platform);
                h = /date/ [Symbol.replace](h, d._time.toDate().toDateLocalTimeString());
                h = /idname/ [Symbol.replace](h, d._name.nameToId() + d._time.seconds);
                $("#filelist").append(h);

                var data = new Blob([d.contents], {
                    type: 'text/csv'
                });
                var url = window.URL.createObjectURL(data);
                document.getElementById('id-' + d._name.nameToId() + d._time.seconds).href = url;
            }
        });
    }
}

const inpCoordIdx = 5;
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
        validate: validateAddress,
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
        validate: validateAddress,
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
];

/* type menu from spreadsheet
Black Hole
Base Mine
Base Visited
Base Station
DeadZone 
Single System
Edit
Delete
*/

blackHoleSuns.prototype.readTextFile = function (f, id) {
    let file = f.files[0];
    let reader = new FileReader();

    $("#status").empty();
    $("#filestatus").empty();

    let check = id == "fbtn-check" || id == "fbtn-compare";
    let compare = id == "fbtn-compare";

    reader.onload = async function () {
        let ext = file.name.replace(/.*(\..*)$/, "$1")
        let name = "fileupload/" + uuidv4() + ext;

        let log = {
            player: bhs.user._name,
            galaxy: bhs.user.galaxy,
            platform: bhs.user.platform,
            time: firebase.firestore.Timestamp.now(),
            upload: file.name,
            file: name,
        }

        if (!check) {
            bhs.fbstorage.ref().child(name).put(file);
            let ref = bhs.fs.collection("upload");
            ref.add(log);
        }

        let b = {};
        b.batch = bhs.fs.batch();
        b.batchcount = 0;

        log.log = "";

        let allrows = reader.result.split(/\r?\n|\r/);

        let step = 1 / allrows.length * 100;
        let width = 1;
        let progress = $("#progress");
        progress.prop("width", width + "%");
        progress.show();

        let k = 0;
        let found = false;

        for (; k < allrows.length && !found; ++k) {
            found = true;
            let row = allrows[k].split(/[,\t]/);

            for (let i = 0; i < importTable.length; ++i) {
                importTable[i].index = -1;

                for (let j = 0; j < row.length; ++j) {
                    if (row[j].search(importTable[i].match) != -1) {
                        importTable[i].index = j;
                        row[j] = "";
                        break;
                    }
                }

                if ((importTable[i].required || importTable[i].lablereq) && importTable[i].index == -1) {
                    found = false;
                    continue;
                }
            }
        }

        if (!found) {
            log.log = bhs.filestatus("Missing required column labels.", 0, log.log);
            await bhs.fBatchWriteLog(b, log.log, check);
            if (!check)
                await bhs.fCheckBatchSize(b, true);
            return;
        }

        var entry = [];

        for (let ok = true, i = k; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {};
            entry[2] = {};

            entry[0] = {};
            entry[0]._name = bhs.user._name;
            entry[0].org = bhs.user.org ? bhs.user.org : "";
            entry[0].uid = bhs.user.uid;
            entry[0].galaxy = bhs.user.galaxy;
            entry[0].platform = bhs.user.platform;
            entry[0].type = "x";
            entry[0].owned = "x";
            entry[0].version = "next";
            if (bhs.contest)
                entry[0].contest = bhs.contest.name;

            width = Math.ceil(i * step);
            progress.css("width", width + "%");
            progress.text(i);

            let row = allrows[i].split(/[,\t]/);

            if (row.length < 3 || row[importTable[inpCoordIdx].index] == "")
                ok = false;

            for (let j = 0; j < importTable.length && ok; ++j) {
                let idx = importTable[j].index;
                if (idx >= 0) {
                    if (row[idx] == "") {
                        let grp = importTable[j].checkgrp;
                        let val = importTable[j].checkval;
                        if (importTable[j].required || importTable[j].checkreq &&
                            importTable[j].checkreq(entry[importTable[grp].group][importTable[val].field])) {
                            log.log = bhs.filestatus("row: " + (i + 1) + " missing " + importTable[j].match, 0, log.log);
                            log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);
                            ok = false;
                        }
                    } else {
                        let v = row[idx];
                        if (importTable[j].format)
                            v = importTable[j].format(v);

                        if (importTable[j].validate)
                            ok = importTable[j].validate(v);

                        entry[importTable[j].group][importTable[j].field] = v;

                        if (!ok) {
                            let s = importTable[j].group == 1 ? "bh " : importTable[j].group == 2 ? "exit " : "";
                            log.log = bhs.filestatus("row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field], 0, log.log);
                            log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);
                        }
                    }
                }
            }

            if (ok) {
                if (compare) {
                    if (entry[0].type.match(/base/i) || entry[2].addr == "0000:0000:0000:0000") {
                        let ref = bhs.getStarsColRef(entry[0].galaxy, entry[0].platform, entry[1].addr);
                        await ref.get().then(function (doc) {
                            if (!doc.exists)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " base system not found", 0, log.log);
                            else if (doc.data().uid != entry[0].uid)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " creator " + doc.data()._name + " != current player " + entry[0]._name, 0, log.log);
                        });
                        ref = bhs.getUsersColRef(entry[0].uid, entry[0].galaxy, entry[0].platform, entry[1].addr);
                        await ref.get().then(function (doc) {
                            if (!doc.exists)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " base not found", 0, log.log);
                            else if (doc.data().uid != entry[0].uid)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " creator " + doc.data()._name + " != current player " + entry[0]._name, 0, log.log);
                        });
                    } else if (entry[0].type.match(/single/i) || !entry[2].addr) {
                        let ref = bhs.getStarsColRef(entry[0].galaxy, entry[0].platform, entry[1].addr);
                        await ref.get().then(function (doc) {
                            if (!doc.exists)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " single system not found", 0, log.log);
                            else if (doc.data().uid != entry[0].uid)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " creator " + doc.data()._name + " != current player " + entry[0]._name, 0, log.log);
                        });
                    } else {
                        let ref = bhs.getStarsColRef(entry[0].galaxy, entry[0].platform, entry[1].addr);
                        await ref.get().then(function (doc) {
                            if (!doc.exists)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " black hole system not found", 0, log.log);
                            else if (doc.data().uid != entry[0].uid)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " creator " + doc.data()._name + " != current player " + entry[0]._name, 0, log.log);
                        });
                        ref = bhs.getStarsColRef(entry[0].galaxy, entry[0].platform, entry[2].addr);
                        await ref.get().then(function (doc) {
                            if (!doc.exists)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[2].addr + " exit system not found", 0, log.log);
                            else if (doc.data().uid != entry[0].uid)
                                log.log = bhs.filestatus("row: " + (i + 1) + " addr " + entry[1].addr + " creator " + doc.data()._name + " != current player " + entry[0]._name, 0, log.log);
                        });
                    }
                } else {

                    entry[1] = mergeObjects(entry[1], entry[0]);
                    entry[2] = mergeObjects(entry[2], entry[0]);

                    entry[1].dist = bhs.calcDist(entry[1].addr);
                    entry[2].dist = bhs.calcDist(entry[2].addr);

                    if (entry[0].type.match(/edit/i))
                        await bhs.fBatchEdit(b, entry[1], entry[2].addr ? entry[2].addr : null, check);

                    else if (entry[0].type.match(/delete base/i))
                        await bhs.fBatchDeleteBase(b, entry[1], check);

                    else if (entry[0].type.match(/delete/i))
                        await bhs.fBatchDelete(b, entry[1], check);

                    else if (entry[0].type.match(/base/i) || entry[2].addr == "0000:0000:0000:0000") {
                        let base = entry[2].sys ? entry[2].sys : entry[2].reg;
                        entry[2] = {};
                        if (!base) {
                            log.log = bhs.filestatus("row: " + (i + 1) + " empty base name.", 0, log.log);
                            log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);
                        } else {
                            entry[2].basename = base;
                            entry[2].addr = entry[1].addr;

                            if (entry[0].type.match(/visit/i))
                                entry[2].owned = "visited";
                            else if (entry[0].type.match(/station/i))
                                entry[2].owned = "station";
                            else
                                entry[2].owned = "mine";

                            entry[2] = mergeObjects(entry[2], entry[0]);
                            entry[2] = mergeObjects(entry[2], entry[1]);
                            await bhs.fBatchWriteBase(b, entry[2], check);
                            await bhs.fBatchUpdate(b, entry[1], check); // don't overwrite bh info if it exists
                        }
                    } else if (entry[0].type.match(/single/i) || !entry[2].addr) {
                        await bhs.fBatchUpdate(b, entry[1], check); // don't overwrite bh info if it exists

                    } else {
                        entry[1].deadzone = entry[0].type.match(/dead|dz/i) || entry[2].addr == entry[1].addr;
                        entry[1].blackhole = !entry[1].deadzone;

                        let str = "";
                        if ((str = validateBHAddress(entry[1].addr))) {
                            log.log = bhs.filestatus("row: " + (i + 1) + " invalid black hole address (" + str + ") " + entry[1].addr, 0, log.log);
                            log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);
                            ok = false;
                        }

                        if (ok && !entry[1].deadzone) {
                            entry[1].connection = entry[2].addr;
                            entry[1].x = {}
                            entry[1].x.addr = entry[2].addr;
                            entry[1].x.dist = bhs.calcDist(entry[2].addr)
                            entry[1].x.sys = entry[2].sys;
                            entry[1].x.reg = entry[2].reg;
                            entry[1].x.life = typeof entry[2].life !== "undefined" ? entry[2].life : "";
                            entry[1].x.econ =typeof entry[2].econ !== "undefined"  ? entry[2].econ : "";

                            entry[1].towardsCtr = entry[1].dist - entry[2].dist;
                            if ((str = validateExitAddress(entry[2].addr))) {
                                log.log = bhs.filestatus("row: " + (i + 1) + " invalid exit address (" + str + ") " + entry[1].addr, 0, log.log);
                                log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);
                                ok = false;
                            }
                        }

                        if (ok && !(ok = bhs.validateDist(entry[1], "row: " + (i + 1) + " ", 0, log.log)))
                            log.log = bhs.filestatus("row: " + (i + 1) + " " + allrows[i], 2, log.log);

                        if (ok) {
                            await bhs.fBatchUpdate(b, entry[1], check); // don't overwrite existing base or creation dates
                            if (entry[1].blackhole)
                                await bhs.fBatchUpdate(b, entry[2], check);
                        }
                    }
                }
            }
        }

        await bhs.fBatchWriteLog(b, log, check);
        if (!check)
            await bhs.fCheckBatchSize(b, true);

        progress.css("width", 100 + "%");
        progress.text("done");
    }

    reader.readAsText(file);
}

blackHoleSuns.prototype.fBatchWriteLog = async function (b, log, check) {
    if (log && check) {
        let doc = log._name + "-" + log.time.seconds + "-" + log.time.nanoseconds;
        let ref = bhs.fs.collection("log").doc(doc);
        await b.batch.set(ref, log);
        b = await bhs.fCheckBatchSize(b);
    }

    return b;
}

blackHoleSuns.prototype.fBatchUpdate = async function (b, entry, check) {
    delete entry.type;
    delete entry.owned;
    entry.modded = firebase.firestore.Timestamp.now();
    entry.xyzs = bhs.addressToXYZ(entry.addr);
    if (entry.connection)
        entry.x.xyzs = bhs.addressToXYZ(entry.connection);

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            entry.created = entry.modded;
            if (!check) {
                await b.batch.set(ref, entry);
                bhs.filestatus(entry.addr + " added", 2);
            }
        } else {
            let d = doc.data()
            if (d.uid == entry.uid) {
                if (!check) {
                    await b.batch.update(ref, entry);
                    bhs.filestatus(entry.addr + " updated", 2);
                }
            } else
                bhs.filestatus(entry.addr + " can only be edited by " + d._name, 1);
        }

        b = await bhs.fCheckBatchSize(b);
    });

    return b;
}

blackHoleSuns.prototype.fBatchEdit = async function (b, entry, old, check) {
    delete entry.type;
    delete entry.owned;
    entry.modded = firebase.firestore.Timestamp.now();

    let addr = old ? old : entry.addr;
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            bhs.filestatus(entry.addr + " doesn't exist for edit.", 1);
        } else {
            if (!check) {
                if (old) {
                    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
                    await ref.delete();
                }

                let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
                await b.batch.set(ref, entry);

                bhs.filestatus(entry.addr + " edited", 2);
                b = await bhs.fCheckBatchSize(b);
            }
        }
    });

    return b;
}

blackHoleSuns.prototype.fBatchDelete = async function (b, entry, check) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists)
            bhs.filestatus(entry.addr + " doesn't exist for delete.", 0);
        else {
            let d = doc.data();
            if (d.uid == entry.uid) {
                if (!check)
                    await ref.delete().then(function () {
                        bhs.filestatus(entry.addr + " deleted", 2);
                    });
            } else
                bhs.filestatus(entry.addr + " can only be edited by " + d._name, 1);
        }
    });

    return b;
}

blackHoleSuns.prototype.fBatchDeleteBase = async function (b, entry, check) {
    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists)
            bhs.filestatus(entry.addr + " base doesn't exist for delete.", 0);
        else if (!check) {
            await ref.delete().then(function () {
                bhs.filestatus(entry.addr + " base deleted", 2);
            });
        }
    });

    return b;
}

blackHoleSuns.prototype.fBatchWriteBase = async function (b, entry, check) {
    delete entry.type;
    entry.modded = firebase.firestore.Timestamp.now();
    entry.xyzs = bhs.addressToXYZ(entry.addr);
    if (!check) {
        let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
        await b.batch.set(ref, entry);
        bhs.filestatus(entry.addr + " base saved.", 2);
        b = await bhs.fCheckBatchSize(b);
    }

    return b;
}

blackHoleSuns.prototype.fCheckBatchSize = async function (b, flush) {
    if (flush && b.batchcount > 0 || ++b.batchcount == 500) {
        console.log("commit " + b.batchcount);
        return await b.batch.commit().then(async () => {
            b.batch = await bhs.fs.batch();
            b.batchcount = 0;
            return b
        })
    }

    return b
}

blackHoleSuns.prototype.filestatus = function (str, lvl, buf) {
    if (typeof buf != "undefined")
        buf += bhs.user._name + " " + str + ";";

    if (lvl == 0 || $("#ck-verbose").prop("checked") && lvl == 1 || $("#ck-vverbose").prop("checked") && lvl == 2)
        $("#filestatus").append("<h6>" + str + "</h6>");

    return buf;
}