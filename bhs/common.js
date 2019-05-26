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

const starsCol = "stars5";
const usersCol = "users";

function startUp() {
    $("#javascript").empty();
    $("#jssite").show();

    // loadHtml("https://nms-bhs.firebaseapp.com/navbar.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/testing/bhs/navbar.html", "#navbar");
    // loadHtml("https://nms-bhs.firebaseapp.com/footer.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/testing/bhs/footer.html", "#footer");

    bhs = new blackHoleSuns();

    bhs.init();
    bhs.initFirebase();

    if (starsCol != "stars5")
        document.body.style.backgroundColor = "red";

    $("#login").click(function () {
        bhs.logIn();
    });

    $("#logout").click(function () {
        bhs.logOut();
    });
}

function blackHoleSuns() {
    this.user = {};
    this.unsub = {};
    this.fbauth = null;
    this.fbfs = null;
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
    bhs.fbfs = firebase.firestore();

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
        firebase.auth().signInWithRedirect(provider)
            .then(function (res) {
                console.log(res);
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    $("#lgithub").click(function () {
        var provider = new firebase.auth.GithubAuthProvider();
        provider.addScope('repo');
        firebase.auth().signInWithRedirect(provider)
            .then(function (res) {
                console.log(res);
            })
            .catch(function (err) {
                console.log(err);
            });
    });

    $("#ltwitch").click(function () {
        let ref = bhs.fbfs.doc("api/twitch");
        ref.get().then(function (doc) {
            if (doc.exists) {
                let d = doc.data();
                let id = d[window.location.hostname];

                console.log(window.location.hostname);
            }
        });
    });

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

        let ref = bhs.getUsersColRef(usr.uid);
        ref.get().then(function (doc) {
            if (doc.exists)
                user = mergeObjects(user, doc.data());
            else
                user.firsttime = firebase.firestore.Timestamp.fromDate(new Date());

            user.lasttime = firebase.firestore.Timestamp.fromDate(new Date());

            bhs.updateUser(user);

            if (bhs.doLoggedin)
                bhs.doLoggedin();

            bhs.navLoggedin();

            //bhs.assignUID();
            //bhs.rebuildTotals();
        });
    } else {
        $("#usermenu").hide();
        $("#login").show();

        bhs.user = bhs.userInit();

        if (bhs.doLoggedout)
            bhs.doLoggedout();

        bhs.navLoggedout();
    }
}

blackHoleSuns.prototype.init = function () {
    bhs.buildGalaxyInfo();

    bhs.userInit();
}

blackHoleSuns.prototype.userInit = function () {
    let user = {};
    user.uid = null;
    user.player = "";
    user.platform = platformList[0].name;
    user.galaxy = galaxyList[0].name;
    user.firsttime = firebase.firestore.Timestamp.fromDate(new Date());
    user.lasttime = firebase.firestore.Timestamp.fromDate(new Date());

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

blackHoleSuns.prototype.updateUser = function (user, displayFcn) {
    mergeObjects(bhs.user, user);

    let ref = bhs.getUsersColRef(bhs.user.uid);
    ref.set(bhs.user);

    if (displayFcn)
        displayFcn(bhs.user);
}

blackHoleSuns.prototype.checkPlayerName = function (loc, displayFcn) {
    let n = $(loc).val();
    if (n.match(/Unknown Traveler/i)) {
        $(loc).val(bhs.user.player);
        bhs.status("Player Name:" + n + " is restricted.", 0);
    }

    let ref = bhs.getUsersColRef().where("player", "==", n);
    ref.get().then(async function (snapshot) {
        if (!snapshot.empty && snapshot.docs[0].data().uid != bhs.user.uid) {
            $(loc).val(bhs.user.player);
            bhs.status("Player Name:" + n + " is already taken.", 0);
        } else {
            if (typeof bhs.user[starsCol] == "undefined") {
                let ref = bhs.getStarsColRef("totals");
                await ref.get().then(async function (doc) {
                    if (doc.exists) {
                        let d = doc.data();
                        if (typeof d[starsCol].user[n] != "undefined")
                            bhs.user[starsCol] = d[starsCol].user[n];
                    }
                });
            }

            bhs.user.player = n;
            let ref = bhs.getUsersColRef(bhs.user.uid);
            ref.set(bhs.user);

            if (displayFcn)
                displayFcn(bhs.user);
        }
    });
}

blackHoleSuns.prototype.getEntry = function (addr, displayfcn, idx) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform, addr);
    ref.get().then(function (doc) {
        if (doc.exists) {
            let d = doc.data();
            displayfcn(d, idx);
        }
    });
}

