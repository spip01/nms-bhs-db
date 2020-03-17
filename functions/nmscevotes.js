'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let ref = admin.firestore().collectionGroup("votes")
    ref.get().then(async snapshot => {
        for (let doc of snapshot.docs) {
            let v = doc.data()
            let path = doc.ref.path.replace(/((?:.*?\/){3}.*?)\/.*/, "$1")
            let ref = admin.firestore().doc(path)
            let d = await ref.get()
            let e = d.data()

            v.id = e.id
            v.galaxy = e.galaxy
            v.Photo = e.Photo
            v._name = e._name
            v.created = e.created
            v.type = e.type
            if (e.Type)
                v.Type = e.Type

            doc.ref.set(v)
        }
    })
}

main()