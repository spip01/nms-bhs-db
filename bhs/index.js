'use strict';

$(document).ready(function () {
    startUp();

    bhs.last = [];

    bhs.buildUserPanel();
    bhs.buildFilePanel();

    panels.forEach(function (p) {
        bhs.buildPanel(p.id);
    });

    $("#save").click(function () {
        bhs.save();
    });

    $("#delete").click(function () {
        panels.forEach(function (p) {
            bhs.deleteEntry($("#" + p.id + " #id-addr").val());
        });

        bhs.clearPanels();
        bhs.last = [];
    });

    $("#cancel").click(function () {
        bhs.displaySingle($("#" + panels[pnlTop].id), bhs.last[pnlTop], pnlTop);
    });
})

const pnlTop = 0;
const pnlBottom = 1;

var panels = [{
    name: "System 1",
    id: "pnl-S1",
    listid: "S1",
    calc: true,
}, {
    name: "System 2",
    id: "pnl-S2",
    listid: "S2",
    calc: true,
}];

const ownershipList=[{name:"mine"},{name:"visited"},{name:"station"}];

blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom bkg-trans-2">
            <div class="card-body">
                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Address&nbsp;</div>
                    <input id="id-addr" class="rounded col-9" placeholder="0000:0000:0000:0000">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">System Name&nbsp;</div>
                    <input id="id-sys" class="rounded col-9">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Region Name&nbsp;</div>
                    <input id="id-reg" class="rounded col-9">
                </div>

                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Lifeform" class="col-6"></div>
                    <div id="id-Economy" class=" col-7"></div>
                </div>

                <div class="row">
                    <label class="col-7 h6 txt-inp-def">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>
                </div>

                <div id="id-isbase" class="row" style="display:none">
                    <div class="col-3 h6 txt-inp-def">Name</div>
                    <input id="id-basename" class="rounded col-5">
                    <div id="id-Owned" class="col-6"></div>
                </div>

                <div id="id-pnl1-only" class="row">
                    <div class="col-4">
                        <label class="h6 txt-inp-def">
                            <input id="ck-single" type="checkbox">
                            Single System
                        </label>
                    </div>

                    <div class="col-4">
                        <label class="h6 txt-inp-def">
                            <input id="ck-isdz" type="checkbox">
                            Dead Zone
                        </label>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-8 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right">Distance (ly): From Center&nbsp;</div>
                            <div id="fmcenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-tocenter" class="col-6 txt-inp-def" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br>`;

    let h = /idname/g [Symbol.replace](panel, id);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);
    bhs.buildMenu(loc, "Owned", ownershipList);

    loc.find("#id-addr").blur(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);

        let pnl = $(this).closest("[id|='pnl'");
        let top = pnl.prop("id") == panels[pnlTop].id;
        bhs.getEntry(addr, bhs.displaySingle, top ? pnlTop : pnlBottom);

        // if not found try getting region

        bhs.displayCalc();
    });

    loc.find("#id-addr").keyup(function(event) {
        if (event.keyCode === 13) {
            $(this).blur();
        }
    });


    loc.find('#ck-hasbase').change(function () {
        let pnl = $(this).closest("[id|='pnl'");

        if ($(this).prop("checked"))
            pnl.find("#id-isbase").show();
        else
            pnl.find("#id-isbase").hide();
    });

    $("#" + panels[pnlBottom].id + " #id-pnl1-only").hide();

    loc.find('#ck-single, #ck-isdz').change(function () {
        let pnl = $("#" + panels[pnlBottom].id);
        if ($(this).prop("checked"))
            pnl.hide();
        else
            pnl.show();
    });
}

blackHoleSuns.prototype.displaySingle = function (entry, idx) {
    let loc = $("#" + panels[idx].id);

    if (entry) {
        loc.find("#id-addr").val(entry.addr);
        loc.find("#id-sys").val(entry.sys);
        loc.find("#id-reg").val(entry.reg);
        loc.find("#btn-Lifeform").text(entry.life);
        loc.find("#ck-isdz").prop("checked", entry.deadzone);
        loc.find("#ck-hasbase").prop("checked", false);

        if (entry.hasbase) {
            loc.find("#ck-hasbase").prop("checked", true);
            bhs.getBase(entry, bhs.displayBase, idx);
            loc.find("#id-isbase").show();
        } else {
            loc.find("#id-basename").val("");
            loc.find("#id-isbase").hide();
        }

        if (entry.econ) {
            let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].number;
            loc.find("#btn-Economy").text(l + " " + entry.econ);
            loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
        }

        if (entry.blackhole)
            bhs.getEntry(entry.connection, bhs.displaySingle, pnlBottom);

        if (entry.blackhole || idx == pnlBottom) {
            loc.find("#ck-single").prop("checked", false);
            $("#" + panels[pnlBottom].id).show();
        } else {
            loc.find("#ck-single").prop("checked", true);
            $("#" + panels[pnlBottom].id).hide();
        }

        bhs.displayCalc();

        $("#delete").removeClass("disabled");
        $("#delete").removeAttr("disabled");

        bhs.last[idx] = entry;
    } else {
        loc.find("#id-addr").val("");
        loc.find("#id-sys").val("");
        loc.find("#id-reg").val("");
        loc.find("#btn-Lifeform").text("");
        loc.find("#ck-isdz").prop("checked", false);
        loc.find("#ck-hasbase").prop("checked", false);
        loc.find("#btn-Economy").text("");
        loc.find("#id-fmcenter").hide();
        loc.find("#id-tocenter").hide();
    }
}

blackHoleSuns.prototype.displayBase = function (entry, idx) {
    $("#" + panels[idx].id + " #id-isbase").show();
    $("#" + panels[idx].id + " #id-basename").val(entry ? entry.basename : "");
    $("#" + panels[idx].id + " #btn-Owned").text(entry ? entry.owned : "");
}

blackHoleSuns.prototype.clearPanels = function () {
    panels.forEach(function (d) {
        bhs.clearPanel(d.id);
    });

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (d) {
    let pnl = $("#" + d.id);

    pnl.find("[id|='inp'").each(function () {
        pnl.val("");
    });

    pnl.find("[id|='ck'").each(function () {
        pnl.prop("checked", false);
    });

    pnl.find("[id|='menu']").each(function () {
        pnl.find("[id|='btn']").text("");
    });

    pnl.find("#id-isbase").hide();
    pnl.find("#id-fmcenter").hide();
    pnl.find("#id-tocenter").hide();
}

blackHoleSuns.prototype.extractEntry = async function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    entry.player = bhs.user.player;
    entry.org = bhs.user.org;
    entry.uid = bhs.user.uid;
    entry.platform = bhs.user.platform;
    entry.galaxy = bhs.user.galaxy;

    entry.addr = loc.find("#id-addr").val();
    entry.sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
    entry.hasbase = loc.find("#ck-hasbase").prop("checked");
    entry.dist = bhs.calcDist(entry.addr);
    let single = loc.find("#ck-single").prop("checked");

    if (idx == pnlTop) {
        if (loc.find("#ck-isdz").prop("checked"))
            entry.deadzone = true;

        if (!entry.deadzone && !single) {
            entry.blackhole = true;
            entry.connection = pnl.find("#" + panels[pnlBottom].id + " #id-addr").val();
            entry.towardsCtr = entry.dist - bhs.calcDist(entry.connection);
        }
    }

    let ok = true;
    if (ok = bhs.validateEntry(entry)) {
        if (entry.blackhole) {
            ok = bhs.validateDist(entry);

            if (ok)
                ok = bhs.extractEntry(pnlBottom);
        }

        if (ok) {
            await bhs.updateEntry(entry, true);

            if (entry.hasbase) {
                entry.basename = loc.find("#id-basename").val();
                entry.owned = loc.find("#btn-Owned").text().stripNumber();
                entry.owned = entry.owned ? entry.owned : "mine";
                await bhs.updateBase(entry, true)
            }

            if (!entry.blackhole)
                bhs.updateAllTotals(bhs.totals);
        }
    }

    return ok;
}

blackHoleSuns.prototype.save = function () {
    $("#status").empty();
    bhs.extractEntry(pnlTop);
    bhs.clearPanels();
    bhs.last = [];
}

blackHoleSuns.prototype.displayCalc = function () {
    let top = $("#" + panels[pnlTop].id);
    let bottom = $("#" + panels[pnlBottom].id);

    let addr = top.find("#id-addr").val();
    let connection = bottom.find("#id-addr").val();

    let tdist = bhs.calcDist(addr);

    top.find("#fmcenter").text(tdist);
    top.find("#id-fmcenter").show();

    if (connection) {
        let bdist = bhs.calcDist(connection);

        bottom.find("#fmcenter").text(bdist);
        bottom.find("#id-fmcenter").show();

        bottom.find("#tocenter").text(tdist - bdist);
        bottom.find("#id-tocenter").show();

        let entry = {};
        entry.addr = addr;
        entry.connection = connection;
        entry.dist = tdist;
        entry.towardsCtr = tdist - bdist;
        if (!bhs.validateDist(entry))
            bottom.find("#id-tocenter").addClass("text-danger");
        else
            bottom.find("#id-tocenter").removeClass("text-danger");
    }
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h7>" + str + "</h7>");
}