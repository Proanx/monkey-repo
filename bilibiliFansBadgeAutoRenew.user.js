// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.4
// @description  作用于动态页面，一天一次，0时刷新，自动发弹幕领取首条亲密度奖励
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
    var failedList = new Map();

    var emojiList = ["打卡(˘･_･˘)", "打卡(´ฅω•ฅ`)", "打卡(＃°Д°)", "打卡(´･ω･`)", "打卡_(:3」∠)_"];

    var curPage;
    var totalPages;

    setTimeout(() => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            console.log("今天日子不对啊");
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
                totalCount = result.data.fansMedalList.length;
                curPage = result.data.pageinfo.curPage;
                totalPages = result.data.pageinfo.totalpages;
                let count = 0;
                for (let i of result.data.fansMedalList) {
                    if (i.today_feed < 100) {
                        console.log(`预计 ${count * 1500} 毫秒后给 ${i.target_name} 发送弹幕`);
                        setTimeout(() => {
                            sendMsg(i.roomid);
                        }, count++ * 3000);
                    } else {
                        doneCount++;
                    }
                    afterDone();
                }
            },
            error: function (e) {
                alert("获取徽章失败");
                console.log("获取徽章失败：", e);
            }
        });
    }

    function sendMsg(roomId) {
        let times = failedList.get(roomId) || 0;
        failedList.delete(roomId);
        $.ajax({
            url: "https://api.live.bilibili.com/msg/send",
            type: "POST",
            data: {
                "bubble": 0,
                "msg": roomId == 21470918 ? "王哥我爱你王哥" : emojiList[(Math.random() * 200 >> 1) % emojiList.length],
                "color": 16777215,
                "mode": 1,
                "fontsize": 25,
                "rnd": Math.round(new Date() / 1000) - 3,
                "roomid": roomId,
                "csrf": jct,
                "csrf_token": jct
            },
            xhrFields: {
                withCredentials: true //允许跨域带Cookie
            },
            success: function (result) {
                console.log(result);
                if (result.code == 1003 || (result.code == 0 && result.msg == "")) {
                    doneCount++;
                } else {
                    failedList.set(roomId, times);
                }
                afterDone();
            },
            error: function (e) {
                console.log("发送弹幕失败：", e);
                alert("发送弹幕失败");
            }
        });
    }

    function afterDone() {
        if (doneCount + failedList.size == totalCount) {
            if (doneCount == totalCount) {
                if (curPage >= totalPages) {
                    console.log('都搞定了');
                    GM_setValue("timestamp", new Date().toLocaleDateString());
                } else {
                    init(++curPage);
                }
                return;
            }
            for (let i of failedList) {
                let count = 1;
                if (i[1] <= 2) {
                    failedList.set(i[0], ++i[1]);
                    setTimeout(() => {
                        sendMsg(i[0]);
                    }, count++ * 3000);
                } else {
                    console.log("发送失败", i[0]);
                }
            }
        }
    }

    function getJct() {
        return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    }

})();