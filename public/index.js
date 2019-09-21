'use strict'

$(document).ready(() => {
    startUp()

    bhs.last = []

    bhs.buildUserPanel()
    bhs.buildFilePanel()

    panels.forEach(p => {
        bhs.buildPanel(p.id)
    })

    $("#save").click(() => {
        bhs.save()
    })

    $("#delete").click(async () => {
        $("#status").empty()
        let b = bhs.fs.batch()

        bhs.deleteEntry(bhs.last[pnlTop], b)
        if (bhs.last[pnlTop].basename)
            bhs.deleteBase(bhs.last[pnlTop].addr, b)

        bhs.status("deleting " + bhs.last[pnlTop].addr)

        if (bhs.last[pnlTop].blackhole) {
            bhs.deleteEntry(bhs.last[pnlBottom], b)

            if (bhs.last[pnlBottom].basename)
                bhs.deleteBase(bhs.last[pnlBottom].addr, b)

            bhs.status("deleting " + bhs.last[pnlBottom].addr)
        }

        await b.commit().then(() => {
            bhs.status("Delete successful.")
        }).catch(err => {
            bhs.status("ERROR: " + err.code)
            console.log(err)
        })
    })

    $("#cancel").click(() => {
        bhs.clearPanels()
    })
})

const pnlTop = 0
const pnlBottom = 1

var panels = [{
    name: "Black Hole System",
    id: "pnl-S1",
    listid: "S1",
    calc: true,
}, {
    name: "Exit System",
    id: "pnl-S2",
    listid: "S2",
    calc: true,
}]

const ownershipList = [{
    name: "mine"
}, {
    name: "visited"
}, {
    name: "station"
}]

blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom bkg-trans-2">
            <div class="card-header txt-def h5">title</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Coordinates&nbsp;</div>
                    <input id="id-addr" class="rounded col-sm-5 col-7" placeholder="0000:0000:0000:0000">
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Portal&nbsp;</div>
                    <div id="id-glyph" class="col-sm-5 col-7 h4 txt-inp-def glyph"></div>
                    <div id="id-hex" class="col-sm-5 col-14 text-center txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7  h6 txt-inp-def">System Name&nbsp;</div>
                    <input id="id-sys" class="rounded col-sm-5 col-7">
                </div>

                <div class="row">
                    <div class="col-sm-4 col-7 h6 txt-inp-def">Region Name&nbsp;</div>
                    <input id="id-reg" class="rounded col-sm-5 col-7">&nbsp
                    <button id="btn-searchRegion" type="button" class="btn-def btn btn-sm">Search</button>&nbsp
                    </div>

                <div id="id-byrow" class="row">
                    <div class="col-sm-4 col-7  h6 txt-inp-def">Entered by&nbsp;</div>
                    <div id="id-by" class="col-sm-5 col-7 txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Lifeform" class="col-11"></div>
                </div>
                <div class="row border-bottom">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Economy" class="col-11"></div>
                </div>

                <div id="row-valid" class="row border-bottom">
                    <label class="radio col-5 h6 txt-inp-def">
                        <input id="btn-valid" type="radio" name="validradio">
                        BH Pair Confirmed
                    </label>
                    <label class="radio col-4 h6 txt-inp-def">
                        <input id="btn-invalid" type="radio" name="validradio">
                        Broken
                    </label>
                </div>

                <div class="row">
                    <label class="col-7 h6 txt-inp-def">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>
                    <label id="id-sharepoi" class="col-7 h6 txt-inp-def hidden">
                        <input id="ck-sharepoi" type="checkbox">
                        Share POI
                    </label>
                </div>

                <div id="id-isbase" class="row" style="display:none">
                    <div class="col-sm-2 col-4 h6 txt-inp-def">Name</div>
                    <input id="id-basename" class="rounded col-6">
                    <div id="id-Owned" class="col-sm-3 col-9"></div>
                    <button id="btn-delbase" type="button" class="btn-def btn btn-sm disabled" disabled>Delete Base</button>&nbsp
                </div>

                <div id="id-pnl1-only" class="row">
                    <div class="col-5">
                        <label class="h6 txt-inp-def">
                            <input id="ck-single" type="checkbox">
                            Single System
                        </label>
                    </div>

                    <div class="col-5">
                        <label class="h6 txt-inp-def">
                            <input id="ck-isdz" type="checkbox">
                            Dead Zone
                        </label>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-4 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-7 text-right">To Center&nbsp;</div>
                            <div id="fmcenter" class="col-7 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-traveled" class="col-5 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-8 text-right"> Traveled&nbsp;</div>
                            <div id="traveled" class="col-6 text-left h6"></div>
                        </div>
                    </div>

                   <div id="id-tocenter" class="col-5 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br>`

    let h = /idname/g [Symbol.replace](panel, id)
    h = /title/g [Symbol.replace](h, id == "pnl-S1" ? panels[pnlTop].name : panels[pnlBottom].name)

    $("#panels").append(h)

    let loc = $("#" + id)

    bhs.buildMenu(loc, "Lifeform", lifeformList)
    bhs.buildMenu(loc, "Economy", economyList)
    bhs.buildMenu(loc, "Owned", ownershipList)

    loc.find("#id-addr").unbind("change")
    loc.find("#id-addr").change(function () {
        let addr = bhs.reformatAddress($(this).val())
        $(this).val(addr)

        let glyph = bhs.addrToGlyph(addr)

        let pnl = $(this).closest("[id|='pnl'")
        pnl.find("#id-glyph").text(glyph)
        pnl.find("#id-hex").text(glyph)

        bhs.getEntry(addr, bhs.displayListEntry)

        bhs.displayCalc()
    })

    loc.find('#ck-hasbase').unbind("change")
    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'")

        if ($(this).prop("checked")) {
            pnl.find("#id-isbase").show()
            pnl.find("#id-sharepoi").show()
        } else {
            pnl.find("#id-isbase").hide()
            pnl.find("#id-sharepoi").hide()
        }
    })

    $("#" + panels[pnlBottom].id + " #id-pnl1-only").hide()

    loc.find('#ck-single, #ck-isdz').unbind("change")
    loc.find('#ck-single, #ck-isdz').change(function () {
        let pnl = $("#" + panels[pnlBottom].id)
        if ($(this).prop("checked"))
            pnl.hide()
        else
            pnl.show()
    })

    loc.find("#btn-searchRegion").unbind("click")
    loc.find("#btn-searchRegion").click(() => {
        bhs.getEntryByRegion(loc.find("#id-reg").val(), bhs.displayListEntry)
    })

    loc.find("#btn-delbase").unbind("click")
    loc.find("#btn-delbase").click(() => {
        let addr = loc.find("#id-addr").val()
        bhs.deleteBase(addr)
    })
}

blackHoleSuns.prototype.displayListEntry = function (entry, zoom) {
    bhs.displaySingle(entry, pnlTop, zoom)

    if (entry.blackhole) {
        bhs.displaySingle(entry.x, pnlBottom, zoom)

        $("#" + panels[pnlTop].id + " #ck-single").prop("checked", false)
        $("#" + panels[pnlTop].id).show()
        $("#" + panels[pnlBottom].id).show()
    } else {
        $("#" + panels[pnlTop].id + " #ck-single").prop("checked", true)
        $("#" + panels[pnlTop].id).show()
        $("#" + panels[pnlBottom].id).hide()
    }
}

