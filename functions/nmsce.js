'use strict'

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
const email = require("./bhs-app.json")
const nodemailer = require("nodemailer")
require('events').EventEmitter.defaultMaxListeners = 0
const bucket = admin.storage().bucket("staging.nms-bhs.appspot.com")

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// })

const thumbnailPath = "/nmsce/disp/thumb/"

var searches = []
var lastUpdate
const transporter = nodemailer.createTransport(email)

exports.checkSearch = async function (e) {
    let ref = admin.firestore().collectionGroup("nmsce-saved-searches")
    if (lastUpdate)
        ref = ref.where("date", ">", lastUpdate)

    lastUpdate = admin.firestore.Timestamp.fromDate(new Date());

    let snapshot = await ref.get()
    for (let doc of snapshot.docs)
        searches.push(doc.data())

    let sent = []

    for (let s of searches) {
        let ok = true

        if (sent.includes(s.uid))
            ok = false

        if (!s.email || !s.notify) // || s.uid === e.uid)
            ok = false

        if (s.galaxy && e.galaxy !== s.galaxy)
            ok = false

        if (s.type && e.type !== e.type)
            ok = false

        // if (ok && s._name && e._name !== e._name)
        //     ok = false

        if (ok)
            for (let q of s.search) {
                ok = e[q.name]
                if (!ok)
                    break

                switch (q.type) {
                    case "tags":
                        for (let l of q.list)
                            if (!e[q.name].includes(l))
                                ok = false
                        break
                    case "map":
                        for (let l of q.list)
                            if (!e[q.name][l])
                                ok = false
                        break
                    case "checkbox":
                        ok = e[q.name] === (q.val === "True")
                        break
                    default:
                        ok = q.query === ">=" ? e[q.name] >= q.val : e[q.name] === q.val
                        break
                }

                if (!ok)
                    break
            }

        if (ok) {
            sent.push(s.uid)

            let ref = admin.fbstorage.ref().child(thumbnailPath + e.Photo)
            return ref.getDownloadURL().then(url => {
                let link = "https://nmsce.com/preview.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()

                let mailOptions = {
                    from: '<bhsapp.testing@gmail.com>',
                    to: s.email,
                    subject: 'NMSCE Saved Search Match: ' + s.name,
                    html: '<a href="' + link + '">Type: ' + e.type + ' Name: ' + e.Name + '<br><img src="'+url+'"/></a>'
                }

                return transporter.sendMail(mailOptions, (err, info) => {
                    if (err)
                        console.log(err)
                    console.log(info)
                })
            })
        }
    }
}

String.prototype.nameToId = function () {
    return /[^a-z0-9_-]/ig [Symbol.replace](this, "-")
}