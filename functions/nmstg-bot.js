'use strict'

const login = require('./nmsce-bot.json')
const snoowrap = require('snoowrap')
const { RedditUser } = require('snoowrap')
const reddit = new snoowrap(login)

var sub = null
var lastPost = {}
var lastSearch = {}
var toolbox = {}
var userPosts = []
var siteAds = []
var civPost = []
var userVideos = []
var mods = []

main()
async function main() {
    let firstRead = 200

    reddit.config({
        continueAfterRatelimitError: true,
        requestTimeout: 90000
    })

    sub = await reddit.getSubreddit('NoMansSkyTheGame')

    let wiki = await sub.getWikiPage("toolbox")
    let page = await wiki.fetch()
    toolbox = JSON.parse(page.content_md)
    toolbox.removalReasons.header = mdParse(toolbox.removalReasons.header)
    toolbox.removalReasons.footer = mdParse(toolbox.removalReasons.footer)
    for (let i of toolbox.removalReasons.reasons)
        i.text = mdParse(i.text)

    let m = await sub.getModerators()
    for (let x of m)
        mods.push(x.id)

    setInterval(async () => {
        console.log("start run")

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
                let p = []
                p.push(checkPostLimits(posts, userPosts, 2, 60 * 60, postLimit))
                p.push(checkNewPosters(posts, 10))
                p.push(updateWiki(posts))
                return Promise.all(p)
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
                return checkPostLimits(posts, userVideos, 2, 7 * 24 * 60 * 60, videoLimit)
            }
        }).catch(err => { error("2", err) }))

        p.push(sub.getModqueue().then(posts => {
            console.log("queue", posts.length)
            let p = []
            p.push(modCommands(posts, mods))
            p.push(reapproveBotComments(posts))
            return Promise.all(p)
        }).catch(err => { error("3", err) }))

        await Promise.all(p)
        console.log("done")
    }, 30000)
}

function reapproveBotComments(posts) {
    let p = []
    for (let post of posts)
        if (post.author.name === "AutoModerator" || post.author.name === "nmsceBot")
            p.push(post.approve())

    return Promise.all(p)
}

var posters = []
var firsttime = []

function checkNewPosters(posts, limit) {
    let p = []

    for (let i = 0; i < limit && i < posts.length; ++i) { // limit number is for a new instance
        let post = posts[i]

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
                else if (!firsttime.includes(posts[0].name)) {
                    firsttime.push(posts[0].name)
                    console.log("new poster", posts[0].author.name)

                    let p = []
                    p.push(posts[0].reply("!filter-First Post").catch(err => error('f0', err)))

                    p.push(reddit.composeMessage({
                        to: posts[0].author.name,
                        subject: "First post to r/NoMansSkyTheGame",
                        text: firstPost
                    }).catch(err => error('f1', err)))

                    return Promise.all(p)
                }
            }
        }))
    }

    return Promise.all(p)
}

async function updateWiki(posts) {
    let changed = []

    for (let post of posts)
        if ((post.link_flair_text === "Weekly-Thread" || post.link_flair_text === "Bug-Thread" || post.link_flair_text === "Megathread"))
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

        return wiki.edit({
            text: page,
            reason: "bot-update scheduled thread urls"
        }).catch(err => error("w", err))
    }
}

function modCommands(posts, mods) {
    let p = []

    for (let post of posts) {
        if (post.name.startsWith("t1_") && mods.includes(post.author_fullname) && post.body.match(/!(r.*|c.*|votes?|check|comments?|help)/i)) {
            console.log("command", post.body)

            if (post.body.startsWith("!vote"))
                p.push(getVotes(post))

            else if (post.body.startsWith("!comment"))
                p.push(getTopComments(post))

            else if (post.body.startsWith("!check"))
                p.push(checkContestLimit(post))

            else if (post.body.startsWith("!help")) {
                p.push(reddit.composeMessage({
                    to: post.author,
                    subject: "NMSTG bot commands",
                    text: help
                }).catch(err => error(16, err)))

                p.push(post.remove().catch(err => error(17, err)))

            } else if (post.body.startsWith("!c")) {
                let message = post.body.replace(/!c\s?(.*)/, "$1")
                message += "\n\n----\nThis comment was made by a moderator of r/NoMansSkyTheGame. If you have questions please contact them via mod mail."

                p.push(reddit.getComment(post.parent_id).reply(message)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => error("c0", err)))

                p.push(post.remove().catch(err => error("c1", err)))
            } else {
                let match = post.body.slice(2).split(",")
                let message = toolbox.removalReasons.header + "\n\n----\n"

                for (let r of match) {
                    let i = parseInt(r)

                    if (typeof toolbox.removalReasons.reasons[i - 1].text !== "undefined")
                        message += toolbox.removalReasons.reasons[i - 1].text + "\n\n----\n"
                }

                message += toolbox.removalReasons.footer

                p.push(reddit.getComment(post.parent_id).fetch().then(op => {
                    let p = []

                    p.push(op.reply(message)
                        .distinguish({
                            status: true
                        }).lock()
                        .catch(err => error("5", err)))

                    p.push(op.remove()
                        .catch(err => error("7", err)))

                    console.log("remove: " + "rule: " + match, "https://reddit.com" + oppost.permalink)

                    return Promise.all(p)
                }))

                p.push(post.remove()
                    .catch(err => error("8", err)))
            }
        }
    }

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

        if (month && month.length > 1) {
            month = month[1]
        } else {
            return reddit.composeMessage({
                to: op.author,
                subject: "Vote count needs month",
                text: "!votes [month]\n[month]: First significant characters of contest month"
            }).catch(err => error(16, err))
        }

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

            let text = "Total entries: " + posts.length + " Total votes: " + total + "  \n"
            for (let i = 0; i < 10; ++i)
                text += p[i].votes + ": [" + p[i].title + "](https://reddit.com" + p[i].link + ")  \n"

            return reddit.composeMessage({
                to: op.author,
                subject: "NMSTG contest results for " + month,
                text: text
            }).catch(err => error(16, err))
        }).catch(err => {
            error(18, err)
        })
    }).catch(err => error(17, err))
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
                text: "!comments [month]\n[month]: First significant characters of contest month. e.g. '!comments Feb'"
            }).catch(err => error(16, err))
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

            text += "  \n------------------------------  \n\n"

            for (let i = 0; i < 10; ++i)
                text += c[i].votes + ": [" + c[i].title + "](https://reddit.com" + c[i].link + "): [" + c[i].optitle + "](https://reddit.com" + c[i].oplink + ")  \n"

            return reddit.composeMessage({
                to: op.author,
                subject: "NMSTG contest results for " + month,
                text: text
            }).catch(err => error(16, err))
        }).catch(err => error(18, err))
    }).catch(err => error(17, err))
}

