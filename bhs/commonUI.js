'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser(bhs.user);

    $("#status").empty();
    $("#filestatus").empty();
    $("#entryTable").empty();
    $("#totals").empty();

    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
}

blackHoleSuns.prototype.doLoggedin = function () {
    bhs.getUser(bhs.displayUser);

    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
}

blackHoleSuns.prototype.displayUser = async function (user) {
    let changed = bhs.user.uid && (!bhs.entries || user.galaxy != bhs.user.galaxy || user.platform != bhs.user.platform);

    bhs.user = mergeObjects(bhs.user, user);
    bhs.contest = await bhs.getActiveContest();

    if (changed) {
        bhs.buildUserTable(bhs.user);
        bhs.buildMap();
        bhs.buildTotals();

        bhs.displaySettings(bhs.user);
        bhs.setMapOptions(bhs.user);

        bhs.getTotals(bhs.displayTotals);
        bhs.getEntries(bhs.displayEntryList);
    }

    let pnl = $("#pnl-user");
    pnl.find("#id-player").val(bhs.user._name);
    pnl.find("#btn-Player").text(bhs.user._name);
    pnl.find("#btn-Platform").text(bhs.user.platform);
    pnl.find("#btn-Organization").text(bhs.user.org);

    let l = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number;
    pnl.find("#btn-Galaxy").text(l + " " + bhs.user.galaxy);
    let i = bhs.getIndex(galaxyList, "name", bhs.user.galaxy);
    pnl.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[galaxyList[i].number].color + ";");

    $("#darkmode").click(function () {
        $("body .card").css("background-color", "black");
        $("body .card").css("color", "gold");
        $("body .card").css("border-color", "white");

        $("body .txt-inp-def").css("background-color", "black");
        $("body .txt-inp-def").css("color", "#7dcef6");

        $("body .txt-def").css("background-color", "black");
        $("body .txt-def").css("color", "gold");

        $("body .bkg-vlight-gray").css("background-color", "#303030");
        $("body .bkg-vlight-gray").css("color", "gold");

        $("body input").css("background-color", "black");
        $("body input").css("color", "gold");

        $("body button").css("border-color", "white");
    });
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
        user = bhs.extractUser();
        bhs.changeName(user);
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

const utTypeIdx = 0;
const utAddrIdx = 1;

var userTable = [{
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
}];

