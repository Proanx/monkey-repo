// ==UserScript==
// @name         b站直播自动切换徽章
// @namespace    http://tampermonkey.net/
// @version      0.2.2
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

	getWearedMedal();

	function getWearedMedal() {
		$.ajax({
			url: "https://api.live.bilibili.com/live_user/v1/UserInfo/get_weared_medal",
			method: "GET",
			xhrFields: {
				withCredentials: true //允许跨域带Cookie
			},
			success: function (result) {
				if (result.code == 0) {
					originMedalId = result.data.medal_id;
					getMedalList();
				}
			}
		});
	}

	function getMedalList() {
		$.ajax({
			url: "https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=2060727",
			method: "GET",
			xhrFields: {
				withCredentials: true //允许跨域带Cookie
			},
			success: function (result) {
				for (let i of result.data.list) {
					let rid = i.link.match(/live\.bilibili\.com\/(\d+)/);
					if (rid != null && rid[1] == roomId) {
						medalId = i.medal_info.medal_id;
						if (medalId != originMedalId) {
							console.log(`现在带的是${originMedalId}，打算换成${medalId}`);
							switchBadge(medalId);
						}
						document.querySelector("body").onfocus = () => {
							if (medalId != GM_getValue("cBadge")) {
								switchBadge(medalId);
							}
						};
						// window.addEventListener('beforeunload', (event) => {
						// 	originMedalId != medalId && switchBadge(originMedalId);
						// });
						return;
					}
				}
			}
		});
	}

	function switchBadge(badgeId) {
		return new Promise((resolve, reject) => {
			let url = "https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear";
			if (!badgeId) {
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
					console.log(result);
					if (result.code == 0) {
						GM_setValue("cBadge", badgeId);
					}
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