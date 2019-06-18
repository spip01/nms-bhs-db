'use strict';

var bhs;
/*
ui.start('#firebaseui-auth-container', {
    signInOptions: [
        // List of OAuth providers supported.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID
    ],
});
*/
const fbconfig = {
    apiKey: FIREBASE_API,
    authDomain: "nms-bhs.firebaseapp.com",
    databaseURL: "https://nms-bhs.firebaseio.com",
    projectId: "nms-bhs",
    storageBucket: "nms-bhs.appspot.com",
    messagingSenderId: FIREBASE_MSGID
};

var starsCol = "stars5";
const usersCol = "users";

function startUp() {
    $("#javascript").empty();
    $("#jssite").show();

    // loadHtml("https://nms-bhs.firebaseapp.com/navbar.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/testing/bhs/navbar.html", "#navbar");
    // loadHtml("https://nms-bhs.firebaseapp.com/footer.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/testing/bhs/footer.html", "#footer");

    bhs = new blackHoleSuns();

    bhs.init();
    bhs.initFirebase();

    //  if (document.domain == "localhost" || document.domain == "test-nms-bhs.firebaseapp.com") 
    //      starsCol = "stars6";

    if (starsCol != "stars5")
        $("body").css("background-color", "red");

    $("#login").click(function () {
        bhs.logIn();
    });

    $("#logout").click(function () {
        bhs.logOut();
    });

    if (document.domain == "localhost" || document.domain == "test-nms-bhs.firebaseapp.com")
        $("#testmode").show();

    $("#testmode").click(function () {
        starsCol = starsCol == "stars5" ? "stars6" : "stars5";
        $("body").css("background-color", starsCol != "stars5" ? "red" : "black");
        bhs.list = {};
        bhs.loaded = {};
        bhs.displayUser(bhs.user, true);
    });

    if (document.domain == "localhost")
        $("#recalc").show();

    $("#recalc").click(function () {
        bhs.fixAllTotals();
    });
}

function blackHoleSuns() {
    this.user = {};
    this.unsub = {};
    this.fbauth = null;
    this.fs = null;
    this.fbstorage = null;
}

blackHoleSuns.prototype.initFirebase = function () {
    try {
        firebase.initializeApp(fbconfig);
    } catch (err) {
        if (!/already exists/.test(err.message))
            console.error("Firebase initialization error raised", err.stack)
    }

    bhs.fbauth = firebase.auth();
    bhs.fs = firebase.firestore();

    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            var token = result.credential.accessToken;
        }

        var user = result.user;
        bhs.onAuthStateChanged(user);
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        var email = error.email;
        var credential = error.credential;

        $("#loggedout").html("<h4>" + errorMessage + "</h4>");
    });

    bhs.fbauth.onAuthStateChanged(bhs.onAuthStateChanged.bind(bhs));
}

blackHoleSuns.prototype.logIn = function () {
    $("#loginpnl").show();
    $("#jssite").hide();

    $("#lcancel").click(function () {
        $("#loginpnl").hide();
        $("#jssite").show();
    });

    $("#lgoogle").click(function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        firebase.auth().signInWithRedirect(provider);
    });

    $("#lgithub").click(async function () {
        var provider = new firebase.auth.GithubAuthProvider();
        firebase.auth().signInWithRedirect(provider);
    });

    $("#ltwitch").click(function () {});

    $("#ldiscord").click(function () {});

    $("#lredit").click(function () {});
}

blackHoleSuns.prototype.logOut = function () {
    bhs.unsubscribe();
    bhs.fbauth.signOut();
}

blackHoleSuns.prototype.onAuthStateChanged = function (usr) {
    if (usr) {
        let profilePicUrl = usr.photoURL;
        let userName = usr.displayName;

        let user = bhs.userInit();
        user.uid = usr.uid;

        $("#userpic").attr('src', profilePicUrl || '/images/body_image.png');
        $("#username").text(userName);

        $("#login").hide();
        $("#usermenu").show();

        // let ref = bhs.fs.collection("users").where("_name","==","zeenewbian");
        // ref.get().then(function(snapshot){
        //     if (!snapshot.empty)
        //         user = snapshot.docs[0].data();

        //      bhs.doLoggedin(user);
        //      bhs.navLoggedin();
        // });

        let ref = bhs.getUsersColRef(usr.uid);
        ref.get().then(function (doc) {
            if (doc.exists) {
                user = doc.data();
                user.lasttime = firebase.firestore.Timestamp.fromDate(new Date());
                bhs.updateUser(user);
            } else {
                user.firsttime = firebase.firestore.Timestamp.fromDate(new Date());
                user.lasttime = user.firsttime;
                bhs.updateUser(user, true);
            }

            bhs.doLoggedin(user);
            bhs.navLoggedin();

            // bhs.fixAllTotals();
            // bhs.listUsers();
            // bhs.findDuplicates();
        });
    } else {
        $("#usermenu").hide();
        $("#login").show();

        bhs.user = bhs.userInit();
        bhs.doLoggedout();
        bhs.navLoggedout();
    }
}

blackHoleSuns.prototype.init = function () {
    bhs.buildGalaxyInfo();
    bhs.user = bhs.userInit();
}

blackHoleSuns.prototype.userInit = function () {
    let user = {};
    user.uid = null;
    user._name = "";
    user.platform = platformList[0].name;
    user.galaxy = galaxyList[0].name;
    user.assigned = false;
    user.org = "";

    return user;
}

blackHoleSuns.prototype.navLoggedin = function () {
    $("#loggedout").hide();
    $("#loggedin").show();
}

blackHoleSuns.prototype.navLoggedout = function () {
    $("#loggedout").show();
    $("#loggedin").hide();
}

blackHoleSuns.prototype.updateUser = function (user, ifnew) {
    mergeObjects(bhs.user, user);

    let ref = bhs.getUsersColRef(bhs.user.uid);
    if (ifnew)
        ref.set(bhs.user);
    else
        ref.update(bhs.user);
}

blackHoleSuns.prototype.changeName = function (loc, user) {
    if (user._name == bhs.user._name)
        return;

    if (user._name.match(/Unknown Traveler/i)) {
        $(loc).val(bhs.user._name);
        bhs.status("Player Name:" + n + " is restricted.", 0);
        return;
    }

    if (user._name == "") {
        $(loc).val(bhs.user._name);
        bhs.status("Empty Player Name.", 0);
        return;
    }

    let ref = bhs.getUsersColRef().where("_name", "==", user._name);
    ref.get().then(async function (snapshot) {
        if (!snapshot.empty && snapshot.docs[0].data().uid != bhs.user.uid) {
            $(loc).val(bhs.user._name);
            bhs.status("Player Name:" + n + " is already taken.", 0);
        } else {
            bhs.user = mergeObjects(bhs.user, user);

            if (!bhs.user.assigned) {
                let ref = bhs.getStarsColRef("players");
                await ref.get().then(async function (doc) {
                    if (doc.exists) {
                        let d = doc.data();
                        if (typeof d[bhs.user._name] != "undefined") {
                            bhs.user[starsCol] = d[bhs.user._name];
                            bhs.user.assigned = true;
                            await bhs.assignUid(bhs.user);
                        }
                    }
                });
            }

            let b = {};
            b.batch = bhs.fs.batch();
            b.batchcount = 0;

            let ref = bhs.getStarsColRef().where("totals.total", ">", 0);
            await ref.get().then(async function (snapshot) {
                for (let i = 0; i < snapshot.size; ++i) {
                    let doc = snapshot.docs[i];
                    if (doc.id == "totals" || doc.id == "players")
                        continue;

                    let g = doc.data();

                    for (let k = 0; k < platformList.length; ++k) {
                        let ref = bhs.getStarsColRef(g.name, platformList[k].name);
                        ref = ref.where("uid", "==", bhs.user.uid);
                        await ref.get().then(async function (snapshot) {
                            for (let i = 0; i < snapshot.size; ++i) {
                                await b.batch.update(snapshot.docs[i].ref, {
                                    _name: n
                                });
                                b = await bhs.checkBatchSize(b);
                            }
                        });
                    }
                }
            });

            ref = bhs.getUsersColRef(bhs.user.uid);
            await b.batch.update(ref, bhs.user);
            await bhs.checkBatchSize(b, true);
        }
    });
}

