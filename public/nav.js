'use strict'

// Copyright 2019-2020 Black Hole Suns
// Written by Stephen Piper
let shipimg

$(document).ready(() => {
    $("#javascript").remove()
    $("#jssite").show()

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })

    shipimg = new Image()
    shipimg.crossOrigin = "anonymous"
    shipimg.src = "/images/ship.svg"

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
        buildGlyphModal(dispGlyph)
    })

    $("#footer").load("footer.html")

    let w = $("#maplogo").parent().width()
    $("#logo").width(Math.min(w, 140))
    $("#logo").height(Math.min(w, 140))

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

        let err = validateAddress(saddr)
        if (err !== "") {
            status(err)
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

        let err = validateAddress(eaddr)
        if (err !== "") {
            status(err)
            return
        }
    }

    if (saddr !== "" && eaddr != "") {
        let dist = calcDist(saddr, eaddr)
        $("#id-dist").text(dist + " ly")

        let a = calcAngles(addressToXYZ(saddr), addressToXYZ(eaddr))
        $("#id-updown").html((a.vdist > 0 ? "Up: " : "Down: ") + (a.v > 90 ? 180 - a.v : a.v) + "&#176;")
        $("#id-leftright").html((a.hdist > 0 ? "Right: " : "Left: ") + +a.h + "&#176;")

        if (range !== "")
            $("#id-jumps").text(Math.ceil(dist / range))

        //mapPoints("plymap", saddr, eaddr)
        mapAngles("frontmap", a, saddr, eaddr)
    }

    if (typeof (Storage) !== "undefined") {
        window.localStorage.setItem('navstart', saddr)
        window.localStorage.setItem('navend', eaddr)
        window.localStorage.setItem('navrange', range)
    }
}

