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

    g = g.stripNumber()

    if (typeof bhs.orgList !== "undefined") {
        let loc = $("#menu-Organizations")
        for (let e of bhs.orgList) {
            let itm = loc.find("#item-" + e.name.nameToId())
            if (e.galaxy === g && e[p] === true)
                itm.css("background-color", "#c0f0ff")
            else
                itm.css("background-color", "#ffc0c0")
        }
    }

    if (typeof bhs.poiList !== "undefined") {
        let loc = $("#menu-Points-Of-Interest")
        for (let e of bhs.poiList) {
            let itm = loc.find("#item-" + e.name.nameToId())
            if (e.galaxy === g && e.platform === p)
                itm.css("background-color", "#c0f0ff")
            else
                itm.css("background-color", "#ffc0c0")
        }
    }

    // bhs.status("caching")

    var calcRoute = firebase.functions().httpsCallable('calcRoute')
    calcRoute({
            galaxy: g,
            platform: p,
            preload: true
        }).then(res => {
            // bhs.status("complete " + res.data.preload)
        })
        .catch(err => {
            console.log(err)
            bhs.status("ERROR: " + (typeof err.code !== "undefined" ? err.code : JSON.stringify(err)))
        })
}

blackHoleSuns.prototype.buildQueryPanel = async function () {
    const query = `
        <div id="pnl-query" class="card card-body">
            <div class="row">
                <div class="col-md-4 col-5 h6 txt-inp-def">Starting Coordinates&nbsp;</div>
                <input id="id-start" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000" onchange="bhs.setAddress(this)">
            </div>
            <div class="row">
                <div class="col-md-4 col-5 h6 txt-inp-def">Ending Coordinates&nbsp;</div>
                <input id="id-end" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000" onchange="bhs.setAddress(this)">&nbsp;
                <button id="btn-switch" type="button" class="btn-def btn btn-sm" onclick="bhs.switchSE()"><i class="fa fa-exchange-alt txt-def"></i></button>
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
                <input id="id-range" class="rounded col-md-5 col-4" type="number" value="2000" onchange="bhs.saveDarcSettings(this)">
            </div>
            <br>
            <div class="row">
                <div class="col-7">
                    <div class="row">
                        <div class="col-5">
                            <div class="row">
                                <button id="btn-searchRegion" type="button" class="btn-def btn btn-sm" onclick="bhs.calcroute()">Calculate Route</button>&nbsp
                            </div>
                        </div>&nbsp
                        <div class="col-8 border-left">
                            <div class="row">
                                &nbsp<button id="btn-proximity" type="button" class="col-13 btn-def btn btn-sm" onclick="bhs.calcroute(true)">Proximity</button>&nbsp
                            </div>
                            <br>
                            <div class="row">
                                <div class="col-7 h6 txt-inp-def">Max Jumps&nbsp;</div>
                                <input id="id-maxJumps" class="rounded col-7" type="number" value="20" onchange="bhs.saveDarcSettings(this)">
                            </div>
                        </div>
                    </div>
                </div>
                <div id="status" class="border col-7 text-danger scrollbar container-fluid" style="overflow-y: scroll; height: 68px"></div>
            </div>
        </div>`

    $("#panels").append(query)
    let pnl = $("#pnl-query")

    await bhs.getPoiList(true)
    bhs.buildMenu(pnl, "Points Of Interest", bhs.poiList, bhs.select)

    await bhs.getOrgList(true)
    bhs.buildMenu(pnl, "Organizations", bhs.orgList, bhs.select)

    if (bhs.user.galaxy !== "")
        bhs.setGP()
}

blackHoleSuns.prototype.setAddress = function (evt) {
    let addr = bhs.reformatAddress($(evt).val())
    let err = bhs.validateAddress(addr)
    
    if (err !== "")
        bhs.status("ERROR: " + err)
    else {
        $(evt).val(addr)
        bhs.saveDarcSettings(evt)
    }
}

