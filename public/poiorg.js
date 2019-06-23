'use strict';

$(document).ready(function () {
    startUp();
    bhs.buildOrgPanel();
    bhs.buildPoiPanel();
});

blackHoleSuns.prototype.buildOrgPanel = async function () {
    let loc = $("#orgPanel");
    await bhs.getOrgList();
    bhs.orgList.shift();
    bhs.buildMenu(loc, "Org", bhs.orgList, bhs.selectOrg);

    $("#orgsave").click(function () {
        let idx = bhs.getIndex(bhs.orgList, "_name", $("#btn-Org").text().stripMarginWS());
        let o = {};
        if (idx != -1)
            o = bhs.orgList[idx];

        let e = {};
        e._name = loc.find("#inp-org").val();
        e.name = e._name;
        e.link = loc.find("#inp-orglink").val();
        if (!e.link) delete e.link;
        e.addr = loc.find("#inp-orgaddr").val();
        if (!e.addr) delete e.addr;

        let file = loc.find("#inp-orglogo");
        if (file.length > 0 && file[0].files && file[0].files.length > 0) {
            if (o.logo)
                e.logo = o.logo;
            else {
                let ext = file[0].files[0].name.replace(/.*(\..*)$/, "$1")
                e.logo = "orgs/images/" + uuidv4() + ext;
            }

            bhs.fbstorage.ref().child(e.logo).put(file[0].files[0]).on('state_changed', function (snapshot) {
                    var pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    let progress = $("#orgprogress");
                    progress.show();
                    progress.css("width", pct + "%");
                },
                function (error) {
                    console.log(error);
                },
                function () {
                    bhs.statusOut("orgstatus", "Upload complete.");
                });
        }

        let ref = bhs.fs.collection("org");
        ref = ref.where("_name", "==", o._name ? o._name : "_0_");

        ref.get().then(function (snapshot) {
            if (snapshot.size > 0) {
                snapshot.docs[0].ref.update(e);
                bhs.statusOut("orgstatus", e._name + " updated.");
                bhs.orgList[idx] = e;
            } else {
                let ref = bhs.fs.collection("org");
                ref.add(e);
                bhs.statusOut("orgstatus", e._name + " added.");
                bhs.orgList.push(e);
            }

            bhs.orgList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);

            bhs.buildMenu(loc, "Org", bhs.orgList, bhs.selectOrg);

            $("#btn-Org").text(e._name);
        }).catch(function (error) {
            console.log(error);
        });
    });

    $("#orgdelete").click(function () {
        let idx = bhs.getIndex(bhs.orgList, "_name", $("#btn-Org").text().stripMarginWS());
        let o = {};
        if (idx != -1)
            o = bhs.orgList[idx];

        if (o.logo)
            bhs.fbstorage.ref().child(o.logo).delete();

        let ref = bhs.fs.collection("org");
        ref = ref.where("_name", "==", o._name);
        ref.get().then(function (snapshot) {
            if (snapshot.size)
                snapshot.docs[0].ref.delete().then(async function () {
                    bhs.statusOut("orgstatus", o._name + " deleted.");

                    bhs.orgList.splice(idx, 1);
                    bhs.orgList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                        a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);
                    bhs.buildMenu(loc, "Org", bhs.orgList, bhs.selectOrg);

                    $("#orgdelete").addClass("disabled");
                    $("#orgdelete").prop("disabled", true);
                }).catch(function () {
                    console.log(error);
                });
            else
                bhs.statusOut("orgstatus", old + " not found.");
        });
    });

    loc.find("#inp-orgaddr").change(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);
    });
}

blackHoleSuns.prototype.selectOrg = function () {
    let loc = $("#orgPanel");
    let idx = bhs.getIndex(bhs.orgList, "_name", loc.find("#btn-Org").text().stripMarginWS());
    let e = bhs.orgList[idx];

    loc.find("#inp-org").val(e._name);
    loc.find("#inp-orglink").val(e.link);
    loc.find("#inp-orgaddr").val(e.addr);

    let ref = bhs.fbstorage.ref().child(e.logo);
    ref.getDownloadURL().then(function (url) {
        $("#img-orglogo").attr("src", url);
    });

    $("#orgdelete").removeClass("disabled");
    $("#orgdelete").removeAttr("disabled");
}

