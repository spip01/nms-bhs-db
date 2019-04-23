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

function startUp() {
    $("#javascript").empty();
    $("#jssite").show();

    loadHtml("https://nms-bhs.firebaseapp.com/navbar.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/master/public/navbar.html", "#navbar");
    loadHtml("https://nms-bhs.firebaseapp.com/footer.html", "https://raw.githubusercontent.com/spip01/nms-bhs-db/master/public/footer.html", "#footer");

    bhs = new blackHoleSuns();

    bhs.init();
    bhs.initFirebase();
}

function blackHoleSuns() {
    this.user = {};

    this.uid = null;
    this.fbauth = null;
    this.fbfs = null;
    this.fbstorage = null;
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
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
    let provider = new firebase.auth.GoogleAuthProvider();
    bhs.fbauth.signInWithPopup(provider);
}

blackHoleSuns.prototype.logOut = function () {
    bhs.fbauth.signOut();
}

blackHoleSuns.prototype.onAuthStateChanged = function (user) {
    if (user) {
        bhs.userInit();

        let profilePicUrl = user.photoURL;
        let userName = user.displayName;

        $("#userpic").attr('src', profilePicUrl || '/images/body_image.png');
        $("#username").text(userName);

        $("#login").hide();
        $("#usermenu").show();

        bhs.uid = user.uid;

        var ref = bhs.fbfs.doc('users/' + bhs.uid);

        ref.get().then(function (doc) {
            if (doc.exists) {
                bhs.user = doc.data();

                if (bhs.user.email != user.email) {
                    bhs.user.email = user.email;
                    bhs.updateUser(bhs.user);
                }
            } else {
                bhs.user.email = user.email;
                bhs.updateUser(bhs.user);
            }

            if (bhs.doLoggedin)
                bhs.doLoggedin();

            //bhs.calcStats();
            //bhs.rewriteData();  add playername to stars2
            //bhs.rewriteUserData();
        });
    } else {
        $("#usermenu").hide();
        $("#login").show();

        bhs.userInit();

        if (bhs.doLoggedout)
            bhs.doLoggedout()
    }
}

blackHoleSuns.prototype.init = function () {
    bhs.userInit();

    bhs.totals = {};
    bhs.totals.totalBH = 0;
    bhs.totals.totalStars = 0;
}

blackHoleSuns.prototype.userInit = function () {
    bhs.uid = null;
    bhs.user = {};
    bhs.user.playerName = "";
    bhs.user.email = "";
    bhs.user.platform = platformList[0].name;
    bhs.user.galaxy = galaxyList[0].name;

    bhs.user.totals = {};
    bhs.user.totals.totalBH = 0;
    bhs.user.totals.totalStars = 0;
}

blackHoleSuns.prototype.updateUser = function (user) {
    if (bhs.checkLoggedInWithMessage()) {
        user.uid = bhs.uid;
        bhs.fbfs.doc('users/' + bhs.uid).set(user);
    }
}

blackHoleSuns.prototype.getEntry = function (addr, player, displayfcn, loc) {
    if (bhs.checkLoggedInWithMessage()) {
        var ref = bhs.fbfs.doc('stars2/' + player.platform + "/" + player.galaxy + "/" + addr);
        ref.get().then(function (doc) {
            if (doc.exists)
                displayfcn(loc, doc.data());
        });
    }
}

blackHoleSuns.prototype.updateEntry = function (player, entry, save) {
    if (bhs.checkLoggedInWithMessage()) {
        entry.time = firebase.firestore.Timestamp.fromDate(new Date());
        entry.uid = bhs.uid;
        entry.player = player.playerName;

        let ref = bhs.fbfs.doc('stars2/' + player.platform + "/" + player.galaxy + "/" + entry.addr);
        ref.get().then(function (doc) {
            if (doc.exists && save) {
                if (!bhs.compareEntry(out, doc.data()))
                    $("#status").text("Error: Duplicate entry: " + entry.addr);
            } else {
                let ref = bhs.fbfs.doc('stars2/' + player.platform + "/" + player.galaxy + "/" + entry.addr);
                ref.set(entry);
                $("#status").text("Changes saved.");
            }

            if (save) {
                let stat = bhs.fbfs.doc("statistics/totals");
                stat.get().then(function (doc) {
                    bhs.totals = doc.data();
                    stat.set(bhs.incTotals(bhs.totals, player, entry.blackhole));
                });

                bhs.updateUser(bhs.incTotals(player, player, entry.blackhole));
            }
        });
    }
}

