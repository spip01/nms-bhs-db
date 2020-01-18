'use strict'

// Copyright 2019 Black Hole Suns
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

        let gloc = $("[id='glyphbuttons']")
        addGlyphButtons(gloc, addGlyph)
    })

    if (typeof (Storage) !== "undefined") {
        let start = window.localStorage.getItem('navstart')
        let end = window.localStorage.getItem('navend')
        let range = window.localStorage.getItem('navrange')

        let loc = $("#id-addrInput")

        if (start) {
            let sloc = loc.find("#w-start")
            sloc.find("#id-addr").val(start)
        }

        if (end) {
            let eloc = loc.find("#w-end")
            eloc.find("#id-addr").val(end)
        }

        if (range)
            $("#id-range").val(range)

        dispAddr()
    }
})

function dispAddr(evt) {
    let loc = $("#id-addrInput")
    let gloc = $("#id-glyphInput")
    let sloc = loc.find("#w-start")
    let eloc = loc.find("#w-end")

    let saddr = sloc.find("#id-addr").val()
    let eaddr = eloc.find("#id-addr").val()
    let range = $("#id-range").val()

    if (saddr !== "") {
        saddr = reformatAddress(saddr)
        let glyph = addrToGlyph(saddr)

        sloc.find("#id-addr").val(saddr)
        sloc.find("#id-glyph").text(glyph)
        sloc.find("#id-hex").text(glyph)

        gloc.find("#w-start #id-addr").text(saddr)
        gloc.find("#w-start #id-glyph").val(glyph)

        let err = bhs.validateAddress(saddr)
        if (err !== "") {
            bhs.status(err)
            return
        }
    }

    if (eaddr !== "") {
        eaddr = reformatAddress(eaddr)
        let glyph = addrToGlyph(eaddr)

        eloc.find("#id-addr").val(eaddr)
        eloc.find("#id-glyph").text(glyph)
        eloc.find("#id-hex").text(glyph)

        gloc.find("#w-end #id-addr").text(eaddr)
        gloc.find("#w-end #id-glyph").val(glyph)

        let err = bhs.validateAddress(eaddr)
        if (err !== "") {
            bhs.status(err)
            return
        }
    }

    if (saddr !== "" && eaddr != "") {
        let dist = calcDist(saddr, eaddr)
        $("#id-dist").text(dist + " ly")

        let xzAngle = calcAngle(saddr, eaddr, "x", "z")
        $("#id-angle").text(xzAngle + " deg")

        if (range !== "")
            $("#id-jumps").text(Math.ceil(dist / range))

        mapPoints("plymap", saddr, eaddr)
    }

    if (typeof (Storage) !== "undefined") {
        window.localStorage.setItem('navstart', saddr)
        window.localStorage.setItem('navend', eaddr)
        window.localStorage.setItem('navrange', range)
    }
}

function dispGlyph(evt) {
    let glyph = $(evt).val().toUpperCase()
    if (glyph !== "") {
        $(evt).val(glyph)
        let id = $(evt).closest("[id|='w']").prop("id")

        let addr = reformatAddress(glyph)
        $("#id-addrInput #" + id + " #id-addr").val(addr)

        dispAddr()
    }
}

function setGlyphInput(evt) {
    if ($(evt).prop("checked")) {
        $("#id-glyphInput").show()
        $("#id-addrInput").hide()
        $("[id='ck-glyphs']").prop("checked", true)
    } else {
        $("#id-glyphInput").hide()
        $("#id-addrInput").show()
        $("[id='ck-glyphs']").prop("checked", false)
    }
}

function addGlyph(evt) {
    let loc = $(evt).closest("[id|='w']").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)
    if (a.length === 12)
        dispGlyph(loc)
}

var tglZoom = false

function zoom() {
    tglZoom = !tglZoom
    Plotly.relayout('plymap', changeMapLayout(tglZoom))
}

