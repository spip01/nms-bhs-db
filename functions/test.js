'use strict'
Error.stackTraceLimit = 50

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
            //     for (let ref of refs) { // type
            ref = ref.collection("Ship")
            let snapshot = await ref.get()
            console.log(ref.path, snapshot.size)
            for (let doc of snapshot.docs) {
                let e = doc.data()
                if (e.Crashed === "undefined")
                    console.log(e.Name)
            }
        }
        // })
        // }
    })
}

main()