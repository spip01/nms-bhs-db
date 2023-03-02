'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const reddit = new snoowrap(login)

var sub = null
var lastPost = {}
var lastComment = {}
var rules = []
var settings = {}
var mods = []

var flairPostLimit = []
var anyPostLimit = {}
var allPost = {}

main()
async function main() {
    reddit.config({
        continueAfterRatelimitError: true,
        requestTimeout: 90000
    })

    sub = await reddit.getSubreddit('NoMansSkyTheGame')

    await loadSettings()

    // single searches at startup to get post for long posting limits
    let firstSearch = "(flair_text:Video)"
    for (let ad of settings.ads)
        if (ad.flair)
            firstSearch += " OR (flair_text:" + ad.flair + ")"

    sub.search({
        query: firstSearch,
        time: "week",
        limit: 1000,
        sort: "new"
    }).then(posts => {
        console.log("Weekly", posts.length)

        if (posts.length > 0) {
            posts = posts.reverse()
            checkPostLimits(posts)
        }
    })

    // sub.search({
    //     query: "(flair_text:Contest)",
    //     time: "month",
    //     limit: 1000,
    //     sort: "new"
    // }).then(posts => {
    //     console.log("Contest", posts.length)

    //     // if (posts.length > 0) {
    //     // posts = posts.reverse()
    //     //     checkPostLimits(posts)
    //     //     checkContest(posts)
    //     // }
    // })

    setInterval(async () => {
        let start = new Date()
        console.log("start", start.toUTCString())

        let date = parseInt(start.valueOf() / 1000)  // reddit time does not include ms so === epoch / 1000
        const recheck = 30 * 60   // timeout jic we get a bad lastPost.name so it should be set to possible time between posts
        let p = []

        p.push(sub.getNew(!lastPost.name ? {
            limit: 100 // day
        } : lastPost.full + recheck < date ? {
            limit: 10 // hour
        } : {
            before: lastPost.name
        }).then(posts => {
            console.log("post", posts.length)

            if (!lastPost.name || lastPost.full + recheck < date)
                console.log(posts.length, "posts / ", parseInt((posts[0].created_utc - posts[posts.length - 1].created_utc) / 60), "minutes")

            if (posts.length > 0 || !lastPost.full || lastPost.full + recheck < date)
                lastPost.full = date       // read all if we go past recheck timeout, probably got a bad lastPost.name

            if (posts.length > 0) {
                lastPost.name = posts[0].name
                let p = []
                p.push(checkPostLimits(posts))
                p.push(checkWatched(posts))
                p.push(checkNewPosters(posts))  // Only time critical function. Limits how much time first time post is visible on sub.
                p.push(updateWikiThreads(posts))
                // p.push(checkContest(posts))
                return Promise.all(p)
            }
        }).catch(err => console.error(err.name, err.message)))

        if (!settings.watch.find(x => x.active === true))
            p.push(sub.getNewComments(!lastComment.name || lastComment.full + recheck < date ? {
                limit: 20 // if startup misses a few nbd
            } : {
                before: lastComment.name
            }).then(posts => {
                console.log("comments", posts.length)
                if (!lastComment.name || lastComment.full + recheck < date)
                    console.log(posts.length, "comments / ", parseInt((posts[0].created_utc - posts[posts.length - 1].created_utc) / 60), "minutes")

                if (lastComment.length > 0 || !lastComment.full || lastComment.full + recheck < date)
                    lastComment.full = date    // read all if we go past recheck timeout

                if (posts.length > 0) {
                    lastComment.name = posts[0].name
                    return checkWatched(posts)
                }
            }).catch(err => console.error(err.name, err.message)))

        p.push(sub.getModqueue().then(posts => {
            console.log("queue", posts.length)
            let p = []
            p.push(modCommands(posts, mods))
            p.push(reapproveBotComments(posts)) // idiots reporting bot & automod comments
            return Promise.all(p)
        }).catch(err => console.error(err.name, err.message)))

        await Promise.all(p)

        let end = new Date().valueOf()
        console.log("done", end - start.valueOf(), "ms")
    }, 30000)
}

var commentedList = []

