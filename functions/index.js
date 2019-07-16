const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({
    origin: true
})
admin.initializeApp()

// https://us-central1-nms-bhs.cloudfunctions.net/getTotalsHTML?uid=SV14SdNbzRbfW8NRbNQpTRJ7y612
exports.getTotalsHTML = functions.https.onRequest((request, response) => {
    admin.firestore().doc("users/" + request.query.uid).get().then(doc => {
        if (doc.exists) {
            let h = `<div class="row"><div class="col-4">Total</div><div class="col-3">` + doc.data().stars5.total + `</div></div>`
            response.send(h)
            return 1
        } else {
            response.status(500).send(request.query.uid + " not found")
            return 0
        }
    }).catch(err => {
        response.status(500).send(err)
        return 0
    })
})

exports.getTotals = functions.https.onCall((data, context) => {
    return buildTotalsView(data.view)

    // return admin.firestore().doc("users/" + data.uid).get().then(doc => {
    //     if (doc.exists) {
    //         return {html:h}
    //     } else {
    //         console.log(data.uid + " not found")
    //         return {err:"not found"}
    //     }
    // }).catch(err => {
    //     console.log(err)
    //     return {err:err}
    // })
})

exports.getDARC = functions.https.onCall((data, context) => {
    let l = "bh,region,system,exit\n"

    let ref = admin.firestore().collection("stars5/Euclid/PC-XBox")
    ref = ref.where("blackhole", "==", true)

    return ref.get().then(snapshot => {
        console.log("get "+snapshot.size)

        for (let i = 0; i < snapshot.size; ++i) {
            let e = snapshot.docs[i].data()
            l += e.addr + "," + e.reg + "," + e.sys + "," + e.connection + "\n"
        }

        const bucket = admin.storage().bucket("nms-bhs.appspot.com")
        return bucket.file('darc/euclid-pc.csv').createWriteStream().end(l)
    }).then(() => {
        console.log("done")
        return {
            ok: true
        }
    }).catch(err => {
        console.log(err)
        return {
            err: err
        }
    })
})

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
            console.log(e._name + " " + e.org + " " + e.galaxy + " " + e.platform + " " + e.addr)

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

            return 1
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