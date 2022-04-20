'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')

main()
async function main() {
    let r = await new snoowrap(login)
    r.config({
        continueAfterRatelimitError: true
    })
    let sub = await r.getSubreddit('NMSCoordinateExchange')

    let settings = await sub.widget()
    console.log(JSON.stringify(settings))

//     await sub.search({
//         query: "flair_text:Multi",
//         sort: "new",
//         time: "month",
//         limit: 1000
//     }).then(async posts => {
//         for (let p of posts) {
//             if (p.link_flair_text.match(/Multi Tool.*3\.8$/i)) {
//                 // let replies = await p.expandReplies()

//                 // let found = false
//                 // for (let r of replies.comments)
//                 //     if (r.author.name === "nmsceBot" && r.body.startsWith("There is a high possibility this MT no longer exists")) {
//                 //         found = true
//                 //         break
//                 //     }
// \
//                 // if (!found) {
//                 //     console.log("comment: https://reddit.com" + p.permalink)

//                 //     p.reply("There is a high possibility this MT no longer exists. MT’s found between updates 3.8 and 3.81 were wiped due to Hello Games correcting a MT related bug introduced in 3.8. If this is a Royal MT post, the Royal MT is likely still there, but of a different color.")
//                 //         .distinguish({
//                 //             status: true,
//                 //             sticky: true
//                 //         }).lock().catch(err => error(12, err))
//                 // }

//                 await p.selectFlair({
//                     flair_template_id: `102325e6-94e8-11ec-92a2-765fe80403da`,
//                     text: p.link_flair_text.replace(/Multi Tool\/(.*?)\/.*/,"Multi Tool/$1/3.8 MIA")
//                 })
// \                console.log(p.link_flair_text.replace(/Multi Tool\/(.*?)\/.*/,"Multi Tool/$1/3.8 MIA"), "https://reddit.com" + p.permalink)
//             }
//         }
//     })
}
