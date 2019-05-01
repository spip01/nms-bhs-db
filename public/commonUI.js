'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    $("#map").hide();
    $("#userTable").hide();
    $("#userItems").empty();
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#id-player").val(bhs.user.player);
    player.find("#btn-Platform").text(bhs.user.platform);

    let l = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number;
    player.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    let i = bhs.getIndex(galaxyList, "name", bhs.user.galaxy);
    player.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[galaxyList[i].number].color + ";");

    bhs.getStats(bhs.displayStats);

    //$("#map").show();
    $("#userTable").show();

    $("#id-player").blur(function () {
        bhs.checkPlayerName(this, $(this).val());
    });
}

const trStart = `   <tr id="idname">`;
const thLine = `        <th scope="col" id="idname">label</th>`;
const trEnd = `     </tr>`;

blackHoleSuns.prototype.buildUserTable = function () {
    if (typeof bhs.last == "undefined")
        bhs.last = {};

    $('.panel-collapse').on('show.bs.collapse', function () {
        $(this).siblings('.panel-heading').addClass('active');
        $("#arrow").removeClass("fa-angle-down");
        $("#arrow").addClass("fa-angle-up");
        let limit = $("#id-displalyqty").val()

        bhs.extractUser();

        let allGalaxies = $("#ck-allGalaxies").prop("checked");
        let allPlatforms = $("#ck-allPlatforms").prop("checked");
        let allPlayers = $("#ck-allPlayers").prop("checked");

        bhs.displayHeader(allGalaxies, allPlatforms, allPlayers);
        bhs.getEntries(limit, bhs.displayUserEntry, allGalaxies, allPlatforms, allPlayers);
    });

    $('.panel-collapse').on('hide.bs.collapse', function () {
        $(this).siblings('.panel-heading').removeClass('active');
        $("#arrow").removeClass("fa-angle-up");
        $("#arrow").addClass("fa-angle-down");
    });
}

blackHoleSuns.prototype.displayHeader = function (galaxy, platform, player) {
    let l = "";
    let h = /idname/ [Symbol.replace](trStart, "header");

    if (player) {
        l = /idname/ [Symbol.replace](thLine, "player");
        h += /label/ [Symbol.replace](l, "Player");
    }

    if (galaxy) {
        l = /idname/ [Symbol.replace](thLine, "galaxy");
        h += /label/ [Symbol.replace](l, "Galaxy");
    }

    if (platform) {
        l = /idname/ [Symbol.replace](thLine, "platform");
        h += /label/ [Symbol.replace](l, "Platform");
    }

    l = /idname/ [Symbol.replace](thLine, "type");
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

    pos = $("#userItems");
    pos.empty();
}

var last = false;

blackHoleSuns.prototype.displayUserEntry = function (entry, galaxy, platform, player) {
    let id = "";

    let addr = /:/g [Symbol.replace](entry.addr, "");
    let con = /:/g [Symbol.replace](entry.connection, "");

    let bhaddr = "";
    let xaddr = "";

    if (entry.blackhole) {
        id = "BH-";
        bhaddr = addr;
        xaddr = con;
    } else if (entry.exit) {
        id = "Exit-";
        bhaddr = con;
        xaddr = addr;
    } else
        id = "Single-";

    let ui = $("#userItems");

    let s = galaxy ? entry.galaxy + "-" : "";
    s += platform ? entry.platform + "-" : "";

    let pos = ui.find("#" + id + s + addr);

    if (pos.length == 0) {
        let sLabel = "";
        let bhLabel = "";
        let xLabel = "";
        let h = "";

        if (id == "Single-") {
            sLabel = "Single-" + s + addr;
            h = /idname/ [Symbol.replace](trStart, sLabel) + trEnd;
        } else {
            if (id == "BH-") {
                bhLabel = "BH-" + s + addr;
                xLabel = "Exit-" + s + con;
            } else {
                bhLabel = "BH-" + s + con;
                xLabel = "Exit-" + s + addr;
            }
            h = /idname/ [Symbol.replace](trStart, bhLabel) + trEnd;
            h += /idname/ [Symbol.replace](trStart, xLabel) + trEnd;
        }

        ui.prepend(h);

        if (last = !last) {
            if (id == "Single-")
                ui.find("#" + sLabel).addClass("bkg-vlight-gray");
            else {
                ui.find("#" + bhLabel).addClass("bkg-vlight-gray");
                ui.find("#" + xLabel).addClass("bkg-vlight-gray");
            }
        }

        if (id != "Single-") {
            ui.find("#" + bhLabel).data("con", xLabel);
            ui.find("#" + xLabel).data("con", bhLabel);
        }

        pos = ui.find("#" + id + s + addr);
    }

    let l = "";
    let h = "";

    if (player) {
        l = /idname/ [Symbol.replace](thLine, "player");
        h += /label/ [Symbol.replace](l, entry.player);
    }

    if (galaxy) {
        l = /idname/ [Symbol.replace](thLine, "galaxy");
        h += /label/ [Symbol.replace](l, entry.galaxy);
    }

    if (platform) {
        l = /idname/ [Symbol.replace](thLine, "platform");
        h += /label/ [Symbol.replace](l, entry.platform);
    }

    l = /idname/ [Symbol.replace](thLine, "type");
    h += /label/ [Symbol.replace](l, id);

    l = /idname/ [Symbol.replace](thLine, "addr");
    h += /label/ [Symbol.replace](l, entry.addr);

    l = /idname/ [Symbol.replace](thLine, "sys");
    h += /label/ [Symbol.replace](l, entry.sys);

    l = /idname/ [Symbol.replace](thLine, "reg");
    h += /label/ [Symbol.replace](l, entry.reg);

    l = /idname/ [Symbol.replace](thLine, "life");
    h += /label/ [Symbol.replace](l, entry.life);

    l = /idname/ [Symbol.replace](thLine, "dist");
    if (id == "Exit-")
        h += /label/ [Symbol.replace](l, bhs.calcDist(bhaddr) - bhs.calcDist(xaddr));
    else
        h += /label/ [Symbol.replace](l, "");

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, entry.econ);

    l = /idname/ [Symbol.replace](thLine, "base");
    h += /label/ [Symbol.replace](l, typeof bhs.user.bases != "undefined" && bhs.user.bases.includes(entry.addr) ? "&#x2713;" : "");

    h = /col/g [Symbol.replace](h, "row");

    pos.empty();
    pos.append(h);

    pos.dblclick(function () {
        bhs.setEntries($(this));
        bhs.displayCalc();

        $('html, body').animate({
            scrollTop: ($('#panels').offset().top)
        }, 0);

        $("#delete").removeClass("disabled");
        $("#delete").removeAttr("disabled");
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

blackHoleSuns.prototype.displayCalc = function () {
    let dist = {};

    Object.keys(panels).forEach(i => {
        let x = panels[i];
        if (x.calc) {
            let loc = $("#" + x.id);
            dist[x.id] = bhs.calcDist(loc.find("#id-addr").val());
            if (dist[x.id]) {
                loc.find("#fmcenter").text(dist[x.id]);
                loc.find("#id-fmcenter").show();
            } else
                loc.find("#id-fmcenter").hide();

            if (x.id == panels[pnlExitIndex].id &&
                dist[panels[pnlBHIndex].id] &&
                dist[panels[pnlExitIndex].id]) {

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

    if (bhs.user.player != u.player || bhs.user.platform != u.platform || bhs.user.galaxy != u.galaxy)
        return u;

    return null;
}