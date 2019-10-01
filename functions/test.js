'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
require('events').EventEmitter.defaultMaxListeners = 0

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let p = []

    let ref = admin.firestore().collection("stars5")
    let docrefs = await ref.listDocuments()

    for (let gref of docrefs) {
        let colrefs = await gref.listCollections()

        for (let pref of colrefs) {
            let ref = pref.where("blackhole", "==", true)
            p.push(ref.get().then(snapshot => {
                let entries = []
                for (let e of snapshot.docs)
                    entries.push(e.data())
                return entries
            }))

            ref = pref.where("deadzone", "==", true)
            p.push(ref.get().then(snapshot => {
                let entries = []
                for (let e of snapshot.docs)
                    entries.push(e.data())
                return entries
            }))
        }
    }

    await Promise.all(p).then(res => {
        let l = []
        for (let r of res)
            l = l.concat(r)

        l = l.sort((a, b) => a.created.seconds - b.created.seconds)

        for (let i = 1000; i < l.length; i += 1000)
            console.log("all", i, l[i].created.toDate().toString().slice(0, 16), l[i].platform, l[i]._name)

        l = []
        for (let r of res) {
            if (r.length > 0 && r[0].platform === "PC-XBox")
                l = l.concat(r)
        }

        l = l.sort((a, b) => a.created.seconds - b.created.seconds)

        for (let i = 1000; i < l.length; i += 1000)
            console.log("pc", i, l[i].created.toDate().toString().slice(0, 16), l[i]._name)

        l = []
        for (let r of res)
            if (r.length > 0 && r[0].platform === "PS4")
                l = l.concat(r)

        l = l.sort((a, b) => a.created.seconds - b.created.seconds)

        for (let i = 1000; i < l.length; i += 1000)
            console.log("ps4", i, l[i].created.toDate().toString().slice(0, 16), l[i]._name)

    }).catch(err => console.log(err))
}

main()