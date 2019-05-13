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

    $("#fixtotal").click(function () {
        bhs.calcTotals();
    });

    $("#uploadedFile").change(function () {
        bhs.fileSelected = this;
    });
});

var importTable = [{
    match: /platform/i,
    field: "platform",
    format: tolower,
    group: 0
}, {
    match: /galaxy/i,
    field: "galaxy",
    format: stripNumber,
    group: 0
}, {
    match: /type/i,
    field: "type",
    group: 0
}, {
    match: /traveler|player/i,
    field: "player",
    group: 0
}, { // 1st match
    match: /coord|addr/i,
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

var verbose = false;
var log = false;

blackHoleSuns.prototype.readTextFile = function (f) {
    let file = f.files[0];
    let reader = new FileReader();
    verbose = $("#ck-verbose").prop("checked");
    log = $("#ck-log").prop("checked");

    reader.onload = async function () {
        let allrows = reader.result.split(/\r?\n|\r/);
        if (verbose)
            $("#status").prepend("<h7>total rows " + allrows.length + "</h7>");

        bhs.batch = bhs.fbfs.batch();
        bhs.batchcount = 0;

        let step = 1 / allrows.length * 100;
        let width = 1;
        let progress = $("#progress");
        progress.prop("width", width + "%");
        progress.show();

        let k = 0;
        for (; k < allrows.length; ++k) {
            let row = allrows[k].split(/[,\t]/);

            for (let i = 0; i < importTable.length; ++i) {
                importTable[i].index = -1;
                for (let j = 0; j < row.length; ++j) {
                    if (row[j].search(importTable[i].match) != -1) {
                        importTable[i].index = j;
                        row[j] = "";
                        break;
                    }
                }

                if (importTable[i].required && importTable[i].index == -1) {
                    bhs.batchWriteLog(file.name + "-" + k + "-e", "missing required" + importTable[i].match + " " + allrows[1]);
                    bhs.batchWriteLog(file.name + "-" + i, row);
                    if (k == 1) {
                        $("#status").prepend("<h7>missing required" + importTable[i].match + " " + allrows[1] + "</h7>");
                        $("#status").prepend("<h7>file upload stopped.</h7>");
                        bhs.batch.commit();
                        return;
                    }
                }
            }

            let found = true;
            for (let l = 0; l < importTable.length; ++l)
                if (importTable[l].required && importTable[l].index == -1) {
                    found = false;
                    break;
                }

            if (found) {
                ++k;
                break;
            }
        }

        var entry = [];
        entry[0] = {};
        entry[0].player = bhs.user.player;
        entry[0].galaxy = bhs.user.galaxy;
        entry[0].platform = bhs.user.platform;
        entry[0].uploadplayer = bhs.user.player;
        entry[0].type = "bh";
        entry[0].version = "next";

        var last = entry;

        for (let ok = true, i = k; i < allrows.length && ok; ++i, ok = true) {
            entry[1] = {};
            entry[2] = {};

            width = Math.ceil(i * step);
            progress.css("width", width + "%");
            progress.text(i);

            let row = allrows[i].split(/[,\t]/);

            if (row.length < 4 || row[0] == "")
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
                            await bhs.batchWriteLog(file.name + "-" + i + "-e", "row: " + (i + 1) + " missing " + importTable[j].match);
                            await bhs.batchWriteLog(file.name + "-" + i, row);
                            if (verbose) $("#status").prepend("<h7>row: " + i + " " + allrows[i] + "</h7>");
                            ok = false;
                        }
                    } else {
                        let v = row[idx];
                        if (importTable[j].format)
                            v = importTable[j].format(v);

                        if (importTable[j].validate)
                            ok = importTable[j].validate(v);

                        entry[importTable[j].group][importTable[j].field] = v;

                        if (!ok) {
                            let s = importTable[j].group == 1 ? "bh " : importTable[j].group == 2 ? "exit " : "";
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field] + "</h7>");
                            await bhs.batchWriteLog(file.name + "-" + i + "-e", "row: " + (i + 1) + " invalid value " + s + importTable[j].match + " " + entry[importTable[j].group][importTable[j].field]);
                            await bhs.batchWriteLog(file.name + "-" + i, row);
                            if (verbose) $("#status").prepend("<h7>row: " + i + " " + allrows[i] + "</h7>");
                        }
                    }
                }
            }

            if (ok) {
                entry[0].platform = entry[0].platform.match(/pc/i) ||
                    entry[0].platform.match(/xbox/i) ? "PC-XBox" : entry[0].platform.toUpperCase();

                entry[1] = bhs.merge(entry[1], entry[0]);
                entry[2] = bhs.merge(entry[2], entry[0]);

                if (entry[0].type == "edit" || !entry[2].addr)
                    await bhs.batchEdit(entry[1], entry[2].addr ? entry[2].addr : null);

                else if (entry[0].type == "delete")
                    await bhs.batchDelete(entry[1]);

                else if (entry[0].type == "single" || !entry[2].addr) {
                    await bhs.batchUpdate(entry[1]); // don't overwrite bh info if it exists

                } else if (entry[0].type == "base" || entry[2].addr == "0000:0000:0000:0000") {
                    entry[2].basename = entry[2].sys ? entry[2].sys : entry[2].reg;
                    delete entry[2].sys;
                    delete entry[2].reg;
                    if (!entry[2].basename) {
                        await bhs.batchUpdate(entry[1]);
                    } else if (entry[2].uid) {
                        entry[1].hasbase = true;
                        entry[2] = bhs.merge(entry[2], entry[1]);
                        await bhs.batchUpdate(entry[1]); // don't overwrite bh info if it exists
                        await bhs.batchWriteBase(entry[2]);
                    }
                } else {
                    entry[1].deadzone = entry[0].type == "dz" || entry[2].addr == entry[1].addr;
                    entry[1].blackhole = !entry[1].deadzone;

                    if (entry[1].blackhole || entry[1].deadzone) {
                        if (!(ok = validateBHAddress(entry[1].addr))) {
                            $("#status").prepend("<h7>row: " + (i + 1) + " invalid black hole address " + entry[1].addr + "</h7>");
                            await bhs.batchWriteLog(file.name + "-" + i + "-e", "row: " + (i + 1) + " invalid black hole address " + entry[1].addr);
                            await bhs.batchWriteLog(file.name + "-" + i, row);
                        }

                        if (ok && entry[1].blackhole) {
                            entry[1].connection = entry[2].addr;
                            if (!(ok = validateExitAddress(entry[2].addr))) {
                                await bhs.batchWriteLog(file.name + "-" + i + "-e", "row: " + (i + 1) + " invalid exit address " + entry[1].addr);
                                await bhs.batchWriteLog(file.name + "-" + i, row);
                                $("#status").prepend("<h7>row: " + (i + 1) + " invalid exit address " + entry[1].addr + "</h7>");
                            }
                        }

                        if (ok) {
                            await bhs.batchUpdate(entry[1]); // don't overwrite existing base or creation dates
                            if (entry[1].blackhole)
                                await bhs.batchUpdate(entry[2]);
                        } else if (verbose) $("#status").prepend("<h7>row: " + i + " " + allrows[i] + "</h7>");
                    }
                }

                delete entry[0].uid;
            }
        }

        console.log("commit");
        await bhs.batch.commit();
        //await bhs.batchWriteTotals();

        progress.css("width", 100 + "%");
        progress.text("done");
    }

    reader.readAsText(file);
}

