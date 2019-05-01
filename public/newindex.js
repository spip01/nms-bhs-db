'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");

    bhs.buildGalaxyInfo();

    bhs.buildPlayerPanel();

    for (let i = 0; i < mainPanels.length; ++i)
        bhs.buildGroup(i);

    bhs.activateGroup(0);

    bhs.buildUserTable();
    //bhs.buildMap();
    bhs.buildStats();

    $("#save").click(function () {
        let group = $("#id-iss").prop("checked") ? 1 : 0;
        bhs.saveGroup(group);
    });

    $("#delete").click(function () {
        let group = $("#id-iss").prop("checked") ? 1 : 0;
        bhs.deleteGroup(group);
        bhs.clearGroup(group);
    });

    $("#clear").click(function () {
        let group = $("#id-iss").prop("checked") ? 1 : 0;
        bhs.clearGroup(group);
    });
})

const userPanel = [
    [{
        name: "Player Name",
        field: "player",
        type: "input",
    }],
    [{
        name: "Platform",
        field: "platform",
        type: "vertmenu",
        list: platformList
    }, {
        name: "Galaxy",
        field: "galaxy",
        type: "vertmenu",
        list: galaxyList
    }],
    [{
        name: "Input Single System",
        id: "iss",
        type: "checkbox",
        fcn: bhs.activateGroup
    }]
];

blackHoleSuns.prototype.buildPlayerPanel = function () {
    const panel = `
    <div id="pnl-player">
        <div id="playerinsert" class="row">
        </div>
    </div>`;

    const rowSec = `   
    <div class="col-7">
        <div class="row">
        </div>
    </div>`;

    const inputSec = `
    <div class="col-14 h6 clr-dark-green">title</div>
    <input id="id-idname" class="rounded col-13 h5" type="text">&nbsp;`;

    const menuSec = `<div id="id-idname" class="col-7"></div>`

    const checkSec = `
    <label class="col-14">
        <input id="id-idname" type="checkbox">
        title
    </label>`;

}

const mainPanels = [{
    name: "Black Hole System",
    group: 0,
    id: "BHS"
}, {
    name: "Exit System",
    group: 0,
    id: "XS"
}, {
    name: "Single System",
    group: 1,
    id: "SS"
}];

blackHoleSuns.prototype.activateGroup = function (group) {
    for (let i = 0; i < mainPanels.length; ++i)
        if (mainPanels[i].group == group)
            $("#pnl-" + mainPanels[i].id).show();
        else
            $("#pnl-" + mainPanels[i].id).hide();
}

const inputs = [
    [{
        name: "Address",
        placehldr: "0000:0000:0000:0000",
        type: "input",
        field: "addr"
    }, {
        name: "System Name",
        type: "input",
        field: "platform",
        subfield: "sys"
    }, {
        name: "Region Name",
        type: "input",
        field: "reg"
    }],
    [{
        name: "Lifeform",
        type: "menu",
        list: lifeformList,
        field: "life",
    }, {
        name: "Economy",
        type: "menu",
        list: EconomyList,
        field: "econ",
    }],
    [{
        name: "Has Base",
        type: "checkbox",
        field: "hasbase"
    }, {
        name: "Name",
        type: "input",
        field: "basename"
    }],
    [{
        name: "Distance to center",
        type: "text",
        field: "distctr",
        panel: ["BHS"]
    }, {
        name: "Closer to center",
        type: "text",
        field: "closectr",
        panel: ["SS", "BHS"]
    }]
];

