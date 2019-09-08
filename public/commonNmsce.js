blackHoleSuns.prototype.updateNmsce = async function (entry, batch) {
    entry.modded = firebase.firestore.Timestamp.now()

    if (typeof entry.created === "undefined")
        entry.created = firebase.firestore.Timestamp.now()

    let ref = bhs.fs.collection("nmsce/" + entry.galaxy + "/" + entry.type)
    if (typeof entry.id === "undefined") {
        ref = ref.doc()
        entry.id = ref.id
    } else
        ref = ref.doc(entry.id)

    if (batch)
        await batch.set(ref, entry, {
            merge: true
        })
    else
        await ref.set(entry, {
            merge: true
        }).then(() => {
            bhs.status(entry.addr + " saved.")
        }).catch(err => {
            bhs.status("ERROR: " + err.code)
            console.log(err)
        })
}

blackHoleSuns.prototype.getNmsceEntries = async function (displayFcn, galaxy, type, uid) {
    let ref = bhs.fs.collection("nmsce/" + galaxy + "/" + type)
    if (typeof uid !== "undefined")
        ref = ref.where("uid", "==", uid)

    await ref.get().then(async snapshot => {
        
    }).catch(err => {
        bhs.status("ERROR: " + err.code)
    })
}