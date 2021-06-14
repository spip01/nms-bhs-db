'use strict'

/*
Summary of nmscebot

Rewrite all flair to keep them consistently formatted
Add galaxy from title or correct spelling of galaxy in flair
Add version number to flair
Approve post once flair is complete (automod removed)
Remove post with unrecognized flair
Handle ship request response before approving
General subscriber commands "!help"
Moderator commands "!help"

todo: handle posting limits/hour/day

It shouldn't approve post removed by any moderator
*/

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

// const functions = require('firebase-functions')
// const admin = require('firebase-admin')
// var serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// })

var sub = null
var mods = []
var rules = []
var lastPost = {}
var lastComment = {}
const version = 3.50

// main()
// async function main() {

exports.nmsceBot = async function () {

    if (!sub) {
        console.log("new instance")
        sub = await r.getSubreddit('NMSCoordinateExchange')
    }

    let date = new Date().valueOf() / 1000
    let p = []

    if (rules.length === 0) {
        let r = await sub.getRules()
        for (let x of r.rules)
            rules.push(x.description)
    }

    p.push(sub.getNew(!lastPost.name || lastPost.full + 60 * 60 < date ? {
        limit: 50
    } : {
        before: lastPost.name
    }).then(posts => {
        console.log("post", posts.length)

        if (posts.length > 0 || !lastPost.full || lastPost.full + 60 * 60 < date)
            lastPost.full = date

        if (posts.length > 0) {
            lastPost.name = posts[0].name
            validatePosts(posts)
        }
    }).catch(err => {
        console.log("error 1", typeof err === "string" ? err : JSON.stringify(err))
    }))

    p.push(sub.getNewComments(!lastComment.name ? {
        limit: 100
    } : {
        before: lastComment.name
    }).then(async posts => {
        console.log("comments", posts.length)

        if (posts.length > 0) {
            if (mods.length === 0) {
                let m = await sub.getModerators()
                for (let x of m)
                    mods.push(x.id)
            }

            lastComment.name = posts[0].name
            checkComments(posts, mods)
        }
    }).catch(err => {
        console.log("error 2", typeof err === "string" ? err : JSON.stringify(err))
    }))

    p.push(sub.getModqueue().then(posts => {
        console.log("queue", posts.length)
        validatePosts(posts)
    }).catch(err => {
        console.log("error 3", typeof err === "string" ? err : JSON.stringify(err))
    }))

    // only needed to reapprove bot removed post.
    // p.push(sub.getModerationLog( {
    //     mods: ["nmsceBot"],
    //     type: "removeLink",
    //     limit: 10,
    // }).then(async logs => {
    //     console.log("log", logs.length)
    //     let list = []
    //     posts = []

    //     for (let log of logs) {
    //         if (!list.includes(log.target_fullname)) {
    //             list.push(log.target_fullname)
    //             let post = await (await r.getSubmission(log.target_fullname.slice(3))).refresh()
    //             posts.push(post)
    //         }
    //     }

    //     validatePosts(posts)
    // }).catch(err => {
    //     console.log("error 4", typeof err === "string" ? err : JSON.stringify(err))
    // }))

    return Promise.all(p)
}