function checkPostLimits(posts) {
    let p = []
    let now = new Date().valueOf() / 1000

    for (let post of posts) {
        if (!post.name.includes("t3_") || post.selftext === "[deleted]")
            continue

        // check for videos not using video flair
        if (!post.link_flair_text.includes("Bug") && !post.link_flair_text.includes("Video") && !post.link_flair_text.includes("Question")
            && !post.link_flair_text.includes("Answered") && !post.link_flair_text.includes("Contest")
            && typeof post.secure_media !== "undefined" && post.secure_media
            && (typeof post.secure_media.reddit_video !== "undefined" || typeof post.secure_media.oembed !== "undefined"
                && (post.secure_media.oembed.type === "video" || post.secure_media.type === "twitch.tv"))) {

            post.link_flair_text += " Video"
            console.log("add video flair: " + permaLinkHdr + post.permalink)

            p.push(post.selectFlair({
                flair_template_id: post.link_flair_template_id,
                text: post.link_flair_text
            }).catch(err => console.error(err.name, err.message)))
        }

        let limit = flairPostLimit.find(x => post.link_flair_text.includes(x.flair))
        let userHistory

        if (limit) {
            userHistory = allPost[limit.flair]

            // this really only happens if someone edits the flair
            if (typeof limit.contacts !== "undefined" && !limit.contacts.find(x => x.uid === post.author.name) && !commentedList.includes(post.id)) {
                commentedList.push(post.id)

                p.push(post.reply(thankYou + removedPost + "Please contact moderators before using this flair.  \n" + rules[9] + botSig)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.error(err.name, err.message)))

                p.push(post.remove().catch(err => console.error(err.name, err.message)))

                console.log("Ad flair op not approved:", post.author.name, permaLinkHdr + post.permalink)
                continue
            }
        }
        else {
            if (post.link_flair_template_id === "9e4276b2-a4d1-11ec-94cc-4ea5a9f5f267") {
                p.push(post.reply(thankYou + removedPost + "Please edit this flair to match your assigned flair.  \n" + rules[9] + botSig)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.error(err.name, err.message)))

                p.push(post.reply("!filter Flair needs editing").catch(err => console.error(err.name, err.message)))

                console.log("Ad flair doesn't match:", post.author.name, permaLinkHdr + post.permalink)
                continue
            }

            // check here for post/comments for registered url with wrong flair and delete

            limit = anyPostLimit
            userHistory = allPost.any
        }

        let user = userHistory.find(x => {
            if (typeof limit.contacts === "undefined")
                return x.author === post.author_fullname
            else
                return x.author === limit.flair // ad post get saved under flair
        })

        if (user) {
            if (user.history.find(x => { return x.id === post.id }))
                continue

            user.history = user.history.filter(async x => {
                if ((typeof limit.start_utc !== "undefined" && x.created_utc > limit.start_utc) // contest
                    || (typeof limit.time !== "undefined" && now - x.created_utc < limit.time)) {

                    // delete old & deleted post
                    let p = await x.fetch().catch(err => console.error(err.name, err.message))
                    if (p && p.selftext === "[deleted]") {
                        console.log(limit.flair + " post was deleted", post.author.name, permaLinkHdr + x.permalink)
                        return false // remove
                    }
                    else
                        return true // keep
                } else
                    return false // remove
            })

            if (user.history.length > 1)
                user.history.sort((a, b) => a.creted_utc - b.created_utc)
        }
        else {
            user = {}
            user.author = typeof limit.contacts !== "undefined" ? limit.flair : post.author_fullname // ad post get saved under group flair
            user.name = typeof limit.contacts !== "undefined" ? limit.flair : post.author.name
            user.history = []
            userHistory.push(user)
        }

        if (user.history.length + 1 > limit.limit && !commentedList.includes(post.id)) {
            commentedList.push(post.id)

            let message = thankYou + removedPost
            if (typeof limit.timeStr !== "undefined") {
                message += postLimit + limit.limit + "/" + limit.timeStr + ". "
                if (!limit.selectFlair)
                    message += "Your next post can be made after " + (new Date((user.history[0].created_utc + limit.time) * 1000).toUTCString()) + ".  \n"
                message += botSig
            } else
                message += contestLimit + limit.limit + " This post may be reposted using a different flair.  \n" + botSig

            console.log("over limit", permaLinkHdr + post.permalink)
            p.push(post.reply(message)
                .distinguish({
                    status: true
                }).lock()
                .catch(err => console.error(err.name, err.message)))

            p.push(post.remove().catch(err => console.error(err.name, err.message)))
        }
        else
            user.history.push(post)
    }

    return Promise.all(p)
}

