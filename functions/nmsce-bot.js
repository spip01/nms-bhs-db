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

It shouldn't approve post removed by any moderator
*/

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var mods = []
var rules = {}
var lastPost = {}
const version = 4.00

// main()
// async function main() {

exports.nmsceBot = async function () {

    if (!sub) {
        console.log("new instance")
    r.config({
        continueAfterRatelimitError: true
    })  

        sub = await r.getSubreddit('NMSCoordinateExchange')
  }


    let date = new Date().valueOf() / 1000
    let p = []

    if (Object.keys(rules).length === 0) {
        let r = await sub.getRules()
        for (let x of r.rules) {
            rules[x.priority + 1] = {
                text: x.description
            }

            let lines = x.description.split("\n")
            let c = 1
            for (let i = 0; i < lines.length; ++i) {
                if (lines[i][0] === '-') {
                    rules[x.priority + 1][c++] = lines[i]
                }
            }
        }
    }

    //await sub.getLinkFlairTemplates().then(res => { console.log(res)   })

    //  await   sub.createLinkFlairTemplate({    
    //         flair_css_class: '',
    //         flair_template_id: '0f48ed4c-c94f-11ea-bdb0-0e37ef4aee8f',
    //         flair_text_editable: true,
    //         flair_position: 'right',
    //         flair_text: 'Derelict Freighter/testing'
    // })

    p.push(sub.getNew(!lastPost.name || lastPost.full + 15 * 60 < date ? {
        limit: 100 // make sure to cover 24 hours for posting limit
    } : {
        before: lastPost.name
    }).then(posts => {
        console.log("post", posts.length)

        if (posts.length > 0 || !lastPost.full || lastPost.full + 15 * 60 < date)
            lastPost.full = date

        if (posts.length > 0) {
            lastPost.name = posts[0].name
            checkPostLimits(posts, userPosts, 2, 60 * 60, "Posting limit exceded: OP is allowed 2 post/hour. ")
            checkPostLimits(null, userPosts, 10, 24 * 60 * 60, "Posting limit exceded: OP is allowed 10 post/day. ")
            checkNewPosters(posts, 10)
            validatePosts(posts)
        }
    }).catch(err => error(1, err)))

    if (mods.length === 0) {
        let m = await sub.getModerators()
        for (let x of m)
            mods.push(x.id)
    }

    p.push(sub.getModqueue().then(posts => {
        console.log("queue", posts.length)
        validatePosts(posts, true)
        checkComments(posts, mods)
    }).catch(err => error(3, err)))

    return Promise.all(p)
}

