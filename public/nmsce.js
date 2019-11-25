'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

var nmsce

$(document).ready(() => {
    startUp()

    $("#cemenus").load("cemenus.html", () => {
        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("#navmenu").find("[href='" + page + "']")
        loc.addClass("clr-blue border rounded")

        // $("#menuimg").on("load", () => {
        //     let height = $("#menuitems").height()
        //     let loc = $("[src='images/nmsce-logo.png']")
        //     let iheight = loc.height()
        //     let width = loc.width() * height / iheight

        //     loc.css("width",width+"px")
        //     loc.height(height+"px")
        // })
    })

    nmsce = new NMSCE()

    nmsce.last = null

    bhs.buildUserPanel()

    nmsce.buildPanel()
    nmsce.buildTypePanels()

    $("#save").click(() => {
        if (nmsce.save()) {
            nmsce.clearPanel("pnl-S1")
            nmsce.clearPanel("typePanels")
        }
    })

    $("#delete").click(() => {
        $("#status").empty()
        //bhs.deleteEntry($("#pnl-S1 #id-addr").val())
    })

    $("#cancel").click(() => {
        nmsce.clearPanel("pnl-S1")
        nmsce.clearPanel("typePanels")
    })

    $("#search").click(() => {
        nmsce.search()
    })

    $("#clear").click(() => {
        nmsce.clearPanel("pnl-S1")
        nmsce.clearPanel("typePanels")
    })
})

function NMSCE() {

}

NMSCE.prototype.displayUser = function () {
    if (bhs.user.galaxy !== "" && !fcesearch) {
        //nmsce.displaySettings(bhs.user)
        nmsce.getEntries(bhs.user, nmsce.displayList)
    }
}

NMSCE.prototype.buildPanel = function () {
    let loc = $("#pnl-S1")

    bhs.buildMenu(loc, "Lifeform", lifeformList)
    bhs.buildMenu(loc, "Economy", economyList, null, {
        required: !fcesearch
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

        if (!fcesearch)
            bhs.getEntry(addr, nmsce.displaySystem, null, null, true)
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

    $("#entrybuttons").show()
    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")
}

NMSCE.prototype.clearPanel = function (d) {
    let pnl = $("#" + d)

    pnl.find("input").each(function () {
        $(this).val("")
    })

    pnl.find("[id|='menu']").each(function () {
        $(this).find("[id|='btn']").text("")
    })

    pnl.find("[id='map-selected'] img").each(function () {
        $(this).hide()
    })

    nmsce.last = null

    $("#delete").addClass("disabled")
    $("#delete").prop("disabled", true)
}

NMSCE.prototype.extractEntry = async function (fcn) {
    let entry = {}

    let loc = $("#pnl-S1")

    if (nmsce.last) {
        entry = mergeObjects(entry, nmsce.last)

        // let addr = loc.find("#id-addr").val()
        // if (nmsce.last.addr !== addr) {
        //     ok = bhs.deleteEntry(nmsce.last)
        //     bhs.status("change address " + nmsce.last.addr)
        // }
    }

    if (!nmsce.last || nmsce.last.uid === bhs.user.uid) {
        entry._name = bhs.user._name
        entry.org = bhs.user.org
        entry.uid = bhs.user.uid
        entry.platform = bhs.user.platform
        entry.galaxy = bhs.user.galaxy
    }

    entry.version = "beyond"
    entry.page = "nmsce"

    entry.addr = loc.find("#id-addr").val()
    entry.sys = loc.find("#id-sys").val()
    entry.reg = loc.find("#id-reg").val()
    entry.life = loc.find("#btn-Lifeform").text().stripNumber()
    entry.econ = loc.find("#btn-Economy").text().stripNumber()

    let ok = bhs.validateEntry(entry, true) === ""

    if (ok) {
        entry.xyzs = addressToXYZ(entry.addr)

        bhs.updateEntry(entry)

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
                case "array":
                    if ($(loc).prop("checked")) {
                        let aid = $(r).prop("id").stripID()
                        if (typeof entry[aid] === "undefined")
                            entry[aid] = {}
                        entry[aid][id] = true
                    }
                    break
                case "checkbox":
                    entry[id] = $(loc).prop("checked")
                    break
                case "map":
                    list = $(rloc).find("[id='map-selected'] :visible")
                    for (let loc of list) {
                        let alt = $(loc).attr("alt")
                        if (typeof entry[id] === "undefined" || nmsce.last) {
                            nmsce.last = null
                            entry[id] = {}
                        }
                        entry[id][alt] = true
                    }
                    break
                case "img":
                    if (!fcesearch && (entry.replaceImg || typeof entry[id] === "undefined")) {
                        delete entry.replaceImg

                        let canvas = $("#id-canvas")[0]
                        if (typeof canvas !== "undefined") {
                            if (typeof entry[id] === "undefined")
                                entry[id] = "nmsce/" + uuidv4() + ".jpg"

                            canvas.toBlob(blob => {
                                bhs.fbstorage.ref().child(entry[id]).put(blob)
                            }, "image/jpeg", .7)
                        }
                    }
                    break
            }

            if (data.req && !fcesearch)
                if (typeof entry[id] === "undefined" ||
                    (data.type === "string" || data.type === "menu") && entry[id] === "" ||
                    (data.type === "number" || data.type === "float") && entry[id] === -1 ||
                    data.type === "img" && entry[id] === "") {

                    bhs.status(id + " required. Entry not saved.", 0)
                    ok = false
                    break
                }
        }

        if (ok)
            fcn(entry)
    }

    return ok
}

NMSCE.prototype.displaySingle = async function (entry) {
    let tloc = $("#tab-" + entry.type.nameToId())
    tloc.click()

    let img = $("#imgtable")
    img.hide()

    let loc = $("#pnl-S1")
    loc.find("#id-addr").val(entry.addr)
    loc.find("#id-sys").val(entry.sys)
    loc.find("#id-reg").val(entry.reg)
    loc.find("#btn-Lifeform").text(entry.life)
    loc.find("#btn-Economy").text(entry.econ)

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
            case "array":
                for (let ck of loc) {
                    let ckid = $(ck).prop("id").stripID()
                    $(ck).prop("checked", typeof entry[id] !== "undefined" && entry[id][ckid] ? true : false)
                }
                break
            case "checkbox":
                loc.prop("checked", entry[id] ? true : false)
                break
            case "map":
                $(row).find("#map-selected img").hide()
                if (typeof entry[id] === "object")
                    for (let s of Object.keys(entry[id]))
                        if (entry[id][s])
                            $(row).find("#map-selected [alt='" + s + "']").show()
                break
            case "img":
                break
        }
    }
}

