// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.15
// @description  作用于动态页面，一天一次，0时刷新，自动发弹幕领取首条亲密度奖励
// @author       Pronax
// @match        *://t.bilibili.com/*
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const LOGIN_USER_ID = document.cookie.match(/DedeUserID=(\d*);/) && document.cookie.match(/DedeUserID=(\d*);/)[1];
    const JCT = getJct();

    if (!LOGIN_USER_ID) { return; }

    var failedList = new Map();
    var awaitList = new Set();
    var readyCount = 0;
    var totalCount = 0;

    var realRoomid = GM_getValue("realRoom") || {};
    var customDanmu = {     // 自定义打卡文字
        // 真实房间号
        21470918: "王哥我爱你王哥",
    };
    var emojiList = ["打卡(｡･ω･｡)", "打卡⊙ω⊙", "打卡( ˘•ω•˘ )", "打卡(〃∀〃)", "打卡(´･_･`)", "打卡ᶘ ᵒᴥᵒᶅ", "打卡(づ◡ど)", "打卡(=^･ｪ･^=)", "打卡｜д•´)!!", "打卡 ( ´･ᴗ･` ) ", "打卡ヾ(●´∇｀●)ﾉ", "打卡ヾ(❀╹◡╹)ﾉ~", "打卡( ✿＞◡❛)", "打卡( ・◇・)", "打卡վ'ᴗ' ի"];
    var formData = new FormData();
    formData.set("bubble", 0);
    formData.set("color", 16777215);
    formData.set("mode", 1);
    formData.set("fontsize", 25);
    formData.set("csrf", JCT);
    formData.set("csrf_token", JCT);

    setTimeout(() => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            console.log("今天日子不对啊");
            init();
        }
    }, 1000);

    function init() {
        fetch(`https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=${LOGIN_USER_ID}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(async result => {
                if (result.code) {
                    alert("获取徽章失败");
                    console.log("获取徽章失败：", result);
                    return;
                }
                let count = 1;
                totalCount = result.data.count;
                for (let i of result.data.list) {
                    if (i.medal_info.today_feed < 100) {
                        if (i.live_status == 1) {   // 0:没播   1:开播  2:录播
                            console.log(`${i.target_name}正在直播，没有打卡`);
                            awaitList.add(i);
                            continue;
                        }
                        let uid = i.medal_info.target_id;
                        if (!realRoomid[uid]) {
                            let rid = await getRid(uid);
                            if (rid != null) {
                                realRoomid[uid] = rid;
                                GM_setValue("realRoom", realRoomid);
                            } else {
                                continue;
                            }
                        }
                        console.log(`预计 ${count * 3} 秒后给 ${i.target_name} 发送弹幕`);
                        setTimeout(() => {
                            sendMsg(realRoomid[uid]);
                        }, count++ * 3000);
                    } else {
                        readyCount++;
                    }
                }
                afterDone();
            })
            .catch(e => {
                alert("获取徽章失败");
                console.log("获取徽章失败：", e);
            });
    }

    async function getRid(target_id) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/room/v2/Room/room_id_by_uid?uid=${target_id}`)
                .then(response => response.json())
                .then(json => {
                    console.log("获取房间号", json);
                    if (json.code == 0) {
                        resolve(json.data.room_id);
                    } else {
                        resolve(null);
                    }
                })
                .catch(err => {
                    console.log("获取房间号错误", err);
                    resolve(null);
                });
        });
    }

    function sendMsg(roomId) {
        let msg;
        let times = failedList.get(roomId) || 0;
        failedList.delete(roomId);
        formData.set("msg", customDanmu[roomId] || (msg = emojiList[(Math.random() * 100 >> 0) % emojiList.length], msg));
        formData.set("roomid", roomId);
        formData.set("rnd", Math.floor(new Date() / 1000));
        fetch("//api.live.bilibili.com/msg/send", {
            credentials: 'include',
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                console.log(roomId, result);
                // 10024: 拉黑
                // 1003: 禁言
                // -403: 主播设置了发言门槛
                switch (result.code) {
                    case 0:
                        if (result.msg != "") {
                            if (result.msg == "k" && times == 0) {
                                customDanmu[roomId] = msg.replace("打卡", "");
                            }
                            failedList.set(roomId, times);
                            break;
                        }
                    case -403:
                    case 1003:
                    case 10024:
                        readyCount++;
                        break;
                    default:
                        failedList.set(roomId, times);
                        break;
                }
                afterDone();
            })
            .catch(err => {
                console.log("发送弹幕失败：", err);
                alert("发送弹幕失败");
            });

    }

    function afterDone() {
        if (readyCount + failedList.size + awaitList.size != totalCount) { return; }
        if (failedList.size != 0) {
            for (let i of failedList) {
                let count = 1;
                if (i[1] <= 2) {
                    failedList.set(i[0], ++i[1]);
                    setTimeout(() => {
                        sendMsg(i[0]);
                    }, count++ * 5000);
                } else {
                    console.log("发送失败", i[0]);
                }
            }
        } else if (awaitList.size == 0) {
            console.log('都搞定了');
            GM_setValue("timestamp", new Date().toLocaleDateString());
        }
    }

    function getJct() {
        return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    }

})();