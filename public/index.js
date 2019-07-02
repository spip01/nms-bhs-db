'use strict';

$(document).ready(function () {
    startUp();

    bhs.last = [];

    bhs.buildUserPanel();

    panels.forEach(function (p) {
        bhs.buildPanel(p.id);
    });

    bhs.buildTypePanels();

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
                    <div id="id-Lifeform" class="col-6"></div>
                </div>
                <div class="row">
                    <div class="col-1">&nbsp;</div>
                    <div id="id-Economy" class="col-6"></div>
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
    let loc = $("#" + panels[0].id);

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

        // bhs.updateAllTotals(bhs.totals);
        // bhs.totals = {};
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
}

blackHoleSuns.prototype.buildTypePanels = function () {
    let nav = `<a class="nav-item nav-link txt-def h6 active" id="tab-idname" data-toggle="tab" href="#pnl-idname" role="tab" aria-controls="pnl-idname" aria-selected="true">title</a>`;
    let header = `
        <div class="tab-pane fade show active" id="pnl-idname" role="tabpanel" aria-labelledby="tab-idname">
            <div id="itm-idname" class="row"></div>
        </div>`;
    const tText = `
        <div class="col-1" data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
            <i class="far fa-question-circle"></i>
        </div>`;
    const tString = `
        <div class="col-sm-7 col-14">
            <div id="row-idname" class="row">
                <div class="col-md-5 col-3 h6 txt-inp-def">title</div>
                <input id="id-idname" class="rounded col-md-8 col-9">
            </div>
        </div>`;
    const tNumber = `
        <div class="col-sm-7 col-14">
            <div id="row-idname" class="row">
                <div class="col-md-5 col-3 h6 txt-inp-def">title</div>
                <input id="id-idname" type="number" class="rounded col-4" min=0 max=range value=0>
            </div>
        </div>`;
    const tList = `
        <div id="list-idname" class="col-sm-7 col-14">
            <div id="row-idname" class="row">
                <div id="id-idname" class="col-6"></div>
            </div>
        </div>`;
    const tCkList = `
        <div class="col-14 border hidden">
            <div id="cklist-idname" class="row"></div>
        </div>`;
    const tCkItm = `
        <label id="id-idname" class="col-sm-3 col-4">
            title&nbsp;
            <input id="ck-idname" type="checkbox">
        </label>`;
    const tSubList = `
        <div id="slist-idname" class="col-sm-7 col-14 hidden">
            <div id="row-idname" class="row">
                <div id="id-idname" class="col-12"></div>
            </div>
        </div>`;
    const tImg = `
        <div id="id-idname" class="col-14">
            <div id="row-idname" class="row">
                <div class="col-md-3 col-2 txt-inp-def h6">title</div>
                <input id="id-idname" type="file" class="col-7 form-control form-control-sm" 
                    accept="image/*" name="files[]" onchange="loadCanvasWithInputFile(this)">&nbsp;
            </div>
            <div class="container noborder pad-bottom">
                <div id="imgtable" class="row"></div>    
            </div>
      </div>`;

    let tabs = $("#typeTabs");
    let pnl = $("#typePanels");

    objectList.forEach(obj => {
        let id = obj.name.nameToId();
        let h = /idname/g [Symbol.replace](nav, id);
        h = /title/ [Symbol.replace](h, obj.name);
        tabs.append(h);

        h = /idname/g [Symbol.replace](header, id);
        pnl.append(h);

        nav = /active/ [Symbol.replace](nav, "");
        header = /show active/ [Symbol.replace](header, "");

        let itm = pnl.find("#itm-" + id);
        if (obj.fields) {
            for (let i = 0; i < obj.fields.length; ++i) {
                let f = obj.fields[i];
                let l = "";
                let req = f.required ? `&nbsp;<font style="color:red">*</font>&nbsp;` : "";
                let id = f.name.nameToId();

                switch (f.type) {
                    case "number":
                        l = /title/ [Symbol.replace](tNumber, f.name + req);
                        l = /range/ [Symbol.replace](l, f.range);
                        l = /idname/g [Symbol.replace](l, id);
                        itm.append(l);
                        break;
                    case "menu":
                        l = /idname/g [Symbol.replace](tList, id);
                        itm.append(l);
                        let lst = itm.find("#list-" + id);
                        bhs.buildMenu(lst, f.name, f.list, f.sublist ? bhs.selectSublist : null);
                        if (req != "")
                            itm.find("#id-menu").html(f.name + req);

                        if (f.sublist) {
                            for (let k = 0; k < f.list.length; ++k) {
                                let t = f.list[k];

                                for (let j = 0; j < f.sublist.length; ++j) {
                                    let slist = t[f.sublist[j].sub] ? t[f.sublist[j].sub] : f.sublist[j].list;
                                    let sub;

                                    if (slist) {
                                        if (f.sublist[j].type == "menu") {
                                            l = /idname/ [Symbol.replace](tSubList, (t.name + "-" + f.sublist[j].name).nameToId());
                                            l = /idname/g [Symbol.replace](l, f.sublist[j].name.nameToId());
                                            itm.append(l);
                                            sub = itm.find("#slist-" + (t.name + "-" + f.sublist[j].name).nameToId());
                                            bhs.buildMenu(sub, f.sublist[j].name, slist);
                                            if (f.sublist[j].required)
                                                sub.find("#id-menu").html("<div>" + f.sublist[j].name + `&nbsp;<font style="color:red">*</font>&nbsp;<\div>`);
                                        } else if (f.sublist[j].type == "checkbox") {
                                            l = /idname/ [Symbol.replace](tCkList, (t.name + "-" + f.sublist[j].name).nameToId());
                                            l = /idname/g [Symbol.replace](l, f.sublist[j].name.nameToId());
                                            itm.append(l);
                                            sub = itm.find("#cklist-" + f.sublist[j].name.nameToId());
                                            for (let m = 0; m < slist.length; ++m) {
                                                l = /idname/g [Symbol.replace](tCkItm, slist[m].name.nameToId());
                                                l = /title/ [Symbol.replace](l, slist[m].name);
                                                sub.append(l);
                                            }
                                        }

                                        if (f.sublist[j].ttip) {
                                            l = /ttext/ [Symbol.replace](tText, t[f.sublist[j].ttip]);
                                            sub.find("#row-" + f.sublist[j].name.nameToId()).append(l);
                                        }
                                    }
                                }
                            }
                        }
                        break;

                    case "img":
                        l = /title/ [Symbol.replace](tImg, f.name + req);
                        l = /idname/g [Symbol.replace](l, id);
                        itm.append(l);
                        break
                    case "string":
                        l = /title/ [Symbol.replace](tString, f.name + req);
                        l = /idname/g [Symbol.replace](l, id);
                        itm.append(l);
                        break;
                }

                if (f.ttip) {
                    l = /ttext/ [Symbol.replace](tText, f.ttip);
                    itm.find("#row-" + id).append(l);
                }
            }
        }

        $('[data-toggle="tooltip"]').tooltip();
    });
}

blackHoleSuns.prototype.selectType = function (btn) {
    $("#typePanels [id|='pnl']").hide();
    $("#typePanels").find("#pnl-" + btn.text().stripMarginWS()).show();
}

blackHoleSuns.prototype.selectSublist = function (btn) {
    let t = btn.text().stripMarginWS();
    let f = btn.prop("id").slice(4);
    let pnl = btn.closest("[id|='pnl']");
    let p = pnl.prop("id").slice(4);

    let pidx = bhs.getIndex(objectList, "name", p);
    let fidx = bhs.getIndex(objectList[pidx].fields, "name", f);
    let sub = objectList[pidx].fields[fidx].sublist;

    pnl.find("[id|='slist']").hide();

    for (let i = 0; i < sub.length; ++i) {
        pnl.find("#slist-" + (t + "-" + sub[i].name).nameToId()).show();
        pnl.find("#ckpnl-" + (t + "-" + sub[i].name).nameToId()).show();
    }
}

let imgcanvas = document.createElement('canvas');
let txtcanvas = document.createElement('canvas');

function loadCanvasWithInputFile(evt) {
    const cvs = `
            <div id="img-idname" class="col-md-9 col-10">
                <canvas id="id-canvas" class="border"></canvas>
            </div>
            <div class="col-md-5 col-4 txt-inp-def">
                <div class="row">
                    <label class="col-sm-11 col-14">
                        <input id="ck-name" type="checkbox" onchange="addText(this)">
                        Traveler Name&nbsp;
                    </label>
                    <input id="sel-name" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">
                </div>
                <div class="row"> 
                    <label class="col-sm-11 col-14">
                        <input id="ck-sysinfo" type="checkbox" onchange="addText(this)">
                        System Info&nbsp;
                    </label>
                    <input id="sel-sysinfo" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">
                </div>
                <div class="row"> 
                    <label class="col-sm-11 col-14">
                        <input id="ck-glyph" type="checkbox" onchange="addText(this)">
                        Portal Glyph&nbsp;
                    </label>
                    <input id="sel-glyph" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">
                </div>
                <div class="row"> 
                    <label class="col-sm-11 col-14">
                        <input id="ck-galaxy" type="checkbox" onchange="addText(this)">
                        Galaxy&nbsp;
                    </label>
                    <input id="sel-galaxy" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">
                </div>
                <div class="row"> 
                    <label class="col-sm-11 col-14">
                        <input id="ck-shipinfo" type="checkbox" onchange="addText(this)">
                        Ship Info&nbsp;
                    </label>
                    <input id="sel-shipinfo" class="col-2 bkg-def" style="border-color:black" onchange="setColor(this)" type="color" value="#ffffff">
                </div>
           </div>    
        </div>`;

    //for (let i = 0; i < evt.files.length; ++i) {
    let file = evt.files[0];
    if (file.type.match('image.*')) {
        let id = file.name.nameToId();
        let h = /idname/g [Symbol.replace](cvs, id);
        $("#imgtable").append(h);

        let img = $("#img-" + id+ " #id-canvas");
        img.mousedown(function (e) {
            handleMouseDown(e);
        });
        img.mousemove(function (e) {
            handleMouseMove(e);
        });
        img.mouseup(function (e) {
            handleMouseUp(e);
        });
        img.mouseout(function (e) {
            handleMouseOut(e);
        });

        let imgctx = imgcanvas.getContext("2d");

        let canvas = document.getElementById("id-canvas");
        let ctx = canvas.getContext("2d");

        let width = $("#img-"+id).width();

        let reader = new FileReader();
        reader.onload = function () {
            let img = new Image();
            img.onload = function () {
                canvas.width = imgcanvas.width = txtcanvas.width = width;
                canvas.height = imgcanvas.height = txtcanvas.height = img.height * width / img.width;
                imgctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                let logo = new Image();
                logo.onload = function () {
                    imgctx.drawImage(logo, 5, canvas.height - 35, 30, 30);
                    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height);
                };

                logo.src = "/image0.png";
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    }
    //  }
}

var texts = [];
var selectedText = -1;
var startX = 0;
var startY = 0;

function addText(evt) {
    let canvas = document.getElementById("id-canvas");
    let ctx = canvas.getContext("2d");

    let ck = $(evt).prop("checked");
    let id = $(evt).prop("id");
    let sub = id.replace(/ck-(.*)/, "$1");

    if (ck) {
        var text = {
            font: "16px verdana",
            sub: sub,
            color: $("#sel-" + sub).val(),
            x: 20,
            y: texts.length * 20 + 20,
        };

        switch ($(evt).prop("id")) {
            case "ck-name":
                text.text = "by " + bhs.user._name;
                break;
            case "ck-sysinfo":
                text.text = $("#btn-Lifeform").text().stripMarginWS() + " " + $("#btn-Economy").text().stripNumber();
                break;
            case "ck-glyph":
                text.font = "20px glyph"
                text.text = $("#id-glyph").text().stripMarginWS();
                break;
                // case "ck-shipinfo":
                //     text.text = "ship info";
                //     text.color = $("#sel-shipinfo").val();
                //     break;
            case "ck-galaxy":
                text.text = bhs.user.galaxy;
                text.color = $("#sel-galaxy").val();
                break;
        }

        let txtctx = txtcanvas.getContext("2d");
        txtctx.font = text.font;
        txtctx.fillStyle = text.color;
        text.width = txtctx.measureText(text.text).width;
        text.height = 16;
        texts.push(text);
    } else {
        for (let i = 0; i < texts.length; ++i)
            if (texts[i].sub == sub)
                texts.splice(i, 1);
    }

    drawText();

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height);
}

function setColor(evt) {
    let canvas = document.getElementById("id-canvas");
    let ctx = canvas.getContext("2d");

    for (let i = 0; i < texts.length; ++i)
        texts[i].color = $("#sel-" + texts[i].sub).val();

    drawText();

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height);
}

