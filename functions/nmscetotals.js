'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let ref = admin.firestore().collection("nmsce")

    ref.listDocuments().then(async refs => {
        for (let ref of refs) { // galaxy
            ref.listCollections().then(async refs => {
                for (let ref of refs) { // type
                    let snapshot = await ref.get()
                    console.log(snapshot.size)
                    let users = {}

                    for (let doc of snapshot.docs) {
                        let e = doc.data()

                        if (typeof users[e.uid] === "undefined")
                            users[e.uid] = 0

                        users[e.uid]++
                    }

                    for (let u of Object.keys(users)) {
                        let total = {}
                        total[ref.id] = users[u]
                        console.log("users/"+ u, JSON.stringify(total))
                        let uref = admin.firestore().doc("users/"+u)
                        uref.set({
                            nmsceTotals: total
                        }, {
                            merge: true
                        })
                    }
                }
            })
        }
    })
}

main()