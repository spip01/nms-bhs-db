'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let ships = {}

    let ref = admin.firestore().collection("nmsce")
    let refs = await ref.listDocuments()

    for (let ref of refs) { // galaxy
        let sref = ref.collection("Ship")

        let snapshot = await sref.get()
        for (let doc of snapshot.docs) {
            let name = doc.data().Name
            if (typeof name !== undefined && name !== "") {
                if (typeof ships[name] === "undefined")
                    ships[name] = 1
                else
                    ships[name]++
            }
        }
    }

    for (let key of Object.keys(ships))
        if (ships[key] >= 6)
            console.log(key, ships[key])
}

main()