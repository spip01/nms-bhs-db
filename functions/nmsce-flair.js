'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

const message = `Due to a bug, some solar star ships had their sail and colors changed in 3.87 and 3.88.
This bug was corrected in 3.89. If you’re viewing this ship in 3.89 or later, there is a possibility that 
the sail and/or color may vary in-game vs the picture here\n\n\
----\n\n\
r/OP, If you have checked this ship using version 3.89 or it was actually posted from version 3.89 please
replace the flair with the appropriate version 3.89 flair. Thank You, NMSCE Mods`

main()
async function main() {
    let p = []

    let sub = await r.getSubreddit('NMSCoordinateExchange')
    r.config({
        continueAfterRatelimitError: true
    })

    p.push(sub.search({
        query: "subreddit:nmscoordinateexchange flair:3.88 solar",
        limit: 1000
    }).then(async posts => {
        console.log("post", posts.length)

        for (let post of posts) {
            if (post.link_flair_text.match(/starship\/.*\/3\.8[78]/i)) {
                let test = await post.expandReplies({
                    depth: 1
                })
                let comments = []
                for (let comment of test.comments) {
                    if (comment.author.name === "nmsceBot" && comment.body.startsWith("Due to a bug"))
                        comments.push(comment)
                }

                if (comments.length > 1) {
                    for (let i = 1; i < comments.length; ++i) {
                        await r.getComment(comments[0].id).delete()
                        console.log("deleted")
                    }
                }

                if (comments.length === 0) {
                    // // let flair = post.link_flair_text.replace(/starship\/(.*?)\/3.3/i, "Explorer/$1/3.3")
                    // console.log(post.title, post.permalink)

                    // // post.selectFlair({
                    // //     text: flair,
                    // //     flair_template_id: "8fe2abfa-99f1-11eb-8193-0e29a1c225cd"
                    // // })

                    post.reply(message.replace(/(.*?)OP(.*)/, "$1" + post.author.name + "$2"))
                        .distinguish({
                            sticky: true
                        }).lock()
                        .catch(err => console.log(err))
                    console.log("added")
                }
            }
        }
    }).catch(err => {
        console.log("post", err)
    }))

    return Promise.all(p)
}
