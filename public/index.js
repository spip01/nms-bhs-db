'use strict';

$(document).ready(function () {
    startUp();
    
    /*
        $("#save").click(function () {
            bhs.updateEntry();
        });

        $("#clear").click(function () {
            bhs.clearEntry();
        });

        $("#edit").click(function () {
            bhs.editEntry();
        });

        $("#delete").click(function () {
            bhs.deleteEntry();
        });
    */

    let loc = $("#userinfo");
    bhs.buildMenu(loc, "platform", platformList);
    bhs.buildMenu(loc, "galaxy", galaxyList, true);

    bhs.buildPanel("Black Hole System");
    bhs.buildPanel("Exit System");

});

blackHoleSuns.prototype.buildPanel = function (name) {
    let panel = `
        <div id="pnl-name" class="card pad-bottom">
            <div class="h4 clr-dark-green">heading</div>
            <div class="row border_bottom">
                <label class="col-lg-4 col-md-4 col-sm-4 col-12 h6 clr-dark-green">Address&nbsp;
                    <input id="id-add" class="rounded col-6"></input>
                </label>
                <label class="col-lg-4 col-md-4 col-sm-4 col-12 h6 clr-dark-green">System Name&nbsp;
                    <input id="id-sys" class="rounded col-6"></input>
                </label>
                <label class="col-lg-4 col-md-4 col-sm-4 col-12 h6 clr-dark-green">Region Name&nbsp;
                    <input id="id-reg" class="rounded col-6"></input>
                </label>
            </div>
            <div class="row">
                <!--label class="col-lg-4 col-md-4 col-sm-4 col-6 h6 clr-dark-green">Star Type&nbsp;
                    <input id="id-star" class="rounded col-3"></input>
                </label-->
                <div class="col-lg-1 col-md-2 col-sm-2 col-4 h6 clr-dark-green">Lifeform&nbsp;</div>
                <div id="menu-life" class="col-lg-1 col-md-2 col-sm-2 col-8 dropdown"></div>
                <div class="col-lg-1 col-md-2 col-sm-2 col-4 h6 clr-dark-green">Economy&nbsp;</div>
                <!--div id="menu-type" class="col-lg-1 col-md-2 col-sm-2 col-4 dropdown"></div-->
                <div id="menu-econ" class="col-lg-1 col-md-3 col-sm-2 col-8 dropdown"></div>
                <!--div class="col-lg-1 col-md-2 col-sm-2 col-4 h6 clr-dark-green">Conflit&nbsp;</div-->
                <!--div id="menu-conf" class="col-lg-1 col-md-2 col-sm-2 col-4 dropdown"></div-->
            </div>
        </div>
        <br>`;

    let id = name.nameToId();
    $("#panels").append(panel.replace(/name/g, id).replace(/heading/g, name));

    let loc = $("#pnl-"+id);

    bhs.buildMenu(loc, "life", lifeformList);
    bhs.buildMenu(loc, "econ", economyList);
//    bhs.buildMenu(loc, "type", typeList);
//    bhs.buildMenu(loc, "conf", conflictList);
}

blackHoleSuns.prototype.buildMenu = function (loc, label, list, makelist) {
    let item = ``;
    let hdr = `
        <button id="button" class="btn border btn-sm btn-green dropdown-toggle" type="button" data-toggle="dropdown">
            default
        </button>`;

    if (makelist) {
        item = `<li id="item-idname" class="dropdown-item" type="button" style="cursor: pointer">iname</li>`;
        hdr += `<ul id="list" class="dropdown-menu scrollable-menu btn-green" role="menu"></ul>`;
    }
    else {
        item = `<button id="item-idname" class="dropdown-item border-bottom" type="button" style="cursor: pointer">iname</button>`;
        hdr += `<div id="list" class="dropdown-menu btn-green"></div>`;
    }
    
    let menu = loc.find("#menu-" + label);

    menu.append(hdr.replace(/default/g, list[0].name));

    let mlist = menu.find("#list");

    for (let i = 0; i < list.length; ++i) {
        let name = list[i].name.nameToId();
        mlist.append(item.replace(/idname/g, name).replace(/iname/g, list[i].name));

        mlist.find("#item-" + name).click(function () {
            let name = $(this).text();
            menu.find("#button").text(name);

            // update user data
        });
    }
}

