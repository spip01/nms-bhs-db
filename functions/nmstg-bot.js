'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}
var nextCheck = Number.MAX_SAFE_INTEGER
var toolbox = {}
var toolboxdl = false
var userPosts = []
var userVideos = []
var mods = []
var rules = {}

// main()
// async function main() {

exports.nmstgBot = async function () {

    if (!sub) {
        console.log("new instance")
        r.config({
            continueAfterRatelimitError: true
        })

        sub = await r.getSubreddit('NoMansSkyTheGame')
    }

    let date = parseInt(new Date().valueOf() / 1000)
    let p = []

    p.push(sub.getNew(!lastPost.name || lastPost.full + 60 * 60 < date ? {
        limit: 50
    } : {
        before: lastPost.name
    }).then(posts => {
        console.log("post", posts.length)

        if (posts.length > 0 || !lastPost.full || lastPost.full + 60 * 60 < date)
            lastPost.full = date
        else
            userPosts = []

        if (posts.length > 0) {
            lastPost.name = posts[0].name
            checkPostLimits(posts, userPosts, 2, date - 55 * 60, postLimit)
            checkNewPosters(posts, 10)
        }
    }).catch(err => {
        console.log("error 1", typeof err === "string" ? err : JSON.stringify(err))
    }))

    p.push(sub.search(!lastSearch.name || lastSearch.full + 60 * 60 < date ? {
        query: "flair_text:Video",
        time: "week",
        limit: 200,
        sort: "new"
    } : {
        query: "flair_text:Video",
        before: lastSearch.name
    }).then(posts => {
        console.log("video", posts.length)

        if (!lastSearch.full || lastSearch.full + 60 * 60 < date)
            lastSearch.full = date
        else
            userVideos = []

        if (posts.length > 0) {
            lastSearch.name = posts[0].name
            checkPostLimits(posts, userVideos, 1, date - 7 * 24 * 60 * 60, videoLimit)
        }
    }).catch(err => {
        console.log("error 2", typeof err === "string" ? err : JSON.stringify(err))
    }))

    if (new Date().valueOf() < nextCheck)
        p.push(sub.search({
            query: "flair_text:thread",
            //limit: 2,
            time: "day",
            sort: "new"
        }).then(async posts => {
            console.log("Thread", posts.length)

            if (posts.length > 0)
                await updateWiki(posts)

            let date = new Date()
            nextCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 5 + (date.getDay() >= 5 ? 7 : 0), 5, 15).valueOf()
            console.log("next", new Date(nextCheck).toDateString())
        }).catch(err => {
            console.log("error 2", typeof err === "string" ? err : JSON.stringify(err))
        }))

    if (!toolboxdl) {
        let wiki = await sub.getWikiPage("toolbox")
        let page = await wiki.fetch()
        toolbox = JSON.parse(page.content_md)
        toolbox.removalReasons.header = mdParse(toolbox.removalReasons.header)
        toolbox.removalReasons.footer = mdParse(toolbox.removalReasons.footer)
        for (let i of toolbox.removalReasons.reasons)
            i.text = mdParse(i.text)
        toolboxdl = true
    }

    if (mods.length === 0) {
        let m = await sub.getModerators()
        for (let x of m)
            mods.push(x.id)
    }

    p.push(sub.getModqueue().then(posts => {
        console.log("queue", posts.length)
        modCommands(posts, mods)
    }).catch(err => {
        console.log("error 3", typeof err === "string" ? err : JSON.stringify(err))
    }))

    return Promise.all(p)
}

var posters = []

async function checkNewPosters(posts, limit) {
    let p = []

    for (let post of posts) {
        if (posters.includes(post.author.name))
            continue

        if (--limit === 0)
            break

        p.push(sub.search({
            query: "author:" + post.author.name,
            limit: 2,
            sort: "new"
        }).then(async posts => {
            if (posts.length === 2 || post.approvedby !== "")
                posters.push(posts[0].author.name)
            else {
                console.log("new poster", posts[0].author.name)
                posts[0].reply("!filter-First Post")
                r.getUser(posts[0].author.name).reply(firstPost)
            }
        }))
    }

    await Promise.all(p)
}

function mdParse(text) {
    text = /%20/ig [Symbol.replace](text, " ")
    text = /%21/ig [Symbol.replace](text, "!")
    text = /%2c/ig [Symbol.replace](text, ",")
    text = /%3a/ig [Symbol.replace](text, ":")
    text = /%0a/ig [Symbol.replace](text, "\n")
    text = /%5b/ig [Symbol.replace](text, "[")
    text = /%5d/ig [Symbol.replace](text, "]")
    text = /%28/ig [Symbol.replace](text, "(")
    text = /%29/ig [Symbol.replace](text, ")")
    text = /%27/ig [Symbol.replace](text, "'")
    text = /%22/ig [Symbol.replace](text, "\"")
    text = /%26/ig [Symbol.replace](text, "&")
    text = /%3b/ig [Symbol.replace](text, ";")
    return text
}