function dispGlyph(evt, loc) {
    let glyph = typeof evt === "string" ? evt : $(evt).val().toUpperCase()
    if (glyph !== "") {
        if (loc)
            loc.closest("[id|='w']").find("#id-glyph").val(glyph)
        else
            $(evt).val(glyph)

        let id = loc ? loc.closest("[id|='w']").prop("id") : $(evt).closest("[id|='w']").prop("id")

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

function status(str, clear) {
    if (clear)
        $("#status").empty()

    if (str !== "")
        $("#status").prepend(str + "</br>")
}

var tglZoom = false

function zoom() {
    var gd = document.getElementById('plymap')
    gd = gd.layout.scene.camera.eye
    console.log(JSON.stringify(gd))

    tglZoom = !tglZoom
    Plotly.relayout('plymap', changeMapLayout('plymap', tglZoom))
}

function alignXaxis() {
    var camera = document.getElementById('plymap')
    camera = camera.layout.scene.camera
    camera.center.x = camera.eye.x

    Plotly.relayout('plymap', changeMapLayout('plymap', tglZoom, camera))
}

function setCamera(evt) {
    camera.eye.x = $('#eyeX').val()
    camera.eye.y = $('#eyeY').val()
    camera.eye.z = $('#eyeZ').val()
    camera.center.x = $('#ctrX').val()
    camera.center.y = $('#ctrY').val()
    camera.center.z = $('#ctrZ').val()
    camera.up.x = $('#upX').val()
    camera.up.y = $('#upY').val()
    camera.up.z = $('#upZ').val()
    Plotly.relayout('plymap', changeMapLayout('plymap', tglZoom, camera))
}

var camera = {}
camera.eye = {
    x: 0,
    y: -.001,
    z: 2
}
camera.center = {
    x: 0,
    y: 0,
    z: 0
}
camera.up = {
    x: 0,
    y: 0,
    z: 1
}

function changeMapLayout(plot, zoom, cam) {
    if (!cam) {
        camera.eye = {
            x: 0,
            y: -.001,
            z: 2.5
        }
        camera.center = {
            x: 0,
            y: 0,
            z: 0
        }
        camera.up = {
            x: 0,
            y: 0,
            z: 1
        }
    } else
        camera = cam

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

    // camera.eye.x = -Math.cos((xstart-xctr)/(ystart-yctr))
    // camera.eye.y =-2*Math.sin((xstart-xctr)/(ystart-yctr))
    // camera.center.x = camera.eye.x

    // console.log(JSON.stringify(sxyz), JSON.stringify(camera))

    let layout = {
        hovermode: "closest",
        showlegend: false,
        paper_bgcolor: "#000000",
        plot_bgcolor: "#000000",
        scene: {
            camera: camera,
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
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        }
    }

    let w = $("#" + plot).width() - 8
    layout.width = w
    layout.height = w

    return layout
}

function calcPlane(C) {
    const A = zero
    const B = aboveZero

    // a=(By−Ay)(Cz−Az)−(Cy−Ay)(Bz−Az) 
    // b=(Bz−Az)(Cx−Ax)−(Cz−Az)(Bx−Ax) 
    // c=(Bx−Ax)(Cy−Ay)−(Cx−Ax)(By−Ay) 
    // d=−(aAx+bAy+cAz) 
    let n = {}
    n.a = (B.y - A.y) * (C.z - A.z) - (C.y - A.y) * (B.z - A.z)
    n.b = (B.z - A.z) * (C.x - A.x) - (C.z - A.z) * (B.x - A.x)
    n.c = (B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)
    n.d = -(n.a * C.x + n.b * C.y + n.c * C.z)

    let v = {}
    v.x = A.x - C.x
    v.y = A.y - C.y
    v.z = A.z - C.z

    let u = {
        x: n.a,
        y: n.b,
        z: n.c
    }

    let r = {}
    // | r.a, r.b, r.c | 
    // | u.x, u.y, u.z |
    // | v.x, v.y, v.z |

    r.a = u.y * v.z - u.z * v.y
    r.b = -u.x * v.z + u.z * v.x
    r.c = u.x * v.y - u.y * v.x
    r.d = -(r.a * C.x + r.b * C.y + r.c * C.z)

    return {
        n: n,
        r: r,
    }
}

function projOnPlane(p, xyz, rt) {
    let n = rt ? p.r : p.n

    let t = -(n.a * xyz.x + n.b * xyz.y + n.c * xyz.z + n.d) / (n.a * n.a + n.b * n.b + n.c * n.c)
    let pr = {}
    pr.x = n.a * t + xyz.x
    pr.y = n.b * t + xyz.y
    pr.z = n.c * t + xyz.z

    return pr
}

function distToPlane(p, xyz, rt) {
    let n = !rt ? p.r : p.n
    return (n.a * xyz.x + n.b * xyz.y + n.c * xyz.z + n.d) / Math.sqrt(n.a * n.a + n.b * n.b + n.c * n.c)
}

function calcAngles(b, c) { // b = start, c = dest
    let a = zero

    let p = calcPlane(b)
    let cv = projOnPlane(p, c)
    let ch = projOnPlane(p, c, true)

    return {
        v: parseInt(calcAngleA(a, b, cv)),
        vdist: distToPlane(p, c),
        h: parseInt(180 - calcAngleA(a, b, ch)),
        hdist: distToPlane(p, c, true)
    }
}

function calcAngleA(a, b, c) {
    let t = ((b.x - a.x) * (c.x - a.x) + (b.y - a.y) * (c.y - a.y) + (b.z - a.z) * (c.z - a.z)) /
        (Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z)) *
            Math.sqrt((c.x - a.x) * (c.x - a.x) + (c.y - a.y) * (c.y - a.y) + (c.z - a.z) * (c.z - a.z)))

    return Math.acos(t) * 180 / Math.PI
}

let drawing = document.createElement('canvas')

