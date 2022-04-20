'use-strict';

/*************************
from https://nomanssky.gamepedia.com/Galaxy
Empty - blue- 7, 12, 27, 32, 47, 52, 67 etc, a total of 26. 
Harsh - red - 3, 15, 23, 35, 43, 55, 63 etc, a total of 26.
Lush - green - 10, 19, 30, 39, 50, 59, 70 etc, a total of 25.
Norm - teal - a total of 178.
**************************/

export const galaxyRaw = [
    {
        name: "harsh",
        color: "#f3636b",
        start: 3,
        step1: 12,
        step2: 8,
    },
    {
        name: "empty",
        color: "#65ccf4",
        start: 7,
        step1: 5,
        step2: 15,
    },
    {
        name: "lush",
        color: "#62f97a",
        start: 10,
        step1: 9,
        step2: 11,
    },
    {
        name: "norm",
        color: "#88fefa",
        start: 1,
        step1: 1,
        step2: 1,
    },
];

export var lifeformList = [
    {
        name: "Vy'keen",
        match: /^v/i,
    },
    {
        name: "Gek",
        match: /^g/i,
    },
    {
        name: "Korvax",
        match: /^k/i,
    },
    {
        name: "Abandoned",
        match: /^a/i,
    },
];

export const ownershipList = [
    {
        name: "mine",
        match: /^m/i,
    },
    {
        name: "visited",
        match: /^v/i,
    },
    {
        name: "station",
        match: /^s/i,
    },
];

export const platformList = [
    {
        name: "PC-XBox",
        match: /^pc/i,
    },
    {
        name: "PS4",
        match: /ps4/i,
    },
];

export const platformListAll = [
    {
        name: "PC",
    },
    {
        name: "PS4",
    },
    {
        name: "XBox",
    },
];

export const versionList = [
    {
        name: "Nothing Selected",
    },
    {
        name: "next",
        version: 1.5,
        date: "7/26/2018",
    },
    {
        name: "beyond",
        version: 2.0,
        date: "8/14/2019",
    },
    {
        name: "synthesis",
        version: 2.2,
        date: "11/28/2019",
    },
    {
        name: "living ships",
        version: 2.3,
        date: "2/19/2020",
        changed: [
            {
                type: "Ship",
                Crashed: true,
            },
        ],
    },
    {
        name: "exo mech",
        version: 2.4,
        date: "4/7/2020",
    },
    {
        name: "crossplay",
        version: 2.5,
        date: "6/10/2020",
    },
    {
        name: "desolation",
        version: 2.6,
        date: "7/16/2020",
    },
    {
        name: "origins",
        version: 3.0,
        date: "9/23/2020",
        changed: [
            {
                type: "Planet",
            },
            {
                type: "Fauna",
            },
        ],
    },
    {
        name: "next generation",
        version: 3.1,
        date: "10/28/2020",
    },
    {
        name: "companions",
        version: 3.2,
        date: "2/17/2021",
    },
    {
        name: "expeditions",
        version: 3.35,
        date: "4/9/2021",
    },
    {
        name: "beachhead",
        version: 3.4,
        date: "5/17/2021",
    },
    {
        name: "prisms",
        version: 3.5,
        date: "6/2/2021",
    },
    {
        name: "frontiers",
        version: 3.6,
        date: "9/1/2021",
    },
    {
        name: "emergence",
        version: 3.7,
        date: "10/20/2021",
    },
];

export const latestversion = versionList[versionList.length - 1].name;

export const modeList = [
    {
        name: "Normal",
    },
    {
        name: "Survival",
    },
    {
        name: "Permadeath",
    },
    {
        name: "Creative",
    },
    {
        name: "Expedition",
    },
];

export const economyListTier = [
    {
        name: "T1",
        ttip: "*<br>Declining<br>Destitute<br>Failing<br>Fledgling<br>Low supply<br>Struggling<br>Unpromising<br>Unsuccessful",
    },
    {
        name: "T2",
        ttip: "**<br>Adequate<br>Balanced<br>Comfortable<br>Developing<br>Medium Supply<br>Promising<br>Satisfactory<br>Sustainable",
    },
    {
        name: "T3",
        ttip: "***<br>Advanced<br>Affluent<br>Booming<br>Flourishing<br>High Supply<br>Opulent<br>Prosperous<br>Wealthy",
    },
];

export const economyList = [
    {
        name: "None",
        number: 0,
    },
    {
        name: "Declining",
        number: 1,
    },
    {
        name: "Destitute",
        number: 1,
    },
    {
        name: "Failing",
        number: 1,
    },
    {
        name: "Fledgling",
        number: 1,
    },
    {
        name: "Low supply",
        number: 1,
    },
    {
        name: "Struggling",
        number: 1,
    },
    {
        name: "Unpromising",
        number: 1,
    },
    {
        name: "Unsuccessful",
        number: 1,
    },
    {
        name: "Adequate",
        number: 2,
    },
    {
        name: "Balanced",
        number: 2,
    },
    {
        name: "Comfortable",
        number: 2,
    },
    {
        name: "Developing",
        number: 2,
    },
    {
        name: "Medium Supply",
        number: 2,
    },
    {
        name: "Promising",
        number: 2,
    },
    {
        name: "Satisfactory",
        number: 2,
    },
    {
        name: "Sustainable",
        number: 2,
    },
    {
        name: "Advanced",
        number: 3,
    },
    {
        name: "Affluent",
        number: 3,
    },
    {
        name: "Booming",
        number: 3,
    },
    {
        name: "Flourishing",
        number: 3,
    },
    {
        name: "High Supply",
        number: 3,
    },
    {
        name: "Opulent",
        number: 3,
    },
    {
        name: "Prosperous",
        number: 3,
    },
    {
        name: "Wealthy",
        number: 3,
    },
];

export const conflictList = [
    {
        name: "Gentle",
        number: 1,
    },
    {
        name: "Low",
        number: 1,
    },
    {
        name: "Mild",
        number: 1,
    },
    {
        name: "Peaceful",
        number: 1,
    },
    {
        name: "Relaxed",
        number: 1,
    },
    {
        name: "Stable",
        number: 1,
    },
    {
        name: "Tranquil",
        number: 1,
    },
    {
        name: "Trivial",
        number: 1,
    },
    {
        name: "Unthreatening",
        number: 1,
    },
    {
        name: "Untroubled",
        number: 1,
    },
    {
        name: "Medium",
        number: 2,
    },
    {
        name: "Belligerent",
        number: 2,
    },
    {
        name: "Boisterous",
        number: 2,
    },
    {
        name: "Fractious",
        number: 2,
    },
    {
        name: "Intermittent",
        number: 2,
    },
    {
        name: "Medium",
        number: 2,
    },
    {
        name: "Rowdy",
        number: 2,
    },
    {
        name: "Sporadic",
        number: 2,
    },
    {
        name: "Testy",
        number: 2,
    },
    {
        name: "Unruly",
        number: 2,
    },
    {
        name: "Unstable",
        number: 2,
    },
    {
        name: "High",
        number: 3,
    },
    {
        name: "Aggressive",
        number: 3,
    },
    {
        name: "Alarming",
        number: 3,
    },
    {
        name: "At War",
        number: 3,
    },
    {
        name: "Critical",
        number: 3,
    },
    {
        name: "Dangerous",
        number: 3,
    },
    {
        name: "Destructive",
        number: 3,
    },
    {
        name: "Formidable",
        number: 3,
    },
    {
        name: "High",
        number: 3,
    },
    {
        name: "Lawless",
        number: 3,
    },
    {
        name: "Perilous",
        number: 3,
    },
];