async function checkComments(posts, mods) {
    for (let post of posts) {
        if (!post.banned_by && post.body[0] === "!") {
            console.log("command", post.body)
            if (post.body.includes("!m-") && mods.includes(post.author_fullname)) {
                let missing = ""
                let remove = false
                let rule = ""
                let offtopic = false
                let description = false
                let shiprequest = false

                let match = post.body.replace(/^!m-(\S+)/, "$1")
                for (let c of match) {
                    switch (c) {
                        case "g": // galaxy
                            missing += (missing ? ", " : "") + "galaxy"
                            break
                        case "p": // platform
                            missing += (missing ? ", " : "") + "platform"
                            break
                        case "m": // game mode
                            missing += (missing ? ", " : "") + "game mode"
                            break
                        case "c": // coords
                            missing += (missing ? ", " : "") + "coordinates or glyphs"
                            break
                        case "l": // coords
                            missing += (missing ? ", " : "") + "planetary latitude & longitude"
                            break
                        case "s": // screenshot
                            missing += (missing ? ", " : "") + "screenshot"
                            break
                        case "r": // remove
                            remove = true
                            break
                        case "o": // off topic
                            offtopic = true
                            break
                        case "f": // ship request flair
                            shiprequest = true
                            break
                        case "d": // ask for better description
                            description = true
                            break
                        case "v": // get community event votes
                            getVotes(post, post.body.replace(/!m-v(.*)/, "$1"))
                            return
                    }
                }

                match = post.body.replace(/!m-.*?([\d,]+)/, "$1").split(",")
                for (let i of match) {
                    let r = parseInt(i)
                    if (r <= rules.length)
                        rule += (rule ? "\n\n----\n" : "") + rules[r - 1]
                }

                let message = ""
                if (missing)
                    message += missingInfo.replace(/\[missing\]/g, missing) + "\n\n----\n"
                if (description)
                    message += respDescription + "\n\n----\n"
                if (offtopic)
                    message += respOffTopic + "\n\n----\n"
                if (shiprequest)
                    message += respShipRequest + "\n\n----\n"
                if (remove)
                    message += removePost + "\n\n----\n"
                if (rule)
                    message += rule + "\n\n----\n"

                if (message) {
                    message += botSig

                    let op = null
                    let oppost = post

                    while (!op || oppost.parent_id) {
                        op = await r.getComment(oppost.parent_id)
                        oppost = await op.fetch()
                    }

                    op.reply(message)
                        .distinguish({
                            status: true
                        }).lock()
                        .catch(err => console.log("error 5", typeof err === "string" ? err : JSON.stringify(err)))

                    if (remove)
                        op.report({
                            reason: post.author.name + " rule " + match
                        }).remove()
                        .catch(err => console.log("error 6", typeof err === "string" ? err : JSON.stringify(err)))
                    else if (!description)
                        op.report({
                            reason: post.author.name + " missing " + missing
                        }).catch(err => console.log("error 7", typeof err === "string" ? err : JSON.stringify(err)))

                    post.remove()
                        .catch(err => console.log("error 8", typeof err === "string" ? err : JSON.stringify(err)))

                    console.log("remove: " + remove, "missing: " + missing, "rule: " + match, "https://reddit.com" + oppost.permalink)
                }
            } else {
                let match = post.body.match(/!(yes|shiploc|help|shipclass|portal|wildbase|s2|search)/)
                if (match) {
                    let message = null
                    let reply = null
                    switch (match[1]) {
                        case "yes":
                            if (post.author.name !== "AutoModerator") {
                                let op = null
                                let oppost = post
                                oppost.lock()

                                while (!op || oppost.parent_id) {
                                    op = await r.getComment(oppost.parent_id)
                                    oppost = await op.fetch()
                                    if (oppost.parent_id && oppost.author.name === "AutoModerator")
                                        oppost.lock()
                                }

                                if (oppost.link_flair_text === "Ship Request?") {
                                    console.log("approve ship request")
                                    oppost.approve().selectFlair({
                                        flair_template_id: oppost.link_flair_template_id,
                                        text: "Ship Request"
                                    })
                                }
                            }
                            break
                        case "help":
                            reply = replyCommands
                            if (mods.includes(post.author_fullname))
                                reply += replyModCommands
                            break
                        case "shiploc":
                            message = respShiploc
                            break
                        case "shipclass":
                            message = respShipclass
                            break
                        case "portal":
                            message = respPortal
                            break
                            // case "wildbase":
                            //     message = respWildBase
                            //     break
                        case "s2":
                            message = respS2
                            break
                        case "search":
                            message = respSearch
                            break
                    }

                    if (message || reply) {
                        let op = await r.getComment(post.parent_id)

                        if (message)
                            op.reply(message).lock()
                            .catch(err => console.log("error 9", typeof err === "string" ? err : JSON.stringify(err)))
                        else
                            r.composeMessage({
                                to: post.author,
                                subject: "nmsceBot Commands",
                                text: reply
                            })
                            .catch(err => console.log("error 10", typeof err === "string" ? err : JSON.stringify(err)))

                        post.remove()
                            .catch(err => console.log("error 11", typeof err === "string" ? err : JSON.stringify(err)))

                        console.log("reply:", match[0])
                    }
                } else {
                    let glyph = null
                    let addr = post.body.match(/!((?:[0-9A-F]{4}:?){4})/i)

                    if (addr) {
                        addr = addr[1]
                        glyph = addrToGlyph(addr)
                    } else {
                        glyph = post.body.match(/!([0-9A-F]{12})/i)
                        if (glyph)
                            glyph = glyph[1]
                    }

                    if (glyph) {
                        let op = null
                        let oppost = post

                        while (!op || oppost.parent_id) {
                            op = await r.getComment(oppost.parent_id)
                            oppost = await op.fetch()
                        }

                        let str = ""

                        if (addr) {
                            str = "Coordinates: " + addr + "\n\nGlyphs in hex: " + glyph + "\n\nGlyphs in [icons](https://nmsce.com/glyph.html?a=" + addr + ")"
                        } else if (glyph)
                            str = "Glyphs in hex: " + glyph + "\n\nGlyphs in [icons](https://nmsce.com/glyph.html?a=" + glyph + ")"

                        post.remove()

                        op.reply(str + "\n\n----\nThis is a comment generated by the NMSCE bot. For instructions post !help as a comment.")
                            .distinguish({
                                sticky: true
                            })
                            .lock()
                    }
                }
            }
        }
    }
}

function validatePosts(posts) {
    let flair

    for (let post of posts) {
        let ok = post.link_flair_text
        let reason = ""

        if (!post.name.includes("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        if (ok)
            ok = (flair = getItem(flairList, post.link_flair_text)) !== null

        if (!ok) {
            if (!post.removed_by_category) {
                console.log("bot remove bad flair", "https://reddit.com" + post.permalink)
                post.save().remove()
                    .reply(missingFlair)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.log("error 12", typeof err === "string" ? err : JSON.stringify(err)))
            }

            continue
        }

        if (ok)
            ok = checkPostLimits(post)

        if (!ok || flair.noedit)
            continue

        let galaxy, platform, mode

        if (flair && flair.galaxy) {
            galaxy = checkList(galaxyList, post)
            if (!galaxy) {
                reason += (reason ? ", " : "") + "galaxy"
                ok = false
            }
        }

        if (flair && flair.platform) {
            platform = checkList(platformList, post)
            if (!platform) {
                reason += (reason ? ", " : "") + "platform"
                ok = false
            }
        }

        if (flair && flair.mode) {
            mode = checkList(modeList, post)
            if (!mode) {
                reason += (reason ? ", " : "") + "game mode"
                ok = false
            }
        }

        if (ok) {
            let newFlair = flair.name + /*(post.title.match(/repost/i) ? " Repost" : "") +*/ "/" +
                galaxy.name + (flair.platform ? "/" + platform.name : "") +
                (flair.mode ? "/" + mode.name : "") + (flair.version ? "/" + version : "")

            if (newFlair !== post.link_flair_text) {
                console.log("edit", post.link_flair_text, newFlair, "https://reddit.com" + post.permalink)
                post.selectFlair({
                    flair_template_id: post.link_flair_template_id,
                    text: newFlair
                }).catch(err => console.log("error 13", typeof err === "string" ? err : JSON.stringify(err)))
            }

            if ((!flair.sclass || !post.title.match(/s\bclass/i) || post.title.match(/crash|sunk/i)) &&
                (flair.name !== "Starship" || !post.title.match(/black/i)) &&
                (!flair.station || !post.title.match(/trade(ing|rs)?.?(post|station)|\bss\b|\btp\b|space.?station|\bwave\b|\bx.?box|ps4|\bpc\b|normal|creative|\bpd\b|survival|perma.?death/i)) &&
                (post.banned_by && post.banned_by.name === "nmsceBot" || post.removed_by_category === "automod_filtered" ||
                    post.removed_by_category === "reddit" || post.mod_reports.length > 0)) {

                let approve = true
                if (Array.isArray(post.mod_reports))
                    for (let r of post.mod_reports) {
                        if (r[0].includes("rule") || r[0].includes("missing")) {
                            approve = false
                            break
                        }
                    }

                if (approve && !post.title.match(/repost/i)) {
                    console.log("approve", newFlair, "https://reddit.com" + post.permalink)
                    post.approve()
                        .catch(err => console.log("error 14", typeof err === "string" ? err : JSON.stringify(err)))
                }
            }
        } else if (reason && !post.removed_by_category) {
            console.log("bot remove missing", reason, "https://reddit.com" + post.permalink)
            post.save().remove()
                .reply(editFlair.replace(/\[missing\]/g, reason))
                .distinguish({
                    status: true
                }).lock()
                .catch(err => console.log("error 15", typeof err === "string" ? err : JSON.stringify(err)))
        }
    }
}

var userPosts = []

async function checkPostLimits(post) {
    if (post.banned_by || post.removed_by_category === "automod_filtered" ||
        post.removed_by_category === "reddit" || post.mod_reports.length > 0 ||
        post.approved_by !== null && post.approved_by !== "nmsceBot")
        return true

        let user = userPosts.find(a => {
            return a.name === post.author.name
        })

        if (typeof user === "undefined") {
            let user = {}
            user.name = post.author.name
            user.posts = {}
            user.posts[post.created] = post
            userPosts.push(user)
        } else {
            let date = parseInt(new Date().valueOf() / 1000 - 24 * 60 * 60)
            user.posts[post.created] = post

            let keys = Object.keys(user.posts)
            for (let key of keys)
                if (key < date)
                    delete user.posts[key]

            date = parseInt(keys[keys.length - 1]) - 55 * 60

            if (keys.length > 10 || keys.length > 2 && parseInt(keys[keys.length - 3]) > date) {
                let message = removePost + "\n\n----\n" + rules[9] + "\n\n----\n" + botSig

                console.log("exceded ", keys.length > 10 ? "10/day" : "2/hour", user.name, "https://reddit.com" + user.posts[keys[0]].permalink)

                user.posts[keys[keys.length-1]].reply(message)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.log("error a", typeof err === "string" ? err : JSON.stringify(err)))

                user.posts[keys[keys.length-1]].report({
                        reason: "rule 9 exceded posting limits"
                    }).remove()
                    .catch(err => console.log("error b", typeof err === "string" ? err : JSON.stringify(err)))

                delete user.posts[keys[keys.length-1]]

                return false
            }
        }

    return true
}

