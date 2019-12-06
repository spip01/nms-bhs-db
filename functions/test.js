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
                        let cdate = new admin.firestore.Timestamp(e.created.seconds, e.created.nanoseconds)
                        console.log(cdate.seconds < e.modded.seconds, cdate, e.modded)
                        e.created = cdate.seconds < e.modded.seconds ? e.modded : cdate
                        doc.ref.set(e)
                    }
                }
            })
        }
    })
}

main()