function changeMapLayout(zoom) {
    let xstart = 0
    let xctr = 2048
    let xend = 4095

    let zstart = 0
    let zctr = 128
    let zend = 255

    let ystart = 0
    let yctr = 2048
    let yend = 4095

    let loc = $("#id-addrInput")
    let saddr = loc.find("#w-start #id-addr").val()
    let eaddr = loc.find("#w-end #id-addr").val()

    let sxyz = addressToXYZ(saddr)

    if (zoom) {
        let d = parseInt(calcDist(saddr, eaddr) / 400)

        xctr = sxyz.x
        yctr = 4095 - sxyz.z
        zctr = sxyz.y

        xstart = xctr - d
        xend = xctr + d

        ystart = yctr - d
        yend = yctr + d

        zstart = zctr - d
        zend = zctr + d

        if (xstart < 0)
            xstart = 0
        if (xend > 4095)
            xend = 4095

        if (ystart < 0)
            ystart = 0
        if (yend > 4095)
            yend = 4095

        if (zstart < 0)
            zstart = 0
        if (zend > 255)
            zend = 255
    }

    let layout = {
        hovermode: "closest",
        showlegend: false,
        paper_bgcolor: "#000000",
        plot_bgcolor: "#000000",
        scene: {
            // camera: {
            //     eye: {
            //         x: sxyz.x,
            //         y: sxyz.z,
            //         z: sxyz.y
            //     }
            // },
            zaxis: {
                backgroundcolor: "#000000",
                gridcolor: "#c0c0c0",
                zerolinecolor: "#c0c0c0",
                showbackground: true,
                title: {
                    text: "Y",
                    font: {
                        color: "#c0c0c0",
                    }
                },
                range: [zstart, zend],
                tickvals: [zstart, zctr, zend],
                ticktext: [zstart.toString(16), zctr.toString(16), zend.toString(16)],
                tickfont: {
                    color: "#c0c0c0"
                },
                tickangle: 45,
            },
            xaxis: {
                backgroundcolor: "#000000",
                gridcolor: "#c0c0c0",
                zerolinecolor: "#c0c0c0",
                showbackground: true,
                title: {
                    text: "X",
                    font: {
                        color: "#c0c0c0",
                    }
                },
                range: [xstart, xend],
                tickvals: [xstart, xctr, xend],
                ticktext: [xstart.toString(16), xctr.toString(16), xend.toString(16)],
                tickfont: {
                    color: "#c0c0c0"
                },
                tickangle: 45,
            },
            yaxis: {
                backgroundcolor: "#000000",
                gridcolor: "#c0c0c0",
                zerolinecolor: "#c0c0c0",
                title: {
                    text: "Z",
                    font: {
                        color: "#c0c0c0",
                    }
                },
                showbackground: true,
                range: [ystart, yend],
                tickvals: [ystart, yctr, yend],
                ticktext: [yend.toString(16), yctr.toString(16), ystart.toString(16)],
                tickfont: {
                    color: "#c0c0c0"
                },
                tickangle: 45,
            },
        },
    }

    layout.margin = {
        l: 0,
        r: 0,
        b: 0,
        t: 0
    }

    let w = Math.min($("#plymap").width() - 8, 400)
    layout.width = w
    layout.height = w

    return layout
}

function mapPoints(plot, saddr, eaddr, axis1, axis2) {
    let w = $("#maplogo").width()
    $("#logo").css("width", Math.min(w, 100) + "px")
    $("#logo").height(Math.min(w, 100) + "px")

    let zero = {
        x: 2048,
        y: 128,
        z: 2048,
    }

    const sxyz = addressToXYZ(saddr)
    const exyz = addressToXYZ(eaddr)

    let data = []
    let out = initout()
    pushentry(out, zero, "Galactic Center")
    pushentry(out, sxyz)
    data.push(makedata(out, 5, "#ffffff", "#e0e0e0", axis1, axis2))

    out = initout()
    pushentry(out, sxyz, saddr)
    pushentry(out, exyz, eaddr)
    data.push(makedata(out, 5, "#00ff00", "#ff4040", axis1, axis2))

    out = initout()
    pushentry(out, exyz, eaddr)
    data.push(makedata(out, 5, "#ff0000", null, axis1, axis2))

    tglZoom = true
    let layout = changeMapLayout(tglZoom)

    if (axis1) {
        layout.width = 200
        layout.height = 200
    }

    Plotly.newPlot(plot, data, layout)
}

function pushentry(out, xyz, label) {
    out.x.push(xyz.x)
    out.y.push(4095 - xyz.z)
    out.z.push(xyz.y)
    out.t.push(label ? label : "")
}

function initout(out) {
    out = {}
    out.x = []
    out.y = []
    out.z = []
    out.t = []

    return out
}

function makedata(out, size, color, linecolor, axis1, axis2) {
    let line = {
        x: axis1 ? out[axis1] : out.x,
        y: axis2 ? out[axis2] : out.y,
        z: out.z,
        text: out.t,
        mode: 'markers',
        marker: {
            size: size,
            color: color,
            opacity: 0.6,
        },
        type: axis1 ? "scatter" : "scatter3d",
        hoverinfo: 'text',
        // scene: "scene"
    }

    if (linecolor) {
        line.mode = 'lines+markers'
        line.line = {
            color: linecolor,
            width: 2,
            opacity: 0.4,
        }
    }

    return line
}