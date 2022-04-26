'use strict';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js"
import { getAuth, getRedirectResult, signInWithRedirect, GoogleAuthProvider, GithubAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"
import { getFirestore, Timestamp, enableIndexedDbPersistence, collection, query, where, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,  onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js"
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-functions.js"
import { buildGalaxyInfo, validateAddress, fcedata, findex, fnmsce, fsearch, ftotals, mergeObjects } from "./commonNms.js";
import { platformList } from "./constants.js";

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

export var bhs;


var fbconfig = {
    apiKey: FIREBASE_API,
    authDomain: "nms-bhs.firebaseapp.com",
    databaseURL: "https://nms-bhs.firebaseio.com",
    projectId: "nms-bhs",
    storageBucket: "nms-bhs.appspot.com",
    messagingSenderId: FIREBASE_MSGID,
};


var starsCol = "stars5"
const usersCol = "users"

export function startUp() {
    $("#javascript").remove()
    $("#jssite").show()

    
    // Bad hack to make bhs global. Should not be used
    window.bhs = bhs = new blackHoleSuns()
    bhs.init()
    bhs.initFirebase()

    $("#bhsmenus").load("bhsmenus.html", () => {
        let page = window.location.pathname.replace(/(.*)\//, "$1")
        page = page === "" ? "index.html" : page

        let loc = $("[href='" + page + "']")
        $("#pagename").html(loc.text())

        $("#banner").on("load", () => {
            let width = $("body").width()
            loc = $("[src='images/bhs-banner.jpg']")
            let iwidth = loc.width()
            let iheight = loc.height() * width / iwidth

            loc.width(width)
            loc.height(iheight)
        })
    })

    $("#footer").load("footer.html")

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })
}

export class blackHoleSuns {
    user = {};
    unsub = {};
    fbauth = null;
    fs = null;
    fbstorage = null;
    app = null;
    
    init() {
        buildGalaxyInfo()
        this.user = this.userInit()
    }

    userInit() {
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

    initFirebase() {
        try {
            this.app = initializeApp(fbconfig)
        } catch (err) {
            if (!/already exists/.test(err.message))
                console.error("Firebase initialization error raised", err.stack)
        }
    
        this.fbauth = getAuth(this.app);
        this.fs = getFirestore(this.app);
        this.fbstorage = getStorage(this.app);
        // this.fs.settings({
        //     cacheSizeBytes: 1024 * 1024
        // })

        enableIndexedDbPersistence(this.fs);
        /*
        {
            synchronizeTabs: true
        }
        */
    
        getRedirectResult().then(result => {
            if (result.credential) {
                var token = result.credential.accessToken
            }
    
            var user = result.user
            this.onAuthStateChanged(user)
        }).catch(error => {
            var errorCode = error.code
            var errorMessage = error.message
            var email = error.email
            var credential = error.credential
    
            $("#loggedout").html("<h4>" + errorMessage + "</h4>")
        })
    
        this.fbauth.onAuthStateChanged(this.onAuthStateChanged.bind(bhs))
    }
    
    logIn() {
        $("#loginpnl").show()
        $("#jssite").hide()
    
        $("#lcancel").click(() => {
            $("#loginpnl").hide()
            $("#jssite").show()
        })
    
        $("#lgoogle").click(() => {
            var provider = new GoogleAuthProvider()
            provider.addScope('profile')
            provider.addScope('email')
            signInWithRedirect(getAuth(), provider)
        })
    
        $("#lgithub").click(() => {
            var provider = new GithubAuthProvider()
            signInWithRedirect(getAuth(), provider)
        })
    
        $("#ltwitch").click(() => {})
    
        $("#ldiscord").click(() => {})
    
        $("#lreddit").click(() => {})
    }
    
    logOut() {
        this.unsubscribe()
        this.fbauth.signOut()
    }
    
    async onAuthStateChanged(usr) {
        if (usr) {
            let profilePicUrl = usr.photoURL
            let userName = usr.displayName
            let user = this.userInit()
            user.uid = usr.uid
    
            $("#userpic").attr('src', profilePicUrl || '/images/body_image.png')
            $("#username").text(userName)
    
            let ref = this.getUsersColRef(usr.uid)
            try {
                let doc = await getDoc(ref);
                if (doc.exists())
                    user = doc.data()
                else {
                    user.firsttime = Timestamp.now()
                    user.page = window.location.pathname
                }
            } catch {
                user.firsttime = Timestamp.now()
                user.page = window.location.pathname
            }
    
            user.email = usr.email
            if (usr.displayName)
                user.displayName = usr.displayName
    
            user.role = usr.role;
            user.lasttime = Timestamp.now()
            this.updateUser(user)
    
            this.doLoggedin(user)
            this.navLoggedin()
        } else {
            this.navLoggedout()
            this.user = this.userInit()
            this.doLoggedout()
        }
    }
    
    navLoggedin() {
        $("#loggedout").hide()
        $("#loggedin").show()
        $("#login").hide()
        $("#usermenu").show()
    }
    
    navLoggedout() {
        $("#loggedout").show()
        $("#loggedin").hide()
        $("#login").show()
        $("#usermenu").hide()
    }
    
    async updateUser(user) {
        this.user = mergeObjects(this.user, user)
    
        if (this.user.uid) {
            let ref = this.getUsersColRef(this.user.uid)
            return await setDoc(ref, this.user, {
                merge: true
            }).then(() => {
                return true
            }).catch(err => {
                if (this.status)
                    this.status("ERROR: " + err)
    
                console.log(err)
                return false
            })
        } else
            return false
    }
    
    changeName(loc, user) {
        if (user._name == this.user._name)
            return
    
        if (user._name.match(/--blank--/i)) {
            $(loc).val(this.user._name)
            this.status("Player Name:" + user._name + " is restricted.")
            return
        }
    
        if (user._name.match(/Unknown Traveler/i)) {
            $(loc).val(this.user._name)
            this.status("Player Name:" + user._name + " is restricted.")
            return
        }
    
        if (typeof user._name == "undefined" || user._name == "") {
            loc.val(this.user._name)
            this.status("Player Name Required.")
            return
        }
    
        var userExists = httpsCallable('userExists');
        return userExists({
            name: user._name
        }).then(async result => {
            if (result.data.exists) {
                loc.val(this.user._name)
                this.status("Player Name:" + user._name + " is already taken.", 0)
            } else {
                await this.assignUid(this.user, user)
                this.updateUser(user)
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    getEntry(addr, displayfcn, galaxy, platform, connection) {
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
        let ref = this.getStarsColRef(galaxy, platform, addr)
    
        const pnlTop = 0
        const pnlBottom = 1

        const func = ref.type == 'collection' ? getDocs : getDoc;
    
        return func(ref).then(async doc => {
            if (doc.exists && doc.exists()) {
                let d = doc.data()
                let e = null
    
                this.last = []
                this.last[pnlTop] = d
                this.last[pnlBottom] = null
    
                if (!connection) {
                    if (!d.blackhole) {
                        e = await this.getEntryByConnection(d.addr, galaxy, platform)
    
                        if (e) {
                            this.last[pnlTop] = e
                            this.last[pnlBottom] = d
                        }
                    } else {
                        e = await this.getEntry(d.connection, null, galaxy, platform, true)
    
                        if (e) {
                            this.last[pnlTop] = d
                            this.last[pnlBottom] = e
                        }
                    }
                }
    
                if (displayfcn)
                    displayfcn(this.last[pnlTop])
    
                return d
            } else
                return null
        }).catch(err => {
            console.log(err)
        })
    }
    
    async getEntryByRegion(reg, displayfcn, galaxy, platform) {
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
        let ref = this.getStarsColRef(galaxy, platform)
    
        ref = query(ref, where("reg", "==", reg))
        return await getDocs(ref).then(async snapshot => {
            if (!snapshot.empty) {
                let d
                let e = null
    
                for (let doc of snapshot.docs) {
                    d = doc.data()
                    if (d.blackhole)
                        break
                }
    
                if (!d.blackhole)
                    e = await this.getEntryByConnection(d.addr, galaxy, platform)
    
                if (typeof displayfcn === "function")
                    displayfcn(e ? e : d, $("#ck-zoomreg").prop("checked"))
    
                return e ? e : d
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    async getEntryBySystem(sys, displayfcn, galaxy, platform) {
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
        let ref = this.getStarsColRef(galaxy, platform)
    
        ref = query(ref, where("sys", "==", sys))
        return await getDocs(ref).then(async snapshot => {
            if (!snapshot.empty) {
                let d
                let e = null
    
                for (let doc of snapshot.docs) {
                    d = doc.data()
                    if (d.blackhole)
                        break
                }
    
                if (!d.blackhole)
                    e = await this.getEntryByConnection(d.addr, galaxy, platform)
    
                if (typeof displayfcn === "function")
                    displayfcn(e ? e : d)
    
                return e ? e : d
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    getEntryByRegionAddr(addr, displayfcn) {
        let ref = this.getStarsColRef(this.user.galaxy, this.user.platform)
    
        ref = query(ref, where("addr", ">=", addr.slice(0, 15) + "0000"), where("addr", "<=", addr.slice(0, 15) + "02FF"));
    
        return getDocs(ref).then(async snapshot => {
            if (!snapshot.empty) {
                for (let doc of snapshot.docs) {
                    let d = doc.data()
                    if (d.reg !== "") {
                        if (displayfcn)
                            displayfcn(d)
    
                        return d
                    }
                }
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    async getEntryByConnection(addr, galaxy, platform) {
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
        let ref = this.getStarsColRef(galaxy, platform)
    
        ref = query(ref, where("connection", "==", addr))
        return await getDocs(ref).then(snapshot => {
            if (!snapshot.empty) {
                return snapshot.docs[0].data()
            } else
                return null
        }).catch(err => {
            console.log(err)
            return null
        })
    }
    
    async updateEntry(entry) {
        entry.modded = Timestamp.now()
    
        if (typeof entry.created === "undefined")
            entry.created = Timestamp.now()
    
        let ref = this.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
        await setDoc(ref, entry, {
            merge: true
        }).then(() => {
            this.status(entry.addr + " saved.")
            return true
        }).catch(err => {
            if (err.code === "permission-denied") {
                setDoc(ref, entry, {
                    mergeFields: ["life", "econ", "reg", "sys"]
                }).then(() => {
                    this.status(entry.addr + " (lifeform, economy, system & region) saved.")
                    return true
                }).catch(err => {
                    this.status(entry.addr + " ERROR-: " + err.code)
                    return false
                })
            } else {
                this.status(entry.addr + " ERROR: " + err.code)
                return false
            }
        })
    }
    
    async updateBase(entry) {
        entry.time = Timestamp.now()
    
        let ref = this.getUsersColRef(entry.uid, entry.galaxy, entry.platform, entry.addr)
        await setDoc(ref, entry, {
            merge: true
        }).then(() => {
            this.status(entry.addr + " base saved.")
            return null
        }).catch(err => {
            this.status(entry.addr + " ERROR: " + err.code)
            return err.code
        })
    }
    
    async deleteBase(addr) {
        if (addr) {
            let ref = this.getUsersColRef(this.user.uid, this.user.galaxy, this.user.platform, addr)
            await deleteDoc(ref).then(() => {
                this.status(addr + " base deleted.")
                return true
            }).catch(err => {
                this.status(addr + " ERROR: " + err.code)
                return false
            })
        }
    }
    
    async deleteEntry(entry) {
        if (entry) {
            let ref = this.getStarsColRef(entry.galaxy, entry.platform, entry.addr)
            await deleteDoc(ref).then(() => {
                this.status(entry.addr + " deleted.")
                return true
            }).catch(err => {
                this.status(entry.addr + " ERROR: " + err.code)
                return false
            })
        }
    }
    
    async assignUid(user, newuser) {
        let updt = {}
        updt._name = newuser._name
        updt.uid = user.uid
    
        let ref = this.getStarsColRef()
        return await getDocs(ref).then(snapshot => {
            let pr = []
            for (let doc of snapshot.docs) {
                let g = doc.data()
    
                for (let p of platformList) {
                    let ref = this.getStarsColRef(g.name, p.name)
                    ref = query(ref, where("_name", "==", user._name));
    
                    pr.push(getDocs(ref).then(snapshot => {
                        let pr = []
    
                        if (!snapshot.empty) {
                            console.log(g.name + " " + p.name + " " + user._name + " " + snapshot.size)
                            let c = 0
                            let b = this.fs.batch()
    
                            for (let doc of snapshot.docs) {
                                if (++c > 250) {
                                    pr.push(b.commit().then(() => {
                                        console.log("commit " + c)
                                    }).catch(err => {
                                        this.status("ERROR: " + err.code)
                                    }))
    
                                    c = 0
                                    b = this.fs.batch()
                                }
    
                                b.update(doc.ref, updt)
                            }
    
                            if (c > 0)
                                pr.push(b.commit().then(() => {
                                    console.log("commit " + c)
                                }).catch(err => {
                                    this.status("ERROR: " + err.code)
                                    console.log(err)
                                }))
                        }
    
                        return Promise.all(pr).then(() => {
                            console.log("finish g/p")
                        }).catch(err => {
                            this.status("ERROR: " + err.code)
                            console.log(err)
                        })
                    }).catch(err => {
                        console.log(err)
                    }))
                }
            }
    
            return Promise.all(pr).then(() => {
                return this.recalcTotals()
            }).catch(err => {
                this.status("ERROR: " + err.code)
                console.log(err)
            })
        }).catch(err => {
            this.status("ERROR: " + JSON.stringify(err))
            console.log(err)
        })
    }
    
    getActiveContest(displayFcn) {
        this.contest = null
        return;
    
        let now = (new Date()).getTime()
    
        let ref = collection(this.fs, "contest")
        ref = query(ref, orderBy("start"))
        getDocs(ref).then(snapshot => {
            for (let i = 0; i < snapshot.size; ++i) {
                let d = snapshot.docs[i].data()
                let start = d.start.toDate().getTime()
                let end = d.end.toDate().getTime()
    
                if (start < now && end > now || start > now || i == snapshot.size - 1) {
                    this.subscribe("act-ctst", snapshot.docs[i].ref, displayFcn)
                    break
                }
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    hideContest() {
        let now = (new Date()).getTime()
    
        let ref = collection(this.fs, "contest")
        ref = query(ref, orderBy("start"))
        getDocs(ref).then(snapshot => {
            for (let i = 0; i < snapshot.size; ++i) {
                let d = snapshot.docs[i].data()
                let start = d.start.toDate().getTime()
                let end = d.end.toDate().getTime()
    
                if (start < now && end > now || start > now) {
                    d.hidden = true
                    updateDoc(snapshot.docs[i].ref, d)
                    break
                }
            }
        }).catch(err => {
            console.log(err)
        })
    }
    
    async updateDARC() {
        var updateDARC = httpsCallable('updateDARC')
        updateDARC()
            .then(result => {
                console.log(result.data)
            })
            .catch(err => {
                console.log(err)
            })
        return
    }
    
    async genDARC() {
        var genDARC = httpsCallable('genDARC')
        genDARC()
            .then(result => {
                console.log(result.data)
            })
            .catch(err => {
                console.log(err)
            })
        return
    }
    
    async backupBHS() {
        var backupBHS = httpsCallable('backupBHS')
        backupBHS()
            .then(result => {
                console.log(result.data)
            })
            .catch(err => {
                console.log(err)
            })
        return
    }
    
    genPOI() {
        var fcn = httpsCallable('genPOI')
        return fcn().then(res => {
                console.log(JSON.stringify(res))
            })
            .catch(err => {
                console.log(JSON.stringify(err))
            })
    }
    
    recalcTotals() {
        var recalcTotals = httpsCallable('recalcTotals')
        recalcTotals()
            .then(result => {
                console.log(result.data)
            })
            .catch(err => {
                console.log(err)
            })
    }
    
    async getEntries(displayFcn, singleDispFcn, uid, galaxy, platform) {
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
        let complete = false
    
        let ref = this.getStarsColRef(galaxy, platform)
    
        if (uid || findex) {
            ref = query(ref, where("uid", "==", uid ? uid : this.user.uid))
        } else
            complete = true
    
        if (this.loaded && this.loaded[galaxy] && this.loaded[galaxy][platform]) {
            if (uid || findex) {
                uid = uid ? uid : this.user.uid
                let list = Object.keys(this.list[galaxy][platform])
                for (let i = 0; i < list.length; ++i) {
                    let e = this.list[galaxy][platform][list[i]]
                    let k = Object.keys(e)
                    if (e[k[0]].uid == uid)
                        this.entries[list[i]] = e
                }
            } else
                this.entries = this.list[galaxy][platform]
        } else {
            if (!this.list)
                this.list = {}
            if (!this.list[galaxy])
                this.list[galaxy] = {}
            if (!this.list[galaxy][platform])
                this.list[galaxy][platform] = {}
    
            let bhref = query(ref, where("blackhole", "==", true))
    
            if (findex && this.user.settings) {
                if (this.user.settings.start) {
                    complete = false
                    let start = Timestamp.fromDate(new Date(this.user.settings.start))
                    bhref = bhref.where("created", ">=", start)
                }
    
                if (this.user.settings.end) {
                    complete = false
                    let end = Timestamp.fromDate(new Date(this.user.settings.end))
                    bhref = bhref.where("created", "<=", end)
                }
            }
    
            await bhref.get().then(async snapshot => {
                for (let i = 0; i < snapshot.size; ++i)
                    this.list[galaxy][platform][snapshot.docs[i].data().addr] = snapshot.docs[i].data()
    
                this.entries = this.list[galaxy][platform]
    
                if (complete) {
                    if (typeof this.loaded == "undefined")
                        this.loaded = {}
                    if (typeof this.loaded[galaxy] == "undefined")
                        this.loaded[galaxy] = {}
    
                    this.loaded[galaxy][platform] = true
                }
    
                if (findex)
                    await blackHoleSuns.prototype.getBases(displayFcn, singleDispFcn)
            }).catch(err => {
                console.log(err)
            })
        }
    
        if (displayFcn)
            displayFcn(this.entries)
    
        if (singleDispFcn) {
            ref = query(ref, where("modded", ">", Timestamp.fromDate(new Date())))
            this.subscribe("entries", ref, singleDispFcn)
        }
    }
    
    getEntriesSub(singleDispFcn) {
        if (singleDispFcn) {
            let ref = this.getStarsColRef(this.user.galaxy, this.user.platform)
            ref = query(ref, where("uid", "==", this.user.uid), where("modded", ">", Timestamp.fromDate(new Date())));
            this.subscribe("entries", ref, singleDispFcn)
        }
    }
    
    async getEntriesByName(displayFcn, name, galaxy, platform) {
        name = name ? name : this.user._name
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
    
        if (!this.loaded || !this.loaded[galaxy] || !this.loaded[galaxy][platform])
            await this.getEntries(null, null, null, galaxy, platform)
    
        if (!name.match(/-+blank-+/i)) {
            this.entries = {}
            let list = Object.keys(this.list[galaxy][platform])
            for (let i = 0; i < list.length; ++i) {
                let e = this.list[galaxy][platform][list[i]]
                if (e._name === name)
                    this.entries[list[i]] = e
            }
        } else
            this.entries = this.list[galaxy][platform]
    
        if (displayFcn)
            displayFcn(this.entries)
    }
    
    async getOrgEntries(displayFcn, name, galaxy, platform) {
        name = name ? name : this.user.org
        galaxy = galaxy ? galaxy : this.user.galaxy
        platform = platform ? platform : this.user.platform
    
        if (!this.loaded || !this.loaded[galaxy] || !this.loaded[galaxy][platform])
            await this.getEntries(null, null, null, galaxy, platform)
    
        if (name !== "--blank--") {
            this.entries = {}
            let list = Object.keys(this.list[galaxy][platform])
            for (let i = 0; i < list.length; ++i) {
                let e = this.list[galaxy][platform][list[i]]
                if (e.org === name)
                    this.entries[list[i]] = e
            }
        } else
            this.entries = this.list[galaxy][platform]
    
        if (displayFcn)
            displayFcn(this.entries)
    }
    
    async getBases(displayFcn, singleDispFcn) {
        let ref = this.getUsersColRef(this.user.uid, this.user.galaxy, this.user.platform)
        ref = query(ref, where("uid", "==", this.user.uid));
    
        if (findex && this.user.settings.start) {
            let start = Timestamp.fromDate(new Date(this.user.settings.start))
            ref = query(ref, where("created", ">=", start))
        }
    
        if (findex && this.user.settings.end) {
            let end = Timestamp.fromDate(new Date(this.user.settings.end))
            ref = query(ref, where("created", "<=", end))
        }
    
        await getDocs(ref).then(async snapshot => {
            for (let i = 0; i < snapshot.size; ++i)
                this.entries = this.addBaseList(snapshot.docs[i].data(), this.entries)
    
            this.getBasesSub(singleDispFcn)
        }).catch(err => {
            console.log(err)
        })
    }
    
    getBasesSub(singleDispFcn) {
        if (singleDispFcn) {
            let ref = this.getUsersColRef(this.user.uid, this.user.galaxy, this.user.platform)
            ref = query(ref, where("modded", ">", Timestamp.fromDate(new Date())), where("uid", "==", this.user.uid));
            this.subscribe("bases", ref, singleDispFcn)
        }
    }
    
    addBaseList(entry, list) {
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
    
    async getUser(displayFcn) {
        if (this.user.uid && typeof displayFcn !== "undefined" && displayFcn) {
            let ref = this.getUsersColRef(this.user.uid)
            this.subscribe("user", ref, displayFcn)
        }
    }
    
    getOrgList(nohide) {
        this.orgList = []
    
        return getDocs(collection(this.fs, "org")).then(snapshot => {
            for (let doc of snapshot.docs) {
                let d = doc.data()
                if (!nohide || !d.hide && typeof d.addr !== "undefined") {
                    d.id = doc.id
                    this.orgList.push(d)
                }
            }
    
            this.orgList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0)
    
            return this.orgList
        }).catch(err => {
            console.log(err)
        })
    }
    
    getPoiList(nohide) {
        this.poiList = []
    
        return getDocs(collection(this.fs, "poi")).then(snapshot => {
            for (let doc of snapshot.docs) {
                let d = doc.data()
                if (!nohide || !d.hide) {
                    d.id = doc.id
                    this.poiList.push(d)
                }
            }
    
            this.poiList.sort((a, b) => a._name.toLowerCase() > b._name.toLowerCase() ? 1 :
                a._name.toLowerCase() < b._name.toLowerCase() ? -1 : 0)
    
            return this.poiList
        }).catch(err => {
            console.log(err)
        })
    }
    
    async getUserList(addBlank) {
        return await getDoc(doc(this.fs, "bhs/Players")).then(doc => {
            this.usersList = []
            if (doc.exists()) {
                let d = doc.data()
    
                for (let u of Object.keys(d)) {
                    this.usersList.push({
                        name: u,
    
                    })
                }
    
                this.usersList.sort((a, b) =>
                    a.name.toLowerCase() > b.name.toLowerCase() ? 1 :
                    a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)
    
                if (addBlank)
                    this.usersList.unshift({
                        name: "--blank--",
                        uid: null
                    })
            }
    
            return this.usersList
        }).catch(err => {
            console.log(err)
        })
    }
    
    async getTotals(displayFcn, dispHtml) {
        if (fsearch)
            return
    
        var t = httpsCallable(getFunctions(this.app), 'getTotals')
    
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
    
        let ref = doc(this.fs, "bhs/Totals")
        this.subscribe("tot-totals", ref, displayFcn)
    
        ref = doc(this.fs, "bhs/Organizations")
        this.subscribe("tot-orgs", ref, displayFcn)
    
        if (findex) {
            ref = doc(this.fs, "bhs/Players")
            this.subscribe("tot-players", ref, displayFcn)
        }
    }
    
    subscribe(what, ref, displayFcn) {
        if (displayFcn) {
            this.unsubscribe(what)
            this.unsub[what] = onSnapshot(ref, snapshot => {
                if (typeof snapshot.exists !== "undefined") {
                    if (snapshot.exists())
                        displayFcn(snapshot.data(), snapshot.ref.path)
                } else
                    snapshot.docChanges().forEach(change => {
                        displayFcn(change.doc.data(), change.doc.ref.path)
                    })
            }, err => {
                console.log(err)
            })
        }
    }
    
    unsubscribe(m) {
        let ulist = Object.keys(this.unsub)
        for (let i = 0; i < ulist.length; ++i) {
            let x = ulist[i]
            if (!m || x == m) {
                this.unsub[x]()
                delete this.unsub[x]
            }
        }
    }
    
    getUsersColRef(uid, galaxy, platform, addr) {
        let ref = collection(this.fs, usersCol)
        if (uid) {
            ref = doc(ref, uid)
            if (galaxy) {
                ref = doc(collection(ref, starsCol), galaxy)
                if (platform) {
                    ref = collection(ref, platform)
                    if (addr) {
                        ref = doc(ref, addr)
                    }
                }
            }
        }
    
        return ref
    }
    
    getStarsColRef(galaxy, platform, addr) {
        let ref = collection(this.fs, starsCol)
        if (galaxy) {
            ref = doc(ref, galaxy)
            if (platform) {
                ref = collection(ref, platform)
                if (addr) {
                    ref = doc(ref, addr)
                }
            }
        }
    
        return ref
    }
    
    validateUser(user) {
        let ok = true
    
        if (!user._name || user._name == "" || user._name.match(/unknown traveler/i)) {
            this.status("Error: Missing or invalid player name. Changes not saved.", 0)
            ok = false
        }
    
        if (ok && !user.galaxy) {
            this.status("Error: Missing galaxy. Changes not saved.", 0)
            ok = false
        }
    
        if (ok && !user.platform) {
            this.status("Error: Missing platform. Changes not saved.", 0)
            ok = false
        }
    
        return ok
    }
    
    validateEntry(entry, nobh) {
        let ok = true
        let error = ""
    
        if (!entry.addr) {
            error += "Missing address. "
            ok = false
        }
    
        if (!entry.addr.match(/([0-9A-F]{4}:){3}([0-9A-F]{4})/)) {
            error += "Invalid address. "
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
    
        if (ok && !entry.reg && !fcedata && !fnmsce) {
            error += "Missing region name. "
            ok = false
        }
    
        if (ok && (entry.reg.includes("<") || entry.reg.includes(">"))) {
            error += "Invalid region name '" + entry.reg + "'. "
            ok = false
        }
    
        if (ok && !entry.econ && fcedata) {
            error += "Missing economy."
            ok = false
        }
    
        let str
        if (nobh) {
            if (ok && (str = this.validateAddress(entry.addr)) != "") {
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
            this.status("Error: " + error + "Changes not saved.", 0)
    
        return error
    }
    
    validateAddress(addr, ck) {
        return validateAddress(addr, ck)
    }
    
    validateDist(entry) {
        let error = ""
    
        if (entry.dist < 3200) error = entry.addr + " star in center void"
        else if (entry.dist > 3600 && entry.towardsCtr < 0) error = entry.addr + " => " + entry.connection + " distance < 0"
        else if (entry.dist <= 3600 && entry.towardsCtr < -400) error = entry.addr + " => " + entry.connection + ` distance < -400`
        else if (entry.dist <= 819200 && entry.towardsCtr > 21000) error = entry.addr + " => " + entry.connection + ` distance > 21000`
    
        return error
    }
}