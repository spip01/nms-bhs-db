const functions = require('firebase-functions')
const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

function main(next) {
    admin.auth().listUsers(1000, next)
        .then(list => {
            list.users.forEach(user => {
                let ref = admin.firestore().doc("users/" + user.uid)
                ref.get().then(doc => {
                    if (doc.exists) {
                        let u = doc.data()
                        if (typeof u._name === "undefined" || u._name === "")
                            doc.ref.delete()
                    } else
                        console.log(doc.id)
                })
            })

            if (list.pageToken) {
                main(list.pageToken);
            }
        })
        .catch(error => {
            console.log('Error listing users:', error);
        })
}

main()