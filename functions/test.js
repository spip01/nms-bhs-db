'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let bh = {}
    let addr = {}

    let ref = admin.firestore().collection("stars5")
    let docrefs = await ref.listDocuments()

    for (let gref of docrefs) {
        if (typeof bh[gref.id] === "undefined")
            bh[gref.id] = {}

        let colrefs = await gref.listCollections()
        for (let pref of colrefs) {
            if (typeof bh[gref.id][pref.id] === "undefined")
                bh[gref.id][pref.id] = {}

            ref = pref.where("blackhole", "==", true)
            let snapshot = await ref.get()

            for (let doc of snapshot.docs) {
                let e = doc.data()

                if (typeof addr[e.addr] === "undefined")
                    addr[e.addr] = 0

                addr[e.addr]++

                bh[e.galaxy][e.platform][e.addr] = e
            }
        }
    }

    let gallist = Object.keys(bh)

    for (let g of gallist) {
        for (let p of Object.keys(bh[g])) {
            for (let a of Object.keys(bh[g][p])) {
                if (addr[a] === 1)
                    continue // only 1 entrance for address

                let e = bh[g][p][a]

                for (let g of gallist) {
                    for (let p of Object.keys(bh[g])) {
                        if (typeof bh[g][p][a] === "undefined" || g === e.galaxy && p === e.platform)
                            continue // self or doesn't exist

                        // matching entrance
                        let m = bh[g][p][a]
                        let o = [e.galaxy, e.platform, e.addr, e.sys, e.reg, e.x.addr, e.x.sys, e.x.reg, m.galaxy, m.platform, m.addr, m.sys, m.reg, m.x.addr, m.x.sys, m.x.reg]

                        if (e.connection === m.connection) // entrance & exit match
                            o.unshift("hit")
                        else
                            o.unshift("miss")

                        let s = JSON.stringify(o)
                        s = s.slice(1, s.length - 1)

                        console.log(s)
                    }
                }
            }
        }
    }
}


main()