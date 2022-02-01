// ==UserScript==
// @name         b站直播通知
// @namespace    http://tampermonkey.net/
// @version      0.1.2
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

	var isConsumer = false;

	// list存的都是uid
	var onlineList;
	var blockList;

	var interval;

	// 单位都是ms
	var consumerExpireTime = 240000;
	var listExpireTime = 840000;
	var consumerLoopTerm = 180000;
	var reEntryLoopTerm = 125000;

	// 怪火狐去吧
	document.querySelector("body").addEventListener('click',requestPermission);
	function requestPermission(e){
		document.querySelector("body").removeEventListener('click',requestPermission);
		if (Notification.permission == "default") {
			Notification.requestPermission();
		}
	}

	window.addEventListener('beforeunload', (event) => {
		isConsumer && heartbeat(Date.now() - consumerExpireTime);
	});

	init();

	function init() {
		try {
			if(typeof(__NEPTUNE_IS_MY_WAIFU__)!='undefined'){
				updateBlockList(__NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.uid);
			}
			console.log("开始尝试竞争锁");
			let consumer = tryConsumer();
			console.log("竞争成功");
			if (consumer && Date.now() - consumer.lastHeartbeat <= listExpireTime) {
				console.log("旧数据有效");
			} else {
				console.log("数据过期，重新获取新数据");
				GetLiveList(true);
			}
			console.log("开始执行生产计划，预计在" + new Date(Date.now() + consumerLoopTerm).toLocaleString());
			clearCountdown(interval);
			interval = setInterval(() => {
				console.log("进入生产");
				if (isConsumer && heartbeat()) {
					console.log("生产成功，下一次生产会在：", new Date(Date.now() + consumerLoopTerm).toLocaleString());
					GetLiveList();
				} else {
					console.log("被踢出产线");
					isConsumer = false;
					changeTabTitle();
					throw new Error("无生产权限");
				}
			}, consumerLoopTerm);
		} catch (error) {
			console.log(error.message + ",预计在" + new Date(Date.now() + reEntryLoopTerm).toLocaleString() + "重新尝试");
			clearCountdown(interval);
			interval = setTimeout(() => {
				init();
			}, reEntryLoopTerm);
		}
	}

	function GetLiveList(isInit) {
		ajax(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100`, function (result) {
			onlineList = getList("onlineList");
			blockList = getList("blockList");
			if (result.code == result.message) {
				for (let item of result.data.items) {
					if (!(isInit || onlineList.has(item.uid) || blockList.has(item.uid))) {
						console.log("发送" + item.uname + "的开播通知");
						notify(item.uid, item.uname, item.title, item.face, item.link);
					}
					onlineList.add(item.uid);
					blockList.delete(item.uid);
				}
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
			GM_openInTab(link,{
				"active":true,
				"insert":true
			});
		};
	}

	function heartbeat(timestamp = Date.now()) {
		console.log("开始更新心跳");
		let consumer = GM_getValue("consumer");
		if (consumer && consumer.name == TAB_ID) {
			console.log("心跳更新成功");
			GM_setValue("consumer", { "name": TAB_ID, "lastHeartbeat": timestamp });
			changeTabTitle();
			return true;
		}
		console.log("无法更新心跳");
		isConsumer = false;
		changeTabTitle();
		return false;
	}

	function tryConsumer() {
		let consumer = GM_getValue("consumer");
		if (consumer && consumer.name != TAB_ID && Date.now() - consumer.lastHeartbeat <= consumerExpireTime) {
			console.log("已存在消费者且未过期，过期时间：", (consumerExpireTime - (Date.now() - consumer.lastHeartbeat)) / 1000);
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

	function saveList(name) {
		GM_setValue("onlineList", Array.from(onlineList).toString());
		GM_setValue("blockList", Array.from(blockList).toString());
	}
	
	function updateBlockList(uid){
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