NMSCE.prototype.extractSearch = async function (user) {
    if (typeof user === "undefined")
        user = bhs.user

    let platform = user.platform
    let galaxy = user.galaxy

    let tab = $("#typeTabs .active").prop("id").stripID()
    let pnl = $("#typePanels #pnl-" + tab)

    let ref = bhs.fs.collection("nmsce/" + galaxy + "/" + tab)

    let loc = $("#pnl-S1")
    let addr = loc.find("#id-addr").val()
    let sys = loc.find("#id-sys").val()
    let reg = loc.find("#id-reg").val()
    let life = loc.find("#btn-Lifeform").text().stripNumber()
    let econ = loc.find("#btn-Economy").text().stripNumber()

    if (user._name !== bhs.user._name) ref = ref.where("_name", "==", user._name)
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
        let sloc = $(rloc).find("#sck-" + id)
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
            case "array":
                if (sloc.prop("checked")) {
                    let aid = $(rloc).prop("id").stripID()
                    ref = ref.where(aid + "." + id, "==", $(loc).prop("checked"))
                }
                break
            case "checkbox":
                if (sloc.prop("checked"))
                    ref = ref.where(id, "==", $(loc).prop("checked"))
                break
            case "map":
                let sel = $(rloc).find("#map-selected :visible")
                for (let loc of sel) {
                    let alt = $(loc).attr("alt")
                    ref = ref.where(id + "." + alt, "==", true)
                }
                break
        }
    }

    let snapshot = await ref.get()

    if (snapshot.empty)
        bhs.status("Nothing Found.", true)
    else {
        let found = {}
        found[tab] = []

        bhs.status("Found " + snapshot.size + " items.", true)

        for (let doc of snapshot.docs)
            found[tab].push(doc.data())

        $("#id-table").empty()
        nmsce.displayList(found)
    }
}

NMSCE.prototype.save = function () {
    $("#status").empty()

    let user = bhs.extractUser()

    if (bhs.user.uid && bhs.validateUser(user)) {
        bhs.user = mergeObjects(bhs.user, user)
        delete bhs.user.nmscetext
        bhs.user.nmscetext = texts

        let ref = bhs.getUsersColRef(bhs.user.uid)
        ref.set(bhs.user).then(() => {
            return true
        }).catch(err => {
            if (bhs.status)
                bhs.status("ERROR: " + err)

            console.log(err)
            return false
        })

        nmsce.extractEntry(nmsce.updateEntry)
    }
}

NMSCE.prototype.search = function () {
    $("#status").empty()
    let user = bhs.extractUser()
    nmsce.extractSearch(user)
}

blackHoleSuns.prototype.status = function (str, clear) {
    if (clear)
        $("#status").empty()

    $("#status").append("<h6>" + str + "</h6>")
}

