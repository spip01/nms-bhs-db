const functions = require('firebase-functions')
const admin = require('firebase-admin')

var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let galrefs = await admin.firestore().collection("stars5").listDocuments()
    for (let gref of galrefs) {
        let platrefs = await gref.listCollections()
        for (let pref of platrefs) {
            let snapshot = await pref.get()
            for (let doc of snapshot.docs){
                let e = doc.data()
                
                // if (typeof e.pic !=="undefined") {
                //     // delete e.basename
                //     // delete e.owned
                //     console.log(JSON.stringify(e))
                //     // doc.ref.set(e)
                // }
            }
        }
    }
}

main()