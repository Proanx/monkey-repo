// ==UserScript==
// @name         自动弹幕
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  你很有观察力!
// @author       Pronax
// @match        https://live.bilibili.com/23449607*
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    // 不登录用锤子呢
    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    const jct = document.cookie.match(/bili_jct=(\w*); /)[1];
    const userId = document.cookie.match(/DedeUserID=(\w*); /)[1];

    // 时间类单位都是ms
    const giftInterval = 15000;         // 付费礼物感谢弹幕冷却
    const freeGiftInterval = 60000;     // 免费礼物感谢弹幕冷却
    const welcomeInterval = 300000;     // 入场欢迎弹幕冷却
    const broadcastInterval = 300000;   // 公告弹幕冷却
    // 公告弹幕内容 
    // ps:不要超过自己账号的弹幕长度限制并且不能有违禁词，否则必发不出去
    // pps:什么都不写只有括号就是不发
    const broadcastContent = [
        "关注主播可以点歌哦♡歌单在置顶动态",
    ];

    const welcomeCountGap = 20000;      // 入场人数统计间隔
    
    var broadcastPointer = 0;
    var welcomeCount = new Map();

    var danmuNotice = new Map(), freeGiftNotice = new Map(), giftNotice = new Map(), welcomeNotice = new Map();

    var ts_send = 0, count = 100, interval = setInterval(() => {
        if (document.querySelector(".chat-items>.convention-msg")) {
            clearInterval(interval);

            count = 0;

            if (broadcastContent.length) {
                // let ts = GM_getValue("broadcastTimestamp") || Date.now();
                // setTimeout(() => {
                broadcast();    // 也许这样比较符合一般人的直觉？
                // }, ts - Date.now() < 0 ? 0 : ts - Date.now());
            }

            // 弹幕or付费礼物
            document.querySelector(".chat-items").addEventListener('DOMNodeInserted', function (e) {
                let item = e.target;
                if (item.classList && item.classList[0] == "chat-item") {
                    let uname = undefined;
                    let fansMedalDetaile = getfansMedalDetail(item);
                    switch (item.classList[1]) {
                        // 弹幕
                        case "danmaku-item":
                            uname = uname = item.getAttribute("data-uname");
                            let uid = item.getAttribute("data-uid");
                            let isAdmin = item.querySelector(".admin-icon");
                            let timestamp = item.getAttribute("data-ts");
                            let content = item.getAttribute("data-danmaku");
                            if (item.classList[2] == "superChat-card-detail") {
                                let scPrice = item.querySelector(".card-item-top-right").innerText.match(/\d+/)[0];
                                send(`感谢${uname}老板的醒目留言`);
                                break;
                            }
                            break;
                        // 付费礼物
                        case "gift-item":
                            uname = item.querySelector(".username").innerText;
                            let action = item.querySelector(".action").innerText;
                            let gift = item.querySelectorAll(".gift-name")[item.querySelectorAll(".gift-name").length - 1].innerText;
                            // eg. "x20" "共20个"
                            let num = item.querySelector(".gift-num").innerText.trim() || (item.querySelector(".gift-count") && item.querySelector(".gift-count").innerText) || (item.querySelector(".gift-total-count") && item.querySelector(".gift-total-count").innerText);
                            break;
                        // 船一类的
                        case "misc-msg":
                            uname = item.firstElementChild.innerText;
                            let describe = item.lastChild.trim();   // eg. 自动续费了舰长
                            send(`感谢${uname}老板上舰`);
                            break;
                    }
                }
            }, true);

            // 入场
            document.querySelector("#brush-prompt").addEventListener('DOMNodeInserted', function (e) {
                let uname = e.target.querySelector(".interact-name").innerText;
                let fansMedalDetaile = getfansMedalDetail(e.target);
                // 人数太多的时候就不发了
                welcomeCount.set(uname, setTimeout(() => {
                    welcomeCount.delete(uname);
                }, welcomeCountGap));
                if (welcomeCount.size < 5 && !welcomeNotice.get(uname)) {
                    send(`欢迎${uname}进入直播间`, 0, () => {
                        welcomeNotice.set(uname, setTimeout(() => {
                            welcomeNotice.delete(uname);
                        }, welcomeInterval));
                    });
                }
            }, true);

            // 免费礼物
            document.querySelector("#penury-gift-msg").addEventListener('DOMNodeInserted', function (e) {
                let uname = e.target.querySelector(".username").innerText;
                let action = e.target.querySelector(".action").innerText;
                let gift = e.target.querySelector(".gift-name").innerText;
                let fansMedalDetaile = getfansMedalDetail(e.target);
            }, true);
        }
        if (!count--) { clearInterval(interval); }
    }, 100);

    function broadcast() {
        send(broadcastContent[broadcastPointer++ % broadcastContent.length], 0, () => {
            GM_setValue("broadcastTimestamp", Date.now() + broadcastInterval);
            setTimeout(broadcast, broadcastInterval);
        });
    }

    function getfansMedalDetail(item) {
        let fansMedal = item.querySelector(".fans-medal-item-target");
        if (!fansMedal) { return null; }
        return {
            uid: fansMedal.querySelector(".data-anchor-id"),
            rid: fansMedal.querySelector(".data-room-id"),
            name: fansMedal.querySelector(".fans-medal-content").innerText,
            level: fansMedal.querySelector(".fans-medal-level").innerText,
            isGuard: fansMedal.querySelector(".medal-guard") != null,
            // 1:总督  2:提督  3:舰长
            guardLevel: fansMedal.querySelector(".medal-guard") && fansMedal.querySelector(".medal-guard").style.backgroundImage.match(/icon-guard(\d)/)[1],
        }
    }

    var params = new URLSearchParams();
    params.set("mode", 1);
    params.set("bubble", 0);
    params.set("csrf", jct);
    params.set("fontsize", 25);
    params.set("color", 16777215);
    params.set("csrf_token", jct);
    params.set("roomid", 23449607);

    function send(msg, reTryCount = 0, callback) {
        if (ts_send > Date.now()) {
            setTimeout(() => { send(msg, reTryCount, callback); }, ts_send - Date.now());
            return;
        }
        ts_send = Date.now() + 1500 * (++count + reTryCount);
        params.set("msg", msg);
        params.set("rnd", Date.now());
        ajax("https://api.live.bilibili.com/msg/send", params, function (result) {
            if (result.code || result.msg != "") {
                switch (result.msg) {
                    case "f":
                    case "fire":
                        result.msg = "含有敏感词";
                        reTryCount = 100;
                        return;
                }
                console.log(result);
                if (reTryCount >= 2) {
                    console.warn("有一条弹幕发送失败：", msg);
                    count >= 1 ? count-- : 0;
                    return;
                }
                if (ts_send > Date.now()) {
                    setTimeout(() => { send(msg, ++reTryCount, callback); }, ts_send - Date.now());
                } else {
                    send(msg, ++reTryCount, callback);
                }
            } else {
                callback && callback();
            }
            count >= 1 ? count-- : 0;
        });
    }

    function ajax(url, data, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200 || xhr.status == 304) {
                    callback && callback(JSON.parse(xhr.response));
                }
            }
        }
        xhr.send(data);
    }

})();