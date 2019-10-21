'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

var nmsce

const searchwindow = window.location.pathname == "/cesearch.html"

$(document).ready(() => {
    startUp()

    $("#cemenus").load("cemenus.html", () => {
        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("#navmenu").find("[href='" + page + "']")
        loc.addClass("clr-blue border rounded")
    })

    nmsce = new NMSCE()

    nmsce.last = null

    bhs.buildUserPanel()

    nmsce.buildPanel()
    nmsce.buildTypePanels()

    $("#save").click(() => {
        nmsce.save()
    })

    $("#delete").click(() => {
        $("#status").empty()
        //bhs.deleteEntry($("#pnl-S1 #id-addr").val())
    })

    $("#cancel").click(() => {
        if (nmsce.last)
            nmsce.displaySingle(nmsce.last)
        else {
            nmsce.clearPanel("pnl-S1")
            nmsce.clearPanel("typePanels")
        }
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
    if (bhs.user.galaxy !== "" && !searchwindow) {
        //nmsce.displaySettings(bhs.user)
        nmsce.getEntries(bhs.user, nmsce.displayList)
    }
}

NMSCE.prototype.buildPanel = function () {
    let loc = $("#pnl-S1")

    bhs.buildMenu(loc, "Lifeform", lifeformList)
    bhs.buildMenu(loc, "Economy", economyList, null, {
        required: !searchwindow
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

        if (!searchwindow)
            bhs.getEntry(addr, nmsce.displaySystem)
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

    nmsce.last = null

    $("#delete").addClass("disabled")
    $("#delete").prop("disabled", true)
}

NMSCE.prototype.extractEntry = async function (fcn, user) {
    if (typeof user === "undefined")
        user = bhs.user

    let entry = {}

    if (nmsce.last) {
        entry = mergeObjects(entry, nmsce.last)

        let addr = loc.find("#id-addr").val()
        if (nmsce.last.addr != addr) {
            ok = bhs.deleteEntry(nmsce.last)
            bhs.status("change address " + nmsce.last.addr)
        }
    }

    if (!nmsce.last || nmsce.last.uid == bhs.user.uid) {
        entry._name = user._name
        entry.org = user.org
        entry.uid = user.uid
        entry.platform = user.platform
        entry.galaxy = user.galaxy
    }

    entry.version = "beyond"
    entry.page = "nmsce"

    let loc = $("#pnl-S1")
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

        let list = pnl.find(":input")
        for (let loc of list) {
            if ($(loc).is(":visible")) {
                let id = loc.id.stripID()
                let r = $(loc).closest("[id|='row']")
                let data = r.data()

                if (typeof data === "undefined")
                    continue

                switch (data.type) {
                    case "num":
                    case "float":
                    case "string":
                        entry[id] = $(loc).val()
                        break
                    case "menu":
                        entry[id] = $(loc).text()
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
                    case "img":
                        if (!searchwindow && (entry.replaceImg || typeof entry[id] === "undefined")) {
                            delete entry.replaceImg

                            let canvas = $("#id-canvas")[0]
                            if (typeof canvas !== "undefined") {
                                if (typeof entry[id] === "undefined")
                                    entry[id] = "nmsce/" + uuidv4() + ".jpg"

                                await canvas.toBlob(async blob => {
                                    await bhs.fbstorage.ref().child(entry[id]).put(blob)
                                }, "image/jpeg", .7)
                            }
                        }
                        break
                }

                if (data.req && !searchwindow)
                    if (typeof entry[id] === "undefined" ||
                        (data.type === "string" || data.type === "menu") && entry[id] === "" ||
                        data.type === "num" && entry[id] === -1 ||
                        data.type === "img" && entry[id] === "") {

                        bhs.status(id + " required. Entry not saved.", 0)
                        ok = false
                        break
                    }
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

    let list = pnl.find(":input")
    for (let loc of list) {
        let id = loc.id.stripID()
        let r = $(loc).closest("[id|='row']")
        let rid = r.prop("id").stripID()
        let data = r.data()

        switch (data.type) {
            case "num":
            case "float":
            case "string":
                $(loc).val(entry[id])
                break
            case "menu":
                $(loc).text(entry[id])
                break
            case "array":
                $(loc).prop("checked", typeof entry[rid] !== "undefined" && entry[rid][id] ? true : false)
                break
            case "checkbox":
                $(loc).prop("checked", entry[id] ? true : false)
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

    let list = pnl.find(":input")
    for (let loc of list) {
        if ($(loc).is(":visible")) {
            let id = loc.id.stripID()

            let r = $(loc).closest("[id|='row']")
            let data = r.data()

            if (typeof data === "undefined")
                continue

            let val = null

            switch (data.type) {
                case "num":
                case "float":
                case "string":
                    val = $(loc).val()
                    if (val) ref = ref.where(id, "==", val)
                    break
                case "menu":
                    val = $(loc).text()
                    if (val) ref = ref.where(id, "==", val)
                    break
                case "array":
                    if ($(loc).prop("checked")) {
                        let aid = $(r).prop("id").stripID()
                        ref = ref.where(aid + "." + id, "==", true)
                    }
                    break
                case "checkbox":
                    if ($(loc).prop("checked"))
                        ref = ref.where(id, "==", true)
                    break
            }
        }
    }

    let snapshot = await ref.get()

    let found = {}
    found[tab] = []

    for (let doc of snapshot.docs) {
        found[tab].push(doc.data())
    }

    $("#id-table").empty()
    nmsce.displayList(found)
}

NMSCE.prototype.save = async function () {
    $("#status").empty()

    nmsce.saveText()

    if (bhs.saveUser())
        await nmsce.extractEntry(nmsce.updateEntry)
}

NMSCE.prototype.search = async function () {
    $("#status").empty()
    let user = bhs.extractUser()
    await nmsce.extractSearch(user)
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>")
}

NMSCE.prototype.buildTypePanels = function () {
    let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#pnl-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`
    let header = `
        <div class="tab-pane fade show active" id="pnl-idname" role="tabpanel" aria-labelledby="tab-idname">
            <div id="itm-idname" class="row"></div>
        </div>`
    const tText = `
        <div data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
            <i class="fa fa-question-circle-o text-danger h6"></i>
        </div>`
    const tBlank = `
        <div class="col-sm-7 col-14"></div>`
    const tString = `
        <div class="col-sm-7 col-14">
            <div id="row-idname" data-type="string" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">title</div>
                <input id="id-idname" class="rounded col-md-7 col-9">
            </div>
        </div>`
    const tLongString = `
        <div class="col-14">
            <div id="row-idname" data-type="string" data-req="ifreq" class="row">
                <div class="col-md-4 col-3 h6 txt-inp-def">title</div>
                <input id="id-idname" class="rounded col-md-9 col-10">
            </div>
        </div>`
    const tNumber = `
        <div class="col-sm-7 col-14">
            <div id="row-idname" data-type="num" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">title</div>
                <input id="id-idname" type="number" class="rounded col-md-5 col-6" min=0 max=range value=0>
            </div>
        </div>`
    const tFloat = `
        <div class="col-sm-7 col-14">
            <div id="row-idname" data-type="float" data-req="ifreq" class="row">
                <div class="col-md-6 col-5 h6 txt-inp-def">title</div>
                <input id="id-idname" type="number" class="rounded col-md-5 col-6" step=0.1 min=0 max=range value=-1>
            </div>
        </div>`
    const tList = `
        <div id="list-idname" class="col-sm-7 col-14">
            <div id="row-idname" data-type="menu" data-req="ifreq" class="row">
                <div id="id-idname" class="col-12"></div>
            </div>
        </div>`
    const tArray = `
        <div id="slist-idname" class="col-14 border-top border-bottom hidden">
            <div id="row-idname" data-type="array" data-req="ifreq" class="row"></div>
        </div>`
    const tArrayItm = `
        <label id="id-idname" class="col-sm-3 col-4 h6 txt-inp-def">
            title&nbsp
            <input id="ck-idname" type="checkbox">
        </label>`
    const tCkItem = `
        <div id="row-idname" data-type="checkbox" data-req="false" class=col-sm-7 col-14">
            <label id="id-idname" class="h6 txt-inp-def">
                title&nbsp
                <input id="ck-idname" type="checkbox">
            </label>
        </div>`
    const tSubList = `
        <div id="slist-idname" class="col-sm-7 col-14 hidden">
            <div id="row-idname" data-type="menu" data-req="ifreq" class="row">
                <div id="id-idname" class="col-12"></div>
            </div>
        </div>`
    const tImg = `
        <div id="row-idname" data-type="img" data-req="ifreq" class="row text-center">
            <div class="col-md-4 col-3 txt-inp-def h6">title</div>
            <input id="id-idname" type="file" class="col-10 form-control form-control-sm" 
                accept="image/*" name="files[]" onchange="nmsce.loadScreenshot(this)">&nbsp
        </div>
        <br>`

    let tabs = $("#typeTabs")
    let pnl = $("#typePanels")

    let appenditem = (itm, add, title, id, req) => {
        let l = /title/ [Symbol.replace](add, title + (req ? `&nbsp;<font style="color:red">*</font>&nbsp;` : ""))
        l = /idname/g [Symbol.replace](l, id)
        l = /ifreq/ [Symbol.replace](l, req ? true : false)
        itm.append(l)
    }

    objectList.forEach(obj => {
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
                if (searchwindow && !f.search)
                    continue

                let l = ""
                let id = f.name.nameToId()

                if (searchwindow)
                    f.required = false

                switch (f.type) {
                    case "menu":
                        appenditem(itm, tList, "", id)
                        let lst = itm.find("#list-" + id)
                        bhs.buildMenu(lst, f.name, f.list, f.sublist ? nmsce.selectSublist : null, f)

                        if (f.sublist) {
                            for (let t of f.list) {
                                for (let j = 0; j < f.sublist.length; ++j) {
                                    let slist = t[f.sublist[j].sub] ? t[f.sublist[j].sub] : f.sublist[j].list
                                    let sub

                                    if (searchwindow && !f.sublist[j].search)
                                        continue

                                    if (slist) {
                                        if (f.sublist[j].type == "menu") {
                                            l = /idname/ [Symbol.replace](tSubList, (t.name + "-" + f.sublist[j].name).nameToId())
                                            appenditem(itm, l, "", f.sublist[j].name.nameToId())

                                            sub = itm.find("#slist-" + (t.name + "-" + f.sublist[j].name).nameToId())
                                            bhs.buildMenu(sub, f.sublist[j].name, slist, f)
                                        } else if (f.sublist[j].type == "array") {
                                            l = /idname/ [Symbol.replace](tArray, (t.name + "-" + f.sublist[j].name).nameToId())
                                            appenditem(itm, l, "", f.sublist[j].name.nameToId())

                                            sub = itm.find("#slist-" + (t.name + "-" + f.sublist[j].name).nameToId())
                                            sub = sub.find("#row-" + f.sublist[j].name.nameToId())

                                            for (let m = 0; m < slist.length; ++m)
                                                appenditem(sub, tArrayItm, slist[m].name, slist[m].name.nameToId())
                                        }

                                        if (f.sublist[j].ttip) {
                                            l = /ttext/ [Symbol.replace](tText, t[f.sublist[j].ttip])
                                            sub.find("#row-" + f.sublist[j].name.nameToId()).append(l)
                                        }
                                    }
                                }
                            }
                        }
                        break

                    case "number":
                        l = /range/ [Symbol.replace](tNumber, f.range)
                        appenditem(itm, l, f.name, id, f.required)
                        break
                    case "float":
                        l = /range/ [Symbol.replace](tFloat, f.range)
                        appenditem(itm, l, f.name, id, f.required)
                        break
                    case "img":
                        appenditem(itm, tImg, f.name, id, f.required)
                        break
                    case "checkbox":
                        appenditem(itm, tCkItem, f.name, id, f.required)
                        break
                    case "string":
                        appenditem(itm, tString, f.name, id, f.required)
                        break
                    case "long string":
                        appenditem(itm, tLongString, f.name, id, f.required)
                        break
                    case "blank":
                        itm.append(tBlank)
                        break
                }

                if (f.ttip) {
                    l = /ttext/ [Symbol.replace](tText, f.ttip)
                    itm.find("#row-" + id).append(l)
                }
            }
        }
    })
}

NMSCE.prototype.selectType = function (btn) {
    $("#typePanels [id|='pnl']").hide()
    $("#typePanels").find("#pnl-" + btn.text().stripMarginWS()).show()
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

    for (let i = 0; i < sub.length; ++i)
        pnl.find("#slist-" + (t + "-" + sub[i].name).nameToId()).show()
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
    name: "Text",
    what: "txt",
    ttip: "Uses 'Input Text' field below."
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
            l = /ttip/ [Symbol.replace](l, i.ttip)
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
                    imgctx.drawImage(logo, canvas.width - 35, canvas.height - 35, 30, 30)
                    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)

                    nmsce.showText()
                }

                logo.src = "/nmsce.png"
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

NMSCE.prototype.saveText = function () {
    bhs.updateUser({
        nmscetext: texts
    })
}

NMSCE.prototype.clearText = function () {
    nmsce.loadScreenshot()
}

NMSCE.prototype.showText = function () {
    if (typeof bhs.user.nmscetext !== "undefined") {
        texts = []
        let list = Object.keys(bhs.user.nmscetext)

        for (let i of list)
            nmsce.addSavedText(bhs.user.nmscetext[i])

        nmsce.drawText()

        let canvas = document.getElementById("id-canvas")
        let ctx = canvas.getContext("2d")
        ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
        ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
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
        case "Mode":
            let mloc = pnl.find("#btn-Game-Mode")
            text.text = mloc.length === 1 ? mloc.text().stripMarginWS() : ""
            break
        case "Text":
            $("#inp-Input-Text").val(text.text)
            break
    }

    texts.push(text)
}

NMSCE.prototype.addText = function (evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")

    let ck = $(evt).prop("checked")
    let id = $(evt).prop("id")
    let sub = id.replace(/ck-(.*)/, "$1")
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
            case "Mode":
                let mloc = pnl.find("#btn-Game-Mode")
                text.text = mloc.length === 1 ? mloc.text().stripMarginWS() : ""
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
            if (texts[i].sub == sub)
                texts.splice(i, 1)
    }

    nmsce.drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.setFont = function (btn) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")
    let font = btn.text().stripMarginWS()
    let id = btn.closest("[id|='txt']").prop("id").stripID()

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub == id) {
            texts[i].font = font

            ctx.font = texts[i].fontsize + "px " + font
            texts[i].width = ctx.measureText(texts[i].text).width
            texts[i].height = texts[i].fontsize
        }

    nmsce.drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.setColor = function (evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub == $(evt).prop("id").stripID())
            texts[i].color = $(evt).val()

    nmsce.drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.setSize = function (evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")
    let id = $(evt).prop("id").stripID()

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub == id) {
            texts[i].fontsize = parseInt($(evt).val())

            ctx.font = texts[i].fontsize + "px " + texts[i].font
            texts[i].width = ctx.measureText(texts[i].text).width
            texts[i].height = texts[i].fontsize
        }

    nmsce.drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
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
        ctx.fillText(text.text, text.x, text.y)
    }
}

NMSCE.prototype.redditShare = function (evt) {
    let canvas = document.getElementById("id-canvas")

    canvas.toBlob(blob => {
        let name = "temp/" + uuidv4() + ".jpg"
        bhs.fbstorage.ref().child(name).put(blob).then(() => {
            bhs.fbstorage.ref().child(name).getDownloadURL().then(url => {
                let u = 'https://reddit.com/' + url
                window.open(u)
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

    for (var i = 0; i < texts.length && selectedText == -1; i++)
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
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")

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

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

NMSCE.prototype.updateEntry = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    if (typeof entry.id === "undefined") {
        ref = ref.doc()
        entry.id = ref.id
    } else
        ref = ref.doc(entry.id)

    await ref.set(entry, {
        merge: true
    }).then(() => {
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
                <div id="list-idname" class="scrollbar" style="overflow-y: scroll; height: 180px">`
    const row = `   <div id="row-idname" class="row border-bottom border-3 border-black format" onclick="nmsce.selectList(this)">
                        <div id="id-Photo" class="col-md-2 col-3">
                            <img id="img-pic" height="auto" width="wsize" />
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
        if (searchwindow)
            l = /hidden/ [Symbol.replace](l, obj.name.nameToId())
        l = /title/ [Symbol.replace](l, obj.name)
        h += /total/ [Symbol.replace](l, entries[obj.name.nameToId()].length)

        l = /format/ [Symbol.replace](row, "txt-def bkg-def")

        if (searchwindow) {
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
            if (f.type !== "img") {
                let l = /idname/g [Symbol.replace](itm, f.name.nameToId())
                h += /title/ [Symbol.replace](l, f.name)

                if (typeof f.sublist !== "undefined")
                    for (let s of f.sublist) {
                        let l = /idname/g [Symbol.replace](itm, s.name.nameToId())
                        h += /title/ [Symbol.replace](l, s.name)
                    }
            }
        }

        h += end

        for (let e of entries[obj.name.nameToId()]) {
            let l = /idname/ [Symbol.replace](row, e.id)

            if (searchwindow) {
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
                if (f.type !== "img") {
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
            for (let f of obj.fields)
                if (f.type === "img") {
                    let ref = bhs.fbstorage.ref().child(e[f.name])
                    ref.getDownloadURL().then(url => {
                        eloc.find("#img-pic").attr("src", url)
                    })
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
    if (searchwindow) {
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
            <img id="img-pic" height="auto" width="wsize" />
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

const shipList = [{
    name: "Fighter",
    slotTtip: `
        T1 - 15-19 slots<br>
        T2 - 20-29 slots<br>
        T3 - 30-38 slots`,
    // classTtip: `
    //     S - 55-60% damage, 15-25% shield<br>
    //     A - 35-50% damage, 15-20% shield<br>
    //     B - 15-30% damage, 5-10% shield<br>
    //     C - 5-10% damage`,
    subType: [{
        name: "Needle Nose"
    }, {
        name: "Long Nose"
    }, {
        name: "Short Nose"
    }, {
        name: "Barrel Nose"
    }, {
        name: "Rasa"
    }, ],
    features: [{
        name: "Droid"
    }, {
        name: "Halo"
    }, {
        name: "X-Wing"
    }, ]
}, {
    name: "Hauler",
    subType: [{
        name: "Tilt Wing"
    }, {
        name: "Fan Wing"
    }, {
        name: "Baller"
    }, {
        name: "Box"
    }, ],
    slotTtip: `
        T1 - 15-19 slots<br>
        T2 - 20-29 slots<br>
        T3 - 30-38 slots`,
    // classTtip: `
    //     S - 55-60% damage, 15-25% shield<br>
    //     A - 35-50% damage, 15-20% shield<br>
    //     B - 15-30% damage, 5-10% shield<br>
    //     C - 5-10% damage`,
}, {
    name: "Shuttle",
    slotList: [{
        name: "T1"
    }, {
        name: "T2"
    }],
    slotTtip: `
        T1 - 18-23 slots<br>
        T2 - 19-28 slots`,
    // classTtip: `
    //     S - 55-60% damage, 15-25% shield<br>
    //     A - 35-50% damage, 15-20% shield<br>
    //     B - 15-30% damage, 5-10% shield<br>
    //     C - 5-10% damage`,
}, {
    name: "Explorer",
    slotTtip: `
        T1 - 15 - 31 slots < br >
        T2 - 32 - 39 slots < br >
        T3 - 40 - 48 slots < br >`,
    // classTtip: `
    //     S - 10 - 20 % damage, 55 - 60 % shield, 30 - 35 % hyperdrive < br >
    //     A - 5 - 10 % damage, 45 - 50 % shield, 15 - 25 % hyperdrive < br >
    //     B - 0 - 5 % damage, 25 - 35 % shield, 5 - 10 % hyperdrive < br >
    //     C - 12 - 20 % shield, 0 - 5 % hyperdrive`,
}, {
    name: "Exotic",
}]

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
},{
    name: "Maze"
},{
    name: "Low Orbit"
},{
    name: "Under Water"
},{
    name: "Large"
},{
    name: "Civ Capital"
},{
    name: "Civ Hub"
},]

const faunaList = [{
    name: "Diplo"
},{
    name: "Huge"
},{
    name: "Cute"
},]

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
    name: "Red",
}, {
    name: "Orange",
}, {
    name: "Yellow",
}, {
    name: "Green",
}, {
    name: "Blue",
}, {
    name: "Purple",
}, {
    name: "Black",
}, {
    name: "Grey",
}, {
    name: "White",
}, {
    name: "Cream",
}, {
    name: "Chrome",
}, {
    name: "Bronze",
}, {
    name: "Gold",
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

const freighterList = [{
    name: "Sentenel"
}, {
    name: "Venator"
}]

const planetNumTip = `This is the first glyph in the portal address. Assigned to each celestial body according to their aphelion.`

const objectList = [{
    name: "Ship",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Wave",
        type: "number",
        ttip: "Wave based on looking away from spawn point after reload for 0, 29, 49 & 65 sec.",
        range: "4",
        search: true,
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        required: true,
        search: true,
        sublist: [{
            name: "Subtype",
            type: "menu",
            sub: "subType",
            required: true,
            search: true,
        }, {
            name: "Features",
            type: "array",
            sub: "features",
            search: true,
        }, {
            name: "Class",
            type: "menu",
            // ttip: "classTtip",
            list: classList,
            search: true,
        }, {
            name: "Slots",
            type: "menu",
            ttip: "slotTtip",
            sub: "slotList",
            list: slotList,
            search: true,
        }, ]
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
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Freighter",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Type",
        type: "menu",
        list: freighterList,
        required: true,
        search: true,
        sublist: [{
            name: "Subtype",
            sub: "subType",
            search: true,
        }, {
            name: "Slots",
            type: "menu",
            ttipFld: "slotTtip",
            list: slotList,
            search: true,
        }, {
            name: "Class",
            type: "menu",
            // ttipFld: "classTtip",
            list: classList,
            search: true,
        }, ]
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
        // },{
        //     name: "Seed",
        //     type: "string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Multi-Tool",
    fields: [{
        name: "Name",
        type: "string"
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
    }, {
        name: "",
        type: "blank",
    }, {
        name: "Planet Name",
        type: "string",
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
        // },{
        //     name: "Seed",
        //     type: "string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Flora",
    fields: [{
        name: "Name",
        type: "string",
    }, {
        name: "Description",
        type: "long string",
        required: true,
        search: true,
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
    name: "Fauna",
    fields: [{
        name: "Name",
        type: "string",
    }, {
        name: "Type",
        type: "menu",
        list: faunaList,
        required: true,
    },  {
        name: "Height",
        type: "float",
        range: 15.0,
        required: true,
    }, {
        name: "Description",
        type: "long string",
        required: true,
        search: true,
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
        name: "Name",
        type: "string",
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
        name: "Weather",
        type: "menu",
        list: weatherList,
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
        name: "Name",
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
        name: "Type",
        type: "menu",
        list: baseList,
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