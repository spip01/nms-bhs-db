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

function startUp() {
    $("#javascript").empty();
    $("#jssite").show();

//    loadHtml("https://blackHoleSuns.firebaseapp.com/navbar.html", "http://raw.githubusercontent.com/spip01/blackHoleSuns/public/navbar.html", "#navbar");
//    loadHtml("https://blackHoleSuns.firebaseapp.com/footer.html", "http://raw.githubusercontent.com/spip01/blackHoleSuns/public/footer.html", "#footer");

    bhs = new blackHoleSuns();

//    bhs.init();
//    bhs.initFirebase();
}


function blackHoleSuns() {
//    this.account = {};

//    this.fbauth = null;
//    this.fbdatabase = null;
 //   this.fbstorage = null;
}

/*
// Sets up shortcuts to Firebase features and initiate firebase auth.
blackHoleSuns.prototype.initFirebase = function () {
    var config = {
        apiKey: FIREBASE_API,
        authDomain: "nms-bhs.firebaseapp.com",
        databaseURL: "https://nms-bhs.firebaseio.com",
        projectId: "nms-bhs",
        storageBucket: "nms-bhs.appspot.com",
        messagingSenderId: "957357186275"
    };
    firebase.initializeApp(config);

    bhs.fbauth = firebase.auth();
    bhs.fbdatabase = firebase.database();

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
        let profilePicUrl = user.photoURL;
        let userName = user.displayName;

        $("#userpic").attr('src', profilePicUrl || '/images/body_image.png');
        $("#username").text(userName);

        $("#login").hide();
        $("#usermenu").show();
        $("#loggedout").hide();

        if (bhs.doLoggedin)
            bhs.doLoggedin();

        bhs.uid = user.uid;
        bhs.account.email = user.email;

        var ref = firebase.database().ref("users/" + bhs.uid + '/Account');
        ref.once("value", function (snapshot) {
            if (snapshot.exists()) {
                bhs.account = snapshot.val();

                bhs.doTrackerlistRead(bhs.doTrackerDisplay);

                //bhs.doDBUpdate();
            } else {
                bhs.doAccountWrite();
                bhs.doTrackerlistWrite();
            }

            if (bhs.doAccountDisplay)
                bhs.doAccountDisplay();
        });
    } else {
        bhs.uid = null;

        $("#usermenu").hide();
        $("#login").show();
        $("#loggedout").show();

        bhs.init();

        if (bhs.doLoggedout)
            bhs.doLoggedout()
    }
}

blackHoleSuns.prototype.checkLoggedInWithMessage = function () {
    if (bhs.fbauth.currentUser)
        return true;

    var data = {
        message: 'You must Login first',
        timeout: 2000
    };

    signInSnackbar.MaterialSnackbar.showSnackbar(data);

    return false;
}

blackHoleSuns.prototype.doTrackerlistRead = function (finishfcn) {
    var ref = firebase.database().ref("users/" + bhs.uid + '/Trackers');
    ref.once("value")
        .then(function (snapshot) {
            bhs.trackerlist = snapshot.val();

            if (finishfcn)
                finishfcn();
        });
}

blackHoleSuns.prototype.doAccountWrite = function (key) {
    if (bhs.checkLoggedInWithMessage()) {
        if (key)
            firebase.database().ref('users/' + bhs.uid + '/Account/' + key).set(bhs.account[key]);
        else
            firebase.database().ref('users/' + bhs.uid + '/Account').set(bhs.account);
    }
}

blackHoleSuns.prototype.doTrackerlistWrite = function () {
    if (bhs.checkLoggedInWithMessage())
        firebase.database().ref('users/' + bhs.uid + '/Trackers/').set(bhs.trackerlist);
}

blackHoleSuns.prototype.doTrackerWrite = function (entry, idx) {
    if (bhs.checkLoggedInWithMessage())
        firebase.database().ref('users/' + bhs.uid + '/Trackers/' + idx).set(entry);
}

blackHoleSuns.prototype.getDiaryKey = function (date, time) {
    let datekey = date;
    if (time)
        datekey += "T" + time;
    datekey = datekey.replace(/:/g, "");
    datekey = datekey.replace(/-/g, "");

    return (datekey);
}

blackHoleSuns.prototype.doDBUpdate = function () {
    debugger;
    var ref = firebase.database().ref("users/" + bhs.uid + '/Diary/');
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (data) {
            if (data.key.length === 15) {
                //bhs.doDiaryEntryWrite(data.val());
                //bhs.doDiaryEntryDelete(data.key);
            }
        });
    });
}

blackHoleSuns.prototype.doDiaryRead = function (start, end, entryfcn, finishfcn) {
    //ref.child("userFavorites").queryOrderedByKey().queryEqual(toValue: user.uid).observe(...)

    var ref = firebase.database().ref("users/" + bhs.uid + '/Diary/');
    ref.orderByChild("Date");
    if (start)
        ref.startAt(start);
    if (end)
        ref.endAt(end);
    ref.once("value", function (snapshot) {
        bhs.snapshot = snapshot;

        snapshot.forEach(function (data) {
            if (entryfcn)
                entryfcn(data.val());
        });

        if (finishfcn)
            finishfcn();
    });
}

blackHoleSuns.prototype.doDiaryTrackerRename = function (oldname, newname) {
    //ref.child("userFavorites").queryOrderedByKey().queryEqual(toValue: user.uid).observe(...)

    var ref = firebase.database().ref("users/" + bhs.uid + '/Diary/');
    ref.once("value", function (snapshot) {
        bhs.snapshot = snapshot;

        snapshot.forEach(function (diary) {
            let entry = diary.val();

            if (entry[oldname]) {
                entry[newname] = entry[oldname];
                delete entry[oldname];
            }

            bhs.doDiaryEntryWrite(entry);
        });

    });
}

blackHoleSuns.prototype.doDiaryUpdate = function () {
    var ref = firebase.database().ref("users/" + bhs.uid + '/Diary/');
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (diary) {
            let entry = diary.val();
            for (let [name, val] of Object.entries(entry)) {
                if (val.constructor === Array) {
                    let i = val.indexOf("");
                    if (1 !== -1)
                        val.splice(val, 1);
                }
            }

            let key = bhs.getDiaryKey(entry.Date, entry.Time);
            firebase.database().ref('users/' + bhs.uid + '/Diary/' + diary.key).remove();
            firebase.database().ref('users/' + bhs.uid + '/Diary/' + key).set(entry);
        });
    });
}

blackHoleSuns.prototype.doDiaryEntryRead = function (datekey, finishfcn) {
    if (bhs.checkLoggedInWithMessage()) {
        var ref = firebase.database().ref("users/" + bhs.uid + '/Diary/' + datekey);
        ref.once("value").then(function (snapshot) {
            if (snapshot.exists()) {
                finishfcn(snapshot.val());

                if (bhs.account.lastdiaryupdate !== datekey) {
                    bhs.account.lastdiaryupdate = datekey;
                    bhs.doAccountWrite("lastdiaryupdate");
                }
            }
        });
    }
}

blackHoleSuns.prototype.doDiaryEntryWrite = function (value) {
    if (bhs.checkLoggedInWithMessage()) {
        let datekey = bhs.getDiaryKey(value.Date, value.Time);
        firebase.database().ref('users/' + bhs.uid + '/Diary/' + datekey).set(value);

        if (bhs.account.lastdiaryupdate !== datekey) {
            bhs.account.lastdiaryupdate = datekey;
            bhs.doAccountWrite("lastdiaryupdate");
        }
    }
}

blackHoleSuns.prototype.doDiaryEntryDelete = function (datekey) {
    if (bhs.checkLoggedInWithMessage()) {
        firebase.database().ref('users/' + bhs.uid + '/Diary/' + datekey).remove();
    }
}

blackHoleSuns.prototype.doReportlistRead = function (finishfcn) {
    bhs.reportlist = [];

    var ref = firebase.database().ref("users/" + bhs.uid + '/Reports/');
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (data) {
            bhs.reportlist.push(data.key);
        });

        if (finishfcn)
            finishfcn();
    });
}

blackHoleSuns.prototype.doReportRead = function (namekey, finishfcn) {
    if (bhs.checkLoggedInWithMessage()) {
        var ref = firebase.database().ref("users/" + bhs.uid + '/Reports/' + namekey);
        ref.once("value", function (snapshot) {
            if (snapshot.exists()) {
                bhs.report = snapshot.val();

            } else if (bhs.initReport)
                bhs.initReport();

            if (bhs.account.lastreport !== namekey) {
                bhs.account.lastreport = namekey;
                bhs.doAccountWrite("lastreport");
            }

            finishfcn();
        });
    }
}

blackHoleSuns.prototype.doReportWrite = function (namekey) {
    if (bhs.checkLoggedInWithMessage()) {
        firebase.database().ref('users/' + bhs.uid + '/Reports/' + namekey).set(bhs.report);

        if (bhs.account.lastreport !== namekey) {
            bhs.account.lastreport = namekey;
            bhs.doAccountWrite("lastreport");
        }
    }
}

blackHoleSuns.prototype.doReportDelete = function (namekey) {
    if (bhs.checkLoggedInWithMessage()) {
        firebase.database().ref('users/' + bhs.uid + '/Reports/' + namekey).remove();
    }
}

blackHoleSuns.prototype.init = function () {
    bhs.trackerlist = [];

    for (let i = 0; i < demotrackerlist.length; ++i)
        bhs.trackerlist.push(demotrackerlist[i]);

    if (bhs.initReport)
        bhs.initReport();

    bhs.account.city = "";
    bhs.account.state = "";
    bhs.account.country = "";
    bhs.account.ifmetric = false;
    bhs.account.ifnotify = false;
    bhs.account.notifytime = "20:00:00";
    bhs.account.ifemail = false;
    bhs.account.email = "";
    bhs.account.ifsms = false;
    bhs.account.phone = "";

    bhs.account.lastreport = "all on";
    bhs.account.lastdiaryupdate = null;
}

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

Date.prototype.toDateLocalTimeString = function () {
    let date = this;
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate()) +
        "T" + ten(date.getHours()) +
        ":" + ten(date.getMinutes());
}

Date.prototype.toLocalTimeString = function () {
    let date = this;
    return ten(date.getHours()) +
        ":" + ten(date.getMinutes());
}

Date.prototype.toDateString = function () {
    let date = this;
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate());
}

Date.prototype.toDateShortString = function () {
    let date = this;
    return date.getFullYear() +
        ten(date.getMonth() + 1) +
        ten(date.getDate());
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const days = ["Sunday", "Monday", "Tuesday", "Wednessday", "Thursday", "Friday", "Saturday"];
const daysabbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

Date.prototype.getMonthString = function () {
    return months[this.getMonth()];
}

Date.prototype.getDayString = function (abbrev) {
    return abbrev ? daysabbrev[this.getDay()] : days[this.getDay()];
}

Number.prototype.getDayString = function (abbrev) {
    return abbrev ? daysabbrev[this] : days[this];
}

String.prototype.getMonthString = function () {
    return months[this - 1];
}

String.prototype.idToName = function () {
    return this.stripID().dashToSpace();
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/g, "$1");
}
*/