export const starClassPossible = "OBAFGKMLTYE";
export const starOdditiesPossible = "efhkmnpqsvw";
export const starTypeRegex = /[OBAFGKMLTYE][0-9][efhkmnpqsvw]*/i;
export const levelRgb = ["#ffffff", "#ffc0c0", "#ffff00", "#c0ffc0"];

export const galaxyList = [
    {
        name: "Euclid",
        number: 1,
    },
    {
        name: "Hilbert Dimension",
        number: 2,
    },
    {
        name: "Calypso",
        number: 3,
    },
    {
        name: "Hesperius Dimension",
        number: 4,
    },
    {
        name: "Hyades",
        number: 5,
    },
    {
        name: "Ickjamatew",
        number: 6,
    },
    {
        name: "Budullangr",
        number: 7,
    },
    {
        name: "Kikolgallr",
        number: 8,
    },
    {
        name: "Eltiensleen",
        number: 9,
    },
    {
        name: "Eissentam",
        number: 10,
    },
    {
        name: "Elkupalos",
        number: 11,
    },
    {
        name: "Aptarkaba",
        number: 12,
    },
    {
        name: "Ontiniangp",
        number: 13,
    },
    {
        name: "Odiwagiri",
        number: 14,
    },
    {
        name: "Ogtialabi",
        number: 15,
    },
    {
        name: "Muhacksonto",
        number: 16,
    },
    {
        name: "Hitonskyer",
        number: 17,
    },
    {
        name: "Rerasmutul",
        number: 18,
    },
    {
        name: "Isdoraijung",
        number: 19,
    },
    {
        name: "Doctinawyra",
        number: 20,
    },
    {
        name: "Loychazinq",
        number: 21,
    },
    {
        name: "Zukasizawa",
        number: 22,
    },
    {
        name: "Ekwathore",
        number: 23,
    },
    {
        name: "Yeberhahne",
        number: 24,
    },
    {
        name: "Twerbetek",
        number: 25,
    },
    {
        name: "Sivarates",
        number: 26,
    },
    {
        name: "Eajerandal",
        number: 27,
    },
    {
        name: "Aldukesci",
        number: 28,
    },
    {
        name: "Wotyarogii",
        number: 29,
    },
    {
        name: "Sudzerbal",
        number: 30,
    },
    {
        name: "Maupenzhay",
        number: 31,
    },
    {
        name: "Sugueziume",
        number: 32,
    },
    {
        name: "Brogoweldian",
        number: 33,
    },
    {
        name: "Ehbogdenbu",
        number: 34,
    },
    {
        name: "Ijsenufryos",
        number: 35,
    },
    {
        name: "Nipikulha",
        number: 36,
    },
    {
        name: "Autsurabin",
        number: 37,
    },
    {
        name: "Lusontrygiamh",
        number: 38,
    },
    {
        name: "Rewmanawa",
        number: 39,
    },
    {
        name: "Ethiophodhe",
        number: 40,
    },
    {
        name: "Urastrykle",
        number: 41,
    },
    {
        name: "Xobeurindj",
        number: 42,
    },
    {
        name: "Oniijialdu",
        number: 43,
    },
    {
        name: "Wucetosucc",
        number: 44,
    },
    {
        name: "Ebyeloofdud",
        number: 45,
    },
    {
        name: "Odyavanta",
        number: 46,
    },
    {
        name: "Milekistri",
        number: 47,
    },
    {
        name: "Waferganh",
        number: 48,
    },
    {
        name: "Agnusopwit",
        number: 49,
    },
    {
        name: "Teyaypilny",
        number: 50,
    },
    {
        name: "Zalienkosm",
        number: 51,
    },
    {
        name: "Ladgudiraf",
        number: 52,
    },
    {
        name: "Mushonponte",
        number: 53,
    },
    {
        name: "Amsentisz",
        number: 54,
    },
    {
        name: "Fladiselm",
        number: 55,
    },
    {
        name: "Laanawemb",
        number: 56,
    },
    {
        name: "Ilkerloor",
        number: 57,
    },
    {
        name: "Davanossi",
        number: 58,
    },
    {
        name: "Ploehrliou",
        number: 59,
    },
    {
        name: "Corpinyaya",
        number: 60,
    },
    {
        name: "Leckandmeram",
        number: 61,
    },
    {
        name: "Quulngais",
        number: 62,
    },
    {
        name: "Nokokipsechl",
        number: 63,
    },
    {
        name: "Rinblodesa",
        number: 64,
    },
    {
        name: "Loydporpen",
        number: 65,
    },
    {
        name: "Ibtrevskip",
        number: 66,
    },
    {
        name: "Elkowaldb",
        number: 67,
    },
    {
        name: "Heholhofsko",
        number: 68,
    },
    {
        name: "Yebrilowisod",
        number: 69,
    },
    {
        name: "Husalvangewi",
        number: 70,
    },
    {
        name: "Ovna'uesed",
        number: 71,
    },
    {
        name: "Bahibusey",
        number: 72,
    },
    {
        name: "Nuybeliaure",
        number: 73,
    },
    {
        name: "Doshawchuc",
        number: 74,
    },
    {
        name: "Ruckinarkh",
        number: 75,
    },
    {
        name: "Thorettac",
        number: 76,
    },
    {
        name: "Nuponoparau",
        number: 77,
    },
    {
        name: "Moglaschil",
        number: 78,
    },
    {
        name: "Uiweupose",
        number: 79,
    },
    {
        name: "Nasmilete",
        number: 80,
    },
    {
        name: "Ekdaluskin",
        number: 81,
    },
    {
        name: "Hakapanasy",
        number: 82,
    },
    {
        name: "Dimonimba",
        number: 83,
    },
    {
        name: "Cajaccari",
        number: 84,
    },
    {
        name: "Olonerovo",
        number: 85,
    },
    {
        name: "Umlanswick",
        number: 86,
    },
    {
        name: "Henayliszm",
        number: 87,
    },
    {
        name: "Utzenmate",
        number: 88,
    },
    {
        name: "Umirpaiya",
        number: 89,
    },
    {
        name: "Paholiang",
        number: 90,
    },
    {
        name: "Iaereznika",
        number: 91,
    },
    {
        name: "Yudukagath",
        number: 92,
    },
    {
        name: "Boealalosnj",
        number: 93,
    },
    {
        name: "Yaevarcko",
        number: 94,
    },
    {
        name: "Coellosipp",
        number: 95,
    },
    {
        name: "Wayndohalou",
        number: 96,
    },
    {
        name: "Smoduraykl",
        number: 97,
    },
    {
        name: "Apmaneessu",
        number: 98,
    },
    {
        name: "Hicanpaav",
        number: 99,
    },
    {
        name: "Akvasanta",
        number: 100,
    },
    {
        name: "Tuychelisaor",
        number: 101,
    },
    {
        name: "Rivskimbe",
        number: 102,
    },
    {
        name: "Daksanquix",
        number: 103,
    },
    {
        name: "Kissonlin",
        number: 104,
    },
    {
        name: "Aediabiel",
        number: 105,
    },
    {
        name: "Ulosaginyik",
        number: 106,
    },
    {
        name: "Roclaytonycar",
        number: 107,
    },
    {
        name: "Kichiaroa",
        number: 108,
    },
    {
        name: "Irceauffey",
        number: 109,
    },
    {
        name: "Nudquathsenfe",
        number: 110,
    },
    {
        name: "Getaizakaal",
        number: 111,
    },
    {
        name: "Hansolmien",
        number: 112,
    },
    {
        name: "Bloytisagra",
        number: 113,
    },
    {
        name: "Ladsenlay",
        number: 114,
    },
    {
        name: "Luyugoslasr",
        number: 115,
    },
    {
        name: "Ubredhatk",
        number: 116,
    },
    {
        name: "Cidoniana",
        number: 117,
    },
    {
        name: "Jasinessa",
        number: 118,
    },
    {
        name: "Torweierf",
        number: 119,
    },
    {
        name: "Saffneckm",
        number: 120,
    },
    {
        name: "Thnistner",
        number: 121,
    },
    {
        name: "Dotusingg",
        number: 122,
    },
    {
        name: "Luleukous",
        number: 123,
    },
    {
        name: "Jelmandan",
        number: 124,
    },
    {
        name: "Otimanaso",
        number: 125,
    },
    {
        name: "Enjaxusanto",
        number: 126,
    },
    {
        name: "Sezviktorew",
        number: 127,
    },
    {
        name: "Zikehpm",
        number: 128,
    },
    {
        name: "Bephembah",
        number: 129,
    },
    {
        name: "Broomerrai",
        number: 130,
    },
    {
        name: "Meximicka",
        number: 131,
    },
    {
        name: "Venessika",
        number: 132,
    },
    {
        name: "Gaiteseling",
        number: 133,
    },
    {
        name: "Zosakasiro",
        number: 134,
    },
    {
        name: "Drajayanes",
        number: 135,
    },
    {
        name: "Ooibekuar",
        number: 136,
    },
    {
        name: "Urckiansi",
        number: 137,
    },
    {
        name: "Dozivadido",
        number: 138,
    },
    {
        name: "Emiekereks",
        number: 139,
    },
    {
        name: "Meykinunukur",
        number: 140,
    },
    {
        name: "Kimycuristh",
        number: 141,
    },
    {
        name: "Roansfien",
        number: 142,
    },
    {
        name: "Isgarmeso",
        number: 143,
    },
    {
        name: "Daitibeli",
        number: 144,
    },
    {
        name: "Gucuttarik",
        number: 145,
    },
    {
        name: "Enlaythie",
        number: 146,
    },
    {
        name: "Drewweste",
        number: 147,
    },
    {
        name: "Akbulkabi",
        number: 148,
    },
    {
        name: "Homskiw",
        number: 149,
    },
    {
        name: "Zavainlani",
        number: 150,
    },
    {
        name: "Jewijkmas",
        number: 151,
    },
    {
        name: "Itlhotagra",
        number: 152,
    },
    {
        name: "Podalicess",
        number: 153,
    },
    {
        name: "Hiviusauer",
        number: 154,
    },
    {
        name: "Halsebenk",
        number: 155,
    },
    {
        name: "Puikitoac",
        number: 156,
    },
    {
        name: "Gaybakuaria",
        number: 157,
    },
    {
        name: "Grbodubhe",
        number: 158,
    },
    {
        name: "Rycempler",
        number: 159,
    },
    {
        name: "Indjalala",
        number: 160,
    },
    {
        name: "Fontenikk",
        number: 161,
    },
    {
        name: "Pasycihelwhee",
        number: 162,
    },
    {
        name: "Ikbaksmit",
        number: 163,
    },
    {
        name: "Telicianses",
        number: 164,
    },
    {
        name: "Oyleyzhan",
        number: 165,
    },
    {
        name: "Uagerosat",
        number: 166,
    },
    {
        name: "Impoxectin",
        number: 167,
    },
    {
        name: "Twoodmand",
        number: 168,
    },
    {
        name: "Hilfsesorbs",
        number: 169,
    },
    {
        name: "Ezdaranit",
        number: 170,
    },
    {
        name: "Wiensanshe",
        number: 171,
    },
    {
        name: "Ewheelonc",
        number: 172,
    },
    {
        name: "Litzmantufa",
        number: 173,
    },
    {
        name: "Emarmatosi",
        number: 174,
    },
    {
        name: "Mufimbomacvi",
        number: 175,
    },
    {
        name: "Wongquarum",
        number: 176,
    },
    {
        name: "Hapirajua",
        number: 177,
    },
    {
        name: "Igbinduina",
        number: 178,
    },
    {
        name: "Wepaitvas",
        number: 179,
    },
    {
        name: "Sthatigudi",
        number: 180,
    },
    {
        name: "Yekathsebehn",
        number: 181,
    },
    {
        name: "Ebedeagurst",
        number: 182,
    },
    {
        name: "Nolisonia",
        number: 183,
    },
    {
        name: "Ulexovitab",
        number: 184,
    },
    {
        name: "Iodhinxois",
        number: 185,
    },
    {
        name: "Irroswitzs",
        number: 186,
    },
    {
        name: "Bifredait",
        number: 187,
    },
    {
        name: "Beiraghedwe",
        number: 188,
    },
    {
        name: "Yeonatlak",
        number: 189,
    },
    {
        name: "Cugnatachh",
        number: 190,
    },
    {
        name: "Nozoryenki",
        number: 191,
    },
    {
        name: "Ebralduri",
        number: 192,
    },
    {
        name: "Evcickcandj",
        number: 193,
    },
    {
        name: "Ziybosswin",
        number: 194,
    },
    {
        name: "Heperclait",
        number: 195,
    },
    {
        name: "Sugiuniam",
        number: 196,
    },
    {
        name: "Aaseertush",
        number: 197,
    },
    {
        name: "Uglyestemaa",
        number: 198,
    },
    {
        name: "Horeroedsh",
        number: 199,
    },
    {
        name: "Drundemiso",
        number: 200,
    },
    {
        name: "Ityanianat",
        number: 201,
    },
    {
        name: "Purneyrine",
        number: 202,
    },
    {
        name: "Dokiessmat",
        number: 203,
    },
    {
        name: "Nupiacheh",
        number: 204,
    },
    {
        name: "Dihewsonj",
        number: 205,
    },
    {
        name: "Rudrailhik",
        number: 206,
    },
    {
        name: "Tweretnort",
        number: 207,
    },
    {
        name: "Snatreetze",
        number: 208,
    },
    {
        name: "Iwunddaracos",
        number: 209,
    },
    {
        name: "Digarlewena",
        number: 210,
    },
    {
        name: "Erquagsta",
        number: 211,
    },
    {
        name: "Logovoloin",
        number: 212,
    },
    {
        name: "Boyaghosganh",
        number: 213,
    },
    {
        name: "Kuolungau",
        number: 214,
    },
    {
        name: "Pehneldept",
        number: 215,
    },
    {
        name: "Yevettiiqidcon",
        number: 216,
    },
    {
        name: "Sahliacabru",
        number: 217,
    },
    {
        name: "Noggalterpor",
        number: 218,
    },
    {
        name: "Chmageaki",
        number: 219,
    },
    {
        name: "Veticueca",
        number: 220,
    },
    {
        name: "Vittesbursul",
        number: 221,
    },
    {
        name: "Nootanore",
        number: 222,
    },
    {
        name: "Innebdjerah",
        number: 223,
    },
    {
        name: "Kisvarcini",
        number: 224,
    },
    {
        name: "Cuzcogipper",
        number: 225,
    },
    {
        name: "Pamanhermonsu",
        number: 226,
    },
    {
        name: "Brotoghek",
        number: 227,
    },
    {
        name: "Mibittara",
        number: 228,
    },
    {
        name: "Huruahili",
        number: 229,
    },
    {
        name: "Raldwicarn",
        number: 230,
    },
    {
        name: "Ezdartlic",
        number: 231,
    },
    {
        name: "Badesclema",
        number: 232,
    },
    {
        name: "Isenkeyan",
        number: 233,
    },
    {
        name: "Iadoitesu",
        number: 234,
    },
    {
        name: "Yagrovoisi",
        number: 235,
    },
    {
        name: "Ewcomechio",
        number: 236,
    },
    {
        name: "Inunnunnoda",
        number: 237,
    },
    {
        name: "Dischiutun",
        number: 238,
    },
    {
        name: "Yuwarugha",
        number: 239,
    },
    {
        name: "Ialmendra",
        number: 240,
    },
    {
        name: "Reponudrle",
        number: 241,
    },
    {
        name: "Rinjanagrbo",
        number: 242,
    },
    {
        name: "Zeziceloh",
        number: 243,
    },
    {
        name: "Oeileutasc",
        number: 244,
    },
    {
        name: "Zicniijinis",
        number: 245,
    },
    {
        name: "Dugnowarilda",
        number: 246,
    },
    {
        name: "Neuxoisan",
        number: 247,
    },
    {
        name: "Ilmenhorn",
        number: 248,
    },
    {
        name: "Rukwatsuku",
        number: 249,
    },
    {
        name: "Nepitzaspru",
        number: 250,
    },
    {
        name: "Chcehoemig",
        number: 251,
    },
    {
        name: "Haffneyrin",
        number: 252,
    },
    {
        name: "Uliciawai",
        number: 253,
    },
    {
        name: "Tuhgrespod",
        number: 254,
    },
    {
        name: "Iousongola",
        number: 255,
    },
    {
        name: "Odyalutai",
        number: 256,
    },
    {
        name: "Yilsrussimil",
        number: 257,
    },
    {
        name: "Loqvishess",
        number: -6,
    },
    {
        name: "Enyokudohkiw",
        number: -5,
    },
    {
        name: "Helqvishap",
        number: -4,
    },
    {
        name: "Usgraikik",
        number: -3,
    },
    {
        name: "Hiteshamij",
        number: -2,
    },
    {
        name: "Uewamoisow",
        number: -1,
    },
    {
        name: "Pequibanu",
        number: 0,
    },
];

