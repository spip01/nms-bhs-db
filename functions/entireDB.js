const functions = require('firebase-functions')
const admin = require('firebase-admin')

var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let p = []
    let galrefs = await admin.firestore().collection("nmsce").listDocuments()
    //console.log("galaxies", galrefs.length)

    for (let gref of galrefs) {
        let typerefs = await gref.listCollections()
        //console.log(gref.path, typerefs.length)

        for (let tref of typerefs) {
            //console.log(tref.path)

            p.push(tref.listDocuments().then(async docrefs => {
                console.log(tref.path, docrefs.length)
                let first = true

                for (let dref of docrefs) {
                    let doc = await dref.get()
                    if (doc.exists) {
                        let e = doc.data()
                        let keys = Object.keys(e)
                        let changed = false

                        for (let k of keys) {
                            if (typeof e[k] === "object" && typeof e[k].length !== "undefined" && e[k].length > 1 && typeof e[k][0] === "string") {
                                let old = []
                                for (let i = 0; i < e[k].length; ++i)
                                    old[i] = e[k][i]

                                e[k].sort((a, b) => a > b ? 1 : -1)

                                for (let i = 0; i < e[k].length && !changed; ++i) {
                                    if (old[i] !== e[k][i]) {
                                        changed = true
                                        break
                                    }
                                }
                            }
                        }

                        if (changed) {
                            if (first) {
                                console.log(doc.ref.path)
                                first = false
                            }
                            await doc.ref.set(e)
                        }
                    }
                }
            }))
        }
    }

    await Promise.all(p)
}

main()