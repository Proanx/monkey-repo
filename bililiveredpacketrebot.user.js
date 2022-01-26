// ==UserScript==
// @name            B站直播自动抢红包
// @version         0.1.0
// @description     会在进房间以后的下一次发红包时开始生效
// @author          Pronax
// @include         /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon            http://bilibili.com/favicon.ico
// @grant           GM_addStyle
// @run-at          document-end
// @noframes
// @require         https://greasyfork.org/scripts/434638-xfgryujk-s-bliveproxy/code/xfgryujk's%20bliveproxy.js?version=983438
// ==/UserScript==

(function () {

    const JCT = document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];
    const ROOM_ID = __NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.room_id;
    const ROOM_USER_ID = __NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.uid;

    var formData = new FormData();

    var limitWarning = {};

    formData.set("csrf", JCT);
    formData.set("visit_id", "");
    formData.set("jump_from", "");
    formData.set("session_id", "");
    formData.set("csrf_token", JCT);
    formData.set("room_id", ROOM_ID);
    formData.set("ruid", ROOM_USER_ID);
    formData.set("spm_id", "444.8.red_envelope.extract");

    bliveproxy.addCommandHandler("POPULARITY_RED_POCKET_START", drawRadPacket);

    function drawRadPacket(message) {
        if (limitWarning[new Date().toLocaleDateString('zh')]) {
            return;
        }

        formData.set("lot_id", message.data.lot_id);

        fetch("https://api.live.bilibili.com/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw", {
            credentials: 'include',
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(json => {
                console.log(json);
                if (json.code != 0 || json.data.join_status != 1) {
                    if (json.code == 1009109) {
                        limitWarning[new Date().toLocaleDateString('zh')] = true;
                    }
                    alert("抢红包失败：" + json.message);
                }
            });
    }

})()