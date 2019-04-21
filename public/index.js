'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");
    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    bhs.buildPanel("Black Hole System");
    bhs.buildPanel("Exit System");

    bhs.buildUserTable();
    bhs.buildStatistics();

    bhs.getStatistics(bhs.displayStatistics);

    $("#save").click(function () {
        bhs.save();
    });

    $("#clear").click(function () {
        let bhloc = $("#pnl-" + "Black Hole System".nameToId());
        let xitloc = $("#pnl-" + "Exit System".nameToId());

        bhs.clearPanel(bhloc);
        bhs.clearPanel(xitloc);
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
});


blackHoleSuns.prototype.buildPanel = function (name) {
    let panel = `
        <div id="pnl-name" class="card pad-bottom">
            <div class="h4 clr-dark-green">heading</div>
            <div class="row">
                <div class="col-sm-10 col-8">
                    <div class="card card-body no-border">
                        <div class="row">
                            <div class="col-sm-5 col-13">
                                <div class="row">
                                    <div class="col-sm-14 col-7 h6 clr-dark-green">Address</div>&nbsp;
                                    <input id="inp-addr" class="rounded col-sm-14 col-6" placeholder="0000:0000:0000:0000"></input>
                                </div>
                            </div>

                            <div class="col-sm-4 col-13">
                                <div class="row">
                                    <div class="col-sm-14 col-7 h6 clr-dark-green">System Name</div>&nbsp;
                                    <input id="inp-sys" class="rounded col-sm-14 col-6"></input>
                                </div>
                            </div>

                            <div class="col-sm-5 col-13">
                                <div class="row">
                                    <div class="col-sm-14 col-7 h6 clr-dark-green">Region Name</div>&nbsp;
                                    <input id="inp-reg" class="rounded col-sm-14 col-6"></input>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-sm-4 col-6">
                    <div class="card card-body no-border">
                        <div class="row">
                            <div id="id-Lifeform" class="col-sm-7 col-14"></div>
                            <div id="id-Economy" class="col-sm-7 col-14"></div>
                        </div>
                    </div>
                </div>
            </div>
            <br>
        </div>`;

    let id = name.nameToId();
    let h = /name/g [Symbol.replace](panel, id);
    h = /heading/g [Symbol.replace](h, name);

    $("#panels").append(h);

    let loc = $("#pnl-" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);
    //    bhs.buildMenu(loc, "", typeList);
    //    bhs.buildMenu(loc, "Lifeform", conflictList);

    loc.find("#inp-addr").keydown(function (event) {
        console.log(event);
        bhs.formatAddress(this, event);
    });

    loc.find("#inp-addr").blur(function () {
        bhs.reformatAddress(this);
    });
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, vertical) {
    let title = `        
        <div class="row">
            <div class="col-sm-14 col-width h6 clr-dark-green">label</div>`;
    let block = `
            <div id="menu-idname" class="col-sm-14 col-width dropdown">
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
    h = /width/g [Symbol.replace](h, vertical ? 13 : 7);
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
            let name = $(this).text().stripMarginWS();
            menu.find("#btn-" + id).text(name);
        });
    }
}

const tableLine = `
    <div class="col-sm-1 col-2 font-weight-bold">type</div>
    <div class="col-sm-3 col-4 text-uppercase">Address</div>
    <div class="col-sm-2 col-4">System</div>
    <div class="col-sm-2 col-4">Region</div>
    <div class="col-sm-1 col-6"></div>
    <div class="col-sm-2 col-4">Lifeform</div>
    <div class="col-sm-2 col-4">Economy</div>`;

blackHoleSuns.prototype.buildUserTable = function () {
    const table = `<div id="theader" class="row border-bottom"></div>`;

    let pos = $("#userHeader");
    pos.empty();
    pos.append(table);

    pos = pos.find("#theader");

    let h = /type/ [Symbol.replace](tableLine, "");
    pos.append(h);
}

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    const table = `
        <div id="BH-addr" class="row"></div>
        <div id="Exit-addr" class="row border-bottom"></div>`;

    let addr = "";
    let id = "";

    if (entry.blackhole) {
        addr = /:/g [Symbol.replace](entry.connection, "");
        id = "BH";
    } else {
        addr = /:/g [Symbol.replace](entry.addr, "");
        id = "Exit"
    }

    let h = /addr/g [Symbol.replace](table, addr);

    let ui = $("#userItems");
    let pos = ui.find("#" + id + "-" + addr);

    if (pos.length == 0) {
        ui.prepend(h);
        pos = ui.find("#" + id + "-" + addr);
    }

    h = /type/ [Symbol.replace](tableLine, id);
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
    $("#map").hide();
    $("#userTable").hide();
    $("#loggedout").show();
}

blackHoleSuns.prototype.doLoggedin = function () {
    let player = $("#pnl-user");

    player.find("#inp-playerName").val(bhs.user.playerName);
    player.find("#btn-Platform").text(bhs.user.platform);
    player.find("#btn-Galaxy").text(bhs.user.galaxy);

    bhs.getUserEntries(bhs.displayUserEntry);

    //$("#map").show();
    $("#userTable").show();
    $("#loggedout").hide();
}

blackHoleSuns.prototype.clearPanel = function (pnl) {
    pnl.each(function () {
        $(this).find("[id|='inp'").each(function () {
            $(this).val("");
        });
        $(this).find("[id|='menu']").each(function () {
            $(this).find("[id|='btn']").text($(this).find("#list :first").text().stripMarginWS())
        });
    });
}

blackHoleSuns.prototype.extractUser = function () {
    let entry = {};

    let loc = $("#pnl-user");
    entry.playerName = loc.find("#inp-playerName").val();
    entry.platform = loc.find("#btn-Platform").text().stripMarginWS();
    entry.galaxy = loc.find("#btn-Galaxy").text().stripMarginWS();

    entry.uid = bhs.uid;

    return entry;
}

blackHoleSuns.prototype.extractEntry = function (name) {
    let entry = {};

    let pnl = $("#panels");

    let loc = pnl.find("#pnl-" + name.nameToId());
    entry.addr = loc.find("#inp-addr").val();
    entry.sys = loc.find("#inp-sys").val();
    entry.reg = loc.find("#inp-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripMarginWS();
    entry.econ = loc.find("#btn-Economy").text().stripMarginWS();

    if (name == "Black Hole System") {
        entry.blackhole = true;

        loc = pnl.find("#pnl-Exit-System");
        entry.connection = loc.find("#inp-addr").val();
    }
    else 
        entry.blackhole = false;

    return entry;
}

blackHoleSuns.prototype.save = function () {
    let update = false;
    let bh = {};
    let exit = {};

    $("#status").empty();

    let user = bhs.extractUser();
    let ok = bhs.validateUser(user);

    if (ok) {
        bhs.user = user;
        bhs.updateUser(user);

        bh = bhs.extractEntry("Black Hole System");
        ok = bhs.validateEntry(bh);
    }

    if (ok) {
        exit = bhs.extractEntry("Exit System");
        ok = bhs.validateEntry(exit);
    }

    //if (ok) 
    //    ok = bhs.validateMap(bh);

    if (ok) {
        bhs.updateEntry(user, bh);
        bhs.updateEntry(user, exit);

        let bhloc = $("#pnl-" + "Black Hole System".nameToId());
        let xitloc = $("#pnl-" + "Exit System".nameToId());

        bhs.clearPanel(bhloc);
        bhs.clearPanel(xitloc);

        bhloc.find("#inp-addr").val(bhs.makeBHAddress(exit.addr));
        bhloc.find("#inp-reg").val(exit.reg);
    }
}