blackHoleSuns.prototype.getEntry = function (addr, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform, addr);
    ref.get().then(function (doc) {
        if (doc.exists) {
            let d = doc.data();
            displayfcn(d, d.blackhole ? 0 : 1);

            if (idx == 0) {
                if (!d.blackhole)
                    bhs.getEntryByConnection(d.addr, displayfcn, 1);
                else
                    bhs.getEntry(d.connection, displayfcn, 1);
            }
        }
    });
}

blackHoleSuns.prototype.getEntryByRegion = function (reg, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform);
    ref = ref.where("reg", "==", reg);
    ref.get().then(function (snapshot) {
        if (!snapshot.empty) {
            let d = snapshot.docs[0].data();
            displayfcn(d, d.blackhole ? 0 : 1, $("#ck-zoomreg").prop("checked"));

            if (idx == 0) {
                if (!d.blackhole)
                    bhs.getEntryByConnection(d.addr, displayfcn, 1);
                else
                    bhs.getEntry(d.connection, displayfcn, 1);
            }
        }
    });
}

blackHoleSuns.prototype.getEntryByConnection = function (addr, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform);
    ref = ref.where("connection", "==", addr);
    ref.get().then(function (snapshot) {
        if (!snapshot.empty) {
            let d = snapshot.docs[0].data();
            displayfcn(d, 0);
        }
    });
}

blackHoleSuns.prototype.updateEntry = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());
    entry.version = "next";
    entry.xyzs = bhs.addressToXYZ(entry.addr);
    if (entry.connection)
        entry.conxyzs = bhs.addressToXYZ(entry.connection);

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (doc.exists) {
            let existing = doc.data();
            if (existing.uid != entry.uid || typeof existing.uid == "undefined" && entry._name != existing.player) {
                bhs.status(entry.addr + " can only be edited by " + entry._name ? entry._name : entry.player, 1);
                return;
            }
            entry = mergeObjects(existing, entry);
        } else
            entry.created = entry.modded;

        await ref.set(entry).then(function () {
            bhs.status(entry.addr + " saved.", 2);
            if (!doc.exists)
                bhs.totals = bhs.incTotals(bhs.totals, entry);
        });
    });
}

blackHoleSuns.prototype.updateBase = function (entry) {
    entry.time = firebase.firestore.Timestamp.fromDate(new Date());
    entry.version = "next";
    entry.xyzs = bhs.addressToXYZ(entry.addr);

    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    ref.set(entry).then(function () {
        bhs.status(entry.addr + " base saved.", 2);
    });
}

blackHoleSuns.prototype.getBase = function (entry, displayfcn, idx) {
    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr);
    ref.get().then(function (doc) {
        if (doc.exists)
            displayfcn(doc.data(), idx);
    });
}

blackHoleSuns.prototype.deleteBase = function (addr) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform, addr);
    ref.delete().then(function () {
        bhs.status(addr + " base deleted.", 2);
    });
}

blackHoleSuns.prototype.getUsersColRef = function (uid, galaxy, platform, addr) {
    let ref = bhs.fs.collection(usersCol);
    if (uid) {
        ref = ref.doc(uid);
        if (galaxy) {
            ref = ref.collection(starsCol).doc(galaxy);
            if (platform) {
                ref = ref.collection(platform);
                if (addr) {
                    ref = ref.doc(addr);
                }
            }
        }
    }

    return ref;
}

blackHoleSuns.prototype.getStarsColRef = function (galaxy, platform, addr) {
    let ref = bhs.fs.collection(starsCol);
    if (galaxy) {
        ref = ref.doc(galaxy);
        if (platform) {
            ref = ref.collection(platform);
            if (addr) {
                ref = ref.doc(addr);
            }
        }
    }

    return ref;
}

blackHoleSuns.prototype.deleteEntry = async function (addr) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform, addr);
    await ref.get().then(async function (doc) {
        if (!doc.exists)
            bhs.status(addr + " doesn't exist for delete", 0);
        else {
            let d = doc.data();
            if (d.uid == bhs.user.uid) {
                await ref.delete().then(async function () {
                    if (d.blackhole) {
                        bhs.totals = bhs.incTotals(bhs.totals, d, -1);
                        bhs.updateAllTotals(bhs.totals);
                    }
                    bhs.status(addr + " deleted", 2);
                });
            } else
                bhs.status(addr + " can only be deleted by " + d._name ? d._name : d.player, 1);
        }
    });
}

blackHoleSuns.prototype.assignUid = async function (entry) {
    let b = {};
    b.batch = bhs.fs.batch();
    b.batchcount = 0;

    let updt = {};
    updt.uid = entry.uid;
    updt._name = entry._name;

    let ref = bhs.getStarsColRef();
    ref = ref.where("totals.total", ">", 0);
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            if (snapshot.docs[i].id != "totals") {
                let g = snapshot.docs[i].data();

                for (let j = 0; j < platformList.length; ++j) {
                    let p = platformList[j];

                    let ref = bhs.getStarsColRef(g.name, p.name);
                    ref = ref.where("player", "==", entry._name)
                    await ref.get().then(async function (snapshot) {
                        if (!snapshot.empty) {
                            console.log(g.name + " " + p.name + " " + entry._name + " " + snapshot.size);

                            for (let k = 0; k < snapshot.size; ++k) {
                                await b.batch.update(snapshot.docs[k].ref, updt);
                                b = await bhs.checkBatchSize(b);
                            }
                        }
                    });
                }
            }
        }
    });

    await bhs.checkBatchSize(b, true);
}

blackHoleSuns.prototype.getActiveContest = async function () {
    let contest;

    let ref = bhs.fs.collection("contest");
    ref = ref.orderBy("end", "desc");
    await ref.get().then(async function (snapshot) {
        if (!snapshot.empty && !snapshot.docs[snapshot.size - 1].data().hidden)
            contest = snapshot.docs[snapshot.size - 1].data();
    });

    return contest;
}

blackHoleSuns.prototype.listUsers = function () {
    let ref = bhs.getUsersColRef();
    ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data();
            console.log(snapshot.docs[i].id + " " + d._name);
        }
    });
}

blackHoleSuns.prototype.fixAllTotals = async function () {
    bhs.contest = await bhs.getActiveContest();
    let totals = bhs.checkTotalsInit();

    let ref = bhs.getStarsColRef();
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            if (snapshot.docs[i].id == "totals" || snapshot.docs[i].id == "players")
                continue;

            let g = snapshot.docs[i].data()

            for (let j = 0; j < platformList.length; ++j) {
                let p = platformList[j];

                let ref = bhs.getStarsColRef(g.name, p.name);
                ref = ref.where("blackhole", "==", true);
                await ref.get().then(function (snapshot) {
                    console.log("bh " + g.name + "/" + p.name + " " + snapshot.size);
                    for (let i = 0; i < snapshot.size; ++i)
                        totals = bhs.incTotals(totals, snapshot.docs[i].data(), 1);
                });

                ref = bhs.getStarsColRef(g.name, p.name);
                ref = ref.where("deadzone", "==", true);
                await ref.get().then(function (snapshot) {
                    console.log("dz " + g.name + "/" + p.name + " " + snapshot.size);
                    for (let i = 0; i < snapshot.size; ++i)
                        totals = bhs.incTotals(totals, snapshot.docs[i].data(), 1);
                });
            }
        }
    });

    bhs.updateAllTotals(totals, true);
    console.log("done");
}

blackHoleSuns.prototype.checkBatchSize = async function (b, flush) {
    if (flush && b.batchcount > 0 || ++b.batchcount == 500) {
        console.log("commit " + b.batchcount);
        await b.batch.commit();
        b.batch = await bhs.fs.batch();
        b.batchcount = 0;
    }

    return b;
}

