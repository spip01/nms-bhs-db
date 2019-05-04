'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    $("#map").hide();
    $("#userTable").hide();
    $("#userItems").empty();
}

blackHoleSuns.prototype.doLoggedin = function () {
    bhs.getUser(bhs.displayUser);
}

blackHoleSuns.prototype.displayUser = function (user) {
    let player = $("#pnl-user");

    if (!bhs.hasupdated || bhs.user.galaxy != user.galaxy || bhs.user.platform != user.platform) {
        bhs.hasupdated = true;
        bhs.user.galaxy = user.galaxy;
        bhs.user.platform = user.platform;

        bhs.buildUserTable();
        bhs.buildTotals();

        bhs.getTotals(bhs.displayTotals);
        bhs.getEntries(bhs.displayUserEntry);
    }

    bhs.user = user;

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
                        <input id="id-player" class="rounded col-13 h5" type="text">&nbsp;

                        <div class="col-7">
                            <div class="row">
                                <div class="col-7 h6 clr-dark-green">Orginization</div>
                                <div id="id-Orginization" class="col-7"></div>
                            </div>
                        </div>
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

    //bhs.buildMenu(loc, "Orginization", bhs.orgList, false);
    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    $("#id-player").blur(function () {
        bhs.checkPlayerName(this, $(this).val());
    });
}

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
    title: "Type",
    id: "id-type",
    format: "col-1",
    field: "blackhole",
    field2: "deadzone"
}, {
    title: "Coordinates",
    id: "id-addr",
    field: "addr",
    format: "col-2"
}, {
    title: "LY to Ctr",
    id: "id-toctr",
    format: "col-2",
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
    field: "eon",
    format: "col-2"
}, {
    title: "Base",
    id: "id-base",
    field: "hasbase",
    format: "col-2",
}];

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
            <div id="userHeader" class="row"></div>
            <div id="userItems" class="row"></div>
            </table>
        </div>`;

    $("#userTable").empty();
    $("#userTable").append(table);

    const line = `<div id="idname" class="width">title<div>`;

    let h = "";
    userTable.forEach(function (t) {
        let l = /idname/g [Symbol.replace](this, t.id);
        l = /width/g [Symbol.replace](l, t.format);
        h += /title/g [Symbol.replace](l, t.title);
    });

    $("#userHeader").append(h);
}

blackHoleSuns.prototype.hideTableEntry = function (entry) {
    let loc = $("#userTable #data");
    if (entry) {
        let gpa = entry.galaxy + "-" + entry.platform + "-" + entry.addr.stripColons();
        loc = loc.find("#userItems #id-" + gpa);
    }

    userTable.forEach(function (t) {
        if (t.hide)
            loc.find("#" + t.id).hide();
    });
}

var last = false;

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    const lineHdr = `
        <div id="id-gpa">`;
    const line = `
            <div id="idname" class="width">
                <div id="bh-idname" class="col-14">bhdata<div>
                <div id="x-idname" class="col14">xdata<div>
            </div>`;
    const lineEnd = `
        </div>`;

    let gpa = entry.galaxy + "-" + entry.platform + "-" + entry.addr.stripColons();

    let loc = $("#entryTable").find("#id-" + gpa);

    if (loc.length == 0) {
        let h = /gpa/ [Symbol.replace](lineHdr, gpa);
        let l = line;

        userTable.forEach(function (t) {
            l = /idname/g [Symbol.replace](l, t.id)

            if (t.calc) {
                l = /bhdata/ [Symbol.replace](l, entry.blackhole ? bhs.calcDist(entry.addr) - bhs.calcDist(entry.connection) : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else if (t.field == "blackhole") {
                l = /bhdata/ [Symbol.replace](l, entry[t.field] ? "BH" : entry[t.field2] ? "DZ" : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else if (entry.blackhole || entry.deadzone) {
                l = /bhdata/ [Symbol.replace](l, entry[t.field]);
                l = /xdata/ [Symbol.replace](l, "");
            } else {
                l = /bhdata/ [Symbol.replace](l, "");
                l = /xdata/ [Symbol.replace](l, entry[t.field]);
            }
        });

        h += l + lineEnd;

        $("#userItems").prepend(h);
        loc.prop("class", (last = !last) ? "bkg-light-gray" : "");

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
            loc.find("#" + (entry.blackhole ? "bh-" : "x-") + t.id).
            text(entry[t.field]);
        });
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
        <div class="card-header">Totals</div>
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
    if (entry.totals) {
        let pnl = $("#totalsItems");
        let columnid = entry.loc == "stars" ? "id-all" : "id-player";

        if (entry.name == bhs.user.galaxy) {
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
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, vertical) {
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

            if ($(this).attr("style"))
                btn.attr("style", $(this).attr("style"));
        });
    }
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, vertical) {
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

            if (typeof $(this).attr("style") != "undefined")
                btn.attr("style", $(this).attr("style"));
        });
    }
}

blackHoleSuns.prototype.extractUser = function () {
    let loc = $("#pnl-user");
    let u = {};

    u.player = loc.find("#id-player").val();
    u.platform = loc.find("#btn-Platform").text().stripMarginWS();
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
    u.org = loc.find("#btn-org").text().stripNumber();

    return u;
}