export const starClassList = [
    {
        name: "O",
        temp: "≥ 30,000K",
        color: "blue",
    },
    {
        name: "B",
        temp: "10,000-30,000K",
        color: "blue white",
    },
    {
        name: "A",
        temp: "7,500-10,000K",
        color: "white",
    },
    {
        name: "F",
        temp: "6,000-7,500K",
        color: "yellow white",
    },
    {
        name: "G",
        temp: "5,200-6,000K",
        color: "yellow",
    },
    {
        name: "K",
        temp: "3,700-5,200K",
        color: "orange",
    },
    {
        name: "M",
        temp: "2,400-3,700K",
        color: "red",
    },
    {
        name: "L",
        temp: "1,300-2,400K",
        color: "red brown",
    },
    {
        name: "T",
        temp: "500-1,300K",
        color: "brown",
    },
    {
        name: "Y",
        temp: "≤ 500K",
        color: "dark brown",
    },
    {
        name: "E",
        temp: "unknown",
        color: "green",
    },
];

export const starOdditiesList = [
    {
        name: "e",
        type: "Emission lines present",
    },
    {
        name: "f",
        type: "N III and He II emission",
    },
    {
        name: "h",
        type: "WR stars with emission lines due to hydrogen",
    },
    {
        name: "k",
        type: "Spectra with interstellar absorption features",
    },
    {
        name: "m",
        type: "Enhanced metal features",
    },
    {
        name: "n",
        type: "Broad ('nebulous') absorption due to spinning",
    },
    {
        name: "p",
        type: "Unspecified peculiarity",
    },
    {
        name: "q",
        type: "Red & blue shifts line present",
    },
    {
        name: "s",
        type: "Narrowly sharp absorption lines",
    },
    {
        name: "v",
        type: "Variable spectral feature",
    },
    {
        name: "w",
        type: "Weak lines",
    },
];

