'use strict'
const admin = require('firebase-admin')
require('events').EventEmitter.defaultMaxListeners = 0

const dc = require('nmsbhs-utils')
const readline = require('readline')

exports.genRoute = async function (data) {
    let now = new Date().getTime()
    if (data.galaxy === "" || data.platform === "")
        return {
            err: "no Galaxy/Platform specified"
        }

    let p = []
    p.push(getHops(data.galaxy, data.platform))
    p.push(getPOI(data.galaxy, data.platform))

    if (data.preload) {
        return Promise.all(p).then(res => {
            console.log("preload", new Date().getTime() - now)
            return {
                loaded: true,
                preload: new Date().getTime() - now
            }
        })
    }

    if (data.user !== "" && data.usebases)
        p.push(addBases(data.user, data.start, data.galaxy, data.platform))

    if (!data.proximity) {
        if (data.end !== "" && data.end !== "0000:0000:0000:0000")
            p.push(getAddrEntry(data.end, data.galaxy, data.platform))
        else
            return {
                err: "No destination specified."
            }
    }

    return Promise.all(p).then(res => {
        let start = {
            addr: data.start === "" ? "0000:0000:0000:0000" : data.start
        }
        start.coords = dc.coordinates(start.addr)

        let end = {
            addr: data.end === "" ? "0000:0000:0000:0000" : data.end
        }
        end.coords = dc.coordinates(end.addr)

        let hops = savedHops[data.galaxy][data.platform]
        let poi = savedPOI[data.galaxy][data.platform]
        let dest = []

        for (let r of res) {
            if (r) {
                switch (r.what) {
                    case "end":
                        end.system = r.end.sys
                        end.region = r.end.reg
                        break
                    case "bases":
                        hops = hops.concat(r.list)
                        break
                }
            }
        }

        if (data.proximity)
            dest = poi
        else
            dest.push(end)

        let calc = dc.dijkstraCalculator(hops, data.range, "time")

        let stime = new Date().getTime() - now
        console.log("setup", stime)
        now = new Date().getTime()

        let routes = calc.findRoutes(start, dest)
        let ctime = new Date().getTime() - now
        console.log("calc", ctime)

        return {
            route: calcJumps(routes, data.range, data.maxJumps),
            calc: ctime,
            setup: stime
        }
    })
}

let savedHops = {}

