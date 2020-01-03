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

    if (fnmsce) {
        bhs.buildMenu($("#resultshdr"), "show", showTypesList, nmsce.selDisplay, {
            nolabel: true
        })
        $("#resultshdr #btn-show").text("Latest")
        nmsce.getLatest(nmsce.displayResults)
    }

    $("#save").click(async () => {
        if (await nmsce.save())
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

const showTypesList = [{
    name: "Latest",
    id: "latest"
}, {
    name: "Search",
    id: "results"
}, {
    name: "Editors Choice",
    id: "editors"
}, {
    name: "Favorites",
    id: "favorites"
}, {
    name: "Visited",
    id: "visited"
}, {
    name: "Clicks",
    id: "clicks"
}, ]

NMSCE.prototype.selDisplay = function (evt) {
    $(".cover-container").hide()

    let i = getIndex(showTypesList, "name", $(evt).text())
    $("#showlast").css("visibility", showTypesList[i].id === "latest" ? "visible" : "hidden")

    let loc = $("#" + showTypesList[i].id)
    loc.show()
    $("#numFound").text(loc.children().length)
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
        labelsize: "col-xl-7 col-lg-7 col-md-5 col-sm-3 col-5",
        menusize: "col",
    })

    bhs.buildMenu(loc, "Economy", economyList, null, {
        required: !fnmsce,
        labelsize: "col-xl-7 col-lg-7 col-md-5 col-sm-3 col-5",
        menusize: "col",
    })

    let gloc = loc.find("#glyphbuttons")
    addGlyphButtons(gloc, nmsce.addGlyph)
}

NMSCE.prototype.setGlyphInput = function (evt) {
    if (bhs.user.uid) {
        if (typeof bhs.inputSettings === "undefined" || bhs.inputSettings.glyph !== $(evt).prop("checked")) {
            bhs.updateUser({
                inputSettings: {
                    glyph: $(evt).prop("checked")
                }
            })
        }
    } else {
        if ($(evt).prop("checked")) {
            $("[id='id-glyphInput']").show()
            $("[id='id-addrInput']").hide()
            $("[id='ck-glyphs']").prop("checked", true)
        } else {
            $("[id='id-glyphInput']").hide()
            $("[id='id-addrInput']").show()
            $("[id='ck-glyphs']").prop("checked", false)
        }
    }
}

NMSCE.prototype.addGlyph = function (evt) {
    let loc = $(evt).closest("#id-glyphInput").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        nmsce.changeAddr(loc)
}

NMSCE.prototype.changeAddr = async function (evt) {
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
            let entry = await bhs.getEntry(addr, nmsce.displaySystem, null, null, true)
            if (!entry)
                bhs.getEntryByRegionAddr(addr, nmsce.displayRegion)
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

NMSCE.prototype.displayRegion = function (entry) {
    let loc = $("#pnl-S1")
    loc.find("#id-reg").val(entry.reg)
    loc.find("#foundreg").show()
}

NMSCE.prototype.displaySystem = function (entry) {
    let loc = $("#pnl-S1")

    loc.find("#foundsys").show()
    if (entry.reg)
        loc.find("#foundreg").show()

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

NMSCE.prototype.showSearchPanel = function (evt) {
    if ($(evt).prop("checked")) {
        $("#searchPanel").css("display", "inherit")

        let loc = $("#typePanels .active")
        loc = loc.find("#menu-Type")
        if (loc.length > 0) {
            let btn = loc.find("[id|='btn']")
            if (btn.text().stripMarginWS() === "") {
                let item = loc.find("[id|='item']").first()
                item.click()
            }
        }
    } else
        $("#searchPanel").hide()
}

NMSCE.prototype.clearPanel = function (all, savelast) {
    const clr = (pnl) => {
        pnl.find("input").each(function () {
            let type = $(this).prop("type")
            if (type === "checkbox" || type === "radio")
                $(this).prop("checked", false)
            else
                $(this).val("")
        })

        pnl.find("[id|='menu']").each(function () {
            if (!fcedata || $(this).prop("id").stripID() !== "Type")
                $(this).find("[id|='btn']").text("")
        })
    }

    clr($("#typePanels"))

    if (all) {
        $("#pnl-S1 #foundreg").hide()
        $("#pnl-S1 #foundsys").hide()

        clr($("#pnl-S1"))
    }

    $("[id='map-selected'] img").each(function () {
        $(this).hide()
    })

    let loc = $("#typePanels #hdr-Ship")
    // loc.find("#row-Class").hide()
    loc.find("#row-Latitude").hide()
    loc.find("#row-Longitude").hide()

    $("#redditlink").val("")
    $("#posted").empty()

    let tags = $("[data-type='tags']")

    for (let loc of tags) {
        let id = $(loc).prop("id").stripID()

        $(loc).find("#btn-" + id).removeAttr("disabled")
        $(loc).find("#btn-" + id).removeClass("disabled")

        $(loc).find("#add-" + id).hide()
        $(loc).find("#btn-" + id).text(id.idToName())
        $(loc).find("#list-" + id).empty()
    }

    if (!savelast)
        nmsce.last = null

    if (!fnmsce) {
        nmsce.restoreText(bhs.user.imageText)

        let canvas = document.getElementById("id-canvas")
        let ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        $("#save").text("Save")
        $("#updateScreenshot").hide()

        $("#delete").addClass("disabled")
        $("#delete").prop("disabled", true)

        $("#reddit").addClass("disabled")
        $("#reddit").prop("disabled", true)
    }
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
                case "tags":
                    let tloc = $(rloc).find("[id|='tag']")
                    entry[id] = []

                    for (let loc of tloc) {
                        let t = $(loc).text()
                        if (t && !entry[id].includes(t))
                            entry[id].push(t)
                    }
                    break
                case "menu":
                    entry[id] = $(rloc).find("[id|='btn']").text()
                    if (entry[id] === "Nothing Selected")
                        entry[id] = ""
                    break
                case "checkbox":
                    for (let ckloc of loc) {
                        let cid = $(ckloc).prop("id").stripID()
                        entry[cid] = $(ckloc).prop("checked")
                    }
                    break
                case "radio":
                    for (let rloc of loc)
                        if ($(rloc).is(":visible") && $(rloc).is(":checked"))
                            entry[id] = $(rloc).prop("id").stripID()
                    break
                case "img":
                    if (!fnmsce) {
                        let canvas = $("#id-canvas")[0]
                        if (typeof canvas !== "undefined" && typeof entry[id] === "undefined")
                            entry[id] = uuidv4() + ".jpg"
                    }
                    break
            }

            if (ok && data.req && !fnmsce) {
                ok = typeof entry[id] !== "undefined"

                if (ok)
                    switch (data.type) {
                        case "string":
                        case "menu":
                        case "img":
                            ok = entry[id] !== ""
                            break
                        case "number":
                        case "float":
                            ok = entry[id] !== -1 && entry[id] !== ""
                            break
                        case "tags":
                            ok = entry[id].length > 0
                            break
                    }

                if (!ok) {
                    bhs.status(id + " required. Entry not saved.", 0)
                    break
                }
            }
        }

        if (ok) {
            loc = $("[id='map-selected']")
            for (let page of loc) {
                if ($(page).is(":visible")) {
                    let id = $(page).closest("[id|='row']").prop("id").stripID()
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

            entry.redditlink = $("#redditlink").val()

            if (!$("#ck-updateScreenshot").is(":visible") || $("#ck-updateScreenshot").prop("checked")) {
                entry.imageText = bhs.user.imageText
                nmsce.updateEntry(entry)
                nmsce.updateScreenshots(entry)
            } else
                nmsce.updateEntry(entry)
        }
    }

    return ok
}

NMSCE.prototype.displaySingle = async function (entry) {
    nmsce.clearPanel(true, true)

    $('html, body').animate({
        scrollTop: ($('#typeTabs').offset().top)
    }, 500);

    let tloc = $("#tab-" + entry.type.nameToId())
    tloc.click()

    $("#pnl-S1 #foundreg").hide()
    $("#pnl-S1 #foundsys").hide()

    bhs.getEntry(entry.addr, nmsce.displaySystem, null, null, true)

    let disp = function (flds, pnl) {
        for (let fld of flds) {
            let id = fld.name.nameToId()
            let row = pnl.find("#row-" + id)

            if (typeof entry[id] === "undefined")
                continue

            switch (fld.type) {
                case "number":
                case "float":
                case "string":
                    row.find("input").val(entry[id])
                    break
                case "tags":
                    row.find("#list-" + id).empty()
                    if (entry[id])
                        for (let t of entry[id]) {
                            let h = /idname/ [Symbol.replace](tTag, t.nameToId())
                            h = /title/ [Symbol.replace](h, t)
                            row.find("#list-" + id).append(h)
                        }
                    break
                case "menu":
                    row.find("#item-" + entry[id].nameToId()).click()

                    if (fld.sublist)
                        disp(fld.sublist, pnl.find("#slist-" + entry[id].nameToId()))
                    break
                case "radio":
                    row.find("#id-" + entry[id].nameToId()).click()
                    break
                case "checkbox":
                    if (entry[id] !== row.find("input").prop("checked"))
                        row.find("input").click()
                    break
            }
        }
    }

    let pnl = $("#typePanels #pnl-" + entry.type)
    let idx = getIndex(objectList, "name", entry.type)
    let obj = objectList[idx]

    disp(obj.fields, pnl)

    let loc = $("[id='map-selected']")
    loc.find("img").hide()

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

    if (entry.imageText)
        bhs.user.imageText = entry.imageText

    nmsce.loadScreenshot(null, entry.Photo)

    $("#redditlink").val(entry.redditlink ? entry.redditlink : "")

    $("#save").text("UPDATE")
    $("#updateScreenshot").show()
    $("#ck-updateScreenshot").prop("checked", false)

    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")

    $("#reddit").removeClass("disabled")

    $("#reddit").removeAttr("disabled")
    $("#posted").html(entry.reddit ? "Posted&nbsp;" +
        (typeof entry.reddit !== "boolean" ? "<span class='txt-inp-def h6'>" + entry.reddit.toDate() + "</span>" : "") : "")
}

NMSCE.prototype.executeSearch = async function (fcn) {
    let galaxy = $("#btn-Galaxy").text().stripNumber()

    if (galaxy === "") {
        bhs.status("No Galaxy Selected.")
        return
    }

    let tab = $("#typeTabs .active").prop("id").stripID()
    let pnl = $("#typePanels #pnl-" + tab)

    if (fcedata)
        nmsce.hideDisplayList(tab)

    let ref = bhs.fs.collection("nmsce/" + galaxy + "/" + tab)

    let obj = null
    let i = getIndex(objectList, "name", tab)
    if (i > -1)
        obj = objectList[i]

    for (let fld of obj.imgText) {
        if (fld.name === "Galaxy")
            continue

        let loc = $(fld.id)

        let val = ""
        if (fld.type === "text")
            val = loc.val()
        else if (fld.type === "menu")
            val = loc.find("#btn-" + fld.id.stripID()).text().stripNumber()

        if (val !== "")
            ref = ref.where(fld.field, "==", val)
    }

    let list = pnl.find("[id|='row']")
    let colorlist = []

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
                    ref = ref.where(id, rdata.search ? rdata.search : "==", val)
                break
            case "string":
                if (val)
                    ref = ref.where(id, "==", val)
                break
            case "tags":
                let tlocs = $(rloc).find("[id|='tag']")
                let tlist = []

                for (let loc of tlocs) {
                    let t = $(loc).text()
                    if (t && !tlist.includes(t))
                        tlist.push(t)
                }

                if (tlist.length > 0)
                    ref = ref.where(id, "array-contains-any", tlist)
                break
            case "menu":
                val = $(rloc).find("#btn-" + id).text()
                if (val) {
                    val = val.stripNumber()
                    if (val !== "Nothing Selected")
                        ref = ref.where(id, "==", val)
                }
                break
            case "checkbox":
                let cloc = $(rloc).find("input:checked")
                if (cloc.length > 0)
                    ref = ref.where(id, "==", cloc.prop("id") === "id-True")
                break
            case "radio":
                for (let rloc of loc)
                    if ($(rloc).is(":visible") && $(rloc).is(":checked"))
                        ref = ref.where(id, "==", $(rloc).prop("id").stripID())
                break
        }
    }

    let loc = $("[id='map-selected']")
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

    if (bhs.user.uid === "")
        ref = ref.limit(50)

    $("#results").empty()
    $("#item-Search").click()

    ref.get().then(snapshot => {
        if (snapshot.size === 0) {
            bhs.status("No matching entries found.")
            return
        }

        if (bhs.user.uid === "" && snapshot.size === 50)
            bhs.status("Showing first 50 matches. Login to see more matches or refine selection to see better matches.")

        let size = 0

        for (let doc of snapshot.docs) {
            let e = doc.data()
            let found = true

            if (colorlist.length > 1) { // no array-contains-all
                for (let c of colorlist) {
                    if (!e.Color.includes(c)) {
                        found = false
                        break
                    }
                }
            }

            if (found) {
                size++
                fcn(e, doc.ref.path, "#results")
            }
        }

        bhs.status(size + " matching entries found.")
        $("#numFound").text(size)
    }).catch(err => {
        bhs.status("Search error: " + err.message)
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
    } else return false
}

