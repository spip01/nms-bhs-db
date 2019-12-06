'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

var nmsce
const displayPath = "/nmsce/disp/"
const originalPath = "/nmsce/orig/"
const thumbnailPath = "/nmsce/disp/thumb/"
const redditPath = "/nmsce/reddit/"

$(document).ready(() => {
    startUp()

    $("#cemenus").load("cemenus.html", () => {
        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("[href='" + page + "']")
        $("#pagename").html(loc.text())
    })

    nmsce = new NMSCE()

    nmsce.last = null

    nmsce.logo = new Image()
    nmsce.logo.crossOrigin = "anonymous"
    nmsce.logo.src = "/images/nmsce-logo.png"

    bhs.buildUserPanel()

    nmsce.buildPanel()
    nmsce.buildTypePanels()

    if (fnmsce)
        nmsce.getLatest(nmsce.displayResults)

    $("#save").click(() => {
        if (nmsce.save())
            nmsce.clearPanel()
    })

    $("#delete").click(() => {
        $("#status").empty()
        if (nmsce.last)
            nmsce.deleteEntry(nmsce.last)
    })
})

function NMSCE() {

}

NMSCE.prototype.displayUser = function () {
    if (bhs.user.galaxy !== "" && !fnmsce) {
        nmsce.restoreText(bhs.user.imageText)
        nmsce.getEntries(bhs.user, nmsce.displayList, nmsce.displayList)
    }
}

NMSCE.prototype.buildPanel = function () {
    let loc = $("#pnl-S1")

    bhs.buildMenu(loc, "Lifeform", lifeformList, null, {
        required: !fnmsce,
        labelsize: "col-lg-5 col-md-4 col-sm-3 col-5",
        menusize: "col",
    })

    bhs.buildMenu(loc, "Economy", economyList, null, {
        required: !fnmsce,
        labelsize: "col-lg-5 col-md-4 col-sm-3 col-5",
        menusize: "col",
    })

    let gloc = loc.find("#glyphbuttons")
    addGlyphButtons(gloc, nmsce.addGlyph)
}

NMSCE.prototype.setGlyphInput = function (evt) {
    if (typeof bhs.inputSettings === "undefined" || bhs.inputSettings.glyph !== $(evt).prop("checked")) {
        bhs.updateUser({
            inputSettings: {
                glyph: $(evt).prop("checked")
            }
        })
    }
}

NMSCE.prototype.addGlyph = function (evt) {
    let loc = $(evt).closest("#id-glyphInput").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        nmsce.changeAddr(loc)
}

NMSCE.prototype.changeAddr = function (evt) {
    let addr = $(evt).val()
    if (addr !== "") {
        if (addr.length === 12) {
            let p = addr.slice(0, 1)
            let tab = $("[role='tabpanel']")

            for (let l of tab)
                $(l).find("#id-Planet-Index").val(p)
        }

        addr = reformatAddress(addr)
        let glyph = addrToGlyph(addr)
        let pnl = $(evt).closest("[id|='pnl'")

        nmsce.dispAddr(pnl, addr, glyph)

        if (!fnmsce) {
            nmsce.lastsys = null
            bhs.getEntry(addr, nmsce.displaySystem, null, null, true)
        }
    }
}

NMSCE.prototype.dispAddr = function (pnl, addr, glyph) {
    let loc = pnl.find("#id-glyphInput")
    loc.find("#id-addr").text(addr)
    loc.find("#id-glyph").val(glyph)

    loc = pnl.find("#id-addrInput")
    loc.find("#id-addr").val(addr)
    loc.find("#id-glyph").text(glyph)
    loc.find("#id-hex").text(glyph)
}

NMSCE.prototype.displaySystem = function (entry) {
    let loc = $("#pnl-S1")

    nmsce.lastsys = entry

    loc.find("#id-addr").val(entry.addr)
    loc.find("#id-glyph").html(addrToGlyph(entry.addr))
    loc.find("#id-sys").val(entry.sys)
    loc.find("#id-reg").val(entry.reg)

    loc.find("#id-by").html("<h6>" + entry._name ? entry._name : entry.player + "</h6>")

    loc.find("#btn-Lifeform").text(entry.life)

    if (entry.econ) {
        let l = economyList[getIndex(economyList, "name", entry.econ)]
        loc.find("#btn-Economy").text(l.number + " " + entry.econ)
        loc.find("#btn-Economy").attr("style", "background-color: " + l.color + ";")
    }
}

NMSCE.prototype.clearPanel = function (sys) {
    let pnl = sys ? $("[id|='pnl']") : $("#typePanels")

    pnl.find("input").each(function () {
        $(this).val("")
    })

    pnl.find("[id|='menu']").each(function () {
        if ($(this).prop("id").stripID() !== "Type")
            $(this).find("[id|='btn']").text("")
    })

    $("[id='map-selected'] img").each(function () {
        $(this).hide()
    })

    nmsce.last = null

    nmsce.restoreText()

    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    $("#delete").addClass("disabled")
    $("#delete").prop("disabled", true)

    $("#reddit").addClass("disabled")
    $("#reddit").prop("disabled", true)
}

NMSCE.prototype.extractEntry = async function () {
    let entry = {}
    let ok = true

    let loc = $("#pnl-S1")

    if (nmsce.lastsys)
        entry = mergeObjects({}, nmsce.lastsys)

    if (!nmsce.lastsys || entry.uid === bhs.user.uid) {
        entry._name = bhs.user._name
        entry.org = bhs.user.org
        entry.uid = bhs.user.uid
        entry.platform = bhs.user.platform
        entry.galaxy = bhs.user.galaxy
    }

    entry.version = "beyond"
    entry.page = "nmsce"

    let addr = loc.find("#id-addr").val()
    let sys = loc.find("#id-sys").val()
    let reg = loc.find("#id-reg").val()
    let life = loc.find("#btn-Lifeform").text().stripNumber()
    let econ = loc.find("#btn-Economy").text().stripNumber()

    if (!nmsce.lastsys || entry.addr !== addr || entry.sys !== sys ||
        entry.reg !== reg || entry.life !== life || entry.econ !== econ) {

        entry.addr = addr
        entry.sys = sys
        entry.reg = reg
        entry.life = life
        entry.econ = econ
        entry.xyzs = addressToXYZ(entry.addr)

        ok = bhs.validateEntry(entry, true) === ""
        if (ok)
            bhs.updateEntry(entry)
    }

    if (ok) {
        delete entry.created
        delete entry.x

        if (nmsce.last)
            entry = mergeObjects(entry, nmsce.last)

        if (!nmsce.last || entry.uid === bhs.user.uid) {
            entry._name = bhs.user._name
            entry.org = bhs.user.org
            entry.uid = bhs.user.uid
            entry.platform = bhs.user.platform
            entry.galaxy = bhs.user.galaxy
        }

        let tab = $("#typeTabs .active").prop("id").stripID()
        let pnl = $("#typePanels #pnl-" + tab)
        entry.type = tab

        let list = pnl.find("[id|='row']")
        for (let rloc of list) {
            if (!$(rloc).is(":visible"))
                continue

            let id = $(rloc).prop("id").stripID()
            let loc = $(rloc).find(":input")
            let data = $(rloc).data()
            let val = loc.val()

            if (typeof data === "undefined")
                continue

            switch (data.type) {
                case "number":
                case "float":
                case "string":
                    entry[id] = val
                    break
                case "menu":
                    entry[id] = $(rloc).find("[id|='btn']").text()
                    if (entry[id] === "Nothing Selected")
                        entry[id] = ""
                    break
                case "checkbox":
                    for (let ckloc of loc) {
                        if ($(ckloc).is(":visible")) {
                            let cid = $(ckloc).prop("id").stripID()
                            entry[cid] = $(ckloc).prop("checked")
                        }
                    }
                    break
                case "img":
                    if (!fnmsce) {
                        let canvas = $("#id-canvas")[0]
                        if (typeof canvas !== "undefined" && typeof entry[id] === "undefined")
                            entry[id] = uuidv4() + ".jpg"
                    }
                    break
            }

            if (data.req && !fnmsce)
                if (typeof entry[id] === "undefined" ||
                    (data.type === "string" || data.type === "menu") && entry[id] === "" ||
                    (data.type === "number" || data.type === "float") && entry[id] === -1 ||
                    data.type === "img" && entry[id] === "") {

                    bhs.status(id + " required. Entry not saved.", 0)
                    ok = false
                    break
                }
        }
    }

    if (ok) {
        loc = $("[id='map-selected']")
        for (let page of loc) {
            if ($(page).is(":visible")) {
                let id = $(page).closest("[id|='row']").prop("id").stripID()
                if (typeof entry[id] === "undefined")
                    entry[id] = {}

                let sel = $(page).children()
                for (let s of sel) {
                    if ($(s).is(":visible")) {
                        let alt = $(s).attr("alt")
                        entry[id][alt] = true
                    }
                }
            }
        }

        entry.id = entry.Name.nameToId()
        entry.Photo = entry.id+".jpg"
        nmsce.updateEntry(entry)

        let disp = document.createElement('canvas')
        nmsce.drawText(disp, 1024)
        disp.toBlob(blob => {
            bhs.fbstorage.ref().child(displayPath + entry.Photo).put(blob).then(() => {
                bhs.status("Saved " + displayPath + entry.Photo)
            })
        }, "image/jpeg", .9)

        let thumb = document.createElement('canvas')
        nmsce.drawText(thumb, 400)
        thumb.toBlob(blob => {
            nmsce.saved = blob
            bhs.fbstorage.ref().child(thumbnailPath + entry.Photo).put(blob).then(() => {
                bhs.status("Saved " + thumbnailPath + entry.Photo)
            })
        }, "image/jpeg", .7)

        let orig = document.createElement('canvas')
        let ctx = orig.getContext("2d")
        orig.width = 1024
        orig.height = nmsce.screenshot.height * 1024 / nmsce.screenshot.width
        ctx.drawImage(nmsce.screenshot, 0, 0, orig.width, orig.height)
        orig.toBlob(blob => {
            bhs.fbstorage.ref().child(originalPath + entry.Photo).put(blob).then(() => {
                bhs.status("Saved " + originalPath + entry.Photo)
            })
        }, "image/jpeg", .9)
    }

    return ok
}

NMSCE.prototype.displaySingle = async function (entry) {
    let tloc = $("#tab-" + entry.type.nameToId())
    tloc.click()

    nmsce.lastsys = null
    bhs.getEntry(entry.addr, nmsce.displaySystem, null, null, true)

    let pnl = $("#typePanels #pnl-" + entry.type)

    let list = pnl.find("[id|='row'] ")
    for (let row of list) {
        let data = $(row).data()
        let loc = $(row).find(":input")
        let id = $(row).prop("id").stripID()

        switch (data.type) {
            case "number":
            case "float":
            case "string":
                loc.val(entry[id])
                break
            case "menu":
                $(row).find("#item-" + entry[id]).click()
                break
            case "checkbox":
                loc.prop("checked", entry[id] ? true : false)
                break
        }
    }

    let loc = $("[id='map-selected']")
    for (let page of loc) {
        if ($(page).is(":visible")) {
            let id = $(page).closest("[id|='row']").prop("id").stripID()
            if (typeof entry[id] !== "undefined") {
                let sel = $(page).children()

                for (let s of sel) {
                    let alt = $(s).attr("alt")
                    if (entry[id][alt])
                        $(s).show()
                }
            }
        }
    }
}