NMSCE.prototype.buildTypePanels = function () {
    let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#pnl-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`
    let header = `
        <div class="tab-pane show active" id="pnl-idname" role="tabpanel" aria-labelledby="tab-idname">
            <div id="itm-idname" class="row"></div>
        </div>`
    const tReq = `&nbsp;<font style="color:red">*</font>`
    const tText = `&nbsp;
        <div data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
            <i class="fa fa-question-circle-o text-danger h6"></i>
        </div>`
    const tTextImg = `<img src='pic' style="height:15px; width:auto;">`
    const tBlank = `
        <div class="col-lg-7 col-md-14 col-sm-7 col-14"></div>`
    const tSubBlank = `
        <div id="slist-idname" class="col-lg-7 col-md-14 col-sm-7 col-14 hidden"></div>`
    const tString = `
        <div class="col-lg-7 col-md-14 col-sm-7 col-14">
            <div id="row-idname" data-type="string" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" class="rounded col-md-7 col-9">
            </div>
        </div>`
    const tSubString = `
        <div id="slist-idname" class="col-lg-7 col-md-14 col-sm-7 col-14 hidden">
            <div id="row-idname" data-type="string" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" class="rounded col-md-7 col-9">
            </div>
        </div>`
    const tSubMap = `
        <div id="slist-idname" class="col-lg-7 col-md-14 col-sm-7 col-14 hidden">
            <div id="row-idname" data-type="map" data-req="ifreq" class="container border-top border-bottom"></div>
        </div>`
    const tMap = `
        <div class="col-lg-7 col-md-14 col-sm-7 col-14">
            <div id="row-idname" data-type="map" data-req="ifreq" class="container border-top border-bottom"></div>
        </div>`
    const tLongString = `
        <div class="col-14">
            <div id="row-idname" data-type="string" data-req="ifreq" class="row">
                <div class="col-md-4 col-3 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" class="rounded col-md-9 col-10">
            </div>
        </div>`
    const tNumber = `
        <div class="col-lg-7 col-md-14 col-sm-7 col-14">
            <div id="row-idname" data-type="number" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" type="number" class="rounded col-md-5 col-6" min=0 max=range value=-1>
            </div>
        </div>`
    const tSubNumber = `
        <div id="slist-idname" class="col-lg-7 col-md-14 col-sm-7 col-14 hidden">
            <div id="row-idname" data-type="number" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" type="number" class="rounded col-md-5 col-6" min=0 max=range value=-1>
            </div>
        </div>`
    const tFloat = `
        <div class="col-lg-7 col-md-14 col-sm-7 col-14">
            <div id="row-idname" data-type="float" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">titlettip&nbsp;</div>
                <input id="id-idname" type="number" class="rounded col-md-5 col-6" step=0.1 min=0 max=range value=-1>
            </div>
        </div>`
    const tList = `
        <div id="list-idname" class="col-lg-7 col-md-14 col-sm-7 col-14">
            <div id="row-idname" data-type="menu" data-req="ifreq" class="row">
                <div id="id-idname" class="col-12"></div>
            </div>
        </div>`
    const tArray = `
        <div id="slist-idname" class="container border-top border-bottom hidden">
            <div id="row-idname" data-type="array" data-req="ifreq" class="row"></div>
        </div>`
    const tArrayItm = `
        <label id="id-idname" class="col-sm-3 col-4 h6 txt-inp-def">
            <div class="row">
                <label id="search-idname" class="h6 txt-inp-def hidden" style="color:blue">
                    **&nbsp;
                    <input id="sck-idname" type="checkbox">
                </label>    
                <input id="ck-idname" type="checkbox">
                &nbsp;titlettip&nbsp;
            </div>
        </label>`
    const tCkItem = `
        <div id="row-idname" data-type="checkbox" data-req="false" class="col-lg-7 col-md-14 col-sm-7 col-14">
            <label id="id-idname" class="h6 txt-inp-def row">
                titlettip&nbsp
                <label id="search-idname" class="h6 txt-inp-def hidden" style="color:blue">
                    **&nbsp;
                    <input id="sck-idname" type="checkbox">
                </label>          
                <input id="ck-idname" type="checkbox">
            </label>
        </div>`
    const tSubList = `
        <div id="slist-idname" class="col-lg-7 col-md-14 col-sm-7 col-14 hidden">
            <div id="row-idname" data-type="menu" data-req="ifreq" class="row">
                <div id="id-idname" class="col-12"></div>
            </div>
        </div>`
    const tImg = `
        <div id="row-idname" data-type="img" data-req="ifreq" class="col-13">
            <div class="row">
                <div class="col-3 txt-inp-def h6">titlettip&nbsp;</div>
                    <input id="id-idname" type="file" class="col-10 form-control form-control-sm" 
                        accept="image/*" name="files[]" onchange="nmsce.loadScreenshot(this)">&nbsp
                </div>
            </div>
        </div>`

    const tSubImg = `
        <div id="slist-idname" class="col-13 hidden">
            <div id="row-idname" data-type="img" data-req="ifreq" class="row">
                <div class="col-3 txt-inp-def h6">titlettip&nbsp;</div>
                    <input id="id-idname" type="file" class="col-10 form-control form-control-sm" 
                        accept="image/*" name="files[]" onchange="nmsce.loadScreenshot(this)">&nbsp
                </div>
            </div>
        </div>`

    let tabs = $("#typeTabs")
    let pnl = $("#typePanels")

    let appenditem = (itm, add, title, id, ttip, req, img) => {
        let l = add

        if (img) {
            l = /title/ [Symbol.replace](l, tTextImg)
            l = /pic/ [Symbol.replace](l, img)
        } else
            l = /title/ [Symbol.replace](l, title + (req ? tReq : ""))

        if (ttip) {
            l = /ttip/ [Symbol.replace](l, tText)
            l = /ttext/ [Symbol.replace](l, ttip)
        } else
            l = /ttip/ [Symbol.replace](l, "")

        l = /idname/g [Symbol.replace](l, id)
        l = /ifreq/ [Symbol.replace](l, req ? true : false)

        itm.append(l)
    }

    for (let obj of objectList) {
        let id = obj.name.nameToId()
        let h = /idname/g [Symbol.replace](nav, id)
        h = /title/ [Symbol.replace](h, obj.name)
        tabs.append(h)

        h = /idname/g [Symbol.replace](header, id)
        pnl.append(h)

        nav = /active/ [Symbol.replace](nav, "")
        header = /show active/ [Symbol.replace](header, "")

        let itm = pnl.find("#itm-" + id)
        if (obj.fields) {
            for (let f of obj.fields) {
                if (fcesearch && !f.search)
                    continue

                let l = ""
                let id = f.name.nameToId()

                if (fcesearch)
                    f.required = false

                switch (f.type) {
                    case "menu":
                        appenditem(itm, tList, "", id)
                        let lst = itm.find("#list-" + id)
                        bhs.buildMenu(lst, f.name, f.list, f.sublist ? nmsce.selectSublist : null, f)

                        if (f.sublist) {
                            for (let t of f.list) {
                                for (let j = 0; j < f.sublist.length; ++j) {
                                    let flist = f.sublist[j]
                                    let slist = t[flist.sub] ? t[flist.sub] : flist.list
                                    let sub

                                    if (fcesearch && !flist.search)
                                        continue

                                    switch (flist.type) {
                                        case "menu":
                                            if (slist) {
                                                l = /idname/ [Symbol.replace](tSubList, (t.name + "-" + flist.name).nameToId())
                                                appenditem(itm, l, "", flist.name.nameToId())

                                                sub = itm.find("#slist-" + (t.name + "-" + flist.name).nameToId())
                                                bhs.buildMenu(sub, flist.name, slist, null, {
                                                    tip: t[flist.ttip]
                                                })
                                            }
                                            break

                                        case "map":
                                            if (slist) {
                                                l = /idname/ [Symbol.replace](tSubMap, (t.name + "-" + flist.name).nameToId())
                                                appenditem(itm, l, "", flist.name.nameToId())

                                                sub = itm.find("#slist-" + (t.name + "-" + flist.name).nameToId())
                                                sub = sub.find("#row-" + flist.name.nameToId())

                                                sub.append(slist[0].map)
                                            }
                                            break

                                        case "array":
                                            if (slist) {
                                                l = /idname/ [Symbol.replace](tArray, (t.name + "-" + flist.name).nameToId())
                                                appenditem(itm, l, "", flist.name.nameToId(), flist.ttip, null)

                                                sub = itm.find("#slist-" + (t.name + "-" + flist.name).nameToId())
                                                sub = sub.find("#row-" + flist.name.nameToId())

                                                for (let m of slist)
                                                    appenditem(sub, tArrayItm, m.name, m.name.nameToId(), null, null, m.img)
                                            }
                                            break

                                        case "number":
                                            l = /idname/ [Symbol.replace](tSubNumber, (t.name + "-" + flist.name).nameToId())
                                            l = /range/ [Symbol.replace](l, flist.range)
                                            appenditem(itm, l, flist.name, flist.name.nameToId(), flist.ttip, flist.required)
                                            break
                                        case "string":
                                            l = /idname/ [Symbol.replace](tSubString, (t.name + "-" + flist.name).nameToId())
                                            appenditem(itm, l, flist.name, flist.name.nameToId(), flist.ttip, flist.required)
                                            break
                                        case "blank":
                                            l = /idname/ [Symbol.replace](tSubBlank, (t.name + "-" + flist.name).nameToId())
                                            itm.append(l)
                                            break
                                        case "img":
                                            l = /idname/ [Symbol.replace](tSubImg, (t.name + "-" + flist.name).nameToId())
                                            appenditem(itm, l, flist.name, flist.name.nameToId(), flist.ttip, flist.required)
                                            break
                                    }
                                }
                            }
                        }
                        break

                    case "number":
                        l = /range/ [Symbol.replace](tNumber, f.range)
                        appenditem(itm, l, f.name, id, f.ttip, f.required)
                        break
                    case "float":
                        l = /range/ [Symbol.replace](tFloat, f.range)
                        appenditem(itm, l, f.name, id, f.ttip, f.required)
                        break
                    case "img":
                        appenditem(itm, tImg, f.name, id, f.ttip, f.required)
                        break
                    case "checkbox":
                        appenditem(itm, tCkItem, f.name, id, f.ttip, f.required)
                        break
                    case "string":
                        appenditem(itm, tString, f.name, id, f.ttip, f.required)
                        break
                    case "long string":
                        appenditem(itm, tLongString, f.name, id, f.ttip, f.required)
                        break
                    case "map":
                        l = /idname/ [Symbol.replace](tMap, (f.name).nameToId())
                        appenditem(itm, l, "", f.name.nameToId())

                        let mloc = itm.find("#row-" + f.name.nameToId())
                        mloc.append(f.map)
                        break
                    case "blank":
                        itm.append(tBlank)
                        break
                }
            }
        }
    }

    // if (fcesearch)
    //     $("[id|='search']").show()


    const imgline = `<img alt="id" src="path/fname.png" class="hidden" style="position:absolute" />`

    //    <div id="map-explorer">
    //         <img id="map-image" src="images/explorer/bodies/bodies.png" />
    //         <div id="map-selected"></div>
    //         <div id="map-hover"></div>
    //         <img id="map-transparent" src="images/explorer/bodies/blank.png" style="position:absolute" usemap="#explorer-map" />
    //         <map name="explorer-map" id="map-areas">

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (evt) {
        let id = $(evt.currentTarget).prop("id").stripID()
        let mlist = $("#pnl-" + id).find("#map-image")
        for (let mloc of mlist) {
            let pos = $(mloc).position()

            $(mloc).parent().find("img").css({
                top: pos.top + "px",
                left: pos.left + "px",
            })
        }
    })

    let areas = $("[id='map-areas']")
    for (let loc of areas) {
        let ploc = $(loc).closest("[id|='row']")

        if (ploc.length > 0) {
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
    }

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
    let t = btn.text().stripMarginWS()
    let f = btn.prop("id").slice(4)
    let pnl = btn.closest("[id|='pnl']")
    let p = pnl.prop("id").slice(4)

    let pidx = getIndex(objectList, "name", p)
    let fidx = getIndex(objectList[pidx].fields, "name", f)
    let sub = objectList[pidx].fields[fidx].sublist

    pnl.find("[id|='slist']").hide()

    for (let i of sub) {
        let ploc = pnl.find("#slist-" + (t + "-" + i.name).nameToId())
        ploc.show()

        let mloc = ploc.find("#map-image")
        if (mloc.length > 0) {
            let pos = $(mloc).position()

            ploc.find("img").css({
                top: pos.top + "px",
                left: pos.left + "px",
            })
        }
    }
}

