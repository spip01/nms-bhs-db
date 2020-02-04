'use strict'

// Copyright 2019-2020 Black Hole Suns
// Written by Stephen Piper

var nmsce
const displayPath = "/nmsce/disp/"
const originalPath = "/nmsce/orig/"
const thumbPath = "/nmsce/disp/thumb/"
const redditPath = "/nmsce/reddit/"

$(document).ready(() => {
    startUp()

    $("#cemenus").load("cemenus.html", () => {
        let loc = fnmsce ? $("#searchpage") : fcedata ? $("#entrypage") : []
        if (loc.length > 0) {
            loc.css("border-color", "red")
            loc.css("border-width", "3px")
        }
    })

    nmsce = new NMSCE()
    nmsce.last = null

    if (!fpreview) {
        nmsce.logo = new Image()
        nmsce.logo.crossOrigin = "anonymous"
        nmsce.logo.src = "/images/nmsce-logo.png"

        nmsce.buildPanels()
        nmsce.buildTypePanels()

        if (fnmsce) {
            nmsce.getNew()
            nmsce.getFeatured()
        }

        $("#save").click(async () => {
            nmsce.save()
        })

        $("#delete").click(() => {
            $("#status").empty()

            if (nmsce.last)
                nmsce.deleteEntry(nmsce.last)
        })
    }

    //https://localhost:5000/preview.html?i=0547-0086-0E45-00A1-himodan-s-coup&g=Euclid&t=Ship
    let passed = {}
    let param = location.search.substring(1).split("&")

    for (let p of param) {
        if (p) {
            let obj = p.split("=")
            passed[unescape(obj[0])] = obj[1] ? unescape(obj[1]) : true
        }
    }

    if (passed.i && passed.g && passed.t) {
        let ref = bhs.fs.doc("nmsce/" + passed.g.nameToId() + "/" + passed.t + "/" + passed.i)
        ref.get().then(doc => {
            if (doc.exists) {
                if (fnmsce || fpreview)
                    nmsce.displaySelected(doc.data())
                else if (fcedata)
                    nmsce.displaySingle(doc.data())
            }
        })
    }
})

function NMSCE() {

}

NMSCE.prototype.buildPanels = function () {
    const addRadioList = function (loc, label, list, ttip) {
        let h = /ifreq/ [Symbol.replace](tRadio, "")
        h = /idname/g [Symbol.replace](h, label.nameToId())
        h = /ttip/g [Symbol.replace](h, ttip ? ttip : "")
        h = /title/g [Symbol.replace](h, label)

        loc.append(h)
        loc = loc.find("#list")
        h = ""

        for (let i of list) {
            let l = /ifreq/ [Symbol.replace](tRadioItem, "")
            l = /idname/g [Symbol.replace](l, label.nameToId())
            l = /title/g [Symbol.replace](l, i.name)
            l = /tname/ [Symbol.replace](l, i.name.nameToId())

            if (i.ttip) {
                l = /ttip/ [Symbol.replace](l, tText)
                l = /ttext/ [Symbol.replace](l, i.ttip)
            } else
                l = /ttip/ [Symbol.replace](l, "")

            h += l
        }

        loc.append(h)
    }

    addRadioList($("#id-Economy"), "Economy", economyListTier)
    addRadioList($("#id-Lifeform"), "Lifeform", lifeformList)
    addRadioList($("#id-Platform"), "Platform", platformListAll)

    if (fnmsce) {
        let ref = bhs.fs.collection("nmsce")
        ref.get().then(snapshot => {
            let galaxyList = []
            for (let doc of snapshot.docs) {
                galaxyList.push({
                    name: doc.ref.id
                })
            }

            bhs.buildMenu($("#panels"), "Galaxy", galaxyList, null, {
                required: true,
                labelsize: "col-md-6 col-4",
                menusize: "col",
            })
        })
    } else
        bhs.buildMenu($("#panels"), "Galaxy", galaxyList, null, {
            tip: "Empty - blue<br>Harsh - red<br>Lush - green<br>Normal - teal",
            required: true,
            labelsize: "col-md-6 col-4",
            menusize: "col",
        })

    addGlyphButtons($("#glyphbuttons"), nmsce.addGlyph)
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
        let pnl = $("#panels")

        nmsce.dispAddr(pnl, addr)

        if (!fnmsce) {
            nmsce.lastsys = null

            bhs.getEntry(addr, nmsce.displaySystem, null, null, true).then(entry => {
                nmsce.lastsys = entry
                if (!entry)
                    bhs.getEntryByRegionAddr(addr, nmsce.displayRegion)
            })
        }
    }
}

NMSCE.prototype.dispAddr = function (pnl, addr) {
    let glyph = addrToGlyph(addr)
    let loc = pnl.find("#id-glyphInput")
    loc.find("#id-addr").text(addr)
    loc.find("#id-glyph").val(glyph)
    loc.find("#id-hex").text(glyph)

    loc = pnl.find("#id-addrInput")
    loc.find("#id-addr").val(addr)
    loc.find("#id-glyph").text(glyph)
    loc.find("#id-hex").text(glyph)
}

NMSCE.prototype.displayRegion = function (entry) {
    if (entry.reg) {
        let loc = $("#panels")
        loc.find("#id-reg").val(entry.reg)
        loc.find("#foundreg").show()
    }
}

NMSCE.prototype.displaySystem = function (entry) {
    let loc = $("#panels")

    loc.find("#foundsys").show()
    if (entry.reg)
        loc.find("#foundreg").show()
    else
        loc.find("#foundreg").hide()

    $("#btn-Galaxy").text(entry.galaxy)

    nmsce.dispAddr(loc, entry.addr)

    loc.find("#id-sys").val(entry.sys)
    loc.find("#id-reg").val(entry.reg)

    loc.find("#id-by").html("<h6>" + entry.sys ? entry._name : "" + "</h6>")

    if (!entry.Economy && entry.econ) {
        let i = getIndex(economyList, "name", entry.econ)
        if (i > 0) {
            let econ = economyList[i].number
            entry.Economy = "T" + econ
        }
    }

    if (!entry.Platform && (entry.platform || bhs.user.Platform)) {
        if (bhs.user.Platform)
            entry.Platform = bhs.user.Platform
        else if (entry.platform === "PC-XBox")
            entry.Platform = "PC"
        else
            entry.Platform = "PS4"
    }

    const setRadio = function (loc, val) {
        loc.find(".radio").prop("checked", false)
        loc.find("#rdo-" + val).prop("checked", true)
    }

    setRadio($("#id-Economy"), entry.Economy)
    setRadio($("#id-Lifeform"), entry.Lifeform)
    setRadio($("#id-Platform"), entry.Platform)
}

NMSCE.prototype.showSearchPanel = function (evt) {
    if ($(evt).prop("checked")) {
        $("#searchPanel").css("display", "inherit")

        let loc = $("#typePanels .active")
        loc = loc.find("#menu-Type")
        if (loc.length > 0) {
            let btn = loc.find("[id|='btn']")
            if (btn.text().stripMarginWS() === "")
                loc.find("[id|='item']").first().click()
        }
    } else
        $("#searchPanel").hide()
}

NMSCE.prototype.expandPanels = function (show) {
    if (show) {
        $('[data-hide=true]').hide()
        $('[data-allowhide=true]').show()
    } else {
        $('[data-hide=true]').show()
        $('[data-allowhide=true]').hide()
    }
}

NMSCE.prototype.displayUser = function () {
    if (bhs.user.uid && fcedata) {
        nmsce.restoreText(bhs.user.imageText)
        if (typeof nmsce.entries === "undefined")
            nmsce.getEntries()

        nmsce.expandPanels(bhs.user.nmscesettings && bhs.user.nmscesettings.expandPanels || (!bhs.user.galaxy || fcedata && (!bhs.user._name || !bhs.user.Platform)))
    } else if (fnmsce) {
        if (bhs.user.uid)
            nmsce.getMyFavorites()
        else if (typeof (Storage) !== "undefined" && !bhs.user.galaxy)
            bhs.user.galaxy = window.localStorage.getItem('nmsce-galaxy')

        if (!bhs.user.galaxy)
            bhs.user.galaxy = "Euclid"
    }

    let loc = $("#row-playerInput")
    if (fcedata)
        loc.find("#id-Player").val(bhs.user._name)

    loc.find("#btn-Galaxy").text(bhs.user.galaxy)

    loc = loc.find("#id-Platform")
    loc.find("input").prop("checked", false)
    if (bhs.user.Platform)
        loc.find("#rdo-" + bhs.user.Platform).prop("checked", true)

    loc = $("#row-playerDisplay")
    loc.find("#id-Player").text(bhs.user._name)
    loc.find("#id-Galaxy").text(bhs.user.galaxy)
    loc.find("#id-Platform").text(bhs.user.Platform)

    $("#searchlocaltt").hide()

    nmsce.getSearches()
}

NMSCE.prototype.clearPanel = function (all, savelast) {
    const clr = (pnl) => {
        pnl.find("input").each(function () {
            let id = $(this).prop("id").stripID()
            if (id === "glyphs" || id === "PC" || id === "XBox" || id === "PS4" || fcedata && id === "Player")
                return

            let type = $(this).prop("type")
            if (type === "checkbox")
                $(this).prop("checked", false)
            else if (type === "radio") {
                $(this).prop("checked", false)
                $(this).data("last", false)
            } else
                $(this).val("")
        })

        pnl.find("[id|='menu']").each(function () {
            let id = $(this).prop("id").stripID()
            if ((!fcedata || all || id !== "Type") && id != "Galaxy")
                $(this).find("[id|='btn']").text("")
        })
    }

    clr($("#typePanels"))

    if (all) {
        let loc = $("#panels")
        loc.find("#foundreg").hide()
        loc.find("#foundsys").hide()
        loc.find("#id-by").empty()

        loc.find("#id-glyphInput #id-addr").empty()
        loc.find("#id-glyphInput #id-hex").empty()
        loc.find("#id-addrInput #id-glyph").empty()
        loc.find("#id-addrInput #id-hex").empty()

        clr($("#panels"))

        if (fnmsce)
            $("#id-Player").val("")
    }

    let loc = $("#pnl-map [id|='map']")
    loc.data("selected", false)
    loc.find("*").css("stroke", "#808080")

    loc = $("#typePanels #hdr-Ship")
    loc.find("#row-Latitude").hide()
    loc.find("#row-Longitude").hide()
    loc.find("#row-Planet-Index").hide()
    loc.find("#row-Planet-Name").hide()
    loc.find("#row-Class").hide()

    $("#id-ssImage").hide()
    $("#id-ssImage").attr("src", "")
    $("#redditlink").val("")
    $("#posted").empty()
    $("#editScreenshot").hide()
    $("#imageTextBlock").show()
    $("#updateScreenshot").hide()

    let tags = $("[data-type='tags']")

    for (let loc of tags) {
        let id = $(loc).prop("id").stripID()

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

        $("#delete").addClass("disabled")
        $("#delete").prop("disabled", true)

        $("#reddit").addClass("disabled")
        $("#reddit").prop("disabled", true)
    }
}