NMSCE.prototype.executeSearch = async function (fcn) {
    let player = $("#id-Player").val()
    let platform = $("#btn-Platform").text().stripMarginWS()
    let galaxy = $("#btn-Galaxy").text().stripNumber()

    let tab = $("#typeTabs .active").prop("id").stripID()
    let pnl = $("#typePanels #pnl-" + tab)

    let ref = bhs.fs.collection("nmsce/" + galaxy + "/" + tab)

    let loc = $("#pnl-S1")
    let addr = loc.find("#id-addr").val()
    let sys = loc.find("#id-sys").val()
    let reg = loc.find("#id-reg").val()
    let life = loc.find("#btn-Lifeform").text().stripNumber()
    let econ = loc.find("#btn-Economy").text().stripNumber()

    if (player) ref = ref.where("_name", "==", player)
    if (platform) ref = ref.where("platform", "==", platform)
    if (addr) ref = ref.where("addr", "==", addr)
    if (econ) ref = ref.where("econ", "==", econ)
    if (life) ref = ref.where("life", "==", life)
    if (sys) ref = ref.where("sys", "==", sys)
    if (reg) ref = ref.where("life", "==", reg)

    let list = pnl.find("[id|='row']")
    for (let rloc of list) {
        if (!$(rloc).is(":visible"))
            continue

        let rdata = $(rloc).data()

        if (typeof rdata === "undefined")
            continue

        let loc = $(rloc).find(":input")
        let id = $(rloc).prop("id").stripID()
        let val = $(loc).val()

        switch (rdata.type) {
            case "number":
            case "float":
                if (val && val != -1)
                    ref = ref.where(id, "==", val)
                break
            case "string":
                if (val)
                    ref = ref.where(id, "==", val)
                break
            case "menu":
                val = $(rloc).find("#btn-" + id).text()
                if (val && val !== "Nothing Selected")
                    ref = ref.where(id, "==", val)
                break
            case "checkbox":
                for (let sloc of $(rloc).find("[id|='sck']")) {
                    if ($(sloc).prop("checked")) {
                        let aid = $(sloc).prop("id").stripID()
                        ref = ref.where(aid, "==", $(rloc).find("#ck-" + aid).prop("checked"))
                    }
                }
                break
        }
    }

    loc = $("[id='map-selected']")
    for (let page of loc) {
        if ($(page).is(":visible")) {
            let id = $(page).closest("[id|='row']").prop("id").stripID()

            let sel = $(page).children()
            for (let s of sel) {
                if ($(s).is(":visible")) {
                    let alt = $(s).attr("alt")
                    ref = ref.where(id + "." + alt, "==", true)
                }
            }
        }
    }

    nmsce.clearResults()
    ref.get().then(snapshot => {
        for (let doc of snapshot.docs)
            fcn(doc.data(), doc.ref.path)
    })
}

NMSCE.prototype.save = function () {
    $("#status").empty()

    let user = bhs.extractUser()

    if (bhs.user.uid && bhs.validateUser(user)) {
        bhs.user = mergeObjects(bhs.user, user)
        bhs.user.imageText = nmsce.extractImgText()

        let ref = bhs.getUsersColRef(bhs.user.uid)
        ref.set(bhs.user).then(() => {
            return true
        }).catch(err => {
            if (bhs.status)
                bhs.status("ERROR: " + err)

            console.log(err)
            return false
        })

        return nmsce.extractEntry()
    }
}

NMSCE.prototype.search = function () {
    $("#status").empty()
    nmsce.executeSearch(nmsce.displayResults)
}

blackHoleSuns.prototype.status = function (str, clear) {
    if (clear)
        $("#status").empty()

    $("#status").append("<h6>" + str + "</h6>")
}

let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#hdr-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`
let header = `
    <div id="hdr-idname" class="tab-pane show active" role="tabpanel" aria-labelledby="tab-idname">
        <div id="pnl-idname" class="row no-padding"></div>
    </div>`
let mapHeader = `<div id="pnl-idname" class="row no-padding border rounded" style="display:none"></div>`
const tSubList = `<div id="slist-idname" class="row no-padding" style="display:none"></div>`

const tReq = `&nbsp;<font style="color:red">*</font>`
const tText = `&nbsp;
    <span data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
        <i class="fa fa-question-circle-o text-danger h6"></i>
    </span>`

const inpHdr = `<div class="col-md-7 col-14">`
const inpLongHdr = `<div class="col-14">`
const inpShipHdr = `<div class="col-lg-7 col-md-14 col-sm-7 col-14">`
const inpEnd = `</div>`

