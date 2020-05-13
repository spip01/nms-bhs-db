'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let users = {}
    let totals = {}

    let ref = admin.firestore().collection("nmsce")
    let refs = await ref.listDocuments()
    
    for (let ref of refs) { // galaxy
        let refs = await ref.listCollections()

        for (let ref of refs) { // type
            let snapshot = await ref.get()
            console.log(snapshot.size)

            if (typeof totals[ref.id] === "undefined")
                totals[ref.id] = 0

            totals[ref.id] += snapshot.size

            for (let doc of snapshot.docs) {
                let e = doc.data()

                if (typeof users[e.uid] === "undefined")
                    users[e.uid] = {}

                if (typeof users[e.uid][ref.id] === "undefined")
                    users[e.uid][ref.id] = 0

                users[e.uid][ref.id]++
            }
        }
    }

    for (let u of Object.keys(users)) {
        console.log("users/" + u, JSON.stringify(users[u]))

        let uref = admin.firestore().doc("users/" + u)
        uref.set({
            nmsceTotals: users[u]
        }, {
            merge: true
        })
    }

    let tref = admin.firestore().doc("bhs/nmsceTotals")
    console.log("totals", JSON.stringify(totals))
    // tref.set(totals, {
    //     merge: true
    // })
}

main()