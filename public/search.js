'use strict'

import { Timestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"
import { bhs, blackHoleSuns, startUp } from "./commonFb.js";
import { addressToXYZ, reformatAddress } from "./commonNms.js";
import { galaxyList, platformList } from "./constants.js";

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

$(document).ready(() => {
    startUp()

    bhs.buildSelectPanel()
    bhs.buildSearchPanel()
})

blackHoleSuns.prototype.buildSelectPanel = async function () {
    let loc = $("#pnl-user")

    await bhs.getUserList(true)

    bhs.buildMenu(loc, "Player", bhs.usersList, null, {
        tip: "Search entries made by player. '--blank--' is to deselect a player.",
    })
    bhs.buildMenu(loc, "Platform", platformList, null, {
        required: true,
    })
    bhs.buildMenu(loc, "Galaxy", galaxyList, null, {
        required: true,
    })
}

blackHoleSuns.prototype.select = function () {
    let name = $("#btn-Player").text().stripNumber()
    name = name ? name : "--blank--"
    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let platform = $("#btn-Platform").text().stripNumber()
    bhs.getEntriesByName(bhs.displayEntryList, name, galaxy, platform)
}

blackHoleSuns.prototype.buildSearchPanel = function () {}

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
        start = start == "" ? 0 : Timestamp.fromDate(new Date(start)).seconds
        end = end == "" ? Number.MAX_SAFE_INTEGER : Timestamp.fromDate(new Date(end)).seconds

        bhs.doSearch("created", start, end)
    } else
        bhs.displayEntryList(bhs.entries)

}

blackHoleSuns.prototype.searchReg = async function () {
    let addr = $("#id-regaddr").val()
    let r = parseInt($("#id-regradius").val())
    addr = reformatAddress(addr)
    let xyz = addressToXYZ(addr)
    xyz.s = 0x79
    $("#id-regaddr").val(xyzToAddress(xyz))


    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let platform = $("#btn-Platform").text().stripNumber()

    let ref = collection(bhs.fs, "stars5/" + galaxy + "/" + platform)
    bhs.entries = {}
    let p =[]

    for (let x = xyz.x - r; x <= xyz.x + r; ++x)
        for (let y = xyz.y - r; y <= xyz.y + r; ++y)
            for (let z = xyz.z - r; z <= xyz.z + r; ++z) {
                let a = xyzToAddress({
                    x: x,
                    y: y,
                    z: z,
                    s: xyz.s
                })

                p.push(doc(ref, a).get().then(doc => {
                    if (doc.exists()) {
                        let e = doc.data()
                        bhs.entries[e.addr] = e
                    }
                }))
            }

    await Promise.all(p)
    bhs.displayEntryList(bhs.entries, true)
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

    bhs.displayEntryList(found)
}