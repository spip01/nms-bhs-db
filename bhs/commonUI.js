'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser(bhs.user);

    $("#status").empty();
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

        bhs.getEntries(bhs.displayUserEntry, 100);
        bhs.getBases(bhs.displayUserEntry, 100);
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
                <label class="col-4 h5 text-right align-bottom">
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
            $("#save").hide();
            $("#delete").hide();
            $("#cancel").hide();
            $("#upload").show();
        } else {
            panels.forEach(function (p) {
                $("#" + p.id).show();
            });
            $("#save").show();
            $("#delete").show();
            $("#cancel").show();
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
        title: "    ",
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
        format: "col-2"
    }, {
        title: "Economy",
        id: "id-econ",
        field: "econ",
        format: "col-2"
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
                <h4 class="col-4">Latest Changes</h4>
                <div id="lc-plat" class="col-2 h5"></div>
                <div id="lc-gal" class="col-2 h5"></div>
                <div id="btn-utSettings" class="col-6 text-right">
                    <i class="fa fa-cog txt-inp-def">Settings</i>
                </div>
            </div>
        </div>

        <div id="utSettings" class="card card-body" style="display:none">
            <div class="row">
                <label class="col-14 h6 txt-inp-def">Show last&nbsp;
                    <input id="id-showLimit" class="rounded" type="number" value="100">
                    &nbsp;black holes &amp; bases
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
            <div id="userItems" class="scroll" style="height: 300px"></div>
        </div>`;

    const ckbox = `            
        <label class="col-3 h6 txt-inp-def">
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
        if (t.title.match(/[^ ]/)) {
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

    $("#id-showLimit").blur(function () {
        mapgrid = [];
        bhs.buildMap();
        bhs.getEntries(bhs.displayUserEntry, $("#id-showLimit").val() * 2);
        bhs.getBases(bhs.displayUserEntry, $("#id-showLimit").val());
    });

    $("#id-showLimit").keyup(function (event) {
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

blackHoleSuns.prototype.displayUserEntry = function (entry) {
    const lineHdr = `
        <div id="gpa" class="row">`;
    const line = `
            <div id="idname" class="width">
                <div id="bh-idname" class="row">bhdata</div>
                <div id="x-idname" class="row">xdata</div>
            </div>`;
    const lineEnd = `
        </div>`;

    bhs.drawMap(entry, true);

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

        $("#userItems").append(h);
        loc = $("#userItems").find("#" + gpa);
        loc.addClass((last = !last) ? "row bkg-vlight-gray" : "row");

        loc.dblclick(function () {
            if (typeof pnlTop != "undefined") {
                let e = {};
                e.addr = bhs.entryFromTable(this);

                // $('html, body').animate({
                //     scrollTop: ($('#panels').offset().top)
                // }, 0);

                $("#delete").removeClass("disabled");
                $("#delete").removeAttr("disabled");

                bhs.drawMap(e, false, true);
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
    format: "col-5",
}, {
    title: "Contest",
    id: "id-contest",
    format: "col-3 text-right",
}, {
    title: "Player",
    id: "id-player",
    format: "col-3 text-right",
}, {
    title: "All",
    id: "id-all",
    format: "col-3 text-right",
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
                <div id="itm1" class="scroll" style="height:76px"></div>
            </div>
            <br>
            <div class="card card-body">
                <div id="hdr2" class="row border-bottom"></div>
                <div id="itm2" class="scroll" style="height:76px"></div>
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

blackHoleSuns.prototype.buildMenu = function (loc, label, list, changefcn, vertical) {
    let title = `        
        <div class="row">
            <div class="col-width h6 txt-inp-def">label</div>`;
    let block = `
            <div id="menu-idname" class="col-width dropdown">
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
    h = /width/ [Symbol.replace](h, vertical ? 13 : 6);
    let l = /idname/g [Symbol.replace](block, id);
    l = /width/ [Symbol.replace](l, vertical ? 13 : 8);
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
    s.options = [];
    let loc = $("#utSettings");
    s.limit = loc.find("#id-showLimit").val();
    loc.find(":checked").each(function () {
        let id = $(this).prop("id");
        s.options.push(id);
    });

    return s;
}

blackHoleSuns.prototype.displaySettings = function (entry) {
    if (typeof entry.settings != "undefined") {
        let loc = $("#utSettings");
        loc.find("#id-showLimit").val(entry.settings.limit);
        loc.find(":checkbox").prop("checked", false);

        let tbl = $("#id-table");
        tbl.find("[id|='id']").hide();

        let usrHdr = tbl.find("#userHeader");
        let usrItm = tbl.find("#userItems");
        usrHdr.find("#id-type").show();
        usrItm.find("#id-type").show();

        Object.keys(entry.settings.options).forEach(x => {
            loc.find("#" + entry.settings.options[x]).prop("checked", true);
            let y = entry.settings.options[x].replace(/ck-(.*)/, "$1");
            usrHdr.find("#" + y).show();
            usrItm.find("#" + y).show();
        });
    }
}

blackHoleSuns.prototype.buildMap = function () {
    let canvas = document.getElementById('map');
    let ctx = canvas.getContext('2d');

    let w = canvas.offsetWidth;
    canvas.style.height = w + "px";

    w = canvas.width;
    let m = parseInt(w / 2) + .5;

    canvas.height = w;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, w);

    $("#logo").prop("width", w / 3);
    $("#logo").prop("height", w / 3);

    ctx.strokeStyle = 'white';

    ctx.strokeRect(0, 0, w, w);

    ctx.beginPath();
    ctx.moveTo(m, 0);
    ctx.lineTo(m, w);
    ctx.moveTo(0, m);
    ctx.lineTo(w, m);
    ctx.stroke();

    /*
        $("#map").mousemove(function (evt) {
            let canvas = document.getElementById('map');
            let rect = canvas.getBoundingClientRect();

            var tipCanvas = document.getElementById("tip");
            var tipCtx = tipCanvas.getContext("2d");

            let scaleX = canvas.width / rect.width;
            let scaleY = canvas.height / rect.height;

            let x = parseInt((evt.clientX - rect.left) * scaleX / 4);
            let y = parseInt((evt.clientY - rect.top) * scaleY / 4);
            if (mapgrid[x] && mapgrid[x][y]) {
                console.log(mapgrid[x][y]);
                let txt = mapgrid[x][y].split("\n");

                tipCanvas.style.left = (evt.clientX + 5) + "px";
                tipCanvas.style.top = (evt.clientY - 10) + "px";
                tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);

                for (let i = 0; i < txt.length; ++i)
                    tipCtx.fillText(txt[i], 5.5, 15 + i * 15);
            } else
                tipCanvas.style.left = "-800px";
        });
    */

    $("#map").mousedown(function (evt) {
        let canvas = document.getElementById('map');
        let rect = canvas.getBoundingClientRect();

        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;

        let x = parseInt((evt.clientX - rect.left) * scaleX / 4);
        let y = parseInt((evt.clientY - rect.top) * scaleY / 4);

        if (mapgrid[x] && mapgrid[x][y]) {
            bhs.buildMap();
            bhs.drawChain(x, y);
        }
    });
}

blackHoleSuns.prototype.drawChain = function (x, y) {
    let txt = mapgrid[x][y].split("\n");
    mapgrid[x][y] = "";
    let w = document.getElementById('map').width;

    for (let i = 0; i < txt.length && txt[i] != ""; ++i) {
        let addr = txt[i].slice(0, 19);
        let con = txt[i].slice(23);

        console.log(addr);
        bhs.getEntry(addr, bhs.drawMap);

        let xyz = bhs.addressToXYZ(con);
        let x = xyz.x / 4096 * w;
        let y = xyz.z / 4096 * w;

        let ix = parseInt(x / 4);
        let iy = parseInt(y / 4);

        if (mapgrid[ix] && mapgrid[ix][iy])
            bhs.drawChain(ix, iy);
    }
}

var mapgrid = [];

blackHoleSuns.prototype.drawMap = function (entry, add, large) {
    let canvas = document.getElementById('map');
    let ctx = canvas.getContext('2d');

    let w = document.getElementById('map').width;

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
        ctx.strokeStyle = 'blue';

        ctx.beginPath();
        ctx.moveTo(x + .5, y + .5);
        ctx.lineTo(ex + .5, ey + .5);
        ctx.stroke();

        if (add) {
            let ix = parseInt(x / 4);
            let iy = parseInt(y / 4);

            if (!mapgrid[ix])
                mapgrid[ix] = [];
            if (!mapgrid[ix][iy])
                mapgrid[ix][iy] = "";
            mapgrid[ix][iy] += entry.addr + " -> " + entry.connection + "\n";
        }
    } else if (entry.hasbase) {
        ctx.fillStyle = 'lime';
        size = 3.5;
    } else if (entry.deadzone)
        ctx.fillStyle = 'red';
    else
        ctx.fillStyle = 'yellow';

    if (large)
        size = 4;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}