blackHoleSuns.prototype.displaySingle = function (entry, idx, zoom) {
    if (!entry)
        return

    if (zoom) {
        $("#inp-ctrcord").val(entry.addr)
        bhs.changeMapLayout(true, true)
        bhs.traceZero(entry)
    }

    bhs.last[idx] = entry
    if (idx === pnlBottom) {
        bhs.last[idx].galaxy = bhs.user.galaxy
        bhs.last[idx].platform = bhs.user.platform
    }

    bhs.drawSingle(entry)

    let loc = $("#" + panels[idx].id)

    loc.find("#id-addr").val(entry.addr)
    let glyph = bhs.addrToGlyph(entry.addr)
    loc.find("#id-glyph").text(glyph)
    loc.find("#id-hex").text(glyph)
    loc.find("#id-sys").val(entry.sys)
    loc.find("#id-reg").val(entry.reg)

    if (idx == 0)
        loc.find("#id-by").html("<h6>" + entry._name + "</h6>")
    else {
        loc.find("#id-byrow").hide()
    }

    loc.find("#btn-Lifeform").text(entry.life)
    loc.find("#ck-isdz").prop("checked", entry.deadzone)
    loc.find("#btn-valid").prop("checked", entry.valid)
    loc.find("#btn-invalid").prop("checked", entry.invalid)

    if (entry.basename) {
        loc.find("#id-basename").val(entry.basename)
        loc.find("#btn-Owned").text(entry.owned)
        loc.find("#ck-sharepoi").prop("checked", typeof entry.sharepoi !== "undefined" ? entry.sharepoi : false)

        loc.find("#ck-hasbase").prop("checked", true)
        loc.find("#id-isbase").show()
        loc.find("#id-sharepoi").show()
        loc.find("#btn-delbase").removeClass("disabled")
        loc.find("#btn-delbase").removeAttr("disabled")
    } else {
        loc.find("#ck-hasbase").prop("checked", false)
        loc.find("#ck-sharepoi").prop("checked", false)
        loc.find("#id-isbase").hide()
        loc.find("#id-sharepoi").hide()
        loc.find("#btn-delbase").addClass("disabled")
        loc.find("#btn-delbase").prop("disabled", true)
    }

    if (entry.econ) {
        let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].number
        loc.find("#btn-Economy").text(l + " " + entry.econ)
        loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";")
    }

    $("#entrybuttons").show()
    $("#upload").hide()
    $("#ck-fileupload").prop("checked", false)

    bhs.displayCalc()

    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")

    if (entry.blackhole && bhs.user.uid != entry.uid)
        loc.find("#row-valid").show()
}

blackHoleSuns.prototype.clearPanels = function () {
    panels.forEach(d => {
        bhs.clearPanel(d.id)
    })

    $("#delete").addClass("disabled")
    $("#delete").prop("disabled", true)
}

blackHoleSuns.prototype.clearPanel = function (d) {
    bhs.last = []

    let pnl = $("#" + d)

    pnl.find("input").each(function () {
        $(this).val("")
    })

    pnl.find("[id|='ck']").each(function () {
        $(this).prop("checked", false)
    })

    pnl.find("[id|='menu']").each(function () {
        $(this).find("[id|='btn']").text("")
    })

    pnl.find("#id-isbase").hide()
    pnl.find("#id-sharepoi").hide()
    pnl.find("#id-fmcenter").hide()
    pnl.find("#id-traveled").hide()
    pnl.find("#id-tocenter").hide()

    pnl.find("#id-by").text("")

    pnl.find("#btn-delbase").addClass("disabled")
    pnl.find("#btn-delbase").prop("disabled", true)

    pnl.find("#row-valid").hide()
}

