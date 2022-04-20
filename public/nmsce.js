'use strict'

import { Timestamp, collection, collectionGroup, query, where, orderBy, limit, doc, getDoc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"
import { bhs, blackHoleSuns, startUp } from "./commonFb.js";
import { addGlyphButtons, fcedata, fnmsce, fpreview, getIndex, mergeObjects, reformatAddress } from "./commonNms.js";
import { biomeList, classList, colorList, economyList, economyListTier, faunaList, faunaProductTamed, fontList, frigateList, galaxyList, lifeformList, modeList, platformListAll, resourceList, sentinelList, shipList, versionList } from "./constants.js";
import { calcImageSize } from "./imageSizeUtil.js";

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

var nmsce;
// Does nothing. Purely for consistency
window.nmsce = nmsce;

const displayPath = "/nmsce/disp/"
const originalPath = "/nmsce/orig/"
const thumbPath = "/nmsce/disp/thumb/"

$(document).ready(() => {
    startUp();

    $("#cemenus").load("cemenus.html", () => {
        let loc = fnmsce ? $("#searchpage") : fcedata ? $("#entrypage") : []
        if (loc.length > 0) {
            loc.css("border-color", "red")
            loc.css("border-width", "3px")
        }
    })
    // Bad hack. Should not be used
    window.nmsce = nmsce = new NMSCE()
    nmsce.last = null

    if (!fpreview) {
        nmsce.buildPanels()
        nmsce.buildTypePanels()

        if (fnmsce) {
            nmsce.buildResultsList()
            nmsce.buildTotals()
            nmsce.buildPatron()

            nmsce.getTotals()
            nmsce.getResultsLists()

            nmsce.expandPanels(false)
        }

        if (fcedata) {
            nmsce.buildImageText()
            tmImage.load("/bin/model.json", "/bin/metadata.json").then(model => nmsce.model = model)
            nmsce.buildDisplayList()
        }
    }

    //https://localhost:5000/preview.html?i=0547-0086-0E45-00A1-himodan-s-coup&g=Euclid&t=Ship
    let passed = {}
    let param = location.search.substring(1).split("&")

    for (let p of param) {
        if (p) {
            let obj = p.split("=")
            passed[unescape(obj[0])] = obj[1] ? unescape(obj[1]) : true
            if (obj[0] === 'g') {
                let i = getIndex(galaxyList, "name", passed.g.idToName())
                passed.g = galaxyList[i].name
            }
        }
    }

    if (passed.state && passed.code)
        nmsce.redditLoggedIn(passed.state, passed.code)

    else if (passed.s && passed.g) {
        nmsce.last = {}
        nmsce.last.addr = reformatAddress(passed.s)
        nmsce.last.galaxy = passed.g
        nmsce.searchSystem(passed.k)

    } else if (passed.r && passed.g) {
        nmsce.last = {}
        nmsce.last.addr = reformatAddress(passed.r)
        nmsce.last.galaxy = passed.g
        nmsce.searchRegion()

    } else if (passed.i && passed.g && passed.t) {
        // getDocs(collection(bhs.fs, "nmsce/" + passed.g + "/" + passed.t + "/" + passed.i)).then(doc => {
        //     if (doc.exists) {
        //         if (fnmsce || fpreview)
        //             nmsce.displaySelected(doc.data())
        //         else if (fcedata)
        //             nmsce.displaySingle(doc.data())
        //     }
        // })
    }
})

const planetNumTip = `This is the first glyph in the portal address. Assigned to each celestial body according to their aphelion.`

let nav = `
    <a id="tab-idname" class="nav-item nav-link txt-def h6 rounded-top active" style="border-color:black;" 
        data-toggle="tab" href="#hdr-idname" role="tab" aria-controls="hdr-idname" aria-selected="true">
        title
    </a>`;
let header = `
    <div id="hdr-idname" class="tab-pane active" role="tabpanel" aria-labelledby="tab-idname">
        <div id="pnl-idname" class="row"></div>
    </div>`;
let mapHeader = `<div id="pnl-idname" class="border rounded" style="display:none;"></div>`;
const tSubList = `<div id="slist-idname" class="row pl-10" style="display:none"></div>`;

const tReq = `&nbsp;<font style="color:red">*</font>`;
const tText = `&nbsp;
    <span data-toggle="tooltip" data-html="true" data-placement="bottom" title="ttext">
        <i class="far fa-question-circle text-danger h6"></i>
    </span>`;

const inpHdr = `<div class="col-lg-7 col-14" data-allowhide="ihide">`;
const inpLongHdr = `<div class="col-14" data-allowhide="ihide">`;
const inpEnd = `</div>`;

const tString = `
    <div id="row-idname" data-type="string" data-req="ifreq" class="row">
        <div class="col-lg-6 col-4 txt-label-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col-lg-7 col-9">&nbsp;
        <i class="fas fa-check text-success hidden"></i>
    </div>`;
const tMap = `<div id="row-idname" class="col-14" data-type="map"></div>`;
const tLongString = `
    <div id="row-idname" data-type="string" data-allowhide="ihide" data-req="ifreq" class="row">
        <div class="col-lg-6 col-4 pl-15 txt-label-def">titlettip&nbsp;</div>
        <input id="id-idname" class="rounded col">
    </div>`;
const tNumber = `
    <div id="row-idname" data-type="number" data-allowhide="ihide" data-req="ifreq" data-search="stype" class="row">
        <div class="col-lg-6 col-4 txt-label-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-lg-7 col-9" min=-1 max=range value=-1>
    </div>`;
const tFloat = `
    <div id="row-idname" data-type="float" data-allowhide="ihide" data-req="ifreq" data-search="stype" class="row">
        <div class="col-lg-6 col-4 txt-label-def">titlettip&nbsp;</div>
        <input id="id-idname" type="number" class="rounded col-lg-7 col-9" step=0.1 max=range value=-1>
    </div>`;
const tTags = `
    <div id="row-idname" class="row pl-10 pr-10" data-type="tags" data-allowhide="ihide" data-req="ifreq">
        <div id="id-idname" class="col-lg-2 col-4"></div>
        <div id="add-idname" class="col row hidden">
            <input id="txt-idname" type="text" class="col-7"></input>
            <button id="add-idname" type="text" class="col-2 btn btn-def btn-sm" onclick="nmsce.newTag(this)">Add</button>
            <button id="cancel-idname" type="text" class="col-3 btn btn-def btn-sm" onclick="nmsce.cancelTag(this)">Cancel</button>
        </div>
        <div class="col border">
            <div id="list-idname" class="row"></div>
        </div>
    </div>`;
const tTag = `<div id="tag-idname" class="border pointer txt-input-def" style="border-radius:8px; background-color:#d0d0d0" onclick="$(this).remove()">&nbsp;title&nbsp;<i class="far fa-times-circle" style="color:#ffffff;"></i>&nbsp;</div>&nbsp;`;
const tMenu = `
    <div id="row-idname" data-type="menu" data-allowhide="ihide" data-req="ifreq">
        <div id="id-idname"></div>
    </div>`;
const tRadio = `
    <div id="row-idname" data-type="radio" data-allowhide="ihide" data-req="ifreq" class="row pl-0">
        <div class="radio col-lg-5 col-4 txt-label-def">titlettip</div>
        <div class="col">
            <div id="list" class="row"></div>
        </div>&nbsp;
    </div>`;
const tRadioItem = `
    <label class="col txt-label-def">
        <input type="radio" class="radio h6" id="rdo-tname" data-last=false onclick="nmsce.toggleRadio(this)">
        &nbsp;titlettip
    </label>`;
const tCkItem = `
    <div id="row-idname" data-type="checkbox" data-allowhide="ihide" data-req="false">
        <label id="id-idname" class=" txt-label-def">
            titlettip&nbsp
            <input id="ck-idname" type="checkbox">
        </label>
    </div>`;
const tImg = `
    <div id="row-idname" data-req="ifreq" data-type="img" class="row">
        <div class="col-lg-2 col-4 txt-label-def">titlettip&nbsp;</div>
        <input id="id-idname" type="file" class="col form-control form-control-sm" 
            accept="image/*" name="files[]"  data-type="img" onchange="nmsce.loadScreenshot(this)">&nbsp
    </div>`;

const resultsItem = `
    <div id="row-idname" class="col-lg-p250 col-md-p333 col-sm-7 col-14 pointer bkg-white txt-label-def border rounded h6"
        onclick="nmsce.selectResult(this)" style="pad-bottom:3px">
        galaxy<br>
        byname<br>
        date<br>
        <div class="pl-5 pr-5" style="min-height:20px">
            <img id="img-idname" data-thumb="ethumb"
            onload="imageLoaded(this, $(this).parent().width(), $(this).parent().height(), true)">
        </div>
    </div>`;


function showLatLong() {
    let loc = $("#typePanels #hdr-Ship")
    if ($(this).prop("checked")) {
        loc.find("#row-Latitude").show()
        loc.find("#row-Longitude").show()
        loc.find("#row-Planet-Index").show()
        loc.find("#row-Planet-Name").show()
        loc.find("#row-Class").show()
    } else {
        loc.find("#row-Latitude").hide()
        loc.find("#row-Longitude").hide()
        loc.find("#row-Planet-Index").hide()
        loc.find("#row-Planet-Name").hide()
        loc.find("#row-Class").hide()
    }
}

class NMSCE {

    buildPanels() {
        const addRadioList = function (loc, label, list, ttip) {
            let h = /ifreq/[Symbol.replace](tRadio, "")
            h = /idname/g[Symbol.replace](h, label.nameToId())
            h = /ttip/g[Symbol.replace](h, ttip ? ttip : "")
            h = /title/g[Symbol.replace](h, label)

            loc.append(h)
            loc = loc.find("#list")
            h = ""

            for (let i of list) {
                let l = /ifreq/[Symbol.replace](tRadioItem, "")
                l = /idname/g[Symbol.replace](l, label.nameToId())
                l = /title/g[Symbol.replace](l, i.name)
                l = /tname/[Symbol.replace](l, i.name.nameToId())

                if (i.ttip) {
                    l = /ttip/[Symbol.replace](l, tText)
                    l = /ttext/[Symbol.replace](l, i.ttip)
                } else
                    l = /ttip/[Symbol.replace](l, "")

                h += l
            }

            loc.append(h)
        }

        addRadioList($("#id-Economy"), "Economy", economyListTier)
        addRadioList($("#id-Lifeform"), "Lifeform", lifeformList)
        addRadioList($("#id-Platform"), "Platform", platformListAll)

        bhs.buildMenu($("#panels"), "Galaxy", galaxyList, nmsce.setGalaxy, {
            tip: "Empty - blue<br>Harsh - red<br>Lush - green<br>Normal - teal",
            required: true,
            labelsize: "col-md-6 col-4",
            menusize: "col",
        })

        if (fnmsce) {
            bhs.buildMenu($("#panels"), "Version", versionList, null, {
                labelsize: "col-md-6 col-4",
                menusize: "col",
            })

            // getDocs(collection(bhs.fs, "nmsce")).then(snapshot => {
            //     let galaxyList = []
            //     for (let doc of snapshot.docs) {
            //         galaxyList.push({
            //             name: doc.ref.id
            //         })
            //     }

            //     bhs.buildMenu($("#panels"), "Galaxy", galaxyList, null, {
            //         required: true,
            //         labelsize: "col-md-6 col-4",
            //         menusize: "col",
            //     })
            // })
        }

        addGlyphButtons($("#glyphbuttons"), nmsce.addGlyph)

        if (fcedata) {
            let rloc = $("#panels")
            rloc.find("input").change(updateImageText)
            rloc.find("button").click(updateImageText)

            let img = $("#id-canvas")
            let lastDownTarget
            let canvas = document.getElementById("id-canvas")

            img.on("touchstart", e => {
                event.offsetX = event.targetTouches[0].pageX - img.offset().left
                event.offsetY = event.targetTouches[0].pageY - img.offset().top

                nmsce.imageMouseDown(e)
            })
            img.on("touchmove", e => {
                event.offsetX = event.targetTouches[0].pageX - img.offset().left
                event.offsetY = event.targetTouches[0].pageY - img.offset().top

                nmsce.imageMouseMove(e)
            })
            img.on("touchend", e => {
                nmsce.imageMouseUp(e)
            })
            img.mouseout(e => {
                nmsce.imageMouseOut(e)
            })
            img.mousedown(e => {
                lastDownTarget = canvas
                nmsce.imageMouseDown(e)
            })
            img.mousemove(e => {
                nmsce.imageMouseMove(e)
            })
            img.mouseup(e => {
                nmsce.imageMouseUp(e)
            })

            document.addEventListener('mousedown', function (e) {
                lastDownTarget = e.target
            }, true)

            document.addEventListener('keydown', function (e) {
                if (lastDownTarget == canvas)
                    nmsce.imageKeypress(e)
            }, true)
        }
    }

    setGalaxy(evt) {
        bhs.updateUser({
            galaxy: $(evt).text().stripNumber()
        })

        nmsce.getEntries(true)
    }

    setGlyphInput(evt) {
        if (bhs.user.uid) {
            if (typeof bhs.inputSettings === "undefined" || bhs.inputSettings.glyph !== $(evt).prop("checked")) {
                bhs.updateUser({
                    inputSettings: {
                        glyph: $(evt).prop("checked")
                    }
                })
            }
        } else {
            if ($(evt).prop("checked")) {
                $("[id='id-glyphInput']").show()
                $("[id='id-addrInput']").hide()
                $("[id='ck-glyphs']").prop("checked", true)
            } else {
                $("[id='id-glyphInput']").hide()
                $("[id='id-addrInput']").show()
                $("[id='ck-glyphs']").prop("checked", false)
            }
        }
    }

    addGlyph(evt, val) {
        let loc = $("#id-glyphInput").find("#id-glyph")
        let a = loc.val() + (val ? val : $(evt).text().trim().slice(0, 1))
        loc.val(a)

        if (a.length === 12)
            nmsce.changeAddr(loc)
    }

    changeAddr(evt, a) {
        let addr = a ? a : $(evt).val()
        let p = 0
        let idx = $("[role='tabpanel'] [id='id-Planet-Index']")

        if (addr !== "") {
            if (addr.length === 12) {
                p = addr.slice(0, 1)
                idx.val(p)
            }

            addr = reformatAddress(addr)
            let pnl = $("#panels")

            nmsce.dispAddr(pnl, addr)
            nmsce.restoreImageText(null, true)

            if (!fnmsce) {
                $("#foundreg").hide()
                $("#foundsys").hide()
                $("[data-type='string'] .fa-check").hide()
                getPlanet(idx.first())

                bhs.getEntry(addr, nmsce.displaySystem, null, null, true).then(entry => {
                    if (!entry) {
                        if (nmsce.lastsys && nmsce.lastsys.sys === $("#id-sys").val()) {
                            $("#id-sys").val("")
                            $("#id-reg").val("")
                            $("#id-Economy [type='radio']").prop("checked", false)
                            $("#id-Lifeform [type|='radio']").prop("checked", false)
                        }
                    }

                    if (!entry || !entry.reg)
                        bhs.getEntryByRegionAddr(addr, nmsce.displayRegion)

                    nmsce.lastsys = entry
                })
            }
        }
    }

    dispAddr(pnl, addr) {
        let glyph = addrToGlyph(addr)
        let loc = pnl.find("#id-glyphInput")
        loc.find("#id-addr").text(addr)
        loc.find("#id-glyph").val(glyph)
        loc.find("#id-hex").text(glyph)

        loc = pnl.find("#id-addrInput")
        loc.find("#id-addr").val(addr)
        loc.find("#id-glyph").text(glyph)
        loc.find("#id-hex").text(glyph)
    }

    displayRegion(entry) {
        if (entry.reg) {
            let loc = $("#panels")
            loc.find("#id-reg").val(entry.reg)
            loc.find("#foundreg").show()
        }
    }

    displaySystem(entry) {
        let loc = $("#panels")

        if (entry.sys)
            loc.find("#foundsys").show()
        else
            loc.find("#foundsys").hide()

        if (entry.reg)
            loc.find("#foundreg").show()
        else
            loc.find("#foundreg").hide()

        $("#btn-Galaxy").text(entry.galaxy)

        nmsce.dispAddr(loc, entry.addr)

        loc.find("#id-sys").val(entry.sys)
        loc.find("#id-reg").val(entry.reg)

        loc.find("#id-by").html("<h6>" + entry.sys ? entry._name : "" + "</h6>")

        if (!entry.Economy && entry.econ) {
            let i = getIndex(economyList, "name", entry.econ)
            if (i > 0) {
                let econ = economyList[i].number
                entry.Economy = "T" + econ
            }
        }

        if (!entry.Platform && (entry.platform || bhs.user.Platform)) {
            if (bhs.user.Platform)
                entry.Platform = bhs.user.Platform
            else if (entry.platform === "PC-XBox")
                entry.Platform = "PC"
            else
                entry.Platform = "PS4"
        }

        if (typeof entry.Economy === "number")
            entry.Economy = "T" + entry.Economy

        setRadio($("#id-Economy"), entry.Economy)
        if (!entry.Lifeform && entry.life)
            entry.Lifeform = entry.life
        setRadio($("#id-Lifeform"), entry.Lifeform)
        setRadio($("#id-Platform"), entry.Platform)
    }

    showSearchPanel(evt) {
        if ($(evt).prop("checked")) {
            $("#searchPanel").css("display", "inherit")

            let loc = $("#typePanels .active")
            loc = loc.find("#menu-Type")
            if (loc.length > 0) {
                let btn = loc.find("[id|='btn']")
                if (btn.text().stripMarginWS() === "")
                    loc.find("[id|='item']").first().click()
            }
        } else
            $("#searchPanel").hide()
    }

    expandPanels(show) {
        if (show) {
            $('[data-hide=true]').hide()
            $('[data-allowhide=true]').show()
        } else {
            $('[data-hide=true]').show()
            $('[data-allowhide=true]').hide()
        }
    }

    displayUser() {
        if (bhs.user.uid && fcedata) {
            nmsce.restoreImageText(bhs.user.imageText)

            if (typeof nmsce.entries === "undefined")
                nmsce.getEntries()

            let loc = $("#id-table")
            let t = 0
            for (let k of Object.keys(bhs.user.nmsceTotals)) {
                t += bhs.user.nmsceTotals[k]
                let tloc = loc.find("#tot-" + k)

                if (tloc.length > 0)
                    tloc.text(bhs.user.nmsceTotals[k])
            }

            let tloc = loc.find("#tot-All")
            tloc.text(t)

        } else if (fnmsce) {
            if (!bhs.user.uid && typeof (Storage) !== "undefined" && !bhs.user.galaxy)
                bhs.user.galaxy = window.localStorage.getItem('nmsce-galaxy')

            if (!bhs.user.galaxy)
                bhs.user.galaxy = "Euclid"

            if (bhs.user.uid && typeof nmsce.entries["My Favorites"] === "undefined")
                nmsce.getResultsLists("My Favorites")
        }

        nmsce.expandPanels(fcedata || (bhs.user.nmscesettings && bhs.user.nmscesettings.expandPanels))

        let loc = $("#row-playerInput")
        if (fcedata)
            loc.find("#id-Player").val(bhs.user._name)

        loc.find("#btn-Galaxy").text(bhs.user.galaxy)

        loc = loc.find("#id-Platform")
        loc.find("input").prop("checked", false)
        if (bhs.user.Platform)
            loc.find("#rdo-" + bhs.user.Platform).prop("checked", true)

        loc = $("#row-playerDisplay")
        loc.find("#id-Player").text(bhs.user._name)
        loc.find("#id-Galaxy").text(bhs.user.galaxy)
        loc.find("#id-Platform").text(bhs.user.Platform)

        $("#searchlocaltt").hide()

        nmsce.getSearches()
    }

    clearPanel(all) {
        const clr = (pnl) => {
            pnl.find("input").each(function () {
                let id = $(this).prop("id").stripID()
                if (id === "glyphs" || id === "PC" || id === "XBox" || id === "PS4" || fcedata && id === "Player")
                    return

                let type = $(this).prop("type")
                if (type === "checkbox")
                    $(this).prop("checked", false)
                else if (type === "radio") {
                    $(this).prop("checked", false)
                    $(this).data("last", false)
                } else
                    $(this).val("")
            })

            pnl.find("[id|='menu']").each(function () {
                let id = $(this).prop("id").stripID()
                if ((!fcedata || all || id !== "Type") && id != "Galaxy")
                    $(this).find("[id|='btn']").text("")
            })

            pnl.find(".fa-check").hide()
        }

        clr($("#typePanels"))

        if (all) {
            let loc = $("#panels")
            loc.find("#foundreg").hide()
            loc.find("#foundsys").hide()
            loc.find("#id-by").empty()

            loc.find("#id-glyphInput #id-addr").empty()
            loc.find("#id-glyphInput #id-hex").empty()
            loc.find("#id-addrInput #id-glyph").empty()
            loc.find("#id-addrInput #id-hex").empty()

            $("#pnl-map [id|='slist']").hide()
            $("#pnl-map [id|='pnl']").hide()

            clr($("#panels"))

            if (fnmsce) {
                $("#id-Player").val("")
                $("#btn-Version").text("Nothing Selected")
            }
        }

        let loc = $("#pnl-map [id|='map']")
        loc.find("*").css("stroke", mapColors.enabled)
        $("[id='asym-checkmark']").hide()

        for (let p of Object.keys(nmsce)) {
            let map = nmsce[p]
            if (map && map.type === "map")
                for (let p of Object.keys(map))
                    if (p !== "type")
                        map[p].state = "enabled"
        }

        loc = $("#typePanels #hdr-Ship")
        loc.find("#row-Latitude").hide()
        loc.find("#row-Longitude").hide()
        loc.find("#row-Planet-Index").hide()
        loc.find("#row-Planet-Name").hide()
        loc.find("#row-Class").hide()

        $("#id-ssImage").hide()
        $("#id-ssImage").attr("src", "")
        $("#redditlink").val("")
        $("#posted").empty()
        $("#imgtable").hide()
        $("#imageTextBlock").hide()
        $("#updateScreenshot").hide()
        $("#ck-private").prop("checked", false)

        let tags = $("[data-type='tags']")

        for (let loc of tags) {
            let id = $(loc).prop("id").stripID()

            $(loc).find("#add-" + id).hide()
            $(loc).find("#btn-" + id).text(id.idToName())
            $(loc).find("#list-" + id).empty()
        }

        nmsce.last = null

        let tab = $("#typeTabs .active").prop("id").stripID()
        if (tab === "Freighter")
            $("#pnl-map #pnl-Freighter").show()

        if (tab === "Living-Ship")
            $("#pnl-map #pnl-Living-Ship").show()

        if (fcedata) {
            let canvas = document.getElementById("id-canvas")
            let ctx = canvas.getContext("2d")
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            $("#save-system").text("Save System")
            $("#save").text("Save All")
            $("#delete-system").addClass("disabled")
            $("#delete-system").prop("disabled", true)
            $("#delete-item").addClass("disabled")
            $("#delete-item").prop("disabled", true)

            $("#openReddit").addClass("disabled")
            $("#openReddit").prop("disabled", true)
            $("#redditPost").hide()
        }
    }

    extractSystem() {
        let entry = {}
        let ok = true

        let loc = $("#panels")

        let last = nmsce.lastsys ? nmsce.lastsys : nmsce.last

        if (last) {
            entry._name = last._name
            entry.uid = last.uid
            entry.created = last.created
            entry.Platform = last.Platform
            entry.platform = last.Platform === "PS4" ? "PS4" : last.Platform === "PC" || last.Platform === "XBox" ? "PC-XBox" : ""
            entry.galaxy = last.galaxy
            entry.version = last.version ? last.version : latestversion
        } else {
            entry._name = bhs.user._name
            entry.uid = bhs.user.uid
            entry.Platform = bhs.user.Platform
            entry.platform = entry.Platform === "PS4" ? "PS4" : entry.Platform === "PC" || entry.Platform === "XBox" ? "PC-XBox" : ""
            entry.galaxy = bhs.user.galaxy
            entry.version = latestversion
        }

        entry.page = "nmsce"

        loc = $("#panels")
        entry.addr = loc.find("#id-addr").val()
        entry.sys = loc.find("#id-sys").val()
        entry.reg = loc.find("#id-reg").val()

        loc = loc.find("#row-Lifeform :checked")
        if (loc.length > 0) {
            entry.Lifeform = loc.prop("id").stripID()
            entry.life = entry.Lifeform
        }

        loc = $("#panels").find("#row-Economy :checked")
        if (loc.length > 0)
            entry.Economy = loc.prop("id").stripID()

        entry.xyzs = addressToXYZ(entry.addr)
        let err = bhs.validateAddress(entry.addr)
        if (err) {
            bhs.status(err)
            ok = false
        }

        if (ok) {
            if (!last || last.uid === bhs.user.uid || bhs.isRole("admin") ||
                !last.sys || !last.reg || !last.life || !last.Economy)

                bhs.updateEntry(entry)
        } else
            bhs.status("WARNING: System info not updated. " + bhs.user._name + " is not creator of " + entry.addr + " " + entry.sys)

        return ok ? entry : null
    }

    extractEntry() {
        let entry = nmsce.extractSystem()
        let ok = entry !== null

        if (ok) {
            delete entry.created

            if (nmsce.last) {
                entry.created = nmsce.last.created
                entry.id = nmsce.last.id
                entry.Photo = nmsce.last.Photo
                entry._name = nmsce.last._name
                entry.uid = nmsce.last.uid
            } else {
                entry._name = bhs.user._name
                entry.uid = bhs.user.uid
                entry.Platform = bhs.user.Platform
                entry.platform = entry.Platform === "PS4" ? "PS4" : entry.Platform === "PC" || entry.Platform === "XBox" ? "PC-XBox" : ""
                entry.galaxy = bhs.user.galaxy
            }

            entry.private = $("#id-private").is(":visible") && $("#ck-private").prop("checked") && bhs.isPatreon(3)

            let tab = $("#typeTabs .active").prop("id").stripID()
            let pnl = $("#typePanels #pnl-" + tab)
            entry.type = tab

            let list = pnl.find("[id|='row']")
            for (let rloc of list) {
                let loc = $(rloc)
                if (!loc.is(":visible"))
                    continue

                let id = loc.prop("id").stripID()
                let data = loc.data()

                if (typeof data === "undefined")
                    continue

                switch (data.type) {
                    case "number":
                    case "float":
                    case "string":
                        entry[id] = loc.find("input").val()
                        break
                    case "tags":
                        let tloc = loc.find("[id|='tag']")
                        entry[id] = []

                        for (let loc of tloc) {
                            let t = $(loc).prop("id").stripID().idToName()
                            if (t && !entry[id].includes(t))
                                entry[id].push(t)
                        }

                        if (entry[id].length > 0)
                            entry[id].sort((a, b) =>
                                a.toLowerCase() > b.toLowerCase() ? 1 :
                                    a.toLowerCase() < b.toLowerCase() ? -1 : 0)
                        break
                    case "menu":
                        entry[id] = loc.find("[id|='btn']").text().stripMarginWS()
                        if (entry[id] === "Nothing Selected")
                            entry[id] = ""
                        break
                    case "checkbox":
                        entry[id] = loc.find("input").prop("checked")
                        break
                    case "radio":
                        loc = loc.find(":checked")
                        if (loc.length > 0)
                            entry[id] = loc.prop("id").stripID().nameToId()
                        break
                    case "img":
                        if (!fnmsce) {
                            let canvas = $("#id-canvas")[0]
                            if (typeof canvas !== "undefined" && typeof entry[id] === "undefined")
                                entry[id] = uuidv4() + ".jpg"
                        }
                        break
                }

                if (ok && data.req && !fnmsce) {
                    ok = typeof entry[id] !== "undefined"

                    if (ok)
                        switch (data.type) {
                            case "string":
                            case "menu":
                            case "checkbox":
                            case "radio":
                            case "img":
                                ok = entry[id] !== ""
                                break
                            case "number":
                            case "float":
                                ok = entry[id] !== -1 && entry[id] !== ""
                                break
                            case "tags":
                                ok = entry[id].length > 0
                                break
                        }

                    if (!ok) {
                        bhs.status(id + " required. Entry not saved.")
                        break
                    }
                }
            }
        }

        if (ok) {
            if (entry.type === "Planet")
                entry["Planet-Name"] = entry.Name

            let parts = nmsce[(entry.Type ? entry.Type : entry.type).toLowerCase()]
            if (parts) {
                entry.parts = {}
                for (let p of Object.keys(parts)) {
                    if (parts[p].state === "selected")
                        entry.parts[p] = true
                }
            }

            entry.redditlink = $("#redditlink").val()
            entry.imageText = bhs.user.imageText

            if (!nmsce.last || nmsce.last.uid === bhs.user.uid || bhs.isRole("admin")) {
                if (typeof nmsce.entries === "undefined")
                    nmsce.entries = []

                nmsce.initVotes(entry)

                if (typeof entry.id === "undefined")
                    entry.id = uuidv4()

                nmsce.entries[entry.type].push(entry)
                nmsce.displayListEntry(entry, true)

                if (!(ok = nmsce.updateScreenshot(entry)))
                    bhs.status("Error: Photo required.")
                else {
                    nmsce.updateEntry(entry)

                    bhs.status(entry.type + " " + entry.Name + " validated, saving...")
                    $("#imgtable").hide()
                }
            } else {
                bhs.status("ERROR: Entry not saved. " + bhs.user._name + " is not creator of " + entry.type + " " + entry.Name)
                ok = false
            }
        }

        return ok
    }

    displaySingle(entry, noscroll) {
        if (!entry || !entry.type)
            return

        nmsce.clearPanel(true)
        nmsce.last = entry

        if (!noscroll)
            $('html, body').animate({
                scrollTop: $('#panels').offset().top
            }, 500)

        let tloc = $("#tab-" + entry.type.nameToId())
        tloc.click()

        $("#panels #foundreg").hide()
        $("#panels #foundsys").hide()

        if (!entry.Lifeform && entry.life)
            entry.Lifeform = entry.life

        if (!entry.Economy && entry.econ) {
            let i = getIndex(economyList, "name", entry.econ)
            if (i > 0 && economyList[i].number > 0)
                entry.Economy = "T" + economyList[i].number
        } else if (typeof entry.Economy === "number")
            entry.Economy = "T" + entry.Economy

        nmsce.displaySystem(entry)
        nmsce.changeAddr(null, entry.addr)

        let link = "https://nmsce.com/preview.html?i=" + entry.id + "&g=" + entry.galaxy.nameToId() + "&t=" + entry.type.nameToId()
        $("[id|='permalink']").attr("href", link)
        $("[id|='permalink']").on('dragstart', false)

        let disp = function (flds, pnltype, slist) {
            let pnl = $("#typePanels " + pnltype)
            if (slist)
                pnl = pnl.find(slist)

            for (let fld of flds) {
                let id = fld.name.nameToId()
                let row = pnl.find("#row-" + id)

                if (typeof entry[id] === "undefined")
                    continue

                switch (fld.type) {
                    case "number":
                        row.find("input").val(parseInt(entry[id]))
                        break
                    case "float":
                        row.find("input").val(parseFloat(entry[id]))
                        break
                    case "string":
                        row.find("input").val(entry[id])
                        break
                    case "tags":
                        row.find("#list-" + id).empty()
                        for (let t of entry[id]) {
                            let h = /idname/[Symbol.replace](tTag, t.nameToId())
                            h = /title/[Symbol.replace](h, t)
                            row.find("#list-" + id).append(h)
                        }
                        break
                    case "menu":
                        row.find("#item-" + entry[id].nameToId()).click()

                        if (fld.sublist)
                            disp(fld.sublist, pnltype, "#slist-" + entry[id].nameToId())
                        break
                    case "radio":
                        if (entry[id]) {
                            row.find("input").prop("checked", false)
                            row.find("#rdo-" + entry[id].nameToId()).prop("checked", true)
                        }
                        break
                    case "checkbox":
                        if (entry[id] !== row.find("input").prop("checked"))
                            row.find("input").click()
                        break
                }
            }
        }

        let idx = getIndex(objectList, "name", entry.type)
        let obj = objectList[idx]

        disp(obj.fields, "#pnl-" + entry.type)

        if (entry.parts) {
            let map = $("#pnl-map #pnl-" + entry.type)
            if (entry.Type)
                map = map.find("#slist-" + entry.Type)

            let list = Object.keys(entry.parts)
            for (let i of list) {
                let loc = map.find("#map-" + i)
                if (loc.length > 0)
                    nmsce.selectMap(loc, true)
            }
        }

        if (entry.imageText)
            nmsce.imageText = mergeObjects(nmsce.imageText, entry.imageText)

        nmsce.loadScreenshot(null, entry.Photo)

        $("#redditlink").val(entry.redditlink ? entry.redditlink : "")

        $("#save-system").text("UPDATE System")
        $("#save").text("UPDATE All")
        $("#delete-system").removeClass("disabled")
        $("#delete-system").removeAttr("disabled")
        $("#delete-item").removeClass("disabled")
        $("#delete-item").removeAttr("disabled")

        let r = entry.reddit
        let date = r ? "Posted " : ""
        if (r && typeof r.toDate !== "undefined")
            date += r.toDate().toDateLocalTimeString()

        $("#posted").html(date)

        $("#ck-private").prop("checked", entry.private)
    }

    displaySearch(search) {
        nmsce.clearPanel(true)

        $("#btn-Galaxy").text(search.galaxy)
        $("#ck-notify").prop("checked", search.notify)
        $("#id-Player").text(search.name)

        let tloc = $("#pnl-" + search.type.nameToId())
        tloc.click()

        for (let itm of search.search) {
            let loc = itm.id ? $("#panels " + itm.id) : tloc.find("#row-" + itm.name.nameToId())
            switch (itm.type) {
                case "number":
                case "float":
                case "string":
                    loc.find("#id-" + itm.name.nameToId()).val(itm.val)
                    break
                case "date":
                    loc.find("#id-" + itm.name.nameToId()).val(itm.date)
                    break
                case "menu":
                    if (itm.name === "Type")
                        loc.find("#item-" + itm.val.nameToId()).click()
                    else
                        loc.find("#btn-" + (itm.id ? itm.id.stripID() : itm.name.nameToId())).text(itm.val)
                    break
                case "checkbox":
                    loc.find("#ck-" + itm.val).prop("checked", true)
                    break
                case "radio":
                    loc.find("#rdo-" + itm.val).prop("checked", true)
                    break
                case "tags":
                    for (let i of itm.list)
                        loc.find("#item-" + i.nameToId()).click()
                    break
                case "map":
                    let map = $("#pnl-map #pnl-" + itm.page)
                    if (itm.Type)
                        map = map.find("#slist-" + itm.Type)
                    map = map.find("#row-" + itm.name)

                    for (let i of list)
                        nmsce.selectMap(map.find("#map-" + i), true)
                    break
            }
        }
    }

    executeSearch(search, panel, dispFcn) {
        if (!search)
            return

        $("#status").empty()

        let ref = collection(bhs.fs, "nmsce/" + search.galaxy + "/" + search.type)

        let firstarray = 0;
        let arraylist = [];
        let statements = [];

        for (let q of search.search) {
            switch (q.type) {
                case "tags":
                    arraylist.push(q)

                    if (firstarray++ === 0)
                        statements.add(where(q.name, "array-contains-any", q.list))
                    break
                case "map":
                    for (let i of q.list)
                        statements.add(where(q.name + "." + i, "==", true))
                    break
                default:
                    statements.add(where(q.name, q.query ? q.query : "==", q.val))
                    break
            }
        }

        let qury = query(ref, ...statements, limit(50))

        const filterResults = (entries, panel) => {
            let list = []
            if (entries)
                for (let e of entries) {
                    let found = true
                    for (let l of arraylist) {
                        for (let t of l.list) {
                            if (!e[l.name] || !e[l.name].includes(t)) {
                                found = false
                                break
                            }
                        }

                        if (!found)
                            break
                    }

                    if (found) {
                        list.push(e)
                    }
                }

            if (list.length === 0)
                bhs.status("Nothing matching selection found. Try selecting fewer items. To match an entry it must contain everything selected.", true)
            else
                dispFcn(list, panel)
        }

        getWithObserver(null, qury, panel, true, filterResults)
    }

    search(search) {
        if (!search) {
            search = nmsce.extractSearch()

            if (!search) {
                bhs.status("Nothing selected for search.", true)
                return
            }
        }

        let display = (list, type) => {
            $("#dltab-Search-Results").click()

            if (fnmsce)
                nmsce.displayResultList(list, type)
            else
                nmsce.displayList(list, type)
        }

        $("#list-Search-Results").empty()
        $("#dltab-Search-Results").show()
        nmsce.entries["Search-Results"] = []

        nmsce.executeSearch(search, "Search Results", display)
    }

    saveSearch() {
        let search = nmsce.extractSearch()
        if (!search)
            return

        search.saved = true
        search.page = window.location.pathname

        if (!bhs.user.uid || !bhs.isPatreon(2)) {
            if (typeof (Storage) !== "undefined") {
                window.localStorage.setItem('nmsce-galaxy', $("#btn-Galaxy").text().stripNumber())

                search.uid = window.localStorage.getItem('nmsce-tempuid')
                if (!search.uid) {
                    search.uid = uuidv4()
                    window.localStorage.setItem('nmsce-tempuid', search.uid)
                }

                window.localStorage.setItem('nmsce-search', JSON.stringify(search))
                bhs.status("Search saved.")
            }
        } else {
            search.uid = bhs.user.uid
            search._name = bhs.user._name
            search.email = bhs.user.email
            search.date = Timestamp.now()
            search.notify = $("#ck-notify").prop("checked")
            search.name = $("#searchname").val()

            if (search.name) {
                setDoc(doc(bhs.fs, "users/" + bhs.user.uid + "/nmsce-saved-searches/" + search.name.nameToId()), search, {
                    merge: true
                }).then(() => bhs.status(search.name + " saved."))
            } else {
                bhs.status("No save name specified.")
                return
            }

            let i = -1
            if (nmsce.searchlist)
                i = getIndex(nmsce.searchlist, "name", search.name)
            else
                nmsce.searchlist = []

            if (i !== -1)
                nmsce.searchlist[i] = search
            else {
                nmsce.searchlist.push(search)

                let loc = $("#menu-Saved")
                if (loc.find("#list").length > 0) {
                    let item
                    if (loc.first("[id|='item]").is("li"))
                        item = `<li id="item-idname" class="dropdown-item" type="button" style="rgbcolor cursor: pointer">iname</li>`
                    else
                        item = `<button id="item-idname" class="dropdown-item border-bottom" type="button" style="rgbcolor cursor: pointer">iname</button>`

                    let h = /idname/[Symbol.replace](item, search.name.nameToId())
                    h = /iname/[Symbol.replace](h, search.name)

                    let lloc = loc.find("#list")
                    lloc.append(h)
                    loc = loc.find("#item-" + search.name.nameToId())
                    bhs.bindMenuChange(loc, nmsce.executeSaved)
                } else
                    bhs.buildMenu($("#entrybuttons"), "Saved", nmsce.searchlist, nmsce.executeSaved, {
                        sort: true,
                        labelsize: "col-2",
                        menusize: "col"
                    })
            }
        }
    }

    deleteSearch() {
        if (bhs.user.uid) {
            let name = $("#searchname").val()

            if (!name) {
                bhs.status("No search name provided.")
                return
            }

            let i = getIndex(nmsce.searchlist, "name", name)

            if (i !== -1) {

                deleteDoc(doc(bhs.fs, "users/" + bhs.user.uid + "/nmsce-saved-searches/" + name.nameToId())).then(() => {
                    bhs.status(name + " search deleted.")

                    nmsce.searchlist.splice(i, 1)
                    let loc = $("#menu-Saved #item-" + name.nameToId())
                    loc.remove()
                })
            } else {
                bhs.status("Named search not found.")
            }
        }
    }

    getSearches() {
        if (!bhs.user.uid)
            return

        let ref = collection(bhs.fs, "users/" + bhs.user.uid + "/nmsce-saved-searches")
        ref = ref.where("uid", "==", bhs.user.uid)

        ref.get().then(snapshot => {
            nmsce.searchlist = []
            for (let doc of snapshot.docs) {
                let s = doc.data()
                nmsce.searchlist.push(s)
            }

            if (nmsce.searchlist.length > 0)
                bhs.buildMenu($("#entrybuttons"), "Saved", nmsce.searchlist, nmsce.executeSaved, {
                    sort: true
                })
        }).catch(err => console.log(err.message))
    }

    executeSaved(evt) {
        let name = $(evt).text().stripMarginWS()
        let i = getIndex(nmsce.searchlist, "name", name)

        if (i !== -1) {
            nmsce.displaySearch(nmsce.searchlist[i])
            nmsce.search(nmsce.searchlist[i])
        }
    }

    searchLocal(evt) {
        if (typeof (Storage) !== "undefined") {
            let s = window.localStorage.getItem('nmsce-search')

            if (s) {
                s = JSON.parse(s)

                nmsce.displaySearch(s)
                nmsce.search(s)
            }
        }
    }

    extractSearch() {
        let galaxy = $("#btn-Galaxy").text().stripNumber()
        let s = {}
        s.search = []
        let search = s.search

        if (galaxy === "") {
            bhs.status("No Galaxy Selected.")
            return null
        }

        let tab = $("#typeTabs .active").prop("id").stripID()
        let pnl = $("#typePanels #pnl-" + tab)

        s.galaxy = galaxy
        s.type = tab

        let name = $("#id-Player").val()
        if (name)
            search.push({
                name: "_name",
                type: "string",
                id: "id-Player",
                val: name
            })

        let val = $("#btn-Version").text().stripMarginWS()
        if (val.length > 0 && val !== "Nothing Selected") {
            search.push({
                name: "version",
                type: "menu",
                id: "btn-Version",
                val: val
            })
        }

        let date = $("#id-Created").val()
        if (date)
            search.push({
                name: "created",
                type: "date",
                id: "id-Created",
                query: ">=",
                date: date,
                val: Timestamp.fromDate(new Date(date))
            })

        let obj = null
        let i = getIndex(objectList, "name", tab)
        if (i > -1)
            obj = objectList[i]

        for (let fld of obj.imgText) {
            if (fld.name === "Galaxy" || fcedata && fld.name === "Player")
                continue

            let loc = $(fld.id)

            let val = ""

            switch (fld.type) {
                case "menu":
                    val = loc.find("#btn-" + fld.id.stripID()).text().stripNumber()
                    break
                case "radio":
                    loc = loc.find(":checked")
                    if (loc.length > 0)
                        val = loc.parent().text().stripMarginWS()
                    break
                default:
                    val = loc.val()
                    break
            }

            if (val !== "") {
                search.push({
                    name: fld.field,
                    type: fld.type,
                    id: fld.id,
                    val: val
                })
            }
        }

        let list = pnl.find("[id|='row']")

        for (let rloc of list) {
            let loc = $(rloc)
            if (!loc.is(":visible"))
                continue

            let rdata = loc.data()

            if (typeof rdata === "undefined")
                continue

            let val

            let itm = {}
            itm.name = loc.prop("id").stripID()
            itm.type = rdata.type
            if (rdata.search)
                itm.query = rdata.search

            switch (rdata.type) {
                case "number":
                case "float":
                    val = loc.find("input").val()
                    if (val && val != -1) {
                        itm.val = val
                        search.push(itm)
                    }
                    break
                case "string":
                    val = loc.find("input").val()
                    if (val) {
                        itm.val = val
                        search.push(itm)
                    }
                    break
                case "tags":
                    let tlist = []

                    for (let tloc of loc.find("[id|='tag']")) {
                        let t = $(tloc).prop("id").stripID().idToName()
                        if (t && !tlist.includes(t))
                            tlist.push(t)
                    }

                    if (tlist.length > 0) {
                        itm.list = tlist
                        search.push(itm)
                    }
                    break
                case "menu":
                    val = loc.find("#btn-" + itm.name).text().stripMarginWS()
                    if (val) {
                        val = val.stripNumber()
                        if (val !== "Nothing Selected") {
                            itm.val = val
                            search.push(itm)
                        }
                    }
                    break
                case "checkbox":
                    if (fcedata) {
                        val = loc.find("input").prop("checked")
                        if (val) {
                            itm.val = val
                            search.push(itm)
                        }
                    } else {
                        loc = loc.find(":checked")
                        if (loc.length > 0) {
                            itm.val = loc.prop("id").stripID() === "True"
                            search.push(itm)
                        }
                    }
                    break
                case "radio":
                    loc = loc.find(":checked")
                    if (loc.length > 0) {
                        itm.val = loc.prop("id").stripID()
                        search.push(itm)
                    }
                    break
            }
        }

        list = []
        i = getIndex(search, "name", "Type")
        let parts = nmsce[(i >= 0 ? search[i].val : s.type).toLowerCase()]
        if (parts) {
            for (let p of Object.keys(parts)) {
                if (parts[p].state === "selected")
                    list.push(p)
            }

            if (list.length > 0) {
                search.push({
                    name: "parts",
                    type: "map",
                    list: list
                })
            }
        }

        if (s.search === []) {
            bhs.status("No search selection.")
            return null
        }

        return s
    }

    openSearch() {
        window.open("nmsce.html?s=" + nmsce.last.addr.nameToId() + "&g=" + nmsce.last.galaxy.nameToId(), '_self')
    }

    searchSystem(k) {
        if (!nmsce.last)
            return

        nmsce.entries["Search-Results"] = []

        let ref = collectionGroup(bhs.fs, "nmsceCommon")
        ref = ref.where("galaxy", "==", nmsce.last.galaxy)
        ref = ref.where("addr", "==", nmsce.last.addr)

        ref.get().then(snapshot => {
            let list = []
            for (let doc of snapshot.docs)
                list.push(doc.data())

            $("#dltab-Search-Results").click()
            $("#displayPanels #list-Search-Results").empty()
            nmsce.displayResultList(list, "Search-Results", k)
        })
    }

    searchRegion() {
        if (!nmsce.last)
            return

        nmsce.entries["Search-Results"] = []

        let ref = collectionGroup(bhs.fs, "nmsceCommon")
        ref = ref.where("galaxy", "==", nmsce.last.galaxy)
        ref = ref.where("addr", ">=", nmsce.last.addr.slice(0, 15) + "0000")
        ref = ref.where("addr", "<=", nmsce.last.addr.slice(0, 15) + "02FF")

        ref.get().then(snapshot => {
            let list = []
            for (let doc of snapshot.docs)
                list.push(doc.data())

            $("#dltab-Search-Results").click()
            $("#displayPanels #list-Search-Results").empty()
            nmsce.displayResultList(list, "Search-Results")
        })
    }

    saveEntry() {
        let ok = bhs.user.uid

        if (!nmsce.last || nmsce.last.uid === bhs.user.uid) {
            let user = nmsce.extractUser()
            ok = bhs.validateUser(user)

            // if (ok && bhs.user._name !== user._name)
            //     ok = nmsce.changeName(bhs.user.uid, user._name)

            if (ok) {
                bhs.user = mergeObjects(bhs.user, user)
                bhs.user.imageText = nmsce.extractImageText()

                let ref = bhs.getUsersColRef(bhs.user.uid)
                ref.set(bhs.user, {
                    merge: true
                }).then().catch(err => {
                    bhs.status("ERROR: " + err)
                })
            }
        }

        if (ok && nmsce.extractEntry())
            nmsce.clearPanel()
    }

    saveSystem() {
        let ok = bhs.user.uid

        if (!nmsce.last || nmsce.last.uid === bhs.user.uid) {
            let user = nmsce.extractUser()
            ok = bhs.validateUser(user)

            if (ok) {
                bhs.user = mergeObjects(bhs.user, user)
                let ref = bhs.getUsersColRef(bhs.user.uid)
                ref.set(bhs.user, {
                    merge: true
                }).then().catch(err => {
                    bhs.status("ERROR: " + err)
                })
            }
        }

        if (ok)
            nmsce.lastsys = nmsce.extractSystem()
    }

    changeName(uid, newname) { }

    extractUser() {
        let loc = $("#panels")
        let u = {}

        u.version = latestversion
        u._name = loc.find("#id-Player").val()
        u.galaxy = loc.find("#btn-Galaxy").text().stripNumber()

        loc = loc.find("#id-Platform :checked")
        if (loc.length > 0)
            u.Platform = loc.prop("id").stripID()

        u.platform = u.Platform === "PS4" ? "PS4" : u.Platform === "PC" || u.Platform === "XBox" ? "PC-XBox" : ""

        u.nmscesettings = {}
        u.nmscesettings.expandPanels = $("#hidden").is(":visible")

        return u
    }


    buildTypePanels() {
        let tabs = $("#typeTabs")
        let pnl = $("#typePanels")
        let first = true

        for (let obj of objectList) {
            let id = obj.name.nameToId()
            let h = /idname/g[Symbol.replace](nav, id)
            if (!first) {
                h = /active/[Symbol.replace](h, "")
                h = /true/[Symbol.replace](h, "false")
            }
            h = /title/[Symbol.replace](h, obj.name)
            tabs.append(h)

            h = /idname/g[Symbol.replace](header, id)
            if (!first)
                h = /active/[Symbol.replace](h, "")
            pnl.append(h)

            h = /idname/g[Symbol.replace](mapHeader, id)
            if (first)
                h = /display:none/g[Symbol.replace](h, "")
            $("#pnl-map").append(h)

            first = false

            nmsce.addPanel(obj.fields, "pnl", id)
        }

        if (fnmsce)
            $("[id|='search']").show()

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (evt) {
            let loc = $("#typePanels .active")
            let id = loc.prop("id").stripID()

            let mloc = $("#pnl-map")
            mloc.find("[id|='pnl']").hide()
            mloc = mloc.find("#pnl-" + id)
            mloc.show()

            loc = loc.find("#btn-Type")
            if (loc.length > 0) {
                let type = loc.text().stripMarginWS()
                mloc = mloc.find("#slist-" + type)
                mloc.show()
            }

            nmsce.setMapSize(mloc)
        })
    }

    addPanel(list, pnl, itmid, slist, pid) {
        let appenditem = (loc, add, title, id, ttip, req, long, hide) => {
            let l = /ihide/g[Symbol.replace](long ? long : inpHdr, hide ? true : false)
            let h = l

            l = /title/g[Symbol.replace](add, title + (req ? tReq : ""))

            if (ttip) {
                l = /ttip/[Symbol.replace](l, tText)
                l = /ttext/[Symbol.replace](l, ttip)
            } else
                l = /ttip/[Symbol.replace](l, "")

            l = /idname/g[Symbol.replace](l, id)
            l = /ifreq/[Symbol.replace](l, req ? true : false)
            l = /ihide/g[Symbol.replace](l, hide ? true : false)

            h += l + inpEnd
            loc.append(h)
        }

        let loc, itm = $("#" + pnl + "-" + itmid)
        for (let f of list) {
            if (fnmsce) {
                f.required = false
                if (!f.search)
                    continue
            }

            let l = ""
            let id = f.name.nameToId()

            switch (f.type) {
                case "link":
                    appenditem(itm, f.link, f.name, id, null, null, null, f.inputHide)
                    break
                case "number":
                    if (!f.sub || slist[f.ttip]) {
                        l = /range/[Symbol.replace](tNumber, f.range)
                        l = /stype/[Symbol.replace](l, f.query ? f.query : "")
                        appenditem(itm, l, f.name, id, !f.sub ? f.ttip : slist[f.ttip], f.required, null, f.inputHide)
                    }
                    break
                case "float":
                    if (!f.sub || slist[f.ttip]) {
                        l = /range/[Symbol.replace](tFloat, f.range)
                        l = /stype/[Symbol.replace](l, f.query ? f.query : "")
                        appenditem(itm, l, f.name, id, !f.sub ? f.ttip : slist[f.ttip], f.required, null, f.inputHide)
                    }
                    break
                case "img":
                    appenditem(itm, tImg, f.name, id, f.ttip, f.required, inpLongHdr, f.inputHide)
                    break
                case "checkbox":
                    if (!f.sub || slist[f.sub]) {
                        if (fnmsce) {
                            appenditem(itm, tRadio, f.name, id, f.ttip, null, null, f.inputHide)

                            let ckloc = itm.find("#row-" + id)
                            ckloc.attr("data-type", "checkbox")
                            ckloc = ckloc.find("#list")

                            let l = /title/g[Symbol.replace](tRadioItem, "True")
                            l = /ttip/g[Symbol.replace](l, "")
                            l = /idname/g[Symbol.replace](l, "True")
                            l = /tname/g[Symbol.replace](l, "True")
                            ckloc.append(l)

                            l = /title/g[Symbol.replace](tRadioItem, "False")
                            l = /ttip/g[Symbol.replace](l, "")
                            l = /idname/g[Symbol.replace](l, "False")
                            l = /tname/g[Symbol.replace](l, "False")
                            ckloc.append(l)
                        } else
                            appenditem(itm, tCkItem, f.name, id, f.ttip, f.required, null, f.inputHide)
                    }
                    break
                case "string":
                    appenditem(itm, tString, f.name, id, f.ttip, f.required, null, f.inputHide)
                    break
                case "long string":
                    appenditem(itm, tLongString, f.name, id, f.ttip, f.required, inpLongHdr, f.inputHide)
                    break
                case "blank":
                    itm.append(inpHdr + inpEnd)
                    break
                case "menu":
                    appenditem(itm, tMenu, "", id, null, null, null, f.inputHide)
                    let lst = itm.find("#row-" + id)

                    if (f.ttip)
                        f.tip = slist ? slist[f.ttip] : f.ttip

                    f.labelsize = "col-5"
                    f.menusize = "col"

                    bhs.buildMenu(lst, f.name, f.sub ? slist[f.sub] : f.list, f.sublist ? nmsce.selectSublist : null, f)

                    if (f.sublist) {
                        for (let s of f.list) {
                            let iid = s.name.nameToId()
                            appenditem(itm, tSubList, s.name, iid, null, null, inpLongHdr, f.inputHide)

                            let loc = $("#pnl-map #" + itm.prop("id"))
                            let l = /idname/[Symbol.replace](tSubList, s.name.nameToId())
                            loc.append(l)

                            nmsce.addPanel(f.sublist, "slist", iid, s, itmid)
                        }
                    }
                    break
                case "tags":
                    appenditem(itm, tTags, "", id, f.ttip, f.required, inpLongHdr, f.inputHide)
                    loc = itm.find("#row-" + id)
                    if (f.max)
                        loc.data("max", f.max)

                    if (f.list) {
                        bhs.buildMenu(loc, f.name, f.list, nmsce.addTag, {
                            nolabel: true,
                            ttip: f.ttip,
                            sort: true,
                            required: f.required
                        })

                        itm.find("#btn-" + id).text(f.name)
                    } else {
                        getDoc(doc(bhs.fs, "tags/" + itmid)).then(doc => {
                            let tags = []

                            if (doc.exists()) {

                                let list = doc.data()
                                for (let t of list.tags)
                                    tags.push({
                                        name: t
                                    })

                                tags = tags.sort((a, b) =>
                                    a.name.toLowerCase() > b.name.toLowerCase() ? 1 :
                                        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 0)
                            }

                            if (fcedata)
                                tags.unshift({
                                    name: "Add new tag"
                                })

                            // let pnl = doc.ref.id
                            bhs.buildMenu(loc, f.name, tags, nmsce.addTag, {
                                nolabel: true,
                                ttip: f.ttip
                            })

                            loc.find("#btn-" + id).text(f.name)
                        })
                    }
                    break
                case "radio":
                    let list = []
                    if (f.list) {
                        appenditem(itm, tRadio, f.name, id, f.ttip, f.required, null, f.inputHide)
                        list = f.list

                    } else if (slist[f.sub]) {
                        appenditem(itm, tRadio, f.name, id, typeof slist[f.ttip] === "string" ? slist[f.ttip] : null, f.required, null, f.inputHide)
                        list = slist[f.sub]
                    }

                    loc = itm.find("#row-" + id + " #list")

                    for (let i of list) {
                        let l = /title/g[Symbol.replace](tRadioItem, i.name)
                        l = /ttip/[Symbol.replace](l, i.ttip ? "&nbsp;" + i.ttiip : "")
                        l = /idname/g[Symbol.replace](l, id)
                        l = /tname/g[Symbol.replace](l, i.name.nameToId())
                        loc.append(l)

                        let rdo = loc.find("#rdo-" + i.name)
                        if (fcedata) {
                            if (i.default)
                                rdo.prop("checked", true)
                        }
                    }
                    break
                case "map":
                    if (f.map || slist && slist[f.sub]) {
                        let iid = itmid.nameToId()
                        let loc = $("#pnl-map #pnl-" + (pid ? pid + " #slist-" + slist.name.nameToId() : iid))

                        iid = f.name.nameToId()
                        l = /idname/[Symbol.replace](tMap, iid)
                        loc.append(l)

                        nmsce.loadMap(loc.find("#row-" + iid), f.map ? f.map : slist[f.sub])
                    }
                    break
            }

            let rloc = itm.find("#row-" + id)

            if (f.onchange) {
                rloc.find("input").change(f.onchange)
                rloc.find("button").click(f.onchange)
            }

            if (f.imgText) {
                rloc.find("input").change(updateImageText)
                rloc.find("button").click(updateImageText)
            }

            if (f.startState === "hidden")
                rloc.hide()
        }

        let tloc = $("#item-Fighter")
        tloc.click()
    }

    addTag(evt) {
        let row = $(evt).closest("[id|='row']")
        let data = row.data()
        let text = $(evt).text().stripMarginWS()
        let id = row.prop("id").stripID()
        let tags = row.find("[id|='tag']")

        if (data.max && tags.length >= data.max) {
            row.find("#btn-" + id).text(id.idToName())
            return
        }

        if (tags.length > 0)
            for (let t of tags)
                if ($(t).prop("id").stripID() === text) {
                    row.find("#btn-" + id).text(id.idToName())
                    return
                }

        if (text === "Add new tag")
            row.find("#add-" + id).show()
        else {
            let h = /idname/[Symbol.replace](tTag, text.nameToId())
            h = /title/[Symbol.replace](h, text)

            row.find("#list-" + id).append(h)
            row.find("#btn-" + id).text(id.idToName())
        }
    }

    newTag(evt) {
        let row = $(evt).closest("[id|='row']")
        let id = row.prop("id").stripID()
        let text = row.find("[id|='txt']").val().toLowerCase()

        if (text !== "" && row.find("#item-" + text.nameToId()).length === 0) {
            let pnl = $(evt).closest("[id|='pnl']").prop("id").stripID()

            setDoc(doc(bhs.fs, "tags/" + pnl), {
                tags: firebase.firestore.FieldValue.arrayUnion(text)
            }, {
                merge: true
            })

            $(evt).val("")
            let h = row.find("#item-Add-new-tag")[0].outerHTML
            let id = text.nameToId()
            h = /Add-new-tag/[Symbol.replace](h, id)
            h = /Add new tag/[Symbol.replace](h, text)
            row.find("#list").append(h)
            bhs.bindMenuChange(row.find("#item-" + id), nmsce.addTag)

            h = /idname/[Symbol.replace](tTag, id)
            h = /title/[Symbol.replace](h, text)
            row.find("#list-" + row.prop("id").stripID()).append(h)
        }

        row.find("#add-" + id).hide()
        row.find("#txt-" + id).val("")
        row.find("#btn-" + id).text(row.prop("id").stripID())
    }

    cancelTag(evt) {
        let row = $(evt).closest("[id|='row']")
        row.find("[id|='add']").hide()
        row.find("[id|='txt']").first().val("")
        row.find("[id|='btn']").first().text(row.prop("id").stripID())
    }

    toggleRadio(evt) {
        let data = $(evt).data()

        if (data.last) {
            $(evt).prop("checked", false)
            $(evt).data("last", false)
        } else {
            let loc = $(evt).closest("#list").find("input")
            loc.prop("checked", false)
            loc.data("last", false)
            $(evt).prop("checked", true)
            $(evt).data("last", true)
        }

        return false
    }

    setMapSize(loc) {
        let maps = loc.find("[id|='row']:visible")
        for (let l of maps) {
            let svg = $(l).find("svg")
            let svgw = parseInt(svg.attr("width"))
            let svgh = parseInt(svg.attr("height"))

            let h = $("#panels").height()
            let w = $(l).width()
            let size = calcImageSize(svgw, svgh, w, h / maps.length, true)

            svg.attr("preserveAspectRatio", "xMidYMid meet")
            svg.attr("width", size.width)
            svg.attr("height", size.height)
        }
    }

    loadMap(loc, fname) {
        loc.load(fname, () => {
            // loc.find("#layer1").hide()

            let bdr = loc.find("[id|='bdr']")
            bdr.css("stroke-opacity", "0")

            let map = loc.find("[id|='map']")
            map.find("*").css("stroke", mapColors.enabled)
            $("[id='asym-checkmark']").hide()

            let name = fname.replace(/\/.*\/(.*?)(?:-opt)?\..*/, "$1")
            if (typeof nmsce[name] === "undefined")
                nmsce[name] = {}

            for (let l of bdr) {
                let id = $(l).prop("id").stripID()
                let d = $(l).find("desc").text()
                nmsce[name][id] = {}

                if (d !== "") {
                    nmsce[name].type = "map"
                    nmsce[name][id] = JSON.parse(d)
                }

                let t = $(l).find("title").text()
                if (t !== "")
                    nmsce[name][id].title = t.stripMarginWS()
            }

            for (let l of map) {
                let id = $(l).prop("id").stripID()
                if (nmsce[name][id].type !== "map") {
                    nmsce[name].type = "map"
                    let d = $(l).find("desc").text()

                    if (d !== "")
                        nmsce[name][id] = JSON.parse(d)
                }

                nmsce[name][id].state = "enabled"
                nmsce[name][id].loc = $(l)
            }

            bdr.click(function () {
                nmsce.selectMap(this)
            })

            bdr.mouseenter(function () {
                nmsce.mapEnter(this)
            })

            bdr.mouseleave(function () {
                nmsce.mapLeave(this)
            })
        })
    }


    selectMap(evt, set) {
        let evtid = $(evt).prop("id").stripID()
        let type = $(evt).closest("[id|='slist']")
        let pnl = $(evt).closest("[id|='pnl']")
        let asym = $("#typePanels #" + pnl.prop("id"))

        if (type.length !== 0) {
            asym = asym.find("#" + type.prop("id"))
            pnl = type
        }

        asym = fnmsce ? asym.find("#row-Asymmetric #rdo-True") : asym.find("#ck-Asymmetric")
        asym = asym.length > 0 ? asym.prop("checked") : false

        let pnlid = pnl.prop("id").stripID().toLowerCase()
        let parts = nmsce[pnlid]

        let part = parts[evtid]
        let partsList = Object.keys(parts)
        let selected = part.state = set || part.state !== "selected" ? "selected" : "enabled"

        for (let p of partsList)
            if (p !== "type") {
                parts[p].proc = false
                parts[p].state = parts[p].state === "selected" ? "selected" : "enabled"
            }

        const setState = function (id, state) {
            let part = parts[id]

            if (!part.proc) {
                part.proc = true
                part.state = state

                selectRequired(id)

                if (!asym && !set && part.pair)
                    setState(part.pair, part.state)

                disableParts(id)
            }
        }

        const selectRequired = function (id) {
            let part = parts[id]
            if (part.requires)
                for (let p of part.requires) {
                    if (part.state === "selected")
                        setState(p, part.state)
                    else if (parts[p].requires && parts[p].requires.includes(id))
                        setState(p, part.state)
                }
        }

        let disableParts = function (id) {
            if (id !== "type") {
                let part = parts[id]
                if (part.state === "selected") {
                    if (part.group) {
                        for (let p of partsList)
                            if (p !== "type" && p !== id) {
                                let check = parts[p]

                                if (check.group) {
                                    let intersects = []
                                    if (part.okGroup)
                                        intersects = part.okGroup.intersects(check.group)

                                    if (intersects.length === 0) {
                                        intersects = part.group.intersects(check.group)

                                        if (intersects.length > 0 && !(part.requires && part.requires.includes(p)))
                                            setState(p, set && (check.state === "selected" || check.state === "error") ? "error" : "disabled")
                                    }
                                }
                            }
                    }
                }
            }
        }

        setState(evtid, selected)

        for (let p of partsList)
            disableParts(p)

        let max = ""
        let end = 0
        let endval = ""
        let slotsfound = false

        for (let p of partsList) {
            let part = parts[p]
            if (p !== "type" && part.slots) {
                slotsfound = true

                if (part.state === "selected") {
                    if (!max || part.slots > max)
                        max = part.slots
                    if (part.pos && end < part.pos) {
                        end = part.pos
                        endval = part.slots
                    }
                }
            }
        }

        if (slotsfound && fcedata) {
            let sloc = $("#typePanels [id|='row-Slots']")
            sloc.find("input").prop("checked", false)

            if (type.prop("id") === "slist-Hauler")
                sloc = sloc.find("[id|='rdo-" + (end > 0 ? endval : "T1") + "']")
            else
                sloc = sloc.find("[id|='rdo-" + (max ? max : "T1") + "']")

            sloc.prop("checked", true)
            nmsce.restoreImageText(null, true)
        }

        part.state = selected === "selected" ? "selected" : part.state

        colorMapParts(pnlid)
    }

    mapEnter(evt) {
        let id = $(evt).prop("id").stripID()
        let loc = $(evt).closest("[id|='row']").find("#map-" + id)
        loc.find("*").css("stroke", mapColors.hover)
    }

    mapLeave(evt) {
        let id = $(evt).prop("id").stripID()
        let pnl = $(evt).closest("[id|='slist']")
        let pnlid

        if (pnl.length > 0)
            pnlid = pnl.prop("id").stripID().toLowerCase()
        else
            pnlid = $(evt).closest("[id|='pnl']").prop("id").stripID().toLowerCase()

        colorMapPart(nmsce[pnlid][id])
    }

    selectSublist(btn) {
        $("[id|='slist']").hide()

        let id = btn.text().stripMarginWS().nameToId()
        $("[id='slist-" + id + "']").show()

        let type = btn.closest("[id|='pnl']").prop("id").stripID()
        let mloc = $("#pnl-map #pnl-" + type)
        mloc.show()

        mloc = mloc.find("#slist-" + id)
        mloc.show()

        nmsce.setMapSize(mloc)
    }

    buildImageText() {
        const ckbox = `
        <label class="col-lg-2 col-md-3 col-sm-4 col-7">
            <input id="ck-idname" type="checkbox" ftype loc row sub onchange="nmsce.getImageText(this, true)">
            &nbsp;title
        </label>`
        const fieldinputs = `
        <label class="col-md-2 col-7 txt-label-def ">
            <input id="ck-Text" type="checkbox" data-loc="#id-Text"
                onchange="nmsce.getImageText(this, true)">
            Text&nbsp;
            <i class="far fa-question-circle text-danger h6" data-toggle="tooltip" data-html="false"
                data-placement="bottom" title="Use Line break, <br>, to separate multiple lines.">
            </i>&nbsp;
        </label>
        <input id="id-Text" class="rounded col-md-5 col-7" type="text"
            onchange="nmsce.getImageText(this, true)">

        <label class="col-md-2 col-7 txt-label-def ">
            <input id="ck-myLogo" type="checkbox" data-loc="#id-myLogo" data-type="img"
                onchange="nmsce.getImageText(this, true)">
            Load Overlay&nbsp;
            <i class="far fa-question-circle text-danger h6" data-toggle="tooltip" data-html="false"
                data-placement="bottom"
                title="Load a 2nd image as an overlay. You can resize and move the 2nd image."></i>&nbsp;
        </label>
        <input id="id-myLogo" type="file" class="col-md-5 col-7 border rounded" accept="image/*"
            name="files[]" onchange="nmsce.loadMyLogo(this)">
        `

        let appenditem = (title, type, loc, row, sub) => {
            let h = /idname/[Symbol.replace](ckbox, title.nameToId())
            h = /title/[Symbol.replace](h, title)
            h = /ftype/[Symbol.replace](h, "data-type='" + type + "'")
            h = /loc/[Symbol.replace](h, "data-loc='" + loc + "'")
            h = /sub/[Symbol.replace](h, sub ? "data-sub='" + sub + "'" : "")
            h = /row/[Symbol.replace](h, row ? "data-row='" + row + "'" : "")
            $("#img-text").append(h)
        }

        $("#img-text").empty()
        $("#img-text").append(fieldinputs)

        nmsce.imageText = {}
        nmsce.initImageText("logo")

        let img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = nmsce.onLoadLogo
        img.src = "/images/app-logo.png"

        nmsce.initImageText("Text")
        nmsce.initImageText("myLogo")

        for (let obj of objectList) {
            for (let txt of obj.imgText)
                if (typeof nmsce.imageText[txt.name.nameToId()] === "undefined") {
                    nmsce.initImageText(txt.name.nameToId())
                    appenditem(txt.name, txt.type, txt.id)
                }

            for (let fld of obj.fields) {
                if (fld.imgText && typeof nmsce.imageText[fld.name.nameToId()] === "undefined") {
                    nmsce.initImageText(fld.name.nameToId())
                    appenditem(fld.name, fld.type, "#typePanels .active", "#row-" + fld.name.nameToId())
                }

                if (typeof fld.sublist !== "undefined")
                    for (let sub of fld.sublist)
                        if (sub.imgText && typeof nmsce.imageText[sub.name.nameToId()] === "undefined") {
                            nmsce.initImageText(sub.name.nameToId())
                            appenditem(sub.name, sub.type, "#typePanels .active", "#row-" + fld.name.nameToId(), "#row-" + sub.name.nameToId())
                        }
            }
        }

        let loc = $("#img-text")
        let next = loc.find("#id-myLogo").nextAll()
        let list = []
        for (let l of next) {
            list.push({
                id: $(l).find("input").prop("id"),
                html: l.outerHTML
            })
            $(l).remove()
        }

        list.sort((a, b) => a.id > b.id ? 1 : -1)
        for (let l of list)
            loc.append(l.html)

        bhs.buildMenu($("#imgtable"), "Font", fontList, nmsce.setFont, {
            labelsize: "col-5",
            menusize: "col",
            sort: true,
            font: true,
        })

        $("[id|='color']").colorpicker({
            container: true,
            format: null,
            customClass: 'colorpicker-2x',
            sliders: {
                saturation: {
                    maxLeft: 200,
                    maxTop: 200
                },
                hue: {
                    maxTop: 200
                },
                alpha: {
                    maxTop: 200
                }
            },
            extensions: [{
                name: 'swatches', // extension name to load
                options: { // extension options
                    colors: {
                        '1': '#ffffff',
                        '2': '#ff0000',
                        '3': '#ff8000',
                        '4': '#ffff00',
                        // '5': '#80ff00',
                        '6': '#00ff00',
                        // '7': '#00ff80',
                        '8': '#00ffff',
                        // '9': '#0080ff',
                        '10': '#0000ff',
                        // '11': '#8000ff',
                        '12': '#ff00ff',
                        // '13': '#ff0080',
                        '14': '#000000',
                    },
                    namesAsValues: true
                }
            }]
        }).on('change', evt => {
            $(evt.target).css("background-color", evt.color.toRgbString())
            nmsce.setColor($(evt.target).prop("id").stripID(), evt.color.toRgbString())
        })
    }

    initImageText(id) {
        if (typeof nmsce.imageText === "undefined")
            nmsce.imageText = {}

        if (typeof nmsce.imageText[id] === "undefined")
            nmsce.imageText[id] = {}

        switch (id) {
            case "logo":
                nmsce.imageText[id] = {
                    ck: true,
                    type: "img",
                }
                break
            case "myLogo":
                nmsce.imageText[id] = {
                    ck: false,
                    type: "img",
                }
                break
            default:
                nmsce.imageText[id] = {
                    font: id === "Glyphs" ? "NMS Glyphs" : "Arial",
                    fSize: 24,
                    color: "#ffffff",
                    background: id === "Glyphs" ? "#000000" : "rgba(0,0,0,0)",
                    ck: false,
                    text: "",
                    type: "text"
                }
        }

        nmsce.imageText[id].sel = false
        nmsce.imageText[id].id = id
        nmsce.imageText[id].x = 20
        nmsce.imageText[id].y = 20

        return nmsce.imageText[id]
    }

    getImageText(evt, draw) {
        let id = $(evt).prop("id").stripID()
        let ck = $(evt).prop("checked")

        if (ck) {
            let text = ""
            let data = $(evt).data()
            let loc = $(data.loc)

            if (data.row)
                loc = loc.find(data.row)

            if (data.sub) {
                let btn = loc.find("[id|='btn']").text().stripMarginWS()
                loc = $(data.loc).find("#slist-" + btn)
                loc = loc.find(data.sub)
            }

            switch (data.type) {
                case "menu":
                    loc = loc.find("[id|='btn']")
                    text = loc.text().stripNumber()
                    break
                case "tags":
                    loc = loc.find("[id|='tag']")
                    if (loc.length > 0) {
                        for (let l of loc)
                            text += $(l).prop("id").stripID().idToName() + ", "

                        text = text.slice(0, text.length - 2)
                    }
                    break
                case "number":
                    text = loc.find("input").val()
                    text = !text || text === -1 ? "" : text.toString()
                    if (text.length > 0)
                        text = loc.closest("[id|='row']").prop("id").stripID().idToName() + " " + text
                    break
                case "float":
                    text = loc.find("input").val()
                    text = !text || text === -1 ? "" : text.toString()
                    if (text.length > 0)
                        text = loc.closest("[id|='row']").prop("id").stripID().idToName() + " " + text
                    break
                case "glyph":
                    text = loc.val()
                    loc = $("#typePanels .active #id-Planet-Index")
                    let num = loc.length > 0 && loc.val() > 0 ? loc.val() : 0
                    text = addrToGlyph(text, num)
                    break
                case "checkbox":
                    loc = loc.find("[id|='ck']")
                    if (loc.prop("checked"))
                        text = loc.prop("id").stripID()
                    break
                case "radio":
                    loc = loc.find(":checked")
                    if (loc.length > 0) {
                        let id = loc.closest("[id|='row']").prop("id").stripID()
                        text = (id !== "Lifeform" ? id + " " : "") + loc.prop("id").stripID()
                    }
                    break
                default:
                    if (loc.is("input"))
                        text = loc.val()
                    else
                        text = loc.find("input").val()
                    break
            }

            for (let k of Object.keys(nmsce.imageText)) {
                if (k === "textsize")
                    continue

                nmsce.imageText[k].sel = false
            }

            nmsce.imageText[id].ck = true

            if (text) {
                nmsce.imageText[id].text = text
                nmsce.imageText[id] = nmsce.measureText(nmsce.imageText[id])
            }
        } else {
            nmsce.imageText[id].ck = false
            nmsce.imageText[id].sel = false
        }

        if (draw)
            nmsce.drawText()
    }

    restoreImageText(txt, draw) {
        let loc = $("#img-text")

        if (!fcedata)
            return

        if (txt)
            nmsce.imageText = mergeObjects(nmsce.imageText, txt)

        if (typeof nmsce.imageText.myLogo.img === "undefined")
            nmsce.imageText.myLogo.ck = false
        nmsce.imageText.logo.ck = true

        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            if (id === "textsize")
                continue

            let f = nmsce.imageText[id]

            if (id === "Text" && f.text)
                loc.find("#id-Text").val(f.text)
            else
                f.text = ""

            let floc = loc.find("#ck-" + id)

            if (floc.length > 0) {
                floc.prop("checked", f.ck)
                nmsce.getImageText(floc)
            }

            f.sel = false
        }

        if (draw)
            nmsce.drawText()
    }

    extractImageText() {
        let s = mergeObjects({}, nmsce.imageText)

        let keys = Object.keys(s)
        for (let k of keys) {
            if (k === "textsize")
                continue

            let f = s[k]

            if (f.type === "text") {
                delete f.ascent
                delete f.decent
                delete f.left
                delete f.right
            }

            if (k !== "Text")
                delete f.text

            delete f.width
            delete f.height
            delete f.lineAscent
            delete f.lineDecent
            delete f.img
            delete f.resize
            delete f.sel
        }

        return s
    }

    onLoadLogo(evt) {
        let text = evt.currentTarget.src.includes("app-logo") ? nmsce.imageText.logo : nmsce.imageText.myLogo
        let img = text.img = evt.currentTarget

        let scale = text.right ? Math.min(text.right / img.naturalWidth, text.decent / img.naturalHeight) : 0.1
        text.decent = img.naturalHeight * scale
        text.right = img.naturalWidth * scale
        text.ascent = 0
        text.left = 0
        text.ck = true

        $("#ck-" + text.id).prop("checked", true)
        if (text.id !== "logo")
            nmsce.drawText()
    }

    loadMyLogo(evt) {
        let file = evt.files[0]
        let reader = new FileReader()

        reader.onload = function () {
            let img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = nmsce.onLoadLogo
            img.src = reader.result
        }

        reader.readAsDataURL(file)
    }

    loadScreenshot(evt, fname, edit) {
        $("body")[0].style.cursor = "wait"

        let img = $("#imgtable")
        img.show()

        $("#openReddit").addClass("disabled")
        $("#openReddit").prop("disabled", true)
        $("#redditPost").hide()

        if (evt || edit) {
            nmsce.glyphLocation = {
                x: 4,
                y: 412,
                height: 14,
                width: 158,
                naturalWidth: 3840,
                naturalHeight: 2160,
                modalWidth: 782,
                modalHeight: 439,
                scale: 0,
            }

            $("#editScreenshot").hide()
            $("#id-ssImage").hide()
            $("#id-canvas").show()
            $("#imageTextBlock").show()
            $("#editingScreenshot").show()

            if (nmsce.last) {
                $("#updateScreenshot").show()
                $("#ck-updateScreenshot").prop("checked", true)
            }
        } else {
            $("#editScreenshot").show()
            $("#imageTextBlock").hide()
            $("#id-canvas").hide()
            $("#id-ssImage").show()
            $("#updateScreenshot").hide()
            $("#editingScreenshot").hide()
        }

        if (evt) {
            let file = evt.files[0]
            if (file) {
                let reader = new FileReader()
                reader.onload = function () {
                    nmsce.screenshot = new Image()
                    nmsce.screenshot.crossOrigin = "anonymous"

                    nmsce.screenshot.onload = function () {
                        nmsce.restoreImageText(null, true)
                        nmsce.scaleGlyphLocation()

                        $('html, body').animate({
                            scrollTop: $('#imgtable').offset().top
                        }, 500)

                        $("body")[0].style.cursor = "default"
                    }

                    nmsce.screenshot.src = reader.result
                }

                reader.readAsDataURL(file)
            }
        } else {
            let img = new Image()
            img.crossOrigin = "anonymous"

            bhs.fbstorage.ref().child((edit ? originalPath : displayPath) + fname).getDownloadURL().then(url => {
                if (edit) {
                    var xhr = new XMLHttpRequest()
                    xhr.responseType = 'blob'
                    xhr.onload = function (event) {
                        nmsce.screenshot = new Image()
                        nmsce.screenshot.crossOrigin = "anonymous"
                        nmsce.screenshot.src = url

                        nmsce.screenshot.onload = function () {
                            nmsce.restoreImageText(null, true)
                            nmsce.scaleGlyphLocation()

                            $("body")[0].style.cursor = "default"
                        }
                    }

                    xhr.open('GET', url)
                    xhr.send()
                } else {
                    $("#id-ssImage").attr("src", url)

                    $("#openReddit").removeClass("disabled")
                    $("#openReddit").removeAttr("disabled")
                }
            })
        }
    }

    editScreenshot() {
        if (nmsce.last)
            nmsce.loadScreenshot(null, nmsce.last.Photo, true)
    }

    measureText(t) {
        if (t.type === "img")
            return t

        let canvas = document.createElement("canvas")
        let ctx = canvas.getContext("2d")

        ctx.font = t.fSize + "px " + t.font

        if (t.text.includes("<br>")) {
            let lines = t.text.split("<br>")
            t.left = Number.MAX_SAFE_INTEGER
            t.right = 0
            t.lineAscent = []
            t.lineDecent = []

            for (let i = 0; i < lines.length; ++i) {
                let l = lines[i]
                let m = ctx.measureText(l)
                t.left = Math.min(t.left, m.actualBoundingBoxLeft)
                t.right = Math.max(t.right, m.actualBoundingBoxRight)
                t.lineAscent[i] = m.actualBoundingBoxAscent
                t.lineDecent[i] = m.actualBoundingBoxDescent

                if (i === 0) {
                    t.ascent = m.actualBoundingBoxAscent
                    t.decent = m.actualBoundingBoxDescent
                } else
                    t.decent += m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + t.fSize / 8
            }
        } else {
            let m = ctx.measureText(t.text)
            t.left = m.actualBoundingBoxLeft
            t.right = m.actualBoundingBoxRight
            t.decent = m.actualBoundingBoxDescent
            t.ascent = m.actualBoundingBoxAscent
        }

        return t
    }

    setColor(inid, value) {
        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            if (id === "textsize")
                continue

            let text = nmsce.imageText[id]

            if (text.sel && text.type !== "img")
                text[inid === "font" ? "color" : inid] = value
        }

        nmsce.drawText()
    }

    setSize(evt) {
        let size = parseInt($(evt).val())

        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            if (id === "textsize")
                continue

            let text = nmsce.imageText[id]

            if (text.sel && text.type !== "img") {
                text.fSize = size
                text = nmsce.measureText(text)
            }
        }

        nmsce.drawText()
    }

    setFont(evt) {
        let font = $(evt).text()

        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            if (id === "textsize")
                continue

            let text = nmsce.imageText[id]

            if (text.sel && text.type !== "img") {
                text.font = id === "Glyphs" ? "NMS Glyphs" : font
                text = nmsce.measureText(text)
            }
        }

        nmsce.drawText()
    }

    drawText(alt, altw) {
        if (!$("#imageTextBlock").is(":visible"))
            return

        let img = $("#id-img")

        let canvas = alt ? alt : document.getElementById("id-canvas")
        let width = img.width()
        let sw = nmsce.screenshot.naturalWidth
        let sh = nmsce.screenshot.naturalHeight

        if (sh > sw) { // vertical
            txtcanvas.height = Math.min(width, sh)
            txtcanvas.width = parseInt(sw * txtcanvas.height / sh)

            canvas.height = Math.min(altw ? altw : width, sw)
            canvas.width = parseInt(sw * canvas.height / sh)
        } else {
            txtcanvas.width = Math.min(width, sw)
            txtcanvas.height = parseInt(sh * txtcanvas.width / sw)

            canvas.width = Math.min(altw ? altw : width, sw)
            canvas.height = parseInt(sh * canvas.width / sw)
        }

        if (typeof nmsce.imageText.textsize === "undefined")
            nmsce.imageText.textsize = {}

        if (nmsce.imageText.textsize.height && nmsce.imageText.textsize.height != txtcanvas.height || nmsce.imageText.textsize.width && nmsce.imageText.textsize.width != txtcanvas.width)
            nmsce.scaleImageText(txtcanvas.height, txtcanvas.width)

        nmsce.imageText.textsize.height = txtcanvas.height
        nmsce.imageText.textsize.width = txtcanvas.width

        nmsce.imageText.logo.right = nmsce.imageText.logo.decent = parseInt(Math.min(txtcanvas.width, txtcanvas.height) * 0.15)
        if ($("#imageTextBlock").is(":visible")) {
            let ctx = txtcanvas.getContext("2d")
            ctx.clearRect(0, 0, txtcanvas.width, txtcanvas.height)

            let loc = $("#img-text")
            let keys = Object.keys(nmsce.imageText)
            for (let id of keys) {
                if (id === "textsize")
                    continue

                let text = nmsce.imageText[id]
                let tloc = loc.find("#ck-" + id)

                if (text.ck && tloc.is(":visible") || text.id === "logo") {
                    if (text.y + text.decent > txtcanvas.height)
                        text.y = txtcanvas.height - text.decent
                    else if (text.y - text.ascent < 0)
                        text.y = text.ascent

                    if (text.x + text.right > txtcanvas.width)
                        text.x = txtcanvas.width - text.right
                    else if (text.x + text.left < 0)
                        text.x = -text.left

                    // if (id === "Glyphs") {
                    //     text.font = "NMS Glyphs"

                    //     ctx.fillStyle = text.color
                    //     ctx.fillRect(text.x + text.left - 5, text.y - text.ascent - 5, text.right - text.left + 9, text.ascent + text.decent + 8)
                    //     ctx.fillStyle = "#000000"
                    //     ctx.fillRect(text.x + text.left - 3, text.y - text.ascent - 3, text.right - text.left + 5, text.ascent + text.decent + 4)
                    // }

                    if (text.type === "text") {
                        if (typeof text.background !== "undefined" && text.text.length > 0) {
                            ctx.fillStyle = text.background
                            ctx.fillRect(text.x + text.left, text.y - text.ascent - 1, text.right - text.left + 1, text.ascent + text.decent + 2)
                        }

                        ctx.font = text.fSize + "px " + text.font
                        ctx.fillStyle = text.color

                        if (text.text && text.text.includes("<br>")) {
                            let l = text.text.split("<br>")
                            let y = text.y - text.lineAscent[0]

                            for (let i = 0; i < l.length; ++i) {
                                y += text.lineAscent[i]
                                ctx.fillText(l[i], text.x, y)
                                y += text.lineDecent[i] + text.fSize / 8
                            }
                        } else
                            ctx.fillText(text.text, text.x, text.y)
                    } else if (text.id === "myLogo")
                        ctx.drawImage(text.img, text.x + text.left, text.y, text.right - text.left, text.ascent + text.decent)

                    if (text.sel && !altw) {
                        ctx.strokeStyle = "white"
                        ctx.setLineDash([3, 2])
                        ctx.beginPath()
                        ctx.rect(text.x + text.left, text.y - text.ascent - 1, text.right - text.left + 1, text.ascent + text.decent + 2)
                        ctx.stroke()
                    }
                }
            }

            ctx.drawImage(nmsce.imageText.logo.img, nmsce.imageText.logo.x, nmsce.imageText.logo.y, nmsce.imageText.logo.right, nmsce.imageText.logo.decent)

            ctx = canvas.getContext("2d")
            ctx.drawImage(nmsce.screenshot, 0, 0, canvas.width, canvas.height)
            ctx.drawImage(txtcanvas, 0, 0, canvas.width, canvas.height)
        }
    }

    scaleImageText(height, width) {
        let hscale = height / nmsce.imageText.textsize.height
        let wscale = width / nmsce.imageText.textsize.width

        let keys = Object.keys(nmsce.imageText)
        for (let id of keys) {
            if (id === "textsize")
                continue

            let text = nmsce.imageText[id]

            text.x *= wscale
            text.left *= wscale
            text.right *= wscale

            text.fSize *= hscale
            text.y *= hscale
            text.ascent *= hscale
            text.decent *= hscale
        }
    }

    editSelected(evt) {
        let e = nmsce.last

        if (e && bhs.user.uid && (bhs.user.uid === e.uid || bhs.hasRole("admin"))) {
            let link = "https://" + window.location.hostname + "/cedata.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()
            window.open(link, "_self")
        }
    }

    redditLogin(state) {
        let url = reddit.auth_url +
            "?client_id=" + reddit.client_id +
            "&response_type=code&state=" + state +
            "&redirect_uri=" + reddit.redirect_url +
            "&duration=permanent&scope=" + reddit.scope

        window.open(url, "_self")
    }

    redditLoggedIn(state, code) {
        let accessToken = window.localStorage.getItem('nmsce-reddit-access-token')
        if (accessToken)
            nmsce.redditCreate(state)

        else
            $.ajax({
                type: "POST",
                url: reddit.token_url,
                data: {
                    code: code,
                    client_id: reddit.client_id,
                    client_secret: "",
                    redirect_uri: reddit.redirect_url,
                    grant_type: 'authorization_code',
                    state: state
                },
                username: reddit.client_id,
                password: "",
                crossDomain: true,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(reddit.client_id + ":"))
                },
                success(res) {
                    if (res.access_token) {
                        window.localStorage.setItem('nmsce-reddit-access-token', res.access_token)
                        window.localStorage.setItem('nmsce-reddit-expires', new Date().getTime() + res.expires_in * 1000)
                        window.localStorage.setItem('nmsce-reddit-refresh-token', res.refresh_token)

                        if (state.includes("post_"))
                            nmsce.redditCreate(state, res.access_token)
                    }
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
    }

    getRedditToken(state) {
        let accessToken = window.localStorage.getItem('nmsce-reddit-access-token')
        let expires = window.localStorage.getItem('nmsce-reddit-expires')
        let refreshToken = window.localStorage.getItem('nmsce-reddit-refresh-token')
        let deviceid = window.localStorage.getItem('nmsce-reddit-device-id')

        if (!deviceid) {
            deviceid = uuidv4()
            window.localStorage.setItem('nmsce-reddit-device-id', deviceid)
        }

        if (!accessToken || !expires || !refreshToken)
            nmsce.redditLogin(state) // no return

        else if (new Date().getTime() > expires) {
            $.ajax({
                type: "POST",
                url: reddit.token_url,
                data: {
                    refresh_token: refreshToken,
                    client_id: reddit.client_id,
                    client_secret: "",
                    redirect_uri: reddit.redirect_url,
                    grant_type: 'refresh_token',
                    device_id: deviceid
                },
                username: reddit.client_id,
                password: "",
                crossDomain: true,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(reddit.client_id + ":"))
                },
                success(res) {
                    if (res.access_token) {
                        window.localStorage.setItem('nmsce-reddit-access-token', res.access_token)
                        window.localStorage.setItem('nmsce-reddit-expires', new Date().getTime() + (res.expires_in - 300) * 1000)

                        if (state.includes("post_"))
                            nmsce.redditCreate(state, res.access_token)
                        else if (state.includes("getFlair_"))
                            nmsce.redditGetSubscribed(state, res.access_token)
                        else if (state.includes("getSubscribed"))
                            nmsce.setSubReddit(res.access_token)
                    }
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
        } else
            return accessToken
    }

    redditCreate(state, accessToken) {
        if (!accessToken) {
            if (nmsce.last) {
                let e = nmsce.last
                state = "post_" + e.galaxy.nameToId() + "_" + e.type + "_" + e.id
            }

            accessToken = nmsce.getRedditToken(state)
        }

        if (accessToken) {
            nmsce.getRedditUser(accessToken)
            nmsce.redditGetSubscribed(accessToken)

            if (state) {
                let path = state.split("_")

                if (!nmsce.last || nmsce.last.galaxy !== path[1].idToName() || nmsce.last.type !== path[2] || nmsce.last.id !== path[3]) {
                    getDoc(doc(bhs.fs, "nmsce/" + path[1].idToName() + "/" + path[2] + "/" + path[3])).then(doc => {
                        if (doc.exists())
                            nmsce.displaySingle(doc.data(), true)
                        $("#redditPost").show()
                    })
                }
            }
        }

        $("#redditPost").show()
    }

    getRedditUser(accessToken) {
        if (!accessToken)
            accessToken = nmsce.getRedditToken("getUser")

        if (accessToken) {
            let url = reddit.api_oauth_url + reddit.user_endpt

            $.ajax({
                type: "GET",
                url: url,
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
                crossDomain: true,
                success(res) {
                    window.localStorage.setItem('nmsce-reddit-name', res.name)
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
        }
    }

    redditGetSubscribed(accessToken) {
        if (!accessToken)
            accessToken = nmsce.getRedditToken("getSubscribed")

        if (accessToken) {
            let url = reddit.api_oauth_url + reddit.subscriber_endpt
            $.ajax({
                type: "GET",
                url: url,
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
                data: {
                    limit: 100,
                },
                crossDomain: true,
                success(res) {
                    nmsce.subReddits = []
                    for (let s of res.data.children)
                        nmsce.subReddits.push({
                            name: s.data.title,
                            url: s.data.url,
                            link: s.data.name
                        })
                    bhs.buildMenu($("#redditPost"), "SubReddit", nmsce.subReddits, nmsce.setSubReddit, {
                        required: true,
                        labelsize: "col-4",
                        menusize: "col",
                        sort: true
                    })
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
        }
    }

    setSubReddit(evt, accessToken) {
        let name = typeof evt === "string" ? evt.split("_")[1] : $(evt).text().stripMarginWS()
        let i = getIndex(nmsce.subReddits, "name", name)

        if (!accessToken)
            accessToken = nmsce.getRedditToken("getFlair_" + nmsce.subReddits[i].name)

        if (accessToken) {
            let url = reddit.api_oauth_url + nmsce.subReddits[i].url + reddit.getflair_endpt

            $.ajax({
                type: "get",
                url: url,
                dataType: 'json',
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
                crossDomain: true,
                success(res) {
                    nmsce.subRedditFlair = []
                    for (let s of res)
                        nmsce.subRedditFlair.push({
                            name: s.text,
                            text_color: s.text_color === "light" ? "white" : "black",
                            color: s.background_color,
                            id: s.id,
                        })

                    bhs.buildMenu($("#redditPost"), "Flair", nmsce.subRedditFlair, null, {
                        required: true,
                        labelsize: "col-4",
                        menusize: "col"
                    })
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
        }
    }

    redditPost() {
        let loc = $("#redditPost")
        let sr = loc.find("#btn-SubReddit").text().stripMarginWS()
        let flair = loc.find("#btn-Flair").text().stripMarginWS()
        let title = loc.find("#id-Title").val()

        if (!sr) {
            nmsce.postStatus("Please select SubReddit")
            return
        }

        if (!flair) {
            nmsce.postStatus("Please select Flair")
            return
        }

        if (!title) {
            nmsce.postStatus("Please select Title")
            return
        }

        window.localStorage.setItem('nmsce-reddit-sr', sr)
        window.localStorage.setItem('nmsce-reddit-flair', flair)
        window.localStorage.setItem('nmsce-reddit-title', title)

        let e = nmsce.last
        let link = "https://nmsce.com/preview.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()
        window.localStorage.setItem('nmsce-reddit-plink', link)

        link = "https://nmsce.com?g=" + e.galaxy.nameToId() + "&s=" + addrToGlyph(e.addr)
        window.localStorage.setItem('nmsce-reddit-slink', link)

        bhs.fbstorage.ref().child(displayPath + nmsce.last.Photo).getDownloadURL().then(url => {
            window.localStorage.setItem('nmsce-reddit-link', url)
            nmsce.redditSubmit()
        })
    }

    redditSubmit(accessToken) {
        if (!accessToken)
            accessToken = nmsce.getRedditToken("submit")

        if (accessToken) {
            let sr = window.localStorage.getItem('nmsce-reddit-sr')
            let i = getIndex(nmsce.subReddits, "name", sr)
            sr = nmsce.subReddits[i].url

            let flair = window.localStorage.getItem('nmsce-reddit-flair')
            i = getIndex(nmsce.subRedditFlair, "name", flair)
            let flairId = nmsce.subRedditFlair[i].id

            let plink = window.localStorage.getItem('nmsce-reddit-plink')
            let slink = window.localStorage.getItem('nmsce-reddit-slink')
            let title = window.localStorage.getItem('nmsce-reddit-title') // + " <a href="+plink+">NMSCE app link</a>"
            let link = window.localStorage.getItem('nmsce-reddit-link')

            let url = reddit.api_oauth_url + reddit.submitLink_endpt

            $.ajax({
                type: "post",
                url: url,
                dataType: 'json',
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
                data: {
                    sr: sr,
                    kind: "link",
                    title: title,
                    url: link,
                    resubmit: true,
                    flair_id: flairId,
                    flair_text: flair
                },
                crossDomain: true,
                async success(res) {
                    if (res.success)
                        for (let r of res.jquery) {
                            let what = r[2]
                            let link = what === "call" ? r[3][0] : ""
                            if (link && link.includes("https://www.reddit.com/")) {
                                let t = link.split("/")
                                t = "t3_" + t[6]
                                let url = reddit.api_oauth_url + reddit.comment_endpt

                                $.ajax({
                                    type: "post",
                                    url: url,
                                    dataType: 'json',
                                    headers: {
                                        Authorization: "Bearer " + accessToken,
                                    },
                                    data: {
                                        thing_id: t,
                                        text: "This was posted from the [NMSCE web app](https://nmsce.com). Here is the direct [link](" + plink + ") to this item. This is a [link](" + slink + ") to everything in this system."
                                    },
                                    crossDomain: true,
                                })

                                let e = plink.split("&")
                                for (let i of e) {
                                    let p = i.split("=")
                                    if (p[0] === "g")
                                        var galaxy = p[1].idToName()
                                    else if (p[0] === "t")
                                        var type = p[1]
                                    else if (p[0].includes("?i"))
                                        var id = p[1]
                                }

                                getDoc(doc(bhs.fs, "nmsce/" + galaxy + "/" + type + "/" + id)).then(doc => {
                                    let e = doc.data()
                                    let out = {}
                                    out.redditlink = link
                                    if (!e.reddit)
                                        out.reddit = Timestamp.now()

                                    ref.set(out, {
                                        merge: true
                                    }).then(() => {
                                        nmsce.postStatus("Posted")
                                        $("#redditlink").val(link)
                                    })
                                })
                            }
                        }
                    else
                        nmsce.postStatus("failed")
                },
                error(err) {
                    nmsce.postStatus(err.message)
                },
            })
        }
    }

    postStatus(str) {
        $("#posted").html("<h5>" + str + "</h5>")
    }

    scaleGlyphLocation() {
        if (!nmsce.glyphLocation.scale) {
            nmsce.glyphLocation.scale = nmsce.screenshot.naturalWidth / nmsce.glyphLocation.modalWidth
            nmsce.glyphLocation.x *= nmsce.glyphLocation.scale
            nmsce.glyphLocation.y *= nmsce.screenshot.naturalHeight / nmsce.glyphLocation.modalHeight
            nmsce.glyphLocation.width *= nmsce.glyphLocation.scale
            nmsce.glyphLocation.height *= nmsce.glyphLocation.scale
        }
    }

    extractGlyphs(mid) {
        $("body")[0].style.cursor = "wait"

        let row = $("#row-glyphCanvas")
        row.show()

        let sel = nmsce.glyphLocation
        let div = sel.width / 12

        let ss = document.createElement('canvas')
        let ssctx = ss.getContext("2d")
        ss.width = nmsce.screenshot.naturalWidth
        ss.height = nmsce.screenshot.naturalHeight
        ssctx.drawImage(nmsce.screenshot, 0, 0)

        let gcanvas = document.getElementById("id-glyphCanvas")
        let gctx = gcanvas.getContext("2d")
        gcanvas.width = (sel.width + 12)
        gcanvas.height = sel.height

        let scanglyph = document.createElement('canvas')
        let scanctx = scanglyph.getContext("2d")
        scanglyph.width = div
        scanglyph.height = div

        let p = []
        let x = sel.x

        for (let i = 0; i < 12; ++i) {
            let imgData = ssctx.getImageData(x, sel.y, div, sel.height)
            scanctx.putImageData(imgData, 0, 0)
            gctx.putImageData(imgData, (div + 1) * i, 0)
            x += div

            p.push(nmsce.model.predict(scanglyph).then(predict => {
                let max = 0.0
                let sel = -1
                let idx = 0
                for (let p of predict) {
                    if (p.probability > max) {
                        max = p.probability
                        idx = i
                        sel = p
                    }
                }

                return {
                    idx: idx,
                    class: sel.className,
                    prob: sel.probability.toFixed(4),
                }
            }))
        }

        Promise.all(p).then(res => {
            res.sort((a, b) => a.idx - b.idx)
            let g = ""
            for (let i = 0; i < res.length; ++i)
                g += res[i].class

            nmsce.changeAddr(null, g)

            $("body")[0].style.cursor = "default"
        })
    }

    hitTest(x, y, text) {
        return x >= text.x + text.left &&
            x <= text.x + text.right - text.left &&
            y >= text.y - text.ascent &&
            y <= text.y + text.decent ? text : ""
    }

    hitTestCorner(x, y, text) {
        let inbox = y >= text.y - text.ascent && y <= text.y + text.decent
        if (inbox) {
            let out = x >= text.x + text.left - 4 && x <= text.x + text.left + 4 ? "l" : ""
            out += x >= text.x + text.right - text.left - 4 && x <= text.x + text.right - text.left + 4 ? "r" : ""

            return (text.resize = out) ? text : null
        } else
            return null
    }

    imageMouseDown(e) {
        e.preventDefault()

        let startX = e.offsetX
        let startY = e.offsetY

        let hit = null
        let nochange = false

        let keys = Object.keys(nmsce.imageText)
        for (let k of keys) {
            if (k === "textsize")
                continue

            let text = nmsce.imageText[k]
            if (text.id !== "logo" && (!$("#ck-" + text.id).is(":visible") || !text.ck))
                continue

            if (text.id === "logo" || !(hit = nmsce.hitTestCorner(startX, startY, text)))
                hit = nmsce.hitTest(startX, startY, text)

            if (hit && text.type === "text") {
                let loc = $("#imgtable")
                loc.find("#btn-Font").text(text.font)
                loc.find("#sel-size").val(text.fSize)

                loc.find("#color-font").colorpicker("disable")
                loc.find("#color-background").colorpicker("disable")

                loc.find("#color-font").colorpicker("setValue", text.color)
                if (typeof text.background !== "undefined")
                    loc.find("#color-background").colorpicker("setValue", text.background)
                else
                    loc.find("#color-background").colorpicker("setValue", "rgba(0,0,0,0)")

                loc.find("#color-font").colorpicker("enable")
                loc.find("#color-background").colorpicker("enable")
            }

            if (hit) {
                nochange = text.sel
                text.sel = true
                break
            }
        }

        if (hit) {
            nmsce.startX = startX
            nmsce.startY = startY
        }

        if (!e.shiftKey && !nochange) {
            let keys = Object.keys(nmsce.imageText)
            for (let i of keys) {
                if (i === "textsize")
                    continue

                if (!hit || i !== hit.id) {
                    let text = nmsce.imageText[i]
                    text.sel = false
                }
            }
        }

        nmsce.drawText()
    }

    imageKeypress(e) {
        if (!e.code.includes("Arrow"))
            return

        e.preventDefault()

        let changed = false
        let keys = Object.keys(nmsce.imageText)

        for (let k of keys) {
            if (k === "textsize")
                continue

            let text = nmsce.imageText[k]

            if (text.sel) {
                changed = true

                if (e.shiftKey) {
                    switch (e.code) {
                        case "ArrowLeft":
                        case "ArrowDown":
                            if (text.type === "text") {
                                text.fSize -= text.font === "NMS Glyphs" ? 1 / 10 : 1 / 3
                                nmsce.measureText(text)
                            } else {
                                text.decent *= (text.right - 1) / text.right
                                text.right -= 1
                            }
                            break
                        case "ArrowRight":
                        case "ArrowUp":
                            if (text.type === "text") {
                                text.fSize += text.font === "NMS Glyphs" ? 1 / 10 : 1 / 3
                                nmsce.measureText(text)
                            } else {
                                text.decent *= (text.right + 1) / text.right
                                text.right += 1
                            }
                            break
                    }
                } else {
                    switch (e.code) {
                        case "ArrowRight":
                            text.x++
                            break
                        case "ArrowUp":
                            text.y--
                            break
                        case "ArrowLeft":
                            text.x--
                            break
                        case "ArrowDown":
                            text.y++
                            break
                    }
                }
            }
        }

        if (changed)
            nmsce.drawText()
    }

    imageMouseMove(e) {
        e.preventDefault()

        let mouseX = e.offsetX
        let mouseY = e.offsetY
        let dx = 0
        let dy = 0

        if (typeof nmsce.startX !== "undefined") {
            dx = mouseX - nmsce.startX
            dy = mouseY - nmsce.startY
            nmsce.startX = mouseX
            nmsce.startY = mouseY
        }

        let ncursor = "crosshair"

        let resize = ""

        let keys = Object.keys(nmsce.imageText)
        for (let k of keys) {
            if (k === "textsize")
                continue

            let text = nmsce.imageText[k]
            if (text.sel && text.resize) {
                resize = text.resize
                break
            }
        }

        for (let k of keys) {
            let text = nmsce.imageText[k]

            if (text.sel && typeof nmsce.startX !== "undefined") {
                if (text.id === "logo" || !resize) {
                    text.x += dx
                    text.y += dy
                } else if (resize) {
                    let old = {}
                    old.ascent = text.ascent
                    old.decent = text.decent
                    old.left = text.left
                    old.right = text.right
                    ncursor = "col-resize"

                    switch (resize) {
                        case "l":
                            if (text.type === "text") {
                                text.fSize -= text.font === "NMS Glyphs" ? dx / 10 : dx / 3
                                nmsce.measureText(text)
                                text.x += old.right - text.right
                            } else {
                                text.decent *= (text.right - dx) / text.right
                                text.right -= dx
                                text.y += old.decent - text.decent
                                text.x += old.right - text.right
                            }
                            break
                        case "r":
                            if (text.type === "text") {
                                text.fSize += text.font === "NMS Glyphs" ? dx / 10 : dx / 3
                                nmsce.measureText(text)
                            } else {
                                text.decent *= (text.right + dx) / text.right
                                text.right += dx
                                text.y += old.decent - text.decent
                            }
                            break
                    }
                }
            }

            if (text.sel && ncursor === "crosshair") {
                if (text.id !== "logo" && nmsce.hitTestCorner(mouseX, mouseY, text))
                    ncursor = "ew-resize"
                else if (nmsce.hitTest(mouseX, mouseY, text))
                    ncursor = "move"
            }
        }

        $("#id-canvas")[0].style.cursor = ncursor

        if (typeof nmsce.startX !== "undefined")
            nmsce.drawText()
    }

    imageMouseUp(e) {
        e.preventDefault()

        delete nmsce.startX
        delete nmsce.startY

        let keys = Object.keys(nmsce.imageText)
        for (let k of keys)
            delete nmsce.imageText[k].resize

        $("#id-canvas")[0].style.cursor = "crosshair"
    }

    imageMouseOut(e) {
        e.preventDefault()
        nmsce.imageMouseUp(e)

        $("body")[0].style.cursor = "default"
    }

    alignText(how) {
        let keys = Object.keys(nmsce.imageText)
        let top = 0,
            left = 0,
            right = Number.MAX_SAFE_INTEGER,
            bottom = Number.MAX_SAFE_INTEGER

        for (let k of keys) {
            if (k === "textsize")
                continue

            let text = nmsce.imageText[k]

            if (text.sel) {
                top = Math.max(top, text.y - text.ascent)
                bottom = Math.min(bottom, text.y + text.decent)
                left = Math.max(left, text.x + text.left)
                right = Math.min(right, text.x + text.right)
            }
        }

        for (let k of keys) {
            let text = nmsce.imageText[k]

            if (text.sel) {
                switch (how) {
                    case "top":
                        text.y = top + text.ascent
                        break
                    case "bottom":
                        text.y = bottom - text.decent
                        break
                    case "left":
                        text.x = left + text.left
                        break
                    case "right":
                        text.x = right - text.right
                        break
                }
            }
        }

        nmsce.drawText()
    }

    deleteEntry() {
        if (nmsce.last) {
            let entry = nmsce.last
            nmsce.last = null
            let ref = doc(bhs.fs, "nmsce/" + entry.galaxy + "/" + entry.type + "/" + entry.id)

            let vref = collection(ref, "votes")
            vref.get().then(snapshot => {
                for (let doc of snapshot.docs)
                    deleteDoc(doc.ref);
            })

            vref = collection(ref, "nmsceCommon")
            vref.get().then(snapshot => {
                for (let doc of snapshot.docs)
                    deleteDoc(doc.ref);
            })

            deleteDoc(ref).then(() => {
                bhs.status(entry.id + " deleted.")
                $("#save").text("Save All")
                $("#delete-item").addClass("disabled")
                $("#delete-item").prop("disabled", true)

                let vref = collection(ref, "votes")
                vref.get().then(snapshot => {
                    for (let doc of snapshot.docs)
                        deleteDoc(doc.ref);
                })

                vref = collection(ref, "nmsceCommon")
                vref.get().then(snapshot => {
                    for (let doc of snapshot.docs)
                        delete(doc.ref);
                })

                ref = bhs.fbstorage.ref().child(originalPath + entry.Photo)
                ref.delete()

                ref = bhs.fbstorage.ref().child(displayPath + entry.Photo)
                ref.delete()

                ref = bhs.fbstorage.ref().child(thumbPath + entry.Photo)
                ref.delete()
            }).catch(err => {
                bhs.status("ERROR: " + err.code)
                console.log(err)
            })
        }
    }

    deleteSystem() {
        if (nmsce.lastsys && bhs.deleteEntry(nmsce.lastsys)) {
            nmsce.lastsys = null
            $("#save-system").text("Save System")
            $("#delete-system").addClass("disabled")
            $("#delete-system").prop("disabled", true)
        }
    }

    updateScreenshot(entry) {
        if (!$("#imgtable").is(":visible"))
            return null

        if ($("#id-canvas").is(":visible") || $("#ck-updateScreenshot").is(":visible") && $("#ck-updateScreenshot").prop("checked")) {
            if (typeof entry.Photo === "undefined")
                entry.Photo = entry.type + "-" + entry.id + ".jpg"

            let disp = document.createElement('canvas')
            nmsce.drawText(disp, 1024)
            disp.toBlob(blob => {
                bhs.fbstorage.ref().child(displayPath + entry.Photo).put(blob).then(() => {
                    // bhs.status("Saved " + displayPath + entry.Photo)
                })
            }, "image/jpeg", 0.9)

            let thumb = document.createElement('canvas')
            nmsce.drawText(thumb, 400)
            thumb.toBlob(blob => {
                nmsce.saved = blob
                bhs.fbstorage.ref().child(thumbPath + entry.Photo).put(blob).then(() => {
                    // bhs.status("Saved " + thumbPath + entry.Photo)
                })
            }, "image/jpeg", 0.8)

            let orig = document.createElement('canvas')
            let ctx = orig.getContext("2d")
            orig.width = Math.min(2048, nmsce.screenshot.width)
            orig.height = parseInt(nmsce.screenshot.height * orig.width / nmsce.screenshot.width)
            ctx.drawImage(nmsce.screenshot, 0, 0, orig.width, orig.height)
            orig.toBlob(blob => {
                bhs.fbstorage.ref().child(originalPath + entry.Photo).put(blob).then(() => {
                    // bhs.status("Saved " + originalPath + entry.Photo)
                })
            }, "image/jpeg", 0.9)

            $("#dltab-" + entry.type).click()

            let loc = $("#displayPanels #list-" + entry.type)
            loc = loc.find("#row-" + entry.id + " img")
            if (loc.length > 0) {
                let url = thumb.toDataURL()
                loc.attr("src", url)
            }

            $('html, body').animate({
                scrollTop: loc.offset().top
            }, 500)
        }

        return true
    }

    updateEntry(entry) {
        entry.modded = Timestamp.now()
        nmsce.initVotes(entry)
        let created = false

        if (typeof entry.created === "undefined") {
            entry.created = Timestamp.now()
            created = true
        }

        if (typeof entry.id === "undefined")
            entry.id = uuidv4()

        if (typeof entry.Photo === "undefined")
            entry.Photo = entry.type + "-" + entry.id + ".jpg"

        let ref = collection(bhs.fs, "nmsce/" + entry.galaxy + "/" + entry.type)
        ref = doc(ref, entry.id)

        setDoc(ref, entry).then(() => {
            bhs.status(entry.type + " " + entry.Name + " saved.")

            if (created)
                nmsce.incrementTotals(entry, 1)

            nmsce.updateCommon(entry, ref)
        }).catch(err => {
            bhs.status("ERROR: " + err.code)
        })
    }

    initVotes(entry) {
        if (typeof entry.votes === "undefined") {
            entry.votes = {}
            entry.votes.clickcount = 0
            entry.votes.visited = 0
            entry.votes.report = 0
            entry.votes.favorite = 0
            entry.votes.edchoice = 0
            entry.votes.bhspoi = 0
            entry.votes.hof = 0
            entry.votes.patron = 0
        }
    }

    incrementTotals(e, val) {
        let t = {}
        t[e.type] = firebase.firestore.FieldValue.increment(val)

        let ref = bhs.getUsersColRef(bhs.user.uid)
        ref.set({
            nmsceTotals: t
        }, {
            merge: true
        }).then().catch(err => {
            bhs.status("ERROR: " + err.message)
        })
    }

    updateCommon(entry, ref) {
        let e = {}
        e.created = entry.created
        e.votes = entry.votes
        e.private = entry.private ? true : false
        e._name = entry._name
        e.uid = entry.uid
        e.id = entry.id
        e.type = entry.type
        e.galaxy = entry.galaxy
        e.addr = entry.addr
        e.Photo = entry.Photo
        e.Name = entry.Name ? entry.Name : ""

        if (entry.Type)
            e.Type = entry.Type
        if (entry["Planet-Index"])
            e["Planet-Index"] = entry["Planet-Index"]
        if (entry["Planet-Name"])
            e["Planet-Name"] = entry["Planet-Name"]

        ref = doc(collection(ref, "nmsceCommon"), entry.id)
        setDoc(ref, e, {
            merge: true
        }).then().catch(err => {
            bhs.status("ERROR: " + err.message)
        })
    }

    getEntries(skipAll) {
        if (typeof nmsce.entries === "undefined")
            nmsce.entries = {}

        for (let obj of objectList) {
            nmsce.entries[obj.name] = []
            nmsce.clearDisplayList(obj.name)

            let qury = query(collection(bhs.fs, "nmsce/" + bhs.user.galaxy + "/" + obj.name),
                where("uid", "==", bhs.user.uid),
                orderBy("created", "desc"),
                limit(50));
            nmsce.getWithObserver(null, qury, obj.name, true, nmsce.displayList)
        }

        if (!skipAll) {

            nmsce.entries.All = []

            let qury = query(collectionGroup(bhs.fs, "nmsceCommon"),
                where("uid", "==", bhs.user.uid),
                orderBy("created", "desc"),
                limit(50));

            nmsce.getWithObserver(null, qury, "All", true, nmsce.displayList, {
                source: "server"
            })
        }
    }
    buildResultsList() {
        let nav = `
        <a id="dltab-idname" class="nav-item nav-link txt-def h5 rounded-top" style="border-color:black;" 
            data-toggle="tab" href="#dl-idname" role="tab" aria-controls="dl-idname" aria-selected="false">
            title
        </a>`
        let header = `
        <div id="dl-idname" class="tab-pane hidden pl-15 pr-15" role="tabpanel" aria-labelledby="dltab-idname">
            <div id="list-idname" class="scroll row" style="height:500px"></div>
        </div>`

        nmsce.entries = {}

        for (let obj of resultTables) {
            let l = /idname/g[Symbol.replace](nav, obj.name.nameToId())
            l = /title/[Symbol.replace](l, obj.name)

            if (obj.hidden)
                l = /h6/[Symbol.replace](l, "h6 hidden")

            $("#displayTabs").append(l)

            l = /idname/g[Symbol.replace](header, obj.name.nameToId())

            $("#displayPanels").append(l)
        }

        let height = $("html")[0].clientHeight - 100
        $("#displayPanels .scroll").height(height + "px")
    }

    getTotals() {

        getDoc(doc(bhs.fs, "bhs/nmsceTotals")).then(doc => {
            if (doc.exists())
                nmsce.displayTotals(doc.data(), "bhs/nmsceTotals")
        })

        getDoc(doc(bhs.fs, "bhs/nmsceMonthly")).then(doc => {
            if (doc.exists())
                nmsce.displayTotals(doc.data(), "bhs/nmsceMonthly")
        })

        getDoc(doc(bhs.fs, "bhs/patreon")).then(doc => {
            if (doc.exists())
                nmsce.displayPatron(doc.data(), "bhs/patreon")
        })
    }

    buildPatron() {
        const header = `
        <div id="patronCard" class="card">
            <div class="card-header pl-15 txt-def">
                <div class="row">
                    <div class="col-4">Thanks To All Our Supporters!</div>
                    <div class="col-3">
                        <a href="https://www.patreon.com/bePatron?u=28538540" style="background-color:red; color:white; border-radius:12px">&nbsp;&nbsp;Become a Patron!&nbsp;&nbsp;</a>
                    </div>
                    <div class="col-5">You can also get patron benefits by entering data.&nbsp;
                        <i class="far fa-question-circle text-danger h6" data-toggle="tooltip" data-html="true"
                            data-placement="top" title="T1 benefits for 25 items/month, T2-75 items, T3-150 items.">
                        </i>
                    </div>
                </div>
                <br>
                <div class="row h6 border-top">
                    <div class="col-4">Name</div>
                    <div class="col-2 pl-15">Date Joined</div>
                </div>
            </div>
            <div id="patronList" class="card-body scroll txt-black" style="height:600px"></div>
        </div>`

        let loc = $("#dl-Patrons")
        loc.find("#list-Patrons").remove()
        loc.append(header)
    }

    displayPatron(list) {
        const rows = `
        <div id="row-uid" class="border-bottom h6">
            <div class="row">
                <div id="id-name" class="col-3">dname</div>
                <div id="id-date" class="col-2 txt-right">ddate</div>
            </div>
        </div>`

        let loc = $("#patronCard")
        let l = loc.find("#patronList")

        let k = Object.keys(list)
        for (let u of k) {
            let e = list[u]

            let h = /uid/[Symbol.replace](rows, k)
            h = /dname/[Symbol.replace](h, e.name)
            h = /ddate/[Symbol.replace](h, e.start.toDate().toDateLocalTimeString().slice(0, 10))

            l.append(h)
        }

        nmsce.sortTotals(null, "id-name", "patronList")
    }

    buildTotals() {
        const header = `
        <div id="totalsCard" class="row">
            <div class="col-md-9 col-14">
                <div class="card">
                    <div class="card-header pl-15 txt-def">
                        <div class="row">
                            <div class="col-3">
                                <label>
                                    <input id="ck-idname" type="checkbox" onclick="nmsce.showModTotals(this)">
                                    &nbsp;Show All
                                </label>
                            </div>
                            <div class="col-5">You can get patron benefits by entering data.&nbsp;
                                <i class="far fa-question-circle text-danger h6" data-toggle="tooltip" data-html="true"
                                    data-placement="top" title="T1 benefits for 25 items/month, T2-75 items, T3-150 items.">
                                </i>
                            </div>
                        </div>
                        <div class="row">
                            <div id="id-name" class="col-9 pointer" onclick="nmsce.sortTotals(this)">Player&nbsp;&nbsp;<i class="fas fa-sort-alpha-down"></i></div>
                            <div id="id-total" class="col-2 pointer" onclick="nmsce.sortTotals(this)">Overall&nbsp;&nbsp;<i class="fas fa-sort-numeric-up"></i></div>
                            <div id="id-monthly" class="col-2 pointer" onclick="nmsce.sortTotals(this)">Monthly&nbsp;&nbsp;<i class="fas fa-sort-numeric-up"></i></div>
                        </div>
                    </div>
                    <div id="userTotals" class="card-body scroll txt-black" style="height:600px"></div>
                </div>
            </div>
            <div class="col-md-5 col-14">
                <div class="card">
                    <div class="card-header pl-15 txt-def">Totals</div>
                    <div id="totalsTable" class="txt-black pl-15"></div>
                </div>
            </div>
        </div>`

        let loc = $("#dl-Totals")
        loc.find("#list-Totals").remove()
        loc.append(header)
    }

    displayTotals(list, path) {
        const rows = `
        <div id="row-uid" name="ismod" class="border-bottom h6">
            <div class="row pointer" onclick="nmsce.expandTotals(this)">
                <div id="id-name" class="col-8"><i class="far fa-caret-square-down txt-input"></i> nameS</div>
                <div id="id-total" class="col-2 txt-right">totalT</div>
                <div id="id-monthly" class="col-2 txt-right">monthlyT</div>
            </div>
            <div id="id-exp" class="row hidden" onclick="nmsce.expandTotals(this)">
                <div id="id-details">detailT</div>
            </div>
        </div>`
        const totals = `
        <div class="row">
            <div class="col-5">name</div>
            <div id="id-name" class="col-3">qty</div>
        </div>`

        let total = 0
        let loc = $("#totalsCard")

        for (let k of Object.keys(list)) {
            let e = list[k]
            if (typeof e.name !== "undefined") {
                let t = 0
                let s = ""

                for (let k of Object.keys(e))
                    if (typeof e[k] === "number") {
                        t += e[k]
                        s += (s !== "" ? ",&nbsp;" : "") + k + ": " + e[k]
                    }

                let l = loc.find("#row-" + k)

                if (l.length === 0) {
                    let h = /uid/[Symbol.replace](rows, k)
                    h = /nameS/[Symbol.replace](h, e.name)
                    h = /detailT/[Symbol.replace](h, s)
                    if (e.mod) {
                        h = /ismod/[Symbol.replace](h, "modT")
                        h = /border-bottom/[Symbol.replace](h, "border-bottom hidden")
                    }

                    if (path === "bhs/nmsceTotals") {
                        h = /totalT/[Symbol.replace](h, t)
                        h = /monthlyT/[Symbol.replace](h, "")
                    } else if (path === "bhs/nmsceMonthly") {
                        h = /totalT/[Symbol.replace](h, "")
                        h = /monthlyT/[Symbol.replace](h, t + " " + (t > 150 ? "T3" : t > 75 ? "T2" : t > 30 ? "T1" : ""))
                    }

                    l = loc.find("#userTotals")
                    l.append(h)
                } else {
                    $(l).find("#id-details").text(s)
                    if (path === "bhs/nmsceTotals")
                        $(l).find("#id-total").text(t)
                    else if (path === "bhs/nmsceMonthly")
                        $(l).find("#id-monthly").text(t + " " + (t > 150 ? "T3" : t > 75 ? "T2" : t > 30 ? "T1" : ""))
                }
            } else if (typeof e === "number" && path === "bhs/nmsceTotals") {
                let l = loc.find("#id-" + k)
                if (l.length === 0) {
                    let h = /name/g[Symbol.replace](totals, k)
                    h = /qty/[Symbol.replace](h, e)

                    let l = loc.find("#totalsTable")
                    l.append(h)
                } else
                    l.text(e)

                total += e
            }
        }

        if (path === "bhs/nmsceTotals") {
            let l = loc.find("#id-Total")
            if (l.length === 0) {
                let l = loc.find("#totalsTable")
                let h = /name/g[Symbol.replace](totals, "Total")
                h = /qty/[Symbol.replace](h, total)
                h = /row/[Symbol.replace](h, "row border-top")
                l.append(h)
            } else
                l.text(total)
        }

        nmsce.sortTotals(null, "id-name")
    }

    showModTotals(evt) {
        if ($(evt).prop("checked"))
            $("#totalsCard [name='modT']").show()
        else
            $("#totalsCard [name='modT']").hide()
    }


    sortTotals(evt, id, parent) {
        let sort = typeof id !== "undefined" ? id : $(evt).prop("id")
        let loc = $(typeof parent === "undefined" ? "#userTotals" : "#" + parent)
        let list = loc.children()

        switch (sort) {
            case "id-name":
                list.sort((a, b) => {
                    a = $(a).find("#" + sort).text().stripMarginWS().toLowerCase()
                    b = $(b).find("#" + sort).text().stripMarginWS().toLowerCase()
                    return a > b ? 1 : -1
                })
                break
            case "id-total":
            case "id-monthly":
                list.sort((a, b) => {
                    a = $(a).find("#" + sort).text().stripMarginWS()
                    a = a === "" ? 0 : parseInt(a)
                    b = $(b).find("#" + sort).text().stripMarginWS()
                    b = b === "" ? 0 : parseInt(b)
                    return b - a
                })
                break
        }

        loc.empty()
        loc.append(list)
    }

    expandTotals(evt) {
        let loc = $(evt).parent()
        let exp = loc.find(".fa-caret-square-down")
        if (exp.length > 0) {
            exp.removeClass("fa-caret-square-down").addClass("fa-caret-square-up")
            loc.find("#id-exp").show()
        } else {
            loc.find(".fa-caret-square-up").removeClass("fa-caret-square-up").addClass("fa-caret-square-down")
            loc.find("#id-exp").hide()
        }
    }

    fcnObserver(loc, fcn) {
        if (window.IntersectionObserver) {
            var io = new IntersectionObserver(
                evts => {
                    let run = null
                    for (let evt of evts)
                        if (evt.isIntersecting) {
                            run = evt
                            io.unobserve(evt.target)
                        }

                    if (run)
                        fcn(run)
                }, {
                root: loc[0],
                rootMargin: '0px 0px 0px 0px',
                threshold: 0.1
            }
            )
        }

        return io
    }

    getWithObserver(evt, ref, type, cont, dispFcn, options) {
        const getSnapshot = (obs) => {
            if (typeof obs.entryObserver === "undefined")
                obs.entryObserver = nmsce.fcnObserver($("#displayPanels"), nmsce.getWithObserver)

            let ref = obs.ref

            if (obs.last && obs.cont) {
                ref = query(ref, startAfter(obs.last))
                obs.last = null
                obs.run = true
            }

            if (obs.run) {
                obs.run = false
                // if (Atomics.compareExchange(obs.arr, 0, 0, 1) === 0)
                // what the hell are obs.options supposed to do?
                getDocs(ref).then(snapshot => {
                    if (snapshot.empty) {
                        obs.cont = false
                        obs.dispFcn([], obs.type)
                        return
                    }

                    let entries = []
                    for (let doc of snapshot.docs) {
                        let e = doc.data()
                        entries.push(e)
                    }

                    obs.dispFcn(entries, obs.type)
                    let loc = $("#list-" + obs.type)

                    for (let i of [0, 15, 30, 45])
                        if (i < entries.length) {
                            let rloc = loc.find("#row-" + entries[i].id)
                            if (rloc.length > 0)
                                obs.entryObserver.observe(rloc[0])
                        }

                    obs.last = snapshot.docs[snapshot.size - 1]
                    // Atomics.compareExchange(obs.arr, 0, 1, 0)
                })
            }
        }

        if (evt) {
            let type = $(evt.target).parent()
            let rows = type.find("img")
            type = type.prop("id").stripID()

            for (let loc of rows) {
                let data = $(loc).data()
                if (!$(loc).prop("src") && data.src)
                    $(loc).prop("src", data.src)
            }

            getSnapshot(nmsce.observerList[type])

        } else if (ref) {
            if (typeof nmsce.observerList === "undefined")
                nmsce.observerList = {}

            type = type.nameToId()

            if (typeof nmsce.observerList[type] === "undefined")
                nmsce.observerList[type] = {}

            let obs = nmsce.observerList[type]
            obs.type = type
            obs.ref = ref
            obs.dispFcn = dispFcn
            obs.last = null
            obs.run = true
            obs.cont = cont

            // const sab = new SharedArrayBuffer(4)
            // obs.arr = new Int32Array(sab)
            // obs.arr[0] = 0

            getSnapshot(obs)
        }
    }

    getResultsLists(type) {
        if (type === "My Favorites") {
            if (bhs.user.uid) {
                let i = getIndex(resultTables, "name", type)
                let r = resultTables[i]

                nmsce.entries[r.name.nameToId()] = []
                $("#dltab-My-Favorites").show()

                let qury = query(collectionGroup(bhs.fs, "votes"),
                    where("uid", "==", bhs.user.uid),
                    where("favorite", "==", 1),
                    orderBy("created", "desc"),
                    limit(r.limit));

                nmsce.getWithObserver(null, qury, r.name, r.cont, nmsce.displayResultList, {
                    source: "server"
                })
            }
        } else
            for (let r of resultTables) {
                if (r.field) {
                    nmsce.entries[r.name.nameToId()] = []



                    let qury = query(collectionGroup(bhs.fs, "nmsceCommon"), orderBy(r.field, "desc"), limit(r.limit))

                    nmsce.getWithObserver(null, qury, r.name, r.cont, nmsce.displayResultList, {
                        source: "server"
                    })
                }
            }
    }

    displayResultList(entries, type, k) {
        if (!entries || entries.length === 0)
            return

        let h = ""
        let loc = $("#displayPanels #list-" + type.nameToId())

        for (let e of entries) {
            if (!k && e.private && e.uid !== bhs.user.uid && !bhs.hasRole("nmsceEditor"))
                continue

            // if (type === "Hall-of-Fame" && e.votes.hof < 1)
            //     continue

            if (type === "Patron-Favorites" && e.votes.patron < 1)
                continue

            nmsce.entries[type].push(e)

            let l = /idname/g[Symbol.replace](resultsItem, e.id)
            l = /galaxy/[Symbol.replace](l, e.galaxy)
            l = /ethumb/[Symbol.replace](l, thumbPath + e.Photo)
            l = /byname/[Symbol.replace](l, e._name)
            l = /date/[Symbol.replace](l, e.created ? e.created.toDate().toDateLocalTimeString() : "")

            if (e.private)
                l = /bkg-white/[Symbol.replace](l, "bkg-yellow")

            h += l
        }

        loc.append(h)
        let imgs = loc.find("img")

        for (let img of imgs) {
            let data = $(img).data()

            if (!data.src && !$(img).prop("src")) {
                let ref = bhs.fbstorage.ref().child(data.thumb)
                ref.getDownloadURL().then(url => {
                    if ($(img).is(":visible"))
                        $(img).attr("src", url)
                    else
                        $(img).data("src", url)
                }).catch(err => {
                    $(img).closest("[id|='row']").remove()
                })
            }
        }
    }

    async vote(evt) {
        if (nmsce.last && bhs.user.uid) {
            let v = 1
            let e = nmsce.last
            let id = $(evt).prop("id")

            let ref = doc(bhs.fs, "nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)

            e = {}

            let vref = collection(ref, "votes")
            vref = doc(vref, bhs.user.uid)
            let doc = await vref.get()
            if (doc.exists()) {
                e = doc.data()
                v = typeof e[id] === "undefined" ? 1 : e[id] ? 0 : 1
            }

            e[id] = v

            e.uid = bhs.user.uid
            e.id = nmsce.last.id
            e.galaxy = nmsce.last.galaxy
            e.Photo = nmsce.last.Photo
            e._name = nmsce.last._name
            e.created = nmsce.last.created
            e.type = nmsce.last.type
            if (nmsce.last.Type)
                e.Type = nmsce.last.Type

            setDoc(ref, e, {
                merge: true
            })

            nmsce.showVotes(e)

            e = {}
            e[id] = firebase.firestore.FieldValue.increment(v ? 1 : -1)

            setDoc(ref, {
                votes: e
            }, {
                merge: true
            })

            ref = doc(collection(ref, "nmsceCommon"), nmsce.last.id)
            setDoc(ref, {
                votes: e
            }, {
                merge: true
            })
        }
    }

    selectResult(evt) {
        let type = $(evt).closest("[id|='list']").prop("id").stripID()
        let id = $(evt).prop("id").stripID()

        let i = getIndex(nmsce.entries[type], "id", id)
        let e = nmsce.entries[type][i]

        getDoc(doc(bhs.fs, "nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)).then(doc => {
            let e = doc.data()
            nmsce.last = e
            nmsce.displaySelected(e)

            if (bhs.user.uid && (e.uid === bhs.user.uid || bhs.hasRole("admin")))
                $("#btn-ceedit").show()
            else
                $("#btn-ceedit").hide()

            $("#dltab-Selected").show()
            $("#dltab-Selected").click()
        })
    }

    displaySelected(e) {
        let row = `
    <div id="id-idname" class="row border-bottom txt-label-def">
        <div class="col-5">title</div>
        <div id="val-idname" class="col font clr-def">value</div>
    </div>`

        $("#imgtable").show()

        nmsce.last = e

        if (bhs.user.uid) {
            getDoc(doc(bhs.fs, "nmsce/" + e.galaxy + "/" + e.type + "/" + e.id + "/votes/" + bhs.user.uid)).then(doc => {
                nmsce.showVotes(doc.data())
            })
        }

        let link = "https://nmsce.com/preview.html?i=" + e.id + "&g=" + e.galaxy.nameToId() + "&t=" + e.type.nameToId()
        $("[id|='permalink']").attr("href", link)
        $("[id|='permalink']").on('dragstart', false)

        let idx = getIndex(objectList, "name", e.type)
        let obj = objectList[idx]

        let ref = bhs.fbstorage.ref().child(displayPath + e.Photo)
        ref.getDownloadURL().then(url => {
            $("#dispimage").prop("src", url)
        })

        let loc = $("#imagedata")
        loc.empty()

        let h = /idname/g[Symbol.replace](row, "Type")
        h = /title/[Symbol.replace](h, "Type")
        h = /font/[Symbol.replace](h, "")
        h = /value/[Symbol.replace](h, e.type)
        loc.append(h)

        for (let fld of obj.imgText) {
            let h = /idname/g[Symbol.replace](row, fld.name.nameToId())
            h = /title/[Symbol.replace](h, fld.name)
            h = /value/[Symbol.replace](h, fld.name === "Glyphs" ? addrToGlyph(e[fld.field], e["Planet-Index"]) : e[fld.field])
            h = /font/[Symbol.replace](h, fld.font ? fld.font === "NMS Glyphs" ? "glyph" : fld.font : "")
            loc.append(h)
        }

        for (let fld of obj.fields) {
            let id = fld.name.nameToId()
            if ((fld.imgText || fld.searchText) && typeof e[id] !== "undefined" && e[id] !== -1 && e[id] !== "") {
                let h = /idname/g[Symbol.replace](row, id)
                h = /title/[Symbol.replace](h, fld.name)

                if (fld.type === "tags") {
                    let t = ""
                    if (e[id]) {
                        for (let c of e[id])
                            t += c + ", "

                        t = t.slice(0, t.length - 2)
                    }

                    h = /value/[Symbol.replace](h, t)
                } else
                    h = /value/[Symbol.replace](h, e[id])

                h = /font/[Symbol.replace](h, "")
                loc.append(h)
            }

            if (typeof fld.sublist !== "undefined") {
                for (let sub of fld.sublist) {
                    let id = sub.name.nameToId()
                    if (sub.imgText && typeof e[id] !== "undefined" && e[id] !== -1 && e[id] !== "") {
                        let h = /idname/g[Symbol.replace](row, id)
                        h = /title/[Symbol.replace](h, sub.name)
                        h = /value/[Symbol.replace](h, e[id])
                        h = /font/[Symbol.replace](h, "")
                        loc.append(h)
                    }
                }
            }
        }

        h = /idname/g[Symbol.replace](row, "Created")
        h = /title/[Symbol.replace](h, "Date")
        h = /value/[Symbol.replace](h, e.created ? e.created.toDate().toDateLocalTimeString() : "")
        h = /font/[Symbol.replace](h, "")
        loc.append(h)

        h = /idname/g[Symbol.replace](row, "Version")
        h = /title/[Symbol.replace](h, "Version")
        h = /value/[Symbol.replace](h, e.version)
        h = /font/[Symbol.replace](h, "")
        loc.append(h)

        if (e.redditlink) {
            let h = /idname/g[Symbol.replace](row, "link")
            h = /title/[Symbol.replace](h, "")
            h = /value/[Symbol.replace](h, "<a href='" + e.redditlink + "'>Reddit Post Link</a>")
            h = /font/[Symbol.replace](h, "")
            loc.append(h)
        }
    }

    showVotes(entry) {
        const shvote = function (loc, tf) {
            if (tf) {
                loc.removeClass("fa-square")
                loc.addClass("fa-check-square")
                loc.css("color", "#00c000")
            } else {
                loc.removeClass("fa-check-square")
                loc.addClass("fa-square")
                loc.css("color", "grey")
            }
        }

        if (typeof entry !== "undefined") {
            $("#favorite").css("color", entry.favorite ? "#00c000" : "grey")
            shvote($("#voted-edchoice"), entry.edchoice)
            shvote($("#voted-bhspoi"), entry.bhspoi)
            shvote($("#voted-visited"), entry.visited)
            shvote($("#voted-report"), entry.report)
            // shvote($("#voted-hof"), entry.hof)
            shvote($("#voted-patron"), entry.patron)
        } else {
            $("#favorite").css("color", "grey")
            shvote($("#voted-edchoice"), false)
            shvote($("#voted-bhspoi"), false)
            shvote($("#voted-visited"), false)
            shvote($("#voted-report"), false)
            // shvote($("#voted-hof"), false)
            shvote($("#voted-patron"), false)
        }
    }

    showAll() {
        let loc = $("#id-table")
        loc.find("[id|='row']").show()
    }

    buildDisplayList() {
        let nav = `
        <a id="dltab-idname" class="nav-item nav-link txt-def h6 rounded-top" style="border-color:black;" 
            data-toggle="tab" href="#dl-idname" role="tab" aria-controls="dl-idname" aria-selected="false">
            title&nbsp;(<span id="tot-idname"></span>)
        </a>`
        let header = `
        <div id="dl-idname" class="tab-pane hidden pl-15 pr-15" role="tabpanel" aria-labelledby="dltab-idname">
            <div id="list-idname" class="scroll row" style="height:600px"></div>
        </div>`

        let l = /idname/g[Symbol.replace](nav, "All")
        l = /title/[Symbol.replace](l, "All")
        $("#displayTabs").append(l)

        l = /idname/g[Symbol.replace](header, "All")
        $("#displayPanels").append(l)

        l = /idname/g[Symbol.replace](nav, "Search-Results")
        l = /title/[Symbol.replace](l, "Search Results")
        l = l.replace(/(.*?)\(.*\)/, "$1")
        $("#displayTabs").append(l)
        $("#dltab-Search-Results").hide()

        l = /idname/g[Symbol.replace](header, "Search-Results")
        $("#displayPanels").append(l)

        for (let obj of objectList) {
            let type = obj.name

            let l = /idname/g[Symbol.replace](nav, type)
            l = /title/[Symbol.replace](l, type.idToName())
            $("#displayTabs").append(l)

            l = /idname/g[Symbol.replace](header, type)
            $("#displayPanels").append(l)

            let loc = $("#displayPanels #list-" + type)
            nmsce.addDisplayListEntry(type, loc)
        }

        let height = $("html")[0].clientHeight - 100
        $("#displayPanels .scroll").height(height + "px")
    }

    clearDisplayList(type) {
        let loc = $("#displayPanels #list-" + type)
        loc.empty()
    }

    displayList(entries, type) {
        let loc = $("#displayPanels #list-" + type)

        for (let e of entries) {
            nmsce.entries[type].push(e)
            nmsce.addDisplayListEntry(e, loc, false, type)
        }
    }

    displayListEntry(entry) {
        let loc = $("#displayPanels #list-" + entry.type)
        let eloc = loc.find("#row-" + entry.id)
        let all = $("#displayPanels #list-All")
        let aloc = all.find("#row-" + entry.id)

        if (eloc.length === 0) {
            nmsce.addDisplayListEntry(entry, loc, true)
            nmsce.addDisplayListEntry(entry, all, true)
        } else {
            nmsce.updateDisplayListEntry(entry, eloc)
            nmsce.updateDisplayListEntry(entry, aloc)
        }
    }

    sortLoc(evt) {
        let id = $(evt).prop("id")
        let name = id.stripID()
        let loc = $(evt).closest("[id|='list']")
        let row = loc.find("#row-key")
        let key = row[0].outerHTML
        row.remove()

        let list = loc.children()
        switch (name) {
            case "Favorite":
            case "Editors-Choice":
            case "Visited":
            case "Slots":
                list.sort((a, b) => {
                    let av = $(a).find("#" + id).text().stripMarginWS()
                    let bv = $(b).find("#" + id).text().stripMarginWS()
                    let x = parseInt(av)
                    let y = parseInt(bv)
                    return y - x
                })
                break
            case "Height":
                list.sort((a, b) => {
                    let av = $(a).find("#" + id).text().stripMarginWS()
                    let bv = $(b).find("#" + id).text().stripMarginWS()
                    let x = parseFloat(av)
                    let y = parseFloat(bv)
                    return y - x
                })
                break
            case "Class":
                list.sort((a, b) => {
                    let av = $(a).find("#" + id).text().stripMarginWS()
                    let bv = $(b).find("#" + id).text().stripMarginWS()
                    let x = "SABC".indexOf(av)
                    let y = "SABC".indexOf(bv)
                    return x - y
                })
                break
            case "Modified":
            case "Created":
                list.sort((a, b) => {
                    let av = new Date($(a).find("#" + id).text().stripMarginWS())
                    let bv = new Date($(b).find("#" + id).text().stripMarginWS())
                    return bv - av
                })
                break
            case "Seed":
            case "Posted":
                list.sort((a, b) => {
                    let av = $(a).find("#" + id).text().stripMarginWS().toLowerCase()
                    let bv = $(b).find("#" + id).text().stripMarginWS().toLowerCase()
                    return av > bv ? -1 : av < bv ? 1 : 0
                })
                break
            default:
                list.sort((a, b) => {
                    let av = $(a).find("#" + id).text().stripMarginWS().toLowerCase()
                    let bv = $(b).find("#" + id).text().stripMarginWS().toLowerCase()
                    return av > bv ? 1 : av < bv ? -1 : 0
                })
                break
        }

        loc.empty()
        loc.append(key)
        loc.append(list)
    }

    addDisplayListEntry(e, loc, prepend, type) {
        const key = `
        <div id="row-key" class="col-md-p250 col-sm-p333 col-7 border border-black txt-def" >
            <div class="row">`

        const row = `     
        <div id="row-idname" class="col-md-p250 col-sm-p333 col-7 border border-black h6" >
            <div id="id-Photo" class="row pointer pl-10 pr-10" data-type="etype" data-id="eid" onclick="nmsce.selectList(this)" style="min-height:20px">
                <img id="img-idname" data-thumb="ethumb"
                onload="imageLoaded(this, $(this).parent().width(), $('#id-row').height(), false)">
            </div>
            <div class="row pl-10">`
        const item = `<div id="id-idname" class="col-md-7 col-14 border pointer">title</div>`
        const sortItem = `<div id="id-idname" class="col-md-7 col-14 border pointer" onclick="nmsce.sortLoc(this)">title</div>`
        const end = `</div></div>`

        let h = ""
        let fstring = typeof e === "string"
        let itm = item

        if (fstring) {
            h = key
            itm = sortItem
        } else {
            h = /etype/[Symbol.replace](row, e.type.nameToId())
            if (e.private)
                h = /black/[Symbol.replace](h, "black bkg-yellow")
            h = /idname/[Symbol.replace](h, e.id)
            h = /eid/[Symbol.replace](h, e.id)
            h = /ethumb/[Symbol.replace](h, thumbPath + e.Photo)
        }

        if (type === "All" || type === "Search Results") {
            let l = /idname/g[Symbol.replace](itm, "type")
            l = /pointer/[Symbol.replace](l, "")
            h += /title/[Symbol.replace](l, e.type)
            if (e.Type) {
                l = /idname/g[Symbol.replace](itm, "Type")
                l = /pointer/[Symbol.replace](l, "")
                h += /title/[Symbol.replace](l, e.Type)
            }
            l = /idname/g[Symbol.replace](itm, "Name")
            l = /pointer/[Symbol.replace](l, "")
            h += /title/[Symbol.replace](l, e.Name)
            l = /idname/g[Symbol.replace](itm, "Addr")
            l = /pointer/[Symbol.replace](l, "")
            h += /title/[Symbol.replace](l, e.addr)
        } else {
            let i = getIndex(objectList, "name", fstring ? e : e.type)
            for (let f of objectList[i].fields) {
                let id = f.name.nameToId()
                let title = fstring ? f.name : typeof e[f.name] === "undefined" ? "" : e[f.name]

                if (f.type !== "img" && f.type !== "map") {
                    let l = /idname/g[Symbol.replace](itm, id)
                    if (!fstring)
                        l = /pointer/[Symbol.replace](l, "")

                    h += /title/[Symbol.replace](l, title)

                    if (typeof f.sublist !== "undefined")
                        for (let s of f.sublist) {
                            let id = s.name.nameToId()
                            let title = fstring ? s.name : typeof e[s.name] === "undefined" ? "" : e[s.name]

                            if (s.type !== "img" && s.type !== "map") {
                                let l = /idname/g[Symbol.replace](itm, id)
                                h += /title/[Symbol.replace](l, title)
                            }
                        }
                }
            }

            if (fstring) {
                let l = /idname/g[Symbol.replace](itm, "Favorite")
                h += /title/[Symbol.replace](l, "Favorite")
                l = /idname/g[Symbol.replace](itm, "Visited")
                h += /title/[Symbol.replace](l, "Visited")
                l = /idname/g[Symbol.replace](itm, "Patron")
                h += /title/[Symbol.replace](l, "Patron")
                l = /idname/g[Symbol.replace](itm, "Editors-Choice")
                h += /title/[Symbol.replace](l, "Editors Choice")
                // l = /idname/g [Symbol.replace](itm, "Hall-of-Fame")
                // h += /title/ [Symbol.replace](l, "Hall of Fame")
                l = /idname/g[Symbol.replace](itm, "Created")
                h += /title/[Symbol.replace](l, "Created")
                l = /idname/g[Symbol.replace](itm, "Modified")
                h += /title/[Symbol.replace](l, "Modified")
                l = /idname/g[Symbol.replace](itm, "Posted")
                h += /title/[Symbol.replace](l, "Posted")
            } else {
                let l = /idname/g[Symbol.replace](itm, "Created")
                l = /pointer/[Symbol.replace](l, "")
                h += /title/[Symbol.replace](l, e.created ? "Created " + e.created.toDate().toDateLocalTimeString() : "")
                l = /idname/g[Symbol.replace](itm, "Modified")
                l = /pointer/[Symbol.replace](l, "")
                h += /title/[Symbol.replace](l, e.modded ? "Modified " + e.modded.toDate().toDateLocalTimeString() : "")
                l = /idname/g[Symbol.replace](itm, "Posted")
                l = /pointer/[Symbol.replace](l, "")
                h += /title/[Symbol.replace](l, e.reddit ? "Posted " + e.reddit.toDate().toDateLocalTimeString() : "")
            }
        }

        h += end

        if (prepend) {
            let key = loc.find("#row-key")
            if (key.length === 0)
                loc.prepend(h)
            else
                key.after(h)
        } else {
            loc.append(h)
            loc = loc.find("#row-" + e.id + " img")

            let ref = bhs.fbstorage.ref().child(thumbPath + e.Photo)
            ref.getDownloadURL().then(url => {
                if (loc.is(":visible"))
                    loc.attr("src", url)
                else
                    loc.data("src", url)
            }).catch(err => console.log(err))
        }
    }

    updateDisplayListEntry(e, loc) {
        let i = getIndex(objectList, "name", e.type)
        for (let f of objectList[i].fields) {
            let id = f.name.nameToId()
            let title = typeof e[f.name] === "undefined" ? "" : e[f.name]

            if (f.type !== "img" && f.type !== "map") {
                let floc = loc.find("#id-" + id)
                if (floc.length > 0)
                    floc.text(title)

                if (typeof f.sublist !== "undefined")
                    for (let s of f.sublist) {
                        let id = s.name.nameToId()
                        let title = typeof e[s.name] === "undefined" ? "" : e[s.name]

                        if (s.type !== "img" && s.type !== "map") {
                            let floc = loc.find("#id-" + id)
                            if (floc.length > 0)
                                floc.text(title)
                        }
                    }
            }
        }
    }

    toggleSearch(evt) {
        if ($(evt).find(".fa-caret-square-down").is(":visible")) {
            $("#searchPanel").show()
            $(evt).find(".fa-caret-square-up").show()
            $(evt).find(".fa-caret-square-down").hide()
        } else {
            $("#searchPanel").hide()
            $(evt).find(".fa-caret-square-up").hide()
            $(evt).find(".fa-caret-square-down").show()
        }
    }

    selectList(evt) {
        let id = $(evt).closest("[id|='row']").prop("id").stripID()
        let type = $(evt).closest("[id|='list']").prop("id").stripID()
        let i = getIndex(nmsce.entries[type], "id", id)
        let e = nmsce.entries[type][i]
        nmsce.displaySingle(e)

        getDoc(doc(bhs.fs, "nmsce/" + e.galaxy + "/" + e.type + "/" + e.id)).then(doc => {
            if (doc.exists())
                nmsce.displaySingle(doc.data())
        })
    }

    newDARC(evt) {
        let addr = $(evt).text()

        if (typeof (Storage) !== "undefined")
            window.localStorage.setItem('nmsce-addr', addr)

        var win = window.open('darc.html', '_blank')
        if (win) {
            win.focus()
        } else {
            alert('Please allow popups for this website')
        }
    }
}

let txtcanvas = document.createElement('canvas');

function setRadio(loc, val) {
    loc.find("input").prop("checked", false)
    loc.find("input").data("last", false)

    if (val) {
        loc.find("#rdo-" + val.nameToId()).prop("checked", true)
        loc.find("#rdo-" + val.nameToId()).data("last", true)
    }
}

blackHoleSuns.prototype.status = function (str, clear) {
    if (clear)
        $("#status").empty()

    if (str !== "")
        $("#status").prepend(str + "</br>")
}

const mapColors = {
    hover: "#ffc000",
    selected: "#0000ff",
    disabled: "#c0c0c0",
    enabled: "#00a000",
    error: "#ff0000",
}

const reddit = {
    client_id: "8oDpVp9JDDN7ng",
    redirect_url: "http://nmsce.com/cedata.html",
    scope: "identity,submit,mysubreddits,flair",
    auth_url: "https://www.reddit.com/api/v1/authorize",
    token_url: "https://ssl.reddit.com/api/v1/access_token",
    api_oauth_url: "https://oauth.reddit.com",
    subscriber_endpt: "/subreddits/mine/subscriber",
    user_endpt: "/api/v1/me",
    getflair_endpt: "api/link_flair_v2",
    submitLink_endpt: "/api/submit",
    comment_endpt: "/api/comment",
};

function updateImageText() {
    nmsce.restoreImageText(null, true)
}

// Hack to make the function global. Should be avoided and code should be reformatted to not use it
window.setCursor = setCursor;
function setCursor(cursor) {
    $("body")[0].style.cursor = cursor
}

function setAsym(evt) {
    let id = $(evt.target).closest("[id|='slist']").prop("id")
    let row = $("#pnl-map #" + id)

    if (evt.target.checked && (fcedata || $(evt.target).prop("id") === "rdo-True"))
        row.find("#asym-checkmark").show()
    else
        row.find("#asym-checkmark").hide()
}

// Hack to make the function global. Should be avoided and code should be reformatted to not use it
window.toggleAsym = toggleAsym;
function toggleAsym(evt) {
    let ck = $(evt).closest("[id|='row']").find("#asym-checkmark")
    let id = $(evt).closest("[id|='slist']").prop("id")
    let row = $("#panels #" + id + " #row-Asymmetric")

    if (ck.is(":visible")) {
        setRadio(row, "False")
        $("[id='ck-Asymmetric']").prop("checked", false)
        $("[id='asym-checkmark']").hide()
    } else {
        setRadio(row, "True")
        $("[id='ck-Asymmetric']").prop("checked", true)
        $("[id='asym-checkmark']").show()
    }
}

function colorMapParts(pnlid) {
    for (let p of Object.keys(nmsce[pnlid]))
        if (p !== "type")
            colorMapPart(nmsce[pnlid][p])
}

function colorMapPart(part) {
    part.loc.find("*").css("stroke", mapColors[part.state])
}

var lastsel = 0;

function getPlanet(evt) {
    if (!fcedata)
        return

    let gal = $("#btn-Galaxy").text().stripNumber()
    let addr = $("#panels #id-addr").val()
    let planet = $(evt.target ? evt.target : evt).val()

    if (gal === "" || addr === "" || planet <= 0) {
        $("[id='row-Planet-Name'] .fa-check").hide()
        return
    }


    let q = query(collectionGroup(bhs.fs, "nmsceCommon"),
        where("galaxy", "==", gal),
        where("addr", "==", addr),
        where("Planet-Index", "==", planet),
        where("Planet-Name", "!=", ""), limit(1));

    getDocs(q).then(snapshot => {
        if (!snapshot.empty) {
            let e = snapshot.docs[0].data()

            if (e["Planet-Name"] && e["Planet-Name"] !== "") {
                $("[id='id-Planet-Name']").val(e["Planet-Name"])
                $("[id='row-Planet-Name'] .fa-check").show()
                nmsce.restoreImageText(null, true)
            }
        } else
            $("[id='row-Planet-Name'] .fa-check").hide()
    })
}

function getEntry() {
    let addr = $("#panels #id-addr").val()
    let name = $(this).val()
    let type = $("#typePanels .active").prop("id").stripID()
    let gal = $("#btn-Galaxy").text().stripNumber()

    if (gal && type && addr && name) {
        let q = query(collection(bhs.fs, "nmsce/" + gal + "/" + type), where("Name", "==", name), where("addr", "==", addr))
        getDocs(q).then(snapshot => {
            if (!snapshot.empty) {
                nmsce.displaySingle(snapshot.docs[0].data())
                $("#typePanels .active #row-Name .fa-check").show()
            }
        })
    }
}


const resultTables = [{
    name: "Search Results",
    limit: 50,
    hidden: true,
    cont: true,
}, {
    name: "My Favorites",
    limit: 50,
    hidden: true,
    cont: true,
}, {
    name: "Latest",
    field: "created",
    limit: 50,
    cont: true,
}, {
    name: "Top Favorites",
    field: "votes.favorite",
    limit: 20,
}, {
    name: "Patron Favorites",
    field: "votes.patron",
    limit: 20,
}, {
    name: "Top Visited",
    field: "votes.visited",
    limit: 20,
}, {
    name: "Moderators Choice",
    field: "votes.edchoice",
    limit: 20,
    // }, {
    //     name: "Hall of Fame",
    //     field: "votes.hof",
    //     limit: 20,
}, {
    name: "Totals",
}, {
    name: "Patrons",
},];

const objectList = [{
    name: "Ship",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "NMS Glyphs",
        type: "glyph",
    }, {
        field: "Economy",
        id: "#id-Economy",
        name: "Economy",
        type: "radio",
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Type",
        type: "menu",
        list: shipList, // fighter, shuttle, etc.
        ttip: "Select ship type to select ship size and parts.",
        required: true,
        search: true,
        sublist: [{
            name: "Slots",
            type: "radio",
            ttip: "slotTtip",
            sub: "slotList",
            imgText: true,
            search: true,
        }, {
            name: "Max Upgrade",
            type: "float",
            ttip: "upgradeTtip",
            sub: true,
            // search: true,
            // query: ">=",
            imgText: true,
            inputHide: true,
        }, {
            name: "Asymmetric",
            type: "checkbox",
            sub: "asymmetric",
            onchange: setAsym,
            search: true,
            inputHide: true,
        }, {
            name: "Parts",
            type: "map",
            sub: "bodies",
            search: true,
        }, {
            name: "Parts-2",
            type: "map",
            sub: "wings",
            search: true,
        }]
    }, {
        //     name: "Frequency",
        //     ttip: "Arrival frequency.",
        //     type: "menu",
        //     list: occurenceList,
        //     search: true,
        //     inputHide: true,
        // }, {
        name: "Crashed",
        type: "checkbox",
        onchange: showLatLong,
        imgText: true,
        search: true,
    }, {
        name: "Latitude",
        type: "float",
        startState: "hidden",
        imgText: true,
    }, {
        name: "Longitude",
        type: "float",
        imgText: true,
        startState: "hidden",
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        startState: "hidden",
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        startState: "hidden",
        onchange: getPlanet,
    }, {
        name: "Class",
        type: "radio",
        startState: "hidden",
        list: classList,
        imgText: true,
    }, {
        name: "First Wave",
        ttip: "This is <span class='h5' style='font-weight:bold'>ONLY</span> valid on space stations. First wave for reloading a save and restarting the game are different.",
        type: "radio",
        list: [{
            name: "Reload"
        }, {
            name: "Restart"
        }],
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin ship.",
        inputHide: true,
    }, {
        name: "Color",
        ttip: "Main body & wing colors. For colored chrome use the color + chrome.",
        type: "tags",
        search: true,
        list: colorList,
        max: 4,
    }, {
        name: "Markings",
        ttip: "Any decals, stripes, etc.",
        type: "tags",
        search: true,
        list: colorList,
        max: 4,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        ttip: "Use this to upload a screenshot for glyph translation and/or the image for this entry.",
        required: true,
    }]
}, {
    name: "Freighter",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "NMS Glyphs",
        type: "glyph",
    }, {
        field: "Economy",
        id: "#id-Economy",
        name: "Economy",
        type: "radio",
        list: economyListTier,
    }, {
        id: "#id-Lifeform",
        field: "life",
        name: "Lifeform",
        type: "radio",
        list: lifeformList,
    }],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin ship.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        search: true,
        list: colorList,
        max: 4,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }, {
        name: "Parts",
        type: "map",
        map: "/images/freighter-opt.svg",
        search: true,
    }]
}, {
    name: "Frigate",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Type",
        type: "menu",
        list: frigateList,
        imgText: true,
        search: true,
    }, {
        name: "Color",
        type: "tags",
        list: colorList,
        max: 4,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    },]
}, {
    name: "Multi-Tool",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
        // }, {
        //     id: "#id-Platform",
        //     field: "Platform",
        //     name: "Platform",
        //     type: "radio",
        //     required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Type",
        type: "radio",
        list: [{
            name: "Alien"
        }, {
            name: "Experimental"
        }],
        imgText: true,
        search: true,
    }, {
        name: "Size",
        type: "radio",
        list: [{
            name: "Rifle"
        }, {
            name: "Compact Rifle"
        }, {
            name: "Pistol"
        }],
        ttip: "Rifle: 17-24 slots<br>Compact Rifle: 11-16 slots<br>Pistol: 5-10 slots",
        imgText: true,
        search: true,
    }, {
        name: "Class",
        type: "radio",
        list: classList,
        // ttipFld: "classTtip",
        imgText: true,
        search: true,
    }, {
        name: "Space Station",
        type: "checkbox",
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
        onchange: getPlanet,
        inputHide: true,
    }, {
        name: "Latitude",
        imgText: true,
        type: "float",
        inputHide: true,
    }, {
        name: "Longitude",
        imgText: true,
        type: "float",
        inputHide: true,
    }, {
        name: "Notes",
        type: "long string",
        searchText: true,
        imgText: true,
        inputHide: true,
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin MT.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        max: 4,
        list: colorList,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Fauna",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Genus",
        type: "menu",
        list: faunaList,
        search: true,
    }, {
        name: "Tamed Product",
        type: "menu",
        list: faunaProductTamed,
        search: true,
        inputHide: true,
    }, {
        name: "Height",
        type: "float",
        range: 15.0,
        search: true,
        query: ">=",
        inputHide: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
    }, {
        name: "Planet Name",
        imgText: true,
        type: "string",
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        required: true,
        onchange: getPlanet,
        ttip: planetNumTip,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Planet",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        name: "Glyphs",
        field: "addr",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "Planet Index",
        range: 15,
        type: "number",
        required: true,
        onchange: getPlanet,
        ttip: planetNumTip,
    }, {
        name: "Biome",
        type: "menu",
        list: biomeList,
        imgText: true,
        search: true,
    }, {
        name: "Sentinels",
        type: "menu",
        list: sentinelList,
        ttip: `Low - Sentinels only guard secure facilities<br>
            High - Patrols are present throughout the planet (orange icon)<br>
            Aggressive - Patrols are present throughout the planet and Sentinels will attack on sight (red icon)<br>`,
        search: true,
        inputHide: true,
    }, {
        name: "Grass Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Water Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Sky Color",
        type: "menu",
        list: colorList,
        search: true,
        inputHide: true,
    }, {
        name: "Resources",
        type: "tags",
        list: resourceList,
        max: 6,
        imgText: true,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Base",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
        // }, {
        //     id: "#id-Platform",
        //     field: "Platform",
        //     name: "Platform",
        //     type: "radio",
        //     required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        imgText: true,
        onchange: getEntry,
        search: true,
    }, {
        name: "Owner",
        type: "string",
        required: true,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        searchText: true,
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        onchange: getPlanet,
        ttip: planetNumTip,
        searchText: true,
    }, {
        name: "Latitude",
        imgText: true,
        type: "float",
        inputHide: true,
    }, {
        name: "Longitude",
        imgText: true,
        type: "float",
        inputHide: true,
    }, {
        name: "Game Mode",
        type: "menu",
        list: modeList,
        required: true,
        ttip: "Bases are only visible by players using the same game mode.",
        imgText: true,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        imgText: true,
        max: 6,
        search: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }]
}, {
    name: "Living-Ship",
    imgText: [{
        id: "#id-Player",
        field: "_name",
        name: "Player",
        type: "string",
        required: true,
    }, {
        id: "#id-Galaxy",
        field: "galaxy",
        name: "Galaxy",
        type: "menu",
        required: true,
        // }, {
        //     id: "#id-Platform",
        //     field: "Platform",
        //     name: "Platform",
        //     type: "radio",
        //     required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Coords",
        type: "string",
        required: true,
    }, {
        id: "#id-addrInput #id-addr",
        field: "addr",
        name: "Glyphs",
        font: "NMS Glyphs",
        type: "glyph",
    },],
    fields: [{
        name: "Name",
        type: "string",
        search: true,
        imgText: true,
        onchange: getEntry,
        inputHide: true,
    }, {
        name: "blank",
        type: "blank",
    }, {
        name: "Damage",
        type: "float",
        inputHide: true,
    }, {
        name: "Hyperdrive",
        type: "float",
        inputHide: true,
    }, {
        name: "Planet Name",
        type: "string",
        imgText: true,
        searchText: true,
        inputHide: true,
    }, {
        name: "Planet Index",
        type: "number",
        range: 15,
        ttip: planetNumTip,
        onchange: getPlanet,
        searchText: true,
    }, {
        name: "Latitude",
        imgText: true,
        type: "float",
    }, {
        name: "Longitude",
        imgText: true,
        type: "float",
    }, {
        name: "Reset Mission",
        type: "checkbox",
        search: true,
        imgText: true,
        ttip: "Find specific living ship by resetting mission log location while on this planet."
    }, {
        name: "Seed",
        type: "string",
        searchText: true,
        ttip: "Found in save file. Can be used to reskin.",
        inputHide: true,
    }, {
        name: "Color",
        type: "tags",
        max: 4,
        list: colorList,
        search: true,
    }, {
        name: "Tags",
        type: "tags",
        max: 4,
        imgText: true,
        search: true,
        inputHide: true,
    }, {
        name: "Photo",
        type: "img",
        required: true,
    }, {
        name: "Parts",
        type: "map",
        map: "/images/living-ship-opt.svg",
        search: true,
    }]
}]