const plist = ["total", "PC-XBox", "PS4"];

blackHoleSuns.prototype.initTotals = function () {
    let t = {};

    for (let k = 0; k < plist.length; ++k) {
        let plat = plist[k];
        t[plat] = 0;
    }

    return t;
}

blackHoleSuns.prototype.findDuplicates = function () {
    let ref = bhs.getStarsColRef();
    ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            if (snapshot.docs[i].id == "totals" || snapshot.docs[i].id == "players")
                continue;

            let g = snapshot.docs[i].data()

            for (let j = 0; j < platformList.length; ++j) {
                let p = platformList[j];

                let t = {};

                let ref = bhs.getStarsColRef(g.name, p.name);
                ref = ref.where("blackhole", "==", true);
                ref.get().then(function (snapshot) {
                    if (snapshot.size) {
                        console.log(g.name + " " + p.name + " " + snapshot.size);
                        for (let i = 0; i < snapshot.size; ++i) {
                            let e = snapshot.docs[i].data();
                            if (typeof t[e.connection] == "undefined")
                                t[e.connection] = [];
                            t[e.connection].push(e);
                        }

                        Object.keys(t).forEach(a => {
                            if (t[a].length > 1)
                                for (let i = 0; i < t[a].length; ++i)
                                    console.log(a + " " + t[a][i].addr + " " + t[a][i].player);
                        });
                    }
                });
            }
        }
    });
}

blackHoleSuns.prototype.checkTotalsInit = function (t, entry) {
    if (typeof t == "undefined")
        t = {};

    if (typeof t.totals == "undefined")
        t.totals = bhs.initTotals();

    if (entry) {
        if (bhs.contest) {
            let contest = bhs.contest.name;
            if (typeof t.contest == "undefined") {
                t.contest = {};
                t.contest[contest] = bhs.initTotals();
                t.contest[contest].galaxy = {};
            }

            if (typeof t.contest[contest].galaxy[entry.galaxy] == "undefined")
                t.contest[contest].galaxy[entry.galaxy] = bhs.initTotals();
        }

        if (entry.org) {
            if (typeof t.orgs == "undefined")
                t.orgs = {};

            if (typeof t.orgs[entry.org] == "undefined") {
                t.orgs[entry.org] = bhs.initTotals();
                t.orgs[entry.org].galaxy = {};
            }

            if (typeof t.orgs[entry.org].galaxy[entry.galaxy] == "undefined")
                t.orgs[entry.org].galaxy[entry.galaxy] = bhs.initTotals();

            if (bhs.contest) {
                let contest = bhs.contest.name;
                if (typeof t.orgs[entry.org].contest == "undefined")
                    t.orgs[entry.org].contest = {}

                if (typeof t.orgs[entry.org].contest[contest] == "undefined")
                    t.orgs[entry.org].contest[contest] = bhs.initTotals();
            }
        }

        if (entry.uid) {
            if (typeof t.users == "undefined")
                t.users = {};

            if (typeof t.users[entry.uid] == "undefined") {
                t.users[entry.uid] = bhs.initTotals();
                t.users[entry.uid].galaxy = {};
            }

            if (typeof t.users[entry.uid].galaxy[entry.galaxy] == "undefined")
                t.users[entry.uid].galaxy[entry.galaxy] = bhs.initTotals();

            if (bhs.contest) {
                let contest = bhs.contest.name;
                if (typeof t.users[entry.uid].contest == "undefined")
                    t.users[entry.uid].contest = {}

                if (typeof t.users[entry.uid].contest[contest] == "undefined")
                    t.users[entry.uid].contest[contest] = bhs.initTotals();

                if (typeof t.users[entry.uid].contest[contest].galaxy == "undefined")
                    t.users[entry.uid].contest[contest].galaxy = {};

                if (typeof t.users[entry.uid].contest[contest].galaxy[entry.galaxy] == "undefined")
                    t.users[entry.uid].contest[contest].galaxy[entry.galaxy] = bhs.initTotals();
            }
        }

        if (typeof t.galaxy == "undefined")
            t.galaxy = {};

        if (typeof t.galaxy[entry.galaxy] == "undefined") {
            t.galaxy[entry.galaxy] = bhs.initTotals();
        }
    }

    return t;
}

blackHoleSuns.prototype.incTotals = function (totals, entry, inc) {
    totals = bhs.checkTotalsInit(totals, entry);
    inc = inc ? inc : 1;

    if ((entry.blackhole || entry.deadzone) && (entry.player || entry._name)) {
        totals.totals = bhs.incParts(totals.totals, entry, inc);
        totals.galaxy[entry.galaxy] = bhs.incParts(totals.galaxy[entry.galaxy], entry, inc);
        if (entry.uid)
            totals.users[entry.uid] = bhs.incParts(totals.users[entry.uid], entry, inc);

        if (entry.org)
            totals.orgs[entry.org] = bhs.incParts(totals.orgs[entry.org], entry, inc);

        if (bhs.contest && entry.created > bhs.contest.start && entry.created < bhs.contest.end) {
            let contest = bhs.contest.name;

            totals.contest[contest] = bhs.incParts(totals.contest[contest], entry, inc);
            totals.users[entry.uid].contest[contest] = bhs.incParts(totals.users[entry.uid].contest[contest], entry, inc);

            if (entry.org)
                totals.orgs[entry.org].contest[contest] = bhs.incParts(totals.orgs[entry.org].contest[contest], entry, inc);
        }
    }

    return totals;
}

blackHoleSuns.prototype.incParts = function (t, entry, inc) {
    inc = parseInt(inc);
    t.total += inc;
    t[entry.platform] += inc;
    if (typeof t.galaxy != "undefined")
        t.galaxy[entry.galaxy] = bhs.incPart(t.galaxy[entry.galaxy], entry, inc);
    return t;
}

blackHoleSuns.prototype.incPart = function (t, entry, inc) {
    t.total += inc;
    t[entry.platform] += inc;
    return t;
}

blackHoleSuns.prototype.addObjects = function (o, n) {
    if (typeof n != "object") {
        if (typeof n == "number") {
            if (typeof o == "undefined")
                o = 0;
            o += n;
        } else if (typeof n != "undefined")
            o = n;
    } else if (n) {
        if (typeof o == "undefined")
            o = {};
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i];
            o[x] = bhs.addObjects(o[x], n[x]);
        }
    }

    return o;
}

blackHoleSuns.prototype.updateAllTotals = function (totals, reset) {
    if (totals) {
        if (totals.users) {
            let ulist = Object.keys(totals.users);
            for (let i = 0; i < ulist.length; ++i) {
                let t = {}
                t[starsCol] = totals.users[ulist[i]];
                let ref = bhs.getUsersColRef(ulist[i])
                ref.get().then(function (doc) {
                    if (doc.exists)
                        bhs.updateTotal(t, doc.ref, reset);
                    else
                        console.log("not found " + ulist[i]);
                });
            }
        }

        if (totals.galaxy) {
            let glist = Object.keys(totals.galaxy);
            for (let i = 0; i < glist.length; ++i) {
                let t = {}
                t.totals = totals.galaxy[glist[i]];
                t.name = glist[i];
                let ref = bhs.getStarsColRef(glist[i])
                bhs.updateTotal(t, ref, reset);
            }
        }

        if (totals.orgs) {
            let olist = Object.keys(totals.orgs);
            for (let i = 0; i < olist.length; ++i) {
                let t = {}
                t[starsCol] = totals.orgs[olist[i]];
                let ref = bhs.fs.collection("org").where("name", "==", olist[i]);
                ref.get().then(function (snapshot) {
                    if (!snapshot.empty)
                        bhs.updateTotal(t, snapshot.docs[0].ref, reset);
                });
            }
        }

        if (totals.contest) {
            let clist = Object.keys(totals.contest);
            for (let i = 0; i < clist.length; ++i) {
                let t = {}
                t[starsCol] = totals.contest[clist[i]];
                let ref = bhs.fs.collection("contest").where("name", "==", clist[i]);
                ref.get().then(function (snapshot) {
                    if (!snapshot.empty)
                        bhs.updateTotal(t, snapshot.docs[0].ref, reset);
                });
            }
        }

        if (totals.totals) {
            let t = {};
            t[starsCol] = totals.totals;
            t[starsCol].galaxy = totals.galaxy;
            let ref = bhs.getStarsColRef("totals");
            bhs.updateTotal(t, ref, reset);
        }
    }
}

