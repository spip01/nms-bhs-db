'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser();

    $("#status").empty();
    $("#entryTable").empty();
    $("#totals").empty();
}

blackHoleSuns.prototype.doLoggedin = function () {
    bhs.getUser(bhs.displayUser);
}

var first = 0;
blackHoleSuns.prototype.displayUser = function (user) {
    let player = $("#pnl-user");

    if (!first++ || bhs.user.galaxy != user.galaxy || bhs.user.platform != user.platform) {
        bhs.merge(bhs.user, user);

        bhs.buildUserTable();
        bhs.buildTotals();

        bhs.getTotals(bhs.displayTotals);
        bhs.getEntries(bhs.displayUserEntry);
    }

    bhs.merge(bhs.user, user);

    player.find("#id-player").val(bhs.user.player);
    player.find("#btn-Platform").text(bhs.user.platform);
    player.find("#btn-Orginization").text(bhs.user.org);

    let l = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number;
    player.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    let i = bhs.getIndex(galaxyList, "name", bhs.user.galaxy);
    player.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[galaxyList[i].number].color + ";");
}

blackHoleSuns.prototype.buildUserPanel = function () {
    const panel = `
        <div id="pnl-user">
            <div class="row">
                <div class="col-7">
                    <div class="row">
                        <div class="col-14 h6 clr-dark-green">Traveler</div>
                        <input id="id-player" class="rounded col-13 h5" type="text">
                        <div id="id-Orginization" class="col-13"></div>
                    </div>
                </div>

                <div class="col-7">
                    <div class="row">
                        <div id="id-Platform" class="col-7"></div>
                        <div id="id-Galaxy" class="col-7"></div>
                    </div>
                </div>
            </div>
        </div>`;

    $("#panels").prepend(panel);
    let loc = $("#pnl-user");

    //bhs.buildOrgList();
    const orgList = [{
        name: "none"
    }, {
        name: "BHS"
    }, {
        name: "Galactic Hub"
    }, {
        name: "Alliance of Galactic Travelers"
    }];

    bhs.buildMenu(loc, "Orginization", orgList, bhs.saveUser, false);
    bhs.buildMenu(loc, "Platform", platformList, bhs.saveUser, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.saveUser, true);

    $("#id-player").blur(function () {
        bhs.checkPlayerName(this);
    });
}

const utPlayerIdx = 0;
const utGalaxyIdx = 1;
const utPlatformIdx = 2;

const userTable = [{
        title: "Player",
        id: "id-player",
        field: "player",
        format: "col-2",
        hide: true
    }, {
        title: "Galaxy",
        id: "id-galaxy",
        field: "galaxy",
        format: "col-2",
        hide: true
    }, {
        title: "Platform",
        id: "id-platform",
        field: "platform",
        format: "col-2",
        hide: true
    }, {
        title: "",
        id: "id-type",
        format: "col-1",
        field: "blackhole",
        field2: "deadzone"
    }, {
        title: "Coordinates",
        id: "id-addr",
        field: "addr",
        format: "col-3"
    }, {
        title: "LY",
        id: "id-toctr",
        format: "col-1",
        calc: true
    }, {
        title: "System",
        id: "id-sys",
        field: "sys",
        format: "col-2"
    }, {
        title: "Region",
        id: "id-reg",
        field: "reg",
        format: "col-2"
    }, {
        title: "Lifeform",
        id: "id-life",
        field: "life",
        format: "col-2"
    }, {
        title: "Economy",
        id: "id-econ",
        field: "econ",
        format: "col-2"
    }
    /*, {
        title: "Base",
        id: "id-base",
        field: "hasbase",
        format: "col-2",
    }*/
];

blackHoleSuns.prototype.buildUserTable = function () {
    const table = `
        <div class="card-header">
            <div class="row">
                <h4 class="col-10">Latest Changes</h4>
                <button id="export" type="button" class="col-3 btn border btn-sm disabled"
                 disabled>Export</button>&nbsp;
            </div>
        </div>

        <div id="data" class="card-body">
            <div id="userHeader" class="row border-bottom"></div>
            <div id="userItems"></div>
            </table>
        </div>`;

    $("#entryTable").empty();
    $("#entryTable").append(table);

    const line = `<div id="idname" class="width h6">title</div>`;

    let h = "";
    userTable.forEach(function (t) {
        let l = /idname/g [Symbol.replace](line, t.id);
        l = /width/g [Symbol.replace](l, t.format);
        h += /title/g [Symbol.replace](l, t.title);
    });

    let loc = $("#userHeader");
    loc.append(h);

    if ($("#entryTable").data().page == "input") {
        bhs.hideUserTable(loc, utPlayerIdx);
        bhs.hideUserTable(loc, utPlatformIdx);
        bhs.hideUserTable(loc, utGalaxyIdx);
    }
}

