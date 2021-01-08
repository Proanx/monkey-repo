// ==UserScript==
// @name         给流氓加个buff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://588ku.com/*
// @match        *://www.58pic.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const urlList = ["588ku.com", "www.58pic.com", "90sheji.com", "www.ooopic.com", "www.51yuansu.com", "699pic.com", "ibaotu.com", "none", "www.88tph.com"];

    console.log(urlList.indexOf(window.location.host));

    switch(urlList.indexOf(window.location.host)){
        case 0:
            CLLogin.Clclose();
            $(".close-btn").click();
            $(".listlogin-box.listloginBox").remove();
            break;
        case 1:
            $('.login-model').css('display', 'none');
            $(".search-v3-back").remove();
            break;
    }

})();