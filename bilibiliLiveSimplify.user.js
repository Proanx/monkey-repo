// ==UserScript==
// @name         b站直播聊天室简化
// @namespace    http://tampermonkey.net/
// @version      0.2.6
// @description  简化聊天室，就喜欢方方正正的
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let chatBox = document.querySelector("#chat-items");
    if (!chatBox) { return; }

    // 改为Falsy值就可以关闭滚动窗口信息添加到弹幕区
    let infoPersistence = true;
    // 改为Falsy值就可以关闭显示弹幕区底部滚动条
    let displayBrushPrompt = false;
    // 改为Falsy值就可以关闭显示弹幕中的头衔图片
    let displayTitleLabel = false;
    // 居中修复，改为任意Truthy值打开，用于在高分屏上修复粉丝牌、房管等文字没有居中的问题
    let verticalAlign = 1;

    let userId = getUserID();
    let giftSendMap = new Map();


    if (!displayBrushPrompt) {
        // 隐藏滚动框
        GM_addStyle(".chat-history-panel .brush-prompt {display:none;}");
        GM_addStyle(".chat-history-panel .chat-history-list.with-brush-prompt {height: 100% !important}");
    }
    if (!displayTitleLabel) {
        // 隐藏头衔
        GM_addStyle(".chat-history-panel .chat-history-list .chat-item.danmaku-item .title-label {display:none;}");
    }
    // 区别自己发送的弹幕
    if (userId) {
        GM_addStyle(`.chat-item.danmaku-item:not(.superChat-card-detail)[data-uid="${userId}"] {border-color: #ccc !important;box-shadow: 0 0 3px 0px #ddd;}`);
    }
    // 居中修复
    if (verticalAlign) {
        GM_addStyle(`
			/* 主播标志 房管标志 */
			.chat-history-panel .chat-history-list .chat-item.danmaku-item .anchor-icon,
			.chat-history-panel .chat-history-list .chat-item.danmaku-item .admin-icon {
				/* 高分屏居中 */
				display: flex;
				align-items: center;
			}
		`);
    }

    // 标题栏
    GM_addStyle(".live-room-app .app-content{padding-top:70px !important}");
    GM_addStyle(".head-info-section{height:78px!important}.head-info-section>.header-info-ctnr{padding:6px}.head-info-section .right-ctnr{right:5px}");
    // 礼物栏
    GM_addStyle("#gift-control-vm{height: 120px;}.gift-control-panel {height: 110px!important;}");
    // 弹幕部分
    GM_addStyle(":root{--danmu_width:282px}.chat-history-panel .chat-history-list .last-danmu-timestamp,.chat-history-panel .chat-history-list .chat-item.convention-msg{padding:0 5px;margin:5px 0}.chat-history-panel .chat-history-list .last-danmu-timestamp>span{color:var(--success_green);margin-right:4px;line-height:20px}.chat-history-panel .chat-history-list{padding:5px 8px}.chat-history-panel .chat-history-list.with-brush-prompt{height:calc(100% - 25px);padding-bottom:0}.chat-history-panel .danmaku-buffer-prompt{bottom:60px;position:relative;border-radius:20px;width:130px;opacity:.85;margin:0 auto}.chat-history-panel .chat-history-list .chat-item.danmaku-item:not(.superChat-card-detail){border:1px solid #e8e8e8;display:block!important;width:var(--danmu_width)!important;box-sizing:border-box;border-radius:5px;margin:3px 0!important;padding:5px 0 3px 5px;background-color:#fdfdfd!important}.chat-history-panel .chat-history-list .chat-item.danmaku-item .danmaku-item-left{display:block;height:17px}.chat-history-panel .chat-history-list .chat-item.danmaku-item .user-name{float:left;position:relative;top:-4px;color:var(--text3)!important;height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}.chat-history-panel .chat-history-list .chat-item.danmaku-item .user-name:hover{color:var(--brand_blue)!important}.chat-history-panel .chat-history-list .chat-item.danmaku-item .fans-medal-item-ctnr{float:right}.fans-medal-item .fans-medal-label{border-radius:0!important}.chat-history-panel .chat-history-list .chat-item.danmaku-item .fans-medal-item-ctnr:has(.medal-deco){float:right;margin-left:0}.chat-history-panel .chat-history-list .chat-item.danmaku-item .fans-medal-item-ctnr .fans-medal-item{line-height:15px;height:15px}.chat-history-panel .chat-history-list .chat-item .rank-icon{width:25px;height:17px;margin-right:5px;float:right}.chat-history-panel .chat-history-list .chat-item.danmaku-item .danmaku-item-left>*:first-child{margin-left:0}.chat-history-panel .chat-history-list .chat-item.danmaku-item .anchor-icon,.chat-history-panel .chat-history-list .chat-item.danmaku-item .admin-icon{padding:0 2px;float:right}.chat-history-panel .chat-history-list .chat-item .vip-icon{float:right;width:17px;height:17px}.chat-history-panel .chat-history-list .chat-item.danmaku-item .title-label{float:right;bottom:-3px;height:15px;cursor:default}.chat-history-panel .chat-history-list .chat-item.danmaku-item .title-label .live-title-cntr{height:15px!important;opacity:.7}.chat-history-panel .chat-history-list .chat-item.danmaku-item .title-label .hover-panel{display:none!important}.chat-history-panel .chat-history-list .chat-item.danmaku-item .danmaku-item-right{font-size:14px;display:flex;align-items:center;}.chat-history-panel .chat-history-list .chat-item.danmaku-item .emoticon>img{height:25px;}.chat-history-panel .chat-history-list .chat-item.danmaku-item .emoticon.bulge{margin-left:0;height:40px}.chat-history-panel .chat-history-list .chat-item.danmaku-item .emoticon.bulge>img{height:40px;margin-top:-3px}.chat-history-panel .danmaku-menu{padding:6px 8px 5px!important;border-radius:6px!important;margin-left:-130px;text-align:center}.chat-history-panel .chat-history-list .chat-item.top3-notice{box-sizing:border-box;width:var(--danmu_width);margin:5px 0;border-radius:3px;background-image:linear-gradient(134deg,#3023ae99 0,#6e6dd74d 100%)}.chat-history-panel .chat-history-list .chat-item.top3-notice span{line-height:18px}.chat-history-panel .chat-history-list .chat-item.system-msg{margin:10px 0;width:var(--danmu_width);box-sizing:border-box}.chat-history-panel .chat-history-list .chat-item.gift-item{width:var(--danmu_width);border:1px solid #ffdd7f;box-sizing:border-box;border-radius:5px;background-color:#fff5da;margin:5px 0;min-height:52px;display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;padding-left:49px}.chat-history-panel .chat-history-list .chat-item.gift-item .gift-img-div{left:4px;position:absolute}.chat-history-panel .chat-history-list .chat-item.gift-item .gift-fans-medal{position:absolute;right:1px;top:5px}.chat-history-panel .chat-history-list .chat-item.superChat-card-detail{width:var(--danmu_width)}.chat-history-panel .chat-history-list .chat-item.superChat-card-detail .card-item-middle-top{height:50px}.chat-history-panel .chat-history-list .chat-item.superChat-card-detail .card-item-middle-top .card-item-middle-top-right .name{display:block;height:16px;line-height:18px;width:135px;margin-left:0}.chat-history-panel .chat-history-list .chat-item.danmaku-item.superChat-card-detail .card-item-middle-top>.face{width:40px;height:40px;margin-right:5px;border-radius:50%}.chat-history-panel .chat-history-list .chat-item.superChat-card-detail .card-item-middle-top .card-item-middle-top-right .superChat-base{position:absolute;right:7px;top:10px}.chat-history-panel .chat-history-list .chat-item.danmaku-item.superChat-card-detail .card-item-middle-top-right .exp{color:var(--pay_yellow);line-height:16px;display:inline-block;vertical-align:middle}.chat-history-panel .chat-history-list .chat-item.danmaku-item.superChat-card-detail .card-item-middle-top-right .exp>i{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABDBJREFUaAXVWt1rFFcU/92Z3Z3sJiHRxBhNRe0ihSLSF20fBBWDL/og2Pf+A774IKGU0gXf2jcf/RMsQkXwg4IgVKxUUBB9SJssRtGQaLr52J1sZmduz93qujt752Nn713WE8jOPeeee36/O+d+zQzwiQtThZ8/K2QwZBxAzctGtmlhDVP4h7GCF1k3okIqwh7LzDmBL+Iv1NxDsRyqVKvIrtH/b2PVD6lkhNjimxaMw+A8HvgPrXJ+jhcLox+KSX/VEPC84UQA0hhK5NfkpIZAU4O9vow1Bji/auLN822B4KpsBOCB5kDDFrbz14VNqd3LcEx9v8IYC204dBbi85e+ANzLFOAo5XhOGkinkrES9ctNDOICmywsyUIFEuALl/Jw3CfUs13nqSxwRzrGijRaDrGJwobfLziFHPdnZeANC8hM+GO3l70twFmlsL6s4nw/1tlFcvjJ7xRMQKSNKjEHgaGD8Vuz54HyLNVvSX8pnpBZiMfosviYOqqZ/RzI7vO7SPGEEPD797icy8cK2L8EWBpgA5Ek+peAgG6Y/UHAfvMrSn8ew9bynUhAnVbQfgectafYXPkD3KvCeXe3U3yR9bUS4LV1VJZvNkAY1njjWtWFVgLlpRvw3I+LkpGZVIW70Y42Altrj+Fs/N0IJC4Ma2dLWUVBCwGvtorK0u02fIa1q03XrUIDAY7K4nUatLSv8ckncQeqq4/gVIo+6LQmMRMs0+eD2HNWYC//3gZeKAxLbGXU33CFLXKUF3+j1HHkBDTMQPWOkUZLoKz++wA1+2Wgp2GJKdSDV5mjFfk2PLs9zQKdQwxh54EQt1YTdzdgvw1fZZ3SQ5QeToO7lbozM3MYPXxL5FZrYx2WFBGw6cjsNkIbBIqLv6aZSIyPZmHikGPQjrNLUULAyOzA8GffQcz/qYHdMGi2WV+4gtrmYiC8XH6GbN0PQSUEBMpUbp/4aYgnzrYBYk2cQXqb9IQY4BGs7r4LZG1zh/ZAtsxS307k9l+Q2pIotRAI6n3xDGcw/wMg8l+RaCJQksKzJs8hNXpEakuq1EOABrNfzIEpZPee96u7LveEAAND7sCPlDrR7z46ZaSHgG8GssaOIzX8VafYYtXXTsCkNSE7cToWmCSV9BBw1+pYROoM7jqrZMUNIqeFQHroS4JOTwfHT8K0poJiK9ErW4mb0WTHp5EdO0GnmOgHU81+Sa613IE6EBXgefRbWH0EknRnsw9tR+jQ0KyRXvcvAcm5WsYghABbljn0RGe/AOw5fygpnrBBfJ9aoDlQgdTK9MbleXRD4gAktiHvT20tDgwCT5uEEZihZyGnlLyd5PRtgejVxMIWMIJfZO6BKcTyhVmk8DWRuEfzYftTKllrqnWMlSn+NZjpb9hY4f/V0ReD+crSYv1jjlepHVKjLiWvcezBYtQXLf8BGOoetC6LwK8AAAAASUVORK5CYII=);background-size:cover;background-position:center center;width:14px;height:14px;display:inline-block;position:relative;top:2px}.chat-history-panel .chat-history-list .chat-item.danmaku-item.superChat-card-detail .exp>span{font-size:12px;color:#999}.chat-history-panel .chat-history-list .chat-item.common-danmuku-msg{margin:8px auto;padding:0 6px!important}.chat-history-panel .chat-history-list .chat-item.important-prompt-item{padding:0 5px;margin:5px 0;width:var(--danmu_width);box-sizing:border-box;font-size:12px}.chat-history-panel .brush-prompt{bottom:1px;overflow-y:hidden;display:none}.chat-history-panel .brush-prompt .brush-prompt-item{padding:4px 13px;height:18px;line-height:18px}.chat-history-panel .chat-history-list .chat-item.important-prompt-item>.gift-frame-div{float:left}.chat-history-panel .chat-history-list .chat-item.important-prompt-item .gift-frame{margin-right:3px}.chat-history-panel .chat-history-list .important-prompt-item.red-pocket-prompt-item>div,.chat-history-panel .chat-history-list .important-prompt-item.luck-pocket-prompt-item>div{display:inline-block;vertical-align:middle}.chat-history-panel .chat-history-list .chat-item.important-prompt-item>.brush-aggregated-icon{float:left;height:16px;vertical-align:middle;padding:2px 0;padding-right:5px}.chat-history-panel .chat-history-list .chat-item.important-prompt-item .brush-aggregated-total-img{height:8px;vertical-align:middle;padding:2px 0}.chat-history-panel .chat-history-list .chat-item.important-prompt-item .brush-aggregated-number{display:inline-block;vertical-align:middle;font-size:14px;color:#ababab;font-weight:400;font-style:italic}.chat-history-panel .chat-history-list .important-prompt-item .rank-icon{width:24px;height:20px}.chat-history-panel .chat-history-list .important-prompt-item .fans-medal-item-ctnr,.chat-history-panel .chat-history-list .important-prompt-item.enter-prompt-item .fans-medal-item-ctnr{float:right;display:flex;height:20px;align-items:center;margin-right:0!important}.chat-history-panel .chat-history-list .important-prompt-item.enter-prompt-item>span{vertical-align:top}.welcome-section-bottom{display:none}.margin-l5{margin-left:5px!important}");

    // 弹幕监听
    const chatObserver = new MutationObserver(async function (mutationsList) {
        for (const mutationDetail of mutationsList) {
            // if (mutationDetail.type != "childList") { return; }
            for (const node of mutationDetail.addedNodes) {
                // console.log(node);
                if (!node.classList) { continue; }	// 过滤非dom
                let tempVar = undefined;
                switch (node.classList[1]) {
                    // 普通弹幕元素
                    case "danmaku-item":
                        // SC样式
                        if (node.classList.contains("superChat-card-detail")) {
                            // ID颜色对其
                            // node.querySelector(".name").style.color = node.querySelector(".card-item-middle-bottom").style.backgroundColor;
                            // 电池
                            let price = node.querySelector(".card-item-top-right");
                            let ele = document.createElement("i");
                            price.prepend(ele);
                            price.className = "exp";
                            // 价格标签移动到ID旁边
                            node.querySelector(".name").after(price);
                            // 头像
                            ele = document.createElement("div");
                            ele.className = "bg-cover face";
                            node.querySelector(".card-item-middle-top").prepend(ele);
                            setFaceUrl(ele, node.dataset.uid);
                            continue;
                        }
                        // 头衔位置
                        if (tempVar = node.querySelector(".title-label")) {
                            node.querySelector(".danmaku-item-right").append(tempVar);
                        }
                        // 高能榜图标
                        if (tempVar = node.querySelector(".rank-icon")) {
                            node.querySelector(".user-name").before(tempVar);
                        }
                        // 舰长图标边距
                        if (node.querySelector(".medal-deco")) {
                            node.querySelector(".fans-medal-item-target").classList.add("margin-l5");
                        }
                        // 表情弹幕改高清
                        if (tempVar = node.querySelectorAll(".emoticon")) {
                            for (const emoji of tempVar) {
                                let img = emoji.querySelector("img");
                                let index = img.src.lastIndexOf("@");
                                img.src = img.src.substr(0, index);
                            }
                        }
                        // 弹幕全行可触发菜单
                        if (tempVar = node.querySelector(".danmaku-item-right.pointer:not(.open-menu)")) {
                            tempVar.classList.add("open-menu");
                            tempVar.firstChild.classList && tempVar.firstChild.classList.add("open-menu");
                        }
                        // 自己发送的弹幕可以点开菜单（历史弹幕/非网页原始组件 发送的弹幕才有效）
                        if (tempVar = node.querySelector(".user-name.my-self")) {
                            if (node.dataset.ts == 0) {
                                node.querySelector(".danmaku-item-right").classList.remove("pointer");
                            } else {
                                // 用户名
                                tempVar.classList.remove("my-self");
                                tempVar.classList.add("pointer", "open-menu");
                            }
                        }
                        break;
                    // 舰长开通
                    case "system-msg":
                        break;
                    // 通知提示
                    case "convention-msg":
                        // 显示最后一条弹幕发送时间
                        tempVar = document.querySelectorAll(".danmaku-item");
                        if (tempVar.length) {
                            showLastDanmaTime(tempVar[tempVar.length - 1]);
                        }
                        break;
                    // 互动提示
                    case "toast-msg":
                        console.log(node.innerText);
                        if (node.innerText.includes("结束了视频连线")) {
                            setTimeout(() => {
                                let msgList = document.querySelectorAll(".chat-item.toast-msg");
                                msgList.forEach(msg => {
                                    if (msg.innerText.includes("视频连线")) {
                                        msg.remove();
                                    }
                                });
                            }, 6000);
                        }
                        break;
                    // 房间提示
                    case "misc-msg":
                        // 全员禁言
                        if (node.classList[2] == "room-silent") {

                        }
                        // 禁言
                        else if (node.innerText.includes("禁言")) {
                            // 用户名标红
                            node.querySelector("span>span").style.color = "var(--Re6)";
                        }
                        // 粉丝团勋章升级	恭喜 xxx 粉丝勋章刚刚升级至 Lv.x
                        else if (node.innerText.includes("升级")) {

                        }
                        // 加团		恭喜 xxx 成为粉丝团成员
                        else if (node.innerText.includes("成为粉丝团成员")) {

                        }
                        break;
                    // 礼物提示
                    case "gift-item":
                        // 礼物图片
                        if (tempVar = node.querySelector(".gift-frame")) {
                            tempVar = tempVar.parentElement;
                            tempVar.classList.add("gift-img-div");
                            node.querySelector("span.username").before(tempVar);
                        }
                        // 粉丝牌位置
                        if (tempVar = node.querySelector(".fans-medal-item-target")) {
                            let right = tempVar.offsetWidth + 5;
                            tempVar.querySelector(".medal-deco") && (right += 5);
                            node.style.paddingRight = right + "px";
                        }
                        break;
                    case "important-prompt-item":
                        // 高能榜图标
                        if (tempVar = node.querySelector(".rank-icon")) {
                            node.before(tempVar);
                        }
                        // 入场
                        if (node.classList[2] == "enter-prompt-item") {
                        }
                        // 红包
                        else if (node.classList[2] == "red-pocket-prompt-item") {
                            // 仅保留最新的一个
                            tempVar = document.querySelectorAll(".red-pocket-prompt-item");
                            if (tempVar.length > 1) {
                                tempVar[0].remove();
                            }
                        }
                        // 天选
                        else if (node.classList[2] == "luck-pocket-prompt-item") {
                            // 仅保留最新的一个
                            tempVar = document.querySelectorAll(".luck-pocket-prompt-item");
                            if (tempVar.length > 1) {
                                tempVar[0].remove();
                            }
                        }
                        // 免费礼物
                        else if (node.classList[2] == "gift-prompt-item") {
                            // 礼物数量叠加
                            let giftInfo = node.innerText.split("\n × ");
                            let key = giftInfo[0].replaceAll("\n", "");
                            // key存放gift文字说明，value存[dom对象,礼物数量,timeout]
                            if (tempVar = giftSendMap.get(key)) {
                                // 存在说明冷却未过，清除倒计时，刷新数量，重新插入到底部
                                clearTimeout(tempVar[2]);
                                giftInfo[1] = +giftInfo[1] + tempVar[1];
                                tempVar[0].remove();
                                node.querySelector(".count").innerText = ` × ${giftInfo[1]}`;
                            }
                            let timeout = setTimeout(() => {
                                giftSendMap.delete(key);
                            }, 5000);
                            giftSendMap.set(key, [node, +giftInfo[1], timeout]);
                        }
                        break;
                }
            }
        }
    });
    chatObserver.observe(chatBox, {
        attributes: false,
        childList: true,
        subtree: false
    });

    // 滚动条监听
    let enterObserver = new MutationObserver(async function (mutationsList) {
        for (const mutationDetail of mutationsList) {
            // if (mutationDetail.type != "childList") { return; }
            let tempVar = undefined;
            for (const node of mutationDetail.addedNodes) {
                let domType = undefined;
                // 礼物
                if (tempVar = node.querySelector(".count")) {
                    domType = "gift"
                    // 给礼物图片添加class
                    node.querySelector("div.dp-i-block.v-middle").classList.add("gift-frame-div");
                    // 礼物数量居中
                    tempVar.classList.add("v-middle");
                    // 礼物数量符号
                    tempVar.innerText = tempVar.innerText.replace("X", " ×");
                } else if (tempVar = node.querySelector(".brush-aggregated-text")) {
                    // 红包
                    if (tempVar.innerText.includes("红包")) {
                        domType = "red-pocket";
                    }
                    // 天选
                    else {
                        domType = "luck-pocket";
                    }
                }
                // 入场 
                else if (node.querySelector(".interact-name")) {
                    domType = "enter";
                }
                // 插入到弹幕框内
                let msgBox = document.createElement("div");
                msgBox.className = "chat-item important-prompt-item";
                domType && msgBox.classList.add(`${domType}-prompt-item`);
                msgBox.innerHTML = node.innerHTML;
                // 防止无限制增长
                if (chatBox.childElementCount > 100) {
                    let chatHistory = document.querySelector("#chat-history-list");
                    // 判断滚动条位置决定是否添加
                    if (displayBrushPrompt || chatHistory.scrollTop > chatHistory.scrollHeight - 2 * chatHistory.offsetHeight) {
                        chatBox.querySelector(".chat-item.important-prompt-item").remove();
                        chatBox.append(msgBox);
                    }
                } else {
                    chatBox.append(msgBox);
                }
            }
        }
    });
    if (infoPersistence) {
        enterObserver.observe(document.querySelector("#brush-prompt"), {
            attributes: false,
            childList: true,
            subtree: false
        });
    }

    // 	弹幕弹框时间戳
    let tsPanelStatus = false;
    document.querySelector(".chat-items").addEventListener('click', function (e) {
        if (e.target.className.includes("chat-emoticon") || e.target.className.includes("open-menu")) {
            // 初始化时间界面
            if (!tsPanelStatus) {
                let ele = document.createElement("div");
                ele.setAttribute("id", "send-ts");
                document.querySelector(".danmaku-menu").append(ele);
                tsPanelStatus = true;
            }
            setTimeout(() => {	// 因为无法准确的确定窗口的状态，加延迟防止弹窗消失时时间突变
                let ts = e.target.parentElement.getAttribute("data-ts") || e.target.parentElement.parentElement.getAttribute("data-ts");
                ts = new Date(ts * 1000);
                document.querySelector("#send-ts").innerText = ts.toLocaleString('chinese', { hour12: false });
                document.querySelector("#send-ts").innerHTML += "<br/>" + formatDate(Math.floor((new Date() - ts) / 1000));
            }, 50);
        }
    }, true);

    function formatDate(sec) {
        let unit = ["秒前", "分", "小时", "天"];
        //  0   1   2   3
        // sec min hour day
        let timeArray = [0, 0, 0, 0];
        for (timeArray[0] = sec % 60, sec -= timeArray[0]; sec > 0 && sec < 2592001; sec -= 60) {
            timeArray[1]++;
            if (timeArray[1] == 60) {
                timeArray[1] = 0;
                timeArray[2]++;
                if (timeArray[2] == 24) {
                    timeArray[2] = 0;
                    timeArray[3]++;
                }
            }
        }
        let str = "";
        for (let index = timeArray.length - 1; index >= 0; index--) {
            if (str.length || timeArray[index] > 0) {
                str += timeArray[index] + unit[index];
            }
        }
        return str ? str : "刚刚";
    }

    async function setFaceUrl(ele, uid) {
        const NO_FACE = "data:image/jpeg;base64,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";
        ele.style.backgroundImage = `url(${NO_FACE})`;
        if (!uid) { return NO_FACE; }
        let res = await fetch(`https://api.bilibili.com/x/space/acc/info?mid=${uid}&jsonp=jsonp`, { credentials: "include" });
        let json = await res.json();
        if (json.code == json.message) {
            await loadImage(json.data.face);
            ele.style.backgroundImage = `url(${json.data.face})`;
        } else {
            throw new Error("头像加载失败", json);
        }
        return json.data.face;
    }

    function showLastDanmaTime(item) {
        let ts = new Date(item.getAttribute("data-ts") * 1000);
        let soFar = Math.floor((new Date() - ts) / 1000);
        let ele = document.createElement("div");
        ele.className = "last-danmu-timestamp";
        ele.innerHTML = `
			<span>
				最后一条弹幕发送自：${formatDate(soFar)}
			</span>
		`;
        item.after(ele);
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                resolve(null);
            };
            img.src = src;
        });
    }

    function getUserID() {
        return document.cookie.match(/DedeUserID=(\w*); /) && document.cookie.match(/DedeUserID=(\w*); /)[1];
    }

})();