'use strict'

$(document).ready(() => {
    startUp()

    bhs.last = []

    bhs.buildUserPanel()

    panels.forEach(p => {
        bhs.buildPanel(p.id)
    })

    bhs.buildTypePanels()

    $("#save").click(() => {
        bhs.save()
    })

    $("#delete").click(() => {
        $("#status").empty()
        panels.forEach(p => {
            bhs.deleteEntry($("#" + p.id + " #id-addr").val())
        })
    })

    $("#cancel").click(() => {
        bhs.displaySingle(bhs.last[pnlTop], pnlTop)
    })
})

const pnlTop = 0

var panels = [{
    name: "System Info",
    id: "pnl-S1",
    listid: "S1",
    calc: true,
}]

blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom bkg-trans-2">
            <div class="card-header txt-def h5">title</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Coordinates&nbsp;</div>
                    <input id="id-addr" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Portal Glyphs&nbsp;</div>
                    <div id="id-glyph" class="col-10 h4 txt-inp-def text-left glyph"></div>
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">System Name&nbsp;</div>
                    <input id="id-sys" class="rounded col-md-5 col-6">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Region Name&nbsp;</div>
                    <input id="id-reg" class="rounded col-md-5 col-6">&nbsp
                    </div>

                <div id="id-byrow" class="row">
                    <div class="col-4 h6 txt-inp-def">Entered by&nbsp;</div>
                    <div id="id-by" class="col-md-5 col-6 txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Lifeform" class="col-6"></div>
                </div>
                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Economy" class="col-6"></div>
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

    loc.find("#id-addr").unbind("change")
    loc.find("#id-addr").change(function () {
        let addr = reformatAddress($(this).val())
        $(this).val(addr)
        $(this).closest("[id|='pnl']").find("#id-glyph").html(addrToGlyph(addr))

        bhs.getEntry(addr, bhs.displaySingle, 0)
    })
}

blackHoleSuns.prototype.displayListEntry = function (entry) {
    if (entry.sys)
        bhs.displaySingle(entry.sys, pnlTop)

    bhs.last = entry
}

blackHoleSuns.prototype.displaySingle = function (entry, idx, zoom) {
    let loc = $("#" + panels[0].id)

    loc.find("#id-addr").val(entry.addr)
    loc.find("#id-glyph").html(addrToGlyph(entry.addr))
    loc.find("#id-sys").val(entry.sys)
    loc.find("#id-reg").val(entry.reg)

    loc.find("#id-by").html("<h6>" + entry._name ? entry._name : entry.player + "</h6>")

    loc.find("#btn-Lifeform").text(entry.life)

    if (entry.econ) {
        let l = economyList[getIndex(economyList, "name", entry.econ)].number
        loc.find("#btn-Economy").text(l + " " + entry.econ)
        loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";")
    }

    $("#entrybuttons").show()
    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")
}

blackHoleSuns.prototype.clearPanels = function () {
    panels.forEach(d => {
        bhs.clearPanel(d.id)
    })

    bhs.last = []

    $("#delete").addClass("disabled")
    $("#delete").prop("disabled", true)
}

blackHoleSuns.prototype.clearPanel = function (d) {
    let pnl = $("#" + d)

    pnl.find("input").each(() => {
        $(this).val("")
    })

    pnl.find("[id|='menu']").each(() => {
        $(this).find("[id|='btn']").text("")
    })
}

blackHoleSuns.prototype.extractEntry = async function (batch) {
    let entry = {}
    entry._name = bhs.user._name
    entry.org = bhs.user.org
    entry.uid = bhs.user.uid
    entry.platform = bhs.user.platform
    entry.galaxy = bhs.user.galaxy

    let loc = $("#pnl-S1")
    entry.addr = loc.find("#id-addr").val()
    entry.sys = loc.find("#id-sys").val()
    entry.reg = loc.find("#id-reg").val()
    entry.life = loc.find("#btn-Lifeform").text().stripNumber()
    entry.econ = loc.find("#btn-Economy").text().stripNumber()

    let ok = bhs.validateEntry(entry, true) === ""
    if (ok) {
        //bhs.updateEntry(entry, batch)

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
                    case "cklist":
                        if ($(loc).prop("checked")) {
                            let aid = $(r).prop("id").stripID()
                            if (typeof entry[aid] === "undefined")
                                entry[aid] = []
                            entry[aid].push(id)
                        }
                        break
                    case "checkbox":
                        entry[id] = $(loc).prop("checked")
                        break
                    case "img":
                        let canvas = $("#id-canvas")[0]
                        if (typeof canvas === "undefined")
                            entry[id] = ""
                        else {
                            if (typeof entry[id] === "undefined")
                                entry[id] = "nmsce/" + uuidv4() + ".jpg"

                            await canvas.toBlob(async blob => {
                                await bhs.fbstorage.ref().child(entry[id]).put(blob)
                            }, "image/jpeg", .7)
                        }
                }

                if (data.req)
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
            bhs.updateNmsce(entry, batch)
    }

    return ok
}

