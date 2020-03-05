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

                        let ref = doc.ref
                        ref = ref.collection("nmsceCommon").doc("data")
                        ref.set({
                            created: e.created,
                            votes: e.votes,
                            _name: e._name,
                            uid: e.uid,
                            id: e.id,
                            type: e.type,
                            Type: e.Type ? e.Type : "",
                            galaxy: e.galaxy,
                            Photo: e.Photo,
                        })
                    }
                }
            })
        }
    })
}

main()