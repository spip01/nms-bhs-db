'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

main()
async function main() {
    let sub = await r.getSubreddit('NMSCoordinateExchange')

    sub.search({
        query: "subreddit:nmscoordinateexchange flair:community",
        limit: 1000,
        time: "month"
    }).then(posts => {
        console.log("Total submissions", posts.length)
        let p = []
        let total = 0

        for (let post of posts) {
            let flair = post.link_flair_text.replace(/community event(.*)/i, "Starship$1")

            p.push({
                link: post.permalink,
                vote: post.ups,
                // flair: flair
            })
            total += post.ups

            // post.selectFlair({
            //     text: flair,
            //     flair_template_id: "41384622-0123-11e9-b9f1-0ec22fa6984a"
            // })
        }

        p.sort((a, b) => {
            return b.vote - a.votes
        })

        console.log("Total votes", total)

        for (let i = 0; i < 10; ++i)
            console.log(p[i].vote, "https://reddit.com" + p[i].link)

    }).catch(err => {
        console.log("post", JSON.stringify(err))
    })
}