'use strict'

// const {
//     CommentStream
// } = require('snoostorm')

const snoowrap = require('snoowrap')
const login = require('./nmsce-bot.json')
const r = new snoowrap(login)
var fs = require('fs')

// main()
// const fname = "reddit.json"
// async function main() {

const fname = "/tmp/reddit.json"
exports.nmsceBot = async function () {
    const subreddit = await r.getSubreddit('NMSCoordinateExchange')

    fs.readFile(fname, async (err, data) => {
        let posts
        let last = {}
        let date = new Date().valueOf() - 1 * 60 * 60

        if (err) {
            last.full = new Date().valueOf()
            posts = await subreddit.getNew({
                limit: 100
            })
        } else {
            last = JSON.parse(data)
            if (!last.full || last.full < date) {
                last.full = new Date().valueOf()
                posts = await subreddit.getNew({
                    limit: 100
                })
            } else
                posts = await subreddit.getNew({
                    after: last.after
                })
        }

        if (posts.length > 0)
            last.after = posts[posts.length - 1].id

        validatePosts(posts)

        posts = await subreddit.getModqueue()
        validatePosts(posts)

        let logs = await subreddit.getModerationLog(last.mod ? {
            mod: last.mod
        } : {
            limit: 500
        })

        date = parseInt(new Date().valueOf() / 1000 - 24 * 60 * 60)
        let list = []

        for (let log of logs) {
            if (log.target_fullname && log.created_utc < date)
                last.mod = log.target_fullname.slice(3)

            if (log.mod === "nmsceBot" && log.action === "removelink") {
                if (!list.includes(log.target_fullname)) {
                    list.push(log.target_fullname)
                    let post = await (await r.getSubmission(log.target_fullname.slice(3))).refresh()
                    posts.push(post)
                    validatePosts(posts)
                }
            }
        }
        console.log(last)
        if (last.after || last.mod || last.full)
            fs.writeFileSync(fname, JSON.stringify(last))
    })
}

function validatePosts(posts) {
    let flair

    for (let post of posts) {
        let ok = post.link_flair_text
        let reason = ""

        if (!post.name.includes("t3_")) // submission
            continue

        if (ok)
            ok = (flair = getItem(flairList, post.link_flair_text)) !== null

        if (!ok) {
            if (!post.removed_by_category) {
                console.log("bad flair", post.link_flair_text, "https://reddit.com" + post.permalink)
                post.save().remove()
                    .reply(missingFlair)
                    .distinguish({
                        status: true
                    }).lock()
                    .catch(err => console.log(JSON.stringify(err)))
            }

            continue
        }

        if (flair.noedit)
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
            let newFlair = flair.name + "/" + galaxy.name + (flair.platform ? "/" + platform.name + (flair.mode ? "/" + mode.name : "") : "")
            if (newFlair !== post.link_flair_text) {
                console.log("edit", post.link_flair_text, newFlair, "https://reddit.com" + post.permalink)
                post.selectFlair({
                    flair_template_id: post.link_flair_template_id,
                    text: newFlair
                }).catch(err => console.log(JSON.stringify(err)))
            }

            if ((!flair.sclass || !post.title.match(/s\bclass/i) || post.title.match(/crash|sunk/i)) &&
                (post.banned_by && post.banned_by.name === "nmsceBot" || post.removed_by_category === "automod_filtered" ||
                    post.removed_by_category === "reddit" || post.mod_reports.length > 0)) {

                console.log("approve", newFlair, "https://reddit.com" + post.permalink)
                post.approve()
                    .catch(err => console.log(JSON.stringify(err)))
            }
        } else if (reason && !post.removed_by_category) {
            console.log("remove", post.flair, "https://reddit.com" + post.permalink)
            post.save().remove()
                .reply(missingInfo.replace(/(.*?)MISSING(.*?)MISSING(.*?)/, "$1" + reason + "$2" + reason + "$3"))
                .distinguish({
                    status: true
                }).lock()
                .catch(err => console.log(JSON.stringify(err)))
        }
    }
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

const missingInfo = "Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because all the required information (MISSING) is not included in the title or flair. If you \
add the MISSING within 24 hours it will be re-approved. \
You can edit the flair after the post is made. When you select the flair you can edit the text in the box. In the app there is an edit button you need to press.\n\n*This action was taken by \
the nmsceBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NMSCoordinateExchange).*"

const missingFlair = "Thank You for posting to r/NMSCoordinateExchange. Your post has been removed because the flair was missing or unrecognized. If you \
add the correct flair within 24 hours it will be re-approved. \
You can edit the flair after the post is made. When you select the flair you can edit the text in the box. In the app there is an edit button you need to press.\n\n*This action was taken by \
the nmsceBot. If you have any questions please contact the [moderators](https://www.reddit.com/message/compose/?to=/r/NMSCoordinateExchange).*"

const flairList = [{
    match: /Starship/i,
    name: "Starship",
    galaxy: true,
    sclass: true
}, {
    match: /Living Ship/i,
    name: "Living Ship",
    galaxy: true
}, {
    match: /Multi Tool/i,
    name: "Multi Tool",
    galaxy: true
}, {
    match: /Freighter/i,
    name: "Freighter",
    galaxy: true,
    sclass: true
}, {
    match: /Frigate/i,
    name: "Frigate",
    galaxy: true,
    sclass: true
}, {
    match: /Wild Base/i,
    name: "Wild Base",
    galaxy: true
}, {
    match: /Base/i,
    name: "Base",
    galaxy: true,
    platform: true,
    mode: true
}, {
    match: /Farm/i,
    name: "Farm",
    galaxy: true,
    platform: true,
    mode: true
}, {
    match: /Fauna/i,
    name: "Fauna",
    galaxy: true
}, {
    match: /Planet/i,
    name: "Planet",
    galaxy: true
}, {
    match: /Event|Request|Showcase|Question|Tips|Information|Top|Mod|NEWS|Removed/i,
    noedit: true
}, ]

const platformList = [{
    match: /\bPC\b|steam/i,
    name: "PC"
}, {
    match: /X.?Box/i,
    name: "XBox"
}, {

    match: /PS4/i,
    name: "PS4"
}]

const modeList = [{
    match: /Normal/i,
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
}]

const galaxyList = [{
    match: /\bEucl\w+d\b/i,
    name: "Euclid"
}, {
    match: /\bHilb\w+t\b/i,
    name: "Hilbert"
}, {
    match: /\bCaly\w+o\b/i,
    name: "Calypso"
}, {
    match: /\bHesp\w+s\b/i,
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
    match: /\bEbye\w+d\b/i,
    name: "Ebyeloofdud"
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