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

                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        updateCommon(e, doc.ref)
                    }
                }
            })
        }
    })
}

function updateCommon(entry, ref) {
    let e = {}
    e.votes = {}

    ref.set(e, {
        merge: true
    }).then().catch(err => {
        bhs.status("ERROR: " + err.message)
    })

    ref = ref.collection("nmsceCommon").doc(entry.id)
    ref.set(e, {
        merge: true
    }).then().catch(err => {
        bhs.status("ERROR: " + err.message)
    })

}


main()