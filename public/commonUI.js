'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser(bhs.user);

    $("#status").empty();
    $("#entryTable").empty();
    $("#totals").empty();

    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
}

blackHoleSuns.prototype.doLoggedin = function () {
    bhs.getUser(bhs.displayUser);

    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
}

blackHoleSuns.prototype.displayUser = function (user) {
    bhs.user = bhs.merge(bhs.user, user);

    if (bhs.user.uid) {
        bhs.buildUserTable();
        bhs.buildTotals();

        bhs.getTotals(bhs.displayTotals);
        bhs.getEntries(bhs.displayUserEntry);
    }

    let player = $("#pnl-user");
    player.find("#id-player").val(bhs.user.player);
    player.find("#btn-Platform").text(bhs.user.platform);
    player.find("#btn-Organization").text(bhs.user.org);

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
                        <div id="id-Organization" class="col-13"></div>
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

    bhs.buildMenu(loc, "Organization", orgList, bhs.saveUser);
    bhs.buildMenu(loc, "Platform", platformList, bhs.saveUser, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.saveUser, true);

    $("#id-player").blur(function () {
        if (bhs.user.uid)
            bhs.checkPlayerName(this);
    });
}

const utPlayerIdx = 0;
const utGalaxyIdx = 1;
const utPlatformIdx = 2;
const utTypeIdx = 3;
const utAddrIdx = 4;

var userTable = [{
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
                <h4 class="col-9">Latest Changes</h4>
                <button id="export" type="button" class="col-2 btn border btn-sm disabled" disabled>Export</button>&nbsp;
                <button id="btn-utSettings" type="button" class="col-1 btn-sm">
                    <i class="fas fa-angle-down"></i>
                </button>
            </div>
        </div>

        <div id="utSettings" class="card card-body" style="display:none">
            <div class="row">
                <div class="col-2 h6 clr-dark-green">Show</div>
                <input id="id-showQty" class="rounded col-2 h5" type="text" placeholder="10">
            </div>
            <div id="id-utlistsel" class="row"></div>
        </div>

        <div id="id-table" class="card-body">
            <div id="userHeader" class="row border-bottom"></div>
            <div id="userItems"></div>
        </div>`;

    const ckbox = `            
        <label class="col-2 h6 clr-dark-green">
            <input id="ck-idname" type="checkbox" checked>
            title
        </label>`;

    $("#entryTable").empty();
    $("#entryTable").append(table);

    const line = `<div id="idname" class="width h6">title</div>`;

    let h = "";
    userTable.forEach(function (t) {
        if (t.title) {
            let l = /idname/ [Symbol.replace](line, t.id);
            l = /width/ [Symbol.replace](l, t.format);
            h += /title/ [Symbol.replace](l, t.title);
        }

    });

    let loc = $("#userHeader");
    loc.append(h);

    h = "";
    userTable.forEach(function (t) {
        if (t.title) {
            let l = /idname/ [Symbol.replace](ckbox, t.id);
            h += /title/ [Symbol.replace](l, t.title);
        }
    });

    loc = $("#id-utlistsel");
    loc.append(h);

    userTable.forEach(function (t) {
        loc.find("#ck-" + t.id).change(function () {
            if ($(this).prop("checked")) {
                $("#userHeader").find("#" + t.id).show();
                $("#userItems").find("#" + t.id).show();
            } else {
                $("#userHeader").find("#" + t.id).hide();
                $("#userItems").find("#" + t.id).hide();
            }
        });
    });

    $("#id-showQty").blur(function () {
        bhs.getEntries(bhs.displayUserEntry, $(this).val());
    });

    $("#btn-utSettings").click(function () {
        if ($(this).html() == `<i class="fas fa-angle-down"></i>`) {
            $("#utSettings").show();
            $(this).html(`<i class="fas fa-angle-up"></i>`);
        } else {
            $("#utSettings").hide();
            $(this).html(`<i class="fas fa-angle-down"></i>`);
        }
    });

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
                l = /bhdata/ [Symbol.replace](l, entry[t.field] ? entry[t.field] : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else {
                l = /bhdata/ [Symbol.replace](l, "");
                l = /xdata/ [Symbol.replace](l, entry[t.field] ? entry[t.field] : "");
            }

            h += l;
        });

        h += lineEnd;

        $("#userItems").prepend(h);
        loc = $("#userItems").find("#id-" + gpa);
        loc.addClass((last = !last) ? "row bkg-vlight-gray" : "row");

        loc.dblclick(function () {
            bhs.entryFromTable(this);

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
}

blackHoleSuns.prototype.entryFromTable = function (ent) {
    let type = $(ent).find("#id-type").text().stripMarginWS().slice(0, 2);
    let addr = "";

    if (type == "BH" || type == "DZ")
        addr = $(ent).find("#bh-" + userTable[utAddrIdx].id).text().stripMarginWS();
    else
        addr = $(ent).find("#x-" + userTable[utAddrIdx].id).text().stripMarginWS();

    bhs.getEntry(addr, bhs.displaySingle, pnlTop);

    if (type != "BH") {
        $("#ck-single").prop("checked", true);
        $("#" + panels[pnlBottom].id).hide();
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

blackHoleSuns.prototype.displayTotals = function (entry, path) {
    let pnl = $("#totalsItems");
    let pstars = path.match(/stars/);
    let puser = path.match(/users/);
    let ptotal = path.match(/totals/);
    let pgalaxy = path.match(/galaxies/);

    let columnid = puser ? "id-all" : "id-player";
 
    let row1 = pstars && !ptotal ? rowGalaxy : pgalaxy ? rowGalaxy : rowTotal;
    let row2 = row1 == rowTotal ? rowPlatform : rowGalaxyPlatform;

    pnl.find("#" + totalsRows[row1].id + " #" + columnid).text(entry.totals.blackholes);
    pnl.find("#" + totalsRows[row2].id + " #" + columnid).text(entry.totals[bhs.user.platform].blackholes);
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
    h = /width/ [Symbol.replace](h, vertical ? 13 : 6);
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
            if (bhs.user.uid) {
                let name = $(this).text().stripMarginWS();
                let btn = menu.find("#btn-" + id);
                btn.text(name);

                if (changefcn)
                    changefcn();

                if ($(this).attr("style"))
                    btn.attr("style", $(this).attr("style"));
            }
        });
    }
}

blackHoleSuns.prototype.saveUser = function () {
    let user = bhs.extractUser();
    if (bhs.validateUser(user))
        bhs.updateUser(user, bhs.displayUser);
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