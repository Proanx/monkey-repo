// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1
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
    var runningCount = 0;
    var failCount = 0;

    setTimeout(() => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            init();
        }
    }, 1000);

    function init() {
        $.ajax({
            url: "https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=2060727",
            xhrFields: {
                withCredentials: true //允许跨域带Cookie
            },
            success: function (result) {
                totalCount = result.data.count;
                for (let i of result.data.list) {
                    if (i.medal_info.today_feed >= 100) { continue; }
                    let r = i.link.match(/live.bilibili.com\/(\d*)\?/);
                    if (r) {
                        sendMsg(r[1]);
                    } else {
                        getRoomId(i.medal_info.target_id);
                    }
                }
            },
            error: function (e) {
                console.log("获取徽章失败：", e);
            }
        });
    }

    function sendMsg(roomId, msg = "(˘･_･˘)") {
        setTimeout(() => {
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
                                GM_setValue("timestamp", new Date().toLocaleDateString());
                            }
                            break;
                        case 10030:
                            setTimeout(() => {
                                sendMsg(roomId);
                            }, ++failCount * 3000);
                            break;
                    }
                },
                error: function (e) {
                    console.log("发送弹幕失败：", e);
                }
            });
        }, ++runningCount * 1500);
    }

    function getRoomId(mid) {
        $.ajax({
            url: `https://api.bilibili.com/x/space/acc/info?mid=${mid}&jsonp=jsonp`,
            success: function (result) {
                sendMsg(result.data.live_room.url.match(/\d*$/)[0]);
            },
            error: function (e) {
                console.log("访问资料错误：", e);
            }
        });
    }

    function getJct() {
        return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    }

})();