function drawText() {
    let txtctx = txtcanvas.getContext("2d");
    txtctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height);

    for (var i = 0; i < texts.length; i++) {
        var text = texts[i];
        if (text.sub == "glyph") {
            txtctx.fillStyle = text.color;
            txtctx.fillRect(text.x - 2, text.y - text.height - 2, text.width + 4, text.height + 4);
            txtctx.fillStyle = "#000000";
            txtctx.fillRect(text.x - 1, text.y - text.height - 1, text.width + 2, text.height + 2);
        }

        txtctx.font = text.font;
        txtctx.fillStyle = text.color;
        txtctx.fillText(text.text, text.x, text.y);
    }
}

function textHittest(x, y, textIndex) {
    var text = texts[textIndex];
    return (x >= text.x && x <= text.x + text.width && y >= text.y - text.height && y <= text.y);
}

function handleMouseDown(e) {
    e.preventDefault();

    var canvas = $(e.currentTarget).get(0);
    var canvasOffset = canvas.getBoundingClientRect();

    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    startX = parseInt(e.clientX - offsetX);
    startY = parseInt(e.clientY - offsetY);

    for (var i = 0; i < texts.length && selectedText == -1; i++)
        if (textHittest(startX, startY, i))
            selectedText = i;
}

function handleMouseUp(e) {
    e.preventDefault();
    selectedText = -1;
}

