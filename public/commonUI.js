'use strict';

blackHoleSuns.prototype.doLoggedout = function () {
    if (bhs.clearPanels) bhs.clearPanels();
    bhs.user = bhs.userInit();
    bhs.displayUser(bhs.user, true);

    $("#status").empty();
    $("#filestatus").empty();
    $("#entryTable").empty();
    $("#totals").empty();

    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
}

blackHoleSuns.prototype.doLoggedin = function (user) {
    bhs.displayUser(user, true);

    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
}

blackHoleSuns.prototype.displayUser = async function (user, force) {
    let ifindex = window.location.pathname == "/index.html" || window.location.pathname == "/";
    let changed = user.uid && (!bhs.entries || user.galaxy != bhs.user.galaxy || user.platform != bhs.user.platform);

    bhs.user = mergeObjects(bhs.user, user);
    bhs.contest = await bhs.getActiveContest();

    if ((changed || force) && bhs.user.galaxy && bhs.user.platform) {
        bhs.buildTotals();
        bhs.getTotals(bhs.displayTotals);

        bhs.buildMap();
        bhs.setMapOptions(bhs.user);

        bhs.buildUserTable(bhs.user);
        bhs.displaySettings(bhs.user);
        bhs.getEntries(bhs.displayEntryList);
    }

    let pnl = $("#pnl-user");
    pnl.find("#id-player").val(bhs.user._name);
    pnl.find("#btn-Player").text(bhs.user._name);
    pnl.find("#btn-Platform").text(bhs.user.platform);
    pnl.find("#btn-Organization").text(bhs.user.org);

    if (bhs.user.galaxy) {
        let i = galaxyList[bhs.getIndex(galaxyList, "name", bhs.user.galaxy)].number;
        pnl.find("#btn-Galaxy").text(i + " " + bhs.user.galaxy);
        pnl.find("#btn-Galaxy").attr("style", "background-color: " + bhs.galaxyInfo[i].color + ";");
    } else
        pnl.find("#btn-Galaxy").text("");

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

    $("#id-player").change(function () {
        let user = bhs.extractUser();
        bhs.changeName("#id-player", user);
    });

    $("#id-player").keyup(function (event) {
        if (event.keyCode === 13) {
            $(this).change();
        }
    });

    $("#ck-fileupload").change(function (event) {
        if ($(this).prop("checked")) {
            panels.forEach(function (p) {
                $("#" + p.id).hide();
            });
            $("#entrybuttons").hide();
            $("#upload").show();

            //bhs.buildFileList();
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
                <h4 class="col-13 txt-def">User Entries</h4>
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
                <button id="btn-saveListSettings" type="button" class="col-2 btn-def btn btn-sm">Save</button>&nbsp;

                <label id="id-export" class="col-7 text-right h6 txt-inp-def border-left" style="display:none">File Name&nbsp;
                    <input id="inp-exportfile" type="text" class="rounded col-10">
                </label>
                
                <button id="btn-create" type="button" href="" class="col-2 btn-def btn btn-sm" style="display:none">Create</button>&nbsp;
                <a id="btn-export" type="button" href="" class="col-2 btn-def btn btn-sm disabled" disabled style="display:none">Export</a>
            </div>
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

    $("#btn-saveListSettings").click(function () {
        bhs.updateUser({
            settings: bhs.extractSettings()
        });
    });

    if (document.domain == "localhost" || document.domain == "test-nms-bhs.firebaseapp.com") {
        $("#id-export").show();
        $("#btn-create").show();
        $("#btn-export").show();

        $("#btn-create").click(function () {
            var text = bhs.entriesToCsv();

            var data = new Blob([text], {
                type: 'text/plain'
            });
            var url = window.URL.createObjectURL(data);
            document.getElementById('btn-export').href = url;

            $("#btn-export").prop("download", $("#inp-exportfile").val());
            $("#btn-export").removeClass("disabled");
            $("#btn-export").removeAttr("disabled");
        });
    }
}

blackHoleSuns.prototype.entriesToCsv = function () {
    let out = "bh coord,sys,reg,life,econ,exit coord,sys,reg,life,econ\n";

    let entries = Object.keys(bhs.entries);
    for (let i = 0; i < entries.length; ++i) {
        let e = bhs.entries[entries[i]];
        if (e.bh && e.exit) {
            out += e.bh.addr + "," + e.bh.sys + "," + e.bh.reg + "," + e.bh.life + "," + e.bh.econ + ",";
            out += e.exit.addr + "," + e.exit.sys + "," + e.exit.reg + "," + e.exit.life + "," + e.exit.econ + "\n";
        }
    }

    return out;
}

blackHoleSuns.prototype.displayEntryList = function (entrylist, entry) {
    if (!entrylist && !entry)
        return;

    bhs.drawList(entrylist);

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

                    l = /xdata/ [Symbol.replace](l, entry.exitbase ? entry.exitbase[t.field] : "");
                } else {
                    if (entry.bh && entry.bh[t.field])
                        l = /bhdata/ [Symbol.replace](l, entry.bh[t.field]);
                    else if (entry.dz && entry.dz[t.field])
                        l = /bhdata/ [Symbol.replace](l, entry.dz[t.field]);
                    else
                        l = /bhdata/ [Symbol.replace](l, "");

                    l = /xdata/ [Symbol.replace](l, entry.exit && entry.exit[t.field] ? entry.exit[t.field] : "");
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
        let id = (entry.bh ? entry.bh.connection : entry.dz ? entry.dz.addr : entry.exit.addr).nameToId();
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
                if (entry.exit)
                    loc.find("#x-" + t.id).text(entry.exit[t.field] ? entry.exit[t.field] : "")
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
    id: "id-ctst",
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
        tot.find("#tgalaxy").show();
    } else if (findex) {
        tot.find("#id-showall").show();
        tot.find("#tgalaxy").hide();
    }

    tot.find("#ck-showall").change(function () {
        if ($(this).prop("checked"))
            bhs.displayAllUTotals(bhs.user);
        else
            bhs.clearAllUTotals(bhs.user);
    });

    if (!bhs.contest) {
        tot.find("#id-ctst").hide();
        tot.find("#id-contestall").hide();
    }
}

blackHoleSuns.prototype.displayTotals = function (entry, id) {
    let fgal = window.location.pathname == "/galaxy.html";
    let cid = "";

    if (bhs.contest && bhs.contest.name) {
        let now = firebase.firestore.Timestamp.fromDate(new Date());
        let s = "<h5>Contest: \"" + bhs.contest.name + "\"; ";
        s += " Starts: " + bhs.contest.start.toDate().toDateLocalTimeString() + "; ";
        s += " Ends: " + bhs.contest.end.toDate().toDateLocalTimeString() + (now > bhs.contest.end ? " CLOSED" : "");
        s += "</h5>";

        $("#totals #cname").html(s);
    }

    if (id.match(/totals/)) {
        cid = "id-totalsall";
        bhs.displayUTotals(entry[starsCol], cid);
        if (fgal)
            bhs.displayGTotals(entry, "itmg");
    } else if (id.match(/contest/)) {
        if (!bhs.contest)
            return;
        cid = "id-contestall";
        if (fgal)
            bhs.displayGTotals(entry, "itmg", true);
    } else if (id.match(/players/)) {
        bhs.displayPlayerTotals(entry, "itm1");
        return;
    } else if (id.match(/user/)) {
        bhs.displayUserTotals(entry, "itm1", true);
        cid = "id-player";
    } else if (id.match(/org/)) {
        bhs.displayUserTotals(entry, "itm2");
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
    for (var i = 0; i < list.length; i++) {
        loc.append(list[i]);
        if ($(list[i]).find("#id-uid").length > 0)
            loc.find("#" + $(list[i]).prop("id")).dblclick(function () {
                console.log($(this).find("#id-names").text().stripMarginWS() + " " + $(this).find("#id-uid").text().stripMarginWS());
                if (fgal) {
                    bhs.entries = {};
                    let galaxy = $("#btn-Galaxy").text().stripNumber();
                    let platform = $("#btn-Platform").text().stripMarginWS();
                    $("#btn-Player").text($(this).find("#id-names").text().stripMarginWS());
                    bhs.getEntries(bhs.displayEntryList, $(this).find("#id-uid").text().stripMarginWS(), galaxy, platform);
                }
            });
    }

    loc = $("#itm2");
    list = loc.children();
    if (list.length > 0) {

        if (fgal)
            list.sort((a, b) => $(a).prop("id").toLowerCase() > $(b).prop("id").toLowerCase() ? 1 :
                $(a).prop("id").toLowerCase() < $(b).prop("id").toLowerCase() ? -1 : 0);
        else
            list.sort((a, b) => parseInt($(a).find("#id-qty").text()) < parseInt($(b).find("#id-qty").text()) ? 1 :
                parseInt($(a).find("#id-qty").text()) > parseInt($(b).find("#id-qty").text()) ? -1 : 0);

        loc.empty();
        for (var i = 0; i < list.length; i++) {
            loc.append(list[i]);
            if (fgal) {
                loc.find("#" + $(list[i]).prop("id")).dblclick(function () {
                    bhs.entries = {};
                    let galaxy = $("#btn-Galaxy").text().stripNumber();
                    let platform = $("#btn-Platform").text().stripMarginWS();
                    $("#btn-Player").text("");
                    bhs.getOrgEntries(bhs.displayEntryList, $(this).find("#id-names").text().stripMarginWS(), galaxy, platform);
                });
            }
        }
    }

    if (entry.uid != bhs.user.uid)
        return;

    bhs.displayUTotals(entry[starsCol], cid);

    if (cid == "id-player" && entry[starsCol] && entry[starsCol].contest && bhs.contest) {
        cid = "id-contest";
        bhs.displayUTotals(entry[starsCol].contest[bhs.contest.name], cid);
    }
}

blackHoleSuns.prototype.displayUTotals = function (entry, cid) {
    let pnl = $("#itm0");
    if (typeof entry != "undefined") {
        pnl.find("#" + totalsRows[rowTotal].id + " #" + cid).text(entry.total);
        pnl.find("#" + totalsRows[rowPlatform].id + " #" + cid).text(entry[bhs.user.platform]);
        if (entry[bhs.user.platform == "PS4" ? "PC-XBox" : "PS4"])
            pnl.find("#" + totalsRows[rowAltPlatform].id + " #" + cid).text(entry[bhs.user.platform == "PS4" ? "PC-XBox" : "PS4"]);
        else
            pnl.find("#" + totalsRows[rowAltPlatform].id).hide();

        if (window.location.pathname == "/" || window.location.pathname == "/index.html")
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
    if (entry[starsCol]) {
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
    title: "uid",
    id: "id-uid",
    format: "col-1 hidden",
    hformat: "col-1 hidden",
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

blackHoleSuns.prototype.displayUserTotals = function (entry, id, bold) {
    let fgal = window.location.pathname == "/galaxy.html";

    if (entry[starsCol] && entry[starsCol].total > 0) {
        const userHdr = `<div id="u-idname" class="row">`;
        const userItms = `  <div id="idname" class="format">title</div>`;
        const userEnd = `</div>`;

        let pnl = $("#totals #" + id);
        let rid = typeof entry._name != "undefined" ? entry._name.nameToId() : entry.name ? entry.name.nameToId() : "-";
        let player = pnl.find("#u-" + rid);

        if (player.length == 0) {
            let h = /idname/ [Symbol.replace](userHdr, rid)

            totalsPlayers.forEach(function (x) {
                let l = /idname/ [Symbol.replace](userItms, x.id);
                l = /format/ [Symbol.replace](l, x.format + (bold ? " font-weight-bold" : ""));
                switch (x.title) {
                    case "Contributors":
                        h += /title/ [Symbol.replace](l, entry._name ? entry._name : entry.name);
                        break;
                    case "uid":
                        h += /title/ [Symbol.replace](l, entry.uid ? entry.uid : "");
                        break;
                    case "Contest":
                        let disq = false;
                        if (bhs.contest) {
                            let d = Object.keys(bhs.contest.disq.orgs);
                            for (let i = 0; i < d.length && !disq; ++i)
                                if (bhs.contest.disq.orgs[d[i]] == entry.name)
                                    disq = true;

                            d = Object.keys(bhs.contest.disq.users);
                            for (let i = 0; i < d.length && !disq; ++i)
                                if (bhs.contest.disq.users[d[i]].uid == entry.uid)
                                    disq = true;

                            h += /title/ [Symbol.replace](l, bhs.contest.name && entry[starsCol].contest ? disq ? "--" : entry[starsCol].contest[bhs.contest.name].total : "");
                        }
                        break;
                    case "Total":
                        h += /title/ [Symbol.replace](l, entry[starsCol].total);
                        break;
                }
            });

            h += userEnd;

            pnl.append(h);
        } else {
            player.find("#id-qty").text(entry[starsCol].total);
            if (bhs.contest)
                player.find("#id-ctst").text(bhs.contest.name && entry[starsCol].contest ? entry[starsCol].contest[bhs.contest.name].total : "");
        }
    }

    $("#totals #id-uid").hide();

    if (!bhs.contest)
        $("#totals #id-ctst").hide();
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
                                h += /title/ [Symbol.replace](l, g.total);
                                break;
                            case "Total":
                                h += /title/ [Symbol.replace](l, g.total);
                                break;
                            case "PC-XBox":
                                h += /title/ [Symbol.replace](l, g['PC-XBox']);
                                break;
                            case "PS4":
                                h += /title/ [Symbol.replace](l, g["PS4"]);
                                break;
                        }
                    });

                    h += userEnd;

                    pnl.append(h);
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

    if (!bhs.contest)
        $("#totals #id-ctst").hide();
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

        mlist.find("#item-" + lid).unbind("click");
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
    let ok;

    if ((ok = bhs.validateUser(user))) {
        bhs.updateUser(user);
        bhs.displayUser(user);
    }
    return ok;
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
    color: "#00ffff",
    size: 4,
}, {
    name: "Exit",
    id: "clr-exit",
    color: "#ffff00",
    size: 2,
}, {
    name: "Dead Zone",
    id: "clr-dz",
    color: "#ff0000",
    size: 2,
}, {
    name: "Base",
    id: "clr-base",
    color: "#00ff00",
    size: 2,
}, {
    name: "Connection",
    id: "clr-con",
    color: "#0000ff",
}, {
    name: "Map Bkg",
    id: "clr-bkg",
    color: "#808080",
}, {
    name: "Page Bkg",
    id: "clr-page",
    color: "#c0c0c0",
}, {
    name: "Grid",
    id: "clr-grid",
    color: "#000000",
}];

const minmaxtable = [{
        id: "xmin",
        val: 0
    },
    {
        id: "xmax",
        val: 4095
    },
    {
        id: "ymin",
        val: 0
    },
    {
        id: "ymax",
        val: 255
    },
    {
        id: "zmin",
        val: 0
    },
    {
        id: "zmax",
        val: 4095
    },
];

blackHoleSuns.prototype.extractMapOptions = function () {
    let c = {};
    let opt = $("#mapkey");

    for (let i = 0; i < colortable.length; ++i) {
        c[colortable[i].id] = opt.find("#sel-" + colortable[i].id).val();
        c["inp-" + colortable[i].id] = opt.find("#inp-" + colortable[i].id).val();
    }

    opt = $("#mapoptions");
    c.zoomsz = 5;
    for (let i = 0; i < minmaxtable.length; ++i)
        c[minmaxtable[i].id] = parseInt(opt.find("#inp-" + minmaxtable[i].id).val());

    c.ctrcord = bhs.reformatAddress(opt.find("#inp-ctrcord").val());
    c.ctrzoom = parseInt(opt.find("#inp-ctrzoom").val());
    c.chaindepth = parseInt(opt.find("#inp-chaindepth").val());
    c.chainradius = parseInt(opt.find("#inp-chainradius").val());

    c.connection = opt.find("#ck-drawcon").prop("checked");
    c.map3d = opt.find("#ck-3dmap").prop("checked");
    //c.exit = opt.find("#ck-drawexits").prop("checked");
    c.base = opt.find("#ck-drawbase").prop("checked");
    c.zoomreg = opt.find("#ck-zoomreg").prop("checked");
    c.addzero = opt.find("#ck-addzero").prop("checked");
    c.chain = opt.find("#ck-chain").prop("checked");

    return c;
}

blackHoleSuns.prototype.setMapOptions = function (entry) {
    let findex = window.location.pathname == "/" || window.location.pathname == "/index.html";
    let opt = $("#mapoptions");

    if (!findex) {
        opt.find("#id-drawbase").hide();
        opt.find("#id-drawcon").hide();
        opt.find("#id-zoomreg").hide();
    }

    if (typeof entry.mapoptions != "undefined") {
        opt = $("#mapkey");
        for (let i = 0; i < colortable.length; ++i) {
            opt.find("#sel-" + colortable[i].id).val(entry.mapoptions[colortable[i].id] ? entry.mapoptions[colortable[i].id] : colortable[i].color);
            if (typeof colortable[i].size != "undefined") {
                opt.find("#inp-" + colortable[i].id).val(entry.mapoptions["inp-" + colortable[i].id] ? entry.mapoptions["inp-" + colortable[i].id] : colortable[i].size);
                opt.find("#inp-" + colortable[i].id).show();
            }
        }

        opt = $("#mapoptions");
        for (let i = 0; i < minmaxtable.length; ++i)
            opt.find("#inp-" + minmaxtable[i].id).val(entry.mapoptions[minmaxtable[i].id] ? entry.mapoptions[minmaxtable[i].id] : minmaxtable[i].val);

        opt.find("#inp-ctrcord").val(entry.mapoptions.ctrcord ? entry.mapoptions.ctrcord : "07FF:007F:07FF:0000");
        opt.find("#inp-ctrzoom").val(entry.mapoptions.ctrzoom ? entry.mapoptions.ctrzoom : 5);
        opt.find("#inp-chaindepth").val(entry.mapoptions.chaindepth ? entry.mapoptions.chaindepth : 1);
        opt.find("#inp-chainradius").val(entry.mapoptions.chainradius ? entry.mapoptions.chainradius : 1);

        opt.find("#ck-drawcon").prop("checked", typeof entry.mapoptions.connection != "undefined" ? entry.mapoptions.connection : false);
        opt.find("#ck-3dmap").prop("checked", typeof entry.mapoptions.map3d != "undefined" ? entry.mapoptions.map3d : true);
        opt.find("#ck-drawexits").prop("checked", typeof entry.mapoptions.exit != "undefined" ? entry.mapoptions.exit : false);
        opt.find("#ck-drawbase").prop("checked", typeof entry.mapoptions.base != "undefined" ? entry.mapoptions.base : false);
        opt.find("#ck-zoomreg").prop("checked", typeof entry.mapoptions.zoomreg != "undefined" ? entry.mapoptions.zoomreg : false);
        opt.find("#ck-addzero").prop("checked", typeof entry.mapoptions.addzero != "undefined" ? entry.mapoptions.addzero : true);
        opt.find("#ck-chain").prop("checked", typeof entry.mapoptions.chain != "undefined" ? entry.mapoptions.chain : true);
    } else
        bhs.resetMapOptions();
}

blackHoleSuns.prototype.resetMapOptions = function (entry) {
    let findex = window.location.pathname == "/" || window.location.pathname == "/index.html";
    let opt = $("#mapoptions");

    opt = $("#mapkey");
    for (let i = 0; i < colortable.length; ++i) {
        opt.find("#sel-" + colortable[i].id).val(colortable[i].color);
        if (typeof colortable[i].size != "undefined") {
            opt.find("#inp-" + colortable[i].id).val(colortable[i].size);
            opt.find("#inp-" + colortable[i].id).show();
        }
    }

    opt = $("#mapoptions");
    for (let i = 0; i < minmaxtable.length; ++i)
        opt.find("#inp-" + minmaxtable[i].id).val(minmaxtable[i].val);

    opt.find("#inp-ctrcord").val("07FF:007F:07FF:0000");
    opt.find("#inp-ctrzoom").val(5);
    opt.find("#inp-chaindepth").val(1);
    opt.find("#inp-chainradius").val(1);

    opt.find("#ck-drawcon").prop("checked", false);
    opt.find("#ck-3dmap").prop("checked", true);
    opt.find("#ck-drawexits").prop("checked", false);
    opt.find("#ck-drawbase").prop("checked", false);
    opt.find("#ck-zoomreg").prop("checked", false);
    opt.find("#ck-addzero").prop("checked", true);
    opt.find("#ck-chain").prop("checked", false);
}

blackHoleSuns.prototype.buildMap = function () {
    let w = $("#plymap").width();
    $("#plymap").prop("width", w);
    $("#plymap").prop("height", w);

    w = $("#maplogo").width();
    $("#logo").prop("width", w);
    $("#logo").prop("height", w);

    const settings = `
        <br>
        <div class="row">
            <div id="id-mapinp" class="col-6">
                <div class="row">
                    <div class="col-1"></div>
                    <div class="col-5 txt-def">Min</div>
                    <div class="col-5 txt-def">Max</div>
                </div>
                <div class="row">
                    <div class="col-1 txt-def">X</div>
                    <input id="inp-xmin" type="number" class="rounded col-5 txt-def" min="0" max="4095" value="0">
                    <input id="inp-xmax" type="number" class="rounded col-5 txt-def" min="0" max="4095" value="4095">
                </div>
                <div class="row">
                    <div class="col-1 txt-def">Z</div>
                    <input id="inp-zmin" type="number" class="rounded col-5 txt-def" min="0" max="4095" value="0">
                    <input id="inp-zmax" type="number" class="rounded col-5 txt-def" min="0" max="4095" value="4095">
                </div>
                <div class="row">
                    <div class="col-1 txt-def">Y</div>
                    <input id="inp-ymin" type="number" class="rounded col-5 txt-def" min="0" max="255" value="0">
                    <input id="inp-ymax" type="number" class="rounded col-5 txt-def" min="0" max="255" value="255">
                </div>
            </div>

            <div class="col-8 border-left">
               <label class="col-5 h6 txt-def">
                    <input id="ck-3dmap" type="checkbox" checked>
                    3D Map
                </label>
                <label id="id-drawcon" class="col-8 h6 txt-def">
                    <input id="ck-drawcon" type="checkbox" checked>
                    Draw Connections
                </label>
                <!--label class="col-8 h6 txt-def">
                    <input id="ck-drawexits" type="checkbox" checked>
                    Draw Exits
                </label-->
                <label id="id-drawbase" class="col-8 h6 txt-def">
                    <input id="ck-drawbase" type="checkbox" checked>
                    Draw Bases
                </label>

                <label id="id-zoomreg" class="col-14 h6 txt-def">
                    <input id="ck-zoomreg" type="checkbox" checked>
                    Auto Zoom Reg Search (zoom radius)
                </label>

                <div class="row">
                    <label class="col-8 h6 txt-def">
                        <input id="ck-chain" type="checkbox" checked>
                        Select Chain&nbsp;
                        <input id="inp-chaindepth" type="number" class="rounded col-7 txt-def" min="0">
                    </label> 
                    <label class="col-6 h6 txt-def">
                        Radius&nbsp;
                        <input id="inp-chainradius" type="number" class="rounded col-8 txt-def" min="1">
                   </label>
                </div>
            </div>
        </div>
        <br>
        <div class="border-top">&nbsp;</div>

        <div class="row">
            <div class="h6 txt-def align-bottom">&nbsp;Zoom:&nbsp;</div>
            <label class="col-6 h6 txt-def">Coord&nbsp;
                <input id="inp-ctrcord" type="text" class="rounded col-10 txt-def" placeholder="07FF:007F:07FF:0000">
            </label>
            <label class="col-4 h6 txt-def">Radius&nbsp;
                <input id="inp-ctrzoom" type="number" class="rounded col-6 txt-def" min="0" max="2048">
            </label>
            <label class="col-3 h6 txt-def">
            <input id="ck-addzero" type="checkbox" checked>
                &nbsp;Add 0
            </label>
        </div>
        <br>

        <div class="row">
            <button id="btn-mapsave" type="button" class="col-2 border btn btn-sm btn-def">Save</button>&nbsp;
            <button id="btn-mapreset" type="button" class="col-2 border btn btn-sm btn-def">Reset</button>&nbsp;
            <div class="col-9 border">
                <div class="col-14 h6 clr-creme text-center">Click on map to select system & draw connections.</div>
                <div class="col-14 h6 clr-creme text-center">Click on color box in map key to change colors. Then click redraw.</div>
            </div>
        </div>`;

    let opt = $("#mapoptions");
    opt.empty();
    opt.html(settings);

    const key = `
    <div class="col-7">
        <div class="row">
            <div id="idname" class="col-5 text-center">title</div>
            <input id="sel-idname" class="col-4 bkg-def" style="border-color:black" type="color" value="colorsel">
            <input id="inp-idname" type="number" class="rounded col-4 txt-def hidden" min="0" max="20">
        </div>
    </div>`;

    let keyloc = $("#mapkey");
    keyloc.empty();

    colortable.forEach(c => {
        let h = /idname/g [Symbol.replace](key, c.id);
        h = /colorsel/g [Symbol.replace](h, c.color);
        h = /title/g [Symbol.replace](h, c.name);
        keyloc.append(h);
    });

    $("#btn-redraw").unbind("click");
    $("#btn-redraw").click(function () {
        bhs.drawList(bhs.entries);
    });

    $("#btn-mapsave").unbind("click");
    opt.find("#btn-mapsave").click(function () {
        bhs.updateUser({
            mapoptions: bhs.extractMapOptions()
        });
        bhs.drawList(bhs.entries);
    });

    $("#btn-mapreset").unbind("click");
    opt.find("#btn-mapreset").click(function () {
        bhs.resetMapOptions();
        bhs.drawList(bhs.entries);
    });

    for (let i = 0; i < minmaxtable.length; ++i) {
        $("#inp-" + minmaxtable[i].id).unbind("change");
        opt.find("#inp-" + minmaxtable[i].id).change(function () {
            bhs.changeMapLayout(true);
        });
    }

    $("#inp-ctrcord").unbind("change");
    opt.find("#inp-ctrcord").change(function () {
        bhs.changeMapLayout(true, true);
    });

    $("#inp-ctrzoom").unbind("change");
    opt.find("#inp-ctrzoom").change(function () {
        bhs.changeMapLayout(true, true);
    });

    let zero = {
        x: 2048,
        y: 128,
        z: 2048,
    };

    opt = bhs.extractMapOptions();
    let layout = bhs.changeMapLayout();
    let data = [];
    let out = initout();
    pushentry(out, zero);
    data.push(makedata(opt, out, 6, "#ffffff"));

    Plotly.newPlot('plymap', data, layout).then(plot => {
        plot.on('plotly_click', function (e) {
            setTimeout(function () {
                if (e.points.length > 0 && e.points[0].text) {
                    if (window.location.pathname == "/index.html" || window.location.pathname == "/")
                        bhs.getEntry(e.points[0].text.slice(0, 19), bhs.displaySingle, 0);

                    let addr = bhs.addressToXYZ(e.points[0].text.slice(0, 19));
                    let opt = bhs.extractMapOptions();

                    bhs.mapped = {};
                    bhs.drawChain(opt, addr, opt.chain ? opt.chaindepth : 1);
                    bhs.drawChain(opt, addr, opt.chain ? opt.chaindepth : 1, true);
                    delete bhs.mapped;
                }
            }, 1000);
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

    $("#btn-mapsettings").unbind("click");
    $("#btn-mapsettings").click(function () {
        if ($("#showmapkey").is(":hidden")) {
            $("#showmapkey").show();
            $("#showmapoptions").show();
        } else {
            $("#showmapkey").hide();
            $("#showmapoptions").hide();
        }
    });
}

blackHoleSuns.prototype.drawList = function (listEntry) {
    let findex = window.location.pathname == "/" || window.location.pathname == "/index.html";

    let opt = bhs.extractMapOptions();
    if (!findex)
        opt.connection = false;

    let out = {};
    let data = [];

    let k = Object.keys(listEntry);
    for (let i = 0; i < k.length; ++i) {
        let entry = listEntry[k[i]];
        if (opt.connection && entry.bh && entry.exit) {
            let out = initout();
            pushentry(out, entry.bh.xyzs, entry.bh.addr + "<br>" + entry.bh.sys + "<br>" + entry.bh.reg);
            pushentry(out, entry.exit.xyzs, entry.exit.addr + "<br>" + entry.exit.sys + "<br>" + entry.exit.reg);
            data.push(makedata(opt, out, 4, opt["clr-bh"], opt["clr-con"], true));
        } else {
            let t = Object.keys(entry);
            for (let i = 0; i < t.length; ++i) {
                out[t[i]] = initout(out[t[i]]);
                let e = entry[t[i]];
                let text = e.addr + "<br>" + e.sys + "<br>" + e.reg;

                if (t[i].match(/base/))
                    text += "<br>" + e.basename;

                pushentry(out[t[i]], e.xyzs, text);
            }
        }
    }

    let o = Object.keys(out);
    for (let i = 0; i < o.length; ++i) {
        let color = opt["clr-bh"];
        let size = opt["inp-clr-bh"];
        switch (o[i]) {
            case "dz":
                color = opt["clr-dz"];
                size = opt["inp-clr-dz"];
                break;
            case "exit":
                color = opt["clr-exit"];
                size = opt["inp-clr-exit"];
                break;
            case "bhbase":
            case "exitbase":
                color = opt["clr-base"];
                size = opt["inp-clr-base"];
                break;
        }

        if (size > 0)
            data.push(makedata(opt, out[o[i]], size, color));
    }

    Plotly.react('plymap', data, bhs.changeMapLayout());
}

blackHoleSuns.prototype.drawSingle = function (entry) {
    let opt = bhs.extractMapOptions();
    let out = initout();

    let text = entry.addr + "<br>" + entry.sys + "<br>" + entry.reg;
    if (entry.basename)
        text += "<br>" + entry.basename;

    pushentry(out, entry.xyzs, text);

    let color;

    if (entry.blackhole)
        color = opt["clr-bh"];
    else if (entry.deadzone)
        color = opt["clr-dz"];
    else if (entry.basename)
        color = opt["clr-base"];
    else
        color = opt["clr-exit"];

    Plotly.addTraces('plymap', makedata(opt, out, 10, color));
}

blackHoleSuns.prototype.drawChain = function (opt, xyz, depth, up) {
    if (depth-- > 0) {
        let list = bhs.findClose(opt, xyz, up);

        let keys = Object.keys(list);
        for (let i = 0; i < keys.length; ++i) {
            let d = list[keys[i]];
            if (d.bh && d.exit && !bhs.mapped[d.bh.addr]) {
                bhs.mapped[d.bh.addr] = true;

                let out = initout();
                pushentry(out, d.bh.xyzs);
                pushentry(out, d.exit.xyzs);

                Plotly.addTraces('plymap', makedata(opt, out, 5, opt["clr-bh"], opt["clr-con"], true));

                bhs.drawChain(opt, d.exit.xyzs, depth);
                bhs.drawChain(opt, d.bh.xyzs, depth, true);
            }
        }
    }
}

blackHoleSuns.prototype.findClose = function (opt, xyz, up) {
    let list = Object.keys(bhs.entries);
    let out = {};

    for (let i = 0; i < list.length; ++i) {
        let e = bhs.entries[list[i]];

        if (e.bh && e.exit) {
            if (!up && Math.abs(e.bh.xyzs.x - xyz.x) <= opt.chainradius && Math.abs(e.bh.xyzs.y - xyz.y) <= opt.chainradius && Math.abs(e.bh.xyzs.z - xyz.z) <= opt.chainradius)
                out[list[i]] = e;
            if (up && Math.abs(e.exit.xyzs.x - xyz.x) <= opt.chainradius && Math.abs(e.exit.xyzs.y - xyz.y) <= opt.chainradius && Math.abs(e.exit.xyzs.z - xyz.z) <= opt.chainradius)
                out[list[i]] = e;
        }
    }

    return out;
};

blackHoleSuns.prototype.changeMapLayout = function (exec, zoom) {
    let opt = bhs.extractMapOptions();
    let ctr = bhs.addressToXYZ(opt.ctrcord);
    ctr.z = 4096 - ctr.z;

    let xstart, xctr, xend;
    let ystart, yctr, yend;
    let zstart, zctr, zend;

    if (zoom) {
        xstart = ctr.x - opt.ctrzoom;
        xctr = ctr.x + parseInt(opt.ctrzoom / 2);
        xend = ctr.x + opt.ctrzoom;

        ystart = ctr.z - opt.ctrzoom;
        yctr = ctr.z + parseInt(opt.ctrzoom / 2);
        yend = ctr.z + opt.ctrzoom;

        zstart = ctr.y - opt.ctrzoom;
        zctr = ctr.y + parseInt(opt.ctrzoom / 2);
        zend = ctr.y + opt.ctrzoom;
    } else {
        xstart = opt.xmin;
        xctr = opt.xmin + parseInt((opt.xmax - opt.xmin) / 2) - 1;
        xend = opt.xmax - 1;

        zstart = opt.ymin;
        zctr = opt.ymin + parseInt((opt.ymax - opt.ymin) / 2) - 1;
        zend = opt.ymax - 1;

        ystart = opt.zmin;
        yctr = opt.zmin + parseInt((opt.zmax - opt.zmin) / 2) - 1;
        yend = opt.zmax - 1;
    }

    let layout = {
        hovermode: "closest",
        showlegend: false,
        paper_bgcolor: opt["clr-page"],
        plot_bgcolor: opt["clr-bkg"],
        scene: {
            zaxis: {
                backgroundcolor: opt["clr-bkg"],
                gridcolor: opt["clr-grid"],
                zerolinecolor: opt["clr-grid"],
                showbackground: true,
                title: {
                    text: "Y",
                    font: {
                        color: opt["clr-grid"],
                    }
                },
                range: [zstart, zend],
                tickvals: [zstart, zctr, zend],
                ticktext: [zstart.toString(16), zctr.toString(16), zend.toString(16)],
                tickfont: {
                    color: opt["clr-grid"]
                },
                tickangle: 45,
            },
            xaxis: {
                backgroundcolor: opt["clr-bkg"],
                gridcolor: opt["clr-grid"],
                zerolinecolor: opt["clr-grid"],
                showbackground: true,
                title: {
                    text: "X",
                    font: {
                        color: opt["clr-grid"],
                    }
                },
                range: [xstart, xend],
                tickvals: [xstart, xctr, xend],
                ticktext: [xstart.toString(16), xctr.toString(16), xend.toString(16)],
                tickfont: {
                    color: opt["clr-grid"]
                },
                tickangle: 45,
            },
            yaxis: {
                backgroundcolor: opt["clr-bkg"],
                gridcolor: opt["clr-grid"],
                zerolinecolor: opt["clr-grid"],
                title: {
                    text: "Z",
                    font: {
                        color: opt["clr-grid"],
                    }
                },
                showbackground: true,
                range: [ystart, yend],
                tickvals: [ystart, yctr, yend],
                ticktext: [yend.toString(16), yctr.toString(16), ystart.toString(16)],
                tickfont: {
                    color: opt["clr-grid"]
                },
                tickangle: 45,
            },
        },
        // images: [{
        //     x: 100,
        //     y: 100,
        //     sizex: 1000,
        //     sizey: 1000,
        //     source: "lBTK5EL.png",
        //     xanchor: "right",
        //     xref: "paper",
        //     yanchor: "bottom",
        //     yref: "paper"
        // }]
    };

    if (opt.map3d) {
        layout.margin = {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        };
    }

    if (exec) Plotly.relayout('plymap', layout);

    return layout;
}

blackHoleSuns.prototype.traceZero = function (addr) {
    let opt = bhs.extractMapOptions();

    if (opt.addzero) {
        let zero = {
            x: 2048,
            y: 128,
            z: 2048,
        };

        let out = initout();
        pushentry(out, zero);
        pushentry(out, addr.xyzs);
        Plotly.addTraces('plymap', makedata(opt, out, 5, opt["clr-bh"], opt["clr-con"], true));
    }
}

function pushentry(data, xyz, label, alt) {
    data.x.push(xyz.x);
    data.y.push(4095 - xyz.z);
    data.z.push(xyz.y);
    data.t.push(label);
    data.a.push(alt);
};

function initout(out) {
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

function makedata(opt, out, size, color, linecolor, lines) {
    let line = {
        x: out.x,
        y: out.y,
        z: out.z,
        text: out.t,
        altdata: out.a,
        mode: 'markers',
        marker: {
            size: size,
            color: color,
            opacity: 0.5,
        },
        type: opt.map3d ? "scatter3d" : "scatter",
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