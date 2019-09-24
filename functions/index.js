/***************************

https://us-central1-nms-bhs.cloudfunctions.net/getGPList
https://us-central1-nms-bhs.cloudfunctions.net/getDARC?g=Calypso&p=PC-XBox
https://us-central1-nms-bhs.cloudfunctions.net/getPOI?g=Euclid&p=PC-XBox

****************************/
'use strict'
const functions = require('firebase-functions')
const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
const cors = require('cors')({
    origin: true
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

// https://us-central1-nms-bhs.cloudfunctions.net/getDARC?g=Calypso&p=PC-XBox
// ["0000:0000:0000:0079","Thoslo Quadrant","SAS.A83","0FFE:007E:0082:003D","Vasika Boundary","Uscarlen"]
exports.getDARC = functions.https.onRequest((request, response) => {
    return cors(request, response, () => {
        const bucket = admin.storage().bucket("nms-bhs.appspot.com")

        let fname = 'darc/' + request.query.g + "-" + request.query.p + ".json"
        console.log(fname)
        let f = bucket.file(fname)
        return f.exists().then(data => {
                if (data[0]) {
                    let s = f.createReadStream()
                    s.pipe(response)
                } else
                    response.status(503).send(request.query.g + "/" + request.query.p + " not found")
            })
            .catch(err => {
                console.log(JSON.stringify(err))
                response.status(503).send(JSON.stringify(err))
            })
    })
})

// https://us-central1-nms-bhs.cloudfunctions.net/getPOI?g=Calypso&p=PC-XBox
// ["0000:0000:0000:0079","Thoslo Quadrant","SAS.A83","Farpoint Station","Bad Wolf", "base"]
exports.getPOI = functions.https.onRequest((request, response) => {
    return cors(request, response, () => {
        const bucket = admin.storage().bucket("nms-bhs.appspot.com")

        let fname = 'darc/poi/' + request.query.g + "-" + request.query.p + ".json"
        console.log(fname)
        let f = bucket.file(fname)
        return f.exists().then(data => {
                if (data[0]) {
                    let s = f.createReadStream()
                    s.pipe(response)
                } else
                    response.status(503).send(request.query.g + "/" + request.query.p + " not found")
            })
            .catch(err => {
                console.log(JSON.stringify(err))
                response.status(503).send(JSON.stringify(err))
            })
    })
})

// https://us-central1-nms-bhs.cloudfunctions.net/getGPList
// ["Aptarkaba","PC-XBox","PS4"] ["Ontiniangp","PS4"] 
exports.getGPList = functions.https.onRequest((request, response) => {
    return cors(request, response, () => {
        let ref = admin.firestore().collection("stars5")
        return ref.listDocuments().then(async docrefs => {
            let out = ""

            for (let gref of docrefs) {
                let e = []
                e.push(gref.id)

                await gref.listCollections().then(async colrefs => {
                    for (let pref of colrefs)
                        e.push(pref.id)
                })

                out += JSON.stringify(e) + "\n"
            }

            response.status(200).send(out)
        }).catch(err => {
            console.log(JSON.stringify(err))
            response.status(503).send(JSON.stringify(err))
        })
    })
})

exports.calcRoute = functions.https.onCall(async (data, context) => {
    const hops = require('./hops.js')
    return await hops.genRoute(data, context)
})

exports.userExists = functions.https.onCall(async (data, context) => {
    let ref = admin.firestore().collection("users")
    ref = ref.where("_name", "==", data.name)
    return ref.get().then(snapshot => {
        return {
            exists: !snapshot.empty
        }
    })
})

exports.genPOI = functions.https.onCall((data, context) => {
    const hops = require('./hops.js')
    return hops.genPOIfile()
})

exports.scheduleGenPOI = functions.pubsub.schedule('0 * * * *').onRun(context => {
    const hops = require('./hops.js')
    return hops.genPOI()
})

exports.genDARC = functions.https.onCall(async (data, context) => {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")

    let ref = admin.firestore().collection("stars5")
    return ref.listDocuments().then(docrefs => {
        let p = []

        for (let gref of docrefs) {
            p.push(gref.listCollections().then(async colrefs => {
                let p = []

                for (let pref of colrefs) {
                    let fname = 'darc/' + pref.parent.id + "-" + pref.id + ".json"

                    ref = pref.where("blackhole", "==", true)
                    ref = ref.orderBy("modded", "desc")
                    ref = ref.limit(1)
                    let modded = await ref.get().then(async snapshot => {
                        return snapshot.docs[0].data().modded.toDate().getTime()
                    })

                    let f = bucket.file(fname)
                    let needupdate = await f.exists()
                        .then(data => {
                            return !data[0]
                        })
                        .catch(err => {
                            return err ? true : false
                        })

                    needupdate = needupdate || await f.getMetadata()
                        .then(data => {
                            const metadata = data[0]
                            return new Date(metadata.updated).getTime() < modded
                        })
                        .catch(err => {
                            return err ? true : false
                        })

                    if (needupdate) {
                        ref = pref.where("blackhole", "==", true)
                        p.push(ref.get().then(async snapshot => {
                            let p = []

                            if (snapshot.size > 0) {
                                let e = snapshot.docs[0].data()
                                let fname = 'darc/' + e.galaxy + "-" + e.platform + ".json"

                                console.log(e.galaxy, e.platform, snapshot.size)

                                let f = bucket.file(fname)
                                let s = f.createWriteStream({
                                    gzip: true,
                                })

                                p.push(new Promise((resolve, reject) => {
                                    s.on('finish', () => {
                                        console.log(fname, snapshot.size, "finished")
                                        resolve(fname + " " + snapshot.size)
                                    })
                                }))

                                for (let doc of snapshot.docs) {
                                    let e = doc.data()
                                    e = await checkOldEntry(e, doc.ref)

                                    let out = stringify(e)
                                    if (out)
                                        s.write(out)
                                }

                                s.end()
                            }

                            return Promise.all(p).then(res => {
                                return res
                            })
                        }))
                    }

                }

                return Promise.all(p).then(res => {
                    return res
                })
            }))
        }

        return Promise.all(p).then(res => {
            return {
                ok: res
            }
        }).catch(err => {
            console.log("error", err)
            return {
                err: err
            }
        })
    })
})

async function checkOldEntry(e, eref) {
    if (typeof e.x === "undefined") {
        let ref = admin.firestore().doc("stars5/" + e.galaxy + "/" + e.platform + "/" + e.connection)
        e = await ref.get().then(async doc => {
            if (doc.exists) {
                let c = doc.data()
                c.blackhole = false
                c.deadzone = false

                await doc.ref.set(c)

                e.x = {}
                e.x.sys = typeof c.sys !== "undefined" ? c.sys : ""
                e.x.reg = typeof c.reg !== "undefined" ? c.reg : ""
                e.x.life = typeof c.life !== "undefined" ? c.life : ""
                e.x.econ = typeof c.econ !== "undefined" ? c.econ : ""
                e.x.addr = c.addr
                e.x.dist = c.dist
                e.x.xyzs = c.xyzs

                delete e.conxyzs
                delete e.valid

                await eref.set(e)
                console.log("fixed " + e._name + " " + e.galaxy + " " + e.platform + " " + e.addr)
            }

            return e
        })
    }

    return e
}

function stringify(e) {
    if (typeof e.x === "undefined") {
        console.log(e.galaxy, e.platform, e.addr, "x not defined")
        return null
    }

    if (typeof e.sys === "undefined" && typeof e.reg === "undefined") {
        console.log(e.galaxy, e.platform, e.addr, "sys/reg not found")
        return null
    }

    return JSON.stringify([e.addr, e.reg, e.sys, e.x.addr, e.x.reg, e.x.sys]) + "\n"
}

exports.scheduleUpdateDARC = functions.pubsub.schedule("0 * * * *").onRun((context) => {
    return doUpdateDARC()
})

exports.updateDARC = functions.https.onCall(async (data, context) => {
    return doUpdateDARC()
})

async function doUpdateDARC() {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    const readline = require('readline')

    let ref = admin.firestore().collection("edits")
    return ref.get().then(async snapshot => {
        let edits = {}

        for (let doc of snapshot.docs) {
            let e = doc.data()

            if (typeof edits[e.galaxy] === "undefined")
                edits[e.galaxy] = {}
            if (typeof edits[e.galaxy][e.platform] === "undefined")
                edits[e.galaxy][e.platform] = {}
            if (typeof edits[e.galaxy][e.platform][e.addr] === "undefined")
                edits[e.galaxy][e.platform][e.addr] = {}

            e.ref = doc.ref
            edits[e.galaxy][e.platform][e.addr][doc.id] = e
        }

        let p = []
        for (let gal of Object.keys(edits))
            for (let plat of Object.keys(edits[gal])) {
                let elist = edits[gal][plat]

                let tname = 'tmp/' + gal + "-" + plat + ".json"
                let tf = bucket.file(tname)
                let ts = tf.createWriteStream({
                    gzip: true
                })

                let dname = 'darc/' + gal + "-" + plat + ".json"
                let df = bucket.file(dname)

                let exists = await df.exists()
                    .then(data => {
                        return data[0]
                    }).catch(() => {
                        return false
                    })

                if (exists) {
                    let ds = df.createReadStream()
                    let rd = readline.createInterface({
                        input: ds
                    })

                    rd.on("line", line => {
                        let addr = line.replace(/.*?((?:[0-9A-F]{4}:){3}[0-9A-F]{4}).*/, "$1")
                        if (applyEdits(ts, elist[addr]))
                            delete elist[addr]
                        else
                            ts.write(line + "\n")
                    })

                    rd.on("close", () => {
                        appendEdits(ts, elist)
                    })

                } else
                    appendEdits(ts, elist)

                p.push(new Promise((resolve, reject) => {
                    ts.on('finish', () => {
                        tf.move(dname).then(() => {
                            resolve()
                        }).catch(err => {
                            reject(err)
                        })
                    })
                }))
            }

        return Promise.all(p).then(() => {
            return {
                ok: true
            }
        }).catch(err => {
            return {
                err: err
            }
        })
    })
}

function appendEdits(ts, elist) {
    for (let a of Object.keys(elist))
        applyEdits(ts, elist[a])

    ts.end()
}

function applyEdits(ts, elist) {
    if (typeof elist !== "undefined") {
        let line = null

        for (let t of Object.keys(elist)) {
            let ed = elist[t]

            let ref = ed.ref
            delete ed.ref

            switch (ed.what) {
                case "delete":
                    console.log("delete", ed.addr)
                    line = null
                    break
                case "update":
                case "create":
                    console.log(ed.what, ed.addr)
                    delete ed.what
                    line = stringify(ed)
                    break
            }

            ref.delete()
        }

        if (line) {
            console.log(line)
            ts.write(line + "\n")
        }

        return true
    }

    return false
}

exports.systemCreated = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onCreate(async (doc, context) => {
        let p = []
        let e = doc.data()

        if (typeof e.created === "undefined") {
            e.created = e.modded
            doc.ref.set(e, {
                modded: true
            })
        }

        if (e.blackhole || e.deadzone) {
            let t = incTotals(e, 1)
            p.push(applyAllTotals(t))

            if (e.blackhole) {
                e = await checkOldEntry(e, doc.ref)

                console.log("create " + e._name + " " + e.galaxy + " " + e.platform + " " + e.addr)
                p.push(saveChange(e, "create"))
            }
        }

        p.push(admin.firestore().doc("stars5/" + e.galaxy).set({
            name: e.galaxy,
            _name: e._name,
            number: galaxyList[getIndex(galaxyList, "name", e.galaxy)].number,
            update: e.modded
        }))

        return Promise.all(p)
    })

exports.systemUpdate = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onUpdate(async (change, context) => {
        var deepEqual = require('deep-equal')

        let p = []
        let e = change.after.data()

        if (e.blackhole) {
            delete e.modded
            let b = change.before.data()
            delete b.modded

            if (!deepEqual(e, b)) {
                let e = change.after.data()
                if (e.blackhole || e.deadzone) {
                    e = await checkOldEntry(e, change.after.ref)

                    console.log("update " + e._name + " " + e.galaxy + " " + e.platform + " " + e.addr)
                    p.push(saveChange(e, "update"))
                }

                p.push(admin.firestore().doc("stars5/" + e.galaxy).set({
                    update: e.modded
                }, {
                    merge: true
                }))
            }
        }

        return Promise.all(p)
    })

exports.systemDelete = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onDelete((doc, context) => {
        let p = []
        const e = doc.data()

        if (e.blackhole || e.deadzone) {
            let t = incTotals(e, -1)
            p.push(applyAllTotals(t))

            if (e.blackhole) {
                console.log("delete " + e._name + " " + e.galaxy + " " + e.platform + " " + e.addr)
                p.push(saveChange(e, "delete"))
            }

            p.push(admin.firestore().doc("stars5/" + e.galaxy).set({
                update: e.modded
            }, {
                merge: true
            }))
        }

        return Promise.all(p)
    })

function saveChange(e, edit) {
    e.what = edit
    e.time = admin.firestore.Timestamp.fromDate(new Date());
    return admin.firestore().doc("edits/" + e.time.toDate().getTime()).set(e)
}

exports.scheduleBackupBHS = functions.pubsub.schedule('0 2 * * *').onRun(context => {
    return doBackup()
})

exports.backupBHS = functions.https.onCall(async (data, context) => {
    return doBackup()
})

async function backupCols(ref, now) {
    const bucket = admin.storage().bucket("staging.nms-bhs.appspot.com")

    await ref.get().then(snapshot => {
        if (!snapshot.empty) {
            const path = /\//g [Symbol.replace](snapshot.query.path, "-")
            const fname = "backup/" + now + "/" + path + ".json"

            let f = bucket.file(fname)
            let fs = f.createWriteStream({
                gzip: true,
            })

            for (let doc of snapshot.docs)
                fs.write(JSON.stringify(doc.data()) + "\n")

            fs.end()

            console.log(fname)
        }
    })

    let p = []
    await ref.listDocuments().then(async refs => {
        for (let ref of refs) {
            await ref.listCollections().then(refs => {
                for (let ref of refs)
                    p.push(backupCols(ref, now))
            })
        }
    })

    return p
}

function doBackup() {
    const now = new Date().toDateLocalTimeString()

    return admin.firestore().listCollections().then(refs => {
        let p = []
        for (let ref of refs)
            p.push(backupCols(ref, now))

        return Promise.all(p)
    })
}

exports.recalcTotals = functions.https.onCall(async (data, context) => {
    let p = []

    let ref = admin.firestore().collection("stars5")
    let docrefs = await ref.listDocuments()

    for (let gref of docrefs) {
        let colrefs = await gref.listCollections()

        for (let pref of colrefs) {
            let ref = pref.where("blackhole", "==", true)
            p.push(ref.get().then(snapshot => {
                if (snapshot.size > 0) {
                    console.log("bh", snapshot.docs[0].ref.path, snapshot.size)
                    let totals = {}
                    for (let e of snapshot.docs)
                        totals = incTotals(e.data(), 1, totals)
                    return totals
                }
            }))

            ref = pref.where("deadzone", "==", true)
            p.push(ref.get().then(snapshot => {
                if (snapshot.size > 0) {
                    let totals = {}
                    for (let e of snapshot.docs)
                        totals = incTotals(e.data(), 1, totals)
                    return totals
                }
            }))
        }
    }

    return Promise.all(p).then((totals) => {
        let sum = {}
        for (let t of totals)
            sum = addObjects(sum, t)

        return applyAllTotals(sum, true)
    }).catch(err => {
        return {
            err: err.text
        }
    })
})

function incTotals(e, add, total, contest) {
    let t = {}
    t[e.platform] = add
    t.galaxies = {}
    t.galaxies[e.galaxy] = {}
    t.galaxies[e.galaxy][e.platform] = add

    if (typeof total === "undefined")
        total = {}
    if (typeof total.Players === "undefined")
        total.Players = {}
    if (typeof total.Organizations === "undefined")
        total.Organizations = {}
    // if (typeof total.contest === "undefined")
    //     total.contest = {}

    total = addObjects(total, t)
    total.Players[e._name] = addObjects(total.Players[e._name], t)

    if (typeof e.org !== "undefined" && e.org !== "")
        total.Organizations[e.org] = addObjects(total.Organizations[e.org], t)

    // if (typeof contest === "undefined" && typeof e.contest !== "undefined" && e.contest !== "")
    //     total.contest[e.contest] = incTotals(e, add, totals.contest[e.contest], true)

    return total
}

function applyAllTotals(totals, reset) {
    let p = []

    // ref = admin.firestore().doc("bhs/contest"+ **Object.keys[totals.contest])
    // p.push(updateTotal(totals.contest[**], ref, reset))
    // delete totals.contest

    let ref = admin.firestore().doc("bhs/Organizations")
    p.push(updateTotal(totals.Organizations, ref, reset))
    delete totals.Organizations

    ref = admin.firestore().doc("bhs/Players")
    p.push(updateTotal(totals.Players, ref, reset))
    delete totals.Players

    ref = admin.firestore().doc("bhs/Totals")
    p.push(updateTotal(totals, ref, reset))

    return Promise.all(p).then(() => {
            return {
                totals: totals
            }
        })
        .catch(err => {
            return {
                err: err.text
            }
        })
}

function updateTotal(add, ref, reset) {
    return admin.firestore().runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            let t = {}

            if (reset || !doc.exists)
                t = add
            else
                t = addObjects(doc.data(), add)

            return transaction.set(ref, t)
        })
    })
}