function sleep(ms) { // await sleep(n)
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function checkComments(posts, mods) {
    for (let post of posts) {
        if (post.name.startsWith("t1_") && post.body.startsWith("!") && post.author !== "nmsceBot") {
            let isMod = mods.includes(post.author_fullname)

            console.log("command", post.body)

            if (post.body.includes("!m-") && isMod) {
                let missing = ""
                let rule = ""
                let remove = false
                let offtopic = false
                let description = false

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
                        case "d": // ask for better description
                            description = true
                            break
                        case "v": // get community event votes
                            await getVotes(post)
                            continue
                    }
                }

                match = post.body.replace(/!m-.*?([\d,-]+)/, "$1").split(",")
                for (let i of match) {
                    let r, l = -1
                    if (i.includes("-")) {
                        let m = i.split("-")
                        r = parseInt(m[0])
                        l = parseInt(m[1])

                        if (typeof rules[r] !== "undefined") {
                            if (typeof rules[r][l] !== "undefined")
                                rule += (rule ? "\n\n----\n" : "") + rules[r][l]
                            else if (typeof rules[r] !== "undefined")
                                rule += (rule ? "\n\n----\n" : "") + rules[r].text
                        }
                    } else {
                        r = parseInt(i)

                        if (typeof rules[r] !== "undefined")
                            rule += (rule ? "\n\n----\n" : "") + rules[r].text
                    }
                }

                let message = ""
                if (missing)
                    message += missingInfo.replace(/\[missing\]/g, missing) + "\n\n----\n"
                if (description)
                    message += respDescription + "\n\n----\n"
                if (offtopic)
                    message += respOffTopic + "\n\n----\n"
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
                        }).lock().catch(err => error(5, err))

                    if (remove)
                        op.report({
                            reason: post.author.name + " rule " + match
                        }).remove()
                        .catch(err => error(6, err))
                    else if (!description)
                        op.report({
                            reason: post.author.name + " missing " + missing
                        }).catch(err => error(7, err))

                    post.remove().catch(err => error(8, err))

                    console.log("remove: " + remove, "missing: " + missing, "rule: " + match, "https://reddit.com" + oppost.permalink)
                }
            } else {
                let match = post.body.match(/!\s?(glyphs|yes|light|shiploc|help|shipclass|portal|s2|search|reqflair)/i)

                if (match) {
                    let message = null
                    let reply = null
                    let remove = false

                    switch (match[1]) {
                        case "yes":
                            if (post.author.name !== "AutoModerator") {
                                let op = null
                                let oppost = post
                                // oppost.lock()

                                while (!op || oppost.parent_id) {
                                    op = await r.getComment(oppost.parent_id)
                                    oppost = await op.fetch()
                                }

                                if (oppost.link_flair_text === "Request?") {
                                    if (post.created - oppost.created < 5 * 60) {
                                        console.log("reject request", (post.created - oppost.created) / 60)
                                        post.approve().catch(err => error("8e", err))
                                        post.reply(replyWaitRequest)
                                            .distinguish({
                                                status: true
                                            }).lock().catch(err => error("8a", err))
                                    } else {
                                        console.log("approve request")
                                        post.approve().catch(err => error("8d", err))
                                        oppost.approve().selectFlair({
                                            flair_template_id: oppost.link_flair_template_id,
                                            text: "Request"
                                        }).catch(err => error("8c", err))
                                    }
                                } else {
                                    post.approve().catch(err => error("8e", err))
                                    console.log("!yes ignored flair=", oppost.link_flair_text)
                                }
                            }
                            break
                        case "help":
                            reply = replyCommands
                            if (mods.includes(post.author_fullname))
                                reply += replyModCommands
                            break
                        case "light":
                            message = respLight
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
                        case "s2":
                            message = respS2
                            break
                        case "glyphs":
                            message = respGlyphs
                            break
                        case "search":
                            if (isMod) {
                                message = respSearch
                                remove = true
                            }
                            break
                        case "reqflair":
                            if (isMod) {
                                message = respShipRequest
                                remove = true
                            }
                            break
                    }

                    if (message || reply) {
                        let op = await r.getComment(post.parent_id)

                        if (message)
                            op.reply(message).lock().catch(err => error(9, err))
                        else
                            r.composeMessage({
                                to: post.author,
                                subject: "nmsceBot Commands",
                                text: reply
                            }).catch(err => error(10, err))

                        post.remove().catch(err => error(11, err))

                        if (remove)
                            op.remove().catch(err => error("c", err))

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

                        post.remove().catch(err => error("11a", err))

                        op.reply(str + "\n\n----\nThis is a comment generated by the NMSCE bot. For instructions post !help as a comment.")
                            .distinguish({
                                sticky: true
                            })
                            .lock().catch(err => error("11b", err))
                    }
                }
            }
        }
    }
}


var posters = []

async function checkNewPosters(posts, limit) {
    let p = []

    for (let i = 0; i < limit && i < posts.length; ++i) { // limit number is for a new instance
        let post = posts[i]

        if (posters.includes(post.author.name))
            continue

        p.push(sub.search({
            query: "author:" + post.author.name,
            limit: 2,
            sort: "new"
        }).then(async posts => {
            if (posts.length > 0) {
                if (posts.length === 2 || posts[0].approved_by)
                    posters.push(posts[0].author.name)
                else {
                    console.log("new poster", posts[0].author.name)
                    posts[0].reply("!filter-First Post")
                    // r.composeMessage({
                    //     to: posts[0].author.name,
                    //     subject: "First post to r/NoMansSkyTheGame",
                    //     text: firstPost
                    // }).catch(err => error('f', err))
                }
            }
        }))
    }

    await Promise.all(p)
}

