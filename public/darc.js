'use strict'

$(document).ready(() => {
    startUp()

    bhs.buildUserPanel(true)

    bhs.buildQueryPanel()
    // bhs.buildMapPanel()
    // bhs.buildResultPanel()
})

blackHoleSuns.prototype.buildQueryPanel = async function () {
    const query = `
        <div id="pnl-query" class="card card-body">
            <div class="row">
                <div class="col-md-4 col-7 h6 txt-inp-def">Starting Coordinates&nbsp;</div>
                <input id="id-start" class="rounded col-md-5 col-7" placeholder="0000:0000:0000:0000">
            </div>
            <div class="row">
                <div class="col-md-4 col-7 h6 txt-inp-def">Ending Coordinates&nbsp;</div>
                <input id="id-end" class="rounded col-md-5 col-7" placeholder="0000:0000:0000:0000">
            </div>
            <div class="row">
                <div class="card card-body no-border">
                    <div class="row">
                        <div id="id-Points-Of-Interest" class="col-7"></div>
                        <div id="id-Organizations" class="col-7"></div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 col-7 h6 txt-inp-def">Average Jump Range&nbsp;</div>
                <input id="id-jump" class="rounded col-md-5 col-7" type="number" value="2400">
            </div>
            <br>
            <div class="row">
                <div class="col-md-2 col-4">
                    <div class="row">
                        <button id="btn-searchRegion" type="button" class="btn-def btn btn-sm" onclick="bhs.calcroute()">Calculate Route</button>&nbsp
                    </div>
                </div>
                <div id="status" class="border col-md-11 col-9 text-danger scrollbar container-fluid" style="overflow-y: scroll; height: 68px"></div>
            </div>
        </div>`

    $("#panels").append(query)
    let pnl = $("#pnl-query")

    await bhs.getPoiList(true)
    bhs.buildMenu(pnl, "Points Of Interest", bhs.poiList, bhs.select)

    await bhs.getOrgList(true)
    bhs.buildMenu(pnl, "Organizations", bhs.orgList, bhs.select)

    $("#id-start").unbind("change")
    $("#id-start").change(function () {
        let addr = bhs.reformatAddress($(this).val())
        $(this).val(addr)
    })

    $("#id-end").unbind("change")
    $("#id-end").change(function () {
        let addr = bhs.reformatAddress($(this).val())
        $(this).val(addr)
    })

}

blackHoleSuns.prototype.select = function (id) {
    let name = $("#btn-" + id).text()
    if (id === "Points-Of-Interest") {
        let i = bhs.getIndex(bhs.poiList, "_name", name)
        let itm = bhs.poiList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Organizations").text("")
    } else {
        let i = bhs.getIndex(bhs.orgList, "_name", name)
        let itm = bhs.orgList[i]
        $("#id-end").val(itm.addr)
        $("#btn-Points-Of-Interest").text("")
    }
}

blackHoleSuns.prototype.calcroute = function () {
    bhs.status("get bases for " + bhs.user._name)
    bhs.status("get bhs file for " + bhs.user.galaxy + "/" + bhs.user.platform)
    bhs.status("calc route from: " + $("#id-start").val() + " to: " + $("#id-end").val())
}

blackHoleSuns.prototype.status = function (str) {
    $("#status").append("<h6>" + str + "</h6>")
}