NMSCE.prototype.extractEntry = function () {
    let entry = {}
    let ok = true

    let loc = $("#panels")

    let last = nmsce.lastsys ? nmsce.lastsys : nmsce.last

    if (last) {
        entry._name = last._name
        entry.uid = last.uid
        entry.created = last.created
        entry.Platform = last.Platform
        entry.platform = last.Platform === "PS4" ? "PS4" : last.Platform === "PC" || last.Platform === "XBox" ? "PC-XBox" : ""
        entry.galaxy = last.galaxy
    } else {
        entry._name = bhs.user._name
        entry.uid = bhs.user.uid
        entry.Platform = bhs.user.Platform
        entry.platform = entry.Platform === "PS4" ? "PS4" : entry.Platform === "PC" || entry.Platform === "XBox" ? "PC-XBox" : ""
        entry.galaxy = bhs.user.galaxy
    }

    entry.version = "beyond"
    entry.page = "nmsce"

    loc = $("#panels")
    entry.addr = loc.find("#id-addr").val()
    entry.sys = loc.find("#id-sys").val()
    entry.reg = loc.find("#id-reg").val()

    loc = loc.find("#row-Lifeform :checked")
    if (loc.length > 0) {
        entry.Lifeform = loc.prop("id").stripID()
        entry.life = entry.Lifeform
    }

    loc = $("#panels").find("#row-Economy :checked")
    if (loc.length > 0)
        entry.Economy = loc.prop("id").stripID()

    entry.xyzs = addressToXYZ(entry.addr)
    let err = bhs.validateAddress(entry.addr)
    if (err) {
        bhs.status(err, true)
        ok = false
    }

    if (ok) {
        if (!last || last.uid === bhs.user.uid || bhs.isRole("admin")) {
            if (!last || entry.sys !== last.sys || entry.reg !== last.reg || entry.life !== last.life || entry.Economy !== last.Economy)
                bhs.updateEntry(entry)
        } else {
            bhs.status(bhs.user._name + " is not creator of " + entry.addr + " " + entry.sys, true)
            ok = false
        }
    }

    if (ok) {
        delete entry.created

        if (nmsce.last) {
            entry.created = nmsce.last.created
            entry.id = nmsce.last.id
            entry.Photo = nmsce.last.Photo
            entry._name = nmsce.last._name
            entry.uid = nmsce.last.uid
        }

        let tab = $("#typeTabs .active").prop("id").stripID()
        let pnl = $("#typePanels #pnl-" + tab)
        entry.type = tab

        let list = pnl.find("[id|='row']")
        for (let rloc of list) {
            let loc = $(rloc)
            if (!loc.is(":visible"))
                continue

            let id = loc.prop("id").stripID()
            let data = loc.data()

            if (typeof data === "undefined")
                continue

            switch (data.type) {
                case "number":
                case "float":
                case "string":
                    entry[id] = loc.find("input").val()
                    break
                case "tags":
                    let tloc = loc.find("[id|='tag']")
                    entry[id] = []

                    for (let loc of tloc) {
                        let t = $(loc).prop("id").stripID().idToName()
                        if (t && !entry[id].includes(t))
                            entry[id].push(t)
                    }
                    break
                case "menu":
                    entry[id] = loc.find("[id|='btn']").text().stripMarginWS()
                    if (entry[id] === "Nothing Selected")
                        entry[id] = ""
                    break
                case "checkbox":
                    entry[id] = loc.find("input").prop("checked")
                    break
                case "radio":
                    loc = loc.find(":checked")
                    if (loc.length > 0)
                        entry[id] = loc.prop("id").stripID().nameToId()
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
                        case "checkbox":
                        case "radio":
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
    }

    if (ok) {
        let loc = $("#pnl-map [id|='row']")
        for (let row of loc) {
            if ($(row).is(":visible")) {
                let id = $(row).prop("id").stripID()
                entry[id] = {}
                entry[id + "-name"] = {}

                let items = $(row).find("g[id|='map']")
                for (let i of items) {
                    let data = $(i).data()

                    if (data && data.selected) {
                        let iid = $(i).prop("id").stripID()
                        let title = $(i).find("title").text()
                        entry[id][iid] = true
                        entry[id + "-name"][iid] = title
                    }
                }
            }
        }

        entry.redditlink = $("#redditlink").val()
        entry.imageText = bhs.user.imageText

        if (!nmsce.last || nmsce.last.uid === bhs.user.uid || bhs.isRole("admin")) {
            nmsce.updateEntry(entry)

            if (!nmsce.last || nmsce.last.uid === bhs.user.uid) {
                if (typeof nmsce.entries === "undefined")
                    nmsce.entries = {}
                if (typeof nmsce.entries[entry.type.nameToId()] === "undefined")
                    nmsce.entries[entry.type.nameToId()] = {}

                nmsce.entries[entry.type.nameToId()][entry.id] = entry
                nmsce.displayListEntry(entry)
            }

            nmsce.updateScreenshots(entry)

            bhs.status(entry.type + " " + entry.Name + " validated, saving...")
            $("#imgtable").hide()
        } else {
            bhs.status(bhs.user._name + " is not creator of " + entry.type + " " + entry.Name)
            ok = false
        }
    }

    return ok
}

NMSCE.prototype.displaySingle = function (entry) {
    nmsce.clearPanel(true, true)
    nmsce.last = entry

    $('html, body').animate({
        scrollTop: $('#typeTabs').offset().top
    }, 500)

    let tloc = $("#tab-" + entry.type.nameToId())
    tloc.click()

    $("#panels #foundreg").hide()
    $("#panels #foundsys").hide()

    if (!entry.Lifeform && entry.life)
        entry.Lifeform = entry.life

    if (!entry.Economy && entry.econ) {
        let i = getIndex(economyList, "name", entry.econ)
        if (i > 0 && economyList[i].number > 0)
            entry.Economy = "T" + economyList[i].number
    } else if (typeof entry.Economy === "number")
        entry.Economy = "T" + entry.Economy

    nmsce.displaySystem(entry)

    let link = "https://nmsce.com/preview.html?i=" + entry.id + "&g=" + entry.galaxy.nameToId() + "&t=" + entry.type.nameToId()
    $("#permalink").attr("href", link)

    let disp = function (flds, pnltype, pnl) {
        pnl = pnl ? pnl : $("#typePanels " + pnltype)
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
                    for (let t of entry[id]) {
                        let h = /idname/ [Symbol.replace](tTag, t.nameToId())
                        h = /title/ [Symbol.replace](h, t)
                        row.find("#list-" + id).append(h)
                    }
                    break
                case "menu":
                    row.find("#item-" + entry[id].nameToId()).click()

                    if (fld.sublist)
                        disp(fld.sublist, pnltype, pnl.find("#slist-" + entry[id].nameToId()))
                    break
                case "radio":
                    if (entry[id]) {
                        row.find("input").prop("checked", false)
                        row.find("#rdo-" + entry[id].nameToId()).prop("checked", true)
                    }
                    break
                case "checkbox":
                    if (entry[id] !== row.find("input").prop("checked"))
                        row.find("input").click()
                    break
                case "map":
                    let map = $("#pnl-map " + pnltype + " [id|='slist']:visible #row-" + id)

                    let list = Object.keys(entry[id])
                    for (let i of list)
                        mapSelect(map.find("#map-" + i), true)
                    break
            }
        }
    }

    let idx = getIndex(objectList, "name", entry.type)
    let obj = objectList[idx]

    disp(obj.fields, "#pnl-" + entry.type)

    if (entry.imageText)
        bhs.user.imageText = entry.imageText

    nmsce.loadScreenshot(null, entry.Photo)

    $("#redditlink").val(entry.redditlink ? entry.redditlink : "")

    $("#save").text("UPDATE")

    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")

    $("#reddit").removeClass("disabled")

    $("#reddit").removeAttr("disabled")
    let date = e.reddit ? typeof e.reddit === "boolean" ? "Posted" : typeof e.reddit.toDate != "undefined" ? e.reddit.toDate().toDateLocalTimeString() : "" : ""
    $("#posted").html(date)
}

NMSCE.prototype.displaySearch = function (search) {
    nmsce.clearPanel(true, true)

    $("#btn-Galaxy").text(search.galaxy)
    $("#ck-notify").prop("checked", search.notify)
    $("#searchname").text(search.name)

    let tloc = $("#pnl-" + search.type.nameToId())
    tloc.click()

    for (let itm of search.search) {
        let loc = itm.id ? $("#panels " + itm.id) : tloc.find("#row-" + itm.name.nameToId())
        switch (itm.type) {
            case "number":
            case "float":
            case "string":
                loc.find("#id-" + itm.name.nameToId()).val(itm.val)
                break
            case "menu":
                if (itm.name === "Type")
                    loc.find("#item-" + itm.val.nameToId()).click()
                else
                    loc.find("#btn-" + (itm.id ? itm.id.stripID() : itm.name.nameToId())).text(itm.val)
                break
            case "checkbox":
                loc.find("#ck-" + itm.val).prop("checked", true)
                break
            case "radio":
                loc.find("#rdo-" + itm.val).prop("checked", true)
                break
            case "tags":
                for (let i of itm.list)
                    loc.find("#item-" + i.nameToId()).click()
                break
            case "map":
                let map = $("#pnl-map #pnl-" + itm.page)
                if (itm.Type)
                    map = map.find("#slist-" + itm.Type)
                map = map.find("#row-" + itm.name)

                for (let i of list)
                    mapSelect(map.find("#map-" + i), true)
                break
        }
    }
}

NMSCE.prototype.executeSearch = function (search) {
    $("#status").empty()

    let s = nmsce.lastsearch = search
    if (!s || s.search === []) {
        bhs.status("No search selection.")
        return
    }

    $("#numFound").text("searching...")
    $("body")[0].style.cursor = "wait"

    let ref = bhs.fs.collection("nmsce/" + s.galaxy + "/" + s.type)

    let firstarray = 0
    let arraylist = []

    for (let q of s.search) {
        switch (q.type) {
            case "tags":
                arraylist.push(q)

                if (firstarray++ === 0)
                    ref = ref.where(q.name, "array-contains-any", q.list)
                break
            case "map":
                for (let i of q.list)
                    ref = ref.where(q.name + "." + i, "==", true)
                break
            default:
                ref = ref.where(q.name, q.query ? q.query : "==", q.val)
                break
        }
    }

    if (!bhs.user.uid)
        ref = ref.limit(50)

    $("#id-Search-Results").empty()
    let list = nmsce.resultLists["Search-Results"] = {}

    ref.get().then(snapshot => {
        if (snapshot.size === 0) {
            bhs.status("No matching entries found.<br>Try specifying fewer things. Everything you specify has to match in order to find an item.")
            $("#numFound").text("0")
            $("body")[0].style.cursor = "default"
            return
        }

        if (!bhs.user.uid && snapshot.size === 50)
            bhs.status("Showing first 50 matches. Login to see more matches or modify search to see better matches.")

        let nfound = 0

        for (let doc of snapshot.docs) {
            let e = doc.data()
            let found = true

            for (let l of arraylist) {
                for (let t of l.list) {
                    if (!e[l.name].includes(t)) {
                        found = false
                        break
                    }
                }

                if (!found)
                    break
            }

            if (found) {
                nfound++
                list[e.type.nameToId() + "-" + e.id] = e
            }
        }

        if (nfound) {
            nmsce.displayResultList("Search-Results")
            nmsce.selDisplay("#item-Search-Results")

            $('html, body').animate({
                scrollTop: $('#resultshdr').offset().top
            }, 500)
        }

        bhs.status(nfound + " matching entries found.")

        $("body")[0].style.cursor = "default"

        if (!bhs.user.uid) {
            if (typeof (Storage) !== "undefined") {
                window.localStorage.setItem('nmsce-galaxy', $("#btn-Galaxy").text().stripNumber())

                s.uid = window.localStorage.getItem('nmsce-tempuid')
                if (!s.uid) {
                    s.uid = uuidv4()
                    window.localStorage.setItem('nmsce-tempuid', s.uid)
                }
            }
        } else {
            search.uid = bhs.user.uid
            search._name = bhs.user._name
        }

        s.results = nfound
        search.date = firebase.firestore.Timestamp.now()
        search.page = window.location.pathname

        let sref = bhs.fs.collection("nmsce-searches")
        sref.add(s)
    })
}

NMSCE.prototype.searchEntriesList = function () {
    $("#status").empty()

    let s = nmsce.lastsearch = nmsce.extractSearch()
    if (!s || s.search === []) {
        bhs.status("No search selection.")
        return
    }

    let list = nmsce.entries[s.type.nameToId()]
    if (list.length === 0) {
        bhs.status("No search results.")
        return
    }

    $("body")[0].style.cursor = "wait"
    let loc = $("#list-" + s.type.nameToId())

    nmsce.showSub("#sub-" + s.type.nameToId())
    nmsce.searchList(s, list, loc)
}

NMSCE.prototype.refineSearch = function () {
    $("#status").empty()

    let s = nmsce.lastsearch = nmsce.extractSearch()
    if (!s || s.search === []) {
        bhs.status("No search selection.")
        return
    }

    let list = nmsce.resultLists["Search-Results"]
    if (list.length === 0) {
        bhs.status("No search reslts to refine.")
        return
    }

    $("#numFound").text("searching...")
    $("body")[0].style.cursor = "wait"
    let loc = $("#resultLists #id-Search-Results")

    nmsce.searchList(s, list, loc)
}

NMSCE.prototype.searchList = function (s, list, loc) {
    let nfound = 0;

    for (let l of Object.keys(list)) {
        let e = list[l]
        let ok = true

        for (let q of s.search) {
            ok = e[q.name]

            if (!ok)
                break

            switch (q.type) {
                case "tags":
                    for (let l of q.list)
                        if (!e[q.name].includes(l))
                            ok = false
                    break
                case "map":
                    for (let l of q.list)
                        if (!e[q.name][l])
                            ok = false
                    break
                case "checkbox":
                    ok = e[q.name] === q.val
                    break
                default:
                    ok = q.query === ">=" ? e[q.name] >= q.val : e[q.name] === q.val
                    break
            }

            if (!ok)
                break
        }

        let id = "#row-" + (e.type + "-" + e.id).nameToId()
        if (ok) {
            loc.find(id).show()
            nfound++
        } else
            loc.find(id).hide()
    }

    $("body")[0].style.cursor = "default"

    $('html, body').animate({
        scrollTop: loc.offset().top
    }, 500)

    bhs.status(nfound + " matching entries found.")

    if (!bhs.user.uid) {
        if (typeof (Storage) !== "undefined")
            s.uid = window.localStorage.getItem('nmsce-tempuid')
    } else
        s.uid = bhs.user.uid

    s.date = firebase.firestore.Timestamp.now()
    s.refine = true
    let sref = bhs.fs.collection("nmsce-searches")
    sref.add(s)
}

