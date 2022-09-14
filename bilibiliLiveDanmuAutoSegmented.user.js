// ==UserScript==
// @name         b站直播聊天室弹幕发送增强
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  原理是分开发送。接管了发送框，会提示屏蔽词
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// @run-at		 document-end
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/1.12.4/jquery.min.js
// @require      https://greasyfork.org/scripts/439903-blive-room-info-api/code/blive_room_info_api.js?version=1037039
// ==/UserScript==

// 待办：
// 分段指针
// 编辑距离判断fire词
// 接管全屏输入栏

; (async function () {
	'use strict';

	if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

	var jct = document.cookie.match(/bili_jct=(\w*); /)[1];
	var roomId = await ROOM_INFO_API.getRid();
	var toastCount = 0;
	var isProcessing = false;
	var formData = new FormData();
	formData.set("bubble", 0);
	formData.set("color", 16777215);
	formData.set("mode", 1);
	formData.set("fontsize", 25);
	formData.set("roomid", roomId);
	formData.set("csrf", jct);
	formData.set("csrf_token", jct);

	const LIMIT = await ROOM_INFO_API.getDanmuLength(roomId);

	// const fWord = ["墙了", "不唱歌", "变质", "小熊", "疫情", "感染", "分钟", "爽死", "黑历史", "超度", "渣男", "和谐", "河蟹", "敏感", "你妈", "代孕", "硬了", "抖音", "保卫", "被gan", "寄吧", "郭楠", "里番", "小幸运", "试看", "加QQ", "警察", "营养", "资料", "家宝", "饿死", "不认字", "横幅", "hentai", "诱惑", "垃圾", "福报", "拉屎", "顶不住", "一口气", "苏联", "哪个平", "老鼠台", "顶得住", "gay", "黑幕", "蜀黍我啊", "梯子", "美国", "米国", "系统提示", "未成年", "爪巴"];
	// const fireWord = { "包子": "包孒", "党": "档", "89": "B9", "戏精": "戏京", "八九": "八仇", "八十九": "八十仇", "你画我猜": "您画我猜", "叔叔我啊": "叔叔莪啊", "爬": "瓟", "倒车": "到车" };
	const riverCrabs = { "谨慎": "fire", "慎判": "fire", "代练": "f", "违规直播": "f", "低俗": "f", "系统": "fire", "渣女": "f", "肥": "fire", "墙了": "f", "不唱歌": "f", "变质": "f", "小熊": "f", "疫情": "f", "感染": "f", "分钟": "f", "爽死": "f", "黑历史": "f", "超度": "f", "渣男": "f", "和谐": "f", "河蟹": "f", "敏感": "f", "你妈": "f", "代孕": "f", "硬了": "f", "抖音": "f", "保卫": "f", "被gan": "f", "寄吧": "f", "郭楠": "f", "里番": "f", "小幸运": "f", "试看": "f", "加QQ": "f", "警察": "f", "营养": "f", "资料": "f", "家宝": "f", "饿死": "f", "不认字": "f", "横幅": "f", "hentai": "f", "诱惑": "f", "垃圾": "f", "福报": "f", "拉屎": "f", "顶不住": "f", "一口气": "f", "苏联": "f", "哪个平": "f", "老鼠台": "f", "顶得住": "f", "gay": "f", "黑幕": "f", "蜀黍我啊": "f", "梯子": "f", "美国": "f", "米国": "f", "未成年": "f", "爪巴": "f", "包子": "fire", "党": "fire", "89": "fire", "戏精": "fire", "八九": "fire", "八十九": "fire", "你画我猜": "fire", "叔叔我啊": "fire", "爬": "fire", "倒车": "fire" };

	GM_addStyle("#medal-selector{height:20px;}.medal-section{display:inline-block;position:relative;top:1px;}.dialog-ctnr>.arrow{display:none}.chat-input-ctnr>div:first-of-type{width:100%}.chat-input-ctnr .input-limit-hint{z-index:10;bottom:0!important;right:53px!important}#chat-control-panel-vm{height:102px}.chat-history-panel{height:calc(100% - 128px - 102px)!important}#liveDanmuSendBtn{height:100%;min-width:50px;padding-top:5px;border-radius:0 3px 3px 0}.link-toast.error{left:40px;right:40px;white-space:normal;margin:auto;text-align:center;box-shadow:0 .2em .1em .1em rgb(255 100 100 / 20%)}#liveDanmuInputArea{background-color:transparent;position:relative;z-index:1;padding:4px 8px;line-height:18px;word-break:break-all;overflow:auto;scrollbar-width:thin}#liveDanmuInputArea::-webkit-scrollbar,.chat-input-cover::-webkit-scrollbar{width:6px}#liveDanmuInputArea::-webkit-scrollbar-thumb,.chat-input-cover::-webkit-scrollbar-thumb{background-color:#aaa}.control-panel-icon-row>.icon-right-part{margin-right:6px}.chat-input-ctnr{margin-top:4px!important}.control-panel-icon-row .medal-section .medal-item-margin{margin:2px}");

	// 输入框周围组件默认css
	GM_addStyle(".medal-section .action-item.medal.get-medal,.medal-section .action-item.medal.wear-medal{width:49px !important;height:20px !important;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAyCAMAAADx7dyJAAAA51BMVEUAAACampqZmZmampqZmZmampqampqZmZmdnZ2oqKiamprU1NSZmZmZmZmZmZmvr6+ampqampqamprIyMiZmZmampqampqZmZmZmZmampqenp6cnJyfn5+ampqbm5uampqenp7Q0NDOzs6ampqamprPz8/Ozs6ampqbm5vMzMyZmZmZmZnNzc2bm5ubm5uZmZmampqcnJyampqampqampqampqamprNzc2amprU1NTU1NTU1NSamprV1dXS0tLR0dHT09PU1NTT09PW1tbS0tLMzMzt7e2ZmZnj4+PPz8/V1dXo6OjZ2dk1f/nUAAAARXRSTlMA49Zr8zV1SzkGgKukj4UL+q5iA97uw1mpiSAbDupeQRX6eLPNPBnIT+bm0rI9JsFlLdmWm41G+buqn35xMBHr2r5WRCgCpQL/AAADqUlEQVRYw7TS226qQBiG4Q8cUAg7hbHIRo1Y0epCa2vbA0/Jf/93tBhApYqJK3G9yT+QQJ4ME/D/et2s8qe12rxW6ix/crNyr/n3bIGntZh952K/G6E/s1m+AbDKF3hqi3wFIM9xlariqoGCOx19iEK/i8kUIiG2spKE32lxmhmNXiBy7aKExKplpE75PPo3tkudHnnyKbIgGtO5TkA6vpzEbWOVXlUc9+o0lBnOtEd/cIpVbDAumpNYM8Giw5Q2ltF1AUQ2S3DLupqoT+UloFGxhprbwh7VKs7Vuqj+2hfBGm9lcs0a1JL1+NnaHimC3ZnmnJumVbOTTjNKy4vyOKtTxQIw5cbZhvq5CLyPqkfZgDntrELG4SDJh0NCIfZDYGJMb9mweyqOz7ch4DujitUZc4ix9MIugyDtB8GuYIcyoFMLu6OWdrBJfanYkXfcxsdEvrCMc8fhnBWsz4GfNW7ZbFA1lzmX54OqDLBcwU5IGQ3FIagNVgG2BrCkUOzUZeb9s+1SV5KWjoJLgl1ScMt6+z1j+71EoXhnQsu7bMC3kCRs1/ZvtkP2NRtNJuu0Gg3vNPh0pvdYLXXeBZuxxP3F6gxnlluof1xvXYxc/q6xwfu4x5o0gGCxpE+3yX54F1YaQWR5nsOq6QCGQ1932MigT1QsLErsBttPL6xnoouyYVKOaEweEGotrOKR4Z5YjGgeXFjJr1ldxvojIgWR7/uxVMxbcRNhRx+A7rnXrKs64smZhUVsd2LfaVyysS79YNvPKELUbxQFjGIbvoxr1qS/tdZvS8JQFMfxHy2SFNxqJJUau6ggCdnSxDacf093d/P9v56Gd7Gcyx2ofZ8Jh88D72Ecy8BPFk+XspmyV9I5sFa/NcN0NOzqR+sPk0d+dwBnZBnWg/08PWHdvotjFm6rnbLjPmB2kj9B/764Aczbluw9wja6l3XnTRqoy7mccT81mr2vIyllMZdDoG31Dgg6zTt38gpgIsf2GbZWw1EvhoOOXutrHGojycF3JnR6ETL2fyOq6Pyo6Fiq6LSr5hCt8GzOWgiKPnOFRA3kahCF+bmIxAI6tvoXNyhWPwC2G+C0Dalilesq2hRthiIVFqhMN1SkCvd0sCSK4rzKc+OIaDlAYbYv0tnstRiunhW+jd8K1sksS9VuNrsOcC6fVJypPDdW5KOkFe0zlefuaYWydoriTOW4MakdSvNIaZXrKvJQnilIq1yXhAlGW6E8sPOU2IKXjeL4w19GXEgqF0Zf/gAAAABJRU5ErkJggg==)}.medal-section .action-item.medal{background-size:cover;border:0}.medal-section .action-item{display:inline-block;margin:0 2px;font-size:12px;color:#fff;line-height:14px;text-align:center;border-radius:2px;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}");
	// 输入框边框
	GM_addStyle(".chat-input-ctnr{transition:border-color .2s linear;}.chat-input-ctnr:focus-within:hover{border-color: var(--brand_blue);}");
	// 输入框css
	GM_addStyle(`
		div.chat-input.border-box{
			position: absolute;
			padding: 4px 8px;
    		line-height: 18px;
			word-break: break-all;
			overflow: auto;
    		padding-right: 58px;
			scrollbar-width: thin;
			color: transparent;
		}
		/* 软敏感词 */
		div.chat-input .f-word {
			background-color: var(--Ly4);
		}
		/* 屏蔽词词 */
		div.chat-input .fire-word {
			background-color: #ff4500;
		}
	`);

	var itv = setInterval(() => {
		let text = $("textarea.chat-input");
		if (text.length) {
			clearInterval(itv);
			$(".control-panel-icon-row").prepend($(".medal-section"));
			// 背景框
			let displayDiv = document.createElement("div");
			displayDiv.className = "chat-input border-box chat-input-cover";
			for (let key in text[0].dataset) {
				displayDiv.dataset[key] = "";
			}
			text.before(displayDiv);
			// 输入框
			let tempText = text.clone().attr("id", "liveDanmuInputArea");
			text.after(tempText).remove();
			// 发送按钮
			let sendBtn = $(".bottom-actions>.right-action").removeClass("p-absolute");
			$(sendBtn).find("button").attr("id", "liveDanmuSendBtn");
			$(".chat-input-ctnr").append(sendBtn.clone());
			sendBtn.remove();

			$("#liveDanmuSendBtn").click(async () => {
				let msg = $("#liveDanmuInputArea").val();
				if ((!msg) || isProcessing) { if (isProcessing) { toast("有弹幕正在发送中", 1500, "info") } return; }
				isProcessing = true;
				let page = 1;
				let segment = LIMIT;
				if (msg.length > segment) {
					// 自动平均每条弹幕的长度
					while (msg.length / segment % 1 < 0.7 && msg.length / segment % 1 != 0) {
						segment--;
					}
					page = Math.ceil(msg.length / segment);
					console.log(`长度：${msg.length} 间隔：${segment} 分页：${page}`);
				}
				let count = 0;
				do {
					let str = msg.substr(0, segment);
					let result = await sendMsg(str, count++ ? 500 + Math.random() * 1000 >> 1 : 0);
					msg = msg.substr(segment);
					$("#liveDanmuInputArea").val(msg);
					document.querySelector("#liveDanmuInputArea").oninput();
				} while (msg.length > 0);
				isProcessing = false;
			});
			document.querySelector('#liveDanmuInputArea').oninput = function () {
				displayDiv.scrollTop = this.scrollTop;
				document.querySelector(".chat-input-cover").innerHTML = filter(this.value);
				let length = this.value.length;
				$(".input-limit-hint").text(length);
				if (length > LIMIT) {
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
			document.querySelector('#liveDanmuInputArea').onscroll = function () {
				// 同步滚动
				displayDiv.scrollTop = this.scrollTop;
			}
		}
	}, 100);

	function filter(str) {
		for (let key in riverCrabs) {
			if (str.indexOf(key) >= 0) {
				str = str.replaceAll(key, `<span class="${riverCrabs[key]}-word">${key}</span>`);
			}
		}
		return str;
	}

	async function sendMsg(msg, timer = 500) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				formData.set("msg", msg);
				formData.set("rnd", Math.floor(new Date() / 1000));
				fetch("//api.live.bilibili.com/msg/send", {
					credentials: 'include',
					method: 'POST',
					body: formData
				})
					.then(response => response.json())
					.then(result => {
						if (result.code != 0 || result.msg != "") {
							switch (result.msg) {
								case "f":
									result.msg = "弹幕含有敏感词";
									break;
								case "fire":
									result.msg = "弹幕含有系统屏蔽词";
									break;
								case "k":
									result.msg = "内容含有房间屏蔽词";
									break;
								default:
									result.msg = result.message;
							}
							if (result.code == -111) {
								jct = document.cookie.match(/bili_jct=(\w*); /)[1];
								formData.set("csrf", jct);
								formData.set("csrf_token", jct);
							}
							toast(result.msg);
							isProcessing = false;
							reject(result);
						} else {
							resolve(true);
						}
					})
					.catch(err => {
						console.log("发送弹幕出错：", err);
						toast(err.msg || err.message);
						isProcessing = false;
						reject(err);
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