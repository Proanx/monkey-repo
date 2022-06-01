// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.23
// @description  作用于动态页面，发送弹幕+点赞三次来获取经验值，开播状态的不打卡
// @author       Pronax
// @match        *://t.bilibili.com/*
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const LOGIN_USER_ID = document.cookie.match(/DedeUserID=(\d*);/) && document.cookie.match(/DedeUserID=(\d*);/)[1];
    const JCT = getJct();

    if (!LOGIN_USER_ID) { return; }

    var failedList = new Map();
    var awaitList = new Set();
    var readyCount = 0;
    var currentCount = 0;
    var messageQueue = {   // timeout消费队列
        lastDanmuTimeStamp: Date.now(),
        lastInteractTimeStamp: Date.now(),
        getTimeout: (lastTimeStamp, margin = 3000) => {
            let now = Date.now();
            if (messageQueue[lastTimeStamp] < now) {
                messageQueue[lastTimeStamp] = now + margin;
            } else {
                let diff = messageQueue[lastTimeStamp] - now;
                messageQueue[lastTimeStamp] += margin;
                margin += diff;
            }
            return margin;
        },
        triggerLikeInteract: (medal, margin = 1000) => {
            let timeout = messageQueue.getTimeout("lastInteractTimeStamp", margin);
            setTimeout(() => {
                likeInteract(medal);
            }, timeout);
        },
        sendDanmu: (medal, margin = 5000) => {
            let timeout = messageQueue.getTimeout("lastDanmuTimeStamp", margin);
            console.log(`自动续牌-预计 ${Math.round(timeout / 1000)} 秒后给 ${medal.userName} 发送弹幕`);
            setTimeout(() => {
                sendMsg(medal);
            }, timeout);
        }
    };

    // var realRoomid = GM_getValue("realRoom") || {};
    var customDanmu = {     // 自定义打卡文字
        // 需要真实房间号，短位不行
        21470918: "王哥我爱你王哥",
        12232179: "打卡",
    };
    var emojiList = ["打卡(｡･ω･｡)", "打卡⊙ω⊙", "打卡( ˘•ω•˘ )", "打卡(〃∀〃)", "打卡(´･_･`)", "打卡ᶘ ᵒᴥᵒᶅ", "打卡(づ◡ど)", "打卡(=^･ｪ･^=)", "打卡｜д•´)!!", "打卡 ( ´･ᴗ･` ) ", "打卡ヾ(●´∇｀●)ﾉ", "打卡ヾ(❀╹◡╹)ﾉ~", "打卡( ✿＞◡❛)", "打卡( ・◇・)", "打卡վ'ᴗ' ի"];
    var formData = new FormData();
    formData.set("bubble", 0);
    formData.set("color", 16777215);
    formData.set("mode", 1);
    formData.set("fontsize", 25);
    formData.set("csrf", JCT);
    formData.set("csrf_token", JCT);

    setTimeout(async () => {
        if (GM_getValue("timestamp") != new Date().toLocaleDateString()) {
            console.log("自动续牌-今天日子不对啊");
            main();
        }
    }, 1000);

    // 主线程
    async function main(pageNum = 1) {
        let medalDetail = await getMedalDetail(pageNum);
        checker(medalDetail);
        if (medalDetail.hasNext) {
            setTimeout(() => {
                main(medalDetail.nextPage);
            }, 1000);
        }
    }

    /**
     * 获取并初始化徽章列表
     * @param {integer} pageNum 页数
     * @returns none
     */
    async function getMedalDetail(pageNum = 1) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/panel?page=${pageNum}&page_size=50`, {
                credentials: 'include'
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code != json.message) {
                        console.error(`自动续牌-获取列表失败：页数${pageNum}`, json);
                        throw new Error("获取列表失败");
                    }
                    // 最近获得、当前房间、当前佩戴会在这个特殊列表内，需要添加到总列表当中
                    let list = json.data.list.concat(json.data.special_list);
                    list.forEach(item => {
                        Object.defineProperties(item, {
                            "isLighted": {
                                get() {
                                    return item.medal.is_lighted;
                                }
                            },
                            "isDarkened": {
                                get() {
                                    return !item.isLighted;
                                }
                            },
                            "isGuard": {
                                get() {
                                    return item.medal.guard_level != 0;
                                }
                            },
                            "wasGuard": {
                                get() {
                                    return item.medal.level > 20;
                                }
                            },
                            "intimacyEarnable": {
                                get() {
                                    return item.medal.level < 20;
                                }
                            },
                            "userId": {
                                get() {
                                    return item.medal.target_id;
                                }
                            },
                            "userName": {
                                get() {
                                    return item.anchor_info.nick_name;
                                }
                            },
                            "roomId": {
                                get() {
                                    return item.room_info.room_id;
                                }
                            },
                            "medalId": {
                                get() {
                                    return item.medal.medal_id;
                                }
                            },
                            "isAttended": {
                                get() {
                                    // floor用于消除投币等操作对亲密度产生的影响
                                    return item.medal.today_feed >= 700 || Math.floor(item.medal.today_feed / 100) % 2 == 1;
                                }
                            },
                            "isNotAttended": {
                                get() {
                                    return !item.isAttended;
                                }
                            },
                            "isLiked": {
                                get() {
                                    // 点赞有时只算两次，只有400，floor用于消除投币等操作对亲密度产生的影响
                                    return item.medal.today_feed >= 400 || (item.medal.today_feed != 0 && Math.floor(item.medal.today_feed / 100) % 2 == 0);
                                }
                            },
                            "isNotLiked": {
                                get() {
                                    return !item.isLiked;
                                }
                            },
                            "isLive": {
                                get() {
                                    // 0:没播   1:开播  2:录播
                                    return item.room_info.living_status == 1;
                                }
                            },
                            "isNotLive": {
                                get() {
                                    return !item.isLive;
                                }
                            },
                        });
                    });
                    let detail = {
                        medalList: list,
                        medalCount: json.data.total_number,
                        hasNext: json.data.page_info.has_more,
                        nextPage: pageNum + 1,
                    };
                    resolve(detail);
                })
        });
    }

    /**
     * 遍历查看是否已经打卡完成
     * @param {Object} medalDetail 
     */
    function checker(medalDetail) {
        if (currentCount == 0) {
            currentCount = medalDetail.medalList.length;
        } else {
            currentCount += medalDetail.medalList.length;
        }
        for (let medal of medalDetail.medalList) {
            if (medal.intimacyEarnable && medal.isNotLiked) {
                // 点赞打卡
                let triggetLimit = 3;
                for (; triggetLimit--;) {
                    messageQueue.triggerLikeInteract(medal);
                }
            }
            // 20级以上的发弹幕不会加亲密度无法判断，只能恩发了
            if ((medal.isNotAttended && customDanmu[medal.roomId]) || medal.isDarkened || (medal.intimacyEarnable && medal.isNotAttended)) {
                if (medal.isLive) {
                    console.log(`自动续牌-${medal.userName}正在直播，没有打卡`);
                    awaitList.add(medal);
                    continue;
                }
                messageQueue.sendDanmu(medal);
            } else {
                readyCount++;
            }
        }
        afterDone();
    }

    async function getRid(target_id) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/room/v2/Room/room_id_by_uid?uid=${target_id}`)
                .then(response => response.json())
                .then(json => {
                    console.log("自动续牌-获取房间号", json);
                    if (json.code == 0) {
                        resolve(json.data.room_id);
                    } else {
                        resolve(null);
                    }
                })
                .catch(err => {
                    console.log("自动续牌-获取房间号错误", err);
                    resolve(null);
                });
        });
    }

    async function likeInteract(medal) {
        console.log(`自动续牌-给${medal.userName}点赞`);
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "sec-ch-ua": "Mozilla/5.0 BiliDroid/6.73.1 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6731100 channel/pairui01 innerVer/6731100 osVer/11 network/2",
                },
                "body": `roomid=${medal.roomId}&csrf_token=${JCT}&csrf=${JCT}&visit_id=`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code == json.message) {
                        resolve(true);
                    } else {
                        console.warn(`自动续牌-${medal.userName}点赞失败`, json);
                        resolve(false);
                    }
                });
        });
    }

    async function sendMsg(item) {
        // let uid = item.userId;
        // if (!realRoomid[uid]) {
        //     let rid = await getRid(uid);
        //     if (rid != null) {
        //         realRoomid[uid] = rid;
        //         GM_setValue("realRoom", realRoomid);
        //     } else {
        //         alert("自动续牌：粉丝牌中存在用户没有直播间");
        //         console.warn("自动续牌-没有直播间", item);
        //         readyCount++;
        //         return;
        //     }
        // }
        let msg;
        // let roomId = realRoomid[item.userId];
        let roomId = item.roomId;
        let times = item.retryCount || 0;
        let medalStatus = false;
        // 需要戴粉丝牌才能发言
        if (item.failedReason == "-403") {
            medalStatus = true;
            await wearMedal(item.medalId);
        }
        formData.set("msg", customDanmu[roomId] || (msg = emojiList[(Math.random() * 100 >> 0) % emojiList.length], msg));
        formData.set("roomid", roomId);
        formData.set("rnd", Math.floor(new Date() / 1000));
        fetch("//api.live.bilibili.com/msg/send", {
            credentials: 'include',
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(async result => {
                console.log("自动续牌-打卡结果：", item.userName, result);
                if (medalStatus) {
                    await takeOff();
                }
                // 10024: 拉黑
                // 10030: 弹幕发送过快
                // 1003: 禁言
                // -403: 主播设置了发言门槛
                switch (result.code) {
                    case 0:
                        if (result.msg != "") {
                            if (result.msg == "k" && times == 0) {
                                customDanmu[roomId] = msg.replace("打卡", "");
                            }
                            item.failedReason = result.code;
                            item.retryCount = times;
                            failedList.set(item.userId, item);
                            break;
                        }
                    case 1003:
                    case 10024:
                        readyCount++;
                        break;
                    case -403:
                    case 10030:
                    default:
                        item.failedReason = result.code;
                        item.retryCount = times;
                        failedList.set(item.userId, item);
                        break;
                }
                afterDone();
            })
            .catch(err => {
                console.log("自动续牌-发送弹幕失败：", err);
            });

    }

    async function wearMedal(medal_id) {
        return new Promise((r, j) => {
            let params = new FormData();
            params.set("medal_id", medal_id);
            params.set("csrf_token", JCT);
            params.set("csrf", JCT);
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear", {
                credentials: "include",
                method: 'POST',
                body: params
            })
                .then(r => r.json())
                .then(json => {
                    r();
                });
        });
    }

    async function takeOff() {
        return new Promise((r, j) => {
            let params = new FormData();
            params.set("csrf_token", JCT);
            params.set("csrf", JCT);
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/take_off", {
                credentials: "include",
                method: 'POST',
                body: params
            })
                .then(r => r.json())
                .then(json => {
                    r();
                });
        });
    }

    function afterDone() {
        if (readyCount + failedList.size + awaitList.size != currentCount) { return; }
        console.log("自动续牌-开始整理打卡失败的房间");
        if (failedList.size != 0) {
            for (let i of failedList) {
                let detail = i[1];
                if (detail.retryCount <= 2) {
                    detail.retryCount++;
                    messageQueue.sendDanmu(detail);
                } else {
                    console.log("自动续牌-弹幕发送失败", detail);
                }
            }
            failedList.clear();
        } else if (awaitList.size == 0) {
            console.log("自动续牌-都搞定了");
            GM_setValue("timestamp", new Date().toLocaleDateString());
        }
    }

    function getJct() {
        return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    }

})();