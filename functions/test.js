'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let ref = admin.firestore().collection("stars5/Euclid/PC-XBox")

    ref.get().then(async snapshot => {
        for (let doc of snapshot.docs) {
            let e = doc.data()

            if (typeof e.uid === "undefined" && typeof e._name === "undefined") {
                console.log("uid", e.addr)

                let ref = admin.firestore().collection("stars5/Euclid/PC-XBox")
                ref = ref.where("connection","==",e.addr)

                let doc =await ref.get()
                if (doc.exists) {
                    let d = doc.data()
                    console.log("found", d.addr, d.uid, d._name)
                }
            }
        }
    })
}

main()