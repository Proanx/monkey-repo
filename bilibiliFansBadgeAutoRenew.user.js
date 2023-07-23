// ==UserScript==
// @name         b站自动续牌
// @namespace    http://tampermonkey.net/
// @version      0.3.3
// @description  发送弹幕+点赞+挂机观看 = 1500亲密度，仅会在不开播的情况下打卡
// @author       Pronax
// @include      /:\/\/live.bilibili.com(\/blanc)?\/\d+/
// @include      /:\/\/t.bilibili.com/
// @exclude      /:\/\/t.bilibili.com\/\d+/
// @icon         http://bilibili.com/favicon.ico
// @require      https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js
// @require      https://greasyfork.org/scripts/447940-biliveheartwithtimeparam/code/BiliveHeartWithTimeParam.js?version=1071313
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(async function () {
    'use strict';

    // 自定义参数部分 -------------------------------------------

    // 打卡模式可选：
    // ps: 舰长只有掉舰并且7天没有互动后牌子灰了才需要打卡
    //  默认 -> 未开播时发送一次弹幕、点赞一次、挂观看直到1500亲密度满
    //  无痕 -> 不发送弹幕、点赞一次、挂观看直到1500亲密度满（副作用：7天内没有任何互动的直播间牌子会变灰）
    //  常亮 -> 牌子灰了时发送弹幕续牌，其余时间同 无痕 的行为模式相同
    //  低保 -> 牌子灰了时发送弹幕续牌，其余时间不做任何事（副作用：每日首次发送弹幕会有100亲密度）
    const 全局打卡模式 = "默认";

    // 粉丝牌打卡顺序
    // Truthy-倒序-从粉丝牌等级低到高
    // Falsey-正序-从粉丝牌等级高到低
    const ascending = true;

    // 根据uid自定义打卡模式
    let customMode = {
        // 示例：208259: "低保",
    }
    // uid白名单   与黑名单同时配置时黑名单优先
    let whiteList = [
        // 只有在名单内的人才会打卡
        // 格式: uid,
        // 举例: 672328094,
    ];
    // uid黑名单   与白名单同时配置时黑名单优先
    let blackList = [
        // 在名单内的人不会打卡
        // 格式: uid,
        // 举例: 672328094,
    ];
    // 自定义打卡文字
    let customDanmu = {
        // 配置了此项的直播间会忽略打卡模式设定，至少发送一次弹幕
        // ps：支持表情弹幕，弹幕内容填入对应emoticon_unique即可
        // 格式: uid:"弹幕内容",
        // 举例: 437744340: "王哥我爱你王哥",
    };

    // 自定义参数end -------------------------------------------

    const Setting = {
        get UID() {
            return document.cookie.match(/DedeUserID=(\d*); /)[1]
        },
        get TOKEN() {
            let regex = document.cookie.match(/bili_jct=(\w*); /);
            return regex && regex[1];
        },
        get Beijing_date() {    // eg. 2022/10/15
            return new Date(this.Beijing_ts).toLocaleDateString("zh-CN");
        },
        get Beijing_ts() {
            let local = new Date();
            let diff = (local.getTimezoneOffset() - this.Beijing_timezoneOffset) * 60 * 1000;
            return local.valueOf() + diff;
        },
        get Beijing_timezoneOffset() {
            return -480;
        }
    }

    if (!Setting.TOKEN) {
        console.log("自动续牌-未登录账号");
        return;
    }

    const 拦截请求 = false;     // 测试用的，为true时会拦截打卡的网络请求

    let today = Setting.Beijing_date;

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

    let watchingList = new Set();
    let messageQueue = {   // timeout消费队列
        queueInfo: {
        },
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
    };
    let emojiList = ["੭ ᐕ)੭*⁾⁾打卡", "|•'▿'•)✧打卡", "_(:3ゝ∠)_打卡", "ᕕ( ´Д` )ᕗ打卡", "( TロT)σ打卡", "( ☉д⊙)打卡", "打卡o(￣ヘ￣o＃)", "(╯°口°)╯打卡！", "( ｣ﾟДﾟ)｣＜打卡"];
    let formData = new FormData();
    formData.set("bubble", 0);
    formData.set("color", 16777215);
    formData.set("mode", 1);
    formData.set("fontsize", 25);

    setTimeout(main, 1000);
    // 运行部分结束

    async function main(pageNum = 1) {
        console.log("上次20级以下亲密度总和", GM_getValue(`intimacy-${Setting.UID} ${today}`));
        today = Setting.Beijing_date;
        if (GM_getValue(`finished-${Setting.UID}`) == today) {  // 已完成打卡
            let tomorrowDiff = (new Date(Setting.Beijing_date).getTime() + 86410000) - Setting.Beijing_ts;
            setTimeout(main, tomorrowDiff);
            let localeDiff = new Date(Date.now() + tomorrowDiff).toLocaleString("zh-CN");
            console.log(`自动续牌-今日已打卡完毕，北京时间明天0点（当地时间${localeDiff}）会开始下一轮打卡`);
            return;
        };
        let pageInfo;
        if (ascending) {
            pageInfo = await getMedalPageInfo();
        }
        let result = undefined;
        let unfinished = 0;
        // 每日最高亲密度总和
        let totalIntimacy = 0;
        do {
            if (ascending) {
                console.log(`自动续牌-开始打卡，倒序加载第 ${pageInfo.nextPage} 页`);
                result = await getMedalDetail(pageInfo.nextPage--);
                if (pageInfo.totalPage == pageInfo.nextPage + 1) {  // 第一页的时候把最新获取放进去一起消费
                    result.list = pageInfo.latest.concat(result.list);
                }
            } else {
                console.log(`自动续牌-开始打卡，正在加载第 ${pageNum} 页`);
                result = await getMedalDetail(pageNum++);
            }

            // 统计一下亲密度上限
            for (let item of result.list) {
                if (item.wasGuard) { continue; }
                totalIntimacy += item.intimacy;
                // console.log(`${item.name}今日亲密度：${item.intimacy}`);
            }

            unfinished += checker(result.list, result.list.length >= 200);
            // 睡一会防止消费未开始直接翻页
            await sleep(1000);
            // 等这一页的打卡任务都完成后再进行翻页
            await messageQueue.hangingUp("likeInteract");
            await messageQueue.hangingUp("sendDanmu");
        } while (result.hasNext);

        console.log("当前20级以下亲密度总和", totalIntimacy);
        GM_setValue(`intimacy-${Setting.UID} ${today}`, totalIntimacy);

        if (unfinished == 0) {
            if (!拦截请求) {
                GM_setValue(`finished-${Setting.UID}`, today);
            }
            let tomorrowDiff = (new Date(Setting.Beijing_date).getTime() + 86410000) - Setting.Beijing_ts;
            setTimeout(main, tomorrowDiff);
            let localeDiff = new Date(Date.now() + tomorrowDiff).toLocaleString("zh-CN");
            console.log(`自动续牌-今日已打卡完毕，北京时间明天0点（当地时间${localeDiff}）会开始下一轮打卡`);
        } else {
            let gap = 60 * 1000 * 10;
            setTimeout(main, gap);
            console.log(`自动续牌-预计 ${new Date(Date.now() + gap).toLocaleTimeString()} 执行下一轮打卡`);
        }
    }

    // 获取初始化的徽章列表
    async function getMedalDetail(pageNum = 1) {
        let data = await getFansMedal(pageNum);
        // 最近获得、当前房间、当前佩戴会在这个特殊列表内，需要添加到总列表当中
        let list = [];
        let ts = new Date().toLocaleTimeString("zh-CN");
        for (const item of data.list.concat(data.special_list)) {
            list.push(new Medal(item, ts));
        }
        data.page_info.total_number = data.total_number;
        if (ascending) {
            list.reverse();
        }
        let detail = {
            list: list,
            hasNext: ascending ? pageNum > 1 && pageNum <= data.page_info.total_page : pageNum >= 1 && pageNum < data.page_info.total_page,
            nextPage: ascending ? pageNum - 1 : pageNum + 1,
            currentPage: data.page_info.current_page,
        };
        return detail;
    }

    // 获取徽章分页详细
    async function getMedalPageInfo(pageSize = 50) {
        let data = await getFansMedal(1, 1);
        let result = {
            "totalNumber": data.total_number
        };
        result["hasMore"] = result["totalNumber"] > pageSize;
        result["totalPage"] = Math.ceil(result["totalNumber"] / pageSize);
        result["nextPage"] = result["totalPage"]; // 倒序第一页
        // 最新获取和当前佩戴的徽章会被放在special_list中，而且只有访问第一页的时候才会有值，所以这里抓取出来用于倒序时遍历
        let ts = new Date().toLocaleTimeString("zh-CN");
        let list = data.special_list;
        for (let index = 0; index < list.length; index++) {
            const element = list[index];
            list[index] = new Medal(element, ts);
        }
        result["latest"] = list;
        return result;
    }

    // 获取徽章列表
    async function getFansMedal(pageNum = 1, pageSize = 50) {
        return new Promise((resolve, reject) => {
            fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/panel?page=${pageNum}&page_size=${pageSize}`, {
                credentials: 'include'
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code != json.message) {
                        console.error(`自动续牌-获取徽章列表失败：页数${pageNum} size${pageSize}`, json);
                        reject(json);
                    }
                    resolve(json.data);
                })
        });
    }

    // 遍历查看是否已经打卡完成
    function checker(medalDetail, sync) {
        let shareList = [];
        let finished = 0;
        for (let medal of medalDetail) {
            // 判断黑名单、白名单、是否已完成打卡
            if (blackList.includes(medal.uid) || (whiteList.length && !whiteList.includes(medal.uid)) || medal.isFinished) {
                finished++;
                continue;
            }
            // 行为参数
            let action = {
                "danmu": medal.customDanmu && medal.isNotCheckIn,
                "like": false,
                "watch": false,
                "share": false,
                get finished() {
                    return !(this.danmu || this.like || this.watch || this.share);
                }
            }
            let 打卡模式 = customMode[medal.uid] || 全局打卡模式;

            switch (打卡模式) {
                case "常亮":
                    if (medal.isNotLighted) {
                        action.danmu = true;
                    }
                case "无痕":
                    if (medal.onlyFans) {
                        if (medal.isNotLiked) {
                            action.like = true;
                        }
                        if (medal.isNotWatched) {
                            action.watch = true;
                        }
                    }
                    break;
                case "低保":
                    if (medal.isNotLighted) {
                        action.danmu = true;
                    }
                    break;
                case "默认":
                default:
                    if (medal.onlyFans) {
                        if (medal.isNotCheckIn) {
                            action.danmu = true;
                        }
                        if (medal.isNotLiked) {
                            action.like = true;
                        }
                        if (medal.isNotWatched) {
                            action.watch = true;
                        }
                    } else if (medal.isNotCheckIn && medal.isNotLighted) {
                        action.danmu = true;
                    }
            }

            if (action.finished) {
                finished++;
                continue;
            } else if (medal.isStreaming) {    // 直播时不打卡
                console.log(`自动续牌-${medal.name}正在直播，已跳过`);
                continue;
            }

            if (action.danmu) {
                // 弹幕
                messageQueue.triggerInteract("sendDanmu", sendMsg, medal, sync ? 5000 : 1000);
            }
            if (action.like) {
                // 点赞
                messageQueue.triggerInteract("likeInteract", likeInteract, medal, sync ? 6000 : 1200);
            }
            if (action.watch) {
                // 观看
                if (!(watchingList.has(medal.rid) ||
                    (messageQueue.queueInfo["watchLive"] != undefined &&
                        messageQueue.queueInfo["watchLive"].queue.length + watchingList.size >= 50))) {
                    messageQueue.triggerInteract("watchLive", watchLive, medal, 1000);
                }
            }
            if (action.share) {
                // 分享
                shareList.push(medal);
            }
        };
        // // 分享打卡
        // let gap = 1000;
        // if (shareList.length <= 5) {
        //     gap = 10000;
        // }
        // // 分享五次
        // for (let i = 0; i < 5; i++) {
        //     shareList.forEach(medal => {
        //         messageQueue.triggerInteract("shareInteract", shareInteract, medal, gap);
        //     });
        // }

        // 用于完成后保存标志
        return medalDetail.length - finished;
    }

    async function likeInteract(medal) {
        console.log(`自动续牌-给 ${medal.name} 点赞`);
        if (拦截请求) { return true; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-ucenter/v1/interact/likeInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                    "sec-ch-ua": "Mozilla/5.0 BiliDroid/6.73.1 (bbcallen@gmail.com) os/android model/Redmi K30 Pro mobi_app/android build/6731100 channel/pairui01 innerVer/6731100 osVer/11 network/2",
                },
                "body": `roomid=${medal.rid}&csrf_token=${Setting.TOKEN}&csrf=${Setting.TOKEN}&visit_id=`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code == json.message) {
                        medal.liked.count++;
                        resolve(true);
                        saveRecords(medal);
                    } else {
                        console.warn(`自动续牌-${medal.name}点赞失败`, json);
                        resolve(false);
                    }
                });
        });
    }

    async function shareInteract(medal) {
        console.log(`自动续牌-分享 ${medal.name} 的直播间`);
        if (拦截请求) { return true; }
        return new Promise((resolve, reject) => {
            fetch("https://api.live.bilibili.com/xlive/web-room/v1/index/TrigerInteract", {
                "headers": {
                    "content-type": "application/x-www-form-urlencoded",
                },
                "body": `roomid=${medal.rid}&csrf_token=${Setting.TOKEN}&csrf=${Setting.TOKEN}&interact_type=3`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
                .then(response => response.json())
                .then(json => {
                    if (json.code == json.message) {
                        medal.shared.count++;
                        saveRecords(medal);
                        resolve(true);
                    } else {
                        console.warn(`自动续牌-${medal.name}的直播间分享失败`, json);
                        resolve(false);
                    }
                });
        });
    }

    async function watchLive(medal) {
        console.log(`自动续牌-开始挂机观看 ${medal.name} 的直播间`);
        if (拦截请求) { return true; }
        return new Promise(async (resolve, reject) => {
            let rid = medal.rid;
            let roomHeart = new RoomHeart(rid, (14 - medal.watchCount) * 5 + 1);
            roomHeart.doneFunc = () => {
                watchingList.delete(rid);
            }
            roomHeart.errorFunc = () => {
                watchingList.delete(rid);
            }
            watchingList.add(rid);
            let result = await roomHeart.start();
            if (!result) {
                medal.watched.count = 15;
                saveRecords(medal);
                console.log(`自动续牌-${medal.name}的直播间没有设置分区，取消观看`);
            }
            resolve(true);
        });
    }

    async function sendMsg(item) {
        if (拦截请求) { console.log(`自动续牌-给 ${item.name} 发送弹幕打卡`); return true; }
        let msg;
        let uid = item.uid;
        let medalStatus = false;
        // 需要戴粉丝牌才能发言
        if (item.checkIn.failedReason == "-403") {
            medalStatus = true;
            await wearMedal(item.medalId);
        }
        // 查询自定义内容
        msg = customDanmu[uid] || emojiList[(Math.random() * 100 >> 0) % emojiList.length];
        let reg = new RegExp(`\(official\|room_${item.rid}\)_\\d+`);
        // 判断内容符合表情包则添加表情标识
        if (msg.match(reg)) {
            formData.set("dm_type", 1);
        } else {
            formData.delete("dm_type");
        }
        formData.set("csrf", Setting.TOKEN);
        formData.set("csrf_token", Setting.TOKEN);
        formData.set("msg", msg);
        formData.set("roomid", item.rid);
        formData.set("rnd", Math.floor(new Date() / 1000));
        return new Promise((resolve) => {
            fetch("//api.live.bilibili.com/msg/send", {
                credentials: 'include',
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(async result => {
                    console.log("自动续牌-打卡结果：", item.name, result);
                    if (medalStatus) {
                        await takeOff();
                    }
                    let count = +item.checkIn.count;
                    let returnValue = false;
                    // 10203: 弹幕表情发送失败（不存在）
                    // 10024: 拉黑
                    // 10030: 弹幕发送过快
                    // 10031: 弹幕发送过快
                    // 1003: 禁言
                    // -403: 主播设置了发言门槛
                    // -111: csrf过期
                    switch (result.code) {
                        case 0:
                            if (result.code == result.msg) {
                                item.checkIn.count = 3;
                                returnValue = true;
                                break;
                            } else if (result.msg == "k" || result.msg[0] == "f") {    // 敏感词
                                // 表情包-泪目
                                customDanmu[uid] = "official_103";
                                count -= 0.3; // 给多几次机会
                            }
                            item.checkIn.count = ++count;
                        case 10030:
                        case 10031:
                            item.checkIn.failedReason = result.code;
                            break;
                        case -111:
                            // 不应该出现
                            console.warn("token过期");
                            break;
                        case 10203:
                            console.error(`自动续牌-用户 ${item.name}（${uid}）的自定义表情 ${customDanmu[uid]} 已失效！`);
                            customDanmu[uid] = "official_103";  // 表情包-泪目
                            item.checkIn.count = ++count;
                            item.checkIn.failedReason = result.code;
                            break;
                        case 10024:
                        // 拉黑了也可以挂直播
                        // item.forceStop.timestamp = today;
                        case 1003:
                            count = 3;
                            returnValue = true;
                        case -403:
                            count += 1.6;
                        default:
                            item.checkIn.count = ++count;
                            item.checkIn.failedReason = result.code;
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
            params.set("csrf_token", Setting.TOKEN);
            params.set("csrf", Setting.TOKEN);
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
            params.set("csrf_token", Setting.TOKEN);
            params.set("csrf", Setting.TOKEN);
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

    async function sleep(ms = 500) {
        return new Promise(r => {
            if (ms <= 0) { r(true); }
            setTimeout(() => {
                r(true);
            }, ms);
        });
    }

    function getRecords(medalId) {
        return GM_getValue(`${medalId}-${Setting.UID}`, {});
    }

    async function saveRecords(medal) {
        return GM_setValue(`${medal.medalId}-${Setting.UID}`, medal.toObject());
    }

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
                        "body": `roomid=${roomInfo.room_id}&csrf_token=${Setting.TOKEN}&csrf=${Setting.TOKEN}&visit_id=`,
                        "method": "POST",
                        "mode": "cors",
                        "credentials": "include"
                    })
                        .then(response => response.json())
                        .then(json => {
                            console.log("自动打卡-点赞结果：", json);
                            // 成功的话就给点赞次数+1
                            if (json.code == json.message && fansMedalInfo) {
                                let record = getRecords(fansMedalInfo.medal_id);
                                if (record.liked && record.liked.timestamp == today) {
                                    record.liked.count++;
                                } else {
                                    record.liked = {
                                        count: 1,
                                        timestamp: today,
                                    };
                                }
                                GM_setValue(`${fansMedalInfo.medal_id}-${Setting.UID}`, record);
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

    class Medal {
        #user_id;
        #user_name;
        #medal_id;
        #medal_name;
        #medal_level;
        #room_id;
        #today_feed;
        #is_lighted;
        #is_streaming;
        #is_guard;

        #ts;

        #check_in;
        #like;
        #share;
        #watch;
        #force_stop;

        get timestamp() {
            return this.#ts;
        }

        get uid() {
            return this.#user_id;
        }
        get name() {
            return this.#user_name;
        }
        get medalId() {
            return this.#medal_id;
        }
        get medalName() {
            return this.#medal_name;
        }
        get medalLevel() {
            return this.#medal_level;
        }
        get rid() {
            return this.#room_id;
        }
        get intimacy() {
            return this.#today_feed;
        }
        get isLighted() {
            return this.#is_lighted;
        }
        get isStreaming() {
            return this.#is_streaming;
        }
        get isGuard() {
            return this.#is_guard;
        }

        get isNotLighted() {
            return !this.isLighted;
        }
        get isNotStreaming() {
            return !this.isStreaming;
        }
        get isNotGuard() {
            return !this.isGuard;
        }

        get checkIn() { return this.#check_in; }
        get liked() { return this.#like; }
        get shared() { return this.#share; }
        get watched() { return this.#watch; }
        // get forceStop() { return this.#force_stop; }

        get isCheckIn() {
            return this.#check_in.count >= 3 || (this.intimacy >= 100 && this.isNotLiked && this.isLighted);
        }
        get isLiked() {
            return this.#like.count >= 1;
        }
        get isShared() {
            return this.#share.count >= 5;
        }
        get isWatched() {
            return this.#watch.count >= 15;
            // || this.watchCount >= 15;
        }
        get isFinished() {
            if (this.forceStop) {
                return true;
            }
            if (this.wasGuard) {
                return this.customDanmu ? this.isCheckIn : this.isLighted;
            }
            return this.intimacy >= 1500;
        }
        get forceStop() {
            return this.#force_stop.timestamp != undefined;
        }
        get wasGuard() {
            return this.#medal_level > 20;
        }
        get onlyFans() {    // 乛◡乛
            return this.#medal_level <= 20;
        }
        get customDanmu() {
            return customDanmu[this.uid];
        }
        get watchCount() {
            // 计算真实观看次数
            let watchTimes = Math.floor(this.intimacy / 100);
            this.isCheckIn && watchTimes--;
            this.isLiked && watchTimes--;
            return watchTimes;
        }

        get isNotCheckIn() {
            return !this.isCheckIn;
        }
        get isNotLiked() {
            return !this.isLiked;
        }
        get isNotShared() {
            return !this.isShared;
        }
        get isNotWatched() {
            return !this.isWatched;
        }

        toObject() {
            return {
                checkIn: this.#check_in.toObject(),
                liked: this.#like.toObject(),
                shared: this.#share.toObject(),
                watched: this.#watch.toObject(),
                forceStop: this.#force_stop.toObject(),
            }
        }

        constructor(detail, timestamp = new Date().toLocaleTimeString("zh-CN")) {
            this.#user_id = detail.medal.target_id;
            this.#user_name = detail.anchor_info.nick_name;
            this.#medal_id = detail.medal.medal_id;
            this.#medal_name = detail.medal.medal_name;
            this.#medal_level = detail.medal.level;
            this.#room_id = detail.room_info.room_id;
            this.#today_feed = detail.medal.today_feed;
            this.#is_lighted = detail.medal.is_lighted == 1;
            this.#is_streaming = detail.room_info.living_status == 1;
            this.#is_guard = detail.medal.guard_level != 0;
            this.#ts = timestamp;

            let records = getRecords(detail.medal.medal_id);
            this.#check_in = new CheckIn(records.checkIn);
            this.#like = new Like(records.liked);
            this.#share = new Share(records.shared);
            this.#watch = new Watch(records.watched);
            this.#force_stop = new ForceStop(records.forceStop);
        }

    }
    class Watch {
        #count = 0;
        #timestamp;

        set count(val) {
            this.#count = val;
        }
        get count() {
            return this.#count;
        }
        get timestamp() {
            return this.#timestamp;
        }
        toObject() {
            return {
                count: this.#count,
                timestamp: this.#timestamp,
            };
        }

        constructor(detail) {
            this.#timestamp = today;
            if (detail && detail.timestamp == today) {
                this.#count = detail.count;
            }
        }
    }
    class CheckIn {
        #count = 0;
        #failed_reason = undefined;
        #timestamp;

        set count(val) {
            this.#count = val;
        }
        get count() {
            return this.#count;
        }
        set failedReason(val) {
            this.#failed_reason = val;
        }
        get failedReason() {
            return this.#failed_reason;
        }
        get timestamp() {
            return this.#timestamp;
        }
        toObject() {
            return {
                count: this.#count,
                failedReason: this.#failed_reason,
                timestamp: this.#timestamp,
            };
        }

        constructor(detail) {
            this.#timestamp = today;
            if (detail && detail.timestamp == today) {
                this.#count = detail.count;
                this.#failed_reason = detail.failed_reason;
            }
        }
    }
    class ForceStop {
        #timestamp = undefined;

        set timestamp(val) {
            this.#timestamp = val;
        }
        get timestamp() {
            return this.#timestamp;
        }
        toObject() {
            return {
                timestamp: this.#timestamp,
            };
        }

        constructor(detail) {
            if (detail && detail.timestamp == today) {
                this.#timestamp = today;
            }
        }
    }
    class Like {
        #count = 0;
        #timestamp;

        set count(val) {
            this.#count = val;
        }
        get count() {
            return this.#count;
        }
        get timestamp() {
            return this.#timestamp;
        }
        toObject() {
            return {
                count: this.#count,
                timestamp: this.#timestamp,
            };
        }

        constructor(detail) {
            this.#timestamp = today;
            if (detail && detail.timestamp == today) {
                this.#count = detail.count;
            }
        }
    }
    class Share {
        #count = 0;
        #timestamp;

        set count(val) {
            this.#count = val;
        }
        get count() {
            return this.#count;
        }
        get timestamp() {
            return this.#timestamp;
        }
        toObject() {
            return {
                count: this.#count,
                timestamp: this.#timestamp,
            };
        }

        constructor(detail) {
            this.#timestamp = today;
            if (detail && detail.timestamp == today) {
                this.#count = detail.count;
            }
        }
    }

})();