NMSCE.prototype.saveSearch = function () {
    let search = nmsce.extractSearch()
    search.saved = true
    search.page = window.location.pathname

    if (!bhs.user.uid) {
        if (typeof (Storage) !== "undefined") {
            window.localStorage.setItem('nmsce-galaxy', $("#btn-Galaxy").text().stripNumber())

            search.uid = window.localStorage.getItem('nmsce-tempuid')
            if (!search.uid) {
                search.uid = uuidv4()
                window.localStorage.setItem('nmsce-tempuid', search.uid)
            }

            window.localStorage.setItem('nmsce-search', JSON.stringify(search))
            bhs.status("Search saved.", true)
        }
    } else {
        search.uid = bhs.user.uid
        search._name = bhs.user._name
        search.email = bhs.user.email
        search.date = firebase.firestore.Timestamp.now()
        search.notify = $("#ck-notify").prop("checked")

        if (search.name) {
            let ref = bhs.fs.doc("users/" + bhs.user.uid + "/nmsce-saved-searches/" + search.name.nameToId())
            ref.set(search, {
                merge: true
            }).then(() => bhs.status(search.name + " saved.", true))
        } else {
            bhs.status("No save name specified.")
            return
        }

        let i = -1
        if (nmsce.searchlist)
            i = getIndex(nmsce.searchlist, "name", search.name)
        else
            nmsce.searchlist = []

        if (i !== -1)
            nmsce.searchlist[i] = search
        else {
            nmsce.searchlist.push(search)

            let loc = $("#menu-Saved")
            if (loc.find("#list").length > 0) {
                let item
                if (loc.first("[id|='item]").is("li"))
                    item = `<li id="item-idname" class="dropdown-item" type="button" style="rgbcolor cursor: pointer">iname</li>`
                else
                    item = `<button id="item-idname" class="dropdown-item border-bottom" type="button" style="rgbcolor cursor: pointer">iname</button>`

                let h = /idname/ [Symbol.replace](item, search.name.nameToId())
                h = /iname/ [Symbol.replace](h, search.name)

                let lloc = loc.find("#list")
                lloc.append(h)
                loc = loc.find("#item-" + search.name.nameToId())
                bhs.bindMenuChange(loc, nmsce.executeSaved)
            } else
                bhs.buildMenu($("#entrybuttons"), "Saved", nmsce.searchlist, nmsce.executeSaved, {
                    sort: true,
                    labelsize: "col-2",
                    menusize: "col"
                })
        }
    }
}

NMSCE.prototype.deleteSearch = function () {
    if (bhs.user.uid) {
        let name = $("#searchname").val()

        if (!name) {
            bhs.status("No search name provided.")
            return
        }

        let i = getIndex(nmsce.searchlist, "name", name)

        if (i !== -1) {
            let ref = bhs.fs.doc("users/" + bhs.user.uid + "/nmsce-saved-searches/" + name.nameToId())
            ref.delete().then(() => {
                bhs.status(name + " search deleted.", true)

                nmsce.searchlist.splice(i, 1)
                let loc = $("#menu-Saved #item-" + name.nameToId())
                loc.remove()

            })
        } else {
            bhs.status("Named search not found.", true)
        }
    }
}

NMSCE.prototype.getSearches = function () {
    if (!bhs.user.uid)
        return

    let ref = bhs.fs.collection("users/" + bhs.user.uid + "/nmsce-saved-searches")
    ref = ref.where("uid", "==", bhs.user.uid)

    ref.get().then(snapshot => {
        nmsce.searchlist = []
        for (let doc of snapshot.docs) {
            let s = doc.data()
            nmsce.searchlist.push(s)
        }

        if (nmsce.searchlist.length > 0)
            bhs.buildMenu($("#entrybuttons"), "Saved", nmsce.searchlist, nmsce.executeSaved, {
                sort: true
            })
    }).catch(err => console.log(err.message))
}

NMSCE.prototype.executeSaved = function (evt) {
    let name = $(evt).text().stripMarginWS()
    let i = getIndex(nmsce.searchlist, "name", name)

    if (i !== -1) {
        nmsce.displaySearch(nmsce.searchlist[i])
        if (fnmsce)
            nmsce.executeSearch(nmsce.searchlist[i])
        else
            nmsce.searchEntriesList()
    }
}

NMSCE.prototype.searchLocal = function (evt) {
    if (typeof (Storage) !== "undefined") {
        let s = window.localStorage.getItem('nmsce-search')

        if (s) {
            s = JSON.parse(s)

            nmsce.displaySearch(s)
            nmsce.executeSearch(s)
        }
    }
}

NMSCE.prototype.extractSearch = function (fcn) {
    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let s = {}
    s.search = []
    let search = s.search

    if (!galaxy) {
        bhs.status("No Galaxy Selected.")
        return null
    }

    let tab = $("#typeTabs .active").prop("id").stripID()
    let pnl = $("#typePanels #pnl-" + tab)

    s.galaxy = galaxy
    s.type = tab

    let name = $("#searchname").val()
    if (name)
        s.name = name

    let obj = null
    let i = getIndex(objectList, "name", tab)
    if (i > -1)
        obj = objectList[i]

    for (let fld of obj.imgText) {
        if (fld.name === "Galaxy" || fcedata && fld.name === "Player")
            continue

        let loc = $(fld.id)

        let val = ""

        switch (fld.type) {
            case "menu":
                val = loc.find("#btn-" + fld.id.stripID()).text().stripNumber()
                break
            case "radio":
                loc = loc.find(":checked")
                if (loc.length > 0)
                    val = loc.prop("id").stripID()
                break
            default:
                val = loc.val()
                break
        }

        if (val !== "") {
            search.push({
                name: fld.field,
                type: fld.type,
                id: fld.id,
                val: val
            })
        }
    }

    let list = pnl.find("[id|='row']")

    for (let rloc of list) {
        let loc = $(rloc)
        if (!loc.is(":visible"))
            continue

        let rdata = loc.data()

        if (typeof rdata === "undefined")
            continue

        let val

        let itm = {}
        itm.name = loc.prop("id").stripID()
        itm.type = rdata.type
        if (rdata.search)
            itm.query = rdata.search

        switch (rdata.type) {
            case "number":
            case "float":
                val = loc.find("input").val()
                if (val && val != -1) {
                    itm.val = val
                    search.push(itm)
                }
                break
            case "string":
                val = loc.find("input").val()
                if (val) {
                    itm.val = val
                    search.push(itm)
                }
                break
            case "tags":
                let tlist = []

                for (let tloc of loc.find("[id|='tag']")) {
                    let t = $(tloc).prop("id").stripID().idToName()
                    if (t && !tlist.includes(t))
                        tlist.push(t)
                }

                if (tlist.length > 0) {
                    itm.list = tlist
                    search.push(itm)
                }
                break
            case "menu":
                val = loc.find("#btn-" + itm.name).text().stripMarginWS()
                if (val) {
                    val = val.stripNumber()
                    if (val !== "Nothing Selected") {
                        itm.val = val
                        search.push(itm)
                    }
                }
                break
            case "checkbox":
                if (fcedata) {
                    val = loc.find("input").prop("checked")
                    if (val) {
                        itm.val = val
                        search.push(itm)
                    }
                } else {
                    loc = loc.find(":checked")
                    if (loc.length > 0) {
                        itm.val = loc.prop("id").stripID() === "True"
                        search.push(itm)
                    }
                }
                break
            case "radio":
                loc = loc.find(":checked")
                if (loc.length > 0) {
                    itm.val = loc.prop("id").stripID()
                    search.push(itm)
                }
                break
        }
    }

    let loc = $("#pnl-map [id|='row']")
    for (let row of loc) {
        if ($(row).is(":visible")) {
            let list = []

            let items = $(row).find("g[id|='map']")
            for (let i of items) {
                let data = $(i).data()
                if (data && data.selected)
                    list.push($(i).prop("id").stripID())
            }
            let t = $(row).closest("[id|='slist']")
            if (list.length > 0) {
                let type = $(row).closest("[id|='slist']")
                search.push({
                    name: $(row).prop("id").stripID(),
                    Type: type.length > 0 ? type.prop("id").stripID() : null,
                    page: $(row).closest("[id|='pnl']").prop("id").stripID(),
                    type: "map",
                    list: list
                })
            }
        }
    }

    return s
}

NMSCE.prototype.searchSystem = function () {
    if (!nmsce.last)
        return

    nmsce.selDisplay("#item-Search-Results")
    $("#numFound").text("searching...")

    let p = []

    for (let t of objectList) {
        let ref = bhs.fs.collection("nmsce/" + nmsce.last.galaxy + "/" + t.name)
        ref = ref.where("addr", "==", nmsce.last.addr)
        p.push(ref.get().then(snapshot => {
            return snapshot
        }))
    }

    Promise.all(p).then(res => {
        let list = nmsce.resultLists["Search-Results"] = {}
        let nfound = 0

        for (let snapshot of res) {
            for (let doc of snapshot.docs) {
                let e = doc.data()
                list[e.type.nameToId() + "-" + e.id] = e
                nfound++
            }
        }

        nmsce.displayResultList("Search-Results")
        bhs.status(nfound + " matching entries found.")

        if (nfound) {
            nmsce.selDisplay("#item-Search-Results")

            $('html, body').animate({
                scrollTop: $('#resultshdr').offset().top
            }, 500)
        }

        $("body")[0].style.cursor = "default"
    })
}

NMSCE.prototype.save = function () {
    $("#status").empty()
    let ok = bhs.user.uid

    if (!nmsce.last || nmsce.last.uid === bhs.user.uid) {
        let user = nmsce.extractUser()
        ok = bhs.validateUser(user)

        bhs.user = mergeObjects(bhs.user, user)
        bhs.user.imageText = nmsce.extractImgText()

        let ref = bhs.getUsersColRef(bhs.user.uid)
        ref.set(bhs.user, {
            merge: true
        }).then().catch(err => {
            bhs.status("ERROR: " + err)
        })
    }

    if (ok && nmsce.extractEntry())
        nmsce.clearPanel()
}

NMSCE.prototype.extractUser = function () {
    let loc = $("#panels")
    let u = {}

    u.version = "beyond"
    u._name = loc.find("#id-Player").val()
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber()

    loc = loc.find("#id-Platform :checked")
    if (loc.length > 0)
        u.Platform = loc.prop("id").stripID()

    u.platform = u.Platform === "PS4" ? "PS4" : u.Platform === "PC" || u.Platform === "XBox" ? "PC-XBox" : ""

    if (fcedata) {
        u.nmscesettings = {}
        u.nmscesettings.expandPanels = $("#hidden").is(":visible")
    }

    return u
}

NMSCE.prototype.search = function () {
    let search = nmsce.extractSearch()
    nmsce.executeSearch(search)
}

blackHoleSuns.prototype.status = function (str, clear) {
    if (clear)
        $("#status").empty()

    $("#status").append("<h6>" + str + "</h6>")
}

let nav = `<a class="nav-item nav-link txt-def h6 rounded-top active" 
    style="border-color:black;" 
    id="tab-idname" data-toggle="tab" href="#hdr-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">
    title
</a>`
let header = `
    <div id="hdr-idname" class="tab-pane active" role="tabpanel" aria-labelledby="tab-idname">
        <div id="pnl-idname" class="row"></div>
    </div>`
let mapHeader = `<div id="pnl-idname" class="border rounded" style="display:none;"></div>`
const tSubList = `<div id="slist-idname" class="row pl-10" style="display:none"></div>`

const tReq = `&nbsp;<font style="color:red">*</font>`
const tText = `&nbsp;
    <span data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
        <i class="fa fa-question-circle-o text-danger h6"></i>
    </span>`

const inpHdr = `<div class="col-lg-7 col-14" data-allowhide="ihide">`
const inpLongHdr = `<div class="col-14" data-allowhide="ihide">`
const inpEnd = `</div>`

const tString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row">
        <div class="col-4 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tMap = `<div id="row-idname" class="col-14" data-type="map"></div>`
const tLongString = `
    <div id="row-idname" data-type="string" data-allowhide="ihide" data-req="ifreq" class="row">
        <div class="col-4  pl-15 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-9">
    </div>`
const tNumber = `
    <div id="row-idname" data-type="number" data-allowhide="ihide" data-req="ifreq" data-search="stype" class="row">
        <div class="col-4 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-5" min=-1 max=range value=-1>
    </div>`
const tFloat = `
    <div id="row-idname" data-type="float" data-allowhide="ihide" data-req="ifreq" data-search="stype" class="row">
        <div class="col-4 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-5" step=0.1 min=-1 max=range value=-1>
    </div>`
const tTags = `
    <div id="row-idname" class="row" data-type="tags" data-allowhide="ihide" data-req="ifreq">
        <div id="id-idname" class="col-4"></div>
        <div id="add-idname" class="col-10 row hidden">
            <input id="txt-idname" type="text" class="col-7"></input>
            <button id="add-idname" type="text" class="col-2 btn btn-def btn-sm" onclick="nmsce.newTag(this)">Add</button>
            <button id="cancel-idname" type="text" class="col-3 btn btn-def btn-sm" onclick="nmsce.cancelTag(this)">Cancel</button>
        </div>
        <div class="col-10 border">
            <div id="list-idname" class="row"></div>
        </div>
    </div>`
const tTag = `<div id="tag-idname" class="border pointer h5" style="border-radius:8px; background-color:#d0d0d0" onclick="nmsce.deleteTag(this)">&nbsp;title&nbsp;<i class="far fa-times-circle" style="color:#ffffff;"></i>&nbsp;</div>&nbsp;`
const tMenu = `
    <div id="row-idname" data-type="menu" data-allowhide="ihide" data-req="ifreq">
        <div id="id-idname"></div>
    </div>`