var posters = []

function checkNewPosters(posts) {
    let p = []

    for (let post of posts) {
        if (posters.includes(post.author.name))
            continue

        p.push(sub.search({
            query: "author:" + post.author.name,
            limit: 2,
            sort: "new"
        }).then(posts => {
            if (posts.length > 0) {
                if (posts.length === 2 || posts[0].approved_by)
                    posters.push(posts[0].author.name)
                else {
                    console.log("new poster", posts[0].author.name, permaLinkHdr + posts[0].permalink)

                    let p = []
                    p.push(posts[0].reply("!filter-First Post").catch(err => console.error(err.name, err.message)))

                    if (!commentedList.includes(posts[0].name)) {
                        commentedList.push(posts[0].name)

                        p.push(reddit.composeMessage({
                            to: posts[0].author.name,
                            subject: "First post to r/NoMansSkyTheGame",
                            text: firstPost
                        }).catch(err => console.error(err.name, err.message)))
                    }

                    return Promise.all(p)
                }
            }
        }))
    }

    return Promise.all(p)
}

async function loadSettings(post) {
    const calcTime = function (length) {
        switch (length) {    // reddit time is in sec not ms
            case "week": return 7 * 24 * 60 * 60 - 60 * 60 // 60 min leway 
            case "hour": return 60 * 60 - 2 * 60
            case "day": return 24 * 60 * 60 - 15 * 60
        }
    }

    let p = []

    p.push(sub.getWikiPage("botsettings").fetch().then(page => {
        settings = JSON.parse(page.content_md)
        settings.revision = page.revision_date

        flairPostLimit = []
        anyPostLimit = {}

        if (typeof allPost.any === undefined) {
            allPost = {}
        }

        for (let e of settings.ads) {
            if (e.flair) {
                let limit = {}
                limit.flair = e.flair
                limit.limit = e.limit
                limit.timeStr = e.timeStr
                limit.time = calcTime(e.timeStr)
                limit.contacts = e.contacts
                flairPostLimit.push(limit)
                allPost[e.flair] = []
            }
        }

        for (let e of settings.contest) {
            if (e.flair) {
                let limit = {}
                limit.flair = e.flair
                limit.limit = e.limit
                limit.start_utc = new Date(e.start).valueOf() / 1000
                flairPostLimit.push(limit)
                allPost[e.flair] = []
            }
        }

        for (let e of settings.limits) {
            let limit = {}
            limit.flair = e.flair
            limit.limit = e.limit
            limit.timeStr = e.timeStr
            limit.time = calcTime(e.timeStr)

            if (e.flair) {
                flairPostLimit.push(limit)
                allPost[e.flair] = []
            } else {
                anyPostLimit = limit
                allPost.any = []
            }
        }
    }))

    p.push(sub.getRules().then(r => {
        for (let x of r.rules)
            rules.push(x.description)
    }))

    p.push(sub.getModerators().then(m => {
        for (let x of m)
            mods.push(x.id)
    }))

    await Promise.all(p)

    console.log("reload settings")

    if (typeof post !== "undefined")
        return post.reply("! All settings reloaded").catch(err => console.error(err.name, err.message))
}

function updateSettings() {
    console.log("update settings")

    return sub.getWikiPage("botsettings").edit({
        text: JSON.stringify(settings),
        reason: "bot-update"
    }).catch(err => console.error(err.name, err.message))
}

function reapproveBotComments(posts) {
    let p = []
    for (let post of posts)
        if (post.author.name === "AutoModerator" || post.author.name === "nmsceBot")
            p.push(post.approve())

    return Promise.all(p)
}

