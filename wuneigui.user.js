// ==UserScript==
// @name         微博无内鬼图片处理+拉黑内鬼
// @namespace    http://pronax.tech/
// @version      2021-1-8 11:09:00
// @description  try to take over the world!
// @author       You
// @match        https://weibo.com/3176010690/*
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function() {
	'use strict';

	GM_addStyle(".WB_frame{margin:0 !important}#plc_main{width:max-content !important}.WB_frame_c{width:59% !important;margin-left:5% !important}");

	var real_ng_list = ["2671562317","6259812513","3606572233","5837773588","5840135182","5028156161","6480626845","2487754642","6017668207","5750663305","5241389666","5686627491","7482359873","5764580212","5190907726","7510503735","6008273099","2839650043","5615937987","5934070814","6592810151","5634370977","6041633157"];

	unsafeWindow.ajaxUrl = function (url){
		GM_xmlhttpRequest({

			// http://tool.chacuo.net/commonrestoreuri?data=  ${url}  &type=restoreuri

			url: 'http://www.jsons.cn/tsrestoreurl/?url_txt='+encodeURIComponent(url),
			onload: function(res){
				if(res.status === 200){
					let val = $(res.response).find("#longurl").val();
					console.log(val);
					return val.substring(val.indexOf("&url=")+5,val.indexOf("&domain="));
				}else{
					alert(res);
				}
			},
			onerror : function(err){
				alert(err);
			}
		});
	}

	unsafeWindow.noNeigui = function (){
		let ng_list = $(".WB_text");
		for (let i = 1; i < ng_list.length; i++) {
			let ng = $(ng_list[i].children[0]).attr("usercard");
			if(ng!=undefined){
				let ng_id = ng.slice(3);
				if(real_ng_list.indexOf(ng_id)<0){
					//$(ng_list[i]).append("<a style='cursor: pointer;' onclick='catchNeigui(this)'>建议击毙</a>");
				}else{
					$(ng_list[i].parentNode.parentNode).remove();
				}
			}
		}
		var wng = $(".ficon_cd_img");
		for (let i = 0; i < wng.length; i++) {
			let img_a = $(wng[i]).parent()[0];
			let img_data = $(img_a).attr("action-data");
			let img_url = img_data.slice(58,90);
			$(img_a).after("<a style='cursor: pointer;' onclick='catchNeigui(this)'>建议击毙</a>");
			$(img_a).html('<a href="https://wx4.sinaimg.cn/mw1024/'+img_url+'" target="_blank"><img class="wng_img un_wng" src="https://wx4.sinaimg.cn/mw1024/'+img_url+'" style="width:25%;"></img>');
			//             $(img_a).remove();
		}
	}

	unsafeWindow.catchNeigui = function (me){
		var ng_target = me.parentNode;
		var target_id = $(ng_target.children[0]).attr("usercard").slice(3);
		real_ng_list.push(target_id);
		copyText(","+'"'+target_id+'"');
	}

	unsafeWindow.copyText = function (text, callback){ // text: 要复制的内容， callback: 回调
		var tag = document.createElement('input');
		tag.setAttribute('id', 'cp_hgz_input');
		tag.value = text;
		document.getElementsByTagName('body')[0].appendChild(tag);
		document.getElementById('cp_hgz_input').select();
		document.execCommand('copy');
		document.getElementById('cp_hgz_input').remove();
		if(callback) {callback(text)}
	}

	function init(){
		var timeout;
		if($("#plc_main").length==0){
			timeout = setTimeout(init,300);
			return;
		}
		clearTimeout(timeout);
		$("#plc_main").bind('mousedown',function(event){
			if(event.button==3||event.button==4){
				let common_parent = $(event.target).parents(".list_li.S_line1.clearfix");
				if(common_parent.length>0){
					let a = $(common_parent[common_parent.length-1]).find(".list_li_v2 a");
					if(a.length>0){
						a[0].click();
					}
				}
				noNeigui();
			}
		});
	}

	init();

})();