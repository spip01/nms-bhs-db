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
            // ref.listCollections().then(async refs => {
            // for (let ref of refs) { // type

            ref = ref.collection("Ship")
            ref = ref.where("Type", "==", "Explorer")
            ref = ref.where("Asymmetric", "==", false)
            let snapshot = await ref.get()
            console.log(snapshot.size)

            for (let doc of snapshot.docs) {
                let e = doc.data()
                let parts = {}

                if (e.parts) {
                    parts = e.parts
                    const pairs = [16, 20, 13, 5, 14, 15, 18, 17, 21, 24, 19, 30, 22, 25, 28, 23, 29, 31, 27, 26]
                    let list = Object.keys(e.parts)

                    for (let i of list) {
                        let left = parseInt(i.slice(1))
                        if (pairs.includes(left))
                            parts["h" + (100 + left)] = true
                    }
                }

                console.log(e.id, JSON.stringify(parts))
                doc.ref.set({
                    parts: parts
                }, {
                    merge: true
                })
            }
        }
    })
}

main()