/*
blackHoleSuns.prototype.doLoggedout = function () {
    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
    $("#clear").addClass("disabled");
    $("#clear").prop("disabled", true);

    $("#map").hide();
    $("#list").hide();
}

blackHoleSuns.prototype.doLoggedin = function () {
    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
    $("#clear").removeClass("disabled");
    $("#clear").removeAttr("disabled");

    $("#map").show();
    $("#list").show();
}

blackHoleSuns.prototype.updateEntry = function () {
    let value = {};

    for (let i = 0; i < bhs.trackerlist.length; ++i) {
        let entry = bhs.trackerlist[i];

        switch (entry.type) {
            case "blood pressure":
                value[entry.name] = bhs.extractBPInput(entry);
                break;
            case "date":
                value[entry.name] = bhs.extractDateInput(entry);
                break;
            case "list":
                value[entry.name] = bhs.extractCheckboxList(entry);
                break;
            case "number":
                value[entry.name] = bhs.extractNumInput(entry);
                break;
            case "range":
                value[entry.name] = bhs.extractRange(entry);
                break;
            case "text":
                value[entry.name] = bhs.extractTextInput(entry);
                break;
            case "time":
                value[entry.name] = bhs.extractTimeInput(entry);
                break;
            case "true false":
                value[entry.name] = bhs.extractBoolInput(entry);
                break;
            case "weather":
                value[entry.name] = bhs.extractWeatherInput(entry);
                break;
        }
    }

    bhs.lastvalue = value;
    bhs.doEntryWrite(value);
}

blackHoleSuns.prototype.doDiaryDisplay = function (value) {
    bhs.lastvalue = value;

    for (let i = 0; i < bhs.trackerlist.length; ++i) {
        let entry = bhs.trackerlist[i];

        if (value[entry.name]) {
            switch (entry.type) {
                case "blood pressure":
                    bhs.setBPInput(entry.name, value[entry.name]);
                    break;
                case "date":
                    bhs.setDateInput(entry.name, value[entry.name]);
                    break;
                case "list":
                    bhs.setCheckboxList(entry.name, value[entry.name]);
                    break;
                case "number":
                    bhs.setNumInput(entry.name, value[entry.name]);
                    break;
                case "range":
                    bhs.setRange(entry.name, value[entry.name]);
                    break;
                case "text":
                    bhs.setTextInput(entry.name, value[entry.name]);
                    break;
                case "time":
                    bhs.setTimeInput(entry.name, value[entry.name]);
                    break;
                case "true false":
                    bhs.setBoolInput(entry.name, value[entry.name]);
                    break;
                case "weather":
                    bhs.setWeatherInput(entry.name, value[entry.name]);
                    break;
            }
        }
    }
}

blackHoleSuns.prototype.doTrackerDisplay = function () {
    $("#panels").empty();

    for (let i = 0; i < bhs.trackerlist.length; ++i) {
        let entry = bhs.trackerlist[i];

        switch (entry.type) {
            case "blood pressure":
                bhs.buildBPInput(entry);
                break;
            case "date":
                bhs.buildDateInput(entry);
                break;
            case "list":
                bhs.buildCheckboxList(entry);
                break;
            case "number":
                bhs.buildNumInput(entry);
                break;
            case "range":
                bhs.buildRange(entry);
                break;
            case "text":
                bhs.buildTextInput(entry);
                break;
            case "time":
                bhs.buildTimeInput(entry);
                break;
            case "true false":
                bhs.buildBoolInput(entry);
                break;
            case "weather":
                bhs.buildWeatherInput(entry);
                break;
        }
    }

    $("#panels").show();

    $("#panels button").click(function () {
        bhs.procRange(this);
    });

    if (bhs.account.lastdiaryupdate) {
        bhs.doDiaryEntryRead(bhs.account.lastdiaryupdate, bhs.doDiaryDisplay);
        $("#entrybuttons #save").text("Update");
    }
}

blackHoleSuns.prototype.buildRange = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-12 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-12"></div>
        </div>
        `;

    const item = `<button id="btn-ttitle" type="button" class="btn btn-sm" style="background-color: colors; width:10%">ttitle</button>`;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);

    let pnl = $("#pnl-" + id);

    if (entry.start < entry.end) {
        for (let i = entry.start; i <= entry.end; i++) {
            let c = 120 - (i - entry.start) / (entry.end - entry.start) * 120;
            let h = item.replace(/ttitle/g, i);
            h = h.replace("colors", "hsl(" + c + ",100%,50%)");

            pnl.find("#entry").append(h);
        }
    } else {
        for (let i = entry.start; i >= entry.end; i--) {
            let c = (i - entry.end) / (entry.start - entry.end) * 120;

            let h = item.replace(/ttitle/g, i);
            h = h.replace("colors", "hsl(" + c + ",100%,50%)");

            pnl.find("#entry").append(h);
        }
    }
}

blackHoleSuns.prototype.extractRange = function (entry) {
    let id = entry.name.nameToId();
    let btn = $("#pnl-" + id + " .btn-green").prop("id");
    return (btn ? btn.replace(/btn-(\d+)/g, "$1") : "");
}

blackHoleSuns.prototype.setRange = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id).removeClass("btn-green");
    $("#pnl-" + id + " #btn-" + val).addClass("btn-green");
}

blackHoleSuns.prototype.procRange = function (evt) {
    $(evt).parent().find("button").removeClass("btn-green");
    $(evt).addClass("btn-green");
}

blackHoleSuns.prototype.buildTextInput = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-12 h6 clr-dark-green">ttitle</div>
            <textarea id="txt" rows="2" class="rounded col-lg-10 col-md-10 col-sm-10 col-12"></textarea>
            </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

blackHoleSuns.prototype.extractTextInput = function (entry) {
    let id = entry.name.nameToId();
    return ($("#pnl-" + id + " #txt").val());
}

blackHoleSuns.prototype.setTextInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id + " #txt").val(val);
}

blackHoleSuns.prototype.buildNumInput = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-6">
                <input id="num" type="text" class="rounded col-lg-1 col-md-2 col-sm-2 col-7">
            </div>
        </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

blackHoleSuns.prototype.extractNumInput = function (entry) {
    let id = entry.name.nameToId();
    return (Number($("#pnl-" + id + " #num").val()));
}

blackHoleSuns.prototype.setNumInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id + " #num").val(val);
}

blackHoleSuns.prototype.buildDateInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <input id="date" type="date" class="rounded col-lg-3 col-md-3 col-sm-3 col-6">
        </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

blackHoleSuns.prototype.extractDateInput = function (entry) {
    let id = entry.name.nameToId();
    return ($("#pnl-" + id + " #date").val());
}

blackHoleSuns.prototype.setDateInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id + " #date").val(val);
}

blackHoleSuns.prototype.buildTimeInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <input id="time" type="time" class="rounded col-lg-3 col-md-3 col-sm-3 col-6">&nbsp;
            <button type="button" class="btn border btn-sm btn-green">Now</button>&nbsp;
        </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);

    $("#pnl-" + id + " button").click(function () {
        let now = new Date();
        $(this).parent().find("input").val(now.toLocalTimeString());
        $("#pnl-Date input").val(now.toDateString());
        $("#entrybuttons #save").text("Save");
    });
}

blackHoleSuns.prototype.extractTimeInput = function (entry) {
    let id = entry.name.nameToId();
    return ($("#pnl-" + id + " #time").val());
}

blackHoleSuns.prototype.setTimeInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id + " #time").val(val);
}

blackHoleSuns.prototype.buildBoolInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <label class="radio-inline"><input id="yes" type="radio" name="idname">&nbsp;Yes</label>&nbsp;
            <label class="radio-inline"><input id="no" type="radio" name="idname">&nbsp;No</label>
        </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

blackHoleSuns.prototype.extractBoolInput = function (entry) {
    let id = entry.name.nameToId();
    return ($("#pnl-" + id + " :checked").prop("id") === "yes");
}

blackHoleSuns.prototype.setBoolInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id).prop("checked", false);
    $("#pnl-" + id + val === "yes" ? " yes" : " no").prop("checked", true);
}

blackHoleSuns.prototype.buildBPInput = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-6">
                <input id="high" class="rounded col-lg-1 col-md-2 col-sm-2 col-7" type="text">
                <div class="col-lg-1 col-md-1 col-sm-1 col-3 text-center">/</div>
                <input id="low" class="rounded col-lg-1 col-md-2 col-sm-2 col-7" type="text">
                <input id="pulse" class="rounded col-lg-1 col-md-2 col-sm-2 col-7" type="text">
                &nbsp;pulse
            </div>
        </div>
        `;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

blackHoleSuns.prototype.extractBPInput = function (entry) {
    let id = entry.name.nameToId();
    let value = {
        high: Number($("#pnl-" + id + " #high").val()),
        low: Number($("#pnl-" + id + " #low").val()),
        pulse: Number($("#pnl-" + id + " #pulse").val()),
    };

    return (value);
}

blackHoleSuns.prototype.setBPInput = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id + " #high").val(val.high);
    $("#pnl-" + id + " #low").val(val.low);
    $("#pnl-" + id + " #pulse").val(val.pulse);
}

blackHoleSuns.prototype.buildCheckboxList = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-12 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-12"></div>
        </div>
        `;

    const items =
        `
        <label class="col-lg-3 col-md-3 col-sm-4 col-5">
            <input id="idname" type="checkbox">
            ttitle
        </label>
        `;

    const add = `<input id="add-idname" class="rounded col-lg-3 col-md-3 col-sm-3 col-6" placeholder="ttitle">`;

    let id = entry.name.nameToId();

    let container = panel.replace(/idname/g, id);
    container = container.replace(/ttitle/g, entry.name);

    $("#panels").append(container);
    let pnl = $("#pnl-" + id);

    for (let i = 0; i < entry.list.length; ++i) {
        let id = entry.list[i].nameToId();
        let h = items.replace(/idname/g, id);
        h = h.replace(/ttitle/g, entry.list[i]);

        pnl.find("#entry").append(h);
    }

    let h = add.replace(/idname/g, id);
    h = h.replace(/ttitle/g, "notes");
    pnl.find("#entry").append(h);
}

blackHoleSuns.prototype.extractCheckboxList = function (entry) {
    let set = [];
    let id = entry.name.nameToId();

    $("#pnl-" + id + " :checked").each(function () {
        set.push($(this).prop("id"));
    });

    let t = $("#pnl-" + id + " [id|='add']").val();
    if (t !== "")
        set.push(t);

    return (set);
}

blackHoleSuns.prototype.setCheckboxList = function (name, val) {
    let id = name.nameToId();
    $("#pnl-" + id).prop("checked", false);

    for (let i = 0; val && i < val.length; ++i) {
        let iid = val[i].nameToId();
        let ent = $("#pnl-" + id + " #" + iid);
        if (ent)
            ent.prop("checked", true);
        else
            $("#pnl-" + id + " [id|='add']").val(val[i]);
    }
}

*/