// ==UserScript==
// @name         给这个垃圾网站加个BUFF
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://zhio2o.yuansupic.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var webList = ["https://588ku.com", "https://www.58pic.com", "http://90sheji.com", "https://www.ooopic.com", "http://www.51yuansu.com", "https://699pic.com", "https://ibaotu.com", "https://none", "https://588ku.com/video", "https://www.88tph.com"];

    var targetList;

    function load() {
        targetList = $(".act");
        if (targetList.length == 0) {
            setTimeout(load, 100);
            return;
        }
        $(targetList).each(function (index, obj) {
            if(index!=7){
                $(obj).click(function () {
                    window.open(webList[index]);
                })
            }
        })
    }

    setTimeout(load, 150);

})();