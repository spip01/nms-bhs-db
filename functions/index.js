const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!")
// })

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

        return false
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