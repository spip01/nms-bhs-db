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
    for (let doc of snapshot.docs) {
        let s = doc.data()
        let found = false
        for (let i = 0; i < searches.length; ++i) {
            let cur = searches[i]
            if (cur.uid === s.uid && cur.name === s.name) {
                cur = s
                found = true
                if (!s.email || !s.notify)
                    searches.splice(i, 1)
                break
            }
        }

        if (!found && s.email && s.notify)
            searches.push(s)
    }

    let sent = []

    for (let s of searches) {
        let ok = true

        if (sent.includes(s.uid))
            ok = false

        // if (s.uid === e.uid)
        //     ok = false

        if (s.galaxy && s.galaxy !== s.galaxy)
            ok = false

        if (s.type && s.type !== e.type)
            ok = false

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
                        if (ok)
                            console.log("tags", JSON.stringify(q.list, JSON.stringify(e[q.name])))
                        break
                    case "map":
                        for (let l of q.list)
                            if (!e[q.name][l])
                                ok = false
                        if (ok)
                            console.log("map", JSON.stringify(q.list, JSON.stringify(e[q.name])))
                        break
                    case "checkbox":
                        ok = e[q.name] === (q.val === "True")
                        if (ok)
                            console.log("ck", q.val, e[q.name])
                        break
                    default:
                        ok = q.query === ">=" ? e[q.name] >= q.val : e[q.name] === q.val
                        if (ok)
                            console.log("def " + q.type, q.query ? q.query : "", q.val, e[q.name])
                        break
                }

                if (!ok)
                    break
            }

        if (ok) {
            console.log("match", e.Name)
            sent.push(s.uid)

            let bucket = admin.storage().bucket("nms-bhs.appspot.com")
            let file = bucket.file(thumbnailPath + e.Photo)

            return file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491'
            }).then(url => {
                let link = "https://nmsce.com/preview.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()

                let mailOptions = {
                    from: '<bhsapp.testing@gmail.com>',
                    to: s.email,
                    subject: 'NMSCE Saved Search Match: ' + s.name,
                    html: '<a href="' + link + '">Type: ' + e.type + ' Name: ' + e.Name + '<br><img src="' + url + '"/></a>'
                }

                return transporter.sendMail(mailOptions, (err, info) => {
                    if (err)
                        console.log(err)
                })
            })
        }
    }
}

String.prototype.nameToId = function () {
    return /[^a-z0-9_-]/ig [Symbol.replace](this, "-")
}