blackHoleSuns.prototype.select = function (id) {
    let name = $("#btn-" + id).text()
    if (id === "Points-Of-Interest") {
        let i = bhs.getIndex(bhs.poiList, "_name", name)
        let itm = bhs.poiList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Organizations").text("")
        bhs.showPOI(name)
    } else {
        let i = bhs.getIndex(bhs.orgList, "_name", name)
        let itm = bhs.orgList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Points-Of-Interest").text("")
        bhs.showOrg(name)
    }
}

blackHoleSuns.prototype.switchSE = function () {
    let s = $("#id-start").val()
    let e = $("#id-end").val()

    $("#id-start").val(e)
    $("#id-end").val(s)
}

blackHoleSuns.prototype.saveDarcSettings = function (evt) {
    if (bhs.user.uid !== "") {
        let user = {}
        user.darcSettings = {}
        let id = $(evt).prop("id").stripID()
        user.darcSettings[id] = $(evt).val()

        bhs.updateUser(user)
    }
}

blackHoleSuns.prototype.updateDarcSettings = function () {
    if (typeof bhs.user.darcSettings !== "undefined") {
        $("#id-range").val(typeof bhs.user.darcSettings.range !== "undefined" ? bhs.user.darcSettings.range : 2000)
        $("#id-maxJumps").val(typeof bhs.user.darcSettings.maxJumps !== "undefined" ? bhs.user.darcSettings.maxJumps : 20)
        $("#id-start").val(typeof bhs.user.darcSettings.start !== "undefined" ? bhs.user.darcSettings.start : "")
        $("#id-end").val(typeof bhs.user.darcSettings.end !== "undefined" ? bhs.user.darcSettings.end : "")
    }
}

blackHoleSuns.prototype.showPOI = function (name) {
    const img = `<img id="img-pic" height="auto" width="wsize" />`
    let w = Math.min($("#mapcol").width() - 8, 400)
    let h = /wsize/ [Symbol.replace](img, w)

    $("#plymap").hide()
    let loc = $("#image")
    loc.empty()
    loc.show()
    loc.append(h)

    let ref = bhs.fs.collection("poi")
    ref = ref.where("name", "==", name)
    ref.get().then(snapshot => {
        if (!snapshot.empty) {
            let e = snapshot.docs[0].data()

            let ref = bhs.fbstorage.ref().child(e.img)
            ref.getDownloadURL().then(url => {
                loc.find("#img-pic").attr("src", url)
            })
        }
    })
}

blackHoleSuns.prototype.showOrg = function (name) {
    const img = `<img id="img-pic" height="auto" width="wsize" />`
    let w = Math.min($("#mapcol").width() - 8, 400)
    let h = /wsize/ [Symbol.replace](img, w)

    $("#plymap").hide()
    let loc = $("#image")
    loc.empty()
    loc.show()
    loc.append(h)

    let ref = bhs.fs.collection("org")
    ref = ref.where("name", "==", name)
    ref.get().then(snapshot => {
        if (!snapshot.empty) {
            let e = snapshot.docs[0].data()

            let ref = bhs.fbstorage.ref().child(e.img)
            ref.getDownloadURL().then(url => {
                loc.find("#img-pic").attr("src", url)
            })
        }
    })
}

blackHoleSuns.prototype.calcroute = async function (proximity) {
    let now = new Date().getTime()
    $("#status").empty()
    bhs.status("starting")
    let loc = $("#resItems")
    loc.empty()

    var calcRoute = firebase.functions().httpsCallable('calcRoute')
    await calcRoute({
            start: $("#id-start").val(),
            end: $("#id-end").val(),
            range: $("#id-range").val(),
            maxJumps: $("#id-maxJumps").val(),
            galaxy: $("#btn-Galaxy").text().stripNumber(),
            platform: $("#btn-Platform").text(),
            proximity: proximity,
            user: $("#id-Player").val(),
            usebases: true
        }).then(async res => {
            if (typeof res.data.err !== "undefined")
                bhs.status("ERROR: " + res.data.err)
            else {
                bhs.route = res.data.route
                bhs.status("setup " + res.data.setup)
                bhs.status("calc " + res.data.calc)
                bhs.displayResults(bhs.route)
            }
        })
        .catch(err => {
            console.log(err)
            bhs.status("ERROR: " + (typeof err.code !== "undefined" ? err.code : JSON.stringify(err)))
        })

    bhs.status("done " + (new Date().getTime() - now))

    return
}

