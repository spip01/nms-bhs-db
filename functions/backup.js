const functions = require('firebase-functions')
const admin = require('firebase-admin')

var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function backupCols(ref, now) {
    const bucket = admin.storage().bucket("staging.nms-bhs.appspot.com")

    await ref.get().then(snapshot => {
        if (!snapshot.empty) {
            const path = /\//g [Symbol.replace](snapshot.query.path, "-")
            const fname = "backup/" + now + "/" + path + ".json"

            let f = bucket.file(fname)
            let fs = f.createWriteStream({
                gzip: true,
            })

            for (let doc of snapshot.docs)
                fs.write(JSON.stringify(doc.data()) + "\n")

            fs.end()

            console.log(fname)
        }
    })

    let p = []
    await ref.listDocuments().then(async refs => {
        for (let ref of refs) {
            await ref.listCollections().then(refs => {
                for (let ref of refs)
                    p.push(backupCols(ref, now))
            })
        }
    })

    return p
}

async function doBackup() {
    const now = new Date().toDateLocalTimeString()

    await admin.firestore().listCollections().then(refs => {
        let p = []
        for (let ref of refs)
            p.push(backupCols(ref, now))

        return Promise.all(p)
    })
}

Date.prototype.toDateLocalTimeString = function () {
    let date = this
    return date.getFullYear() +
        "-" + ten(date.getMonth() + 1) +
        "-" + ten(date.getDate()) +
        " " + ten(date.getHours()) +
        ":" + ten(date.getMinutes()) +
        ":" + ten(date.getSeconds())
}

function ten(i) {
    return i < 10 ? '0' + i : i
}

doBackup()