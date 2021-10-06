'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null

main()
async function main() {

    sub = await r.getSubreddit("nmsCoordinateExchange")
    let user = await r.getUser("nmsceBot")

    await user.getComments({
        limit: 10000
    }).then(async posts => {
        console.log("comments ", posts.length)

        for (let post of posts)
            if (post.banned_by === null && post.body.startsWith("The item shared")) {
                let op = null
                let oppost = post

                while (!op || oppost.parent_id) {
                    op = await r.getComment(oppost.parent_id)
                    oppost = await op.fetch()
                }

                if (oppost.link_flair_text.includes("Euclid")) {
                    console.log("remove comment", oppost.title)
                    await post.remove()
                }
            }
    })
}