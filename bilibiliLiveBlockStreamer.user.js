// ==UserScript==
// @name         b站直播拉黑主播
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://live.bilibili.com/*
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    var blockList = getList();

    if (location.pathname.match(/\/\d+/)) {
        GM_addStyle(".bili-block-btn>i.icon-report:before{content: '\\E069' !important;}");

        var roomId = document.querySelector("#iframe-popup-area>iframe") && document.querySelector("#iframe-popup-area>iframe").src.match(/roomid=(\d+)/)[1] || location.pathname.match(/\/(\d+)/)[1];

        let count = 100;
        let interval = setInterval(() => {
            if (document.querySelector(".right-ctnr")) {
                clearInterval(interval);
                init();
            } else if (!count) {
                clearInterval(interval);
            }
            count++;
        }, 100);
    } else if (location.pathname.match(/\/all|p\/eden\/area-tags/)) {
        let css = "";
        for (let i = 0; i < blockList.length; i++) {
            css += i ? `,a[href*="${blockList[i]}"]` : `a[href*="${blockList[i]}"]`;
        }
        if (css) {
            css += "{display:none}";
            GM_addStyle(css);
        }
    }

    function add() {
        let list = getList();
        if (list.indexOf(roomId) < 0) {
            list.push(roomId);
            saveList(list);
            window.close();
        }
    }

    function remove() {
        let list = getList();
        let index = list.indexOf(roomId);
        if (index >= 0) {
            if (index != list.length - 1) {
                list[index] = list.pop();
            }else{
                list.pop();
            }
            saveList(list);
        }
        init();
    }

    function getList() {
        return GM_getValue("blockList") ? GM_getValue("blockList").split(",") : [];
    }

    function saveList(list) {
        blockList = list;
        GM_setValue("blockList", list.toString());
    }

    function init() {
        document.querySelector(".bili-block-btn") && document.querySelector(".bili-block-btn").remove();
        let index = blockList.indexOf(roomId);
        let div = document.createElement('div');
        div.innerHTML = `<div data-v-6d89404a="" data-v-6f529884="" title="" class="bili-block-btn icon-ctnr live-skin-normal-a-text pointer" style="line-height: 16px;"><i data-v-6d89404a="" class="v-middle icon-font icon-report" style="font-size: 16px;"></i><span data-v-6d89404a="" class="action-text v-middle" style="font-size: 12px;">${index >= 0 ? "解除拉黑" : "拉黑"}</span></div>`;
        document.querySelector(".right-ctnr").prepend(div);
        if (index < 0) {
            document.querySelector(".bili-block-btn").onclick = () => {
                add();
            };
        } else {
            document.querySelector(".bili-block-btn").onclick = () => {
                remove(index);
            };
        }
    }

})();