let logocanvas = document.createElement('canvas')
let imgcanvas = document.createElement('canvas')
let txtcanvas = document.createElement('canvas')

const txtList = [{
    name: "Player Name"
}, {
    name: "System Name"
}, {
    name: "System Economy"
}, {
    name: "Coordinates"
}, {
    name: "Glyphs",
    font: "glyph",
    label: "NMS Glyphs"
}, {
    name: "Galaxy"
}, {
    name: "Platform",
    ttip: "Only necessary for bases."
}, {
    name: "Mode",
    ttip: "Only necessary for bases."
}, {
    name: "Ship Info",
    ttip: "Ship size (T1, T2, T3)."
}, {
    name: "Text",
    what: "txt",
    ttip: "Uses 'Input Text' field below. Add a '\\n' to seperate multiple lines."
    // }, {
    //     name: "Logo",
    //     what: "logo",
    //     ttip: "Use a personal logo from your local machine."
}]

NMSCE.prototype.loadScreenshot = function (evt) {
    const hdr = `
        <div  class="row"> 
            <i class="fa fa-question-circle-o text-danger h6 col-4" data-toggle="tooltip" data-html="true"
                data-placement="bottom" title="Text overlay is generated from current values. To change display
                toggle checkbox off and back on.">
            </i>            
            <div class="col-2 text-center">Color</div>
            <div class="col-2 text-center">Size</div>
            <div class="col-5">&nbsp;&nbsp;Font</div>
        </div>`

    const itm = `
        <div id="txt-idname" class="row"> 
            <label class="col-4">
                <input id="ck-idname" type="checkbox" onchange="nmsce.addText(this)">
                titlettip&nbsp;
            </label>
            <input id="sel-idname" class="col-2 bkg-def" style="border-color:black" onchange="nmsce.setColor(this)" type="color" value="#ffffff">&nbsp;
            <input id="size-idname" class="col-2" onchange="nmsce.setSize(this)" type="number" value=16 min=0>
            <div id="id-" class="col-5"></div>
        </div>`

    const txt = `
        <br>
        <div id="inp-idname" class="row"> 
            <div class="col-3">Input Text</div>
            <input id="inp-Input-Text" class="col-10" type="text" onchange="nmsce.addText(this)">
        </div>`

    const logo = `
        <br>
        <div id="txt-idname" class="row"> 
            <label class="col-4">
                <input id="ck-idname" type="checkbox" onchange="nmsce.addText(this)">
                titlettip&nbsp;
            </label>
            <input id="id-idname" type="file" class="col-9 form-control form-control-sm" 
                accept="image/*" name="files[]" onchange="nmsce.loadLogo(this)">&nbsp
        </div>`

    const ttip = `&nbsp;
        <i class="fa fa-question-circle-o text-danger h6 col-4" data-toggle="tooltip" data-html="true"
            data-placement="bottom" title="ttext">
        </i> `

    if (nmsce.last)
        nmsce.last.replaceImg = true

    let img = $("#imgtable")
    img.show()

    let h = hdr
    let l = ""
    for (let i of txtList) {
        switch (i.what) {
            case "logo":
                l = logo
                break
            case "txt":
                l = itm + txt
                break
            default:
                l = itm
                break
        }

        l = /idname/g [Symbol.replace](l, i.name.nameToId())
        l = /title/ [Symbol.replace](l, i.name)

        if (i.ttip) {
            l = /ttip/ [Symbol.replace](l, ttip)
            l = /ttext/ [Symbol.replace](l, i.ttip)
        } else
            l = /ttip/ [Symbol.replace](l, "")

        h += l

    }

    let loc = $("#img-text")
    loc.empty()
    loc.append(h)

    let height = 0
    let fnt = loc.find("[id|='txt']")
    for (let loc of fnt) {
        let id = $(loc).prop("id")
        id = id.stripID().idToName()
        let i = getIndex(txtList, "name", id)
        if (typeof txtList[i].font === "undefined") {
            bhs.buildMenu($(loc), "", fontList, nmsce.setFont, {
                nolabel: true
            })
            $(loc).find("#btn-").text("Arial")
            height = $(loc).height()
        } else {
            let lbl = $(loc).find("#id-")
            lbl.text(txtList[i].label)
            if (height > 0)
                lbl.height(height)
        }
    }

    texts = []
    selectedText = -1

    if (typeof evt !== "undefined") {
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

        let imgctx = imgcanvas.getContext("2d")

        let canvas = img[0]
        let ctx = canvas.getContext("2d")

        let width = $("#id-img").width()

        let file = evt.files[0]
        let reader = new FileReader()
        reader.onload = function () {
            let img = new Image()
            img.onload = function () {
                canvas.width = imgcanvas.width = txtcanvas.width = width
                canvas.height = imgcanvas.height = txtcanvas.height = img.height * width / img.width
                imgctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                let logo = new Image()
                logo.onload = function () {
                    imgctx.drawImage(logo, canvas.width - 60, canvas.height - 60, 50, 50)
                    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)

                    nmsce.showText()
                }

                logo.src = "/images/nmsce-logo.png"
            }

            img.src = reader.result
        }

        reader.readAsDataURL(file)
    } else {
        let canvas = document.getElementById("id-canvas")
        let ctx = canvas.getContext("2d")
        ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    }
}

