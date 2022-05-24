// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.1.21
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
        lastTimeStamp: Date.now(),
        triggerLikeInteract: (medal, timeout = 1000) => {
            let now = Date.now();
            if (messageQueue.lastTimeStamp < now) {
                let diff = now - messageQueue.lastTimeStamp;
                if (diff < timeout) {
                    timeout += timeout - diff;
                }
                messageQueue.lastTimeStamp = now + timeout;
            } else {
                let diff = messageQueue.lastTimeStamp - now;
                messageQueue.lastTimeStamp += timeout;
                timeout += diff;
            }
            setTimeout(() => {
                likeInteract(medal);
                // 重试缺少出口
                // if (!await likeInteract(medal)) {
                //     messageQueue.triggerLikeInteract(medal, after);
                // }
            }, timeout);
        }
    };

    // var realRoomid = GM_getValue("realRoom") || {};
    var customDanmu = {     // 自定义打卡文字
        // 真实房间号
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
            console.log("今天日子不对啊");
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
            fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/panel?page=${pageNum}&page_size=200`, {
                credentials: 'include'
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code != json.message) {
                        console.error(`获取列表失败：页数${pageNum}`, json);
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
                            "isFed": {
                                get() {
                                    // 也许点赞有什么bug，但是600通常是有的
                                    return item.medal.today_feed >= 600;
                                }
                            },
                            "isLive": {
                                get() {
                                    // 0:没播   1:开播  2:录播
                                    return item.room_info.living_status == 1;
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
        let count = 1;
        currentCount = medalDetail.medalList.length;
        for (let medal of medalDetail.medalList) {
            // ~A~C~D + ~B~C~D
            if (!(medal.isGuard || medal.isFed) && (!medal.isLighted || !medal.wasGuard)) {
                if (medal.isLive) {
                    console.log(`${medal.userName}正在直播，没有打卡`);
                    awaitList.add(medal);
                    continue;
                }
                console.log(`预计 ${count * 3} 秒后给 ${medal.userName} 发送弹幕`);
                setTimeout(() => {
                    // console.log(medal);
                    sendMsg(medal);
                }, count++ * 3000);
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

    async function likeInteract(medal) {
        console.log(`给${medal.userName}点赞`);
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
                        console.warn(json);
                        resolve(false);
                    }
                });
        });
    }

    async function sendMsg(item) {
        // 点赞打卡
        let triggetLimit = 3;
        for (; triggetLimit--;) {
            messageQueue.triggerLikeInteract(item);
        }

        // let uid = item.userId;
        // if (!realRoomid[uid]) {
        //     let rid = await getRid(uid);
        //     if (rid != null) {
        //         realRoomid[uid] = rid;
        //         GM_setValue("realRoom", realRoomid);
        //     } else {
        //         alert("自动续牌：粉丝牌中存在用户没有直播间");
        //         console.warn("没有直播间", item);
        //         readyCount++;
        //         return;
        //     }
        // }
        let msg;
        // let roomId = realRoomid[item.userId];
        let roomId = item.roomId;
        let failed = failedList.get(item);
        let times = (failed && failed.count) || 0;
        let medalStatus = false;
        // 需要戴粉丝牌才能发言
        if (failed && failed.reason == "-403") {
            medalStatus = true;
            await wearMedal(item.medalId);
        }
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
            .then(async result => {
                console.log(item.userName, result);
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
                            failedList.set(item, {
                                reason: result.code,
                                count: times
                            });
                            break;
                        }
                    case 1003:
                    case 10024:
                        readyCount++;
                        break;
                    case -403:
                    default:
                        failedList.set(item, {
                            reason: result.code,
                            count: times
                        });
                        break;
                }
                afterDone();
            })
            .catch(err => {
                console.log("发送弹幕失败：", err);
                alert("发送弹幕失败");
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
        if (failedList.size != 0) {
            let count = 1;
            for (let i of failedList) {
                let item = i[0];
                let detail = i[1];
                if (detail.count <= 2) {
                    detail.count++;
                    failedList.set(item, detail);
                    setTimeout(() => {
                        sendMsg(i[0]);
                    }, count++ * 5000);
                } else {
                    console.log("发送失败", item);
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