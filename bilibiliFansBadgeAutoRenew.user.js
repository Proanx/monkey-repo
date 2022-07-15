// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  发送弹幕+点赞，仅会在不开播的情况下打卡
// @author       Pronax
// @include      /:\/\/live.bilibili.com(\/blanc)?\/\d+/
// @include      /:\/\/t.bilibili.com/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

// 避免多页面并发

(async function () {
    'use strict';

    // 存在token刷新的情况，JCT可能会变动
    var JCT = document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    const SHUTUP = false;  // 测试用的，为true时会拦截打卡的网络请求

    if (!JCT) {
        console.log("自动续牌-未登录账号");
        return;
    }

    switch (location.hostname) {
        case "t.bilibili.com":
            break;
        case "live.bilibili.com":
            if (location.pathname.match(/(\/blanc)?\/\d+/)) {
                var roomInfo = await getRoomInfo(location.pathname.match(/\/(\d+)/)[1]);
                addLikeBtn();
            }
        default:
            return;
    }

    // 因为找到真实房间号有一些门槛，所以改用uid
    var whiteList = [   // 白名单   与黑名单同时配置时黑名单优先
        // 只有在名单内的人才会打卡
        // e.g. 672328094,
    ];
    var blackList = [   // 黑名单   与黑名单同时配置时黑名单优先
        // 在名单内的人不会打卡
        // e.g. 672328094,
    ];
    var customDanmu = { // 自定义打卡文字
        437744340: "王哥我爱你王哥",
        350024041: "打卡",
        1833021: "打坐催播",
    };
    // ---------------------------------------------------------------------

    var loopTimes = 0;
    var medalMap = new Map();
    var today = new Date().toLocaleDateString();
    var messageQueue = {   // timeout消费队列
        lastone: Date.now(),
        getTimeout: (lastTimeStamp, margin = 3000) => {
            let now = Date.now();
            if (messageQueue[lastTimeStamp] < now || messageQueue[lastTimeStamp] == undefined) {
                messageQueue[lastTimeStamp] = now + margin;
            } else {
                let diff = messageQueue[lastTimeStamp] - now;
                messageQueue[lastTimeStamp] += margin;
                margin += diff;
            }
            if (messageQueue[lastTimeStamp] > messageQueue.lastone) {
                messageQueue.lastone = messageQueue[lastTimeStamp];
            }
            return margin;
        },
        triggerInteract: (channel, margin, method, param) => {
            let timeout = messageQueue.getTimeout(channel, margin);
            setTimeout(() => {
                method(param);
            }, timeout);
        },
        sendDanmu: (medal, margin = 5000) => {
            let timeout = messageQueue.getTimeout("lastDanmuTimeStamp", margin);
            console.log(`自动续牌-预计 ${Math.round(timeout / 1000)} 秒后给 ${medal.userName()} 发送弹幕`);
            setTimeout(() => {
                sendMsg(medal);
            }, timeout);
        }
    };
    var emojiList = ["打卡(｡･ω･｡)", "打卡⊙ω⊙", "打卡( ˘•ω•˘ )", "打卡(〃∀〃)", "打卡(´･_･`)", "打卡ᶘ ᵒᴥᵒᶅ", "打卡(づ◡ど)", "打卡(=^･ｪ･^=)", "打卡｜д•´)!!", "打卡 ( ´･ᴗ･` ) ", "打卡ヾ(●´∇｀●)ﾉ", "打卡ヾ(❀╹◡╹)ﾉ~", "打卡( ✿＞◡❛)", "打卡( ・◇・)", "打卡վ'ᴗ' ի"];
    var formData = new FormData();
    formData.set("bubble", 0);
    formData.set("color", 16777215);
    formData.set("mode", 1);
    formData.set("fontsize", 25);
    formData.set("csrf", JCT);
    formData.set("csrf_token", JCT);

    setTimeout(main, 1000);
    // 运行部分结束

    async function main(pageNum = 1) {
        today = new Date().toLocaleDateString();
        if (today == GM_getValue("finished")) {
            let tomorrow = new Date(new Date().toLocaleDateString()).getTime() + 86410000;
            setTimeout(main, tomorrow - Date.now());
            console.log(`自动续牌-今日已打卡完毕，预计在 ${new Date(tomorrow).toLocaleString()} 开始下一轮打卡`);
            return;
        };
        let result = await getMedalDetail(pageNum);
        if (result.hasNext) {
            setTimeout(main(result.nextPage), 1000);
        } else {
            checker(medalMap);
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
                        throw new Error("自动续牌-获取列表失败");
                    }
                    // 最近获得、当前房间、当前佩戴会在这个特殊列表内，需要添加到总列表当中
                    let list = json.data.list.concat(json.data.special_list);
                    list.forEach(item => {
                        medalMap.set(item.medal.medal_id, new Medal(item));
                    });
                    let detail = {
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
        let actionCount = 0;
        let finished = 0;
        for (let entry of medalDetail) {
            let medal = entry[1];
            if (blackList.includes(medal.userId()) || (whiteList.length && !whiteList.includes(medal.userId()))) {
                finished++;
                continue;
            }
            if (medal.isNotAttended()) {
                if (medal.isLive()) {
                    console.log(`自动续牌-${medal.userName()}正在直播，已跳过`);
                    continue;
                }
                if (medal.isNotCheckedIn()) {
                    // 弹幕打卡
                    messageQueue.sendDanmu(medal);
                    actionCount++;
                }
                if (medal.intimacyEarnable()) {
                    if (medal.isNotLiked()) {
                        // 点赞打卡
                        // for (let i = 0; i < 3; i++) {
                        messageQueue.triggerInteract("likeInteract", 1000, likeInteract, medal);
                        // }
                        actionCount++;
                    }
                    // if (medal.isNotShared()) {
                    //     shareList.push(medal);
                    //     actionCount++;
                    // }
                }
            } else {
                finished++;
            }
        };
        // 分享打卡
        let gap = 1000;
        if (shareList.length <= 5) {
            gap = 6000;
        }
        for (let i = 0; i < 5; i++) {
            shareList.forEach(medal => {
                messageQueue.triggerInteract("shareInteract", gap, shareInteract, medal);
            });
        }
        if (finished == medalDetail.size) {
            GM_setValue("finished", today);
            let tomorrow = new Date(new Date().toLocaleDateString()).getTime() + 86410000;
            setTimeout(main, tomorrow - Date.now());
            return;
        } else if (actionCount == 0) {
            loopTimes++;
        }
        // 清理队列
        let timeout = messageQueue.lastone - Date.now() + 5000;
        setTimeout(main, loopTimes++ == 0 || timeout > 600000 ? timeout : 600000);
    }

    async function likeInteract(medal) {
        console.log(`自动续牌-给 ${medal.userName()} 点赞`);
        if (SHUTUP) { return; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "sec-ch-ua": "Mozilla/5.0 BiliDroid/6.73.1 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6731100 channel/pairui01 innerVer/6731100 osVer/11 network/2",
                },
                "body": `roomid=${medal.roomId()}&csrf_token=${JCT}&csrf=${JCT}&visit_id=`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    let count = +medal.getLikedCount();
                    medal.setLikedCount(++count);
                    if (json.code == json.message) {
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
        if (SHUTUP) { return; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/TrigerInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                },
                "body": `roomid=${medal.roomId()}&csrf_token=${JCT}&csrf=${JCT}&interact_type=3`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    let count = +medal.getSharedCount();
                    medal.setSharedCount(++count);
                    if (json.code == json.message) {
                        resolve(true);
                    } else {
                        console.warn(`自动续牌-${medal.userName()}的直播间分享失败`, json);
                        resolve(false);
                    }
                    saveRecords(medal);
                });
        });
    }

    async function sendMsg(item) {
        if (SHUTUP) { return; }
        let msg;
        let uid = item.userId();
        let medalStatus = false;
        // 需要戴粉丝牌才能发言
        if (item.getCheckInReason() == "-403") {
            medalStatus = true;
            await wearMedal(item.medalId());
        }
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
        formData.set("msg", msg);
        formData.set("roomid", item.roomId());
        formData.set("rnd", Math.floor(new Date() / 1000));
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
                // 10024: 拉黑
                // 10030: 弹幕发送过快
                // 1003: 禁言
                // -403: 主播设置了发言门槛
                // -111: csrf过期
                switch (result.code) {
                    case 0:
                        if (result.code == result.msg) {
                            item.setCheckInCount(3);
                            break;
                        } else if (result.msg == "k") {
                            if (count == 0) {
                                // 有些房间把打卡设置为了屏蔽词
                                // customDanmu[uid] = msg.replace("打卡", "");
                            } else {
                                // 表情包-泪目
                                customDanmu[uid] = "official_103";
                            }
                            count -= 0.3; // 给多几次机会
                        }
                        item.setCheckInCount(++count);
                    case 10030:
                        item.setCheckInReason(result.code);
                        break;
                    case -111:
                        JCT = document.cookie.match(/bili_jct=(\w*); /)[1];
                        return;
                    case 1003:
                    case 10024:
                        item.setForceStopTimestamp(today);
                        item.setCheckInCount(count + 2);
                    case -403:
                        item.setCheckInCount(++count);
                    default:
                        item.setCheckInReason(result.code);
                        item.setCheckInCount(++count);
                        break;
                }
                saveRecords(item);
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

    function getRecords(medalId) {
        return GM_getValue(medalId, {});
    }

    async function saveRecords(medal) {
        return GM_setValue(medal.medalId(), {
            checkIn: medal.checkIn,
            liked: medal.liked,
            shared: medal.shared,
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
        if (records.forceStop && records.forceStop.timestamp == today) {
            this.forceStop = records.forceStop;
        } else {
            this.forceStop = {
                timestamp: undefined,
            };
        }
    }

    // 基础
    Medal.prototype.isZero = function () { return this.info.medal.today_feed < 99; };
    Medal.prototype.isLighted = function () { return this.info.medal.is_lighted; };
    Medal.prototype.isDarkened = function () { return !this.info.isLighted; };
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
    Medal.prototype.isAttended = function () { return this.forceStop.timestamp == today || this.wasGuard() ? this.isLighted() : this.info.medal.today_feed >= 200 || (this.isCheckedIn() && this.isShared() && this.isLiked()); };
    Medal.prototype.isNotCheckedIn = function () { return !this.isCheckedIn(); };
    Medal.prototype.isNotAttended = function () { return !this.isAttended(); };
    Medal.prototype.isNotShared = function () { return !this.isShared(); };
    Medal.prototype.isNotLiked = function () { return !this.isLiked(); };
    Medal.prototype.isNotLive = function () { return !this.isLive(); };
    Medal.prototype.isNotZero = function () { return !this.isZero(); };
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

    function addLikeBtn() {
        let deadline = Date.now() + 3000;
        (function addBtn() {
            if (!document.querySelector(".right-ctnr .icon-font.icon-good-1")) {
                let icon = document.querySelector(".icon-font.icon-share");
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
                        "body": `roomid=${roomInfo.room_id}&csrf_token=${JCT}&csrf=${JCT}&visit_id=`,
                        "method": "POST",
                        "mode": "cors",
                        "credentials": "include"
                    })
                        .then(response => response.json())
                        .then(json => {
                            console.log("自动打卡-点赞结果：", json);
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