blackHoleSuns.prototype.updateTotal = function (add, ref, reset) {
    bhs.fs.runTransaction(function (transaction) {
        return transaction.get(ref).then(function (doc) {
            let t = {};

            if (doc.exists)
                t = doc.data();

            if (reset)
                t = mergeObjects(t, add);
            else
                t = bhs.addObjects(t, add);

            transaction.set(ref, t);
        });
    });
}

blackHoleSuns.prototype.getEntries = async function (displayFcn, uid, galaxy, platform) {
    galaxy = galaxy ? galaxy : bhs.user.galaxy;
    platform = platform ? platform : bhs.user.platform;
    let complete = false;

    let ifindex = window.location.pathname == "/index.html" || window.location.pathname == "/";
    let ref = bhs.getStarsColRef(galaxy, platform);
    if (uid || ifindex) {
        ref = ref.where("uid", "==", uid ? uid : bhs.user.uid);
    } else
        complete = true;

    if (bhs.loaded && bhs.loaded[galaxy] && bhs.loaded[galaxy][platform]) {
        if (uid || ifindex) {
            uid = uid ? uid : bhs.user.uid;
            let list = Object.keys(bhs.list[galaxy][platform])
            for (let i = 0; i < list.length; ++i) {
                let e = bhs.list[galaxy][platform][list[i]];
                let k = Object.keys(e);
                if (e[k[0]].uid == uid)
                    bhs.entries[list[i]] = e;
            }
        } else
            bhs.entries = bhs.list[galaxy][platform];

        if (displayFcn)
            displayFcn(bhs.entries);
    } else {
        if (!bhs.list)
            bhs.list = {};
        if (!bhs.list[galaxy])
            bhs.list[galaxy] = {};
        if (!bhs.list[galaxy][platform])
            bhs.list[galaxy][platform] = {};

        await ref.get().then(async function (snapshot) {
            for (let i = 0; i < snapshot.size; ++i)
                bhs.list[galaxy][platform] = bhs.addEntryList(snapshot.docs[i].data(), bhs.list[galaxy][platform]);

            bhs.entries = bhs.list[galaxy][platform];

            if (complete) {
                if (typeof bhs.loaded == "undefined")
                    bhs.loaded = {};
                if (typeof bhs.loaded[galaxy] == "undefined")
                    bhs.loaded[galaxy] = {};

                bhs.loaded[galaxy][platform] = true;
            }

            if (ifindex)
                await blackHoleSuns.prototype.getBases(displayFcn);

            if (displayFcn)
                displayFcn(bhs.entries);
        });
    }

    if (displayFcn) {
        ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()));
        bhs.subscribe("entries", ref, bhs.dispEntryList, displayFcn);
    }
}

blackHoleSuns.prototype.getOrgEntries = async function (displayFcn, name, galaxy, platform) {
    galaxy = galaxy ? galaxy : bhs.user.galaxy;
    platform = platform ? platform : bhs.user.platform;

    if (bhs.loaded && bhs.loaded[galaxy] && bhs.loaded[galaxy][platform]) {
        let list = Object.keys(bhs.list[galaxy][platform])
        for (let i = 0; i < list.length; ++i) {
            let e = bhs.list[galaxy][platform][list[i]];
            let k = Object.keys(e);
            if (e[k[0]].org == name)
                bhs.entries[list[i]] = e;
        }

        if (displayFcn)
            displayFcn(bhs.entries);
    }
}

blackHoleSuns.prototype.dispEntryList = function (entry, id, displayFcn) {
    bhs.entries = bhs.addEntryList(entry, bhs.entries);
    bhs.list[entry.galaxy][entry.platform] = bhs.addEntryList(entry, bhs.list[entry.galaxy][entry.platform]);
    displayFcn(bhs.entries);
}

blackHoleSuns.prototype.addEntryList = function (entry, list) {
    if (entry.blackhole) {
        if (typeof list[entry.connection] == "undefined")
            list[entry.connection] = {};
        list[entry.connection].bh = entry;
    } else if (entry.deadzone) {
        if (typeof list[entry.addr] == "undefined")
            list[entry.addr] = {};
        list[entry.addr].dz = entry;
    } else {
        if (typeof list[entry.addr] == "undefined")
            list[entry.addr] = {};
        list[entry.addr].exit = entry;
    }

    return list;
}

blackHoleSuns.prototype.getBases = async function (displayFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform);
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.size; ++i)
            bhs.entries = bhs.addBaseList(snapshot.docs[i].data(), bhs.entries)

        if (displayFcn) {
            let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform);
            ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()));
            bhs.subscribe("bases", ref, bhs.dispBaseList, displayFcn);
        }
    });
}

blackHoleSuns.prototype.addBaseList = function (entry, list) {
    if (typeof list[entry.addr] != "undefined")
        list[entry.addr].exitbase = entry;
    else {
        let keys = Object.keys(list);
        let k = 0;
        for (; k < keys.length; ++k) {
            if (list[keys[k]].bh && list[keys[k]].bh.addr == entry.addr) {
                list[keys[k]].bhbase = entry;
                break;
            }
            if (list[keys[k]].dz && list[keys[k]].dz.addr == entry.addr) {
                list[keys[k]].bhbase = entry;
                break;
            }
        }

        if (k == keys.length) {
            list[entry.addr] = {}
            list[entry.addr].exitbase = entry;
        }
    }

    return list;
}

blackHoleSuns.prototype.dispBaseList = function (entry, id, displayFcn) {
    bhs.entries = bhs.addBaseList(entry, bhs.entries);
    displayFcn(bhs.entries);
}

blackHoleSuns.prototype.getUser = function (displayFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid);
    bhs.subscribe("user", ref, displayFcn);
}

blackHoleSuns.prototype.getOrgList = async function () {
    bhs.orgList = [];
    bhs.orgList.push({
        name: ""
    });

    let ref = bhs.fs.collection("org").orderBy("name");
    await ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i)
            bhs.orgList.push(snapshot.docs[i].data());
    });
}

blackHoleSuns.prototype.getUserList = async function () {
    let list = [];

    let ref = bhs.fs.collection("users").orderBy("_name");
    await ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            let d = snapshot.docs[i].data();
            if (d._name != "" && d[starsCol] && d[starsCol].total > 0) {
                let u = {
                    name: d._name,
                    uid: d.uid
                };
                list.push(u);
            }
        }
    });

    return list;
}

blackHoleSuns.prototype.getUsers = function (displayFcn) {
    let ref = bhs.getUsersColRef();
    ref = ref.orderBy(starsCol + ".total", "desc");
    bhs.subscribe("users", ref, displayFcn);
}

blackHoleSuns.prototype.getTotals = async function (displayFcn) {
    let fgal = window.location.pathname == "/galaxy.html";

    let ref = bhs.getStarsColRef("players");
    ref.get().then(await
        function (doc) {
            if (doc.exists)
                displayFcn(doc.data(), doc.ref.path);
        });

    ref = bhs.getStarsColRef("totals");
    bhs.subscribe("totals", ref, displayFcn);

    ref = bhs.getUsersColRef();
    bhs.subscribe("userTotals", ref, displayFcn);

    ref = bhs.fs.collection("org");
    if (fgal)
        ref = ref.orderBy("name");
    else
        ref = ref.orderBy(starsCol + ".total", "desc");
    bhs.subscribe("orgs", ref, displayFcn);

    ref = bhs.fs.collection("contest");
    ref = ref.orderBy("end", "desc");
    ref.get().then(function (snapshot) {
        if (!snapshot.empty)
            bhs.subscribe("contest", snapshot.docs[snapshot.size - 1].ref, displayFcn);
    });
}

