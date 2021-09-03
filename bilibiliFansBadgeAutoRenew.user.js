// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  try to take over the world!
// @author       You
// @match        https://t.bilibili.com/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    var jct = getJct();

    var totalCount;
    var doneCount;
    var failCount = 0;

    var curPage;
    var totalPages;

    setTimeout(() => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            init();
        }
    }, 1000);

    function init(page = 1) {
        $.ajax({
            url: `https://api.live.bilibili.com/fans_medal/v5/live_fans_medal/iApiMedal?page=${page}&pageSize=10`,
            xhrFields: {
                withCredentials: true //允许跨域带Cookie
            },
            success: function (result) {
                if (result.code) {
                    alert("获取徽章失败");
                    console.log("获取徽章失败：", result);
                    return;
                }
                doneCount = 0;
                totalCount = result.data.count;
                curPage = result.data.pageinfo.curPage;
                totalPages = result.data.pageinfo.totalPages;
                let count = 1;
                for (let i of result.data.fansMedalList) {
                    if (i.today_feed < 100) {
                        setTimeout(() => {
                            sendMsg(i.roomid);
                        }, count++ * 1500);
                    }
                }
            },
            error: function (e) {
                alert("获取徽章失败");
                console.log("获取徽章失败：", e);
            }
        });
    }

    function sendMsg(roomId, msg = "(´･_･`)") {
        $.ajax({
            url: "https://api.live.bilibili.com/msg/send",
            type: "POST",
            data: {
                "bubble": 0,
                "msg": msg,
                "color": 16777215,
                "mode": 1,
                "fontsize": 25,
                "rnd": Math.round(new Date() / 1000),
                "roomid": roomId,
                "csrf": jct,
                "csrf_token": jct
            },
            xhrFields: {
                withCredentials: true //允许跨域带Cookie
            },
            success: function (result) {
                switch (result.code) {
                    case 0:
                        if (++doneCount == totalCount) {
                            if (curPage >= totalPages) {
                                GM_setValue("timestamp", new Date().toLocaleDateString());
                            } else {
                                init(++curPage);
                            }
                        }
                        break;
                    case 10030:
                        setTimeout(() => {
                            failCount && failCount--;
                            sendMsg(roomId);
                        }, ++failCount * 3000);
                        break;
                    default:
                        alert("发送弹幕失败");
                        console.log("发送弹幕失败：", e);
                }
            },
            error: function (e) {
                console.log("发送弹幕失败：", e);
            }
        });
    }

    function getJct() {
        return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    }

})();