blackHoleSuns.prototype.buildPanel = function (name) {
    const panelHdr = `
        <div id="pnl-name" class="card pad-bottom">
            <div class="h4 clr-dark-green card-header">heading</div>
            <div class="card-body">
                <div id="sectioninsert" class="row">
                </div>
            </div>
        </div>`;

    const cardSec = `            
        <div class="col-md-9 col-14">
            <div class="card card-body no-border">
                <div id="cardinsert" class="row">
                </div>
            </div>
        </div>`;

    const inputInsert = `         
        <div class="col-md-5 col-13">
            <div class="row">
                <div class="col-md-14 col-4 h6 clr-dark-green">Address</div>&nbsp;
                <input id="id-name" class="rounded col-md-14 col-9" >
            </div>
        </div>`;

    const menuInsert = `<div id="id-idname" class="col-md-4 col-14"></div>`;

    const checkInsert = `
        <label class="col-3 h6 clr-dark-green">
            <input id="id-idname" type="checkbox">
            title
        </label>`;

    const textInsert = `
        <div class="col-7 h6 clr-dark-green">
            <div class="row">
                <div class="col-8">title</div>
                <div id="id-idname" class="col-6"></div>
            </div>
        </div>`;

    let id = name.nameToId();
    let h = /name/g [Symbol.replace](panel, id);
    h = /heading/g [Symbol.replace](h, name);

    $("#panels").append(h);

    let loc = $("#pnl-" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    //loc.find("#inp-addr").keydown(function (event) {
    //    return bhs.formatAddress(this, event);
    //});

    loc.find("#inp-addr").blur(function () {
        let addr = bhs.reformatAddress(this);

        let pnl = $(this).closest("[id|='pnl'");
        bhs.getEntry(addr, bhs.user, bhs.displaySingle, pnl);

        let which = pnl.prop("id").slice(4);

        pnl.find("#id-tocenter").hide();
        pnl.find("#id-towardsctr").hide();

        if (which == "Black Hole System".nameToId()) {
            let opnl = $("#pnl-" + "Exit System".nameToId());
            bhs.displalCalc(pnl, opnl);
        }
        if (which == "Exit System".nameToId()) {
            let opnl = $("#pnl-" + "Black Hole System".nameToId())
            bhs.displalCalc(opnl, pnl);
        }
    });

    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'");

        if (this.checked)
            pnl.find("#id-isbase").show();
        else
            pnl.find("#id-isbase").hide();
    });
}

