const functions = require('firebase-functions')
const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json");
const cors = require('cors')({
    origin: true
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

// https://us-central1-nms-bhs.cloudfunctions.net/getTotalsHTML?uid=SV14SdNbzRbfW8NRbNQpTRJ7y612
exports.getTotalsHTML = functions.https.onRequest((request, response) => {
    admin.firestore().doc("users/" + request.query.uid).get().then(doc => {
        if (doc.exists) {
            let h = `<div class="row"><div class="col-4">Total</div><div class="col-3">` + doc.data().stars5.total + `</div></div>`
            response.send(h)
        } else {
            response.status(500).send(request.query.uid + " not found")
        }
    }).catch(err => {
        response.status(500).send(err)
    })
})

// https://us-central1-nms-bhs.cloudfunctions.net/getDARC?g=Calypso&p=PC-XBox
exports.getDARC = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const bucket = admin.storage().bucket("nms-bhs.appspot.com")

        let fname = 'darc/' + request.query.g + "-" + request.query.p + ".txt"
        console.log(fname)
        let f = bucket.file(fname)
        let s = f.createReadStream()
        s.pipe(response)
    })
})

// https://us-central1-nms-bhs.cloudfunctions.net/getGPList
exports.getGPList = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let ref = admin.firestore().collection("stars5")
        ref.listDocuments().then(async docrefs => {
            let e = ""

            for (let gref of docrefs) {
                if (gref.id === "totals" || gref.id === "players")
                    continue;

                e += '["' + gref.id + '"'

                await gref.listCollections().then(async colrefs => {
                    for (let pref of colrefs)
                        e += ',"' + pref.id + '"'
                })
                e += ']\n'
            }

            response.send(e)
        })
    })
})

// https://us-central1-nms-bhs.cloudfunctions.net/getPOI
exports.getPOI = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let ref = admin.firestore().collection("poi")
        ref.get().then(async snapshot => {
            let e = ""

            for (let doc of snapshot.docs) {
                let d = doc.data()
                e += '["' + d._name + '","' + d.galaxy + '","' + d.platform + '","' + d.addr + '","' + d.planet + '","' + d.mode + '","' + d.img + '"]\n'
            }

            response.send(e)
        })
    })
})

exports.getTotals = functions.https.onCall((data, context) => {
    return buildTotalsView(data.view)
})


//[0,"PC","0000:0000:0000:0079","Thoslo Quadrant","SAS.A83","0FFE:007E:0082:003D","Vasika Boundary","Uscarlen"]
exports.genDARC = functions.https.onCall(async (data, context) => {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")

    try {
        let ref = admin.firestore().collection("stars5")
        await ref.listDocuments().then(async docrefs => {
            for (let gref of docrefs) {
                if (gref.id === "totals" || gref.id === "players")
                    continue;

                await gref.listCollections().then(async colrefs => {
                    for (let pref of colrefs) {
                        let modded
                        let fname = 'darc/' + gref.id + "-" + pref.id + ".txt"

                        ref = pref.where("blackhole", "==", true)
                        ref = ref.orderBy("modded", "desc")
                        ref = ref.limit(1)
                        await ref.get().then(async snapshot => {
                            modded = snapshot.docs[0].data().modded.toDate().getTime()
                        })

                        let f = bucket.file(fname)
                        let needupdate = await f.exists()
                            .then(exists => {
                                return !exists
                            })
                            .catch(err => {
                                return err ? true : false
                            })

                        needupdate = needupdate || await f.getMetadata()
                            .then(data => {
                                const metadata = data[0];
                                return new Date(metadata.updated).getTime() < modded
                            })
                            .catch(err => {
                                return err ? true : false
                            })

                        if (needupdate) {
                            console.log(fname)

                            let s = f.createWriteStream({
                                public: true,
                                gzip: true
                            })

                            s.on('finish', () => {
                                console.log(fname + " saved.");
                            });

                            let time = new Date().getTime();

                            ref = pref.where("blackhole", "==", true)
                            await ref.get().then(async snapshot => {
                                console.log(gref.id, pref.id, snapshot.size, new Date().getTime() - time)

                                for (let doc of snapshot.docs) {
                                    let e = doc.data()

                                    let ref = pref.doc(e.connection)
                                    let c = await ref.get().then(doc => {
                                        return doc.exists ? doc.data() : null
                                    })

                                    if (c)
                                        s.write('["' + gref.id + '","' + pref.id + '","' + e.addr + '","' + e.reg + '","' + e.sys + '","' + c.addr + '","' + c.reg + '","' + c.sys + '"]\n')
                                    else
                                        console.log(gref.id, pref.id, e.addr, e.connection, "not found")
                                }
                            })

                            s.end()
                            console.log("done", new Date().getTime() - time)
                        }
                    }
                })
            }
        })

        return {
            ok: true
        }
    } catch (err) {
        console.log(err)

        return {
            err: err
        }
    }
})

