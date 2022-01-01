'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')

const list = ["qwz1f6", "qwqvhx", "qxh2cq", "qya7qx", "qybr2k", "qxfje4", "qxar02", "qxpgv6", "qy0mmt", "qxlfxg", "qxtsgr",
    "qybr2k", "qxcr6b", "qxgvjx", "qxnkj8", "qxdeg3", "qxfs9v", "qxs041", "qxhtdr", "qy7x2x", "qx9pa1", "qyakhd", "qxkbs7",
    "qyarjj", "qxqh05", "qxfj1t", "qxfj1t", "qxe96z", "qxk37z", "qxt7mn", "qxnkj8", "qy2qr8", "qy481i", "qy5w8n", "qxy5wq",
    "qxoqor", "qy7c3s", "qxv8qr", "qxro2j", "qy78s7", "qxt73d", "qxpzum", "qxbm4o", "qy5hc5", "qy7l5o", "qxt9tq", "qy8893",
    "qy4feo", "qxe96z", "qxfje4", "qxe8yh", "qxcrds", "qxpxfe", "qxrox1", "qxc48d", "qy2ofk", "qxvpp1", "qy2rdp", "qy6ytt",
    "qy74ga", "qy79ak", "qxv8si", "qxrnxa", "qxro2j", "qy9wcy", "qxq1yi", "qy0mmt", "qxbkla", "qxbm4o", "qxol71", "qy7vf4",
    "qxt34n", "qxkdgd", "qyarjj", "qy85n9", "qy4alo", "qxh2cq", "qy7x2x", "qya7qx", "qyarfg", "qxcrds", "qxcr6b", "qxm5fo",
    "qxr9xw", "qxq27g", "qxvmik", "qxxt2c", "qxz786", "qy0frj", "qxdsfb", "qxc3q0", "qxar02", "qxg82f", "qxohv5", "qy5gwj",
    "qy2kxj", "qxzaju", "qxvjgp", "qxhun9", "qxmtpv", "qx3sk0", "qy803d", "qy8abt", "qy8zph", "qxt73d", "qx9q4h", "qx340o",
    "qxml3r", "qxkdgd", "qxkbs7", "qxttng", "qx3pqj", "qxsa25", "qxqh05", "qy2bku", "qy0lsk", "qybr2k", "qxr6uk", "qxww5h",
    "qxr63u", "qxwvd6", "qx6hj4", "qxnpiy", "qxaqg3", "qxt8hu", "qx6gg8"
]

main()
async function main() {
    let r = await new snoowrap(login)
    r.config({
        continueAfterRatelimitError: true
    })

    let p = []

    for (let id of list) {
        p.push(r.getSubmission(id).fetch().then(async post => {
            post.approve().catch(err => console.log(err))
            console.log(post.title)

            for (let c of post.comments)
                if (c.body.includes("Posting limit exceded") && !c.banned_by)
                    await (await r.getComment(c.id).fetch()).remove()
        }))
    }

    await Promise.all(p)
}