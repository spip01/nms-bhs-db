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
            // ref.listCollections().then(async refs => {
            // for (let ref of refs) { // type

            let sref = ref.collection("Ship") // Freighter
            let snapshot = await sref.get()

            for (let doc of snapshot.docs) {
                let e = doc.data()
                if (typeof e.parts === "undefined") {
                    let parts = {}
                    console.log(e.id, e.bodies ? JSON.stringify(e.bodies) : "", e.wings ? JSON.stringify(e.wings) : "")

                    switch (e.Type) {
                        case "Fighter":
                        case "Hauler":
                        case "Shuttle":
                            parts = e.wings ? e.wings : {}
                            if (e.bodies)
                                for (let p of Object.keys(e.bodies))
                                    parts["h" + (parseInt(p.slice(1)) + 100)] = true
                            break
                        case "Explorer":
                        case "Exotic":
                            parts = e.bodies
                    }

                    console.log(e.id, JSON.stringify(parts))
                    doc.ref.set({
                        parts: parts
                    }, {
                        merge: true
                    })
                } else if (Object.keys(e.parts).length ===0) {
                    let url = "https://test-nms-bhs.firebaseapp.com/cedata.html?i="+e.id+"&g=Euclid&t=Ship"
                        console.log(e._name, url)
                }
            }

            let fref = ref.collection("Freighter")
            snapshot = await fref.get()

            for (let doc of snapshot.docs) {
                let e = doc.data()
                if (typeof e.parts === "undefined") {
                    console.log(e.id, e.common ? JSON.stringify(e.common) : "", e.capital ? JSON.stringify(e.capital) : "")

                    let parts = e.common ? e.common : {}
                    if (e.capital)
                        for (let p of Object.keys(e.capital))
                            parts["h" + (parseInt(p.slice(1)) + 100)] = true

                    console.log(e.id, JSON.stringify(parts))
                    doc.ref.set({
                        parts: parts
                    }, {
                        merge: true
                    })
                }
            }

            //     }
            // })
        }
    })
}

main()