String.prototype.nameToId = function(){
    return this.replace(" ", "-").replace("'", "_");
}

String.prototype.IdToName = function(){
    return this.replace("-", " ").replace("_", "'");
}
 
/*
function monthDays(year, month) {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let leap = month === 2 ? (year % 100 === 0 ? (year % 400 === 0 ? 1 : 0) : (year % 4 === 0 ? 1 : 0)) : 0;
    return (days[month - 1] + leap);
}

function ten(i) {
    return i < 10 ? '0' + i : i;
}

// from http://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
function hslToRgb(h, s, l) {
    let r, g, b;
    h /= 360;
    s /= 100;
    l /= 100;

    if (s === 0)
        r = g = b = l * 255;
    else {
        let t1 = l < 50 ? l * (1.0 + s) : l + s - l * s;
        let t2 = 2 * l - t1;

        let range = function (x) {
            return (x <= 0 ? x + 1 : x >= 1 ? x - 1 : x);
        }

        let tr = range(h + 0.333);
        let tg = range(h);
        let tb = range(h - 0.333);

        let color = function (t1, t2, tc) {
            let c;

            if (6 * tc < 1)
                c = t2 + (t1 - t2) * 6 * tc;
            else if (2 * tc < 1)
                c = t1;
            else if (3 * tc < 2)
                c = t2 + (t1 - t2) * 6 * (0.666 - tc);
            else
                c = t2;

            return (c);
        }

        r = Math.round(color(t1, t2, tr) * 255);
        g = Math.round(color(t1, t2, tg) * 255);
        b = Math.round(color(t1, t2, tb) * 255);
    }

    return {
        r: r,
        g: g,
        b: b
    };
}

function toHex(n) {
    var hex = n.toString(16);
    if (hex.length % 2 === 1)
        hex = "0" + hex;
    return hex;
}

function getLocation(fcn) {
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(fcn);

    return navigator.geolocation;
}
*/


