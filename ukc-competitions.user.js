// ==UserScript==
// @name         UKC Competitions
// @namespace    http://davidsouthgate.co.uk/userscripts/ukc-competitions.user.js
// @updateURL    http://davidsouthgate.co.uk/userscripts/ukc-competitions.user.js
// @downloadURL  http://davidsouthgate.co.uk/userscripts/ukc-competitions.user.js
// @version      1.2.0
// @description  Make entering UKC competitions easier
// @author       David Southgate
// @match        https://www.ukclimbing.com/news/competitions/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    var content = $("div[id=has_sidebar]");

    // Strip get variables from location
    var location = window.location.toString();
    location = location.split("?")[0];

    // Strip domain from location
    location = location.split("ukclimbing.com")[1];

    // If competitions home
    if(location == "/news/competitions/") {

        // Add styles
        $("head").append(
            "<style>" +
            "    @keyframes ds-comp-winner-kf {" +
            "        0%   { background-color: red; }"+
            "        50%  { background-color: green; }"+
            "        100% { background-color: red; }"+
            "    }" +
            "    .ds-comp-you-have-wone {" +
            "        background-color: red;" +
            "        animation: ds-comp-winner-kf 2s infinite;" +
            "        color: white;" +
            "    }" +
            "    .ds-comp-winner {" +
            "        background-color: red;" +
            "        animation: ds-comp-winner-kf 2s infinite;" +
            "        color: white;" +
            "        font-size: 32px;" +
            "    }" +
            "    .ds-comp-closed {" +
            "        background-color: red;"+
            "        color: white;" +
            "    }" +
            "    .ds-comp-entered {" +
            "        background-color: green;"+
            "        color: white;" +
            "    }" +
            "    .ds-comp-not-entered {" +
            "        background-color: orange;"+
            "        color: white;" +
            "    }" +
            "</style>"
        );

        // Get the profile page to get the user ID
        $.get("https://www.ukclimbing.com/user/profile.php", function(data, status) {

            // Get the user ID from the profile page
            var userId;
            try {
                userId = /(https:\/\/www\.ukclimbing\.com\/user\/profile\.php\?id=)([0-9]*)/i.exec(data)[2];
            }
            catch(err) {
                userId = "0";
            }

            // Get the column of recent competitions
            var recentCompsCol = $("div[id=has_sidebar] > .row > .col-sm-6:nth-child(1)");

            // Loop for every recent competition
            recentCompsCol.find(".postitem").each(function(index) {

                // Get the competition link
                var link = $(this).find("a").attr("href");

                var that = this;

                // Get the competition page
                $.get(link, function(data, status) {

                    var dataText = $(data).text();

                    var day, dayOi, month;
                    try {
                        var matches = /(This competition closes on )([A-Za-z]*)(, )([0-9]*)(st|nd|rd|th)( )(([A-Z])([a-z]*))/.exec(dataText);
                        day = matches[4];
                        dayOi = matches[5]; //ordinal indicator
                        month = matches[7];
                    }
                    catch(err) {}

                    var statusClass, statusMessage;

                    // If the user is a winner
                    if(data.indexOf("profile.php?id=" + userId) > -1) {
                        recentCompsCol.prepend("<span class='ds-comp-you-have-wone'>You Have Won A Competition</span>");
                        statusClass = "ds-comp-winner";
                        statusMessage = "WINNER";
                    }

                    // If the user needs to login
                    else if(dataText.indexOf("Please Register as a New User or Login as Existing User to enter") > -1) {
                        statusClass = "ds-comp-not-entered";
                        statusMessage = "Login Required";
                    }

                    // If the competition has closed
                    else if(data.indexOf("This competition has now closed") > -1) {
                        statusClass = "ds-comp-closed";
                        statusMessage = "Closed";
                    }

                    // If the user has already entered the competition
                    else if(data.indexOf("You have entered this competition") > -1) {
                        statusClass = "ds-comp-entered";
                        statusMessage = "Entered";
                    }

                    else {
                        statusClass = "ds-comp-not-entered";
                        statusMessage = "Not Entered";
                    }

                    // If a closes on date was extracted, show it
                    var closes = "";
                    if(typeof day !== "undefined" && typeof dayOi !== "undefined" && typeof month !== "undefined") {
                        closes = " Closes " + day + dayOi + " " + month;
                    }

                    $(that).find(".boxtitle").prepend("<span class='" + statusClass + "'>" + statusMessage + "</span>" + closes + "<br>");
                });
            });
        });
    }

    // If specific competition
    else if(location.substr(0, 19) == "/news/competitions/") {

        // If the user has already entered the competition, display an alert at the top of the page
        if(content.text().indexOf("You have entered this competition") > -1) {
            content.prepend("<div class='alert alert-warning' role='alert'>"+
                "    You have entered this competition" +
                "</div>");
        }

        // If the user needs to login
        else if(content.text().indexOf("Please Register as a New User or Login as Existing User to enter") > -1) {
            content.prepend("<div class='alert alert-danger' role='alert'>"+
                "    Login Required<br>" +
                "    <button id='ds-login' class='btn btn-danger'>" +
                "        Login" +
                "    </button>" +
                "</div>");
            $("#ds-login").click(function() {
                $("nav#mainNav #mainNavItems ul li.loggedout.dropdown div.dropdown-menu").css("display", "block");
            });
        }

        // Otherwise if this competition is not closed
        else if(content.text().indexOf("This competition has now closed") <= -1) {

            // Add a jump to entry button
            content.prepend("<button id='jump-to-entry' class='btn btn-primary'>" +
                "    Jump to Entry" +
                "</button>");

            // When jump to entry button is clicked
            content.find("#jump-to-entry").click(function() {
                $('html, body').animate({
                    scrollTop: $("input[name=name]").offset().top - 100
                }, 0);
            });

            // Find the send entry button
            var sendEntry = $("button[value='Submit Form']");
            var sendEntryParagraph = sendEntry.closest("p");

            sendEntryParagraph.append("<a id='save-my-details' class='btn btn-default btn-sm'>" +
                "    <i class='icon-pencil'></i> Save My Details" +
                "</a>");

            sendEntryParagraph.find("#save-my-details").click(function() {
                GM_setValue("firstName", $("input[name=name]").val());
                GM_setValue("surname", $("input[name=surname]").val());
                GM_setValue("email", $("input[type=email]").val());
                GM_setValue("contactAddress", $("textarea[name=address]").val());
                GM_setValue("postCode", $("input[name=postcode]").val());
                alert("Your details have been saved");
            });

            // Load details
            var firstName = GM_getValue("firstName");
            var surname = GM_getValue("surname");
            var email = GM_getValue("email");
            var contactAddress = GM_getValue("contactAddress");
            var postCode = GM_getValue("postCode");

            // Fill out those fields
            $("input[name=name]").val(firstName);
            $("input[name=surname]").val(surname);
            $("input[type=email]").val(email);
            $("textarea[name=address]").val(contactAddress);
            $("input[name=postcode]").val(postCode);

            // Don't subscribe me to a newsletter
            $("input#subscribeyes-add-me-to-the-newsletter").prop("checked", false);
        }
    }

})();