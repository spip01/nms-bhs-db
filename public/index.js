'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");

    bhs.buildGalaxyInfo();

    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    Object.keys(panels).forEach(i => {
        let x = panels[i];
        bhs.buildPanel(x.name, x.id);
    });

    bhs.activatePanelGroup(0);

    bhs.buildUserTable();
    bhs.buildStats();

    $('#pnl-user #ck-singleSystem').change(function () {
        if (this.checked)
            bhs.activatePanelGroup(1);
        else
            bhs.activatePanelGroup(0);
    });

    $("#save").click(function () {
        bhs.save();
    });

    $("#delete").click(function () {
        if (("#ck-singleSystem").checked) {
            bhs.deleteEntry($("#pnl-" + "Single System".nameToId()).addr, bhs.user);
        } else {
            bhs.deleteEntry($("#pnl-" + "Black Hole System".nameToId()).addr, bhs.user);
            bhs.deleteEntry($("#pnl-" + "Exit System".nameToId()).addr, bhs.user);
        }

        bhs.clearPanels();
    });

    $("#clear").click(function () {
        bhs.clearPanels();
    });

    $('.panel-collapse').on('show.bs.collapse', function () {
        $(this).siblings('.panel-heading').addClass('active');
        $("#arrow").removeClass("fa-angle-down");
        $("#arrow").addClass("fa-angle-up");
        let limit = $("#id-displalyqty").val()

        let platform = loc.find("#btn-Platform").text().stripMarginWS();
        let galaxy = loc.find("#btn-Galaxy").text().stripNumber();
    
        if ($("#userItems").children().length == 0 || bhs.user.platform != platform || bhs.user.galaxy != galaxy) {
            bhs.extractUser();
            $("#userItems").empty();
            bhs.getUserEntries(limit, bhs.displayUserEntries);
        }
    });

    $('.panel-collapse').on('hide.bs.collapse', function () {
        $(this).siblings('.panel-heading').removeClass('active');
        $("#arrow").removeClass("fa-angle-up");
        $("#arrow").addClass("fa-angle-down");
    });
})

const pnlBHIndex = 0;
const pnlExitIndex = 1;
const pnlSingleIndex = 2;

const panels = [{
    name: "Black Hole System",
    id: "pnl-BH",
    listid: "lst-BH",
    calc: true,
    group: 0
}, {
    name: "Exit System",
    id: "pnl-XS",
    listid: "lst-XS",
    calc: true,
    group: 0
}, {
    name: "Single System",
    id: "pnl-SS",
    listid: "lst-SS",
    calc: false,
    group: 1
}];

blackHoleSuns.prototype.activatePanelGroup = function (group) {
    Object.keys(panels).forEach(i => {
        let x = panels[i];
        if (x.group == group)
            $("#" + x.id).show();
        else
            $("#" + x.id).hide();
    });
}

