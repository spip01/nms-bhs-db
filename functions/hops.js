const admin = require('firebase-admin')

let list = {}

exports.genRoute = async function (data) {
    let now = new Date().getTime()
    let dc = require("./dijkstra.js")

    if (data.galaxy === "" || data.platform === "")
        return {
            err: "no Galaxy/Platform specified"
        }

    let list = await getHops(data.galaxy, data.platform)
    let load = new Date().getTime()

    if (data.start === "" || data.end === "")
        return {
            load: load - now,
            err: "no address specified"
        }

    if (data.user !== "") {
        let bases = await addBases(data.user, data.start, data.galaxy, data.platform)
        hops = list.concat(bases)
    } else
        hops = list

    let base = new Date().getTime()

    const starts = [{
        coords: coordsToXYZ(data.start)
    }];

    const dest = {
        coords: coordsToXYZ(data.end),
    };

    let calc = dc.dijkstraCalculator(hops, data.range, "time")
    let res = calc.findRoute(starts, dest)
    let done = new Date().getTime()

    return {
        route: res[0].route,
        load: load - now,
        base: base - load,
        calc: done - base
    }
}

async function getHops(gal, plat) {
    if (typeof list[gal] !== "undefined" && typeof list[gal][plat] !== "undefined")
        return list[gal][plat]

    if (typeof list[gal] === "undefined")
        list[gal] = {}

    if (typeof list[gal][plat] === "undefined")
        list[gal][plat] = []

    hops = list[gal][plat]

    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    const readline = require('readline')
    let fname = 'darc/' + gal + "-" + plat + ".txt"

    let p = []

    let f = bucket.file(fname)
    await f.exists().then(data => {
            if (data[0]) {
                let s = f.createReadStream()
                let rd = readline.createInterface({
                    input: s
                })

                rd.on("line", line => {
                    if (line) {
                        let r = JSON.parse(line)
                        let h = {
                            blackhole: {
                                coords: coordsToXYZ(r[0]),
                                region: r[1],
                                system: r[2],
                            },
                            exit: {
                                coords: coordsToXYZ(r[3]),
                                region: r[4],
                                system: r[5],
                            }
                        }

                        hops.push(h)
                    }
                })

                p.push(new Promise((resolve, reject) => {
                    rd.on("close", () => {
                        resolve(hops)
                    })
                }))
            }
        })
        .catch(err => {
            console.log(err)
        })

    return await Promise.all(p).then(res => {
        return res[0]
    })
}

function coordsToXYZ(addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    }

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

async function addBases(user, start, gal, plat) {
    let list = []

    start = coordsToXYZ(start)
    let ref = admin.firestore().collection("users/")
    ref = ref.where("_name", "==", user)

    await ref.get().then(async snapshot => {
        if (snapshot.size > 0) {
            let ref = snapshot.docs[0].ref.collection("stars5/" + gal + "/" + plat)
            await ref.get().then(snapshot => {
                for (let doc of snapshot.docs) {
                    let e = doc.data()
                    let h = {
                        blackhole: {
                            coords: start,
                            region: "Teleport",
                            system: e.basename,
                        },
                        exit: {
                            coords: e.xyzs,
                            region: e.reg,
                            system: e.sys,
                        }
                    }

                    list.push(h)
                }
            })
        }
    })

    return list
}