blackHoleSuns.prototype.displalCalc = function (bhpnl, xpnl) {
    let bhaddr = bhpnl.find("#inp-addr").val();
    let xaddr = xpnl.find("#inp-addr").val();
    let bhdist = 0;
    let xdist = 0;

    if (bhaddr != "") {
        bhdist = bhs.calcDist(bhaddr);
        bhpnl.find("#tocenter").text(bhdist + " ly");
        bhpnl.find("#id-tocenter").show();
    } else
        bhpnl.find("#id-tocenter").hide();

    if (xaddr != "") {
        xdist = bhs.calcDist(xaddr);
        xpnl.find("#tocenter").text(xdist + " ly");
        xpnl.find("#id-tocenter").show();
    } else
        xpnl.find("#id-tocenter").hide();

    if (bhdist && xdist) {
        xpnl.find("#towardsctr").text((bhdist - xdist) + " ly");
        xpnl.find("#id-towardsctr").show();
    } else
        xpnl.find("#id-towardsctr").show();
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, vertical) {
    const title = `        
        <div class="row">
            <div class="col-md-14 col-width h6 clr-dark-green">label</div>
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

        if (typeof list[i].level != "undefined")
            h = /iname/ [Symbol.replace](h, list[i].level + " " + list[i].name);
        else
        if (typeof list[i].number != "undefined")
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name);
        else
            h = /iname/ [Symbol.replace](h, list[i].name);

        if (label != "Galaxy") {
            if (typeof list[i].level != "undefined")
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

const tableLayout = [{
    name: "",
    gen: "type"
}, {
    name: "Address",
    field: "addr"
}, {
    name: "System",
    field: "platform",
    subfield: "sys"
}, {
    name: "Region",
    type: "reg"
}, {
    name: "Lifeform",
    type: "life"
}, {
    name: "Economy",
    type: "econ"
}, {
    name: "Base",
    gen: "base"
}, {
    name: "Distance",
    gen: "dist"
}];

const table = `<tr id="id-idname"></tr>`;
const insHdr = `<th scope="col" id="id-idname">label</th>`;
const insLine = `<th scope="row" id="id-idname">label</th>`;

blackHoleSuns.prototype.buildUserTable = function () {
    let h = /idname/ [Symbol.replace](trStart, "header");

    let l = /idname/ [Symbol.replace](thLine, "type");
    h += /label/ [Symbol.replace](l, "");

    l = /idname/ [Symbol.replace](thLine, "addr");
    h += /label/ [Symbol.replace](l, "Address");

    l = /idname/ [Symbol.replace](thLine, "sys");
    h += /label/ [Symbol.replace](l, "System");

    l = /idname/ [Symbol.replace](thLine, "reg");
    h += /label/ [Symbol.replace](l, "Region");

    l = /idname/ [Symbol.replace](thLine, "life");
    h += /label/ [Symbol.replace](l, "Lifeform");

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, "Economy");

    l = /idname/ [Symbol.replace](thLine, "base");
    h += /label/ [Symbol.replace](l, "Base");

    h += trEnd;

    let pos = $("#userHeader");
    pos.empty();
    pos.append(h);
}

blackHoleSuns.prototype.displaySingle = function (loc, entry) {
    let bh = loc.prop("id") == "pnl-" + "Black Hole System".nameToId();
    let xit = loc.prop("id") == "pnl-" + "Exit System".nameToId();

    loc.find("#inp-addr").val(entry.addr);
    loc.find("#inp-sys").val(entry[bhs.user.platform].sys);
    loc.find("#inp-reg").val(entry.reg);
    loc.find("#btn-Lifeform").text(entry.life);

    let l = economyList[bhs.getIndex(economyList, entry.econ)].level;
    loc.find("#btn-Economy").text(l + " " + entry.econ);
    loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");

    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");

    //if (bh) {
    //    let pnl = $("#pnl-" + "Exit System".nameToId());
    //    bhs.getEntry(entry.connection, bhs.user, bhs.displaySingle, pnl);
    //}
}

blackHoleSuns.prototype.calcDist = function (addr, addr2) {
    let cord = bhs.addressToXYZ(addr);
    let cord2 = typeof addr2 != "undefined" ? bhs.addressToXYZ(addr2) : {
        x: 2047,
        y: 127,
        z: 2047
    };
    return parseInt(Math.sqrt(Math.pow(cord2.x - cord.x, 2) + Math.pow(cord2.y - cord.y, 2) + Math.pow(cord2.z - cord.z, 2)) * 400);
}

blackHoleSuns.prototype.addressToXYZ = function (addr) {
    let out = {};

    out.x = parseInt(addr.slice(0, 4), 16);
    out.y = parseInt(addr.slice(5, 9), 16);
    out.z = parseInt(addr.slice(10, 14), 16);
    out.s = parseInt(addr.slice(15), 16);

    return out;
}

var last = false;

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    let id = "";

    let addr = /:/g [Symbol.replace](entry.addr, "");
    let con = /:/g [Symbol.replace](entry[bhs.user.platform].connection, "");

    let bhaddr = "";
    let xaddr = "";

    if (entry.blackhole) {
        id = "BH";
        bhaddr = addr;
        xaddr = con;
    } else if (entry[bhs.user.platform].exit) {
        id = "Exit";
        bhaddr = con;
        xaddr = addr;
    } else
        id = "Single";

    let ui = $("#userItems");
    let pos = ui.find("#id-" + id + "-" + addr);

    if (pos.length == 0) {
        let h = "";
        if (id == "Single")
            h = /idname/ [Symbol.replace](trStart, "Single-" + addr) + trEnd;
        else {
            h = /idname/ [Symbol.replace](trStart, "BH-" + bhaddr) + trEnd;
            h += /idname/ [Symbol.replace](trStart, "Exit-" + xaddr) + trEnd;
        }
        ui.prepend(h);

        if (last = !last) {
            if (id == "Single")
                ui.find("#id-Single-" + addr).addClass("bkg-vlight-gray");
            else {
                ui.find("#id-BH-" + bhaddr).addClass("bkg-vlight-gray");
                ui.find("#id-Exit-" + xaddr).addClass("bkg-vlight-gray");

            }
        }

        if (id != "Single") {
            ui.find("#id-BH-" + bhaddr).data("con", xaddr);
            ui.find("#id-Exit-" + xaddr).data("con", bhaddr);
        }

        pos = ui.find("#id-" + id + "-" + addr);
    }

    let l = /idname/ [Symbol.replace](thLine, id);
    let h = /label/ [Symbol.replace](l, id);

    l = /idname/ [Symbol.replace](thLine, "addr");
    h += /label/ [Symbol.replace](l, entry.addr);

    l = /idname/ [Symbol.replace](thLine, "sys");
    h += /label/ [Symbol.replace](l, entry[bhs.user.platform].sys);

    l = /idname/ [Symbol.replace](thLine, "reg");
    h += /label/ [Symbol.replace](l, entry.reg);

    l = /idname/ [Symbol.replace](thLine, "life");
    h += /label/ [Symbol.replace](l, entry.life);

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, entry.econ);

    l = /idname/ [Symbol.replace](thLine, "base");
    h += /label/ [Symbol.replace](l, typeof bhs.user.bases != "undefined" && bhs.user.bases.includes(entry.addr) ? "&#x2713;" : "");

    h = /col/g [Symbol.replace](h, "row");

    pos.empty();
    pos.append(h);

    pos.dblclick(function () {
        bhs.setEntries(this);

        $('html, body').animate({
            scrollTop: ($('#panels').offset().top)
        }, 0);

        $("#delete").removeClass("disabled");
        $("#delete").removeAttr("disabled");
    });
}

blackHoleSuns.prototype.buildStats = function () {
    let h = trStart;
    h += /label/ [Symbol.replace](thLine, "Black Holes");
    h += /label/ [Symbol.replace](thLine, "User");
    h += /label/ [Symbol.replace](thLine, "All Users");
    h += /label/ [Symbol.replace](thLine, "Top Contributors");
    h += trEnd;

    let pos = $("#statsHeader");
    pos.empty();
    pos.append(h);
}

blackHoleSuns.prototype.displayStats = function () {
    let p = bhs.user.platform;
    let g = bhs.user.galaxy;

    if (typeof bhs.user.totals === 'undefined' || typeof bhs.user.totals[p] === 'undefined' || typeof bhs.user.totals[p][g] === 'undefined')
        return;

    let h = trStart;
    h += /label/ [Symbol.replace](thLine, "Total [" + p + "]");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[p].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p].totalBH);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Total [" + p + "][" + g + "]");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[p][g].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p][g].totalBH);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Grand Total");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals.totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals.totalBH);
    h += trEnd;

    h = /col/g [Symbol.replace](h, "row");

    let loc = $("#statsItems");
    loc.empty();
    loc.append(h);
}

blackHoleSuns.prototype.doLoggedout = function () {
    $("#map").hide();
    $("#userTable").hide();
    $("#loggedout").show();
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#inp-player").val(bhs.user.player);
    player.find("#btn-Platform").text(bhs.user.platform);

    let l = galaxyList[bhs.getIndex(galaxyList, bhs.user.galaxy)].number;
    player.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    player.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[1].color + ";");

    bhs.getUserEntries(bhs.displayUserEntry);
    bhs.getStats(bhs.displayStats);

    //$("#map").show();
    $("#userTable").show();
    $("#loggedout").hide();
}

blackHoleSuns.prototype.clearPanels = function () {
    bhs.clearPanel("Black Hole System");
    bhs.clearPanel("Exit System");
    bhs.clearPanel("Single System");

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (name) {
    let pnl = $("#pnl-" + name.nameToId());

    pnl.each(function () {
        $(this).find("[id|='inp'").each(function () {
            $(this).val("");
        });
        $(this).find("[id|='menu']").each(function () {
            $(this).find("[id|='btn']").text("");
        });
    });
}

blackHoleSuns.prototype.extractUser = function () {

    let loc = $("#pnl-user");
    bhs.user.player = loc.find("#inp-player").val();
    bhs.user.platform = loc.find("#btn-Platform").text().stripMarginWS();
    bhs.user.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
}

blackHoleSuns.prototype.extractEntry = function (name) {
    let entry = {};

    let pnl = $("#panels");

    let loc = pnl.find("#pnl-" + name.nameToId());
    entry.addr = loc.find("#inp-addr").val();
    if (typeof entry[bhs.user.platform] == "undefined")
        entry[bhs.user.platform] = {};
    entry[bhs.user.platform].sys = loc.find("#inp-sys").val();
    entry.reg = loc.find("#inp-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
    entry.hasBase = loc.find("#ck-hasbase").prop('checked');
    if (entry.hasBase)
        entry.baseName = loc.find("#inp-basename").val();

    if (name == "Black Hole System") {
        entry.blackhole = true;
        entry[bhs.user.platform].exit = false;

        loc = pnl.find("#pnl-" + "Exit System".nameToId());
        entry[bhs.user.platform].connection = loc.find("#inp-addr").val();
    } else {
        entry.blackhole = false;
        entry[bhs.user.platform].exit = true;

        loc = pnl.find("#pnl-" + "Black Hole System".nameToId());
        entry[bhs.user.platform].connection = loc.find("#inp-addr").val();
    }

    return entry;
}

blackHoleSuns.prototype.setEntries = function (sel) {
    let id = $(sel).prop("id");

    if (id.slice(3, 5) == "BH") {
        bhs.setEntry(sel, "Black Hole System");
        bhs.setEntry($("#userItems #id-Exit-" + $(sel).data("con")), "Exit System");
        $("#ck-singleSystem").prop('checked', false);

        $("pnl-" + "Single System".nameToId()).hide();
        $("pnl-" + "Black Hole System".nameToId()).show();
        $("pnl-" + "Exit System".nameToId()).show();
    } else if (id.slice(3, 7) == "Exit") {
        bhs.setEntry(sel, "Exit System");
        bhs.setEntry($("#userItems #id-BH-" + $(sel).data("con")), "Black Hole System");
        $("#ck-singleSystem").prop('checked', false);

        $("pnl-" + "Single System".nameToId()).hide();
        $("pnl-" + "Black Hole System".nameToId()).show();
        $("pnl-" + "Exit System".nameToId()).show();
    } else {
        bhs.setEntry(sel, "Single System");
        $("#ck-singleSystem").prop('checked', true);

        $("pnl-" + "Single System".nameToId()).show();
        $("pnl-" + "Black Hole System".nameToId()).hide();
        $("pnl-" + "Exit System".nameToId()).hide();
    }
}

blackHoleSuns.prototype.setEntry = function (sel, name) {
    let loc = $(sel);
    let pnl = $("#pnl-" + name.nameToId());

    pnl.find("#inp-addr").val(loc.find("#id-addr").text());
    pnl.find("#inp-sys").val(loc.find("#id-sys").text());
    pnl.find("#inp-reg").val(loc.find("#id-reg").text());
    pnl.find("#btn-Lifeform").text(loc.find("#id-life").text());

    let t = loc.find("#id-econ").text();
    let l = economyList[bhs.getIndex(economyList, t)].level;
    pnl.find("#btn-Economy").text(l + " " + t);
    pnl.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");

    pnl.find("#id-isbase").prop('checked', loc.find("#id-base").text() != "");
}

blackHoleSuns.prototype.save = function () {
    let bh = {};
    let exit = {};
    let single = {};

    $("#status").empty();

    bhs.extractUser();
    let ok = bhs.validateUser(bhs.user);

    let fSingle = $("#ck-singleSystem").prop('checked');

    if (fSingle) {
        single = bhs.extractEntry("Single System");
        ok = bhs.validateEntry(single);
    } else {
        if (ok) {
            bh = bhs.extractEntry("Black Hole System");
            ok = bhs.validateEntry(bh);
        }

        if (ok) {
            exit = bhs.extractEntry("Exit System");
            ok = bhs.validateEntry(exit);
        }

        //if (ok) 
        //    ok = bhs.validateMap(bh);
    }

    if (ok) {
        if (fSingle) {
            bhs.updateEntry(bhs.user, single, "Single System");
        } else {
            bhs.updateEntry(bhs.user, bh, "Black Hole System");
            bhs.updateEntry(bhs.user, exit, "Exit System");
        }
    }
}