blackHoleSuns.prototype.subscribe = function (what, ref, displayFcn, pass) {
    if (displayFcn) {
        bhs.unsubscribe(what);
        bhs.unsub[what] = ref.onSnapshot(function (snapshot) {
            if (snapshot.exists)
                displayFcn(snapshot.data(), snapshot.ref.path);
            else if (typeof snapshot.empty != "undefined" && !snapshot.empty)
                snapshot.forEach(function (doc) {
                    displayFcn(doc.data(), doc.ref.path, pass);
                });
        });
    }
}

blackHoleSuns.prototype.unsubscribe = function (m) {
    let ulist = Object.keys(bhs.unsub);
    for (let i = 0; i < ulist.length; ++i) {
        let x = ulist[i];
        if (!m || x == m) {
            bhs.unsub[x]();
            delete bhs.unsub[x];
        }
    }
}

blackHoleSuns.prototype.validateUser = function (user) {
    let ok = true;

    if (!user._name) {
        bhs.status("Error: Missing player name. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !user.galaxy) {
        bhs.status("Error: Missing galaxy. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !user.platform) {
        bhs.status("Error: Missing platform. Changes not saved.", 0);
        ok = false;
    }

    return ok;
}

blackHoleSuns.prototype.validateEntry = function (entry) {
    let ok = true;
    let error = "";

    if (!entry.addr) {
        error += "Missing address. ";
        ok = false;
    }

    if (ok && !entry.sys) {
        error += "Missing system name. ";
        ok = false;
    }

    if (ok && !entry.reg) {
        error += "Missing region name. ";
        ok = false;
    }

    let str;
    if (ok && !entry.blackhole && !entry.deadzone && (str = validateExitAddress(entry.addr))) {
        error += "Invalid exit address. (" + str + ") ";
        ok = false;
    }

    if (ok && (entry.blackhole || entry.deadzone) && (str = validateBHAddress(entry.addr))) {
        error += "Invalid black hole address. (" + str + ") ";
        ok = false;
    }

    if (!ok)
        bhs.status("Error: " + error + "Changes not saved.", 0);

    return ok;
}

function loadHtml(url, alturl, selector) {
    loadFile(url, alturl, function (data) {
        let h = data.substring(data.indexOf("<body>") + 6, data.indexOf("</body>"));
        $(selector).html(h);

        if (selector === "#navbar") {
            $("#r2").css("margin-top", "30px");

            let navbarheight = $("#imported-navbar").outerHeight(true);
            $("#jssite").css("margin-top", navbarheight + "px");
            $("#loginpnl").css("margin-top", navbarheight + "px");

            $("#login").click(function () {
                bhs.logIn();
            });

            $("#logout").click(function () {
                bhs.logOut();
            });
        }
    });
}

function loadFile(url, alturl, fctn) {
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            fctn(data);
        },
        error: function (data) {
            if (alturl)
                loadFile(alturl, null, fctn);
        }
    });

    // let xhttp = new XMLHttpRequest();
    // xhttp.onreadystatechange = function () {
    //     if (this.readyState == 4) {
    //         if (this.status == 200)
    //             fctn(this.responseText);
    //         else if (alturl)
    //             loadFile(alturl, null, fctn);
    //     }
    // }
    // xhttp.open("GET", url, true);
    // xhttp.send();
}

function mergeObjects(o, n) {
    if (typeof n != "object") {
        o = n;
    } else if (n) {
        if (typeof o == "undefined")
            o = {};
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i];
            o[x] = mergeObjects(o[x], n[x]);
        }
    }

    return o;
}

// String.prototype.idToName = function () {
//     let name = /--/g [Symbol.replace](this, "'");
//     name = /-/g [Symbol.replace](name, " ");

//     return name;
// }

String.prototype.nameToId = function () {
    let id = /[^a-z0-9_-]/ig [Symbol.replace](this, "-");
    return id;
}

function checkZeroAddress(addr) {
    return /(0{4}:){3}0{4}/.test(addr);
}

function reformatAddress(addr) {
    return bhs.reformatAddress(addr);
}

blackHoleSuns.prototype.reformatAddress = function (addr) {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":");
    str = str[0] == ":" ? str.slice(1) : str;
    let out = "";

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":");
        let end = idx > 4 || idx == -1 ? 4 : idx;
        let s = str.slice(0, end);
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0));
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "");
    }

    return out;
}

String.prototype.stripColons = function () {
    return /:/g [Symbol.replace](this, "");
}

function validateAddress(addr, ck) {
    return bhs.validateAddress(addr, ck) == "";
}

function validateBHAddress(addr) {
    return bhs.validateAddress(addr, "bh");
}

function validateExitAddress(addr) {
    return bhs.validateAddress(addr, "exit");
}

blackHoleSuns.prototype.validateAddress = function (addr, ck) {
    let c = bhs.addressToXYZ(addr);
    let error = "";
    if (c.x > 0xfff) error = "x > 0fff";
    else if (c.y > 0xff) error = "y > 00ff";
    else if (c.z > 0xfff) error = "z > 0fff";
    else if (c.s > 0x2ff) error = "system > 02ff";
    else if (ck == "bh" && c.s != 0x79) error = 'BH system != 0079';

    return error;
}

blackHoleSuns.prototype.validateDist = function (entry, pstr, log) {
    let nok = false;
    let p = pstr ? pstr : "";
    if (nok = entry.dist < 3200)
        bhs.status(p + entry.addr + ` star in center void`, 0, log);
    else if (nok = (entry.dist > 3500 && entry.towardsCtr < 0))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance < 0`, 0, log);
    else if (nok = (entry.dist <= 3500 && entry.towardsCtr < -400))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance < -400`, 0, log);
    else if (nok = (entry.towardsCtr > 21000 && entry.dist <= 819200))
        bhs.status(p + entry.addr + " => " + entry.connection + ` distance > 21000`, 0, log);

    return !nok;
}

blackHoleSuns.prototype.makeBHAddress = function (addr) {
    return addr.toUpperCase().slice(0, 16) + "0079";
}

function tolower(val) {
    return val.toLowerCase();
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/, "$1");
}

String.prototype.stripMarginWS = function () {
    return this.replace(/\s*([.*]?)[\n\r\s]*/, "$1");
}

function stripNumber(val) {
    return val.stripNumber();
}

String.prototype.stripNumber = function () {
    return this.replace(/\s*\d*\.*\s*(\D*)\s*/, "$1");
}

function formatEcon(val) {
    return bhs.formatListSel(val, economyList);
}

function formatConflict(val) {
    return bhs.formatListSel(val, conflictList);
}

function formatGalaxy(val) {
    return bhs.formatListSel(val, galaxyList);
}

function formatOrg(val) {
    return bhs.formatListSel(val, bhs.orgList);
}

blackHoleSuns.prototype.formatListSel = function (val, list) {
    let name = val.stripNumber();
    if (name == "") {
        let num = val.replace(/(\d+).*/, "$1");
        let idx = bhs.getIndex(list, "number", num);
        if (idx != -1)
            name = list[idx].name;
    } else {
        let idx = bhs.getIndex(list, "name", name);
        if (idx != -1)
            name = list[idx].name;
    }

    return name;
}

blackHoleSuns.prototype.getIndex = function (list, field, id) {
    if (!id)
        return -1;

    return list.map(function (x) {
        return typeof x[field] == "string" ? x[field].toLowerCase() : x[field];
    }).indexOf(id.toLowerCase());
}

blackHoleSuns.prototype.buildGalaxyInfo = function () {
    bhs.galaxyInfo = [];
    bhs.galaxyInfo[1] = {};
    bhs.galaxyInfo[1].color = "#ffffff";

    for (let i = 0; i < galaxyRaw.length; ++i) {
        for (let j = galaxyRaw[i].start, step = 0; j <= 256;) {
            if (typeof bhs.galaxyInfo[j] == "undefined") {
                bhs.galaxyInfo[j] = {};
                bhs.galaxyInfo[j].color = galaxyRaw[i].color;
            }

            j += step++ % 2 ? galaxyRaw[i].step1 : galaxyRaw[i].step2;
        }
    }
}

