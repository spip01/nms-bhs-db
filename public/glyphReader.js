'use strict'

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

var glyph

function Glyph() {}

export function buildGlyphModal(dispFcn) {
    glyph = new Glyph()
    glyph.display = dispFcn

    tmImage.load("/bin/model.json", "/bin/metadata.json").then(model => glyph.model = model)
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
        glyph.dispLoc = $(evt).parent().find("#ss-canvas")

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

    let sloc = glyph.dispLoc
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
        let imgData = ctx.getImageData(x, sel.y, div, sel.height)
        scanctx.putImageData(imgData, 0, 0)
        sctx.putImageData(imgData, (div + 1) * i, 0)
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

        glyph.display(g, glyph.dispLoc)

        $("body")[0].style.cursor = "default"
    })
}