const tString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tMap = `<div id="row-idname" data-type="map" data-req="ifreq"></div>`
const tLongString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row">
        <div class=" col-sm-5 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tNumber = `
    <div id="row-idname" data-type="number" data-req="ifreq" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-7" min=-1 max=range value=-1>
    </div>`
const tFloat = `
    <div id="row-idname" data-type="float" data-req="ifreq" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-7" step=0.1 min=-1 max=range value=-1>
    </div>`
const tMenu = `
    <div id="row-idname" data-type="menu" data-req="ifreq">
        <div id="id-idname"></div>
    </div>`
const tCkItem = `
    <div id="row-idname" data-type="checkbox" data-req="false">
        <label id="id-idname" class="h6 txt-inp-def row">
            titlettip&nbsp
            <label id="search-idname" class="h6 txt-inp-def hidden" style="color:blue">
                **&nbsp;
                <input id="sck-idname" type="checkbox">
            </label>          
            <input id="ck-idname" type="checkbox">
        </label>
    </div>`
const tImg = `
    <div id="row-idname" data-type="img" data-req="ifreq" class="row">
        <div class="col-3 txt-inp-def h6">titlettip&nbsp;</div>
        <input id="id-idname" type="file" class="col-10 form-control form-control-sm" 
            accept="image/*" name="files[]" onchange="nmsce.loadScreenshot(this)">&nbsp
    </div>`

NMSCE.prototype.buildTypePanels = function () {
    let tabs = $("#typeTabs")
    let pnl = $("#typePanels")
    let first = true

    for (let obj of objectList) {
        let id = obj.name.nameToId()
        let h = /idname/g [Symbol.replace](nav, id)
        if (!first)
            h = /active/ [Symbol.replace](h, "")
        h = /title/ [Symbol.replace](h, obj.name)
        tabs.append(h)

        h = /idname/g [Symbol.replace](header, id)
        if (!first)
            h = /show active/ [Symbol.replace](h, "")
        pnl.append(h)

        h = /idname/g [Symbol.replace](mapHeader, id)
        if (first)
            h = /style.*"/g [Symbol.replace](h, id)
        $("#pnl-map").append(h)

        first = false

        nmsce.addPanel(obj.fields, "pnl", id)
    }

    if (fnmsce)
        $("[id|='search']").show()

    $("area").mouseenter(function () {
        let id = $(this).attr("alt")
        let loc = $(this).closest("[id|='row']").find("#map-hover [alt='" + id + "']")
        loc.show()
        return false
    }).mouseleave(function () {
        let loc = $(this).closest("[id|='row']").find("#map-hover")
        loc.find("img").hide()
        return false
    })

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (evt) {
        let id = $(evt.currentTarget).prop("id").stripID()

        let mloc = $("#pnl-map")
        mloc.find("[id|='pnl']").hide()
        mloc = mloc.find("#pnl-" + id)
        mloc.show()

        let mlist = mloc.find("#map-image")
        for (let mloc of mlist) {
            let pos = $(mloc).position()

            $(mloc).parent().find("img").css({
                top: pos.top + "px",
                left: pos.left + "px",
            })
        }
    })
}

NMSCE.prototype.addPanel = function (list, pnl, itmid, slist, pid) {
    let appenditem = (loc, add, title, id, ttip, req, long) => {
        let h = long ? long : inpHdr
        let l = /title/ [Symbol.replace](add, title + (req ? tReq : ""))

        if (ttip) {
            l = /ttip/ [Symbol.replace](l, tText)
            l = /ttext/ [Symbol.replace](l, ttip)
        } else
            l = /ttip/ [Symbol.replace](l, "")

        l = /idname/g [Symbol.replace](l, id)
        l = /ifreq/ [Symbol.replace](l, req ? true : false)

        h += l + inpEnd
        loc.append(h)
    }

    let itm = $("#" + pnl + "-" + itmid)
    for (let f of list) {
        if (fnmsce) {
            f.required = false
            if (!f.search)
                continue
        }

        let l = ""
        let id = f.name.nameToId()

        switch (f.type) {
            case "number":
                l = /range/ [Symbol.replace](tNumber, f.range)
                appenditem(itm, l, f.name, id, f.ttip, f.required)
                break
            case "float":
                l = /range/ [Symbol.replace](tFloat, f.range)
                appenditem(itm, l, f.name, id, f.ttip, f.required)
                break
            case "img":
                appenditem(itm, tImg, f.name, id, f.ttip, f.required, inpLongHdr)
                break
            case "checkbox":
                appenditem(itm, tCkItem, f.name, id, f.ttip, f.required)
                break
            case "string":
                appenditem(itm, tString, f.name, id, f.ttip, f.required)
                break
            case "long string":
                appenditem(itm, tLongString, f.name, id, f.ttip, f.required, inpLongHdr)
                break
            case "blank":
                itm.append(inpHdr + inpEnd)
                break
            case "menu":
                appenditem(itm, tMenu, "", id)
                let lst = itm.find("#row-" + id)
                bhs.buildMenu(lst, f.name, f.list, f.sublist ? nmsce.selectSublist : null, f)

                if (f.sublist) {
                    for (let s of f.list) {
                        let iid = s.name.nameToId()
                        l = /idname/ [Symbol.replace](tSubList, iid)
                        appenditem(itm, l, s.name, iid, null, null, inpLongHdr)

                        let loc = $("#pnl-map #" + itm.prop("id"))
                        appenditem(loc, l, s.name, iid, null, null, inpLongHdr)

                        nmsce.addPanel(f.sublist, "slist", iid, s, itmid)
                    }
                }
                break
            case "map":
                let iid = itmid.nameToId()
                let mloc = $("#pnl-map")
                let map = f.map

                if (pid) {
                    if (!slist[f.name])
                        continue

                    mloc = mloc.find("#slist-" + iid)
                    map = slist[f.name]
                } else
                    mloc = mloc.find("#pnl-" + iid)

                iid = f.name.nameToId()
                l = /idname/ [Symbol.replace](tMap, iid)
                appenditem(mloc, l, "", id, null, null, inpShipHdr)

                mloc = mloc.find("#row-" + iid)
                mloc.append(map)

                nmsce.loadMap(mloc)
                break
        }
    }
}

const imgline = `<img alt="id" src="path/fname.png" class="hidden" style="position:absolute" />`

NMSCE.prototype.loadMap = function (ploc) {
    let loc = ploc.find("#map-image")
    let path = loc.prop("src").replace(/(.*)\/.*/, "$1")

    let aloc = ploc.find("#map-areas")
    let hloc = ploc.find("#map-hover")
    let sloc = ploc.find("#map-selected")

    if (hloc.children().length === 0) {
        for (let loc of aloc.children()) {
            $(loc).click(function () {
                nmsce.mapSelect(this)
            })

            let alt = $(loc).attr("alt")
            let data = $(loc).data()
            let l = /id/ [Symbol.replace](imgline, alt)
            l = /path/ [Symbol.replace](l, path)
            l = /fname/ [Symbol.replace](l, alt)
            if (data.group)
                l = /style/ [Symbol.replace](l, "data-group=" + data.group + " style")
            hloc.append(l)

            l = l.replace(/h(\d+).png/g, "s$1.png")
            sloc.append(l)
        }
    }
}

NMSCE.prototype.mapSelect = function (evt) {
    let id = $(evt).attr("alt")
    let ploc = $(evt).closest("[id|='pnl']")
    let loc = $(evt).closest("[id|='row']")
    let hloc = loc.find("#map-hover [alt='" + id + "']")
    let sloc = loc.find("#map-selected [alt='" + id + "']")

    if (sloc.is(":visible")) {
        sloc.hide()
        hloc.show()
    } else {
        let data = $(evt).data()
        if (data.group) {
            ploc.find("#map-hover [data-group='" + data.group + "']").hide()
            ploc.find("#map-selected [data-group='" + data.group + "']").hide()
        }

        sloc.show()
    }
}

NMSCE.prototype.selectSublist = function (btn) {
    $("[id|='slist']").hide()

    let id = btn.text().stripMarginWS().nameToId()
    $("[id='slist-" + id + "']").show()

    let mloc = $("#pnl-map")
    let mlist = mloc.find("[id='map-image']")
    for (let mloc of mlist) {
        let pos = $(mloc).position()

        $(mloc).parent().find("img").css({
            top: pos.top + "px",
            left: pos.left + "px",
        })
    }
}

let txtcanvas = document.createElement('canvas')

NMSCE.prototype.loadImgText = function (clear) {
    const ckbox = `
        <label class="col-3">
            <input id="ck-idname" type="checkbox" data-loc="src" onchange="nmsce.ckImgText(this, true)">
            &nbsp;title
        </label>`

    const textInp = `
        <div class="col-14" style="padding-left:15px">
            <label class="col-3 txt-inp-def">
                <input id="ck-text" type="checkbox" data-loc="#id-text"
                    onchange="nmsce.ckImgText(this, true)">
                Text&nbsp;&nbsp;
                <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                    data-placement="bottom"
                    title="Use Line break, <br>, to separate multiple lines.">
                </i>
            </label>
            <input id="id-text" class="rounded col-10" type="text">
        </div>
        <br>`

    $("#img-text").html(textInp)

    let appenditem = (title, src) => {
        let h = /idname/ [Symbol.replace](ckbox, title.nameToId())
        h = /title/ [Symbol.replace](h, title)
        h = /src/ [Symbol.replace](h, src)

        $("#img-text").append(h)

        if (clear || typeof nmsce.imageText === "undefined" || typeof nmsce.imageText[title.nameToId()] === "undefined")
            nmsce.initTxtItem(title.nameToId())
    }

    let active = $("#typePanels .active")
    let type = active.prop("id").stripID()
    let objIdx = getIndex(objectList, "name", type)
    let obj = objectList[objIdx]

    for (let txt of obj.imgText)
        appenditem(txt.name, txt.id)

    for (let fld of obj.fields) {
        if (fld.imgText)
            appenditem(fld.name, "#typePanels .active #id-" + fld.name.nameToId())

        if (typeof fld.sublist !== "undefined")
            for (let sub of fld.sublist)
                if (sub.imgText)
                    appenditem(sub.name, "#typePanels .active #id-" + sub.name.nameToId() + " :visible")
    }

    bhs.buildMenu($("#imgtable"), "Font", fontList, nmsce.setFont, {
        labelsize: "col-5",
        menusize: "col",
    })
}

NMSCE.prototype.initTxtItem = function (id) {
    if (typeof nmsce.imageText === "undefined")
        nmsce.imageText = {}
    if (typeof nmsce.imageText[id] === "undefined")
        nmsce.imageText[id] = {}

    nmsce.imageText[id] = {
        font: id === "Glyphs" ? "glyph" : "Arial",
        fSize: 18,
        color: "#ffffff",
        x: 20,
        y: 20,
        ck: false,
        sel: false,
        width: 0,
        height: 0,
        text: ""
    }
}

NMSCE.prototype.ckImgText = function (evt, draw) {
    let id = $(evt).prop("id").stripID()
    let ck = $(evt).prop("checked")

    if (typeof nmsce.imageText[id] === "undefined")
        nmsce.initTxtItem(id)

    if (ck) {
        let data = $(evt).data()
        let loc = $(data.loc)
        let type = loc.attr("type")
        let text = ""

        switch (type) {
            case "button":
                text = loc.text().stripNumber()
                break
            case "number":
                text = loc.val()
                text = text === -1 ? "" : parseInt(text)
                break
            case "float":
                text = loc.val()
                text = text === -1 ? "" : parseFloat(text)
                break
            default:
                text = loc.val()
                if (id === "Glyphs") {
                    let loc = $("#id-Planet-Index :visible")
                    let num = loc.length > 0 && loc.val() > 0 ? loc.val() : 0
                    text = addrToGlyph(text, num)
                }
                break
        }

        nmsce.imageText[id].text = text
        nmsce.imageText[id].ck = true
        nmsce.imageText[id].sel = true
        nmsce.imageText[id] = nmsce.measureText(nmsce.imageText[id])
    } else {
        nmsce.imageText[id].text = ""
        nmsce.imageText[id].ck = false
        nmsce.imageText[id].sel = false
        nmsce.imageText[id].width = 0
        nmsce.imageText[id].height = 0
    }

    if (draw)
        nmsce.drawText()
}

NMSCE.prototype.restoreText = function (iTxt, draw) {
    if (typeof iTxt !== "undefined" && iTxt)
        nmsce.imageText = iTxt

    if (typeof nmsce.imageText === "undefined")
        return

    let loc = $("#img-text")

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let f = nmsce.imageText[id]

        let floc = loc.find("#ck-" + id)

        if (floc.length > 0) {
            floc.prop("checked", f.ck)
            nmsce.ckImgText(floc)
            f.sel = false
        }
    }

    if (draw)
        nmsce.drawText()
}

NMSCE.prototype.extractImgText = function () {
    let s = mergeObjects({}, nmsce.imageText)
    let keys = Object.keys(s)
    for (let k of keys) {
        let f = s[k]
        delete f.width
        delete f.height
        if (f.name !== "Text" && f.text !== "")
            delete f.text
        delete f.sel
    }

    return s
}

NMSCE.prototype.loadScreenshot = async function (evt, fname) {
    nmsce.loadImgText()
    nmsce.restoreText()

    if (evt) {
        let file = evt.files[0]
        let reader = new FileReader()
        reader.onload = function () {
            nmsce.screenshot = new Image()
            nmsce.screenshot.crossOrigin = "anonymous"
            nmsce.screenshot.src = reader.result

            nmsce.screenshot.onload = function () {
                nmsce.drawText()
            }
        }
        reader.readAsDataURL(file)
    } else {
        let img = new Image()
        img.crossOrigin = "anonymous"

        let url = await bhs.fbstorage.ref().child(originalPath + fname).getDownloadURL()
        var xhr = new XMLHttpRequest()
        xhr.responseType = 'blob'
        xhr.onload = function (event) {
            var blob = xhr.response
            nmsce.screenshot = new Image()
            nmsce.screenshot.crossOrigin = "anonymous"
            nmsce.screenshot.src = url

            nmsce.screenshot.onload = function () {
                nmsce.drawText()
            }
        }
        xhr.open('GET', url)
        xhr.send()
    }

    let img = $("#imgtable")
    img.show()
    img = img.find("#id-canvas")

    img.mousedown(e => {
        nmsce.handleMouseDown(e)
    })
    img.mousemove(e => {
        nmsce.handleMouseMove(e)
    })
    img.mouseup(e => {
        nmsce.handleMouseUp(e)
    })
    img.mouseout(e => {
        nmsce.handleMouseOut(e)
    })
}

var mfLoc

NMSCE.prototype.measureText = function (t) {
    if (!mfLoc)
        mfLoc = $("#measurefont")

    mfLoc.css("font", t.fSize + "px " + t.font)
    mfLoc.html(t.text)

    t.width = mfLoc.width()
    t.height = mfLoc.height()

    return t
}

NMSCE.prototype.setColor = function (evt) {
    let color = $(evt).val()

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]

        if (text.sel)
            text.color = color
    }

    nmsce.drawText()
}

NMSCE.prototype.setSize = function (evt) {
    let size = parseInt($(evt).val())

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]

        if (text.sel) {
            text.fSize = size
            text = nmsce.measureText(text)
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.setFont = function (evt) {
    let font = $(evt).text()

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]

        if (text.sel) {
            text.font = id === "Glyphs" ? "glyph" : font
            text = nmsce.measureText(text)
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.drawText = function (alt, altw) {
    let canvas = alt ? alt : document.getElementById("id-canvas")

    let width = $("#id-img").width()
    let scale = altw ? altw / width : 1
    width = altw ? altw : width

    let ctx = txtcanvas.getContext("2d")
    txtcanvas.width = width
    txtcanvas.height = nmsce.screenshot.height * width / nmsce.screenshot.width
    ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

    let loc = $("#img-text")
    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]
        let tloc = loc.find("#ck-" + id)

        if (text.ck && tloc.is(":visible")) {
            if (id === "Glyphs") {
                text.font = "glyph"

                ctx.fillStyle = text.color
                ctx.fillRect((text.x - 2) * scale, (text.y - text.height) * scale, (text.width + 4) * scale, (text.height + 4) * scale)
                ctx.fillStyle = "#000000"
                ctx.fillRect((text.x - 1) * scale, (text.y - text.height + 1) * scale, (text.width + 2) * scale, (text.height + 2) * scale)
            }

            ctx.font = (text.fSize * scale) + "px " + text.font
            ctx.fillStyle = text.color

            if (typeof text.text !== "undefined" && text.text.includes("<br>")) {
                let l = text.text.split("<br>")

                for (let i = 0; i < l.length; ++i)
                    ctx.fillText(l[i], (text.x) * scale, (text.y + i * (text.fSize * 1.15)) * scale)
            } else
                ctx.fillText(text.text, (text.x) * scale, (text.y) * scale)

            if (text.sel && !altw) {
                ctx.strokeStyle = "white"
                ctx.setLineDash([2, 2]);
                ctx.beginPath()
                ctx.rect(text.x - 2, text.y - text.fSize + 2, text.width + 3, text.height + 3)
                ctx.stroke();
            }
        }
    }

    canvas.width = width
    canvas.height = nmsce.screenshot.height * width / nmsce.screenshot.width
    let w = canvas.height * .09

    ctx = canvas.getContext("2d")
    ctx.drawImage(nmsce.screenshot, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(nmsce.logo, canvas.width - w - 5, canvas.height - w - 5, w, w)
}

NMSCE.prototype.redditShare = function (evt) {
    let disp = document.createElement('canvas')
    nmsce.drawText(disp, 900)
    disp.toBlob(blob => {
        bhs.fbstorage.ref().child(redditPath + nmsce.last.Photo).put(blob).then(() => {
            bhs.fbstorage.ref().child(redditPath + nmsce.last.Photo).getDownloadURL().then(url => {
                let u = "http://www.reddit.com/submit?url=" + encodeURI(url)
                window.open(u);
            })
        })

    }, "image/jpeg", .7)
}

NMSCE.prototype.textHittest = function (x, y, text) {
    return (x >= text.x && x <= text.x + text.width && y >= text.y - text.fSize && y <= text.y - text.fSize + text.height)
}

NMSCE.prototype.handleMouseDown = function (e) {
    e.preventDefault()

    let canvas = $(e.currentTarget).get(0)
    let canvasOffset = canvas.getBoundingClientRect()

    let offsetX = canvasOffset.left
    let offsetY = canvasOffset.top
    let startX = parseInt(e.clientX - offsetX)
    let startY = parseInt(e.clientY - offsetY)

    let keys = Object.keys(nmsce.imageText)

    if (!e.shiftKey)
        for (let k of keys) {
            let text = nmsce.imageText[k]
            text.sel = false
        }

    let loc = $("#imgtable")
    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.ck && nmsce.textHittest(startX, startY, text)) {
            text.sel = true
            nmsce.startX = startX
            nmsce.startY = startY

            loc.find("#btn-Font").text(text.font)
            loc.find("#sel-size").val(text.fSize)
            loc.find("#sel-color").val(text.color)

            if (!e.shiftKey)
                break
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.handleMouseUp = function (e) {
    e.preventDefault()
    delete nmsce.startX
    delete nmsce.starty
}

NMSCE.prototype.handleMouseOut = function (e) {
    e.preventDefault()
}

NMSCE.prototype.handleMouseMove = function (e) {
    e.preventDefault()
    if (typeof nmsce.startX === "undefined")
        return

    let cid = $(e.currentTarget).get(0)
    let canvasOffset = cid.getBoundingClientRect()
    let offsetX = canvasOffset.left
    let offsetY = canvasOffset.top
    let mouseX = parseInt(e.clientX - offsetX)
    let mouseY = parseInt(e.clientY - offsetY)

    let dx = mouseX - nmsce.startX
    let dy = mouseY - nmsce.startY
    nmsce.startX = mouseX
    nmsce.startY = mouseY

    let keys = Object.keys(nmsce.imageText)
    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.sel) {
            text.x += dx
            text.y += dy
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.deleteEntry = function (entry) {
    let ref = bhs.fs.doc("nmsce/" + entry.galaxy + "/" + entry.type + "/" + entry.id)

    ref.delete().then(() => {
        bhs.status(entry.addr + " deleted.")

        let ref = bhs.fbstorage.ref().child(originalPath + entry.Photo)
        ref.delete()

        ref = bhs.fbstorage.ref().child(displayPath + entry.Photo)
        if (entry.Photo.location("_r.jpg") === -1)
            ref.delete()

        ref = bhs.fbstorage.ref().child(thumbnailPath + entry.Photo)
        ref.delete()
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
        console.log(err)
    })
}

NMSCE.prototype.updateEntry = function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()

    if (typeof entry.clickcount === "undefined")
        entry.clickcount = 0

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    ref = ref.doc(entry.id)

    ref.set(entry).then(() => {
        bhs.status(entry.addr + " saved.")
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
        console.log(err)
    })
}

NMSCE.prototype.getEntries = async function (user, displayFcn, singleDispFcn) {
    nmsce.entries = {}

    for (let t of objectList) {
        let type = t.name
        nmsce.entries[type] = []

        let ref = bhs.fs.collection("nmsce/" + user.galaxy + "/" + type)
        ref = ref.where("uid", "==", user.uid)
        ref = ref.orderBy("modded", "desc")

        let snapshot = await ref.get()
        for (let e of snapshot.docs)
            nmsce.entries[type].push(e.data())

        if (typeof singleDispFcn === "function") {
            ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()))
            bhs.subscribe("nmsceentries-" + type, ref, singleDispFcn)
        }
    }

    if (typeof displayFcn === "function")
        displayFcn(nmsce.entries)
}

NMSCE.prototype.getLatest = async function (fcn) {
    let d = new Date();
    d.setDate(d.getDate() - $("#displaysince").val())
    d = firebase.firestore.Timestamp.fromDate(d)

    nmsce.clearResults()

    let ref = bhs.fs.collection("nmsce")
    ref.get().then(snapshot => {
        for (let doc of snapshot.docs)
            for (let t of objectList) {
                let type = t.name

                ref = doc.ref.collection(type)
                ref = ref.where("created", ">=", d)

                ref.get().then(snapshot => {
                    for (let doc of snapshot.docs)
                        fcn(doc.data(), doc.ref.path)
                })

                ref = doc.ref.collection(type)
                ref = ref.where("created", ">=", firebase.firestore.Timestamp.fromDate(new Date()))
                bhs.subscribe("nmsce-latest-" + ref.path, ref, fcn)
            }
    })
}

NMSCE.prototype.clearResults = function () {
    $("#latestEntries").empty()
}

NMSCE.prototype.displayResults = function (e, path) {
    const img = `
        <div class="cover-item bkg-white">
            <img src="url" data-path="dbpath" onclick="nmsce.displaySel(this)"/>
            <div class="row">
                <div class="col-7 txt-inp-def text-center h4">galaxy</div>
                <div class="col-7 txt-inp-def text-center h4">by</div>
            </div>
        </div>`

    let ref = bhs.fbstorage.ref().child(thumbnailPath + e.Photo)
    ref.getDownloadURL().then(url => {
        let h = /url/ [Symbol.replace](img, url)
        h = /dbpath/ [Symbol.replace](h, path)
        h = /galaxy/ [Symbol.replace](h, e.galaxy)
        h = /by/ [Symbol.replace](h, e._name)

        $("#latestEntries").append(h)
    })
}

NMSCE.prototype.displaySel = async function (evt) {
    let row = `
        <div id="id-idname" class="row border-bottom txt-inp-def h4">
            <div class="col-5 ">title</div>
            <div id="val-idname" class="col font clr-def">value</div>
        </div>`

    let loc = $("#imageinfo")
    loc.show()

    let data = $(evt).data()
    let ref = bhs.fs.doc(data.path)
    let doc = await ref.get()

    if (doc.exists) {
        let e = doc.data()

        if (typeof e.clickcount === "undefined")
            e.clickcount = 0

        e.clickcount++
        doc.ref.set(e).then(() => {
            console.log("count")
        }).catch(err => {
            console.log(JSON.stringify(err))
        })

        let idx = getIndex(objectList, "name", e.type)
        let obj = objectList[idx]

        let ref = bhs.fbstorage.ref().child(displayPath + e.Photo)
        ref.getDownloadURL().then(url => {
            $("#dispimage").attr("src", url)
        })

        loc = loc.find("#imagedata")
        loc.empty()

        for (let fld of obj.imgText) {
            let h = /idname/g [Symbol.replace](row, fld.name.nameToId())
            h = /title/ [Symbol.replace](h, fld.name)
            h = /value/ [Symbol.replace](h, fld.name === "Glyphs" ? addrToGlyph(e[fld.field], e.Planet_Index) : e[fld.field])
            h = /font/ [Symbol.replace](h, fld.font ? fld.font : "")
            loc.append(h)
        }

        for (let fld of obj.fields) {
            if (fld.imgText) {
                let id = fld.name.nameToId()
                let h = /idname/g [Symbol.replace](row, id)
                h = /title/ [Symbol.replace](h, fld.name)
                h = /value/ [Symbol.replace](h, e[id])
                h = /font/ [Symbol.replace](h, "")
                loc.append(h)
            }

            if (fld.type === "sublist") {
                for (let sub of fld.sublist) {
                    if (sub.imgText) {
                        let id = sub.name.nameToId()
                        let h = /idname/g [Symbol.replace](row, id)
                        h = /title/ [Symbol.replace](h, sub.name)
                        h = /value/ [Symbol.replace](h, e[id])
                        h = /font/ [Symbol.replace](h, "")
                        loc.append(h)
                    }
                }
            }
        }
    }
}

NMSCE.prototype.displayList = function (entries, path) {
    const card = `
        <div class="container-flex h5">
            <div id="ttl-idname" class="card-header bkg-def txt-def" onclick="nmsce.showSub('#sub-idname')">
                <div class="row">
                    <div id="id-idname" class="col-3">title</div>
                    <div class="col-3">Total: total</div>
                </div>
            </div>
            <div id="sub-idname" class="container-flex h6 hidden">
                <div id="list-idname" class="scrollbar row" style="overflow-y: scroll; height: 550px">`
    const row = `     
                     <div id="row-idname" class="col-md-p250 col-sm-p333 col-7 border border-black format" onclick="nmsce.selectList(this)">
                        <div id="id-Photo" class="row">
                            <img id="img-pic" class="img-fluid" crossorigin="anonymous">
                        </div>
                        <div class="row">`
    const itm = `           <div id="id-idname" class="col-md-7 col-14 border">title</div>`
    const end = `</div>`

    let h = ""

    let e = entries

    if (path) {
        nmsce.entries[entries.type].push(entries)
        entries = {}
        entries[e.type] = []
        entries[e.type].push(e)
    }

    for (let obj of objectList) {
        if (typeof entries[obj.name.nameToId()] === "undefined")
            continue

        if (path && e.type != obj.name.nameToId())
            continue

        if (!path) {
            let l = /idname/g [Symbol.replace](card, obj.name.nameToId())
            if (fnmsce)
                l = /hidden/ [Symbol.replace](l, "")
            l = /title/ [Symbol.replace](l, obj.name)
            h += /total/ [Symbol.replace](l, entries[obj.name.nameToId()].length)

            l = /format/ [Symbol.replace](row, "txt-def bkg-def")
            h += l

            if (fnmsce) {
                l = /idname/g [Symbol.replace](itm, "Player")
                h += /title/ [Symbol.replace](l, "Player")
                l = /idname/g [Symbol.replace](itm, "Coords")
                h += /title/ [Symbol.replace](l, "Glyphs")
                l = /idname/g [Symbol.replace](itm, "Economy")
                h += /title/ [Symbol.replace](l, "Economy")
            } else {
                l = /idname/g [Symbol.replace](itm, "Coords")
                h += /title/ [Symbol.replace](l, "Coordinates")
            }

            for (let f of obj.fields) {
                if (f.type !== "img" && f.type !== "map") {
                    let l = /idname/g [Symbol.replace](itm, f.name.nameToId())
                    h += /title/ [Symbol.replace](l, f.name)

                    if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            if (s.type !== "img" && s.type !== "map") {
                                let l = /idname/g [Symbol.replace](itm, s.name.nameToId())
                                h += /title/ [Symbol.replace](l, s.name)
                            }
                        }
                }
            }

            h += end + end
        }

        for (let e of entries[obj.name.nameToId()]) {
            let l = /idname/ [Symbol.replace](row, e.id)
            h += l

            if (fnmsce) {
                l = /idname/g [Symbol.replace](itm, "Player")
                h += /title/ [Symbol.replace](l, e._name)
                l = /idname/g [Symbol.replace](itm, "Coords")
                l = /border/ [Symbol.replace](l, "border glyph")
                h += /title/ [Symbol.replace](l, addrToGlyph(e.addr, e["Planet-Index"]))
                l = /idname/g [Symbol.replace](itm, "Economy")
                h += /title/ [Symbol.replace](l, e.econ)
            } else {
                l = /idname/g [Symbol.replace](itm, "Coords")
                h += /title/ [Symbol.replace](l, e.addr)
            }

            for (let f of obj.fields) {
                if (f.type !== "img" && f.type !== "map") {
                    let l = /idname/g [Symbol.replace](itm, f.name.nameToId())
                    if (typeof e[f.name.nameToId()] !== "undefined") {
                        h += /title/ [Symbol.replace](l, e[f.name.nameToId()])
                    } else
                        h += /title/ [Symbol.replace](l, "")

                    if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            if (s.type !== "img" && s.type !== "map") {
                                let l = /idname/g [Symbol.replace](itm, s.name.nameToId())
                                if (typeof e[s.name.nameToId()] !== "undefined")
                                    h += /title/ [Symbol.replace](l, e[s.name.nameToId()])
                                else
                                    h += /title/ [Symbol.replace](l, "")
                            }
                        }
                }
            }

            h += end + end
        }

        if (!path)
            h += end + end + end
    }

    let loc = $("#id-table")

    if (path) {
        let rloc = loc.find("#list-" + e.type + " #row-" + e.id)
        if (rloc.length === 1)
            rloc.replaceWith(h)
        else {
            rloc = loc.find("#list-" + e.type + " #row-idname")
            rloc.after(h)
        }

        rloc = loc.find("#list-" + e.type + " #row-" + e.id)

        if (typeof nmsce.saved !== "undefined") {
            let url = URL.createObjectURL(nmsce.saved)
            rloc.find("#img-pic").attr("src", url)
        }
    } else {
        loc.append(h)

        for (let obj of objectList) {
            if (typeof entries[obj.name.nameToId()] === "undefined")
                continue

            for (let e of entries[obj.name.nameToId()]) {
                let eloc = loc.find("#row-" + e.id)
                for (let f of obj.fields) {
                    if (f.type === "img") {
                        let ref = bhs.fbstorage.ref().child(thumbnailPath + e[f.name])
                        ref.getDownloadURL().then(url => {
                            eloc.find("#img-pic").attr("src", url)
                        })
                    } else if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            if (s.type === "img") {
                                let ref = bhs.fbstorage.ref().child(thumbnailPath + e[s.name])
                                ref.getDownloadURL().then(url => {
                                    eloc.find("#img-pic").attr("src", url)
                                })
                            }
                        }
                }
            }
        }
    }

    $("#row-idname [id|='id']").click(function () {
        let id = $(this).prop("id")
        let loc = $(this).closest("[id|='list']")
        let list = loc.children()
        list.sort((a, b) => {
            if ($(a).prop("id") === "row-idname") return -1
            if ($(b).prop("id") === "row-idname") return 1

            let av = $(a).find("#" + id).text().stripMarginWS().toLowerCase()
            let bv = $(b).find("#" + id).text().stripMarginWS().toLowerCase()

            return av > bv ? 1 : av < bv ? -1 : 0
        })
        loc.empty()
        loc.append(list)
    })
}

NMSCE.prototype.showSub = function (id) {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
    loc.find(id).show()
}

NMSCE.prototype.selectList = function (evt) {
    if ($(evt).prop("id") === "row-idname")
        return

    let src = $(evt).find("#img-pic")

    if (fnmsce) {
        nmsce.buildModal(evt)

        let loc = $('#modal')
        loc.modal("show")

        let width = loc.width()

        loc.find("#img-pic").css("width", width + "px")
        loc.find("#img-pic").attr("src", src.attr("src"))
    } else {
        let type = $(evt).closest("[id|='sub']").prop("id").stripID()
        let id = $(evt).prop("id").stripID()
        let i = getIndex(nmsce.entries[type], "id", id)
        let e = nmsce.entries[type][i]

        nmsce.last = e
        nmsce.displaySingle(e)

        nmsce.loadScreenshot(null, e.Photo)

        $("#delete").removeClass("disabled")
        $("#delete").removeAttr("disabled")

        $("#reddit").removeClass("disabled")
        $("#reddit").removeAttr("disabled")
    }
}

NMSCE.prototype.buildModal = function (evt) {
    const row = `  
        <div id="id-Photo" class="row">
            <img id="img-pic" class="img-fluid" />
        </div>
        <div class="row">`
    const itm = `   <div id="id-idname" class="col-7">tname: title</div>`
    const glyph = ` <div id="id-idname" class="col-7">tname: <span id="coords" class="glyph">title</span></div>`
    const end = `</div>`

    let loc = $(evt).closest("[id|='sub']")
    let title = loc.prop("id").stripID().idToName()

    loc = $("#modal")
    loc.find(".modal-title").text(title)

    loc = loc.find(".modal-body")

    let h = row

    let items = $(evt).find("[id|='id']")
    for (let i of items) {
        let id = $(i).prop("id").stripID()
        if (id !== "Photo") {
            let t = $(i).text()
            if (t) {
                let l = /idname/ [Symbol.replace](id === "Coords" ? glyph : itm, id)
                l = /tname/ [Symbol.replace](l, id.idToName())
                h += /title/ [Symbol.replace](l, t)
            }
        }
    }

    loc.html(h + end)
}

NMSCE.prototype.newDARC = function (evt) {
    let addr = $(evt).text()

    if (typeof (Storage) !== "undefined")
        window.localStorage.setItem('nmsceaddr', addr)

    var win = window.open('darc.html', '_blank');
    if (win) {
        win.focus();
    } else {
        alert('Please allow popups for this website');
    }
}

const explorerBodiesMap = `
    <div id="map-explorer">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/explorer/bodies/bodies.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/explorer/bodies/blank.png" style="position:absolute" usemap="#explorer-map" />

        <map name="explorer-map" id="map-areas">
            <area alt="h3" data-group=1 coords="0,1,0,125,112,129,104,60" shape="poly">
            <area alt="h4" data-group=1 coords="10,2,120,64,223,65,214,5" shape="poly">
            <area alt="h5" coords="264,4,243,67,268,101,329,101,342,64,326,4" shape="poly">
            <area alt="h6" coords="114,67,122,114,155,113,177,67" shape="poly">
            <area alt="h7" coords="184,71,157,115,169,124,196,125,219,71" shape="poly">
            <area alt="h8" coords="224,69,203,115,232,137,257,122,259,95,238,68" shape="poly">
            <area alt="h9" data-group=2 coords="272,105,272,122,336,151,336,102" shape="poly">
            <area alt="h10" data-group=2 coords="0,128,0,165,86,167,84,130" shape="poly">
            <area alt="h11" data-group=2 data-group=2 coords="88,130,87,162,162,163,162,129,121,131" shape="poly">
            <area alt="h12" coords="169,130,169,171,215,177,228,143,207,127" shape="poly">
            <area alt="h13" coords="232,142,226,170,243,188,266,198,286,189,298,178,329,175,330,157,300,137,267,123" shape="poly">
            <area alt="h14" coords="1,171,1,281,54,281,52,171" shape="poly">
            <area alt="h15" coords="57,174,56,215,113,215,166,207,166,174" shape="poly">
            <area alt="h16" coords="199,187,182,213,194,247,218,262,248,255,268,245,279,222,280,202,258,202,221,180" shape="poly">
            <area alt="h17" coords="283,196,268,375,306,377,306,191" shape="poly">
            <area alt="h18" coords="314,185,310,373,342,378,346,170" shape="poly">
            <area alt="h19" coords="60,235,62,289,110,289,104,258,103,222" shape="poly">
            <area alt="h20" coords="122,221,109,245,111,271,126,284,147,293,175,285,189,255,179,225,154,212" shape="poly">
            <area alt="h21" coords="14,287,3,356,91,356,87,301" shape="poly">
            <area alt="h22" coords="92,295,95,345,184,341,186,295,123,295" shape="poly">
            <area alt="h23" coords="189,277,188,302,203,321,191,342,160,348,157,375,254,372,267,326,216,270" shape="poly">
            <area alt="h24" coords="4,361,0,405,92,408,91,361" shape="poly">
            <area alt="h25" coords="95,352,95,415,132,414,133,353" shape="poly">
            <area alt="h26" coords="4,419,2,444,171,447,166,419" shape="poly">
            <area alt="h27" coords="138,383,135,407,168,416,208,442,256,444,250,402" shape="poly">
            <area alt="h28" coords="255,385,260,442,299,443,295,385" shape="poly">
            <area alt="h29" coords="308,385,307,444,338,437,338,385" shape="poly">
        </map>
    </div>`

const fighterBodiesMap = `
    <div id="map-fighter-bodies">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/fighter/bodies/bodies.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/fighter/bodies/blank.png" style="position:absolute" usemap="#fighter-bodies-map" />

        <map name="fighter-bodies-map" id="map-areas">
            <area alt="h2" data-group=1 coords="85,4,107,62,140,68,158,47,137,17" shape="poly">
            <area alt="h3" data-group=1 coords="3,34,25,81,114,101,115,76,63,44" shape="poly">
            <area alt="h5" data-group=1 coords="6,89,10,143,124,176,131,153,32,89" shape="poly">
            <area alt="h7" data-group=1 coords="0,153,4,212,151,255,153,226,37,160" shape="poly">
            <area alt="h9" data-group=1 coords="13,226,7,243,39,291,219,335,221,314,53,235" shape="poly">
            <area alt="h10" data-group=1 coords="6,295,4,363,236,397,255,379,47,300" shape="poly">
            <area alt="h4" data-group=1 coords="189,4,163,19,197,77,304,98,339,65" shape="poly">
            <area alt="h8" data-group=1 coords="176,69,156,81,173,131,290,174,326,155,300,117,213,89" shape="poly">
            <area alt="h6" data-group=1 coords="177,141,155,155,172,209,221,221,314,218,316,186" shape="poly">
            <area alt="h11" data-group=2 coords="219,235,205,248,207,293,234,305,263,289,267,247" shape="poly">
            <area alt="h12" data-group=2 coords="289,234,269,306,340,308,328,238" shape="poly">
            <area alt="h13" data-group=2 coords="278,318,276,378,336,379,340,322" shape="poly">
        </map>
    </div>`

const fighterWingsMap = `
    <div id="map-fighter-wings">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/fighter/wings/wings.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/fighter/wings/blank.png" style="position:absolute" usemap="#fighter-wings-map" />

        <map name="fighter-wings-map" id="map-areas">
            <area alt="h2" coords="1,1,9,203,46,189,50,5" shape="poly">
            <area alt="h11" data-group=3 coords="60,11,65,42,156,44,160,21" shape="poly">
            <area alt="h27" data-group=3 coords="179,10,184,54,212,57,216,9" shape="poly">
            <area alt="h25" data-group=3 coords="226,8,223,52,257,55,262,13" shape="poly">
            <area alt="h26" data-group=3 coords="273,7,266,25,273,51,301,51,312,19" shape="poly">
            <area alt="h7" data-group=4 data-group=4 coords="59,52,49,116,59,164,84,168,99,122,84,55" shape="poly">
            <area alt="h8" data-group=4 coords="99,55,102,89,134,97,205,91,209,66,145,48" shape="poly">
            <area alt="h9" data-group=4 coords="218,61,221,91,313,93,332,108,337,79,344,9,322,26,303,63" shape="poly">
            <area alt="h12" coords="97,160,123,172,146,151,161,107,133,102" shape="poly">
            <area alt="h10" data-group=4 coords="210,99,219,134,329,130,327,110" shape="poly">
            <area alt="h13" coords="2,212,5,252,37,262,106,261,107,197,53,191" shape="poly">
            <area alt="h14" coords="111,180,121,206,198,158,189,146" shape="poly">
            <area alt="h15" coords="127,207,127,216,210,223,202,207" shape="poly">
            <area alt="h16" coords="122,221,117,234,125,253,211,247,212,233" shape="poly">
            <area alt="h17" data-group=4 coords="189,131,211,159,206,173,171,181,173,195,211,201,217,210,241,203,235,182,297,174,280,157" shape="poly">
            <area alt="h18" data-group=4 coords="272,141,316,192,291,199,311,245,342,224,346,187,297,139" shape="poly">
            <area alt="h19" data-group=4 coords="214,256,221,266,312,265,314,252,277,220,280,187,268,187" shape="poly">
            <area alt="h20" data-group=4 coords="1,275,3,386,100,388,102,274" shape="poly">
            <area alt="h21" data-group=4 coords="121,268,113,320,129,386,182,392,226,359,224,290,180,257" shape="poly">
            <area alt="h28" data-group=4 coords="227,273,231,292,272,350,285,333,253,272" shape="poly">
            <area alt="h4" data-group=4 coords="273,272,287,295,345,289,329,274" shape="poly">
            <area alt="h5" data-group=4 coords="284,310,291,322,340,311,338,294" shape="poly">
            <area alt="h6" data-group=4 coords="238,346,237,389,288,388,333,364,327,339,281,357" shape="poly">
        </map>
    </div>`

const haulerBodiesMap = `
    <div id="map-hauler-bodies">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/hauler/bodies/bodies.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/hauler/bodies/blank.png" style="position:absolute" usemap="#hauler-bodies-map" />
            
        <map name="hauler-bodies-map" id="map-areas">
            <area alt="h2" data-group=1 coords="8,23,7,89,111,90,107,61,118,47,110,5" shape="poly">
            <area alt="h3" data-group=1 coords="121,6,119,48,113,67,215,99,229,41,201,7" shape="poly">
            <area alt="h4" data-group=2 coords="221,22,241,55,242,84,270,88,347,40,343,1,240,8" shape="poly">
            <area alt="h5" data-group=1 coords="3,93,3,155,92,154,91,94" shape="poly">
            <area alt="h6" data-group=1 coords="97,92,99,147,179,154,200,100,147,86" shape="poly">
            <area alt="h7" data-group=1 coords="203,104,184,151,283,157,271,92,232,94" shape="poly">
            <area alt="h8" data-group=2 coords="277,87,286,154,311,159,349,124,348,93,324,77" shape="poly">
            <area alt="h9" data-group=1 coords="2,161,-1,229,136,230,137,159" shape="poly">
            <area alt="h10" data-group=4 coords="143,158,143,225,212,227,211,161" shape="poly">
            <area alt="h11" data-group=4 coords="216,159,218,238,275,238,274,161" shape="poly">
            <area alt="h12" data-group=4 coords="281,163,278,213,289,233,320,234,333,216,332,163" shape="poly">
            <area alt="h13" data-group=3 coords="0,239,0,376,139,378,137,239" shape="poly">
            <area alt="h14" data-group=3 coords="139,237,143,378,222,375,221,240" shape="poly">
            <area alt="h15" data-group=3 coords="229,242,228,371,306,377,310,240" shape="poly">
            <area alt="h16" data-group=3 coords="313,257,313,333,349,336,349,255" shape="poly">
        </map>
    </div>`

const haulerWingsMap = `
    <div id="map-hauler-wings">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/hauler/wings/wings.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/hauler/wings/blank.png" style="position:absolute" usemap="#hauler-wings-map" />
            
        <map name="hauler-wings-map" id="map-areas">
            <area alt="h2" coords="0,3,2,133,86,107,86,8" shape="poly">
            <area alt="h3" coords="97,1,91,118,118,120,160,90,174,36,156,6" shape="poly">
            <area alt="h4" coords="204,9,202,49,269,55,264,99,345,106,345,1" shape="poly">
            <area alt="h5" coords="127,123,144,167,184,134,222,109,261,102,258,70,206,53,173,75,164,95" shape="poly">
            <area alt="h6" coords="1,141,4,232,43,226,88,190,110,144,106,123" shape="poly">
            <area alt="h7" coords="99,179,71,246,83,261,205,251,225,234,212,191" shape="poly">
            <area alt="h8" coords="201,128,235,230,207,281,215,295,239,288,273,239,277,189,240,118" shape="poly">
            <area alt="h9" coords="259,114,263,138,295,152,291,241,266,261,265,292,341,267,338,121" shape="poly">
            <area alt="h10" coords="11,235,11,310,65,310,66,237" shape="poly">
            <area alt="h11" coords="88,270,94,308,196,306,195,257" shape="poly">
            <area alt="h12" data-group=5 coords="9,319,9,389,75,390,80,318" shape="poly">
            <area alt="h13" data-group=5 coords="90,315,88,388,163,391,163,313" shape="poly">
            <area alt="h14" data-group=5 coords="167,314,169,395,227,394,226,310" shape="poly">
            <area alt="h15" data-group=5 coords="235,310,235,395,297,397,292,310" shape="poly">
            <area alt="h16" coords="303,286,298,371,305,397,349,399,349,278" shape="poly">
        </map>
    </div>`

const shuttleBodiesMap = `
    <div id="map-shuttle-bodies">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/shuttle/bodies/bodies.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/shuttle/bodies/blank.png" style="position:absolute" usemap="#shuttle-bodies-map" />
            
        <map name="shuttle-bodies-map" id="map-areas">
            <area alt="h2" coords="6,3,3,45,87,45,96,31,93,-1" shape="poly">
            <area alt="h3" coords="97,1,97,50,186,53,188,5" shape="poly">
            <area alt="h4" coords="189,2,192,51,319,74,348,55,345,2" shape="poly">
            <area alt="h5" coords="6,66,4,131,57,129,69,101,42,66" shape="poly">
            <area alt="h6" coords="70,46,60,77,76,103,94,89,125,89,137,73,133,59,96,55" shape="poly">
            <area alt="h8" coords="188,63,197,148,348,139,343,81,265,68" shape="poly">
            <area alt="h7" coords="106,99,116,133,183,151,190,116,180,71" shape="poly">
            <area alt="h9" coords="3,135,5,193,69,186,145,172,137,141" shape="poly">
            <area alt="h10" coords="58,191,57,225,199,227,195,168" shape="poly">
            <area alt="h11" coords="201,152,201,219,281,207,343,207,341,150" shape="poly">
            <area alt="h12" coords="5,235,5,282,133,276,137,236" shape="poly">
            <area alt="h13" coords="150,231,149,267,198,285,244,267,243,228" shape="poly">
            <area alt="h14" coords="258,215,254,273,342,276,337,212" shape="poly">
            <area alt="h15" coords="6,289,5,346,174,344,179,286,100,282" shape="poly">
            <area alt="h16" coords="185,287,185,340,245,343,248,284" shape="poly">
            <area alt="h17" coords="266,278,265,342,337,342,340,282" shape="poly">
        </map>
    </div>`

const shuttleWingsMap = `
    <div id="map-shuttle-wings">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/shuttle/wings/wings.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/shuttle/wings/blank.png" style="position:absolute" usemap="#shuttle-wings-map" />
            
        <map name="shuttle-wings-map" id="map-areas">
            <area alt="h2" coords="1,2,1,66,56,66,55,5" shape="poly">
            <area alt="h3" coords="62,19,59,71,74,90,117,75,101,36" shape="poly">
            <area alt="h4" coords="105,3,117,41,213,43,205,3" shape="poly">
            <area alt="h5" coords="280,4,277,28,291,57,326,57,344,35,337,3" shape="poly">
            <area alt="h6" coords="6,74,2,134,66,134,68,99,46,70" shape="poly">
            <area alt="h7" coords="79,96,72,129,135,130,128,87,106,82" shape="poly">
            <area alt="h8" coords="137,45,128,80,223,79,215,47" shape="poly">
            <area alt="h9" coords="163,81,135,120,191,146,219,98" shape="poly">
            <area alt="h10" coords="228,46,225,132,269,107,294,64,275,37" shape="poly">
            <area alt="h11" coords="345,48,294,80,294,127,334,125,345,66" shape="poly">
            <area alt="h12" coords="4,140,4,177,169,182,162,140" shape="poly">
            <area alt="h13" coords="187,153,175,170,205,178,251,155,245,133,208,135" shape="poly">
            <area alt="h14" coords="266,128,249,171,289,181,307,136" shape="poly">
            <area alt="h15" coords="317,132,298,200,348,197,347,129" shape="poly">
            <area alt="h16" coords="4,184,2,232,169,215,171,192" shape="poly">
            <area alt="h17" coords="226,173,181,229,198,244,268,210,261,184,261,183" shape="poly">
            <area alt="h18" coords="278,208,241,233,255,278,349,277,348,204" shape="poly">
            <area alt="h19" coords="1,241,1,279,173,280,163,232" shape="poly">
            <area alt="h20" coords="4,285,1,338,161,342,168,282,99,290" shape="poly">
            <area alt="h21" coords="185,266,185,339,259,337,328,324,325,285,241,280,230,265" shape="poly">
        </map>
    </div>`

const exoticBodiesMap = `
    <div id="map-exotic-bodies">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/exotic/bodies/bodies.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/exotic/bodies/blank.png" style="position:absolute" usemap="#exotic-bodies-map" />
            
        <map name="exotic-bodies-map" id="map-areas">
            <area alt="h2" data-group=1 coords="6,3,6,76,129,79,233,66,225,12,93,-1" shape="poly">
            <area alt="h3" data-group=2 coords="270,230,345,198,340,19,263,2,286,96" shape="poly">
            <area alt="h4" data-group=1 coords="25,81,32,161,81,179,157,180,139,82" shape="poly">
            <area alt="h5" data-group=4 coords="148,79,175,235,251,236,281,97,224,77" shape="poly">
            <area alt="h6" data-group=4 coords="11,169,6,239,47,241,116,213,113,195,51,175" shape="poly">
            <area alt="h7" data-group=2 coords="63,242,130,212,128,301,70,294,51,289" shape="poly">
            <area alt="h8" data-group=3 coords="132,237,132,302,344,298" shape="poly">
            <area alt="h9" data-group=3 coords="221,259,343,283,335,213" shape="poly">
            <area alt="h10" data-group=4 coords="14,314,13,366,88,388,74,299" shape="poly">
            <area alt="h11" data-group=5 coords="104,310,108,385,160,390,155,311" shape="poly">
            <area alt="h12" data-group=5 coords="167,334,165,363,275,395,271,341" shape="poly">
            <area alt="h13" data-group=5 coords="203,309,346,307,339,388,305,389,279,339,212,322" shape="poly">
        </map>
    </div>`

const freighterCapitalMap = `
    <div id="map-freighter-capital">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/freighter/capital/capital.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/freighter/capital/blank.png" style="position:absolute" usemap="#freighter-capital-map" />
            
        <map name="freighter-capital-map" id="map-areas">
            <area alt="h2" data-group=1 coords="12,-1,14,49,323,58,313,6" shape="poly">
            <area alt="h3" data-group=1 coords="95,57,96,97,330,127,324,63" shape="poly">
            <area alt="h4" data-group=1 coords="61,68,2,108,9,145,184,151,190,117,89,100" shape="poly">
            <area alt="h5" data-group=1 coords="14,173,9,303,276,202,297,171,280,125,238,147" shape="poly">
            <area alt="h6" data-group=1 coords="154,255,160,362,333,244,317,182,286,202" shape="poly">
            <area alt="h7" data-group=2 coords="48,299,125,336" shape="rect">
            <area alt="h8" data-group=2 coords="49,341,130,381" shape="rect">
            <area alt="h9" data-group=1 coords="216,332,222,395,340,335,339,253" shape="poly">
        </map>
    </div>`

const freighterCommonMap = `
    <div id="map-freighter-common">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/freighter/common/common.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/freighter/common/blank.png" style="position:absolute" usemap="#freighter-common-map" />
            
        <map name="freighter-common-map" id="map-areas">
            <!--area alt="h2" data-group=1 coords="94,6,102,45,194,53,338,46,340,-1" shape="poly"-->
            <area alt="h3" data-group=1 coords="4,19,9,86,171,86,190,62,98,48" shape="poly">
            <area alt="h4" data-group=1 coords="13,94,8,162,160,166,158,110,115,92" shape="poly">
            <area alt="h5" data-group=1 coords="160,93,197,133,332,127,316,56,217,67" shape="poly">
            <area alt="h6" data-group=1 coords="18,164,10,218,138,227,166,204,153,168" shape="poly">
            <area alt="h7" data-group=1 coords="174,136,172,196,345,201,342,136" shape="poly">
            <area alt="h8" data-group=1 coords="10,222,7,333,175,279,152,233" shape="poly">
            <area alt="h9" data-group=1 coords="184,205,194,279,331,253,333,208" shape="poly">
            <area alt="h10" data-group=1 coords="14,340,10,395,171,379,195,356,172,286" shape="poly">
            <area alt="h11" data-group=1 coords="188,288,204,365,342,329,342,284,286,277" shape="poly">
        </map>
    </div>`

const shipList = [{
    name: "Fighter",
    slotTtip: `
        T1 - 15-19 slots<br>
        T2 - 20-29 slots<br>
        T3 - 30-38 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
    bodies: fighterBodiesMap,
    wings: fighterWingsMap,
}, {
    name: "Hauler",
    slotTtip: `
        T1 - 25-31 slots<br>
        T2 - 32-39 slots<br>
        T3 - 40-48 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
    bodies: haulerBodiesMap,
    wings: haulerWingsMap,
}, {
    name: "Shuttle",
    slotList: [{
        name: "Nothing Selected"
    }, {
        name: "T1"
    }, {
        name: "T2"
    }],
    slotTtip: `
        T1 - 18-23 slots<br>
        T2 - 19-28 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
    bodies: shuttleBodiesMap,
    wings: shuttleWingsMap,
}, {
    name: "Explorer",
    slotTtip: `
        T1 - 15 - 31 slots <br>
        T2 - 32 - 39 slots <br>
        T3 - 40 - 48 slots <br>`,
    bodies: explorerBodiesMap,
    classTtip: `
        S - 10 - 20 % damage, 55 - 60 % shield, 30 - 35 % hyperdrive <br>
        A - 5 - 10 % damage, 45 - 50 % shield, 15 - 25 % hyperdrive <br>
        B - 0 - 5 % damage, 25 - 35 % shield, 5 - 10 % hyperdrive <br>
        C - 12 - 20 % shield, 0 - 5 % hyperdrive`,
}, {
    name: "Exotic",
    bodies: exoticBodiesMap,
}]

