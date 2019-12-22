'use strict'

// Copyright 2019 Black Hole Suns
// Written by Stephen Piper

const findex = window.location.pathname == "/index.html" || window.location.pathname == "/"
const fpoi = window.location.pathname == "/poiorg.html"
const fdarc = window.location.pathname == "/darc.html"
const ftotals = window.location.pathname == "/totals.html"
const fsearch = window.location.pathname == "/search.html"
const fcedata = window.location.pathname == "/cedata.html"
const fnmsce = window.location.pathname == "/nmsce.html"

function addGlyphButtons(loc, fcn) {
    const gbtn = `
        <button type="button" class="btn-def btn btn-sm col-sm-p125 col-3 h6">
            <span class="h5 glyph">title</span>
            -title
        </button>`

    let h = ""
    for (let i = 0; i < 16; ++i) {
        h += /title/g [Symbol.replace](gbtn, i.toString(16).toUpperCase())
    }

    loc.append(h)

    loc.find(":button").click(function () {
        fcn(this)
    })
}

function reformatAddress(addr) {
    let out = ""
    addr = addr.toUpperCase()

    if (addr.match(/^[0-9A-F]{12}$/))
        out = glyphToAddr(addr)
    else {
        let str = /[^0-9A-F]+/g [Symbol.replace](addr.toUpperCase(), ":")
        str = str[0] == ":" ? str.slice(1) : str

        for (let i = 0; i < 4; ++i) {
            let idx = str.indexOf(":")
            let end = idx > 4 || idx == -1 ? 4 : idx
            let s = str.slice(0, end)
            str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0))
            out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "")
        }
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

