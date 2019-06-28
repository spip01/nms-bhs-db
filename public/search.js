'use strict';

$(document).ready(function () {
    startUp();
    bhs.buildSelectPanel();
    bhs.buildSearchPanel();
});

blackHoleSuns.prototype.buildSelectPanel = async function () {
    const panel = `
        <div id="sel">
            <div class="row">
                <div id="id-Player" class="col-4 text-center"></div>
                <div id="id-Platform" class="col-4 text-center"></div>
                <div id="id-Galaxy" class="col-4 text-center"></div>
            </div>
        <br>`;

    $("#pnl-user").append(panel);
    let loc = $("#pnl-user #sel");

    bhs.usersList = await bhs.getUserList();
    bhs.usersList.unshift({
        name: "",
        uid: null
    });

    bhs.buildMenu(loc, "Player", bhs.usersList, bhs.select);
    bhs.buildMenu(loc, "Platform", platformList, bhs.select);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.select);
}

blackHoleSuns.prototype.select = function () {
    bhs.entries = {};
    let i = bhs.getIndex(bhs.usersList, "name", $("#btn-Player").text().stripNumber());
    let uid = i != -1 ? bhs.usersList[i].uid : null;
    let galaxy = $("#btn-Galaxy").text().stripNumber();
    let platform = $("#btn-Platform").text().stripNumber();
    bhs.getEntries(bhs.displayEntryList, uid, galaxy, platform);
}

blackHoleSuns.prototype.buildSearchPanel = function () {
    let loc = $("#searchpnl");
    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    loc.find("#btn-search").click(function () {
        bhs.search();
    });
}

blackHoleSuns.prototype.search = function () {
    let loc = $("#searchpnl");
    let addr = loc.find("#id-addr").val();
    let sys = loc.find("#id-sys").val();
    let reg = loc.find("#id-reg").val();
    // let life = loc.find("#btn-Lifeform").text().stripNumber();
    // let econ = loc.find("#btn-Economy").text().stripNumber();

    if (addr != "") {
        addr = bhs.reformatAddress(addr);
        loc.find("#id-addr").val(addr);
        bhs.doSearch("addr", addr);
    } else if (sys != "")
        bhs.doSearch("sys", sys);
    else if (reg != "")
        bhs.doSearch("reg", reg);
    // else if (life != "")
    //     bhs.doSearch("life", life);
    // else if (econ != "")
    //     bhs.doSearch("econ", econ);
}

blackHoleSuns.prototype.doSearch = function (type, what) {
    let found = {};
    let list = Object.keys(bhs.entries);
    for (let i = 0; i < list.length; ++i) {
        let e = bhs.entries[list[i]];
        if (e.bh && e.bh[type] == what || e.exit && e.exit[type] == what) {
            found[list[i]] = e;
        }
    }

    bhs.displayResults(found);
    bhs.drawList(found, true);
}

blackHoleSuns.prototype.displayResults = function (found) {
    let bhrow = `<div class="row">bh&nbsp;-&nbsp;exit</div>`;
    let exitrow = `<div class="row">exit</div>`;
    let h = "";

    if (found.bh) {
        h = /bh/ [Symbol.replace](bhrow, found.bh ? found.bh.addr : "");
        h = /exit/ [Symbol.replace](h, found.exit ? found.exit.addr : "");
    } else if (found.exit) {
        h = /exit/ [Symbol.replace](exitrow, found.exit ? found.exit.addr : "");
    } else {
        let list = Object.keys(found);
        for (let i = 0; i < list.length; ++i) {
            let l = "";
            if (found[list[i]].bh) {
                l = /bh/ [Symbol.replace](bhrow, found[list[i]].bh ? found[list[i]].bh.addr : "");
                l = /exit/ [Symbol.replace](l, found[list[i]].exit ? found[list[i]].exit.addr : "");
            } else
                l = /exit/ [Symbol.replace](exitrow, found[list[i]].exit ? found[list[i]].exit.addr : "");

            h += l;
        }
    }

    $("#resultsTable").append(h);
}