// NMSCE.prototype.loadLogo = function (evt) {
//     let ctx = logocanvas.getContext("2d")
//     let file = evt.files[0]

//     if (file.type.match('image.*')) {
//         let reader = new FileReader()
//         reader.onload = function () {
//             let img = new Image()
//             img.onload = function () {
//                 logocanvas.width = canvas.width
//                 logocanvas.height = canvas.height
//                 ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
//             }

//             img.src = reader.result
//         }

//         reader.readAsDataURL(file)
//     }
// }

var texts = []
var selectedText = -1
var startX = 0
var startY = 0

NMSCE.prototype.saveText = async function () {
    delete bhs.user.nmscetext // can't merge arrays correctly
    bhs.user.nmscetext = texts

    let ref = bhs.getUsersColRef(bhs.user.uid)
    return await ref.set(bhs.user).then(() => {
        return true
    }).catch(err => {
        if (bhs.status)
            bhs.status("ERROR: " + err)

        console.log(err)
        return false
    })
}

NMSCE.prototype.showText = function () {
    if (typeof bhs.user.nmscetext !== "undefined") {
        texts = []
        let list = Object.keys(bhs.user.nmscetext)

        for (let i of list)
            nmsce.addSavedText(bhs.user.nmscetext[i])

        nmsce.drawText()
    }
}

NMSCE.prototype.addSavedText = function (text) {
    let loc = $("#img-text #txt-" + text.sub)
    loc.find("#ck-" + text.sub).prop("checked", true)
    loc.find("#size-" + text.sub).val(text.fontsize)
    loc.find("#sel-" + text.sub).val(text.color)
    loc.find("#btn-").text(text.font)

    let sloc = $("#pnl-S1")
    let id = $("#typeTabs .active").prop("id").stripID()
    let pnl = $("#typePanels #pnl-" + id)

    switch (text.sub) {
        case "Player-Name":
            text.text = bhs.user._name
            break
        case "System-Economy":
            text.text = sloc.find("#btn-Economy").text().stripNumber()
            break
        case "System-Name":
            text.text = sloc.find("#id-sys").val()
            break
        case "Coordinates":
            text.text = sloc.find("#id-addrInput #id-addr").val()
            break
        case "Glyphs":
            let loc = pnl.find("#id-Planet-Index")
            let num = loc.length > 0 && loc.val() >= 0 ? loc.val() : 0
            text.text = addrToGlyph(sloc.find("#id-addrInput #id-addr").val(), num)
            break
            // case "ck-objinfo":
            //     text.text = "ship info"
            //     text.color = $("#sel-objinfo").val()
            //     break
        case "Galaxy":
            text.text = bhs.user.galaxy
            break
        case "Platform":
            text.text = bhs.user.platform
            break
        case "Mode": {
            let loc = pnl.find("#btn-Game-Mode")
            text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
        }
        break
    case "Ship-Info": {
        let loc = pnl.find("#btn-Slots :visible")
        text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
    }
    break
    case "Text":
        $("#inp-Input-Text").val(text.text)
        break
    }

    texts.push(text)
}

NMSCE.prototype.reloadText = function () {
    for (let text of texts) {
        let sloc = $("#pnl-S1")
        let id = $("#typeTabs .active").prop("id").stripID()
        let pnl = $("#typePanels #pnl-" + id)

        switch (text.sub) {
            case "Player-Name":
                text.text = bhs.user._name
                break
            case "System-Economy":
                text.text = sloc.find("#btn-Economy").text().stripNumber()
                break
            case "System-Name":
                text.text = sloc.find("#id-sys").val()
                break
            case "Coordinates":
                text.text = sloc.find("#id-addrInput #id-addr").val()
                break
            case "Glyphs":
                let loc = pnl.find("#id-Planet-Index")
                let num = loc.length > 0 && loc.val() >= 0 ? loc.val() : 0
                text.text = addrToGlyph(sloc.find("#id-addrInput #id-addr").val(), num)
                break
                // case "ck-objinfo":
                //     text.text = "ship info"
                //     text.color = $("#sel-objinfo").val()
                //     break
            case "Galaxy":
                text.text = bhs.user.galaxy
                break
            case "Platform":
                text.text = bhs.user.platform
                break
            case "Mode": {
                let loc = pnl.find("#btn-Game-Mode :visible")
                text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
            }
            break
        case "Ship-Info": {
            let loc = pnl.find("#btn-Slots :visible")
            text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
        }
        break
        case "Text":
            text.text = $("#inp-Input-Text").val()
            break
        }
    }

    nmsce.drawText()
}

