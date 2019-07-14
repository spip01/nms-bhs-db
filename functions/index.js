const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({origin: true})
admin.initializeApp()

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
    admin.firestore().doc("users/" + context.params.uid).get().then(doc => {
        if (doc.exists) {
            let h = `<div class="row"><div class="col-4">Total</div><div class="col-3">` + doc.data().stars5.total + `</div></div>`
            return h
        } else {
            console.log(context.params.uid + " not found")
            return null
        }
    }).catch(err => {
        return null
    })
})

exports.createSystem = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onCreate((doc, context) => {
        const e = doc.data()
        if (e.blackhole || e.deadzone) {
            console.log(e._name + " " + context.params.galaxy + " " + context.params.platform + " " + context.params.addr)

            let t = {}
            t.stars5 = {}
            t.stars5[e.platform] = 1
            t.stars5[e.galaxy] = {}
            t.stars5[e.galaxy][e.platform] = 1

            let ref = admin.firestore().doc("stars5/totals2")
            return updateTotal(t, ref)
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
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i]
            o[x] = mergeObjects(o[x], n[x])
        }
    }

    return o;
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
        let l = Object.keys(n);
        for (let i = 0; i < l.length; ++i) {
            let x = l[i]
            o[x] = addObjects(o[x], n[x])
        }
    }

    return o
}