function addressToXYZ(addr) {
    let out = {
        x: 0,
        y: 0,
        z: 0,
        s: 0
    }

    // xxx:yyy:zzz:sss
    if (addr) {
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

function xyzToAddress(xyz) {
    let x = xyz.x.toString(16)
    let z = xyz.z.toString(16)
    let y = xyz.y.toString(16)
    let s = xyz.s.toString(16)

    let addr = x + "." + y + "." + z + "." + s
    return reformatAddress(addr)
}

function glyphToAddr(glyph) {
    //const portalFormat = "psssyyzzzxxx"

    if (glyph) {
        let xyz = {}
        xyz.s = parseInt(glyph.slice(1, 4), 16)
        xyz.y = (parseInt(glyph.slice(4, 6), 16) - 0x81) & 0xff
        xyz.z = (parseInt(glyph.slice(6, 9), 16) - 0x801) & 0xfff
        xyz.x = (parseInt(glyph.slice(9, 12), 16) - 0x801) & 0xfff

        return xyzToAddress(xyz)
    }

    return ""
}

function mergeObjects(o, n) {
    if (typeof n != "object") {
        o = n
    } else if (n) {
        if (typeof o == "undefined")
            o = {}
        for (let x of Object.keys(n))
            o[x] = mergeObjects(o[x], n[x])
    }

    return o
}

function addObjects(o, n) {
    if (typeof n != "object") {
        if (typeof n == "number") {
            if (typeof o == "undefined")
                o = 0
            o += n
        } else if (typeof n != "undefined")
            o = n
    } else if (n) {
        if (typeof o == "undefined")
            o = {}
        for (let x of Object.keys(n))
            o[x] = addObjects(o[x], n[x])
    }

    return o
}

String.prototype.idToName = function () {
    return /-/g [Symbol.replace](this, " ")
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

String.prototype.nameToId = function () {
    return /[^a-z0-9_-]/ig [Symbol.replace](this, "-")
}

String.prototype.stripColons = function () {
    return /:/g [Symbol.replace](this, "")
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/, "$1")
}

String.prototype.stripMarginWS = function () {
    return this.replace(/^\s*(.*)\s*$/g, "$1")
}

String.prototype.stripNumber = function () {
    return this.replace(/\s*-?\d*\.*\s*(\D*)\s*/, "$1")
}

function formatListSel(val, list) {
    let name = val.stripNumber()
    if (name === "") {
        let num = val.replace(/(\d+).*/, "$1")
        let idx = getIndex(list, "number", num)
        if (idx != -1)
            name = list[idx].name
    } else {
        let idx = getIndex(list, "name", name)
        if (idx != -1)
            name = list[idx].name
    }

    return name
}

function getIndex(list, field, id) {
    if (!id)
        return -1

    return list.map(x => {
        if (field === "name" && typeof x.match !== "undefined" && id.match(x.match))
            return x.name.toLowerCase()
        else
            return typeof x[field] === "string" ? x[field].toLowerCase() : x[field]
    }).indexOf(id.toLowerCase())
}

function calcDist(addr, addr2) {
    let xyz1 = addressToXYZ(addr)
    let xyz2 = typeof addr2 !== "undefined" ? addressToXYZ(addr2) : {
        x: 0x7ff,
        y: 0x7f,
        z: 0x7ff
    }
    return parseInt(calcDistXYZ(xyz1, xyz2) * 400)
}

function calcDistXYZ(xyz1, xyz2, xp, yp) {
    if (typeof xp !== "undefined" && typeof yp !== "undefined") {
        let x = xyz1[xp] - xyz2[xp]
        let y = xyz1[yp] - xyz2[yp]
        return Math.sqrt(x * x + y * y)
    } else {
        let x = xyz1.x - xyz2.x
        let y = xyz1.y - xyz2.y
        let z = xyz1.z - xyz2.z
        return Math.sqrt(x * x + y * y + z * z)
    }
}

function calcAngle(saddr, eaddr, xp, yp) {
    let zero = glyphToAddr("000000000000")
    let a = calcDist(zero, eaddr, xp, yp)
    let c = calcDist(saddr, eaddr, xp, yp)
    let b = calcDist(saddr, zero, xp, yp)
    let angle = parseInt(Math.acos((a * a - b * b - c * c) / (-2 * b * c)) * 180 / Math.PI)
    return Number.isNaN(angle) ? 0 : angle
}

Date.prototype.toDateLocalTimeString = function () {
    const ten = function (i) {
        return i < 10 ? '0' + i : i
    }

    return this.getFullYear() +
        "-" + ten(this.getMonth() + 1) +
        "-" + ten(this.getDate()) +
        " " + ten(this.getHours()) +
        ":" + ten(this.getMinutes()) +
        ":" + ten(this.getSeconds())
}

function buildGalaxyInfo() {
    for (let l of galaxyRaw)
        for (let j = l.start, step = 1; j <= 255;) {
            if (typeof galaxyList[j - 1].color === "undefined")
                galaxyList[j - 1].color = l.color

            j += step++ % 2 ? l.step1 : l.step2
        }

    for (let l of economyList)
        l.color = levelRgb[l.number]
}

/*************************
from https://nomanssky.gamepedia.com/Galaxy
Empty - blue- 7, 12, 27, 32, 47, 52, 67 etc, a total of 26. 
Harsh - red - 3, 15, 23, 35, 43, 55, 63 etc, a total of 26.
Lush - green - 10, 19, 30, 39, 50, 59, 70 etc, a total of 25.
Norm - teal - a total of 178.
**************************/

const galaxyRaw = [{
    name: "harsh",
    color: "#f3636b",
    start: 3,
    step1: 12,
    step2: 8
}, {
    name: "empty",
    color: "#65ccf4",
    start: 7,
    step1: 5,
    step2: 15
}, {
    name: "lush",
    color: "#62f97a",
    start: 10,
    step1: 9,
    step2: 11
}, {
    name: "norm",
    color: "#88fefa",
    start: 1,
    step1: 1,
    step2: 1
}]

const lifeformList = [{
    name: "Vy'keen",
    match: /^v/i
}, {
    name: "Gek",
    match: /^g/i
}, {
    name: "Korvax",
    match: /^k/i
}, {
    name: "Abandoned",
    match: /^a/i
}]

const ownershipList = [{
    name: "mine",
    match: /^m/i
}, {
    name: "visited",
    match: /^v/i
}, {
    name: "station",
    match: /^s/i
}]

const platformList = [{
    name: "PC-XBox",
    match: /^pc/i
}, {
    name: "PS4",
    match: /ps4/i
}]

const versionList = [{
    name: "next",
}, {
    name: "beyond",
}]

const modeList = [{
    name: "Normal",
}, {
    name: "Survival",
}, {
    name: "Permadeath",
}, {
    name: "Creative",
}]

const economyList = [{
    name: "None",
    number: 0
},{
    name: "Declining",
    number: 1
}, {
    name: "Destitute",
    number: 1

}, {
    name: "Failing",
    number: 1

}, {
    name: "Fledgling",
    number: 1

}, {
    name: "Low supply",
    number: 1

}, {
    name: "Struggling",
    number: 1

}, {
    name: "Unpromising",
    number: 1

}, {
    name: "Unsuccessful",
    number: 1

}, {
    name: "Adequate",
    number: 2

}, {
    name: "Balanced",
    number: 2

}, {
    name: "Comfortable",
    number: 2

}, {
    name: "Developing",
    number: 2

}, {
    name: "Medium Supply",
    number: 2

}, {
    name: "Promising",
    number: 2

}, {
    name: "Satisfactory",
    number: 2

}, {
    name: "Sustainable",
    number: 2

}, {
    name: "Advanced",
    number: 3

}, {
    name: "Affluent",
    number: 3

}, {
    name: "Booming",
    number: 3

}, {
    name: "Flourishing",
    number: 3

}, {
    name: "High Supply",
    number: 3

}, {
    name: "Opulent",
    number: 3

}, {
    name: "Prosperous",
    number: 3

}, {
    name: "Wealthy",
    number: 3
}]

const conflictList = [{
    name: "Gentle",
    number: 1
}, {
    name: "Low",
    number: 1
}, {
    name: "Mild",
    number: 1
}, {
    name: "Peaceful",
    number: 1
}, {
    name: "Relaxed",
    number: 1
}, {
    name: "Stable",
    number: 1
}, {
    name: "Tranquil",
    number: 1
}, {
    name: "Trivial",
    number: 1
}, {
    name: "Unthreatening",
    number: 1
}, {
    name: "Untroubled",
    number: 1
}, {
    name: "Medium",
    number: 2
}, {
    name: "Belligerent",
    number: 2
}, {
    name: "Boisterous",
    number: 2
}, {
    name: "Fractious",
    number: 2
}, {
    name: "Intermittent",
    number: 2
}, {
    name: "Medium",
    number: 2
}, {
    name: "Rowdy",
    number: 2
}, {
    name: "Sporadic",
    number: 2
}, {
    name: "Testy",
    number: 2
}, {
    name: "Unruly",
    number: 2
}, {
    name: "Unstable",
    number: 2
}, {
    name: "High",
    number: 3
}, {
    name: "Aggressive",
    number: 3
}, {
    name: "Alarming",
    number: 3
}, {
    name: "At War",
    number: 3
}, {
    name: "Critical",
    number: 3
}, {
    name: "Dangerous",
    number: 3
}, {
    name: "Destructive",
    number: 3
}, {
    name: "Formidable",
    number: 3
}, {
    name: "High",
    number: 3
}, {
    name: "Lawless",
    number: 3
}, {
    name: "Perilous",
    number: 3
}]

const starClassPossible = "OBAFGKMLTYE"
const starOdditiesPossible = "efhkmnpqsvw"
const starTypeRegex = /[OBAFGKMLTYE][0-9][efhkmnpqsvw]*/i
const levelRgb = ["#ffffff", "#ffc0c0", "#ffff00", "#c0ffc0"]

const galaxyList = [{
    name: "Euclid",
    number: 1,
}, {
    name: "Hilbert Dimension",
    number: 2
}, {
    name: "Calypso",
    number: 3
}, {
    name: "Hesperius Dimension",
    number: 4
}, {
    name: "Hyades",
    number: 5
}, {
    name: "Ickjamatew",
    number: 6
}, {
    name: "Budullangr",
    number: 7
}, {
    name: "Kikolgallr",
    number: 8
}, {
    name: "Eltiensleen",
    number: 9
}, {
    name: "Eissentam",
    number: 10
}, {
    name: "Elkupalos",
    number: 11
}, {
    name: "Aptarkaba",
    number: 12
}, {
    name: "Ontiniangp",
    number: 13
}, {
    name: "Odiwagiri",
    number: 14
}, {
    name: "Ogtialabi",
    number: 15
}, {
    name: "Muhacksonto",
    number: 16
}, {
    name: "Hitonskyer",
    number: 17
}, {
    name: "Rerasmutul",
    number: 18
}, {
    name: "Isdoraijung",
    number: 19
}, {
    name: "Doctinawyra",
    number: 20
}, {
    name: "Loychazinq",
    number: 21
}, {
    name: "Zukasizawa",
    number: 22
}, {
    name: "Ekwathore",
    number: 23
}, {
    name: "Yeberhahne",
    number: 24
}, {
    name: "Twerbetek",
    number: 25
}, {
    name: "Sivarates",
    number: 26
}, {
    name: "Eajerandal",
    number: 27
}, {
    name: "Aldukesci",
    number: 28
}, {
    name: "Wotyarogii",
    number: 29
}, {
    name: "Sudzerbal",
    number: 30
}, {
    name: "Maupenzhay",
    number: 31
}, {
    name: "Sugueziume",
    number: 32
}, {
    name: "Brogoweldian",
    number: 33
}, {
    name: "Ehbogdenbu",
    number: 34
}, {
    name: "Ijsenufryos",
    number: 35
}, {
    name: "Nipikulha",
    number: 36
}, {
    name: "Autsurabin",
    number: 37
}, {
    name: "Lusontrygiamh",
    number: 38
}, {
    name: "Rewmanawa",
    number: 39
}, {
    name: "Ethiophodhe",
    number: 40
}, {
    name: "Urastrykle",
    number: 41
}, {
    name: "Xobeurindj",
    number: 42
}, {
    name: "Oniijialdu",
    number: 43
}, {
    name: "Wucetosucc",
    number: 44
}, {
    name: "Ebyeloofdud",
    number: 45
}, {
    name: "Odyavanta",
    number: 46
}, {
    name: "Milekistri",
    number: 47
}, {
    name: "Waferganh",
    number: 48
}, {
    name: "Agnusopwit",
    number: 49
}, {
    name: "Teyaypilny",
    number: 50
}, {
    name: "Zalienkosm",
    number: 51
}, {
    name: "Ladgudiraf",
    number: 52
}, {
    name: "Mushonponte",
    number: 53
}, {
    name: "Amsentisz",
    number: 54
}, {
    name: "Fladiselm",
    number: 55
}, {
    name: "Laanawemb",
    number: 56
}, {
    name: "Ilkerloor",
    number: 57
}, {
    name: "Davanossi",
    number: 58
}, {
    name: "Ploehrliou",
    number: 59
}, {
    name: "Corpinyaya",
    number: 60
}, {
    name: "Leckandmeram",
    number: 61
}, {
    name: "Quulngais",
    number: 62
}, {
    name: "Nokokipsechl",
    number: 63
}, {
    name: "Rinblodesa",
    number: 64
}, {
    name: "Loydporpen",
    number: 65
}, {
    name: "Ibtrevskip",
    number: 66
}, {
    name: "Elkowaldb",
    number: 67
}, {
    name: "Heholhofsko",
    number: 68
}, {
    name: "Yebrilowisod",
    number: 69
}, {
    name: "Husalvangewi",
    number: 70
}, {
    name: "Ovna'uesed",
    number: 71
}, {
    name: "Bahibusey",
    number: 72
}, {
    name: "Nuybeliaure",
    number: 73
}, {
    name: "Doshawchuc",
    number: 74
}, {
    name: "Ruckinarkh",
    number: 75
}, {
    name: "Thorettac",
    number: 76
}, {
    name: "Nuponoparau",
    number: 77
}, {
    name: "Moglaschil",
    number: 78
}, {
    name: "Uiweupose",
    number: 79
}, {
    name: "Nasmilete",
    number: 80
}, {
    name: "Ekdaluskin",
    number: 81
}, {
    name: "Hakapanasy",
    number: 82
}, {
    name: "Dimonimba",
    number: 83
}, {
    name: "Cajaccari",
    number: 84
}, {
    name: "Olonerovo",
    number: 85
}, {
    name: "Umlanswick",
    number: 86
}, {
    name: "Henayliszm",
    number: 87
}, {
    name: "Utzenmate",
    number: 88
}, {
    name: "Umirpaiya",
    number: 89
}, {
    name: "Paholiang",
    number: 90
}, {
    name: "Iaereznika",
    number: 91
}, {
    name: "Yudukagath",
    number: 92
}, {
    name: "Boealalosnj",
    number: 93
}, {
    name: "Yaevarcko",
    number: 94
}, {
    name: "Coellosipp",
    number: 95
}, {
    name: "Wayndohalou",
    number: 96
}, {
    name: "Smoduraykl",
    number: 97
}, {
    name: "Apmaneessu",
    number: 98
}, {
    name: "Hicanpaav",
    number: 99
}, {
    name: "Akvasanta",
    number: 100
}, {
    name: "Tuychelisaor",
    number: 101
}, {
    name: "Rivskimbe",
    number: 102
}, {
    name: "Daksanquix",
    number: 103
}, {
    name: "Kissonlin",
    number: 104
}, {
    name: "Aediabiel",
    number: 105
}, {
    name: "Ulosaginyik",
    number: 106
}, {
    name: "Roclaytonycar",
    number: 107
}, {
    name: "Kichiaroa",
    number: 108
}, {
    name: "Irceauffey",
    number: 109
}, {
    name: "Nudquathsenfe",
    number: 110
}, {
    name: "Getaizakaal",
    number: 111
}, {
    name: "Hansolmien",
    number: 112
}, {
    name: "Bloytisagra",
    number: 113
}, {
    name: "Ladsenlay",
    number: 114
}, {
    name: "Luyugoslasr",
    number: 115
}, {
    name: "Ubredhatk",
    number: 116
}, {
    name: "Cidoniana",
    number: 117
}, {
    name: "Jasinessa",
    number: 118
}, {
    name: "Torweierf",
    number: 119
}, {
    name: "Saffneckm",
    number: 120
}, {
    name: "Thnistner",
    number: 121
}, {
    name: "Dotusingg",
    number: 122
}, {
    name: "Luleukous",
    number: 123
}, {
    name: "Jelmandan",
    number: 124
}, {
    name: "Otimanaso",
    number: 125
}, {
    name: "Enjaxusanto",
    number: 126
}, {
    name: "Sezviktorew",
    number: 127
}, {
    name: "Zikehpm",
    number: 128
}, {
    name: "Bephembah",
    number: 129
}, {
    name: "Broomerrai",
    number: 130
}, {
    name: "Meximicka",
    number: 131
}, {
    name: "Venessika",
    number: 132
}, {
    name: "Gaiteseling",
    number: 133
}, {
    name: "Zosakasiro",
    number: 134
}, {
    name: "Drajayanes",
    number: 135
}, {
    name: "Ooibekuar",
    number: 136
}, {
    name: "Urckiansi",
    number: 137
}, {
    name: "Dozivadido",
    number: 138
}, {
    name: "Emiekereks",
    number: 139
}, {
    name: "Meykinunukur",
    number: 140
}, {
    name: "Kimycuristh",
    number: 141
}, {
    name: "Roansfien",
    number: 142
}, {
    name: "Isgarmeso",
    number: 143
}, {
    name: "Daitibeli",
    number: 144
}, {
    name: "Gucuttarik",
    number: 145
}, {
    name: "Enlaythie",
    number: 146
}, {
    name: "Drewweste",
    number: 147
}, {
    name: "Akbulkabi",
    number: 148
}, {
    name: "Homskiw",
    number: 149
}, {
    name: "Zavainlani",
    number: 150
}, {
    name: "Jewijkmas",
    number: 151
}, {
    name: "Itlhotagra",
    number: 152
}, {
    name: "Podalicess",
    number: 153
}, {
    name: "Hiviusauer",
    number: 154
}, {
    name: "Halsebenk",
    number: 155
}, {
    name: "Puikitoac",
    number: 156
}, {
    name: "Gaybakuaria",
    number: 157
}, {
    name: "Grbodubhe",
    number: 158
}, {
    name: "Rycempler",
    number: 159
}, {
    name: "Indjalala",
    number: 160
}, {
    name: "Fontenikk",
    number: 161
}, {
    name: "Pasycihelwhee",
    number: 162
}, {
    name: "Ikbaksmit",
    number: 163
}, {
    name: "Telicianses",
    number: 164
}, {
    name: "Oyleyzhan",
    number: 165
}, {
    name: "Uagerosat",
    number: 166
}, {
    name: "Impoxectin",
    number: 167
}, {
    name: "Twoodmand",
    number: 168
}, {
    name: "Hilfsesorbs",
    number: 169
}, {
    name: "Ezdaranit",
    number: 170
}, {
    name: "Wiensanshe",
    number: 171
}, {
    name: "Ewheelonc",
    number: 172
}, {
    name: "Litzmantufa",
    number: 173
}, {
    name: "Emarmatosi",
    number: 174
}, {
    name: "Mufimbomacvi",
    number: 175
}, {
    name: "Wongquarum",
    number: 176
}, {
    name: "Hapirajua",
    number: 177
}, {
    name: "Igbinduina",
    number: 178
}, {
    name: "Wepaitvas",
    number: 179
}, {
    name: "Sthatigudi",
    number: 180
}, {
    name: "Yekathsebehn",
    number: 181
}, {
    name: "Ebedeagurst",
    number: 182
}, {
    name: "Nolisonia",
    number: 183
}, {
    name: "Ulexovitab",
    number: 184
}, {
    name: "Iodhinxois",
    number: 185
}, {
    name: "Irroswitzs",
    number: 186
}, {
    name: "Bifredait",
    number: 187
}, {
    name: "Beiraghedwe",
    number: 188
}, {
    name: "Yeonatlak",
    number: 189
}, {
    name: "Cugnatachh",
    number: 190
}, {
    name: "Nozoryenki",
    number: 191
}, {
    name: "Ebralduri",
    number: 192
}, {
    name: "Evcickcandj",
    number: 193
}, {
    name: "Ziybosswin",
    number: 194
}, {
    name: "Heperclait",
    number: 195
}, {
    name: "Sugiuniam",
    number: 196
}, {
    name: "Aaseertush",
    number: 197
}, {
    name: "Uglyestemaa",
    number: 198
}, {
    name: "Horeroedsh",
    number: 199
}, {
    name: "Drundemiso",
    number: 200
}, {
    name: "Ityanianat",
    number: 201
}, {
    name: "Purneyrine",
    number: 202
}, {
    name: "Dokiessmat",
    number: 203
}, {
    name: "Nupiacheh",
    number: 204
}, {
    name: "Dihewsonj",
    number: 205
}, {
    name: "Rudrailhik",
    number: 206
}, {
    name: "Tweretnort",
    number: 207
}, {
    name: "Snatreetze",
    number: 208
}, {
    name: "Iwunddaracos",
    number: 209
}, {
    name: "Digarlewena",
    number: 210
}, {
    name: "Erquagsta",
    number: 211
}, {
    name: "Logovoloin",
    number: 212
}, {
    name: "Boyaghosganh",
    number: 213
}, {
    name: "Kuolungau",
    number: 214
}, {
    name: "Pehneldept",
    number: 215
}, {
    name: "Yevettiiqidcon",
    number: 216
}, {
    name: "Sahliacabru",
    number: 217
}, {
    name: "Noggalterpor",
    number: 218
}, {
    name: "Chmageaki",
    number: 219
}, {
    name: "Veticueca",
    number: 220
}, {
    name: "Vittesbursul",
    number: 221
}, {
    name: "Nootanore",
    number: 222
}, {
    name: "Innebdjerah",
    number: 223
}, {
    name: "Kisvarcini",
    number: 224
}, {
    name: "Cuzcogipper",
    number: 225
}, {
    name: "Pamanhermonsu",
    number: 226
}, {
    name: "Brotoghek",
    number: 227
}, {
    name: "Mibittara",
    number: 228
}, {
    name: "Huruahili",
    number: 229
}, {
    name: "Raldwicarn",
    number: 230
}, {
    name: "Ezdartlic",
    number: 231
}, {
    name: "Badesclema",
    number: 232
}, {
    name: "Isenkeyan",
    number: 233
}, {
    name: "Iadoitesu",
    number: 234
}, {
    name: "Yagrovoisi",
    number: 235
}, {
    name: "Ewcomechio",
    number: 236
}, {
    name: "Inunnunnoda",
    number: 237
}, {
    name: "Dischiutun",
    number: 238
}, {
    name: "Yuwarugha",
    number: 239
}, {
    name: "Ialmendra",
    number: 240
}, {
    name: "Reponudrle",
    number: 241
}, {
    name: "Rinjanagrbo",
    number: 242
}, {
    name: "Zeziceloh",
    number: 243
}, {
    name: "Oeileutasc",
    number: 244
}, {
    name: "Zicniijinis",
    number: 245
}, {
    name: "Dugnowarilda",
    number: 246
}, {
    name: "Neuxoisan",
    number: 247
}, {
    name: "Ilmenhorn",
    number: 248
}, {
    name: "Rukwatsuku",
    number: 249
}, {
    name: "Nepitzaspru",
    number: 250
}, {
    name: "Chcehoemig",
    number: 251
}, {
    name: "Haffneyrin",
    number: 252
}, {
    name: "Uliciawai",
    number: 253
}, {
    name: "Tuhgrespod",
    number: 254
}, {
    name: "Iousongola",
    number: 255
}, {
    name: "Odyalutai",
    number: 256
}, {
    name: "Yilsrussimil",
    number: 257
}, {
    name: "Loqvishess",
    number: -6
}, {
    name: "Enyokudohkiw",
    number: -5
}, {
    name: "Helqvishap",
    number: -4
}, {
    name: "Usgraikik",
    number: -3
}, {
    name: "Hiteshamij",
    number: -2
}, {
    name: "Uewamoisow",
    number: -1
}, {
    name: "Pequibanu",
    number: 0
}]

const starClassList = [{
    name: "O",
    temp: "≥ 30,000K",
    color: "blue"
}, {
    name: "B",
    temp: "10,000-30,000K",
    color: "blue white"
}, {
    name: "A",
    temp: "7,500-10,000K",
    color: "white"
}, {
    name: "F",
    temp: "6,000-7,500K",
    color: "yellow white"
}, {
    name: "G",
    temp: "5,200-6,000K",
    color: "yellow"
}, {
    name: "K",
    temp: "3,700-5,200K",
    color: "orange"
}, {
    name: "M",
    temp: "2,400-3,700K",
    color: "red"
}, {
    name: "L",
    temp: "1,300-2,400K",
    color: "red brown"
}, {
    name: "T",
    temp: "500-1,300K",
    color: "brown"
}, {
    name: "Y",
    temp: "≤ 500K",
    color: "dark brown"
}, {
    name: "E",
    temp: "unknown",
    color: "green"
}]

const starOdditiesList = [{
    name: "e",
    type: "Emission lines present"
}, {
    name: "f",
    type: "N III and He II emission"
}, {
    name: "h",
    type: "WR stars with emission lines due to hydrogen"
}, {
    name: "k",
    type: "Spectra with interstellar absorption features"
}, {
    name: "m",
    type: "Enhanced metal features"
}, {
    name: "n",
    type: "Broad ('nebulous') absorption due to spinning"
}, {
    name: "p",
    type: "Unspecified peculiarity"
}, {
    name: "q",
    type: "Red & blue shifts line present"
}, {
    name: "s",
    type: "Narrowly sharp absorption lines"
}, {
    name: "v",
    type: "Variable spectral feature"
}, {
    name: "w",
    type: "Weak lines"
}]