function mapAngles(p, a, saddr, eaddr) {
    let s = addressToXYZ(saddr)
    let e = addressToXYZ(eaddr)

    let ctx = drawing.getContext("2d")
    drawing.width = drawing.height = 215

    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(20, 20) //vert
    ctx.lineTo(20, 180)
    ctx.moveTo(10, 100) //cross-0
    ctx.lineTo(30, 100)
    ctx.moveTo(120, 20) //to ctr
    ctx.lineTo(120, 100)
    ctx.stroke()

    ctx.strokeStyle = "#606060"
    ctx.beginPath()
    ctx.moveTo(200, 100)
    ctx.arc(120, 100, 80, 0, 2 * Math.PI)
    ctx.stroke()

    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.lineCap = "round"
    ctx.beginPath()

    for (let i = 1; i < 6; ++i) {
        let x1 = Math.sin(i * 32.5 / 180 * Math.PI) * (i % 2 ? 65 : 75)
        let y1 = Math.cos((i * 32.5 - 180) / 180 * Math.PI) * (i % 2 ? 65 : 75)
        let x2 = Math.sin(i * 32.5 / 180 * Math.PI) * 80
        let y2 = Math.cos((i * 32.5 - 180) / 180 * Math.PI) * 80

        ctx.moveTo(120 + x1, 100 + y1)
        ctx.lineTo(120 + x2, 100 + y2)

        ctx.moveTo(120 - x1, 100 + y1)
        ctx.lineTo(120 - x2, 100 + y2)
    }

    ctx.stroke()

    ctx.font = "11px Arial"
    ctx.fillStyle = "white"
    ctx.fillText("Horizon", 5, 195)
    ctx.fillText("Angle from Galactic Center", 60, 195)
    ctx.fillText("32.5", 165, 30)
    ctx.fillText("0", 117, 18)
    ctx.fillText("0", 3, 104)

    let u = 100 - (a.v > 90 ? 180 - a.v : a.v) * (a.vdist > 0 ? 1 : -1)
    ctx.strokeStyle = "red"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(18, u)
    ctx.lineTo(30, u)
    ctx.stroke()

    ctx.fillText(a.v > 90 ? 180 - a.v : a.v, 3, u + 4)

    let x = Math.sin(a.h / 180 * Math.PI) * 80
    let y = Math.cos((a.h - 180) / 180 * Math.PI) * 80

    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(120, 100)
    ctx.lineTo(120 + x * (a.hdist > 0 ? 1 : -1), 100 + y)
    ctx.stroke()

    ctx.fillText(a.h, 120 + x * (a.hdist > 0 ? 1 : -1) + (a.hdist > 0 ? 3 : -20),
        100+y * (a.hdist > 0 ? 1 : 1) + (a.hdist > 0 ? 5 : 5))

    ctx.drawImage(shipimg, 112, 88, 16, 20)

    let canvas = document.getElementById("dir-canvas")
    ctx = canvas.getContext("2d")
    let width = $("#dir-canvas").parent().parent().parent().width()
    canvas.width = canvas.height = Math.min(width, 320)
    ctx.drawImage(drawing, 0, 0, canvas.width, canvas.height)
}

const zero = {
    x: 2048,
    y: 128,
    z: 2048,
}

const aboveZero = {
    x: 0x7ff,
    y: 0xfe,
    z: 0x7ff
}

function mapPoints(plot, saddr, eaddr, axis1, axis2) {
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

    // let p = calcPlane(sxyz)

    // out = initout()
    // pushentry(out, zero)
    // pushentry(out, aboveZero)
    // pushentry(out, sxyz)
    // data.push(makedata(out, 1, "#ffff00", "#ffff00", axis1, axis2))

    // out = initout()
    // pushentry(out, projOnPlane(p,{x:zero.x-0x100,y:zero.y-0x20,z:zero.z-0x100},true))
    // pushentry(out, projOnPlane(p,{x:sxyz.x-0x100,y:sxyz.y-0x20,z:sxyz.z-0x100},true))
    // pushentry(out, projOnPlane(p,exyz,true))
    // data.push(makedata(out, 1, "#ffff00", "#ffff00", axis1, axis2))

    // let v = projOnPlane(p, exyz)
    // let h = projOnPlane(p, exyz, true)

    // out = initout()
    // pushentry(out, v)
    // data.push(makedata(out, 3, "#ffff00", null, axis1, axis2))

    // out = initout()
    // pushentry(out, h)
    // data.push(makedata(out, 3, "#0000ff", null, axis1, axis2))

    tglZoom = true
    let layout = changeMapLayout(plot, tglZoom)

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