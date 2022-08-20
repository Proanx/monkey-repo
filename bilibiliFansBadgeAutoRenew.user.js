// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.2.12
// @description  发送弹幕+点赞+挂机观看 = 1500亲密度，仅会在不开播的情况下打卡
// @author       Pronax
// @include      /:\/\/live.bilibili.com(\/blanc)?\/\d+/
// @include      /:\/\/t.bilibili.com/
// @icon         http://bilibili.com/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js
// @require      https://greasyfork.org/scripts/447940-biliveheartwithtimeparam/code/BiliveHeartWithTimeParam.js?version=1071313
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

/* 
* todo  避免多页面并发
*/

(async function () {
    'use strict';

    const SHUTUP = false;  // 测试用的，为true时会拦截打卡的网络请求

    if (!jct()) {
        console.log("自动续牌-未登录账号");
        return;
    }

    switch (location.hostname) {
        case "t.bilibili.com":
            break;
        case "live.bilibili.com":
            if (location.pathname.match(/(\/blanc)?\/\d+/)) {
                let roomInfo = await getRoomInfo(location.pathname.match(/\/(\d+)/)[1]);
                let fansMedalInfo = await getFansMedalInfo(roomInfo.uid);
                addLikeBtn(roomInfo, fansMedalInfo);
            }
        default:
            return;
    }

    // 因为找到真实房间号有一些门槛，所以改用UID ---------------------------------
    let whiteList = [   // 白名单   与黑名单同时配置时黑名单优先
        // 只有在名单内的人才会打卡
        // e.g. 672328094,
    ];
    let blackList = [   // 黑名单   与黑名单同时配置时黑名单优先
        // 在名单内的人不会打卡
        // e.g. 672328094,
        1746543883,
        15937202,
    ];
    let customDanmu = { // 自定义打卡文字
        437744340: "王哥我爱你王哥",
        350024041: "打卡",
        1833021: "打坐催播",
    };
    // ---------------------------------------------------------------------

    let my_id = document.cookie.match(/DedeUserID=(\d*); /)[1];
    let today = new Date().toLocaleDateString();
    let watchingList = new Set();
    let loopTimes = 0;
    // let medalMap = new Map();
    let messageQueue = {   // timeout消费队列
        queueInfo: {
        },
        // lastone: Date.now(),
        // getTimeout: (lastTimeStamp, margin = 3000) => {
        //     let now = Date.now();
        //     if (messageQueue[lastTimeStamp] < now || messageQueue[lastTimeStamp] == undefined) {
        //         messageQueue[lastTimeStamp] = now + margin;
        //     } else {
        //         let diff = messageQueue[lastTimeStamp] - now;
        //         messageQueue[lastTimeStamp] += margin;
        //         margin += diff;
        //     }
        //     if (messageQueue[lastTimeStamp] > messageQueue.lastone) {
        //         messageQueue.lastone = messageQueue[lastTimeStamp];
        //     }
        //     return margin;
        // },
        hangingUp: async function (channel) {
            if (this.queueInfo[channel] == undefined) { return true; }
            while (this.queueInfo[channel].working) {
                await sleep(5000);
            }
            return true;
        },
        consumer: async function (channel) {
            if (this.queueInfo[channel].working) {
                return;
            }
            this.queueInfo[channel].working = true;
            do {
                let task = this.queueInfo[channel].queue.shift();
                let execResult = await task.method(task.param);
                // 失败重试
                if (!execResult) {
                    this.queueInfo[channel].queue.push(task);
                }
                await sleep(task.margin);
            } while (this.queueInfo[channel].queue.length > 0);
            this.queueInfo[channel].working = false;
        },
        triggerInteract: function (channel, method, param, margin = 1000) {
            if (this.queueInfo[channel] == undefined) {
                this.queueInfo[channel] = {
                    working: false,
                    queue: []
                };
            }
            this.queueInfo[channel].queue.push({
                method: method,
                param: param,
                margin: margin
            });
            this.consumer(channel);
        },
        // sendDanmu: (medal, margin = 5000) => {
        //     let timeout = messageQueue.getTimeout("lastDanmuTimeStamp", margin);
        //     console.log(`自动续牌-预计 ${Math.round(timeout / 1000)} 秒后给 ${medal.userName()} 发送弹幕`);
        //     setTimeout(() => {
        //         sendMsg(medal);
        //     }, timeout);
        // }
    };
    let emojiList = ["打卡(｡･ω･｡)", "打卡⊙ω⊙", "打卡( ˘•ω•˘ )", "打卡(〃∀〃)", "打卡(´･_･`)", "打卡ᶘ ᵒᴥᵒᶅ", "打卡(づ◡ど)", "打卡(=^･ｪ･^=)", "打卡｜д•´)!!", "打卡 ( ´･ᴗ･` ) ", "打卡ヾ(●´∇｀●)ﾉ", "打卡ヾ(❀╹◡╹)ﾉ~", "打卡( ✿＞◡❛)", "打卡( ・◇・)", "打卡վ'ᴗ' ի"];
    let formData = new FormData();
    formData.set("bubble", 0);
    formData.set("color", 16777215);
    formData.set("mode", 1);
    formData.set("fontsize", 25);

    setTimeout(main, 1000);
    // 运行部分结束

    async function main(pageNum = 1) {
        my_id = document.cookie.match(/DedeUserID=(\d*); /)[1];
        today = new Date().toLocaleDateString();
        if (GM_getValue(`finished-${my_id}`) == today) {
            let tomorrow = new Date(new Date().toLocaleDateString()).getTime() + 86410000;
            setTimeout(main, tomorrow - Date.now());
            console.log(`自动续牌-今日已打卡完毕，预计在 ${new Date(tomorrow).toLocaleString()} 开始下一轮打卡`);
            return;
        };
        let result = undefined;
        let finished = false;
        do {
            console.log(`自动续牌-开始打卡，正在加载第 ${pageNum} 页`);
            result = await getMedalDetail(pageNum++);
            finished = checker(result.list);
            // 睡一会防止消费未开始直接翻页
            await sleep(1000);
            // 等这一页的打卡任务都完成后再进行翻页
            await messageQueue.hangingUp("likeInteract");
            await messageQueue.hangingUp("sendDanmu");
        } while (result.hasNext);
        if (finished) {
            GM_setValue(`finished-${my_id}`, today);
            let tomorrow = new Date(new Date().toLocaleDateString()).getTime() + 86410000;
            setTimeout(main, tomorrow - Date.now());
            console.log(`自动续牌-主流程执行完毕，明日0点会开始下一轮打卡`);
        } else {
            setTimeout(main, 60 * 1000 * 10);
            console.log(`自动续牌-预计十分钟后执行下一轮打卡`);
        }
    }

    // 获取并初始化徽章列表
    async function getMedalDetail(pageNum = 1) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/panel?page=${pageNum}&page_size=50`, {
                credentials: 'include'
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code != json.message) {
                        console.error(`自动续牌-获取列表失败：页数${pageNum}`, json);
                        throw new Error("自动续牌-获取列表失败");
                    }
                    // 最近获得、当前房间、当前佩戴会在这个特殊列表内，需要添加到总列表当中
                    let list = [];
                    for (const item of json.data.list.concat(json.data.special_list)) {
                        list.push(new Medal(item));
                    }
                    let detail = {
                        list: list,
                        hasNext: pageNum < json.data.page_info.total_page,
                        nextPage: pageNum + 1,
                    };
                    resolve(detail);
                })
        });
    }

    // 遍历查看是否已经打卡完成
    function checker(medalDetail) {
        let shareList = [];
        let finished = 0;
        for (let medal of medalDetail) {
            // 判断黑名单、白名单、是否已完成打卡
            if (blackList.includes(medal.userId()) || (whiteList.length && !whiteList.includes(medal.userId())) || medal.isAttended()) {
                finished++;
                continue;
            }
            // 直播时不打卡
            if (medal.isLive()) {
                console.log(`自动续牌-${medal.userName()}正在直播，已跳过`);
                continue;
            }
            if (medal.isNotCheckedIn()) {
                // 弹幕打卡
                messageQueue.triggerInteract("sendDanmu", sendMsg, medal, 1000);
            }
            if (medal.intimacyEarnable()) {
                if (medal.isNotLiked()) {
                    // 点赞打卡
                    // for (let i = 0; i < 3; i++) {
                    messageQueue.triggerInteract("likeInteract", likeInteract, medal, 1000);
                    // }
                }
                // 防止同时过多挂机任务导致无法获得亲密度，限制最多50个
                if (
                    medal.isNotWatched() &&
                    !watchingList.has(medal.roomId()) &&
                    (!messageQueue.queueInfo["watchLive"] ||
                        messageQueue.queueInfo["watchLive"].queue.length + watchingList.size < 50)
                ) {
                    // 挂机观看
                    messageQueue.triggerInteract("watchLive", watchLive, medal, 1000);
                }
                // if (medal.isNotShared()) {
                //     shareList.push(medal);
                // }
            }
        };
        // 分享打卡
        // let gap = 1000;
        // if (shareList.length <= 5) {
        //     gap = 6000;
        // }
        // for (let i = 0; i < 5; i++) {
        //     shareList.forEach(medal => {
        //         messageQueue.triggerInteract("shareInteract", shareInteract, medal, gap);
        //     });
        // }
        // 完成后保存标志
        if (finished == medalDetail.length) {
            return true;
        }
    }

    async function likeInteract(medal) {
        console.log(`自动续牌-给 ${medal.userName()} 点赞`);
        if (SHUTUP) { return true; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "sec-ch-ua": "Mozilla/5.0 BiliDroid/6.73.1 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6731100 channel/pairui01 innerVer/6731100 osVer/11 network/2",
                },
                "body": `roomid=${medal.roomId()}&csrf_token=${jct()}&csrf=${jct()}&visit_id=`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    let count = +medal.getLikedCount();
                    if (json.code == json.message) {
                        medal.setLikedCount(++count);
                        resolve(true);
                    } else {
                        console.warn(`自动续牌-${medal.userName()}点赞失败`, json);
                        resolve(false);
                    }
                    saveRecords(medal);
                });
        });
    }

    async function shareInteract(medal) {
        console.log(`自动续牌-分享 ${medal.userName()} 的直播间`);
        if (SHUTUP) { return true; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/TrigerInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                },
                "body": `roomid=${medal.roomId()}&csrf_token=${jct()}&csrf=${jct()}&interact_type=3`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    let count = +medal.getSharedCount();
                    if (json.code == json.message) {
                        medal.setSharedCount(++count);
                        resolve(true);
                    } else {
                        console.warn(`自动续牌-${medal.userName()}的直播间分享失败`, json);
                        resolve(false);
                    }
                    saveRecords(medal);
                });
        });
    }

    async function watchLive(medal) {
        console.log(`自动续牌-开始挂机观看 ${medal.userName()} 的直播间`);
        if (SHUTUP) { return true; }
        return new Promise(async (resolve, reject) => {
            let rid = medal.roomId();
            let roomHeart = new RoomHeart(rid, (14 - medal.getRealWatchedCount()) * 5 + 1);
            roomHeart.doneFunc = () => {
                watchingList.delete(rid);
            }
            roomHeart.errorFunc = () => {
                watchingList.delete(rid);
            }
            watchingList.add(rid);
            let result = await roomHeart.start();
            if (!result) {
                medal.setWatchedCount(15);
                saveRecords(medal);
                console.log(`自动续牌-${medal.userName()}的直播间没有设置分区，取消观看`);
            }
            resolve(true);
        });
    }

    async function sendMsg(item) {
        // console.log(`自动续牌-给 ${item.userName()} 发送弹幕打卡`);
        if (SHUTUP) { return true; }
        let msg;
        let uid = item.userId();
        let medalStatus = false;
        // 需要戴粉丝牌才能发言
        if (item.getCheckInReason() == "-403") {
            medalStatus = true;
            await wearMedal(item.medalId());
        }
        // 查询自定义内容
        if (customDanmu[uid]) {
            msg = customDanmu[uid];
            let reg = new RegExp(`\(official\|room_${item.roomId()}\)_\\d+`);
            // 判断内容符合表情包则添加表情标识
            if (msg.match(reg)) {
                formData.set("dm_type", 1);
            }
        } else {
            formData.delete("dm_type");
            msg = emojiList[(Math.random() * 100 >> 0) % emojiList.length];
        }
        formData.set("csrf", jct());
        formData.set("csrf_token", jct());
        formData.set("msg", msg);
        formData.set("roomid", item.roomId());
        formData.set("rnd", Math.floor(new Date() / 1000));
        return new Promise((resolve) => {
            fetch("//api.live.bilibili.com/msg/send", {
                credentials: 'include',
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(async result => {
                    console.log("自动续牌-打卡结果：", item.userName(), result);
                    if (medalStatus) {
                        await takeOff();
                    }
                    let count = +item.getCheckInCount();
                    let returnValue = false;
                    // 10024: 拉黑
                    // 10030: 弹幕发送过快
                    // 10031: 弹幕发送过快
                    // 1003: 禁言
                    // -403: 主播设置了发言门槛
                    // -111: csrf过期
                    switch (result.code) {
                        case 0:
                            if (result.code == result.msg) {
                                item.setCheckInCount(3);
                                returnValue = true;
                                break;
                            } else if (result.msg == "k") {
                                if (count == 0) {
                                    // 有些房间把打卡设置为了屏蔽词
                                    customDanmu[uid] = msg.replace("打卡", "");
                                } else {
                                    // 表情包-泪目
                                    customDanmu[uid] = "official_103";
                                }
                                count -= 0.3; // 给多几次机会
                            }
                            item.setCheckInCount(++count);
                        case 10030:
                        case 10031:
                            item.setCheckInReason(result.code);
                            break;
                        case -111:
                            // 不应该出现
                            console.warn("token过期");
                            break;
                        case 10024:
                        // 拉黑了也可以挂直播
                        // item.setForceStopTimestamp(today);
                        case 1003:
                            count = 3;
                            returnValue = true;
                        case -403:
                            count += 1.6;
                        default:
                            item.setCheckInCount(++count);
                            item.setCheckInReason(result.code);
                            break;
                    }
                    // 防止未处理的情况出现死循环
                    if (count >= 5) {
                        returnValue = true;
                    }
                    saveRecords(item);
                    resolve(returnValue);
                })
                .catch(err => {
                    console.log("自动续牌-发送弹幕失败：", err);
                    medalStatus && takeOff();
                    resolve(false);
                });
        });
    }

    async function wearMedal(medal_id) {
        return new Promise((r, j) => {
            let params = new FormData();
            params.set("medal_id", medal_id);
            params.set("csrf_token", jct());
            params.set("csrf", jct());
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
            params.set("csrf_token", jct());
            params.set("csrf", jct());
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

    function jct() {
        let regex = document.cookie.match(/bili_jct=(\w*); /);
        return regex && regex[1];
    }

    async function sleep(ms = 500) {
        return new Promise(r => {
            if (ms <= 0) { r(true); }
            setTimeout(() => {
                r(true);
            }, ms);
        });
    }

    function getRecords(medalId) {
        return GM_getValue(`${medalId}-${my_id}`, {});
    }

    async function saveRecords(medal) {
        return GM_setValue(`${medal.medalId()}-${my_id}`, {
            checkIn: medal.checkIn,
            liked: medal.liked,
            shared: medal.shared,
            watched: medal.watched,
            forceStop: medal.forceStop,
        });
    }

    function Medal(detail) {
        this.info = detail;
        let records = getRecords(this.medalId());
        if (records.checkIn && records.checkIn.timestamp == today) {
            this.checkIn = records.checkIn;
        } else {
            this.checkIn = {
                count: 0,
                failedReason: undefined,
                timestamp: today,
            };
        }
        if (records.liked && records.liked.timestamp == today) {
            this.liked = records.liked;
        } else {
            this.liked = {
                count: 0,
                timestamp: today,
            };
        }
        if (records.shared && records.shared.timestamp == today) {
            this.shared = records.shared;
        } else {
            this.shared = {
                count: 0,
                timestamp: today,
            };
        }
        if (records.watched && records.watched.timestamp == today) {
            this.watched = records.watched;
        } else {
            this.watched = {
                count: 0,
                timestamp: today,
            };
        }
        if (records.forceStop && records.forceStop.timestamp == today) {
            this.forceStop = records.forceStop;
        } else {
            this.forceStop = {
                timestamp: undefined,
            };
        }
    }

    // 基础
    Medal.prototype.getIntimacy = function () { return this.info.medal.today_feed; };
    Medal.prototype.isZero = function () { return this.info.medal.today_feed < 99; };
    Medal.prototype.isLighted = function () { return this.info.medal.is_lighted; };
    Medal.prototype.isDarkened = function () { return !this.info.medal.is_lighted; };
    Medal.prototype.isGuard = function () { return this.info.medal.guard_level != 0; };
    Medal.prototype.wasGuard = function () { return this.info.medal.level > 20; };
    Medal.prototype.intimacyEarnable = function () { return this.info.medal.level <= 20; };
    Medal.prototype.userId = function () { return this.info.medal.target_id; };
    Medal.prototype.userName = function () { return this.info.anchor_info.nick_name; };
    Medal.prototype.roomId = function () { return this.info.room_info.room_id; };
    Medal.prototype.medalId = function () { return this.info.medal.medal_id; };
    Medal.prototype.isCheckedIn = function () { return this.checkIn.count >= 3; };
    Medal.prototype.isShared = function () { return this.shared.count >= 5; };
    Medal.prototype.isLiked = function () { return this.liked.count >= 1; };
    Medal.prototype.isLive = function () { return this.info.room_info.living_status == 1; };  // 0:没播   1:开播  2:录播
    Medal.prototype.isWatched = function () { return this.watched.count >= 15 };
    Medal.prototype.isAttended = function () {
        // 防止没有用户没有直播间的情况死循环
        if (this.forceStop.timestamp == today || !this.roomId()) {
            return true;
        }
        if (this.wasGuard()) {
            return this.isLighted() && !(customDanmu[this.userId()] && this.isNotCheckedIn());
        } else {
            return this.info.medal.today_feed >= 1500 || (this.isWatched() && this.isCheckedIn() && this.isLiked());
        }
    };
    Medal.prototype.isNotCheckedIn = function () { return !this.isCheckedIn(); };
    Medal.prototype.isNotAttended = function () { return !this.isAttended(); };
    Medal.prototype.isNotShared = function () { return !this.isShared(); };
    Medal.prototype.isNotLiked = function () { return !this.isLiked(); };
    Medal.prototype.isNotLive = function () { return !this.isLive(); };
    Medal.prototype.isNotZero = function () { return !this.isZero(); };
    Medal.prototype.isNotWatched = function () { return !this.isWatched() };
    // 打卡
    Medal.prototype.getCheckInCount = function () { return this.checkIn.count; };
    Medal.prototype.setCheckInCount = function (value) { return this.checkIn.count = value; };
    Medal.prototype.getCheckInReason = function () { return this.checkIn.failedReason; };
    Medal.prototype.setCheckInReason = function (value) { return this.checkIn.failedReason = value; };
    Medal.prototype.getCheckInTimestamp = function () { return this.checkIn.timestamp; };
    Medal.prototype.setCheckInTimestamp = function (value) { return this.checkIn.timestamp = value; };
    // 点赞
    Medal.prototype.getLikedCount = function () { return this.liked.count; };
    Medal.prototype.setLikedCount = function (value) { return this.liked.count = value; };
    Medal.prototype.getLikedTimestamp = function () { return this.liked.timestamp; };
    Medal.prototype.setLikedTimestamp = function (value) { return this.liked.timestamp = value; };
    // 分享
    Medal.prototype.getSharedCount = function () { return this.shared.count; };
    Medal.prototype.setSharedCount = function (value) { return this.shared.count = value; };
    Medal.prototype.getSharedTimestamp = function () { return this.shared.timestamp; };
    Medal.prototype.setSharedTimestamp = function (value) { return this.shared.timestamp = value; };
    // 观看
    Medal.prototype.getRealWatchedCount = function () {
        // 计算真实次数
        let watchTimes = Math.floor(this.getIntimacy() / 100);
        this.isCheckedIn() && watchTimes--;
        this.isLiked() && watchTimes--;
        return watchTimes;
    };
    Medal.prototype.getWatchedCount = function () { return this.watched.count; };
    Medal.prototype.setWatchedCount = function (value) { return this.watched.count = value; };
    Medal.prototype.getWatchedTimestamp = function () { return this.watched.timestamp; };
    Medal.prototype.setWatchedTimestamp = function (value) { return this.watched.timestamp = value; };
    // 停止
    Medal.prototype.getForceStopTimestamp = function () { return this.forceStop.timestamp; };
    Medal.prototype.setForceStopTimestamp = function (value) { return this.forceStop.timestamp = value; };

    async function getRoomInfo(rid) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${rid}`)
                .then(response => response.json())
                .then(json => {
                    // 有时会返奇怪的code，所以先不判断了
                    return resolve(json.data);
                });
        });
    }

    async function getFansMedalInfo(uid) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/fans_medal_info?target_id=${uid}`, { credentials: 'include', })
                .then(response => response.json())
                .then(json => {
                    if (json.code == json.message && json.data.has_fans_medal) {
                        return resolve(json.data.my_fans_medal);
                    }
                    resolve();
                });
        });
    }

    function addLikeBtn(roomInfo, fansMedalInfo) {
        let deadline = Date.now() + 3000;
        (function addBtn() {
            if (!document.querySelector(".right-ctnr .icon-font.icon-good-1")) {
                let icon = document.querySelector(".icon-font.icon-share");
                if (!icon) { return; }  // 筛掉frame
                let container = document.createElement("div");
                container.innerHTML = `
                    <div class="bili-block-btn icon-ctnr live-skin-normal-a-text pointer" style="line-height: 16px;margin-left: 16px;margin-right: -5px;">
                        <i class="v-middle icon-font icon-good-1" style="font-size: 16px;"></i>
                        <span class="action-text v-middle" style="margin-left: 2px;user-select: none;font-size: 12px;">点赞</span>
                    </div>
                `;
                container.onclick = () => {
                    fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract", {
                        "headers": {
                            "content-type": "application/x-www-form-urlencoded",
                            "sec-ch-ua": "Mozilla/5.0 BiliDroid/6.73.1 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6731100 channel/pairui01 innerVer/6731100 osVer/11 network/2",
                        },
                        "body": `roomid=${roomInfo.room_id}&csrf_token=${jct()}&csrf=${jct()}&visit_id=`,
                        "method": "POST",
                        "mode": "cors",
                        "credentials": "include"
                    })
                        .then(response => response.json())
                        .then(json => {
                            console.log("自动打卡-点赞结果：", json);
                            // 成功的话就给点赞次数+1
                            if (json.code == json.message) {
                                let record = getRecords(fansMedalInfo.medal_id);
                                record.liked.count = record.liked.count + 1;
                                record.liked.timestamp = new Date().toLocaleDateString();
                                GM_setValue(`${fansMedalInfo.medal_id}-${my_id}`, {
                                    checkIn: record.checkIn,
                                    liked: record.liked,
                                    shared: record.shared,
                                    watched: record.watched,
                                    forceStop: record.forceStop,
                                });
                            }
                        });
                    let chatHistory = document.querySelector("#chat-history-list");
                    let msg = document.createElement("div");
                    msg.className = "chat-item important-prompt-item";
                    msg.innerHTML = `<span class="flex-no-shrink v-middle" style="color: #F7B500">你刚刚点赞了直播间</span>`;
                    chatHistory.childNodes[0].appendChild(msg);
                    chatHistory.scrollTop = chatHistory.scrollHeight;
                };
                icon.parentElement.before(container);
            }
            if (Date.now() < deadline) {
                requestIdleCallback(addBtn, { timeout: 1000 });
            }
        })();
    }

})();