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

        planet = typeof planet === "undefined" || planet === "" ? 0 : typeof planet === "string" ? parseInt(planet) : planet

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