async function updateWiki(posts) {
    let wiki = await sub.getWikiPage("mega-threads")
    let page = await wiki.fetch().content_md

    let lines = page.split("\n")

    for (let post of posts) {
        if (post.created_utc > nextCheck / 1000 || nextCheck === Number.MAX_SAFE_INTEGER) {
            let url = post.url
            let l = 0

            if (post.title.match(/bug/i))
                l = 4
            else if (post.title.match(/friend/i))
                l = 5
            else if (post.title.match(/twitch/i))
                l = 6
            else if (post.title.match(/civilization/i))
                l = 7

            if (l !== 0)
                lines[l] = lines[l].replace(/\((.*?)\)/i, "(" + url + ")")
        }
    }

    page = ""
    for (let l of lines)
        page += l + `\n`

    console.log('update wiki', new Date().toDateString())

    wiki.edit({
            text: page,
            reason: "bot-update weekly thread urls"
        })
        .catch(err => console.log("error w", typeof err === "string" ? err : JSON.stringify(err)))
}

async function modCommands(posts, mods) {
    for (let post of posts) {
        if (mods.includes(post.author_fullname) && post.body.startsWith("!r") && post.name.startsWith("t1_") && (!post.banned_by || post.banned_by === "AutoModerator")) {
            console.log("command", post.body)

            let match = post.body.slice(2).split(",")
            let message = toolbox.removalReasons.header + "\n\n----\n"

            for (let r of match) {
                let i = parseInt(r)

                if (typeof toolbox.removalReasons.reasons[i - 1].text !== "undefined")
                    message += toolbox.removalReasons.reasons[i - 1].text + "\n\n----\n"
            }

            message += toolbox.removalReasons.footer

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

            post.remove()
                .catch(err => console.log("error 7", typeof err === "string" ? err : JSON.stringify(err)))

            oppost.remove()
                .catch(err => console.log("error 8", typeof err === "string" ? err : JSON.stringify(err)))

            console.log("remove: " + "rule: " + match, "https://reddit.com" + oppost.permalink)
        }
    }
}

async function checkPostLimits(posts, postList, limit, date, reason) {
    let fdate = parseInt(new Date().valueOf() / 1000)

    for (let post of posts) {
        if (!post.name.includes("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        let user = postList.find(a => {
            return a.name === post.author.name
        })

        if (typeof user === "undefined") {
            user = {}
            user.name = post.author.name
            // user.meme = {}
            user.posts = {}
            user.posts[post.created_utc] = post
            postList.push(user)
        } else {
            user.posts[post.created_utc] = post
        }

        // if (post.link_flair_text.match(/meme/gi) && post.created_utc > fdate - 24 * 60 * 60) {
        //     user.meme[post.created_utc] = post
        //     console.log(post.author.name)
        // }
    }

    for (let user of postList) {
        for (let key of Object.keys(user.posts))
            if (key < date)
                delete user.posts[key]

        let keys = Object.keys(user.posts)
        if (keys.length > limit) {

            for (let i = limit; i < keys.length; ++i) {
                let message = removePost + "\n\n----\n" + reason + "\n\n----\n" + botSig
                console.log(reason, user.name, "https://reddit.com" + user.posts[keys[i]].permalink)

                user.posts[keys[i]].reply(message)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.log("error a", typeof err === "string" ? err : JSON.stringify(err)))

                user.posts[keys[i]].report({
                        reason: "exceded posting limits"
                    }).remove()
                    .catch(err => console.log("error b", typeof err === "string" ? err : JSON.stringify(err)))

                delete user.posts[keys[i]]
            }
        }
    }
}

const removePost = 'Thank You for posting to r/NoMansSkyTheGame. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmstgBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NoMansSkyTheGame).*"
const postLimit = "Posting limits: OP is allowed to make 2 post/hour"
const videoLimit = "Posting limits: OP is allowed to make 1 video post/week"
const memeLimit = "Posting limits: OP is allowed to make 5 meme post/day"
const firstPost = "Thank you for posting to r/NoMansSkyTheGame and taking an active part in the community! Since this is your first post it has been sent for moderator approval. This is one of the anti-spam measures we're forced to use. In the meantime checkout our posting rules listed in the sidebar.\n\nSince moderators are not always available *please* be patient and don't contact them about when your post will be approved."