async function checkContestLimit(op) {
    return op.remove().then(() => {

        let month = op.body.match(/!check\s+(.*)/)

        if (month && month.length > 1) {
            month = month[1]
        } else {
            return reddit.composeMessage({
                to: op.author,
                subject: "Contest commands need month",
                text: "!check [month] \n[month]: First significant characters of contest month"
            }).catch(err => error(16, err))
        }

        return sub.search({
            query: "subreddit:nomansskythegame flair:contest",
            limit: 1000,
            time: "month"
        }).then(async posts => {

            posts.sort((a, b) => a.author.name >= b.author.name ? -1 : 1)
            let last = null
            let count = 0
            let text = "Check for > 3 contest post. Disqualified post: \n"
            let found = false
            for (let post of posts) {
                if (!post.link_flair_text.includes(month))
                    continue

                count = last && post.author.name === last.author.name ? count + 1 : 0
                last = post

                if (count > 3) {
                    found = true
                    text += "[" + post.title + "](https://reddit.com" + post.link + ")  \n"
                }
            }

            return reddit.composeMessage({
                to: op.author,
                subject: "NMSTG contest check " + month,
                text: found ? text : "No op has posted > 3 entries for the contest."
            }).catch(err => error(16, err))
        }).catch(err => error(18, err))
    }).catch(err => error(17, err))
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
                await post.selectFlair({
                    flair_template_id: post.link_flair_template_id,
                    text: post.link_flair_text + " Video"
                }).catch(err => error(13, err))

                continue
            }

            addList(postList, post)
        }

    time -= 5 * 60
    let p = []
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

                    p.push(posts[i].reply(message)
                        .distinguish({
                            status: true
                        }).lock()
                        .catch(err => error("a", err)))

                    posts.splice(i, 1)
                }
            }

            posts.splice(3, 999) // maximum post limit
        }
    }

    return Promise.all(p)
}

function mdParse(text) {
    text = /%20/ig[Symbol.replace](text, " ")
    text = /%21/ig[Symbol.replace](text, "!")
    text = /%2c/ig[Symbol.replace](text, ",")
    text = /%3a/ig[Symbol.replace](text, ":")
    text = /%0a/ig[Symbol.replace](text, "\n")
    text = /%5b/ig[Symbol.replace](text, "[")
    text = /%5d/ig[Symbol.replace](text, "]")
    text = /%28/ig[Symbol.replace](text, "(")
    text = /%29/ig[Symbol.replace](text, ")")
    text = /%27/ig[Symbol.replace](text, "'")
    text = /%22/ig[Symbol.replace](text, "\"")
    text = /%26/ig[Symbol.replace](text, "&")
    text = /%3b/ig[Symbol.replace](text, ";")
    return text
}

function error(n, err) {
    console.log("error " + n, err)
}

const removePost = 'Thank You for posting to r/NoMansSkyTheGame. Your post has been removed because it violates the following rules for posting:\n\n'
const botSig = "\n\n*This action was taken by the nmstgBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NoMansSkyTheGame).*"
const postLimit = "Posting limit exceded: OP is allowed to make 2 post/hour"
const videoLimit = "Posting limits exceded: OP is allowed to make 2 video post/week"

const firstPost = "Thank you for posting to r/NoMansSkyTheGame and taking an active part in the community! Since this is your first post to r/NoMansSkyTheGame it has been queued for moderator approval. This is one of the anti-spam measures we're forced to use because of the subs size. In the meantime checkout our posting rules listed in the sidebar.\n\nSince moderators are not always available *please* be patient and don't contact them about when your post will be approved."

const help = `!r[n]: Remove post using rule [n] as reason or [n,n] for multiple reasons. Don't include '[]'.  \n
!c: Add annonymous comment to op  \n
!votes [month]: Count votes for contest flair using "Contest / [month]" flair. [month] is required. e.g. '!votes Feb'  \n
!comments [month]: Count votes for top comments for contest flair.  \n
!check [month]: Validate that no op has made more than 3 contest entries. \n
!help: This list  \n`