blackHoleSuns.prototype.save = async function () {
    $("#status").empty()

    let batch = bhs.fs.batch()

    let ok = bhs.saveUser(batch)

    if (ok)
        ok = await bhs.extractEntry(batch)

    if (ok)
        await batch.commit().then(() => {
            bhs.status("Save Successful")
            console.log("Save Successful")
        }).catch(err => {
            bhs.status("Error: " + err.code)
            console.log(err)
        })
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>")
}

blackHoleSuns.prototype.buildTypePanels = function () {
    let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#pnl-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`
    let header = `
        <div class="tab-pane fade show active" id="pnl-idname" role="tabpanel" aria-labelledby="tab-idname">
            <div id="itm-idname" class="row"></div>
        </div>`
    const tText = `
        <div data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
            <i class="far fa-question-circle"></i>
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
        <div id="img-idname" class="col-14">
            <div id="row-idname" data-type="img" data-req="ifreq" class="row">
                <div class="col-md-3 col-2 txt-inp-def h6">title</div>
                <input id="id-idname" type="file" class="col-8 form-control form-control-sm" 
                    accept="image/*" name="files[]" onchange="loadCanvasWithInputFile(this)">&nbsp
            </div>
            <br>
      </div>`

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
            for (let i = 0; i < obj.fields.length; ++i) {
                let f = obj.fields[i]
                let l = ""
                let id = f.name.nameToId()

                switch (f.type) {
                    case "menu":
                        appenditem(itm, tList, "", id, f.required)
                        let lst = itm.find("#list-" + id)
                        bhs.buildMenu(lst, f.name, f.list, f.sublist ? bhs.selectSublist : null)

                        if (f.required)
                            lst.find("#id-menu").html(f.name + `&nbsp;<font style="color:red">*</font>&nbsp;`)

                        if (f.sublist) {
                            for (let k = 0; k < f.list.length; ++k) {
                                let t = f.list[k]

                                for (let j = 0; j < f.sublist.length; ++j) {
                                    let slist = t[f.sublist[j].sub] ? t[f.sublist[j].sub] : f.sublist[j].list
                                    let sub

                                    if (slist) {
                                        if (f.sublist[j].type == "menu") {
                                            l = /idname/ [Symbol.replace](tSubList, (t.name + "-" + f.sublist[j].name).nameToId())
                                            appenditem(itm, l, "", f.sublist[j].name.nameToId(), f.sublist[j].required)

                                            sub = itm.find("#slist-" + (t.name + "-" + f.sublist[j].name).nameToId())
                                            bhs.buildMenu(sub, f.sublist[j].name, slist)

                                            if (f.sublist[j].required)
                                                sub.find("#id-menu").html(f.sublist[j].name + `&nbsp;<font style="color:red">*</font>&nbsp;`)

                                        } else if (f.sublist[j].type == "array") {
                                            l = /idname/ [Symbol.replace](tArray, (t.name + "-" + f.sublist[j].name).nameToId())
                                            appenditem(itm, l, "", f.sublist[j].name.nameToId(), false)

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

    $('[data-toggle="tooltip"]').tooltip()
}

blackHoleSuns.prototype.selectType = function (btn) {
    $("#typePanels [id|='pnl']").hide()
    $("#typePanels").find("#pnl-" + btn.text().stripMarginWS()).show()
}

blackHoleSuns.prototype.selectSublist = function (btn) {
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

let imgcanvas = document.createElement('canvas')
let txtcanvas = document.createElement('canvas')

const txtList = [{
    name: "Player Name",
}, {
    name: "System Info",
}, {
    name: "Portal Glyph",
    font: "glyph"
}, {
    name: "Galaxy",
}, {
    name: "Input Text",
    what: "inptxt"
}]

function loadCanvasWithInputFile(evt) {
    const cvs = `
        <div id="img-idname" class="card card-body">
            <canvas id="id-canvas" class="border"></canvas>
            <br>
            <div class="row">
                <button onclick="redditShare(this)"><img src="reddit.png" style="width:20px; height:20px" title="Share to reddit" alt="Share to reddit"></button>
            </div>
            <br>
            <div id="img-text" class="txt-inp-def h6"></div>    
        </div>`

    const hdr = `
        <div  class="row"> 
            <div class="col-4"></div>
            <div class="col-2 text-center">Color</div>
            <div class="col-2 text-center">Size</div>
            <div class="col-5">&nbsp;&nbsp;Font</div>
        </div>`

    const itm = `
        <div id="txt-idname" class="row"> 
            <label class="col-4">
                <input id="ck-idname" type="checkbox" onchange="addText(this)">
                title&nbsp;
            </label>
            <input id="sel-idname" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">&nbsp;
            <input id="size-idname" class="col-2" onchange="setSize(this)" type="number" value=16 min=0>
            <div id="id-" class="col-5"></div>
        </div>`

    const inptxt = `<input id="inp-Input-Text" class="col-13" type="text" onchange="addText(this)">`

    let file = evt.files[0]
    if (file.type.match('image.*')) {
        let id = file.name.nameToId()
        let h = /idname/g [Symbol.replace](cvs, id)
        let img = $("#imgtable")
        img.empty()
        img.show()
        img.append(h)

        h = hdr
        for (let i of txtList) {
            let l = /idname/g [Symbol.replace](itm, i.name.nameToId())
            l = /title/ [Symbol.replace](l, i.name)

            if (i.what === "inptxt")
                l = l.replace(/(.*)<\/div>$/, "$1" + inptxt + "<\div>")

            h += l
        }

        let loc = $("#img-text")
        loc.empty()
        loc.append(h)

        let fnt = loc.find("[id|='txt']")
        for (let loc of fnt) {
            let id = $(loc).prop("id")
            id = id.stripID().idToName()
            let i = getIndex(txtList, "name", id)
            if (typeof txtList[i].font === "undefined")
                bhs.buildMenu($(loc), "", fontList, setFont)
            else
                $(loc).find("#id-").text(txtList[i].font)
        }

        texts = []
        selectedText = -1

        img = img.find("#id-canvas")
        img.mousedown(e => {
            handleMouseDown(e)
        })
        img.mousemove(e => {
            handleMouseMove(e)
        })
        img.mouseup(e => {
            handleMouseUp(e)
        })
        img.mouseout(e => {
            handleMouseOut(e)
        })

        let imgctx = imgcanvas.getContext("2d")

        let canvas = img[0]
        let ctx = canvas.getContext("2d")

        let width = $("#img-" + id).width()

        let reader = new FileReader()
        reader.onload = function () {
            let img = new Image()
            img.onload = function () {
                canvas.width = imgcanvas.width = txtcanvas.width = width
                canvas.height = imgcanvas.height = txtcanvas.height = img.height * width / img.width
                imgctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                let logo = new Image()
                logo.onload = function () {
                    imgctx.drawImage(logo, 5, canvas.height - 35, 30, 30)
                    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
                }

                logo.src = "/nmsce.png"
            }

            img.src = reader.result
        }

        reader.readAsDataURL(file)
    }
}

var texts = []
var selectedText = -1
var startX = 0
var startY = 0

function addText(evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")

    let ck = $(evt).prop("checked")
    let id = $(evt).prop("id")
    let sub = id.replace(/ck-(.*)/, "$1")

    if (ck) {
        var text = {
            font: "verdana",
            fontsize: 16,
            sub: sub,
            color: $("#sel-" + sub).val(),
            x: 20,
            y: texts.length * 20 + 20,
        }

        switch ($(evt).prop("id")) {
            case "ck-Player-Name":
                text.text = "by " + bhs.user._name
                break
            case "ck-System-Info":
                text.text = $("#btn-Lifeform").text().stripMarginWS() + " " + $("#btn-Economy").text().stripNumber()
                break
            case "ck-Portal-Glyph":
                text.font = "glyph"
                text.size = 20
                let loc = $("#typeTabs .active").prop("id").stripID()
                loc = $("#typePanels #pnl-" + loc)
                loc = loc.find("#id-Planet-Number")
                let num = loc.length > 0 && loc.val() >= 0 ? loc.val() : 0
                text.text = addrToGlyph($("#id-addr").val(), num)
                break
                // case "ck-objinfo":
                //     text.text = "ship info"
                //     text.color = $("#sel-objinfo").val()
                //     break
            case "ck-Galaxy":
                text.text = bhs.user.galaxy
                text.color = $("#sel-galaxy").val()
                break
            case "ck-Input-Text":
                text.text = $(evt).closest("[id|='txt']").find("#inp-"+sub).val()
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

    drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

function setFont(btn) {
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

    drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

function setColor(evt) {
    let canvas = document.getElementById("id-canvas")
    let ctx = canvas.getContext("2d")

    for (let i = 0; i < texts.length; ++i)
        if (texts[i].sub == $(evt).prop("id").stripID())
            texts[i].color = $(evt).val()

    drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

function setSize(evt) {
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

    drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
}

function drawText() {
    let ctx = txtcanvas.getContext("2d")
    ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

    for (var i = 0; i < texts.length; i++) {
        var text = texts[i]
        if (text.sub == "glyph") {
            ctx.fillStyle = text.color
            ctx.fillRect(text.x - 2, text.y - text.height - 2, text.width + 4, text.height + 4)
            ctx.fillStyle = "#000000"
            ctx.fillRect(text.x - 1, text.y - text.height - 1, text.width + 2, text.height + 2)
        }

        ctx.font = text.fontsize + "px " + text.font
        ctx.fillStyle = text.color
        ctx.fillText(text.text, text.x, text.y)
    }
}

function redditShare(evt) {
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

function textHittest(x, y, textIndex) {
    var text = texts[textIndex]
    return (x >= text.x && x <= text.x + text.width && y >= text.y - text.height && y <= text.y)
}

function handleMouseDown(e) {
    e.preventDefault()

    var canvas = $(e.currentTarget).get(0)
    var canvasOffset = canvas.getBoundingClientRect()

    var offsetX = canvasOffset.left
    var offsetY = canvasOffset.top
    startX = parseInt(e.clientX - offsetX)
    startY = parseInt(e.clientY - offsetY)

    for (var i = 0; i < texts.length && selectedText == -1; i++)
        if (textHittest(startX, startY, i))
            selectedText = i
}

function handleMouseUp(e) {
    e.preventDefault()
    selectedText = -1
}

function handleMouseOut(e) {
    e.preventDefault()
    selectedText = -1
}

function handleMouseMove(e) {
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

    drawText()

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
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

// player name, galaxy, platform
const objectList = [{
    name: "Ship",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Wave",
        type: "number",
        ttip: "Wave based on looking away from spawn point after reload for 0, 29, 49 & 65 sec.",
        range: "4"
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        required: true,
        sublist: [{
            name: "Subtype",
            type: "menu",
            sub: "subType",
            required: true,
        }, {
            name: "Features",
            type: "array",
            sub: "features",
        }, {
            name: "Class",
            type: "menu",
            // ttip: "classTtip",
            list: classList
        }, {
            name: "Slots",
            type: "menu",
            ttip: "slotTtip",
            sub: "slotList",
            list: slotList,
        }, ]
    }, {
        name: "Primary Color",
        type: "menu",
        list: colorList,
        required: true,
    }, {
        name: "Secondary Color",
        type: "menu",
        list: colorList,
        // }, {
        //     name: "Seed",
        //     type: "string",
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
        sublist: [{
            name: "Subtype",
            sub: "subType",
        }, {
            name: "Slots",
            type: "menu",
            ttipFld: "slotTtip",
            list: slotList,
        }, {
            name: "Class",
            type: "menu",
            // ttipFld: "classTtip",
            list: classList,
        }, ]
    }, {
        name: "Primary Color",
        type: "menu",
        list: colorList,
        required: true,
    }, {
        name: "Secondary Color",
        type: "menu",
        list: colorList,
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
    }, {
        name: "Class",
        type: "menu",
        list: classList,
        // ttipFld: "classTtip",
        required: true,
    }, {
        name: "Slots",
        type: "number",
        required: true,
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
    }, {
        name: "Secondary Color",
        type: "menu",
        list: colorList,
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
        name: "Height",
        type: "float",
        range: 10.0,
        required: true,
    }, {
        name: "Description",
        type: "long string",
        required: true,
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
    }, {
        name: "Weather",
        type: "menu",
        list: weatherList,
    }, {
        name: "Sentinels",
        type: "menu",
        list: sentinelList,
        ttip: `Low - Sentinels only guard secure facilities<br>High - Patrols are present throughout the planet (orange icon)<br>Aggressive - Patrols are present throughout the planet and Sentinels will attack on sight (red icon)<br>`
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
    }, {
        name: "Owner",
        type: "string",
        required: true,
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
    }, {
        name: "Description",
        type: "long string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];