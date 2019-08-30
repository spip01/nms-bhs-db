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

        if (range !== "")
            $("#id-jumps").text(parseInt(dist / range))

        mapPoints(saddr, eaddr)
    }
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

function calcDist(addr, addr2) {
    let cord = addressToXYZ(addr)
    let cord2 = addressToXYZ(addr2)

    return parseInt(Math.sqrt(Math.pow(cord2.x - cord.x, 2) + Math.pow(cord2.y - cord.y, 2) + Math.pow(cord2.z - cord.z, 2)) * 400)
}

function changeMapLayout(exec, zoom) {
    const xstart = 0
    const xctr = 2048
    const xend = 4095

    const zstart = 0
    const zctr = 128
    const zend = 255

    const ystart = 0
    const yctr = 2048
    const yend = 4095

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

    let w = 400 // Math.min($("#mapcol").width(), $(window).height())
    layout.width = w
    layout.height = w

    return layout
}

function mapPoints(saddr, eaddr) {
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
    data.push(makedata(out, 5, "#ffffff", "#e0e0e0"))

    out = initout()
    pushentry(out, sxyz, saddr)
    pushentry(out, exyz, eaddr)
    data.push(makedata(out, 5, "#00ff00", "#ff4040"))

    out = initout()
    pushentry(out, exyz, eaddr)
    data.push(makedata(out, 5, "#ff0000"))

    Plotly.newPlot('plymap', data, changeMapLayout())
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

function makedata(out, size, color, linecolor) {
    let line = {
        x: out.x,
        y: out.y,
        z: out.z,
        text: out.t,
        mode: 'markers',
        marker: {
            size: size,
            color: color,
            opacity: 0.6,
        },
        type: "scatter3d",
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