blackHoleSuns.prototype.incTotals = function (d, p, bh) {
    d = bhs.initTotals(p, d);

    if (bh) {
        ++d.totalBH;
        ++d[p.platform].totalBH;
        ++d[p.platform][p.galaxy].totalBH;
    }

    ++d.totalStars;
    ++d[p.platform].totalStars;
    ++d[p.platform][p.galaxy].totalStars;

    return d;
}

blackHoleSuns.prototype.initTotals = function (p, d) {
    if (typeof d === 'undefined') {
        d = {};
        d.totalBH = 0;
        d.totalStars = 0;
    }

    if (typeof d[p.platform] === 'undefined') {
        d[p.platform] = {};
        d[p.platform].totalBH = 0;
        d[p.platform].totalStars = 0;
    }

    if (typeof d[p.platform][p.galaxy] === 'undefined') {
        d[p.platform][p.galaxy] = {};
        d[p.platform][p.galaxy].totalBH = 0;
        d[p.platform][p.galaxy].totalStars = 0;
    }

    return d;
}

blackHoleSuns.prototype.getUserEntries = function (displayFcn) {
    var ref = bhs.fbfs.collection('stars2').doc(bhs.user.platform).collection(bhs.user.galaxy);
    ref = ref.where("uid", "==", bhs.uid).orderBy("time");

    ref.onSnapshot(function (querySnapshot) {
        querySnapshot.docChanges().forEach(function (change) {
            if (change.type === "added") {
                let d = change.doc.data();
                displayFcn(d);
            }

            if (change.type === "modified") {
                let d = change.doc.data();
                displayFcn(d);
            }
        });
    });
}

blackHoleSuns.prototype.getStats = function (displayFcn) {
    var ref = bhs.fbfs.doc('statistics/totals');
    ref.onSnapshot(function (doc) {
        bhs.totals = doc.data();
        displayFcn();
    });

    ref = bhs.fbfs.doc('users/' + bhs.uid);
    ref.onSnapshot(function (doc) {
        bhs.user = doc.data();
        displayFcn();
    });
}

blackHoleSuns.prototype.checkLoggedInWithMessage = function () {
    if (bhs.fbauth.currentUser)
        return true;

    var data = {
        message: 'Please login before saving changes!',
        timeout: 2000
    };

    signInSnackbar.MaterialSnackbar.showSnackbar(data);

    return false;
}

blackHoleSuns.prototype.validateUser = function (user) {
    let ok = true;

    if (!user.playerName) {
        $("#status").text("Error: Missing player name. Changes not saved.");
        ok = false;
    }

    if (ok && !user.galaxy) {
        $("#status").text("Error: Missing galaxy. Changes not saved.");
        ok = false;
    }

    if (ok && !user.platform) {
        $("#status").text("Error: Missing platform. Changes not saved.");
        ok = false;
    }

    return ok;
}