const restable = [{
    name: "Description",
    field: "desc",
    format: "col-lg-3 col-md-3 col-7"
}, {
    name: "Coordinates",
    field: "addr",
    format: "col-lg-2 col-md-3 col-7"
}, {
    name: "Glyph",
    field: "addr",
    format: "col-lg-4 col-md-6 col-14 txt-inp-def h5 text-center glyph"
}, {
    name: "Region",
    field: "region",
    format: "col-lg-2 col-md-4 col-7"
}, {
    name: "System",
    field: "system",
    format: "col-lg-2 col-md-4 col-7 txt-inp-def"
}, ]

blackHoleSuns.prototype.displayResults = function (routes) {
    let hdr = $("#resHeader")

    let block = `
        <div id="id-rindex" class="row def-bkg txt-def border-top-3" onclick="selectRoute(this)"></div>
        <div id="block-rindex" class="container-flex hidden">`
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

    let idx = 0

    for (let rte of routes) {
        let route = rte.route

        let h = /index/g [Symbol.replace](block, idx)

        let loc = $("#resItems")
        let range = $("#id-range").val()
        let b = false

        for (let i = 0; i < route.length; ++i) {
            let r = route[i]
            let n = route[i + 1]
            let a = bhs.xyzToAddress(r.coords)
            let finished = false

            let l = /addr/ [Symbol.replace](row, a)
            l = /row/ [Symbol.replace](l, i === 0 ? "row border-top-3" : "row")
            h += /row/ [Symbol.replace](l, b ? "row bkg-vlight-gray" : "row")
            b = !b
            let warp = false

            for (let f of restable) {
                let end = false
                let l = /field/ [Symbol.replace](itm, f.field)
                l = /format/ [Symbol.replace](l, f.format)

                switch (f.name) {
                    case "Description":
                        warp = false

                        switch (r.what) {
                            case "arrived":
                                l = /title/ [Symbol.replace](l, "<h5>Arrived at destination</h5>")
                                end = true
                                finished = true
                                break
                            case "teleport":
                                l = /title/ [Symbol.replace](l, "<div class='row'>Teleport to&nbsp;&nbsp;<div class='h6 txt-inp-def'>" + r.region + "</div></div>")
                                break
                            case "bh":
                                l = /title/ [Symbol.replace](l, "Transit black hole, exits at")
                                break
                            case "warp":
                                l = /title/ [Symbol.replace](l, "Warp " + r.dist.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "ly or " + r.jumps + " jumps to")
                                warp = true
                                break
                            case "loc":
                            default:
                                l = ""
                                end = true
                                break
                        }

                        r = n
                        break
                    case "Distance":
                        l = /title/ [Symbol.replace](l, r.dist + " ly")
                        break
                    case "Glyph":
                        l = /title/ [Symbol.replace](l, warp && typeof r[f.field] !== "undefined" ? bhs.addrToGlyph(r[f.field]) : "")
                        break
                    case "Coordinates":
                        l = /title/ [Symbol.replace](l, typeof r[f.field] !== "undefined" ? r[f.field] : "")
                        break
                    case "Region":
                        l = /title/ [Symbol.replace](l, typeof r.name !== "undefined" ? r.name : typeof r[f.field] !== "undefined" ? r[f.field] : "")
                        break
                    case "System":
                        if (!warp)
                            l = /txt-inp-def/ [Symbol.replace](l, "")
                        l = /title/ [Symbol.replace](l, typeof r.owner !== "undefined" ? r.owner : typeof r[f.field] !== "undefined" ? r[f.field] : "")
                        break
                }

                h += l
                if (end)
                    break
            }

            h += end
            if (finished)
                break
        }

        idx++
        loc.append(h + end)

        let r = route[route.length - 1]

        let dist = parseInt(bhs.calcDistXYZ(route[0].coords, route[route.length - 1].coords) * 400)
        let calc = Math.ceil(dist / range)
        let per = parseInt((1 - rte.jumps / calc) * 100)

        const res = `
            <div class="col-3">
                <div class="row h5">title</div>
            </div>
            <div class="col-11">
                <div class="row">
                    <div class="col-sm-7 col-14">jumps jumps for DARC vs. calc direct warp jumps.</div>
                    <div class="col-sm-7 col-14">A per% savings.</div>
                    <div class="col-sm-7 col-14">Cornell Index of bh black holes.</div>
                    <div class="col-sm-7 col-14">Original warp distance distly.</div>
                </div>
            </div>`

        h = /title/ [Symbol.replace](res, typeof r.name !== "undefined" ? r.name : typeof r.system !== "undefined" ? r.system : r.addr)
        h = /jumps/ [Symbol.replace](h, rte.jumps)
        h = /calc/ [Symbol.replace](h, calc)
        h = /per/ [Symbol.replace](h, per)
        h = /bh/ [Symbol.replace](h, rte.bh)
        h = /distly/ [Symbol.replace](h, dist.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " light years")

        let rloc = loc.find("#id-r" + (idx - 1))
        rloc.html(h)
    }
}