const classList = [{
    name: "Nothing Selected",
}, {
    name: "S",
}, {
    name: "A",
}, {
    name: "B",
}, {
    name: "C",
}]

const slotList = [{
    name: "Nothing Selected",
}, {
    name: "T1",
}, {
    name: "T2",
}, {
    name: "T3",
}, ]

const mtList = [{
    name: "Nothing Selected"
}, {
    name: "Alien",
}, {
    name: "Experimental",
}, {
    name: "Pistol",
}, {
    name: "Rifle",
}, ]

const sentinelList = [{
    name: "Nothing Selected"
}, {
    name: "Low"
}, {
    name: "High"
}, {
    name: "Aggressive"
}]

const baseList = [{
    name: "Nothing Selected"
}, {
    name: "Race Track"
}, {
    name: "Maze"
}, {
    name: "Farm"
}, {
    name: "Maze"
}, {
    name: "Low Orbit"
}, {
    name: "Under Water"
}, {
    name: "Large"
}, {
    name: "Civ Capital"
}, {
    name: "Civ Hub"
}, ]

const faunaList = [{
    name: "Nothing Selected"
}, {
    name: "Anastomus - Striders"
}, {
    name: "Anomalous"
}, {
    name: "Bos - Spiders"
}, {
    name: "Conokinis - Beetle"
}, {
    name: "Felidae - Cat"
}, {
    name: "Felihex - Hexapodal cat"
}, {
    name: "Hexungulatis - Hexapodal cow"
}, {
    name: "Lok - Blobs, rare"
}, {
    name: "Mogara - Grunts, bipedal species"
}, {
    name: "Procavya - Rodents"
}, {
    name: "Rangifae - Diplos"
}, {
    name: "Reococcyx - Bipedal antelopes"
}, {
    name: "Tetraceris - Antelopes"
}, {
    name: "Theroma - Triceratops"
}, {
    name: "Tyranocae - Tyrannosaurus rex-like"
}, {
    name: "Ungulatis - Cow"
}, {
    name: "Ictaloris - Fish"
}, {
    name: "Prionace - Sharks"
}, {
    name: "Prionacefda - Swimming cows"
}, {
    name: "Unknown - Swimming rodents"
}, {
    name: "Agnelis - Birds"
}, {
    name: "Cycromys - Flying Lizard"
}, {
    name: "Oxyacta - Wraiths / flying snake"
}, {
    name: "Rhopalocera - Butterflies"
}]