export const classList = [{
    name: "C",
}, {
    name: "B",
}, {
    name: "A",
}, {
    name: "S",
}]

export const tierList = [{
    name: "T1",
}, {
    name: "T2",
}, {
    name: "T3",
},]

export const occurenceList = [{
    name: "Nothing Seleted",
}, {
    name: "Frequent",
}, {
    name: "Occasional",
}, {
    name: "Rare",
},]

export const mapList = [{
    name: "Fighter",
    map: "/images/fighter-opt.svg",
}, {
    name: "Hauler",
    map: "/images/hauler-opt.svg",
}, {
    name: "Shuttle",
    map: "/images/shuttle-opt.svg",
}, {
    name: "Explorer",
    map: "/images/explorer-opt.svg",
}, {
    name: "Exotic",
    map: "/images/exotic-opt.svg",
}, {
    name: "Freighter",
    map: "/images/freighter-opt.svg",
}, {
    name: "Living-Ship",
    map: "/images/living-ship-opt.svg",
}]

export const shipList = [{
    name: "Fighter",
    slotList: tierList,
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    bodies: "/images/fighter-opt.svg",
    //asymmetric: true,
    upgradeTtip: "Maximum damage value for fighter UPGRADED to S-Class"
}, {
    name: "Hauler",
    slotList: tierList,
    slotTtip: `
        T1: 25-31 slots<br>
        T2: 32-39 slots<br>
        T3: 40-48 slots`,
    bodies: "/images/hauler-opt.svg",
}, {
    name: "Shuttle",
    slotList: [{
        name: "T1"
    }, {
        name: "T2"
    }],
    slotTtip: `
        T1: 18-23 slots<br>
        T2: 24-28 slots`,
    bodies: "/images/shuttle-opt.svg",
    asymmetric: true,
}, {
    name: "Explorer",
    bodies: "/images/explorer-opt.svg",
    slotList: tierList,
    asymmetric: true,
    slotTtip: `
        T1: 15-19 slots<br>
        T2: 20-29 slots<br>
        T3: 30-38 slots`,
    upgradeTtip: "Maximum range value for explorer UPGRADED to S-Class"
}, {
    name: "Exotic",
    bodies: "/images/exotic-opt.svg",
}]

