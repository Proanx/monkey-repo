// ==UserScript==
// @name         JAV自动登录
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @exclude      https://www.javlibrary.com/cn/login.php
// @match        https://www.javlibrary.com/cn/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var isLogin = $(".menutext").children().length==4;
    if(isLogin){}else{
        window.open("/cn/login.php", "_blank", "width=600,height=400");
    }
})();