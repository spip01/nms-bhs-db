const admin = require('firebase-admin')

var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    let p = []

    let ref = admin.firestore().collection("stars5")
    let docrefs = await ref.listDocuments()

    for (let gref of docrefs) {
        let colrefs = await gref.listCollections()

        for (let pref of colrefs) {
            ref = pref.where("blackhole", "==", true)
            p.push(ref.get().then(async snapshot => {
                let p = []

                if (snapshot.size > 0) {
                    let e = snapshot.docs[0].data()
                    let fname = 'darc/' + e.galaxy + "-" + e.platform + ".json"
                    console.log(fname)

                    let f = bucket.file(fname)
                    let s = f.createWriteStream({
                        gzip: true,
                    })

                    p.push(new Promise((resolve, reject) => {
                        s.on('finish', () => {
                            resolve(fname + " " + snapshot.size)
                        })
                    }))

                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        let out = stringify(e)
                        if (out)
                            s.write(out)
                    }

                    s.end()
                }

                return Promise.all(p).then(res => {
                    return res
                })
            }))
        }
    }

    await Promise.all(p).then(res => {
        console.log(JSON.stringify(res))
    }).catch(err => console.log("error", JSON.stringify(err)))
}


function stringify(e) {
    if (typeof e.addr === "undefined" || typeof e.reg === "undefined" || typeof e.sys === "undefined" ||
        typeof e.x === "undefined" || 
        typeof e.x.addr === "undefined" || typeof e.x.reg === "undefined" || typeof e.x.sys === "undefined")
        return null
    else
        return JSON.stringify([e.addr, e.reg, e.sys, e.x.addr, e.x.reg, e.x.sys]) + "\n"
}

main()