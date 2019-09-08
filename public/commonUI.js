'use strict'

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels)
        bhs.clearPanels()

    bhs.user = bhs.userInit()
    bhs.displayUser(bhs.user, true)

    $("#status").empty()
    $("#filestatus").empty()
    $("#entryTable").empty()
    $("#totals").empty()

    $("#save").addClass("disabled")
    $("#save").prop("disabled", true)
}

blackHoleSuns.prototype.doLoggedin = function (user) {
    bhs.displayUser(user, true)

    $("#save").removeClass("disabled")
    $("#save").removeAttr("disabled")
}

blackHoleSuns.prototype.displayUser = async function (user, force) {
    let changed = user.uid && (!bhs.entries || user.galaxy != bhs.user.galaxy || user.platform != bhs.user.platform)

    bhs.user = mergeObjects(bhs.user, user)

    if ((changed || force) && bhs.user.galaxy && bhs.user.platform) {
        bhs.displaySettings(bhs.user)
        bhs.getEntries(bhs.displayEntryList)
    }

    $("body").css("background-color", bhs.user.role === "admin" ? "green" : "black")

    let pnl = $("#pnl-user")
    pnl.find("#id-Player").val(bhs.user._name)
    pnl.find("#btn-Platform").text(bhs.user.platform)
    pnl.find("#btn-Organization").text(bhs.user.org)

    if (bhs.user.galaxy && bhs.user.galaxy !== "") {
        let i = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number
        pnl.find("#btn-Galaxy").text(i + " " + bhs.user.galaxy)
        pnl.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[i].color + ";")
    } else
        pnl.find("#btn-Galaxy").text("")
}

blackHoleSuns.prototype.buildUserPanel = async function () {
    const panel = `
        <div id="pnl-user">
            <div class="row">
                <div class="col-7">
                    <div class="row">
                        <div class="col-14 h6 txt-inp-def">Player Name</div>
                        <input id="id-Player" class="rounded col-13 h5" type="text">
                    </div>
                </div>

                <div class="col-7">
                    <div class="row">
                        <div id="id-Organization"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-1"></div>
                <div id="id-Platform" class="col-3"></div>
                <div id="id-Galaxy" class="col-3"></div>
                <div id="id-Version" class="col-3 hidden"></div>
            </div>
        </div>
        <br>`

    $("#panels").prepend(panel)
    let loc = $("#pnl-user")

    await bhs.getOrgList()
    bhs.orgList.unshift({
        name: ""
    })

    bhs.buildMenu(loc, "Organization", bhs.orgList, bhs.saveUser, true)
    // bhs.buildMenu(loc, "Version", versionList, bhs.saveUser, true)
    bhs.buildMenu(loc, "Platform", platformList, bhs.saveUser)
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.saveUser)

    $("#id-Player").change(function () {
        if (bhs.user.uid) {
            let user = bhs.extractUser()
            bhs.changeName(this, user)
        }
    })
}

const utAddrIdx = 0

var userTable = [{
    title: "Coordinates",
    id: "id-addr",
    field: "addr",
    format: "col-lg-3 col-md-4 col-sm-4 col-5"
}, {
    title: "System",
    id: "id-sys",
    field: "sys",
    format: "col-3"
}, {
    title: "Region",
    id: "id-reg",
    field: "reg",
    format: "col-3"
}, {
    title: "Lifeform",
    id: "id-life",
    field: "life",
    format: "col-lg-2 col-md-4 col-sm-3 col-3"
}, {
    title: "Economy",
    id: "id-econ",
    field: "econ",
    format: "col-lg-2 col-md-4 col-sm-3 col-3"
}]

