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
                    // ref = ref.collection("Ship")
                    let snapshot = await ref.get()
                    //console.log(ref.path, snapshot.size)

                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        if (e.Economy) {
                            if (e.Economy === "TT1")
                                e.Economy = "T1"
                                else if (e.Economy === "TT2")
                                e.Economy = "T2"
                                else if (e.Economy === "TT3")
                                e.Economy = "T3"

                            doc.ref.set(e).then(() => {
                                console.log(e.Name, e.Economy)
                            }).catch(err => console.log(err))
                        } else if (e.econ) {
                            let i = getIndex(economyList, "name", e.econ)
                            if (i > 0) {
                                let econ = economyList[i]
                                if (econ.number > 0) {
                                    e.Economy = "T" + e.Economy

                                    doc.ref.set(e).then(() => {
                                        console.log(e.Name, e.Economy)
                                    }).catch(err => console.log(err))
                                }
                            }
                        }
                    }
                }
            })
        }
    })
}

main()

function getIndex(list, field, id) {
    if (!id)
        return -1

    return list.map(x => {
        if (field === "name" && typeof x.match !== "undefined" && id.match(x.match))
            return x.name.toLowerCase()
        else
            return typeof x[field] === "string" ? x[field].toLowerCase() : x[field]
    }).indexOf(typeof id === "string" ? id.toLowerCase() : id)
}

const economyList = [{
    name: "None",
    number: 0
}, {
    name: "Declining",
    number: 1
}, {
    name: "Destitute",
    number: 1
}, {
    name: "Failing",
    number: 1
}, {
    name: "Fledgling",
    number: 1
}, {
    name: "Low supply",
    number: 1
}, {
    name: "Struggling",
    number: 1
}, {
    name: "Unpromising",
    number: 1
}, {
    name: "Unsuccessful",
    number: 1
}, {
    name: "Adequate",
    number: 2
}, {
    name: "Balanced",
    number: 2
}, {
    name: "Comfortable",
    number: 2

}, {
    name: "Developing",
    number: 2
}, {
    name: "Medium Supply",
    number: 2
}, {
    name: "Promising",
    number: 2
}, {
    name: "Satisfactory",
    number: 2
}, {
    name: "Sustainable",
    number: 2
}, {
    name: "Advanced",
    number: 3
}, {
    name: "Affluent",
    number: 3
}, {
    name: "Booming",
    number: 3
}, {
    name: "Flourishing",
    number: 3
}, {
    name: "High Supply",
    number: 3
}, {
    name: "Opulent",
    number: 3
}, {
    name: "Prosperous",
    number: 3
}, {
    name: "Wealthy",
    number: 3
}]