'use strict'

const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
require('events').EventEmitter.defaultMaxListeners = 0
const spawn = require('child-process-promise').spawn
const path = require('path')
const os = require('os')
const fs = require('fs')

// async function main() {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//     })

//     const bucket = admin.storage().bucket("nms-bhs.appspot.com")
//     const [files] = await bucket.getFiles({
//         prefix: "nmsce/disp/"
//     })

//     for (let file of files) {
//         // if (file.name < "nmsce/disp/thumb/91d18622-fb6c-4b82-b62c-e075a83decd2.jpg") {
//         //     console.log("skip", file.name)
//         //     continue
//         // }

//         let f = bucket.file(file.name)
//         console.log("start", file.name)

//         const fileDir = path.dirname(file.name)
//         const fileName = path.basename(file.name)

//         const tempLocalFile = path.join(os.tmpdir(), fileName)
//         const tempLocalThumbFile = path.join(os.tmpdir(), "t_" + fileName)
//         await f.download({
//             destination: tempLocalFile
//         })
//         await spawn('convert', [tempLocalFile, "-resize", "400", "-quality", "70%", tempLocalThumbFile], {
//             capture: ['stdout', 'stderr']
//         })

//         let dname = "nmsce/disp/thumb/" + fileName
//         await bucket.upload(tempLocalThumbFile, {
//             destination: dname
//         })

//         fs.unlinkSync(tempLocalFile)
//         fs.unlinkSync(tempLocalThumbFile)
//         console.log("finish", file.name)
//     }
// }

// main()

exports.makeThumb = async function (fname) {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    let f = bucket.file("nmsce/disp/" + fname)
    console.log("start", "nmsce/disp/" + fname)

    const tempLocalFile = path.join(os.tmpdir(), fname)
    const tempLocalThumbFile = path.join(os.tmpdir(), "t_" + fname)

    await f.download({
        destination: tempLocalFile
    })

    await spawn('convert', [tempLocalFile, "-resize", "350", "-quality", "50%", tempLocalThumbFile], {
        capture: ['stdout', 'stderr']
    })

    let dname = "nmsce/disp/thumb/" + fname
    await bucket.upload(tempLocalThumbFile, {
        destination: dname
    })

    fs.unlinkSync(tempLocalFile)
    fs.unlinkSync(tempLocalThumbFile)

    console.log("finish", dname)
}