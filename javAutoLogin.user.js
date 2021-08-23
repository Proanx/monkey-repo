// ==UserScript==
// @name         JAV自动登录
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://www.javlibrary.com/cn/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    switch (location.pathname) {
        case "/cn/logout.php":
        case "/cn/login.php":
            return;
        case "/cn/myaccount.php":
            GM_setValue("javCookie", document.cookie);
            break;
        default:
            if (!document.cookie.match(/userid/)) {
                let savedCookie = GM_getValue("javCookie");
                if (savedCookie && savedCookie.match(/userid/)) {
                    let ca = savedCookie.split(';');
                    for (let i = 0; i < ca.length; i++) {
                        setCookie(ca[i]);
                    }
                } else {
                    window.open("/cn/login.php", "_blank", "width=600,height=400");
                }
            }
            break;
    }

    $(".menutext>a[href='logout.php']").click(() => {
        GM_setValue("javCookie", 0);
        let timeStr = new Date(0).toGMTString();
        var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
        if (keys) {
            for (let key of keys) {
                document.cookie = key + '=0;expires=' + timeStr;
            }
        }
    });

    function setCookie(cEntry) {
        let d = new Date();
        if (cEntry.match(/timezone/)) { return; }
        document.cookie = cEntry + "; path=/";
    }

})();