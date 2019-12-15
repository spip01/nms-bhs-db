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
        for (let ref of refs) {
            ref.listCollections().then(async refs => {
                for (let ref of refs) {
                    // ref = ref.collection("Ship")
                    let snapshot = await ref.get()
                    console.log(ref.path, snapshot.size)
                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        let colors = []

                        if (e["Primary-Color"])
                            colors.push(e["Primary-Color"])

                        if (e["Secondary-Color"])
                            colors.push(e["Secondary-Color"])

                        if (e["Tertiary-Color"])
                            colors.push(e["Tertiary-Color"])

                        if (colors.length > 0) {
                            console.log(doc.ref.path, JSON.stringify(colors))

                            doc.ref.set({
                                Color: colors
                            }, {
                                merge: true
                            })
                        }
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