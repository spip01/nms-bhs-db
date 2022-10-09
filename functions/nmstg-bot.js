'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const r = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}
var nextCheck = 0
var toolbox = {}
var toolboxdl = false
var userPosts = []
var userVideos = []
var mods = []

// main()
// async function main() {
//     let firstRead = 200

exports.nmstgBot = async function () {
    let firstRead = 100

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
        limit: firstRead // make sure to cover 24 hours for posting limit
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
            checkPostLimits(posts, userPosts, 2, 60 * 60, postLimit)
            checkNewPosters(posts, 10)
            updateWiki(posts)
        }
    }).catch(err => {
        error("1", err)
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
            checkPostLimits(posts, userVideos, 2, 7 * 24 * 60 * 60, videoLimit)
        }
    }).catch(err => {
        error("2", err)
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
        reapproveBotComments(posts)
    }).catch(err => {
        error("3", err)
    }))

    return Promise.all(p)
}

async function reapproveBotComments(posts) {
    for (let post of posts) {
        if (post.author.name === "AutoModerator" || post.author.name === "nmsceBot")
            post.approve()
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
                    r.composeMessage({
                        to: posts[0].author.name,
                        subject: "First post to r/NoMansSkyTheGame",
                        text: firstPost
                    }).catch(err => error('f', err))
                }
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
    let changed = []

    for (let post of posts)
        if ((post.link_flair_text === "Weekly-Thread" || post.link_flair_text === "Bug-Thread"))
            changed.push(post)

    if (changed.length > 0) {
        let wiki = await sub.getWikiPage("mega-threads")
        let page = await wiki.fetch().content_md

        for (let post of changed) {
            if (!page.includes(post.id)) {
                let title = post.permalink.split("/")
                let loc = page.indexOf(title[5].slice(0, 20))
                if (loc) {
                    let insert = page.lastIndexOf("/", loc - 2) + 1
                    page = page.slice(0, insert) + post.id + page.slice(loc - 1)
                }
            }
        }

        console.log('update wiki')

        wiki.edit({
                text: page,
                reason: "bot-update weekly thread urls"
            })
            .catch(err => error("w", err))
    }
}

async function modCommands(posts, mods) {
    for (let post of posts) {
        if (post.name.startsWith("t1_") && mods.includes(post.author_fullname) && post.body.match(/!(r.*|c.*|votes)/i)) {
            console.log("command", post.body)

            if (post.body.startsWith("!votes")) {
                await getVotes(post)
                return
            } else if (post.body.startsWith("!c")) {
                let message = post.body.replace(/!c\s?(.*)/, "$1")
                message += "\n\n----\nThis comment was made by a moderator of r/NoMansSkyTheGame. If you have questions please contact them via mod mail."

                let op = await r.getComment(post.parent_id)

                op.reply(message)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => error("c0", err))

                post.remove()
                    .catch(err => error("c1", err))

                console.log("mod comment")
            } else {
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
                    .catch(err => error("5", err))

                post.remove()
                    .catch(err => error("7", err))

                oppost.remove()
                    .catch(err => error("8", err))

                console.log("remove: " + "rule: " + match, "https://reddit.com" + oppost.permalink)
            }
        }
    }
}

function getVotes(op) {
    return sub.search({
        query: "subreddit:nomansskythegame flair:contest",
        limit: 1000,
        time: "month"
    }).then(async posts => {
        let p = []
        let total = 0

        for (let post of posts) {
            p.push({
                link: post.permalink,
                votes: post.ups + post.downs + post.total_awards_received,
                title: post.title,
            })
            total += post.ups + post.downs + post.total_awards_received
        }

        p.sort((a, b) => a.votes >= b.votes ? -1 : 1)

        let text = "Total entries: " + posts.length + " Total votes: " + total + "  \n"
        for (let i = 0; i < 10 && i < p.length; ++i)
            text += p[i].votes + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

        console.log(text)

        r.composeMessage({
            to: op.author,
            subject: "NMSTG Contest",
            text: text
        }).catch(err => error(16, err))

        op.remove()
            .catch(err => error(17, err))
    }).catch(err => {
        error(18, err)
    })
}

async function checkPostLimits(posts, postList, limit, time, reason) {
    let addList = function (postList, post) {
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

    if (posts) // add video to flair if it isn't included
        for (let post of posts) {
            if (!post.name.includes("t3_") || post.selftext === "[deleted]") // submission
                continue

            if (!post.link_flair_text.includes("Bug") && !post.link_flair_text.includes("Video") && !post.link_flair_text.includes("Question") && !post.link_flair_text.includes("Answered") && typeof post.secure_media !== "undefined" && post.secure_media &&
                (typeof post.secure_media.reddit_video !== "undefined" || typeof post.secure_media.oembed !== "undefined" && (post.secure_media.oembed.type === "video" || post.secure_media.type === "twitch.tv"))) {

                addList(userVideos, post)
                console.log("video flair: https://reddit.com" + post.permalink)
                post.selectFlair({
                    flair_template_id: post.link_flair_template_id,
                    text: post.link_flair_text + " Video"
                }).catch(err => error(13, err))

                continue
            }

            addList(postList, post)
        }

    time -= 5
    let message = removePost + "\n\n----\n" + reason + "\n\n----\n" + botSig

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

                    console.log("limit > " + limit + " / " + time, user.name, parseInt((n - o) / 60), "https://reddit.com" + posts[i].permalink)

                    posts[i].reply(message)
                        .distinguish({
                            status: true
                        }).lock()
                        .catch(err => error("a", err))

                    posts[i].report({
                            reason: reason
                        }).remove()
                        .catch(err => error("b", err))

                    posts.splice(i, 1)
                }
            }

            posts.splice(3, 999) // maximum post limit
        }
    }
}

function error(n, err) {
    console.log("error " + n, err)
}

const removePost = 'Thank You for posting to r/NoMansSkyTheGame. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmstgBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NoMansSkyTheGame).*"
const postLimit = "Posting limit exceded: OP is allowed to make 2 post/hour"
const videoLimit = "Posting limits exceded: OP is allowed to make 2 video post/week"
const firstPost = "Thank you for posting to r/NoMansSkyTheGame and taking an active part in the community! Since this is your first post to r/NoMansSkyTheGame it has been sent for moderator approval. This is one of the anti-spam measures we're forced to use. In the meantime checkout our posting rules listed in the sidebar.\n\nSince moderators are not always available *please* be patient and don't contact them about when your post will be approved."
