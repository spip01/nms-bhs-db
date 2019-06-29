'use strict';

$(document).ready(async function () {
    startUp();

    await bhs.getOrgList();
    await bhs.getPoiList();

    bhs.buildPanel("pnl-org", bhs.orgList);
    bhs.buildPanel("pnl-poi", bhs.poiList);
});

blackHoleSuns.prototype.selectMenu = function () {
    let loc = $(this);
    loc.closest("[id|='btn'").text(loc.text().stripNumber());
}

blackHoleSuns.prototype.buildPanel = function (id, list) {
    let pnl = $("#" + id);

    let h = panel;
    if (id == "pnl-org") {
        h = /title/ [Symbol.replace](h, "Organizations");
        h = /pictitle/ [Symbol.replace](h, "Logo");
        h = /hsize/ [Symbol.replace](h, "120px");
        h = /wsize/ [Symbol.replace](h, "120px");
    } else {
        h = /title/ [Symbol.replace](h, "Points of interest");
        h = /pictitle/ [Symbol.replace](h, "Image");
        h = /hsize/ [Symbol.replace](h, "90px");
        h = /wsize/ [Symbol.replace](h, "160px");
    }

    pnl.append(h);

    bhs.buildMenu(pnl, "Mode", modeList, bhs.selectMenu);
    bhs.buildMenu(pnl, "Platform", platformList, bhs.selectMenu);
    bhs.buildMenu(pnl, "Galaxy", galaxyList, bhs.selectMenu);
    bhs.buildTable(pnl, list);

    if (id == "pnl-poi") {
        pnl.find("#id-link").hide();
        pnl.find("#platform-ckbox").hide();
    } else {
        pnl.find("#platform-menu").hide();
        pnl.find("#mode-menu").hide();
    }

    pnl.find("#inp-addr").change(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);
    });

    pnl.find("#id-table").height(pnl.find("#inputs").outerHeight());
}

blackHoleSuns.prototype.buildTable = function (pnl, list) {
    let row = `
        <div class="row text-nowrap" onclick="bhs.listClick(this)">
            name
        </div>`;

    let h = "";
    for (let i = 0; i < list.length; ++i) {
        h += /name/ [Symbol.replace](row, list[i]._name);
    }

    pnl.find("#id-table").empty();
    pnl.find("#id-table").append(h);
}

