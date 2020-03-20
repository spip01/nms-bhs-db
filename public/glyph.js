'use strict'

// Copyright 2019-2020 Black Hole Suns
// Written by Stephen Piper

$(document).ready(() => {
    $("#javascript").remove()
    $("#jssite").show()

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })

    $("#bhsmenus").load("bhsmenus.html", () => {
        $("#login").hide()

        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("[href='" + page + "']")
        $("#pagename").html(loc.text())

        $("#banner").on("load", () => {
            let width = $("body").width()
            loc = $("[src='images/bhs-banner.jpg']")
            let iwidth = loc.width()
            let iheight = loc.height() * width / iwidth

            loc.width(width)
            loc.height(iheight)
        })
    })

    let gloc = $("[id='glyphbuttons']")
    addGlyphButtons(gloc, addGlyph)
    buildGlyphModal(dispGlyph)

    tmImage.load("/bin/model.json", "/bin/metadata.json").then(model => glyph.model = model)
})

function dispAddr(evt) {
    let loc = $(evt).closest(".card")
    let addr = loc.find("#id-addr").val()

    if (addr !== "") {
        addr = reformatAddress(addr)
        loc.find("#id-addr").val(addr)

        let planet = loc.find("#id-planet").val()
        let glyph = addrToGlyph(addr, planet)
        loc.find("#id-glyph").text(glyph)
        loc.find("#id-hex").text(glyph)
    }
}

function dispGlyph(evt) {
    let glyph = typeof evt === "string" ? evt : $(evt).val().toUpperCase()
    if (glyph !== "") {
        let addr = reformatAddress(glyph)
        let planet = glyph.slice(0, 1)
        let loc = $("#glyph-card")
        loc.find("#id-glyph").val(glyph)
        loc.find("#id-addr").text(addr)
        loc.find("#id-planet").text(planet)
    }
}

function addGlyph(evt) {
    let loc = $(evt).closest(".card").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        dispGlyph(loc)
}

/*****************************************************/

var glyph

function Glyph() {}

function buildGlyphModal(dispfcn) {
    glyph = new Glyph()
    glyph.display = dispfcn
}

Glyph.prototype.loadGlyphImage = function (evt) {
    $("body")[0].style.cursor = "wait"

    glyph.selectLocation = {
        x: 4,
        y: 412,
        height: 14,
        width: 158,
        naturalWidth: 3840,
        naturalHeight: 2160,
        modalWidth: 782,
        modalHeight: 439,
        scale: 0,
    }

    let file = evt.files[0]
    if (file) {
        let reader = new FileReader()
        reader.onload = function () {
            glyph.screenshot = new Image()
            glyph.screenshot.crossOrigin = "anonymous"

            glyph.screenshot.onload = function () {
                glyph.scaleSelection()
                glyph.extractGlyphs()
            }

            glyph.screenshot.src = reader.result
        }

        reader.readAsDataURL(file)
    }
}

Glyph.prototype.scaleSelection = function () {
    if (!glyph.selectLocation.scale) {
        glyph.selectLocation.scale = glyph.screenshot.naturalWidth / glyph.selectLocation.modalWidth
        glyph.selectLocation.x *= glyph.selectLocation.scale
        glyph.selectLocation.y *= glyph.screenshot.naturalHeight / glyph.selectLocation.modalHeight
        glyph.selectLocation.width *= glyph.selectLocation.scale
        glyph.selectLocation.height *= glyph.selectLocation.scale
    }
}

Glyph.prototype.extractGlyphs = function () {
    let sel = glyph.selectLocation
    let div = sel.width / 12

    let canvas = document.createElement('canvas')
    let ctx = canvas.getContext("2d")
    canvas.width = glyph.screenshot.naturalWidth
    canvas.height = glyph.screenshot.naturalHeight
    ctx.drawImage(glyph.screenshot, 0, 0)

    let sloc = $("#ss-canvas")
    sloc.width(sel.width + 12)
    sloc.height(sel.height)

    let sctx = sloc[0].getContext("2d")
    sloc[0].width = sel.width + 12
    sloc[0].height = sel.height

    let scanglyph = document.createElement('canvas')
    let scanctx = scanglyph.getContext("2d")
    scanglyph.width = div
    scanglyph.height = div

    let x = sel.x 
    let p = []

    for (let i = 0; i < 12; ++i) {
        let imgData = ctx.getImageData(x, sel.y , div, sel.height )
        scanctx.putImageData(imgData, 0, 0)
        sctx.putImageData(imgData, (div+1) * i, 0)
        x += div

        p.push(glyph.model.predict(scanglyph).then(predict => {
            let max = 0.0
            let sel = -1
            let idx = 0
            for (let p of predict) {
                if (p.probability > max) {
                    max = p.probability
                    idx = i
                    sel = p
                }
            }

            return {
                idx: idx,
                class: sel.className,
                prob: sel.probability.toFixed(4),
            }
        }))
    }

    Promise.all(p).then(res => {
        res.sort((a, b) => a.idx - b.idx)
        let g = ""
        for (let i = 0; i < res.length; ++i)
            g += res[i].class

        glyph.display(g)

        $("body")[0].style.cursor = "default"
    })
}