NMSCE.prototype.search = function () {
    $("#status").empty()

    nmsce.executeSearch(fnmsce ? nmsce.displayResults : nmsce.displayInList)
}

blackHoleSuns.prototype.status = function (str, clear) {
    if (clear)
        $("#status").empty()

    $("#status").append("<h6>" + str + "</h6>")
}

let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#hdr-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`
let header = `
    <div id="hdr-idname" class="tab-pane show active" role="tabpanel" aria-labelledby="tab-idname">
        <div id="pnl-idname" class="row"></div>
    </div>`
let mapHeader = `<div id="pnl-idname" class="row border rounded" style="display:none"></div>`
const tSubList = `<div id="slist-idname" class="row" style="display:none"></div>`

const tReq = `&nbsp;<font style="color:red">*</font>`
const tText = `&nbsp;
    <span data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
        <i class="fa fa-question-circle-o text-danger h6"></i>
    </span>`

const inpHdr = `<div class="col-lg-7 col-14">`
const inpLongHdr = `<div class="col-14">`
const inpShipHdr = `<div class="col-14">`
const inpEnd = `</div>`

const tString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tMap = `<div id="row-idname" data-type="map" data-req="ifreq"></div>`
const tLongString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row pl-15">
        <div class="col-3 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tNumber = `
    <div id="row-idname" data-type="number" data-req="ifreq" data-search="stype" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-7" min=-1 max=range value=-1>
    </div>`
const tFloat = `
    <div id="row-idname" data-type="float" data-req="ifreq" data-search="stype" class="row">
        <div class="col-5 h6 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-7" step=0.1 min=-1 max=range value=-1>
    </div>`
const tTags = `
    <div id="row-idname" class="row" data-type="tags" data-req="ifreq">
        <div id="id-idname" class="col-3"></div>&nbsp;ttip
        <div id="add-idname" class="col-10 row hidden">
            <input id="txt-idname" type="text" class="col-7"></input>
            <button id="add-idname" type="text" class="col-2 btn btn-def btn-sm" onclick="nmsce.newTag(this)">Add</button>
            <button id="cancel-idname" type="text" class="col-3 btn btn-def btn-sm" onclick="nmsce.cancelTag(this)">Cancel</button>
        </div>
        <div class="col-10 border">
            <div id="list-idname" class="row"></div>
        </div>
    </div>`
const tTag = `<div id="tag-idname" class="col border pointer" style="border-radius:8px; background-color:#d0d0d0" onclick="nmsce.deleteTag(this)">title</div>`
const tMenu = `
    <div id="row-idname" data-type="menu" data-req="ifreq">
        <div id="id-idname"></div>
    </div>`
const tRadio = `
    <div id="row-idname" data-type="radio" data-req="ifreq" class="row">
        <div class="radio col-5 h6 txt-inp-def" style="padding-left:45px" data-toggle="grp-idname"">titlettip:&nbsp;</div>
    </div>`
const tRadioItem = `
    <label class="h6 txt-inp-def">titlettip&nbsp;
        <input type="radio" class="radio" id="id-title" name="grp-idname">
    </label>`
const tCkItem = `
    <div id="row-idname" data-type="checkbox" data-req="false" style="padding-left:15px">
        <label id="id-idname" class="h6 txt-inp-def row">
            titlettip&nbsp
            <input id="ck-idname" type="checkbox">
        </label>
    </div>`
const tImg = `
    <div id="row-idname" data-type="img" data-req="ifreq" class="row">
        <div class="col-3 txt-inp-def h6 pl-30">titlettip&nbsp;</div>
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
        let l = /title/g [Symbol.replace](add, title + (req ? tReq : ""))

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
                l = /stype/ [Symbol.replace](l, f.searchType ? f.searchType : "")
                appenditem(itm, l, f.name, id, f.ttip, f.required)
                break
            case "float":
                l = /range/ [Symbol.replace](tFloat, f.range)
                l = /stype/ [Symbol.replace](l, f.searchType ? f.searchType : "")
                appenditem(itm, l, f.name, id, f.ttip, f.required)
                break
            case "img":
                appenditem(itm, tImg, f.name, id, f.ttip, f.required, inpLongHdr)
                break
            case "checkbox":
                if (!slist || slist[f.sub]) {
                    if (fnmsce) {
                        appenditem(itm, tRadio, f.name, id, f.ttip, null, inpLongHdr)
                        let btn = itm.find("#row-" + id)
                        btn.attr("data-type", "checkbox")
                        appenditem(btn, tRadioItem, "True", id, null, null, `<div class="col-3">`)
                        appenditem(btn, tRadioItem, "False", id, null, null, `<div class="col-3">`)
                        if (f.onchange) {
                            btn.find("#id-True").change(f.onchange)
                            btn.find("#id-False").change(f.onchange)
                        }
                    } else {
                        appenditem(itm, tCkItem, f.name, id, f.ttip, f.required)
                        if (f.onchange) {
                            itm.find("#id-" + id).change(f.onchange)
                        }
                    }
                }
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

                if (f.ttip)
                    f.tip = slist ? slist[f.ttip] : f.ttip

                bhs.buildMenu(lst, f.name, f.sub ? slist[f.sub] : f.list, f.sublist ? nmsce.selectSublist : null, f)

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
            case "tags":
                appenditem(itm, tTags, "", id, f.ttip, f.required, inpLongHdr)
                let rloc = itm.find("#row-" + id)
                if (f.max)
                    rloc.data("max", f.max)

                if (f.list) {
                    let list = f.list.sort((a, b) =>
                        a.name.toLowerCase() > b.name.toLowerCase() ? 1 :
                        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)
                    bhs.buildMenu(rloc, f.name, list, nmsce.addTag, {
                        nolabel: true
                    })

                    itm.find("#btn-" + id).text(f.name)
                } else {
                    let ref = bhs.fs.doc("tags/" + itmid)
                    ref.get().then(doc => {
                        let tags = []

                        if (doc.exists) {

                            let list = doc.data()
                            for (let t of list.tags)
                                tags.push({
                                    name: t
                                })

                            tags = tags.sort((a, b) =>
                                a.name.toLowerCase() > b.name.toLowerCase() ? 1 :
                                a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)
                        }

                        if (fcedata)
                            tags.unshift({
                                name: "Add new tag"
                            })

                        // let pnl = doc.ref.id
                        bhs.buildMenu(rloc, f.name, tags, nmsce.addTag, {
                            nolabel: true
                        })

                        rloc.find("#btn-" + id).text(f.name)
                    })
                }
                break
            case "radio":
                if (slist[f.sub]) {
                    appenditem(itm, tRadio, f.name, id, typeof slist[f.ttip] === "string" ? slist[f.ttip] : null, f.required, inpLongHdr)
                    let btn = itm.find("#row-" + id)

                    for (let i of slist[f.sub])
                        appenditem(btn, tRadioItem, i.name, id, null, null, `<div class="col-2">`)
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

        if (f.startState === "hidden")
            itm.find("#row-" + id).hide()
    }
}