const lifeformList = [
    {name:"Vy'keen"},
    {name:"Gek"},
    {name:"Kovax"}
];

const platformList = [
    {name:"PC"},
    {name:"PS4"},
    {name:"XBox"}
];

const economyList = [{
        name: "Declining",
        level: 1
    },
    {
        name: "Destitute",
        level: 1
    },
    {
        name: "Failing",
        level: 1
    },
    {
        name: "Fledgling",
        level: 1
    },
    {
        name: "Low supply",
        level: 1
    },
    {
        name: "Struggling",
        level: 1
    },
    {
        name: "Unpromising",
        level: 1
    },
    {
        name: "Unsuccessful",
        level: 1
    },
    {
        name: "Adequate",
        level: 2
    },
    {
        name: "Balanced",
        level: 2
    },
    {
        name: "Comfortable",
        level: 2
    },
    {
        name: "Developing",
        level: 2
    },
    {
        name: "Medium Supply",
        level: 2
    },
    {
        name: "Promising",
        level: 2
    },
    {
        name: "Satisfactory",
        level: 2
    },
    {
        name: "Sustainable",
        level: 2
    },
    {
        name: "Advanced",
        level: 3
    },
    {
        name: "Affluent",
        level: 3
    },
    {
        name: "Booming",
        level: 3
    },
    {
        name: "Flourishing",
        level: 3
    },
    {
        name: "High Supply",
        level: 3
    },
    {
        name: "Opulent",
        level: 3
    },
    {
        name: "Prosperous",
        level: 3
    },
    {
        name: "Wealthy",
        level: 3
    }
];

