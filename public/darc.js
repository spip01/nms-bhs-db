'use strict'

$(document).ready(() => {
    startUp()

    bhs.buildDarcUserPnl()
    bhs.buildQueryPanel()
    bhs.buildDarcMap()
})

blackHoleSuns.prototype.buildDarcUserPnl = function () {
    const panel = `
        <div id="pnl-user">
            <div class="row">
                <div class="col-md-7 col-14">
                    <div class="row">
                        <div class="col-14 h6 txt-inp-def">Player Name</div>
                        <input id="id-Player" class="rounded col-13 h5" type="text">
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-1"></div>
                <div id="id-Galaxy" class="col-md-5 col-14"></div>
                <div id="id-Platform" class="col-md-5 col-14"></div>
            </div>
        </div>
        <br>`

    $("#panels").prepend(panel)
    let loc = $("#pnl-user")

    bhs.buildMenu(loc, "Platform", platformList, bhs.setGP, false)
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.setGP, false)
}

blackHoleSuns.prototype.setGP = function () {
    let g = $("#btn-Galaxy").text()
    let p = $("#btn-Platform").text()

    if (g === "" || p === "")
        return

    var calcRoute = firebase.functions().httpsCallable('calcRoute')
    calcRoute({
            start: "",
            galaxy: g.stripNumber(),
            platform: p,
        }).then(result => {
            bhs.status("load " + result.data.load)
        })
        .catch(err => {
            bhs.status("ERROR: " + (typeof err.code !== "undefined" ? err.code : JSON.stringify(err)))
        })
}

blackHoleSuns.prototype.buildQueryPanel = async function () {
    const query = `
        <div id="pnl-query" class="card card-body">
            <div class="row">
                <div class="col-md-4 col-5 h6 txt-inp-def">Starting Coordinates&nbsp;</div>
                <input id="id-start" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000">
            </div>
            <div class="row">
                <div class="col-md-4 col-5 h6 txt-inp-def">Ending Coordinates&nbsp;</div>
                <input id="id-end" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000">&nbsp;
                <button id="btn-switch" type="button" class="col-1 btn-def btn btn-sm" onclick="bhs.switchSE()"><i class="fa fa-exchange-alt txt-def"></i></button>
                </div>
            <div class="row">
                <div class="card card-body no-border">
                    <div class="row">
                        <div id="id-Points-Of-Interest" class="col-md-7 col-14"></div>
                        <div id="id-Organizations" class="col-md-7 col-14"></div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 col-5 h6 txt-inp-def">Average Jump Range&nbsp;</div>
                <input id="id-range" class="rounded col-md-5 col-4" type="number" value="2400">
            </div>
            <br>
            <div class="row">
                <div class="col-md-2 col-4">
                    <div class="row">
                        <button id="btn-searchRegion" type="button" class="btn-def btn btn-sm" onclick="bhs.calcroute()">Calculate Route</button>&nbsp
                    </div>
                </div>
                <div id="status" class="border col-md-11 col-9 text-danger scrollbar container-fluid" style="overflow-y: scroll; height: 68px"></div>
            </div>
        </div>`

    $("#panels").append(query)
    let pnl = $("#pnl-query")

    await bhs.getPoiList(true)
    bhs.buildMenu(pnl, "Points Of Interest", bhs.poiList, bhs.select)

    await bhs.getOrgList(true)
    bhs.buildMenu(pnl, "Organizations", bhs.orgList, bhs.select)

    $("#id-start").unbind("change")
    $("#id-start").change(function () {
        let addr = bhs.reformatAddress($(this).val())
        $(this).val(addr)
    })

    $("#id-end").unbind("change")
    $("#id-end").change(function () {
        let addr = bhs.reformatAddress($(this).val())
        $(this).val(addr)
    })
}

blackHoleSuns.prototype.select = function (id) {
    let name = $("#btn-" + id).text()
    if (id === "Points-Of-Interest") {
        let i = bhs.getIndex(bhs.poiList, "_name", name)
        let itm = bhs.poiList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Organizations").text("")
    } else {
        let i = bhs.getIndex(bhs.orgList, "_name", name)
        let itm = bhs.orgList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Points-Of-Interest").text("")
    }
}

blackHoleSuns.prototype.switchSE = function () {
    let s = $("#id-start").val()
    let e = $("#id-end").val()

    $("#id-start").val(e)
    $("#id-end").val(s)
}

