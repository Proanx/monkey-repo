// ==UserScript==
// @name         Jav增强
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  try to take over the world!
// @author       You
// @match       *://www.javlibrary.com/cn/?v=*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // cawd259
    // https://cc3001.dmm.co.jp/litevideo/freepv/c/caw/cawd00259/cawd00259_mhb_w.mp4
    // 149tmrd1065
    // https://cc3001.dmm.co.jp/litevideo/freepv/1/149/149tmrd1065/149tmrd1065_sm_w.mp4
    // ssis122
    // https://cc3001.dmm.co.jp/litevideo/freepv/s/ssi/ssis00122/ssis00122_sm_w.mp4
    // 1nhdtb570
    // https://cc3001.dmm.co.jp/litevideo/freepv/1/1nh/1nhdtb570/1nhdtb570_mhb_w.mp4
    // 1rctd418
    // https://cc3001.dmm.co.jp/litevideo/freepv/1/1rc/1rctd418/1rctd418_mhb_w.mp4
    // jul674
    // https://cc3001.dmm.co.jp/litevideo/freepv/j/jul/jul00674/jul00674_mhb_w.mp4
    // ssis129
    // https://cc3001.dmm.co.jp/litevideo/freepv/s/ssi/ssis00129/ssis00129_mhb_w.mp4

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

    $(".btn_videoplayer").unbind().click(function () {
        $(".video-shadow").css("display", "flex");
        if ($(".preview-video").attr("src")) { return; }
        let cid = $(this).attr("attr-data");
        if (!cid.match(/^\d/)) {
            let r = cid.match(/(\d*)([a-zA-Z]*)(\d*)/);
            cid = "";
            for (let i = 1; i < r.length; i++) {
                cid += r[i];
                if (i == 2) { cid += "00"; }
            }
        }
        let url = `https://cc3001.dmm.co.jp/litevideo/freepv/${cid[0]}/${cid.substr(0, 3)}/${cid}/${cid}_mhb_w.mp4`;
        $(".preview-video").attr("src", url);
        $(".preview-video")[0].play();
    });

    function copyText(text, callback) { // text: 要复制的内容， callback: 回调
        var tag = document.createElement('input');
        tag.setAttribute('id', 'cp_hgz_input');
        tag.value = text;
        document.getElementsByTagName('body')[0].appendChild(tag);
        document.getElementById('cp_hgz_input').select();
        document.execCommand('copy');
        document.getElementById('cp_hgz_input').remove();
        if (callback) { callback(text) }
    }

    $("#video_id").click(function () {
        copyText($("#video_id").find(".text")[0].innerText);
    })

})();