const panel = `
<div class="card-header bkg-def txt-def h5">title</div>
<div class="card-body">
    <div class="row">
        <div class="col-md-4 col-14">
            <div id="id-table" class="border scrollbar container-fluid"
                style="overflow-y: scroll; height: 300px"></div>
        </div>

        <div class="col-md-10 col-14">
            <div id="inputs" class="card card-body border">
                <div class="row">
                    <div class="col-7">
                        <div class="row">
                            <div class="col-4 txt-inp-def h6">Name</div>
                            <input id="inp-name" class="rounded col-9" type="text">
                        </div>
                        <div id="id-link" class="row">
                            <div class="col-4 txt-inp-def h6">Link</div>
                            <input id="inp-link" class="rounded col-9" type="text">
                        </div>
                        <br>
                        <div class="row">
                            <div class="col-14 text-center">
                                <img id="img-pic" height="hsize" width="wsize" />
                            </div>
                        </div>
                    </div>
                    <br>
                    <div class="col-7 border-left">
                        <div class="row">
                            <div class="col-4 txt-inp-def h6">Coord</div>
                            <input id="inp-addr" class="rounded col-9" type="text" placeholder="0000:0000:0000:0000">
                        </div>
                        <br>
                        <div id="platform-menu" class="row">
                            <div id="id-Platform" class="col-14 text-center"></div>
                        </div>
                        <div id="platform-ckbox" class="row">
                            <div class="col-2"></div>
                            <label class="col-4 h6 txt-inp-def">
                                <input id="ck-pc-xbox" type="checkbox">
                                PC-XBox
                            </label>
                            <label class="col-4 h6 txt-inp-def">
                                <input id="ck-ps4" type="checkbox">
                                PS4
                            </label>
                        </div>
                        <div class="row">
                            <div id="id-Galaxy" class="col-14 text-center"></div>
                        </div>
                        <div id="mode-menu" class="row">
                            <div id="id-Mode" class="col-14 text-center"></div>
                        </div>
                    </div>
                </div>
                <br>

                <div class="row">
                    <div class="col-3 txt-inp-def h6">pictitle</div>
                    <input id="img-file" type="file" class="col-8 form-control form-control-sm"
                        accept="image/png, image/jpeg">&nbsp;
                </div>
                <div id="progressbar" class="progress hidden">
                    <div id="progress" class="progress-bar progress-bar-striped bg-success progress-bar-animated hidden"
                        role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <br>
                
                <div class="row">
                    <button id="btn-save" type="button" class="col-2 btn  btn-sm btn-def" onclick="bhs.save(this)">Save</button>&nbsp;
                    <button id="btn-delete" type="button" class="col-2 btn  btn-sm btn-def disabled"
                        disabled  onclick="bhs.delete(this)">Delete</button>&nbsp;
                    <button id="btn-cancel" type="button" class="col-2 btn  btn-sm btn-def" onclick="bhs.cancel(this)">Cancel</button>&nbsp;
                    <div id="status" class="col-7 border text-danger scrollbar container-fluid"
                        style="overflow-y: scroll; height: 40px">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

var lastSel = null;

blackHoleSuns.prototype.listClick = function (evt) {
    let loc = $(evt);
    if (lastSel)
        $(lastSel).removeClass("bkg-light-green");
    lastSel = loc;
    $(lastSel).addClass("bkg-light-green");

    let sel = loc.text().stripMarginWS();
    let pnl = loc.closest("[id|='pnl']");
    let pnlid = pnl.prop("id");
    let list = pnlid == "pnl-org" ? bhs.orgList : bhs.poiList;

    let idx = bhs.getIndex(list, "_name", sel);
    let e = list[idx];

    pnl.find("#inp-name").val(e._name);

    if (pnlid == "pnl-org")
        pnl.find("#inp-link").val(e.link);

    pnl.find("#inp-addr").val(e.addr);
    pnl.find("#btn-Galaxy").text(e.galaxy);
    pnl.find("#ck-pc-xbox").prop("checked", e["PC-XBox"]);
    pnl.find("#ck-ps4").prop("checked", e["PS4"]);
    pnl.find("#btn-Platform").text(e.platform);
    pnl.find("#btn-Mode").text(e.mode);

    pnl.find("#btn-save").text("Update");
    pnl.find("#btn-delete").removeClass("disabled");
    pnl.find("#btn-delete").removeAttr("disabled");

    if (e.img) {
        let ref = bhs.fbstorage.ref().child(e.img);
        ref.getDownloadURL().then(function (url) {
            pnl.find("#img-pic").attr("src", url);
        }).catch(function (error) {
            console.log(error);
            pnl.find("#img-pic").removeAttr("src");
        });
    } else
        pnl.find("#img-pic").removeAttr("src");
}

blackHoleSuns.prototype.save = function (evt) {
    let pnl = $(evt).closest("[id|='pnl']");
    let pnlid = pnl.prop("id");
    let list = pnlid == "pnl-org" ? bhs.orgList : bhs.poiList;
    let idx = -1;
    let sel = "";

    if (lastSel) {
        sel = $(lastSel).text().stripMarginWS();
        idx = bhs.getIndex(list, "_name",sel);
    }

    let e = {};
    e._name = pnl.find("#inp-name").val();
    e.name = e._name;
    e.link = pnl.find("#inp-link").val();
    if (!e.link) delete e.link;

    e.addr = pnl.find("#inp-addr").val();
    if (e.addr) {
        e.galaxy = pnl.find("#btn-Galaxy").text().stripNumber();
        e.mode = pnl.find("#btn-Mode").text().stripMarginWS();
        e.platform = pnl.find("#btn-Platform").text().stripMarginWS();
        if (e.platform == "") delete e.platform;
        e["PC-XBox"] = pnl.find("#ck-pc-xbox").prop("checked");
        e["PS4"] = pnl.find("#ck-ps4").prop("checked");

        if (e.galaxy == "" || (!e.platform && !e["PC-XBox"] && !e["PS4"])) {
            bhs.statusOut(pnl, "Galaxy/Platform must be set.");
            return;
        }
    } else
        delete e.addr;

    let file = pnl.find("#img-file");
    if (file.length > 0 && file[0].files && file[0].files.length > 0) {
        let ext = file[0].files[0].name.replace(/.*(\..*)$/, "$1")
        e.img = pnlid + "/" + uuidv4() + ext;

        let pb = pnl.find("#progressbar");
        pb.show();

        bhs.fbstorage.ref().child(e.img).put(file[0].files[0]).on('state_changed', function (snapshot) {
                var pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                pb.css("width", pct + "%");
            },
            function (error) {
                console.log(error);
            },
            function () {
                bhs.statusOut(pnl, "Upload complete.");
            });
    }


    let ref = bhs.fs.collection(pnlid == "pnl-org" ? "org" : "poi");
    ref = ref.where("_name", "==", sel !="" ? sel : uuidv4());

    ref.get().then(function (snapshot) {
        if (snapshot.size > 0) {
            snapshot.docs[0].ref.update(e);
            bhs.statusOut(pnl, e._name + " updated.");
            list[idx] = e;
        } else {
            let ref = bhs.fs.collection(pnlid == "pnl-org" ? "org" : "poi");
            ref.add(e);
            bhs.statusOut(pnl, e._name + " added.");
            list.push(e);
        }

        list.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
            a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);

        bhs.buildTable(pnl, list);
        bhs.cancel(pnl);
    }).catch(function (error) {
        console.log(error);
    });
}

blackHoleSuns.prototype.delete = function (evt) {
    let pnl = $(evt).closest("[id|='pnl']");
    let pnlid = pnl.prop("id");
    let list = pnlid == "pnl-org" ? bhs.orgList : bhs.poiList;

    if (lastSel) {
        let idx = bhs.getIndex(list, "_name", $(lastSel).text().stripMarginWS());
        let e = list[idx];

        if (e.img)
            bhs.fbstorage.ref().child(e.img).delete();

        let ref = bhs.fs.collection(pnlid == "pnl-org" ? "org" : "poi");
        ref = ref.where("_name", "==", e._name);
        ref.get().then(function (snapshot) {
            if (snapshot.size)
                snapshot.docs[0].ref.delete().then(async function () {
                    bhs.statusOut(pnl, e._name + " deleted.");

                    list.splice(idx, 1);
                    list.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                        a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);

                    bhs.buildTable(pnl, list);
                    bhs.cancel(evt);
                }).catch(function () {
                    console.log(error);
                });
            else
                bhs.statusOut(pnl, e._name + " not found.");
        });
    }
}

blackHoleSuns.prototype.cancel = function (evt) {
    let pnl = $(evt).closest("[id|='pnl']");
    pnl.find("#inp-name").val("");
    pnl.find("#inp-link").val("");
    pnl.find("#inp-addr").val("");
    pnl.find("#btn-Galaxy").text("");
    pnl.find("#btn-Platform").text("");
    pnl.find("#btn-Mode").text("");
    pnl.find("#ck-pc-xbox").prop("checked", false);
    pnl.find("#ck-ps4").prop("checked", false);
    pnl.find("#img-pic").removeAttr("src");

    pnl.find("#img-file").val("");
    pnl.find("#progress").hide();

    if (lastSel) {
        $(lastSel).removeClass("bkg-light-green");
        lastSel = null;
    }

    pnl.find("#btn-save").text("Save");
    pnl.find("#btn-delete").addClass("disabled");
    pnl.find("#btn-delete").prop("disabled", true);
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

blackHoleSuns.prototype.statusOut = function (pnl, str) {
    pnl.find("#status").prepend("<h6>" + str + "</h6>");
}