const galaxyList = [{
        name: "Euclid",
        number: 1
    },
    {
        name: "Hilbert Dimension",
        number: 2
    },
    {
        name: "Calypso",
        number: 3
    },
    {
        name: "Hesperius Dimension",
        number: 4
    },
    {
        name: "Hyades",
        number: 5
    },
    {
        name: "Ickjamatew",
        number: 6
    },
    {
        name: "Budullangr",
        number: 7
    },
    {
        name: "Kikolgallr",
        number: 8
    },
    {
        name: "Eltiensleen",
        number: 9
    },
    {
        name: "Eissentam",
        number: 10
    },
    {
        name: "Elkupalos",
        number: 11
    },
    {
        name: "Aptarkaba",
        number: 12
    },
    {
        name: "Ontiniangp",
        number: 13
    },
    {
        name: "Odiwagiri",
        number: 14
    },
    {
        name: "Ogtialabi",
        number: 15
    },
    {
        name: "Muhacksonto",
        number: 16
    },
    {
        name: "Hitonskyer",
        number: 17
    },
    {
        name: "Rerasmutul",
        number: 18
    },
    {
        name: "Isdoraijung",
        number: 19
    },
    {
        name: "Doctinawyra",
        number: 20
    },
    {
        name: "Loychazinq",
        number: 21
    },
    {
        name: "Zukasizawa",
        number: 22
    },
    {
        name: "Ekwathore",
        number: 23
    },
    {
        name: "Yeberhahne",
        number: 24
    },
    {
        name: "Twerbetek",
        number: 25
    },
    {
        name: "Sivarates",
        number: 26
    },
    {
        name: "Eajerandal",
        number: 27
    },
    {
        name: "Aldukesci",
        number: 28
    },
    {
        name: "Wotyarogii",
        number: 29
    },
    {
        name: "Sudzerbal",
        number: 30
    },
    {
        name: "Maupenzhay",
        number: 31
    },
    {
        name: "Sugueziume",
        number: 32
    },
    {
        name: "Brogoweldian",
        number: 33
    },
    {
        name: "Ehbogdenbu",
        number: 34
    },
    {
        name: "Ijsenufryos",
        number: 35
    },
    {
        name: "Nipikulha",
        number: 36
    },
    {
        name: "Autsurabin",
        number: 37
    },
    {
        name: "Lusontrygiamh",
        number: 38
    },
    {
        name: "Rewmanawa",
        number: 39
    },
    {
        name: "Ethiophodhe",
        number: 40
    },
    {
        name: "Urastrykle",
        number: 41
    },
    {
        name: "Xobeurindj",
        number: 42
    },
    {
        name: "Oniijialdu",
        number: 43
    },
    {
        name: "Wucetosucc",
        number: 44
    },
    {
        name: "Ebyeloofdud",
        number: 45
    },
    {
        name: "Odyavanta",
        number: 46
    },
    {
        name: "Milekistri",
        number: 47
    },
    {
        name: "Waferganh",
        number: 48
    },
    {
        name: "Agnusopwit",
        number: 49
    },
    {
        name: "Teyaypilny",
        number: 50
    },
    {
        name: "Zalienkosm",
        number: 51
    },
    {
        name: "Ladgudiraf",
        number: 52
    },
    {
        name: "Mushonponte",
        number: 53
    },
    {
        name: "Amsentisz",
        number: 54
    },
    {
        name: "Fladiselm",
        number: 55
    },
    {
        name: "Laanawemb",
        number: 56
    },
    {
        name: "Ilkerloor",
        number: 57
    },
    {
        name: "Davanossi",
        number: 58
    },
    {
        name: "Ploehrliou",
        number: 59
    },
    {
        name: "Corpinyaya",
        number: 60
    },
    {
        name: "Leckandmeram",
        number: 61
    },
    {
        name: "Quulngais",
        number: 62
    },
    {
        name: "Nokokipsechl",
        number: 63
    },
    {
        name: "Rinblodesa",
        number: 64
    },
    {
        name: "Loydporpen",
        number: 65
    },
    {
        name: "Ibtrevskip",
        number: 66
    },
    {
        name: "Elkowaldb",
        number: 67
    },
    {
        name: "Heholhofsko",
        number: 68
    },
    {
        name: "Yebrilowisod",
        number: 69
    },
    {
        name: "Husalvangewi",
        number: 70
    },
    {
        name: "Ovna'uesed",
        number: 71
    },
    {
        name: "Bahibusey",
        number: 72
    },
    {
        name: "Nuybeliaure",
        number: 73
    },
    {
        name: "Doshawchuc",
        number: 74
    },
    {
        name: "Ruckinarkh",
        number: 75
    },
    {
        name: "Thorettac",
        number: 76
    },
    {
        name: "Nuponoparau",
        number: 77
    },
    {
        name: "Moglaschil",
        number: 78
    },
    {
        name: "Uiweupose",
        number: 79
    },
    {
        name: "Nasmilete",
        number: 80
    },
    {
        name: "Ekdaluskin",
        number: 81
    },
    {
        name: "Hakapanasy",
        number: 82
    },
    {
        name: "Dimonimba",
        number: 83
    },
    {
        name: "Cajaccari",
        number: 84
    },
    {
        name: "Olonerovo",
        number: 85
    },
    {
        name: "Umlanswick",
        number: 86
    },
    {
        name: "Henayliszm",
        number: 87
    },
    {
        name: "Utzenmate",
        number: 88
    },
    {
        name: "Umirpaiya",
        number: 89
    },
    {
        name: "Paholiang",
        number: 90
    },
    {
        name: "Iaereznika",
        number: 91
    },
    {
        name: "Yudukagath",
        number: 92
    },
    {
        name: "Boealalosnj",
        number: 93
    },
    {
        name: "Yaevarcko",
        number: 94
    },
    {
        name: "Coellosipp",
        number: 95
    },
    {
        name: "Wayndohalou",
        number: 96
    },
    {
        name: "Smoduraykl",
        number: 97
    },
    {
        name: "Apmaneessu",
        number: 98
    },
    {
        name: "Hicanpaav",
        number: 99
    },
    {
        name: "Akvasanta",
        number: 100
    },
    {
        name: "Tuychelisaor",
        number: 101
    },
    {
        name: "Rivskimbe",
        number: 102
    },
    {
        name: "Daksanquix",
        number: 103
    },
    {
        name: "Kissonlin",
        number: 104
    },
    {
        name: "Aediabiel",
        number: 105
    },
    {
        name: "Ulosaginyik",
        number: 106
    },
    {
        name: "Roclaytonycar",
        number: 107
    },
    {
        name: "Kichiaroa",
        number: 108
    },
    {
        name: "Irceauffey",
        number: 109
    },
    {
        name: "Nudquathsenfe",
        number: 110
    },
    {
        name: "Getaizakaal",
        number: 111
    },
    {
        name: "Hansolmien",
        number: 112
    },
    {
        name: "Bloytisagra",
        number: 113
    },
    {
        name: "Ladsenlay",
        number: 114
    },
    {
        name: "Luyugoslasr",
        number: 115
    },
    {
        name: "Ubredhatk",
        number: 116
    },
    {
        name: "Cidoniana",
        number: 117
    },
    {
        name: "Jasinessa",
        number: 118
    },
    {
        name: "Torweierf",
        number: 119
    },
    {
        name: "Saffneckm",
        number: 120
    },
    {
        name: "Thnistner",
        number: 121
    },
    {
        name: "Dotusingg",
        number: 122
    },
    {
        name: "Luleukous",
        number: 123
    },
    {
        name: "Jelmandan",
        number: 124
    },
    {
        name: "Otimanaso",
        number: 125
    },
    {
        name: "Enjaxusanto",
        number: 126
    },
    {
        name: "Sezviktorew",
        number: 127
    },
    {
        name: "Zikehpm",
        number: 128
    },
    {
        name: "Bephembah",
        number: 129
    },
    {
        name: "Broomerrai",
        number: 130
    },
    {
        name: "Meximicka",
        number: 131
    },
    {
        name: "Venessika",
        number: 132
    },
    {
        name: "Gaiteseling",
        number: 133
    },
    {
        name: "Zosakasiro",
        number: 134
    },
    {
        name: "Drajayanes",
        number: 135
    },
    {
        name: "Ooibekuar",
        number: 136
    },
    {
        name: "Urckiansi",
        number: 137
    },
    {
        name: "Dozivadido",
        number: 138
    },
    {
        name: "Emiekereks",
        number: 139
    },
    {
        name: "Meykinunukur",
        number: 140
    },
    {
        name: "Kimycuristh",
        number: 141
    },
    {
        name: "Roansfien",
        number: 142
    },
    {
        name: "Isgarmeso",
        number: 143
    },
    {
        name: "Daitibeli",
        number: 144
    },
    {
        name: "Gucuttarik",
        number: 145
    },
    {
        name: "Enlaythie",
        number: 146
    },
    {
        name: "Drewweste",
        number: 147
    },
    {
        name: "Akbulkabi",
        number: 148
    },
    {
        name: "Homskiw",
        number: 149
    },
    {
        name: "Zavainlani",
        number: 150
    },
    {
        name: "Jewijkmas",
        number: 151
    },
    {
        name: "Itlhotagra",
        number: 152
    },
    {
        name: "Podalicess",
        number: 153
    },
    {
        name: "Hiviusauer",
        number: 154
    },
    {
        name: "Halsebenk",
        number: 155
    },
    {
        name: "Puikitoac",
        number: 156
    },
    {
        name: "Gaybakuaria",
        number: 157
    },
    {
        name: "Grbodubhe",
        number: 158
    },
    {
        name: "Rycempler",
        number: 159
    },
    {
        name: "Indjalala",
        number: 160
    },
    {
        name: "Fontenikk",
        number: 161
    },
    {
        name: "Pasycihelwhee",
        number: 162
    },
    {
        name: "Ikbaksmit",
        number: 163
    },
    {
        name: "Telicianses",
        number: 164
    },
    {
        name: "Oyleyzhan",
        number: 165
    },
    {
        name: "Uagerosat",
        number: 166
    },
    {
        name: "Impoxectin",
        number: 167
    },
    {
        name: "Twoodmand",
        number: 168
    },
    {
        name: "Hilfsesorbs",
        number: 169
    },
    {
        name: "Ezdaranit",
        number: 170
    },
    {
        name: "Wiensanshe",
        number: 171
    },
    {
        name: "Ewheelonc",
        number: 172
    },
    {
        name: "Litzmantufa",
        number: 173
    },
    {
        name: "Emarmatosi",
        number: 174
    },
    {
        name: "Mufimbomacvi",
        number: 175
    },
    {
        name: "Wongquarum",
        number: 176
    },
    {
        name: "Hapirajua",
        number: 177
    },
    {
        name: "Igbinduina",
        number: 178
    },
    {
        name: "Wepaitvas",
        number: 179
    },
    {
        name: "Sthatigudi",
        number: 180
    },
    {
        name: "Yekathsebehn",
        number: 181
    },
    {
        name: "Ebedeagurst",
        number: 182
    },
    {
        name: "Nolisonia",
        number: 183
    },
    {
        name: "Ulexovitab",
        number: 184
    },
    {
        name: "Iodhinxois",
        number: 185
    },
    {
        name: "Irroswitzs",
        number: 186
    },
    {
        name: "Bifredait",
        number: 187
    },
    {
        name: "Beiraghedwe",
        number: 188
    },
    {
        name: "Yeonatlak",
        number: 189
    },
    {
        name: "Cugnatachh",
        number: 190
    },
    {
        name: "Nozoryenki",
        number: 191
    },
    {
        name: "Ebralduri",
        number: 192
    },
    {
        name: "Evcickcandj",
        number: 193
    },
    {
        name: "Ziybosswin",
        number: 194
    },
    {
        name: "Heperclait",
        number: 195
    },
    {
        name: "Sugiuniam",
        number: 196
    },
    {
        name: "Aaseertush",
        number: 197
    },
    {
        name: "Uglyestemaa",
        number: 198
    },
    {
        name: "Horeroedsh",
        number: 199
    },
    {
        name: "Drundemiso",
        number: 200
    },
    {
        name: "Ityanianat",
        number: 201
    },
    {
        name: "Purneyrine",
        number: 202
    },
    {
        name: "Dokiessmat",
        number: 203
    },
    {
        name: "Nupiacheh",
        number: 204
    },
    {
        name: "Dihewsonj",
        number: 205
    },
    {
        name: "Rudrailhik",
        number: 206
    },
    {
        name: "Tweretnort",
        number: 207
    },
    {
        name: "Snatreetze",
        number: 208
    },
    {
        name: "Iwunddaracos",
        number: 209
    },
    {
        name: "Digarlewena",
        number: 210
    },
    {
        name: "Erquagsta",
        number: 211
    },
    {
        name: "Logovoloin",
        number: 212
    },
    {
        name: "Boyaghosganh",
        number: 213
    },
    {
        name: "Kuolungau",
        number: 214
    },
    {
        name: "Pehneldept",
        number: 215
    },
    {
        name: "Yevettiiqidcon",
        number: 216
    },
    {
        name: "Sahliacabru",
        number: 217
    },
    {
        name: "Noggalterpor",
        number: 218
    },
    {
        name: "Chmageaki",
        number: 219
    },
    {
        name: "Veticueca",
        number: 220
    },
    {
        name: "Vittesbursul",
        number: 221
    },
    {
        name: "Nootanore",
        number: 222
    },
    {
        name: "Innebdjerah",
        number: 223
    },
    {
        name: "Kisvarcini",
        number: 224
    },
    {
        name: "Cuzcogipper",
        number: 225
    },
    {
        name: "Pamanhermonsu",
        number: 226
    },
    {
        name: "Brotoghek",
        number: 227
    },
    {
        name: "Mibittara",
        number: 228
    },
    {
        name: "Huruahili",
        number: 229
    },
    {
        name: "Raldwicarn",
        number: 230
    },
    {
        name: "Ezdartlic",
        number: 231
    },
    {
        name: "Badesclema",
        number: 232
    },
    {
        name: "Isenkeyan",
        number: 233
    },
    {
        name: "Iadoitesu",
        number: 234
    },
    {
        name: "Yagrovoisi",
        number: 235
    },
    {
        name: "Ewcomechio",
        number: 236
    },
    {
        name: "Inunnunnoda",
        number: 237
    },
    {
        name: "Dischiutun",
        number: 238
    },
    {
        name: "Yuwarugha",
        number: 239
    },
    {
        name: "Ialmendra",
        number: 240
    },
    {
        name: "Reponudrle",
        number: 241
    },
    {
        name: "Rinjanagrbo",
        number: 242
    },
    {
        name: "Zeziceloh",
        number: 243
    },
    {
        name: "Oeileutasc",
        number: 244
    },
    {
        name: "Zicniijinis",
        number: 245
    },
    {
        name: "Dugnowarilda",
        number: 246
    },
    {
        name: "Neuxoisan",
        number: 247
    },
    {
        name: "Ilmenhorn",
        number: 248
    },
    {
        name: "Rukwatsuku",
        number: 249
    },
    {
        name: "Nepitzaspru",
        number: 250
    },
    {
        name: "Chcehoemig",
        number: 251
    },
    {
        name: "Haffneyrin",
        number: 252
    },
    {
        name: "Uliciawai",
        number: 253
    },
    {
        name: "Tuhgrespod",
        number: 254
    },
    {
        name: "Iousongola",
        number: 255
    },
    {
        name: "Odyalutai",
        number: 256
    },
    {
        name: "Yilsrussimil",
        number: 257
    },
    {
        name: "Loqvishess",
        number: -6
    },
    {
        name: "Enyokudohkiw",
        number: -5
    },
    {
        name: "Helqvishap",
        number: -4
    },
    {
        name: "Usgraikik",
        number: -3
    },
    {
        name: "Hiteshamij",
        number: -2
    },
    {
        name: "Uewamoisow",
        number: -1
    },
    {
        name: "Pequibanu",
        number: 0
    }
];