blackHoleSuns.prototype.batchWriteLog = function (doc, text) {
    if (log) {
        let ref = bhs.fbfs.collection("log").doc(doc);
        let data = {};
        data.text = text;
        bhs.batch.set(ref, data);
        if (++bhs.batchcount == 500) {
            console.log("commit");
            bhs.batch.commit();
            bhs.batch = bhs.fbfs.batch();
            bhs.batchcount = 0;
        }
    }
}

blackHoleSuns.prototype.batchUpdate = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            entry.created = entry.modded;
            await bhs.batch.set(ref, entry);
            //bhs.fileIncTotals(entry);
            if (verbose) $("#status").prepend("<h7>add " + entry.addr + "</h7>");
        } else {
            if (doc.data().player == entry.player) {
                await bhs.batch.update(ref, entry);
                if (verbose) $("#status").prepend("<h7>update " + entry.addr + "</h7>");
            } else
            if (verbose) $("#status").prepend("<h7>" + entry.addr + " can only be edited by original creator</h7>");
        }

        if (++bhs.batchcount == 500) {
            console.log("commit");
            bhs.batch.commit();
            bhs.batch = bhs.fbfs.batch();
            bhs.batchcount = 0;
        }
    });
}

blackHoleSuns.prototype.batchEdit = async function (entry, old) {
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());

    let addr = old ? old : entry.addr;
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            if (verbose) $("#status").prepend("<h7>edit doesn't exist " + addr + "</h7>");
        } else {
            if (old) {
                let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, addr);
                await ref.delete();
            }

            let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
            await bhs.batch.set(ref, entry);

            if (verbose) $("#status").prepend("<h7>edit " + entry.addr + "</h7>");

            if (++bhs.batchcount == 500) {
                console.log("commit");
                bhs.batch.commit();
                bhs.batch = bhs.fbfs.batch();
                bhs.batchcount = 0;
            }
        }
    });
}

blackHoleSuns.prototype.batchDelete = async function (entry) {
    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists)
            $("#status").prepend("<h7>delete " + entry.addr + " doesn't exist</h7>");
        else {
            if (doc.data().player == entry.player) {

                await ref.delete().then(function () {
                    // bhs.fileDecTotals(entry);
                    if (verbose) $("#status").prepend("<h7>delete " + entry.addr + "</h7>");
                });
            } else
                $("#status").prepend("<h7>can't delete " + entry.addr + " it can only be deleted by original creator " + doc.data().player + "</h7>");
        }
    });
}

blackHoleSuns.prototype.batchWriteBase = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());

    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists) {
            entry.created = entry.modded;
            await bhs.batch.set(ref, entry);
        } else
            await bhs.batch.update(ref, entry);

        if (verbose) $("#status").prepend("<h7>base " + entry.addr + "</h7>");
        if (++bhs.batchcount == 500) {
            console.log("commit");
            bhs.batch.commit();
            bhs.batch = bhs.fbfs.batch();
            bhs.batchcount = 0;
        }
    });
}