var last = false;

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    const lineHdr = `
        <div id="id-gpa" class="row">`;
    const line = `
            <div id="idname" class="width">
                <div id="bh-idname" class="row">bhdata</div>
                <div id="x-idname" class="row">xdata</div>
            </div>`;
    const lineEnd = `
        </div>`;

    let gpa = entry.galaxy + "-" + entry.platform + "-" + (entry.blackhole ? entry.connection.stripColons() : entry.addr.stripColons());

    let loc = $("#userItems").find("#id-" + gpa);

    if (loc.length == 0) {
        let h = /gpa/ [Symbol.replace](lineHdr, gpa);

        userTable.forEach(function (t) {
            let l = /idname/g [Symbol.replace](line, t.id);
            l = /width/g [Symbol.replace](l, t.format);

            if (t.calc) {
                l = /bhdata/ [Symbol.replace](l, entry.blackhole ? bhs.calcDist(entry.addr) - bhs.calcDist(entry.connection) : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else if (t.id == "id-type") {
                l = /bhdata/ [Symbol.replace](l, entry.blackhole ? "BH" : entry.deadzone ? "DZ" : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else if (entry.blackhole || entry.deadzone) {
                l = /bhdata/ [Symbol.replace](l, entry[t.field]);
                l = /xdata/ [Symbol.replace](l, "");
            } else {
                l = /bhdata/ [Symbol.replace](l, "");
                l = /xdata/ [Symbol.replace](l, entry[t.field]);
            }

            h += l;
        });

        h += lineEnd;

        $("#userItems").prepend(h);
        loc = $("#userItems").find("#id-" + gpa);
        loc.prop("class", (last = !last) ? "row bkg-vlight-gray" : "row");

        loc.dblclick(function () {
            // copy to input

            $('html, body').animate({
                scrollTop: ($('#panels').offset().top)
            }, 0);

            $("#delete").removeClass("disabled");
            $("#delete").removeAttr("disabled");
        });
    } else
        userTable.forEach(function (t) {
            let e = loc.find("#" + (entry.blackhole || entry.deadzone ? "bh-" : "x-") + t.id);

            if (t.calc)
                e.text(entry.blackhole ? bhs.calcDist(entry.addr) - bhs.calcDist(entry.connection) : "");
            else if (t.id == "id-type")
                e.text(entry.blackhole ? "BH" : entry.deadzone ? "DZ" : "");
            else
                e.text(entry[t.field]);
        });

    if ($("#entryTable").data().page == "input") {
        bhs.hideUserTable(loc, utPlayerIdx);
        bhs.hideUserTable(loc, utPlatformIdx);
        bhs.hideUserTable(loc, utGalaxyIdx);
    }
}

blackHoleSuns.prototype.hideUserTable = function (loc, idx) {
    loc.find("#" + userTable[idx].id).hide();
}

const totalsRowHdr = ` <div id="idname" class="row">`;
const totalsItems = `       <div id="idname" class="format">title</div>`;
const totalsRowEnd = ` </div>`;

const totalsDef = [{
    title: "",
    id: "id-what",
    format: "col-4",
}, {
    title: "Player",
    id: "id-player",
    format: "col-2",
}, {
    title: "All Players",
    id: "id-all",
    format: "col-2",
}, {
    title: "Top Players",
    id: "id-topname",
    format: "col-3",
}, {
    title: "Total",
    id: "id-topqty",
    format: "col-2",
}];

blackHoleSuns.prototype.buildTotals = function () {
    const pnl = `
        <div class="card-header h4">Totals</div>
        <div class="card-body">
            <div id="totalsHeader"></div>
            <div id="totalsItems"></div>
        </div>`;

    $("#totals").empty();
    $("#totals").append(pnl);

    let h = totalsRowHdr;
    totalsDef.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        h += /format/ [Symbol.replace](l, t.format);
    });

    h += totalsRowEnd;
    $("#totalsHeader").append(h);

    totalsRows.forEach(function (x) {
        h = /idname/ [Symbol.replace](totalsRowHdr, x.id);

        let t = /platform/ [Symbol.replace](x.title, bhs.user.platform);
        t = /galaxy/ [Symbol.replace](t, bhs.user.galaxy);

        totalsDef.forEach(function (y) {
            let l = /idname/ [Symbol.replace](totalsItems, y.id);
            l = /title/ [Symbol.replace](l, t);
            h += /format/ [Symbol.replace](l, y.format);

            t = "";
        });

        h += totalsRowEnd;
        $("#totalsItems").append(h);
    });
}

const rowTotal = 0;
const rowGalaxy = 1;
const rowPlatform = 2;
const rowGalaxyPlatform = 3;

const totalsRows = [{
    title: "Total BH",
    id: "id-totalBH",
}, {
    title: "Total[galaxy]",
    id: "id-totalBHP",
}, {
    title: "Total[platform]",
    id: "id-totalBHP",
}, {
    title: "Total[galaxy][platform]",
    id: "id-totalBHPG",
}];

blackHoleSuns.prototype.displayTotals = function (entry) {
    let pnl = $("#totalsItems");
    let columnid = entry.loc == "stars" ? "id-all" : "id-player";

    if (entry.galaxy == bhs.user.galaxy) {
        let rowid = totalsRows[rowGalaxy].id;
        pnl.find("#" + rowid + " #" + columnid).text(entry.totals.blackholes);

        rowid = totalsRows[rowGalaxyPlatform].id;
        pnl.find("#" + rowid + " #" + columnid).text(entry.totals[bhs.user.platform].blackholes);
    } else {
        let rowid = totalsRows[rowTotal].id;
        pnl.find("#" + rowid + " #" + columnid).text(entry.totals.blackholes);

        rowid = totalsRows[rowPlatform].id;
        pnl.find("#" + rowid + " #" + columnid).text(entry.totals[bhs.user.platform].blackholes);
    }
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, changefcn, vertical) {
    let title = `        
        <div class="row">
            <div class="col-md-14 col-width h6 clr-dark-green">label</div>`;
    let block = `
            <div id="menu-idname" class="col-md-14 col-width dropdown">
                <button id="btn-idname" class="btn border btn-sm dropdown-toggle" style="rgbcolor" type="button" data-toggle="dropdown"></button>
            </div>
        </div>`;

    let item = ``;
    let hdr = ``;
    if (list.length > 8) {
        hdr = `<ul id="list" class="dropdown-menu scrollable-menu" role="menu"></ul>`;
        item = `<li id="item-idname" class="dropdown-item" type="button" style="rgbcolor cursor: pointer">iname</li>`;
    } else {
        hdr = `<div id="list" class="dropdown-menu"></div>`;
        item = `<button id="item-idname" class="dropdown-item border-bottom" type="button" style="rgbcolor cursor: pointer">iname</button>`;
    }

    let id = label.nameToId();
    let h = /label/ [Symbol.replace](title, label);
    h += /idname/g [Symbol.replace](block, id);
    h = /width/ [Symbol.replace](h, vertical ? 13 : 4);
    h = /rgbcolor/ [Symbol.replace](h, "background-color: " + levelRgb[label == "Galaxy" ? 0 : list[0].level]);
    loc.find("#id-" + id).append(h);

    let menu = loc.find("#menu-" + id);
    menu.append(hdr);

    let mlist = menu.find("#list");

    for (let i = 0; i < list.length; ++i) {
        let lid = list[i].name.nameToId();
        h = /idname/ [Symbol.replace](item, lid);

        if (list[i].level)
            h = /iname/ [Symbol.replace](h, list[i].level + " " + list[i].name);
        else
        if (list[i].number)
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name);
        else
            h = /iname/ [Symbol.replace](h, list[i].name);

        if (label != "Galaxy") {
            if (list[i].level)
                h = /rgbcolor/ [Symbol.replace](h, "background-color: " + levelRgb[list[i].level] + ";");
            else
                h = /rgbcolor/ [Symbol.replace](h, "background-color: #f0fff0;");
        } else {
            if (typeof bhs.galaxyInfo[galaxyList[i].number] != "undefined") {
                let c = bhs.galaxyInfo[galaxyList[i].number].color;
                h = /rgbcolor/ [Symbol.replace](h, "background-color: " + c + ";");
            } else
                h = /rgbcolor/ [Symbol.replace](h, "background-color: #ffffff;");
        }

        mlist.append(h);

        mlist.find("#item-" + lid).click(function () {
            let name = $(this).text().stripMarginWS();
            let btn = menu.find("#btn-" + id);
            btn.text(name);

            if (changefcn)
                changefcn(name.stripNumber());

            if ($(this).attr("style"))
                btn.attr("style", $(this).attr("style"));
        });
    }
}

blackHoleSuns.prototype.saveUser = function () {
    let user = bhs.extractUser();
    if (bhs.validateUser(user))
        bhs.updateUser(user);
}

blackHoleSuns.prototype.extractUser = function () {
    let loc = $("#pnl-user");
    let u = {};

    u.player = loc.find("#id-player").val();
    u.platform = loc.find("#btn-Platform").text().stripNumber();
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
    u.org = loc.find("#btn-org").text().stripNumber();

    return u;
}