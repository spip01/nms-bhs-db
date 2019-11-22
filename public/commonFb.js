'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

var bhs

const fbconfig = {
    apiKey: FIREBASE_API,
    authDomain: "nms-bhs.firebaseapp.com",
    databaseURL: "https://nms-bhs.firebaseio.com",
    projectId: "nms-bhs",
    storageBucket: "nms-bhs.appspot.com",
    messagingSenderId: FIREBASE_MSGID
}

var starsCol = "stars5"
const usersCol = "users"

function startUp() {
    $("#javascript").remove()
    $("#jssite").show()

    bhs = new blackHoleSuns()
    bhs.init()
    bhs.initFirebase()

    $("#bhsmenus").load("bhsmenus.html", () => {
        let page = window.location.pathname.replace(/(.*)\//, "$1")
        page = page === "" ? "index.html" : page
        let loc = $("#navmenu").find("[href='" + page + "']")
        loc.addClass("clr-blue border rounded")

        $("#banner").on("load", () => {
            let width = $("body").width()
            loc = $("[src='images/bhs-banner.jpg']")
            let iwidth = loc.width()
            let iheight = loc.height() * width / iwidth

            loc.width(width)
            loc.height(iheight)
        })
    })

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })
}

function blackHoleSuns() {
    this.user = {}
    this.unsub = {}
    this.fbauth = null
    this.fs = null
    this.fbstorage = null
}

blackHoleSuns.prototype.initFirebase = function () {
    try {
        firebase.initializeApp(fbconfig)
    } catch (err) {
        if (!/already exists/.test(err.message))
            console.error("Firebase initialization error raised", err.stack)
    }

    bhs.fbauth = firebase.auth()
    bhs.fs = firebase.firestore()
    bhs.fbstorage = firebase.storage()
    bhs.fs.enablePersistence({
        synchronizeTabs: true
    })

    firebase.auth().getRedirectResult().then(result => {
        if (result.credential) {
            var token = result.credential.accessToken
        }

        var user = result.user
        bhs.onAuthStateChanged(user)
    }).catch(error => {
        var errorCode = error.code
        var errorMessage = error.message
        var email = error.email
        var credential = error.credential

        $("#loggedout").html("<h4>" + errorMessage + "</h4>")
    })

    bhs.fbauth.onAuthStateChanged(bhs.onAuthStateChanged.bind(bhs))
}

blackHoleSuns.prototype.logIn = function () {
    $("#loginpnl").show()
    $("#jssite").hide()

    $("#lcancel").click(() => {
        $("#loginpnl").hide()
        $("#jssite").show()
    })

    $("#lgoogle").click(() => {
        var provider = new firebase.auth.GoogleAuthProvider()
        provider.addScope('profile')
        provider.addScope('email')
        firebase.auth().signInWithRedirect(provider)
    })

    $("#lgithub").click(() => {
        var provider = new firebase.auth.GithubAuthProvider()
        firebase.auth().signInWithRedirect(provider)
    })

    $("#ltwitch").click(() => {})

    $("#ldiscord").click(() => {})

    $("#lreddit").click(() => {})
}

blackHoleSuns.prototype.logOut = function () {
    bhs.unsubscribe()
    bhs.fbauth.signOut()
}

blackHoleSuns.prototype.onAuthStateChanged = async function (usr) {
    if (usr) {
        let profilePicUrl = usr.photoURL
        let userName = usr.displayName
        let user = bhs.userInit()
        user.uid = usr.uid

        $("#userpic").attr('src', profilePicUrl || '/images/body_image.png')
        $("#username").text(userName)

        let ref = bhs.getUsersColRef(usr.uid)
        try {
            let doc = await ref.get()
            user = doc.data()
        } catch {
            user.firsttime = firebase.firestore.Timestamp.now()
        }

        user.email = usr.email
        user.displayName = usr.displayName
        user.role = "user"
        user.lasttime = firebase.firestore.Timestamp.now()
        bhs.updateUser(user)

        // ref = bhs.fs.collection("users").where("_name", "==", "zeenewbian")
        // let snapshot = await ref.get()
        // if (!snapshot.empty) {
        //     user = snapshot.docs[0].data()
        //     bhs.displayUser(user, true)
        // }

        bhs.doLoggedin(user)
        bhs.navLoggedin()
    } else {
        bhs.navLoggedout()
        bhs.user = bhs.userInit()
        bhs.doLoggedout()
    }
}