blackHoleSuns.prototype.buildPanel = function (name, id) {
    const panel = `
        <div id="idname" class="card pad-bottom">
            <div class="h4 clr-dark-green card-header">heading</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-9 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Address</div>&nbsp;
                                        <input id="id-addr" class="rounded col-md-14 col-9" placeholder="0000:0000:0000:0000">
                                    </div>
                                </div>

                                <div class="col-md-4 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">System Name</div>&nbsp;
                                        <input id="id-sys" class="rounded col-md-14 col-9">
                                    </div>
                                </div>

                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Region Name</div>&nbsp;
                                        <input id="id-reg" class="rounded col-md-14 col-9">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-5 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div id="id-Lifeform" class="col-md-4 col-14"></div>
                                <div id="id-Economy" class="col-md-4 col-14"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row container">
                    <label class="col-3 h6 clr-dark-green">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>

                    <div class="col-10">
                        <div id="id-isbase" class="row" style="display:none">
                            <div class="col-4 h6 clr-dark-green">Name</div>&nbsp;
                            <input id="id-basename" class="rounded col-6">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-8 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right">Distance (ly): From Center&nbsp;</div>
                            <div id="fmcenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-tocenter" class="col-6 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    let h = /idname/g [Symbol.replace](panel, id);
    h = /heading/g [Symbol.replace](h, name);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    //loc.find("#id-addr").keydown(function (event) {
    //    return bhs.formatAddress(this, event);
    //});

    loc.find("#id-addr").blur(function () {
        let addr = bhs.reformatAddress(this);

        let pnl = $(this).closest("[id|='pnl'");
        if (pnl.find("#id-sys").val() != "" && pnl.find("#id-reg").val() != "")
            bhs.getEntry(addr, bhs.displaySingle, pnl);

        if (panels[bhs.getIndex(panels, "id", pnl.prop("id"))].calc)
            bhs.displayCalc();
    });

    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'");

        if (this.checked)
            pnl.find("#id-isbase").show();
        else
            pnl.find("#id-isbase").hide();
    });
}

blackHoleSuns.prototype.displayCalc = function () {
    let dist = {};

    Object.keys(panels).forEach(i => {
        let x = panels[i];
        if (x.calc) {
            let loc = $("#" + x.id);
            dist[x.id] = bhs.calcDist(loc.find("#id-addr").val());
            if (typeof dist[x.id] != "undefined") {
                loc.find("#fmcenter").text(dist[x.id]);
                loc.find("#id-fmcenter").show();
            } else
                loc.find("#id-fmcenter").hide();

            if (x.id == panels[pnlExitIndex].id &&
                typeof dist[panels[pnlBHIndex].id] != "undefined" &&
                typeof dist[panels[pnlExitIndex].id] != "undefined") {

                let t = dist[panels[pnlBHIndex].id] - dist[panels[pnlExitIndex].id];
                loc.find("#tocenter").text(t);
                loc.find("#id-tocenter").show();
            } else
                loc.find("#id-tocenter").hide();
        }
    });
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

const trStart = `   <tr id="idname">`;
const thLine = `        <th scope="col" id="idname">label</th>`;
const trEnd = `     </tr>`;

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

    l = /idname/ [Symbol.replace](thLine, "dist");
    h += /label/ [Symbol.replace](l, "LY to Center");

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
    loc.find("#id-addr").val(entry.addr);
    loc.find("#id-sys").val(entry[bhs.user.platform].sys);
    loc.find("#id-reg").val(entry.reg);
    loc.find("#btn-Lifeform").text(entry.life);

    let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].level;
    loc.find("#btn-Economy").text(l + " " + entry.econ);
    loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");

    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");
}

var last = false;

blackHoleSuns.prototype.displayUserEntries = function (entry) {
    let addr = entry.addr.stripColons();
    let disp = {};
    if (entry.blackhole || entry[bhs.user.platform].exit) {
        let con = entry[bhs.user.platform].connection.stripColons();
        if (entry.blackhole) {
            disp.bhaddr = addr;
            disp.xaddr = con;
            disp.idx = pnlBHIndex;
            disp.name = "BH";
        } else {
            disp.bhaddr = con;
            disp.xaddr = addr;
            disp.idx = pnlExitIndex;
            disp.name = "XS";
        }

        disp.bhid = panels[pnlBHIndex].listid + "-" + disp.bhaddr;
        disp.xid = panels[pnlExitIndex].listid + "-" + disp.xaddr;
    } else {
        disp.idx = pnlSingleIndex;
        disp.name = "SS";
    }

    disp.id = panels[disp.idx].listid + "-" + addr;

    let ui = $("#userItems");
    let pos = ui.find("#" + disp.id);

    if (pos.length == 0) {
        let h = "";

        if (disp.idx == pnlSingleIndex)
            h = /idname/ [Symbol.replace](trStart, disp.id) + trEnd;
        else {
            h = /idname/ [Symbol.replace](trStart, disp.bhid) + trEnd;
            h += /idname/ [Symbol.replace](trStart, disp.xid) + trEnd;
        }

        ui.prepend(h);

        if (last = !last) {
            if (disp.idx == pnlSingleIndex)
                ui.find("#" + disp.id).addClass("bkg-vlight-gray");
            else {
                ui.find("#" + disp.bhid).addClass("bkg-vlight-gray");
                ui.find("#" + disp.xid).addClass("bkg-vlight-gray");
            }
        }

        if (disp.idx != pnlSingleIndex) {
            ui.find("#" + disp.bhid).data("con", disp.xaddr);
            ui.find("#" + disp.xid).data("con", disp.bhaddr);
        }

        pos = ui.find("#" + disp.id);
    }

    let l = /idname/ [Symbol.replace](thLine, disp.name);
    let h = /label/ [Symbol.replace](l, disp.name);

    l = /idname/ [Symbol.replace](thLine, "addr");
    h += /label/ [Symbol.replace](l, entry.addr);

    l = /idname/ [Symbol.replace](thLine, "sys");
    h += /label/ [Symbol.replace](l, entry[bhs.user.platform].sys);

    l = /idname/ [Symbol.replace](thLine, "reg");
    h += /label/ [Symbol.replace](l, entry.reg);

    l = /idname/ [Symbol.replace](thLine, "life");
    h += /label/ [Symbol.replace](l, entry.life);

    l = /idname/ [Symbol.replace](thLine, "dist");
    if (disp.idx = pnlExitIndex) {
        let d = bhs.calcDist(disp.bhaddr) - bhs.calcDist(disp.xaddr);
        h += /label/ [Symbol.replace](l, d);
    } else
        h += /label/ [Symbol.replace](l, "");

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, entry.econ);

    l = /idname/ [Symbol.replace](thLine, "base");
    h += /label/ [Symbol.replace](l, typeof bhs.user.bases != "undefined" && bhs.user.bases.includes(entry.addr) ? "&#x2713;" : "");

    h = /col/g [Symbol.replace](h, "row");

    pos.empty();
    pos.append(h);

    pos.dblclick(function () {
        bhs.setEntries(this);
        bhs.displayCalc();

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
    $("#userItems").empty();
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#id-playerName").val(bhs.user.playerName);
    player.find("#btn-Platform").text(bhs.user.platform);

    let l = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number;
    player.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    let i = bhs.getIndex(galaxyList, "name", bhs.user.galaxy);
    player.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[galaxyList[i].number].color + ";");

    bhs.getStats(bhs.displayStats);

    //$("#map").show();
    $("#userTable").show();
}

blackHoleSuns.prototype.clearPanels = function () {
    Object.keys(panels).forEach(i => {
        let x = panels[i];
        bhs.clearPanel(x.id);
    });

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (id) {
    let pnl = $("#" + id);

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

    bhs.user.playerName = loc.find("#id-playerName").val();
    bhs.user.platform = loc.find("#btn-Platform").text().stripMarginWS();
    bhs.user.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
}

blackHoleSuns.prototype.extractEntry = function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    entry.addr = loc.find("#id-addr").val();

    if (typeof entry[bhs.user.platform] == "undefined")
        entry[bhs.user.platform] = {};
    entry[bhs.user.platform].sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
//    entry.hasBase = loc.find("#ck-hasbase").prop('checked');
//    if (entry.hasBase)
//        entry.basename = loc.find("#id-basename").val();

    entry.blackhole = idx == pnlBHIndex;
    entry[bhs.user.platform].exit = idx == pnlExitIndex;

    if (panels[idx].group == 0) {
        if (idx == pnlBHIndex)
            loc = pnl.find("#" + panels[pnlExitIndex].id);
        else
            loc = pnl.find("#" + panels[pnlBHIndex].id);

        entry[bhs.user.platform].connection = loc.find("#id-addr").val();
    }

    return entry;
}

blackHoleSuns.prototype.setEntries = function (sel) {
    let id = $(sel).prop("id").replace(/(.*?-.*?)-.*/, "$1");

    let x = bhs.getIndex(panels, "listid", id);
    let panel = panels[x];

    bhs.setEntry(sel, panel.id);

    if (panel.group == 0) {
        x = (x + 1) % 2;
        panel = panels[x];

        let id = panel.listid + "-" + $(sel).data("con");

        bhs.setEntry($("#" + id), panel.id);

        $("#ck-singleSystem").prop('checked', false);
    } else
        $("#ck-singleSystem").prop('checked', true);

    bhs.activatePanelGroup(panel.group);
}

blackHoleSuns.prototype.setEntry = function (sel, pnlid) {
    let loc = $(sel);
    let pnl = $("#" + pnlid);

    pnl.find("#id-addr").val(loc.find("#addr").text());
    pnl.find("#id-sys").val(loc.find("#sys").text());
    pnl.find("#id-reg").val(loc.find("#reg").text());
    pnl.find("#btn-Lifeform").text(loc.find("#life").text());

    let t = loc.find("#econ").text();
    if (t != "") {
        let l = economyList[bhs.getIndex(economyList, "name", t)].level;
        pnl.find("#btn-Economy").text(l + " " + t);
        pnl.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
    } else pnl.find("#btn-Economy").text(t);

    pnl.find("#id-isbase").prop('checked', loc.find("#base").text() != "");
}

blackHoleSuns.prototype.save = function () {
    let entry = [];

    $("#status").empty();

    bhs.extractUser();
    let ok = bhs.validateUser();

    let group = $("#ck-singleSystem").prop('checked') ? 1 : 0;

    Object.keys(panels).forEach(i => {
        let x = panels[i];

        if (ok && x.group == group) {
            entry[i] = bhs.extractEntry(i);
            ok = bhs.validateEntry(entry[i]);
        }
    });

    Object.keys(panels).forEach(i => {
        let x = panels[i];

        if (ok && x.group == group)
            bhs.updateEntry(entry[i], panels[i].id);
    });
}