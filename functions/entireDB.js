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
            pref = pref.where("uid","==", "nHe98vinnRWf548WOIUubzJcLEu1")
            let snapshot = await pref.get()
            for (let doc of snapshot.docs) {
                let e = doc.data()
                console.log(e.galaxy, e.platform, e.addr)
                doc.ref.set({uid:"2kBbMxRcWDQuMci1ftd9LhTPdI93"}, {merge:true})
            }
        }
    }
}

main()