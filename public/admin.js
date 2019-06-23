'use strict';

$(document).ready(function () {
    // startUp();
    bhs.buildSelectPanel();
    bhs.buildOrgPanel();

    $("#adminsave").click(function () {
        let ref = bhs.fs.collection("users");
        ref = ref.where("_name", "==", $("#btn-Player").text().stripMarginWS());
        ref.get().then(function (snapshot) {
            if (snapshot.size == 1) {
                bhs.user = snapshot.docs[0].data();

                bhs.save();
            } else
                $("#status").text("player " + $("#btn-Player").text().stripMarginWS() + " not found.");
        });
    });

    $("#admindelete").click(function () {
        $("#status").empty();
        let ref = bhs.fs.collection("users");
        ref = ref.where("_name", "==", $("#btn-Player").text().stripMarginWS());
        ref.get().then(function (snapshot) {
            if (snapshot.size == 1) {
                bhs.user = snapshot.docs[0].data();

                $("#delete").trigger("click");
            } else
                $("#status").text("player " + $("#btn-Player").text().stripMarginWS() + " not found.");
        });
    });
});

blackHoleSuns.prototype.buildSelectPanel = async function () {
    const panel = `
        <div id="sel">
            <div class="row">
                <div id="id-Player" class="col-4 text-center"></div>
                <div id="id-Platform" class="col-4 text-center"></div>
                <div id="id-Galaxy" class="col-4 text-center"></div>
            </div>
        <br>`;

    $("#pnl-user").append(panel);
    let loc = $("#pnl-user #sel");

    bhs.usersList = await bhs.getUserList();
    bhs.usersList.unshift({
        name: "",
        uid: null
    });

    bhs.buildMenu(loc, "Player", bhs.usersList, bhs.select, true);
    bhs.buildMenu(loc, "Platform", platformList, bhs.select, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, bhs.select, true);
}

blackHoleSuns.prototype.select = function () {
    bhs.entries = {};
    let i = bhs.getIndex(bhs.usersList, "name", $("#btn-Player").text().stripMarginWS());
    let uid = i != -1 ? bhs.usersList[i].uid : null;
    let galaxy = $("#btn-Galaxy").text().stripNumber();
    let platform = $("#btn-Platform").text().stripMarginWS();
    bhs.getEntries(bhs.displayEntryList, uid, galaxy, platform);
}

blackHoleSuns.prototype.buildOrgPanel = async function () {
    let loc = $("#orgPanel");
    await bhs.getOrgList();
    bhs.orgList.shift();
    bhs.buildMenu(loc, "Org", bhs.orgList, bhs.selectOrg);

    $("#orgsave").click(function () {
        let idx = bhs.getIndex(bhs.orgList, "_name", $("#btn-Org").text().stripMarginWS());
        let o ={};
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
                bhs.fbstorage.ref().child(o.logo).delete();

            let ext = file[0].files[0].name.replace(/.*(\..*)$/, "$1")
            e.logo = "orgs/images/" + uuidv4() + ext;
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
        ref = ref.where("_name", "==", o._name?o._name:"_0_");

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
        let o ={};
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
    let idx = bhs.getIndex(bhs.orgList,"_name",loc.find("#btn-Org").text().stripMarginWS());
    let e = bhs.orgList[idx];

    loc.find("#inp-org").val(e._name);
    loc.find("#inp-orglink").val(e.link);
    loc.find("#inp-orgaddr").val(e.addr);

    let ref = bhs.fbstorage.ref().child(e.logo);
    ref.getDownloadURL().then(function(url){
        $("#img-orglogo").attr("src", url);
    });

    $("#orgdelete").removeClass("disabled");
    $("#orgdelete").removeAttr("disabled");
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

blackHoleSuns.prototype.statusOut = function (id, str) {
    $("#" + id).append("<h6>" + str + "</h6>");
}