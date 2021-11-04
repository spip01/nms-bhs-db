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

                if (typeof totals[e.uid] === "undefined") {
                    totals[e.uid] = {}
                    totals[e.uid].name = e._name
                }

                if (typeof totals[e.uid][ref.id] === "undefined")
                    totals[e.uid][ref.id] = 0

                totals[e.uid][ref.id]++
            }
        }
    }

    for (let u of Object.keys(users)) {
        let ref = admin.firestore().doc("admin/" + u)
        let ed = await ref.get()
        totals[u].mod = ed.exists && ed.data().roles.includes("nmsceEditor")
    }

    let tref = admin.firestore().doc("bhs/nmsceTotals")
    tref.set(totals)

    for (let u of Object.keys(users)) {
        let uref = admin.firestore().doc("users/" + u)

        uref.get().then(doc => {
            let e = doc.data()
            e.nmsceTotals = users[u]
            doc.ref.set(e)
        })
    }
}

main()