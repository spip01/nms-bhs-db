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
            for (let doc of snapshot.docs) {
                let e = doc.data()

                    delete e.type
                    delete e.basename
                    delete e.owned

                // if (typeof e.xyzs === "undefined") {
                //     e.xyzs = addressToXYZ(e.addr)
                //     console.log(e.galaxy, e.platform, e.addr)
                //     doc.ref.set(e)
                // }
            }
        }
    }
}

function addressToXYZ(addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    }

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

main()