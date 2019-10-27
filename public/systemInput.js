
'use strict'

var panels = [{
    name: "Black Hole System",
    id: "pnl-bhs",
}, {
    name: "Exit System",
    id: "pnl-exit",
}]

const addrGlyphSwitch = {
    addr: ["id-addr", "id-glyph-disp", "id-hex-disp"],
    glyph: ["id-glyph", "id-glyph-btn", "id-addr-disp"]
}

const addrDisp = {
    val: ["id-addr", "id-glyph"],
    text: ["id-addr-disp", "id-glyph-disp", "id-hex-disp"]
}

const singleToggle = {
    panel: "pnl-exit"
}

const sysInputTable = [{
    name: "Cords",
    field: "addr",
    type: "string",
    id: "id-addr",
    required: true,
    onchange: reformatAddress,
}, {
    name: "Glyph",
    type: "glyph display",
    id: "id-glyph-disp",
}, {
    name: "Hex",
    type: "hex display",
    id: "id-hex-disp",
}, {
    name: "Glyph",
    type: "glyph",
    id: "id-glyph",
    required: true,
    onchange: reformatAddress,
}, {
    name: "",
    field: "",
    id: "id-glyph-btn",
    type: "glyph buttons",
    onclick: addGlyph,
}, {
    name: "Coords",
    type: "addr display",
    id: "id-addr-disp",
}, {
    name: "System",
    field: "sys",
    type: "string",
    required: true
}, {
    name: "Distance",
    type: "calc",
    id:"calc-dist"
}, {
    name: "Traveled",
    type: "calc",
    id:"calc-traveled"
}, {
    name: "Towards Center",
    type: "calc",
    id:"calc-toctr"
}, {
    name: "Region",
    field: "reg",
    type: "string",
    required: true
},{
    name: "Search",
    type: "button",
    function: searchRegion
}, {
    name: "Lifeform",
    id: "btn-Lifeform",
    field: "life",
    type: "menu",
    list: lifeformList
}, {
    name: "Economy",
    field: "econ",
    id: "btn-Economy",
    type: "menu",
    list: economyList
}, {
    name: "Single System",
    id: "ck-single",
    type: "checkbox",
    onchange: hideExit,
}, {
    name: "Dead Zone",
    field: "deadzone",
    id: "id-deadzone",
    type: "checkbox",
    onchange: hideExit,
}, {
    name: "Has Base",
    id: "ck-hasbase",
    type: "checkbox",
    onchange: showBase,
}]

const baseInput = [{
    name: "Name",
    field: "basename",
    type: "string",
    id: "id-base",
}, {
    name: "Owned",
    field: "owned",
    list: ownershipList,
    id: "id-Owned",
}, {
    name: "Share POI",
    field: "share",
    type: "checkbox",
    id: "ck-sharepoi",
}, {
    name: "Delete Base",
    onclick: deleteBase,
    id: "btn-delete",
}, ]
