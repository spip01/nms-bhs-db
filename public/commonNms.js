'use strict';

import { galaxyRaw, galaxyList, economyList, levelRgb } from "./constants.js";

// Copyright 2019-2021 Black Hole Suns
// Written by Stephen Piper

export const findex = window.location.pathname.includes("index.html") || window.location.pathname == "/"
export const fpoi = window.location.pathname.includes("poiorg.html")
export const fdarc = window.location.pathname.includes("darc.html")
export const ftotals = window.location.pathname.includes("totals.html")
export const fsearch = window.location.pathname.includes("search.html")
export const fcedata = window.location.pathname.includes("cedata.html")
export const fnmsce = window.location.pathname.includes("nmsce.html")
export const fpreview = window.location.pathname.includes("preview.html")

export function addGlyphButtons(loc, fcn) {
    const gbtn = `
        <button type="button" class="btn-def btn btn-sm col-sm-p125 col-p250">
            <span class="txt-glyph-disp">title</span>
            &nbsp;title
        </button>`

    let h = ""
    for (let i = 0; i < 16; ++i) {
        h += /title/g[Symbol.replace](gbtn, i.toString(16).toUpperCase())
    }

    loc.append(h)

    loc.find(":button").click(function () {
        fcn(this)
    })
}

export function reformatAddress(addr) {
    let out = ""
    if (!addr)
        return out

    addr = addr.toUpperCase()

    if (addr.match(/^[0-9A-F]{12}$/))
        out = glyphToAddr(addr)
    else {
        let str = /[^0-9A-F]+/g[Symbol.replace](addr.toUpperCase(), ":")
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

export function addrToGlyph(addr, planet) {
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
        out.p = 0
        out.x = parseInt(addr.slice(0, 4), 16)
        out.y = parseInt(addr.slice(5, 9), 16)
        out.z = parseInt(addr.slice(10, 14), 16)
        out.s = parseInt(addr.slice(15), 16)
    }

    return out
}

function xyzToAddress(xyz) {
    let x = "000" + xyz.x.toString(16).toUpperCase()
    let z = "000" + xyz.z.toString(16).toUpperCase()
    let y = "000" + xyz.y.toString(16).toUpperCase()
    let s = "000" + xyz.s.toString(16).toUpperCase()

    x = x.slice(x.length - 4)
    z = z.slice(z.length - 4)
    y = y.slice(y.length - 4)
    s = s.slice(s.length - 4)

    let addr = x + ":" + y + ":" + z + ":" + s
    return addr
}

export function xyzToGlyph(xyz) {
    let xs = "00" + xyz.s.toString(16).toUpperCase()
    let xx = "00" + (xyz.x + 0x801).toString(16).toUpperCase()
    let xy = "00" + (xyz.y + 0x81).toString(16).toUpperCase()
    let xz = "00" + (xyz.z + 0x801).toString(16).toUpperCase()

    //const portalFormat = "psssyyxxxzzz"
    s = xyz.p.toString(16).toUpperCase()
    s += xs.slice(xs.length - 3)
    s += xy.slice(xy.length - 2)
    s += xz.slice(xz.length - 3)
    s += xx.slice(xx.length - 3)

    return s
}

function glyphToAddr(glyph) {
    //const portalFormat = "psssyyzzzxxx"

    if (glyph) {
        let xyz = {}
        xyz.p = parseInt(glyph.slice(0, 1), 16)
        xyz.s = parseInt(glyph.slice(1, 4), 16)
        xyz.y = (parseInt(glyph.slice(4, 6), 16) - 0x81) & 0xff
        xyz.z = (parseInt(glyph.slice(6, 9), 16) - 0x801) & 0xfff
        xyz.x = (parseInt(glyph.slice(9, 12), 16) - 0x801) & 0xfff

        return xyzToAddress(xyz)
    }

    return ""
}

export function mergeObjects(o, n) {
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

export function addObjects(o, n) {
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

export function validateAddress(addr, ck) {
    if (addr === "")
        return "No address"

    let c = addressToXYZ(addr)
    let error = ""

    if (c.x > 0xfff) error = "x " + c.x.toString(16) + " > fff"
    else if (c.y > 0xff) error = "y " + c.y.toString(16) + " > ff"
    else if (c.z > 0xfff) error = "z " + c.z.toString(16) + " > fff"
    else if (c.s > 0x2ff) error = "system " + c.s.toString(16) + " > 2ff"
    else if (ck === "bh" && c.s != 0x79) error = ck + " system " + c.y.toString(16) + ' != 79'
    else if (ck === "exit" && c.y < 0x7B) error = ck + " y " + c.y.toString(16) + ' < 7b'
    else if (ck === "exit" && c.y > 0x83) error = ck + " y " + c.y.toString(16) + ' > 83'
    else if (ck === "exit" && c.s > 0x78) error = ck + " system " + c.s.toString(16) + ' > 78'

    return error === "" ? "" : addr + " " + error
}

String.prototype.idToName = function () {
    return /-/g[Symbol.replace](this, " ")
}

export function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

String.prototype.nameToId = function () {
    return /[^a-z0-9_-]/ig[Symbol.replace](this, "-")
}

String.prototype.stripColons = function () {
    return /:/g[Symbol.replace](this, "")
}

String.prototype.stripID = function () {
    return this.replace(/^.*?-(.*)/, "$1")
}

String.prototype.stripMarginWS = function () {
    return this.replace(/^\s*(.*?)\s*$/g, "$1")
}

String.prototype.stripNumber = function () {
    return this.replace(/\s*-?\d*\.*\s*(\D*)\s*/, "$1")
}

export function formatListSel(val, list) {
    let name = val.stripNumber();
    if (name === "") {
        let num = val.replace(/(\d+).*/, "$1");
        let idx = getIndex(list, "number", num);
        if (idx != -1) name = list[idx].name;
    } else {
        let idx = getIndex(list, "name", name);
        if (idx != -1) name = list[idx].name;
    }

    return name;
}

export function getIndex(list, field, id) {
    if (!id)
        return -1

    return list.map(x => {
        if (field === "name" && typeof x.match !== "undefined" && id.match(x.match))
            return id.toLowerCase()
        else
            return typeof x[field] === "string" ? x[field].toLowerCase() : x[field]
    }).indexOf(typeof id === "string" ? id.toLowerCase() : id)
}

export function calcDist(addr, addr2) {
    let xyz1 = addressToXYZ(addr)
    let xyz2 = typeof addr2 !== "undefined" ? addressToXYZ(addr2) : {
        x: 0x7ff,
        y: 0x7f,
        z: 0x7ff
    }
    return parseInt(calcDistXYZ(xyz1, xyz2) * 400)
}

export function calcDistXYZ(xyz1, xyz2, xp, yp) {
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

export function calcAngle(saddr, eaddr, xp, yp) {
    let zero = glyphToAddr("000000000000");
    let a = calcDist(zero, eaddr, xp, yp);
    let c = calcDist(saddr, eaddr, xp, yp);
    let b = calcDist(saddr, zero, xp, yp);
    let angle = parseInt(
        (Math.acos((a * a - b * b - c * c) / (-2 * b * c)) * 180) / Math.PI
    );
    return Number.isNaN(angle) ? 0 : angle;
}

export function calcPlane(C) {
    const A = zero
    const B = aboveZero

    // a=(By−Ay)(Cz−Az)−(Cy−Ay)(Bz−Az) 
    // b=(Bz−Az)(Cx−Ax)−(Cz−Az)(Bx−Ax) 
    // c=(Bx−Ax)(Cy−Ay)−(Cx−Ax)(By−Ay) 
    // d=−(aAx+bAy+cAz) 
    let n = {}
    n.a = (B.y - A.y) * (C.z - A.z) - (C.y - A.y) * (B.z - A.z)
    n.b = (B.z - A.z) * (C.x - A.x) - (C.z - A.z) * (B.x - A.x)
    n.c = (B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)
    n.d = -(n.a * C.x + n.b * C.y + n.c * C.z)

    let v = {}
    v.x = A.x - C.x
    v.y = A.y - C.y
    v.z = A.z - C.z

    let u = {
        x: n.a,
        y: n.b,
        z: n.c
    }

    let r = {}
    // | r.a, r.b, r.c | 
    // | u.x, u.y, u.z |
    // | v.x, v.y, v.z |

    r.a = u.y * v.z - u.z * v.y
    r.b = -u.x * v.z + u.z * v.x
    r.c = u.x * v.y - u.y * v.x
    r.d = -(r.a * C.x + r.b * C.y + r.c * C.z)

    return {
        n: n,
        r: r,
    }
}

export function projOnPlane(p, xyz, rt) {
    let n = rt ? p.r : p.n

    let t = -(n.a * xyz.x + n.b * xyz.y + n.c * xyz.z + n.d) / (n.a * n.a + n.b * n.b + n.c * n.c)
    let pr = {}
    pr.x = n.a * t + xyz.x
    pr.y = n.b * t + xyz.y
    pr.z = n.c * t + xyz.z

    return pr
}

export function distToPlane(p, xyz, rt) {
    let n = !rt ? p.r : p.n
    return (n.a * xyz.x + n.b * xyz.y + n.c * xyz.z + n.d) / Math.sqrt(n.a * n.a + n.b * n.b + n.c * n.c)
}

export function calcAngles(b, c) {
    // b = start, c = dest
    let a = zero;

    let p = calcPlane(b);
    let cv = projOnPlane(p, c);
    let ch = projOnPlane(p, c, true);

    return {
        v: parseInt(calcAngleA(a, b, cv)),
        vdist: distToPlane(p, c),
        h: parseInt(180 - calcAngleA(a, b, ch)),
        hdist: distToPlane(p, c, true),
        dist: parseInt(calcDistXYZ(b, c) * 400),
    };
}

export function calcAngleA(a, b, c) {
    let t = ((b.x - a.x) * (c.x - a.x) + (b.y - a.y) * (c.y - a.y) + (b.z - a.z) * (c.z - a.z)) /
        (Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z)) *
            Math.sqrt((c.x - a.x) * (c.x - a.x) + (c.y - a.y) * (c.y - a.y) + (c.z - a.z) * (c.z - a.z)))

    return Math.acos(t) * 180 / Math.PI
}

var shipimg = null

export function mapAngles(canvasid, a, width, height) {
    if (!shipimg) {
        shipimg = new Image();
        shipimg.onload = function (evt) {
            mapAngles(canvasid, a, width, height);
        };
        shipimg.crossOrigin = "anonymous";
        shipimg.src = "/images/ship.svg";
    }

    let drawing = document.getElementById(canvasid);
    let ctx = drawing.getContext("2d");

    if (typeof width === "undefined")
        width = height = $("#" + canvasid)
            .parent()
            .width();

    drawing.width = width;
    drawing.height = height;

    let margin = 20;
    let marginb = 20;

    let elevx = margin;
    let elevy = margin;
    let elevw = width * 0.1;
    let elevh = drawing.height - margin - marginb - 30;
    let elev0y = elevy + elevh / 2;
    let elev0x = elevx;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(elevx + elevw / 2, elevy); //vert
    ctx.lineTo(elevx + elevw / 2, elevy + elevh);
    ctx.stroke();

    let u =
        elev0y -
        ((a.v > 90 ? 180 - a.v : a.v) * (a.vdist > 0 ? 1 : -1) * elevh) /
        2 /
        90;

    ctx.font = screen.width > 1024 ? "18px Arial" : "15px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("0", elevx - 8, elev0y + 3);
    let txtw = ctx.measureText("Horizon").width;
    ctx.fillText(
        "Horizon",
        elevx + elevw / 2 - txtw / 2,
        drawing.height - marginb
    );
    txtw = ctx.measureText(a.v > 90 ? 180 - a.v : a.v).width;
    ctx.fillText(a.v > 90 ? 180 - a.v : a.v, elevx - 10, u + 3);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(elev0x + txtw - 5, u);
    ctx.lineTo(elev0x + elevw, u);
    ctx.stroke();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(elev0x + 2, elev0y); //0 cross bar
    ctx.lineTo(elev0x + elevw, elev0y);
    ctx.stroke();

    // angle indicator

    let marginc = 10;
    let offsetx = 5;
    let radius = (drawing.width - margin * 2 - elevw - marginc * 2) / 2;
    let ctrx = margin + elevw + marginc + radius + offsetx;
    let ctry = margin + marginc + radius + 15;

    txtw = ctx.measureText("Angle from Galactic Center").width;
    ctx.fillText(
        "Angle from Galactic Center",
        ctrx - txtw / 2,
        drawing.height - marginb
    );

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ctrx, ctry - radius); //angle to ctr
    ctx.lineTo(ctrx, ctry);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ctrx + radius, ctry);
    ctx.arc(ctrx, ctry, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();

    for (let i = 1; i < 6; ++i) {
        let x1 =
            Math.sin(((i * 32.5) / 180) * Math.PI) *
            (i % 2 ? radius - 25 : radius - 10);
        let y1 =
            Math.cos(((i * 32.5 - 180) / 180) * Math.PI) *
            (i % 2 ? radius - 25 : radius - 10);
        let x2 = Math.sin(((i * 32.5) / 180) * Math.PI) * radius;
        let y2 = Math.cos(((i * 32.5 - 180) / 180) * Math.PI) * radius;

        ctx.moveTo(ctrx + x1, ctry + y1);
        ctx.lineTo(ctrx + x2, ctry + y2);

        ctx.moveTo(ctrx - x1, ctry + y1);
        ctx.lineTo(ctrx - x2, ctry + y2);
    }

    ctx.stroke();

    const txtr = radius + 12;
    let x = Math.sin((32.5 / 180) * Math.PI) * txtr;
    let y = Math.cos(((32.5 - 180) / 180) * Math.PI) * txtr;
    ctx.fillText("32.5", ctrx + x, ctry + y);

    x = Math.sin((0 / 180) * Math.PI) * txtr;
    y = Math.cos(((0 - 180) / 180) * Math.PI) * txtr;
    ctx.fillText("0", ctrx + x, ctry + y);

    x = Math.sin((a.h / 180) * Math.PI) * radius;
    y = Math.cos(((a.h - 180) / 180) * Math.PI) * radius;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ctrx, ctry);
    ctx.lineTo(ctrx + x * (a.hdist > 0 ? 1 : -1), ctry + y);
    ctx.stroke();

    x = Math.sin((a.h / 180) * Math.PI) * txtr;
    y = Math.cos(((a.h - 180) / 180) * Math.PI) * txtr;
    txtw = ctx.measureText(a.h).width;
    ctx.fillText(
        a.h,
        ctrx + x * (a.hdist > 0 ? 1 : -1) + (a.hdist > 0 ? -8 : -txtw),
        ctry + y
    );

    txtw = ctx.measureText(a.dist + " LY").width;
    ctx.fillText(a.dist + " LY", ctrx + (a.hdist > 0 ? -txtw - 10 : 10), ctry);

    ctx.drawImage(shipimg, ctrx - 10, ctry - 12, 20, 24);
}

const zero = {
    x: 2048,
    y: 128,
    z: 2048,
}

const aboveZero = {
    x: 0x7ff,
    y: 0xfe,
    z: 0x7ff
}

Array.prototype.intersects = function (array) {
    return this.filter(x => array.includes(x))
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

export function buildGalaxyInfo() {
    for (let l of galaxyRaw)
        for (let j = l.start, step = 1; j <= 255;) {
            if (typeof galaxyList[j - 1].color === "undefined")
                galaxyList[j - 1].color = l.color

            j += step++ % 2 ? l.step1 : l.step2
        }

    for (let l of economyList)
        l.color = levelRgb[l.number]
}