const tRadio = `
    <div id="row-idname" data-type="radio" data-allowhide="ihide" data-req="ifreq" class="row">
        <div class="radio col-4 txt-inp-def">titlettip&nbsp;</div>
        <div class="col-10">
            <div id="list" class="row"></div>
        </div>
    </div>`
const tRadioItem = `
    <label class="col txt-inp-def">
        <input type="radio" class="radio row" id="rdo-tname" data-last=false onclick="nmsce.toggleRadio(this)">
            &nbsp;titlettip
    </label>`
const tCkItem = `
    <div id="row-idname" data-type="checkbox" data-allowhide="ihide" data-req="false">
        <label id="id-idname" class=" txt-inp-def row pl-10">
            titlettip&nbsp
            <input id="ck-idname" type="checkbox">
        </label>
    </div>`
const tImg = `
    <div id="row-idname" data-req="ifreq" data-type="img" class="row">
        <div class="col-4 txt-inp-def">titlettip&nbsp;</div>
        <input id="id-idname" type="file" class="col-10 form-control form-control-sm" 
            accept="image/*" name="files[]"  data-type="img" onchange="nmsce.loadScreenshot(this)">&nbsp
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
            h = /active/ [Symbol.replace](h, "")
        pnl.append(h)

        h = /idname/g [Symbol.replace](mapHeader, id)
        if (first)
            h = /display:none/g [Symbol.replace](h, "")
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

        nmsce.setMapSize(mloc)
    })
}

NMSCE.prototype.addPanel = function (list, pnl, itmid, slist, pid) {
    let appenditem = (loc, add, title, id, ttip, req, long, hide) => {
        let l = /ihide/g [Symbol.replace](long ? long : inpHdr, hide ? true : false)
        let h = l

        l = /title/g [Symbol.replace](add, title + (req ? tReq : ""))

        if (ttip) {
            l = /ttip/ [Symbol.replace](l, tText)
            l = /ttext/ [Symbol.replace](l, ttip)
        } else
            l = /ttip/ [Symbol.replace](l, "")

        l = /idname/g [Symbol.replace](l, id)
        l = /ifreq/ [Symbol.replace](l, req ? true : false)
        l = /ihide/g [Symbol.replace](l, hide ? true : false)

        h += l + inpEnd
        loc.append(h)
    }

    let loc, itm = $("#" + pnl + "-" + itmid)
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
                l = /stype/ [Symbol.replace](l, f.query ? f.query : "")
                appenditem(itm, l, f.name, id, f.ttip, f.required, null, f.inputHide)
                break
            case "float":
                l = /range/ [Symbol.replace](tFloat, f.range)
                l = /stype/ [Symbol.replace](l, f.query ? f.query : "")
                appenditem(itm, l, f.name, id, f.ttip, f.required, null, f.inputHide)
                break
            case "img":
                appenditem(itm, tImg, f.name, id, f.ttip, f.required, inpLongHdr, f.inputHide)
                break
            case "checkbox":
                if (fnmsce) {
                    appenditem(itm, tRadio, f.name, id, f.ttip, null, null, f.inputHide)

                    let ckloc = itm.find("#row-" + id)
                    ckloc.attr("data-type", "checkbox")
                    ckloc = ckloc.find("#list")

                    let l = /title/g [Symbol.replace](tRadioItem, "True")
                    l = /ttip/g [Symbol.replace](l, "")
                    l = /idname/g [Symbol.replace](l, "True")
                    l = /tname/g [Symbol.replace](l, "True")
                    ckloc.append(l)

                    l = /title/g [Symbol.replace](tRadioItem, "False")
                    l = /ttip/g [Symbol.replace](l, "")
                    l = /idname/g [Symbol.replace](l, "False")
                    l = /tname/g [Symbol.replace](l, "False")
                    ckloc.append(l)
                } else {
                    appenditem(itm, tCkItem, f.name, id, f.ttip, f.required, null, f.inputHide)

                    if (f.onchange)
                        itm.find("#ck-" + id).change(f.onchange)
                }
                break
            case "string":
                appenditem(itm, tString, f.name, id, f.ttip, f.required, null, f.inputHide)
                if (f.onchange)
                    itm.find("#id-" + id).change(f.onchange)
                break
            case "long string":
                appenditem(itm, tLongString, f.name, id, f.ttip, f.required, inpLongHdr, f.inputHide)
                break
            case "blank":
                itm.append(inpHdr + inpEnd)
                break
            case "menu":
                appenditem(itm, tMenu, "", id, null, null, null, f.inputHide)
                let lst = itm.find("#row-" + id)

                if (f.ttip)
                    f.tip = slist ? slist[f.ttip] : f.ttip

                f.labelsize = "col-5"
                f.menusize = "col"

                bhs.buildMenu(lst, f.name, f.sub ? slist[f.sub] : f.list, f.sublist ? nmsce.selectSublist : null, f)

                if (f.sublist) {
                    for (let s of f.list) {
                        let iid = s.name.nameToId()
                        appenditem(itm, tSubList, s.name, iid, null, null, inpLongHdr, f.inputHide)

                        let loc = $("#pnl-map #" + itm.prop("id"))
                        let l = /idname/ [Symbol.replace](tSubList, s.name.nameToId())
                        loc.append(l)

                        nmsce.addPanel(f.sublist, "slist", iid, s, itmid)
                    }
                }
                break
            case "tags":
                appenditem(itm, tTags, "", id, f.ttip, f.required, inpLongHdr, f.inputHide)
                loc = itm.find("#row-" + id)
                if (f.max)
                    loc.data("max", f.max)

                if (f.list) {
                    bhs.buildMenu(loc, f.name, f.list, nmsce.addTag, {
                        nolabel: true,
                        ttip: f.ttip,
                        sort: true,
                        required: f.required
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
                        bhs.buildMenu(loc, f.name, tags, nmsce.addTag, {
                            nolabel: true,
                            ttip: f.ttip
                        })

                        loc.find("#btn-" + id).text(f.name)
                    })
                }
                break
            case "radio":
                let list = []
                if (f.list) {
                    appenditem(itm, tRadio, f.name, id, f.ttip, f.required, null, f.inputHide)
                    list = f.list
                } else if (slist[f.sub]) {
                    appenditem(itm, tRadio, f.name, id, typeof slist[f.ttip] === "string" ? slist[f.ttip] : null, f.required, null, f.inputHide)
                    list = slist[f.sub]
                }

                loc = itm.find("#row-" + id + " #list")

                for (let i of list) {
                    let l = /title/g [Symbol.replace](tRadioItem, i.name)
                    l = /ttip/ [Symbol.replace](l, i.ttip ? "&nbsp;" + i.ttiip : "")
                    l = /idname/g [Symbol.replace](l, id)
                    l = /tname/g [Symbol.replace](l, i.name.nameToId())
                    loc.append(l)

                    if (fcedata && i.default) {
                        loc.find("#rdo-" + i.name).prop("checked", true)
                    }
                }
                break
            case "map":
                if (f.map || slist && slist[f.sub]) {
                    let iid = itmid.nameToId()
                    let loc = $("#pnl-map #pnl-" + (pid ? pid + " #slist-" + slist.name.nameToId() : iid))

                    iid = f.name.nameToId()
                    l = /idname/ [Symbol.replace](tMap, iid)
                    loc.append(l)

                    nmsce.loadMap(loc.find("#row-" + iid), f.map ? f.map : slist[f.sub])
                }
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
    let tags = row.find("[id|='tag']")

    if (data.max && tags.length >= data.max) {
        row.find("#btn-" + id).text(id.idToName())
        return
    }

    if (tags.length > 0)
        for (let t of tags)
            if ($(t).prop("id").stripID() === text) {
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
    }
}

NMSCE.prototype.deleteTag = function (evt) {
    if (fnmsce) {
        let row = $(evt).closest("[id|='row']")
        let id = row.prop("id").stripID()
        let list = row.find("#list-" + id)
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

NMSCE.prototype.toggleRadio = function (evt) {
    let data = $(evt).data()

    if (data.last) {
        $(evt).prop("checked", false)
        $(evt).data("last", false)
    } else {
        let loc = $(evt).closest("#list").find("input")
        loc.prop("checked", false)
        $(evt).prop("checked", true)
        $(evt).data("last", true)
    }

    return false
}

function showLatLong() {
    let loc = $("#typePanels #hdr-Ship")
    if ($(this).prop("checked")) {
        loc.find("#row-Latitude").show()
        loc.find("#row-Longitude").show()
        loc.find("#row-Planet-Index").show()
        loc.find("#row-Planet-Name").show()
        loc.find("#row-Class").show()
    } else {
        loc.find("#row-Latitude").hide()
        loc.find("#row-Longitude").hide()
        loc.find("#row-Planet-Index").hide()
        loc.find("#row-Planet-Name").hide()
        loc.find("#row-Class").hide()
    }
}

NMSCE.prototype.setMapSize = function (loc) {
    let maps = loc.find("[id|='row']:visible")
    for (let l of maps) {
        let svg = $(l).find("svg")
        let svgw = parseInt(svg.attr("width"))
        let svgh = parseInt(svg.attr("height"))

        let h = $("#panels").height()
        let w = $(l).width()
        let size = nmsce.calcImgSize(svgw, svgh, w, h / 2, true)

        svg.attr("preserveAspectRatio", "xMidYMid meet")
        svg.attr("width", size.width)
        svg.attr("height", size.height)
    }
}

NMSCE.prototype.loadMap = function (loc, fname) {
    loc.load(fname, () => {
        let bdr = loc.find("[id|='bdr']")
        bdr.css("stroke-opacity", "0")
        let map = loc.find("[id|='map']")
        map.find("*").css("stroke", "#404040")

        bdr.click(function () {
            mapSelect(this)
        })

        bdr.mouseenter(function () {
            mouseEnter(this)
        })

        bdr.mouseleave(function () {
            mouseLeave(this)
        })
    })
}

function mapSelect(evt, set) {
    let id = $(evt).prop("id").stripID()
    let loc = $(evt).closest("[id|='row']").find("#map-" + id)
    let data = loc.data()

    if (set || typeof set === "undefined" && (!data || !data.selected)) {
        loc.data("selected", true)
        loc.find("*").css("stroke", "#0000ff")
    } else {
        loc.data("selected", false)
        loc.find("*").css("stroke", "#404040")
    }
}

function mouseEnter(evt) {
    let id = $(evt).prop("id").stripID()
    let loc = $(evt).closest("[id|='row']").find("#map-" + id)
    loc.find("*").css("stroke", "#b00000")
}

function mouseLeave(evt) {
    let id = $(evt).prop("id").stripID()
    let loc = $(evt).closest("[id|='row']").find("#map-" + id)
    let data = loc.data()

    if (!data || !data.selected)
        loc.find("*").css("stroke", "#404040")
    else
        loc.find("*").css("stroke", "#0000ff")
}

NMSCE.prototype.selectSublist = function (btn) {
    $("[id|='slist']").hide()

    let id = btn.text().stripMarginWS().nameToId()
    $("[id='slist-" + id + "']").show()

    let type = btn.closest("[id|='pnl']").prop("id").stripID()
    let mloc = $("#pnl-map #pnl-" + type + " #slist-" + id)

    nmsce.setMapSize(mloc)
}

let txtcanvas = document.createElement('canvas')

NMSCE.prototype.loadImgText = function (clear) {
    const ckbox = `
        <label class="col-xl-p333 col-7">
            <input id="ck-idname" type="checkbox" ftype loc row sub onchange="nmsce.getImageText(this, true)">
            &nbsp;title
        </label>`

    const textInp = `
        <div class="row">
            <button type="button" class="col-4 btn btn-def btn-sm" onclick="nmsce.selectGlyphs()">
                Select Glyphs
            </button>&nbsp;
            <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                data-placement="bottom"
                title="Select glyphs on image and display under coordinate input. Location is saved for future use.">
            </i>&nbsp;
            <label class="col txt-inp-def">
                <input id="ck-saveglyphloc" type="checkbox" onchange="nmsce.toggleGlyphs(this)">
                Apply Saved Location&nbsp;
                <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                    data-placement="bottom"
                    title="Use saved glyph location when opening new images.">
                </i>&nbsp;
            </label>
        </div>
        <br>
        <div class="row">
            <label class="col-5 txt-inp-def pl-30">
                <input id="ck-mylogo" type="checkbox" data-loc="#id-mylogo" data-type="img"
                        onchange="nmsce.getImageText(this, true)">
                        Load Overlay&nbsp;
                    <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                    data-placement="bottom"
                    title="Load a 2nd image as an overlay. You can resize and move the 2nd image."></i>&nbsp;
            </label>
            <input id="id-mylogo" type="file" class="col-9 form-control form-control-sm" 
                accept="image/*" name="files[]" onchange="nmsce.loadMyLogo(this)">&nbsp
        </div>
        <br>
        <div class="row">
            <label class="col-5 txt-inp-def pl-30">
                <input id="ck-text" type="checkbox" data-loc="#id-text"
                    onchange="nmsce.getImageText(this, true)">
                Text&nbsp;
                <i class="fa fa-question-circle-o text-danger h6" data-toggle="tooltip" data-html="false"
                    data-placement="bottom"
                    title="Use Line break, <br>, to separate multiple lines.">
                </i>&nbsp;
            </label>
            <input id="id-text" class="rounded col-9" type="text" onchange="nmsce.getImageText(this, true)">
        </div>
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

    if (!nmsce.imageText || nmsce.imageText.logo === "undefined")
        nmsce.initTxtItem("logo")

    if (nmsce.imageText.mylogo === "undefined")
        nmsce.initTxtItem("mylogo")

    if (nmsce.imageText.selGlyph === "undefined")
        nmsce.initTxtItem("selGlyph")

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
        sort: true
    })
}