exports.getTotals = functions.https.onCall((data, context) => {
    const totScrollPnl = `  <div id="scroll-idname" class="card card-body nopadding">`
    const totHdr = `              <div id="hdr-idname" class="row border-bottom txt-def">`
    const totItm = `              <div id="itm-idname" class="scrollbar container-fluid nopadding" style="overflow-y: scroll; height:124px">`
    const totItms = `                  <div id="idname" class="format" onclick="bhs.sortTotals(this)">title</div>`

    const userHdr = `               <div id="u-idname" class="row">`
    const userItms = `                  <div id="idname" class="format" onclick="bhs.clickUser(this)">title</div>`

    const divEnd = `</div>`

    const totalsColumns = [{
        id: "id-Name",
        format: "col-sm-4 col-14",
    }, {
        title: "Total",
        id: "id-Total",
        format: "col-sm-3 col-7 text-right",
    }, {
        title: "PC-XBox",
        id: "id-PC-XBox",
        format: "col-sm-3 col-3 text-right",
    }, {
        title: "PS4",
        id: "id-PS4",
        format: "col-sm-3 col-3 text-right",
    }]

    let html = /idname/ [Symbol.replace](totScrollPnl, data.view)
    html += /idname/ [Symbol.replace](totHdr, data.view)

    for (let i of Object.keys(totalsColumns)) {
        let h = totalsColumns[i]

        let l = /idname/ [Symbol.replace](totItms, h.id)
        l = /title/ [Symbol.replace](l, h.id === "id-Name" ? data.view : h.title)
        html += /format/ [Symbol.replace](l, h.format)
    }
    html += divEnd

    html += /idname/ [Symbol.replace](totItm, data.view)

    let db = data.view === "Galaxies" ? "Totals" : data.view

    return admin.firestore().doc("bhs/" + db).get().then(doc => {
        if (doc.exists) {
            let all = doc.data()

            if (data.view === "Galaxies")
                all = all.galaxies

            for (let i of Object.keys(all)) {
                let e = all[i]
                let rid = nameToId(i)
                let h = /idname/ [Symbol.replace](userHdr, rid)

                for (let x of totalsColumns) {
                    let l = /idname/ [Symbol.replace](userItms, x.id)
                    l = /format/ [Symbol.replace](l, x.format)
                    switch (x.id) {
                        case "id-Name":
                            if (data.view === "Galaxies")
                                i = galaxyList[getIndex(galaxyList, "name", i)].number + " " + i
                            h += /title/ [Symbol.replace](l, i)
                            break
                        case "id-Total":
                            var t = typeof e["PC-XBox"] === "undefined" ? 0 : e["PC-XBox"]
                            t += typeof e["PS4"] === "undefined" ? 0 : e["PS4"]
                            h += /title/ [Symbol.replace](l, t)
                            break
                        case "id-PS4":
                            h += /title/ [Symbol.replace](l, typeof e["PS4"] === "undefined" ? 0 : e["PS4"])
                            break
                        case "id-PC-XBox":
                            h += /title/ [Symbol.replace](l, typeof e["PC-XBox"] === "undefined" ? 0 : e["PC-XBox"])
                            break
                    }
                }

                h += divEnd
                html += h
            }
        }

        html += divEnd + divEnd + "<br>"

        return {
            html: html
        }
    })
})
/*
exports.saveEntry = functions.https.onCall(async (data, context) => {
    for (let e of data.entries) {
        let ref = admin.firestore.doc("stars5/" + e.galaxy + "/" + e.platform + "/" + e.addr)
        let doc = await ref.get()

        if (doc.exists) {
            let d = doc.data()

            if (e.uid === d.uid)
                ok = true
            else if (e.sys !== d.sys || e.reg !== d.reg || (typeof e.blackhole === "undefined" || e.blackhole && e.connection !== d.connection))
                ok = false
            else if (typeof d.life === "undefined" && typeof e.life !== "undefined" || typeof d.econ === "undefined" && typeof e.econ !== "undefined")
                ok = true

            e.uid = d.uid
            e._name = d._name

            if (!ok) {
                //check admin
            }
        } else
            ok = true
    }
})
*/
function mergeObjects(o, n) {
    if (typeof n !== "object") {
        o = n
    } else if (n) {
        if (typeof o === "undefined")
            o = {}
        let l = Object.keys(n)
        for (let i = 0; i < l.length; ++i) {
            let x = l[i]
            o[x] = mergeObjects(o[x], n[x])
        }
    }

    return o
}