async function updateWikiThreads(posts) {
    let changed = []
    let needsUpdate = false

    for (let post of posts)
        if (mods.includes(post.author_fullname) && (post.link_flair_text.match(/(weekly-thread|bug-thread|mega-?thread)/i)))
            changed.push(post)

    if (changed.length > 0) {
        let wiki = await sub.getWikiPage("mega-threads")
        let page = await wiki.fetch().content_md

        for (let post of changed) {
            if (!page.includes(post.id)) {
                let title = post.permalink.split("/")
                let loc = page.indexOf(title[5].slice(0, 20)) // find post title in page

                if (loc) {
                    let insert = page.lastIndexOf("/", loc - 2) + 1
                    page = page.slice(0, insert) + post.id + page.slice(loc - 1)
                    page += "  \n" + new Date(post.created_utc * 1000).toDateString().slice(4) + " | [" + post.title + "](" + permaLinkHdr + post.permalink + ")"

                    needsUpdate = true
                }
            }
        }

        if (needsUpdate) {
            console.log('update wiki')

            return wiki.edit({
                text: page,
                reason: "bot-update scheduled thread urls"
            }).catch(err => console.error(err.name, err.message))
        }
    }
}

async function modCommands(posts, mods) {
    let p = []

    for (let post of posts) {
        if (post.name.startsWith("t1_") && mods.includes(post.author_fullname)) {
            let match = post.body.match(/!(watch|unwatch|contest|reload|check|ad|pm|r|c)\W?(.*)?/i)

            if (match) {
                console.log("command", post.body)
                let op

                if (post.parent_id.startsWith("t1_"))
                    op = await reddit.getComment(post.parent_id).fetch()
                else
                    op = await reddit.getSubmission(post.parent_id).fetch()

                switch (match[1]) {
                    case "r": p.push(removePost(post, op)); break
                    case "c": p.push(sendComment(post, op)); break
                    case "pm": p.push(sendMessage(post, op)); break
                    case "ad": p.push(setupAdvertiser(post, op)); break
                    case "watch": p.push(setupWatch(post, op)); break
                    case "unwatch": p.push(clearWatch(post, op)); break
                    case "contest": p.push(setupContest(post, op)); break
                    case "reload": p.push(loadSettings(post, op)); break
                    case "check": p.push(botStats(post, op)); break
                }

                p.push(post.remove().catch(err => console.error(err.name, err.message)))
            }
        }
    }

    return Promise.all(p)
}

function setupAdvertiser(post, op) {
    let p = []
    let ad = {
        flair: null,
        limit: null,
        timeStr: null,
        url: null,
        contacts: []
    }

    let opts = post.body.split(" ")

    for (let opt of opts) {
        let field = opt.split(":")

        switch (field[0]) {
            case "limit": ad.limit = parseInt(field[1]); break
            case "time": ad.timeStr = field[1]; break
            case "flair": {
                if (field[1].startsWith('"')) {
                    let start = post.body.indexOf('"') + 1
                    let end = post.body.indexOf('"', start)
                    ad.flair = post.body.slice(start, end)
                }
                else
                    ad.flair = field[1]

                break
            }
            case "contacts": {
                let contacts = field[1].split(",")
                for (let c of contacts)
                    ad.contacts.push({ uid: c, email: null, name: null })

                break
            }
        }
    }

    console.log(opts[1])

    if (opts.length === 1 || opts[1] !== "list") {
        let ads = settings.ads.find(x => x.flair === ad.flair)
        if (!ads && !settings.ads[0].flair)
            ads = settings.ads[0]

        if (ads) {
            ads.limit = ad.limit ? ad.limit : ads.limit ? ads.limit : 2
            ads.timeStr = ad.timeStr ? ad.timeStr : ads.timeStr ? ads.timeStr : "week"

            if (ad.contacts.length > 0) {
                ads.contacts = []

                for (let c of ad.contacts)
                    ads.contacts.push(c)
            }

            console.log("setup ad")

            if (!ads.limit || !ads.timeStr || !ads.flair || ads.contacts.length === 0)
                p.push(post.reply("! incomplete ad").catch(err => console.error(err.name, err.message)))
        }
        else
            settings.ads.push(ad)

        console.log(JSON.stringify(settings.ads))

        p.push(updateSettings())
    }

    p.push(listAdvertisers(post, op))

    return Promise.all(p)
}

function listAdvertisers(post, op) {
    const buildAd = function (ad) {
        let text = "flair: '" + ad.flair
        text += "' contacts: "
        for (let c of ad.contacts)
            text += c.uid + ", "

        return text.slice(0, text.length) + "  \n"
    }

    let text = "! Authorized advertisers  \n"

    if (!settings.ads[0].flair)
        text = "! No Authorized advertisers  \n"
    else
        for (let ad of settings.ads)
            text += buildAd(ad)

    return post.reply(text).catch(err => console.error(err.name, err.message))
}

