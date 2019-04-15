'use strict';

$(document).ready(function () {
  startUp();

  // none of these depend on tracker items being loaded
  let pnl = $("#pnl-Account");
  pnl.show();

  pnl.find("#city").keydown(function (event) {
    if (event.which === 0x0a || event.which === 0x0d)
      lookupWeather(this);
  });

  pnl.find("#state").keydown(function (event) {
    if (event.which === 0x0a || event.which === 0x0d)
      lookupWeather(this);
  });

  pnl.find("#country").keydown(function (event) {
    if (event.which === 0x0a || event.which === 0x0d)
      lookupWeather(this);
  });

  pnl.find("#save").click(function () {
    lpd.extractAccount();
  });
});

lightningPainDiary.prototype.doLoggedout = function () {
  lpd.doAccountDisplay();
  lpd.doTrackerDisplay();

  $("[id|='add").addClass("disabled");
  $("[id|='add").prop("disabled", true);
  $("[id|='edit").addClass("disabled");
  $("[id|='edit").prop("disabled", true);
  $("[id|='del").addClass("disabled");
  $("[id|='del").prop("disabled", true);
  $("[id|='en").addClass("disabled");
  $("[id|='en").prop("disabled", true);
  $("[id|='new").addClass("disabled");
  $("[id|='new").prop("disabled", true);

  $("#panels #pnl-Account #save").addClass("disabled");
  $("#panels #pnl-Account #save").prop("disabled", true);

  $("#panels [id|='pnl']").hide();
  $("#panels #pnl-Account").show();
}

lightningPainDiary.prototype.doLoggedin = function () {
  $("[id|='edit").removeClass("disabled");
  $("[id|='edit").removeAttr("disabled");
  $("[id|='en").removeClass("disabled");
  $("[id|='en").removeAttr("disabled");
  $("[id|='new").removeClass("disabled");
  $("[id|='new").removeAttr("disabled");

  $("#panels #pnl-Account #save").removeClass("disabled");
  $("#panels #pnl-Account #save").removeAttr("disabled");

  $("#panels [id|='pnl']").hide();
  $("#panels #pnl-Account").show();
}

const panels =
  `            
<div id="pnl-idname" class="card card-body container-fluid" style="display: none">
    <div id="ctrl-idname" class="row clr-dark-green">
        <div class="col-lg-4 col-md-4 col-sm-4 col-8 h4">ttitle</div>
        <label class="col-lg-4 col-md-4 col-sm-6 col-8">
            <input id="en-idname" type="checkbox">
            Enable Delete Buttons
        </label>
    </div>

    <div class = "border-bottom" style="font-size: 12px">
        Controls data displayed and saved on the entry page. Deleting items doesn't delete 
        any saved data just the display. Re-add it to restore it to the display. 
        <span class="hide-sm">Drag to rearrange which changes the order on the entry page.</span>
    </div>
    <br>
        
    <div id="cont-idname" class="container-fluid pad-bottom"></div>
    <br>

    <div class="row">
        <input id="new-idname" class="rounded col-lg-3 col-md-3 col-sm-3 col-6" type="text" placeholder="ttitle">
        <div id="menu-idname" class="col-lg-2 col-md-2 col-sm-3 col-6 dropdown" iftrackers>
            <button id="sel-idname" class="btn border btn-sm btn-green dropdown-toggle disabled" disabled type="button" data-toggle="dropdown">
                Type
            </button>
            <div id="list-idname" class="dropdown-menu"></div>
        </div>
        <input id="newstart-idname" class="rounded col-lg-1 col-md-1 col-sm-1 col-3 disabled" disabled type="text" placeholder="1" iftrackers>&nbsp;
        <input id="newend-idname" class="rounded col-lg-1 col-md-1 col-sm-1 col-3 disabled" disabled type="text" placeholder="10" iftrackers>&nbsp;&nbsp;
        <button id="add-idname" type="button" class="btn border btn-sm btn-green disabled" disabled>Add</button>
    </div>
</div>
`;