blackHoleSuns.prototype.buildUserTable = function (entry) {
    const table = `
        <div class="card-header bkg-def">
            <div class="row">
                <h4 class="col-13 txt-def">Latest Changes</h4>
            </div>
            <div class="row">
                <div id="lc-plat" class="col-4 txt-def h5"></div>
                <div id="lc-gal" class="col-5 h5 txt-def"></div>
                <div id="btn-utSettings" class="col-5 text-right txt-def">
                    <i class="fa fa-cog txt-def"></i>&nbsp;Settings
                </div>
            </div>
        </div>

        <div id="utSettings" class="card card-body" style="display:none">
            <div id="id-utlistsel" class="row"></div>

            <div class="row">
                <button id="btn-saveUser" type="button" class="col-2 btn-def btn btn-sm">Save</button>&nbsp;
            </div>

            <!--div class="row">
                <div class="col-9">
                    <input type="file" id="dlfile" class="form-control form-control-sm" accept=".csv">
                </div>
                
                <button id="export" type="button" class="col-2 btn-def btn btn-sm">Export</button>&nbsp;
            </div-->
        </div>
        
        <div id="id-table" class="card-body">
            <div id="userHeader" class="row border-bottom bkg-def txt-def"></div>
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

    $("#btn-utSettings").click(function () {
        if ($("#utSettings").is(":hidden"))
            $("#utSettings").show();
        else
            $("#utSettings").hide();
    });

    $("#btn-saveUser").click(function () {
        bhs.updateUser({
            settings: bhs.extractSettings()
        }, bhs.displayUser);
    });
}

blackHoleSuns.prototype.displayEntryList = function (entrylist, entry) {
    if (!entrylist && !entry)
        return;

    bhs.draw3dmap(entrylist, entry);

    if (!entry) {
        const lineHdr = `
        <div id="gpa" class="row">`;
        const line = `
            <div id="idname" class="width" ondblclick="entryDblclk(this)">
                <div id="bh-idname" class="row">bhdata</div>
                <div id="x-idname" class="row">xdata</div>
            </div>`;
        const lineEnd = `
        </div>`;

        let h = "";
        let alt = true;

        let keys = Object.keys(entrylist);
        for (let i = 0; i < keys.length; ++i) {
            let entry = entrylist[keys[i]];
            h += /gpa/ [Symbol.replace](lineHdr, keys[i].nameToId());
            let l = "";

            for (let j = 0; j < userTable.length; ++j) {
                let t = userTable[j];

                l = /idname/g [Symbol.replace](line, t.id);
                l = /width/g [Symbol.replace](l, t.format + (alt ? " bkg-vlight-gray" : ""));

                if (t.calc) {
                    l = /bhdata/ [Symbol.replace](l, entry.bh ? entry.bh.towardsCtr : "");
                    l = /xdata/ [Symbol.replace](l, "");
                } else if (t.id == "id-type") {
                    l = /bhdata/ [Symbol.replace](l, entry.bh ? "BH" : entry.dz ? "DZ" : "");
                    l = /xdata/ [Symbol.replace](l, "");
                } else if (t.id == "id-base") {
                    if (entry.bh && entry.bhbase)
                        l = /bhdata/ [Symbol.replace](l, entry.bhbase[t.field]);
                    else if (entry.dz && entry.dzbase)
                        l = /bhdata/ [Symbol.replace](l, entry.dzbase[t.field]);
                    else
                        l = /bhdata/ [Symbol.replace](l, "");

                    l = /xdata/ [Symbol.replace](l, entry.xitbase ? entry.xitbase[t.field] : "");
                } else {
                    if (entry.bh && entry.bh[t.field])
                        l = /bhdata/ [Symbol.replace](l, entry.bh[t.field]);
                    else if (entry.dz && entry.dz[t.field])
                        l = /bhdata/ [Symbol.replace](l, entry.dz[t.field]);
                    else
                        l = /bhdata/ [Symbol.replace](l, "");

                    l = /xdata/ [Symbol.replace](l, entry.xit && entry.xit[t.field] ? entry.xit[t.field] : "");
                }

                h += l;
            }

            alt = !alt;
            h += lineEnd;
        }

        $("#userItems").empty();
        $("#userItems").append(h);
        bhs.displaySettings(bhs.user);
    } else {
        let id = (entry.bh ? entry.bh.connection : entry.dz ? entry.dz.addr : entry.xit.addr).nameToId();
        let loc = $("#userItems #" + id);

        for (let j = 0; j < userTable.length; ++j) {
            let t = userTable[j];

            if (t.calc)
                loc.find("#bh-" + t.id).text(entry.bh ? entry.bh.towardsCtr : "")
            else if (t.id == "id-type")
                loc.find("#bh-" + t.id).text(entry.bh ? "BH" : entry.dz ? "DZ" : "")
            else {
                if (entry.bh)
                    loc.find("#bh-" + t.id).text(entry.bh[t.field] ? entry.bh[t.field] : "")
                if (entry.dz)
                    loc.find("#bh-" + t.id).text(entry.dz[t.field] ? entry.dz[t.field] : "")
                if (entry.xit)
                    loc.find("#x-" + t.id).text(entry.xit[t.field] ? entry.xit[t.field] : "")
            }
        }
    }
}

function entryDblclk(evt) {
    let ifgal = window.location.pathname == "/galaxy.html"

    let id = $(evt).parent().prop("id");
    let e = bhs.entries[bhs.reformatAddress(id)];

    if (!ifgal) {
        $('html, body').animate({
            scrollTop: ($('#panels').offset().top)
        }, 0);

        $("#delete").removeClass("disabled");
        $("#delete").removeAttr("disabled");

        bhs.displayListEntry(e);
    }

    bhs.draw3dmap(bhs.entries, e);
}

const totalsItemsHdr = `<div id="idname" class="row">`;
const totalsItems = `       <div id="idname" class="format">title</div>`;
const totalsItemsEnd = `</div>`;

const totalsCol = [{
    title: "",
    id: "id-what",
    format: "col-6",
}, {
    title: "Player",
    id: "id-player",
    format: " col-2 text-right",
    where: "index",
}, {
    title: "Contest",
    id: "id-contest",
    format: "col-2 text-right",
    where: "index",
}, {
    title: "All",
    id: "id-totalsall",
    format: "col-2 text-right",
}, {
    title: "Contest",
    id: "id-contestall",
    format: "col-2 text-right",
}];

const rowTotal = 0;
const rowPlatform = 1;
const rowAltPlatform = 2;
const rowGalaxy = 3;
const rowGalaxyPlatform = 4;

const totalsRows = [{
    title: "Total BH",
    id: "id-totalBH",
}, {
    title: "Total[platform]",
    id: "id-totalBHP",
}, {
    title: "Total[altplatform]",
    id: "id-totalAHP",
    where: "galaxy",
}, {
    title: "Total[galaxy]",
    id: "id-totalBHG",
    where: "index",
}, {
    title: "Total[galaxy][platform]",
    id: "id-totalBHGP",
    where: "index",
}];

blackHoleSuns.prototype.buildTotals = function () {
    let findex = window.location.pathname == "/index.html" || window.location.pathname == "/";
    let fgal = window.location.pathname == "/galaxy.html";

    const pnl = `
        <div class="card-header bkg-def">
            <div class="row">
            <div class="col-7 h4 txt-def">Total Black Hole Entries</div>
            <div id="contrib" class="col-7 clr-creme">Total contributors: </div>
            <div id="cname" class="row clr-creme"></div>
        </div>
        <div class="card-body bkg-white">
            <label id="id-showall" class="row h6 txt-inp-def">
                Show All&nbsp;
                <input id="ck-showall" type="checkbox">
            </label>
            <div id="hdr0" class="row border-bottom bkg-def txt-def"></div>
            <div id="itm0"></div>
            <br>
            
            <div id="tgalaxy" class="card card-body" style="display:none">
                <div id="hdrg" class="row border-bottom txt-def"></div>
                <div id="itmg" class="scrollbar container-fluid" style="overflow-y: scroll; height:120px"></div>
            </div>
            <br>

            <div class="card card-body">
                <div id="hdr1" class="row border-bottom txt-def"></div>
                <div id="itm1" class="scrollbar container-fluid" style="overflow-y: scroll; height:86px"></div>
            </div>
            <br>

            <div class="card card-body">
                <div id="hdr2" class="row border-bottom txt-def"></div>
                <div id="itm2" class="scrollbar container-fluid" style="overflow-y: scroll; height:86px"></div>
            </div>
        </div>`;

    let tot = $("#totals");
    tot.empty();
    tot.append(pnl);

    if (!findex) {
        tot.find("#itm1").css("height", "210px");
        tot.find("#itm2").css("height", "120px");
    }

    let h = "";

    totalsCol.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        h += /format/ [Symbol.replace](l, t.format + " ");
    });
    tot.find("#hdr0").append(h);

    totalsRows.forEach(function (x) {
        let t = /altplatform/ [Symbol.replace](x.title, bhs.user.platform != "PS4" ? "PS4" : "PC-XBox");
        t = /platform/ [Symbol.replace](t, bhs.user.platform);
        t = /galaxy/ [Symbol.replace](t, bhs.user.galaxy);

        let h = /idname/ [Symbol.replace](totalsItemsHdr, x.id);

        totalsCol.forEach(function (y) {
            let l = /idname/ [Symbol.replace](totalsItems, y.id);
            l = /title/ [Symbol.replace](l, t);
            h += /format/ [Symbol.replace](l, y.format);
            t = "";
        });

        h += totalsItemsEnd;

        tot.find("#itm0").append(h);
    });

    totalsCol.forEach(function (t) {
        if (t.where == "index" && !findex) {
            tot.find("#hdr0 #" + t.id).hide();
            tot.find("#itm0 #" + t.id).hide();
        }
    });

    totalsRows.forEach(function (t) {
        if (t.where == "galaxy" && !fgal || t.where == "index" && !findex)
            tot.find("#tgalaxy #" + t.id).hide();
    });

    totalsGalaxy.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        l = /format/ [Symbol.replace](l, t.hformat);

        tot.find("#hdrg").append(l);
    });

    totalsPlayers.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        l = /format/ [Symbol.replace](l, t.hformat);

        tot.find("#hdr1").append(l);
    });

    totalsOrgs.forEach(function (t) {
        let l = /idname/ [Symbol.replace](totalsItems, t.id);
        l = /title/ [Symbol.replace](l, t.title);
        l = /format/ [Symbol.replace](l, t.hformat);

        tot.find("#hdr2").append(l);
    });

    if (fgal) {
        tot.find("#id-showall").hide();
        tot.find("#hdr0").hide();
        tot.find("#itm0").hide();
        tot.find("#tgalaxy").show();
    } else if (findex) {
        tot.find("#id-showall").show();
        tot.find("#hdr0").show();
        tot.find("#itm0").show();
        tot.find("#tgalaxy").hide();
    }

    tot.find("#ck-showall").change(function () {
        if ($(this).prop("checked"))
            bhs.displayAllUTotals(bhs.user);
        else
            bhs.clearAllUTotals(bhs.user);
    });
}

blackHoleSuns.prototype.displayTotals = function (entry, id) {
    let fgal = window.location.pathname == "/galaxy.html";
    let cid = "";

    if (bhs.contest.name && !bhs.contest.hidden) {
        let now = firebase.firestore.Timestamp.fromDate(new Date());
        let s = "<h5>Contest: \"" + bhs.contest.name + "\"; ";
        s += " Starts: " + bhs.contest.start.toDate().toDateLocalTimeString() + "; ";
        s += " Ends: " + bhs.contest.end.toDate().toDateLocalTimeString() + (now > bhs.contest.end ? " CLOSED" : "");
        s += "</h5>";

        $("#totals #cname").html(s);
    }

    if (id.match(/totals/)) {
        cid = "id-totalsall";
        if (fgal)
            bhs.displayGTotals(entry, "itmg");
    } else if (id.match(/contest/)) {
        cid = "id-contestall";
        if (fgal)
            bhs.displayGTotals(entry, "itmg", true);
    } else if (id.match(/players/)) {
        bhs.displayPlayerTotals(entry, "itm1");
    } else if (id.match(/user/)) {
        bhs.displayUserTotals(entry, "itm1");

        cid = "id-player";
    } else if (id.match(/org/)) {
        bhs.displayUserTotals(entry, "itm2");
        return;
    }

    let loc = $("#itm1");
    var list = loc.children();

    if (fgal)
        list.sort((a, b) => $(a).prop("id").toLowerCase() > $(b).prop("id").toLowerCase() ? 1 :
            $(a).prop("id").toLowerCase() < $(b).prop("id").toLowerCase() ? -1 : 0);
    else
        list.sort((a, b) => parseInt($(a).find("#id-qty").text()) < parseInt($(b).find("#id-qty").text()) ? 1 :
            parseInt($(a).find("#id-qty").text()) > parseInt($(b).find("#id-qty").text()) ? -1 : 0);

    $("#contrib").html("Total Contributors: " + list.length);

    loc.empty();
    for (var i = 0; i < list.length; i++)
        loc.append(list[i]);

    if (entry.uid != bhs.user.uid)
        return;

    bhs.displayUTotals(entry[starsCol], cid);

    if (cid == "id-player" && typeof entry[starsCol].contest != "undefined") {
        cid = "id-contest";
        bhs.displayUTotals(entry[starsCol].contest[bhs.contest.name], cid);
    }
}

blackHoleSuns.prototype.displayUTotals = function (entry, cid) {
    let pnl = $("#itm0");
    if (typeof entry != "undefined") {
        pnl.find("#" + totalsRows[rowTotal].id + " #" + cid).text(entry.total);
        pnl.find("#" + totalsRows[rowPlatform].id + " #" + cid).text(entry[bhs.user.platform]);
        pnl.find("#" + totalsRows[rowAltPlatform].id + " #" + cid).text(entry[bhs.user.platform == "PS4" ? "PC-XBox" : "PS4"]);

        if (typeof entry.galaxy != "undefined" && typeof entry.galaxy[bhs.user.galaxy] != "undefined") {
            if (typeof rowGalaxy != "undefined")
                pnl.find("#" + totalsRows[rowGalaxy].id + " #" + cid).text(entry.galaxy[bhs.user.galaxy].total);
            pnl.find("#" + totalsRows[rowGalaxyPlatform].id + " #" + cid).text(entry.galaxy[bhs.user.galaxy][bhs.user.platform]);
        }
    }
}

blackHoleSuns.prototype.displayAllUTotals = function (entry) {
    let pnl = $("#itm0");
    pnl.find("#id-totalBHGP").css("border-bottom", "1px solid black");
    Object.keys(entry[starsCol].galaxy).forEach(function (g) {
        for (let i = 0; i < platformList.length; ++i) {
            if (entry[starsCol].galaxy[g][platformList[i].name] > 0) {
                let id = "id-" + g.nameToId() + "-" + platformList[i].name.nameToId();
                let h = /idname/ [Symbol.replace](totalsItemsHdr, id);

                let t = /galaxy/ [Symbol.replace](totalsRows[rowGalaxyPlatform].title, g);
                t = /platform/ [Symbol.replace](t, platformList[i].name);
                let l = /title/ [Symbol.replace](totalsItems, t);
                h += /format/ [Symbol.replace](l, totalsCol[0].format);

                l = /title/ [Symbol.replace](totalsItems, entry[starsCol].galaxy[g][platformList[i].name]);
                h += /format/ [Symbol.replace](l, totalsCol[1].format);

                h += totalsItemsEnd;
                pnl.append(h);
            }
        }
    });
}

blackHoleSuns.prototype.clearAllUTotals = function (entry) {
    let pnl = $("#itm0");
    Object.keys(entry[starsCol].galaxy).forEach(function (g) {
        for (let i = 0; i < platformList.length; ++i) {
            if (entry[starsCol].galaxy[g][platformList[i].name] > 0) {
                let id = "id-" + g.nameToId() + "-" + platformList[i].name.nameToId();
                pnl.find("#" + id).remove();
            }
        }
    });
}

const totalsPlayers = [{
    title: "Contributors",
    id: "id-names",
    format: "col-7",
    hformat: "col-7",
}, {
    title: "Contest",
    id: "id-ctst",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}];

const totalsOrgs = [{
    title: "Organization",
    id: "id-names",
    format: "col-7",
    hformat: "col-7",
}, {
    title: "Contest",
    id: "id-ctst",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}];

const totalsGalaxy = [{
    title: "Galaxy",
    id: "id-names",
    format: "col-5",
    hformat: "col-5",
}, {
    title: "PC-XBox",
    id: "id-pct",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}, {
    title: "PS4",
    id: "id-ps4t",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}, {
    title: "Total",
    id: "id-qty",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}, {
    title: "Contest",
    id: "id-ctst",
    format: "col-2 text-right",
    hformat: "col-2 text-center",
}];

blackHoleSuns.prototype.displayUserTotals = function (entry, id) {
    let fgal = window.location.pathname == "/galaxy.html";

    if (entry[starsCol]) {
        const userHdr = `<div id="u-idname" class="row">`;
        const userItms = `  <div id="idname" class="format">title</div>`;
        const userEnd = `</div>`;

        let pnl = $("#totals #" + id);
        let rid = typeof entry._name != "undefined" ? entry._name.nameToId() : entry.name.nameToId();
        let player = pnl.find("#u-" + rid);

        if (player.length == 0) {
            let h = /idname/ [Symbol.replace](userHdr, rid)

            totalsPlayers.forEach(function (x) {
                let l = /idname/ [Symbol.replace](userItms, x.id);
                l = /format/ [Symbol.replace](l, x.format);
                switch (x.title) {
                    case "Contributors":
                        h += /title/ [Symbol.replace](l, entry._name ? entry._name : entry.name);
                        break;
                    case "Contest":
                        let disq = false;
                        let d = Object.keys(bhs.contest.disq.orgs);
                        for (let i = 0; i < d.length && !disq; ++i)
                            if (bhs.contest.disq.orgs[d[i]] == entry.name)
                                disq = true;

                        d = Object.keys(bhs.contest.disq.users);
                        for (let i = 0; i < d.length && !disq; ++i)
                            if (bhs.contest.disq.users[d[i]] == entry._name)
                                disq = true;

                        h += /title/ [Symbol.replace](l, bhs.contest.name && entry[starsCol].contest ? disq ? "--" : entry[starsCol].contest[bhs.contest.name].total : "");
                        break;
                    case "Total":
                        h += /title/ [Symbol.replace](l, entry[starsCol].total);
                        break;
                }
            });

            h += userEnd;

            pnl.append(h);

            if (fgal && entry.uid) {
                pnl.find("#u-" + rid).dblclick(function () {
                    bhs.entries = {};
                    entry.galaxy = $("#btn-Galaxy").text().stripNumber();
                    entry.platform = $("#btn-Platform").text().stripNumber();
                    bhs.buildUserTable(entry)
                    $("#btn-Player").text(entry._name);
                    bhs.getEntries(bhs.displayEntryList, entry.uid);
                });
            }
        } else {
            player.find("#id-qty").text(entry[starsCol].total);
            player.find("#id-ctst").text(bhs.contest.name && entry[starsCol].contest ? entry[starsCol].contest[bhs.contest.name].total : "");
        }
    }
}

blackHoleSuns.prototype.displayPlayerTotals = function (entry, id) {
    let u = Object.keys(entry);
    for (let i = 0; i < u.length; ++i) {
        let e = {};
        e._name = u[i];
        e[starsCol] = entry[u[i]];

        bhs.displayUserTotals(e, id);
    }
}

blackHoleSuns.prototype.displayGTotals = function (entry, id, ifcontest) {
    if (entry[starsCol]) {
        const userHdr = `<div id="u-idname" class="row">`;
        const userItms = `  <div id="idname" class="format">title</div>`;
        const userEnd = `</div>`;

        let pnl = $("#totals #" + id);

        for (let i = 0; i < galaxyList.length; ++i) {
            let g = entry[starsCol].galaxy[galaxyList[i].name];
            if (g && g.total > 0) {
                let rid = galaxyList[i].name.nameToId();
                let player = pnl.find("#u-" + rid);

                if (player.length == 0) {
                    let h = /idname/ [Symbol.replace](userHdr, rid)

                    totalsGalaxy.forEach(function (x) {
                        let l = /idname/ [Symbol.replace](userItms, x.id);
                        l = /format/ [Symbol.replace](l, x.format);
                        switch (x.title) {
                            case "Galaxy":
                                h += /title/ [Symbol.replace](l, galaxyList[i].number + ". " + galaxyList[i].name);
                                break;
                            case "Contest":
                                h += /title/ [Symbol.replace](l, ifcontest ? g.total : "");
                                break;
                            case "Total":
                                h += /title/ [Symbol.replace](l, !ifcontest ? g.total : "");
                                break;
                            case "PC-XBox":
                                h += /title/ [Symbol.replace](l, !ifcontest ? g['PC-XBox'] : "");
                                break;
                            case "PS4":
                                h += /title/ [Symbol.replace](l, !ifcontest ? g["PS4"] : "");
                                break;
                        }
                    });

                    h += userEnd;

                    pnl.append(h);

                    pnl.find("#u-" + rid).dblclick(function () {
                        bhs.entries = {};
                        $("#btn-Galaxy").text(galaxyList[i].name);
                        $("#btn-Player").text("");
                        bhs.getEntries(bhs.displayEntryList, null, galaxyList[i].name);
                    });
                } else {
                    if (ifcontest)
                        player.find("#id-ctst").text(g.total);
                    else {
                        player.find("#id-qty").text(g.total);
                        player.find("#id-ps4t").text(g["PS4"]);
                        player.find("#id-pct").text(g["PC-XBox"]);
                    }
                }
            }
        }
    }
}

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
    user.mapoptions = bhs.extractMapOptions();

    if (bhs.validateUser(user))
        bhs.updateUser(user, bhs.displayUser);
}

blackHoleSuns.prototype.extractUser = function () {
    let loc = $("#pnl-user");
    let u = {};

    u._name = loc.find("#id-player").val();
    u.platform = loc.find("#btn-Platform").text().stripNumber();
    u.galaxy = loc.find("#btn-Galaxy").text().stripNumber();
    u.org = loc.find("#btn-Organization").text().stripNumber();

    return u;
}

blackHoleSuns.prototype.extractSettings = function () {
    let s = {};
    s.options = {};

    let loc = $("#utSettings");

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

var colortable = [{
    name: "Black Hole",
    id: "clr-bh",
    color: "#00ffff"
}, {
    name: "Exit",
    id: "clr-exit",
    color: "#ffff00"
}, {
    name: "Dead Zone",
    id: "clr-dz",
    color: "#ff0000"
}, {
    name: "Base",
    id: "clr-base",
    color: "#00ff00"
}, {
    name: "Connection",
    id: "clr-con",
    color: "#0000ff"
}, {
    name: "Map Bkg",
    id: "clr-bkg",
    color: "#808080"
}, {
    name: "Page Bkg",
    id: "clr-page",
    color: "#c0c0c0"
}];

blackHoleSuns.prototype.extractMapOptions = function () {
    let c = {};

    for (let i = 0; i < colortable.length; ++i)
        c[colortable[i].id] = $("#sel-" + colortable[i].id).val();

    c.depth = $("#inp-chaindepth").val()
    c.zoomsz = $("#inp-zoomsz").val()
    c.connection = $("#ck-drawcon").prop("checked");
    c.map3d = $("#ck-3dmap").prop("checked");
    c.exit = $("#ck-drawexits").prop("checked");
    c.base = $("#ck-drawbase").prop("checked");
    c.zoomreg = $("#ck-zoomreg").prop("checked");

    return c;
}

blackHoleSuns.prototype.setMapOptions = function (entry) {
    let findex = window.location.pathname == "/" || window.location.pathname == "/index.html";

    if (!findex) {
        $("#id-mapinp").hide();
        $("#id-zoomreg").hide();
        $("#id-chain").hide();
        $("#id-drawbase").hide();
        $("#id-drawcon").hide();
    }

    if (typeof entry.mapoptions != "undefined") {
        for (let i = 0; i < colortable.length; ++i) {
            $("#sel-" + colortable[i].id).val(entry.mapoptions[colortable[i].id]);
            $("#" + colortable[i].id).css("color", entry.mapoptions[colortable[i].id]);
        }

        $("#inp-chaindepth").val(entry.mapoptions.depth);
        $("#inp-zoomsz").val(entry.mapoptions.zoomsz ? entry.mapoptions.zoomsz : 3);
        $("#ck-drawcon").prop("checked", entry.mapoptions.connection);
        $("#ck-3dmap").prop("checked", entry.mapoptions.map3d);
        $("#ck-drawexits").prop("checked", entry.mapoptions.exit);
        $("#ck-drawbase").prop("checked", entry.mapoptions.base);
        $("#ck-zoomreg").prop("checked", entry.mapoptions.zoomreg ? entry.mapoptions.zoomreg : false);
    } else {
        for (let i = 0; i < colortable.length; ++i) {
            $("#sel-" + colortable[i].id).val(colortable[i].color);
            $("#" + colortable[i].id).css("color", colortable[i].color);
        }

        $("#inp-chaindepth").val(2);
        $("#inp-zoomsz").val(3);
        $("#ck-drawcon").prop("checked", false);
        $("#ck-3dmap").prop("checked", false);
        $("#ck-drawexits").prop("checked", false);
        $("#ck-drawbase").prop("checked", false);
        $("#ck-zoomreg").prop("checked", false);
    }
}

blackHoleSuns.prototype.buildMap = function () {
    let o = $("#maplogo").width();
    $("#logo").prop("width", o - 16);
    $("#logo").prop("height", o - 16);

    const settings = `
        <div class="row">
            <div id="id-mapinp" class="col-6">
                <label id="id-chaindepth" class="row h6 txt-def">Chain Depth&nbsp;
                    <input id="inp-chaindepth" type="number" class="rounded col-5 txt-def" value="1">
                </label>
                <label id="id-zoomsz" class="row h6 txt-def">Reg Zoom Size&nbsp;
                    <input id="inp-zoomsz" type="number" class="rounded col-5 txt-def" value="3">
                </label>
            </div>
            <div class="col-8">
                <div class="row">
                    <label class="col-7 h6 txt-def">
                        <input id="ck-3dmap" type="checkbox" checked>
                        3D Map
                    </label>
                    <label id="id-drawcon" class="col-7 h6 txt-def">
                        <input id="ck-drawcon" type="checkbox" checked>
                        Draw Connections
                    </label>
                    <label class="col-7 h6 txt-def">
                        <input id="ck-drawexits" type="checkbox" checked>
                        Draw Exits
                    </label>
                    <label id="id-drawbase" class="col-7 h6 txt-def">
                        <input id="ck-drawbase" type="checkbox" checked>
                        Draw Bases
                    </label>
                    <label id="id-zoomreg" class="col-7 h6 txt-def">
                        <input id="ck-zoomreg" type="checkbox" checked>
                        Auto Zoom
                    </label>
                </div>
            </div>
        </div>

        <div class="row">
            <button id="btn-redraw" type="button" class="col-2 border btn btn-sm btn-def">Redraw</button>&nbsp;
            <button id="btn-mapsave" type="button" class="col-2 border btn btn-sm btn-def">Save</button>&nbsp;
            <div class="col-9 border">
                <!--div id="id-chain" class="col-14 h6 clr-creme text-center">Click on Black Hole to select chain.</div-->
                <div class="col-14 h6 clr-creme text-center">Click on color box in map key to change colors. Then click redraw.</div>
            </div>
        </div>`;

    $("#mapoptions").html(settings);

    const key = `
    <div class="row">
        <div id="idname" class="col-9" style="color:colorsel">title</div>
        <input id="sel-idname" class="col-5 bkg-def" style="border-color:black" type="color" value="colorsel">
    </div>`;

    let keyloc = $("#mapkey");
    keyloc.empty();

    keyloc.append(`<div class="row"><div class="col-14 text-center h5 txt-def">Key</div></div>`);

    colortable.forEach(c => {
        let h = /idname/g [Symbol.replace](key, c.id);
        h = /colorsel/g [Symbol.replace](h, c.color);
        h = /title/g [Symbol.replace](h, c.name);
        keyloc.append(h);
    });

    $("#btn-redraw").click(function () {
        bhs.draw3dmap(bhs.entries);
    });

    $("#btn-mapsave").click(function () {
        bhs.updateUser({
            mapoptions: bhs.extractMapOptions()
        }, bhs.displayUser);
    });

}

blackHoleSuns.prototype.draw3dmap = function (entrylist, entry, zoom) {
    let opt = bhs.extractMapOptions();

    var pushentry = function (data, entry, label, alt) {
        data.x.push(entry.x);
        data.y.push(entry.z);
        data.z.push(entry.y);
        data.t.push(label);
        data.a.push(alt);
    };

    var initout = function (out) {
        if (!out) {
            out = {};
            out.x = [];
            out.y = [];
            out.z = [];
            out.t = [];
            out.a = [];
        }

        return out;
    };

    var makedata = function (out, size, color, linecolor, lines) {
        let line = {
            x: out.x,
            y: out.y,
            z: out.z,
            text: out.t,
            altdata: out.a,
            mode: 'markers',
            marker: {
                size: size,
                line: {
                    color: color,
                    width: 1,
                    opacity: 1,

                },
                color: color,
                opacity: 0.5,
            },
            type: opt.map3d || (opt.zoomreg && zoom) ? "scatter3d" : "scatter",
            hoverinfo: 'text',
        };

        if (lines) {
            line.mode = 'lines+markers';
            line.line = {
                color: linecolor,
                width: 2,
                opacity: 0.5,
            };
        }

        return line;
    }

    var layout = {
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        },
        showlegend: false,
        paper_bgcolor: opt["clr-page"],
        scene: {
            zaxis: {
                nticks: 3,
                backgroundcolor: opt["clr-bkg"],
                gridcolor: "rgb(0, 0, 0)",
                zerolinecolor: "rgb(0, 0, 0)",
                showbackground: true,
                title: "Y",
                range: [0, 256],
                tickvals: [0, 0x7f, 0xff],
                ticktext: ['0', '7f', 'ff'],
                tickangle: 45,
            },
            xaxis: {
                nticks: 3,
                backgroundcolor: opt["clr-bkg"],
                gridcolor: "rgb(0, 0, 0)",
                zerolinecolor: "rgb(0, 0, 0)",
                showbackground: true,
                title: "X",
                tickvals: [0, 0x7ff, 0xfff],
                range: [0, 4096],
                ticktext: ['0', '7ff', 'fff'],
                tickangle: 45,
            },
            yaxis: {
                nticks: 3,
                backgroundcolor: opt["clr-bkg"],
                gridcolor: "rgb(0, 0, 0)",
                zerolinecolor: "rgb(0, 0, 0)",
                title: "Z",
                showbackground: true,
                range: [4096, 0],
                tickvals: [0, 0x7ff, 0xfff],
                ticktext: ['0', '7ff', 'fff'],
                tickangle: 45,
            },
        },
    };

    let out = {};
    let zero = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    };

    if ((opt.zoomreg && zoom)) {
        let s = parseInt(zoom) + 1;
        layout.scene.xaxis.range = [entry.xyzs.x - s, entry.xyzs.x + s];
        layout.scene.yaxis.range = [entry.xyzs.z + s, entry.xyzs.z - s];
        layout.scene.zaxis.range = [entry.xyzs.y - s, entry.xyzs.y + s];

        layout.scene.xaxis.tickvals = [entry.xyzs.x - s, entry.xyzs.x + s];
        layout.scene.xaxis.ticktext = [(entry.xyzs.x - s).toString(16), (entry.xyzs.x + s).toString(16)];
        layout.scene.xaxis.nticks = 2;

        layout.scene.yaxis.tickvals = [entry.xyzs.z + s, entry.xyzs.z - s];
        layout.scene.yaxis.ticktext = [(entry.xyzs.z + s).toString(16), (entry.xyzs.z - s).toString(16)];
        layout.scene.yaxis.nticks = 2;

        layout.scene.zaxis.tickvals = [entry.xyzs.y - s, entry.xyzs.y + s];
        layout.scene.zaxis.ticktext = [(entry.xyzs.y - s).toString(16), (entry.xyzs.y + s).toString(16)];
        layout.scene.zaxis.nticks = 2;

        Plotly.relayout('plymap', layout);
    }

    if (!entry || (opt.zoomreg && zoom)) {
        let data = [];

        let addr = Object.keys(entrylist);
        for (let i = 0; i < addr.length; ++i) {
            let e = entrylist[addr[i]];

            let entries = Object.keys(e);
            for (let j = 0; j < entries.length; ++j) {
                let w = entries[j];

                if (opt.connection) {
                    if (w == "bh") {
                        out.con = initout();
                        pushentry(out.con, e.bh.xyzs, e.bh.addr + "<br>" + e.bh.sys + "<br>" + e.bh.reg);
                        pushentry(out.con, e.bh.conxyzs, e.bh.connection);
                        data.push(makedata(out.con, 4, opt["clr-bh"], opt["clr-con"], true));
                        break;
                    }
                } else if (w == "bhbase" || w == "xitbase") {
                    out.base = initout(out.base);
                    pushentry(out.base, e[w].xyzs, e[w].addr + "<br>" + e[w].basename);
                } else {
                    out[w] = initout(out[w]);
                    pushentry(out[w], e[w].xyzs, e[w].addr + "<br>" + e[w].sys + "<br>" + e[w].reg, {
                        bh: e.bh ? e.bh.xyzs : null,
                        xit: e.xit ? e.xit.xyzs : null
                    });
                }
            }
        }

        if (!opt.connection) {
            if (out.bh)
                data.push(makedata(out.bh, 4, opt["clr-bh"]));

            if (opt.exit && out.xit)
                data.push(makedata(out.xit, 2, opt["clr-exit"]));

            if (opt.base && out.base)
                data.push(makedata(out.base, 2, opt["clr-base"]));
        }

        Plotly.newPlot('plymap', data, layout).then(plot => {
            plot.on('plotly_click', function (e) {
                setTimeout(function () {
                    if (e.points.length > 0) {
                        let d = e.points[0].data.altdata[e.points[0].pointNumber];
                        if (d.bh && d.xit) {
                            out.con = initout();
                            pushentry(out.con, d.bh);
                            pushentry(out.con, d.xit);
                            Plotly.addTraces('plymap', makedata(out.con, 8, opt["clr-bh"], opt["clr-con"], true));
                        }

                        if (window.location.pathname == "/index.html" || window.location.pathname == "/")
                            bhs.getEntry(e.points[0].text.slice(0, 19), bhs.displaySingle, 0);
                    }
                }, 500);
            });

            // plot.on('plotly_hover', e => {
            //     if (e.points.length > 0) {
            //         let d = e.points[0].data;
            //         let xyz = d.altdata[e.points[0].pointNumber];
            //         if (xyz) {
            //             //Plotly.Fx.hover('plymap', {yval:[xyz.z], xval:[xyz.x], zval:[xyz.y] },["xyz"]);
            //             // for (let i = 0; i < d.x.length; ++i) {
            //                 // if (d.x[i] == xyz.x && d.y[i] == xyz.z && d.z[i] == xyz.y)
            //                     Plotly.restyle('plymap', {
            //                         "marker.size": 8
            //                     }, {y:[xyz.z], x:[xyz.x], z:[xyz.y] })
            //             // }
            //         }
            //     }
            // });
        });

    } else {
        if (!entry.addr) {
            let entries = Object.keys(entry);
            for (let j = 0; j < entries.length; ++j) {
                let w = entries[j];
                if (opt.connection) {
                    if (w == "bh") {
                        out.con = initout();
                        pushentry(out.con, entry.bh.xyzs, entry.bh.addr + "<br>" + entry.bh.sys + "<br>" + entry.bh.reg);
                        pushentry(out.con, entry.bh.conxyzs, entry.bh.connection);
                        Plotly.addTraces('plymap', makedata(out.con, 8, opt["clr-bh"], opt["clr-con"], true));
                        break;
                    }
                } else if (w == "bhbase" || w == "xitbase") {
                    out.base = initout(out.base);
                    pushentry(out.base, entry[w].xyzs, entry[w].addr + "<br>" + entry[w].basename);
                } else {
                    out[w] = initout(out[w]);
                    pushentry(out[w], entry[w].xyzs, entry[w].addr + "<br>" + entry[w].sys + "<br>" + entry[w].reg, {
                        bh: entry.bh ? entry.bh.xyzs : null,
                        xit: entry.xit ? entry.xit.xyzs : null
                    });
                }
            }

            if (!opt.connection) {
                if (out.bh)
                    Plotly.addTraces('plymap', makedata(out.bh, 8, opt["clr-bh"]));

                if (opt.exit && out.xit)
                    Plotly.addTraces('plymap', makedata(out.xit, 8, opt["clr-exit"]));

                if (opt.base && out.base)
                    Plotly.addTraces('plymap', makedata(out.base, 8, opt["clr-base"]));
            }
        } else {
            out = initout();
            pushentry(out, entry.xyzs, entry.addr + "<br>" + entry.sys + "<br>" + entry.reg, {
                bh: entry.xyzs,
                xit: entry.conxyzs
            });

            if (entry.blackhole || entry.deadzone)
                Plotly.addTraces('plymap', makedata(out, 8, opt["clr-bh"]));
            else if (opt.base && entry.basename)
                Plotly.addTraces('plymap', makedata(out, 8, opt["clr-base"]));
            else if (opt.exit)
                Plotly.addTraces('plymap', makedata(out, 8, opt["clr-exit"]));
        }
    }
}