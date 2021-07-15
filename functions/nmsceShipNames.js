'use strict'
Error.stackTraceLimit = 50
require('events').EventEmitter.defaultMaxListeners = 0

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

/*
    'Whispering Foe PZ4',
    'Whispering Foe WA9',
    'Whispering Foe DJ8',
    'Whispering Foe',
    'Whispering Foe MP8',
*/

async function main() {
    let ships = {}

    let ref = admin.firestore().collection("nmsce/Euclid/Ship")
    // ref = ref.limit(100)

    let snapshot = await ref.get()

    for (let doc of snapshot.docs) {
        let name = doc.data().Name

        if (typeof name === "string" && name !== "") {
            name = name.replace(/(?:[A-Z]{2}\d\s)?(\D*)$|(\D*?)(?:\s[A-Z]{2}\d\s?)?$/, "$1$2")
            name = name.replace(/(.*?)[XIV]+$/, "$1")

            if (typeof ships[name] === "undefined") {
                ships[name] = {}
                ships[name].count = 0
                ships[name].list = []
                ships[name].seed = []
            }

            ships[name].count++
            ships[name].list.push(doc.data().Name)
            ships[name].list.push(doc.data().Seed)
        }
    }

    for (let key of Object.keys(ships))
        if (ships[key].count >= 5)
            console.log(ships[key].count, ships[key].list, ships[key].seed)
}

main()