const faunaProductKilled = [{
    name: "Nothing Selected"
}, {
    name: "Diplo Chunks"
}, {
    name: "Feline Liver"
}, {
    name: "Fiendish Roe"
}, {
    name: "Leg Meat"
}, {
    name: "Leopard-Fruit"
}, {
    name: "Meaty Chunks"
}, {
    name: "Meaty Wings"
}, {
    name: "Offal Sac"
}, {
    name: "Raw Steak"
}, {
    name: "Regis Grease"
}, {
    name: "Salty Fingers"
}, {
    name: "Scaly Meat"
}, {
    name: "Strider Sausage"
}]

const faunaProductTamed = [{
    name: "Nothing Selected"
}, {
    name: "Crab 'Apple'"
}, {
    name: "Creature Egg"
}, {
    name: "Fresh Milk"
}, {
    name: "Giant Egg"
}, {
    name: "Tall Eggs"
}, {
    name: "Warm Proto-Milk"
}, {
    name: "Wild Milk"
}]

const resList = [{
    name: "Ammonia",
}, {
    name: "Cadmium",
}, {
    name: "Cobalt",
}, {
    name: "Copper",
}, {
    name: "Dioxite",
}, {
    name: "Emeril",
}, {
    name: "Gold",
}, {
    name: "Indium",
}, {
    name: "Magnetized Ferrite",
}, {
    name: "Paraffinum",
}, {
    name: "Phosphorus",
}, {
    name: "Pyrite",
}, {
    name: "Salt",
}, {
    name: "Silver",
}, {
    name: "Uranium",
}, ]

