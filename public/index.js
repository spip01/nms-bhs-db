'use strict';

$(document).ready(function () {
    startUp();

    $("#save").click(function () {
        lpd.updateEntry();
    });

    $("#cancel").click(function () {
        if (lpd.lastvalue)
            lpd.doDiaryDisplay(lpd.lastvalue);
    });
});

lightningPainDiary.prototype.doLoggedout = function () {
    lpd.doTrackerDisplay();

    $("#save").addClass("disabled");
    $("#save").prop("disabled", true);
    $("#cancel").addClass("disabled");
    $("#cancel").prop("disabled", true);
}

lightningPainDiary.prototype.doLoggedin = function () {
    $("#save").removeClass("disabled");
    $("#save").removeAttr("disabled");
    $("#cancel").removeClass("disabled");
    $("#cancel").removeAttr("disabled");
}

lightningPainDiary.prototype.updateEntry = function () {
    let value = {};

    for (let i = 0; i < lpd.trackerlist.length; ++i) {
        let entry = lpd.trackerlist[i];

        switch (entry.type) {
            case "blood pressure":
                value[entry.name] = lpd.extractBPInput(entry);
                break;
            case "date":
                value[entry.name] = lpd.extractDateInput(entry);
                break;
            case "list":
                value[entry.name] = lpd.extractCheckboxList(entry);
                break;
            case "number":
                value[entry.name] = lpd.extractNumInput(entry);
                break;
            case "range":
                value[entry.name] = lpd.extractRange(entry);
                break;
            case "text":
                value[entry.name] = lpd.extractTextInput(entry);
                break;
            case "time":
                value[entry.name] = lpd.extractTimeInput(entry);
                break;
            case "true false":
                value[entry.name] = lpd.extractBoolInput(entry);
                break;
            case "weather":
                value[entry.name] = lpd.extractWeatherInput(entry);
                break;
        }
    }

    lpd.lastvalue = value;
    lpd.doDiaryEntryWrite(value);
}

lightningPainDiary.prototype.doDiaryDisplay = function (value) {
    lpd.lastvalue = value;

    for (let i = 0; i < lpd.trackerlist.length; ++i) {
        let entry = lpd.trackerlist[i];

        if (value[entry.name]) {
            switch (entry.type) {
                case "blood pressure":
                    lpd.setBPInput(entry.name, value[entry.name]);
                    break;
                case "date":
                    lpd.setDateInput(entry.name, value[entry.name]);
                    break;
                case "list":
                    lpd.setCheckboxList(entry.name, value[entry.name]);
                    break;
                case "number":
                    lpd.setNumInput(entry.name, value[entry.name]);
                    break;
                case "range":
                    lpd.setRange(entry.name, value[entry.name]);
                    break;
                case "text":
                    lpd.setTextInput(entry.name, value[entry.name]);
                    break;
                case "time":
                    lpd.setTimeInput(entry.name, value[entry.name]);
                    break;
                case "true false":
                    lpd.setBoolInput(entry.name, value[entry.name]);
                    break;
                case "weather":
                    lpd.setWeatherInput(entry.name, value[entry.name]);
                    break;
            }
        }
    }
}

lightningPainDiary.prototype.doTrackerDisplay = function () {
    $("#panels").empty();

    for (let i = 0; i < lpd.trackerlist.length; ++i) {
        let entry = lpd.trackerlist[i];

        switch (entry.type) {
            case "blood pressure":
                lpd.buildBPInput(entry);
                break;
            case "date":
                lpd.buildDateInput(entry);
                break;
            case "list":
                lpd.buildCheckboxList(entry);
                break;
            case "number":
                lpd.buildNumInput(entry);
                break;
            case "range":
                lpd.buildRange(entry);
                break;
            case "text":
                lpd.buildTextInput(entry);
                break;
            case "time":
                lpd.buildTimeInput(entry);
                break;
            case "true false":
                lpd.buildBoolInput(entry);
                break;
            case "weather":
                lpd.buildWeatherInput(entry);
                break;
        }
    }

    $("#panels").show();

    $("#panels button").click(function () {
        lpd.procRange(this);
    });

    if (lpd.account.lastdiaryupdate) {
        lpd.doDiaryEntryRead(lpd.account.lastdiaryupdate, lpd.doDiaryDisplay);
        $("#entrybuttons #save").text("Update");
    }
}

lightningPainDiary.prototype.buildRange = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-12 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-12"></div>
        </div>
        `;

    const item = `<button id="btn-ttitle" type="button" class="btn btn-sm" style="background-color: colors; width:10%">ttitle</button>`;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);

    let pnl = $("#pnl-" + id);

    if (entry.start < entry.end) {
        for (let i = entry.start; i <= entry.end; i++) {
            let c = 120 - (i - entry.start) / (entry.end - entry.start) * 120;
            let h = item.symbolReplace(/ttitle/g, i);
            h = h.replace("colors", "hsl(" + c + ",100%,50%)");

            pnl.find("#entry").append(h);
        }
    } else {
        for (let i = entry.start; i >= entry.end; i--) {
            let c = (i - entry.end) / (entry.start - entry.end) * 120;

            let h = item.symbolReplace(/ttitle/g, i);
            h = h.replace("colors", "hsl(" + c + ",100%,50%)");

            pnl.find("#entry").append(h);
        }
    }
}

lightningPainDiary.prototype.extractRange = function (entry) {
    let id = entry.name.spaceToDash();
    let btn = $("#pnl-" + id + " .btn-green").prop("id");
    return (btn ? btn.replace(/btn-(\d+)/g, "$1") : "");
}

lightningPainDiary.prototype.setRange = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id).removeClass("btn-green");
    $("#pnl-" + id + " #btn-" + val).addClass("btn-green");
}

lightningPainDiary.prototype.procRange = function (evt) {
    $(evt).parent().find("button").removeClass("btn-green");
    $(evt).addClass("btn-green");
}

lightningPainDiary.prototype.buildTextInput = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-12 h6 clr-dark-green">ttitle</div>
            <textarea id="txt" rows="2" class="rounded col-lg-10 col-md-10 col-sm-10 col-12"></textarea>
            </div>
        `;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

