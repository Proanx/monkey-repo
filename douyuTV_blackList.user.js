// ==UserScript==
// @name         斗鱼拉黑主播
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.douyu.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const sb = ["5384600"];

    var count = 5;

    window.clearSB = function(){
        let list = document.getElementsByClassName("DyListCover-wrap");
        if(list.length==0){
            setTimeout(clearSB,300);
            return;
        }
        for(let i=0;i<list.length;i++){
            let upid = list[i].href.split("/")[3];
            if(sb.indexOf(upid)<0){
            }else{
                list[i].parentElement.parentNode.remove();
            }
        }
        if(count>0){
            setTimeout(clearSB,500);
            count--;
        }
    }
    setTimeout(clearSB,500);
})();