const panels_entry =
  `
<div id="ent-idname" class="row border-bottom" draggable="true">
    <div id="name-idname" class="col-lg-3 col-md-3 col-sm-3 col-6">ttitle</div>
    <input id="editname-idname" class="rounded col-lg-3 col-md-3 col-sm-3 col-6" value="ttitle" style="display: none">
    <div id="type" class="col-lg-2 col-md-2 col-sm-3 col-6" iftrackers>ttype</div>
    <div id="show-idname" class="col-lg-2 col-md-2 col-sm-2 col-6" iftrackers>
        <div id="rng-startrange-endrange" ifrange>startrange-endrange</div>
    </div>
    <input id="edtstart-idname" class="rounded col-lg-1 col-md-1 col-sm-1 col-3" value="startrange" style="display: none">&nbsp;
    <input id="edtend-idname" class="rounded col-lg-1 col-md-1 col-sm-1 col-3" val="endrange" style="display: none">&nbsp;
    <button id="edit-idname" type="button" class="edit-button btn border btn-sm btn-green" ifedit>Edit</button>&nbsp;
    <button id="done-idname" type="button" class="edit-button btn border btn-sm btn-green" style="display: none">Done</button>&nbsp;
    <button id="cancel-idname" type="button" class="edit-button btn border btn-sm btn-green" style="display: none">Cancel</button>&nbsp;
    <button id="del-idname" type="button" class="del-button btn border btn-sm btn-green disabled" disabled ifedit>Delete</button>
</div>
`;

lightningPainDiary.prototype.doTrackerDisplay = function () {
  lpd.generateTrackersPanel();
  lpd.generateTabsAndPanels();
}

lightningPainDiary.prototype.generateTrackersPanel = function () {
  const pnlid = "Trackers";
  const name = "Trackers";
  let hundred = function (i) {
    return i < 10 ? '00' + i : i < 100 ? '0' + i : i;
  };

  let panel = panels.symbolReplace(/idname/g, pnlid);
  panel = panel.symbolReplace(/ttitle/g, name);
  panel = panel.symbolReplace(/iftrackers/g, "");

  $("#pnl-" + pnlid).remove();
  $("#panels").append(panel);
  let pnl = $("#pnl-" + pnlid);

  for (let i = 0; i < lpd.trackerlist.length; ++i) {
    let item = lpd.trackerlist[i];

    let id = item.name.spaceToDash();

    let entry = panels_entry.symbolReplace(/idname/g, id);
    entry = entry.symbolReplace(/ttitle/g, item.name);
    entry = entry.symbolReplace(/ttype/g, item.type);
    entry = entry.symbolReplace(/iftrackers/g, "");
    entry = entry.symbolReplace(/000/g, hundred(i));

    if (item.type === "range") {
      entry = entry.symbolReplace(/ifrange/g, "");
      entry = entry.symbolReplace(/startrange/g, item.start);
      entry = entry.symbolReplace(/endrange/g, item.end);
    } else
      entry = entry.symbolReplace(/ifrange/g, 'style="display: none"');

    entry = entry.symbolReplace(/ifedit/g, item.fixed === true ? 'style="display: none"' : '');

    pnl.find("[id|='cont']").append(entry);
  }

  const menu_entries = `<button id="item" class="dropdown-item" type="button" style="cursor: pointer">ttype</button>`;

  for (let i = 0; i < trackertypes.length; ++i) {
    let menu = menu_entries.symbolReplace(/ttype/g, trackertypes[i]);
    pnl.find("[id|='list']").append(menu);
  }

  lpd.setPanelEvents(pnlid);
}

lightningPainDiary.prototype.generateTabsAndPanels = function () {
  lpd.newTabBar();

  for (let i = 0; i < lpd.trackerlist.length; ++i) {
    let item = lpd.trackerlist[i];

    if (item.type === "list") {
      lpd.addTab(item);
      lpd.addPanel(item);
    }
  }
}

