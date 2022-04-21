'use strict'

import { addGlyphButtons, addrToGlyph, reformatAddress } from "./commonNms.js"
import { buildGlyphModal } from "./glyphReader.js"

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

$(document).ready(() => {
    $("#javascript").remove()
    $("#jssite").show()

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })

    $("#bhsmenus").load("bhsmenus.html", () => {
        $("#login").hide()

        let page = window.location.pathname.replace(/(.*)\//, "$1")
        let loc = $("[href='" + page + "']")
        $("#pagename").html(loc.text())

        $("#banner").on("load", () => {
            let width = $("body").width()
            loc = $("[src='images/bhs-banner.jpg']")
            let iwidth = loc.width()
            let iheight = loc.height() * width / iwidth

            loc.width(width)
            loc.height(iheight)
        })
    })

    $("#footer").load("footer.html")

    let gloc = $("[id='glyphbuttons']")
    addGlyphButtons(gloc, addGlyph)
    buildGlyphModal(dispGlyph)

    let passed = {}
    let param = location.search.substring(1).split("&")

    for (let p of param) {
        if (p) {
            let obj = p.split("=")
            passed[unescape(obj[0])] = obj[1] ? unescape(obj[1]) : true
            if (obj[0] === 'a') {
                displayAll(passed.a)
            }
        }
    }
})

export function dispAddr(evt) {
    let loc = $(evt).closest(".card")
    let addr = loc.find("#id-addr").val()
    let planet = loc.find("#id-planet").val()

    if (addr !== "")
        displayAll(addr, planet)
}

// Hack to make the function global. Should be avoided and code should be reformatted to not use it
window.dispGlyph = dispGlyph;
function dispGlyph(evt) {
    let glyph = typeof evt === "string" ? evt : $(evt).val().toUpperCase()
    
    if (glyph !== "")
        displayAll(glyph)
}

function addGlyph(evt) {
    let loc = $(evt).closest(".card").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        dispGlyph(loc)
}

function displayAll(addr, planet) {
    if (planet === "" || typeof planet === "undefined")
        planet = addr.length === 12 ? addr.slice(0, 1) : 0

    addr = reformatAddress(addr)
    let glyph = addrToGlyph(addr, planet)

    $("div #id-glyph").text(glyph)
    $("div #id-addr").text(addr)
    $("div #id-planet").text(planet)
    $("div #id-hex").text(glyph)

    $("#glyph-card #id-glyph").val(glyph)
    $("#addr-card #id-addr").val(addr)
    $("#addr-card #id-planet").val(planet)
}