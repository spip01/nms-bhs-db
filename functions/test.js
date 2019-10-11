'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const fs = require('fs')

const csvcolumns = ["bhsys", "bhreg", "bhaddr", "exitsys", "exitreg", "exitaddr"]
const jsoncolumns = ["bhaddr", "bhreg", "bhsys", "exitaddr", "exitreg", "exitsys"]

async function main() {
    const csvfile = "C:\\Users\\sp\\Documents\\nms\\2e253fc8-0984-453d-8665-706e2a17f7d9.csv"
    const jsonfile = "C:\\Users\\sp\\Documents\\nms\\darc_Euclid-PS4.json"
    let csv = []
    let json = {}

    let data = fs.readFileSync(csvfile, 'utf8')
    let allrows = data.split(/\r?\n|\r/)
    for (let row of allrows) {
        let r = row.split(/,/g)
        csv.push(r[2])
    }

    data = fs.readFileSync(jsonfile, 'utf8')
    allrows = data.split(/\r?\n|\r/)
    for (let row of allrows) {
        if (row.length > 32) {
            let r = JSON.parse(row)
            json[r[0]] = true
        }
    }

    console.log(csv.length)
    console.log(Object.keys(json).length)

    for (let a of csv) {
        console.log(a)
        if (typeof json[a] === "undefined")
            console.log(a, json[a], "not found")
    }
}

main()