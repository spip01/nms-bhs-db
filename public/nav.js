'use strict'

import { addGlyphButtons, addressToXYZ, reformatAddress } from "./commonNms"
import { buildGlyphModal } from "./glyphReader"

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

        let gloc = $("[id='glyphbuttons']")
        addGlyphButtons(gloc, addGlyph)
        buildGlyphModal(dispGlyph)
    })

    $("#footer").load("footer.html")

    let w = Math.min($("#id-results").height(), $("#logo").parent().width())
    $("#logo").width(w)
    $("#logo").height(w)

    let start = null
    let end = null
    let range = 2000

    //https://localhost:5000/preview.html?i=0547-0086-0E45-00A1-himodan-s-coup&g=Euclid&t=Ship
    let passed = {}
    let param = location.search.substring(1).split("&")

    for (let p of param) {
        if (p) {
            let obj = p.split("=")
            passed[unescape(obj[0])] = obj[1] ? unescape(obj[1]) : true
        }
    }

    if (passed.start && passed.end) {
        start = passed.start
        end = passed.end

        if (passed.range)
            range = passed.range

    } else if (typeof (Storage) !== "undefined") {
        start = window.localStorage.getItem('navstart')
        end = window.localStorage.getItem('navend')
        range = window.localStorage.getItem('navrange')
    }

    let loc = $("#id-addrInput")
    if (start) {
        let sloc = loc.find("#w-start")
        sloc.find("#id-addr").val(reformatAddress(start))
    }

    if (end) {
        let eloc = loc.find("#w-end")
        eloc.find("#id-addr").val(reformatAddress(end))
    }

    if (range)
        $("#id-range").val(range)

    dispAddr()
})

function dispAddr(evt) {
    let loc = $("#id-addrInput")
    let gloc = $("#id-glyphInput")
    let sloc = loc.find("#w-start")
    let eloc = loc.find("#w-end")

    let saddr = sloc.find("#id-addr").val()
    let eaddr = eloc.find("#id-addr").val()
    let range = $("#id-range").val()

    if (saddr !== "") {
        saddr = reformatAddress(saddr)
        let glyph = addrToGlyph(saddr)

        sloc.find("#id-addr").val(saddr)
        sloc.find("#id-glyph").text(glyph)
        sloc.find("#id-hex").text(glyph)

        gloc.find("#w-start #id-addr").text(saddr)
        gloc.find("#w-start #id-glyph").val(glyph)

        let err = validateAddress(saddr)
        if (err !== "") {
            status(err)
            return
        }
    }

    if (eaddr !== "") {
        eaddr = reformatAddress(eaddr)
        let glyph = addrToGlyph(eaddr)

        eloc.find("#id-addr").val(eaddr)
        eloc.find("#id-glyph").text(glyph)
        eloc.find("#id-hex").text(glyph)

        gloc.find("#w-end #id-addr").text(eaddr)
        gloc.find("#w-end #id-glyph").val(glyph)

        let err = validateAddress(eaddr)
        if (err !== "") {
            status(err)
            return
        }
    }

    if (saddr !== "" && eaddr != "") {
        let a = calcAngles(addressToXYZ(saddr), addressToXYZ(eaddr))

        $("#id-dist").text(a.dist + " ly")
        $("#id-updown").html((a.vdist > 0 ? "Up: " : "Down: ") + (a.v > 90 ? 180 - a.v : a.v) + "&#176;")
        $("#id-leftright").html((a.hdist > 0 ? "Right: " : "Left: ") + +a.h + "&#176;")

        if (range !== "")
            $("#id-jumps").text(Math.ceil(a.dist / range))

        mapAngles("dir-canvas", a)
    }

    if (typeof (Storage) !== "undefined") {
        window.localStorage.setItem('navstart', saddr)
        window.localStorage.setItem('navend', eaddr)
        window.localStorage.setItem('navrange', range)
    }
}

function dispGlyph(evt, loc) {
    let glyph = typeof evt === "string" ? evt : $(evt).val().toUpperCase()
    if (glyph !== "") {
        if (loc)
            loc.closest("[id|='w']").find("#id-glyph").val(glyph)
        else
            $(evt).val(glyph)

        let id = loc ? loc.closest("[id|='w']").prop("id") : $(evt).closest("[id|='w']").prop("id")

        let addr = reformatAddress(glyph)
        $("#id-addrInput #" + id + " #id-addr").val(addr)

        dispAddr()
    }
}

function setGlyphInput(evt) {
    if ($(evt).prop("checked")) {
        $("#id-glyphInput").show()
        $("#id-addrInput").hide()
        $("[id='ck-glyphs']").prop("checked", true)
    } else {
        $("#id-glyphInput").hide()
        $("#id-addrInput").show()
        $("[id='ck-glyphs']").prop("checked", false)
    }
}

function addGlyph(evt) {
    let loc = $(evt).closest("[id|='w']").find("#id-glyph")
    let a = loc.val() + $(evt).text().trim().slice(0, 1)
    loc.val(a)
    if (a.length === 12)
        dispGlyph(loc)
}

function status(str, clear) {
    if (clear)
        $("#status").empty()

    if (str !== "")
        $("#status").prepend(str + "</br>")
}