blackHoleSuns.prototype.updateEntry = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.fromDate(new Date());
    entry.version = "next";

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr);
    await ref.get().then(async function (doc) {
        if (doc.exists) {
            let existing = doc.data();
            if (existing.uid != entry.uid) {
                bhs.status(entry.addr + " can only be edited by owner", 1);
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

blackHoleSuns.prototype.deleteBase = function (entry) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform, entry.addr);
    ref.delete().then(function () {
        bhs.status(entry.addr + " base deleted.", 2);
    });
}

blackHoleSuns.prototype.getUsersColRef = function (uid, galaxy, platform, addr) {
    let ref = bhs.fbfs.collection(usersCol);
    if (uid) {
        ref = ref.doc(uid);
        if (galaxy) {
            ref = ref.collection("galaxies").doc(galaxy);
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
    let ref = bhs.fbfs.collection(starsCol);
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
                await ref.delete().then(function () {
                    if (d.blackhole)
                        bhs.totals = bhs.incTotals(bhs.totals, entry, -1);
                    bhs.status(addr + " deleted", 2);
                });
            } else
                bhs.status(addr + " can only be deleted by owner", 1);
        }
    });
}

// blackHoleSuns.prototype.setGalaxyNames = async function () {
//     galaxyList.forEach(g => {
//         let ref = bhs.getStarsColRef(g.name);
//         ref.get().then(function (doc) {
//             if (doc.exists)
//                 doc.ref.update({
//                     empty: false
//                 });
//             else {
//                 let d = {
//                     name: doc.id,
//                     empty: true
//                 };
//                 doc.ref.set(d);
//             }
//         });
//     });
// }

blackHoleSuns.prototype.rebuildTotals = async function () {
    let totals = bhs.checkTotalsInit();

    let ref = bhs.getStarsColRef();
    await ref.get().then(async function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i) {
            if (snapshot.docs[i].id != "totals") {
                let g = snapshot.docs[i].data();

                for (let j = 0; j < platformList.length; ++j) {
                    let p = platformList[j];

                    let ref = bhs.getStarsColRef(g.name, p.name);
                    await ref.get().then(function (snapshot) {
                        console.log(g.name + "/" + p.name + " " + snapshot.size);

                        for (let k = 0; k < snapshot.size; ++k)
                            totals = bhs.incTotals(totals, snapshot.docs[k].data());

                        if (snapshot.size) {
                            let ref = bhs.getStarsColRef(g.name);
                            ref.update({
                                empty: false
                            });
                        }
                    });
                }
            }
        }
    });

    if (totals.total.stars != 0)
        bhs.updateAllTotals(totals, true);
}