function getHops(gal, plat) {
    if (typeof savedHops[gal] === "undefined")
        savedHops[gal] = {}

    if (typeof savedHops[gal][plat] !== "undefined")
        return new Promise((resolve, reject) => {
            resolve({
                what: "hops",
                list: savedHops[gal][plat]
            })
        })

    const bucket = admin.storage().bucket("nms-bhs.appspot.com")
    let fname = 'darc/' + gal + "-" + plat + ".txt"

    let f = bucket.file(fname)
    return f.exists().then(data => {
            let p = []
            if (data[0]) {
                let s = f.createReadStream()
                let rd = readline.createInterface({
                    input: s
                })

                let hops = []
                rd.on("line", line => {
                    if (line) {
                        let r = JSON.parse(line)
                        let h = {
                            blackhole: {
                                coords: dc.coordinates(r[0]),
                                addr: r[0],
                                region: r[1],
                                system: r[2],
                            },
                            exit: {
                                coords: dc.coordinates(r[3]),
                                addr: r[3],
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

            return Promise.all(p).then(res => {
                savedHops[gal][plat] = res[0]
                return {
                    what: "hops",
                    list: res[0]
                }
            })
        })
        .catch(err => {
            console.log(JSON.stringify(err))
        })
}

function getAddrEntry(addr, gal, plat) {
    let ref = admin.firestore().collection("stars5/" + gal + "/" + plat)
    ref = ref.where("addr", "==", addr)
    return ref.get().then(async snapshot => {
        if (!snapshot.empty)
            return {
                what: "end",
                end: snapshot.docs[0].data()
            }
        else return {
            what: "not found",
        }
    })
}

function calcJumps(routes, range, maxJumps) {
    let out = []

    for (const orig of routes) {
        const r = JSON.parse(JSON.stringify(orig))
        const last = r.route[r.route.length - 1]
        let jumps = 0
        r.bh = 0

        for (let i = 0; i < r.route.length; ++i) {
            const l = r.route[i]
            const n = i < r.route.length - 1 ? r.route[i + 1] : null
            const ly = n ? Math.ceil(calcDistXYZ(n.coords, l.coords) * 400) : 0
            const j = Math.max(Math.ceil(ly / range), 1)

            l.jumps = 0
            l.dist = 0

            if (last.addr === l.addr && ly === 0)
                l.what = "arrived"
            else if (l.system === "Teleport") {
                l.what = "teleport"
                l.jumps = 1
                jumps = 1
            } else if (n && (n.system === "Teleport" || l.addr === n.addr))
                l.what = "loc"
            else if (l.coords.s === 0x79) {
                l.what = "bh"
                l.jumps = 1
                jumps++
                r.bh++
            } else {
                l.what = "warp"
                l.jumps = j
                l.dist = ly
                jumps += j
            }
        }

        r.jumps = jumps
        out.push(r)
    }

    out = out.filter(a => a.jumps > 1 && a.jumps <= maxJumps)
    out = out.sort((a, b) => a.jumps - b.jumps)

    return out
}

function calcDistXYZ(xyz1, xyz2) {
    let x = xyz1.x - xyz2.x
    let y = xyz1.y - xyz2.y
    let z = xyz1.z - xyz2.z
    return Math.sqrt(x * x + y * y + z * z)
}

function addBases(user, start, gal, plat) {
    let ref = admin.firestore().collection("users")
    ref = ref.where("_name", "==", user)
    let startcoords = dc.coordinates(start === "" ? "0000:0000:0000:0000" : start)

    return ref.get().then(snapshot => {
        if (snapshot.size > 0) {
            let ref = snapshot.docs[0].ref.collection("stars5/" + gal + "/" + plat)
            return ref.get().then(snapshot => {
                let list = []
                for (let doc of snapshot.docs) {
                    let e = doc.data()
                    let h = {
                        blackhole: {
                            coords: startcoords,
                            addr: start,
                            region: e.basename,
                            system: "Teleport",
                        },
                        exit: {
                            coords: dc.coordinates(e.addr),
                            addr: e.addr,
                            region: e.reg,
                            system: e.sys,
                        }
                    }

                    list.push(h)
                }

                return {
                    what: "bases",
                    list: list
                }
            })
        } else
            return
    })
}

let savedPOI = {}

function getPOI(gal, plat) {
    if (typeof savedPOI[gal] === "undefined")
        savedPOI[gal] = {}

    if (typeof savedPOI[gal][plat] !== "undefined")
        return new Promise((resolve, reject) => {
            resolve({
                what: "poi",
                list: savedPOI[gal][plat]
            })
        })

    let p = []

    let ref = admin.firestore().collection("poi")
    ref = ref.where("galaxy", "==", gal)
    ref = ref.where("platform", "==", plat)

    p.push(ref.get().then(snapshot => {
        return buildPOIList(snapshot)
    }))

    ref = admin.firestore().collection("org")
    ref = ref.where("galaxy", "==", gal)
    ref = ref.where("platform", "==", plat)

    p.push(ref.get().then(snapshot => {
        return buildPOIList(snapshot)
    }))

    ref = admin.firestore().collection("users")
    p.push(ref.listDocuments().then(async docrefs => {
        let list = []
        for (let ref of docrefs) {
            ref = ref.collection("stars5/" + gal + "/" + plat)
            ref = ref.where("sharepoi", "==", true)

            let snapshot = await ref.get()
            if (!snapshot.empty)
                buildPOIList(snapshot, list)
        }

        return list
    }))

    return Promise.all(p).then(res => {
        let list = []
        for (let l of res)
            list = list.concat(l)

        list = list.sort((a, b) => {
            return a.addr > b.addr ? 1 : a.addr < b.addr ? -1 : a.addr === b.addr && typeof a.basename !== "undefined" ? -1 : 1
        })

        list = list.filter((v, idx, arr) => {
            return idx >= arr.length - 1 || v.addr !== arr[idx + 1].addr
        })

        savedPOI[gal][plat] = list
        return {
            what: "poi",
            list: list
        }
    })
}

function buildPOIList(snapshot, list) {
    if (typeof list === "undefined")
        list = []

    for (let doc of snapshot.docs) {
        let e = doc.data()

        if (typeof e.addr !== "undefined") {
            let h = {
                coords: dc.coordinates(e.addr),
                addr: e.addr,
                name: typeof e.name !== "undefined" ? e.name : e.basename,
                owner: typeof e.owner !== "undefined" ? e.owner : typeof e.basename !== "undefined" ? e._name : "",
                basename: e.basename,
            }

            list.push(h)
        }
    }

    return list
}