lightningPainDiary.prototype.addPanel = function (items) {
  let pnlid = items.name.spaceToDash();
  let name = items.name;

  let panel = panels.symbolReplace(/idname/g, pnlid);
  panel = panel.symbolReplace(/ttitle/g, name);
  panel = panel.symbolReplace(/iftrackers/g, "style='display: none'");

  $("#pnl-" + pnlid).remove();
  $("#panels").append(panel);

  for (let j = 0; j < items.list.length; ++j) {
    let item = items.list[j];
    let id = item.spaceToDash();

    let entry = panels_entry.symbolReplace(/idname/g, id);
    entry = entry.symbolReplace(/ttitle/g, item);
    entry = entry.symbolReplace(/iftrackers/g, "style='display: none'");
    entry = entry.symbolReplace(/ifrange/g, "style='display: none'");
    entry = entry.symbolReplace(/ifedit/g, '');

    $("#pnl-" + pnlid + " [id|='cont']").append(entry);
  }

  lpd.setPanelEvents(pnlid);
}

lightningPainDiary.prototype.setPanelEvents = function (id) {
  let pnl = $("#pnl-" + id);

  pnl.find("[id|='en']").click(function () {
    lpd.enableDeleteBtns(this);
  });

  pnl.find("[id|='editname']").keydown(function (event) {
    if (event.which === 0x0a || event.which === 0x0d)
      lpd.doneEdit(this);
  });

  pnl.find("[id|='done']").click(function () {
    lpd.doneEdit(this);
  });

  pnl.find("[id|='cancel']").click(function () {
    lpd.cancelEdit(this);
  });

  pnl.find("[id|='edit']").click(function () {
    lpd.panelEditBtn(this);
  });

  pnl.find("[id|='del']").click(function () {
    lpd.panelDeleteBtn(this);
  });

  pnl.find("[id|='new']").keydown(function (event) {
    if (event.which === 0x0a || event.which === 0x0d)
      lpd.panelAddBtn(this);
    else
      lpd.enableAddBtns(this);
  });

  pnl.find("[id|='add']").click(function () {
    lpd.panelAddBtn(this);
  });

  if (id === "Trackers") {
    pnl.find("[id|='edtstart']").keydown(function (event) {
      if (event.which === 0x0a || event.which === 0x0d)
        lpd.doneEdit(this);
    });

    pnl.find("[id|='edtend']").keydown(function (event) {
      if (event.which === 0x0a || event.which === 0x0d)
        lpd.doneEdit(this);
    });

    pnl.find("[id|='newstart']").keydown(function (event) {
      if (event.which === 0x0a || event.which === 0x0d)
        lpd.panelAddBtn(this);
    });

    pnl.find("[id|='newend']").keydown(function (event) {
      if (event.which === 0x0a || event.which === 0x0d)
        lpd.panelAddBtn(this);
    });

    pnl.find("[id|='item']").click(function () {
      lpd.selectType(this);
    });
  }

  pnl.find("[draggable|='true']").on({
    //"mouseleave": $.proxy(mouseLeave),
    //"mouseenter": $.proxy(mouseEnter),
    "drop": $.proxy(lpd.drop),
    "dragover": $.proxy(lpd.dragover),
    "dragstart": $.proxy(lpd.dragstart),
    //"touchend": $.proxy(drop),
    //"touchenter": $.proxy(dragover),
    //"touchstart": $.proxy(dragstart),
  });
}

lightningPainDiary.prototype.newTabBar = function () {
  $("#tablist").empty();

  lpd.addTab({
    name: "Account",
    borderbottom: true,
  });

  lpd.addTab({
    name: "Trackers",
    borderright: true,
    borderbottom: true,
  });
}

lightningPainDiary.prototype.addTab = function (item) {
  const tab_entries = `<button id="tab-idname" class="col-lg-2 col-md-3 col-sm-4 col-6 h4 btn-green no-border trborder tbborder">ttitle</button>`;

  let id = item.name.spaceToDash();

  let tab = tab_entries.symbolReplace(/idname/g, id);
  tab = tab.symbolReplace(/ttitle/g, item.name);
  tab = tab.symbolReplace(/trborder/g, item.borderright === true ? "border-right" : "");
  tab = tab.symbolReplace(/tbborder/g, item.borderbottom === true ? "border-bottom" : "");

  let tabs = $("#tablist");

  tabs.find("#tab-" + id).remove();
  tabs.append(tab);

  tabs.find("#tab-" + id).click(function () {
    lpd.openTab(this);
  });
}