lightningPainDiary.prototype.extractTextInput = function (entry) {
    let id = entry.name.spaceToDash();
    return ($("#pnl-" + id + " #txt").val());
}

lightningPainDiary.prototype.setTextInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id + " #txt").val(val);
}

lightningPainDiary.prototype.buildNumInput = function (entry) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <div id="entry" class="row col-lg-10 col-md-10 col-sm-10 col-6">
                <input id="num" type="text" class="rounded col-lg-1 col-md-2 col-sm-2 col-7">
            </div>
        </div>
        `;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

lightningPainDiary.prototype.extractNumInput = function (entry) {
    let id = entry.name.spaceToDash();
    return (Number($("#pnl-" + id + " #num").val()));
}

lightningPainDiary.prototype.setNumInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id + " #num").val(val);
}

lightningPainDiary.prototype.buildDateInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <input id="date" type="date" class="rounded col-lg-3 col-md-3 col-sm-3 col-6">
        </div>
        `;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

lightningPainDiary.prototype.extractDateInput = function (entry) {
    let id = entry.name.spaceToDash();
    return ($("#pnl-" + id + " #date").val());
}

lightningPainDiary.prototype.setDateInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id + " #date").val(val);
}

lightningPainDiary.prototype.buildTimeInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <input id="time" type="time" class="rounded col-lg-3 col-md-3 col-sm-3 col-6">&nbsp;
            <button type="button" class="btn border btn-sm btn-green">Now</button>&nbsp;
        </div>
        `;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);

    $("#pnl-" + id + " button").click(function () {
        let now = new Date();
        $(this).parent().find("input").val(now.toLocalTimeString());
        $("#pnl-Date input").val(now.toDateString());
        $("#entrybuttons #save").text("Save");
    });
}

lightningPainDiary.prototype.extractTimeInput = function (entry) {
    let id = entry.name.spaceToDash();
    return ($("#pnl-" + id + " #time").val());
}

lightningPainDiary.prototype.setTimeInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id + " #time").val(val);
}

lightningPainDiary.prototype.buildBoolInput = function (entry, diary) {
    const panel =
        `
        <div id="pnl-idname" class="row border-bottom">
            <div class="col-lg-2 col-md-2 col-sm-2 col-6 h6 clr-dark-green">ttitle</div>
            <label class="radio-inline"><input id="yes" type="radio" name="idname">&nbsp;Yes</label>&nbsp;
            <label class="radio-inline"><input id="no" type="radio" name="idname">&nbsp;No</label>
        </div>
        `;

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

lightningPainDiary.prototype.extractBoolInput = function (entry) {
    let id = entry.name.spaceToDash();
    return ($("#pnl-" + id + " :checked").prop("id") === "yes");
}

lightningPainDiary.prototype.setBoolInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id).prop("checked", false);
    $("#pnl-" + id + val === "yes" ? " yes" : " no").prop("checked", true);
}

lightningPainDiary.prototype.buildBPInput = function (entry) {
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

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
}

lightningPainDiary.prototype.extractBPInput = function (entry) {
    let id = entry.name.spaceToDash();
    let value = {
        high: Number($("#pnl-" + id + " #high").val()),
        low: Number($("#pnl-" + id + " #low").val()),
        pulse: Number($("#pnl-" + id + " #pulse").val()),
    };

    return (value);
}

lightningPainDiary.prototype.setBPInput = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id + " #high").val(val.high);
    $("#pnl-" + id + " #low").val(val.low);
    $("#pnl-" + id + " #pulse").val(val.pulse);
}

lightningPainDiary.prototype.buildCheckboxList = function (entry) {
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

    let id = entry.name.spaceToDash();

    let container = panel.symbolReplace(/idname/g, id);
    container = container.symbolReplace(/ttitle/g, entry.name);

    $("#panels").append(container);
    let pnl = $("#pnl-" + id);

    for (let i = 0; i < entry.list.length; ++i) {
        let id = entry.list[i].spaceToDash();
        let h = items.symbolReplace(/idname/g, id);
        h = h.symbolReplace(/ttitle/g, entry.list[i]);

        pnl.find("#entry").append(h);
    }

    let h = add.symbolReplace(/idname/g, id);
    h = h.symbolReplace(/ttitle/g, "notes");
    pnl.find("#entry").append(h);
}

lightningPainDiary.prototype.extractCheckboxList = function (entry) {
    let set = [];
    let id = entry.name.spaceToDash();

    $("#pnl-" + id + " :checked").each(function () {
        set.push($(this).prop("id"));
    });

    let t = $("#pnl-" + id + " [id|='add']").val();
    if (t !== "")
        set.push(t);

    return (set);
}

lightningPainDiary.prototype.setCheckboxList = function (name, val) {
    let id = name.spaceToDash();
    $("#pnl-" + id).prop("checked", false);

    for (let i = 0; val && i < val.length; ++i) {
        let iid = val[i].spaceToDash();
        let ent = $("#pnl-" + id + " #" + iid);
        if (ent)
            ent.prop("checked", true);
        else
            $("#pnl-" + id + " [id|='add']").val(val[i]);
    }
}
