'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let reglist = {}

    let ref = admin.firestore().collection("nmsce")
    ref.listDocuments().then(async refs => {
        for (let ref of refs) { //nmsce/galaxies

            let sref = admin.firestore().doc("stars5/" + ref.id)
            sref.listCollections().then(async refs => {
                for (let ref of refs) { //stars5/galaxy/platform
                    let snapshot = await ref.get()
                    console.log(ref.path, snapshot.size)

                    for (let doc of snapshot.docs) { //stars5/galaxy/platform/systems
                        let e = doc.data()
                        let raddr = e.addr.slice(0, 15)
                        let page = e.page ? e.page : "bhs"

                        if (e.reg !== "") {
                            if (typeof reglist[e.reg] === "undefined") {
                                reglist[e.reg] = {}
                                reglist[e.reg].addr = []
                                reglist[e.reg].page = {}
                            }

                            reglist[e.reg][page] = raddr

                            if (page === "nmsce")
                                reglist[e.reg].addr.push({
                                    ref: doc.ref,
                                    entry: e
                                })
                        }
                    }

                    let regs = Object.keys(reglist)
                    for (let key of regs) {
                        let reg = reglist[key]

                        if (reg.bhs && reg.nmsce && reg.bhs !== reg.nmsce)
                            console.log(reg.bhs,reg.nmsce,reg.addr.length)
                            for (let addr of reg.addr)
                                addr.ref.set({
                                    reg: ""
                                }, {
                                    merge: true
                                })
                    }
                }
            })
        }
    })
}

main()