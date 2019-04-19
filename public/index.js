'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");
    bhs.buildMenu(loc, "Platform", platformList);
    bhs.buildMenu(loc, "Galaxy", galaxyList);

    bhs.buildPanel("Black Hole System");
    bhs.buildPanel("Exit System");

    bhs.buildUserTable();
    bhs.buildStatistics();

    bhs.getStatistics(bhs.displayStatistics);

    $("#save").click(function () {
        if (!bhs.user) {
            bhs.user = bhs.extractUser();
            bhs.updateUser(bhs.user);
        }

        bhs.entry = bhs.extractBH(bhs.user);
        bhs.updateEntry(bhs.entry);
        bhs.entry = bhs.extractExit(bhs.user);
        bhs.updateEntry(bhs.entry);
    });

    $("#clear").click(function () {
        bhs.clearPanel("pnl-Black-Hole-System");
        bhs.clearPanel("pnl-Exit-System");
    });
    /*
            $("#edit").click(function () {
                bhs.editEntry();
            });

            $("#savelist").click(function () {
                bhs.saveEdits();
            });

            $("#delete").click(function () {
                bhs.deleteEntry();
            });
    */

    $("#saveUser").click(function () {
        bhs.user = bhs.extractUser();
        bhs.updateUser(bhs.user);
    });

    $("#cancelUser").click(function () {
        bhs.doLoggedin();
    });
});

blackHoleSuns.prototype.buildPanel = function (name) {
    let panel = `
        <div id="pnl-name" class="card pad-bottom">
            <div class="h4 clr-dark-green">heading</div>
            <div class="row">
                <div class="col-lg-2 col-md-2 col-sm-2 col-5 h6 clr-dark-green">Address&nbsp;</div>
                <input id="inp-addr" class="rounded col-6" placeholder="0000:0000:0000:0000"></input>
            </div>
            <div class="row">
                <div class="col-lg-2 col-md-2 col-sm-2 col-5 h6 clr-dark-green">System Name&nbsp;</div>
                <input id="inp-sys" class="rounded col-6"></input>
            </div>
            <div class="row">
                <div class="col-lg-2 col-md-2 col-sm-2 col-5 h6 clr-dark-green">Region Name&nbsp;</div>
                <input id="inp-reg" class="rounded col-6"></input>
            </div>
            <div class="row">
                <!--label class="col-lg-4 col-md-4 col-sm-4 col-6 h6 clr-dark-green">Star Type&nbsp;
                    <input id="id-star" class="rounded col-3"></input>
                </label-->
                <div id="id-Lifeform" class="col-sm-5 col-12"></div>
                <div  id="id-Economy" class="col-sm-7 col-12"></div>
                <!---div  id="id-Type" class="col-sm-4 col-12"></div--->
                <!--div  id="id-Conflict" class="col-sm-4 col-12"></div-->
            </div>
            <br>`;

    let id = name.nameToId();
    let h = /name/g [Symbol.replace](panel, id);
    h = /heading/g [Symbol.replace](h, name);

    $("#panels").append(h);

    let loc = $("#pnl-" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);
    //    bhs.buildMenu(loc, "", typeList);
    //    bhs.buildMenu(loc, "Lifeform", conflictList);

    loc.find("#inp-addr").keyup(function () {
        formatAddress(this);
    });
    loc.find("#inp-addr").blur(function () {
        validateAddress(this);
    });
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list) {
    let title = `        
        <div class="row">
            <div class="col-5 h6 clr-dark-green">label</div>`;
    let block = `
            <div id="menu-idname" class="col-7 dropdown">
                <button id="btn-idname" class="btn border btn-sm btn-green dropdown-toggle" type="button" data-toggle="dropdown">
                    default
                </button>
            </div>
        </div>`;

    let item = ``;
    let hdr = ``;
    if (list.length > 8) {
        hdr = `<ul id="list" class="dropdown-menu scrollable-menu btn-green" role="menu"></ul>`;
        item = `<li id="item-idname" class="dropdown-item" type="button" style="cursor: pointer">iname</li>`;
    } else {
        hdr = `<div id="list" class="dropdown-menu btn-green"></div>`;
        item = `<button id="item-idname" class="dropdown-item border-bottom" type="button" style="cursor: pointer">iname</button>`;
    }

    let id = label.nameToId();
    let h = /label/g [Symbol.replace](title, label);
    h += /idname/g [Symbol.replace](block, id);
    h = /default/g [Symbol.replace](h, list[0].name);
    loc.find("#id-" + id).append(h);

    let menu = loc.find("#menu-" + id);
    menu.append(hdr);

    let mlist = menu.find("#list");

    for (let i = 0; i < list.length; ++i) {
        let lid = list[i].name.nameToId();
        h = /idname/g [Symbol.replace](item, lid);
        h = /iname/g [Symbol.replace](h, list[i].name);

        mlist.append(h);

        mlist.find("#item-" + lid).click(function () {
            let name = $(this).text();
            menu.find("#btn-" + id).text(name);
        });
    }
}

