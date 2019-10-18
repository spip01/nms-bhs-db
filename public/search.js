'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

$(document).ready(() => {
    startUp()

    bhs.buildSelectPanel()
    bhs.buildSearchPanel()
})

blackHoleSuns.prototype.buildSelectPanel = async function () {
    const panel = `
        <div id="sel">
            <div class="row">
                <div id="id-Player" class="col-4 text-center"></div>
                <div id="id-Platform" class="col-4 text-center"></div>
                <div id="id-Galaxy" class="col-4 text-center"></div>
            </div>
        <br>`

    $("#pnl-user").append(panel)
    let loc = $("#pnl-user #sel")

    bhs.usersList = await bhs.getUserList()
    bhs.usersList.unshift({
        name: "",
        uid: null
    })

    bhs.buildMenu(loc, "Player", bhs.usersList, bhs.select, {
        vertical:true,
        tip: "Search entries made by player. First search for galaxy & platform is slow."
    })
    bhs.buildMenu(loc, "Platform", platformList, bhs.select, {
        vertical:true,
        required: true
    })
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.select, {
        vertical:true,
        required: true
    })
}

blackHoleSuns.prototype.select = function () {
    let name = $("#btn-Player").text().stripNumber()
    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let platform = $("#btn-Platform").text().stripNumber()
    bhs.getEntriesByName(bhs.displayEntryList, bhs.displayEntry, name, galaxy, platform)
}

blackHoleSuns.prototype.buildSearchPanel = function () {
    let loc = $("#searchpnl")
    loc.find("#btn-search").click(() => {
        bhs.search()
    })
}

blackHoleSuns.prototype.search = function () {
    let loc = $("#searchpnl")
    let addr = loc.find("#id-addr").val()
    let sys = loc.find("#id-sys").val()
    let reg = loc.find("#id-reg").val()
    let start = loc.find("#id-start").val()
    let end = loc.find("#id-end").val()

    if (addr != "") {
        addr = reformatAddress(addr)
        loc.find("#id-addr").val(addr)
        bhs.doSearch("addr", addr)
    } else if (sys != "")
        bhs.doSearch("sys", sys)
    else if (reg != "")
        bhs.doSearch("reg", reg)
    else if (start != "" || end != "") {
        start = start == "" ? 0 : firebase.firestore.Timestamp.fromDate(new Date(start)).seconds
        end = end == "" ? Number.MAX_SAFE_INTEGER : firebase.firestore.Timestamp.fromDate(new Date(end)).seconds

        bhs.doSearch("created", start, end)
    }
}

blackHoleSuns.prototype.doSearch = function (type, s1, s2) {
    let found = {}
    if (!bhs.entries)
        bhs.select()

    let list = Object.keys(bhs.entries)
    for (let i = 0; i < list.length; ++i) {
        let e = bhs.entries[list[i]]
        if (e.blackhole)
            if (type == "created") {
                if (e[type].seconds > s1 && e[type].seconds < s2)
                    found[list[i]] = e
            } else if (e[type] == s1 || e.x[type] == s1)
            found[list[i]] = e
    }

    bhs.displayEntryList(found, true)
}