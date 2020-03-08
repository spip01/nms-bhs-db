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
            console.log(ref.id)

            let sref = ref.collection("Ship")
            let snapshot = await sref.get()
            console.log(snapshot.size)

            for (let doc of snapshot.docs) {
                let e = doc.data()

                if (typeof e.parts === "undefined") {
                    let parts = {}

                    switch (e.Type) {
                        case "Fighter":
                        case "Hauler":
                        case "Shuttle":
                            parts = e.wings ? e.wings : {}
                            if (e.bodies)
                                for (let p of Object.keys(e.bodies))
                                    parts["h" + (parseInt(p.slice(1)) + 100)] = true

                            if (e.Type === "Fighter" && parts.h17 && !e.Asymmetric)
                                parts.h117 = true
                            break
                        case "Exotic":
                            parts = e.bodies
                            break
                        case "Explorer":
                            parts = e.bodies

                            if (!e.Asymmetric) {
                                const pairs = [16, 20, 13, 5, 14, 15, 18, 17, 21, 24, 19, 30, 22, 25, 28, 23, 29, 31, 27, 26]
                                let list = Object.keys(e.parts)

                                for (let i of list) {
                                    let left = parseInt(i.slice(1))
                                    if (pairs.includes(left))
                                        parts["h" + (100 + left)] = true
                                }
                            }

                            break
                    }

                    console.log(e.id, JSON.stringify(parts))
                    // doc.ref.set({
                    //     parts: parts
                    // }, {
                    //     merge: true
                    // })
                }
            }

            let fref = ref.collection("Freighter")
            snapshot = await fref.get()

            for (let doc of snapshot.docs) {
                let e = doc.data()
                if (typeof e.parts === "undefined") {
                    let parts = e.common ? e.common : {}
                    if (e.capital)
                        for (let p of Object.keys(e.capital))
                            parts["h" + (parseInt(p.slice(1)) + 100)] = true

                    console.log(e.id, JSON.stringify(parts))
                    // doc.ref.set({
                    //     parts: parts
                    // }, {
                    //     merge: true
                    // })
                }
            }
        }

    })
}

main()