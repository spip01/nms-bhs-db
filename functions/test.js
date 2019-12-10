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
                        // console.log(doc.ref.path)
                        let e = doc.data()

                        if (typeof e.Name === "undefined")
                            console.log("no name", doc.ref.path)
                        else if (e.id.includes("-") && e.Name !== "" && e.id !== e.Name.nameToId() && e.id !== e.Name.nameToId().toLowerCase())
                            console.log(JSON.stringify(e.id), JSON.stringify(e.Name))
                    }
                }
            })
        }
    })
}

main()

String.prototype.nameToId = function () {
    return /[^a-z0-9_-]/ig [Symbol.replace](this, "-")
}