blackHoleSuns.prototype.calcroute = async function () {
    let now = new Date().getTime()
    $("#status").empty()
    bhs.status("starting")

    var calcRoute = firebase.functions().httpsCallable('calcRoute')
    await calcRoute({
            start: $("#id-start").val(),
            end: $("#id-end").val(),
            range: $("#id-range").val(),
            galaxy: $("#btn-Galaxy").text().stripNumber(),
            platform: $("#btn-Platform").text(),
            user: $("#id-Player").val(),
        }).then(result => {
            if (typeof result.data.err !== "undefined")
                bhs.status("ERROR: " + result.data.err)
            else {
                bhs.route = result.data.route
                bhs.displayResults(bhs.route)
            }
        })
        .catch(err => {
            bhs.status("ERROR: " + (typeof err.code !== "undefined" ? err.code : JSON.stringify(err)))
        })

    bhs.status("done " + (new Date().getTime() - now))

    return
}

const restable = [{
    name: "Description",
    field: "desc",
    format: "col-lg-3 col-md-3 col-8"
    // }, {
    //     name: "Distance",
    //     field: "dist",
    //     format: "col-md-2 col-3"
}, {
    name: "Coordinates",
    field: "coords",
    format: "col-lg-2 col-md-3 col-6"
}, {
    name: "Glyph",
    field: "coords",
    format: "col-lg-4 col-md-6 col-14 txt-inp-def h4 text-center glyph"
}, {
    name: "Region",
    field: "region",
    format: "col-lg-2 col-md-4 col-7"
}, {
    name: "System",
    field: "system",
    format: "col-lg-2 col-md-4 col-7 txt-inp-def"
}, ]

blackHoleSuns.prototype.displayResults = function (route) {
    mapRoute(route)

    let hdr = $("#resHeader")

    let row = `<div id="id-addr" class="row" onclick="mapRow(this)">`
    let itm = `<div id="itm-field" class="format">title</div>`
    let end = `</div>`
    let h = ""

    for (let f of restable) {
        let l = /field/ [Symbol.replace](itm, f.field)
        l = /format/ [Symbol.replace](l, f.format)
        l = /txt-inp-def/ [Symbol.replace](l, "")
        l = /h4/ [Symbol.replace](l, "")
        l = /title/ [Symbol.replace](l, f.name)
        h += l
    }

    hdr.empty()
    hdr.append(h)
    h = ""

    let loc = $("#resItems")
    let range = $("#id-range").val()
    let jumps = 0
    let bh = 0
    let b = true

    for (let i = 0; i < route.length; ++i) {
        b = !b
        let r = route[i]
        let a = bhs.xyzToAddress(r.coords)
        let xit = false
        let teleport = false

        let l = /addr/ [Symbol.replace](row, a)
        h += /row/ [Symbol.replace](l, b ? "row bkg-vlight-gray" : "row")

        let dist = 0
        let calc = 0
        if (i > 0) {
            dist = bhs.calcDistXYZ(r.coords, route[i - 1].coords) * 400
            calc = parseInt(dist / range)
            calc = calc ? calc : 1
        }

        for (let f of restable) {
            let l = /field/ [Symbol.replace](itm, f.field)
            l = /format/ [Symbol.replace](l, f.format)

            switch (f.name) {
                case "Description":
                    if (i === 0)
                        l = /title/ [Symbol.replace](l, "Start")
                    else if (r.region === "Teleport") {
                        l = /title/ [Symbol.replace](l, "<div class='row'>Teleport to&nbsp;&nbsp;<div class='h6 txt-inp-def'>" + r.system + "</div></div>")
                        i++
                        teleport = true
                        r = route[i]
                        jumps++
                    } else if (i + 1 === route.length) {
                        l = /title/ [Symbol.replace](l, "Warp " + dist + "ly or " + calc + " jumps to Dest")
                        jumps += calc
                    } else if (r.coords.s === 0x79) {
                        l = /title/ [Symbol.replace](l, "Warp " + dist + "ly or " + calc + " jumps to")
                        jumps += calc
                    } else {
                        l = /title/ [Symbol.replace](l, "Transit Black Hole exits to")
                        xit = true
                        jumps++
                        bh++
                    }
                    break
                case "Distance":
                    l = /title/ [Symbol.replace](l, i !== 0 && r.coords.s === 0x79 || i + 1 === route.length ? dist + " ly" : "")
                    break
                case "Glyph":
                    l = /col-md-4/ [Symbol.replace](l, "col-md-4 glyph h5 txt-inp-def")
                    l = /title/ [Symbol.replace](l, xit || teleport ? "" : bhs.addrToGlyph(bhs.xyzToAddress(r[f.field])))
                    break
                case "Coordinates":
                    l = /title/ [Symbol.replace](l, bhs.xyzToAddress(r[f.field]))
                    break
                case "Region":
                    l = /title/ [Symbol.replace](l, typeof r[f.field] !== "undefined" ? r[f.field] : "")
                    break
                case "System":
                    if (xit || teleport)
                        l = /txt-inp-def/ [Symbol.replace](l, "")
                    l = /title/ [Symbol.replace](l, typeof r[f.field] !== "undefined" ? r[f.field] : "")
                    break
            }

            h += l
        }

        h += end
    }

    loc.empty()
    loc.append(h)

    loc = $("#res-hdr")
    let calc = parseInt(bhs.calcDistXYZ(route[0].coords, route[route.length - 1].coords) * 400 / range)
    let p = parseInt((1 - jumps / calc) * 100)
    loc.html("Results:<br>" +
        jumps + " jumps for DARC vs. " + calc + " direct warp jumps.<br>" +
        "A " + p + "% savings.<br>" +
        "Cornell index of " + bh + " black hole transits.")
}