blackHoleSuns.prototype.init = function () {
    buildGalaxyInfo()
    bhs.user = bhs.userInit()
}

blackHoleSuns.prototype.userInit = function () {
    let user = {}
    user.uid = null
    user.role = "user"
    user._name = ""
    user.platform = ""
    user.galaxy = ""
    user.assigned = false
    user.org = ""

    return user
}

blackHoleSuns.prototype.navLoggedin = function () {
    $("#loggedout").hide()
    $("#loggedin").show()
    $("#login").hide()
    $("#usermenu").show()
}

blackHoleSuns.prototype.navLoggedout = function () {
    $("#loggedout").show()
    $("#loggedin").hide()
    $("#login").show()
    $("#usermenu").hide()
}

blackHoleSuns.prototype.updateUser = async function (user) {
    bhs.user = mergeObjects(bhs.user, user)

    if (bhs.user.uid) {
        bhs.user = mergeObjects(bhs.user, user)
        let ref = bhs.getUsersColRef(bhs.user.uid)
        return await ref.set(bhs.user, {
            merge: true
        }).then(() => {
            return true
        }).catch(err => {
            if (bhs.status)
                bhs.status("ERROR: " + err)

            console.log(err)
            return false
        })
    }
}

blackHoleSuns.prototype.changeName = function (loc, user) {
    if (user._name == bhs.user._name)
        return

    if (user._name.match(/--blank--/i)) {
        $(loc).val(bhs.user._name)
        bhs.status("Player Name:" + user._name + " is restricted.")
        return
    }

    if (user._name.match(/Unknown Traveler/i)) {
        $(loc).val(bhs.user._name)
        bhs.status("Player Name:" + user._name + " is restricted.")
        return
    }

    if (typeof user._name == "undefined" || user._name == "") {
        loc.val(bhs.user._name)
        bhs.status("Player Name Required.")
        return
    }

    var userExists = firebase.functions().httpsCallable('userExists')
    return userExists({
        name: user._name
    }).then(async result => {
        if (result.data.exists) {
            loc.val(bhs.user._name)
            bhs.status("Player Name:" + user._name + " is already taken.", 0)
        } else {
            await bhs.assignUid(bhs.user, user)
            bhs.updateUser(user)
        }
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getEntry = function (addr, displayfcn, galaxy, platform) {
    let ref = bhs.getStarsColRef(typeof galaxy !== "undefined" ? galaxy : bhs.user.galaxy,
        typeof platform !== "undefined" ? platform : bhs.user.platform, addr)

    return ref.get().then(async doc => {
        if (doc.exists) {
            let d = doc.data()
            let e = null

            if (typeof galaxy === "undefined" && !d.blackhole)
                e = await bhs.getEntryByConnection(d.addr)

            if (displayfcn)
                displayfcn(e ? e : d)

            return e ? e : d
        } else
            return null
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getEntryByRegion = async function (reg, displayfcn) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform)
    ref = ref.where("reg", "==", reg)
    return await ref.get().then(async snapshot => {
        if (!snapshot.empty) {
            let d
            let e = null

            for (let doc of snapshot.docs) {
                d = doc.data()
                if (d.blackhole)
                    break
            }

            if (!d.blackhole)
                e = await bhs.getEntryByConnection(d.addr)

            if (typeof displayfcn === "function")
                displayfcn(e ? e : d, $("#ck-zoomreg").prop("checked"))

            return e ? e : d
        }
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getEntryByConnection = async function (addr) {
    let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform)
    ref = ref.where("connection", "==", addr)

    return await ref.get().then(snapshot => {
        if (!snapshot.empty) {
            return snapshot.docs[0].data()
        } else
            return null
    }).catch(err => {
        console.log(err)
        return null
    })
}

blackHoleSuns.prototype.updateEntry = async function (entry) {
    entry.modded = firebase.firestore.Timestamp.now()

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
    await ref.set(entry, {
        merge: true
    }).then(() => {
        bhs.status(entry.addr + " saved.")
        return true
    }).catch(err => {
        if (err.code === "permission-denied") {
            ref.set(entry, {
                mergeFields: ["life", "econ"]
            }).then(() => {
                bhs.status(entry.addr + " (lifeform & economy) saved.")
                return true
            }).catch(err => {
                bhs.status(entry.addr + " ERROR-: " + err.code)
                return false
            })
        } else {
            bhs.status(entry.addr + " ERROR: " + err.code)
            return false
        }
    })
}

blackHoleSuns.prototype.updateBase = async function (entry) {
    entry.time = firebase.firestore.Timestamp.now()

    let ref = bhs.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr)
    await ref.set(entry, {
        merge: true
    }).then(() => {
        bhs.status(entry.addr + " base saved.")
        return null
    }).catch(err => {
        bhs.status(entry.addr + " ERROR: " + err.code)
        return err.code
    })
}

blackHoleSuns.prototype.deleteBase = async function (addr) {
    if (addr) {
        let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform, addr)
        await ref.delete().then(() => {
            bhs.status(addr + " base deleted.")
            return true
        }).catch(err => {
            bhs.status(addr + " ERROR: " + err.code)
            return false
        })
    }
}

blackHoleSuns.prototype.deleteEntry = async function (entry) {
    if (entry) {
        let ref = bhs.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
        await ref.delete().then(() => {
            bhs.status(entry.addr + " deleted.")
            return true
        }).catch(err => {
            bhs.status(entry.addr + " ERROR: " + err.code)
            return false
        })
    }
}

blackHoleSuns.prototype.assignUid = async function (user, newuser) {
    let updt = {}
    updt._name = newuser._name
    updt.uid = user.uid

    let ref = bhs.getStarsColRef()
    return await ref.get().then(snapshot => {
        let pr = []
        for (let doc of snapshot.docs) {
            let g = doc.data()

            for (let p of platformList) {
                let ref = bhs.getStarsColRef(g.name, p.name)
                ref = ref.where("_name", "==", user._name)

                pr.push(ref.get().then(snapshot => {
                    let pr = []

                    if (!snapshot.empty) {
                        console.log(g.name + " " + p.name + " " + user._name + " " + snapshot.size)
                        let c = 0
                        let b = bhs.fs.batch()

                        for (let doc of snapshot.docs) {
                            if (++c > 250) {
                                pr.push(b.commit().then(() => {
                                    console.log("commit " + c)
                                }).catch(err => {
                                    bhs.status("ERROR: " + err.code)
                                }))

                                c = 0
                                b = bhs.fs.batch()
                            }

                            b.update(doc.ref, updt)
                        }

                        if (c > 0)
                            pr.push(b.commit().then(() => {
                                console.log("commit " + c)
                            }).catch(err => {
                                bhs.status("ERROR: " + err.code)
                                console.log(err)
                            }))
                    }

                    return Promise.all(pr).then(() => {
                        console.log("finish g/p")
                    }).catch(err => {
                        bhs.status("ERROR: " + err.code)
                        console.log(err)
                    })
                }).catch(err => {
                    console.log(err)
                }))
            }
        }

        return Promise.all(pr).then(() => {
            return bhs.recalcTotals()
        }).catch(err => {
            bhs.status("ERROR: " + err.code)
            console.log(err)
        })
    }).catch(err => {
        bhs.status("ERROR: " + JSON.stringify(err))
        console.log(err)
    })
}

blackHoleSuns.prototype.getActiveContest = function (displayFcn) {
    bhs.contest = null
    return

    let now = (new Date()).getTime()

    let ref = bhs.fs.collection("contest")
    ref = ref.orderBy("start")
    ref.get().then(snapshot => {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data()
            let start = d.start.toDate().getTime()
            let end = d.end.toDate().getTime()

            if (start < now && end > now || start > now || i == snapshot.size - 1) {
                bhs.subscribe("act-ctst", snapshot.docs[i].ref, displayFcn)
                break
            }
        }
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.hideContest = function () {
    let now = (new Date()).getTime()

    let ref = bhs.fs.collection("contest")
    ref = ref.orderBy("start")
    ref.get().then(snapshot => {
        for (let i = 0; i < snapshot.size; ++i) {
            let d = snapshot.docs[i].data()
            let start = d.start.toDate().getTime()
            let end = d.end.toDate().getTime()

            if (start < now && end > now || start > now) {
                d.hidden = true
                snapshot.docs[i].ref.update(d)
                break
            }
        }
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.updateDARC = async function () {
    var updateDARC = firebase.functions().httpsCallable('updateDARC')
    updateDARC()
        .then(result => {
            console.log(result.data)
        })
        .catch(err => {
            console.log(err)
        })
    return
}

blackHoleSuns.prototype.genDARC = async function () {
    var genDARC = firebase.functions().httpsCallable('genDARC')
    genDARC()
        .then(result => {
            console.log(result.data)
        })
        .catch(err => {
            console.log(err)
        })
    return
}

blackHoleSuns.prototype.backupBHS = async function () {
    var backupBHS = firebase.functions().httpsCallable('backupBHS')
    backupBHS()
        .then(result => {
            console.log(result.data)
        })
        .catch(err => {
            console.log(err)
        })
    return
}

blackHoleSuns.prototype.genPOI = function () {
    var fcn = firebase.functions().httpsCallable('genPOI')
    return fcn().then(res => {
            console.log(JSON.stringify(res))
        })
        .catch(err => {
            console.log(JSON.stringify(err))
        })
}

blackHoleSuns.prototype.recalcTotals = function () {
    var recalcTotals = firebase.functions().httpsCallable('recalcTotals')
    recalcTotals()
        .then(result => {
            console.log(result.data)
        })
        .catch(err => {
            console.log(err)
        })
}

blackHoleSuns.prototype.getEntries = async function (displayFcn, singleDispFcn, uid, galaxy, platform) {
    galaxy = galaxy ? galaxy : bhs.user.galaxy
    platform = platform ? platform : bhs.user.platform
    let complete = false

    let ref = bhs.getStarsColRef(galaxy, platform)

    if (uid || findex) {
        ref = ref.where("uid", "==", uid ? uid : bhs.user.uid)
    } else
        complete = true

    if (bhs.loaded && bhs.loaded[galaxy] && bhs.loaded[galaxy][platform]) {
        if (uid || findex) {
            uid = uid ? uid : bhs.user.uid
            let list = Object.keys(bhs.list[galaxy][platform])
            for (let i = 0; i < list.length; ++i) {
                let e = bhs.list[galaxy][platform][list[i]]
                let k = Object.keys(e)
                if (e[k[0]].uid == uid)
                    bhs.entries[list[i]] = e
            }
        } else
            bhs.entries = bhs.list[galaxy][platform]
    } else {
        if (!bhs.list)
            bhs.list = {}
        if (!bhs.list[galaxy])
            bhs.list[galaxy] = {}
        if (!bhs.list[galaxy][platform])
            bhs.list[galaxy][platform] = {}

        let bhref = ref.where("blackhole", "==", true)

        if (findex && bhs.user.settings.start) {
            complete = false
            let start = firebase.firestore.Timestamp.fromDate(new Date(bhs.user.settings.start))
            bhref = bhref.where("created", ">=", start)
        }

        if (findex && bhs.user.settings.end) {
            complete = false
            let end = firebase.firestore.Timestamp.fromDate(new Date(bhs.user.settings.end))
            bhref = bhref.where("created", "<=", end)
        }

        await bhref.get().then(async snapshot => {
            for (let i = 0; i < snapshot.size; ++i)
                bhs.list[galaxy][platform][snapshot.docs[i].data().addr] = snapshot.docs[i].data()

            bhs.entries = bhs.list[galaxy][platform]

            if (complete) {
                if (typeof bhs.loaded == "undefined")
                    bhs.loaded = {}
                if (typeof bhs.loaded[galaxy] == "undefined")
                    bhs.loaded[galaxy] = {}

                bhs.loaded[galaxy][platform] = true
            }

            if (findex)
                await blackHoleSuns.prototype.getBases(displayFcn, singleDispFcn)
        }).catch(err => {
            console.log(err)
        })
    }

    if (displayFcn)
        displayFcn(bhs.entries)

    if (singleDispFcn) {
        ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()))
        bhs.subscribe("entries", ref, singleDispFcn)
    }
}

blackHoleSuns.prototype.getEntriesSub = function (singleDispFcn) {
    if (singleDispFcn) {
        let ref = bhs.getStarsColRef(bhs.user.galaxy, bhs.user.platform)
        ref = ref.where("uid", "==", bhs.user.uid)
        ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()))
        bhs.subscribe("entries", ref, singleDispFcn)
    }
}

blackHoleSuns.prototype.getEntriesByName = async function (displayFcn, name, galaxy, platform) {
    name = name ? name : bhs.user._name
    galaxy = galaxy ? galaxy : bhs.user.galaxy
    platform = platform ? platform : bhs.user.platform

    if (!bhs.loaded || !bhs.loaded[galaxy] || !bhs.loaded[galaxy][platform])
        await bhs.getEntries(null, null, null, galaxy, platform)

    if (!name.match(/-+blank-+/i)) {
        bhs.entries = {}
        let list = Object.keys(bhs.list[galaxy][platform])
        for (let i = 0; i < list.length; ++i) {
            let e = bhs.list[galaxy][platform][list[i]]
            if (e._name === name)
                bhs.entries[list[i]] = e
        }
    } else
        bhs.entries = bhs.list[galaxy][platform]

    if (displayFcn)
        displayFcn(bhs.entries)
}

blackHoleSuns.prototype.getOrgEntries = async function (displayFcn, name, galaxy, platform) {
    name = name ? name : bhs.user.org
    galaxy = galaxy ? galaxy : bhs.user.galaxy
    platform = platform ? platform : bhs.user.platform

    if (!bhs.loaded || !bhs.loaded[galaxy] || !bhs.loaded[galaxy][platform])
        await bhs.getEntries(null, null, null, galaxy, platform)

    if (name !== "--blank--") {
        bhs.entries = {}
        let list = Object.keys(bhs.list[galaxy][platform])
        for (let i = 0; i < list.length; ++i) {
            let e = bhs.list[galaxy][platform][list[i]]
            if (e.org === name)
                bhs.entries[list[i]] = e
        }
    } else
        bhs.entries = bhs.list[galaxy][platform]

    if (displayFcn)
        displayFcn(bhs.entries)
}

blackHoleSuns.prototype.getBases = async function (displayFcn, singleDispFcn) {
    let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform)
    ref = ref.where("uid", "==", bhs.user.uid)

    if (findex && bhs.user.settings.start) {
        let start = firebase.firestore.Timestamp.fromDate(new Date(bhs.user.settings.start))
        ref = ref.where("created", ">=", start)
    }

    if (findex && bhs.user.settings.end) {
        let end = firebase.firestore.Timestamp.fromDate(new Date(bhs.user.settings.end))
        ref = ref.where("created", "<=", end)
    }

    await ref.get().then(async snapshot => {
        for (let i = 0; i < snapshot.size; ++i)
            bhs.entries = bhs.addBaseList(snapshot.docs[i].data(), bhs.entries)

        bhs.getBasesSub(singleDispFcn)
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getBasesSub = function (singleDispFcn) {
    if (singleDispFcn) {
        let ref = bhs.getUsersColRef(bhs.user.uid, bhs.user.galaxy, bhs.user.platform)
        ref = ref.where("modded", ">", firebase.firestore.Timestamp.fromDate(new Date()))
        ref = ref.where("uid", "==", bhs.user.uid)
        bhs.subscribe("bases", ref, singleDispFcn)
    }
}

blackHoleSuns.prototype.addBaseList = function (entry, list) {
    if (typeof list[entry.addr] == "undefined") {
        let found = false
        for (let k of Object.keys(list)) {
            let e = list[k]
            if (e.connection == entry.addr) {
                found = true
                e.x.basename = entry.basename
                e.x.owned = entry.owned
                e.x.sharepoi = entry.sharepoi
                break
            }
        }

        if (!found)
            list[entry.addr] = entry
    } else {
        list[entry.addr].basename = entry.basename
        list[entry.addr].owned = entry.owned
        list[entry.addr].sharepoi = entry.sharepoi
    }

    return list
}

blackHoleSuns.prototype.getUser = async function (displayFcn) {
    if (bhs.user.uid && typeof displayFcn !== "undefined" && displayFcn) {
        let ref = bhs.getUsersColRef(bhs.user.uid)
        bhs.subscribe("user", ref, displayFcn)
    }
}

blackHoleSuns.prototype.getOrgList = function (nohide) {
    bhs.orgList = []

    let ref = bhs.fs.collection("org")
    return ref.get().then(snapshot => {
        for (let doc of snapshot.docs) {
            let d = doc.data()
            if (!nohide || !d.hide && typeof d.addr !== "undefined") {
                d.id = doc.id
                bhs.orgList.push(d)
            }
        }

        bhs.orgList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
            a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0)

        return bhs.orgList
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getPoiList = function (nohide) {
    bhs.poiList = []

    let ref = bhs.fs.collection("poi")
    return ref.get().then(snapshot => {
        for (let doc of snapshot.docs) {
            let d = doc.data()
            if (!nohide || !d.hide) {
                d.id = doc.id
                bhs.poiList.push(d)
            }
        }

        bhs.poiList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
            a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0)

        return bhs.poiList
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getUserList = async function (addBlank) {
    let ref = bhs.fs.doc("bhs/Players")
    return await ref.get().then(doc => {
        bhs.usersList = []
        if (doc.exists) {
            let d = doc.data()

            for (let u of Object.keys(d)) {
                bhs.usersList.push({
                    name: u,

                })
            }

            bhs.usersList.sort((a, b) =>
                a.name.toLowerCase() > b.name.toLowerCase() ? 1 :
                a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)

            if (addBlank)
                bhs.usersList.unshift({
                    name: "--blank--",
                    uid: null
                })
        }

        return bhs.usersList
    }).catch(err => {
        console.log(err)
    })
}

blackHoleSuns.prototype.getTotals = async function (displayFcn, dispHtml) {
    if (fsearch)
        return

    var t = firebase.functions().httpsCallable('getTotals')

    if (ftotals)
        t({
            view: "Galaxies"
        })
        .then(result => {
            dispHtml(result.data.html, "Galaxies")
        })

    t({
            view: "Players"
        })
        .then(result => {
            dispHtml(result.data.html, "Players")
        })

    t({
            view: "Organizations"
        })
        .then(result => {
            dispHtml(result.data.html, "Organizations")
        })

    let ref = bhs.fs.doc("bhs/Totals")
    bhs.subscribe("tot-totals", ref, displayFcn)

    ref = bhs.fs.doc("bhs/Organizations")
    bhs.subscribe("tot-orgs", ref, displayFcn)

    if (findex) {
        ref = bhs.fs.doc("bhs/Players")
        bhs.subscribe("tot-players", ref, displayFcn)
    }
}

blackHoleSuns.prototype.subscribe = function (what, ref, displayFcn) {
    if (displayFcn) {
        bhs.unsubscribe(what)
        bhs.unsub[what] = ref.onSnapshot(snapshot => {
            if (snapshot.exists)
                displayFcn(snapshot.data(), snapshot.ref.path)
            else
                snapshot.docChanges().forEach(change => {
                    displayFcn(change.doc.data(), change.doc.ref.path)
                })
        }, err => {
            console.log(err)
        })
    }
}

blackHoleSuns.prototype.unsubscribe = function (m) {
    let ulist = Object.keys(bhs.unsub)
    for (let i = 0; i < ulist.length; ++i) {
        let x = ulist[i]
        if (!m || x == m) {
            bhs.unsub[x]()
            delete bhs.unsub[x]
        }
    }
}

blackHoleSuns.prototype.getUsersColRef = function (uid, galaxy, platform, addr) {
    let ref = bhs.fs.collection(usersCol)
    if (uid) {
        ref = ref.doc(uid)
        if (galaxy) {
            ref = ref.collection(starsCol).doc(galaxy)
            if (platform) {
                ref = ref.collection(platform)
                if (addr) {
                    ref = ref.doc(addr)
                }
            }
        }
    }

    return ref
}

blackHoleSuns.prototype.getStarsColRef = function (galaxy, platform, addr) {
    let ref = bhs.fs.collection(starsCol)
    if (galaxy) {
        ref = ref.doc(galaxy)
        if (platform) {
            ref = ref.collection(platform)
            if (addr) {
                ref = ref.doc(addr)
            }
        }
    }

    return ref
}

blackHoleSuns.prototype.validateUser = function (user) {
    let ok = true

    if (!user._name || user._name == "" || user._name.match(/unknown traveler/i)) {
        bhs.status("Error: Missing or invalid player name. Changes not saved.", 0)
        ok = false
    }

    if (ok && !user.galaxy) {
        bhs.status("Error: Missing galaxy. Changes not saved.", 0)
        ok = false
    }

    if (ok && !user.platform) {
        bhs.status("Error: Missing platform. Changes not saved.", 0)
        ok = false
    }

    return ok
}

blackHoleSuns.prototype.validateEntry = function (entry, nobh) {
    let ok = true
    let error = ""

    if (!entry.addr) {
        error += "Missing address. "
        ok = false
    }

    if (ok && !entry.sys) {
        error += "Missing system name. "
        ok = false
    }

    if (ok && (entry.sys.includes("<") || entry.sys.includes(">"))) {
        error += "Invalid system name '" + entry.sys + "'. "
        ok = false
    }

    if (ok && !entry.reg && !fnmsce && !fcesearch) {
        error += "Missing region name. "
        ok = false
    }

    if (ok && (entry.reg.includes("<") || entry.reg.includes(">"))) {
        error += "Invalid region name '" + entry.reg + "'. "
        ok = false
    }

    if (ok && !entry.econ && fnmsce) {
        err += "Missing economy."
        ok = false
    }

    let str
    if (nobh) {
        if (ok && (str = bhs.validateAddress(entry.addr)) != "") {
            error += "Invalid address. (" + str + ") "
            ok = false
        }
    } else {
        if (ok && !entry.blackhole && !entry.deadzone && (str = validateExitAddress(entry.addr)) != "") {
            error += "Invalid exit address. (" + str + ") "
            ok = false
        }

        if (ok && (entry.blackhole || entry.deadzone) && (str = validateBHAddress(entry.addr)) != "") {
            error += "Invalid black hole address. (" + str + ") "
            ok = false
        }
    }

    if (!ok)
        bhs.status("Error: " + error + "Changes not saved.", 0)

    return error
}

blackHoleSuns.prototype.validateAddress = function (addr, ck) {
    if (addr === "")
        return "Empty address"

    let c = addressToXYZ(addr)
    let error = ""

    if (c.x > 0xfff) error = "x " + c.x.toString(16) + " > fff"
    else if (c.y > 0xff) error = "y " + c.y.toString(16) + " > ff"
    else if (c.z > 0xfff) error = "z " + c.z.toString(16) + " > fff"
    else if (c.s > 0x2ff) error = "system " + c.s.toString(16) + " > 2ff"
    else if (ck === "bh" && c.s != 0x79) error = ck + " system " + c.y.toString(16) + ' != 79'
    else if (ck === "exit" && c.y < 0x7B) error = ck + " y " + c.y.toString(16) + ' < 7b'
    else if (ck === "exit" && c.y > 0x83) error = ck + " y " + c.y.toString(16) + ' > 83'
    else if (ck === "exit" && c.s > 0x78) error = ck + " system " + c.s.toString(16) + ' > 78'

    return error === "" ? "" : addr + " " + error
}

blackHoleSuns.prototype.validateDist = function (entry) {
    let error = ""

    if (entry.dist < 3200) error = entry.addr + " star in center void"
    else if (entry.dist > 3600 && entry.towardsCtr < 0) error = entry.addr + " => " + entry.connection + " distance < 0"
    else if (entry.dist <= 3600 && entry.towardsCtr < -400) error = entry.addr + " => " + entry.connection + ` distance < -400`
    else if (entry.dist <= 819200 && entry.towardsCtr > 21000) error = entry.addr + " => " + entry.connection + ` distance > 21000`

    return error
}