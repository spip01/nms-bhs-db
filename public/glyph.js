'use strict'

$(document).ready(() => {
    $("#javascript").remove()
    $("#jssite").show()

    $("body").tooltip({
        selector: '[data-toggle="tooltip"]'
    })

    $("#bhsmenus").load("bhsmenus.html", () => {
        $("#login").hide()
        
        let gloc = $("[id='glyphbuttons']")
        addGlyphButtons(gloc, addGlyph)
    })
})

function dispAddr(evt) {
    let loc = $(evt).closest(".card")
    let addr = loc.find("#id-addr").val()

    if (addr !== "") {
        addr = reformatAddress(addr)
        loc.find("#id-addr").val(addr)

        let planet = loc.find("#id-planet").val()
        let glyph = addrToGlyph(addr, planet)
        loc.find("#id-glyph").text(glyph)
        loc.find("#id-hex").text(glyph)
    }
}

function dispGlyph(evt) {
    let glyph = $(evt).val().toUpperCase()
    if (glyph !== "") {
        let addr = reformatAddress(glyph)
        let planet = glyph.slice(0, 1)
        let loc = $(evt).closest(".card")
        loc.find("#id-addr").text(addr)
        loc.find("#id-planet").text(planet)
    }
}

function addGlyph(evt) {
    let loc = $(evt).closest(".card").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)

    if (a.length === 12)
        dispGlyph(loc)
}