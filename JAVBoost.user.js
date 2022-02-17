// ==UserScript==
// @name            Jav增强
// @namespace       http://tampermonkey.net/
// @version         1.0.0
// @description     try to take over the world!
// @author          You
// @match           *://www.javlibrary.com/cn/?v=*
// @connect         dmm.co.jp
// @grant           GM_addStyle
// @grant           GM_setClipboard
// @grant           GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    getArgs();

    GM_addStyle(".video-shadow{position:fixed;justify-content:center;align-items:center;display:none;z-index:100;top:0;right:0;bottom:0;left:0;margin:0;background:#00000066;opacity:1;}");
    GM_addStyle(".preview-video{width: 640px;}");
    $("body").append('<div class="video-shadow"><video class="preview-video" src="" controls="controls">您的浏览器不支持 video 标签。</video></div>');

    $(".video-shadow").click(function () {
        $(".preview-video")[0].pause();
        $(this).css("display", "");
    });

    $(".preview-video").click(function (e) {
        e.stopPropagation();
    });

    $(".btn_videoplayer").unbind().click(() => {
        $(".video-shadow").css("display", "flex");
        $(".preview-video")[0].play();
    });

    $("#video_id").css("cursor", "pointer").click(function () {
        GM_setClipboard($("#video_id").find(".text")[0].innerText, "text");
    })

    function getArgs() {
        GM_xmlhttpRequest({
            url: `https://www.dmm.co.jp/service/-/html5_player/=/cid=${$(".btn_videoplayer").attr("attr-data")}/mtype=AhRVShI_/service=mono/floor=dvd/mode=/`,
            method: "get",
            onload: function (res) {
                let reg = res.responseText.match(/const args = ({.*});/);
                if (reg) {
                    let args = JSON.parse(reg[1]);
                    $(".preview-video").attr("src", args.src);
                } else {
                    console.log("所在地区不支持观看视频");
                }
            },
            onerror: function (err) {
                console.log(err);
                alert("获取视频参数出错");
            },
            ontimeout: function (err) {
                console.log("尝试超时", err);
                alert("访问超时");
            }
        });
    }

})();