/***********************************************/

lightningPainDiary.prototype.openTab = function (evt) {
  $("#panels").children().hide();
  let pnl = $(evt).prop("id").stripID();
  $("#panels #pnl-" + pnl).show();
}

lightningPainDiary.prototype.dragover = function (evt) {
  evt.preventDefault();
}

lightningPainDiary.prototype.dragstart = function (evt) {
  evt.originalEvent.dataTransfer.setData("text", evt.target.id);
}

lightningPainDiary.prototype.drop = function (evt) {
  evt.preventDefault();
  let srcid = evt.originalEvent.dataTransfer.getData("text");
  let dstid = evt.currentTarget.id;

  let parentid = evt.currentTarget.parentElement.id;
  let parent = $("#" + parentid);
  let src = parent.find("#" + srcid);
  let dst = parent.find("#" + dstid);

  let up = src.position().top > dst.position().top;

  if (up)
    dst.before(src[0].outerHTML);
  else
    dst.after(src[0].outerHTML);
  src.detach();

  parent.find("#" + srcid).on({
    "drop": $.proxy(lpd.drop),
    "dragover": $.proxy(lpd.dragover),
    "dragstart": $.proxy(lpd.dragstart),
  });

  parentid = parentid.idToName();

  if (parentid === "Trackers") {
    let list = [];

    parent.children().each(function () {
      let id = $(this).prop("id").idToName()

      let i = lpd.trackerlist.findIndex(function (x) {
        return (x.name === id);
      });

      list.push(lpd.trackerlist[i]);
    });

    lpd.trackerlist = list;
  } else {
    let list = [];

    let index = lpd.trackerlist.findIndex(function (x) {
      return (x.name === parentid);
    });

    let searched = lpd.trackerlist[index].list;

    parent.children().each(function () {
      let id = $(this).prop("id").idToName();

      let i = searched.findIndex(function (x) {
        return (x === id);
      });

      list.push(searched[i]);
    });

    lpd.trackerlist[index].list = list;
  }

  lpd.doTrackerlistWrite();
}

lightningPainDiary.prototype.enableDeleteBtns = function (evt) {
  let pnlid = $(evt).prop("id").stripID();
  let pnl = $("#pnl-" + pnlid);

  if ($(evt).prop("checked")) {
    pnl.find("[id|='del']").removeClass("disabled");
    pnl.find("[id|='del']").removeAttr("disabled");
  } else {
    pnl.find("[id|='del']").addClass("disabled");
    pnl.find("[id|='del']").prop("disabled", true);
  }
}

lightningPainDiary.prototype.enableAddBtns = function (evt) {
  let pnlid = $(evt).prop("id").stripID();
  let pnl = $("#pnl-" + pnlid);

  if (pnlid === "Trackers") {
    pnl.find("[id|='sel']").removeClass("disabled");
    pnl.find("[id|='sel']").removeAttr("disabled");
  } else {
    pnl.find("[id|='add']").removeClass("disabled");
    pnl.find("[id|='add']").removeAttr("disabled");
  }
}

lightningPainDiary.prototype.selectType = function (evt) {
  let name = $(evt).text();
  let menu = $(evt).parent().parent();
  let pnl = $("#pnl-Trackers");

  menu.find("[id|='sel']").text(name);

  pnl.find("[id|='add']").removeClass("disabled");
  pnl.find("[id|='add']").removeAttr("disabled");

  if (name === "range") {
    pnl.find("[id|='newstart']").removeClass("disabled");
    pnl.find("[id|='newstart']").removeAttr("disabled")
    pnl.find("[id|='newend']").removeClass("disabled");
    pnl.find("[id|='newend']").removeAttr("disabled")
  } else {
    pnl.find("[id|='newstart']").addClass("disabled");
    pnl.find("[id|='newstart']").prop("disabled", true);
    pnl.find("[id|='newend']").addClass("disabled");
    pnl.find("[id|='newend']").prop("disabled", true);
  }
}

