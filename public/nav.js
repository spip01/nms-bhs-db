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

        let gloc = $("[id='glyphbuttons']")
        addGlyphButtons(gloc, addGlyph)
        buildGlyphModal(dispGlyph)
    })

    $("#footer").load("footer.html")

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
        $("#id-updown").html((a.vdist > 0 ? "Up: " : "Up: ") + a.v + "&#176;")
        $("#id-leftright").html((a.hdist < 0 ? "Right: " : "Left: ") + +a.h + "&#176;")

        if (range !== "")
            $("#id-jumps").text(Math.ceil(dist / range))

        mapPoints("plymap", saddr, eaddr)
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
    gd = gd.layout.camera

    tglZoom = !tglZoom
    Plotly.relayout('plymap', changeMapLayout('plymap', tglZoom))
}

function changeMapLayout(plot, zoom) {
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
            camera: {
                up: {
                    x: 0,
                    y: 0,
                    z: 1
                },
                center: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                eye: {
                    x: 0,
                    y: -.01,
                    z: 2,
                }
            },
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
    const B = {
        x: 0x7ff,
        y: 0x90,
        z: 0x7ff
    }

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
    r.d = -(r.a * C.x + r.b * C.y + r.c * C.z) // ?????????????/

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
    return (n.a * xyz.x + n.b * xyz.y + n.c * xyz.z) / Math.sqrt(n.a * n.a + n.b * n.b + n.c * n.c)
}

function calcAngles(b, c) { // b = start, c = dest
    let a = zero

    let p = calcPlane(b)
    let cv = projOnPlane(p, c)
    let ch = projOnPlane(p, c, true)

    return {
        v: parseInt(calcAngleA(a, b, cv)),
        vdist: distToPlane(p, c),
        h: parseInt(calcAngleA(a, b, ch)),
        hdist: distToPlane(p, c, true),
    }
}

function calcAngleA(a, b, c) {
    let t = ((b.x - a.x) * (c.x - a.x) + (b.y - a.y) * (c.y - a.y) + (b.z - a.z) * (c.z - a.z)) /
        (Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z)) *
            Math.sqrt((c.x - a.x) * (c.x - a.x) + (c.y - a.y) * (c.y - a.y) + (c.z - a.z) * (c.z - a.z)))

    return Math.acos(t) * 180 / Math.PI
}

function mapAngles(plot, a, saddr, eaddr) {
    let hdir = a.hdist > 0
    let vdir = a.vdist > 0
    let hdist = Math.abs(a.hdist)
    let vdist = Math.abs(a.vdist)

    let xctr = !hdir ? 0 : hdist
    let xdist = hdir ? 0 : hdist
    let yctr = vdir ? 0 : vdist
    let ydist = !vdir ? 0 : vdist
    let range = Math.max(hdist, vdist)

    let data = []
    let out = initout()
    out.x.push(xctr)
    out.y.push(ydist)
    out.x.push(xctr)
    out.y.push(yctr)
    out.x.push(xdist)
    out.y.push(yctr)
    data.push(makedata(out, 1, "#ffffff", "#ffff00", "x", "y"))

    out = initout()
    out.x.push(xctr)
    out.y.push(yctr)
    out.t.push(saddr)

    out.x.push(xdist)
    out.y.push(ydist)
    out.t.push(eaddr)
    data.push(makedata(out, 6, "#ff0000", "#ff4040", "x", "y"))

    out = initout()
    out.x.push(xctr)
    out.y.push(yctr)
    data.push(makedata(out, 6, "#00ff00", null, "x", "y"))


    let layout = {
        hovermode: "closest",
        showlegend: false,
        paper_bgcolor: "#000000",
        plot_bgcolor: "#000000",
        xaxis: {
            backgroundcolor: "#000000",
            showgrid: false,
            zerolinecolor: "#c0c0c0",
            showzero: true,
            showbackground: true,
            showticklabels: false,
            range: [0, range],
            title: (!hdir ? "right " : "left ") + a.h + "&#176;",
            titlefont: {
                family: 'Arial, sans-serif',
                size: 11,
                color: 'white'
            },
        },
        yaxis: {
            backgroundcolor: "#000000",
            showgrid: false,
            showzero: true,
            zerolinecolor: "#c0c0c0",
            showbackground: true,
            showticklabels: false,
            range: [0, range],
            title: (vdir ? "up " : "down ") + a.v + "&#176;",
            titlefont: {
                family: 'Arial, sans-serif',
                size: 11,
                color: 'white'
            },
        },
        margin: {
            l: 20,
            r: 0,
            b: 20,
            t: 0
        }
    }

    let w = $("#" + plot).width() - 8
    layout.width = w
    layout.height = w

    Plotly.newPlot(plot, data, layout)
}

const zero = {
    x: 2048,
    y: 128,
    z: 2048,
}

function mapPoints(plot, saddr, eaddr, axis1, axis2) {
    let w = $("#maplogo").width()
    $("#logo").css("width", Math.min(w, 100) + "px")
    $("#logo").height(Math.min(w, 100) + "px")

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