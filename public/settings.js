'use strict';

$(document).ready(function () {
    startUp();

    let loc = $("#pnl-user");

    //bhs.generatePlayerList();
    //bhs.buildMenu(loc, "Players", bhs.playerList, true);

    bhs.buildMenu(loc, "Platform", platformList, true);
    bhs.buildMenu(loc, "Galaxy", galaxyList, true);

    bhs.buildUserTable();
    //bhs.buildStats();

    $("#submit").click(function () {
        if (bhs.fileSelected)
            bhs.readTextFile(bhs.fileSelected);
        else
            $("#status").prepend("<h7>No file selected</h7>");
    });

    $("#uploadedFile").change(function () {
        bhs.fileSelected = this;
        //bhs.readTextFile(this);
    });
});

var importTable = [{
    match: /platform/i,
    field: "platform",
    required: true,
    group: 0
}, {
    match: /galaxy/i,
    field: "galaxy",
    required: true,
    format: stripNumber,
    group: 0
}, {
    match: /(traveler)|(player)/i,
    field: "player",
    group: 0
}, { // 1st match
    match: /coord/i,
    field: "addr",
    required: true,
    format: reformatAddress,
    validate: validateBHAddress,
    group: 1
}, {
    match: /economy/i,
    field: "econ",
    format: formatEcon,
    group: 1
}, {
    match: /region/i,
    field: "reg",
    required: true,
    group: 1
}, {
    match: /system/i,
    field: "sys",
    required: true,
    group: 1
}, {
    match: /sun/i,
    field: "sun",
    group: 1
}, {
    match: /lifeform/i,
    field: "life",
    group: 1
}, {
    match: /conflict/i,
    field: "conflict",
    format: formatConflict,
    group: 1
}, { // 2nd match
    match: /coord/i,
    field: "addr",
    required: true,
    format: reformatAddress,
    validate: validateExitAddress,
    group: 2
}, {
    match: /economy/i,
    field: "econ",
    format: formatEcon,
    group: 2
}, {
    match: /region/i,
    field: "reg",
    checkreq: checkZeroAddress,
    checkval: 10,
    checkgrp: 2,
    group: 2
}, {
    match: /system/i,
    field: "sys",
    checkreq: checkZeroAddress,
    checkval: 10,
    checkgrp: 2,
    group: 2
}, {
    match: /sun/i,
    field: "sun",
    group: 2
}, {
    match: /lifeform/i,
    field: "life",
    group: 2
}, {
    match: /conflict/i,
    field: "conflict",
    format: formatConflict,
    group: 2
}];

blackHoleSuns.prototype.readTextFile = function (f) {
    let file = f.files[0];
    let reader = new FileReader();

    reader.onload = async function () {
        let allrows = reader.result.split(/\r?\n|\r/);
        let hdr = allrows[1].split(/[,\t]/);

        let step = 1 / allrows.length * 100;
        let width = 1;
        let progress = $("#progress");
        progress.prop("width", width + "%");
        progress.show();

        for (let i = 0; i < importTable.length; ++i) {
            for (let j = 0; j < hdr.length; ++j) {
                if (hdr[j].search(importTable[i].match) != -1) {
                    importTable[i].index = j;
                    hdr[j] = "";
                    break;
                }
            }

            if (importTable[i].required && importTable[i].index == -1) {
                console.log("missing " + importTable[i].match + " " + allrows[1]);
                return;
            }
        }

        var entry = [];
        entry[0] = {};
        entry[0].player = bhs.user.player;
        entry[0].galaxy = bhs.user.galaxy;
        entry[0].platform = bhs.user.platform;

        for (let i = 2, ok = true; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {};
            entry[2] = {};

            width = Math.ceil(i * step);
            progress.css("width", width + "%");
            progress.text(i);

            let row = allrows[i].split(/[,\t]/);

            if (row[importTable[4].index] == "")
                ok = false;

            for (let j = 0; j < importTable.length && ok; ++j) {
                let idx = importTable[j].index;
                if (idx >= 0) {
                    if (row[idx] == "") {
                        let grp = importTable[j].checkgrp;
                        let val = importTable[j].checkval;
                        if (importTable[j].required || importTable[j].checkreq &&
                            importTable[j].checkreq(entry[importTable[grp].group][importTable[val].field])) {
                            $("#status").prepend("<h7>row: " + (i + 1) + " missing " + importTable[j].match + "</h7>");
                            ok = false;
                        }
                    } else {
                        if (importTable[j].format)
                            row[idx] = importTable[j].format(row[idx]);

                        if (importTable[j].validate)
                            ok = importTable[j].validate(row[idx]);

                        entry[importTable[j].group][importTable[j].field] = row[idx];

                        if (!ok)
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid value " + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field] + "</h7>");
                    }
                }
            }

            if (ok) {
                entry[0].platform = entry[0].platform.match(/pc/i) ||
                    entry[0].platform.match(/xbox/i) ? "PC-XBox" : entry[0].platform;

                for (let i = 1; i <= 2; ++i) {
                    entry[i].player = entry[0].player;
                    entry[i].galaxy = entry[0].galaxy;
                    entry[i].platform = entry[0].platform;

                    entry[i].blackhole = i == 1;
                    entry[i].exit = i == 2;

                    entry[i].connection = entry[2].addr;
                    entry[i].time = firebase.firestore.Timestamp.fromDate(new Date());
                }

                let ref = bhs.fbfs.collection(starsCol)
                await ref.where("name", "==", entry[0].galaxy).get().then(function (snapshot) {
                    if (snapshot.empty) {
                        ref.doc(entry[0].galaxy).set({
                            name: entry[0].galaxy,
                            time: entry[0].time,
                            player: entry[0].player
                        });
                    }
                });

                ref = ref.doc(entry[0].galaxy).collection(entry[0].platform);

                await ref.doc(entry[1].addr).get().then(function (doc) {
                    //if (!doc.exists) {
                    ref.doc(entry[1].addr).set(entry[1]);
                    //}
                });

                if (entry[1].connection != "0000:0000:0000:0000")
                    await ref.doc(entry[2].addr).get().then(function (doc) {
                        //if (!doc.exists) {
                        ref.doc(entry[2].addr).set(entry[2]);
                        // }
                    });
            }
        }

        progress.hide();
    }

    reader.readAsText(file);
}