const colorList = [{
    name: "Nothing Selected",
}, {
    name: "Blue",
}, {
    name: "Black",
}, {
    name: "Bronze",
}, {
    name: "Chrome",
}, {
    name: "Gold",
}, {
    name: "Green",
}, {
    name: "Grey",
}, {
    name: "Orange",
}, {
    name: "Pink",
}, {
    name: "Purple",
}, {
    name: "Red",
}, {
    name: "Tan",
}, {
    name: "White",
}, {
    name: "Yellow",
}, ]

const fontList = [{
    name: "Arial",
}, {
    name: "Courier New",
}, {
    name: "Georgia",
}, {
    name: "Times New Roman",
}, {
    name: "Verdana",
}, {
    name: "Open Sans",
}, {
    name: "Roboto",
}, {
    name: "Lato",
}, {
    name: "Helvetica",
}, {
    name: "Calibri",
}, {
    name: "Cambria",
}, {
    name: "Perpetua",
}, {
    name: "Consolas",
}, {
    name: "Tahoma",
}, {
    name: "Century Gothic",
}, {
    name: "Berkshire Swash",
}, {
    name: 'Caveat Brush',
}, ]

const biomeList = [{
    name: 'Lush',
}, {
    name: 'Barren',
}, {
    name: 'Dead',
}, {
    name: 'Exotic',
}, {
    name: 'Mega Exotic',
}, {
    name: 'Scorched',
}, {
    name: 'Frozen',
}, {
    name: 'Toxic',
}, {
    name: 'Irradiated',
}]