function addObjects(o, n) {
    if (typeof n !== "object") {
        if (typeof n === "number") {
            if (typeof o === "undefined")
                o = 0
            o += n
        } else if (typeof n !== "undefined")
            o = n
    } else if (n) {
        if (typeof o === "undefined")
            o = {}
        let l = Object.keys(n)
        for (let i = 0; i < l.length; ++i) {
            let x = l[i]
            o[x] = addObjects(o[x], n[x])
        }
    }

    return o
}

function nameToId(str) {
    let id = /[^a-z0-9_-]/ig [Symbol.replace](str, "-")
    return id
}

function getIndex(list, field, id) {
    if (!id)
        return -1

    return list.map(x => {
        return typeof x[field] === "string" ? x[field].toLowerCase() : x[field]
    }).indexOf(id.toLowerCase())
}

Date.prototype.toDateLocalTimeString = function () {
    let date = this
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate()) +
        " " + ten(date.getHours()) +
        ":" + ten(date.getMinutes()) +
        ":" + ten(date.getSeconds())
}

function ten(i) {
    return i < 10 ? '0' + i : i
}

function reformatAddress(addr) {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":")
    str = str[0] === ":" ? str.slice(1) : str
    let out = ""

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":")
        let end = idx > 4 || idx === -1 ? 4 : idx
        let s = str.slice(0, end)
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0))
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "")
    }

    return out
}

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
    number: -0
}]