NMSCE.prototype.initTxtItem = function (id) {
    if (typeof nmsce.imageText === "undefined")
        nmsce.imageText = {}

    if (typeof nmsce.imageText[id] === "undefined")
        nmsce.imageText[id] = {}

    if (id === "logo" || id === "mylogo" || id === "selGlyph") {
        nmsce.imageText[id] = {
            x: 20,
            y: 20,
            fSize: 0,
            sel: false,
            width: 0,
            height: 0,
            type: "img",
            id: id
        }
    } else
        nmsce.imageText[id] = {
            font: id === "Glyphs" ? "glyph" : "Arial",
            fSize: 24,
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

NMSCE.prototype.getImageText = function (evt, draw) {
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

        switch (data.type) {
            case "menu":
                loc = loc.find("[id|='btn']")
                text = loc.text().stripNumber()
                break
            case "tags":
                loc = loc.find("[id|='tag']")
                if (loc.length > 0) {
                    for (let l of loc)
                        text += $(l).prop("id").stripID().idToName() + ", "

                    text = text.slice(0, text.length - 2)
                }
                break
            case "number":
                text = loc.find("input").val()
                text = text === -1 ? "" : text.toString()
                break
            case "float":
                text = loc.find("input").val()
                text = text === -1 ? "" : text.toString()
                break
            case "glyph":
                text = loc.val()
                loc = $("#typePanels .active #id-Planet-Index")
                let num = loc.length > 0 && loc.val() > 0 ? loc.val() : 0
                text = addrToGlyph(text, num)
                break
            case "checkbox":
                loc = loc.find("[id|='ck']")
                if (loc.prop("checked"))
                    text = loc.prop("id").stripID()
                break
            case "radio":
                loc = loc.find(":checked")
                if (loc.length > 0)
                    text = loc.prop("id").stripID() + " " + loc.closest("[id|='row']").prop("id").stripID()
                break
            default:
                if (loc.is("input"))
                    text = loc.val()
                else
                    text = loc.find("input").val()
                break
        }

        nmsce.imageText[id].text = text
        nmsce.imageText[id].ck = true
        for (let k of Object.keys(nmsce.imageText))
            nmsce.imageText[k].sel = false
        nmsce.imageText[id].sel = true
        nmsce.imageText[id].sel = true
        if (data.type !== "img" && text)
            nmsce.imageText[id] = nmsce.measureText(nmsce.imageText[id])
    } else {
        nmsce.imageText[id].ck = false
        nmsce.imageText[id].sel = false
    }

    if (draw)
        nmsce.drawText()
}

NMSCE.prototype.restoreText = function (iTxt, draw) {
    if (iTxt)
        nmsce.imageText = iTxt

    if (typeof nmsce.imageText === "undefined")
        return

    if (typeof nmsce.imageText.selGlyph === "undefined")
        nmsce.initTxtItem("selGlyph")
    // else if (nmsce.imageText.selGlyph.ck)
    //     nmsce.dispGlyph()

    if (typeof nmsce.imageText.logo === "undefined")
        nmsce.initTxtItem("logo")

    nmsce.imageText.logo.type = "img" // restore saved data might not be set

    if (typeof nmsce.imageText.mylogo === "undefined")
        nmsce.initTxtItem("mylogo")

    let loc = $("#img-text")

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let f = nmsce.imageText[id]

        if (id === "text" && f.text)
            loc.find("#id-text").val(f.text)

        let floc = loc.find("#ck-" + id)

        if (floc.length > 0) {
            floc.prop("checked", f.ck)
            nmsce.getImageText(floc)
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

        if (f.type !== "img") {
            delete f.width
            delete f.height
        }

        if (k !== "text")
            delete f.text

        delete f.img
        delete f.resize
        delete f.sel
    }

    return s
}

NMSCE.prototype.loadMyLogo = function (evt) {
    let file = evt.files[0]
    let reader = new FileReader()

    reader.onload = function () {
        let txt = nmsce.imageText.mylogo
        let img = txt.img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = function () {
            if (typeof txt.width === "undefined" || txt.width === 0) {
                txt.height = txtcanvas.height * .1
                txt.width = img.naturalWidth * txt.height / img.naturalHeight
            } else {
                let scale = Math.min(txt.width / img.naturalWidth, txt.height / img.naturalHeight)
                txt.height = img.naturalHeight * scale
                txt.width = img.naturalWidth * scale
            }

            $("#ck-" + txt.id).prop("checked", true)
            nmsce.drawText()
        }

        img.src = reader.result
    }

    reader.readAsDataURL(file)
}

NMSCE.prototype.loadScreenshot = function (evt, fname, edit) {
    let img = $("#imgtable")
    img.show()

    if (evt) {
        let file = evt.files[0]
        if (file) {
            nmsce.loadImgText()
            nmsce.restoreText(bhs.user.imageText)

            let reader = new FileReader()
            reader.onload = function () {
                nmsce.screenshot = new Image()
                nmsce.screenshot.crossOrigin = "anonymous"

                nmsce.screenshot.onload = function () {
                    $("#editScreenshot").hide()
                    $("#id-ssImage").hide()
                    $("#id-canvas").show()
                    $("#imageTextBlock").show()
                    if (nmsce.last) {
                        $("#updateScreenshot").show()
                        $("#ck-updateScreenshot").prop("checked", true)
                    }

                    nmsce.loadImgText()
                    nmsce.restoreText(nmsce.last ? nmsce.last.imageText : nmsce.imageText)
                    nmsce.drawText()

                    $('html, body').animate({
                        scrollTop: $('#imgtable').offset().top
                    }, 500)
                }

                nmsce.screenshot.src = reader.result
            }

            reader.readAsDataURL(file)
        }
    } else {
        if (edit) {
            $("#editScreenshot").hide()
            $("#imageTextBlock").show()
            $("#updateScreenshot").show()
            $("#ck-updateScreenshot").prop("checked", false)
            $("#id-ssImage").hide()
            $("#id-canvas").show()

            nmsce.loadImgText()
            nmsce.restoreText(nmsce.last.imageText)
        } else {
            $("#editScreenshot").show()
            $("#imageTextBlock").hide()
            $("#updateScreenshot").hide()
            $("#id-canvas").hide()
            $("#id-ssImage").show()
        }

        let img = new Image()
        img.crossOrigin = "anonymous"

        bhs.fbstorage.ref().child((edit ? originalPath : displayPath) + fname).getDownloadURL().then(url => {
            if (edit) {
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
            } else
                $("#id-ssImage").attr("src", url)
        })
    }

    img = img.find("#id-canvas")

    img.mouseout(e => {
        nmsce.handleMouseOut(e)
    })
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

NMSCE.prototype.editScreenshot = function () {
    if (nmsce.last)
        nmsce.loadScreenshot(null, nmsce.last.Photo, true)
}

var mfLoc

NMSCE.prototype.measureText = function (t) {
    if (t.type === "img")
        return t

    if (!mfLoc)
        mfLoc = $("#measurefont")

    mfLoc.css("font", t.fSize + "px " + t.font)
    mfLoc.html(t.text)

    t.width = mfLoc.width()
    t.height = mfLoc.height()

    mfLoc.text(t.text)
    t.lineheight = mfLoc.height()

    return t
}

NMSCE.prototype.setColor = function (evt) {
    let color = $(evt).val()

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]

        if (text.sel && text.type !== "img")
            text.color = color
    }

    nmsce.drawText()
}