const glitchList = [{
    name: "Bubble"
}, {
    name: "Cable Pod"
}, {
    name: "Calcishroom"
}, {
    name: "Capilliary Shell"
}, {
    name: "Electric Cube"
}, {
    name: "Glitching Separator"
}, {
    name: "Hexplate Bush"
}, {
    name: "Light Fissure"
}, {
    name: "Ossified Star"
}, {
    name: "Rattle Spine"
}, {
    name: "Terbium Growth"
}]

const weatherList = [{
    name: "Absent"
}, {
    name: "Acid Rain"
}, {
    name: "Acidic Deluges"
}, {
    name: "Acidic Dust"
}, {
    name: "Acidic Dust Pockets"
}, {
    name: "Airless"
}, {
    name: "Alkaline Cloudbursts"
}, {
    name: "Alkaline Rain"
}, {
    name: "Alkaline Storms"
}, {
    name: "Anomalous"
}, {
    name: "Arid"
}, {
    name: "Atmospheric Corruption"
}, {
    name: "Atmospheric Heat Instabilities"
}, {
    name: "Baked"
}, {
    name: "Balmy"
}, {
    name: "Beautiful"
}, {
    name: "Bilious Storms"
}, {
    name: "Billowing Dust Storms"
}, {
    name: "Blasted Atmosphere"
}, {
    name: "Blazed"
}, {
    name: "Blissful"
}, {
    name: "Blistering Damp"
}, {
    name: "Blistering Floods"
}, {
    name: "Blizzard"
}, {
    name: "Blood Rain"
}, {
    name: "Boiling Monsoons"
}, {
    name: "Boiling Puddles"
}, {
    name: "Boiling Superstorms"
}, {
    name: "Bone-Stripping Acid Storms"
}, {
    name: "Broiling Humidity"
}, {
    name: "Burning"
}, {
    name: "Burning Air"
}, {
    name: "Burning Gas Clouds"
}, {
    name: "Caustic Dust"
}, {
    name: "Caustic Floods"
}, {
    name: "Caustic Moisture"
}, {
    name: "Caustic Winds"
}, {
    name: "Ceaseless Drought"
}, {
    name: "Choking Clouds"
}, {
    name: "Choking Humidity"
}, {
    name: "Choking Sandstorms"
}, {
    name: "Clear"
}, {
    name: "Cold"
}, {
    name: "Combustible Dust"
}, {
    name: "Contaminated"
}, {
    name: "Contaminated Puddles"
}, {
    name: "Contaminated Squalls"
}, {
    name: "Corrosive Cyclones"
}, {
    name: "Corrosive Damp"
}, {
    name: "Corrosive Rainstorms"
}, {
    name: "Corrosive Sleet Storms"
}, {
    name: "Corrosive Storms"
}, {
    name: "Crimson Heat"
}, {
    name: "Crisp"
}, {
    name: "Damp"
}, {
    name: "Dangerously Hot"
}, {
    name: "Dangerously Hot Fog"
}, {
    name: "Dangerously Toxic Rain"
}, {
    name: "Dead Wastes"
}, {
    name: "Deep Freeze"
}, {
    name: "Dehydrated"
}, {
    name: "Deluge"
}, {
    name: "Desolate"
}, {
    name: "Desiccated"
}, {
    name: "Direct Sunlight"
}, {
    name: "Downpours"
}, {
    name: "Drifting Snowstorms"
}, {
    name: "Drizzle"
}, {
    name: "Droughty"
}, {
    name: "Dry Gusts"
}, {
    name: "Dust-Choked Winds"
}, {
    name: "Eerily Calm"
}, {
    name: "Electric Rain"
}, {
    name: "Elevated Radioactivity"
}, {
    name: "Emollient"
}, {
    name: "Energetic Storms"
}, {
    name: "Enormous Nuclear Storms"
}, {
    name: "Extreme Acidity"
}, {
    name: "Extreme Atmospheric Decay"
}, {
    name: "Extreme Cold"
}, {
    name: "Extreme Contamination"
}, {
    name: "Extreme Heat"
}, {
    name: "Extreme Nuclear Decay"
}, {
    name: "Extreme Radioactivity"
}, {
    name: "Extreme Thermonuclear Fog"
}, {
    name: "Extreme Toxicity"
}, {
    name: "Extreme Wind Blasting"
}, {
    name: "Extreme Winds"
}, {
    name: "Fair"
}, {
    name: "Fine"
}, {
    name: "Firestorms"
}, {
    name: "Flaming Hail"
}, {
    name: "Freezing"
}, {
    name: "Freezing Night Winds"
}, {
    name: "Freezing Rain"
}, {
    name: "Frequent Blizzards"
}, {
    name: "Frequent Particle Eruptions"
}, {
    name: "Frequent Toxic Floods"
}, {
    name: "Frigid"
}, {
    name: "Frost"
}, {
    name: "Frozen"
}, {
    name: "Frozen Clouds"
}, {
    name: "Gamma Cyclones"
}, {
    name: "Gamma Dust"
}, {
    name: "Gas Clouds"
}, {
    name: "Gelid"
}, {
    name: "Glacial"
}, {
    name: "Harmful Rain"
}, {
    name: "Harsh Winds"
}, {
    name: "Harsh, Icy Winds"
}, {
    name: "Haunted Frost"
}, {
    name: "Hazardous Temperature Extremes"
}, {
    name: "Hazardous Whiteouts"
}, {
    name: "Heated"
}, {
    name: "Heated Atmosphere"
}, {
    name: "Heavily Toxic Rain"
}, {
    name: "Heavy Rain"
}, {
    name: "Highly Variable Temperatures"
}, {
    name: "Hot"
}, {
    name: "Howling Blizzards"
}, {
    name: "Howling Gales"
}, {
    name: "Humid"
}, {
    name: "Ice Storms"
}, {
    name: "Icebound"
}, {
    name: "Icy"
}, {
    name: "Icy Blasts"
}, {
    name: "Icy Nights"
}, {
    name: "Icy Tempests"
}, {
    name: "Incendiary Dust"
}, {
    name: "Indetectable Burning"
}, {
    name: "Inert"
}, {
    name: "Inferno"
}, {
    name: "Inferno Winds"
}, {
    name: "Infrequent Blizzards"
}, {
    name: "Infrequent Dust Storms"
}, {
    name: "Infrequent Heat Storms"
}, {
    name: "Infrequent Toxic Drizzle"
}, {
    name: "Intense Cold"
}, {
    name: "Intense Dust"
}, {
    name: "Intense Heat"
}, {
    name: "Intense Heatbursts"
}, {
    name: "Intense Rainfall"
}, {
    name: "Intermittent Wind Blasting"
}, {
    name: "Internal Rain"
}, {
    name: "Invisible Mist"
}, {
    name: "Irradiated"
}, {
    name: "Irradiated Downpours"
}, {
    name: "Irradiated Storms"
}, {
    name: "Irradiated Thunderstorms"
}, {
    name: "Irradiated Winds"
}, {
    name: "Lethal Atmosphere"
}, {
    name: "Lethal Humidity Outbreaks"
}, {
    name: "Light Showers"
}, {
    name: "Lost Clouds"
}, {
    name: "Lung-Burning Night Wind"
}, {
    name: "Mellow"
}, {
    name: "Memories of Frost"
}, {
    name: "Migratory Blizzards"
}, {
    name: "Mild"
}, {
    name: "Mild Rain"
}, {
    name: "Moderate"
}, {
    name: "Moistureless"
}, {
    name: "Monsoon"
}, {
    name: "Mostly Calm"
}, {
    name: "No Atmosphere"
}, {
    name: "Noxious Gas Storms"
}, {
    name: "Noxious Gases"
}, {
    name: "Nuclear Emission"
}, {
    name: "Nuclidic Atmosphere"
}, {
    name: "Obsidian Heat"
}, {
    name: "Occasional Acid Storms"
}, {
    name: "Occasional Ash Storms"
}, {
    name: "Occasional Radiation Outbursts"
}, {
    name: "Occasional Sandstorms"
}, {
    name: "Occasional Scalding Cloudbursts"
}, {
    name: "Occasional Snowfall"
}, {
    name: "Outbreaks of Frozen Rain"
}, {
    name: "Overly Warm"
}, {
    name: "Painfully Hot Rain"
}, {
    name: "Parched"
}, {
    name: "Parched Sands"
}, {
    name: "Particulate Winds"
}, {
    name: "Passing Toxic Fronts"
}, {
    name: "Peaceful"
}, {
    name: "Peaceful Climate"
}, {
    name: "Perfectly Clear"
}, {
    name: "Permafrost"
}, {
    name: "Planet-Wide Radiation Storms"
}, {
    name: "Planetwide Desiccation"
}, {
    name: "Pleasant"
}, {
    name: "Poison Flurries"
}, {
    name: "Poison Rain"
}, {
    name: "Poisonous Dust"
}, {
    name: "Poisonous Gas"
}, {
    name: "Pouring Rain"
}, {
    name: "Pouring Toxic Rain"
}, {
    name: "Powder Snow"
}, {
    name: "Radioactive"
}, {
    name: "Radioactive Damp"
}, {
    name: "Radioactive Decay"
}, {
    name: "Radioactive Dust Storms"
}, {
    name: "Radioactive Humidity"
}, {
    name: "Radioactive Storms"
}, {
    name: "Radioactivity"
}, {
    name: "Raging Snowstorms"
}, {
    name: "Rain of Atlas"
}, {
    name: "Rainstorms"
}, {
    name: "Rare Firestorms"
}, {
    name: "Reactive"
}, {
    name: "Reactive Dust"
}, {
    name: "Reactive Rain"
}, {
    name: "REDACTED"
}, {
    name: "Refreshing Breeze"
}, {
    name: "Roaring Ice Storms"
}, {
    name: "Roaring Nuclear Wind"
}, {
    name: "Sand Blizzards"
}, {
    name: "Sandstorms"
}, {
    name: "Scalding Heat"
}, {
    name: "Scaling Rainstorms"
}, {
    name: "Scorched"
}, {
    name: "Self-Igniting Storms"
}, {
    name: "Silent"
}, {
    name: "Smouldering"
}, {
    name: "Snow"
}, {
    name: "Snowfall"
}, {
    name: "Snowstorms"
}, {
    name: "Snowy"
}, {
    name: "Sporadic Grit Storms"
}, {
    name: "Sterile"
}, {
    name: "Stinging Atmosphere"
}, {
    name: "Stinging Puddles"
}, {
    name: "Sunny"
}, {
    name: "Supercooled Storms"
}, {
    name: "Superheated Air"
}, {
    name: "Superheated Drizzle"
}, {
    name: "Superheated Gas Pockets"
}, {
    name: "Superheated Rain"
}, {
    name: "Sweltering"
}, {
    name: "Sweltering Damp"
}, {
    name: "Temperate"
}, {
    name: "Tempered"
}, {
    name: "Thirsty Clouds"
}, {
    name: "Torrential Acid"
}, {
    name: "Torrential Heat"
}, {
    name: "Torrential Rain"
}, {
    name: "Torrid Deluges"
}, {
    name: "Toxic Clouds"
}, {
    name: "Toxic Damp"
}, {
    name: "Toxic Dust"
}, {
    name: "Toxic Monsoons"
}, {
    name: "Toxic Outbreaks"
}, {
    name: "Toxic Rain"
}, {
    name: "Toxic Superstorms"
}, {
    name: "Tropical Storms"
}, {
    name: "Unclouded Skies"
}, {
    name: "Unending Sunlight"
}, {
    name: "Unstable"
}, {
    name: "Unstable Atmosphere"
}, {
    name: "Unstable Fog"
}, {
    name: "Unusually Mild"
}, {
    name: "Usually Mild"
}, {
    name: "Utterly Still"
}, {
    name: "Volatile"
}, {
    name: "Volatile Dust Storms"
}, {
    name: "Volatile Storms"
}, {
    name: "Volatile Winds"
}, {
    name: "Volatile Windstorms"
}, {
    name: "Wandering Frosts"
}, {
    name: "Wandering Hot Spots"
}, {
    name: "Warm"
}, {
    name: "Wet"
}, {
    name: "Whiteout"
}, {
    name: "Wind"
}, {
    name: "Winds of Glass"
}, {
    name: "Wintry"
}, {
    name: "Withered"
}]

