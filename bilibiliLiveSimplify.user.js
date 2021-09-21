// ==UserScript==
// @name         b站直播聊天室简化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  简化聊天室但保留了粉丝牌、房管、老爷等标志。
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        GM_addStyle
// ==/UserScript==

(function () {
	'use strict';

	GM_addStyle(".block-effect-ctnr{min-width: 148px;}.live-room-app .app-content{padding-top:60px !important}");
	// 弹幕
	GM_addStyle(".chat-history-panel .chat-history-list .chat-item.top3-notice{width:268px;border-radius:3px;margin:0}.fansmedal-popover{margin-left:-124px}.fansmedal-popover::after,.fansmedal-popover::before{left:80%!important}.rank-icon{float:right;margin:0 0 0 5px!important;width:24px!important;height:16px!important}.chat-item.danmaku-item>.user-name{color:#bbb!important;display:flex}.chat-item.danmaku-item>.title-label{display:none}.chat-item.danmaku-item>.danmaku-content{display:block!important;font-size:14px}.chat-item.danmaku-item:not(.superChat-card-detail)>div,.chat-item.danmaku-item:not(.superChat-card-detail)>.vip-icon{float:right;margin:0 0 0 5px!important}.chat-item.gift-item{margin:4px 0;border:1px solid #ffa32829;background-color:#ffc1001a}.chat-item.danmaku-item:not(.superChat-card-detail){margin:4px 0!important;border:1px solid #fff;background-color:#fff!important}.chat-item.gift-item,.chat-item.danmaku-item:not(.superChat-card-detail){width:268px;border-radius:5px}.chat-item.gift-item>.fans-medal-item-ctnr,.chat-item.important-prompt-item>.fans-medal-item-ctnr{float:right;right:-4px}.chat-item.superChat-card-detail .name{color:#444!important;font-size:16px!important}.chat-item.superChat-card-detail .fans-medal-item-ctnr{position:absolute;right:10px;top:13px}.chat-item.superChat-card-detail>.card-item-top-right{color:#fff!important;right:110px!important;border:1px solid;padding-right:6px!important;background-color:#2a60b2}.chat-item.superChat-card-detail .card-item-middle-top{height:32px!important}.chat-history-panel .danmaku-buffer-prompt{bottom:145px;border-radius:20px;width:130px;opacity:.85;margin:0 auto}");
	GM_addStyle(".send-ts{;background-color: #fff;opacity:0}.send-ts:hover{;background-color: #fff;opacity:1}");
	// 标题
	GM_addStyle(".head-info-section{height:78px!important}.head-info-section>.header-info-ctnr{padding:6px}.head-info-section .right-ctnr{right:5px}");
	// 入场
	GM_addStyle(".brush-prompt,.welcome-section-bottom{display:none}");
	// 礼物
	GM_addStyle("#gift-control-vm{height: 120px;}.gift-control-panel {height: 110px!important;}");
	GM_addStyle(".important-prompt-item>.username{margin-right: 4px;color: #999;overflow: hidden;text-overflow: ellipsis;}.important-prompt-item>.count{vertical-align: middle;}");
	GM_addStyle(".penury-gift-msg{display:none}");
	// 消除所有提示
	GM_addStyle(".chat-history-panel .chat-history-list{height: 100% !important}");

	var count = 100;
	var userId = getUserID();

	if (userId) {
		GM_addStyle(`.chat-item.danmaku-item[data-uid="${userId}"]{border-color: #e4e4e4;margin: 3px 0 !important;`);
	}

	var interval = setInterval(() => {
		if (document.querySelector(".bottom-actions")) {
			clearInterval(interval);
			document.querySelector(".chat-items").addEventListener('DOMNodeInserted', function (e) {
				let item = e.target;
				if (item.classList && item.classList[0] == "chat-item") {
					item.querySelector(".rank-icon") && item.append(item.querySelector(".rank-icon"));
					switch (item.classList[1]) {
						case "danmaku-item":
							item.querySelector(".fans-medal-item-ctnr") && item.prepend(item.querySelector(".fans-medal-item-ctnr"));
							item.querySelector(".rank-icon") && item.querySelector(".user-name").before(item.querySelector(".rank-icon"));
							if (item.classList[2] == "superChat-card-detail") {
								item.querySelector(".card-item-top-right").style.backgroundColor = item.querySelector(".card-item-middle-bottom").style.backgroundColor;
							} else if (item.querySelector(".my-self")) {
								item.querySelector(".my-self").className += " open-menu pointer";
								item.querySelector(".my-self").nextElementSibling.classList.add("open-menu");
							}
							break;
						case "convention-msg":
							document.querySelectorAll(".chat-item.danmaku-item").length && showLastDanmaTime(document.querySelectorAll(".chat-item.danmaku-item")[document.querySelectorAll(".chat-item.danmaku-item").length - 1]);
							break;
					}
				}
			}, true);
			//  入场信息持久化
			document.querySelector("#brush-prompt").addEventListener('DOMNodeInserted', function (e) {
				let ele = document.createElement("div");
				ele.className = "chat-item important-prompt-item";
				ele.innerHTML = e.target.innerHTML;
				document.querySelector(".chat-items").append(ele);
			}, true);
			//  礼物信息持久化
			document.querySelector("#penury-gift-msg").addEventListener('DOMNodeInserted', function (e) {
				let ele = document.createElement("div");
				ele.className = "chat-item important-prompt-item";
				ele.innerHTML = e.target.innerHTML.replace(/class="count">X (\d+)/,"class='count'>×$1");
				document.querySelector(".chat-items").append(ele);
			}, true);
			// 	弹幕弹框时间戳
			let ele = document.createElement("div");
			ele.setAttribute("id", "send-ts");
			document.querySelector(".danmaku-menu").append(ele);
			document.querySelector(".chat-items").addEventListener('click', function (e) {
				if (e.target.getAttribute("class") && e.target.getAttribute("class").match(/(danmaku\-content|user\-name)/) && document.querySelector(".danmaku-menu").style.display == "none") {
					let ts = new Date(e.target.parentElement.getAttribute("data-ts") * 1000);
					document.querySelector("#send-ts").innerText = ts.toLocaleString('chinese', { hour12: false });
					document.querySelector("#send-ts").innerHTML += "<br/>" + formatDate(Math.floor((new Date() - ts) / 1000));
				}
			}, true);

			// 后台打开页面时有时候抓不到事件
			let list = document.querySelectorAll(".chat-items>.chat-item.danmaku-item");
			for (let item of list) {
				item.querySelector(".fans-medal-item-ctnr") && item.prepend(item.querySelector(".fans-medal-item-ctnr"));
				item.querySelector(".rank-icon") && item.querySelector(".user-name").before(item.querySelector(".rank-icon"));
				if (item.querySelector(".my-self")) {
					item.querySelector(".my-self").className += " open-menu pointer";
					item.querySelector(".my-self").nextElementSibling.classList.add("open-menu");
				}
			}
			let item = document.querySelector(".chat-items>.chat-item.convention-msg");
			if (item) {
				document.querySelectorAll(".chat-item.danmaku-item").length && showLastDanmaTime(document.querySelectorAll(".chat-item.danmaku-item")[document.querySelectorAll(".chat-item.danmaku-item").length - 1]);
			}
		}
		if (!count--) { clearInterval(interval); }
	}, 100);

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

	function showLastDanmaTime(item) {
		let ts = new Date(item.getAttribute("data-ts") * 1000);
		let soFar = Math.floor((new Date() - ts) / 1000);
		let ele = document.createElement("div");
		ele.setAttribute("style", "line-height: 20px;padding: 5px;");
		ele.innerHTML = `<span class="t-over-hidden interact-name v-middle" style="color: rgba(153,153,153,1); margin-right: 4px;">最后一条弹幕发送自：${formatDate(soFar)}</span>`;
		item.after(ele);
	}

	function getUserID() {
		return document.cookie.match(/DedeUserID=(\w*); /) && document.cookie.match(/DedeUserID=(\w*); /)[1];
	}

})();