NMSCE.prototype.setSize = function (evt) {
    let size = parseInt($(evt).val())

    let keys = Object.keys(nmsce.imageText)
    for (let id of keys) {
        let text = nmsce.imageText[id]

        if (text.sel && text.type !== "img") {
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

        if (text.sel && text.type !== "img") {
            text.font = id === "Glyphs" ? "glyph" : font
            text = nmsce.measureText(text)
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.drawText = function (alt, altw) {
    let canvas = alt ? alt : document.getElementById("id-canvas")
    let width = $("#id-img").width()
    let sw = nmsce.screenshot.naturalWidth
    let sh = nmsce.screenshot.naturalHeight

    if (sh > sw) { // vertical
        txtcanvas.height = Math.min(width, sh)
        txtcanvas.width = sw * txtcanvas.height / sh

        canvas.height = Math.min(altw ? altw : width, sw)
        canvas.width = sw * canvas.height / sh
    } else {
        txtcanvas.width = Math.min(width, sw)
        txtcanvas.height = sh * txtcanvas.width / sw

        canvas.width = Math.min(altw ? altw : width, sw)
        canvas.height = sh * canvas.width / sw
    }

    let lh = txtcanvas.height * .1
    nmsce.imageText.logo.width = lh
    nmsce.imageText.logo.height = lh

    if ($("#imageTextBlock").is(":visible")) {
        let ctx = txtcanvas.getContext("2d")
        ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

        let loc = $("#img-text")
        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            let text = nmsce.imageText[id]
            let tloc = loc.find("#ck-" + id)

            if (text.ck && tloc.is(":visible") || text.type === "img") {
                if (text.x + text.width > txtcanvas.width)
                    text.x = txtcanvas.width - text.width
                else if (text.x < 0)
                    text.x = 0

                if (text.type !== "img") {
                    if (text.y + text.height - text.lineheight > txtcanvas.height)
                        text.y = txtcanvas.height - text.height + text.lineheight
                    else if (text.y - text.lineheight < 0)
                        text.y = text.lineheight
                } else {
                    if (text.y + text.height > txtcanvas.height)
                        text.y = txtcanvas.height - text.height
                    else if (text.y < 0)
                        text.y = 0
                }

                if (id === "Glyphs") {
                    text.font = "glyph"

                    ctx.fillStyle = text.color
                    ctx.fillRect(text.x - 2, text.y - text.height, text.width + 4, text.height + 4)
                    ctx.fillStyle = "#000000"
                    ctx.fillRect(text.x - 1, text.y - text.height + 1, text.width + 2, text.height + 2)
                }

                if (text.type !== "img") {
                    ctx.font = text.fSize + "px " + text.font
                    ctx.fillStyle = text.color

                    if (typeof text.text !== "undefined" && text.text.includes("<br>")) {
                        let l = text.text.split("<br>")

                        for (let i = 0; i < l.length; ++i)
                            ctx.fillText(l[i], text.x, text.y + i * text.fSize * 1.15)
                    } else
                        ctx.fillText(text.text, text.x, text.y)
                }
                if (text.ck && tloc.is(":visible") && id === "mylogo" && text.img)
                    ctx.drawImage(text.img, text.x, text.y, text.width, text.height)

                if (text.sel && !altw) {
                    ctx.strokeStyle = "white"
                    ctx.setLineDash([2, 2])
                    ctx.beginPath()
                    ctx.rect(text.x - 1, text.y - text.fSize + 1, text.width + 1, text.height + 1)
                    ctx.stroke()
                }
            }
        }

        ctx.drawImage(nmsce.logo, nmsce.imageText.logo.x, nmsce.imageText.logo.y, nmsce.imageText.logo.width, nmsce.imageText.logo.height)
    }

    let ctx = canvas.getContext("2d")
    ctx.drawImage(nmsce.screenshot, 0, 0, canvas.width, canvas.height)

    if ($("#imageTextBlock").is(":visible"))
        ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.editSelected = function (evt) {
    let e = nmsce.last

    if (e && bhs.user.uid && (bhs.user.uid === e.uid || bhs.hasRole("admin"))) {
        let link = "https://" + window.location.hostname + "/cedata.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()
        window.open(link, "_self")
    }
}

NMSCE.prototype.redditShare = function () {
    if ($("#id-ssImage").is(":visible")) {
        bhs.fbstorage.ref().child(displayPath + nmsce.last.Photo).getDownloadURL().then(url => {
            var xhr = new XMLHttpRequest()
            xhr.responseType = 'blob'
            xhr.onload = function (event) {
                var blob = xhr.response

                let name = uuidv4()
                bhs.fbstorage.ref().child(redditPath + name).put(blob).then(() => {
                    bhs.fbstorage.ref().child(redditPath + name).getDownloadURL().then(url => {
                        let u = "http://www.reddit.com/submit?url=" + encodeURI(url)
                        window.open(u)
                    })
                })
            }

            xhr.open('GET', url)
            xhr.send()
        })
    } else {
        let disp = document.createElement('canvas')
        nmsce.drawText(disp, 1024)
        disp.toBlob(blob => {
            let name = uuidv4()
            bhs.fbstorage.ref().child(redditPath + name).put(blob).then(() => {
                bhs.fbstorage.ref().child(redditPath + name).getDownloadURL().then(url => {
                    let u = "http://www.reddit.com/submit?url=" + encodeURI(url)
                    window.open(u)
                })
            })

        }, "image/jpeg", .8)
    }

    let ref = bhs.fs.doc("nmsce/" + nmsce.last.galaxy + "/" + nmsce.last.type + "/" + nmsce.last.id)
    ref.set({
        reddit: firebase.firestore.Timestamp.now()
    }, {
        merge: true
    }).then(() => $("#posted").text("Posted"))
}

NMSCE.prototype.selectGlyphs = function () {
    nmsce.imageText.selGlyph.sel = true
    nmsce.imageText.selGlyph.width = 0
    nmsce.imageText.selGlyph.height = 0
    nmsce.imageText.selGlyph.ck = true
    $("#ck-saveglyphloc").prop("checked", true)

    delete nmsce.startX
    delete nmsce.startY
}

NMSCE.prototype.toggleGlyphs = function (evt) {
    nmsce.imageText.selGlyph.ck = $(evt).prop("checked")
    nmsce.dispGlyph()
}

NMSCE.prototype.dispGlyph = function () {
    let row = $("#row-glyphCanvas")

    if (!nmsce.imageText.selGlyph.ck || !nmsce.screenshot) {
        row.hide()
        return
    }

    let text = nmsce.imageText.selGlyph
    text.sel = false

    row.show()

    let ss = document.createElement('canvas')
    let ctx = ss.getContext("2d")
    ss.width = nmsce.screenshot.naturalWidth
    ss.height = nmsce.screenshot.naturalHeight
    ctx.drawImage(nmsce.screenshot, 0, 0)

    let canvas = document.getElementById("id-canvas")
    let scale = nmsce.screenshot.naturalWidth / canvas.width
    let imgData = ctx.getImageData(text.x * scale, text.y * scale, text.width * scale, text.height * scale)

    // var pixels = imgData.data;
    // for (var i = 0, n = pixels.length; i < n; i += 4) {
    //     //var grayscale = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11
    //     let grayscale = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11 > 235 ?0xff:0x00
    //     pixels[i] = grayscale; // red
    //     pixels[i + 1] = grayscale; // green
    //     pixels[i + 2] = grayscale; // blue
    // }

    let glyph = document.createElement('canvas')
    glyph.width = text.width * scale
    glyph.height = text.height * scale

    ctx = glyph.getContext("2d")
    ctx.putImageData(imgData, 0, 0)

    canvas = document.getElementById("id-glyphCanvas")
    let size = nmsce.calcImgSize(text.width * scale, text.height * scale, row.width(), row.height(), true)
    canvas.width = size.width
    canvas.height = size.height

    ctx = canvas.getContext("2d")
    ctx.drawImage(glyph, 0, 0, canvas.width, canvas.height)
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
    let hit = ""
    let nochange = false

    let loc = $("#imgtable")
    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (k === "selGlyph" && text.sel) {
            text.x = startX
            text.y = startY
            text.resize = "f"
            nmsce.startX = startX
            nmsce.startY = startY
            hit = k
            break
        } else if ((k === "logo" || text.ck) && nmsce.textHittest(startX, startY, text)) {
            if (k === "mylogo" && text.sel) {
                if (startX - text.x < 8)
                    text.resize = "l"
                else if (text.x + text.width - startX < 8)
                    text.resize = "r"
                else if (startY - text.y < 8)
                    text.resize = "t"
                else if (text.y + text.height - startY < 8)
                    text.resize = "b"
                else text.resize = ""
            } else if (text.type !== "img") {
                loc.find("#btn-Font").text(text.font)
                loc.find("#sel-size").val(text.fSize)
                loc.find("#sel-color").val(text.color)
            }

            if (text.sel)
                nochange = true

            hit = k
            text.sel = true
            nmsce.startX = startX
            nmsce.startY = startY
            break
        }
    }

    if (!e.shiftKey && !nochange) {
        for (let i of keys)
            if (i !== hit) {
                let text = nmsce.imageText[i]
                text.sel = false
            }
    }

    nmsce.drawText()
}

NMSCE.prototype.handleMouseUp = function (e) {
    e.preventDefault()

    delete nmsce.startX
    delete nmsce.startY

    if (nmsce.imageText.selGlyph.sel)
        nmsce.dispGlyph()
}

NMSCE.prototype.handleMouseOut = function (e) {
    e.preventDefault()
    $("body")[0].style.cursor = "default"
}

NMSCE.prototype.handleMouseMove = function (e) {
    e.preventDefault()

    let cid = $(e.currentTarget).get(0)
    let canvasOffset = cid.getBoundingClientRect()
    let offsetX = canvasOffset.left
    let offsetY = canvasOffset.top
    let mouseX = parseInt(e.clientX - offsetX)
    let mouseY = parseInt(e.clientY - offsetY)

    let dx = 0
    let dy = 0

    if (typeof nmsce.startX !== "undefined") {
        dx = mouseX - nmsce.startX
        dy = mouseY - nmsce.startY
        nmsce.startX = mouseX
        nmsce.startY = mouseY
    }

    let ncursor = "crosshair"
    let cursor = $("#id-canvas")[0].cursor
    if (!cursor)
        cursor = "default"

    let keys = Object.keys(nmsce.imageText)
    for (let k of keys) {
        let text = nmsce.imageText[k]

        if (text.sel && typeof nmsce.startX !== "undefined") {
            if (text.resize) {
                switch (text.resize) {
                    case "t":
                        text.y += dy
                        text.width *= (text.height - dy) / text.height
                        text.height -= dy
                        break
                    case "l":
                        text.x += dx
                        text.height *= (text.width - dx) / text.width
                        text.width -= dx
                        break
                    case "r":
                        text.height *= (text.width + dx) / text.width
                        text.width += dx
                        break
                    case "b":
                        text.width *= (text.height + dy) / text.height
                        text.height += dy
                        break
                    case "f":
                        text.width += dx
                        text.height += dy
                        break
                }
            } else {
                text.x += dx
                text.y += dy
            }
        } else {
            if ((k === "logo" || text.ck) && nmsce.textHittest(mouseX, mouseY, text)) {
                ncursor = "move"
                if (k === "mylogo" && text.sel) {
                    if (mouseX - text.x < 8)
                        ncursor = "ne-resize"
                    else if (text.x + text.width - mouseX < 8)
                        ncursor = "se-resize"
                    else if (mouseY - text.y < 8)
                        ncursor = "ne-resize"
                    else if (text.y + text.height - mouseY < 8)
                        ncursor = "se-resize"
                }
                break
            } else
                ncursor = "crosshair"
        }
    }

    if (ncursor !== cursor)
        $("#id-canvas")[0].style.cursor = ncursor

    if (typeof nmsce.startX !== "undefined")
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

        let ref = bhs.fbstorage.ref().child(originalPath + entry.Photo)
        ref.delete()

        ref = bhs.fbstorage.ref().child(displayPath + entry.Photo)
        ref.delete()

        ref = bhs.fbstorage.ref().child(thumbPath + entry.Photo)
        ref.delete()
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
        console.log(err)
    })
}

NMSCE.prototype.updateScreenshots = function (entry) {
    if (!$("#id-canvas").is(":visible") || $("#ck-updateScreenshot").is(":visible") && !$("#ck-updateScreenshot").prop("checked"))
        return null

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
        bhs.fbstorage.ref().child(thumbPath + entry.Photo).put(blob).then(() => {
            // bhs.status("Saved " + thumbPath + entry.Photo)
        })
    }, "image/jpeg", .7)

    let orig = document.createElement('canvas')
    let ctx = orig.getContext("2d")
    orig.width = 2048
    orig.height = nmsce.screenshot.height * 2048 / nmsce.screenshot.width
    ctx.drawImage(nmsce.screenshot, 0, 0, orig.width, orig.height)
    orig.toBlob(blob => {
        bhs.fbstorage.ref().child(originalPath + entry.Photo).put(blob).then(() => {
            // bhs.status("Saved " + originalPath + entry.Photo)
        })
    }, "image/jpeg", .9)

    nmsce.showSub("#sub-" + entry.type.nameToId())
    let loc = $("#id-table #sub-" + entry.type.nameToId())
    loc = loc.find(" #row-" + entry.type.nameToId() + "-" + entry.id + " img")

    let url = thumb.toDataURL()
    loc.attr("src", url)

    $('html, body').animate({
        scrollTop: loc.offset().top
    }, 500)
}

