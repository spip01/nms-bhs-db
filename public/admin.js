'use strict';

$(document).ready(function () {
    // startUp();
    bhs.buildSelectPanel();

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
    bhs.usersList = await bhs.getUserList();
    bhs.usersList.unshift({
        name: "",
        uid: null
    });

    let loc = $("#pnl-user");
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
    bhs.getEntries(bhs.displayEntryList, bhs.displayEntry, uid, galaxy, platform);
}
