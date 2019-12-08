'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let ref = admin.firestore().collection("nmsce")
    ref.listDocuments().then(refs => {
        for (let ref of refs) {
            ref.listCollections().then(async refs => {
                for (let ref of refs) {
                    let snapshot = await ref.get()
                    for (let doc of snapshot.docs) {
                        console.log(doc.ref.path)
                        let e = doc.data()

                        e.favorite = 0
                        e.edchoice = 0
                        e.bhspoi = 0
                        e.clickcount = 0

                        doc.ref.set(e)
                    }
                }
            })
        }
    })
}

main()