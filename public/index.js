'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");
    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    bhs.buildPanel("Black Hole System");
    bhs.buildPanel("Exit System");
    bhs.buildPanel("Base System");
    $("#pnl-" + "Base System".nameToId()).hide();

    bhs.buildUserTable();
    bhs.buildStats();

    $('#pnl-user :checkbox').change(function () {
        if (this.checked) {
            $("#delete").show();
            $("#basedelete").show();

            $("#pnl-" + "Black Hole System".nameToId()).hide();
            $("#pnl-" + "Exit System".nameToId()).hide();
            $("#pnl-" + "Base System".nameToId()).show();
        } else {
            $("#delete").hide();
            $("#basedelete").hide();

            $("#pnl-" + "Black Hole System".nameToId()).show();
            $("#pnl-" + "Exit System".nameToId()).show();
            $("#pnl-" + "Base System".nameToId()).hide();
        }
    });

    $("#save").click(function () {
        bhs.save($(this).text() == "Save");
        $("#save").text("Save");
        $("#delete").hide();

        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").removeClass("disabled");
        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").removeAttr("disabled");
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").removeClass("disabled");
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").removeAttr("disabled");
    });

    $("#clear").click(function () {
        bhs.clearPanel("Black Hole System");
        bhs.clearPanel("Exit System");
        bhs.clearPanel("Base System");

        $("#save").text("Save");
        $("#delete").hide();

        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").removeClass("disabled");
        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").removeAttr("disabled");
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").removeClass("disabled");
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").removeAttr("disabled");
    });
})

blackHoleSuns.prototype.buildPanel = function (name) {
    let panel = `
        <div id="pnl-name" class="card pad-bottom">
            <div class="h4 clr-dark-green">heading</div>
            <div class="row">
                <div class="col-md-9 col-14">
                    <div class="card card-body no-border">
                        <div class="row">
                            <div class="col-md-5 col-13">
                                <div class="row">
                                    <div class="col-md-14 col-7 h6 clr-dark-green">Address</div>&nbsp;
                                    <input id="inp-addr" class="rounded col-md-14 col-6" placeholder="0000:0000:0000:0000"></input>
                                </div>
                            </div>

                            <div class="col-md-4 col-13">
                                <div class="row">
                                    <div class="col-md-14 col-7 h6 clr-dark-green">System Name</div>&nbsp;
                                    <input id="inp-sys" class="rounded col-md-14 col-6"></input>
                                </div>
                            </div>

                            <div class="col-md-5 col-13">
                                <div class="row">
                                    <div class="col-md-14 col-7 h6 clr-dark-green">Region Name</div>&nbsp;
                                    <input id="inp-reg" class="rounded col-md-14 col-6"></input>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-5 col-14">
                    <div class="card card-body no-border">
                        <div class="row">
                            <div id="id-Lifeform" class="col-md-7 col-14"></div>
                            <div id="id-Economy" class="col-md-7 col-14"></div>
                        </div>
                    </div>
                </div>
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
    });
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, vertical) {
    let title = `        
        <div class="row">
            <div class="col-md-14 col-width h6 clr-dark-green">label</div>`;
    let block = `
            <div id="menu-idname" class="col-md-14 col-width dropdown">
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

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, "Economy");

    h += trEnd;

    let pos = $("#userHeader");
    pos.empty();
    pos.append(h);
}

blackHoleSuns.prototype.displaySingle = function (loc, entry) {
    let bh = loc.prop("id") == "pnl-"+"Black Hole System".nameToId();
    if (bh && entry.addr.slice(15) != "0079")
        return;

    loc.find("#inp-addr").val(entry.addr);
    loc.find("#inp-sys").val(entry.sys);
    loc.find("#inp-reg").val(entry.reg);
    loc.find("#btn-Lifeform").text(entry.life);
    loc.find("#btn-Economy").text(entry.econ);

    $("#save").text("Update");

    if (bh) {
        let pnl = $("#pnl-"+"Exit System".nameToId());
        bhs.getEntry(entry.connection, bhs.user, bhs.displaySingle, pnl);
    }
}

