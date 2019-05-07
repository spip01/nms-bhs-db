'use strict';

$(document).ready(function () {
    startUp();

    bhs.buildUserPanel();

    $("#submit").click(function () {
        if (bhs.fileSelected)
            bhs.readTextFile(bhs.fileSelected);
        else
            $("#status").prepend("<h7>No file selected</h7>");
    });

    $("#uploadedFile").change(function () {
        bhs.fileSelected = this;
    });
});

var importTable = [{
    match: /platform/i,
    field: "platform",
    required: true,
    format: tolower,
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
    validate: validateAddress,
    group: 1
}, {
    match: /economy/i,
    field: "econ",
    format: formatEcon,
    group: 1
}, {
    match: /region/i,
    field: "reg",
    group: 1
}, {
    match: /system/i,
    field: "sys",
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
    validate: validateAddress,
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
        console.log("rows "+allrows.length);

        let hdr = allrows[1].split(/[,\t]/);

        bhs.batch = bhs.fbfs.batch();
        bhs.batchcount = 0;

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
        entry[0].version = "next";
        let lastplayer = bhs.user.player;

        for (let i = 2, ok = true; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {};
            entry[2] = {};

            width = Math.ceil(i * step);
            progress.css("width", width + "%");
            progress.text(i);

            let row = allrows[i].split(/[,\t]/);

            if (row.length == 1 || row[importTable[3].index] == "")
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

                        if (!ok) {
                            let s = importTable[j].group == 1 ? "bh " : importTable[j].group == 2 ? "exit " : "";
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field] + "</h7>");
                        }
                    }
                }
            }

            if (ok) {
                entry[0].platform = entry[0].platform.match(/pc/i) ||
                    entry[0].platform.match(/xbox/i) ? "PC-XBox" : entry[0].platform.toUpperCase();

                if (entry[0].player != lastplayer) {
                    let ref = bhs.getUsersColRef().where("player", "==", entry[0].player);
                    await ref.get().then(async function (snapshot) {
                        if (snapshot.exists)
                            entry[0].uid = snapshot.doc.data().uid;
                    });
                    lastplayer = entry[0].player;
                } else
                    entry[0].uid = bhs.user.uid;

                bhs.merge(entry[1], entry[0]);
                bhs.merge(entry[2], entry[0]);

                if (entry[2].addr == "0000:0000:0000:0000") {
                    entry[2].basename = entry[2].sys ? entry[2].sys : entry[2].reg;

                    if (!entry[2].basename && entry[1].sys && entry[1].reg) {
                        await bhs.batchUpdate(entry[1]);
                    } else if (entry[2].uid) {
                        entry[1].hasbase = true;
                        entry[2].addr = entry[1].addr;
                        delete entry[2].sys;
                        delete entry[2].reg;
                        bhs.batchUpdate(entry[1]); // don't overwrite bh info if it exists
                        bhs.batchWriteBase(entry[2]);
                    } else
                        console.log("Not written " + row);
                } else {
                    entry[1].deadzone = entry[2].addr == entry[1].addr;
                    entry[1].blackhole = !entry[1].deadzone;

                    if (entry[1].blackhole || entry[1].deadzone) {
                        if (!(ok = validateBHAddress(entry[1].addr)))
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid black hole address " + entry[1].addr + "</h7>");

                        if (ok && entry[1].blackhole) {
                            entry[1].connection = entry[2].addr;
                            if (!(ok = validateExitAddress(entry[2].addr))) {
                                $("#status").prepend("<h7>row: " + (i + 1) + " invalid exit address " + entry[1].addr + "</h7>");
                            }
                        }

                        if (ok) {
                            bhs.batchWrite(entry[1]);

                            if (entry[1].blackhole)
                                bhs.batchWrite(entry[2]);
                        } else
                            console.log("Not written " + row);
                    }
                }

                delete entry[0].uid;
            }
        }

        console.log("commit");
        await bhs.batch.commit();
        progress.css("width", 100 + "%");
        progress.text("done");
    }

    reader.readAsText(file);
}

blackHoleSuns.prototype.batchWrite = function (entry) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    bhs.batch.set(ref, entry);
    console.log("set " + entry.addr);
    if (++bhs.batchcount == 500) {
        console.log("commit");
        bhs.batch.commit();
        bhs.batch = bhs.fbfs.batch();
        bhs.batchcount = 0;
    }
}

blackHoleSuns.prototype.batchUpdate = async function (entry) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            bhs.batch.set(ref, entry).catch(function () {
                console.log("error");
                ref.set(entry).then(function () {
                    console.log("retry ok");
                });
            });
            console.log("add " + entry.addr);
        } else {
            bhs.batch.update(ref, entry).catch(function () {
                console.log("error");
                ref.update(entry).then(function () {
                    console.log("retry ok");
                });;
            });
            console.log("update " + entry.addr);
        }

        if (++bhs.batchcount == 500) {
            console.log("commit");
            bhs.batchbatch.commit();
            bhs.batch = bhs.fbfs.batch();
            bhs.batchcount = 0;
        }
    });
}

blackHoleSuns.prototype.batchWriteBase = function (entry) {
    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    bhs.batch.set(ref, entry);
    console.log("base " + entry.addr);
    if (++bhs.batchcount == 500) {
        console.log("commit");
        bhs.batchbatch.commit();
        bhs.batch = bhs.fbfs.batch();
        bhs.batchcount = 0;
    }
}