blackHoleSuns.prototype.buildUserTable = function (entry) {
    const table = `
        <div class="card-header bkg-def">
            <div class="row">
                <h4 class="col-13 txt-def">User Entries</h4>
            </div>
            <div class="row">
                <div id="lc-plat" class="col-4 txt-def h5"></div>
                <div id="lc-gal" class="col-5 h5 txt-def"></div>
                <div id="btn-utSettings" class="col-5 text-right txt-def">
                    <i class="fa fa-cog txt-def"></i>&nbsp;Settings
                </div>
            </div>
        </div>

        <div id="utSettings" class="card card-body" style="display:none">
            <div id="id-utlistsel" class="row"></div>

            <div class="row">
                <button id="btn-saveListSettings" type="button" class="col-2 btn-def btn btn-sm">Save</button>&nbsp
            </div>
        </div>
        
        <div id="id-table" class="card-body">
            <div id="userHeader" class="row border-bottom bkg-def txt-def"></div>
            <div id="userItems" class="scrollbar container-fluid" style="overflow-y: scroll; height: 388px"></div>
        </div>`

    const ckbox = `            
        <label class="col-4 h6 txt-inp-def">
            <input id="ck-idname" type="checkbox" checked>
            title
        </label>`

    $("#entryTable").empty()
    $("#entryTable").append(table)

    const line = `<div id="idname" class="width h6">title</div>`

    let h = ""
    userTable.forEach(t => {
        let l = /idname/ [Symbol.replace](line, t.id)
        l = /width/ [Symbol.replace](l, t.format)
        h += /title/ [Symbol.replace](l, t.title)
    })

    let loc = $("#userHeader")
    loc.append(h)
    $("#lc-plat").text(entry.platform)
    $("#lc-gal").text(entry.galaxy)

    h = ""
    userTable.forEach(t => {
        let l = /idname/ [Symbol.replace](ckbox, t.id)
        h += /title/ [Symbol.replace](l, t.title)
    })

    loc = $("#id-utlistsel")
    loc.append(h)

    userTable.forEach(t => {
        loc.find("#ck-" + t.id).change(function () {
            if ($(this).prop("checked")) {
                $("#userHeader").find("#" + t.id).show()
                $("#userItems").find("#" + t.id).show()
            } else {
                $("#userHeader").find("#" + t.id).hide()
                $("#userItems").find("#" + t.id).hide()
            }
        })
    })

    $("#btn-utSettings").click(() => {
        if ($("#utSettings").is(":hidden"))
            $("#utSettings").show()
        else
            $("#utSettings").hide()
    })

    $("#btn-saveListSettings").click(() => {
        bhs.updateUser({
            settings: bhs.extractSettings()
        })
    })
}

blackHoleSuns.prototype.displayEntryList = function (entrylist, entry) {
    if (!entrylist && !entry)
        return

    if (!entry) {
        const lineHdr = `
        <div id="gpa" class="row">`
        const line = `
            <div id="idname" class="width" ondblclick="entryDblclk(this)">
                <div id="x-idname" class="row">xdata</div>
            </div>`
        const lineEnd = `
        </div>`

        let h = ""
        let alt = true

        let keys = Object.keys(entrylist)
        for (let i = 0; i < keys.length; ++i) {
            let entry = entrylist[keys[i]]
            h += /gpa/ [Symbol.replace](lineHdr, keys[i].nameToId())
            let l = ""

            for (let j = 0; j < userTable.length; ++j) {
                let t = userTable[j]

                l = /idname/g [Symbol.replace](line, t.id)
                l = /width/g [Symbol.replace](l, t.format + (alt ? " bkg-vlight-gray" : ""))
                l = /xdata/ [Symbol.replace](l, entry.exit && entry.exit[t.field] ? entry.exit[t.field] : "")

                h += l
            }

            alt = !alt
            h += lineEnd
        }

        $("#userItems").empty()
        $("#userItems").append(h)
        bhs.displaySettings(bhs.user)
    } else {
        let id = (entry.bh ? entry.bh.connection : entry.dz ? entry.dz.addr : entry.exit.addr).nameToId()
        let loc = $("#userItems #" + id)

        for (let j = 0; j < userTable.length; ++j) {
            let t = userTable[j]

            loc.find("#x-" + t.id).text(entry.exit[t.field] ? entry.exit[t.field] : "")
        }
    }
}

function entryDblclk(evt) {
    let id = $(evt).parent().prop("id")
    let e = bhs.entries[bhs.reformatAddress(id)]

    $('html, body').animate({
        scrollTop: ($('#panels').offset().top)
    }, 0)

    $("#delete").removeClass("disabled")
    $("#delete").removeAttr("disabled")

    bhs.displayListEntry(e)
}

const totalsItemsHdr = `<div id="idname" class="row">`
const totalsItems = `       <div id="idname" class="format">title</div>`
const totalsItemsEnd = `</div>`

