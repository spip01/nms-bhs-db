/*

1 565 '0800:00FE:0800:0079' '00797F001001'
//2 50346 '0858:00FE:0858:0079' '00797F059059'  
//3 100126 '08B0:00FE:08B0:0079' '00797F0B10B1' 
//4 149906 '0908:00FE:0908:0079' '00797F109109' 
//5 199686 '0960:00FE:0960:0079' '00797F161161' 
//6 249467 '09B8:00FE:09B8:0079' '00797F1B91B9' 
//7 299247 '0A10:00FE:0A10:0079' '00797F211211' 
8 349027 '0A68:00FE:0A68:0079' '00797F269269' 
9 398808 '0AC0:00FE:0AC0:0079' '00797F2C12C1' 
10 448588 '0B18:00FE:0B18:0079' '00797F319319'
11 498368 '0B70:00FE:0B70:0079' '00797F371371'
12 548149 '0BC8:00FE:0BC8:0079' '00797F3C93C9'
13 597929 '0C20:00FE:0C20:0079' '00797F421421'
14 647709 '0C78:00FE:0C78:0079' '00797F479479'
15 697490 '0CD0:00FE:0CD0:0079' '00797F4D14D1'
16 747270 '0D28:00FE:0D28:0079' '00797F529529'
17 797050 '0D80:00FE:0D80:0079' '00797F581581'
18 846831 '0DD8:00FE:0DD8:0079' '00797F5D95D9'
19 896611 '0E30:00FE:0E30:0079' '00797F631631'
20 946391 '0E88:00FE:0E88:0079' '00797F689689'
21 996172 '0EE0:00FE:0EE0:0079' '00797F6E16E1'
22 1045952 '0F38:00FE:0F38:0079' '00797F739739'
23 1095732 '0F90:00FE:0F90:0079' '00797F791791'
24 1145512 '0FE8:00FE:0FE8:0079' '00797F7E97E9'

*/
'use strict'

const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

async function main() {
    let f = require("./hops.js")
    data = {
        galaxy: "Euclid",
        platform: "PC-XBox",
    }
    console.log(await f.genRoute(data))
}


// function main() {
//     let i = 1
//     let y = 0xfe
//     let s = 0x79

//     for (let x = 0x800; x < 0xfff; x+=0x58 ) {
//         let dist = calcCtrDist(x,x)
//         console.log(i++, dist, xyzToAddress(x, y, x, s), addrToGlyph(x, y, x, s))
//     }
// }

function calcCtrDist(x, z) {
    x -= 0x7ff
    z -= 0x7ff
    return parseInt(Math.sqrt(x * x + z * z) * 400)
}

function xyzToAddress(x, y, z, s) {
    let addr = x.toString(16) + "." + y.toString(16) + "." + z.toString(16) + "." + s.toString(16)
    return reformatAddress(addr)
}

function reformatAddress(addr) {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":")
    str = str[0] === ":" ? str.slice(1) : str
    let out = ""

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":")
        let end = idx > 4 || idx === -1 ? 4 : idx
        let s = str.slice(0, end)
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0))
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "")
    }

    return out
}

function addrToGlyph(x, y, z, s) {
    let str = ""

    //const portalFormat = "psssyyxxxzzz"

    let xs = "00" + s.toString(16).toUpperCase()
    let xx = "00" + (x + 0x801).toString(16).toUpperCase()
    let xy = "00" + (y + 0x81).toString(16).toUpperCase()
    let xz = "00" + (z + 0x801).toString(16).toUpperCase()

    str = "0"
    str += xs.slice(xs.length - 3)
    str += xy.slice(xy.length - 2)
    str += xz.slice(xz.length - 3)
    str += xx.slice(xx.length - 3)

    return str
}

main()