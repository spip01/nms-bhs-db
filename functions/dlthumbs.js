'use strict'

const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const bucket = admin.storage().bucket('gs://nms-bhs.appspot.com')
require('events').EventEmitter.defaultMaxListeners = 0
const thumbPath = "nmsce/disp/thumb/"

function main() {
    let ref = admin.firestore().collectionGroup("nmsceCommon")
    ref = ref.where("type", "==", "Ship")
    ref.get().then(async snapshot => {
        for (let doc of snapshot.docs) {
            let e = doc.data()
            const dest = ".\\thumb\\"+e.Photo
            console.log(dest)

            await bucket.file(thumbPath+e.Photo).download({
                destination: dest
            }).catch(err=>console.log(JSON.stringify(err)))
        }
    })
}

main()