function validatePosts(posts, modqueue) {
    let flair

    for (let post of posts) {
        let ok = post.link_flair_text
        let reason = ""

        if (!post.name.startsWith("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        if (ok)
            ok = (flair = getItem(flairList, post.link_flair_text)) !== null

        if (!ok) {
            if (!post.removed_by || !post.link_flair_text.includes("EDIT")) {
                let approve = true
                if (Array.isArray(post.mod_reports))
                    for (let r of post.mod_reports) {
                        if (r[0].includes("rule") || r[0].includes("missing") || r[0].includes("filter")) {
                            approve = false
                            break
                        }
                    }

                if (approve) {
                    console.log("bad flair", "https://reddit.com" + post.permalink)
                    post.selectFlair({
                        flair_template_id: post.link_flair_template_id,
                        text: post.link_flair_text + "/PLEASE EDIT FLAIR"
                    }).catch(err => error(13, err))

                    post.reply(missingFlair)
                        .distinguish({
                            status: true
                        }).lock().catch(err => error(12, err))

                    post.reply("!filter-bad flair").catch(err => error("12a", err))
                }
            }

            continue
        }

        if (!ok || flair.noedit)
            continue

        let galaxy, platform, mode, archive
        let taxi = false

        if (flair) {
            if (flair.galaxy) {
                galaxy = checkList(galaxyList, post)

                if (!galaxy) {
                    reason += (reason ? ", " : "") + "galaxy"
                    ok = false
                } else if (galaxy.name !== "Euclid") {
                    taxi = true
                }
            }

            if (flair.platform) {
                platform = checkList(platformList, post)
                if (!platform) {
                    reason += (reason ? ", " : "") + "platform"
                    ok = false
                }
            }

            if (flair.mode) {
                mode = checkList(modeList, post)
                if (!mode) {
                    reason += (reason ? ", " : "") + "game mode"
                    ok = false
                }
            }

            archive = post.link_flair_text.match("archive")
        }

        if (ok) {
            let newFlair = flair.name +
                (archive ? " Archive/" : "/") +
                galaxy.name + (flair.platform ? "/" + platform.name : "") +
                (flair.mode ? "/" + mode.name : "") + (flair.version ? "/" + version : "")

            if (newFlair !== post.link_flair_text) {
                console.log("edit", post.link_flair_text, newFlair, "https://reddit.com" + post.permalink)
                post.selectFlair({
                    flair_template_id: post.link_flair_template_id,
                    text: newFlair
                }).catch(err => error(13, err))

                if (taxi) {
                    post.reply(taxiComment).lock().catch(err => error(20, err))
                }
            }

            if (//(!flair.sclass || !post.title.match(/s\bclass/i) || post.title.match(/crash|sunk/i)) &&
                //(flair.name !== "Starship" || !post.title.match(/black/i)) && 
               // (!flair.station || !post.title.match(/rare|unique|ultra|trade(ing|rs)?.?(post|station)|\bss\b|\btp\b|space.?station|\bwave\b|\bx.?box|ps4|\bpc\b|normal|creative|\bpd\b|survival|perma.?death/i)) &&
                (post.banned_by && post.banned_by.name === "nmsceBot" || post.removed_by_category === "automod_filtered" ||
                    post.removed_by_category === "reddit" || post.mod_reports.length > 0)) {

                let approve = true
                if (Array.isArray(post.mod_reports))
                    for (let r of post.mod_reports) {
                        if (r[0].includes("rule") || r[0].includes("missing") || r[0].includes("filter")) {
                            approve = false
                            break
                        }
                    }

                if (approve && !post.title.match(/repost/i)) {
                    console.log("approve", newFlair, "https://reddit.com" + post.permalink)
                    post.approve().catch(err => error(14, err))
                }
            }

        } else if (reason && !post.removed_by_category) {
            console.log("bot remove missing", reason, "https://reddit.com" + post.permalink)
            post.reply(editFlair.replace(/\[missing\]/g, reason))
                .distinguish({
                    status: true,
                    sticky: true
                }).lock().catch(err => error(15, err))
            post.reply("!filter-missing " + reason).catch(err => error("15a", err))
        }
    }
}

var userPosts = []

async function checkPostLimits(posts, postList, limit, time, reason) {
    if (posts)
        for (let post of posts) {
            if (!post.name.includes("t3_") || post.selftext === "[deleted]") // submission
                continue

            let user = postList.find(a => {
                return a.name === post.author.name
            })

            if (typeof user === "undefined") {
                user = {}
                user.name = post.author.name
                user.posts = []
                user.posts.push(post)
                postList.push(user)
            } else if (!user.posts.find(a => {
                    return a.id === post.id
                }))
                user.posts.push(post)
        }

    time -= 5

    for (let user of postList) {
        if (user.posts.length > limit) {
            let posts = user.posts.sort((a, b) => a.created_utc >= b.created_utc ? -1 : 1)
            let refetch = false

            for (let i = 0; i < posts.length - limit; ++i) {
                let n = posts[i].created_utc
                let o = posts[i + limit].created_utc

                if (n < o + time) {
                    if (!refetch) {
                        console.log("check deleted", user.name)
                        refetch = true

                        for (let j = 0; j < posts.length; ++j) {
                            let p = await posts[j].fetch()
                            console.log(p.selftext, p.author.name)
                            if (p.selftext === "[deleted]") {
                                console.log("deleted post", user.name, "https://reddit.com" + posts[i].permalink)
                                posts.splice(j, 1)
                                i = -1
                                continue
                            }
                        }
                    }

                    console.log(reason, user.name, parseInt((n - o + time) / 60), "https://reddit.com" + posts[i].permalink)
                    let message = removePost + "\n\n----\n" + reason + "This post can be reposted after " + (new Date((o + limit) * 1000).toTimeString()) + ".\n\n----\n" + botSig

                    posts[i].reply(message)
                        .distinguish({
                            status: true,
                            sticky: true
                        }).lock()
                        .catch(err => error("a", err))

                    posts[i].report({
                            reason: "posting limits"
                        }).remove()
                        .catch(err => error("b", err))

                    posts.splice(i, 1)
                }
            }

            posts.splice(13, 999) // maximum post limit
        }
    }
}

function getVotes(op) {
    let scanReplies = function (post, replies, voted) {
        let votes = 0

        for (let r of replies) {
            if (r.author.name !== post.author.name) {
                if (emoji) {
                    if (c.body.includes(emoji) && !voted.includes(c.author.name)) {
                        voted.push(c.author.name)
                        votes++
                    }
                } else
                    votes++
            } else
                votes += r.ups - r.downs - 1

            if (r.replies.length > 0)
                votes += scanReplies(post, r.replies, voted)
        }

        return votes
    }

    let emoji = null
    let flair = null

    let matches = op.body.match(/!m-v\s?(\/.*?\/)?\s?(.*)\s?/)
    if (matches.length > 1) {
        if (matches[1] && matches[1].includes("/"))
            emoji = matches[1].slice(1, matches[1].length - 1)

        flair = matches[2]
    }

    let flairobj = getItem(flairList, flair)

    sub.search({
        query: "subreddit:nmscoordinateexchange flair:community",
        limit: 1000,
        time: "month"
    }).then(async posts => {
        let p = []
        let total = 0

        for (let post of posts) {
            let flair = flairobj ? post.link_flair_text.replace(/community event(.*)/i, flairobj.name + "$1") : null
            let replies = await post.expandReplies()

            let voted = []
            let votes = scanReplies(post, replies.comments, voted)

            p.push({
                link: post.permalink,
                votes: !emoji ? post.ups + post.downs + post.total_awards_received + votes : post.total_awards_received + votes,
                title: post.title,
                // flair: flair
            })
            total += post.ups + post.downs + post.total_awards_received + votes

            if (flair)
                post.selectFlair({
                    text: flair,
                    flair_template_id: flairobj.id
                })
        }

        p.sort((a, b) => a.votes >= b.votes ? -1 : 1)

        let text = "Total entries: " + posts.length + " Total votes: " + total + "  \n"
        for (let i = 0; i < 10; ++i)
            text += p[i].votes + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

        r.composeMessage({
            to: op.author,
            subject: "Community Event",
            text: text
        }).catch(err => error(16, err))

        op.remove()
            .catch(err => error(17, err))
    }).catch(err => {
        error(18, err)
    })
}

function error(n, err) {
    console.log("error " + n, err)
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
    if (!item) {
        item = getItem(list, post.title)
    }
    return item
}

function getItem(list, str) {
    if (!str)
        return null

    for (let s of list) {
        if (str.match(s.match))
            return s
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

   * !help - this list
   * !glyphs - reply with comment about using glyph font
   * !light - reply with comment about improving the screenshot
   * !shipclass - reply with comment about spawning ship classes
   * !portal - info about portal glyphs
   * !0000:0000:0000:0000 - replace with coordinates. bot will comment with glyphs & link showing glyphs
   * !000000000000 - replace with glyphs. bot will comment with a link showing glyphs
`
const replyModCommands = `
---
Moderator Commands:

    * !m-N - Quote rule number N. Specify multiple rules by separating the rule numbers with a comma. e.g !m-1,2
    * !m-N-B - Quote rule N bullet point B
    * !m-rN - Remove post for violating rule number N. Quotes rule.
    * !m-gpmcls - Make comment about missing items where
        *  g = missing galaxy
        *  p = platform
        *  m = mode
        *  c = coordinates or glyphs
        *  l = latitude & longitude
        *  s = screenshot
    * !m-o - Add off topic comment and suggest reposting to nmstg. use with r8
    * !m-d - add comment requesting a better description on future post
    * !m-v[/emoji/] [flair] - get current event vote count. Optional emoji vote count, '/' brackets required. Optional new flair name to change. e.g. !m-vStarship
    * !reqflair - request op repost using the 'request' flair. removes post.
    * !search - add comment requesting the op search before posting a request. removes post.
    
    Commands can be concatenated together e.g. !m-gpr2,3o for missing galaxy & platform, remove for violcation of rule 2 & 3 and add offtopic comment`
const respDescription = "In order to help other players find your post using the search-bar you should consider adding a more descriptive title to future post. It is recommended to include main color(s), ship type and major parts. The NMSCE [wiki page](https://www.reddit.com/r/NMSCoordinateExchange/about/wiki/shipparts) has a link to the named parts list for most types of ships."
const respOffTopic = "Since this post is off topic in this sub you might try posting in r/nomansskythegame."
const respShipRequest = "Please repost your request using the 'request' flair. The bot will return links to help your search."
const respSearch = "Please search r/NMSCoordinateExchange or the [NMSCE app](https://nmsce.com) before posting your request."
const respS2 = `The first 2 glyphs you find will get you to the **system**. The first glyph of the coordinates is the planet index so either of the first 2 glyphs will get you to this system.`
const respShiploc = `All starships in a given system can be found at the Space Station AND at any Trade Post located within the system. The same ships are available on all platforms and game modes. Things to check if you don't find the ship you're looking for. 1) Are you in the correct galaxy. 2) Are you in the correct system. It's very easy to enter the glyphs incorrectly so please double check your location.`
const respShipclass = `Each individually spawned ship has a random class & number of slots. In a T3, wealthy, system a ship has a 2% chance of spawning as an S class. In a T2, developing, economy the percentage is 1%. In a T1 0%. The range of slots is based on the configuration of the ship. An S class ship will have the max possible number of slots in it's range. Only crashed ships have a fixed configuration of size and class.`
const respPortal = `The first glyph of a portal address is the planet index. If you are going to pick up a ship then this character doesn't matter. It is usually given as 0 which will take you to the first planet in a system. For other items the glyph given should take you to the correct planet. The remaining 11 digits are the system address.`
const respLight = `To help show off your items in future post you might consider taking your screenshot in a different location and/or repositioning the sun. This will help others to see what is special about your find. For more detailed information see [this](https://www.reddit.com/r/NMSCoordinateExchange/comments/hilovm/found_a_cool_ship_you_wanna_post_make_it_look/) post.`
const respGlyphs = `To improve the visibility of the glyphs in your image install the [glyph font](https://nmsce.com/bin/NMS-Glyphs-Mono.ttf). More information can be found in [this post](https://www.reddit.com/r/NMSCoordinateExchange/comments/oh109y/easy_way_to_add_larger_more_readable_glyphs_to/)`
const missingInfo = 'Thank You for posting to r/NMSCoordinateExchange. Your post is missing the required [missing]. Please, edit your post to include the missing information and remember to include it in your next post.'
const missingFlair = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because the flair was missing or unrecognized. Please, repost using the correct flair.'
const editFlair = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because the flair or title did not contain the required [missing]. If you correct the flair within a reasonable time it be re-approved. You can edit the flair after the post is made. When you select the flair you can edit the text in the box. If everything is included and you still get this message please double check the galaxy spelling.'
const removePost = 'Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmsceBot. The bot works based on selected flair & title. It is possible the incorrect action was taken if the flair selected was incorrect. Please, double check your flair selection and repost if it was incorrect. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NMSCoordinateExchange).*"
const taxiComment = "The item shared in this post is not in the Euclid/1st/starting, galaxy. There are 256 unique galaxies in NMS. Shared glyphs only work for the galaxy they are advertised in.\n\nIf you need help travelling to the galaxy advertised in the flair of this post contact PanGalactic Star Cabs - [Discord link](https://discord.gg/WgUdnbZJjh). They can take you anywhere in the NMS universe for free! Any galaxy, any star system, any platform."
const replyWaitRequest = "Because of a problem with people instantly answering \"!yes\" to the bot there is a 5 min cooldown period before the response will be accepted. Please reply after the cooldown has expired."

const editableFlair = [{
        flair_css_class: '',
        flair_template_id: '6e63cde8-1d38-11e9-866c-0e00040f297e',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Community Event/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: '2c4a6250-709d-11ea-805c-0ee48b1610a3',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Living Ship/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'e977aa8c-02c5-11e9-8f2b-0e562e5fbf7c',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Starship/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'fc094a20-02c5-11e9-95aa-0ed84614f136',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Multi Tool/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'ce1c86e6-736e-11e7-a780-0eb60d2b4f60',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Fauna/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'e7f60d74-0359-11ec-ae40-4e2d82cc6dd4',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Freighter/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'f36f7ac8-0359-11ec-b487-ba8c74aa3d6e',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Frigate/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: '0f48ed4c-c94f-11ea-bdb0-0e37ef4aee8f',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Derelict Freighter/EDIT GALAXY'
    },
    {
        flair_css_class: '',
        flair_template_id: 'd10b49f8-7dac-11e7-9444-0ef61ee650f0',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Base/EDIT GALAXY/MODE'
    },
    {
        flair_css_class: '',
        flair_template_id: '68d6a4f4-4422-11ec-887b-7e1b4e688c8e',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Farm/EDIT GALAXY/MODE'
    },
    {
        flair_css_class: '',
        flair_template_id: '8a3e63ca-0359-11ec-89a9-9283e9a30240',
        flair_text_editable: true,
        flair_position: 'right',
        flair_text: 'Planet/EDIT GALAXY'
    }
]

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
    match: /Settlement/i,
    name: "Settlement",
    galaxy: true,
    //platform: true,
    //mode: true,
    version: true,
    id: "e8144632-0b1e-11ec-88ab-96ad868165b6"
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
    //mode: true,
    version: true,
    id: ""
}, {
    match: /test|Request|Showcase|Question|Tips|Information|Top|Mod|NEWS|Removed|Best|Member/i,
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
    match: /\bEuc\w+d\b/i,
    name: "Euclid"
}, {
    match: /\bHilb\w+t\b(Dim\w+n\b)?/i,
    name: "Hilbert"
}, {
    match: /\bCal\w+o\b/i,
    name: "Calypso"
}, {
    match: /\bHes\w+s\b(Dim\w+n\b)?/i,
    name: "Hesperius"
}, {
    match: /\bHya\w+s\b/i,
    name: "Hyades"
}, {
    match: /\bIck\w+w\b/i,
    name: "Ickjamatew"
}, {
    match: /\bBud\w+r\b/i,
    name: "Budullangr"
}, {
    match: /\bKik\w+r\b/i,
    name: "Kikolgallr"
}, {
    match: /\bElt\w+n\b/i,
    name: "Eltiensleen"
}, {
    match: /\bEis{1,2}\w+[mn]\b/i,
    name: "Eissentam"
}, {
    match: /\bElk[ua]\w+s\b/i,
    name: "Elkupalos"
}, {
    match: /\bApt\w+a\b/i,
    name: "Aptarkaba"
}, {
    match: /\bOnt\w+p\b/i,
    name: "Ontiniangp"
}, {
    match: /\bOdi\w+i\b/i,
    name: "Odiwagiri"
}, {
    match: /\bOgt\w+i\b/i,
    name: "Ogtialabi"
}, {
    match: /\bMuh\w+o\b/i,
    name: "Muhacksonto"
}, {
    match: /\bHit\w+r\b/i,
    name: "Hitonskyer"
}, {
    match: /\bRer\w+l\b/i,
    name: "Rerasmutul"
}, {
    match: /\bIsd\w+g\b/i,
    name: "Isdoraijung"
}, {
    match: /\bDoc\w+a\b/i,
    name: "Doctinawyra"
}, {
    match: /\bLoyc\w+q\b/i,
    name: "Loychazinq"
}, {
    match: /\bZuk\w+a\b/i,
    name: "Zukasizawa"
}, {
    match: /\bEkw\w+e\b/i,
    name: "Ekwathore"
}, {
    match: /\bYebe\w+e\b/i,
    name: "Yeberhahne"
}, {
    match: /\bTwer\w+k\b/i,
    name: "Twerbetek"
}, {
    match: /\bSiv\w+s\b/i,
    name: "Sivarates"
}, {
    match: /\bEaj\w+l\b/i,
    name: "Eajerandal"
}, {
    match: /\bAld\w+i\b/i,
    name: "Aldukesci"
}, {
    match: /\bWot\w+i\b/i,
    name: "Wotyarogii"
}, {
    match: /\bSud\w+l\b/i,
    name: "Sudzerbal"
}, {
    match: /\bMau\w+y\b/i,
    name: "Maupenzhay"
}, {
    match: /\bSugu\w+e\b/i,
    name: "Sugueziume"
}, {
    match: /\bBrog\w+n\b/i,
    name: "Brogoweldian"
}, {
    match: /\bEhb\w+u\b/i,
    name: "Ehbogdenbu"
}, {
    match: /\bIjs\w+s\b/i,
    name: "Ijsenufryos"
}, {
    match: /\bNip\w+a\b/i,
    name: "Nipikulha"
}, {
    match: /\bAut\w+n\b/i,
    name: "Autsurabin"
}, {
    match: /\bLus\w+h\b/i,
    name: "Lusontrygiamh"
}, {
    match: /\bRew\w+a\b/i,
    name: "Rewmanawa"
}, {
    match: /\bEth\w+e\b/i,
    name: "Ethiophodhe"
}, {
    match: /\bUra\w+e\b/i,
    name: "Urastrykle"
}, {
    match: /\bXob\w+j\b/i,
    name: "Xobeurindj"
}, {
    match: /\bOni\w+u\b/i,
    name: "Oniijialdu"
}, {
    match: /\bWuc\w+c\b/i,
    name: "Wucetosucc"
}, {
    match: /\bEby\w+f\b/i,
    name: "Ebyeloof"
}, {
    match: /\bOdya\w+a\b/i,
    name: "Odyavanta"
}, {
    match: /\bMil\w+i\b/i,
    name: "Milekistri"
}, {
    match: /\bWaf\w+h\b/i,
    name: "Waferganh"
}, {
    match: /\bAgn\w+t\b/i,
    name: "Agnusopwit"
}, {
    match: /\bT[ae]y\w+y\b/i,
    name: "Teyaypilny"
}, {
    match: /\bZal\w+m\b/i,
    name: "Zalienkosm"
}, {
    match: /\bLadg\w+f\b/i,
    name: "Ladgudiraf"
}, {
    match: /\bMus\w+e\b/i,
    name: "Mushonponte"
}, {
    match: /\bAms\w+z\b/i,
    name: "Amsentisz"
}, {
    match: /\bFla\w+m\b/i,
    name: "Fladiselm"
}, {
    match: /\bLaa\w+b\b/i,
    name: "Laanawemb"
}, {
    match: /\bIlk\w+r\b/i,
    name: "Ilkerloor"
}, {
    match: /\bDav\w+i\b/i,
    name: "Davanossi"
}, {
    match: /\bPlo\w+u\b/i,
    name: "Ploehrliou"
}, {
    match: /\bCor\w+a\b/i,
    name: "Corpinyaya"
}, {
    match: /\bLec\w+m\b/i,
    name: "Leckandmeram"
}, {
    match: /\bQuu\w+s\b/i,
    name: "Quulngais"
}, {
    match: /\bNok\w+l\b/i,
    name: "Nokokipsechl"
}, {
    match: /\bRinb\w+a\b/i,
    name: "Rinblodesa"
}, {
    match: /\bLoyd\w+n\b/i,
    name: "Loydporpen"
}, {
    match: /\bIbt\w+p\b/i,
    name: "Ibtrevskip"
}, {
    match: /\bElko\w+b\b/i,
    name: "Elkowaldb"
}, {
    match: /\bHeh\w+o\b/i,
    name: "Heholhofsko"
}, {
    match: /\bYebr\w+d\b/i,
    name: "Yebrilowisod"
}, {
    match: /\bHus\w+i\b/i,
    name: "Husalvangewi"
}, {
    match: /\bOvn[\w'’]+d\b/i,
    name: "Ovna'uesed"
}, {
    match: /\bBah\w+y\b/i,
    name: "Bahibusey"
}, {
    match: /\bNuy\w+e\b/i,
    name: "Nuybeliaure"
}, {
    match: /\bDos\w+c\b/i,
    name: "Doshawchuc"
}, {
    match: /\bRuc\w+h\b/i,
    name: "Ruckinarkh"
}, {
    match: /\bTho\w+c\b/i,
    name: "Thorettac"
}, {
    match: /\bNupo\w+u\b/i,
    name: "Nuponoparau"
}, {
    match: /\bMog\w+l\b/i,
    name: "Moglaschil"
}, {
    match: /\bUiw\w+e\b/i,
    name: "Uiweupose"
}, {
    match: /\bNas\w+e\b/i,
    name: "Nasmilete"
}, {
    match: /\bEkd\w+n\b/i,
    name: "Ekdaluskin"
}, {
    match: /\bHak\w+y\b/i,
    name: "Hakapanasy"
}, {
    match: /\bDim\w+a\b/i,
    name: "Dimonimba"
}, {
    match: /\bCaj\w+i\b/i,
    name: "Cajaccari"
}, {
    match: /\bOlo\w+o\b/i,
    name: "Olonerovo"
}, {
    match: /\bUml\w+k\b/i,
    name: "Umlanswick"
}, {
    match: /\bHen\w+m\b/i,
    name: "Henayliszm"
}, {
    match: /\bUtz\w+e\b/i,
    name: "Utzenmate"
}, {
    match: /\bUmi\w+a\b/i,
    name: "Umirpaiya"
}, {
    match: /\bPah\w+g\b/i,
    name: "Paholiang"
}, {
    match: /\bIae\w+a\b/i,
    name: "Iaereznika"
}, {
    match: /\bYud\w+h\b/i,
    name: "Yudukagath"
}, {
    match: /\bBoe\w+j\b/i,
    name: "Boealalosnj"
}, {
    match: /\bYae\w+o\b/i,
    name: "Yaevarcko"
}, {
    match: /\bCoe\w+p\b/i,
    name: "Coellosipp"
}, {
    match: /\bWay\w+u\b/i,
    name: "Wayndohalou"
}, {
    match: /\bSmo\w+l\b/i,
    name: "Smoduraykl"
}, {
    match: /\bApm\w+u\b/i,
    name: "Apmaneessu"
}, {
    match: /\bHic\w+v\b/i,
    name: "Hicanpaav"
}, {
    match: /\bAkv\w+a\b/i,
    name: "Akvasanta"
}, {
    match: /\bTuy\w+r\b/i,
    name: "Tuychelisaor"
}, {
    match: /\bRiv\w+e\b/i,
    name: "Rivskimbe"
}, {
    match: /\bDak\w+x\b/i,
    name: "Daksanquix"
}, {
    match: /\bKiss\w+n\b/i,
    name: "Kissonlin"
}, {
    match: /\bAed\w+l\b/i,
    name: "Aediabiel"
}, {
    match: /\bUlo\w+k\b/i,
    name: "Ulosaginyik"
}, {
    match: /\bRoc\w+r\b/i,
    name: "Roclaytonycar"
}, {
    match: /\bKic\w+a\b/i,
    name: "Kichiaroa"
}, {
    match: /\bIrc\w+y\b/i,
    name: "Irceauffey"
}, {
    match: /\bNud\w+e\b/i,
    name: "Nudquathsenfe"
}, {
    match: /\bGet\w+l\b/i,
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