function handleMouseOut(e) {
    e.preventDefault();
    selectedText = -1;
}

function handleMouseMove(e) {
    if (selectedText < 0)
        return;

    e.preventDefault();
    let canvas = document.getElementById("id-canvas");
    let ctx = canvas.getContext("2d");

    var cid = $(e.currentTarget).get(0);
    var canvasOffset = cid.getBoundingClientRect();
    var offsetX = canvasOffset.left;
    var offsetY = canvasOffset.top;
    let mouseX = parseInt(e.clientX - offsetX);
    let mouseY = parseInt(e.clientY - offsetY);

    var text = texts[selectedText];

    var dx = mouseX - startX;
    var dy = mouseY - startY;
    startX = mouseX;
    startY = mouseY;

    text.x += dx;
    text.y += dy;

    drawText();

    ctx.drawImage(imgcanvas, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height);
}

const shipList = [{
    name: "Fighter",
    slotTtip: `
        T1 - 15-19 slots<br>
        T2 - 20-29 slots<br>
        T3 - 30-38 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
    subType: [{
        name: "Needle Nose"
    }, {
        name: "Long Nose"
    }, {
        name: "Short Nose"
    }, ],
    features: [{
        name: "Droid"
    }, {
        name: "Halo"
    }, ]
}, {
    name: "Hauler",
    slotTtip: `
        T1 - 15-19 slots<br>
        T2 - 20-29 slots<br>
        T3 - 30-38 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
}, {
    name: "Shuttle",
    slotList: [{
        name: "T1"
    }, {
        name: "T2"
    }],
    slotTtip: `
        T1 - 18-23 slots<br>
        T2 - 19-28 slots`,
    classTtip: `
        S - 55-60% damage, 15-25% shield<br>
        A - 35-50% damage, 15-20% shield<br>
        B - 15-30% damage, 5-10% shield<br>
        C - 5-10% damage`,
}, {
    name: "Explorer",
    slotTtip: `
        T1 - 15 - 31 slots < br >
        T2 - 32 - 39 slots < br >
        T3 - 40 - 48 slots < br >`,
    classTtip: `
        S - 10 - 20 % damage, 55 - 60 % shield, 30 - 35 % hyperdrive < br >
        A - 5 - 10 % damage, 45 - 50 % shield, 15 - 25 % hyperdrive < br >
        B - 0 - 5 % damage, 25 - 35 % shield, 5 - 10 % hyperdrive < br >
        C - 12 - 20 % shield, 0 - 5 % hyperdrive`,
}, {
    name: "Exotic",
}];