const totalsCol = [{
    title: "",
    id: "id-what",
    format: "col-6",
}, {
    title: "Player",
    id: "id-player",
    format: " col-2 text-right",
    where: "index",
}, {
    title: "All",
    id: "id-totalsall",
    format: "col-2 text-right",
}, ]

const rowTotal = 0
const rowGalaxy = 1

const totalsRows = [{
    title: "Total BH",
    id: "id-totalBH",
}, {
    title: "Total[galaxy]",
    id: "id-totalBHG",
    where: "index",
}]

blackHoleSuns.prototype.buildTotals = function () {
    let findex = window.location.pathname == "/index.html" || window.location.pathname == "/"

    const pnl = `
        <div class="card-header bkg-def">
            <div class="row">
                <div class="col-7 h4 txt-def">Total Black Hole Entries</div>
                <div id="contrib" class="col-7 clr-creme">Total contributors: </div>
                <div id="cname" class="row clr-creme"></div>
            </div>
        </div>
        <div class="card-body bkg-white">
            <label id="id-showall" class="row h6 txt-inp-def">
                Show All&nbsp
                <input id="ck-showall" type="checkbox">
            </label>
            <div id="hdr0" class="row border-bottom bkg-def txt-def"></div>
            <div id="itm0"></div>
            <br>
            
            <div id="tgalaxy" class="card card-body" style="display:none">
                <div id="hdrg" class="row border-bottom txt-def"></div>
                <div id="itmg" class="scrollbar container-fluid" style="overflow-y: scroll; height:120px"></div>
            </div>
            <br>

            <div class="card card-body">
                <div id="hdr1" class="row border-bottom txt-def"></div>
                <div id="itm1" class="scrollbar container-fluid" style="overflow-y: scroll; height:86px"></div>
            </div>
            <br>

            <div class="card card-body">
                <div id="hdr2" class="row border-bottom txt-def"></div>
                <div id="itm2" class="scrollbar container-fluid" style="overflow-y: scroll; height:86px"></div>
            </div>
        </div>`

    let tot = $("#totals")
    tot.empty()
    tot.append(pnl)

    if (!findex) {
        tot.find("#itm1").css("height", "210px")
        tot.find("#itm2").css("height", "120px")
    }

    let h = ""

    totalsCol.forEach(t => {
        let l = /idname/ [Symbol.replace](totalsItems, t.id)
        l = /title/ [Symbol.replace](l, t.title)
        h += /format/ [Symbol.replace](l, t.format + " ")
    })
    tot.find("#hdr0").append(h)

    totalsRows.forEach(x => {
        let t = /galaxy/ [Symbol.replace](x.title, bhs.user.galaxy)
        let h = /idname/ [Symbol.replace](totalsItemsHdr, x.id)

        totalsCol.forEach(y => {
            let l = /idname/ [Symbol.replace](totalsItems, y.id)
            l = /title/ [Symbol.replace](l, t)
            h += /format/ [Symbol.replace](l, y.format)
            t = ""
        })

        h += totalsItemsEnd

        tot.find("#itm0").append(h)
    })

    totalsPlayers.forEach(t => {
        let l = /idname/ [Symbol.replace](totalsItems, t.id)
        l = /title/ [Symbol.replace](l, t.title)
        l = /format/ [Symbol.replace](l, t.hformat)

        tot.find("#hdr1").append(l)
    })

    totalsOrgs.forEach(t => {
        let l = /idname/ [Symbol.replace](totalsItems, t.id)
        l = /title/ [Symbol.replace](l, t.title)
        l = /format/ [Symbol.replace](l, t.hformat)

        tot.find("#hdr2").append(l)
    })

    tot.find("#id-showall").show()

    tot.find("#ck-showall").change(function () {
        if ($(this).prop("checked"))
            bhs.displayAllUTotals(bhs.user)
        else
            bhs.clearAllUTotals(bhs.user)
    })
}

