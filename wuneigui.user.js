// ==UserScript==
// @name         微博无内鬼图片处理+拉黑内鬼
// @namespace    http://pronax.tech/
// @version      2021-8-15 16:40:02
// @description  try to take over the world!
// @author       You
// @match        https://weibo.com/3176010690/*
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

// 原图地址
// https://photo.weibo.com/h5/comment/compic_id/1022:23059769b0a8a31be1a68c699e900b62aacb01
// 原图实际图片
// https://wx4.sinaimg.cn/bmiddle/005wFKbUgy1gtgfx1va9zg607k0dcqvd02.gif
// 小图
// https://wx4.sinaimg.cn/mw1024/005wFKbUgy1gtgfx1va9zg607k0dcqvd02

(function () {
	'use strict';

	GM_addStyle(".WB_frame{width:1200px !important}.WB_frame_c{width:1200px}");
	GM_addStyle(".iconoGraph{max-width:200px}");

	var real_ng_list = ["2671562317", "5334141065", "1945987267", "7563836395", "2680672033", "5304894067", "7415309425", "6345843055", "7226822845", "5831076343", "5928929014", "7570487236", "5234287588", "5763947689", "6259812513", "6367090201", "7330956181", "3606572233", "7315063626", "7307948916", "6545355034", "2619054701", "2179108717", "5837773588", "5936018672", "5840135182", "5028156161", "6480626845", "2487754642", "6017668207", "5750663305", "5241389666", "5686627491", "7482359873", "5764580212", "5190907726", "7510503735", "6008273099", "2839650043", "5615937987", "5934070814", "6592810151", "5634370977", "6041633157"];

	unsafeWindow.getPhoto = (targ, photoId) => {
		let url = $(targ).attr("alt");
		GM_xmlhttpRequest({
			url: url,
			method: "get",
			onload: function (res) {
				if (res && res.status == 200) {
					let src = res.response.match(/src="(.*)">/)[1];
					if (photoId) {
						$(targ).before(`<a href="https://wx4.sinaimg.cn/mw1024/${photoId}" target="_blank"><img class="wng_img iconoGraph" src="https://wx4.sinaimg.cn/mw1024/${photoId}"></img>`);
						$(targ).after("<a style='cursor: pointer;' onclick='catchNeigui(this)'>建议击毙</a>");
					}
					$(targ).before(`<a href="${src}" target="_blank"><img class="wng_img " src="${src}"></img>`);
					$(targ).remove();
				} else {
					console.log("状态错误", res);
				}
			},
			onerror: function (err) {
				console.log("错误", err);
			}
		});
	}

	unsafeWindow.noNeigui = function () {
		let ng_list = $(".WB_text");
		for (let i = 1; i < ng_list.length; i++) {
			let ng = $(ng_list[i].children[0]).attr("usercard");
			if (ng != undefined) {
				let ng_id = ng.slice(3);
				if (real_ng_list.indexOf(ng_id) < 0) {
					// $(ng_list[i]).append("<a style='cursor: pointer;' onclick='catchNeigui(this)'>建议击毙</a>");
				} else {
					$(ng_list[i].parentNode.parentNode).remove();
				}
			}
		}
		var wng = $(".ficon_cd_img");
		for (let i = 0; i < wng.length; i++) {
			let targ = $(wng[i]).parent()[0];
			let img_data = $(targ).attr("action-data");
			let photoId = img_data.match(/pid=(.*?)&/)[1];
			$(targ).before(`<a href="https://wx4.sinaimg.cn/mw1024/${photoId}" target="_blank"><img class="wng_img iconoGraph" src="https://wx4.sinaimg.cn/mw1024/${photoId}"></img>`);
			$(targ).after("<a style='cursor: pointer;' onclick='catchNeigui(this)'>建议击毙</a>");
			getPhoto(targ);
		}
	}

	unsafeWindow.catchNeigui = function (me) {
		var ng_target = me.parentNode;
		var target_id = $(ng_target.children[0]).attr("usercard").slice(3);
		real_ng_list.push(target_id);
		copyText("," + '"' + target_id + '"');
		$(me).parents(".list_li.S_line1:first").remove();
	}

	unsafeWindow.copyText = function (text, callback) { // text: 要复制的内容， callback: 回调
		var tag = document.createElement('input');
		tag.setAttribute('id', 'cp_hgz_input');
		tag.value = text;
		document.getElementsByTagName('body')[0].appendChild(tag);
		document.getElementById('cp_hgz_input').select();
		document.execCommand('copy');
		document.getElementById('cp_hgz_input').remove();
		if (callback) { callback(text) }
	}

	function init() {
		var timeout;
		if ($("#plc_main").length == 0) {
			timeout = setTimeout(init, 300);
			return;
		}
		clearTimeout(timeout);
		$("#plc_main").bind('mousedown', function (event) {
			if (event.button == 3 || event.button == 4) {
				let common_parent = $(event.target).parents(".list_li.S_line1.clearfix:last");
				if (common_parent.attr("node-type") == "root_comment") {
					let a = $(common_parent[0]).find(".list_li_v2 a");
					if (a.length > 0) {
						a[0].click();
					}
				}
				noNeigui();
			}
		});
	}

	init();

})();