blackHoleSuns.prototype.getAngles = function (loc, dest) {

}


blackHoleSuns.prototype.addressToXYZ = function (addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    };

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16);
        out.y = parseInt(addr.slice(5, 9), 16);
        out.z = parseInt(addr.slice(10, 14), 16);
        out.s = parseInt(addr.slice(15), 16);
    }

    return out;
}

blackHoleSuns.prototype.xyzToAddress = function (xyz) {
    let x = xyz.x.toString(16);
    let z = xyz.y.toString(16);
    let y = xyz.z.toString(16);

    let addr = x + "." + y + "." + z + "." + "0";
    return bhs.reformatAddress(addr);
}

blackHoleSuns.prototype.addrToGlyph = function (addr) {
    let s = "";

    //const portalFormat = "psssyyxxxzzz";

    if (addr) {
        let xyz = bhs.addressToXYZ(addr);
        let xs = "00" + xyz.s.toString(16).toUpperCase();
        let xx = "00" + (xyz.x + 0x801).toString(16).toUpperCase();
        let xy = "00" + (xyz.y + 0x81).toString(16).toUpperCase();
        let xz = "00" + (xyz.z + 0x801).toString(16).toUpperCase();

        s = "0";
        s += xs.slice(xs.length - 3);
        s += xy.slice(xy.length - 2);
        s += xz.slice(xz.length - 3);
        s += xx.slice(xx.length - 3);
    }

    return s;
}

blackHoleSuns.prototype.calcDist = function (addr, addr2) {
    if (!addr)
        return addr;

    let cord = bhs.addressToXYZ(addr);
    let cord2 = addr2 ? bhs.addressToXYZ(addr2) : {
        x: 0x7ff,
        y: 0x7f,
        z: 0x7ff
    };
    let d = parseInt(Math.sqrt(Math.pow(cord2.x - cord.x, 2) + Math.pow(cord2.y - cord.y, 2) + Math.pow(cord2.z - cord.z, 2)) * 400);
    return d;
}

blackHoleSuns.prototype.calcXYZDist = function (xyz1, xyz2) {
    let d = parseInt(Math.sqrt(Math.pow(xyz1.x - xyz2.x, 2) + Math.pow(xyz1.y - xyz2.y, 2) + Math.pow(xyz1.z - xyz2.z, 2)));
    return d;
}

Date.prototype.toDateLocalTimeString = function () {
    let date = this;
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate()) +
        " " + ten(date.getHours()) +
        ":" + ten(date.getMinutes());
}

function ten(i) {
    return i < 10 ? '0' + i : i;
}

function formatLife(val) {
    if (val.match(/^g/i)) return "Gek";
    else if (val.match(/^k/i)) return "Korvax";
    else if (val.match(/^v/i)) return "Vy'keen";
    else return "";
}

function formatPlatform(val) {
    if (val.match(/^ps/i)) return "PS4";
    else return "PC-XBox";
}

function formatOwned(val) {
    if (val.match(/^s/i)) return ("station");
    if (val.match(/^v/i)) return ("visited");
    else return ("mine");
}

const lifeformList = [{
    name: "Vy'keen",
    match: /^v/i
}, {
    name: "Gek",
    match: /^g/i
}, {
    name: "Korvax",
    match: /^k/i
}, {
    name: "none"
}];

const platformList = [{
    name: "PC-XBox",
    match: /pc|xbox/i
}, {
    name: "PS4",
    match: /ps4/i
}];

const economyList = [{
    name: "Declining",
    number: 1
}, {
    name: "Destitute",
    number: 1

}, {
    name: "Failing",
    number: 1

}, {
    name: "Fledgling",
    number: 1

}, {
    name: "Low supply",
    number: 1

}, {
    name: "Struggling",
    number: 1

}, {
    name: "Unpromising",
    number: 1

}, {
    name: "Unsuccessful",
    number: 1

}, {
    name: "Adequate",
    number: 2

}, {
    name: "Balanced",
    number: 2

}, {
    name: "Comfortable",
    number: 2

}, {
    name: "Developing",
    number: 2

}, {
    name: "Medium Supply",
    number: 2

}, {
    name: "Promising",
    number: 2

}, {
    name: "Satisfactory",
    number: 2

}, {
    name: "Sustainable",
    number: 2

}, {
    name: "Advanced",
    number: 3

}, {
    name: "Affluent",
    number: 3

}, {
    name: "Booming",
    number: 3

}, {
    name: "Flourishing",
    number: 3

}, {
    name: "High Supply",
    number: 3

}, {
    name: "Opulent",
    number: 3

}, {
    name: "Prosperous",
    number: 3

}, {
    name: "Wealthy",
    number: 3
}];

const conflictList = [{
    name: "Gentle",
    number: 1
}, {
    name: "Low",
    number: 1
}, {
    name: "Mild",
    number: 1
}, {
    name: "Peaceful",
    number: 1
}, {
    name: "Relaxed",
    number: 1
}, {
    name: "Stable",
    number: 1
}, {
    name: "Tranquil",
    number: 1
}, {
    name: "Trivial",
    number: 1
}, {
    name: "Unthreatening",
    number: 1
}, {
    name: "Untroubled",
    number: 1
}, {
    name: "Medium",
    number: 2
}, {
    name: "Belligerent",
    number: 2
}, {
    name: "Boisterous",
    number: 2
}, {
    name: "Fractious",
    number: 2
}, {
    name: "Intermittent",
    number: 2
}, {
    name: "Medium",
    number: 2
}, {
    name: "Rowdy",
    number: 2
}, {
    name: "Sporadic",
    number: 2
}, {
    name: "Testy",
    number: 2
}, {
    name: "Unruly",
    number: 2
}, {
    name: "Unstable",
    number: 2
}, {
    name: "High",
    number: 3
}, {
    name: "Aggressive",
    number: 3
}, {
    name: "Alarming",
    number: 3
}, {
    name: "At War",
    number: 3
}, {
    name: "Critical",
    number: 3
}, {
    name: "Dangerous",
    number: 3
}, {
    name: "Destructive",
    number: 3
}, {
    name: "Formidable",
    number: 3
}, {
    name: "High",
    number: 3
}, {
    name: "Lawless",
    number: 3
}, {
    name: "Perilous",
    number: 3
}];

const starClassPossible = "OBAFGKMLTYE"
const starOdditiesPossible = "efhkmnpqsvw";
const starTypeRegex = /[OBAFGKMLTYE][0-9][efhkmnpqsvw]*/i;
const levelRgb = ["#ffffff", "#ffc0c0", "#ffff00", "#c0ffc0"];

// from https://nomanssky.gamepedia.com/Galaxy
const galaxyRaw = [{
    name: "harsh",
    color: "#f3636b",
    start: 3,
    step1: 12,
    step2: 8
}, {
    name: "empty",
    color: "#65ccf4",
    start: 7,
    step1: 5,
    step2: 15
}, {
    name: "lush",
    color: "#62f97a",
    start: 9,
    step1: 9,
    step2: 11
}, {
    name: "norm",
    color: "#88fefa",
    start: 2,
    step1: 1,
    step2: 1
}];