NMSCE.prototype.addTag = function (evt) {
    let row = $(evt).closest("[id|='row']")
    let data = row.data()
    let text = $(evt).text().stripMarginWS()
    let id = row.prop("id").stripID()

    if (data.max && row.find("#list-" + id).children().length >= data.max) {
        row.find("#btn-" + id).text(id.idToName())
        return
    }

    if (text === "Add new tag")
        row.find("#add-" + id).show()
    else {
        let h = /idname/ [Symbol.replace](tTag, text.nameToId())
        h = /title/ [Symbol.replace](h, text)

        row.find("#list-" + id).append(h)
        row.find("#btn-" + id).text(id.idToName())

        if (fnmsce) {
            $(evt).closest("[id|='pnl']")

            let tags = $("[data-type='tags']")
            for (let loc of tags) {
                $(loc).find("[id|='btn']").first().prop("disabled", true)
                $(loc).find("[id|='btn']").first().addClass("disabled")
            }

            row.find("[id|='btn']").first().removeAttr("disabled")
            row.find("[id|='btn']").first().removeClass("disabled")
        }
    }
}

NMSCE.prototype.deleteTag = function (evt) {
    if (fnmsce) {
        let row = $(evt).closest("[id|='row']")
        let id = row.prop("id").stripID()
        let list = row.find("#list-" + id)

        if (list.length === 1) {
            let tags = $("[data-type='tags']")
            for (let loc of tags) {
                $(loc).find("[id|='btn']").first().removeAttr("disabled")
                $(loc).find("[id|='btn']").first().removeClass("disabled")
            }
        }
    }

    $(evt).remove()
}

NMSCE.prototype.newTag = function (evt) {
    let row = $(evt).closest("[id|='row']")
    let id = row.prop("id").stripID()
    let text = row.find("[id|='txt']").val().toLowerCase()

    if (text !== "" && row.find("#item-" + text.nameToId()).length === 0) {
        let pnl = $(evt).closest("[id|='pnl']").prop("id").stripID()
        let ref = bhs.fs.doc("tags/" + pnl)

        ref.set({
            tags: firebase.firestore.FieldValue.arrayUnion(text)
        }, {
            merge: true
        })

        $(evt).val("")
        let h = row.find("#item-Add-new-tag")[0].outerHTML
        let id = text.nameToId()
        h = /Add-new-tag/ [Symbol.replace](h, id)
        h = /Add new tag/ [Symbol.replace](h, text)
        row.find("#list").append(h)
        bhs.bindMenuChange(row.find("#item-" + id), nmsce.addTag)

        h = /idname/ [Symbol.replace](tTag, id)
        h = /title/ [Symbol.replace](h, text)
        row.find("#list-" + row.prop("id").stripID()).append(h)
    }

    row.find("#add-" + id).hide()
    row.find("#txt-" + id).val("")
    row.find("#btn-" + id).text(row.prop("id").stripID())
}

NMSCE.prototype.cancelTag = function (evt) {
    let row = $(evt).closest("[id|='row']")
    row.find("[id|='add']").hide()
    row.find("[id|='txt']").first().val("")
    row.find("[id|='btn']").first().text(row.prop("id").stripID())
}

// function showClass() {
//     let loc = $("#typePanels #hdr-Ship")
//     if ($(this).find("input").prop("checked") || loc.find("#ck-Crashed").prop("checked"))
//         loc.find("#row-Class").show()
//     else
//         loc.find("#row-Class").hide()
// }