var last = false;

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    let addr = "";
    let id = "";

    if (entry.blackhole) {
        addr = /:/g [Symbol.replace](entry.connection, "");
        id = "BH";
    } else {
        addr = /:/g [Symbol.replace](entry.addr, "");
        id = "Exit"
    }

    let ui = $("#userItems");
    let pos = ui.find("#id-" + id + "-" + addr);

    if (pos.length == 0) {
        let h = /idname/ [Symbol.replace](trStart, "BH-" + addr) + trEnd;
        h += /idname/ [Symbol.replace](trStart, "Exit-" + addr) + trEnd;
        ui.prepend(h);

        if(last = !last) {
            ui.find("#id-BH-" + addr).addClass("bkg-vlight-gray");
            ui.find("#id-Exit-" + addr).addClass("bkg-vlight-gray");
        }

        pos = ui.find("#id-" + id + "-" + addr);
    }

    let l = /idname/ [Symbol.replace](thLine, id);
    let h = /label/ [Symbol.replace](l, id);

    l = /idname/ [Symbol.replace](thLine, "addr");
    h += /label/ [Symbol.replace](l, entry.addr);

    l = /idname/ [Symbol.replace](thLine, "sys");
    h += /label/ [Symbol.replace](l, entry.sys);

    l = /idname/ [Symbol.replace](thLine, "reg");
    h += /label/ [Symbol.replace](l, entry.reg);

    l = /idname/ [Symbol.replace](thLine, "life");
    h += /label/ [Symbol.replace](l, entry.life);

    l = /idname/ [Symbol.replace](thLine, "econ");
    h += /label/ [Symbol.replace](l, entry.econ);

    h = /col/g [Symbol.replace](h, "row");

    pos.append(h);

    pos.dblclick(function () {
        bhs.setEntries(this);

        $("#save").text("Update");
        $("#delete").show();

        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").addClass("disabled");
        $("#pnl-" + "Black Hole System".nameToId() + " #inp-addr").prop("disabled", true);
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").addClass("disabled");
        $("#pnl-" + "Exit System".nameToId() + " #inp-addr").prop("disabled", true);
    });
}

blackHoleSuns.prototype.buildStats = function () {
    let h = trStart;
    h += /label/ [Symbol.replace](thLine, "");
    h += /label/ [Symbol.replace](thLine, "User BH");
    h += /label/ [Symbol.replace](thLine, "User Stars");
    h += /label/ [Symbol.replace](thLine, "All Users BH");
    h += /label/ [Symbol.replace](thLine, "All Users Stars");
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
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[p].totalStars);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p].totalStars);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Total [" + p + "][" + g + "]");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[p][g].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.user.totals[p][g].totalStars);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p][g].totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals[p][g].totalStars);
    h += trEnd;

    h += trStart;
    h += /label/ [Symbol.replace](thLine, "Grand Total");
    h += /label/ [Symbol.replace](thLine, bhs.user.totals.totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.user.totals.totalStars);
    h += /label/ [Symbol.replace](thLine, bhs.totals.totalBH);
    h += /label/ [Symbol.replace](thLine, bhs.totals.totalStars);
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

    player.find("#inp-playerName").val(bhs.user.playerName);
    player.find("#btn-Platform").text(bhs.user.platform);
    player.find("#btn-Galaxy").text(bhs.user.galaxy);

    bhs.getUserEntries(bhs.displayUserEntry);
    bhs.getStats(bhs.displayStats);

    //$("#map").show();
    $("#userTable").show();
    $("#loggedout").hide();
}

blackHoleSuns.prototype.clearPanel = function (name) {
    let pnl = $("pnl-" + name.nameToId());

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
    } else
        entry.blackhole = false;

    return entry;
}

blackHoleSuns.prototype.setEntries = function (sel) {
    let id = $(sel).prop("id");

    if (id.slice(3, 5) == "BH") {
        bhs.setEntry(sel, "Black Hole System");
        bhs.setEntry($("#userItems #id-Exit-" + id.slice(6)), "Exit System");
    } else {
        bhs.setEntry(sel, "Exit System");
        bhs.setEntry($("#userItems #id-BH-" + id.slice(8)), "Black Hole System");

    }
}

blackHoleSuns.prototype.setEntry = function (sel, name) {
    let loc = $(sel);
    let pnl = $("#pnl-" + name.nameToId());

    pnl.find("#inp-addr").val(loc.find("#id-addr").text());
    pnl.find("#inp-sys").val(loc.find("#id-sys").text());
    pnl.find("#inp-reg").val(loc.find("#id-reg").text());
    pnl.find("#btn-Lifeform").text(loc.find("#id-life").text());
    pnl.find("#btn-Economy").text(loc.find("#id-econ").text());
}

blackHoleSuns.prototype.save = function (save) {
    let update = false;
    let bh = {};
    let base = {};
    let exit = {};

    $("#status").empty();

    let user = bhs.extractUser();
    let ok = bhs.validateUser(user);
    bhs.user = user;

    let fbase = $("#id-createBase").attr('checked');

    if (fbase) {
        base = bhs.extractEntry("Black Hole System");
        ok = bhs.validateEntry(base);
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
        if (fbase) {
            bhs.updateBase(user, base);
            bhs.clearPanel("Base System");
        } else {
            bhs.updateEntry(user, bh, save);
            bhs.updateEntry(user, exit, save);

            bhs.clearPanel("Black Hole System");
            bhs.clearPanel("Exit System");

            let bhloc = $("#pnl-" + "Black Hole System".nameToId());

            bhloc.find("#inp-addr").val(bhs.makeBHAddress(exit.addr));
            bhloc.find("#inp-reg").val(exit.reg);
        }
    }
}