blackHoleSuns.prototype.displayTotals = function (entry, id) {
    let cid = ""

    if (id.match(/totals/)) {
        cid = "id-totalsall"
        bhs.displayUTotals(entry[starsCol], cid)
    } else if (id.match(/user/)) {
        bhs.displayUserTotals(entry, "itm1", true)
        cid = "id-player"
    } else if (id.match(/org/)) {
        bhs.displayUserTotals(entry, "itm2")
    }

    let loc = $("#itm1")
    var list = loc.children()

    list.sort((a, b) => parseInt($(a).find("#id-qty").text()) < parseInt($(b).find("#id-qty").text()) ? 1 :
        parseInt($(a).find("#id-qty").text()) > parseInt($(b).find("#id-qty").text()) ? -1 : 0)

    $("#contrib").html("Total Contributors: " + list.length)

    loc.empty()
    for (var i = 0; i < list.length; i++) {
        loc.append(list[i])
        if ($(list[i]).find("#id-uid").length > 0)
            loc.find("#" + $(list[i]).prop("id")).dblclick(function () {
                console.log($(this).find("#id-names").text().stripMarginWS() + " " + $(this).find("#id-uid").text().stripMarginWS())
                if (fgal) {
                    bhs.entries = {}
                    let galaxy = $("#btn-Galaxy").text().stripNumber()
                    let platform = $("#btn-Platform").text().stripMarginWS()
                    $("#btn-Player").text($(this).find("#id-names").text().stripMarginWS())
                    bhs.getEntries(bhs.displayEntryList, $(this).find("#id-uid").text().stripMarginWS(), galaxy, platform)
                }
            })
    }

    loc = $("#itm2")
    list = loc.children()
    if (list.length > 0) {

        list.sort((a, b) => parseInt($(a).find("#id-qty").text()) < parseInt($(b).find("#id-qty").text()) ? 1 :
            parseInt($(a).find("#id-qty").text()) > parseInt($(b).find("#id-qty").text()) ? -1 : 0)

        loc.empty()
        for (var i = 0; i < list.length; i++) {
            loc.append(list[i])
            if (fgal) {
                loc.find("#" + $(list[i]).prop("id")).dblclick(function () {
                    bhs.entries = {}
                    let galaxy = $("#btn-Galaxy").text().stripNumber()
                    let platform = $("#btn-Platform").text().stripMarginWS()
                    $("#btn-Player").text("")
                    bhs.getOrgEntries(bhs.displayEntryList, $(this).find("#id-names").text().stripMarginWS(), galaxy, platform)
                })
            }
        }
    }

    if (entry.uid != bhs.user.uid)
        return

    bhs.displayUTotals(entry[starsCol], cid)
}

blackHoleSuns.prototype.displayUTotals = function (entry, cid) {
    let pnl = $("#itm0")
    if (typeof entry != "undefined") {
        pnl.find("#" + totalsRows[rowTotal].id + " #" + cid).text(entry.total)

        if (typeof entry.galaxy != "undefined" && typeof entry.galaxy[bhs.user.galaxy] != "undefined")
            if (typeof rowGalaxy != "undefined")
                pnl.find("#" + totalsRows[rowGalaxy].id + " #" + cid).text(entry.galaxy[bhs.user.galaxy].total)
    }
}

blackHoleSuns.prototype.displayAllUTotals = function (entry) {
    let pnl = $("#itm0")
    pnl.find("#id-totalBHGP").css("border-bottom", "1px solid black")
    if (entry[starsCol]) {
        Object.keys(entry[starsCol].galaxy).forEach(g => {
            for (let i = 0; i < platformList.length; ++i) {
                if (entry[starsCol].galaxy[g][platformList[i].name] > 0) {
                    let id = "id-" + g.nameToId() + "-" + platformList[i].name.nameToId()
                    let h = /idname/ [Symbol.replace](totalsItemsHdr, id)

                    let t = /galaxy/ [Symbol.replace](totalsRows[rowGalaxyPlatform].title, g)
                    let l = /title/ [Symbol.replace](totalsItems, t)
                    h += /format/ [Symbol.replace](l, totalsCol[0].format)

                    l = /title/ [Symbol.replace](totalsItems, entry[starsCol].galaxy[g][platformList[i].name])
                    h += /format/ [Symbol.replace](l, totalsCol[1].format)

                    h += totalsItemsEnd
                    pnl.append(h)
                }
            }
        })
    }
}

blackHoleSuns.prototype.clearAllUTotals = function (entry) {
    let pnl = $("#itm0")
    Object.keys(entry[starsCol].galaxy).forEach(g => {
        if (entry[starsCol].galaxy[g] > 0) {
            let id = "id-" + g.nameToId()
            pnl.find("#" + id).remove()
        }
    })
}

