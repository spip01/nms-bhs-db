const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const bucket = admin.storage().bucket('gs://nms-bhs.appspot.com')
require('events').EventEmitter.defaultMaxListeners = 0

async function main() {
    let groupref = admin.firestore().collectionGroup("nmsceCommon")
    let p = []

    p.push(groupref.where("type", "==", "Planet").get().then(async snapshot => {
        console.log(snapshot.docs.length, "Planet")
        for (let d of snapshot.docs) {
            let e = d.data()
            e["Planet-Name"] = e.Name
            console.log(e["Planet-Name"])
            //await d.ref.set(e)
        }
    }))

    await Promise.all(p)
}


main()