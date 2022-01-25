// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.12
// @description  作用于动态页面，一天一次，0时刷新，自动发弹幕领取首条亲密度奖励
// @author       You
// @match        *://t.bilibili.com/*
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    var jct = getJct();

    var curCount;
    var doneCount;
    var failedList = new Map();

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
    formData.set("csrf", jct);
    formData.set("csrf_token", jct);

    var curPage;
    var totalPages;

    setTimeout(() => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            console.log("今天日子不对啊");
            init();
        }
    }, 1000);

    function init(page = 1) {
        fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/user/GetMyMedals?page_size=10&page=${page}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(async result => {
                if (result.code) {
                    alert("获取徽章失败");
                    console.log("获取徽章失败：", result);
                    return;
                }
                doneCount = 0;
                curCount = result.data.items.length;
                curPage = result.data.page_info.cur_page;
                totalPages = result.data.page_info.total_page;
                let count = 1;
                for (let i of result.data.items) {
                    if (i.today_feed < 100) {
                        if (!realRoomid[i.target_id]) {
                            let rid = await getRid(i.target_id);
                            if (rid != null) {
                                realRoomid[i.target_id] = i.roomid = rid;
                                GM_setValue("realRoom", realRoomid);
                            }
                        } else {
                            i.roomid = realRoomid[i.target_id];
                        }
                        console.log(`预计 ${count * 3} 秒后给 ${i.target_name} 发送弹幕`);
                        setTimeout(() => {
                            sendMsg(i.roomid);
                        }, count++ * 3000);
                    } else {
                        doneCount++;
                    }
                    afterDone();
                }
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
                    if (json.code == 0) {
                        console.log("获取房间号", json);
                        resolve(json.data.room_id);
                    } else {
                        reject(json);
                    }
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
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
                if (result.code == 10024 || (result.code == 0 && result.msg == "")) {
                    doneCount++;
                } else {
                    if (result.msg == "k" && times == 0) { customDanmu[roomId] = msg.replace("打卡", ""); }
                    failedList.set(roomId, times);
                }
                afterDone();
            })
            .catch(err => {
                console.log("发送弹幕失败：", err);
                alert("发送弹幕失败");
            });

    }

    function afterDone() {
        if (doneCount + failedList.size == curCount) {
            if (doneCount == curCount) {
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