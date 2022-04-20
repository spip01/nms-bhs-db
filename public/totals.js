'use strict'

import { bhs, blackHoleSuns, startUp } from "./commonFb.js";
import { galaxyList, platformList } from "./constants.js";

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

$(document).ready(function () {
    startUp()

    bhs.buildSelectPanel()
})

blackHoleSuns.prototype.buildSelectPanel = async function () {
    let loc = $("#pnl-user #sel")

    await bhs.getUserList(true)

    bhs.buildMenu(loc, "Player", bhs.usersList, bhs.select, {
        vertical: true,
        tip: "Display entries made by player on map. '--blank--' is to deselect a player. First selection for galaxy & platform is slow."
    })
    bhs.buildMenu(loc, "Platform", platformList, bhs.select, {
        vertical: true
    })
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.select, {
        vertical: true,
        tip: "Empty - blue<br>Harsh - red<br>Lush - green<br>Normal - teal"
    })
}

blackHoleSuns.prototype.select = async function () {
    let name = $("#btn-Player").text().stripNumber()
    name = name ? name : "--blank--"
    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let platform = $("#btn-Platform").text().stripNumber()
    bhs.getEntriesByName(bhs.displayEntryList, name, galaxy, platform)
}