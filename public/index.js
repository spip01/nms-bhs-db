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
        $("#status").empty();
        panels.forEach(function (p) {
            bhs.deleteEntry($("#" + p.id + " #id-addr").val());
        });
    });

    $("#cancel").click(function () {
        bhs.displaySingle(bhs.last[pnlTop], pnlTop);
    });
})

const pnlTop = 0;

var panels = [{
    name: "System Info",
    id: "pnl-S1",
    listid: "S1",
    calc: true,
}];


blackHoleSuns.prototype.buildPanel = function (id) {
    const panel = `
        <div id="idname" class="card pad-bottom bkg-trans-2">
            <div class="card-header txt-def h5">title</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Coordinates&nbsp;</div>
                    <input id="id-addr" class="rounded col-md-5 col-6" placeholder="0000:0000:0000:0000">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Portal&nbsp;</div>
                    <div id="id-glyph" class="col-10 h4 txt-inp-def text-left glyph"></div>
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">System Name&nbsp;</div>
                    <input id="id-sys" class="rounded col-md-5 col-6">
                </div>

                <div class="row">
                    <div class="col-4 h6 txt-inp-def">Region Name&nbsp;</div>
                    <input id="id-reg" class="rounded col-md-5 col-6">&nbsp;
                    </div>

                <div id="id-byrow" class="row">
                    <div class="col-4 h6 txt-inp-def">Entered by&nbsp;</div>
                    <div id="id-by" class="col-md-5 col-6 txt-inp-def"></div>
                </div>

                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Lifeform" class="col-11"></div>
                </div>
                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Economy" class="col-11"></div>
                </div>
            </div>
        </div>
        <br>`;

    let h = /idname/g [Symbol.replace](panel, id);
    h = /title/g [Symbol.replace](h, id == "pnl-S1" ? panels[pnlTop].name : panels[pnlBottom].name);

    $("#panels").append(h);

    let loc = $("#" + id);

    bhs.buildMenu(loc, "Lifeform", lifeformList);
    bhs.buildMenu(loc, "Economy", economyList);

    loc.find("#id-addr").unbind("change");
    loc.find("#id-addr").change(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);
        $(this).closest("[id|='pnl']").find("#id-glyph").html(bhs.addrToGlyph(addr));

        bhs.getEntry(addr, bhs.displaySingle, 0);
    });
}

blackHoleSuns.prototype.displayListEntry = function (entry) {
    if (entry.sys)
        bhs.displaySingle(entry.sys, pnlTop);

    bhs.last = entry;
}

blackHoleSuns.prototype.displaySingle = function (entry, idx, zoom) {
    let loc = $("#" + panels[idx].id);

    loc.find("#id-addr").val(entry.addr);
    loc.find("#id-glyph").html(bhs.addrToGlyph(entry.addr));
    loc.find("#id-sys").val(entry.sys);
    loc.find("#id-reg").val(entry.reg);

    loc.find("#id-by").html("<h6>" + entry._name ? entry._name : entry.player + "</h6>");

    loc.find("#btn-Lifeform").text(entry.life);

    if (entry.econ) {
        let l = economyList[bhs.getIndex(economyList, "name", entry.econ)].number;
        loc.find("#btn-Economy").text(l + " " + entry.econ);
        loc.find("#btn-Economy").attr("style", "background-color: " + levelRgb[l] + ";");
    }

    $("#entrybuttons").show();
    $("#delete").removeClass("disabled");
    $("#delete").removeAttr("disabled");
}


blackHoleSuns.prototype.clearPanels = function () {
    panels.forEach(function (d) {
        bhs.clearPanel(d.id);
    });

    bhs.last = [];

    $("#delete").addClass("disabled");
    $("#delete").prop("disabled", true);
}

blackHoleSuns.prototype.clearPanel = function (d) {
    let pnl = $("#" + d);

    pnl.find("input").each(function () {
        $(this).val("");
    });

    pnl.find("[id|='menu']").each(function () {
        $(this).find("[id|='btn']").text("");
    });
}

blackHoleSuns.prototype.extractEntry = async function (idx) {
    let pnl = $("#panels");
    let loc = pnl.find("#" + panels[idx].id);

    let entry = {};
    entry._name = bhs.user._name;
    entry.org = bhs.user.org;
    entry.uid = bhs.user.uid;
    entry.platform = bhs.user.platform;
    entry.galaxy = bhs.user.galaxy;

    entry.addr = loc.find("#id-addr").val();
    entry.sys = loc.find("#id-sys").val();
    entry.reg = loc.find("#id-reg").val();
    entry.life = loc.find("#btn-Lifeform").text().stripNumber();
    entry.econ = loc.find("#btn-Economy").text().stripNumber();

    let ok = true;
    if (ok = bhs.validateEntry(entry)) {
        await bhs.updateEntry(entry, true);

        bhs.updateAllTotals(bhs.totals);
        bhs.totals = {};
    }

    return ok;
}

blackHoleSuns.prototype.save = async function () {
    $("#status").empty();
    bhs.saveUser();

    if (await bhs.extractEntry(pnlTop)) {
        bhs.clearPanels();
        bhs.last = [];
    }
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>");
    $("#filestatus").append("<h6>" + str + "</h6>");
}