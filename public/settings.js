'use strict';

$(document).ready(function () {
    startUp();

    $("#submit").click(function() {
        bhs.readcsv($("#uploadedFile").val());
    });
});

