const functions = require('firebase-functions')
const admin = require('firebase-admin')

var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

function backupCols(ref, now) {
    let p = []
    const bucket = admin.storage().bucket("staging.nms-bhs.appspot.com")

    p.push(ref.get().then(snapshot => {
        if (!snapshot.empty) {
            const path = /\//g [Symbol.replace](snapshot.query.path, "-")
            const fname = "backup/" + now + "/" + path + ".json"
            console.log(fname)

            let f = bucket.file(fname)
            let fs = f.createWriteStream({
                gzip: true,
            })

            for (let doc of snapshot.docs)
                fs.write(JSON.stringify(doc.data()) + "\n")

            fs.end()

            return fname + " done"
        } else
            return snapshot.query.path + " empty"
    }))

    p.push(ref.listDocuments().then(refs => {
        let p = []
        for (let ref of refs) {
            p.push(ref.listCollections().then(refs => {
                let p = []
                for (let ref of refs)
                    p.push(backupCols(ref, now))

                return Promise.all(p).then(res => {
                    return res
                }).catch(err => {
                    return err
                })
            }))
        }

        return Promise.all(p).then(res => {
            return res
        }).catch(err => {
            return err
        })
    }))

    return Promise.all(p).then(res => {
        return res
    }).catch(err => {
        return err
    })
}

async function main() {
    const now = new Date().getTime()

    await admin.firestore().listCollections().then(async refs => {
        let p = []
        for (let ref of refs)
            p.push(backupCols(ref, now))

        await Promise.all(p).then(res => {
            //console.log(res)
        }).catch(err => {
            console.log(err)
        })
    })

    console.log(new Date().getTime() - now)
}

main()