const totalsPlayers = [{
    title: "Contributors",
    id: "id-names",
    format: "col-7",
    hformat: "col-7",
}, {
    title: "uid",
    id: "id-uid",
    format: "col-1 hidden",
    hformat: "col-1 hidden",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}]

const totalsOrgs = [{
    title: "Organization",
    id: "id-names",
    format: "col-7",
    hformat: "col-7",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}]

blackHoleSuns.prototype.displayUserTotals = function (entry, id, bold) {
    let fgal = window.location.pathname == "/galaxy.html"

    if (entry[starsCol] && entry[starsCol].total > 0) {
        const userHdr = `<div id="u-idname" class="row">`
        const userItms = `  <div id="idname" class="format">title</div>`
        const userEnd = `</div>`

        let pnl = $("#totals #" + id)
        let rid = entry._name.nameToId()
        let player = pnl.find("#u-" + rid)

        if (player.length == 0) {
            let h = /idname/ [Symbol.replace](userHdr, rid)

            totalsPlayers.forEach(x => {
                let l = /idname/ [Symbol.replace](userItms, x.id)
                l = /format/ [Symbol.replace](l, x.format + (bold ? " font-weight-bold" : ""))
                switch (x.title) {
                    case "Contributors":
                        h += /title/ [Symbol.replace](l, entry._name ? entry._name : entry.name)
                        break
                    case "uid":
                        h += /title/ [Symbol.replace](l, entry.uid ? entry.uid : "")
                        break
                    case "Total":
                        h += /title/ [Symbol.replace](l, entry[starsCol].total)
                        break
                }
            })

            h += userEnd

            pnl.append(h)
        } else {
            player.find("#id-qty").text(entry[starsCol].total)
        }
    }

    $("#totals #id-uid").hide()
}

blackHoleSuns.prototype.displayPlayerTotals = function (entry, id) {
    let u = Object.keys(entry)
    for (let i = 0; i < u.length; ++i) {
        let e = {}
        e._name = u[i]
        e[starsCol] = entry[u[i]]

        bhs.displayUserTotals(e, id)
    }
}

blackHoleSuns.prototype.displayGTotals = function (entry, id, ifcontest) {
    if (entry[starsCol]) {
        const userHdr = `<div id="u-idname" class="row">`
        const userItms = `  <div id="idname" class="format">title</div>`
        const userEnd = `</div>`

        let pnl = $("#totals #" + id)

        for (let i = 0; i < galaxyList.length; ++i) {
            let g = entry[starsCol].galaxy[galaxyList[i].name]
            if (g && g.total > 0) {
                let rid = galaxyList[i].name.nameToId()
                let player = pnl.find("#u-" + rid)

                if (player.length == 0) {
                    let h = /idname/ [Symbol.replace](userHdr, rid)

                    totalsGalaxy.forEach(x => {
                        let l = /idname/ [Symbol.replace](userItms, x.id)
                        l = /format/ [Symbol.replace](l, x.format)
                        switch (x.title) {
                            case "Galaxy":
                                h += /title/ [Symbol.replace](l, galaxyList[i].number + ". " + galaxyList[i].name)
                                break
                            case "Total":
                                h += /title/ [Symbol.replace](l, g.total)
                                break
                        }
                    })

                    h += userEnd

                    pnl.append(h)
                } else
                    player.find("#id-qty").text(g.total)

            }
        }
    }
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, changefcn, vertical) {
    let title = `        
        <div class="row">
            <div id="id-menu" class="col-md-medium col-sm-small col-xs h6 txt-inp-def">label</div>`
    let block = `
            <div id="menu-idname" class="col-md-medium col-sm-small col-xs dropdown">
                <button id="btn-idname" class="btn border btn-sm dropdown-toggle" style="rgbcolor" type="button" data-toggle="dropdown"></button>
            </div>
        </div>`

    let hdr = ``
    if (list.length > 8)
        hdr = `<ul id="list" class="dropdown-menu scrollable-menu" role="menu"></ul>`
    else
        hdr = `<ul id="list" class="dropdown-menu" role="menu"></ul>`

    let item = `<li id="item-idname" class="dropdown-item" type="button" style="rgbcolor cursor: pointer">iname</li>`

    let id = label.nameToId()
    let h = /label/ [Symbol.replace](title, label)
    h = /medium/ [Symbol.replace](h, vertical ? 13 : 8)
    h = /small/ [Symbol.replace](h, vertical ? 13 : 7)
    h = /xs/ [Symbol.replace](h, vertical ? 13 : 6)

    let l = /idname/g [Symbol.replace](block, id)
    l = /medium/ [Symbol.replace](l, vertical ? 13 : 5)
    l = /small/ [Symbol.replace](l, vertical ? 13 : 6)
    l = /xs/ [Symbol.replace](l, vertical ? 13 : 7)

    h += /rgbcolor/ [Symbol.replace](l, "background-color: " + levelRgb[typeof list[0].number == "undefined" ? 0 : list[0].number])
    loc.find("#id-" + id).append(h)

    let menu = loc.find("#menu-" + id)
    menu.append(hdr)

    let mlist = menu.find("#list")

    for (let i = 0; i < list.length; ++i) {
        let lid = list[i].name.nameToId()
        h = /idname/ [Symbol.replace](item, lid)

        if (list[i].number)
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name)
        else
        if (list[i].number)
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name)
        else
            h = /iname/ [Symbol.replace](h, list[i].name)

        if (label != "Galaxy") {
            if (list[i].number)
                h = /rgbcolor/ [Symbol.replace](h, "background-color: " + levelRgb[list[i].number] + ";")
            else
                h = /rgbcolor/ [Symbol.replace](h, "background-color: #c0f0ff;")
        } else {
            if (typeof bhs.galaxyInfo[galaxyList[i].number] != "undefined") {
                let c = bhs.galaxyInfo[galaxyList[i].number].color
                h = /rgbcolor/ [Symbol.replace](h, "background-color: " + c + ";")
            } else
                h = /rgbcolor/ [Symbol.replace](h, "background-color: #ffffff;")
        }

        mlist.append(h)

        mlist.find("#item-" + lid).unbind("click")
        mlist.find("#item-" + lid).click(function () {
            if (bhs.user.uid) {
                let name = $(this).text().stripMarginWS()
                let btn = menu.find("#btn-" + id)
                btn.text(name)

                if (changefcn)
                    changefcn(btn)

                if ($(this).attr("style"))
                    btn.attr("style", $(this).attr("style"))
            }
        })
    }
}