export const mtList = [{
    name: "Nothing Selected"
}, {
    name: "Alien",
}, {
    name: "Experimental",
}, {
    name: "Pistol",
}, {
    name: "Rifle",
},]

export const frigateList = [{
    name: "Combat Specialist",
}, {
    name: "Exploration Specialist",
}, {
    name: "Industrial Specialist",
}, {
    name: "Support Specialist",
}, {
    name: "Trade Specialist",
},]

export const frigateBenefits = [{
    name: "Ablative Armour"
}, {
    name: "Advanced Maintenance Drones"
}, {
    name: "Advanced Power Distributor"
}, {
    name: "Aggressive Probes"
}, {
    name: "Alcubierre Drive"
}, {
    name: "Ammo Fabricators"
}, {
    name: "Angry Captain"
}, {
    name: "Anomaly Scanner"
}, {
    name: "Antimatter Cycler"
}, {
    name: "Asteroid Scanner"
}, {
    name: "Asteriod Vaporizer"
}, {
    name: "Automatic Investment Engine"
}, {
    name: "AutoTranslator"
}, {
    name: "Cartography Drones"
}, {
    name: "Cloaking Device"
}, {
    name: "Dynamic Ballast"
}, {
    name: "Economy Scanner"
}, {
    name: "Efficient Warp Drive"
}, {
    name: "Experimental Impulse Drive"
}, {
    name: "Experimental Weaponry"
}, {
    name: "Expert Navigator"
}, {
    name: "Extendable Drills"
}, {
    name: "Fauna Analysis Device"
}, {
    name: "Gravitational Visualiser"
}, {
    name: "Generator Grid"
}, {
    name: "Harvester Drones"
}, {
    name: "Hidden Weaponry"
}, {
    name: "Holographic Components"
}, {
    name: "Holographic Displays"
}, {
    name: "HypnoDrones"
}, {
    name: "Interstellar Signal Array"
}, {
    name: "Large Tanks"
}, {
    name: "Laser Drill Array"
}, {
    name: "Local Time Dilator"
}, {
    name: "Long-Distance Sensors"
}, {
    name: "Mass Driver"
}, {
    name: "Massive Guns"
}, {
    name: "Metal Detector"
}, {
    name: "Mind Control Device"
}, {
    name: "Mineral Extractors"
}, {
    name: "Motivated Crew"
}, {
    name: "Negotiation Module"
}, {
    name: "Ore Processing Unit"
}, {
    name: "Overclocked Power Distributor"
}, {
    name: "Oversized Fuel Scoop"
}, {
    name: "Oxygen Recycler"
}, {
    name: "Photon Sails"
}, {
    name: "Planetary Data Scoop"
}, {
    name: "Propaganda Device"
}, {
    name: "Portable Fusion Ignitor"
}, {
    name: "Radio Telescopes"
}, {
    name: "Realtime Archival Device"
}, {
    name: "Reinforced Hull"
}, {
    name: "Remote Market Analyser"
}, {
    name: "Remote Mining Unit"
}, {
    name: "Retrofitted Turrets"
}, {
    name: "Robot Butlers"
}, {
    name: "Robot Crew"
}, {
    name: "Self-Repairing Hull"
}, {
    name: "Solar Panels"
}, {
    name: "Spacetime Anomaly Shielding"
}, {
    name: "Stowaway Botanist"
}, {
    name: "Teleportation Device"
}, {
    name: "Terraforming Beams"
}, {
    name: "Tractor Beam"
}, {
    name: "Trade Analysis Computer"
}, {
    name: "Tremendous Cannons"
}, {
    name: "Tuned Engines"
}, {
    name: "Ultrasonic Weapons"
}, {
    name: "Ultrasonic Welders"
}, {
    name: "Well-Groomed Crew"
}, {
    name: "Wormhole Generator"
}]

export const frigateNegatives = [{
    name: "Badly Painted"
}, {
    name: "Clumsy Drill Operator"
}, {
    name: "Cowardly Gunners"
}, {
    name: "Faulty Torpedoes"
}, {
    name: "Fragile Hull"
}, {
    name: "Haunted Radar"
}, {
    name: "Inefficient Engine"
}, {
    name: "Lazy Crew"
}, {
    name: "Leaky Fuel Tubes"
}, {
    name: "Low-Energy Shields"
}, {
    name: "Malfunctioning Drones"
}, {
    name: "Misaligned Sensors"
}, {
    name: "Oil Burner"
}, {
    name: "Outdated Maps"
}, {
    name: "Poorly-Aligned Ballast"
}, {
    name: "Roach Infestation"
}, {
    name: "Rude Captain"
}, {
    name: "Second-Hand Rockets"
}, {
    name: "Small Hold"
}, {
    name: "Small Hoppers"
}, {
    name: "Thief On Board"
}, {
    name: "Thirsty Crew"
}, {
    name: "Uncalibrated Warp Drive"
}, {
    name: "Underpowered Lasers"
}, {
    name: "Wandering Compass"
},]