const galaxyList = [{
    name: "Euclid",
    number: 1,
}, {
    name: "Hilbert Dimension",
    number: 2
}, {
    name: "Calypso",
    number: 3
}, {
    name: "Hesperius Dimension",
    number: 4
}, {
    name: "Hyades",
    number: 5
}, {
    name: "Ickjamatew",
    number: 6
}, {
    name: "Budullangr",
    number: 7
}, {
    name: "Kikolgallr",
    number: 8
}, {
    name: "Eltiensleen",
    number: 9
}, {
    name: "Eissentam",
    number: 10
}, {
    name: "Elkupalos",
    number: 11
}, {
    name: "Aptarkaba",
    number: 12
}, {
    name: "Ontiniangp",
    number: 13
}, {
    name: "Odiwagiri",
    number: 14
}, {
    name: "Ogtialabi",
    number: 15
}, {
    name: "Muhacksonto",
    number: 16
}, {
    name: "Hitonskyer",
    number: 17
}, {
    name: "Rerasmutul",
    number: 18
}, {
    name: "Isdoraijung",
    number: 19
}, {
    name: "Doctinawyra",
    number: 20
}, {
    name: "Loychazinq",
    number: 21
}, {
    name: "Zukasizawa",
    number: 22
}, {
    name: "Ekwathore",
    number: 23
}, {
    name: "Yeberhahne",
    number: 24
}, {
    name: "Twerbetek",
    number: 25
}, {
    name: "Sivarates",
    number: 26
}, {
    name: "Eajerandal",
    number: 27
}, {
    name: "Aldukesci",
    number: 28
}, {
    name: "Wotyarogii",
    number: 29
}, {
    name: "Sudzerbal",
    number: 30
}, {
    name: "Maupenzhay",
    number: 31
}, {
    name: "Sugueziume",
    number: 32
}, {
    name: "Brogoweldian",
    number: 33
}, {
    name: "Ehbogdenbu",
    number: 34
}, {
    name: "Ijsenufryos",
    number: 35
}, {
    name: "Nipikulha",
    number: 36
}, {
    name: "Autsurabin",
    number: 37
}, {
    name: "Lusontrygiamh",
    number: 38
}, {
    name: "Rewmanawa",
    number: 39
}, {
    name: "Ethiophodhe",
    number: 40
}, {
    name: "Urastrykle",
    number: 41
}, {
    name: "Xobeurindj",
    number: 42
}, {
    name: "Oniijialdu",
    number: 43
}, {
    name: "Wucetosucc",
    number: 44
}, {
    name: "Ebyeloofdud",
    number: 45
}, {
    name: "Odyavanta",
    number: 46
}, {
    name: "Milekistri",
    number: 47
}, {
    name: "Waferganh",
    number: 48
}, {
    name: "Agnusopwit",
    number: 49
}, {
    name: "Teyaypilny",
    number: 50
}, {
    name: "Zalienkosm",
    number: 51
}, {
    name: "Ladgudiraf",
    number: 52
}, {
    name: "Mushonponte",
    number: 53
}, {
    name: "Amsentisz",
    number: 54
}, {
    name: "Fladiselm",
    number: 55
}, {
    name: "Laanawemb",
    number: 56
}, {
    name: "Ilkerloor",
    number: 57
}, {
    name: "Davanossi",
    number: 58
}, {
    name: "Ploehrliou",
    number: 59
}, {
    name: "Corpinyaya",
    number: 60
}, {
    name: "Leckandmeram",
    number: 61
}, {
    name: "Quulngais",
    number: 62
}, {
    name: "Nokokipsechl",
    number: 63
}, {
    name: "Rinblodesa",
    number: 64
}, {
    name: "Loydporpen",
    number: 65
}, {
    name: "Ibtrevskip",
    number: 66
}, {
    name: "Elkowaldb",
    number: 67
}, {
    name: "Heholhofsko",
    number: 68
}, {
    name: "Yebrilowisod",
    number: 69
}, {
    name: "Husalvangewi",
    number: 70
}, {
    name: "Ovna'uesed",
    number: 71
}, {
    name: "Bahibusey",
    number: 72
}, {
    name: "Nuybeliaure",
    number: 73
}, {
    name: "Doshawchuc",
    number: 74
}, {
    name: "Ruckinarkh",
    number: 75
}, {
    name: "Thorettac",
    number: 76
}, {
    name: "Nuponoparau",
    number: 77
}, {
    name: "Moglaschil",
    number: 78
}, {
    name: "Uiweupose",
    number: 79
}, {
    name: "Nasmilete",
    number: 80
}, {
    name: "Ekdaluskin",
    number: 81
}, {
    name: "Hakapanasy",
    number: 82
}, {
    name: "Dimonimba",
    number: 83
}, {
    name: "Cajaccari",
    number: 84
}, {
    name: "Olonerovo",
    number: 85
}, {
    name: "Umlanswick",
    number: 86
}, {
    name: "Henayliszm",
    number: 87
}, {
    name: "Utzenmate",
    number: 88
}, {
    name: "Umirpaiya",
    number: 89
}, {
    name: "Paholiang",
    number: 90
}, {
    name: "Iaereznika",
    number: 91
}, {
    name: "Yudukagath",
    number: 92
}, {
    name: "Boealalosnj",
    number: 93
}, {
    name: "Yaevarcko",
    number: 94
}, {
    name: "Coellosipp",
    number: 95
}, {
    name: "Wayndohalou",
    number: 96
}, {
    name: "Smoduraykl",
    number: 97
}, {
    name: "Apmaneessu",
    number: 98
}, {
    name: "Hicanpaav",
    number: 99
}, {
    name: "Akvasanta",
    number: 100
}, {
    name: "Tuychelisaor",
    number: 101
}, {
    name: "Rivskimbe",
    number: 102
}, {
    name: "Daksanquix",
    number: 103
}, {
    name: "Kissonlin",
    number: 104
}, {
    name: "Aediabiel",
    number: 105
}, {
    name: "Ulosaginyik",
    number: 106
}, {
    name: "Roclaytonycar",
    number: 107
}, {
    name: "Kichiaroa",
    number: 108
}, {
    name: "Irceauffey",
    number: 109
}, {
    name: "Nudquathsenfe",
    number: 110
}, {
    name: "Getaizakaal",
    number: 111
}, {
    name: "Hansolmien",
    number: 112
}, {
    name: "Bloytisagra",
    number: 113
}, {
    name: "Ladsenlay",
    number: 114
}, {
    name: "Luyugoslasr",
    number: 115
}, {
    name: "Ubredhatk",
    number: 116
}, {
    name: "Cidoniana",
    number: 117
}, {
    name: "Jasinessa",
    number: 118
}, {
    name: "Torweierf",
    number: 119
}, {
    name: "Saffneckm",
    number: 120
}, {
    name: "Thnistner",
    number: 121
}, {
    name: "Dotusingg",
    number: 122
}, {
    name: "Luleukous",
    number: 123
}, {
    name: "Jelmandan",
    number: 124
}, {
    name: "Otimanaso",
    number: 125
}, {
    name: "Enjaxusanto",
    number: 126
}, {
    name: "Sezviktorew",
    number: 127
}, {
    name: "Zikehpm",
    number: 128
}, {
    name: "Bephembah",
    number: 129
}, {
    name: "Broomerrai",
    number: 130
}, {
    name: "Meximicka",
    number: 131
}, {
    name: "Venessika",
    number: 132
}, {
    name: "Gaiteseling",
    number: 133
}, {
    name: "Zosakasiro",
    number: 134
}, {
    name: "Drajayanes",
    number: 135
}, {
    name: "Ooibekuar",
    number: 136
}, {
    name: "Urckiansi",
    number: 137
}, {
    name: "Dozivadido",
    number: 138
}, {
    name: "Emiekereks",
    number: 139
}, {
    name: "Meykinunukur",
    number: 140
}, {
    name: "Kimycuristh",
    number: 141
}, {
    name: "Roansfien",
    number: 142
}, {
    name: "Isgarmeso",
    number: 143
}, {
    name: "Daitibeli",
    number: 144
}, {
    name: "Gucuttarik",
    number: 145
}, {
    name: "Enlaythie",
    number: 146
}, {
    name: "Drewweste",
    number: 147
}, {
    name: "Akbulkabi",
    number: 148
}, {
    name: "Homskiw",
    number: 149
}, {
    name: "Zavainlani",
    number: 150
}, {
    name: "Jewijkmas",
    number: 151
}, {
    name: "Itlhotagra",
    number: 152
}, {
    name: "Podalicess",
    number: 153
}, {
    name: "Hiviusauer",
    number: 154
}, {
    name: "Halsebenk",
    number: 155
}, {
    name: "Puikitoac",
    number: 156
}, {
    name: "Gaybakuaria",
    number: 157
}, {
    name: "Grbodubhe",
    number: 158
}, {
    name: "Rycempler",
    number: 159
}, {
    name: "Indjalala",
    number: 160
}, {
    name: "Fontenikk",
    number: 161
}, {
    name: "Pasycihelwhee",
    number: 162
}, {
    name: "Ikbaksmit",
    number: 163
}, {
    name: "Telicianses",
    number: 164
}, {
    name: "Oyleyzhan",
    number: 165
}, {
    name: "Uagerosat",
    number: 166
}, {
    name: "Impoxectin",
    number: 167
}, {
    name: "Twoodmand",
    number: 168
}, {
    name: "Hilfsesorbs",
    number: 169
}, {
    name: "Ezdaranit",
    number: 170
}, {
    name: "Wiensanshe",
    number: 171
}, {
    name: "Ewheelonc",
    number: 172
}, {
    name: "Litzmantufa",
    number: 173
}, {
    name: "Emarmatosi",
    number: 174
}, {
    name: "Mufimbomacvi",
    number: 175
}, {
    name: "Wongquarum",
    number: 176
}, {
    name: "Hapirajua",
    number: 177
}, {
    name: "Igbinduina",
    number: 178
}, {
    name: "Wepaitvas",
    number: 179
}, {
    name: "Sthatigudi",
    number: 180
}, {
    name: "Yekathsebehn",
    number: 181
}, {
    name: "Ebedeagurst",
    number: 182
}, {
    name: "Nolisonia",
    number: 183
}, {
    name: "Ulexovitab",
    number: 184
}, {
    name: "Iodhinxois",
    number: 185
}, {
    name: "Irroswitzs",
    number: 186
}, {
    name: "Bifredait",
    number: 187
}, {
    name: "Beiraghedwe",
    number: 188
}, {
    name: "Yeonatlak",
    number: 189
}, {
    name: "Cugnatachh",
    number: 190
}, {
    name: "Nozoryenki",
    number: 191
}, {
    name: "Ebralduri",
    number: 192
}, {
    name: "Evcickcandj",
    number: 193
}, {
    name: "Ziybosswin",
    number: 194
}, {
    name: "Heperclait",
    number: 195
}, {
    name: "Sugiuniam",
    number: 196
}, {
    name: "Aaseertush",
    number: 197
}, {
    name: "Uglyestemaa",
    number: 198
}, {
    name: "Horeroedsh",
    number: 199
}, {
    name: "Drundemiso",
    number: 200
}, {
    name: "Ityanianat",
    number: 201
}, {
    name: "Purneyrine",
    number: 202
}, {
    name: "Dokiessmat",
    number: 203
}, {
    name: "Nupiacheh",
    number: 204
}, {
    name: "Dihewsonj",
    number: 205
}, {
    name: "Rudrailhik",
    number: 206
}, {
    name: "Tweretnort",
    number: 207
}, {
    name: "Snatreetze",
    number: 208
}, {
    name: "Iwunddaracos",
    number: 209
}, {
    name: "Digarlewena",
    number: 210
}, {
    name: "Erquagsta",
    number: 211
}, {
    name: "Logovoloin",
    number: 212
}, {
    name: "Boyaghosganh",
    number: 213
}, {
    name: "Kuolungau",
    number: 214
}, {
    name: "Pehneldept",
    number: 215
}, {
    name: "Yevettiiqidcon",
    number: 216
}, {
    name: "Sahliacabru",
    number: 217
}, {
    name: "Noggalterpor",
    number: 218
}, {
    name: "Chmageaki",
    number: 219
}, {
    name: "Veticueca",
    number: 220
}, {
    name: "Vittesbursul",
    number: 221
}, {
    name: "Nootanore",
    number: 222
}, {
    name: "Innebdjerah",
    number: 223
}, {
    name: "Kisvarcini",
    number: 224
}, {
    name: "Cuzcogipper",
    number: 225
}, {
    name: "Pamanhermonsu",
    number: 226
}, {
    name: "Brotoghek",
    number: 227
}, {
    name: "Mibittara",
    number: 228
}, {
    name: "Huruahili",
    number: 229
}, {
    name: "Raldwicarn",
    number: 230
}, {
    name: "Ezdartlic",
    number: 231
}, {
    name: "Badesclema",
    number: 232
}, {
    name: "Isenkeyan",
    number: 233
}, {
    name: "Iadoitesu",
    number: 234
}, {
    name: "Yagrovoisi",
    number: 235
}, {
    name: "Ewcomechio",
    number: 236
}, {
    name: "Inunnunnoda",
    number: 237
}, {
    name: "Dischiutun",
    number: 238
}, {
    name: "Yuwarugha",
    number: 239
}, {
    name: "Ialmendra",
    number: 240
}, {
    name: "Reponudrle",
    number: 241
}, {
    name: "Rinjanagrbo",
    number: 242
}, {
    name: "Zeziceloh",
    number: 243
}, {
    name: "Oeileutasc",
    number: 244
}, {
    name: "Zicniijinis",
    number: 245
}, {
    name: "Dugnowarilda",
    number: 246
}, {
    name: "Neuxoisan",
    number: 247
}, {
    name: "Ilmenhorn",
    number: 248
}, {
    name: "Rukwatsuku",
    number: 249
}, {
    name: "Nepitzaspru",
    number: 250
}, {
    name: "Chcehoemig",
    number: 251
}, {
    name: "Haffneyrin",
    number: 252
}, {
    name: "Uliciawai",
    number: 253
}, {
    name: "Tuhgrespod",
    number: 254
}, {
    name: "Iousongola",
    number: 255
}, {
    name: "Odyalutai",
    number: 256
}, {
    name: "Yilsrussimil",
    number: 257
}, {
    name: "Loqvishess",
    number: -6
}, {
    name: "Enyokudohkiw",
    number: -5
}, {
    name: "Helqvishap",
    number: -4
}, {
    name: "Usgraikik",
    number: -3
}, {
    name: "Hiteshamij",
    number: -2
}, {
    name: "Uewamoisow",
    number: -1
}, {
    name: "Pequibanu",
    number: 0
}];

