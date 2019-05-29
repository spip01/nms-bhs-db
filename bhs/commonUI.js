'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser(bhs.user);

    $("#status").empty();
    $("#filestatus").empty();
    $("#entryTable").empty();
    $("#totals").empty();
    bhs.buildMap();

    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
}

blackHoleSuns.prototype.doLoggedin = function () {
    bhs.getUser(bhs.displayUser);

    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
}

blackHoleSuns.prototype.displayUser = function (user) {
    bhs.user = mergeObjects(bhs.user, user);

    if (bhs.user.uid) {
        bhs.buildUserTable(bhs.user);
        bhs.buildTotals();
        bhs.buildMap();

        bhs.displaySettings(bhs.user);

        bhs.getTotals(bhs.displayTotals);
        bhs.getUsers(bhs.displayUserTotals);
        bhs.getOrgs(bhs.displayOrgTotals);

        bhs.getBHEntries(bhs.displayEntries, bhs.user.settings.limit);
        bhs.getBases(bhs.displayEntries, bhs.user.settings.bases);
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

blackHoleSuns.prototype.buildUserPanel = async function () {
    const panel = `
        <div id="pnl-user">
            <div class="row">
                <div class="col-7">
                    <div class="row">
                        <div class="col-14 h6 txt-inp-def">Traveler</div>
                        <input id="id-player" class="rounded col-13 h5" type="text">
                    </div>
                </div>

                <div class="col-7">
                    <div class="row">
                        <div id="id-Platform" class="col-7"></div>
                        <div id="id-Galaxy" class="col-7"></div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div id="id-Organization" class="col-9"></div>
                <label class="col-5 h5 text-right align-bottom">
                    File Upload&nbsp;
                    <input id="ck-fileupload" type="checkbox">
                </label>
            </div>
        </div>
    </div>
    <br>`;

    $("#panels").prepend(panel);
    let loc = $("#pnl-user");

    await bhs.getOrgList();

    bhs.buildMenu(loc, "Organization", bhs.orgList, bhs.saveUser);
    bhs.buildMenu(loc, "Platform", platformList, bhs.saveUser, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.saveUser, true);

    $("#id-player").blur(function () {
        if (bhs.user.uid)
            bhs.checkPlayerName(this, bhs.displayUser);
    });

    $("#id-player").keyup(function (event) {
        if (event.keyCode === 13) {
            $(this).blur();
        }
    });

    $("#ck-fileupload").change(function (event) {
        if ($(this).prop("checked")) {
            panels.forEach(function (p) {
                $("#" + p.id).hide();
            });
            $("#entrybuttons").hide();
            $("#upload").show();
        } else {
            panels.forEach(function (p) {
                $("#" + p.id).show();
            });
            $("#entrybuttons").show();
            $("#upload").hide();
        }
    });
}

//const utPlayerIdx = 0;
//const utGalaxyIdx = 0;
//const utPlatformIdx = 1;
const utTypeIdx = 0;
const utAddrIdx = 1;

var userTable = [
    /*{
        title: "Player",
        id: "id-player",
        field: "player",
        format: "col-2",
        hide: true
    },
    {
        title: "Galaxy",
        id: "id-galaxy",
        field: "galaxy",
        format: "col-2",
       // off: true,
        fcn: getUserGalaxies,
    }, {
        title: "Platform",
        id: "id-platform",
        field: "platform",
        format: "col-2",
     //   off: true,
        fcn: getUserPlatforms,
    },*/
    {
        title: "Type",
        id: "id-type",
        format: "col-2",
        field: "blackhole",
    }, {
        title: "Coordinates",
        id: "id-addr",
        field: "addr",
        format: "col-lg-3 col-md-4 col-sm-4 col-5"
    }, {
        title: "LY",
        id: "id-toctr",
        format: "col-2",
        calc: true
    }, {
        title: "System",
        id: "id-sys",
        field: "sys",
        format: "col-3"
    }, {
        title: "Region",
        id: "id-reg",
        field: "reg",
        format: "col-3"
    }, {
        title: "Lifeform",
        id: "id-life",
        field: "life",
        format: "col-lg-2 col-md-4 col-sm-3 col-3"
    }, {
        title: "Economy",
        id: "id-econ",
        field: "econ",
        format: "col-lg-2 col-md-4 col-sm-3 col-3"
    }, {
        title: "Base",
        id: "id-base",
        field: "basename",
        format: "col-3",
    }
];

blackHoleSuns.prototype.buildUserTable = function (entry) {
    const table = `
        <div class="card-header">
            <div class="row">
                <h4 class="col-13">Latest Changes</h4>
            </div>
            <div class="row">
                <div id="lc-plat" class="col-4 h5"></div>
                <div id="lc-gal" class="col-5 h5"></div>
                <div id="btn-utSettings" class="col-5 text-right">
                    <i class="fa fa-cog txt-inp-def">Settings</i>
                </div>
            </div>
        </div>

        <div id="utSettings" class="card card-body" style="display:none">
            <div class="row">
                <div class="col-3 h6 txt-inp-def">Show last:&nbsp;</div>
                <label class="col-5 h6 txt-inp-def">
                    BH Pairs&nbsp;
                    <input id="id-showLimit" class="col-5 rounded" type="number">
                </label>
                <label class="col-5 h6 txt-inp-def">
                    Bases&nbsp;
                    <input id="id-showBases" class="col-5 rounded" type="number">
                </label>
            </div>

            <div id="id-utlistsel" class="row"></div>

            <div class="row">
                <button id="btn-saveUser" type="button" class="col-2 txt-def btn border btn-sm">Save</button>&nbsp;
            </div>

            <!--div class="row">
                <div class="col-9">
                    <input type="file" id="dlfile" class="form-control form-control-sm" accept=".csv">
                </div>
                
                <button id="export" type="button" class="col-2 txt-def btn border btn-sm">Export</button>&nbsp;
            </div-->
        </div>
        
        <div id="id-table" class="card-body">
            <div id="userHeader" class="row border-bottom"></div>
            <div id="userItems" class="scrollbar container-fluid" style="overflow-y: scroll; height: 388px"></div>
        </div>`;

    const ckbox = `            
        <label class="col-4 h6 txt-inp-def">
            <input id="ck-idname" type="checkbox" checked>
            title
        </label>`;

    $("#entryTable").empty();
    $("#entryTable").append(table);

    const line = `<div id="idname" class="width h6">title</div>`;

    let h = "";
    userTable.forEach(function (t) {
        let l = /idname/ [Symbol.replace](line, t.id);
        l = /width/ [Symbol.replace](l, t.format);
        h += /title/ [Symbol.replace](l, t.title);
    });

    let loc = $("#userHeader");
    loc.append(h);
    $("#lc-plat").text(entry.platform);
    $("#lc-gal").text(entry.galaxy);

    h = "";
    userTable.forEach(function (t) {
        let l = /idname/ [Symbol.replace](ckbox, t.id);
        h += /title/ [Symbol.replace](l, t.title);
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

    $("#id-showLimit").blur(function () {
        mapgrid = [];
        $("#entryTable #userItems").empty();
        bhs.buildMap();

        let l = $(this).val();
        bhs.getEntries(bhs.displayEntries, l);

        l = $("#id-showBases").val();
        bhs.getBases(bhs.displayEntries, l);
    });

    $("#id-showLimit").keyup(function (event) {
        if (event.keyCode === 13) {
            $(this).blur();
        }
    });

    $("#id-showBases").blur(function () {
        mapgrid = [];
        $("#entryTable #userItems").empty();
        bhs.buildMap();

        let l = $(this).val();
        bhs.getBases(bhs.displayEntries, l);

        l = $("#id-showLimit").val();
        bhs.getEntries(bhs.displayEntries, l);
    });

    $("#id-showBases").keyup(function (event) {
        if (event.keyCode === 13) {
            $(this).blur();
        }
    });

    $("#btn-utSettings").click(function () {
        if ($("#utSettings").is(":hidden"))
            $("#utSettings").show();
        else
            $("#utSettings").hide();
    });

    $("#btn-saveUser").click(function () {
        bhs.saveUser();
    });
}

var last = false;

blackHoleSuns.prototype.displayEntries = function (entry) {
    const lineHdr = `
        <div id="gpa" class="row">`;
    const line = `
            <div id="idname" class="width">
                <div id="bh-idname" class="row">bhdata</div>
                <div id="x-idname" class="row">xdata</div>
            </div>`;
    const lineEnd = `
        </div>`;

    bhs.drawMap(entry, 0);

    if (entry.blackhole)
        bhs.getEntry(entry.connection, bhs.displayEntries, pnlBottom);

    let gpa = entry.galaxy.nameToId() + "-" + entry.platform + "-" + (entry.blackhole ? entry.connection.stripColons() : entry.addr.stripColons());

    let loc = $("#userItems").find("#" + gpa);

    if (loc.length == 0) {
        let h = /gpa/ [Symbol.replace](lineHdr, gpa);

        userTable.forEach(function (t) {
            let l = /idname/g [Symbol.replace](line, t.id);
            l = /width/g [Symbol.replace](l, t.format);

            if (t.calc) {
                l = /bhdata/ [Symbol.replace](l, entry.blackhole ? bhs.calcDist(entry.addr) - bhs.calcDist(entry.connection) : "");
                l = /xdata/ [Symbol.replace](l, "");
            } else if (t.id == "id-type") {
                l = /bhdata/ [Symbol.replace](l, entry.blackhole ? "BH" : entry.deadzone ? "DZ" : entry.hasbase ? "Base" : "");
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

        $("#userItems").append(h);
        loc = $("#userItems").find("#" + gpa);
        loc.addClass((last = !last) ? "row bkg-vlight-gray" : "row");

        loc.dblclick(function () {
            if (typeof pnlTop != "undefined") {
                let e = {};
                e.addr = bhs.entryFromTable(this);

                $('html, body').animate({
                    scrollTop: ($('#panels').offset().top)
                }, 0);

                $("#delete").removeClass("disabled");
                $("#delete").removeAttr("disabled");

                bhs.drawMap(e, 1, false, true);
            }
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

    bhs.displaySettings(bhs.user);
}

blackHoleSuns.prototype.entryFromTable = function (ent) {
    let type = $(ent).find("#id-type").text().stripMarginWS().slice(0, 2);
    let addr = "";

    if (type == "BH" || type == "DZ")
        addr = $(ent).find("#bh-" + userTable[utAddrIdx].id).text().stripMarginWS();
    else
        addr = $(ent).find("#x-" + userTable[utAddrIdx].id).text().stripMarginWS();

    bhs.getEntry(addr, bhs.displaySingle, pnlTop);

    return (addr);
}

const totalsItemsHdr = `<div id="idname" class="row">`;
const totalsItems = `       <div id="idname" class="format">title</div>`;
const totalsItemsEnd = `</div>`;

const totalsDef = [{
    title: "",
    id: "id-what",
    format: "col-lg-14 col-md-5 col-sm-14 col-5",
}, {
    title: "Contest",
    id: "id-contest",
    format: "col-lg-4 col-md-3 col-sm-4 col-3 text-right",
}, {
    title: "Player",
    id: "id-player",
    format: "col-lg-4 col-md-3 col-sm-4 col-3 text-right",
}, {
    title: "All",
    id: "id-all",
    format: "col-lg-4 col-md-3 col-sm-4 col-3 text-right",
}];

const rowTotal = 0;
// const rowGalaxy = 1;
const rowPlatform = 1;
const rowGalaxyPlatform = 2;

const totalsRows = [{
    title: "Total BH",
    id: "id-totalBH",
}, {
    title: "Total[platform]",
    id: "id-totalBHP",
    // }, {
    //     title: "Total[galaxy]",
    //     id: "id-totalBHG",
}, {
    title: "Total[galaxy][platform]",
    id: "id-totalBHGP",
}];

blackHoleSuns.prototype.buildTotals = function () {
    const pnl = `
        <div class="card-header h4">Total Black Hole Entries</div>
        <div class="card-body">
            <div id="hdr0" class="row border-bottom"></div>
            <div id="itm0"></div>
            <br>
            <div class="card card-body">
                <div id="hdr1" class="row border-bottom"></div>
                <div id="itm1" class="scrollbar container-fluid" style="overflow-y: scroll; height:80px"></div>
            </div>
            <br>
            <div class="card card-body">
                <div id="hdr2" class="row border-bottom"></div>
                <div id="itm2" class="scrollbar container-fluid" style="overflow-y: scroll; height:80px"></div>
            </div>
        </div>`;

    let tot = $("#totals");
    tot.empty();
    tot.append(pnl);

    let h = "";

    totalsDef.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        h += /format/ [Symbol.replace](l, t.format + " ");
    });

    tot.find("#hdr0").append(h);

    totalsRows.forEach(function (x) {
        let t = /platform/ [Symbol.replace](x.title, bhs.user.platform);
        t = /galaxy/ [Symbol.replace](t, bhs.user.galaxy);

        let h = /idname/ [Symbol.replace](totalsItemsHdr, x.id);

        totalsDef.forEach(function (y) {
            let l = /idname/ [Symbol.replace](totalsItems, y.id);
            l = /title/ [Symbol.replace](l, t);
            h += /format/ [Symbol.replace](l, y.format);
            t = "";
        });

        h += totalsItemsEnd;

        tot.find("#itm0").append(h);
    });

    totalsPlayers.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        l = /format/ [Symbol.replace](l, t.format + " ");

        tot.find("#hdr1").append(l);
    });

    totalsOrgs.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        l = /format/ [Symbol.replace](l, t.format + " ");

        tot.find("#hdr2").append(l);
    });
}

blackHoleSuns.prototype.displayTotals = function (entry, id) {
    let pnl = $("#itm0");

    let columnid = id == "totals" ? "id-all" : "id-player";

    pnl.find("#" + columnid).empty();

    if (typeof entry[starsCol] != "undefined") {
        pnl.find("#" + totalsRows[rowTotal].id + " #" + columnid).text(entry[starsCol].total);
        pnl.find("#" + totalsRows[rowPlatform].id + " #" + columnid).text(entry[starsCol][bhs.user.platform]);

        if (typeof entry[starsCol].galaxy[bhs.user.galaxy] != "undefined") {
            // pnl.find("#" + totalsRows[rowGalaxy].id + " #" + columnid).text(totals.galaxy[bhs.user.galaxy]);
            pnl.find("#" + totalsRows[rowGalaxyPlatform].id + " #" + columnid).text(entry[starsCol].galaxy[bhs.user.galaxy][bhs.user.platform]);
        }
    }
}

const totalsPlayers = [{
    title: "Contributors",
    id: "id-names",
    format: "col-6",
}, {
    title: "Contest",
    id: "id-ctst",
    format: "col-4 text-right",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-4 text-right",
}];

blackHoleSuns.prototype.displayUserTotals = function (entry) {
    if (entry[starsCol]) {
        const userHdr = `<div id="u-idname" class="row">`;
        const userItms = `  <div id="idname" class="format">title</div>`;
        const userEnd = `</div>`;

        let pnl = $("#totals #itm1");
        let player = pnl.find("#u-" + entry.player.nameToId());

        if (player.length == 0) {
            let h = /idname/ [Symbol.replace](userHdr, entry.player.nameToId())

            totalsPlayers.forEach(function (x) {
                let l = /idname/ [Symbol.replace](userItms, x.id);
                l = /format/ [Symbol.replace](l, x.format);
                h += /title/ [Symbol.replace](l, x.id == "id-names" ? entry.player : x.id == "id-ctst" ? entry[starsCol].contest ? entry[starsCol].contest : "" : entry[starsCol].total);
            });

            h += userEnd;

            pnl.append(h);
        } else
            player.find("#id-qty").text(entry[starsCol].total);
    }
}

const totalsOrgs = [{
    title: "Organization",
    id: "id-names",
    format: "col-6",
}, {
    title: "Contest",
    id: "id-ctst",
    format: "col-4 text-right",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-4 text-right",
}];

blackHoleSuns.prototype.displayOrgTotals = function (entry) {
    if (entry[starsCol]) {
        const userHdr = `<div id="o-idname" class="row">`;
        const userItms = `       <div id="idname" class="format">title</div>`;
        const userEnd = `</div>`;

        let pnl = $("#totals #itm2");
        let player = pnl.find("#o-" + entry.name.nameToId());

        if (player.length == 0) {
            let h = /idname/ [Symbol.replace](userHdr, entry.name.nameToId())

            totalsOrgs.forEach(function (x) {
                let l = /idname/ [Symbol.replace](userItms, x.id);
                l = /format/ [Symbol.replace](l, x.format);
                h += /title/ [Symbol.replace](l, x.id == "id-names" ? entry.name : x.id == "id-ctst" ? entry[starsCol].contest ? entry[starsCol].contest : "" : entry[starsCol].total);
            });

            h += userEnd;

            pnl.append(h);
        } else
            player.find("#id-qty").text(entry[starsCol].total);
    }
}

// xs (for phones - screens less than 768px wide)
// sm (for tablets - screens equal to or greater than 768px wide)
// md (for small laptops - screens equal to or greater than 992px wide)
// lg (for laptops and desktops - screens equal to or greater than 1200px wide)

blackHoleSuns.prototype.buildMenu = function (loc, label, list, changefcn, vertical) {
    let title = `        
        <div class="row">
            <div class="col-md-medium col-sm-small col-xs h6 txt-inp-def">label</div>`;
    let block = `
            <div id="menu-idname" class="col-md-medium col-sm-small col-xs dropdown">
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
    h = /medium/ [Symbol.replace](h, vertical ? 13 : 8);
    h = /small/ [Symbol.replace](h, vertical ? 13 : 7);
    h = /xs/ [Symbol.replace](h, vertical ? 13 : 6);

    let l = /idname/g [Symbol.replace](block, id);
    l = /medium/ [Symbol.replace](l, vertical ? 13 : 5);
    l = /small/ [Symbol.replace](l, vertical ? 13 : 6);
    l = /xs/ [Symbol.replace](l, vertical ? 13 : 7);

    h += /rgbcolor/ [Symbol.replace](l, "background-color: " + levelRgb[typeof list[0].number == "undefined" ? 0 : list[0].number]);
    loc.find("#id-" + id).append(h);

    let menu = loc.find("#menu-" + id);
    menu.append(hdr);

    let mlist = menu.find("#list");

    for (let i = 0; i < list.length; ++i) {
        let lid = list[i].name.nameToId();
        h = /idname/ [Symbol.replace](item, lid);

        if (list[i].number)
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name);
        else
        if (list[i].number)
            h = /iname/ [Symbol.replace](h, list[i].number + " " + list[i].name);
        else
            h = /iname/ [Symbol.replace](h, list[i].name);

        if (label != "Galaxy") {
            if (list[i].number)
                h = /rgbcolor/ [Symbol.replace](h, "background-color: " + levelRgb[list[i].number] + ";");
            else
                h = /rgbcolor/ [Symbol.replace](h, "background-color: #c0f0ff;");
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
    user.settings = bhs.extractSettings();
    if (bhs.validateUser(user))
        bhs.updateUser(user, bhs.displayUser);
}

blackHoleSuns.prototype.extractUser = function () {
    let loc = $("#pnl-user");
    let u = {};

    u.player = loc.find("#id-player").val();
    u.platform = loc.find("#btn-Platform").text().stripNumber();
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
    u.org = loc.find("#btn-Organization").text().stripNumber();

    return u;
}

blackHoleSuns.prototype.extractSettings = function () {
    let s = {};
    s.options = {};

    let loc = $("#utSettings");
    s.limit = loc.find("#id-showLimit").val();
    s.bases = loc.find("#id-showBases").val();

    loc.find("[id|='ck']").each(function () {
        let id = $(this).prop("id");
        let checked = $(this).prop("checked");
        s.options[id] = checked;
    });

    return s;
}

blackHoleSuns.prototype.initSettings = function () {
    let s = {};
    s.options = {};
    s.limit = 20;
    s.bases = 5;

    let loc = $("#utSettings");
    loc.find("[id|='ck']").each(function () {
        let id = $(this).prop("id");
        s.options[id] = true;
    });

    return s;
}

blackHoleSuns.prototype.displaySettings = function (entry) {
    if (typeof entry.settings == "undefined")
        entry.settings = bhs.initSettings();

    let loc = $("#utSettings");
    loc.find("#id-showLimit").val(entry.settings.limit);
    loc.find("#id-showBases").val(entry.settings.bases);

    let tbl = $("#id-table");
    let usrHdr = tbl.find("#userHeader");
    let usrItm = tbl.find("#userItems");

    usrHdr.find("#id-type").show();
    usrItm.find("#id-type").show();

    Object.keys(entry.settings.options).forEach(x => {
        loc.find("#" + x).prop("checked", entry.settings.options[x]);
        let y = x.replace(/ck-(.*)/, "$1");
        if (entry.settings.options[x]) {
            usrHdr.find("#" + y).show();
            usrItm.find("#" + y).show();
        } else {
            usrHdr.find("#" + y).hide();
            usrItm.find("#" + y).hide();
        }
    });
}

blackHoleSuns.prototype.buildMap = function () {
    let canvas = document.getElementById('map');
    let ctx = canvas.getContext('2d');

    let w = $("#mapcol").width();
    canvas.width = w;
    canvas.height = w;

    let o = $("#maplogo").width();
    $("#logo").prop("width", o - 16);
    $("#logo").prop("height", o - 16);

    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, w, w);
    ctx.fillRect(0, 0, w, w);

    ctx.strokeStyle = 'white';
    ctx.strokeRect(0, 0, w, w);

    let m = parseInt(w / 2) + .5;
    ctx.beginPath();
    ctx.moveTo(m, 0);
    ctx.lineTo(m, w);
    ctx.moveTo(0, m);
    ctx.lineTo(w, m);
    ctx.stroke();

    $("#map").mousedown(function (evt) {
        let canvas = document.getElementById('map');
        let rect = canvas.getBoundingClientRect();

        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;

        let x = parseInt((evt.clientX - rect.left) * scaleX / 6);
        let y = parseInt((evt.clientY - rect.top) * scaleY / 6);

        if (mapgrid[x] && mapgrid[x][y]) {
            bhs.buildMap();
            bhs.drawUpChain(x, y);
            bhs.drawChain(x, y);
        }
    });
}

blackHoleSuns.prototype.drawChain = function (x, y) {
    let txt = mapgrid[x][y].split("\n");
    delete mapgrid[x][y];
    let w = $("#mapcol").width();

    for (let i = 0; i < txt.length && txt[i] != ""; ++i) {
        let addr = txt[i].slice(0, 19);
        let con = txt[i].slice(23);

        console.log(addr);
        bhs.getEntry(addr, bhs.drawMap);

        let xyz = bhs.addressToXYZ(con);
        let x = xyz.x / 4096 * w;
        let y = xyz.z / 4096 * w;

        let ix = parseInt(x / 6);
        let iy = parseInt(y / 6);

        if (mapgrid[ix] && mapgrid[ix][iy])
            bhs.drawChain(ix, iy);
    }
}

blackHoleSuns.prototype.drawUpChain = function (x, y) {
    let txt = mapupgrid[x][y].split("\n");
    delete mapupgrid[x][y];
    let w = $("#mapcol").width();

    for (let i = 0; i < txt.length && txt[i] != ""; ++i) {
        let addr = txt[i].slice(0, 19);
        let con = txt[i].slice(23);

        let xyz = bhs.addressToXYZ(addr);
        let x = xyz.x / 4096 * w;
        let y = xyz.z / 4096 * w;

        let ix = parseInt(x / 6);
        let iy = parseInt(y / 6);

        if (mapupgrid[ix] && mapupgrid[ix][iy])
            bhs.drawUpChain(ix, iy);


        console.log(addr);
        bhs.getEntry(addr, bhs.drawMap, 1, true);

    }
}

var mapgrid = [];
var mapupgrid = [];

blackHoleSuns.prototype.drawMap = function (entry, idx, up, large) {
    let canvas = document.getElementById('map');
    let ctx = canvas.getContext('2d');
    let w = $("#mapcol").width();

    let xyz = bhs.addressToXYZ(entry.addr);
    let x = xyz.x / 4096 * w;
    let y = xyz.z / 4096 * w;

    let size = 1;

    if (entry.blackhole) {
        let exyz = bhs.addressToXYZ(entry.connection);
        let ex = exyz.x / 4096 * w;
        let ey = exyz.z / 4096 * w;

        size = 2.5;

        ctx.fillStyle = 'aqua';
        ctx.strokeStyle = !up ? 'blue' : 'royalBlue';

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        if (idx == 0) {
            let ix = parseInt(x / 6);
            let iy = parseInt(y / 6);

            if (!mapgrid[ix])
                mapgrid[ix] = [];
            if (!mapgrid[ix][iy])
                mapgrid[ix][iy] = "";

            mapgrid[ix][iy] += entry.addr + " -> " + entry.connection + "\n";

            ix = parseInt(ex / 6);
            iy = parseInt(ey / 6);

            if (!mapupgrid[ix])
                mapupgrid[ix] = [];
            if (!mapupgrid[ix][iy])
                mapupgrid[ix][iy] = "";

            mapupgrid[ix][iy] += entry.addr + " -> " + entry.connection + "\n";
        }
    } else if (entry.hasbase) {
        ctx.fillStyle = 'lime';
        size = 3.5;
    } else if (entry.deadzone)
        ctx.fillStyle = 'red';
    else {
        ctx.fillStyle = 'yellow';
    }

    if (large)
        size = 4;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}