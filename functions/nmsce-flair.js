'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

const message = "There was a bug in version 3.3 concerning explorers that was fixed in version 3.35. \
Their configuration and color could be different than they are now. So, beware that if you go to find \
an explorer posted with the 3.3 version it may not be the ship you are looking for.\n\n\
----\n\n\
r/OP, If you have checked this ship using version 3.35 or it was actually posted from version 3.35 please \
replace the flair with the appropriate version 3.35 flair. Thank You, NMSCE Mods"

main()
async function main() {
    let p = []

    let sub = await r.getSubreddit('NMSCoordinateExchange')

    p.push(sub.search({
        query: "subreddit:nmscoordinateexchange flair:starship flair:3.3 explorer",
        limit: 1000
    }).then(posts => {
        console.log("post", posts.length)

        for (let post of posts) {
            if (post.link_flair_text.match(/starship\/.*\/3\.3\b/i)) {
                let flair = post.link_flair_text.replace(/starship\/(.*?)\/3.3/i, "Explorer/$1/3.3")
                console.log(flair, post.permalink)

                post.selectFlair({
                    text: flair,
                    flair_template_id: "8fe2abfa-99f1-11eb-8193-0e29a1c225cd"
                })

                post.reply(message.replace(/(.*?)OP(.*)/, "$1"+post.author.name+"$2"))
                    .distinguish({
                        status: true,
                        sticky: true
                    }).lock()
                    .catch(err => console.log(JSON.stringify(err)))
            }
        }
    }).catch(err => {
        console.log("post", JSON.stringify(err))
    }))

    return Promise.all(p)
}