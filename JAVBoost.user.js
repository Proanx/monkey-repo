// ==UserScript==
// @name            Jav增强
// @namespace       http://tampermonkey.net/
// @version         0.1.3
// @description     try to take over the world!
// @author          You
// @match           *://www.javlibrary.com/cn/?v=*
// @grant           GM_addStyle
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
    // 1stars407
    // https://cc3001.dmm.co.jp/litevideo/freepv/1/1st/1stars00407/1stars00407_mhb_w.mp4
    // https://cc3001.dmm.co.jp/litevideo/freepv/g/gvh/gvh314/gvh314_mhb_w.mp4

    GM_addStyle(".video-shadow{position:fixed;justify-content:center;align-items:center;display:none;z-index:100;top:0;right:0;bottom:0;left:0;margin:0;background:#00000066;opacity:1;}");
    GM_addStyle(".preview-video{width: 640px;}");
    $("body").append('<div class="video-shadow"><video class="preview-video" src="" controls="controls">您的浏览器不支持 video 标签。</video></div>');

    var cid, reTry = 0;

    $(".video-shadow").click(function () {
        $(".preview-video")[0].pause();
        $(this).css("display", "");
    });

    $(".preview-video").click(function (e) {
        e.stopPropagation();
    }).error(function () {
        if (!this.getAttribute("src") || reTry++ > 1) { return; }
        let r = cid.match(/(\d*)([a-zA-Z]*)(\d*)/);
        let url = "";
        switch (reTry) {
            case 0:
                url = `https://cc3001.dmm.co.jp/litevideo/freepv/${cid[0]}/${cid.substr(0, 3)}/${r[2] + r[3]}/${r[2] + r[3]}_mhb_w.mp4`;
                break;
            case 1:
                // url = `https://cc3001.dmm.co.jp/litevideo/freepv/${cid[0]}/${cid.substr(0, 3)}/${cid}/${cid}_mhb_w.mp4`;
                alert("地址错误");
                break;
        }
        $(".preview-video").attr("src", url);
        $(".preview-video")[0].play();
    });

    $(".btn_videoplayer").unbind().click(function () {
        $(".video-shadow").css("display", "flex");
        if ($(".preview-video").attr("src")) { return; }
        cid = $(this).attr("attr-data");
        let url = `https://cc3001.dmm.co.jp/litevideo/freepv/${cid[0]}/${cid.substr(0, 3)}/${cid}/${cid}_mhb_w.mp4`;
        $(".preview-video").attr("src", url);
        $(".preview-video")[0].play();
    });

    $("#video_id").click(function () {
        navigator.clipboard.writeText($("#video_id").find(".text")[0].innerText);
    })

})();