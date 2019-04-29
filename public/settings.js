'use strict';

$(document).ready(function () {
    startUp();

    //bhs.getData("Euclid", "PC-XBox");

    //bhs.generatePlayerList();

    //bhs.buildMenu(loc, "Players", bhs.playerList, true);
    //bhs.buildMenu(loc, "Platform", platformList, true);
    //bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    bhs.settings = {};

    $("#uploadedFile").change(function () {
        bhs.readTextFile(this);
    });

    $('.panel-collapse').on('show.bs.collapse', function () {
        $(this).siblings('.panel-heading').addClass('active');

        let user = {};
        user.uid = $("#btn-Players").data("uid");
        user.platform = $("#btn-Platform").text();
        user.galaxy = $("#btn-Galaxy").text();

        if ($("#userItems").children().length == 0 || bhs.settings.user != user) {
            $("#userItems").empty();

            bhs.setting.user = user;

            bhs.getUserEntries(user.uid, user.platform, user.galaxy, 100, bhs.displayUserEntry);
        }
    });

    $('.panel-collapse').on('hide.bs.collapse', function () {
        $(this).siblings('.panel-heading').removeClass('active');
    });
});

var importTable = [{
        match: /platform/i,
        field: "platform",
        required: true,
        group: 0
    },
    {
        match: /galaxy/i,
        field: "galaxy",
        required: true,
        group: 0
    },
    {
        match: /(traveler)|(player)/i,
        field: "player",
        group: 0
    },
    // 1st match
    {
        match: /coord/i,
        field: "addr",
        required: true,
        format: reformatAddress,
        validate: validateBHAddress,
        group: 1
    },
    {
        match: /economy/i,
        field: "econ",
        group: 1
    },
    {
        match: /region/i,
        field: "reg",
        required: true,
        group: 1
    },
    {
        match: /system/i,
        field: "sys",
        required: true,
        group: 1
    },
    {
        match: /sun/i,
        field: "sun",
        group: 1
    },
    {
        match: /lifeform/i,
        field: "life",
        group: 1
    },
    {
        match: /conflict/i,
        field: "conflict",
        group: 1
    },
    // 2nd math
    {
        match: /coord/i,
        field: "addr",
        required: true,
        format: reformatAddress,
        validate: validateAddress,
        group: 2
    },
    {
        match: /economy/i,
        field: "econ",
        group: 2
    },
    {
        match: /region/i,
        field: "reg",
        checkreq: checkZeroAddress,
        checkval: 10,
        checkgrp: 2,
        group: 2
    },
    {
        match: /system/i,
        field: "sys",
        checkreq: checkZeroAddress,
        checkval: 10,
        checkgrp: 2,
        group: 2
    },
    {
        match: /sun/i,
        field: "sun",
        group: 2
    },
    {
        match: /lifeform/i,
        field: "life",
        group: 2
    },
    {
        match: /conflict/i,
        field: "conflict",
        group: 2
    }
];

blackHoleSuns.prototype.readTextFile = function (f) {
    let file = f.files[0];
    let reader = new FileReader();

    reader.onload = async function () {
        let allrows = reader.result.split(/\r?\n|\r/);
        let hdr = allrows[1].split(/[,\t]/);

        for (let i = 0; i < importTable.length; ++i) {
            for (let j = 0; j < hdr.length; ++j) {
                if (hdr[j].search(importTable[i].match) != -1) {
                    importTable[i].index = j;
                    hdr[j] = "";
                    break;
                }
            }

            if (importTable[i].required && typeof importTable[i].index == "undefined") {
                console.log("missing " + importTable[i].match + " " + allrows[1]);
                return;
            }
        }

        var entry = [];

        for (let i = 2, ok = true; i < allrows.length && ok; ++i, ok = true) {
            entry[0] = {};
            entry[1] = {};
            entry[2] = {};

            let row = allrows[i].split(/[,\t]/);

            if (row[importTable[0].index] == "")
                ok = false;

            for (let j = 0; j < importTable.length && ok; ++j) {
                let idx = importTable[j].index;
                if (idx != -1) {
                    if (typeof row[idx] == "undefined" || row[idx] == "") {
                        let grp = importTable[j].checkgrp;
                        let val = importTable[j].checkval;
                        if (importTable[j].required || typeof importTable[j].checkreq != "undefined" &&
                            importTable[j].checkreq(entry[importTable[grp].group][importTable[val].field])) {
                            $("#status").prepend("<h7>row: " + (i + 1) + " missing " + importTable[j].match + "</h7>");
                            ok = false;
                        }
                    } else {
                        row[idx] = row[idx].stripNumber();

                        if (typeof importTable[j].format != "undefined")
                            row[idx] = importTable[j].format(row[idx]);

                        if (typeof importTable[j].validate != "undefined")
                            ok = importTable[j].validate(row[idx]);

                        entry[importTable[j].group][importTable[j].field] = row[idx];

                        if (!ok)
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid value " + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field] + "</h7>");
                    }
                }
            }

            if (ok) {
                entry[0].platform = entry[0].platform.match(/pc/i) ||
                    entry[0].platform.match(/xbox/i) ? "PC-XBox" : entry[0].platform;

                //entry[1].uid = "xEKdsoLrGubLmPkb6WxcxsmtQaE3";
                //entry[2].uid = "xEKdsoLrGubLmPkb6WxcxsmtQaE3";
                //entry[1].player = "zeenewbian";
                //entry[2].player = "zeenewbian";

                entry[1].player = entry[0].player;
                entry[1].blackhole = true;
                entry[1].connection = entry[2].addr;
                entry[2].player = entry[0].player;
                entry[2].exit = true;
                entry[2].connection = entry[1].addr;

                let ref = bhs.fbfs.collection("stars");

                await ref.doc(entry[0].galaxy).get().then(function (doc) {
                    if (!doc.exists)
                        ref.doc(entry[0].galaxy).set({
                            name: entry[0].galaxy
                        }).then(function () {});
                });

                ref = ref.doc(entry[0].galaxy).collection(entry[0].platform);

                await ref.doc(entry[1].addr).get().then(function (doc) {
                    if (!doc.exists) {
                        ref.doc(entry[1].addr).set(entry[1]).then(function () {
                            //$("#status").prepend("<h7>save: " + entry[1].addr + " </h7>");
                        });
                    } //else
                    //$("#status").prepend("<h7>dup: " + entry[1].addr + " </h7>");
                });

                if (entry[1].connection != "0000:0000:0000:0000")
                    await ref.doc(entry[2].addr).get().then(function (doc) {
                        if (!doc.exists) {
                            ref.doc(entry[2].addr).set(entry[2]).then(function () {
                                //$("#status").prepend("<h7>save: " + entry[2].addr + " </h7>");
                            });
                        } // else
                        //$("#status").prepend("<h7>dup: " + entry[2].addr + " </h7>");
                    });
            }
        }
    }

    reader.readAsText(file);
}

const trStart = `   <tr id="id-idname">`;
const thLine = `        <th scope="col" id="id-idname">label</th>`;
const trEnd = `     </tr>`;

blackHoleSuns.prototype.buildUserTable = function () {
    let h = /idname/ [Symbol.replace](trStart, "header");

    let l = /idname/ [Symbol.replace](thLine, "user");
    h += /label/ [Symbol.replace](l, "User");

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

    l = /idname/ [Symbol.replace](thLine, "user");
    h += /label/ [Symbol.replace](l, entry[bhs.galaxy].playerName);

    l = /idname/ [Symbol.replace](thLine, "type");
    h += /label/ [Symbol.replace](l, id);

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