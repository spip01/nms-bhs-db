'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

$(document).ready(function () {
    startUp()

    bhs.buildSelectPanel()
})

blackHoleSuns.prototype.buildSelectPanel = async function () {
    const panel = `
        <div id="sel">
            <div class="row">
                <div id="id-Player" class="col-3 text-center"></div>
                <div id="id-Platform" class="col-3 text-center"></div>
                <div id="id-Galaxy" class="col-3 text-center"></div>
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
        vertical: true,
        tip: "Display entries made by player on map. First selection for galaxy & platform is slow."
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
    let galaxy = $("#btn-Galaxy").text().stripNumber()
    let platform = $("#btn-Platform").text().stripNumber()
    bhs.getEntriesByName(bhs.displayEntryList, bhs.displayEntry, name, galaxy, platform)
}