function setupWatch(post, op) {
    let watch = settings.watch.find(x => x.uid === op.author_fullname)
    let opts = post.body.split(" ")
    let p = []

    if (opts.length === 1 || opts[1] === "history")
        p.push(watchHistory(post, op, watch))
    else {
        if (watch === undefined || settings.watch[0].uid === "") {
            if (settings.watch[0].uid === "") {
                watch = settings.watch[0]
            } else {
                watch = {}
                settings.watch.push(watch)
            }
        }
        else {
            let old = Object.assign({}, watch)
            old.active = false
            delete old.history

            if (typeof watch.history === "undefined")
                watch.history = []

            watch.history.push(old)
        }

        watch.end = 30
        watch.notify = "report"
        watch.comments = false

        watch.uid = op.author_fullname
        watch.name = op.author.name
        watch.post = permaLinkHdr + op.permalink

        watch.by = post.author.name
        watch.date = new Date(post.created_utc * 1000).toDateString().slice(4)
        watch.active = true

        for (let opt of opts) {
            let o = opt.split(":")

            switch (o[0]) {
                case "end":
                    watch[o[0]] = parseInt(o[1])
                    break

                case "comments":
                    watch[o[0]] = o[1] === "true"
                    break

                case "reason":
                    if (o[1].startsWith('\"')) {
                        let r = post.body.split('\"')
                        watch[o[0]] = r[1]
                    }
                    else
                        watch[o[0]] = o[1]
                    break

                case "notify":
                    watch[o[0]] = o[1]
                    break
            }
        }

        console.log("watch", watch.name)

        p.push(updateSettings())
        p.push(watchHistory(post, op, watch))
    }

    return Promise.all(p)
}

function watchHistory(post, op, watch) {
    if (watch === undefined)
        return post.reply("! No watch history for " + op.author.name).catch(err => console.error(err.name, err.message))
    else {
        let text = "! Watch history for " + op.author.name + "  \n\n"
        text += watch.active ? "**Actively watching**  \n" : "*No active watch*  \n"
        text += "reason: " + watch.reason + "  \n"
        text += "date: " + watch.date + "  \n"
        text += "end: " + watch.end + "  \n"
        text += "by: " + watch.by + "  \n"
        text += "post: " + watch.post + "  \n\n"
        if (typeof watch.history !== "undefined") {
            text += "Previous watch history  \n\n"
            for (let w of watch.history) {
                text += "reason: " + w.reason + "  \n"
                text += "date: " + w.date + "  \n"
                text += "by: " + w.by + "  \n"
                text += "post: " + w.post + "  \n\n"
            }
        }

        return post.reply(text).catch(err => console.error(err.name, err.message))
    }
}

function clearWatch(post, op) {
    let p = []
    let watch = settings.watch.find(x => x.uid === op.author_fullname)

    if (typeof watch !== "undefined") {
        watch.active = false

        console.log("unwatch", watch.name)
        p.push(updateSettings())
    }

    p.push(watchHistory(post, op, watch))

    return Promise.all(p)
}

function setupContest(post, op) {
    let update = null
    let contest = null
    let p = []

    for (let c of settings.contest)
        if (c.flair === op.link_flair_text || !c.flair) {
            update = c
            contest = c
            break
        }

    if (update === null)
        contest = { // default values
            end: 30,
            tz: 0,
            limit: 3,
            repost: [-1, -3],
            comments: false,
            type: "post"
        }

    contest.flair = op.link_flair_text
    contest.link = permaLinkHdr + op.permalink

    let opts = post.body.split(" ")
    console.log(opts)

    for (let o of opts) {
        let l = o.split(":")
        console.log(l)

        if (l[0].match(/(end|tz|limit)/))
            contest[l[0]] = parseInt(l[1])
        else if (l[0].match(/(type|start)/))
            contest[l[0]] = l[1]
        else if (l[0] === "comment")
            contest[l[0]] = l[1] === "true"
        else if (l[0] === "repost") {
            contest[l[0]] = []
            let d = l[1].split(",")
            console.log(d)
            for (let x of d)
                contest[l[0]].push(parseInt(x))
        }
    }

    if (update)
        update = contest
    else
        settings.contest.push(contest)

    console.log("contest", settings.contest)

    p.push(updateSettings())
    p.push(listContest(post, op))

    return Promise.all(p)
}

