'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})


async function main() {
    let urefs = await admin.firestore().collection("users").listDocuments()

    for (let uref of urefs) { // user
        uref = uref.collection("stars5")
        let grefs = await uref.listDocuments()

        for (let gref of grefs) { // galaxy
            let prefs = await gref.listCollections()

            for (let pref of prefs) { // platform
                let snapshot = await pref.get()

                for (let doc of snapshot.docs) {
                    let b = doc.data()

                    if (b.blackhole && typeof b.x === "undefined") {
                        let ref = admin.firestore().doc("stars5/" + b.galaxy + "/" + b.platform + "/" + b.addr)
                        let edoc = await ref.get()
                        let e = edoc.data()

                        console.log(e._name, ref.path, doc.ref.path)
                        doc.ref.set({
                            x: e.x
                        }, {
                            merge: true
                        })
                    }
                }
            }
        }
    }
}

main()