function getVotes(op, newFlair) {
    sub.search({
        query: "subreddit:nmscoordinateexchange flair:community",
        limit: 1000,
        time: "month"
    }).then(posts => {
        let text = "Total submissions: " + posts.length + "  \n"

        let p = []
        let total = 0

        let flairobj = getItem(flairList, newFlair)

        for (let post of posts) {
            let flair = flairobj ? post.link_flair_text.replace(/community event(.*)/i, flairobj.name + "$1") : null

            p.push({
                link: post.permalink,
                vote: post.ups + post.downs,
                title: post.title,
                // flair: flair
            })
            total += post.ups + post.downs

            // text += post.link_flair_text + " " + flair + " " + flairobj.id + "  \n"

            if (flair)
                post.selectFlair({
                    text: flair,
                    flair_template_id: flairobj.id
                })
        }

        p.sort((a, b) => {
            return b.vote - a.vote
        })

        text += "Total votes: " + total + "  \n"
        for (let i = 0; i < 10; ++i)
            text += p[i].vote + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

        r.composeMessage({
            to: op.author,
            subject: "Community Event",
            text: text
        }).catch(err => console.log("error 16", typeof err === "string" ? err : JSON.stringify(err)))

        op.remove()
            .catch(err => console.log("error 17", typeof err === "string" ? err : JSON.stringify(err)))

    }).catch(err => {
        console.log("error 18", typeof err === "string" ? err : JSON.stringify(err))
    })
}