blackHoleSuns.prototype.buildDarcMap = function () {
    let w = $("#maplogo").width()
    $("#logo").prop("width", Math.min(w, 100))
    $("#logo").prop("height", Math.min(w, 100))

    let zero = {
        x: 2048,
        y: 128,
        z: 2048,
    }

    let layout = changeMapLayout()
    let data = []
    let out = initout()
    pushentry(out, zero, "Galactic Center")
    data.push(makedata(out, 2, "#c0c0c0"))

    Plotly.newPlot('plymap', data, layout)
}

function redraw() {
    mapRoute(bhs.route)
}

function mapRoute(route) {
    let data = []
    let out = initout()

    for (let i = 0; i < route.length; ++i) {
        let r = route[i]
        pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + "<br>" + r.region + "<br>" + r.system)
    }

    data.push(makedata(out, 4, "#00ff00", "#40ff00"))

    out = initout()
    let r = route[0]
    pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + "<br>" + r.region + "<br>" + r.system)
    data.push(makedata(out, 6, "#ffff00"))

    out = initout()
    r = route[route.length - 1]
    pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + "<br>" + r.region + "<br>" + r.system)
    data.push(makedata(out, 6, "#ff0000"))


    Plotly.react('plymap', data, changeMapLayout())
}

function mapRow(evt) {
    let eloc = $(evt).next()
    let end = eloc.prop("id")
    if (typeof end === "undefined")
        return

    end = end.stripID()
    let exyz = bhs.addressToXYZ(end)
    let ereg = eloc.find("#itm-region").text()
    let esys = eloc.find("#itm-system").text()

    let sloc = $(evt)
    let start = sloc.prop("id").stripID()
    let sxyz = bhs.addressToXYZ(start)
    let sreg = sloc.find("#itm-region").text()
    let ssys = sloc.find("#itm-system").text()

    let zero = {
        x: 2048,
        y: 128,
        z: 2048,
    }

    let data = []
    let out = initout()
    pushentry(out, zero, "Galactic Center")
    pushentry(out, sxyz)
    data.push(makedata(out, 2, "#ffffff", "#c0c0c0"))

    out = initout()
    pushentry(out, sxyz)
    pushentry(out, exyz, end + "<br>" + ereg + "<br>" + esys)
    data.push(makedata(out, 4, "#ff0000", "#40ff00"))

    out = initout()
    pushentry(out, sxyz, start + "<br>" + sreg + "<br>" + ssys)
    data.push(makedata(out, 4, "#00ff00"))

    Plotly.react('plymap', data, changeMapLayout(true, start, end))
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
        let sxyz = bhs.addressToXYZ(saddr)
        let exyz = bhs.addressToXYZ(eaddr)
        let d = bhs.calcDistXYZ(sxyz, exyz)

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

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>")
}