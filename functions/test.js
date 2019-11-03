'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let refs = await admin.firestore().collection("stars5/Euclid/PC-XBox")

    let regname = {}

    refs.get().then(snapshot => {
        for (let doc of snapshot.docs) {
            let e = doc.data()

            let r = e.reg.split(" ")
            if (r.length === 2) {
                if (typeof regname[r] === "undefined")
                    regname[r[1]] = 1
                else
                    regname[r[1]]++
            }
        }

        let names = Object.keys(regname)

        for (let doc of snapshot.docs) {
            let e = doc.data()

            for (let n of names) {
                if (e.sys.includes(n))
                    console.log(e.addr, e.sys)
                if (e.blackhole && e.x.sys.includes(n))
                    console.log(e.addr, e.x.sys)
            }
        }
    })
}

main()