'use strict';

$(document).ready(function () {
    startUp();

    bhs.last = [];

    bhs.buildUserPanel();

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

blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom">
            <div id="pnlname" class="h4 clr-dark-green card-header"></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-9 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Address</div>&nbsp;
                                        <input id="id-addr" class="rounded col-md-14 col-9" placeholder="0000:0000:0000:0000">
                                    </div>
                                </div>

                                <div class="col-md-4 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">System Name</div>&nbsp;
                                        <input id="id-sys" class="rounded col-md-14 col-9">
                                    </div>
                                </div>

                                <div class="col-md-5 col-13">
                                    <div class="row">
                                        <div class="col-md-14 col-4 h6 clr-dark-green">Region Name</div>&nbsp;
                                        <input id="id-reg" class="rounded col-md-14 col-9">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-5 col-14">
                        <div class="card card-body no-border">
                            <div class="row">
                                <div id="id-Lifeform" class="col-md-4 col-14"></div>
                                <div id="id-Economy" class="col-md-4 col-14"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <label class="col-3 h6 clr-dark-green">
                        <input id="ck-hasbase" type="checkbox">
                        Has Base
                    </label>
                    <div class="col-10">
                        <div id="id-isbase" class="row" style="display:none">
                            <div class="col-4 h6 clr-dark-green">Name</div>
                            <input id="id-basename" class="rounded col-6">
                        </div>
                    </div>
                </div>

                <div id="id-pnl1-only" class="row">
                    <div class="col-6">
                        <label class="h6 clr-dark-green">
                            <input id="ck-single" type="checkbox">
                            Single System
                        </label>
                    </div>

                    <div class="col-6">
                        <label class="h6 clr-dark-green">
                            <input id="ck-isdz" type="checkbox">
                            Dead Zone
                        </label>
                    </div>
                </div>

                <div class="row">
                    <div id="id-fmcenter" class="col-8 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right">Distance (ly): From Center&nbsp;</div>
                            <div id="fmcenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                        
                    <div id="id-tocenter" class="col-6 clr-dark-green" style="display:none">
                        <div class="row">
                            <div class="col-9 text-right"> Towards Center&nbsp;</div>
                            <div id="tocenter" class="col-5 text-left h6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    let h = /idname/g [Symbol.replace](panel, id);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    loc.find("#id-addr").blur(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);

        let pnl = $(this).closest("[id|='pnl'");
        if (pnl.find("#id-sys").val() == "" && pnl.find("#id-reg").val() == "")
            bhs.getEntry(addr, bhs.displaySingle, pnl.prop("id") == panels[pnlTop].id ? pnlTop : pnlBottom);

        // if not found try getting region
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
        loc.find("#btn-Lifeform").text(entry.Lifeform);
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

        if (entry.Economy) {
            let l = economyList[bhs.getIndex(economyList, "name", entry.Economy)].level;
            loc.find("#btn-Economy").text(l + " " + entry.Economy);
            loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
        }

        loc.find("#id-fmcenter").show();
        loc.find("#fmcenter").text(bhs.calcDist(entry.addr));

        if (idx == pnlBottom) {
            loc.find("#id-tocenter").show();
            loc.find("#tocenter").text($("#" + panels[pnlTop].id + " #fmcenter").text() - loc.find("#fmcenter").text());
        } else
            loc.find("#id-tocenter").hide();

        if (entry.blackhole)
            bhs.getEntry(entry.connection, bhs.displaySingle, pnlBottom);

        bhs.displayCalc(entry);

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

blackHoleSuns.prototype.extractEntry = function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    entry.player = bhs.user.player;
    entry.uid = bhs.user.uid;
    entry.platform = bhs.user.platform;
    entry.galaxy = bhs.user.galaxy;

    entry.addr = loc.find("#id-addr").val();
    entry.sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();
    entry.hasbase = loc.find("#ck-hasbase").prop("checked");
    let single = loc.find("#ck-single").prop("checked");

    if (idx == pnlTop) {
        if (loc.find("#ck-isdz").prop("checked"))
            entry.deadzone = true;

        if (!entry.deadzone && !single) {
            entry.blackhole = true;
            entry.connection = pnl.find("#" + panels[pnlBottom].id + " #id-addr").val();
        }
    }

    let ok = true;
    if (ok = bhs.validateEntry(entry)) {
        if (entry.blackhole)
            ok = bhs.extractEntry(pnlBottom);

        if (ok) {
            bhs.updateEntry(entry, true);

            if (entry.hasbase) {
                entry.basename = loc.find("#id-basename").val();
                bhs.updateBase(entry, true)
            }

            if (!entry.blackhole)
                bhs.updateAllTotals(entry, bhs.displayTotals);
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

blackHoleSuns.prototype.displayCalc = function (entry) {
    let d = [];

    if (entry.blackhole) {
        panels[pnlTop].dist = bhs.calcDist(entry.address);
        panels[pnlBottom].dist = bhs.calcDist(entry.connection);

        panels.forEach(function (p) {
            let loc = $("#" + p.id);
            loc.find("#fmcenter").text(p.dist);
            loc.find("#id-fmcenter").show();
        });

        let loc = $("#" + panels[pnlBottom].id);

        loc.find("#tocenter").text(panels[pnlTop].dist - panels[pnlBottom].dist);
        loc.find("#id-tocenter").show();
    }
}