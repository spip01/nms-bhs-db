$(document).ready(() => {
    $("#javascript").empty()
    $("#jssite").show()

    const gbtn = `
    <button type="button" class="btn-def btn btn-sm col-8x1" onclick="addGlyph(this)">
        <span class="h3 glyph">title</span>
        &nbsp;(title)
    </button>`

    let h = ""
    for (let i = 0; i < 16; ++i) {
        h += /title/g [Symbol.replace](gbtn, i.toString(16).toUpperCase())
    }

    let gloc = $("[id='glyphbuttons']")
    gloc.append(h)

    $('[data-toggle="tooltip"]').tooltip()
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