const planetNumTip = `This is the first glyph in the portal address. Assigned to each celestial body according to their aphelion.`

const objectList = [{
    name: "Ship",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }, {
        id: "#btn-Economy",
        field: "econ",
        name: "Economy"
    }],
    fields: [{
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        required: true,
        search: true,
        sublist: [{
            name: "Name",
            type: "string",
            search: true,
            required: true,
            imgText: true,
            ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
        }, {
            name: "Wave",
            type: "number",
            range: "6",
            imgText: true,
            search: true,
        }, {
            name: "Class",
            type: "menu",
            ttip: "classTtip",
            list: classList,
            imgText: true,
            search: true,
        }, {
            name: "Slots",
            type: "menu",
            ttip: "slotTtip",
            sub: "slotList",
            list: slotList,
            imgText: true,
            search: true,
        }, {
            name: "Primary Color",
            type: "menu",
            list: colorList,
            required: true,
            search: true,
        }, {
            name: "Secondary Color",
            type: "menu",
            list: colorList,
            search: true,
        }, {
            name: "Tertiary Color",
            type: "menu",
            list: colorList,
            search: true,
        }, {
            name: "Seed",
            type: "string",
            imgText: true,
            ttip: "Found in save file. Can be used to reskin ship.",
        }, {
            name: "Photo",
            type: "img",
            required: true,
        }, {
            name: "bodies",
            type: "map",
            sub: "bodies",
            search: true,
        }, {
            name: "wings",
            type: "map",
            sub: "wings",
            search: true,
        }, ]
    }]
}, {
    name: "Freighter",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }, {
        id: "#btn-Economy",
        field: "econ",
        name: "Economy"
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Slots",
        type: "menu",
        list: slotList,
        search: true,
    }, {
        name: "Class",
        type: "menu",
        list: classList,
        search: true,
    }, {
        name: "Primary Color",
        type: "menu",
        list: colorList,
        required: true,
        search: true,
    }, {
        name: "Secondary Color",
        type: "menu",
        list: colorList,
        search: true,
    }, {
        name: "Seed",
        type: "string",
        ttip: "Found in save file. Can be used to reskin ship.",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }, {
        name: "capital",
        type: "map",
        map: freighterCapitalMap,
        search: true,
    }, {
        name: "common",
        type: "map",
        map: freighterCommonMap,
        search: true,
    }, ]
}, {
    name: "Multi-Tool",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        imgText: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Type",
        type: "menu",
        list: mtList,
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Class",
        type: "menu",
        list: classList,
        // ttipFld: "classTtip",
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Slots",
        type: "number",
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Space Station",
        type: "checkbox",
        search: true,
    }, {
        name: "",
        type: "blank",
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        search: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
    }, {
        name: "Latitude",
        imgText: true,
        type: "string",
    }, {
        name: "Longitude",
        imgText: true,
        type: "string",
    }, {
        name: "Notes",
        type: "long string",
    }, {
        name: "Primary Color",
        type: "menu",
        list: colorList,
        required: true,
        search: true,
    }, {
        name: "Secondary Color",
        type: "menu",
        list: colorList,
        search: true,
    }, {
        name: "Seed",
        type: "string",
        imgText: true,
        ttip: "Found in save file. Can be used to reskin MT.",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
    // }, {
    // name: "Flora",
    // fields: [{
    //     name: "Name",
    //     type: "string",
    // }, {
    //     name: "Description",
    //     type: "long string",
    //     required: true,
    //     search: true,
    // }, {
    //     name: "Planet Name",
    //     type: "string",
    // }, {
    //     name: "Planet Index",
    //     type: "number",
    //     range: 15,
    //     ttip: planetNumTip,
    // }, {
    //     name: "Photo",
    //     type: "img",
    //     required: true,
    // }]
}, {
    name: "Fauna",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        imgText: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Type",
        type: "menu",
        list: faunaList,
        search: true,
        required: true,
    }, {
        name: "Predator",
        type: "checkbox",
        search: true,
    }, {
        name: "Killed Product",
        type: "menu",
        list: faunaProductKilled,
        search: true,
    }, {
        name: "Tamed Product",
        type: "menu",
        list: faunaProductTamed,
        search: true,
    }, {
        name: "Height",
        type: "float",
        range: 15.0,
        imgText: true,
        search: true,
    }, {
        name: "Description",
        imgText: true,
        type: "long string",
    }, {
        name: "Planet Name",
        imgText: true,
        type: "string",
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Planet",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        imgText: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Planet Index",
        range: 15,
        type: "number",
        ttip: planetNumTip,
    }, {
        name: "Biome",
        type: "menu",
        list: biomeList,
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Extreme Weather",
        type: "checkbox",
        ttip: "Any deadly weather pattern.",
        search: true,
    }, {
        name: "Sentinels",
        type: "menu",
        list: sentinelList,
        ttip: `Low - Sentinels only guard secure facilities<br>
            High - Patrols are present throughout the planet (orange icon)<br>
            Aggressive - Patrols are present throughout the planet and Sentinels will attack on sight (red icon)<br>`,
        search: true,
    }, {
        name: "Predators",
        type: "checkbox",
        search: true,
    }, {
        name: "Grass Color",
        type: "menu",
        list: colorList,
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Water Color",
        type: "menu",
        list: colorList,
        imgText: true,
        search: true,
    }, {
        name: "Sky Color",
        type: "menu",
        list: colorList,
        imgText: true,
        search: true,
    }, {
        name: "Glitches",
        type: "menu",
        list: glitchList,
        imgText: true,
        search: true,
    }, {
        name: "Notes",
        imgText: true,
        type: "long string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Base",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player"
    }, {
        id: "#btn-Galaxy",
        field: "galaxy",
        name: "Galaxy"
    }, {
        id: "#btn-Platform",
        field: "platform",
        name: "Platform"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords"
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph"
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System"
    }, {
        id: "#btn-Economy",
        field: "econ",
        name: "Economy"
    }],
    fields: [{
        name: "Base Name",
        type: "string",
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Owner",
        type: "string",
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
    }, {
        name: "Game Mode",
        type: "menu",
        list: modeList,
        required: true,
        ttip: "Bases are only visible by players using the same game mode.",
        imgText: true,
        search: true,
    }, {
        name: "Latitude",
        type: "string",
        imgText: true,
        ttip: "Helpful finding bases on crowded planets.",
    }, {
        name: "Longitude",
        imgText: true,
        type: "string",
    }, {
        name: "Type",
        type: "menu",
        list: baseList,
        search: true,
        imgText: true,
        required: true,
    }, {
        name: "Description",
        type: "long string",
        imgText: true,
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];