NMSCE.prototype.addText = function (evt) {
    let ck = $(evt).prop("checked")
    let id = $(evt).prop("id")
    let sub = id.stripID()
    let itm = $(evt).closest("[id|='txt']")

    if (ck) {
        var text = {
            font: itm.find("#btn-").text(),
            fontsize: parseInt(itm.find("#size-" + sub).val()),
            sub: sub,
            color: itm.find("#sel-" + sub).val(),
            x: 20,
            y: texts.length * 20 + 20,
        }

        let sloc = $("#pnl-S1")
        let id = $("#typeTabs .active").prop("id").stripID()
        let pnl = $("#typePanels #pnl-" + id)

        switch ($(evt).prop("id").stripID()) {
            case "Player-Name":
                text.text = bhs.user._name
                break
            case "System-Economy":
                text.text = sloc.find("#btn-Economy").text().stripNumber()
                break
            case "System-Name":
                text.text = sloc.find("#id-sys").val()
                break
            case "Coordinates":
                text.text = sloc.find("#id-addrInput #id-addr").val()
                break
            case "Glyphs":
                text.font = "glyph"
                let loc = pnl.find("#id-Planet-Index")
                let num = loc.length > 0 && loc.val() >= 0 ? loc.val() : 0
                text.text = addrToGlyph(sloc.find("#id-addrInput #id-addr").val(), num)
                break
                // case "ck-objinfo":
                //     text.text = "ship info"
                //     text.color = $("#sel-objinfo").val()
                //     break
            case "Galaxy":
                text.text = bhs.user.galaxy
                break
            case "Platform":
                text.text = bhs.user.platform
                break
            case "Mode": {
                let loc = pnl.find("#btn-Game-Mode")
                text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
            }
            break
        case "Ship-Info": {
            let loc = pnl.find("#btn-Slots")
            text.text = loc.length === 1 ? loc.text().stripMarginWS() : ""
        }
        break
        case "Text":
            text.text = $("#inp-Input-Text").val()
            break
        }

        let ctx = txtcanvas.getContext("2d")
        ctx.font = text.fontsize + "px " + text.font
        ctx.fillStyle = text.color
        text.width = ctx.measureText(text.text).width
        text.height = text.fontsize

        texts.push(text)
    } else {
        for (let i = 0; i < texts.length; ++i)
            if (texts[i].sub === sub)
                texts.splice(i, 1)
    }

    nmsce.drawText()
}

NMSCE.prototype.setFont = function (btn) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")
    let font = btn.text().stripMarginWS()
    let id = btn.closest("[id|='txt']").prop("id").stripID()

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub === id) {
            texts[i].font = font

            ctx.font = texts[i].fontsize + "px " + font
            texts[i].width = ctx.measureText(texts[i].text).width
            texts[i].height = texts[i].fontsize
        }

    nmsce.drawText()
}

NMSCE.prototype.setColor = function (evt) {
    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub === $(evt).prop("id").stripID())
            texts[i].color = $(evt).val()

    nmsce.drawText()
}

NMSCE.prototype.setSize = function (evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")
    let id = $(evt).prop("id").stripID()

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub === id) {
            texts[i].fontsize = parseInt($(evt).val())

            ctx.font = texts[i].fontsize + "px " + texts[i].font
            texts[i].width = ctx.measureText(texts[i].text).width
            texts[i].height = texts[i].fontsize
        }

    nmsce.drawText()
}

NMSCE.prototype.drawText = function () {
    let ctx = txtcanvas.getContext("2d")
    ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

    for (let text of texts) {
        if (text.font === "glyph") {
            ctx.fillStyle = text.color
            ctx.fillRect(text.x - 2, text.y - text.height, text.width + 4, text.height + 4)
            ctx.fillStyle = "#000000"
            ctx.fillRect(text.x - 1, text.y - text.height + 1, text.width + 2, text.height + 2)
        }

        ctx.font = text.fontsize + "px " + text.font
        ctx.fillStyle = text.color

        if (text.text.includes("\\n")) {
            let l = text.text.split("\\n")

            for (let i = 0; i < l.length; ++i) {
                ctx.fillText(l[i], text.x, text.y + i * (text.fontsize * 1.15))
            }
        } else
            ctx.fillText(text.text, text.x, text.y)
    }

    let canvas = document.getElementById("id-canvas")
    ctx = canvas.getContext("2d")

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.redditShare = function (evt) {
    let canvas = document.getElementById("id-canvas")

    canvas.toBlob(blob => {
        let name = "reddit/" + uuidv4() + ".jpg"
        bhs.fbstorage.ref().child(name).put(blob).then(() => {
            bhs.fbstorage.ref().child(name).getDownloadURL().then(url => {
                let u = "http://www.reddit.com/submit?url=" + encodeURI(url)
                window.open(u);
            })
        })

    }, "image/jpeg", .7)
}

NMSCE.prototype.textHittest = function (x, y, textIndex) {
    var text = texts[textIndex]
    return (x >= text.x && x <= text.x + text.width && y >= text.y - text.height && y <= text.y)
}

NMSCE.prototype.handleMouseDown = function (e) {
    e.preventDefault()

    var canvas = $(e.currentTarget).get(0)
    var canvasOffset = canvas.getBoundingClientRect()

    var offsetX = canvasOffset.left
    var offsetY = canvasOffset.top
    startX = parseInt(e.clientX - offsetX)
    startY = parseInt(e.clientY - offsetY)

    for (var i = 0; i < texts.length && selectedText === -1; i++)
        if (nmsce.textHittest(startX, startY, i))
            selectedText = i
}

NMSCE.prototype.handleMouseUp = function (e) {
    e.preventDefault()
    selectedText = -1
}

NMSCE.prototype.handleMouseOut = function (e) {
    e.preventDefault()
    selectedText = -1
}

NMSCE.prototype.handleMouseMove = function (e) {
    if (selectedText < 0)
        return

    e.preventDefault()
    var cid = $(e.currentTarget).get(0)
    var canvasOffset = cid.getBoundingClientRect()
    var offsetX = canvasOffset.left
    var offsetY = canvasOffset.top
    let mouseX = parseInt(e.clientX - offsetX)
    let mouseY = parseInt(e.clientY - offsetY)

    var text = texts[selectedText]

    var dx = mouseX - startX
    var dy = mouseY - startY
    startX = mouseX
    startY = mouseY

    text.x += dx
    text.y += dy

    nmsce.drawText()
}

NMSCE.prototype.updateEntry = function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    if (typeof entry.id === "undefined") {
        ref = ref.doc()
        entry.id = ref.id
    } else
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
            bhs.subscribe("nmsceentries-" + "type", ref, singleDispFcn)
        }
    }

    if (typeof displayFcn === "function")
        displayFcn(nmsce.entries)
}

