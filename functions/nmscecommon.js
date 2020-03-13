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
    e.created = entry.created
    e.votes = entry.votes
    e._name = entry._name
    e.uid = entry.uid
    e.id = entry.id
    e.type = entry.type
    e.galaxy = entry.galaxy
    e.addr = entry.addr
    e.Photo = entry.Photo
    e.Name = entry.Name?entry.Name:""
    if (entry.Type)
        e.Type = entry.Type
    if (entry["Planet-Index"])
        e["Planet-Index"] = entry["Planet-Index"]
    if (entry["Planet-Name"])
        e["Planet-Name"] = entry["Planet-Name"]

    let dref = ref.collection("nmsceCommon").doc("data")
    dref.delete()

    ref = ref.collection("nmsceCommon").doc(entry.id)
    ref.set(e
        /*, {
                merge: true
            }*/
    ).then().catch(err => {
        bhs.status("ERROR: " + err.message)
    })

}


main()