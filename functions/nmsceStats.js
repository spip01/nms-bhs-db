const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const bucket = admin.storage().bucket('gs://nms-bhs.appspot.com')
require('events').EventEmitter.defaultMaxListeners = 0
const thumbPath = "nmsce/disp/thumb/"

async function main() {
    let groupref = admin.firestore().collectionGroup("nmsceCommon")
    let p = []

    p.push(groupref.where("Type", "==", "Explorer").get().then(snapshot => {
        console.log (snapshot.docs.length, "Explorers")
        //dlThumb("explorer", snapshot.docs)
    }))
    p.push(groupref.where("Type", "==", "Hauler").get().then(snapshot => {
        console.log (snapshot.docs.length, "Haulers")
        //dlThumb("hauler", snapshot.docs)
    }))
    p.push(groupref.where("Type", "==", "Shuttle").get().then(snapshot => {
        console.log (snapshot.docs.length, "Shuttles")
        //dlThumb("shuttle", snapshot.docs)
    }))
    p.push(groupref.where("Type", "==", "Fighter").get().then(snapshot => {
        console.log (snapshot.docs.length, "Fighters")
        //dlThumb("fighter", snapshot.docs)
    }))
    p.push(groupref.where("Type", "==", "Exotic").get().then(snapshot => {
        console.log (snapshot.docs.length, "Exotics")
        //dlThumb("exotic", snapshot.docs)
    }))
    p.push(groupref.where("type", "==", "Living-Ship").get().then(snapshot => {
        console.log (snapshot.docs.length, "Living Ships")
        //dlThumb("livingship", snapshot.docs)
    }))

    await Promise.all(p)
}

async function dlThumb(what, docs) {
    console.log(what, docs.length)
    for (let doc of docs) {
        let e = doc.data()
        const dest = ".\\" + what + "\\" + e.Photo
        console.log(thumbPath + e.Photo, dest)
        await bucket.file(thumbPath + e.Photo).download({
            destination: dest
        }).catch(err => console.log(JSON.stringify(err)))
    }
}

main()
// magick montage -background black -geometry 400x225>+1+1 -size 3840x2160 *.jpg ../fighter.jpg
/*
Explorers: 1731
Haulers: 2269
Shuttles: 1162
Exotics: 333
Fighters: 3354
Living Ships: 365

viper 2259
barrel 1594
snowspeeder 1072
jet 1049
stubby 689
rasa 616
alpha 1756
needle 631
long 1112
*/