blackHoleSuns.prototype.saveUser = async function (batch) {
    if (bhs.user.uid) {
        let user = bhs.extractUser()
        let ok = bhs.validateUser(user)

        if (ok)
            ok = await bhs.updateUser(user, batch)

        return ok
    } else
        return false
}

blackHoleSuns.prototype.extractUser = function () {
    let loc = $("#pnl-user")
    let u = {}

    u._name = loc.find("#id-Player").val()
    u.platform = loc.find("#btn-Platform").text().stripNumber()
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber()
    u.org = loc.find("#btn-Organization").text().stripNumber()
    u.version = "beyond" // loc.find("#btn-Version").text().stripNumber()

    return u
}

blackHoleSuns.prototype.extractSettings = function () {
    let s = {}
    s.options = {}

    let loc = $("#utSettings")

    loc.find("[id|='ck']").each(() => {
        let id = $(this).prop("id")
        let checked = $(this).prop("checked")
        s.options[id] = checked
    })

    return s
}

blackHoleSuns.prototype.initSettings = function () {
    let s = {}
    s.options = {}

    let loc = $("#utSettings")
    loc.find("[id|='ck']").each(() => {
        let id = $(this).prop("id")
        s.options[id] = true
    })

    return s
}

blackHoleSuns.prototype.displaySettings = function (entry) {
    if (typeof entry.settings == "undefined")
        entry.settings = bhs.initSettings()

    let loc = $("#utSettings")

    let tbl = $("#id-table")
    let usrHdr = tbl.find("#userHeader")
    let usrItm = tbl.find("#userItems")

    usrHdr.find("#id-type").show()
    usrItm.find("#id-type").show()

    Object.keys(entry.settings.options).forEach(x => {
        loc.find("#" + x).prop("checked", entry.settings.options[x])
        let y = x.replace(/ck-(.*)/, "$1")
        if (entry.settings.options[x]) {
            usrHdr.find("#" + y).show()
            usrItm.find("#" + y).show()
        } else {
            usrHdr.find("#" + y).hide()
            usrItm.find("#" + y).hide()
        }
    })
}