const tableLine = `
    <div class="col-sm-1 col-2 font-weight-bold">type</div>
    <div class="col-sm-3 col-6 text-uppercase">Address</div>
    <div class="col-sm-2 col-4">System</div>
    <div class="col-sm-2 col-4">Region</div>
    <div class="col-sm-2 col-4">Lifeform</div>
    <div class="col-sm-2 col-4">Economy</div>`;

blackHoleSuns.prototype.buildUserTable = function () {
    const table = `<div id="theader" class="row border-bottom"></div>`;

    let pos = $("#userItems");
    pos.empty();
    pos.append(table);

    pos = pos.find("#theader");

    let h = /type/ [Symbol.replace](tableLine, "");
    pos.append(h);
}

blackHoleSuns.prototype.displayUserEntry = function (entry, link) {
    const table = `<div id="addr" class="row border-bottom"></div>`;

    let addr = /:/g [Symbol.replace](link ? link : entry.addr, "");
    let h = /addr/ [Symbol.replace](table, addr);

    let pos = $("#userItems");
    pos.append(h);

    pos = pos.find("#" + addr);

    h = /type/ [Symbol.replace](tableLine, link ? "Exit" : "BH");
    h = /Address/ [Symbol.replace](h, entry.addr);
    h = /System/ [Symbol.replace](h, entry.sys);
    h = /Region/ [Symbol.replace](h, entry.reg);
    h = /Lifeform/ [Symbol.replace](h, entry.life);
    h = /Economy/ [Symbol.replace](h, entry.econ);

    pos.append(h);
}

blackHoleSuns.prototype.buildStatistics = function () {

}

blackHoleSuns.prototype.displayStatistics = function () {

}

blackHoleSuns.prototype.doLoggedout = function () {
    $("#loggedout").show();
    $("#map").hide();
    $("#userTable").hide();
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#inp-playerName").val(bhs.user.playerName);
    player.find("#btn-Platform").text(bhs.user.Platform);
    player.find("#btn-Galaxy").text(bhs.user.Galaxy);

    bhs.getUserEntries(bhs.displayUserEntry);

    $("#loggedout").hide();
    //$("#map").show();
    $("#userTable").show();
}

blackHoleSuns.prototype.clearPanel = function (pnl) {
    $("#" + pnl).each(function () {
        $(this).find("[id|='inp'").each(function () {
            $(this).val("");
        });
        $(this).find("[id|='menu']").each(function () {
            $(this).find("[id|='btn']").text($(this).find("#list :first").text())
        });
    });
}

blackHoleSuns.prototype.extractUser = function () {
    let entry = {};

    let loc = $("#id-user");
    entry.playerName = loc.find("#inp-playerName").val();
    entry.platform = loc.find("#btn-Platform").text();
    entry.galaxy = loc.find("#btn-Galaxy").text();

    entry.uid = bhs.uid;

    return entry;
}

blackHoleSuns.prototype.extractBH = function (player) {
    let entry = {};

    entry.platform = player.platform;
    entry.galaxy = player.galaxy;
    entry.uid = bhs.uid;

    let loc = $("#pnl-Black-Hole-System");
    entry.addr = loc.find("#inp-addr").val();
    entry.sys = loc.find("#inp-sys").val();
    entry.reg = loc.find("#inp-reg").val();
    entry.life = loc.find("#btn-Lifeform").text();
    entry.econ = loc.find("#btn-Economy").text();

    entry.blackhole = true;

    loc = $("#pnl-Exit-System");
    entry.connection = loc.find("#inp-addr").val();

    return entry;
}

blackHoleSuns.prototype.extractExit = function (player) {
    let entry = {};

    entry.platform = player.platform;
    entry.galaxy = player.galaxy;
    entry.uid = bhs.uid;

    let loc = $("#pnl-Exit-System");
    entry.addr = loc.find("#inp-addr").val();
    entry.sys = loc.find("#inp-sys").val();
    entry.reg = loc.find("#inp-reg").val();
    entry.life = loc.find("#btn-Lifeform").text();
    entry.econ = loc.find("#btn-Economy").text();

    return entry;
}