export const sentinelList = [{
    name: "Nothing Selected"
}, {
    name: "Low"
}, {
    name: "High"
}, {
    name: "Aggressive"
}]

export const faunaList = [{
    name: "Nothing Selected"
}, {
    name: "Anastomus - Striders"
}, {
    name: "Anomalous"
}, {
    name: "Bos - Spiders"
}, {
    name: "Bosoptera - Flying beetles"
}, {
    name: "Conokinis - Swarming beetles"
}, {
    name: "Felidae - Cat"
}, {
    name: "Felihex - Hexapodal cat"
}, {
    name: "Hexungulatis - Hexapodal cow"
}, {
    name: "Lok - Blobs"
}, {
    name: "Mechanoceris - Robot antelopes"
}, {
    name: "Mogara - Grunts, bipedal"
}, {
    name: "Osteofelidae - Bonecats"
}, {
    name: "Prionterrae - Ploughs"
}, {
    name: "Procavya - Rodents"
}, {
    name: "Protosphaeridae - Protorollers"
}, {
    name: "Prototerrae - Protodiggers"
}, {
    name: "Rangifae - Diplos"
}, {
    name: "Reococcyx - Bipedal antelopes"
}, {
    name: "Spiralis - Drills"
}, {
    name: "Talpidae - Moles"
}, {
    name: "Tetraceris - Antelopes"
}, {
    name: "Theroma - Triceratops"
}, {
    name: "Tyranocae - Tyrannosaurus rex-like"
}, {
    name: "Ungulatis - Cow"
}, {
    name: "Procavaquatica - Swimming rodents"
}, {
    name: "Bosaquatica - Underwater crabs"
}, {
    name: "Chrysaora - Jellyfish"
}, {
    name: "Ictaloris - Fish"
}, {
    name: "Prionace - Sharks, eels, seasnakes"
}, {
    name: "Prionacefda - Swimming cows"
}, {
    name: "Agnelis - Birds"
}, {
    name: "Cycromys - Flying Lizard"
}, {
    name: "Oxyacta - Wraiths / flying snake"
}, {
    name: "Protocaeli - Protoflyers"
}, {
    name: "Rhopalocera - Butterflies"
}]

export const faunaProductKilled = [{
    name: "Nothing Selected"
}, {
    name: "Diplo Chunks"
}, {
    name: "Feline Liver"
}, {
    name: "Fiendish Roe"
}, {
    name: "Leg Meat"
}, {
    name: "Leopard-Fruit"
}, {
    name: "Meaty Chunks"
}, {
    name: "Meaty Wings"
}, {
    name: "Offal Sac"
}, {
    name: "Raw Steak"
}, {
    name: "Regis Grease"
}, {
    name: "Salty Fingers"
}, {
    name: "Scaly Meat"
}, {
    name: "Strider Sausage"
}]

export const faunaProductTamed = [{
    name: "Nothing Selected"
}, {
    name: "Crab 'Apple'"
}, {
    name: "Creature Egg"
}, {
    name: "Fresh Milk"
}, {
    name: "Giant Egg"
}, {
    name: "Tall Eggs"
}, {
    name: "Warm Proto-Milk"
}, {
    name: "Wild Milk"
}]

export const resourceList = [{
    name: "Magnetised Ferrite"
}, {
    name: "Sodium"
}, {
    name: "Cobalt"
}, {
    name: "Salt"
}, {
    name: "Copper"
}, {
    name: "Cadmium"
}, {
    name: "Rusted Metal"
}, {
    name: "Emeril"
}, {
    name: "Indium"
}, {
    name: "Paraffinium"
}, {
    name: "Pyrite"
}, {
    name: "Ammonia"
}, {
    name: "Uranium"
}, {
    name: "Dioxite"
}, {
    name: "Phosphorus"
}, {
    name: "Silver"
}, {
    name: "Gold"
}, {
    name: "Sulphurine"
}, {
    name: "Radon"
}, {
    name: "Nitrogen"
}, {
    name: "Activated Copper"
}, {
    name: "Activated Cadmium"
}, {
    name: "Activated Emeril"
}, {
    name: "Activated Indium"
}, {
    name: "Fungal Mould"
}, {
    name: "Frost Crystal"
}, {
    name: "Gamma Root"
}, {
    name: "Cactus Flesh"
}, {
    name: "Solanium"
}, {
    name: "Star Bulb"
},]

export const colorList = [{
    name: "Blue",
}, {
    name: "Black",
}, {
    name: "Brown",
}, {
    name: "Chrome",
}, {
    name: "Cream",
}, {
    name: "Gold",
}, {
    name: "Green",
}, {
    name: "Grey",
}, {
    name: "Orange",
}, {
    name: "Pink",
}, {
    name: "Purple",
}, {
    name: "Red",
}, {
    name: "Silver",
}, {
    name: "Tan",
}, {
    name: "Teal",
}, {
    name: "White",
}, {
    name: "Yellow",
},]

export const fontList = [{
    name: "Arial",
}, {
    name: "Georgia",
}, {
    name: "Perpetua",
}, {
    name: "Verdana",
}, {
    name: "Roboto",
}, {
    name: "Helvetica",
}, {
    name: "Cambria",
}, {
    name: "Century Gothic",
}, {
    name: "Berkshire Swash",
}, {
    name: 'Caveat Brush',
}, {
    name: 'Amatic SC',
}, {
    name: 'Notable',
}, {
    name: 'Inknut Antiqua',
}, {
    name: 'Merienda One',
}, {
    name: 'Great Vibes',
}, {
    name: 'Redressed',
}, {
    name: 'Sedgwick Ave Display',
}, {
    name: 'Kaushan Script',
}, {
    name: 'Permanent Marker',
    // }, {
    //     name: 'Bangers',
    // }, {
    //     name: 'Limelight',
    // }, {
    //     name: 'Monoton',
    // }, {
    //     name: 'Poiret One',
    // }, {
    //     name: 'Ultra'
}]