blackHoleSuns.prototype.extractEntry = async function (idx, batch) {
    let pnl = $("#panels")
    let loc = pnl.find("#" + panels[idx].id)

    let entry = {}
    let lastentry = bhs.last[idx] ? bhs.last[idx] : null

    if (lastentry) {
        entry = mergeObjects(entry, lastentry)

        let addr = loc.find("#id-addr").val()
        if (lastentry.addr != addr) {
            bhs.deleteEntry(lastentry, batch)
            bhs.status("change address " + lastentry.addr)

            if (listentry.basename) {
                bhs.deleteBase(lastentry.addr, batch)
                bhs.status("change base address" + lastentry.addr)
            }
        }
    }

    if (!lastentry || lastentry.uid == bhs.user.uid) {
        entry._name = bhs.user._name
        entry.org = bhs.user.org
        entry.uid = bhs.user.uid
        entry.platform = bhs.user.platform
        entry.galaxy = bhs.user.galaxy
        entry.version = "beyond" // typeof bhs.user.version !== "undefined" && bhs.user.version ? bhs.user.version : "beyond"
    }

    entry.addr = loc.find("#id-addr").val()
    entry.sys = loc.find("#id-sys").val()
    entry.reg = loc.find("#id-reg").val()
    entry.life = loc.find("#btn-Lifeform").text().stripNumber()
    entry.econ = loc.find("#btn-Economy").text().stripNumber()

    entry.dist = bhs.calcDist(entry.addr)
    entry.xyzs = bhs.addressToXYZ(entry.addr)

    let hasbase = loc.find("#ck-hasbase").prop("checked")
    let single = loc.find("#ck-single").prop("checked")
    let deadzone = loc.find("#ck-isdz").prop("checked")

    let bhloc = pnl.find("#" + panels[pnlTop].id)
    entry.valid = bhloc.find("#btn-valid").prop("checked")
    entry.invalid = bhloc.find("#btn-invalid").prop("checked")

    if (idx == pnlTop) {
        entry.deadzone = deadzone

        if (!deadzone && !single) {
            entry.blackhole = true

            let xloc = pnl.find("#" + panels[pnlBottom].id)

            entry.connection = xloc.find("#id-addr").val()
            entry.x = {}
            entry.x.addr = entry.connection
            entry.x.dist = bhs.calcDist(entry.x.addr)
            entry.x.xyzs = bhs.addressToXYZ(entry.connection)
            entry.x.sys = xloc.find("#id-sys").val()
            entry.x.reg = xloc.find("#id-reg").val()
            entry.x.life = xloc.find("#btn-Lifeform").text().stripNumber()
            entry.x.econ = xloc.find("#btn-Economy").text().stripNumber()

            entry.towardsCtr = entry.dist - bhs.calcDist(entry.connection)
        }
    }

    let ok = bhs.validateEntry(entry, single) === ""

    if (ok) {
        if (!single)
            ok = bhs.validateDist(entry) === ""

        if (entry.blackhole && ok)
            ok = bhs.extractEntry(pnlBottom, batch)

        if (ok) {
            if (bhs.contest)
                entry.contest = bhs.contest._name

            delete entry.sharepoi
            delete entry.owned
            delete entry.basename

            bhs.updateEntry(entry, batch)
            bhs.status("save " + entry.addr)

            if (hasbase) {
                entry._name = bhs.user._name
                entry.org = bhs.user.org
                entry.uid = bhs.user.uid
                entry.platform = bhs.user.platform
                entry.galaxy = bhs.user.galaxy
                entry.version = "beyond" // typeof bhs.user.version !== "undefined" && bhs.user.version ? bhs.user.version : "beyond"

                entry.basename = loc.find("#id-basename").val()
                entry.owned = loc.find("#btn-Owned").text().stripNumber()
                entry.owned = entry.owned !== "" ? entry.owned : "mine"
                entry.sharepoi = loc.find("#ck-sharepoi").prop("checked")
                bhs.updateBase(entry)
                bhs.status("save base " + entry.addr)
            }
        }
    }

    return ok
}

blackHoleSuns.prototype.save = async function () {
    $("#status").empty()

    let batch = bhs.fs.batch()

    let ok = await bhs.saveUser(batch)

    if (ok)
        ok = bhs.extractEntry(pnlTop, batch)

    if (ok)
        await batch.commit().then(() => {
            bhs.status("Save Successful")
        }).catch(err => {
            bhs.status("Error: " + err.code)
            console.log(err)
        })
}

blackHoleSuns.prototype.displayCalc = function () {
    let top = $("#" + panels[pnlTop].id)
    let bottom = $("#" + panels[pnlBottom].id)

    let addr = top.find("#id-addr").val()
    let connection = bottom.find("#id-addr").val()

    let tdist = bhs.calcDist(addr)

    top.find("#fmcenter").text(tdist + "ly")
    top.find("#id-fmcenter").show()

    if (connection) {
        let bdist = bhs.calcDist(connection)

        bottom.find("#fmcenter").text(bdist + "ly")
        bottom.find("#id-fmcenter").show()

        bottom.find("#traveled").text(bhs.calcDist(addr, connection) + "ly")
        bottom.find("#id-traveled").show()

        bottom.find("#tocenter").text((tdist - bdist) + "ly")
        bottom.find("#id-tocenter").show()

        let entry = {}
        entry.addr = addr
        entry.connection = connection
        entry.dist = tdist
        entry.towardsCtr = tdist - bdist
        if (bhs.validateDist(entry) !== "")
            bottom.find("#id-tocenter").addClass("text-danger")
        else
            bottom.find("#id-tocenter").removeClass("text-danger")
    }
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").prepend("<h6>" + str + "</h6>")
}