blackHoleSuns.prototype.assignUID = function () {
    let ref = bhs.getStarsColRef();
    ref.get().then(function (snapshot) {
        snapshot.forEach(doc => {
            if (doc.id != "totals") {
                let g = doc.data();

                for (let j = 0; j < platformList.length; ++j) {
                    let p = platformList[j];

                    let ref = bhs.getUsersColRef();
                    ref.get().then(function (snapshot) {
                        snapshot.forEach(doc => {
                            let u = doc.data();

                            let ref = bhs.getStarsColRef(g.name, p.name);
                            ref = ref.where("player", "==", u.player)
                            ref = ref.where("uid", "==", "")
                            ref.get().then(async function (snapshot) {
                                console.log(g.name + "/" + p.name + " qty = " + snapshot.size + " => " + u.player)

                                if (snapshot.size > 0) {
                                    let b = {};
                                    b.batch = bhs.fbfs.batch();
                                    b.batchcount = 0;

                                    for (let i = 0; i < snapshot.size; ++i) {
                                        let doc = snapshot.docs[i];
                                        let d = doc.data();

                                        d.uid = u.uid;
                                        await b.batch.update(doc.ref, d);
                                        b = await bhs.checkBatchSize(b);
                                    }

                                    await bhs.checkBatchSize(b, true);
                                }
                            });
                        });
                    });
                }
            }
        });
    });
}

blackHoleSuns.prototype.checkBatchSize = async function (b, flush) {
    if (flush && b.batchcount > 0 || ++b.batchcount == 500) {
        await console.log("commit " + b.batchcount);
        await b.batch.commit();
        b.batch = await bhs.fbfs.batch();
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

blackHoleSuns.prototype.checkTotalsInit = function (totals, entry) {
    if (typeof totals == "undefined")
        totals = bhs.initTotals();

    if (typeof totals.user == "undefined")
        totals.user = {};

    if (typeof totals.galaxy == "undefined")
        totals.galaxy = {};

    if (typeof totals.org == "undefined")
        totals.org = {};

    if (entry) {
        let name;
        if (entry.uid)
            name = entry.uid;
        else if (entry.player)
            name = entry.player;

        if (typeof totals.user[name] == "undefined") {
            totals.user[name] = bhs.initTotals();
            totals.user[name].galaxy = {};
        }

        if (entry.galaxy) {
            if (typeof totals.user[name].galaxy[entry.galaxy] == "undefined")
                totals.user[name].galaxy[entry.galaxy] = bhs.initTotals();

            if (typeof totals.galaxy[entry.galaxy] == "undefined")
                totals.galaxy[entry.galaxy] = bhs.initTotals();
        }

        if (entry.org) {
            if (typeof totals.org[entry.org] == "undefined") {
                totals.org[entry.org] = bhs.initTotals();
                totals.org[entry.org].galaxy = {};
            }

            if (entry.galaxy && typeof totals.org[entry.org].galaxy[entry.galaxy] == "undefined")
                totals.org[entry.org].galaxy[entry.galaxy] = bhs.initTotals();
        }
    }

    return totals;
}

blackHoleSuns.prototype.incTotals = function (totals, entry, inc) {
    totals = bhs.checkTotalsInit(totals, entry);
    inc = inc ? inc : 1;

    if (entry.blackhole || entry.deadzone) {
        totals = bhs.incPart(totals, entry, inc);

        let p = entry.uid ? entry.uid : entry.player;
        totals.user[p] = bhs.incPart(totals.user[p], entry, inc);

        if (entry.org) {
            totals.org[entry.org] = bhs.incPart(totals.org[entry.org], entry, inc);
        }
    }

    return totals;
}

blackHoleSuns.prototype.incPart = function (t, entry, inc) {
    t.total += inc;
    t[entry.platform] += inc;
    t.galaxy[entry.galaxy].total += inc;
    t.galaxy[entry.galaxy][entry.platform] += inc;
    return t;
}

blackHoleSuns.prototype.addTotalsToTotals = function (totals, add) {
    for (let k = 0; k < plist.length; ++k) {
        let plat = plist[k];
        totals[plat] += add[plat];
    }

    let glist = Object.keys(add.galaxy);

    for (let i = 0; i < glist.length; ++i) {
        let gal = glist[i];

        if (typeof totals.galaxy[gal] == "undefined")
            totals.galaxy[gal] = bhs.initTotals();

        for (let k = 0; k < plist.length; ++k) {
            let plat = plist[k];
            totals.galaxy[gal][plat] += add.galaxy[gal][plat];
        }
    }

    return totals;
}

blackHoleSuns.prototype.updateAllTotals = async function (totals, reset) {
    if (totals) {
        let ref = bhs.getStarsColRef("totals");
        await bhs.updateTotal(totals, ref, reset);

        let ulist = Object.keys(totals.user);
        for (let i = 0; i < ulist.length; ++i) {
            let u = ulist[i];

            ref = bhs.getUsersColRef(u)
            await ref.get().then(async function (doc) {
                if (doc.exists)
                    await bhs.updateTotal(totals.user[u], doc.ref, reset);
            });
        }

        if (totals.org) {
            let olist = Object.keys(totals.org);
            for (let i = 0; i < olist.length; ++i) {
                let o = olist[i];

                ref = bhs.fbfs.collection("org").where("name", "==", o);
                await ref.get().then(async function (snapshot) {
                    if (!snapshot.empty)
                        await bhs.updateTotal(totals.org[o], snapshot.docs[0].ref, reset);
                });
            }
        }

        delete bhs.totals;
    }
}

blackHoleSuns.prototype.updateTotal = function (add, ref, reset) {
    bhs.fbfs.runTransaction(function (transaction) {
        return transaction.get(ref).then(function (doc) {
            let t = {};
            if (doc.exists)
                t = doc.data();

            if (typeof t[starsCol] == "undefined") {
                t[starsCol] = bhs.initTotals();
                t[starsCol].galaxy = {};
            }

            if (reset)
                t[starsCol] = mergeObjects(t[starsCol], add);
            else
                t[starsCol] = bhs.addTotalsToTotals(t[starsCol], add);

            transaction.set(ref, t);
        });
    });
}

blackHoleSuns.prototype.getEntries = function (displayFcn, limit) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform);
    ref = ref.where("player", "==", bhs.user.player);
    ref = ref.orderBy("modded", "desc");
    if (limit)
        ref = ref.limit(parseInt(limit));
    bhs.subscribe("entry", ref, displayFcn);
}