const classList = [{
    name: "S",
}, {
    name: "A",
}, {
    name: "B",
}, {
    name: "C",
}];

const slotList = [{
    name: "T1",
}, {
    name: "T2",
}, {
    name: "T3",
}, ];

const mtList = [{
    name: "Alien",
}, {
    name: "Experimental",
}, {
    name: "Pistol",
}, {
    name: "Rifle",
}, ]

const colorList = [{
    name: "Red",
}, {
    name: "Orange",
}, {
    name: "Yellow",
}, {
    name: "Green",
}, {
    name: "Blue",
}, {
    name: "Black",
}, {
    name: "Grey",
}, {
    name: "White",
}, {
    name: "Cream",
}, {
    name: "Chrome",
}, {
    name: "Bronze",
}, {
    name: "Gold",
}, ];

const freighterList = [{
    name: "Sentenel"
}, {
    name: "Venator"
}];

// player name, galaxy, platform
const objectList = [{
    name: "Ship",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Wave",
        type: "number",
        ttip: "Wave based on looking away after reload for 0, 29, 49 & 65 sec.",
        range: "3"
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        required: true,
        sublist: [{
            name: "Subtype",
            type: "menu",
            sub: "subType",
        }, {
            name: "Features",
            type: "checkbox",
            sub: "features",
        }, {
            name: "Class",
            type: "menu",
            ttip: "classTtip",
            list: classList
        }, {
            name: "Slots",
            type: "menu",
            ttip: "slotTtip",
            sub: "slotList",
            list: slotList,
        }, ]
    }, {
        name: "Primary Color",
        type: "list",
        list: colorList,
        required: true,
    }, {
        name: "Secondary Color",
        type: "list",
        list: colorList,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Freighter",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Type",
        type: "list",
        list: freighterList,
        required: true,
        sublist: [{
            name: "Subtype",
            sub: "subType",
        }, {
            name: "Slots",
            type: "list",
            ttipFld: "slotTtip",
            list: slotList,
        }, {
            name: "Class",
            type: "list",
            ttipFld: "classTtip",
            list: classList,
        }, ]
    }, {
        name: "Primary Color",
        type: "list",
        list: colorList,
        required: true,
    }, {
        name: "Secondary Color",
        type: "list",
        list: colorList,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Multi-Tool",
    fields: [{
        name: "Name",
        type: "string"
    }, {
        name: "Type",
        type: "list",
        list: mtList,
        required: true,
    }, {
        name: "Class",
        type: "list",
        list: classList,
        ttipFld: "classTtip",
        required: true,
    }, {
        name: "Slots",
        type: "number",
        required: true,
    }, {
        name: "Planet",
        type: "string",
    }, {
        name: "Latitude",
        type: "string",
    }, {
        name: "Longitude",
        type: "string",
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Flora"
}, {
    name: "Fauna"
}, {
    name: "Planet"
}, {
    name: "Base",
    fields: [{
        name: "Name",
        type: "string",
        required: true,
    }, {
        name: "Game Mode",
        type: "list",
        list: modeList,
        required: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}];