function listContest(post, op) {
    let today = new Date()
    let text = "! Upcoming & current contest \n"

    let contest = settings.contest.filter(x => {
        let start = new Date(x.start)
        let end = start + x.end * 1000 * 60 * 60 * 24

        return start > today && today < end
    })

    for (let c of contest)
        text += "start: " + c.start + " flair: " + c.flair + " [post](" + c.link + ") \n"

    return post.reply(text).catch(err => console.error(err.name, err.message))
}

function botStats(post, op) {
    console.log("bot check")
    return post.reply("! Bot Running").catch(err => console.error(err.name, err.message))
}

function removePost(post, op) {
    let message = thankYou + removedPost
    let list = post.body.slice(2).split(",")
    let p = []

    for (let r of list) {
        let i = parseInt(r) - 1
        message += typeof rules[i] !== "undefined" ? rules[i] + "  \n\n" : ""
    }

    message += botSig

    p.push(op.reply(message)
        .distinguish({
            status: true
        }).lock()
        .catch(err => console.error(err.name, err.message)))

    p.push(op.remove()
        .catch(err => console.error(err.name, err.message)))

    console.log("remove post: rule: " + list + " " + permaLinkHdr + op.permalink)

    return Promise.all(p)
}

function sendComment(post, op) {
    let message = post.body.slice(3) + "  \n\n*This comment was made by a moderator of r/NoMansSkyTheGame. If you have questions please contact them [here](https://www.reddit.com/message/compose?to=%2Fr%2FNoMansSkyTheGame).*"
    console.log("post comment: ", message)

    return op.reply(message)
        .distinguish({
            status: true
        }).lock()
        .catch(err => console.error(err.name, err.message))
}

function sendMessage(post, op) {
    let message = post.body.slice(3) + "  \n\n*This message was sent by a moderator of r/NoMansSkyTheGame. If you have questions please contact them [here](https://www.reddit.com/message/compose?to=%2Fr%2FNoMansSkyTheGame).*"
    console.log("send message: ", message)
    let p = []

    p.push(reddit.composeMessage({
        to: op.author.name,
        subject: "Message from r/NoMansSkyTheGame",
        text: message
    }).catch(err => console.error(err.name, err.message)))

    p.push(post.reply("! sending message to " + op.author.name).catch(err => console.error(err.name, err.message)))

    return Promise.all(p)
}

function checkWatched(posts) {
    let watching = settings.watch.filter(x => x.active === true)
    let comments = watching.filter(x => x.comments === true)
    let today = new Date().valueOf()
    let needsUpdate = false
    let p = []

    for (let post of posts) {
        if (post.approved_by)
            continue

        let watch
        if (post.name.startsWith("t3_"))
            watch = watching.find(x => x.uid === post.author_fullname)
        else
            watch = comments.find(x => x.uid === post.author_fullname)

        if (watch !== undefined) {
            if (today - new Date(watch.date).valueOf() > watch.end * 1000 * 60 * 60 * 24) {
                settings.watch.find(x => x.uid === post.author_fullname).active = false
                console.log("watch expired", post.author.name)
                needsUpdate = true
                continue
            }

            console.log("watch triggered", post.author.name)

            if (watch.notify === "report")
                p.push(post.report({
                    reason: post.author.name + " watch " + watch.reason
                }).catch(err => console.error(err.name, err.message)))
            else
                p.push(post.reply("!filter watched user '" + watch.reason + "'").catch(err => console.error(err.name, err.message)))
        }
    }

    if (needsUpdate)
        p.push(updateSettings())

    return Promise.all(p)
}

