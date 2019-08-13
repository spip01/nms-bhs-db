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
                if (typeof user.email === "undefined") {
                    admin.auth().deleteUser(user.uid)
                    console.log(user.uid)
                }
            })

            if (list.pageToken) {
                listAllUsers(list.pageToken);
            }
        })
        .catch(error => {
            console.log('Error listing users:', error);
        })
}

main()