const starClassList = [{
    name: "O",
    temp: "≥ 30,000K",
    color: "blue"
}, {
    name: "B",
    temp: "10,000-30,000K",
    color: "blue white"
}, {
    name: "A",
    temp: "7,500-10,000K",
    color: "white"
}, {
    name: "F",
    temp: "6,000-7,500K",
    color: "yellow white"
}, {
    name: "G",
    temp: "5,200-6,000K",
    color: "yellow"
}, {
    name: "K",
    temp: "3,700-5,200K",
    color: "orange"
}, {
    name: "M",
    temp: "2,400-3,700K",
    color: "red"
}, {
    name: "L",
    temp: "1,300-2,400K",
    color: "red brown"
}, {
    name: "T",
    temp: "500-1,300K",
    color: "brown"
}, {
    name: "Y",
    temp: "≤ 500K",
    color: "dark brown"
}, {
    name: "E",
    temp: "unknown",
    color: "green"
}];

const starOdditiesList = [{
    name: "e",
    type: "Emission lines present"
}, {
    name: "f",
    type: "N III and He II emission"
}, {
    name: "h",
    type: "WR stars with emission lines due to hydrogen"
}, {
    name: "k",
    type: "Spectra with interstellar absorption features"
}, {
    name: "m",
    type: "Enhanced metal features"
}, {
    name: "n",
    type: "Broad ('nebulous') absorption due to spinning"
}, {
    name: "p",
    type: "Unspecified peculiarity"
}, {
    name: "q",
    type: "Red & blue shifts line present"
}, {
    name: "s",
    type: "Narrowly sharp absorption lines"
}, {
    name: "v",
    type: "Variable spectral feature"
}, {
    name: "w",
    type: "Weak lines"
}];