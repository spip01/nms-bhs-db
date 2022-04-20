'use-strict';


// Hack to make the function global. Should be avoided and code should be reformatted to not use it
window.imageLoaded = imageLoaded;
export function imageLoaded(evt, width, height, expand) {
    let h = evt.naturalHeight
    let w = evt.naturalWidth

    let size = calcImageSize(w, h, width, height, expand)

    $(evt).height(size.height)
    $(evt).width(size.width)
}

export function calcImageSize(width, height, maxw, maxh, expand) {
    let wscale = 1
    let hscale = 1

    if (expand) {
        if (width > height && width < maxw) {
            hscale = maxw / width
            height *= hscale
            width = maxw
        } else if (height < maxh) {
            wscale = maxh / height
            width *= wscale
            height = maxh
        }
    }

    if (width > maxw) {
        hscale = maxw / width
        wscale = 1
        height *= hscale
        width = maxw
    }

    if (height > maxh) {
        wscale = maxh / height
        hscale = 1
        width *= wscale
        height = maxh
    }

    return ({
        height: parseInt(height),
        width: parseInt(width),
        hscale: hscale,
        wscale: wscale
    })
}