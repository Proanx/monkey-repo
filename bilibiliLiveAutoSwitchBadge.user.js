// ==UserScript==
// @name         b站直播自动切换徽章
// @namespace    http://tampermonkey.net/
// @version      0.1
// @icon         http://bilibili.com/favicon.ico
// @description  进直播间自动切换，关网页自动换回来
// @author       Pronax
// @run-at       document-body
// @include      /https://live.bilibili.com\/\d+/
// @require      https://cdn.staticfile.org/jquery/1.12.4/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// ==/UserScript==

(function () {
	'use strict';

	var roomId = location.href.match(/live.bilibili.com\/(\d+)/)[1];
	var jct = getJct();
	var medalId;
	var originMedalId;

	getMedalList();

	function getMedalList() {
		$.ajax({
			url: "https://api.live.bilibili.com/fans_medal/v1/FansMedal/get_list_in_room",
			xhrFields: {
				withCredentials: true //允许跨域带Cookie
			},
			success: async function (result) {
				for (let i of result.data) {
					if (i.icon_text == "佩戴中") {
						originMedalId = i.medal_id;
					}
					if (i.room_id == roomId) {
						medalId = i.medal_id;
						if (i.icon_text != "佩戴中") {
							await switchBadge(i.medal_id);
						}
						document.querySelector("body").onfocus = ()=>{
							if (medalId != GM_getValue("cBadge")) {
								switchBadge(medalId);
							}
						};
						window.addEventListener('beforeunload', (event) => {
							console.log(555555);
							originMedalId != medalId && switchBadge(originMedalId);
						});
						return;
					}
				}
			},
			error: function (e) {
				console.log("发送弹幕失败：", e);
			}
		});
	}

	function switchBadge(badgeId) {
		return new Promise((resolve,reject)=>{
			let url = "https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear";
			if(!badgeId){
				url = "https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/take_off";
			}
			$.ajax({
				url: url,
				type: "POST",
				data: {
					"medal_id": badgeId,
					"csrf_token": jct,
					"csrf": jct
				},
				xhrFields: {
					withCredentials: true //允许跨域带Cookie
				},
				success: function (result) {
					if (!result.code) {
						GM_setValue("cBadge", badgeId);
					}
					console.log(result);
					resolve();
				},
				error: function (e) {
					console.log("发送弹幕失败：", e);
					reject();
				}
			});
		});
	}

	function getJct() {
		return document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
	}

})();