export const encounterList = [{
    name: "Alien Repair"
}, {
    name: "Alien Trader"
}, {
    name: "Alien Trader Special Offer"
}, {
    name: "Anomalous Numbers Station"
}, {
    name: "Asteroid Larvae"
}, {
    name: "Black Hole"
}, {
    name: "Child of Helios"
}, {
    name: "Condensed Stellar Ice"
}, {
    name: "Derelict Freighter"
}, {
    name: "Dyson Lens"
}, {
    name: "Emergency Civilisation Shelter Pod"
}, {
    name: "Gaseous Sentience"
}, {
    name: "Grave of the Ocean King"
}, {
    name: "Hazard Containment Field"
}, {
    name: "Ironbound Relic"
}, {
    name: "Jettisoned Storage Silo"
}, {
    name: "Living Metalloid"
}, {
    name: "Messenger of Atlas"
}, {
    name: "Pirate Controlled Monitoring Station"
}, {
    name: "Plasmic Accident"
}, {
    name: "Relic Gate"
}, {
    name: "Rubble of the First Spawn"
}, {
    name: "Secret Listening Post"
}, {
    name: "Stellar Intelligence"
}, {
    name: "Void Egg"
},]

export const biomeList = [{
    name: 'Lush',
}, {
    name: 'Barren',
}, {
    name: 'Dead',
}, {
    name: 'Exotic',
}, {
    name: 'Mega Exotic',
}, {
    name: 'Scorched',
}, {
    name: 'Frozen',
}, {
    name: 'Toxic',
}, {
    name: 'Irradiated',
}, {
    name: 'Volcanic',
}]

export const glitchList = [{
    name: "Bubble Cluster"
}, {
    name: "Cable Pod"
}, {
    name: "Calcishroom"
}, {
    name: "Capilliary Shell"
}, {
    name: "Electric Cube"
}, {
    name: "Glitching Separator"
}, {
    name: "Hexplate Bush"
}, {
    name: "Light Fissure"
}, {
    name: "Ossified Star"
}, {
    name: "Rattle Spine"
}, {
    name: "Terbium Growth"
}]

