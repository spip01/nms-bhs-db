$(document).ready(() => {
    $("#javascript").empty()
    $("#jssite").show()
})

function dispAddr(evt) {
    let saddr = $("#id-saddr").val()
    let eaddr = $("#id-eaddr").val()
    let range = $("#id-range").val()

    if (saddr !== "") {
        saddr = reformatAddress(saddr)
        $("#id-saddr").val(saddr)
        let glyph = addrToGlyph(saddr)
        $("#id-sglyph").text(glyph)
        $("#id-shex").text(glyph)
    }

    if (eaddr !== "") {
        eaddr = reformatAddress(eaddr)
        $("#id-eaddr").val(eaddr)
        let glyph = addrToGlyph(eaddr)
        $("#id-eglyph").text(glyph)
        $("#id-ehex").text(glyph)
    }

    if (saddr !== "" && eaddr != "") {
        let dist = calcDist(saddr, eaddr)
        $("#id-dist").text(dist + " ly")

        let xzAngle = calcAngle(saddr, eaddr, "x", "z")
        $("#id-angle").text(xzAngle + " deg")

        if (range !== "")
            $("#id-jumps").text(parseInt(dist / range))

        mapPoints("plot3d", saddr, eaddr)
    }
}

function calcAngle(saddr, eaddr, xp, yp) {
    let zero = xyzToAddress({
        x: 2048,
        y: 128,
        z: 2048,
    })

    let a = calcDist(zero, eaddr, xp, yp)
    let c = calcDist(saddr, eaddr, xp, yp)
    let b = calcDist(saddr, zero, xp, yp)

    return parseInt(Math.acos((a * a - b * b - c * c) / (-2 * b * c)) * 180 / Math.PI)
}

function reformatAddress(addr) {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":")
    str = str[0] == ":" ? str.slice(1) : str
    let out = ""

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":")
        let end = idx > 4 || idx == -1 ? 4 : idx
        let s = str.slice(0, end)
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0))
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "")
    }

    return out
}

function addrToGlyph(addr) {
    let s = ""
    //const portalFormat = "psssyyxxxzzz"

    if (addr) {
        let xyz = addressToXYZ(addr)
        let xs = "00" + xyz.s.toString(16).toUpperCase()
        let xx = "00" + (xyz.x + 0x801).toString(16).toUpperCase()
        let xy = "00" + (xyz.y + 0x81).toString(16).toUpperCase()
        let xz = "00" + (xyz.z + 0x801).toString(16).toUpperCase()

        s = "0"
        s += xs.slice(xs.length - 3)
        s += xy.slice(xy.length - 2)
        s += xz.slice(xz.length - 3)
        s += xx.slice(xx.length - 3)
    }

    return s
}

function addressToXYZ(addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    }

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

function xyzToAddress(xyz) {
    let x = xyz.x.toString(16)
    let z = xyz.y.toString(16)
    let y = xyz.z.toString(16)

    let addr = x + "." + y + "." + z + "." + "0"
    return reformatAddress(addr)
}

function calcDist(addr, addr2, axis1, axis2) {
    let cord = addressToXYZ(addr)
    let cord2 = addressToXYZ(addr2)

    if (axis1)
        return parseInt(Math.sqrt(Math.pow(cord2[axis1] - cord[axis1], 2) + Math.pow(cord2[axis2] - cord[axis2], 2)))
    else
        return parseInt(Math.sqrt(Math.pow(cord2.x - cord.x, 2) + Math.pow(cord2.y - cord.y, 2) + Math.pow(cord2.z - cord.z, 2)) * 400)
}

var tglZoom = false

function zoom() {
    tglZoom = !tglZoom
    Plotly.relayout('plot3d', changeMapLayout(tglZoom, $("#id-saddr").val(), $("#id-eaddr").val()))
}

function changeMapLayout(zoom, saddr, eaddr) {
    let xstart = 0
    let xctr = 2048
    let xend = 4095

    let zstart = 0
    let zctr = 128
    let zend = 255

    let ystart = 0
    let yctr = 2048
    let yend = 4095

    if (zoom) {
        let sxyz = addressToXYZ(saddr)
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

    let w = Math.min($("#plot3d").width() - 8, 400)
    layout.width = w
    layout.height = w

    return layout
}

function mapPoints(plot, saddr, eaddr, axis1, axis2) {
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

    let layout = changeMapLayout()

    if (axis1) {
        layout.width = 200
        layout.height = 200
    }

    Plotly.newPlot(plot, data, layout)
    tglZoom = false
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