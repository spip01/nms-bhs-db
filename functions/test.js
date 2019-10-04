'use strict'
Error.stackTraceLimit = 50

const admin = require('firebase-admin')
const serviceAccount = require("./nms-bhs-8025d3f3c02d.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const fs = require('fs')

const columns = ["platform", "galaxy", "player",
    "econ", "reg", "sys", "addr", "life",
    "xecon", "xreg", "xsys", "xaddr", "xlife",
    "date", "id"
]

async function main() {
    const file = "C:\\Users\\sp\\Documents\\nms\\RAWBHS - Black Hole Tracker-mod.csv"

    await fs.readFile(file, 'utf8', async (err, data) => {
        let allrows = data.split(/\r?\n|\r/)
        for (let i = 1; i < allrows.length; ++i) {
            let row = allrows[i]
            let r = row.split(/,/g)

            let e = {}
            let f = {}

            for (let i = 0; i < columns.length; ++i)
                f[columns[i]] = r[i]

            e.galaxy = formatListSel(f.galaxy, galaxyList)
            e.platform = formatPlatform(f.platform)

            e.addr = reformatAddress(f.addr)
            e.econ = formatListSel(f.econ, economyList)
            e.life = formatLife(f.life)

            e.xaddr = reformatAddress(f.xaddr)
            e.xecon = formatListSel(f.xecon, economyList)
            e.xlife = formatLife(f.xlife)

            let d = f.date.split("/")
            e.created = new admin.firestore.Timestamp(parseInt(new Date(d[2], d[0] - 1, d[1]).valueOf() / 1000), parseInt(f.id))

            let ref = admin.firestore().doc("stars5/" + e.galaxy + "/" + e.platform + "/" + e.addr)
            let doc = await ref.get()
            if (doc.exists) {
                let entry = doc.data()
                entry.life = e.life
                entry.econ = e.econ
                entry.created = e.created

                if (e.addr !== e.xaddr) {
                    if (typeof entry.x === "undefined")
                        console.log(i, "ERROR x undefined", JSON.stringify(entry))
                    else {
                        entry.x.life = e.xlife
                        entry.x.econ = e.xecon
                    }
                }

                console.log(i, entry.galaxy, entry.platform, entry.addr, e.xaddr)
                await ref.set(entry)
            }

            if (e.addr !== e.xaddr) {
                ref = admin.firestore().doc("stars5/" + e.galaxy + "/" + e.platform + "/" + e.xaddr)
                doc = await ref.get()
                if (doc.exists) {
                    let exit = doc.data()
                    exit.life = e.xlife
                    exit.econ = e.xecon
                    exit.created = e.created

                    await ref.set(exit)
                }
            }
        }
    })
}

function reformatAddress(addr) {
    let out = ""
    addr = addr.toUpperCase()

    // if (addr.match(/^[0-9A-F]{12}$/))
    //     out = bhs.glyphToAddr(addr)
    // else {
    let str = /[^0-9A-F]+/g [Symbol.replace](addr, ":")
    str = str[0] == ":" ? str.slice(1) : str

    for (let i = 0; i < 4; ++i) {
        let idx = str.indexOf(":")
        let end = idx > 4 || idx == -1 ? 4 : idx
        let s = str.slice(0, end)
        str = str.slice(end + (idx <= 4 && idx >= 0 ? 1 : 0))
        out += "0000".slice(0, 4 - s.length) + s + (i < 3 ? ":" : "")
    }
    // }

    return out
}

function formatLife(val) {
    if (val.match(/^g/i)) return "Gek"
    else if (val.match(/^k/i)) return "Korvax"
    else if (val.match(/^v/i)) return "Vy'keen"
    else return ""
}

function formatPlatform(val) {
    if (val.match(/^ps/i)) return "PS4"
    else return "PC-XBox"
}

function formatListSel(val, list) {
    let name = val.stripNumber()
    if (name == "") {
        let num = val.replace(/(\d+).*/, "$1")
        let idx = getIndex(list, "number", num)
        if (idx != -1)
            name = list[idx].name
    } else {
        let idx = getIndex(list, "name", name)
        if (idx != -1)
            name = list[idx].name
    }

    return typeof name === "undefined" ? "" : name
}

function getIndex(list, field, id) {
    if (!id)
        return -1

    return list.map(x => {
        return typeof x[field] == "string" ? x[field].toLowerCase() : x[field]
    }).indexOf(id.toLowerCase())
}

String.prototype.stripNumber = function () {
    return this.replace(/\s*-?\d*\.*\s*(\D*)\s*/, "$1")
}

main()


const economyList = [{
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