'use strict'

const admin = require('firebase-admin')
const spawn = require('child-process-promise').spawn
const path = require('path')
const os = require('os')
const fs = require('fs')

// exports.checkThumb =function(){
//     const bucket = admin.storage().bucket("nms-bhs.appspot.com")
//     const [files] = await bucket.getFiles({
//         prefix: "nmsce/disp/"
//     })

//     for (let file of files) {
//         let f = bucket.file(file.name)

//         const fileDir = path.dirname(file.name)
//         const fileName = path.basename(file.name)

//         const tempLocalFile = path.join(os.tmpdir(), fileName)
//         const tempLocalThumbFile = path.join(os.tmpdir(), "t_" + fileName)

//         await f.download({
//             destination: tempLocalFile
//         })
//         await spawn('convert', [tempLocalFile, "-resize", "350", "-quality", "50%", tempLocalThumbFile], {
//             capture: ['stdout', 'stderr']
//         })

//         let dname = "nmsce/disp/thumb/" + fileName
//         await bucket.upload(tempLocalThumbFile, {
//             destination: dname
//         })

//         dname = "nmsce/disp/" + fileName
//         console.log("up", dname)
//         await bucket.upload(tempLocalFile, {
//             destination: dname
//         })

//         dname = "nmsce/orig/" + fileName
//         console.log("up", dname)
//         await bucket.upload(tempLocalFile, {
//             destination: dname
//         })

//         await f.delete()
//         fs.unlinkSync(tempLocalFile)
//         fs.unlinkSync(tempLocalThumbFile)
//     }
// }

exports.makeThumb = async function (fname) {
    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    let f = bucket.file("nmsce/disp/"+fname)

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
}