NMSCE.prototype.displayList = function (entries) {
    const card = `
        <div class="container-flex h5">
            <div id="ttl-idname" class="card-header bkg-def txt-def" onclick="nmsce.showSub('#sub-idname')">
                <div class="row">
                    <div id="id-idname" class="col-3">title</div>
                    <div class="col-3">Total: total</div>
                </div>
            </div>
            <div id="sub-idname" class="container-flex h6 hidden">
                <div id="list-idname" class="scrollbar" style="overflow-y: scroll; height: 220px">`
    const row = `   <div id="row-idname" class="row border-bottom border-3 border-black format" onclick="nmsce.selectList(this)">
                        <div id="id-Photo" class="col-md-2 col-3">
                            <img id="img-pic" class="img-fluid" />
                        </div>
                        <div class="col-md-12 col-11">
                            <div class="row">`
    const itm = `              <div id="id-idname" class="col-lg-2 col-md-3 col-4 border">title</div>`
    const end = `</div></div></div>`

    let h = ""

    for (let obj of objectList) {
        if (typeof entries[obj.name.nameToId()] === "undefined")
            continue

        let l = /idname/g [Symbol.replace](card, obj.name.nameToId())
        if (fcesearch)
            l = /hidden/ [Symbol.replace](l, obj.name.nameToId())
        l = /title/ [Symbol.replace](l, obj.name)
        h += /total/ [Symbol.replace](l, entries[obj.name.nameToId()].length)

        l = /format/ [Symbol.replace](row, "txt-def bkg-def")

        if (fcesearch) {
            l = /col-md-2 col-3/ [Symbol.replace](l, "col-3")
            h += /col-md-12 col-11/ [Symbol.replace](l, "col-11")

            l = /idname/g [Symbol.replace](itm, "Player")
            h += /title/ [Symbol.replace](l, "Player")
            l = /idname/g [Symbol.replace](itm, "Coords")
            h += /title/ [Symbol.replace](l, "Glyphs")
            l = /idname/g [Symbol.replace](itm, "Economy")
            h += /title/ [Symbol.replace](l, "Economy")
        } else {
            h += l
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

        h += end

        for (let e of entries[obj.name.nameToId()]) {
            let l = /idname/ [Symbol.replace](row, e.id)

            if (fcesearch) {
                l = /col-md-2 col-3/ [Symbol.replace](l, "col-3")
                l = /col-md-12 col-11/ [Symbol.replace](l, "col-11")
                h += /wsize/ [Symbol.replace](l, "240px")

                l = /idname/g [Symbol.replace](itm, "Player")
                h += /title/ [Symbol.replace](l, e._name)
                l = /idname/g [Symbol.replace](itm, "Coords")
                l = /border/ [Symbol.replace](l, "border glyph")
                h += /title/ [Symbol.replace](l, addrToGlyph(e.addr, e["Planet-Index"]))
                l = /idname/g [Symbol.replace](itm, "Economy")
                h += /title/ [Symbol.replace](l, e.econ)
            } else {
                h += /wsize/ [Symbol.replace](l, "120px")

                l = /idname/g [Symbol.replace](itm, "Coords")
                h += /title/ [Symbol.replace](l, e.addr)
            }

            for (let f of obj.fields) {
                if (f.type !== "img" && f.type !== "map") {
                    let l = /idname/g [Symbol.replace](itm, f.name.nameToId())
                    if (typeof e[f.name.nameToId()] !== "undefined") {
                        if (f.type === "array") {
                            let items = Object.keys(e[f.name.nameToId()])

                            for (let i of items)
                                t += i + " "

                            h += /title/ [Symbol.replace](l, t)
                        } else
                            h += /title/ [Symbol.replace](l, e[f.name.nameToId()])
                    } else
                        h += /title/ [Symbol.replace](l, "")

                    if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            if (s.type !== "img" && s.type !== "map") {
                                let l = /idname/g [Symbol.replace](itm, s.name.nameToId())
                                if (typeof e[s.name.nameToId()] !== "undefined") {
                                    if (s.type === "array") {
                                        let items = Object.keys(e[s.name.nameToId()])
                                        let t = ""
                                        for (let i of items)
                                            t += i + " "

                                        h += /title/ [Symbol.replace](l, t)
                                    } else
                                        h += /title/ [Symbol.replace](l, e[s.name.nameToId()])
                                } else
                                    h += /title/ [Symbol.replace](l, "")
                            }
                        }
                }
            }

            h += end
        }

        h += end
    }

    $("#id-table").html(h)
    let loc = $("#id-table")

    for (let obj of objectList) {
        if (typeof entries[obj.name.nameToId()] === "undefined")
            continue

        for (let e of entries[obj.name.nameToId()]) {
            let eloc = loc.find("#row-" + e.id)
            for (let f of obj.fields) {
                if (f.type === "img") {
                    let ref = bhs.fbstorage.ref().child(e[f.name])
                    ref.getDownloadURL().then(url => {
                        eloc.find("#img-pic").attr("src", url)
                    })
                } else if (typeof f.sublist !== "undefined")
                    for (let s of f.sublist) {
                        if (s.type === "img") {
                            let ref = bhs.fbstorage.ref().child(e[s.name])
                            ref.getDownloadURL().then(url => {
                                eloc.find("#img-pic").attr("src", url)
                            })
                        }
                    }
            }
        }
    }
}

NMSCE.prototype.showSub = function (id) {
    let loc = $("#id-table")
    loc.find("[id|='sub']").hide()
    loc.find(id).show()
}

