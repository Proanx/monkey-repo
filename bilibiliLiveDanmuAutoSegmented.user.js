// ==UserScript==
// @name         b站直播聊天室去除字数限制
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  原理是分开发送。接管了发送框，会提示屏蔽词
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// @require      https://cdn.staticfile.org/jquery/1.12.4/jquery.min.js
// ==/UserScript==

(function () {
	'use strict';

	var jct = document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
	var roomId = location.href.match(/\/(\d+)/)[1];
	var limit = 30;
	var toastCount = 0;
	var isProcessing = false;

	const fWord = ["超度", "渣男", "和谐", "河蟹", "敏感", "你妈", "代孕", "硬了", "抖音", "保卫", "被gan", "寄吧", "郭楠", "里番", "小幸运", "试看", "加QQ", "警察", "营养", "资料", "家宝", "饿死", "不认字", "横幅", "hentai", "诱惑", "垃圾", "福报", "拉屎", "顶不住", "一口气", "苏联", "哪个平", "老鼠台", "顶得住", "gay", "黑幕", "蜀黍我啊", "梯子", "美国", "米国", "系统提示", "未成年", "爪巴"];
	const fireWord = { "党": "档", "89": "B9", "戏精": "戏京", "八九": "八仇", "八十九": "八十仇", "你妈逼": "你冯逼", "你画我猜": "您画我猜", "叔叔我啊": "叔叔莪啊", "爬": "瓟", "倒车": "到车" };

	GM_addStyle(".medal-section{display:inline-block}.dialog-ctnr>.arrow{display:none}.chat-input-ctnr>div:first-of-type{width:100%}.chat-input-ctnr .input-limit-hint{bottom:0!important;right:53px!important}#chat-control-panel-vm{height:102px}.chat-history-panel{height:calc(100% - 128px - 102px)!important}#liveDanmuSendBtn{height:100%;min-width:50px;padding-top:5px;border-radius:0 3px 3px 0}.link-toast.error{left:40px;right:40px;white-space:normal;margin:auto;text-align:center;box-shadow:0 .2em .1em .1em rgb(255 100 100 / 20%)}#liveDanmuInputArea{padding:8px;overflow:auto;scrollbar-width:thin}#liveDanmuInputArea::-webkit-scrollbar{width:6px}#liveDanmuInputArea::-webkit-scrollbar-thumb{background-color:#aaa}.control-panel-icon-row>.icon-right-part{margin-right:6px}.chat-input-ctnr{margin-top:4px!important}.control-panel-icon-row>.medal-section>.medal-item-margin{margin:2px}");

	// 默认css
	GM_addStyle(".control-panel-icon-row .medal-section .action-item.medal.wear-medal{width:54px;height:22px;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAyCAMAAADx7dyJAAAA51BMVEUAAACampqZmZmampqZmZmampqampqZmZmdnZ2oqKiamprU1NSZmZmZmZmZmZmvr6+ampqampqamprIyMiZmZmampqampqZmZmZmZmampqenp6cnJyfn5+ampqbm5uampqenp7Q0NDOzs6ampqamprPz8/Ozs6ampqbm5vMzMyZmZmZmZnNzc2bm5ubm5uZmZmampqcnJyampqampqampqampqamprNzc2amprU1NTU1NTU1NSamprV1dXS0tLR0dHT09PU1NTT09PW1tbS0tLMzMzt7e2ZmZnj4+PPz8/V1dXo6OjZ2dk1f/nUAAAARXRSTlMA49Zr8zV1SzkGgKukj4UL+q5iA97uw1mpiSAbDupeQRX6eLPNPBnIT+bm0rI9JsFlLdmWm41G+buqn35xMBHr2r5WRCgCpQL/AAADqUlEQVRYw7TS226qQBiG4Q8cUAg7hbHIRo1Y0epCa2vbA0/Jf/93tBhApYqJK3G9yT+QQJ4ME/D/et2s8qe12rxW6ix/crNyr/n3bIGntZh952K/G6E/s1m+AbDKF3hqi3wFIM9xlariqoGCOx19iEK/i8kUIiG2spKE32lxmhmNXiBy7aKExKplpE75PPo3tkudHnnyKbIgGtO5TkA6vpzEbWOVXlUc9+o0lBnOtEd/cIpVbDAumpNYM8Giw5Q2ltF1AUQ2S3DLupqoT+UloFGxhprbwh7VKs7Vuqj+2hfBGm9lcs0a1JL1+NnaHimC3ZnmnJumVbOTTjNKy4vyOKtTxQIw5cbZhvq5CLyPqkfZgDntrELG4SDJh0NCIfZDYGJMb9mweyqOz7ch4DujitUZc4ix9MIugyDtB8GuYIcyoFMLu6OWdrBJfanYkXfcxsdEvrCMc8fhnBWsz4GfNW7ZbFA1lzmX54OqDLBcwU5IGQ3FIagNVgG2BrCkUOzUZeb9s+1SV5KWjoJLgl1ScMt6+z1j+71EoXhnQsu7bMC3kCRs1/ZvtkP2NRtNJuu0Gg3vNPh0pvdYLXXeBZuxxP3F6gxnlluof1xvXYxc/q6xwfu4x5o0gGCxpE+3yX54F1YaQWR5nsOq6QCGQ1932MigT1QsLErsBttPL6xnoouyYVKOaEweEGotrOKR4Z5YjGgeXFjJr1ldxvojIgWR7/uxVMxbcRNhRx+A7rnXrKs64smZhUVsd2LfaVyysS79YNvPKELUbxQFjGIbvoxr1qS/tdZvS8JQFMfxHy2SFNxqJJUau6ggCdnSxDacf093d/P9v56Gd7Gcyx2ofZ8Jh88D72Ecy8BPFk+XspmyV9I5sFa/NcN0NOzqR+sPk0d+dwBnZBnWg/08PWHdvotjFm6rnbLjPmB2kj9B/764Aczbluw9wja6l3XnTRqoy7mccT81mr2vIyllMZdDoG31Dgg6zTt38gpgIsf2GbZWw1EvhoOOXutrHGojycF3JnR6ETL2fyOq6Pyo6Fiq6LSr5hCt8GzOWgiKPnOFRA3kahCF+bmIxAI6tvoXNyhWPwC2G+C0Dalilesq2hRthiIVFqhMN1SkCvd0sCSK4rzKc+OIaDlAYbYv0tnstRiunhW+jd8K1sksS9VuNrsOcC6fVJypPDdW5KOkFe0zlefuaYWydoriTOW4MakdSvNIaZXrKvJQnilIq1yXhAlGW6E8sPOU2IKXjeL4w19GXEgqF0Zf/gAAAABJRU5ErkJggg==)}.control-panel-icon-row .medal-section .action-item.medal{background-size:cover;border:0}.control-panel-icon-row .medal-section .action-item{display:inline-block;margin:0 2px;font-size:12px;color:#fff;line-height:14px;text-align:center;border-radius:2px;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}");

	var itv = setInterval(() => {
		let text = $("textarea.chat-input");
		if (text.length) {
			clearInterval(itv);
			$(".control-panel-icon-row").prepend($(".medal-section"));

			let tempText = text.clone().attr("id", "liveDanmuInputArea");
			text.after(tempText).remove();
			let sendBtn = $(".bottom-actions>.right-action").removeClass("p-absolute");
			$(sendBtn).find("button").attr("id", "liveDanmuSendBtn");
			$(".chat-input-ctnr").append(sendBtn.clone());
			sendBtn.remove();

			$("#liveDanmuSendBtn").click(async () => {
				let msg = $("#liveDanmuInputArea").val();
				if ((!msg) || isProcessing) { if (isProcessing) { toast("有弹幕正在发送中", 1500, "info") } return; }
				isProcessing = true;
				let page = 1;
				limit = 30;
				if (msg.length > 30) {
					// 自动平均每条弹幕的长度
					while (msg.length / limit % 1 < 0.7 && msg.length / limit % 1 != 0) {
						limit--;
					}
					page = Math.ceil(msg.length / limit);
					console.log(`长度：${msg.length} 间隔：${limit} 分页：${page}`);
				}
				let count = 0;
				do {
					let str = msg.substr(0, limit);
					let result = await sendMsg(str, count++ ? 500 + Math.random() * 1000 >> 1 : 0);
					msg = msg.substr(limit);
					$("#liveDanmuInputArea").val(msg);
					document.querySelector("#liveDanmuInputArea").oninput();
				} while (msg.length > 0);
				isProcessing = false;
			});
			document.querySelector('#liveDanmuInputArea').oninput = function () {
				this.value = filter(this.value);
				let length = this.value.length;
				$(".input-limit-hint").text(length + "/30");
				if (length > 30) {
					$(".input-limit-hint").css("color", "#23ade5");
				} else {
					$(".input-limit-hint").css("color", "");
				}
			};
			document.querySelector('#liveDanmuInputArea').onkeydown = function (e) {
				if ((!e.shiftKey) && e.keyCode == 13) {
					e.returnValue = false;
					$("#liveDanmuSendBtn").click();
				}
			};
		}
	}, 100);

	function filter(str) {
		for (let key in fireWord) {
			if (str.indexOf(key) >= 0) {
				str = str.replaceAll(key, fireWord[key]);
			}
		}
		for (let word of fWord) {
			let index = str.search(word);
			if (index++ >= 0) {
				str = str.slice(0, index) + "'" + str.slice(index);
			}
		}
		return str;
	}

	async function sendMsg(msg, timer = 500) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				$.ajax({
					url: "https://api.live.bilibili.com/msg/send",
					type: "POST",
					timeout: 8000,
					data: {
						"bubble": 0,
						"msg": msg,
						"color": 16777215,
						"mode": 1,
						"fontsize": 25,
						"rnd": Math.floor(new Date() / 1000),
						"roomid": roomId,
						"csrf": jct,
						"csrf_token": jct
					},
					xhrFields: {
						withCredentials: true //允许跨域带Cookie
					},
					success: function (result) {
						if (result.code || result.msg != "") {
							switch (result.msg) {
								case "f":
								case "fire":
									result.msg = "含有敏感词";
									break;
							}
							toast(result.msg);
							isProcessing = false;
							reject(result);
						} else {
							resolve(true);
						}
					},
					error: function (e) {
						console.log("发送弹幕出错：", e);
						toast(e);
						isProcessing = false;
						reject(e);
					}
				});
			}, timer);
		});
	}

	function toast(msg, time = 2000, type = "error") {
		let id = Math.random() * 1000 >> 1;
		$(".chat-control-panel").append(`<div class="link-toast ${type} link-toast-${id}" style="bottom:${105 + toastCount++ * 50}px"><span class="toast-text">${msg}</span></div>`);
		setTimeout(() => {
			toastCount--;
			$(`.link-toast-${id}`).remove();
		}, time);
	}

})();