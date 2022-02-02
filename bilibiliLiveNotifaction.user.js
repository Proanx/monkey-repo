// ==UserScript==
// @name         b站直播通知
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  需要有至少一个b站页面开在后台，在有页面常驻的情况下提醒延迟不超过3分钟
// @author       Pronax
// @match        https://*.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @noframes
// ==/UserScript==


(function () {
	'use strict';

	const TAB_ID = giveMeAName();
	// 单位都是ms
	const CONSUMER_LOOP_TERM = 90000;
	const RETRY_LOOP_TERM = CONSUMER_LOOP_TERM * 0.7;
	const LIST_EXPIRE_TIME = CONSUMER_LOOP_TERM * 5.0;
	const CONSUMER_EXPIRE_TIME = CONSUMER_LOOP_TERM * 1.3;

	var isConsumer = false;

	// list存的都是uid
	var onlineList;
	var blockList;

	var interval;

	// 怪火狐去吧
	document.querySelector("body").addEventListener('click', requestPermission);
	function requestPermission(e) {
		document.querySelector("body").removeEventListener('click', requestPermission);
		if (Notification.permission == "default") {
			Notification.requestPermission();
		}
	}

	window.addEventListener('beforeunload', (event) => {
		// 把心跳设为过去，使其他页面的下一次尝试必定推翻生产者
		isConsumer && heartbeat(Date.now() - CONSUMER_EXPIRE_TIME);
	});

	if (typeof (__NEPTUNE_IS_MY_WAIFU__) != 'undefined') {
		updateBlockList(__NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.uid);
	}

	init();

	function init() {
		try {
			let consumer = tryConsumer();
			if (consumer && Date.now() - consumer.lastHeartbeat <= LIST_EXPIRE_TIME) {
			} else {
				GetLiveList(true);
			}
			clearCountdown(interval);
			interval = setInterval(() => {
				if (isConsumer && heartbeat()) {
					GetLiveList();
				} else {
					isConsumer = false;
					changeTabTitle();
					throw new Error("无生产权限");
				}
			}, CONSUMER_LOOP_TERM);
		} catch (error) {
			console.log(error.message + ",预计在" + new Date(Date.now() + RETRY_LOOP_TERM).toLocaleString() + "重新尝试");
			clearCountdown(interval);
			interval = setTimeout(() => {
				init();
			}, RETRY_LOOP_TERM);
		}
	}

	function GetLiveList(isInit) {
		ajax(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100`, function (result) {
			onlineList = getList("onlineList");
			blockList = getList("blockList");
			if (result.code == result.message) {
				let newList = new Set();
				for (let item of result.data.items) {
					if (!(isInit || onlineList.has(item.uid) || blockList.has(item.uid))) {
						console.log("发送" + item.uname + "的开播通知");
						notify(item.uid, item.uname, item.title, item.face, item.link);
					}
					newList.add(item.uid);
				}
				onlineList = newList;
				blockList.clear();
				saveList();
			}
		});
	}

	function ajax(url, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.withCredentials = true;
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status == 200 || xhr.status == 304) {
					callback && callback(JSON.parse(xhr.response));
				}
			}
		}
		xhr.send();
	}

	function notify(roomid, nickname, roomname, avatar, link) {
		new Notification(roomname, {
			tag: roomid,
			icon: avatar,
			body: nickname + "正在直播"
		}).onclick = function () {
			GM_openInTab(link, {
				"active": true,
				"insert": true
			});
		};
	}

	function heartbeat(timestamp = Date.now()) {
		let consumer = GM_getValue("consumer");
		if (consumer && consumer.name == TAB_ID) {
			GM_setValue("consumer", { "name": TAB_ID, "lastHeartbeat": timestamp });
			changeTabTitle();
			return true;
		}
		isConsumer = false;
		changeTabTitle();
		return false;
	}

	function tryConsumer() {
		let consumer = GM_getValue("consumer");
		if (consumer && consumer.name != TAB_ID && Date.now() - consumer.lastHeartbeat <= CONSUMER_EXPIRE_TIME) {
			console.log("已存在消费者且未过期，过期时间：", (CONSUMER_EXPIRE_TIME - (Date.now() - consumer.lastHeartbeat)) / 1000);
			changeTabTitle();
			throw new Error("已有线程正在生产");
		}
		GM_setValue("consumer", { "name": TAB_ID, "lastHeartbeat": Date.now() });
		isConsumer = true;
		changeTabTitle();
		return consumer;
	}

	function getList(name) {
		let list = GM_getValue(name);
		list = list ? list.split(",").map(Number) : [];
		return new Set(list);
	}

	function saveList() {
		GM_setValue("onlineList", Array.from(onlineList).toString());
		GM_setValue("blockList", Array.from(blockList).toString());
	}

	function updateBlockList(uid) {
		let list = getList("blockList");
		list.add(uid);
		GM_setValue("blockList", Array.from(list).toString());
	}

	function giveMeAName() {
		let name = Date.now().toString(16) + "-" + btoa(location.host);
		sessionStorage.setItem(name, location.pathname);
		return name;
	}

	function clearCountdown(timeout) {
		clearInterval(timeout);
		clearTimeout(timeout);
	}

	function changeTabTitle() {
		document.title = (isConsumer ? "「✔」" : "") + (document.title.startsWith("「") ? document.title.substr(3) : document.title);
	}

})();