lightningPainDiary.prototype.panelAddBtn = function (evt) {
  let pnlid = $(evt).prop("id").stripID();
  let pnlname = pnlid.dashToSpace();
  let pnl = $("#pnl-" + pnlid);
  let name = pnl.find("[id|='new']").val();
  let id = name.spaceToDash();

  if (pnlid === "Trackers") {
    let entry = {
      name: name,
      type: pnl.find("[id|='sel']").text(),
    };

    let found = lpd.trackerlist.find(function (x) {
      return (x.name === name);
    });

    if (entry.type === "Type" || found)
      return;

    if (entry.type === "range") {
      entry.start = Number(pnl.find("[id|='newstart']").val());
      entry.end = Number(pnl.find("[id|='newend']").val());

      if (entry.start === 0 && entry.end === 0)
        return;
    }

    if (entry.type === "weather") {
      let i = demotrackerlist.findIndex(function (x) {
        return (x.type === "weather");
      });
      entry.list = demotrackerlist[i].list;
    }

    if (entry.type === "list") {
      entry.list = [];

      lpd.addTab(entry);
      lpd.addPanel(entry);
    }

    lpd.trackerlist.push(entry);

    lpd.generateTrackersPanel();
    $("#pnl-" + pnlid).show();

    lpd.doTrackerWrite(entry, lpd.trackerlist.length - 1);
  } else {
    let i = lpd.trackerlist.findIndex(function (x) {
      return (x.name === pnlname);
    });

    let entry = lpd.trackerlist[i];
    if (!entry.list.includes(name))
      entry.list.push(name);

    lpd.addPanel(entry);
    $("#pnl-" + pnlid).show();

    lpd.doTrackerWrite(entry, i);
  }
}

lightningPainDiary.prototype.panelEditBtn = function (evt) {
  let ent = $(evt).parent();
  let pnlid = ent.prop("id").idToName();

  ent.removeAttr("draggable");
  ent.find("[id|='name']").hide();
  ent.find("[id|='edit']").hide();
  ent.find("[id|='editname']").show();
  ent.find("[id|='done']").show();
  ent.find("[id|='cancel']").show();

  if (pnlid === "Trackers") {
    if (ent.find("[id|='type']").text() === "range") {
      ent.find("[id|='show']").hide();

      ent.find("[id|='edtstart']").show();
      ent.find("[id|='edtend']").show();
    }
  }
}

lightningPainDiary.prototype.cancelEdit = function (evt) {
  let ent = $(evt).parent();

  ent.attr("draggable", true);
  ent.find("[id|='name']").show();
  ent.find("[id|='edit']").show();
  ent.find("[id|='editname']").hide();
  ent.find("[id|='done']").hide();
  ent.find("[id|='cancel']").hide();
}

lightningPainDiary.prototype.doneEdit = function (evt) {
  let id = $(evt).prop("id").stripID();
  let ent = $(evt).parent();
  let pnlid = ent.parent().prop("id").stripID();
  let pnl = $("#pnl-" + pnlid);
  let pnlname = pnlid.dashToSpace();

  let newname = ent.find("[id|='editname']").val();
  let oldname = id.dashToSpace();

  if (pnlname === "Trackers") {
    let i = lpd.trackerlist.findIndex(function (x) {
      return (x.name === oldname);
    });

    let entry = lpd.trackerlist[i];
    entry.name = newname;

    if (entry.type === "range") {
      entry.start = ent.find("[id|='edtstart']").val();
      entry.end = ent.find("[id|='edtend']").val();
    }

    if (entry.type === "list")
      lpd.generateTabsAndPanels();

    lpd.generateTrackersPanel();
    $("#pnl-" + pnlid).show();

    lpd.doTrackerWrite(entry, i)
    lpd.doDiaryTrackerRename(oldname, newname);
  } else {
    let i = lpd.trackerlist.findIndex(function (x) {
      return (x.name === pnlname);
    });

    let entry = trackerlist[i];

    let j = entry.list.indexOf(oldname);
    entry.list[j] = newname;

    lpd.addPanel(entry);
    $("#pnl-" + pnlid).show();

    lpd.doTrackerWrite(entry, i)
  }
}

