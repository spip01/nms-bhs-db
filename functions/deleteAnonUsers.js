const functions = require('firebase-functions')
const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

function main(next) {
    admin.auth().listUsers(1000, next)
        .then(function (list) {
            list.users.forEach(function (user) {
                if (typeof user.email === "undefined") {
                    admin.auth().deleteUser(user.uid)
                    console.log(user.uid)
                }
            })

            if (list.pageToken) {
                listAllUsers(list.pageToken);
            }
        })
        .catch(function (error) {
            console.log('Error listing users:', error);
        })
}

main()