NMSCE.prototype.selectList = function (evt) {
    if (fcesearch) {
        nmsce.buildModal(evt)

        let loc = $('#modal')
        loc.modal("show")

        let width = loc.width()

        let src = $(evt).find("#img-pic")

        loc.find("#img-pic").css("width", width + "px")
        loc.find("#img-pic").attr("src", src.attr("src"))
    } else {
        let type = $(evt).closest("[id|='sub']").prop("id").stripID()
        let id = $(evt).prop("id").stripID()
        let i = getIndex(nmsce.entries[type], "id", id)
        let e = nmsce.entries[type][i]

        nmsce.last = e
        nmsce.displaySingle(e)
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
    let addr = $(".modal-body #coords").text()

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
            <area alt="h11" data-group=2 coords="88,130,87,162,162,163,162,129,121,131" shape="poly">
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
            <area alt="h2" data-group=1 coords="241,1,328,15,326,80,256,67" shape="poly">
            <area alt="h3" data-group=1 coords="2,2,6,40,104,85,144,71,137,40,60,4" shape="poly">
            <area alt="h4" data-group=1 coords="151,32,158,95,196,123,321,153,348,104,242,64" shape="poly">
            <area alt="h5" data-group=1 coords="2,41,1,112,134,170,148,110" shape="poly">
            <area alt="h6" data-group=1 coords="176,192,174,268,284,306,348,280,346,254" shape="poly">
            <area alt="h7" data-group=1 coords="0,119,-1,193,166,253,173,196" shape="poly">
            <area alt="h8" data-group=1 coords="154,107,162,181,325,242,345,170,226,141" shape="poly">
            <area alt="h9" data-group=1 coords="2,203,2,269,261,346,260,307" shape="poly">
            <area alt="h10" data-group=1 coords="5,273,2,357,271,399,302,398,305,363" shape="poly">
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
            <area alt="h3" coords="0,2,53,0,44,191,3,211" shape="poly">
            <area alt="h4" coords="56,1,53,51,102,48,165,19,117,1" shape="poly">
            <area alt="h5" coords="118,48,174,20,172,1,213,1,215,50" shape="poly">
            <area alt="h6" coords="221,11,217,63,315,41,323,4" shape="poly">
            <area alt="h7" coords="53,55,49,173,98,172,98,55" shape="poly">
            <area alt="h8" coords="105,52,104,103,171,101,208,85,208,54" shape="poly">
            <area alt="h9" coords="218,65,230,93,306,86,339,107,340,75,344,7,311,51,259,55" shape="poly">
            <area alt="h10" coords="175,103,192,125,255,119,300,112,299,90,221,96,210,86" shape="poly">
            <area alt="h12" coords="104,173,133,177,149,164,174,116,143,108" shape="poly">
            <area alt="h13" coords="4,216,0,251,30,267,108,268,108,195,47,192" shape="poly">
            <area alt="h14" coords="125,189,120,211,164,200,197,167,185,155" shape="poly">
            <area alt="h15" coords="120,212,118,224,214,230,211,213,174,205" shape="poly">
            <area alt="h16" coords="116,225,117,253,200,255,224,235" shape="poly">
            <area alt="h17" coords="192,131,208,163,200,178,173,195,212,203,218,218,241,204,266,176,297,173,270,143" shape="poly">
            <area alt="h18" coords="279,135,303,179,300,197,291,221,321,253,347,221,347,184,315,148" shape="poly">
            <area alt="h19" coords="203,255,205,281,242,284,270,243,314,271,325,261,285,219,293,188,266,184,238,232" shape="poly">
            <area alt="h20" coords="5,272,6,390,101,390,109,274" shape="poly">
            <area alt="h21" coords="114,272,103,394,215,391,220,299,180,264" shape="poly">
            <area alt="h22" data-group=2 coords="242,288,243,316,275,334,297,334,324,312,324,280,294,260,266,261" shape="poly">
            <area alt="h23" data-group=2 coords="226,333,223,394,286,395,287,341,249,328" shape="poly">
            <area alt="h24" data-group=2 coords="292,337,292,397,342,398,345,335" shape="poly">
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
    bodies: [{
        map: fighterBodiesMap,
    }],
    wings: [{
        map: fighterWingsMap,
    }],
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
    bodies: [{
        map: haulerBodiesMap,
    }],
    wings: [{
        map: haulerWingsMap,
    }],
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
    bodies: [{
        map: shuttleBodiesMap,
    }],
    wings: [{
        map: shuttleWingsMap,
    }],
}, {
    name: "Explorer",
    slotTtip: `
        T1 - 15 - 31 slots <br>
        T2 - 32 - 39 slots <br>
        T3 - 40 - 48 slots <br>`,
    bodies: [{
        map: explorerBodiesMap,
    }],
    classTtip: `
        S - 10 - 20 % damage, 55 - 60 % shield, 30 - 35 % hyperdrive <br>
        A - 5 - 10 % damage, 45 - 50 % shield, 15 - 25 % hyperdrive <br>
        B - 0 - 5 % damage, 25 - 35 % shield, 5 - 10 % hyperdrive <br>
        C - 12 - 20 % shield, 0 - 5 % hyperdrive`,
}, {
    name: "Exotic",
    bodies: [{
        map: exoticBodiesMap,
    }],
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
    name: "Alien",
}, {
    name: "Experimental",
}, {
    name: "Pistol",
}, {
    name: "Rifle",
}, ]

const sentinelList = [{
    name: "Low"
}, {
    name: "High"
}, {
    name: "Aggressive"
}]

const baseList = [{
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
        }, {
            name: "Wave",
            type: "number",
            range: "6",
            search: true,
        }, {
            name: "Class",
            type: "menu",
            ttip: "classTtip",
            list: classList,
            search: true,
        }, {
            name: "Slots",
            type: "menu",
            ttip: "slotTtip",
            sub: "slotList",
            list: slotList,
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
    fields: [{
        name: "Name",
        type: "string",
        search: true,
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
    fields: [{
        name: "Name",
        type: "string",
        search: true,
    }, {
        name: "Type",
        type: "menu",
        list: mtList,
        required: true,
        search: true,
    }, {
        name: "Class",
        type: "menu",
        list: classList,
        // ttipFld: "classTtip",
        required: true,
        search: true,
    }, {
        name: "Slots",
        type: "number",
        required: true,
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
        search: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
    }, {
        name: "Latitude",
        type: "string",
    }, {
        name: "Longitude",
        type: "string",
    }, {
        name: "Location Notes",
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
    fields: [{
        name: "Name",
        type: "string",
        search: true,
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
        search: true,
    }, {
        name: "Description",
        type: "long string",
    }, {
        name: "Planet Name",
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
    fields: [{
        name: "Name", // menu on search page??? like poi
        type: "string",
        search: true,
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
        search: true,
    }, {
        name: "Water Color",
        type: "menu",
        list: colorList,
        search: true,
    }, {
        name: "Sky Color",
        type: "menu",
        list: colorList,
        search: true,
    }, {
        name: "Notes",
        type: "long string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Base",
    fields: [{
        name: "Base Name",
        type: "string",
        required: true,
        search: true,
    }, {
        name: "Owner",
        type: "string",
        required: true,
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
        search: true,
    }, {
        name: "Latitude",
        type: "string",
        ttip: "Helpful finding bases on crowded planets.",
    }, {
        name: "Longitude",
        type: "string",
    }, {
        name: "Type",
        type: "menu",
        list: baseList,
        search: true,
        required: true,
    }, {
        name: "Description",
        type: "long string",
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];