blackHoleSuns.prototype.buildPoiPanel = async function () {
    let loc = $("#poiPanel");
    await bhs.getPoiList();
    bhs.buildMenu(loc, "Poi", bhs.poiList, bhs.selectPoi);

    $("#poisave").click(function () {
        let idx = bhs.getIndex(bhs.poiList, "_name", $("#btn-Poi").text().stripMarginWS());
        let o = {};
        if (idx != -1)
            o = bhs.poiList[idx];

        let e = {};
        e._name = loc.find("#inp-poi").val();
        e.name = e._name;
        e.addr = loc.find("#inp-poiaddr").val();
        if (!e.addr) delete e.addr;

        let file = loc.find("#inp-poipic");
        if (file.length > 0 && file[0].files && file[0].files.length > 0) {
            if (o.pic)
                e.pic = o.pic;
            else {
                let ext = file[0].files[0].name.replace(/.*(\..*)$/, "$1")
                e.pic = "poi/images/" + uuidv4() + ext;
            }

            bhs.fbstorage.ref().child(e.pic).put(file[0].files[0]).on('state_changed', function (snapshot) {
                    var pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    let progress = $("#poiprogress");
                    progress.show();
                    progress.css("width", pct + "%");
                },
                function (error) {
                    console.log(error);
                },
                function () {
                    bhs.statusOut("poistatus", "Upload complete.");
                });
        }

        let ref = bhs.fs.collection("poi");
        ref = ref.where("_name", "==", o._name ? o._name : "_0_");

        ref.get().then(function (snapshot) {
            if (snapshot.size > 0) {
                snapshot.docs[0].ref.update(e);
                bhs.statusOut("poistatus", e._name + " updated.");
                bhs.poiList[idx] = e;
            } else {
                let ref = bhs.fs.collection("poi");
                ref.add(e);
                bhs.statusOut("poistatus", e._name + " added.");
                bhs.poiList.push(e);
            }

            bhs.poiList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);

            bhs.buildMenu(loc, "Poi", bhs.poiList, bhs.selectPoi);

            $("#btn-Poi").text(e._name);
        }).catch(function (error) {
            console.log(error);
        });
    });

    $("#poidelete").click(function () {
        let idx = bhs.getIndex(bhs.poiList, "_name", $("#btn-Poi").text().stripMarginWS());
        let o = {};
        if (idx != -1)
            o = bhs.poiList[idx];

        if (o.pic)
            bhs.fbstorage.ref().child(o.pic).delete();

        let ref = bhs.fs.collection("poi");
        ref = ref.where("_name", "==", o._name);
        ref.get().then(function (snapshot) {
            if (snapshot.size)
                snapshot.docs[0].ref.delete().then(async function () {
                    bhs.statusOut("poistatus", o._name + " deleted.");

                    bhs.poiList.splice(idx, 1);
                    bhs.poiList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                        a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0);
                    bhs.buildMenu(loc, "Poi", bhs.poiList, bhs.selectPoi);

                    $("#poidelete").addClass("disabled");
                    $("#poidelete").prop("disabled", true);
                }).catch(function () {
                    console.log(error);
                });
            else
                bhs.statusOut("poistatus", old + " not found.");
        });
    });

    loc.find("#inp-poiaddr").change(function () {
        let addr = bhs.reformatAddress($(this).val());
        $(this).val(addr);
    });
}

blackHoleSuns.prototype.selectPoi = function () {
    let loc = $("#poiPanel");
    let idx = bhs.getIndex(bhs.poiList, "_name", loc.find("#btn-Poi").text().stripMarginWS());
    let e = bhs.poiList[idx];

    loc.find("#inp-poi").val(e._name);
    loc.find("#inp-poiaddr").val(e.addr);

    let ref = bhs.fbstorage.ref().child(e.pic);
    ref.getDownloadURL().then(function (url) {
        $("#img-poipic").attr("src", url);
    });

    $("#poidelete").removeClass("disabled");
    $("#poidelete").removeAttr("disabled");
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

blackHoleSuns.prototype.statusOut = function (id, str) {
    $("#" + id).prepend("<h6>" + str + "</h6>");
}