function addressToXYZ(addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    }

    // xxx:yyy:zzz:sss
    if (addr) {
        out.p = 0
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

function glyphToAddr(glyph) {
    //const portalFormat = "psssyyzzzxxx"

    if (glyph) {
        let xyz = {}
        xyz.p = parseInt(glyph.slice(0, 1), 16)
        xyz.s = parseInt(glyph.slice(1, 4), 16)
        xyz.y = (parseInt(glyph.slice(4, 6), 16) - 0x81) & 0xff
        xyz.z = (parseInt(glyph.slice(6, 9), 16) - 0x801) & 0xfff
        xyz.x = (parseInt(glyph.slice(9, 12), 16) - 0x801) & 0xfff

        return xyzToAddress(xyz)
    }

    return ""
}

function addrToGlyph(addr, planet) {
    let s = ""
    //const portalFormat = "psssyyxxxzzz"

    if (addr) {
        let xyz = addressToXYZ(addr)
        let xs = "00" + xyz.s.toString(16).toUpperCase()
        let xx = "00" + (xyz.x + 0x801).toString(16).toUpperCase()
        let xy = "00" + (xyz.y + 0x81).toString(16).toUpperCase()
        let xz = "00" + (xyz.z + 0x801).toString(16).toUpperCase()

        planet = typeof planet === "undefined" || planet === "" || planet < 0 || planet > 15 ? 0 : parseInt(planet)

        s = planet.toString(16).toUpperCase().slice(0, 1)
        s += xs.slice(xs.length - 3)
        s += xy.slice(xy.length - 2)
        s += xz.slice(xz.length - 3)
        s += xx.slice(xx.length - 3)
    }

    return s
}

function checkList(list, post) {
    let item = getItem(list, post.link_flair_text)
    if (!item)
        item = getItem(list, post.title)
    return item
}

function getItem(list, str) {
    if (!str)
        return null

    for (let i = 0; i < list.length; ++i) {
        if (str.match(list[i].match))
            return list[i]
    }

    return null
}

// async function getOldComments() {
//     let month = new Date().getMonth()
//     let list = {}
//     list.authors = {}
//     let oldlist = {}

//     let ref = admin.firestore().doc("bhs/nmsceSubComments")
//     let doc = await ref.get()
//     if (doc.exists) {
//         oldlist = doc.data()

//         for (let a of Object.keys(oldlist.authors)) {
//             list.authors[a] = {}
//             list.authors[a].comments = {}
//             list.authors[a].votes = 0

//             if (oldlist.lastMonth !== month)
//                 list.authors[a][month] = 0
//         }
//     }

//     return sub.getNewComments( /*typeof list.last === "undefined" ?*/ {
//             limit: typeof oldCommentLimit !== "undefined" ? oldCommentLimit : 1000
//         }
//         /*: {
//                before: list.last
//            }*/
//     ).then(async posts => {
//         console.log("votes", posts.length)

//         for (let post of posts) {
//             let name = post.author.name

//             if (typeof list.authors[name] === "undefined") {
//                 list.authors[name] = {}
//                 list.authors[name].comments = {}
//                 list.authors[name].votes = 0
//                 list.authors[name][month] = 0
//             }

//             let author = list.authors[name]
//             let old = doc.exists ? oldlist.authors[name] : null
//             author.votes += post.ups - (old && old.comments[post.name] ? old.comments[post.name] : 1)
//             author[month] += post.ups - (old && old.comments[post.name] ? old.comments[post.name] : 1)
//             author.comments[post.name] = post.ups
//         }

//         for (let a of Object.keys(list.authors)) {
//             let author = list.authors[a]
//             if (author.votes > 0)
//                 console.log(a, author.votes)
//         }

//         await doc.ref.set(list)
//     })
// }

const replyCommands = `List of bot commands

   * !shiploc - reply with comment about ships being available anywhere in the system
   * !shipclass - reply with comment about spawning ship classes
   * !portal - info about portal glyphs
   * !0000:0000:0000:0000 - replace with coordinates. bot will comment with glyphs & link showing glyphs
   * !000000000000 - replace with glyphs. bot will comment with a link showing glyphs
   * !help - this list
`
const replyModCommands = `
---
Moderator Commands:

    * !m-N - Quote rule number N. Specify multiple rules by separating the rule numbers with a comma. e.g !m-1,2
    * !m-rN - Remove post for violating rule number N. Quotes rule.
    * !m-gpmcls - Make comment about missing items where
        *  g = missing galaxy
        *  p = platform
        *  m = mode
        *  c = coordinates or glyphs
        *  l = latitude & longitude
        *  s = screenshot
    * !m-o - Add off topic comment and suggest reposting to nmstg. use with r8
    * !m-f - request op repost using the 'ship request' flair. use with r1
    * !m-d - add comment requesting a better description on future post
    * !m-v[flair] - get current event vote count. Optional new flair name to change. e.g. !m-vStarship
    
    Commands can be concatenated together e.g. !m-gpr2,3o for missing galaxy & platform, remove for violcation of rule 2 & 3 and add offtopic comment`
const respDescription = "In order to help other players find your post using the search-bar you should consider adding a more descriptive title to future post. It is recommended to include main color(s), ship type and major parts. The NMSCE [wiki page](https://www.reddit.com/r/NMSCoordinateExchange/about/wiki/shipparts) has a link to the named parts list for most types of ships."
const respOffTopic = "Since this post is off topic in this sub you might try posting in r/nomansskythegame."
const respShipRequest = "Please repost your request using the 'ship request' flair. The bot will return links to help your search."
const respSearch = "Please search r/NMSCoordinateExchange or the [NMSCE app](https://nmsce.com) before posting your request."
const respS2 = `The first 2 glyphs you find will get you to the **system**. The first glyph of the coordinates is the planet index so either of the first 2 glyphs will get you to this system.`
const respShiploc = `All starships in a given system can be found at the Space Station AND at any Trade Post located within the system. The same ships are available on all platforms and game modes. Things to check if you don't find the ship you're looking for. 1) Are you in the correct galaxy. 2) Are you in the correct system. It's very easy to enter the glyphs incorrectly so please double check your location.`
const respShipclass = `Each individually spawned ship has a random class & number of slots. In a T3, wealthy, system a ship has a 2% chance of spawning as an S class. In a T2, developing, economy the percentage is 1%. In a T1 0%. The range of slots is based on the configuration of the ship. An S class ship will have the max possible number of slots in it's range. Only crashed ships have a fixed configuration of size and class.`
const respPortal = `The first glyph of a portal address is the planet index. If you are going to pick up a ship then this character doesn't matter. It is usually given as 0 which will take you to the first planet in a system. For other items the glyph given should take you to the correct planet. The remaining 11 digits are the system address.`
// const respWildBase = `Before anything else **TURN OFF MULTIPLAYER AND DISCONNECT YOUR PC/CONSOLE FROM THE INTERNET**\n

// * Go to a Portal and input the glyphs provided in the post.\n
// * Once you’re on the other side. Go to the planetary latitude and longitude coordinates provided in the post.\n
// * When you get there you will find the Unclaimed Wild Base Computer.\n
// * Claim the base as yours (this is why turning multiplayer off is important) and then build a Teleporter.\n
// * Go back through the Portal you came in.\nOnce you're back in your home system, summon the Anomaly (aka the Nexus) and go to the big Teleporter in the back of it. Then teleport back to the wild base you just claimed - this is the only way to get back to it.\n
// * Once you are teleported to your new base there is no Portal Interference anymore.\n

// Make sure you **DO NOT UPLOAD** this Wild Base Computer. It is advised to DELETE the Wild Base Computer and build another base at least 500u away BEFORE turning multiplayer back on.`
const missingInfo = 'Thank You for posting to r/NMSCoordinateExchange. Your post is missing the required [missing]. Please, edit your post to include the missing information and remember to include it in your next post.'
const missingFlair = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because the flair was missing or unrecognized. Please, repost using the correct flair.'
const editFlair = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because the flair or title did not contain the required [missing]. If you correct the flair within 24 hours it will be re-approved. You can edit the flair after the post is made. When you select the flair you can edit the text in the box. In the app there is an edit button you need to press.'
const removePost = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmsceBot. The bot works based on selected flair & title. It is possible the incorrect action was taken if the flair selected was incorrect. Please, double check your flair selection and repost if it was incorrect. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NMSCoordinateExchange).*"

