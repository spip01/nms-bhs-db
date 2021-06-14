'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}

// main()
// async function main() {

exports.nmstgBot = async function () {

    if (!sub) {
        console.log("new instance")
        sub = await r.getSubreddit('NoMansSkyTheGame')
    }

    let date = new Date().valueOf() / 1000
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
            checkPostLimits(posts)
        }
    }).catch(err => {
        console.log("error 1", typeof err === "string" ? err : JSON.stringify(err))
    }))

    if (!lastSearch.name || lastSearch.full + 4 * 60 * 60 < date)
        p.push(sub.search({
            query: "flair:Video",
            time: "week",
            sort: "new"
        }).then(posts => {
            console.log("video", posts.length)

            if (!lastSearch.full || lastSearch.full + 4 * 60 * 60 < date)
                lastSearch.full = date

            if (posts.length > 0) {
                lastSearch.name = posts[0].name
                checkVideoLimits(posts)
            }
        }).catch(err => {
            console.log("error 2", typeof err === "string" ? err : JSON.stringify(err))
        }))

    return Promise.all(p)
}

var userPosts = []

async function checkPostLimits(posts) {
    for (let post of posts) {
        if (!post.name.includes("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        if (post.banned_by || post.removed_by_category === "automod_filtered" ||
            post.removed_by_category === "reddit" || post.mod_reports.length > 0 ||
            post.approved_by !== null && post.approved_by !== "nmsceBot")
            continue

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
            user.posts[post.created] = post

            let keys = Object.keys(user.posts)

            if (keys.length > 2) {
                let date = parseInt(keys[2]) - 55 * 60

                for (let key of keys) {
                    if (key < date) {
                        delete user.posts[key]
                        continue
                    }
                }

                keys = Object.keys(user.posts)

                for (let i = 2; i < keys.length; ++i) {
                    let message = removePost + "\n\n----\n" + postLimit + "\n\n----\n" + botSig
                    console.log("exceded 2/hour", user.name, "https://reddit.com" + user.posts[keys[i]].permalink)

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
}

async function checkVideoLimits(posts) {
    let userPosts = []

    for (let post of posts) {
        if (!post.name.includes("t3_") || post.locked || post.selftext === "[deleted]") // submission
            continue

        if (post.banned_by || post.removed_by_category === "automod_filtered" ||
            post.removed_by_category === "reddit" || post.mod_reports.length > 0 ||
            post.approved_by !== null && post.approved_by !== "nmsceBot")
            continue

        let user = userPosts.find(a => {
            return a.name === post.author.name
        })

        if (typeof user === "undefined") {
            let user = {}
            user.name = post.author.name
            user.posts = {}
            user.posts[post.created] = post
            userPosts.push(user)
        } else
            user.posts[post.created] = post
    }

    let message = removePost + "\n\n----\n" + videoLimit + "\n\n----\n" + botSig

    for (let user of userPosts) {
        let keys = Object.keys(user.posts)

        for (let i = 1; i < keys.length; ++i) {
            console.log("exceded 1 video/week", user.name, "https://reddit.com" + user.posts[keys[i]].permalink)

            user.posts[keys[i]].reply(message)
                .distinguish({
                    status: true
                }).lock()
                .catch(err => console.log("error a", typeof err === "string" ? err : JSON.stringify(err)))

            user.posts[keys[i]].report({
                    reason: "exceeded video limits"
                }).remove()
                .catch(err => console.log("error b", typeof err === "string" ? err : JSON.stringify(err)))
        }
    }
}

const removePost = 'Thank You for posting to r/NoMansSkyTheGame. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmsceBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NoMansSkyTheGame).*"
const postLimit = "Posting limits: OP is allowed to make 2 post/hour"
const videoLimit = "Posting limits: OP is allowed to make 1 video post/week"