var selected

function selectRoute(evt) {
    let idx = $(evt).prop("id").stripID()
    selected = idx.slice(1)
    $("[id|='block']").hide()
    $("#block-" + idx).show()

    $("#id-start").val(bhs.route[selected].route[0].addr)
    $("#id-end").val(bhs.route[selected].route[bhs.route[selected].route.length - 1].addr)

    mapRoute(bhs.route[selected].route)
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
    mapRoute(bhs.route[selected].route)
}

function mapRoute(route) {
    $("#image").hide()
    $("#plymap").show()

    let data = []

    let zero = {
        x: 2048,
        y: 128,
        z: 2048,
    }

    let truezero = {
        x: 0,
        y: 0,
        z: 0,
    }

    let out = initout()
    pushentry(out, truezero)
    pushentry(out, zero)
    data.push(makedata(out, 4, "#d0d0d0"))

    out = initout()
    for (let i = 0; i < route.length; ++i) {
        let r = route[i]
        let t = (r.region ? "<br>" + r.region : "") + (r.system ? "<br>" + r.system : "")
        pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + t)
    }

    data.push(makedata(out, 4, "#00ff00", "#40ff00"))

    out = initout()
    let r = route[0]
    let reg = typeof r.name !== "undefined" ? r.name : typeof r.region !== "undefined" ? r.region : ""
    let sys = typeof r.owner !== "undefined" ? r.owner : typeof r.system !== "undefined" ? r.system : ""
    let t = (reg ? "<br>" + reg : "") + (sys ? "<br>" + sys : "")

    pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + t)
    data.push(makedata(out, 6, "#ffff00"))

    out = initout()
    r = route[route.length - 1]
    reg = typeof r.name !== "undefined" ? r.name : typeof r.region !== "undefined" ? r.region : ""
    sys = typeof r.owner !== "undefined" ? r.owner : typeof r.system !== "undefined" ? r.system : ""
    t = (reg ? "<br>" + reg : "") + (sys ? "<br>" + sys : "")

    pushentry(out, r.coords, bhs.xyzToAddress(r.coords) + t)
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

    let w = Math.min($("#mapcol").width() - 8, 400)
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