blackHoleSuns.prototype.validateEntry = function (entry) {
    let ok = true;
    let sys = entry.blackhole ? "Black Hole" : "Exit"

    if (!entry.addr) {
        $("#status").text("Error: Missing " + sys + " address. Changes not saved.");
        ok = false;
    }

    if (ok && !entry.sys) {
        $("#status").text("Error: Missing " + sys + " system name. Changes not saved.");
        ok = false;
    }

    if (ok && !entry.reg) {
        $("#status").text("Error: Missing " + sys + " region name. Changes not saved.");
        ok = false;
    }

    if (ok && !bhs.validateAddress(entry.addr)) {
        $("#status").text("Error: Invalid " + sys + " address. Changes not saved.");
        ok = false;
    }

    if (ok && entry.blackhole && entry.addr.slice(15) != "0079") {
        $("#status").text("Error: Black Hole address must end with '0079'. Changes not saved.");
        ok = false;
    }

    return ok;
}
/*
blackHoleSuns.prototype.calcStats = function () {
    //bhs.totals = bhs.initTotals(bhs.user);
    bhs.user.totals = bhs.initTotals(bhs.user)

    let ref = bhs.fbfs.collection("stars/" + bhs.user.platform + "/" + bhs.user.galaxy);

    ref.onSnapshot(function (querySnapshot) {
        querySnapshot.docChanges().forEach(function (change) {
            let d = change.doc.data();
            //bhs.incTotals(bhs.totals, bhs.user, d.blackhole);
            bhs.user.totals = bhs.incTotals(bhs.user.totals, bhs.user, d.blackhole);
        });

        //let stats = bhs.fbfs.doc("statistics/totals");
        let user = bhs.fbfs.doc("users/" + bhs.uid);

        //stats.set(bhs.totals);
        user.set(bhs.user);
    });
}
*/
/*
blackHoleSuns.prototype.rewriteData = function () {
    let xref = bhs.fbfs.collection("stars/PC-XBox/Euclid");
    let ref = xref.where("blackhole", "==", true);
    ref.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            let d = doc.data();

            d.life = d.life == "Kovax" ? "Korvax" : d.life;
            d.exit = false;

            let dref = bhs.fbfs.collection("stars2/PC-XBox/Euclid");
            dref.doc(d.addr).set(d).then(function () {
                console.log(d.addr + " bh");
            });

            xref.doc(d.connection).get().then(function (doc) {
                let x = doc.data();

                x.life = x.life == "Kovax" ? "Korvax" : x.life;
                x.blackhole = false;
                x.exit = true;
                x.connection = d.addr;

                let xref = bhs.fbfs.collection("stars2/PC-XBox/Euclid");
                xref.doc(x.addr).set(x).then(function () {
                    console.log(x.addr + " exit");
                });
            });
        });
    });
}
*/
/*
blackHoleSuns.prototype.rewriteUserData = function () {
    let ref = bhs.fbfs.collection("users");
    ref.get()
        .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                let d = doc.data();

                let player = {};
                player.galaxy = d.Galaxy;
                player.platform = d.Platform;
                player.playerName = d.playerName;
                player.email = d.email;

                if (player.email == "sp@farpoint.us")
                    player.uid = "zzG3HwcIWLRZNEuEi4xEkhUhLeB3";
                else
                    player.uid = "TIGLMws4YDdAYiS5o56y8xmdMPb2";

                bhs.fbfs.doc('users/' + player.uid).set(player);
            })
        });
}
*/
function loadHtml(url, alturl, selector) {
    loadFile(url, alturl, function (data) {
        let html = data.substring(data.indexOf("<body>") + 6, data.indexOf("</body>"));
        $(selector).append(html);

        if (selector === "#navbar") {
            let navbarheight = $("#imported-navbar").outerHeight(true);
            $("#jssite").css("margin-top", navbarheight + "px");

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

    /***************
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200)
                fctn(this.responseText);
            else if (alturl)
                loadFile(alturl, null, fctn);
        }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
    *************/
}

String.prototype.idToName = function () {
    let name = /--/g [Symbol.replace](this, "'");
    name = /-/g [Symbol.replace](name, " ");

    return name;
}

String.prototype.nameToId = function () {
    let id = /'/g [Symbol.replace](this, "--");
    id = / /g [Symbol.replace](id, "-");

    return id;
}

blackHoleSuns.prototype.compareEntry = function (ent1, ent2) {
    return out.econ == d.econ &&
        out.life == d.life &&
        out.reg == d.reg &&
        out.sys == d.sys;
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

blackHoleSuns.prototype.reformatAddress = function (field) {
    let str = /[^0-9A-F]+/g [Symbol.replace]($(field).val().toUpperCase(), ":");
    str = str[0] == ":" ? str.slice(1) : str;
    let out = "";

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":");
        let end = idx > 4 || idx == -1 ? 4 : idx;
        let s = str.slice(0, end);
        str = str.slice(end + (idx <= 4 ? 1 : 0));
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "");
    }

    $(field).val(out);

    return out;
}

blackHoleSuns.prototype.validateAddress = function (addr) {
    return /([0-9a-f]{4}:){3}[0-9a-f]{4}/i.test(addr.toUpperCase());
}

blackHoleSuns.prototype.makeBHAddress = function (addr) {
    return addr.toUpperCase().replace(/((?:[0-9a-f]{4}:){3}:)/i, "$1") + "0079";
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/, "$1");
}