function getVotes(op) {
    let scanReplies = function (post, replies, voted) {
        let votes = 0

        for (let r of replies) {
            if (r.author.name !== post.author.name) {
                if (!voted.includes(r.author.name)) {
                    voted.push(r.author.name)
                    votes++
                }
            } else
                votes += r.ups - r.downs - 1

            if (r.replies.length > 0)
                votes += scanReplies(post, r.replies, voted)
        }

        return votes
    }

    return op.remove().then(() => {
        let month = op.body.match(/!votes\s+(.*)/)

        if (month && month.length > 1)
            month = month[1]
        else
            return op.reply("! votes [month] e.g. !votes Feb").catch(err => console.error(err.name, err.message))

        return sub.search({
            query: "subreddit:nomansskythegame flair:contest",
            limit: 1000,
            time: "month"
        }).then(async posts => {
            let p = []
            let total = 0

            for (let post of posts) {
                if (!post.link_flair_text.includes(month))
                    continue

                let replies = await post.expandReplies()

                let voted = []
                let votes = scanReplies(post, replies.comments, voted)

                p.push({
                    link: post.permalink,
                    votes: post.ups + post.downs + post.total_awards_received + votes,
                    title: post.title,
                })

                total += post.ups + post.downs + post.total_awards_received + votes
            }

            p.sort((a, b) => a.votes >= b.votes ? -1 : 1)

            let text = "! Total entries: " + posts.length + " Total votes: " + total + "  \n"
            for (let i = 0; i < 10; ++i)
                text += p[i].votes + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

            return op.reply(text).catch(err => console.error(err.name, err.message))
        }).catch(err => { console.error(err.name, err.message) })
    }).catch(err => console.error(err.name, err.message))
}

function getTopComments(op) {
    return op.remove().then(() => {

        let month = op.body.match(/!comments?\s+(.*)/)
        if (month && month.length > 1) {
            month = month[1]
        } else {
            return reddit.composeMessage({
                to: op.author,
                subject: "Top Comment count needs month",
                text: "!comments [month] e.g. '!comments Feb'"
            }).catch(err => console.error(err.name, err.message))
        }

        return sub.search({
            query: "subreddit:nomansskythegame flair:contest",
            limit: 1000,
            time: "month"
        }).then(async posts => {
            let p = []
            let c = []
            let total = 0

            for (let post of posts) {
                if (!post.link_flair_text.includes(month))
                    continue

                let replies = await post.expandReplies()
                console.log("got", replies.comments.length)
                if (replies.comments.length > 0) {
                    for (let r of replies.comments)
                        c.push({
                            link: r.permalink,
                            votes: r.ups + r.downs,
                            title: r.body,
                            oplink: post.permalink,
                            optitle: post.title,
                        })

                    p.push({
                        link: post.permalink,
                        votes: replies.comments.length,
                        title: post.title,
                    })

                    total += replies.comments.length
                }
            }

            c.sort((a, b) => a.votes >= b.votes ? -1 : 1)
            p.sort((a, b) => a.votes >= b.votes ? -1 : 1)

            let text = "Total entries: " + posts.length + " Total comments: " + total + "  \n"
            for (let i = 0; i < 10; ++i)
                text += p[i].votes + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

            text += "  \n\n"

            for (let i = 0; i < 10; ++i)
                text += c[i].votes + ": [" + c[i].title + "](https://reddit.com" + c[i].link + "): [" + c[i].optitle + "](https://reddit.com" + c[i].oplink + ")  \n"

            return reddit.composeMessage({
                to: op.author,
                subject: "NMSTG contest results for " + month,
                text: text
            }).catch(err => console.error(err.name, err.message))
        }).catch(err => console.error(err.name, err.message))
    }).catch(err => console.error(err.name, err.message))
}

const thankYou = 'Thank You for posting to r/NoMansSkyTheGame. '
const removedPost = 'Your post has been removed because it violates the following rules for posting:  \n\n'
const postLimit = "Posting limit exceded: OP is allowed to make "
const contestLimit = "Contest limit exceded: OP is allowed to make "
const botSig = "  \n*This action was taken by the nmstgBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NoMansSkyTheGame).*"
const firstPost = "Thank you for posting to r/NoMansSkyTheGame and taking an active part in the community! Since this is your first post to r/NoMansSkyTheGame it has been queued for moderator approval. This is one of the anti-spam measures we're forced to use because of the proliferation of bots on reddit. In the meantime checkout our posting rules listed in the sidebar.  \n\nSince moderators are not always immediately available *please* be patient for your post to be approved."
const permaLinkHdr = "https://reddit.com"