blackHoleSuns.prototype.getUser = function (displayFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid);
    ref.get().then(function (doc) {
        if (doc.exists)
            displayFcn(doc.data());
    });
}

blackHoleSuns.prototype.getOrgList = async function () {
    bhs.orgList = [];
    bhs.orgList.push({
        name: ""
    });

    let ref = bhs.fbfs.collection("org").orderBy("name");
    await ref.get().then(function (snapshot) {
        for (let i = 0; i < snapshot.docs.length; ++i)
            bhs.orgList.push(snapshot.docs[i].data());
    });
}

blackHoleSuns.prototype.getUsers = function (displayFcn) {
    let ref = bhs.getUsersColRef();
    ref = ref.orderBy(starsCol + ".total", "desc");
    bhs.subscribe("users", ref, displayFcn);
}

blackHoleSuns.prototype.getOrgs = function (displayFcn) {
    let ref = bhs.fbfs.collection("org");
    ref = ref.orderBy(starsCol + ".total", "desc");
    bhs.subscribe("org", ref, displayFcn);
}

blackHoleSuns.prototype.getBases = function (displayFcn, limit) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform);
    ref = ref.orderBy("modded", "desc");
    if (limit)
        ref = ref.limit(parseInt(limit));
    bhs.subscribe("bases", ref, displayFcn);
}

blackHoleSuns.prototype.getTotals = function (displayFcn) {
    let ref = bhs.getStarsColRef("totals");
    bhs.subscribe("totals", ref, displayFcn);

    ref = bhs.getUsersColRef(bhs.user.uid);
    bhs.subscribe("player", ref, displayFcn);
}