export const weatherList = [{
    name: "Absent"
}, {
    name: "Acid Rain"
}, {
    name: "Acidic Deluges"
}, {
    name: "Acidic Dust"
}, {
    name: "Acidic Dust Pockets"
}, {
    name: "Airless"
}, {
    name: "Alkaline Cloudbursts"
}, {
    name: "Alkaline Rain"
}, {
    name: "Alkaline Storms"
}, {
    name: "Anomalous"
}, {
    name: "Arid"
}, {
    name: "Atmospheric Corruption"
}, {
    name: "Atmospheric Heat Instabilities"
}, {
    name: "Baked"
}, {
    name: "Balmy"
}, {
    name: "Beautiful"
}, {
    name: "Bilious Storms"
}, {
    name: "Billowing Dust Storms"
}, {
    name: "Blasted Atmosphere"
}, {
    name: "Blazed"
}, {
    name: "Blissful"
}, {
    name: "Blistering Damp"
}, {
    name: "Blistering Floods"
}, {
    name: "Blizzard"
}, {
    name: "Blood Rain"
}, {
    name: "Boiling Monsoons"
}, {
    name: "Boiling Puddles"
}, {
    name: "Boiling Superstorms"
}, {
    name: "Bone-Stripping Acid Storms"
}, {
    name: "Broiling Humidity"
}, {
    name: "Burning"
}, {
    name: "Burning Air"
}, {
    name: "Burning Clouds"
}, {
    name: "Caustic Dust"
}, {
    name: "Caustic Floods"
}, {
    name: "Caustic Moisture"
}, {
    name: "Caustic Winds"
}, {
    name: "Ceaseless Drought"
}, {
    name: "Choking Clouds"
}, {
    name: "Choking Humidity"
}, {
    name: "Choking Sandstorms"
}, {
    name: "Clear"
}, {
    name: "Cold"
}, {
    name: "Combustible Dust"
}, {
    name: "Contaminated"
}, {
    name: "Contaminated Puddles"
}, {
    name: "Contaminated Squalls"
}, {
    name: "Corrosive Cyclones"
}, {
    name: "Corrosive Damp"
}, {
    name: "Corrosive Rainstorms"
}, {
    name: "Corrosive Sleet Storms"
}, {
    name: "Corrosive Storms"
}, {
    name: "Crimson Heat"
}, {
    name: "Crisp"
}, {
    name: "Damp"
}, {
    name: "Dangerously Hot"
}, {
    name: "Dangerously Hot Fog"
}, {
    name: "Dangerously Toxic Rain"
}, {
    name: "Dead Wastes"
}, {
    name: "Deep Freeze"
}, {
    name: "Dehydrated"
}, {
    name: "Deluge"
}, {
    name: "Desolate"
}, {
    name: "Desiccated"
}, {
    name: "Direct Sunlight"
}, {
    name: "Downpours"
}, {
    name: "Drifting Snowstorms"
}, {
    name: "Drizzle"
}, {
    name: "Droughty"
}, {
    name: "Dry Gusts"
}, {
    name: "Dust-Choked Winds"
}, {
    name: "Eerily Calm"
}, {
    name: "Electric Rain"
}, {
    name: "Elevated Radioactivity"
}, {
    name: "Emollient"
}, {
    name: "Energetic Storms"
}, {
    name: "Enormous Nuclear Storms"
}, {
    name: "Extreme Acidity"
}, {
    name: "Extreme Atmospheric Decay"
}, {
    name: "Extreme Cold"
}, {
    name: "Extreme Contamination"
}, {
    name: "Extreme Heat"
}, {
    name: "Extreme Nuclear Decay"
}, {
    name: "Extreme Radioactivity"
}, {
    name: "Extreme Thermonuclear Fog"
}, {
    name: "Extreme Toxicity"
}, {
    name: "Extreme Wind Blasting"
}, {
    name: "Extreme Winds"
}, {
    name: "Fair"
}, {
    name: "Fine"
}, {
    name: "Firestorms"
}, {
    name: "Flaming Hail"
}, {
    name: "Freezing"
}, {
    name: "Freezing Night Winds"
}, {
    name: "Freezing Rain"
}, {
    name: "Frequent Blizzards"
}, {
    name: "Frequent Particle Eruptions"
}, {
    name: "Frequent Toxic Floods"
}, {
    name: "Frigid"
}, {
    name: "Frost"
}, {
    name: "Frozen"
}, {
    name: "Frozen Clouds"
}, {
    name: "Gamma Cyclones"
}, {
    name: "Gamma Dust"
}, {
    name: "Clouds"
}, {
    name: "Gelid"
}, {
    name: "Glacial"
}, {
    name: "Harmful Rain"
}, {
    name: "Harsh Winds"
}, {
    name: "Harsh, Icy Winds"
}, {
    name: "Haunted Frost"
}, {
    name: "Hazardous Temperature Extremes"
}, {
    name: "Hazardous Whiteouts"
}, {
    name: "Heated"
}, {
    name: "Heated Atmosphere"
}, {
    name: "Heavily Toxic Rain"
}, {
    name: "Heavy Rain"
}, {
    name: "Highly Variable Temperatures"
}, {
    name: "Hot"
}, {
    name: "Howling Blizzards"
}, {
    name: "Howling Gales"
}, {
    name: "Humid"
}, {
    name: "Ice Storms"
}, {
    name: "Icebound"
}, {
    name: "Icy"
}, {
    name: "Icy Blasts"
}, {
    name: "Icy Nights"
}, {
    name: "Icy Tempests"
}, {
    name: "Incendiary Dust"
}, {
    name: "Indetectable Burning"
}, {
    name: "Inert"
}, {
    name: "Inferno"
}, {
    name: "Inferno Winds"
}, {
    name: "Infrequent Blizzards"
}, {
    name: "Infrequent Dust Storms"
}, {
    name: "Infrequent Heat Storms"
}, {
    name: "Infrequent Toxic Drizzle"
}, {
    name: "Intense Cold"
}, {
    name: "Intense Dust"
}, {
    name: "Intense Heat"
}, {
    name: "Intense Heatbursts"
}, {
    name: "Intense Rainfall"
}, {
    name: "Intermittent Wind Blasting"
}, {
    name: "Internal Rain"
}, {
    name: "Invisible Mist"
}, {
    name: "Irradiated"
}, {
    name: "Irradiated Downpours"
}, {
    name: "Irradiated Storms"
}, {
    name: "Irradiated Thunderstorms"
}, {
    name: "Irradiated Winds"
}, {
    name: "Lethal Atmosphere"
}, {
    name: "Lethal Humidity Outbreaks"
}, {
    name: "Light Showers"
}, {
    name: "Lost Clouds"
}, {
    name: "Lung-Burning Night Wind"
}, {
    name: "Mellow"
}, {
    name: "Memories of Frost"
}, {
    name: "Migratory Blizzards"
}, {
    name: "Mild"
}, {
    name: "Mild Rain"
}, {
    name: "Moderate"
}, {
    name: "Moistureless"
}, {
    name: "Monsoon"
}, {
    name: "Mostly Calm"
}, {
    name: "No Atmosphere"
}, {
    name: "Noxious Storms"
}, {
    name: "Noxious Gases"
}, {
    name: "Nuclear Emission"
}, {
    name: "Nuclidic Atmosphere"
}, {
    name: "Obsidian Heat"
}, {
    name: "Occasional Acid Storms"
}, {
    name: "Occasional Ash Storms"
}, {
    name: "Occasional Radiation Outbursts"
}, {
    name: "Occasional Sandstorms"
}, {
    name: "Occasional Scalding Cloudbursts"
}, {
    name: "Occasional Snowfall"
}, {
    name: "Outbreaks of Frozen Rain"
}, {
    name: "Overly Warm"
}, {
    name: "Painfully Hot Rain"
}, {
    name: "Parched"
}, {
    name: "Parched Sands"
}, {
    name: "Particulate Winds"
}, {
    name: "Passing Toxic Fronts"
}, {
    name: "Peaceful"
}, {
    name: "Peaceful Climate"
}, {
    name: "Perfectly Clear"
}, {
    name: "Permafrost"
}, {
    name: "Planet-Wide Radiation Storms"
}, {
    name: "Planetwide Desiccation"
}, {
    name: "Pleasant"
}, {
    name: "Poison Flurries"
}, {
    name: "Poison Rain"
}, {
    name: "Poisonous Dust"
}, {
    name: "Poisonous Gas"
}, {
    name: "Pouring Rain"
}, {
    name: "Pouring Toxic Rain"
}, {
    name: "Powder Snow"
}, {
    name: "Radioactive"
}, {
    name: "Radioactive Damp"
}, {
    name: "Radioactive Decay"
}, {
    name: "Radioactive Dust Storms"
}, {
    name: "Radioactive Humidity"
}, {
    name: "Radioactive Storms"
}, {
    name: "Radioactivity"
}, {
    name: "Raging Snowstorms"
}, {
    name: "Rain of Atlas"
}, {
    name: "Rainstorms"
}, {
    name: "Rare Firestorms"
}, {
    name: "Reactive"
}, {
    name: "Reactive Dust"
}, {
    name: "Reactive Rain"
}, {
    name: "REDACTED"
}, {
    name: "Refreshing Breeze"
}, {
    name: "Roaring Ice Storms"
}, {
    name: "Roaring Nuclear Wind"
}, {
    name: "Sand Blizzards"
}, {
    name: "Sandstorms"
}, {
    name: "Scalding Heat"
}, {
    name: "Scaling Rainstorms"
}, {
    name: "Scorched"
}, {
    name: "Self-Igniting Storms"
}, {
    name: "Silent"
}, {
    name: "Smouldering"
}, {
    name: "Snow"
}, {
    name: "Snowfall"
}, {
    name: "Snowstorms"
}, {
    name: "Snowy"
}, {
    name: "Sporadic Grit Storms"
}, {
    name: "Sterile"
}, {
    name: "Stinging Atmosphere"
}, {
    name: "Stinging Puddles"
}, {
    name: "Sunny"
}, {
    name: "Supercooled Storms"
}, {
    name: "Superheated Air"
}, {
    name: "Superheated Drizzle"
}, {
    name: "Superheated Pockets"
}, {
    name: "Superheated Rain"
}, {
    name: "Sweltering"
}, {
    name: "Sweltering Damp"
}, {
    name: "Temperate"
}, {
    name: "Tempered"
}, {
    name: "Thirsty Clouds"
}, {
    name: "Torrential Acid"
}, {
    name: "Torrential Heat"
}, {
    name: "Torrential Rain"
}, {
    name: "Torrid Deluges"
}, {
    name: "Toxic Clouds"
}, {
    name: "Toxic Damp"
}, {
    name: "Toxic Dust"
}, {
    name: "Toxic Monsoons"
}, {
    name: "Toxic Outbreaks"
}, {
    name: "Toxic Rain"
}, {
    name: "Toxic Superstorms"
}, {
    name: "Tropical Storms"
}, {
    name: "Unclouded Skies"
}, {
    name: "Unending Sunlight"
}, {
    name: "Unstable"
}, {
    name: "Unstable Atmosphere"
}, {
    name: "Unstable Fog"
}, {
    name: "Unusually Mild"
}, {
    name: "Usually Mild"
}, {
    name: "Utterly Still"
}, {
    name: "Volatile"
}, {
    name: "Volatile Dust Storms"
}, {
    name: "Volatile Storms"
}, {
    name: "Volatile Winds"
}, {
    name: "Volatile Windstorms"
}, {
    name: "Wandering Frosts"
}, {
    name: "Wandering Hot Spots"
}, {
    name: "Warm"
}, {
    name: "Wet"
}, {
    name: "Whiteout"
}, {
    name: "Wind"
}, {
    name: "Winds of Glass"
}, {
    name: "Wintry"
}, {
    name: "Withered"
}]
