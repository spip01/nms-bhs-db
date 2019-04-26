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
        if ($("#userItems").children().length == 0)
            bhs.getUserEntries(bhs.user.uid, bhs.user.platform, bhs.user.galaxy, 20, bhs.displayUserEntry);
    });

    $('.panel-collapse').on('hide.bs.collapse', function () {
        $(this).siblings('.panel-heading').removeClass('active');
        $("#arrow").removeClass("fa-angle-up");
        $("#arrow").addClass("fa-angle-down");
    });
})

const panels = [{
    name: "Black Hole System",
    id: "pnl-BHS",
    calc: true,
    group: 0
}, {
    name: "Exit System",
    id: "pnl-XS",
    calc: true,
    group: 0
}, {
    name: "Single System",
    id: "pnl-SS",
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
                                        <input id="inp-addr" class="rounded col-md-14 col-9" placeholder="0000:0000:0000:0000">
                                    </div>
                                </div>

                                <div class="col-md-4 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">System Name</div>&nbsp;
                                        <input id="inp-sys" class="rounded col-md-14 col-9">
                                    </div>
                                </div>

                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Region Name</div>&nbsp;
                                        <input id="inp-reg" class="rounded col-md-14 col-9">
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
                            <div class="col-2 h6 clr-dark-green">Name</div>&nbsp;
                            <input id="inp-basename" class="rounded col-6">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-7 h6 clr-dark-green" style="display:none">
                        Distance: From Center&nbsp;
                        <div id="fmcenter"></div>&nbsp;ly
                    </div>
                        
                    <div id="id-tocenter" class="col-7 h6 clr-dark-green" style="display:none">
                        Towards Center&nbsp;
                        <div id="tocenter"></div>&nbsp;ly
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

    //loc.find("#inp-addr").keydown(function (event) {
    //    return bhs.formatAddress(this, event);
    //});

    loc.find("#inp-addr").blur(function () {
        let addr = bhs.reformatAddress(this);

        let pnl = $(this).closest("[id|='pnl'");
        if (pnl.find("#id-sys").val() != "" && pnl.find("#id-reg").val() != "")
            bhs.getEntry(addr, bhs.displaySingle, pnl);

        if (panels[bhs.getIdIndex(panels, pnl.prop("id"))].calc)
            bhs.displalyCalc();
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
            let loc = $("#" + x.id + "\"");
            dist[x.id] = bhs.calcDist($("#" + x.id + " #id-addr").val());
            if (typeof dist[x.id] != "undefined") {
                loc.find("#fmcenter").text(dist[x.id]);
                loc.find("#id-fmcenter").show();
            } else
                loc.find("#id-fmcenter").hide();

            if (x.id == "pnl-XS" &&
                typeof dist["pnl-XS"] != "undefined" &&
                typeof dist["pnl-BHS"] != "undefined") {

                let t = dist["pnl-BHS"] - dist["pnl-XS"];
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

const trStart = `   <tr id="id-idname">`;
const thLine = `        <th scope="col" id="id-idname">label</th>`;
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
    let bh = loc.prop("id") == "pnl-" + "Black Hole System".nameToId();
    let xit = loc.prop("id") == "pnl-" + "Exit System".nameToId();

    loc.find("#inp-addr").val(entry.addr);
    loc.find("#inp-sys").val(entry[bhs.user.platform].sys);
    loc.find("#inp-reg").val(entry.reg);
    loc.find("#btn-Lifeform").text(entry.life);

    let l = economyList[bhs.getNameIndex(economyList, entry.econ)].level;
    loc.find("#btn-Economy").text(l + " " + entry.econ);
    loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");

    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");

    //if (bh) {
    //    let pnl = $("#pnl-" + "Exit System".nameToId());
    //    bhs.getEntry(entry.connection, bhs.user, bhs.displaySingle, pnl);
    //}
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

    l = /idname/ [Symbol.replace](thLine, "dist");
    if (id == "Exit") {
        let d = bhs.calcDist(bhaddr) - bhs.calcDist(xaddr);
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
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#inp-playerName").val(bhs.user.playerName);
    player.find("#btn-Platform").text(bhs.user.platform);

    let l = galaxyList[bhs.getNameIndex(galaxyList, bhs.user.galaxy)].number;
    player.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    let i = bhs.getNameIndex(galaxyList, bhs.user.galaxy);
    player.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[galaxyList[i].number].color + ";");

    bhs.getStats(bhs.displayStats);

    //$("#map").show();
    $("#userTable").show();
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
    bhs.user.playerName = loc.find("#inp-playerName").val();
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
    let l = economyList[bhs.getNameIndex(economyList, t)].level;
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
    let ok = bhs.validateUser();

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
            bhs.updateEntry(single, "Single System");
        } else {
            bhs.updateEntry(bh, "Black Hole System");
            bhs.updateEntry(exit, "Exit System");
        }
    }
}