String.prototype.stripMarginWS = function () {
    return this.replace(/\s*(.*?)\s*/, "$1");

}
/*
const playerList = [{
    name: "Player Name",
    type: "text"
}, {
    name: "Platform",
    type: "list",
    list: platformList
}, {
    name: "Galaxy",
    type: "list",
    list: galaxyList
}, {
    name: "Base List", // list at the bottom
    type: "array",
    hidden: true
}];

const inputList = [{
    name: "Has Base", // turns off some validation since it doesn't have to be a bh
    type: "base"
}, {
    name: "Address",
    type: "text"
}, {
    name: "System",
    type: "text"
}, {
    name: "Region",
    type: "text"
}, {
    name: "Lifeform",
    type: "list",
    list: lifeformList
}, {
    name: "Economy",
    type: "list",
    list: economyList
}, {
    name: "Conflict", // put optional items in hidden portion of panel
    type: "list",
    list: conflictList,
    optional: true
}, {
    name: "Star Type",
    type: "star",
    format: starTypeRegex,
    optional: true
}];
*/
const lifeformList = [{
    name: "Vy'keen"
}, {
    name: "Gek"
}, {
    name: "Korvax"
}];

const platformList = [{
    name: "PC-XBox"
}, {
    name: "PS4"
}];

const economyList = [{
    name: "Declining",
    level: 1
}, {
    name: "Destitute",
    level: 1
}, {
    name: "Failing",
    level: 1
}, {
    name: "Fledgling",
    level: 1
}, {
    name: "Low supply",
    level: 1
}, {
    name: "Struggling",
    level: 1
}, {
    name: "Unpromising",
    level: 1
}, {
    name: "Unsuccessful",
    level: 1
}, {
    name: "Adequate",
    level: 2
}, {
    name: "Balanced",
    level: 2
}, {
    name: "Comfortable",
    level: 2
}, {
    name: "Developing",
    level: 2
}, {
    name: "Medium Supply",
    level: 2
}, {
    name: "Promising",
    level: 2
}, {
    name: "Satisfactory",
    level: 2
}, {
    name: "Sustainable",
    level: 2
}, {
    name: "Advanced",
    level: 3
}, {
    name: "Affluent",
    level: 3
}, {
    name: "Booming",
    level: 3
}, {
    name: "Flourishing",
    level: 3
}, {
    name: "High Supply",
    level: 3
}, {
    name: "Opulent",
    level: 3
}, {
    name: "Prosperous",
    level: 3
}, {
    name: "Wealthy",
    level: 3
}];

const conflictList = [{
    name: "Gentle",
    level: 1
}, {
    name: "Low",
    level: 1
}, {
    name: "Mild",
    level: 1
}, {
    name: "Peaceful",
    level: 1
}, {
    name: "Relaxed",
    level: 1
}, {
    name: "Stable",
    level: 1
}, {
    name: "Tranquil",
    level: 1
}, {
    name: "Trivial",
    level: 1
}, {
    name: "Unthreatening",
    level: 1
}, {
    name: "Untroubled",
    level: 1
}, {
    name: "Medium",
    level: 2
}, {
    name: "Belligerent",
    level: 2
}, {
    name: "Boisterous",
    level: 2
}, {
    name: "Fractious",
    level: 2
}, {
    name: "Intermittent",
    level: 2
}, {
    name: "Medium",
    level: 2
}, {
    name: "Rowdy",
    level: 2
}, {
    name: "Sporadic",
    level: 2
}, {
    name: "Testy",
    level: 2
}, {
    name: "Unruly",
    level: 2
}, {
    name: "Unstable",
    level: 2
}, {
    name: "High",
    level: 3
}, {
    name: "Aggressive",
    level: 3
}, {
    name: "Alarming",
    level: 3
}, {
    name: "At War",
    level: 3
}, {
    name: "Critical",
    level: 3
}, {
    name: "Dangerous",
    level: 3
}, {
    name: "Destructive",
    level: 3
}, {
    name: "Formidable",
    level: 3
}, {
    name: "High",
    level: 3
}, {
    name: "Lawless",
    level: 3
}, {
    name: "Perilous",
    level: 3
}];

const starClassPossible = "OBAFGKMLTYE"
const starOdditiesPossible = "efhkmnpqsvw";
const starTypeRegex = /[OBAFGKMLTYE][0-9][efhkmnpqsvw]*/i;

const galaxyList = [{
    name: "Euclid",
    number: 1
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