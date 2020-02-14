'use strict'

const admin = require('firebase-admin')
var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
require('events').EventEmitter.defaultMaxListeners = 0
const spawn = require('child-process-promise').spawn
const fs = require('fs')

async function main() {
    let inpath = "C:\\Users\\sp\\Desktop\\glyphs2\\"
    let outpath = "C:\\Users\\sp\\Desktop\\separate\\"
    let dir = fs.readdirSync(inpath)
    for (let file of dir) {
        let infile = inpath + file

        let x = 18

        for (let i = 0; i < 12; ++i) {
            x += i * 64
            await spawn('convert', [infile, "-crop", "64x64+"+x+"+2029", "+repage", outpath+i+"_"+file])
        }
    }
}

main()