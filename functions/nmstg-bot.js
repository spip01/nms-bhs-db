'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}

var userPosts = []
var userVideos = []
var mods = []
var rules = {}

// main()
// async function main() {

exports.nmstgBot = async function () {

    if (!sub) {
        console.log("new instance")
        sub = await r.getSubreddit('NoMansSkyTheGame')
    }

    let date = parseInt(new Date().valueOf() / 1000)
    let p = []

    p.push(sub.getNew(!lastPost.name || lastPost.full + 60 * 60 < date ? {
        limit: 100,
        time: "hour"
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
        }
    }).catch(err => {
        console.log("error 1", typeof err === "string" ? err : JSON.stringify(err))
    }))

    p.push(sub.search(!lastSearch.name || lastSearch.full + 60 * 60 < date ? {
        query: "flair_text:Video",
        time: "week",
        limit: 200
    } : {
        query: "flair_text:Video",
        before: lastSearch.name
    }).then(posts => {
        console.log("video", posts.length)

        if (posts.length > 0 || !lastSearch.full || lastSearch.full + 60 * 60 < date)
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

    if (Object.keys(rules).length === 0) {
        let r = await sub.getRules()
        for (let x of r.rules) {
            rules[x.priority + 1] = {
                text: x.description
            }

            // let lines = x.description.split("\n")
            // let c = 1
            // for (let i = 0; i < lines.length; ++i) {
            //     if (lines[i][0] === '-') {
            //         rules[x.priority + 1][c++] = lines[i]
            //     }
            // }
        }
    }

    if (mods.length === 0) {
        let m = await sub.getModerators()

        for (let x of m)
            if (x.name !== "AutoModerator" && x.name !== "FlairHelperBot" && x.name !== "nmsceBot")
                mods.push({
                    name: x.name,
                    user: await r.getUser(x.name),
                    last: {
                        name: "",
                        full: 0
                    }
                })
    }

    for (let m of mods) {
        p.push(m.user.getComments(!m.last.name || m.last.full + 2 * 60 * 60 < date ? {
            limit: 10
        } : {
            before: m.last.name
        }).then(posts => {
            console.log("comments " + m.name, posts.length)

            if (posts.length > 0 || !m.last.full || m.last.full + 2 * 60 * 60 < date)
                m.last.full = date

            if (posts.length > 0) {
                m.last.name = posts[0].name
                modCommands(posts)
            }
        }).catch(err => {
            console.log("error 3", typeof err === "string" ? err : JSON.stringify(err))
        }))
    }

    return Promise.all(p)
}

async function modCommands(posts) {
    for (let post of posts) {
        if (!post.banned_by && post.body.startsWith("!r")) {
            console.log("command", post.body)

            let match = post.body.slice(2).split(",")
            let message = removePost + "\n\n----\n"

            for (let r of match) {
                let i = parseInt(r)

                if (typeof rules[i] !== "undefined")
                    message += (message ? "\n\n----\n" : "") + rules[i].text
            }

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

            post.remove()
                .catch(err => console.log("error 7", typeof err === "string" ? err : JSON.stringify(err)))

            oppost.remove()
                .catch(err => console.log("error 8", typeof err === "string" ? err : JSON.stringify(err)))

            console.log("remove: " + "rule: " + match, "https://reddit.com" + oppost.permalink)
        }
    }
}

async function checkPostLimits(posts, postList, limit, date, reason) {
    for (let post of posts) {
        if (!post.name.includes("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        let user = postList.find(a => {
            return a.name === post.author.name
        })

        if (typeof user === "undefined") {
            let user = {}
            user.name = post.author.name
            user.posts = {}
            user.posts[post.created_utc] = post
            postList.push(user)
        } else {
            user.posts[post.created_utc] = post
        }
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