blackHoleSuns.prototype.subscribe = function (what, ref, displayFcn) {
    bhs.unsubscribe(what);
    bhs.unsub[what] = ref.onSnapshot(function (snapshot) {
        if (snapshot.exists)
            displayFcn(snapshot.data(), snapshot.id);
        else if (typeof snapshot.empty != "undefined" && !snapshot.empty)
            snapshot.forEach(function (doc) {
                displayFcn(doc.data(), doc.id);
            });
    });
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

    if (!user.player) {
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

    if (!entry.addr) {
        bhs.status("Error: Missing address. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !entry.sys) {
        bhs.status("Error: Missing system name. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !entry.reg) {
        bhs.status("Error: Missing region name. Changes not saved.", 0);
        ok = false;
    }

    if (ok && !entry.blackhole && !entry.deadzone && !bhs.validateAddress(entry.addr, "xit")) {
        bhs.status("Error: Invalid exit address. Changes not saved.", 0);
        ok = false;
    }

    if (ok && (entry.blackhole || entry.deadzone) && !bhs.validateAddress(entry.addr, "bh")) {
        bhs.status("Error: Invalid black hole address. Changes not saved.", 0);
        ok = false;
    }

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
    if (typeof n != "object" || !n)
        o = n;
    else {
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


blackHoleSuns.prototype.formatAddress = function (field, event) {
    let str = $(field).val();
    let len = str.length;
    let key = event.key;

    if (event.metaKey || event.ctrlKey || event.keyCode < 0x20)
        return true;

    if (/[g-z]/i.test(key)) {
        event.preventDefault();
        return false;
    }

    if (/[0-9a-f]/i.test(key)) {
        if (len == 4 || len == 9 || len == 14) {
            $(field).val(str + ":" + key);
            event.preventDefault();
            return false;
        }

        if (len > 18)
            event.preventDefault();

        return true;
    }

    if (/[:.,; ]/.test(key)) {
        if (len > 18) {
            event.preventDefault();
            return false;
        }

        let loc = str.lastIndexOf(":");
        let out = loc > 0 ? str.slice(0, loc + 1) : "";
        let rem = str.slice(loc + 1);

        if (rem.length < 4) {
            out += "0000".slice(0, 4 - rem.length) + rem;
            out += out.length < 15 ? ":" : "";
        }

        $(field).val(out);

        event.preventDefault();
        return false;
    }
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
        str = str.slice(end + (idx <= 4 ? 1 : 0));
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "");
    }

    return out;
}

String.prototype.stripColons = function () {
    return /:/g [Symbol.replace](this, "");
}

function validateAddress(addr) {
    return bhs.validateAddress(addr);
}

function validateBHAddress(addr) {
    return bhs.validateAddress(addr, "bh");
}

function validateExitAddress(addr) {
    return bhs.validateAddress(addr, "xit");
}

blackHoleSuns.prototype.validateAddress = function (addr, ck) {
    let c = bhs.addressToXYZ(addr);
    let ok = c.x <= 0xfff && c.y <= 0xff && c.z <= 0xfff && c.s <= 0x2ff;
    ok = ok && (!ck || (ck != "bh" || c.s == 0x79) && (ck != "xit" || c.s != 0x79));
    return ok;
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
    return bhs.formatListSel(org, bhs.orgList);
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

blackHoleSuns.prototype.addressToXYZ = function (addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    };

    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16);
        out.y = parseInt(addr.slice(5, 9), 16);
        out.z = parseInt(addr.slice(10, 14), 16);
        out.s = parseInt(addr.slice(15), 16);
    }

    return out;
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

function formatLife(val) {
    if (val.match(/gek/i))
        return "Gek";
    if (val.match(/kor/i))
        return "Korvax";
    if (val.match(/vy/i))
        return "Vy'keen";
}

function formatOwned(val) {
    if (val.match(/s/i))
        return ("station");
    if (val.match(/v/i))
        return ("visited");
    else
        return ("mine");
}

const portalFormat = "ppsssyyxxxzzz";

const lifeformList = [{
    name: "Vy'keen",
    match: /vy/i
}, {
    name: "Gek",
    match: /gek/i
}, {
    name: "Korvax",
    match: /kor/i
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