lightningPainDiary.prototype.panelDeleteBtn = function (evt) {
  let id = $(evt).prop("id").stripID();
  let pnlid = $(evt).parent().parent().prop("id").stripID();
  let pnlname = pnlid.dashToSpace();
  let name = id.dashToSpace();

  if (pnlid === "Trackers") {
    let i = lpd.trackerlist.findIndex(function (x) {
      return (x.name === name);
    });

    lpd.trackerlist.splice(i, 1);

    $("#pnl-" + pnlid + " #ent-" + id).remove();
    $("#panels #pnl-" + id).remove();
    $("#tablist #tab-" + id).remove();

    lpd.doTrackerlistWrite();
  } else {
    let i = lpd.trackerlist.findIndex(function (x) {
      return (x.name === pnlname);
    });

    let entry = lpd.trackerlist[i];

    let j = entry.list.indexOf(name);
    entry.list.splice(j, 1);

    $("#pnl-" + pnlid + " #ent-" + id).remove();

    lpd.doTrackerWrite(entry, i)
  }
}

function lookupWeather(evt) {
  let city = $("#city").val();
  let state = $("#state").val();
  let country = $("#country").val();
  let tmpFormat = $("[name='temp'] :checked").text();

  let url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "," + state + "," + country + "&units=" + tmpFormat + "&appid=" + OPENWEATHER_API;

  loadFile(url, null, function (data) {
    $("#lat").val(data.coord.lat);
    $("#lon").val(data.coord.lon);

    lpd.account.coord = [];
    lpd.account.coord.latitude = data.coord.lat;
    lpd.account.coord.longitude = data.coord.lon;
  });
}

lightningPainDiary.prototype.extractAccount = function () {
  let pnl = $("#pnl-Account");

  lpd.account.city = pnl.find("#city").val();
  lpd.account.state = pnl.find("#state").val();
  lpd.account.country = pnl.find("#country").val();
  lpd.account.coord = [];
  lpd.account.coord.latitude = pnl.find("#lat").val();
  lpd.account.coord.longitude = pnl.find("#lon").val();
  lpd.account.ifmetric = pnl.find("#ifmetric").prop("checked");
  lpd.account.ifnotify = pnl.find("#ifnotify").prop("checked");
  lpd.account.notifytime = pnl.find("#notifytime").val();
  lpd.account.ifemail = pnl.find("#ifemail").prop("checked");
  lpd.account.ifsms = pnl.find("#ifsms").prop("checked");
  lpd.account.phone = pnl.find("#phone").val();

  lpd.doAccountWrite();
}

lightningPainDiary.prototype.doAccountDisplay = function () {
  let pnl = $("#pnl-Account");

  pnl.find("#city").val(lpd.account.city);
  pnl.find("#state").val(lpd.account.state);
  pnl.find("#country").val(lpd.account.country);
  if (lpd.account.coord) {
    pnl.find("#lat").val(lpd.account.coord.latitude);
    pnl.find("#lon").val(lpd.account.coord.longitude);
  }
  pnl.find("#ifimperial").prop("checked", !lpd.account.ifmetric);
  pnl.find("#ifmetric").prop("checked", lpd.account.ifmetric);
  pnl.find("#ifnotify").prop("checked", lpd.account.ifnotify);
  pnl.find("#notifytime").val(lpd.account.notifytime);
  pnl.find("#ifemail").prop("checked", lpd.account.ifemail);
  pnl.find("#ifsms").prop("checked", lpd.account.ifsms);
  pnl.find("#phone").val(lpd.account.phone);
}