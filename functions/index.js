const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

// exports.helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!")
// })

exports.createSystem = functions.firestore.document("stars5/{galaxy}/{platform}/{addr}")
    .onCreate((doc, context) => {
        const e = doc.data()

        console.log(e.addr + " " + context.params.galaxy + " " + context.params.platform + " " + context.params.addr)
        return admin.firestore().doc("stars5/totals").get()
            .then(doc => {
                if (doc.exists) {
                    const e = doc.data()
                    console.log("total " + e.stars5[context.params.platform])
                }
                return doc.exists
            })
    })