function addEntryToFile(e) {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    //const fs = require('fs');

    let tname = 'tmp/' + e.galaxy + "-" + e.platform + ".txt"
    let dname = 'darc/' + e.galaxy + "-" + e.platform + ".txt"

    let t = bucket.file(tname)
    let ts = t.createWriteStream({
        public: true,
        gzip: true
    })
    ts.on("finish", () => {
        t.move(dname)
    })

    let d = bucket.file(dname)
    let ds = d.createReadStream()
    ds.on("end", () => {
        ts.write('["' + e.galaxy + '","' + e.platform + '","' + e.addr + '","' + e.reg + '","' + e.sys + '","' + e.connection + '","",""]\n')
        ts.end()
    })

    ds.pipe(ts, {
        end: false
    })
}

var html = {}

function buildTotalsView(view) {
    if (typeof html[view] !== "undefined")
        return {
            html: html[view]
        }

    html[view] = ""

    const userHdr = `<div id="u-idname" class="row">`
    const userItms = `  <div id="idname" class="format" onclick="bhs.clickUser(this)">title</div>`
    const userEnd = `</div>`

    const totalsPlayers = [{
        title: "Contributors",
        id: "id-names",
        format: "col-sm-7 col-14",
        hformat: "col-sm-7 col-14",
    }, {
        title: "u",
        id: "id-uid",
        format: "col-1 hidden",
        hformat: "col-1 hidden",
    }, {
        title: "g",
        id: "id-galaxy",
        format: "col-1 hidden",
        hformat: "col-1 hidden",
    }, {
        title: "p",
        id: "id-platform",
        format: "col-1 hidden",
        hformat: "col-1 hidden",
    }, {
        title: "Contest",
        id: "id-ctst",
        format: "col-sm-3 col-8 text-right hidden",
        hformat: "col-sm-3 col-8 text-right hidden",
    }, {
        title: "Total",
        id: "id-qty",
        format: "col-sm-3 col-6 text-right",
        hformat: "col-sm-3 col-6 text-right",
    }]

    return admin.firestore().collection(view).get()
        .then(snapshot => {
            for (let i = 0; i < snapshot.size; ++i) {
                let e = snapshot.docs[i].data()

                if (typeof e.stars5 !== "undefined") {
                    let rid = typeof e._name !== "undefined" ? nameToId(e._name) : e.name ? nameToId(e.name) : "-"
                    let h = /idname/ [Symbol.replace](userHdr, rid)

                    for (let i = 0; i < totalsPlayers.length; ++i) {
                        let x = totalsPlayers[i]

                        let l = /idname/ [Symbol.replace](userItms, x.id)
                        l = /format/ [Symbol.replace](l, x.format /* + (bold ? " font-weight-bold" : "")*/ )
                        switch (x.title) {
                            case "Contributors":
                                h += /title/ [Symbol.replace](l, typeof e._name !== "undefined" ? e._name : e.name)
                                break
                            case "u":
                                h += /title/ [Symbol.replace](l, typeof e.uid !== "undefined" ? e.uid : "")
                                break
                            case "g":
                                h += /title/ [Symbol.replace](l, typeof e.galaxy !== "undefined" ? e.galaxy : "")
                                break
                            case "p":
                                h += /title/ [Symbol.replace](l, typeof e.platform !== "undefined" ? e.platform : "")
                                break
                            case "Total":
                                h += /title/ [Symbol.replace](l, e.stars5.total)
                                break
                        }
                    }

                    h += userEnd
                    html[view] += h
                }
            }

            return {
                html: html[view]
            }
        }).catch(err => {
            console.log(err)
            return {
                err: err
            }
        })
}

exports.systemCreated = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onCreate((doc, context) => {
        const e = doc.data()
        if (e.blackhole && typeof e.connection !== "undefined" || e.deadzone) {
            console.log(e._name + " " + e.galaxy + " " + e.platform + " " + e.addr)

            let t = {}
            t = {}
            t[e.platform] = 1
            t.galaxy = {}
            t.galaxy[e.galaxy] = {}
            t.galaxy[e.galaxy][e.platform] = 1

            let ref = admin.firestore().doc("bhs/totals")
            updateTotal(t, ref)

            ref = admin.firestore().doc("bhs/users")
            updateTotal({
                [e._name]: t
            }, ref)

            if (e.org !== "") {
                ref = admin.firestore().doc("bhs/orgs")
                updateTotal({
                    [e.org]: t
                }, ref)
            }

            addEntryToFile(e)
        }

        return 0
    })


function updateTotal(add, ref, reset) {
    return admin.firestore().runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            let t = {}

            if (doc.exists)
                t = doc.data()

            if (reset)
                t = mergeObjects(t, add)
            else
                t = addObjects(t, add)

            return transaction.set(ref, t)
        }).catch(err => {
            console.log(err)
            return false
        })
    })
}

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
    let id = /[^a-z0-9_-]/ig [Symbol.replace](str, "-");
    return id;
}