const flairList = [{
    match: /Starship/i,
    name: "Starship",
    galaxy: true,
    sclass: true,
    station: true,
    version: true,
    id: "41384622-0123-11e9-b9f1-0ec22fa6984a"
}, {
    match: /Living Ship/i,
    name: "Living Ship",
    galaxy: true,
    version: true,
    id: "2c4a6250-709d-11ea-805c-0ee48b1610a3"
}, {
    match: /Multi Tool/i,
    name: "Multi Tool",
    galaxy: true,
    version: true,
    id: "3f6af1de-02c5-11e9-93f4-0e9e9df057fe"
}, {
    match: /Derelict Freighter/i,
    name: "Derelict Freighter",
    galaxy: true,
    version: true,
    id: "0f48ed4c-c94f-11ea-bdb0-0e37ef4aee8f"
}, {
    match: /Freighter/i,
    name: "Freighter",
    galaxy: true,
    sclass: true,
    version: true,
    id: "f4e8c824-dc40-11e9-9845-0e4351d5a984"
}, {
    match: /Frigate/i,
    name: "Frigate",
    galaxy: true,
    sclass: true,
    version: true,
    id: "f4e8c824-dc40-11e9-9845-0e4351d5a984"
}, {
    match: /Wild Base/i,
    name: "Wild Base",
    galaxy: true
}, {
    match: /Base/i,
    name: "Base",
    galaxy: true,
    // platform: true,
    mode: true,
    version: true,
    id: "d10b49f8-7dac-11e7-9444-0ef61ee650f0"
}, {
    match: /Farm/i,
    name: "Farm",
    galaxy: true,
    // platform: true,
    mode: true,
    version: true,
    id: "d10b49f8-7dac-11e7-9444-0ef61ee650f0"
}, {
    match: /Fauna/i,
    name: "Fauna",
    galaxy: true,
    version: true,
    id: "7067471e-7326-11eb-ad17-0ef6cf5a16d9"
}, {
    match: /Planet/i,
    name: "Planet",
    galaxy: true,
    version: true,
    id: "6e0d3aa0-7b33-11ea-9e9f-0ee0e4c45271"
}, {
    match: /Event/i,
    name: "Community Event",
    galaxy: true,
    version: true,
    id: ""
}, {
    match: /Request|Showcase|Question|Tips|Information|Top|Mod|NEWS|Removed|Best|Member/i,
    noedit: true
}, ]

const platformList = [{
    match: /\bPC\b|steam/i,
    name: "PC"
}, {
    match: /X.?Box/i,
    name: "XBox"
}, {

    match: /PS4|PS5|\bPS\b/i,
    name: "PS"
}]

const modeList = [{
    match: /Norm.*\b/i,
    name: "Normal"
}, {
    match: /Creative/i,
    name: "Creative"
}, {
    match: /Permadeath|\bPD\b/i,
    name: "Permadeath"
}, {
    match: /Survival/i,
    name: "Survival"
}, {
    match: /Exped\w+[ns]\b|Explor\w+[rn]\b/i,
    name: "Expedition"
}]