function showLatLong() {
    let loc = $("#typePanels #hdr-Ship")
    if ($(this).find("input").prop("checked")) {
        // loc.find("#row-Class").show()
        loc.find("#row-Latitude").show()
        loc.find("#row-Longitude").show()
        loc.find("#row-Planet-Index").show()
        loc.find("#row-Planet-Name").show()
    } else {
        // if (!loc.find("#ck-First-Wave").prop("checked"))
        //     loc.find("#row-Class").hide()
        loc.find("#row-Latitude").hide()
        loc.find("#row-Longitude").hide()
        loc.find("#row-Planet-Index").hide()
        loc.find("#row-Planet-Name").hide()
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
        <label class="col-xl-p333 col-7">
            <input id="ck-idname" type="checkbox" ftype loc row sub onchange="nmsce.ckImgText(this, true)">
            &nbsp;title
        </label>`

    const textInp = `
        <label class="col-13 txt-inp-def pl-15">
            <input id="ck-text" type="checkbox" data-loc="#id-text"
                onchange="nmsce.ckImgText(this, true)">
            Text&nbsp;&nbsp;
            <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                data-placement="bottom"
                title="Use Line break, <br>, to separate multiple lines.">
            </i>&nbsp;
            <input id="id-text" class="rounded col-8" type="text" onchange="nmsce.ckImgText(this, true)">
        </label>
        <br>`

    $("#img-text").html(textInp)

    let appenditem = (title, type, loc, row, sub) => {
        let h = /idname/ [Symbol.replace](ckbox, title.nameToId())
        h = /title/ [Symbol.replace](h, title)
        h = /ftype/ [Symbol.replace](h, "data-type='" + type + "'")
        h = /loc/ [Symbol.replace](h, "data-loc='" + loc + "'")
        h = /sub/ [Symbol.replace](h, sub ? "data-sub='" + sub + "'" : "")
        h = /row/ [Symbol.replace](h, row ? "data-row='" + row + "'" : "")

        $("#img-text").append(h)

        if (clear || typeof nmsce.imageText === "undefined" || typeof nmsce.imageText[title.nameToId()] === "undefined")
            nmsce.initTxtItem(title.nameToId())
    }

    let active = $("#typePanels .active")
    let type = active.prop("id").stripID()
    let objIdx = getIndex(objectList, "name", type)
    let obj = objectList[objIdx]

    for (let txt of obj.imgText)
        appenditem(txt.name, txt.type, txt.id)

    for (let fld of obj.fields) {
        if (fld.imgText)
            appenditem(fld.name, fld.type, "#typePanels .active", "#row-" + fld.name.nameToId())

        if (typeof fld.sublist !== "undefined")
            for (let sub of fld.sublist)
                if (sub.imgText)
                    appenditem(sub.name, sub.type, "#typePanels .active", "#row-" + fld.name.nameToId(), "#row-" + sub.name.nameToId())
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
        let text = ""
        let data = $(evt).data()
        let loc = $(data.loc)

        if (data.row)
            loc = loc.find(data.row)

        if (data.sub) {
            let btn = loc.find("[id|='btn']").text().stripMarginWS()
            loc = $(data.loc).find("#slist-" + btn)
            loc = loc.find(data.sub)
        }

        if (data.row || data.type === "menu")
            loc = loc.find("[id|='" + (data.type === "menu" ? "btn" : "id") + "']")

        switch (data.type) {
            case "menu":
                text = loc.text().stripNumber()
                break
            case "number":
                text = loc.val()
                text = text === -1 ? "" : text.toString()
                break
            case "float":
                text = loc.val()
                text = text === -1 ? "" : text.toString()
                break
            case "glyph":
                text = loc.val()
                loc = $("#typePanels .active #id-Planet-Index")
                let num = loc.length > 0 && loc.val() > 0 ? loc.val() : 0
                text = addrToGlyph(text, num)
                break
            case "radio":
                for (let rloc of loc)
                    if ($(rloc).is(":visible") && $(rloc).is(":checked"))
                        text = $(rloc).prop("id").stripID()
                break
            default:
                text = loc.val()
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
    if (iTxt)
        nmsce.imageText = iTxt

    if (typeof nmsce.imageText === "undefined")
        return

    let loc = $("#img-text")

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let f = nmsce.imageText[id]

        if (id === "text" && f.text)
            loc.find("#id-text").val(f.text)

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
        if (k !== "text")
            delete f.text
        delete f.sel
    }

    return s
}

NMSCE.prototype.loadScreenshot = async function (evt, fname) {
    nmsce.loadImgText()
    nmsce.restoreText(bhs.user.imageText)

    if (evt) {
        let file = evt.files[0]
        if (file) {
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
        }
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
    let sw = nmsce.screenshot.width
    let sh = nmsce.screenshot.height

    if (sh > sw) { // vertical
        txtcanvas.height = Math.min(width, sh)
        txtcanvas.width = sw * txtcanvas.height / sh

        canvas.height = Math.min(altw ? altw : width, sw)
        canvas.width = sw * canvas.height / sh
    } else {
        txtcanvas.width = Math.min(width, sw)
        txtcanvas.height = sh * txtcanvas.width / sw

        canvas.width = Math.min(altw ? altw : width, sw)
        canvas.height = nmsce.screenshot.height * canvas.width / nmsce.screenshot.width
    }

    let ctx = txtcanvas.getContext("2d")
    ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

    let loc = $("#img-text")
    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]
        let tloc = loc.find("#ck-" + id)

        if (text.ck && tloc.is(":visible")) {
            if (text.x + text.width > txtcanvas.width)
                text.x = txtcanvas.width - text.width
            else if (text.x < 0)
                text.x = 0

            if (text.y > txtcanvas.height)
                text.y = txtcanvas.height
            else if (text.y - text.height < 0)
                text.y = text.height

            if (id === "Glyphs") {
                text.font = "glyph"

                ctx.fillStyle = text.color
                ctx.fillRect(text.x - 2, text.y - text.height, text.width + 4, text.height + 4)
                ctx.fillStyle = "#000000"
                ctx.fillRect(text.x - 1, text.y - text.height + 1, text.width + 2, text.height + 2)
            }

            ctx.font = text.fSize + "px " + text.font
            ctx.fillStyle = text.color

            if (typeof text.text !== "undefined" && text.text.includes("<br>")) {
                let l = text.text.split("<br>")

                for (let i = 0; i < l.length; ++i)
                    ctx.fillText(l[i], text.x, text.y + i * text.fSize * 1.15)
            } else
                ctx.fillText(text.text, text.x, text.y)

            if (text.sel && !altw) {
                ctx.strokeStyle = "white"
                ctx.setLineDash([2, 2]);
                ctx.beginPath()
                ctx.rect(text.x - 2, text.y - text.fSize + 2, text.width + 3, text.height + 3)
                ctx.stroke();
            }
        }
    }

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

    let ref = bhs.fs.doc("nmsce/" + nmsce.last.galaxy + "/" + nmsce.last.type + "/" + nmsce.last.id)
    ref.set({
        reddit: firebase.firestore.Timestamp.now()
    }, {
        merge: true
    }).then(() => $("#posted").text("Posted"))

}

NMSCE.prototype.textHittest = function (x, y, text) {
    return (x >= text.x && x <= text.x + text.width && y >= text.y - text.fSize && y <= text.y - text.fSize + text.height)
}

var lastsel = 0

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
            lastsel = 0
        }

    let loc = $("#imgtable")
    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.ck && nmsce.textHittest(startX, startY, text)) {
            text.sel = ++lastsel
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

NMSCE.prototype.alignText = function (how) {
    let keys = Object.keys(nmsce.imageText)
    let top = 0,
        left = 0,
        right = Number.MAX_SAFE_INTEGER,
        bottom = Number.MAX_SAFE_INTEGER,
        sel = 0,
        width = 0

    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.sel) {
            top = Math.max(top, text.y)
            bottom = Math.min(bottom, text.y + text.height)
            left = Math.max(left, text.x)
            right = Math.min(right, text.x + text.width)
            width += text.width
            sel++
        }
    }

    let space = (right - left - width) / (sel - 1)

    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.sel) {
            switch (how) {
                case "top":
                    text.y = top
                    break
                case "bottom":
                    text.y = bottom - text.height
                    break
                case "left":
                    text.x = left
                    break
                case "right":
                    text.x = right - text.width
                    break
                    // case "justify":
                    //     text.x = left
                    //     left += text.width + space
                    // break
            }
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.deleteEntry = function (entry) {
    let ref = bhs.fs.doc("nmsce/" + entry.galaxy + "/" + entry.type + "/" + entry.id)

    ref.delete().then(() => {
        bhs.status(entry.id + " deleted.")
        $("#save").text("Save")
        $("#updateScreenshot").hide()

        let ref = bhs.fbstorage.ref().child(originalPath + entry.Photo)
        ref.delete()

        ref = bhs.fbstorage.ref().child(displayPath + entry.Photo)
        ref.delete()

        ref = bhs.fbstorage.ref().child(thumbnailPath + entry.Photo)
        ref.delete()
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
        console.log(err)
    })
}

NMSCE.prototype.updateScreenshots = function (entry) {
    let disp = document.createElement('canvas')
    nmsce.drawText(disp, 1024)
    disp.toBlob(blob => {
        bhs.fbstorage.ref().child(displayPath + entry.Photo).put(blob).then(() => {
            // bhs.status("Saved " + displayPath + entry.Photo)
        })
    }, "image/jpeg", .9)

    let thumb = document.createElement('canvas')
    nmsce.drawText(thumb, 400)
    thumb.toBlob(blob => {
        nmsce.saved = blob
        bhs.fbstorage.ref().child(thumbnailPath + entry.Photo).put(blob).then(() => {
            // bhs.status("Saved " + thumbnailPath + entry.Photo)
        })
    }, "image/jpeg", .7)

    let orig = document.createElement('canvas')
    let ctx = orig.getContext("2d")
    orig.width = 1024
    orig.height = nmsce.screenshot.height * 1024 / nmsce.screenshot.width
    ctx.drawImage(nmsce.screenshot, 0, 0, orig.width, orig.height)
    orig.toBlob(blob => {
        bhs.fbstorage.ref().child(originalPath + entry.Photo).put(blob).then(() => {
            // bhs.status("Saved " + originalPath + entry.Photo)
        })
    }, "image/jpeg", .9)
}

NMSCE.prototype.updateEntry = function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()
    nmsce.initVotes(entry)

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    if (typeof entry.id === "undefined")
        entry.id = entry.addr.nameToId() + "-" + entry.Name.nameToId().toLowerCase()

    if (typeof entry.Photo === "undefined")
        entry.Photo = entry.type + "_" + entry.id + ".jpg"

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    ref = ref.doc(entry.id)

    ref.set(entry).then(() => {
        nmsce.displayList(entry, ref.path)
        bhs.status(entry.id + " saved.")
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
        console.log(err)
    })
}

NMSCE.prototype.initVotes = function (entry) {
    if (typeof entry.votes === "undefined") {
        entry.votes = {}
        entry.votes.clickcount = 0
        entry.votes.visited = 0
        entry.votes.report = 0
        entry.votes.favorite = 0
        entry.votes.edchoice = 0
        entry.votes.bhspoi = 0
    }
}

NMSCE.prototype.getEntry = async function (evt) {
    let id = $(evt).val().nameToId().toLowerCase()
    let type = $("#typePanels .active").prop("id").stripID()
    let gal = $("#btn-Galaxy").text().stripNumber()

    if (gal && type && id) {
        let ref = bhs.fs.doc("nmsce/" + gal + "/" + type + "/" + id)
        ref.get().then(doc => {
            if (doc.exists) {
                nmsce.last = doc.data()
                nmsce.displaySingle(doc.data())
            }
        })
    }
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
    }

    if (typeof displayFcn === "function")
        displayFcn(nmsce.entries)
}

NMSCE.prototype.getLatest = async function (fcn, evt) {
    let s = parseInt($("#displaysince").val())
    if (s <= 0) {
        $("#displaysince").val(0)
        return
    } else if (s > 30) {
        s = 30
        $("#displaysince").val(s)
    }

    let d = new Date()
    d.setDate(d.getDate() - s)
    d = firebase.firestore.Timestamp.fromDate(d)

    $("#latest").empty()
    $("#item-Latest").click()

    let ref = bhs.fs.collection("nmsce")
    ref.get().then(snapshot => {
        for (let doc of snapshot.docs)
            for (let t of objectList) {
                let type = t.name

                ref = doc.ref.collection(type)
                ref = ref.where("created", ">=", d)

                ref.get().then(snapshot => {
                    let t = $("#numFound").text()
                    t = t !== "" ? parseInt(t) : 0
                    t += snapshot.size
                    $("#numFound").text(t)

                    for (let doc of snapshot.docs)
                        fcn(doc.data(), doc.ref.path, "#latest")
                })

                ref = doc.ref.collection(type)
                ref = ref.where("created", ">=", firebase.firestore.Timestamp.fromDate(new Date()))
                bhs.subscribe("nmsce-latest-" + ref.path, ref, fcn)

                if ($("#favorites").children().length === 0) {
                    ref = doc.ref.collection(type)
                    ref = ref.orderBy("votes.favorite", "desc")
                    ref = ref.limit(2)

                    ref.get().then(snapshot => {
                        for (let doc of snapshot.docs) {
                            if (doc.data().votes.favorite > 0)
                                fcn(doc.data(), doc.ref.path, "#favorites")
                        }
                    })
                }

                if ($("#visited").children().length === 0) {
                    ref = doc.ref.collection(type)
                    ref = ref.orderBy("votes.visited", "desc")
                    ref = ref.limit(2)

                    ref.get().then(snapshot => {
                        for (let doc of snapshot.docs) {
                            if (doc.data().votes.visited > 0)
                                fcn(doc.data(), doc.ref.path, "#visited")
                        }
                    })
                }

                if ($("#clicks").children().length === 0) {
                    ref = doc.ref.collection(type)
                    ref = ref.orderBy("votes.clickcount", "desc")
                    ref = ref.limit(2)

                    ref.get().then(snapshot => {
                        for (let doc of snapshot.docs) {
                            if (doc.data().votes.clickcount > 0)
                                fcn(doc.data(), doc.ref.path, "#clicks")
                        }
                    })
                }

                if ($("#editors").children().length === 0) {
                    ref = doc.ref.collection(type)
                    ref = ref.orderBy("votes.edchoice", "desc")
                    ref = ref.limit(2)

                    ref.get().then(snapshot => {
                        for (let doc of snapshot.docs) {
                            if (doc.data().votes.edchoice > 0)
                                fcn(doc.data(), doc.ref.path, "#editors")
                        }
                    })
                }
            }
    })
}

NMSCE.prototype.displayResults = function (e, path, inID) {
    const img = `
    <div class="cover-item bkg-white txt-inp-def h5 align-top">
        galaxy<br>
        by<br>
        <img id="id-idname" src="images/blank.png" data-src="url" data-path="dbpath" class="pointer" onclick="nmsce.selectResult(this)"
            onload="nmsce.imgLoaded(this, $('.cover-container').height()*1.3, $('.cover-container').height()-64)" />
    </div>`

    let idname = (e.type + "-" + e.id).nameToId()

    if (window.IntersectionObserver) {
        var io = new IntersectionObserver(
            evts => {
                for (let evt of evts) {
                    if (evt.intersectionRatio > 0) {
                        evt.target.src = evt.target.dataset.src
                        io.unobserve(evt.target)
                    }
                }
            }, {
                root: $('#latest')[0],
                rootMargin: '0px 0px 0px 0px',
                threshold: .1
            }
        )
    }

    let ref = bhs.fbstorage.ref().child(thumbnailPath + e.Photo)
    ref.getDownloadURL().then(url => {
        let h = img
        if (window.IntersectionObserver && !inID)
            h = /url/ [Symbol.replace](h, url)
        else
            h = /images\/blank\.png/ [Symbol.replace](h, url)
        h = /idname/ [Symbol.replace](h, idname)
        h = /dbpath/ [Symbol.replace](h, path)
        h = /galaxy/ [Symbol.replace](h, e.galaxy)
        h = /by/ [Symbol.replace](h, e._name)

        if (inID)
            $(inID).append(h)
        else {
            $("#latest").prepend(h)

            if (io)
                io.observe($('#id-' + idname)[0])
        }
    })
}

NMSCE.prototype.vote = async function (evt) {
    if (nmsce.last && bhs.user.uid !== "") {
        let v = 1
        let e = nmsce.last
        let id = $(evt).prop("id")

        let ref = bhs.fs.doc("nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)

        e = {}
        e.uid = bhs.user.uid

        let vref = ref.collection("votes")
        vref = vref.doc(bhs.user.uid)
        let doc = await vref.get()
        if (doc.exists) {
            e = doc.data()
            v = typeof e[id] === "undefined" || e[id] === false ? 1 : -1
        }

        e[id] = v === 1 ? true : false

        doc.ref.set(e, {
            merge: true
        })

        nmsce.showVotes(e)

        e = {}
        e[id] = firebase.firestore.FieldValue.increment(v)

        ref.set({
            votes: e
        }, {
            merge: true
        })
    }
}

NMSCE.prototype.selectResult = async function (evt) {
    let row = `
        <div id="id-idname" class="row border-bottom txt-inp-def h5">
            <div class="col-lg-5 col-7">title</div>
            <div id="val-idname" class="col-lg-9 col-7 font clr-def">value</div>
        </div>`

    let loc = $("#imageinfo")
    loc.show()

    let data = $(evt).data()
    let ref = bhs.fs.doc(data.path)
    let doc = await ref.get()

    if (doc.exists) {
        let e = doc.data()
        nmsce.last = e

        let v = {}
        v.votes = {}
        v.votes.clickcount = firebase.firestore.FieldValue.increment(1)
        doc.ref.set(v, {
            merge: true
        })

        if (bhs.user.uid !== "") {
            let ref = bhs.fs.doc("nmsce/" + e.galaxy + "/" + e.type + "/" + e.id + "/votes/" + bhs.user.uid)
            ref.get().then(doc => {
                nmsce.showVotes(doc.data())
            })
        }

        let idx = getIndex(objectList, "name", e.type)
        let obj = objectList[idx]

        let ref = bhs.fbstorage.ref().child(displayPath + e.Photo)
        ref.getDownloadURL().then(url => {
            $("#dispimage").width("auto")
            $("#dispimage").height("auto")
            $("#dispimage").prop("src", url)
        })

        loc = $("#imagedata")
        loc.empty()

        for (let fld of obj.imgText) {
            let h = /idname/g [Symbol.replace](row, fld.name.nameToId())
            h = /title/ [Symbol.replace](h, fld.name)
            h = /value/ [Symbol.replace](h, fld.name === "Glyphs" ? addrToGlyph(e[fld.field], e["Planet-Index"]) : e[fld.field])
            h = /font/ [Symbol.replace](h, fld.font ? fld.font : "")
            loc.append(h)
        }

        for (let fld of obj.fields) {
            let id = fld.name.nameToId()
            if (fld.imgText && typeof e[id] !== "undefined" && e[id] !== -1 && e[id] !== "") {
                let h = /idname/g [Symbol.replace](row, id)
                h = /title/ [Symbol.replace](h, fld.name)

                if (fld.type === "tags") {
                    let t = ""

                    if (fld) {
                        for (let c of fld)
                            t += c + ", "

                        t = t.slice(0, t.length - 2)
                    }

                    h = /value/ [Symbol.replace](h, t)
                } else
                    h = /value/ [Symbol.replace](h, e[id])

                h = /font/ [Symbol.replace](h, "")
                loc.append(h)
            }

            if (typeof fld.sublist !== "undefined") {
                for (let sub of fld.sublist) {
                    let id = sub.name.nameToId()
                    if (sub.imgText && typeof e[id] !== "undefined" && e[id] !== -1 && e[id] !== "") {
                        let h = /idname/g [Symbol.replace](row, id)
                        h = /title/ [Symbol.replace](h, sub.name)
                        h = /value/ [Symbol.replace](h, e[id])
                        h = /font/ [Symbol.replace](h, "")
                        loc.append(h)
                    }
                }
            }
        }

        if (e.redditlink) {
            let h = /idname/g [Symbol.replace](row, "link")
            h = /title/ [Symbol.replace](h, "")
            h = /value/ [Symbol.replace](h, "<a href='" + e.redditlink + "'>Reddit Post Link</a>")
            h = /font/ [Symbol.replace](h, "")
            loc.append(h)
        }

        let d = e.created.toDate().toDateLocalTimeString()

        let h = /idname/g [Symbol.replace](row, "date")
        h = /title/ [Symbol.replace](h, "Added")
        h = /value/ [Symbol.replace](h, d)
        h = /font/ [Symbol.replace](h, "")
        loc.append(h)
    }
}

NMSCE.prototype.showVotes = function (entry, path) {
    const shvote = function (loc, tf) {
        if (tf) {
            loc.removeClass("fa-square")
            loc.addClass("fa-check-square")
            loc.css("color", "green")
        } else {
            loc.removeClass("fa-check-square")
            loc.addClass("fa-square")
            loc.css("color", "grey")
        }
    }

    if (typeof entry !== "undefined") {
        $("#favorite").css("color", entry.favorite ? "green" : "grey")
        shvote($("#voted-edchoice"), entry.edchoice)
        shvote($("#voted-bhspoi"), entry.bhspoi)
        shvote($("#voted-visited"), entry.visited)
        shvote($("#voted-report"), entry.report)
    } else {
        $("#favorite").css("color", "grey")
        shvote($("#voted-edchoice"), false)
        shvote($("#voted-bhspoi"), false)
        shvote($("#voted-visited"), false)
        shvote($("#voted-report"), false)
    }
}

NMSCE.prototype.hideDisplayList = function (tab) {
    let loc = $("#id-table #list-" + tab)
    loc.find("[id|='row']").hide()
    loc.find("#row-idname").show()
}

NMSCE.prototype.showAll = function () {
    let loc = $("#id-table")
    loc.find("[id|='row']").show()
}

NMSCE.prototype.displayInList = function (entry) {
    let tab = entry.type.nameToId()
    let loc = $("#id-table #list-" + tab)
    loc.find("#row-" + entry.id).show()
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
                            <img id="img-pic" src="" onload="nmsce.imgLoaded(this, $(this).parent().width(), $(this).parent().width())">
                        </div>
                        <div class="row">`
    const itm = `           <div id="id-idname" class="col-md-7 col-14 border">title</div>`
    const end = `</div>`

    let h = ""

    let e = entries

    if (path) {
        let i = getIndex(nmsce.entries[e.type], "id", e.id)
        if (i === -1)
            nmsce.entries[entries.type].push(e)
        else
            nmsce.entries[entries.type][i] = e

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

            l = /idname/g [Symbol.replace](itm, "Coords")
            h += /title/ [Symbol.replace](l, "Coordinates")

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

            l = /idname/g [Symbol.replace](itm, "Favorite")
            h += /title/ [Symbol.replace](l, "Favorite")
            l = /idname/g [Symbol.replace](itm, "Editors-Choice")
            h += /title/ [Symbol.replace](l, "Editors-Choice")
            l = /idname/g [Symbol.replace](itm, "Visited")
            h += /title/ [Symbol.replace](l, "Visited")

            h += end + end
        }

        for (let e of entries[obj.name.nameToId()]) {
            let l = /idname/ [Symbol.replace](row, e.id)
            h += l

            l = /idname/g [Symbol.replace](itm, "Coords")
            h += /title/ [Symbol.replace](l, e.addr)

            for (let f of obj.fields) {
                if (f.type !== "img" && f.type !== "map") {
                    let id = f.name.nameToId()
                    let l = /idname/g [Symbol.replace](itm, id)
                    if (typeof e[id] !== "undefined") {
                        if (f.type === "tags") {
                            let t = ""
                            if (e[id]) {
                                for (let c of e[id])
                                    t += c + ", "
                                t = t.slice(0, t.length - 2)
                            }
                            h += /title/ [Symbol.replace](l, t)
                        } else
                            h += /title/ [Symbol.replace](l, e[id])
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

            l = /idname/g [Symbol.replace](itm, "Favorite")
            h += /title/ [Symbol.replace](l, e.votes.favorite)
            l = /idname/g [Symbol.replace](itm, "Visited")
            h += /title/ [Symbol.replace](l, e.votes.visited)
            l = /idname/g [Symbol.replace](itm, "Editors-Choice")
            h += /title/ [Symbol.replace](l, e.votes.edchoice)

            h += end + end
        }

        if (!path)
            h += end + end + end
    }

    let loc = $("#id-table")

    if (window.IntersectionObserver) {
        var io = new IntersectionObserver(
            evts => {
                for (let evt of evts) {
                    if (evt.intersectionRatio > 0) {
                        evt.target.src = evt.target.dataset.src
                        io.unobserve(evt.target)
                    }
                }
            }, {
                root: $('#id-table')[0],
                rootMargin: '0px 0px 0px 0px',
                threshold: .1
            }
        )
    }

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
                            if (window.IntersectionObserver) {
                                eloc.find("#img-pic").attr("data-src", url)
                                io.observe(eloc.find("#img-pic")[0])
                            } else
                                eloc.find("#img-pic").attr("src", url)
                        })
                    } else if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            if (s.type === "img") {
                                let ref = bhs.fbstorage.ref().child(thumbnailPath + e[s.name])
                                ref.getDownloadURL().then(url => {
                                    if (window.IntersectionObserver) {
                                        eloc.find("#img-pic").attr("data-src", url)
                                        io.observe(eloc.find("#img-pic")[0])
                                    } else
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

NMSCE.prototype.imgLoaded = function (evt, width, height) {
    let h = evt.naturalHeight
    let w = evt.naturalWidth

    let out = nmsce.calcImgSize(w, h, width, height)

    $(evt).height(out.height)
    $(evt).width(out.width)
}

NMSCE.prototype.calcImgSize = function (width, height, maxw, maxh) {
    let sh = height * maxw / width
    let sw = width * maxh / height

    let oh = height > width ? maxh : sh
    let ow = height > width ? sw : maxw

    if (oh > maxh) {
        ow = ow * maxh / oh
        oh = maxh
    } else if (ow > maxw) {
        oh = oh * maxw / ow
        ow = maxw
    }

    return ({
        height: oh,
        width: ow
    })
}

NMSCE.prototype.setDispImgSize = function (evt) {
    let w = $(evt).width()
    let h = $(evt).height()
    let width = $("#imgcol").width()

    let out = nmsce.calcImgSize(w, h, width, width)

    $("#dispimage").width(out.width)
    $("#dispimage").height(out.height)
}

NMSCE.prototype.showSub = function (id) {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
    loc.find(id).show()
}

NMSCE.prototype.selectList = function (evt) {
    if ($(evt).prop("id") === "row-idname")
        return

    let type = $(evt).closest("[id|='sub']").prop("id").stripID()
    let id = $(evt).prop("id").stripID()
    let i = getIndex(nmsce.entries[type], "id", id)
    let e = nmsce.entries[type][i]

    nmsce.last = e
    nmsce.displaySingle(e)
}

// NMSCE.prototype.buildModal = function (evt) {
//     const row = `  
//         <div id="id-Photo" class="row">
//             <img id="img-pic" class="img-fluid" />
//         </div>
//         <div class="row">`
//     const itm = `   <div id="id-idname" class="col-7">tname: title</div>`
//     const glyph = ` <div id="id-idname" class="col-7">tname: <span id="coords" class="glyph">title</span></div>`
//     const end = `</div>`

//     let loc = $(evt).closest("[id|='sub']")
//     let title = loc.prop("id").stripID().idToName()

//     loc = $("#modal")
//     loc.find(".modal-title").text(title)

//     loc = loc.find(".modal-body")

//     let h = row

//     let items = $(evt).find("[id|='id']")
//     for (let i of items) {
//         let id = $(i).prop("id").stripID()
//         if (id !== "Photo") {
//             let t = $(i).text()
//             if (t) {
//                 let l = /idname/ [Symbol.replace](id === "Coords" ? glyph : itm, id)
//                 l = /tname/ [Symbol.replace](l, id.idToName())
//                 h += /title/ [Symbol.replace](l, t)
//             }
//         }
//     }

//     loc.html(h + end)
// }

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
            <area alt="h3" data-group=1 coords="4,5,9,101,69,130,111,112,112,88,64,34" shape="poly">
            <area alt="h4" data-group=1 coords="45,9,67,28,134,59,210,63,222,17,160,6" shape="poly">
            <area alt="h5" coords="281,2,256,55,283,91,323,91,344,58,330,6" shape="poly">
            <area alt="h6" coords="119,69,118,108,144,109,168,70" shape="poly">
            <area alt="h7" coords="186,68,160,111,175,125,192,125,212,82" shape="poly">
            <area alt="h8" coords="224,66,212,108,230,120,252,121,260,76" shape="poly">
            <area alt="h9" coords="276,98,275,114,340,146,339,98" shape="poly">
            <area alt="h10" data-group=2 coords="4,132,86,161" shape="rect">
            <area alt="h11" data-group=2 coords="91,129,162,160" shape="rect">
            <area alt="h12" data-group=2 coords="174,134,214,163" shape="rect">
            <area alt="h13" coords="249,123,225,143,228,178,258,198,290,186,298,172,329,173,330,149,305,142,283,126" shape="poly">
            <area alt="h14" coords="5,172,55,282" shape="rect">
            <area alt="h15" coords="68,168,195,201" shape="rect">
            <area alt="h19" coords="62,225,60,274,107,266,96,219" shape="poly">
            <area alt="h16" coords="121,206,104,229,112,263,146,279,167,266,173,252,192,259,194,219,174,219,155,204" shape="poly">
            <area alt="h20" coords="244,240,38" shape="circle">
            <area alt="h17" coords="283,196,287,217,282,338,280,370,309,372,304,211,303,197" shape="poly">
            <area alt="h18" coords="331,180,320,255,309,282,310,321,320,332,319,376,334,376,339,303,342,177" shape="poly">
            <area alt="h21" coords="28,290,15,350,85,351,86,322" shape="poly">
            <area alt="h22" coords="98,283,194,328" shape="rect">
            <area alt="h23" coords="222,280,200,291,246,351,176,350,176,376,266,379,267,359,278,342" shape="poly">
            <area alt="h24" coords="8,360,88,406" shape="rect">
            <area alt="h25" coords="93,339,121,399" shape="rect">
            <area alt="h30" coords="126,338,169,381" shape="rect">
            <area alt="h26" coords="11,422,173,442" shape="rect">
            <area alt="h27" coords="142,385,135,396,206,434,250,432,248,412,212,405" shape="poly">
            <area alt="h28" coords="262,385,302,442" shape="rect">
            <area alt="h29" coords="326,383,309,426,308,443,336,440,344,385" shape="poly">
            <area alt="h31" coords="230,6,224,32,238,55,250,54,259,37,251,6" shape="poly">
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
            <area alt="h2" coords="6,10,0,199,37,197,45,185,50,6" shape="poly">
            <area alt="h11" coords="57,-1,56,25,97,31,157,23,151,9" shape="poly">
            <area alt="h29" coords="124,29,124,49,184,64,200,58,192,25,168,24" shape="poly">
            <area alt="h27" coords="200,7,211,49,235,48,238,5" shape="poly">
            <area alt="h25" coords="241,6,240,45,274,47,275,6" shape="poly">
            <area alt="h26" coords="281,13,280,45,306,47,317,26,309,7" shape="poly">
            <area alt="h8" coords="104,51,83,66,83,85,101,102,126,106,187,89,188,72,132,55" shape="poly">
            <area alt="h9" coords="216,55,225,87,307,83,320,101,334,102,333,80,349,10,329,12,308,53" shape="poly">
            <area alt="h7" coords="63,80,80,79,95,136,95,165,82,186,63,189,48,164,48,138" shape="poly">
            <area alt="h12" coords="106,168,127,172,141,161,163,110,147,103" shape="poly">
            <area alt="h10" coords="200,89,181,100,182,114,203,124,298,113,293,92" shape="poly">
            <area alt="h6" coords="203,135,197,183,294,156,300,139,291,122" shape="poly">
            <area alt="h28" coords="304,119,321,109,347,191,336,215,307,164" shape="poly">
            <area alt="h13" coords="46,197,4,216,4,242,40,262,105,261,106,197" shape="poly">
            <area alt="h14" coords="114,190,127,201,189,165,189,149" shape="poly">
            <area alt="h15" coords="124,205,124,217,210,223,210,209" shape="poly">
            <area alt="h16" coords="127,222,116,231,124,249,213,246,209,232,154,231" shape="poly">
            <area alt="h19" coords="216,237,217,248,244,250,261,235,294,246,306,241,270,196,277,171,267,167,232,220" shape="poly">
            <area alt="h18" coords="285,176,281,187,320,243,317,249,299,252,299,264,316,295,348,262,348,241" shape="poly">
            <area alt="h20" coords="6,275,7,362,25,387,84,387,104,368,104,275" shape="poly">
            <area alt="h21" coords="153,260,113,293,115,363,163,393,210,377,226,358,227,295,203,259" shape="poly">
            <area alt="h17" coords="246,267,228,337,271,354,293,346,294,327,348,317,348,303,281,296" shape="poly">
            <area alt="h4" coords="297,350,271,357,270,373,334,383,347,366" shape="poly">
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
            <area alt="h7" coords="43,7,45,63,138,63,118,30,126,3" shape="poly">
            <area alt="h9" coords="140,0,131,26,147,64,230,65,216,31,230,3" shape="poly">
            <area alt="h3" coords="246,3,226,28,248,65,281,72,296,87,322,77,325,25,298,2" shape="poly">
            <area alt="h2" coords="14,66,11,112,148,109,134,66" shape="poly">
            <area alt="h17" coords="10,120,9,173,65,172,62,150,74,119" shape="poly">
            <area alt="h5" coords="98,115,72,132,71,160,117,172,159,170,156,120" shape="poly">
            <area alt="h19" coords="166,116,166,162,202,177,222,178,246,128,202,112" shape="poly">
            <area alt="h6" coords="270,116,251,130,248,163,264,175,323,177,346,146,340,119" shape="poly">
            <area alt="h4" coords="1,195,31,264,54,265,144,206,144,176,67,180" shape="poly">
            <area alt="h18" coords="134,218,168,264,190,265,256,255,260,198" shape="poly">
            <area alt="h8" coords="273,198,272,263,282,267,339,232,332,200" shape="poly">
            <area alt="h13" coords="4,268,119,378" shape="rect">
            <area alt="h14" coords="122,268,193,378" shape="rect">
            <area alt="h15" coords="201,267,271,376" shape="rect">
            <area alt="h16" coords="275,276,276,375,346,378,343,264,294,266" shape="poly">
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
            <area alt="h2" coords="3,4,2,128,77,104,79,12" shape="poly">
            <area alt="h3" coords="90,3,92,119,126,109,152,76,158,42,135,7" shape="poly">
            <area alt="h4" coords="236,19,221,41,277,53,267,95,348,94,347,0" shape="poly">
            <area alt="h5" coords="131,138,145,137,259,78,250,59,218,53,207,31,168,57" shape="poly">
            <area alt="h6" coords="4,137,3,237,76,197,98,157,101,125" shape="poly">
            <area alt="h17" coords="120,148,111,163,127,177,158,172,205,147,199,119,156,144" shape="poly">
            <area alt="h7" coords="97,181,73,251,211,245,220,227,214,212,150,186" shape="poly">
            <area alt="h10" coords="22,237,4,264,23,309,64,311,54,272,61,234" shape="poly">
            <area alt="h11" coords="93,270,92,301,193,300,188,259" shape="poly">
            <area alt="h12" coords="8,315,8,385,73,389,80,317" shape="poly">
            <area alt="h13" coords="90,317,85,388,151,389,159,364,161,319" shape="poly">
            <area alt="h14" coords="170,313,168,389,220,391,228,313" shape="poly">
            <area alt="h15" coords="237,314,236,391,276,399,293,375,272,303" shape="poly">
            <area alt="h16" coords="313,280,297,369,314,396,343,397,348,279" shape="poly">
            <area alt="h8" coords="210,126,236,208,235,244,216,282,230,281,261,236,260,204,233,128" shape="poly">
            <area alt="h9" coords="239,125,251,139,277,148,283,256,257,269,240,278,264,286,291,269,307,242,306,169,293,143,269,123" shape="poly">
            <area alt="h18" coords="293,115,292,131,333,157,327,255,311,266,300,266,292,281,309,289,344,271,348,147,320,117" shape="poly">
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
            <area alt="h2" coords="8,9,60,40" shape="rect">
            <area alt="h5" coords="65,-1,100,39" shape="rect">
            <area alt="h3" coords="110,7,168,41" shape="rect">
            <area alt="h4" coords="190,8,325,77" shape="rect">
            <area alt="h18" coords="4,47,57,86" shape="rect">
            <area alt="h20" coords="64,48,100,87" shape="rect">
            <area alt="h6" coords="108,44,170,85" shape="rect">
            <area alt="h19" coords="6,103,55,152" shape="rect">
            <area alt="h13" coords="64,101,120,156" shape="rect">
            <area alt="h12" coords="122,127,128,155,154,155,186,112,186,95,156,94" shape="poly">
            <area alt="h8" coords="192,89,342,162" shape="rect">
            <area alt="h21" coords="21,159,88,205" shape="rect">
            <area alt="h7" coords="106,171,106,191,112,206,175,223,188,205,182,167,168,156" shape="poly">
            <area alt="h9" coords="28,211,6,260,75,256,96,255,144,240,134,217" shape="poly">
            <area alt="h10" coords="127,251,84,272,87,292,217,290,214,243" shape="poly">
            <area alt="h11" coords="214,171,196,198,199,238,243,242,344,232,341,183" shape="poly">
            <area alt="h2" coords="8,9,60,40" shape="rect">
            <area alt="h5" coords="65,-1,100,39" shape="rect">
            <area alt="h3" coords="110,7,168,41" shape="rect">
            <area alt="h4" coords="190,8,325,77" shape="rect">
            <area alt="h18" coords="4,47,57,86" shape="rect">
            <area alt="h20" coords="64,48,100,87" shape="rect">
            <area alt="h6" coords="108,44,170,85" shape="rect">
            <area alt="h19" coords="6,103,55,152" shape="rect">
            <area alt="h13" coords="64,101,120,156" shape="rect">
            <area alt="h12" coords="122,127,128,155,154,155,186,112,186,95,156,94" shape="poly">
            <area alt="h8" coords="192,89,342,162" shape="rect">
            <area alt="h21" coords="21,159,88,205" shape="rect">
            <area alt="h7" coords="106,171,106,191,112,206,175,223,188,205,182,167,168,156" shape="poly">
            <area alt="h9" coords="28,211,6,260,75,256,96,255,144,240,134,217" shape="poly">
            <area alt="h10" coords="127,251,84,272,87,292,217,290,214,243" shape="poly">
            <area alt="h11" coords="214,171,196,198,199,238,243,242,344,232,341,183" shape="poly">
            <area alt="h23" coords="229,249,273,293" shape="rect">
            <area alt="h22" coords="282,244,342,293" shape="rect">    </map>
    </div>`

const shuttleWingsMap = `
    <div id="map-shuttle-wings">
        <!-- Image Map Generated by http://www.image-map.net/ -->
        <img id="map-image" src="images/shuttle/wings/wings.png" />

        <div id="map-selected"></div>
        <div id="map-hover"></div>
        <img id="map-transparent" src="images/shuttle/wings/blank.png" style="position:absolute" usemap="#shuttle-wings-map" />
            
        <map name="shuttle-wings-map" id="map-areas">
            <area alt="h32" coords="5,10,51,64" shape="rect">
            <area alt="h2" coords="54,13,87,65" shape="rect">
            <area alt="h3" coords="94,15,125,61" shape="rect">
            <area alt="h4" coords="130,22,207,57" shape="rect">    
            <area alt="h10" coords="213,11,213,90,254,64,268,23,270,-1" shape="poly">
            <area alt="h5" coords="282,8,339,60" shape="rect">
            <area alt="h6" coords="5,73,55,131" shape="rect">
            <area alt="h7" coords="62,75,115,130" shape="rect">
            <area alt="h26" coords="128,64,194,117" shape="rect">
            <area alt="h25" coords="251,97,270,107,282,100,290,77,268,62" shape="poly">
            <area alt="h11" coords="296,133,325,131,328,117,341,81,332,65,302,97" shape="poly">
            <area alt="h30" coords="22,138,102,168" shape="rect">
            <area alt="h29" coords="114,144,120,158,154,163,175,154,161,124,126,123" shape="poly">
            <area alt="h9" coords="190,133,228,147,238,142,253,108,215,100,201,123" shape="poly">
            <area alt="h14" coords="254,145,280,144,292,119,270,114" shape="poly">
            <area alt="h8" coords="11,173,83,197" shape="rect">
            <area alt="h22" coords="102,170,166,195" shape="rect">
            <area alt="h17" coords="168,195,178,202,212,176,230,177,230,156,205,147" shape="poly">
            <area alt="h13" coords="241,184,258,194,298,175,290,158,265,161" shape="poly">
            <area alt="h15" coords="306,193,317,197,342,189,338,136,321,135" shape="poly">
            <area alt="h12" coords="4,206,4,229,116,231,152,224,146,199" shape="poly">
            <area alt="h19" coords="15,248,2,271,15,277,62,263,105,261,161,270,152,233,68,235" shape="poly">
            <area alt="h16" coords="21,286,1,298,9,328,160,312,140,297" shape="poly">
            <area alt="h24" coords="231,184,238,190,196,238,243,271,245,282,232,280,179,257,174,228" shape="poly">
            <area alt="h23" coords="240,229,244,241,266,227,335,207,335,197,268,209" shape="poly">
            <area alt="h27" coords="237,249,249,263,278,238,274,228,266,230" shape="poly">
            <area alt="h18" coords="248,267,252,277,340,273,340,259,278,243" shape="poly">
            <area alt="h21" coords="144,276,177,274,190,289,249,287,267,295,271,321,202,323,179,339,150,341,143,325,164,316,166,299,148,289" shape="poly">
            <area alt="h31" coords="280,293,312,336" shape="rect">
            <area alt="h28" coords="320,295,342,329" shape="rect">
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
            <area alt="h4" data-group=1 coords="60,89,11,128,10,142,89,146,184,146,186,125" shape="poly">
            <area alt="h5" data-group=1 coords="14,173,9,303,276,202,297,171,280,125,238,147" shape="poly">
            <area alt="h6" data-group=1 coords="154,255,160,362,333,244,317,182,286,202" shape="poly">
            <area alt="h9" data-group=1 coords="216,332,222,395,340,335,339,253" shape="poly">
            <area alt="h7" data-group=2 coords="36,303,35,335,86,328,88,297" shape="poly">
            <area alt="h8" data-group=2 coords="28,348,32,384,98,379,104,358,73,347" shape="poly">
            <area alt="h10" coords="108,301,98,334,108,351,141,358,151,332,138,309" shape="poly">
            <area alt="h12" data-group=3 coords="9,81,28,87,38,82,30,64,18,62" shape="poly">
            <area alt="h13" data-group=3 coords="39,59,47,90,65,82,65,61,49,53" shape="poly">
            <area alt="h14" data-group=3 coords="76,55,71,85,105,85,94,58" shape="poly">
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

const classList = [{
    name: "S",
}, {
    name: "A",
}, {
    name: "B",
}, {
    name: "C",
}]

const slotList = [{
    name: "T1",
}, {
    name: "T2",
}, {
    name: "T3",
}, ]

const occurenceList = [{
    name: "Nothing Seleted",
}, {
    name: "Frequent",
}, {
    name: "Occasional",
}, {
    name: "Rare",
}, ]

const shipList = [{
    name: "Fighter",
    slotList: slotList,
    // classList: classList,
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    // classTtip: `
    //     C: 5-10% Damage | 0% Shield | 0% Hyperdrive<br>
    //     B: 15-30% Damage | 5-10% Shield | 0% Hyperdrive<br>
    //     A: 35-50% Damage | 15-20% Shield | 0% Hyperdrive<br>
    //     S: 55-60% Damage | 15-25% Shield | 0% Hyperdrive`,
    bodies: fighterBodiesMap,
    wings: fighterWingsMap,
    asymmetric: true,
}, {
    name: "Hauler",
    slotList: slotList,
    // classList: classList,
    slotTtip: `
        T1: 25-31 slots<br>
        T2: 32-39 slots<br>
        T3: 40-48 slots`,
    // classTtip: `
    //     C: 0% Damage | 12-20% Shield | 0-5% Hyperdrive<br>
    //     B: 0-5% Damage | 25-35% Shield | 5-10% Hyperdrive<br>
    //     A: 5-10% Damage | 40-50% Shield | 15-25% Hyperdrive<br>
    //     S: 10-20% Damage | 55-60% Shield | 30-35% Hyperdrive`,
    bodies: haulerBodiesMap,
    wings: haulerWingsMap,
}, {
    name: "Shuttle",
    slotList: [{
        name: "T1"
    }, {
        name: "T2"
    }],
    // classList: classList,
    slotTtip: `
        T1: 18-23 slots<br>
        T2: 19-28 slots`,
    // classTtip: `
    //     C: 0% Damage | 0% Shield | 0% Hyperdrive<br>
    //     B: 0-5% Damage | 0-5% Shield | 0-5% Hyperdrive<br>
    //     A: 5-10% Damage | 5-10% Shield | 5-10% Hyperdrive<br>
    //     S: 15-20% Damage | 15-20% Shield | 15-20% Hyperdrive`,
    bodies: shuttleBodiesMap,
    wings: shuttleWingsMap,
    asymmetric: true,
}, {
    name: "Explorer",
    bodies: explorerBodiesMap,
    slotList: slotList,
    // classList: classList,
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    // classTtip: `
    //     C: 0% Damage | 0% Shield | 7-15% Hyperdrive<br>
    //     B: 0% Damage | 0-8% Shield | 20-30% Hyperdrive<br>
    //     A: 0% Damage | 10-15% Shield | 35-45% Hyperdrive<br>
    //     S: 0% Damage | 20-25% Shield | 50-65% Hyperdrive`
    asymmetric: true,
}, {
    name: "Exotic",
    bodies: exoticBodiesMap,
}]

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

const frigateList = [{
    name: "Combat Specialist",
}, {
    name: "Exploration Specialist",
}, {
    name: "Industrial Specialist",
}, {
    name: "Support Specialist",
}, {
    name: "Trade Specialist",
}, ]

const frigateBenefits = [{
    name: "Ablative Armour"
}, {
    name: "Advanced Maintenance Drones"
}, {
    name: "Advanced Power Distributor"
}, {
    name: "Aggressive Probes"
}, {
    name: "Alcubierre Drive"
}, {
    name: "Ammo Fabricators"
}, {
    name: "Angry Captain"
}, {
    name: "Anomaly Scanner"
}, {
    name: "Antimatter Cycler"
}, {
    name: "Asteroid Scanner"
}, {
    name: "Asteriod Vaporizer"
}, {
    name: "Automatic Investment Engine"
}, {
    name: "AutoTranslator"
}, {
    name: "Cartography Drones"
}, {
    name: "Cloaking Device"
}, {
    name: "Dynamic Ballast"
}, {
    name: "Economy Scanner"
}, {
    name: "Efficient Warp Drive"
}, {
    name: "Experimental Impulse Drive"
}, {
    name: "Experimental Weaponry"
}, {
    name: "Expert Navigator"
}, {
    name: "Extendable Drills"
}, {
    name: "Fauna Analysis Device"
}, {
    name: "Gravitational Visualiser"
}, {
    name: "Generator Grid"
}, {
    name: "Harvester Drones"
}, {
    name: "Hidden Weaponry"
}, {
    name: "Holographic Components"
}, {
    name: "Holographic Displays"
}, {
    name: "HypnoDrones"
}, {
    name: "Interstellar Signal Array"
}, {
    name: "Large Tanks"
}, {
    name: "Laser Drill Array"
}, {
    name: "Local Time Dilator"
}, {
    name: "Long-Distance Sensors"
}, {
    name: "Mass Driver"
}, {
    name: "Massive Guns"
}, {
    name: "Metal Detector"
}, {
    name: "Mind Control Device"
}, {
    name: "Mineral Extractors"
}, {
    name: "Motivated Crew"
}, {
    name: "Negotiation Module"
}, {
    name: "Ore Processing Unit"
}, {
    name: "Overclocked Power Distributor"
}, {
    name: "Oversized Fuel Scoop"
}, {
    name: "Oxygen Recycler"
}, {
    name: "Photon Sails"
}, {
    name: "Planetary Data Scoop"
}, {
    name: "Propaganda Device"
}, {
    name: "Portable Fusion Ignitor"
}, {
    name: "Radio Telescopes"
}, {
    name: "Realtime Archival Device"
}, {
    name: "Reinforced Hull"
}, {
    name: "Remote Market Analyser"
}, {
    name: "Remote Mining Unit"
}, {
    name: "Retrofitted Turrets"
}, {
    name: "Robot Butlers"
}, {
    name: "Robot Crew"
}, {
    name: "Self-Repairing Hull"
}, {
    name: "Solar Panels"
}, {
    name: "Spacetime Anomaly Shielding"
}, {
    name: "Stowaway Botanist"
}, {
    name: "Teleportation Device"
}, {
    name: "Terraforming Beams"
}, {
    name: "Tractor Beam"
}, {
    name: "Trade Analysis Computer"
}, {
    name: "Tremendous Cannons"
}, {
    name: "Tuned Engines"
}, {
    name: "Ultrasonic Weapons"
}, {
    name: "Ultrasonic Welders"
}, {
    name: "Well-Groomed Crew"
}, {
    name: "Wormhole Generator"
}]

const frigateNegatives = [{
    name: "Badly Painted"
}, {
    name: "Clumsy Drill Operator"
}, {
    name: "Cowardly Gunners"
}, {
    name: "Faulty Torpedoes"
}, {
    name: "Fragile Hull"
}, {
    name: "Haunted Radar"
}, {
    name: "Inefficient Engine"
}, {
    name: "Lazy Crew"
}, {
    name: "Leaky Fuel Tubes"
}, {
    name: "Low-Energy Shields"
}, {
    name: "Malfunctioning Drones"
}, {
    name: "Misaligned Sensors"
}, {
    name: "Oil Burner"
}, {
    name: "Outdated Maps"
}, {
    name: "Poorly-Aligned Ballast"
}, {
    name: "Roach Infestation"
}, {
    name: "Rude Captain"
}, {
    name: "Second-Hand Rockets"
}, {
    name: "Small Hold"
}, {
    name: "Small Hoppers"
}, {
    name: "Thief On Board"
}, {
    name: "Thirsty Crew"
}, {
    name: "Uncalibrated Warp Drive"
}, {
    name: "Underpowered Lasers"
}, {
    name: "Wandering Compass"
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
    name: "Civ Capital"
}, {
    name: "Civ Hub"
}, {
    name: "Farm"
}, {
    name: "Garden"
}, {
    name: "Large"
}, {
    name: "Low Orbit"
}, {
    name: "Maze"
}, {
    name: "Point of Interest"
}, {
    name: "Race Track"
}, {
    name: "Under Water"
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

const resourceList = [{
    name: "Magnetised Ferrite"
}, {
    name: "Sodium"
}, {
    name: "Cobalt"
}, {
    name: "Salt"
}, {
    name: "Copper"
}, {
    name: "Cadmium"
}, {
    name: "Emeril"
}, {
    name: "Indium"
}, {
    name: "Paraffinium"
}, {
    name: "Pyrite"
}, {
    name: "Ammonia"
}, {
    name: "Uranium"
}, {
    name: "Dioxite"
}, {
    name: "Phosphorus"
}, {
    name: "Silver"
}, {
    name: "Gold"
}, {
    name: "Sulphurine"
}, {
    name: "Radon"
}, {
    name: "Nitrogen"
}, {
    name: "Activated Copper"
}, {
    name: "Activated Cadmium"
}, {
    name: "Activated Emeril"
}, {
    name: "Activated Indium"
}, {
    name: "Fungal Mould"
}, {
    name: "Frost Crystal"
}, {
    name: "Gamma Root"
}, {
    name: "Cactus Flesh"
}, {
    name: "Solanium"
}, {
    name: "Star Bulb"
}, ]

const colorList = [{
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
    name: "Silver",
}, {
    name: "Tan",
}, {
    name: "Teal",
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
    name: "Bubble Cluster"
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
    name: "Burning Clouds"
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
    name: "Clouds"
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
    name: "Noxious Storms"
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
    name: "Superheated Pockets"
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
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
    }, {
        id: "#id-Economy",
        field: "econ",
        name: "Economy",
        type: "menu",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        imgText: true,
        ttip: "This is required because it is the only unique identifier available to prevent duplicate entries."
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        ttip: "Select ship type to select ship size and parts.",
        required: true,
        search: true,
        sublist: [{
            //     name: "Class",
            //     type: "radio",
            //     ttip: "classTtip",
            //     sub: "classList",
            //     startState: "hidden",
            //     imgText: true,
            //     search: true,
            // }, {
            //     name: "Asymmetric",
            //     type: "checkbox",
            //     sub: "asymmetric",
            //     search: true,
            // }, {
            name: "Slots",
            type: "radio",
            ttip: "slotTtip",
            sub: "slotList",
            imgText: true,
            search: true,
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
        }]
    }, {
        name: "Frequency",
        ttip: "Arrival frequency.",
        type: "menu",
        list: occurenceList,
        imgText: true,
        search: true,
    }, {
        name: "Crashed",
        type: "checkbox",
        onchange: showLatLong,
        imgText: true,
        search: true,
    }, {
        name: "Latitude",
        type: "string",
        startState: "hidden",
        imgText: true,
    }, {
        name: "Longitude",
        type: "string",
        imgText: true,
        startState: "hidden",
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        startState: "hidden",
    }, {
        name: "Planet Index",
        type: "number",
        imgText: true,
        range: 15,
        startState: "hidden",
    }, {
        name: "First Wave",
        ttip: "This is only useful on space stations.",
        type: "checkbox",
        // onchange: showClass,
        imgText: true,
        search: true,
    }, {
        name: "Color",
        type: "tags",
        list: colorList,
        max: 4,
        required: true,
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
    }]
}, {
    name: "Freighter",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
    }, {
        id: "#id-Economy",
        field: "econ",
        name: "Economy",
        type: "menu",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Slots",
        type: "number",
        searchType: ">=",
        search: true,
    }, {
        name: "Color",
        type: "tags",
        list: colorList,
        max: 2,
        required: true,
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
    name: "Frigate",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
    }, {
        id: "#id-Economy",
        field: "econ",
        name: "Economy",
        type: "menu",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Type",
        type: "menu",
        list: frigateList,
        search: true,
    }, {
        name: "Benefits",
        type: "tags",
        list: frigateBenefits,
        ttip: "You can only search using Benefits, Negatives OR Color. Not a combination.",
        search: true,
    }, {
        name: "Negatives",
        type: "tags",
        list: frigateNegatives,
        ttip: "You can only search using Benefits, Negatives OR Color. Not a combination.",
        search: true,
    }, {
        name: "Color",
        type: "tags",
        list: colorList,
        max: 2,
        ttip: "You can only search using Benefits, Negatives OR Color. Not a combination.",
        required: true,
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }, ]
}, {
    name: "Multi-Tool",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
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
        imgText: true,
        search: true,
    }, {
        name: "Class",
        type: "menu",
        list: classList,
        // ttipFld: "classTtip",
        imgText: true,
        search: true,
    }, {
        name: "Slots",
        type: "number",
        search: true,
        searchType: ">="
    }, {
        name: "Space Station",
        type: "checkbox",
        search: true,
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
        name: "Color",
        type: "tags",
        max: 2,
        list: colorList,
        required: true,
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
}, {
    name: "Fauna",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        required: true,
        imgText: true,
        ttip: "Name is used to prevent duplicate entries.  It is the only unique identifier."
    }, {
        name: "Genus",
        type: "menu",
        list: faunaList,
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
        searchType: ">="
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        search: true,
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
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
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
        name: "Resources",
        type: "tags",
        list: resourceList,
        ttip: "You can only search using Resources or Tags not both at the same time.",
        max: 6,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        ttip: "You can only search using Resources or Tags not both at the same time.",
        max: 4,
        search: true,
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
        name: "Player",
        type: "text",
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
    }, {
        id: "#id-Platform",
        field: "platform",
        name: "Platform",
        type: "menu",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "text",
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "glyph",
        type: "glyph",
    }, {
        id: "#id-sys",
        field: "sys",
        name: "System",
        type: "text",
    }, {
        id: "#id-Economy",
        field: "econ",
        name: "Economy",
        type: "menu",
    }],
    fields: [{
        name: "Name",
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
        name: "Tags",
        type: "tags",
        max: 4,
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];