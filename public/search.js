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
    bhs.getEntries(bhs.displayEntryList, bhs.displayEntry, uid, galaxy, platform);
}

blackHoleSuns.prototype.buildSearchPanel = function () {
    let loc = $("#searchpnl");
    //bhs.buildMenu(loc, "Lifeform", lifeformList);
    //bhs.buildMenu(loc, "Economy", economyList);

    loc.find("#btn-search").click(function () {
        bhs.search();
    });
}

blackHoleSuns.prototype.search = function () {
    let loc = $("#searchpnl");
    let addr = loc.find("#id-addr").val();
    let sys = loc.find("#id-sys").val();
    let reg = loc.find("#id-reg").val();
    let start = loc.find("#id-start").val();
    let end = loc.find("#id-end").val();
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
    else if (start != "" || end != "") {
        start = start == "" ? 0 : firebase.firestore.Timestamp.fromDate(new Date(start)).seconds;
        end = end == "" ? Number.MAX_SAFE_INTEGER : firebase.firestore.Timestamp.fromDate(new Date(end)).seconds

        bhs.doSearch("created", start, end);
    }
    // else if (life != "")
    //     bhs.doSearch("life", life);
    // else if (econ != "")
    //     bhs.doSearch("econ", econ);
}

blackHoleSuns.prototype.doSearch = function (type, s1, s2) {
    let found = {};
    if (!bhs.entries)
        bhs.select();
        
    let list = Object.keys(bhs.entries);
    for (let i = 0; i < list.length; ++i) {
        let e = bhs.entries[list[i]];
        if (type == "created") {
            if (e.bh && e.bh[type].seconds > s1 && e.bh[type].seconds < s2)
                found[list[i]] = e;
        } else if (e.bh && e.bh[type] == s1 || e.exit && e.exit[type] == s1)
            found[list[i]] = e;
    }

    bhs.displayEntryList(found, true);
}