const galaxyList = [{
    match: /\bEucl\w+d\b/i,
    name: "Euclid"
}, {
    match: /\bHilb\w+t\b(Dim\w+n\b)?/i,
    name: "Hilbert"
}, {
    match: /\bCaly\w+o\b/i,
    name: "Calypso"
}, {
    match: /\bHesp\w+s\b(Dim\w+n\b)?/i,
    name: "Hesperius"
}, {
    match: /\bHyad\w+s\b/i,
    name: "Hyades"
}, {
    match: /\bIckj\w+w\b/i,
    name: "Ickjamatew"
}, {
    match: /\bBudu\w+r\b/i,
    name: "Budullangr"
}, {
    match: /\bKiko\w+r\b/i,
    name: "Kikolgallr"
}, {
    match: /\bElti\w+n\b/i,
    name: "Eltiensleen"
}, {
    match: /\bEis{1,2}\w+[mn]\b/i,
    name: "Eissentam"
}, {
    match: /\bElk[ua]\w+s\b/i,
    name: "Elkupalos"
}, {
    match: /\bApta\w+a\b/i,
    name: "Aptarkaba"
}, {
    match: /\bOnti\w+p\b/i,
    name: "Ontiniangp"
}, {
    match: /\bOdiw\w+i\b/i,
    name: "Odiwagiri"
}, {
    match: /\bOgti\w+i\b/i,
    name: "Ogtialabi"
}, {
    match: /\bMuha\w+o\b/i,
    name: "Muhacksonto"
}, {
    match: /\bHito\w+r\b/i,
    name: "Hitonskyer"
}, {
    match: /\bRera\w+l\b/i,
    name: "Rerasmutul"
}, {
    match: /\bIsdo\w+g\b/i,
    name: "Isdoraijung"
}, {
    match: /\bDoct\w+a\b/i,
    name: "Doctinawyra"
}, {
    match: /\bLoyc\w+q\b/i,
    name: "Loychazinq"
}, {
    match: /\bZuka\w+a\b/i,
    name: "Zukasizawa"
}, {
    match: /\bEkwa\w+e\b/i,
    name: "Ekwathore"
}, {
    match: /\bYebe\w+e\b/i,
    name: "Yeberhahne"
}, {
    match: /\bTwer\w+k\b/i,
    name: "Twerbetek"
}, {
    match: /\bSiva\w+s\b/i,
    name: "Sivarates"
}, {
    match: /\bEaje\w+l\b/i,
    name: "Eajerandal"
}, {
    match: /\bAldu\w+i\b/i,
    name: "Aldukesci"
}, {
    match: /\bWoty\w+i\b/i,
    name: "Wotyarogii"
}, {
    match: /\bSudz\w+l\b/i,
    name: "Sudzerbal"
}, {
    match: /\bMaup\w+y\b/i,
    name: "Maupenzhay"
}, {
    match: /\bSugu\w+e\b/i,
    name: "Sugueziume"
}, {
    match: /\bBrog\w+n\b/i,
    name: "Brogoweldian"
}, {
    match: /\bEhbo\w+u\b/i,
    name: "Ehbogdenbu"
}, {
    match: /\bIjse\w+s\b/i,
    name: "Ijsenufryos"
}, {
    match: /\bNipi\w+a\b/i,
    name: "Nipikulha"
}, {
    match: /\bAuts\w+n\b/i,
    name: "Autsurabin"
}, {
    match: /\bLuso\w+h\b/i,
    name: "Lusontrygiamh"
}, {
    match: /\bRewm\w+a\b/i,
    name: "Rewmanawa"
}, {
    match: /\bEthi\w+e\b/i,
    name: "Ethiophodhe"
}, {
    match: /\bUras\w+e\b/i,
    name: "Urastrykle"
}, {
    match: /\bXobe\w+j\b/i,
    name: "Xobeurindj"
}, {
    match: /\bOnii\w+u\b/i,
    name: "Oniijialdu"
}, {
    match: /\bWuce\w+c\b/i,
    name: "Wucetosucc"
}, {
    match: /\bEbye\w+f\b/i,
    name: "Ebyeloof"
}, {
    match: /\bOdya\w+a\b/i,
    name: "Odyavanta"
}, {
    match: /\bMile\w+i\b/i,
    name: "Milekistri"
}, {
    match: /\bWafe\w+h\b/i,
    name: "Waferganh"
}, {
    match: /\bAgnu\w+t\b/i,
    name: "Agnusopwit"
}, {
    match: /\bT[ae]ya\w+y\b/i,
    name: "Teyaypilny"
}, {
    match: /\bZali\w+m\b/i,
    name: "Zalienkosm"
}, {
    match: /\bLadg\w+f\b/i,
    name: "Ladgudiraf"
}, {
    match: /\bMush\w+e\b/i,
    name: "Mushonponte"
}, {
    match: /\bAmse\w+z\b/i,
    name: "Amsentisz"
}, {
    match: /\bFlad\w+m\b/i,
    name: "Fladiselm"
}, {
    match: /\bLaan\w+b\b/i,
    name: "Laanawemb"
}, {
    match: /\bIlke\w+r\b/i,
    name: "Ilkerloor"
}, {
    match: /\bDava\w+i\b/i,
    name: "Davanossi"
}, {
    match: /\bPloe\w+u\b/i,
    name: "Ploehrliou"
}, {
    match: /\bCorp\w+a\b/i,
    name: "Corpinyaya"
}, {
    match: /\bLeck\w+m\b/i,
    name: "Leckandmeram"
}, {
    match: /\bQuul\w+s\b/i,
    name: "Quulngais"
}, {
    match: /\bNoko\w+l\b/i,
    name: "Nokokipsechl"
}, {
    match: /\bRinb\w+a\b/i,
    name: "Rinblodesa"
}, {
    match: /\bLoyd\w+n\b/i,
    name: "Loydporpen"
}, {
    match: /\bIbtr\w+p\b/i,
    name: "Ibtrevskip"
}, {
    match: /\bElko\w+b\b/i,
    name: "Elkowaldb"
}, {
    match: /\bHeho\w+o\b/i,
    name: "Heholhofsko"
}, {
    match: /\bYebr\w+d\b/i,
    name: "Yebrilowisod"
}, {
    match: /\bHusa\w+i\b/i,
    name: "Husalvangewi"
}, {
    match: /\bOvna[\w']+d\b/i,
    name: "Ovna'uesed"
}, {
    match: /\bBahi\w+y\b/i,
    name: "Bahibusey"
}, {
    match: /\bNuyb\w+e\b/i,
    name: "Nuybeliaure"
}, {
    match: /\bDosh\w+c\b/i,
    name: "Doshawchuc"
}, {
    match: /\bRuck\w+h\b/i,
    name: "Ruckinarkh"
}, {
    match: /\bThor\w+c\b/i,
    name: "Thorettac"
}, {
    match: /\bNupo\w+u\b/i,
    name: "Nuponoparau"
}, {
    match: /\bMogl\w+l\b/i,
    name: "Moglaschil"
}, {
    match: /\bUiwe\w+e\b/i,
    name: "Uiweupose"
}, {
    match: /\bNasm\w+e\b/i,
    name: "Nasmilete"
}, {
    match: /\bEkda\w+n\b/i,
    name: "Ekdaluskin"
}, {
    match: /\bHaka\w+y\b/i,
    name: "Hakapanasy"
}, {
    match: /\bDimo\w+a\b/i,
    name: "Dimonimba"
}, {
    match: /\bCaja\w+i\b/i,
    name: "Cajaccari"
}, {
    match: /\bOlon\w+o\b/i,
    name: "Olonerovo"
}, {
    match: /\bUmla\w+k\b/i,
    name: "Umlanswick"
}, {
    match: /\bHena\w+m\b/i,
    name: "Henayliszm"
}, {
    match: /\bUtze\w+e\b/i,
    name: "Utzenmate"
}, {
    match: /\bUmir\w+a\b/i,
    name: "Umirpaiya"
}, {
    match: /\bPaho\w+g\b/i,
    name: "Paholiang"
}, {
    match: /\bIaer\w+a\b/i,
    name: "Iaereznika"
}, {
    match: /\bYudu\w+h\b/i,
    name: "Yudukagath"
}, {
    match: /\bBoea\w+j\b/i,
    name: "Boealalosnj"
}, {
    match: /\bYaev\w+o\b/i,
    name: "Yaevarcko"
}, {
    match: /\bCoel\w+p\b/i,
    name: "Coellosipp"
}, {
    match: /\bWayn\w+u\b/i,
    name: "Wayndohalou"
}, {
    match: /\bSmod\w+l\b/i,
    name: "Smoduraykl"
}, {
    match: /\bApma\w+u\b/i,
    name: "Apmaneessu"
}, {
    match: /\bHica\w+v\b/i,
    name: "Hicanpaav"
}, {
    match: /\bAkva\w+a\b/i,
    name: "Akvasanta"
}, {
    match: /\bTuyc\w+r\b/i,
    name: "Tuychelisaor"
}, {
    match: /\bRivs\w+e\b/i,
    name: "Rivskimbe"
}, {
    match: /\bDaks\w+x\b/i,
    name: "Daksanquix"
}, {
    match: /\bKiss\w+n\b/i,
    name: "Kissonlin"
}, {
    match: /\bAedi\w+l\b/i,
    name: "Aediabiel"
}, {
    match: /\bUlos\w+k\b/i,
    name: "Ulosaginyik"
}, {
    match: /\bRocl\w+r\b/i,
    name: "Roclaytonycar"
}, {
    match: /\bKich\w+a\b/i,
    name: "Kichiaroa"
}, {
    match: /\bIrce\w+y\b/i,
    name: "Irceauffey"
}, {
    match: /\bNudq\w+e\b/i,
    name: "Nudquathsenfe"
}, {
    match: /\bGeta\w+l\b/i,
    name: "Getaizakaal"
}, {
    match: /\bHans\w+n\b/i,
    name: "Hansolmien"
}, {
    match: /\bBloy\w+a\b/i,
    name: "Bloytisagra"
}, {
    match: /\bLads\w+y\b/i,
    name: "Ladsenlay"
}, {
    match: /\bLuyu\w+r\b/i,
    name: "Luyugoslasr"
}, {
    match: /\bUbre\w+k\b/i,
    name: "Ubredhatk"
}, {
    match: /\bCido\w+a\b/i,
    name: "Cidoniana"
}, {
    match: /\bJasi\w+a\b/i,
    name: "Jasinessa"
}, {
    match: /\bTorw\w+f\b/i,
    name: "Torweierf"
}, {
    match: /\bSaff\w+m\b/i,
    name: "Saffneckm"
}, {
    match: /\bThni\w+r\b/i,
    name: "Thnistner"
}, {
    match: /\bDotu\w+g\b/i,
    name: "Dotusingg"
}, {
    match: /\bLule\w+s\b/i,
    name: "Luleukous"
}, {
    match: /\bJelm\w+n\b/i,
    name: "Jelmandan"
}, {
    match: /\bOtim\w+o\b/i,
    name: "Otimanaso"
}, {
    match: /\bEnja\w+o\b/i,
    name: "Enjaxusanto"
}, {
    match: /\bSezv\w+w\b/i,
    name: "Sezviktorew"
}, {
    match: /\bZike\w+m\b/i,
    name: "Zikehpm"
}, {
    match: /\bBeph\w+h\b/i,
    name: "Bephembah"
}, {
    match: /\bBroo\w+i\b/i,
    name: "Broomerrai"
}, {
    match: /\bMexi\w+a\b/i,
    name: "Meximicka"
}, {
    match: /\bVene\w+a\b/i,
    name: "Venessika"
}, {
    match: /\bGait\w+g\b/i,
    name: "Gaiteseling"
}, {
    match: /\bZosa\w+o\b/i,
    name: "Zosakasiro"
}, {
    match: /\bDraj\w+s\b/i,
    name: "Drajayanes"
}, {
    match: /\bOoib\w+r\b/i,
    name: "Ooibekuar"
}, {
    match: /\bUrck\w+i\b/i,
    name: "Urckiansi"
}, {
    match: /\bDozi\w+o\b/i,
    name: "Dozivadido"
}, {
    match: /\bEmie\w+s\b/i,
    name: "Emiekereks"
}, {
    match: /\bMeyk\w+r\b/i,
    name: "Meykinunukur"
}, {
    match: /\bKimy\w+h\b/i,
    name: "Kimycuristh"
}, {
    match: /\bRoan\w+n\b/i,
    name: "Roansfien"
}, {
    match: /\bIsga\w+o\b/i,
    name: "Isgarmeso"
}, {
    match: /\bDait\w+i\b/i,
    name: "Daitibeli"
}, {
    match: /\bGucu\w+k\b/i,
    name: "Gucuttarik"
}, {
    match: /\bEnla\w+e\b/i,
    name: "Enlaythie"
}, {
    match: /\bDrew\w+e\b/i,
    name: "Drewweste"
}, {
    match: /\bAkbu\w+i\b/i,
    name: "Akbulkabi"
}, {
    match: /\bHoms\w+w\b/i,
    name: "Homskiw"
}, {
    match: /\bZava\w+i\b/i,
    name: "Zavainlani"
}, {
    match: /\bJewi\w+s\b/i,
    name: "Jewijkmas"
}, {
    match: /\bItlh\w+a\b/i,
    name: "Itlhotagra"
}, {
    match: /\bPoda\w+s\b/i,
    name: "Podalicess"
}, {
    match: /\bHivi\w+r\b/i,
    name: "Hiviusauer"
}, {
    match: /\bHals\w+k\b/i,
    name: "Halsebenk"
}, {
    match: /\bPuik\w+c\b/i,
    name: "Puikitoac"
}, {
    match: /\bGayb\w+a\b/i,
    name: "Gaybakuaria"
}, {
    match: /\bGrbo\w+e\b/i,
    name: "Grbodubhe"
}, {
    match: /\bRyce\w+r\b/i,
    name: "Rycempler"
}, {
    match: /\bIndj\w+a\b/i,
    name: "Indjalala"
}, {
    match: /\bFont\w+k\b/i,
    name: "Fontenikk"
}, {
    match: /\bPasy\w+e\b/i,
    name: "Pasycihelwhee"
}, {
    match: /\bIkba\w+t\b/i,
    name: "Ikbaksmit"
}, {
    match: /\bTeli\w+s\b/i,
    name: "Telicianses"
}, {
    match: /\bOyle\w+n\b/i,
    name: "Oyleyzhan"
}, {
    match: /\bUage\w+t\b/i,
    name: "Uagerosat"
}, {
    match: /\bImpo\w+n\b/i,
    name: "Impoxectin"
}, {
    match: /\bTwoo\w+d\b/i,
    name: "Twoodmand"
}, {
    match: /\bHilf\w+s\b/i,
    name: "Hilfsesorbs"
}, {
    match: /\bEzda\w+t\b/i,
    name: "Ezdaranit"
}, {
    match: /\bWien\w+e\b/i,
    name: "Wiensanshe"
}, {
    match: /\bEwhe\w+c\b/i,
    name: "Ewheelonc"
}, {
    match: /\bLitz\w+a\b/i,
    name: "Litzmantufa"
}, {
    match: /\bEmar\w+i\b/i,
    name: "Emarmatosi"
}, {
    match: /\bMufi\w+i\b/i,
    name: "Mufimbomacvi"
}, {
    match: /\bWong\w+m\b/i,
    name: "Wongquarum"
}, {
    match: /\bHapi\w+a\b/i,
    name: "Hapirajua"
}, {
    match: /\bIgbi\w+a\b/i,
    name: "Igbinduina"
}, {
    match: /\bWepa\w+s\b/i,
    name: "Wepaitvas"
}, {
    match: /\bStha\w+i\b/i,
    name: "Sthatigudi"
}, {
    match: /\bYeka\w+n\b/i,
    name: "Yekathsebehn"
}, {
    match: /\bEbed\w+t\b/i,
    name: "Ebedeagurst"
}, {
    match: /\bNoli\w+a\b/i,
    name: "Nolisonia"
}, {
    match: /\bUlex\w+b\b/i,
    name: "Ulexovitab"
}, {
    match: /\bIodh\w+s\b/i,
    name: "Iodhinxois"
}, {
    match: /\bIrro\w+s\b/i,
    name: "Irroswitzs"
}, {
    match: /\bBifr\w+t\b/i,
    name: "Bifredait"
}, {
    match: /\bBeir\w+e\b/i,
    name: "Beiraghedwe"
}, {
    match: /\bYeon\w+k\b/i,
    name: "Yeonatlak"
}, {
    match: /\bCugn\w+h\b/i,
    name: "Cugnatachh"
}, {
    match: /\bNozo\w+i\b/i,
    name: "Nozoryenki"
}, {
    match: /\bEbra\w+i\b/i,
    name: "Ebralduri"
}, {
    match: /\bEvci\w+j\b/i,
    name: "Evcickcandj"
}, {
    match: /\bZiyb\w+n\b/i,
    name: "Ziybosswin"
}, {
    match: /\bHepe\w+t\b/i,
    name: "Heperclait"
}, {
    match: /\bSugi\w+m\b/i,
    name: "Sugiuniam"
}, {
    match: /\bAase\w+h\b/i,
    name: "Aaseertush"
}, {
    match: /\bUgly\w+a\b/i,
    name: "Uglyestemaa"
}, {
    match: /\bHore\w+h\b/i,
    name: "Horeroedsh"
}, {
    match: /\bDrun\w+o\b/i,
    name: "Drundemiso"
}, {
    match: /\bItya\w+t\b/i,
    name: "Ityanianat"
}, {
    match: /\bPurn\w+e\b/i,
    name: "Purneyrine"
}, {
    match: /\bDoki\w+t\b/i,
    name: "Dokiessmat"
}, {
    match: /\bNupi\w+h\b/i,
    name: "Nupiacheh"
}, {
    match: /\bDihe\w+j\b/i,
    name: "Dihewsonj"
}, {
    match: /\bRudr\w+k\b/i,
    name: "Rudrailhik"
}, {
    match: /\bTwer\w+t\b/i,
    name: "Tweretnort"
}, {
    match: /\bSnat\w+e\b/i,
    name: "Snatreetze"
}, {
    match: /\bIwun\w+s\b/i,
    name: "Iwunddaracos"
}, {
    match: /\bDiga\w+a\b/i,
    name: "Digarlewena"
}, {
    match: /\bErqu\w+a\b/i,
    name: "Erquagsta"
}, {
    match: /\bLogo\w+n\b/i,
    name: "Logovoloin"
}, {
    match: /\bBoya\w+h\b/i,
    name: "Boyaghosganh"
}, {
    match: /\bKuol\w+u\b/i,
    name: "Kuolungau"
}, {
    match: /\bPehn\w+t\b/i,
    name: "Pehneldept"
}, {
    match: /\bYeve\w+n\b/i,
    name: "Yevettiiqidcon"
}, {
    match: /\bSahl\w+u\b/i,
    name: "Sahliacabru"
}, {
    match: /\bNogg\w+r\b/i,
    name: "Noggalterpor"
}, {
    match: /\bChma\w+i\b/i,
    name: "Chmageaki"
}, {
    match: /\bVeti\w+a\b/i,
    name: "Veticueca"
}, {
    match: /\bVitt\w+l\b/i,
    name: "Vittesbursul"
}, {
    match: /\bNoot\w+e\b/i,
    name: "Nootanore"
}, {
    match: /\bInne\w+h\b/i,
    name: "Innebdjerah"
}, {
    match: /\bKisv\w+i\b/i,
    name: "Kisvarcini"
}, {
    match: /\bCuzc\w+r\b/i,
    name: "Cuzcogipper"
}, {
    match: /\bPama\w+u\b/i,
    name: "Pamanhermonsu"
}, {
    match: /\bBrot\w+k\b/i,
    name: "Brotoghek"
}, {
    match: /\bMibi\w+a\b/i,
    name: "Mibittara"
}, {
    match: /\bHuru\w+i\b/i,
    name: "Huruahili"
}, {
    match: /\bRald\w+n\b/i,
    name: "Raldwicarn"
}, {
    match: /\bEzda\w+c\b/i,
    name: "Ezdartlic"
}, {
    match: /\bBade\w+a\b/i,
    name: "Badesclema"
}, {
    match: /\bIsen\w+n\b/i,
    name: "Isenkeyan"
}, {
    match: /\bIado\w+u\b/i,
    name: "Iadoitesu"
}, {
    match: /\bYagr\w+i\b/i,
    name: "Yagrovoisi"
}, {
    match: /\bEwco\w+o\b/i,
    name: "Ewcomechio"
}, {
    match: /\bInun\w+a\b/i,
    name: "Inunnunnoda"
}, {
    match: /\bDisc\w+n\b/i,
    name: "Dischiutun"
}, {
    match: /\bYuwa\w+a\b/i,
    name: "Yuwarugha"
}, {
    match: /\bIalm\w+a\b/i,
    name: "Ialmendra"
}, {
    match: /\bRepo\w+e\b/i,
    name: "Reponudrle"
}, {
    match: /\bRinj\w+o\b/i,
    name: "Rinjanagrbo"
}, {
    match: /\bZezi\w+h\b/i,
    name: "Zeziceloh"
}, {
    match: /\bOeil\w+c\b/i,
    name: "Oeileutasc"
}, {
    match: /\bZicn\w+s\b/i,
    name: "Zicniijinis"
}, {
    match: /\bDugn\w+a\b/i,
    name: "Dugnowarilda"
}, {
    match: /\bNeux\w+n\b/i,
    name: "Neuxoisan"
}, {
    match: /\bIlme\w+n\b/i,
    name: "Ilmenhorn"
}, {
    match: /\bRukw\w+u\b/i,
    name: "Rukwatsuku"
}, {
    match: /\bNepi\w+u\b/i,
    name: "Nepitzaspru"
}, {
    match: /\bChce\w+g\b/i,
    name: "Chcehoemig"
}, {
    match: /\bHaff\w+n\b/i,
    name: "Haffneyrin"
}, {
    match: /\bUlic\w+i\b/i,
    name: "Uliciawai"
}, {
    match: /\bTuhg\w+d\b/i,
    name: "Tuhgrespod"
}, {
    match: /\bIous\w+a\b/i,
    name: "Iousongola"
}, {
    match: /\bOdya\w+i\b/i,
    name: "Odyalutai"
}]