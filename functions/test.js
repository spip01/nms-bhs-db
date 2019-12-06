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
            console.log(ref.path)
            ref.listCollections().then(async refs =>{
                for (let ref of refs) {
                    console.log(ref.path)
                    let snapshot = await ref.get()
                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        e.Photo = e.Photo.replace(/.*\/(.*)/, "$1")
                        e.clickcount = 0
                        console.log("set",doc.ref.path)
                        doc.ref.set(e)
                    }
                }
            })
        }
    })
}

main()
