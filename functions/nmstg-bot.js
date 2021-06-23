'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}

var userPosts = []
var userVideos = []

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
        limit: 100
    } : {
        before: lastPost.name
    }).then(posts => {
        console.log("post", posts.length)

        if (posts.length > 0 || !lastPost.full || lastPost.full + 60 * 60 < date)
            lastPost.full = date

        if (posts.length > 0) {
            lastPost.name = posts[0].name
            checkPostLimits(posts, userPosts, 2, date - 55 * 60, postLimit)
        }
    }).catch(err => {
        console.log("error 1", typeof err === "string" ? err : JSON.stringify(err))
    }))

    p.push(sub.search(!lastSearch.name || lastSearch.full + 12 * 60 * 60 < date ? {
        query: "flair_text:Video",
        time: "week",
        limit: 200
    } : {
        before: lastSearch.name
    }).then(posts => {
        console.log("video", posts.length)

        if (/*posts.length > 0 || */!lastSearch.full || lastSearch.full + 12 * 60 * 60 < date)
            lastSearch.full = date

        if (posts.length > 0) {
            lastSearch.name = posts[0].name
            checkPostLimits(posts, userVideos, 1, date - 7 * 24 * 60 * 60, videoLimit)
        }
    }).catch(err => {
        console.log("error 2", typeof err === "string" ? err : JSON.stringify(err))
    }))

    return Promise.all(p)
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