NMSCE.prototype.updateEntry = function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()
    nmsce.initVotes(entry)

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    if (typeof entry.id === "undefined")
        entry.id = uuidv4()

    if (typeof entry.Photo === "undefined")
        entry.Photo = entry.type + "-" + entry.id + ".jpg"

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    ref = ref.doc(entry.id)

    ref.set(entry).then(() => {
        bhs.status(entry.type + " " + entry.Name + " saved.")
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
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

function getEntry() {
    let addr = $("#panels #id-addr").val()
    let name = $(this).val()
    let type = $("#typePanels .active").prop("id").stripID()
    let gal = $("#btn-Galaxy").text().stripNumber()

    if (gal && type && addr && name) {
        let ref = bhs.fs.collection("nmsce/" + gal + "/" + type)
        ref = ref.where("Name", "==", name)
        ref = ref.where("addr", "==", addr)
        ref.get().then(snapshot => {
            if (!snapshot.empty)
                nmsce.displaySingle(snapshot.docs[0].data())
        })
    }
}

NMSCE.prototype.getEntries = function () {
    let p = []
    nmsce.entries = {}

    if (bhs.user.galaxy) {
        for (let t of objectList) {
            nmsce.entries[t.name.nameToId()] = {}

            let ref = bhs.fs.collection("nmsce/" + bhs.user.galaxy + "/" + t.name)
            ref = ref.where("uid", "==", bhs.user.uid)
            ref = ref.orderBy("modded", "desc")

            p.push(ref.get().then(snapshot => {
                return snapshot
            }))
        }

        Promise.all(p).then(res => {
            for (let snapshot of res)
                for (let doc of snapshot.docs) {
                    let e = doc.data()
                    nmsce.entries[e.type.nameToId()][e.id] = e
                }

            nmsce.displayList(nmsce.entries)
        })
    }
}

const resultsTable = [{
    name: "Latest",
    field: "created",
    date: true,
}, {
    name: "Top Favorites",
    field: "votes.favorite",
    limit: 3,
}, {
    name: "My Favorites",
    group: "votes",
    field: "favorite",
}, {
    name: "Search Results",
}, {
    name: "Moderators Choice",
    field: "votes.edchoice",
    limit: 3,
}, {
    name: "Top Visited",
    field: "votes.visited",
    limit: 3,
}, {
    name: "Top Click Count",
    field: "votes.clickcount",
    limit: 2,
}, ]

NMSCE.prototype.selDisplay = function (evt) {
    $(".cover-container").hide()

    if ($(evt).text() === "Latest") {
        $("#showlast").show()
        $("#showdate").show()
    } else {
        $("#showlast").hide()
        $("#showdate").hide()
    }

    let id = $(evt).text().stripMarginWS().nameToId()
    let btn = $(evt).closest("[id|='menu']").find("[id|='btn']").first()
    btn.text($(evt).text().stripMarginWS())
    btn.attr("style", $(evt).attr("style"))

    let loc = $("#id-" + id)
    loc.show()

    $("#numFound").text(loc.children().length)
}

NMSCE.prototype.getMyFavorites = function () {
    let ref = bhs.fs.collectionGroup("votes")
    ref = ref.where("uid", "==", bhs.user.uid)
    ref = ref.where("favorite", "==", true)
    ref.get().then(snapshot => {
        let p = []
        for (let doc of snapshot.docs) {
            //"nmsce/Euclid/Base/3d-maze/votesSV14SdNbzRbfW8NRbNQpTRJ7y612"
            let path = doc.ref.path.replace(/((?:.*?\/){3}.*?)\/.*/, "$1")
            let ref = bhs.fs.doc(path)
            p.push(ref.get().then(doc => {
                return doc
            }))
        }

        Promise.all(p).then(res => {
            let lists = nmsce.resultLists

            for (let doc of res) {
                let e = doc.data()
                let tid = e.type.nameToId()
                lists["My-Favorites"][tid + "-" + e.id] = e
            }

            nmsce.displayResultList("My-Favorites")
        })
    })
}

NMSCE.prototype.getFeatured = function () {
    return

    let ref = bhs.fs.doc("admin/nmsce-featured")
    ref.get().then(doc => {
        if (doc.exists) {
            let e = doc.data()
            let ref = bhs.fs.doc("nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)
            ref.get().then(doc => {
                if (doc.exists) {
                    let e = doc.data()
                    nmsce.displaySelected(e)
                }
            })
        }
    })
}

NMSCE.prototype.getNew = function () {
    let date = null

    if (typeof nmsce.resultLists === "undefined")
        nmsce.resultLists = {}

    let lists = nmsce.resultLists

    for (let r of resultsTable) {
        let rid = r.name.nameToId()
        lists[rid] = {}

        let h = /idname/ [Symbol.replace](resultsCover, rid)
        $("#resultLists").append(h)
    }

    if (typeof (Storage) !== "undefined")
        date = window.localStorage.getItem('nmsce-LastUpdate')

    bhs.buildMenu($("#resultshdr"), "show", resultsTable, nmsce.selDisplay, {
        nolabel: true
    })

    $("#resultshdr #btn-show").text("Latest")

    if (date) {
        let dt = new Date(date)
        $("#resultshdr #sinceDate").text(dt.toDateLocalTimeString())
        $("#resultshdr #sinceDate").show()
        let fd = firebase.firestore.Timestamp.fromDate(dt)
        nmsce.getAfterDate(fd)

        let d = Math.floor((new Date() - dt) / (1000 * 60 * 60 * 24))

        $("#displaysince").val(d)
    } else
        nmsce.getLatest()
}

NMSCE.prototype.getLatest = function () {
    let s = parseInt($("#displaysince").val())
    if (s < 1) {
        s = 1
        $("#displaysince").val(s)
    } else if (s > 30) {
        s = 30
        $("#displaysince").val(s)
    }

    let dt = new Date()
    dt.setDate(dt.getDate() - s)

    $("#resultshdr #sinceDate").text(dt.toDateLocalTimeString())
    $("#resultshdr #sinceDate").show()

    let fd = firebase.firestore.Timestamp.fromDate(dt)

    nmsce.getAfterDate(fd)
}

const resultsCover = `<div id="id-idname" class="cover-container hidden"></div>`
const resultsItem = `
    <div id="row-idname" class="cover-item bkg-white txt-inp-def h5 align-top">
        galaxy<br>
        by<br>
        <img id="img-idname" data-panel="epanel" data-thumb="ethumb" data-type="etype" data-id="eid" class="pointer" 
        onclick="nmsce.selectResult(this)" 
        onload="nmsce.imageLoaded(this, $(this).parent().width(), $(this).parent().height()-64, true)" />
    </div>`

NMSCE.prototype.getAfterDate = function (date) {
    $("body")[0].style.cursor = "wait"
    $("#numFound").text("searching...")
    let pdt = []
    let p = []

    for (let r of resultsTable) {
        if (!r.group) {
            for (let t of objectList) {
                if (r.field) {
                    let ref = bhs.fs.collectionGroup(t.name.nameToId())

                    if (r.date)
                        ref = ref.where(r.field, ">=", date)
                    else
                        ref = ref.orderBy(r.field, "desc")

                    if (r.limit)
                        ref = ref.limit(r.limit)

                    if (r.date)
                        pdt.push(ref.get().then(snapshot => {
                            return ({
                                rt: r,
                                snapshot: snapshot
                            })
                        }))
                    else
                        p.push(ref.get().then(snapshot => {
                            return {
                                rt: r,
                                snapshot: snapshot
                            }
                        }))
                }
            }
        }
    }

    let addList = function (res) {
        let lists = nmsce.resultLists
        let rts = {}
        let top = {}
        top.count = 0

        for (let r of res) {
            let rid = r.rt.name.nameToId()
            rts[rid] = r

            for (let doc of r.snapshot.docs) {
                let e = doc.data()
                let tid = e.type.nameToId()
                lists[rid][tid + "-" + e.id] = e

                if (r.rt.field === "votes.favorite" || r.rt.field === "votes.edchoice") {
                    let total = e.votes.favorite * 5 + e.votes.edchoice * 10 + e.votes.visited * 20 + e.votes.clickcount / 4
                    if (total > top.count) {
                        top.count = total
                        top.entry = e
                    }
                }
            }
        }

        if (top.count > 0)
            nmsce.displaySelected(top.entry, true)

        return rts
    }

    Promise.all(pdt).then(res => {
        let rts = addList(res)
        let rtl = Object.keys(rts)

        nmsce.displayResultList(rtl[0])

        nmsce.selDisplay("#item-" + rtl[0])
        $("body")[0].style.cursor = "default"
    })

    Promise.all(p).then(res => {
        let rts = addList(res)
        let rtl = Object.keys(rts)

        for (let rid of rtl)
            nmsce.displayResultList(rid)
    })

    if (typeof (Storage) !== "undefined") {
        date = new Date()
        window.localStorage.setItem('nmsce-LastUpdate', date.toString())
    }
}

NMSCE.prototype.createObserver = function (loc, fcn) {
    if (window.IntersectionObserver) {
        var io = new IntersectionObserver(
            evts => {
                for (let evt of evts) {
                    if (evt.intersectionRatio > 0) {
                        if (fcn)
                            fcn($(evt.target))
                        else
                            evt.target.src = evt.target.dataset.src
                        io.unobserve(evt.target)
                    }
                }
            }, {
                root: loc[0],
                rootMargin: '0px 0px 0px 0px',
                threshold: .1
            }
        )
    }

    return io
}

NMSCE.prototype.displayResultList = function (id) {
    let h = ""

    let list = nmsce.resultLists[id]

    for (let t of Object.keys(list)) {
        let e = list[t]

        let l = /idname/g [Symbol.replace](resultsItem, t)
        l = /etype/ [Symbol.replace](l, e.type)
        l = /eid/ [Symbol.replace](l, e.id)
        l = /galaxy/ [Symbol.replace](l, e.galaxy)
        l = /epanel/ [Symbol.replace](l, id)
        l = /ethumb/ [Symbol.replace](l, thumbPath + e.Photo)
        l = /by/ [Symbol.replace](l, e._name)

        h += l
    }

    let loc = $("#resultLists #id-" + id)
    loc.html(h)
    nmsce.displayThumbnails(loc)
}

NMSCE.prototype.displayThumbnails = function (loc) {
    let io = nmsce.createObserver(loc)

    let imgs = loc.find("[id|='img']")
    for (let l of imgs) {
        let data = $(l).data()

        let ref = bhs.fbstorage.ref().child(data.thumb)
        ref.getDownloadURL().then(url => {
            $(l).attr("data-src", url)
            io.observe(l)
        }).catch(err => console.log(err))
    }
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

NMSCE.prototype.selectResult = function (evt) {
    let data = $(evt).data()
    let e = nmsce.resultLists[data.panel][data.type + "-" + data.id]
    nmsce.last = e

    let v = {}
    v.votes = {}
    v.votes.clickcount = firebase.firestore.FieldValue.increment(1)

    let ref = bhs.fs.doc("nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)
    ref.set(v, {
        merge: true
    }).catch(err => console.log(err))

    if (bhs.user.uid && (e.uid === bhs.user.uid || bhs.hasRole("admin")))
        $("#btn-ceedit").show()
    else
        $("#btn-ceedit").hide()

    nmsce.displaySelected(e)
}

NMSCE.prototype.displaySelected = function (e, noscroll) {
    let row = `
    <div id="id-idname" class="row border-bottom txt-inp-def h5">
        <div class="col-5">title</div>
        <div id="val-idname" class="col font clr-def">value</div>
    </div>`

    let loc = $("#imageinfo")
    loc.show()

    nmsce.last = e

    if (bhs.user.uid !== "") {
        let ref = bhs.fs.doc("nmsce/" + e.galaxy + "/" + e.type + "/" + e.id + "/votes/" + bhs.user.uid)
        ref.get().then(doc => {
            nmsce.showVotes(doc.data())
        })
    }

    let link = "https://nmsce.com/preview.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()
    $("#permalink").attr("href", link)

    let idx = getIndex(objectList, "name", e.type)
    let obj = objectList[idx]

    let ref = bhs.fbstorage.ref().child(displayPath + e.Photo)
    ref.getDownloadURL().then(url => {
        $("#dispimage").prop("src", url)

        if (!noscroll)
            $('html, body').animate({
                scrollTop: $('#imageinfo').offset().top
            }, 500)
    })

    loc = $("#imagedata")
    loc.empty()

    let h = /idname/g [Symbol.replace](row, "Type")
    h = /title/ [Symbol.replace](h, "Type")
    h = /font/ [Symbol.replace](h, "")
    h = /value/ [Symbol.replace](h, e.type)
    loc.append(h)

    for (let fld of obj.imgText) {
        let h = /idname/g [Symbol.replace](row, fld.name.nameToId())
        h = /title/ [Symbol.replace](h, fld.name)
        h = /value/ [Symbol.replace](h, fld.name === "Glyphs" ? addrToGlyph(e[fld.field], e["Planet-Index"]) : e[fld.field])
        h = /font/ [Symbol.replace](h, fld.font ? fld.font : "")
        loc.append(h)
    }

    for (let fld of obj.fields) {
        let id = fld.name.nameToId()
        if ((fld.imgText || fld.searchText) && typeof e[id] !== "undefined" && e[id] !== -1 && e[id] !== "") {
            let h = /idname/g [Symbol.replace](row, id)
            h = /title/ [Symbol.replace](h, fld.name)

            if (fld.type === "tags") {
                let t = ""
                if (e[id]) {
                    for (let c of e[id])
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

    // let d = new Date(e.created.seconds).toDateLocalTimeString()

    // h = /idname/g [Symbol.replace](row, "date")
    // h = /title/ [Symbol.replace](h, "Added")
    // h = /value/ [Symbol.replace](h, d)
    // h = /font/ [Symbol.replace](h, "")
    // loc.append(h)
}

NMSCE.prototype.showVotes = function (entry) {
    const shvote = function (loc, tf) {
        if (tf) {
            loc.removeClass("fa-square")
            loc.addClass("fa-check-square")
            loc.css("color", "#00c000")
        } else {
            loc.removeClass("fa-check-square")
            loc.addClass("fa-square")
            loc.css("color", "grey")
        }
    }

    if (typeof entry !== "undefined") {
        $("#favorite").css("color", entry.favorite ? "#00c000" : "grey")
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

NMSCE.prototype.displayInList = function (list, tab) {
    for (let i of Object.keys(list[tab])) {
        let e = list[tab][i]

        let loc = $("#id-table #list-" + tab)
        loc.find("#row-" + e.id).show()
    }
}

NMSCE.prototype.displayList = function (entries) {
    const card = `
        <div class="container-flex">
            <div id="ttl-idname" class="card-header txt-def h5">
                <div class="row">
                    <i class="far fa-caret-square-up pointer hidden h4" onclick="nmsce.hideSubs()"></i>
                    <i class="far fa-caret-square-down pointer h4" onclick="nmsce.showSub('#sub-idname')"></i>&nbsp;
                    <div id="id-idname" class="col-6">title</div>
                    <div class="col">Total: total</div>
                </div>
            </div>
            <div id="sub-idname" class="container-flex h6 hidden">
                <div id="list-idname" class="scrollbar row" style="overflow-y: scroll; height: 550px"></div>
            </div>
        </div>`

    for (let type of Object.keys(entries)) {
        let list = Object.keys(entries[type])

        let l = /idname/g [Symbol.replace](card, type)
        l = /title/ [Symbol.replace](l, type.idToName())
        l = /total/ [Symbol.replace](l, list.length)
        $("#id-table").append(l)
        let loc = $("#id-table #list-" + type)

        nmsce.addDisplayListEntry(type, loc)

        for (let id of list)
            nmsce.addDisplayListEntry(entries[type][id], loc)
    }

    nmsce.displayThumbnails($('#id-table'))
}

NMSCE.prototype.displayListEntry = function (entry) {
    let loc = $("#id-table #sub-" + entry.type.nameToId())
    let id = entry.type.nameToId() + "-" + entry.id
    let eloc = loc.find("#row-" + id)

    if (eloc.length === 0)
        nmsce.addDisplayListEntry(entry, loc, true)
    else
        nmsce.updateDisplayListEntry(entry, eloc)
}

NMSCE.prototype.sortLoc = function (evt) {
    let id = $(evt).prop("id")
    let name = id.stripID()
    let loc = $(evt).closest("[id|='list']")
    let row = loc.find("#row-key")
    let key = row[0].outerHTML
    row.remove()

    let list = loc.children()
    switch (name) {
        case "Favorite":
        case "Editors-Choice":
        case "Visited":
        case "Slots":
            list.sort((a, b) => {
                let av = $(a).find("#" + id).text().stripMarginWS()
                let bv = $(b).find("#" + id).text().stripMarginWS()
                let x = parseInt(av)
                let y = parseInt(bv)
                return y - x
            })
            break
        case "Height":
            list.sort((a, b) => {
                let av = $(a).find("#" + id).text().stripMarginWS()
                let bv = $(b).find("#" + id).text().stripMarginWS()
                let x = parseFloat(av)
                let y = parseFloat(bv)
                return y - x
            })
            break
        case "Class":
            list.sort((a, b) => {
                let av = $(a).find("#" + id).text().stripMarginWS()
                let bv = $(b).find("#" + id).text().stripMarginWS()
                let x = "SABC".indexOf(av)
                let y = "SABC".indexOf(bv)
                return x - y
            })
            break
        case "Modified":
            list.sort((a, b) => {
                let av = new Date($(a).find("#" + id).text().stripMarginWS())
                let bv = new Date($(b).find("#" + id).text().stripMarginWS())
                return bv - av
            })
            break
        case "Seed":
        case "Posted":
            list.sort((a, b) => {
                let av = $(a).find("#" + id).text().stripMarginWS().toLowerCase()
                let bv = $(b).find("#" + id).text().stripMarginWS().toLowerCase()
                return av > bv ? -1 : av < bv ? 1 : 0
            })
            break
        default:
            list.sort((a, b) => {
                let av = $(a).find("#" + id).text().stripMarginWS().toLowerCase()
                let bv = $(b).find("#" + id).text().stripMarginWS().toLowerCase()
                return av > bv ? 1 : av < bv ? -1 : 0
            })
            break
    }

    loc.empty()
    loc.append(key)
    loc.append(list)
}

NMSCE.prototype.addDisplayListEntry = function (e, loc, prepend) {
    const key = `
        <div id="row-key" class="col-md-p250 col-sm-p333 col-7 border border-black txt-def" >
            <div class="row">`

    const row = `     
        <div id="row-idname" class="col-md-p250 col-sm-p333 col-7 border border-black" >
            <div id="id-Photo" class="row pointer" data-type="etype" data-id="eid" onclick="nmsce.selectList(this)" style="min-height:20px">
                <img id="img-idname" data-thumb="ethumb"
                onload="nmsce.imageLoaded(this, $(this).parent().width(), $(this).parent().height(), true)">
            </div>
            <div class="row">`
    const item = `<div id="id-idname" class="col-md-7 col-14 border pointer">title</div>`
    const sortItem = `<div id="id-idname" class="col-md-7 col-14 border pointer" onclick="nmsce.sortLoc(this)">title</div>`
    const end = `</div></div>`

    let h = ""
    let fstring = typeof e === "string"
    let itm = item

    if (fstring) {
        h = key
        itm = sortItem
    } else {
        h = /etype/ [Symbol.replace](row, e.type.nameToId())
        h = /idname/ [Symbol.replace](h, e.type.nameToId() + "-" + e.id)
        h = /eid/ [Symbol.replace](h, e.id)
        h = /ethumb/ [Symbol.replace](h, thumbPath + e.Photo)
    }

    let i = getIndex(objectList, "name", fstring ? e : e.type)
    for (let f of objectList[i].fields) {
        let id = f.name.nameToId()
        let title = fstring ? f.name : typeof e[f.name] === "undefined" ? "" : e[f.name]

        if (f.type !== "img" && f.type !== "map") {
            let l = /idname/g [Symbol.replace](itm, id)
            if (!fstring)
                l = /pointer/ [Symbol.replace](l, "")
            h += /title/ [Symbol.replace](l, title)

            if (typeof f.sublist !== "undefined")
                for (let s of f.sublist) {
                    let id = s.name.nameToId()
                    let title = fstring ? s.name : typeof e[s.name] === "undefined" ? "" : e[s.name]

                    if (s.type !== "img" && s.type !== "map") {
                        let l = /idname/g [Symbol.replace](itm, id)
                        h += /title/ [Symbol.replace](l, title)
                    }
                }
        }
    }

    if (fstring) {
        let l = /idname/g [Symbol.replace](itm, "Favorite")
        h += /title/ [Symbol.replace](l, "Favorite")
        l = /idname/g [Symbol.replace](itm, "Editors-Choice")
        h += /title/ [Symbol.replace](l, "Editors Choice")
        l = /idname/g [Symbol.replace](itm, "Visited")
        h += /title/ [Symbol.replace](l, "Visited")
        l = /idname/g [Symbol.replace](itm, "Modified")
        h += /title/ [Symbol.replace](l, "Modified")
        l = /idname/g [Symbol.replace](itm, "Posted")
        h += /title/ [Symbol.replace](l, "Posted")
    } else {
        let l = /idname/g [Symbol.replace](itm, "Favorite")
        l = /pointer/ [Symbol.replace](l, "")
        h += /title/ [Symbol.replace](l, e.votes.favorite)
        l = /idname/g [Symbol.replace](itm, "Editors-Choice")
        l = /pointer/ [Symbol.replace](l, "")
        h += /title/ [Symbol.replace](l, e.votes.edchoice)
        l = /idname/g [Symbol.replace](itm, "Visited")
        l = /pointer/ [Symbol.replace](l, "")
        h += /title/ [Symbol.replace](l, e.votes.visited)
        l = /idname/g [Symbol.replace](itm, "Modified")
        l = /pointer/ [Symbol.replace](l, "")
        h += /title/ [Symbol.replace](l, e.modded.toDate().toDateLocalTimeString())
        l = /idname/g [Symbol.replace](itm, "Posted")
        l = /pointer/ [Symbol.replace](l, "")
        h += /title/ [Symbol.replace](l, e.reddit ? typeof e.reddit === "boolean" ? "Posted" : typeof e.reddit.toDate != "undefined" ? e.reddit.toDate().toDateLocalTimeString() : "" : "")
    }

    h += end

    if (prepend)
        loc.find("#row-key").after(h)
    else
        loc.append(h)
}

NMSCE.prototype.updateDisplayListEntry = function (e, loc) {
    let i = getIndex(objectList, "name", e.type)
    for (let f of objectList[i].fields) {
        let id = f.name.nameToId()
        let title = typeof e[f.name] === "undefined" ? "" : e[f.name]

        if (f.type !== "img" && f.type !== "map") {
            let floc = loc.find("#id-" + id)
            if (floc.length > 0)
                floc.text(title)

            if (typeof f.sublist !== "undefined")
                for (let s of f.sublist) {
                    let id = s.name.nameToId()
                    let title = typeof e[s.name] === "undefined" ? "" : e[s.name]

                    if (s.type !== "img" && s.type !== "map") {
                        let floc = loc.find("#id-" + id)
                        if (floc.length > 0)
                            floc.text(title)
                    }
                }
        }
    }
}

NMSCE.prototype.imageLoaded = function (evt, width, height, expand) {
    let h = evt.naturalHeight
    let w = evt.naturalWidth

    let size = nmsce.calcImgSize(w, h, width, height, expand)

    $(evt).height(size.height)
    $(evt).width(size.width)
}

NMSCE.prototype.calcImgSize = function (width, height, maxw, maxh, expand) {
    let wscale = 1
    let hscale = 1

    if (expand) {
        if (width > height && width < maxw) {
            hscale = maxw / width
            height *= hscale
            width = maxw
        } else if (height < maxh) {
            wscale = maxh / height
            width *= wscale
            height = maxh
        }
    }

    if (width > maxw) {
        hscale = maxw / width
        wscale = 1
        height *= hscale
        width = maxw
    }

    if (height > maxh) {
        wscale = maxh / height
        hscale = 1
        width *= wscale
        height = maxh
    }

    return ({
        height: height,
        width: width,
        hscale: hscale,
        wscale: wscale
    })
}

NMSCE.prototype.showSub = function (id) {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
    loc.find(id).show()

    loc.find(".fa-caret-square-up").hide()
    loc.find(".fa-caret-square-down").show()

    let ptrid = id.stripID()
    loc.find("#ttl-" + ptrid + " .fa-caret-square-up").show()
    loc.find("#ttl-" + ptrid + " .fa-caret-square-down").hide()

    $('html, body').animate({
        scrollTop: loc.find(id).offset().top
    }, 500)
}

NMSCE.prototype.hideSubs = function () {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
    loc.find(".fa-caret-square-up").hide()
    loc.find(".fa-caret-square-down").show()
}

NMSCE.prototype.hideSub = function () {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
}

NMSCE.prototype.selectList = function (evt) {
    let data = $(evt).data()
    let e = nmsce.entries[data.type][data.id]

    nmsce.displaySingle(e)
}

NMSCE.prototype.newDARC = function (evt) {
    let addr = $(evt).text()

    if (typeof (Storage) !== "undefined")
        window.localStorage.setItem('nmsce-addr', addr)

    var win = window.open('darc.html', '_blank')
    if (win) {
        win.focus()
    } else {
        alert('Please allow popups for this website')
    }
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
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    bodies: "/images/fighter-bodies.svg",
    wings: "/images/fighter-wings.svg",
    asymmetric: true,
}, {
    name: "Hauler",
    slotList: slotList,
    slotTtip: `
        T1: 25-31 slots<br>
        T2: 32-39 slots<br>
        T3: 40-48 slots`,
    bodies: "/images/hauler-bodies.svg",
    wings: "/images/hauler-wings.svg",
}, {
    name: "Shuttle",
    slotList: [{
        name: "T1"
    }, {
        name: "T2"
    }],
    slotTtip: `
        T1: 18-23 slots<br>
        T2: 24-28 slots`,
    bodies: "/images/shuttle-bodies.svg",
    wings: "/images/shuttle-wings.svg",
    asymmetric: true,
}, {
    name: "Explorer",
    bodies: "/images/explorer.svg",
    slotList: slotList,
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    asymmetric: true,
}, {
    name: "Exotic",
    bodies: "/images/exotic.svg",
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
    name: "Rusted Metal"
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
}, {
    name: 'Amatic SC',
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }, {
        field: "Economy",
        id: "#id-Economy",
        name: "Economy",
        type: "radio",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        ttip: "Select ship type to select ship size and parts.",
        required: true,
        search: true,
        sublist: [{
            name: "Slots",
            type: "radio",
            ttip: "slotTtip",
            sub: "slotList",
            imgText: true,
            search: true,
        }, {
            name: "Asymmetric",
            type: "checkbox",
            sub: "asymmetric",
            search: true,
            inputHide: true,
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
        inputHide: true,
    }, {
        name: "Crashed",
        type: "checkbox",
        onchange: showLatLong,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Class",
        type: "radio",
        startState: "hidden",
        list: classList,
        imgText: true,
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
        range: 15,
        startState: "hidden",
    }, {
        name: "First Wave",
        ttip: "This is only used on space stations. First wave for reloading a save and restarting the game are different.",
        type: "radio",
        list: [{
            name: "Reload"
        }, {
            name: "Restart"
        }],
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin ship.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        imgText: true,
        list: colorList,
        max: 4,
        search: true,
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }, {
        field: "Economy",
        id: "#id-Economy",
        name: "Economy",
        type: "radio",
        list: economyListTier,
    }, {
        id: "#id-Lifeform",
        field: "life",
        name: "Lifeform",
        type: "menu",
        list: lifeformList,
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin ship.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        imgText: true,
        list: colorList,
        max: 4,
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }, {
        name: "capital",
        type: "map",
        map: "/images/freighter-capital.svg",
        search: true,
    }, {
        name: "common",
        type: "map",
        map: "/images/freighter-system.svg",
        search: true,
    }, ]
}, {
    name: "Frigate",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Type",
        type: "menu",
        list: frigateList,
        search: true,
    }, {
        name: "Benefits",
        type: "tags",
        imgText: true,
        list: frigateBenefits,
        search: true,
        inputHide: true,
    }, {
        name: "Negatives",
        type: "tags",
        imgText: true,
        list: frigateNegatives,
        search: true,
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        searchText: true,
        list: colorList,
        max: 4,
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-Platform",
        field: "Platform",
        name: "Platform",
        type: "radio",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
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
        query: ">="
    }, {
        name: "Space Station",
        type: "checkbox",
        search: true,
        inputHide: true,
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
        inputHide: true,
    }, {
        name: "Latitude",
        imgText: true,
        type: "string",
        inputHide: true,
    }, {
        name: "Longitude",
        imgText: true,
        type: "string",
        inputHide: true,
    }, {
        name: "Notes",
        type: "long string",
        searchText: true,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin MT.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        searchText: true,
        max: 4,
        list: colorList,
        search: true,
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
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
        inputHide: true,
    }, {
        name: "Height",
        type: "float",
        range: 15.0,
        imgText: true,
        search: true,
        query: ">="
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
    }, {
        name: "Planet Name",
        imgText: true,
        type: "string",
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        required: true,
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Planet Index",
        range: 15,
        type: "number",
        required: true,
        ttip: planetNumTip,
    }, {
        name: "Biome",
        type: "menu",
        list: biomeList,
        imgText: true,
        search: true,
    }, {
        name: "Extreme Weather",
        type: "checkbox",
        ttip: "Any deadly weather pattern.",
        searchText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Sentinels",
        type: "menu",
        list: sentinelList,
        ttip: `Low - Sentinels only guard secure facilities<br>
            High - Patrols are present throughout the planet (orange icon)<br>
            Aggressive - Patrols are present throughout the planet and Sentinels will attack on sight (red icon)<br>`,
        search: true,
        inputHide: true,
    }, {
        name: "Predators",
        type: "checkbox",
        ttip: `Does planet have agressive predators?`,
        search: true,
        inputHide: true,
    }, {
        name: "Grass Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Water Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Sky Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Resources",
        type: "tags",
        list: resourceList,
        max: 6,
        imgText: true,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
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
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-Platform",
        field: "Platform",
        name: "Platform",
        type: "radio",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
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
        type: "string",
    }],
    fields: [{
        name: "Name",
        type: "string",
        imgText: true,
        onchange: getEntry,
        search: true,
        inputHide: true,
    }, {
        name: "Owner",
        type: "string",
        required: true,
        imgText: true,
        search: true,
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
        inputHide: true,
    }, {
        name: "Latitude",
        imgText: true,
        type: "string",
        inputHide: true,
    }, {
        name: "Longitude",
        imgText: true,
        type: "string",
        inputHide: true,
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
        imgText: true,
        max: 6,
        ttip: "If the base was created on XBox please tag with 'xbox'.",
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];