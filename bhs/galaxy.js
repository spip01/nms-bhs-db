'use strict';

$(document).ready(function () {
    startUp();
    bhs.buildSelectPanel();
});

blackHoleSuns.prototype.buildSelectPanel = async function () {
    const panel = `
        <div id="sel">
            <div class="row">
            <div class="col-1"></div>
            <div id="id-Player" class="col-4"></div>
            <div id="id-Platform" class="col-4"></div>
                <div id="id-Galaxy" class="col-4"></div>
            </div>
        </div>
        <br>`;

    $("#pnl-user").append(panel);
    let loc = $("#pnl-user #sel");

    bhs.usersList = await bhs.getUserList();
    bhs.usersList.unshift({
        name: "",
        uid: null
    });

    bhs.buildMenu(loc, "Player", bhs.usersList, bhs.select, true);
    bhs.buildMenu(loc, "Platform", platformList, bhs.select, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.select, true);
}

blackHoleSuns.prototype.select = function () {
    bhs.entries = {};
    let i = bhs.getIndex(bhs.usersList, "name", $("#btn-Player").text().stripNumber());
    let uid = i != -1 ? bhs.usersList[i].uid : null;
    let galaxy = $("#btn-Galaxy").text().stripNumber();
    let platform = $("#btn-Platform").text().stripNumber();
    bhs.getEntries(bhs.displayEntryList, uid, galaxy, platform);
}