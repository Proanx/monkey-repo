// ==UserScript==
// @name            B站直播自动抢红包
// @version         0.1.7
// @description     会在进房间以后的下一次发红包时开始生效
// @author          Pronax
// @include         /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon            http://bilibili.com/favicon.ico
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @run-at          document-end
// @noframes
// @require         https://greasyfork.org/scripts/434638-xfgryujk-s-bliveproxy/code/xfgryujk's%20bliveproxy.js?version=983438
// @require         https://greasyfork.org/scripts/430098-alihesari-s-notice-js-0-4-0/code/alihesari's%20noticejs%20040.js?version=985170
// ==/UserScript==

(function () {

    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    const JCT = document.cookie.match(/bili_jct=(\w*); /)[1];
    const ROOM_ID = __NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.room_id;
    const ROOM_USER_ID = __NEPTUNE_IS_MY_WAIFU__.roomInitRes.data.uid;

    // 通知css    
    GM_addStyle(".noticejs-link{margin-right:15px}.noticejs-top{top:0;width:100%!important}.noticejs-top .item{border-radius:0!important;margin:0!important}.noticejs-topRight{top:10px;right:10px}.noticejs-topLeft{top:10px;left:10px}.noticejs-topCenter{top:10px;left:50%;transform:translate(-50%)}.noticejs-middleLeft,.noticejs-middleRight{right:10px;top:50%;transform:translateY(-50%)}.noticejs-middleLeft{left:10px}.noticejs-middleCenter{top:50%;left:50%;transform:translate(-50%,-50%)}.noticejs-bottom{bottom:0;width:100%!important}.noticejs-bottom .item{border-radius:0!important;margin:0!important}.noticejs-bottomRight{bottom:10px;right:10px}.noticejs-bottomLeft{bottom:10px;left:10px}.noticejs-bottomCenter{bottom:10px;left:50%;transform:translate(-50%)}.noticejs{opacity:0.85;font-size: 14px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif}.noticejs .item{margin:0 0 10px;border-radius:5px;overflow:hidden}.noticejs .item .close{cursor:pointer;width:21px;height:21px;text-align: center;margin-top: -3px;margin-right: -3px;float:right;font-size:18px;font-weight:700;line-height:1;color:#fff;text-shadow:0 1px 0 #fff;opacity:1;}.noticejs .item .close:hover{opacity:.5;color:#000}.noticejs .item a{color:#fff;border-bottom:1px dashed #fff}.noticejs .item a,.noticejs .item a:hover{text-decoration:none}.noticejs .success{background-color:#64ce83}.noticejs .success .noticejs-heading{background-color:#3da95c;color:#fff;padding:5px}.noticejs .success .noticejs-body{color:#fff;padding:10px}.noticejs .success .noticejs-body:hover{visibility:visible!important}.noticejs .success .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .info{background-color:#3ea2ff}.noticejs .info .noticejs-heading{background-color:#067cea;color:#fff;padding:5px}.noticejs .info .noticejs-body{color:#fff;padding:10px}.noticejs .info .noticejs-body:hover{visibility:visible!important}.noticejs .info .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .warning{background-color:#ff7f48}.noticejs .warning .noticejs-heading{background-color:#f44e06;color:#fff;padding:5px}.noticejs .warning .noticejs-body{color:#fff;padding:10px}.noticejs .warning .noticejs-body:hover{visibility:visible!important}.noticejs .warning .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .error{background-color:#e74c3c}.noticejs .error .noticejs-heading{background-color:#ba2c1d;color:#fff;padding:5px}.noticejs .error .noticejs-body{color:#fff;padding:10px}.noticejs .error .noticejs-body:hover{visibility:visible!important}.noticejs .error .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .progressbar{width:100%}.noticejs .progressbar .bar{width:1%;height:30px;background-color:#4caf50}.noticejs .success .noticejs-progressbar{width:100%;background-color:#64ce83;margin-top:-1px}.noticejs .success .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#3da95c}.noticejs .info .noticejs-progressbar{width:100%;background-color:#3ea2ff;margin-top:-1px}.noticejs .info .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#067cea}.noticejs .warning .noticejs-progressbar{width:100%;background-color:#ff7f48;margin-top:-1px}.noticejs .warning .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#f44e06}.noticejs .error .noticejs-progressbar{width:100%;background-color:#e74c3c;margin-top:-1px}.noticejs .error .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#ba2c1d}@keyframes noticejs-fadeOut{0%{opacity:1}to{opacity:0}}.noticejs-fadeOut{animation-name:noticejs-fadeOut}@keyframes noticejs-modal-in{to{opacity:.3}}@keyframes noticejs-modal-out{to{opacity:0}}.noticejs-rtl .noticejs-heading{direction:rtl}.noticejs-rtl .close{float:left!important;margin-left:7px;margin-right:0!important}.noticejs-rtl .noticejs-content{direction:rtl}.noticejs{position:fixed;z-index:10050;width:320px}.noticejs ::-webkit-scrollbar{width:8px}.noticejs ::-webkit-scrollbar-button{width:8px;height:5px}.noticejs ::-webkit-scrollbar-track{border-radius:10px}.noticejs ::-webkit-scrollbar-thumb{background:hsla(0,0%,100%,.5);border-radius:10px}.noticejs ::-webkit-scrollbar-thumb:hover{background:#fff}.noticejs-modal{position:fixed;width:100%;height:100%;background-color:#000;z-index:10000;opacity:.3;left:0;top:0}.noticejs-modal-open{opacity:0;animation:noticejs-modal-in .3s ease-out}.noticejs-modal-close{animation:noticejs-modal-out .3s ease-out;animation-fill-mode:forwards}");

    var notice;
    var followed;

    var formData = new FormData();
    formData.set("csrf", JCT);
    formData.set("visit_id", "");
    formData.set("jump_from", "");
    formData.set("session_id", "");
    formData.set("csrf_token", JCT);
    formData.set("room_id", ROOM_ID);
    formData.set("ruid", ROOM_USER_ID);
    formData.set("spm_id", "444.8.red_envelope.extract");

    fetch(`https://api.bilibili.com/x/space/acc/info?mid=${ROOM_USER_ID}&jsonp=jsonp`, {
        "credentials": "include"
    })
        .then(res => res.json())
        .then(json => {
            followed = json.data.is_followed;
        });

    bliveproxy.addCommandHandler("POPULARITY_RED_POCKET_START", drawRadPacket);
    bliveproxy.addCommandHandler("POPULARITY_RED_POCKET_WINNER_LIST", radPacketWinner);

    function drawRadPacket(message) {
        if (GM_getValue("limitWarning") == new Date().toLocaleDateString('zh')) {
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
                if (json.code != 0 || json.data.join_status != 1) {
                    console.log(json);
                    if (json.code == 1009109) {
                        showMessage(json.message, "warning", null, false);
                        GM_setValue("limitWarning", new Date().toLocaleDateString('zh'));
                        return;
                    }
                    showMessage(json.message, "error", "抢红包失败", false);
                } else {
                    notice = showMessage(`坐等 ${message.data.sender_name} 的红包开奖<br>红包ID：${message.data.lot_id}`, "info", "啊哈哈哈哈哈哈，红包来咯", message.data.last_time * 10);
                    if (!followed) {
                        setTimeout(unfollow, 3000);
                    }
                }
            });
    }

    function unfollow() {
        fetch(`https://api.bilibili.com/x/relation/tag/user?fid=${ROOM_USER_ID}&jsonp=jsonp&_=${Date.now()}`, {
            "credentials": "include"
        })
            .then(res => res.text())
            .then(result => {
                let json = JSON.parse(result);
                if (Object.keys(json.data).length == 0) {
                    let data = new FormData();
                    data.set("act", "2");
                    data.set("csrf", JCT);
                    data.set("re_src", "11");
                    data.set("jsonp", "jsonp");
                    data.set("fid", ROOM_USER_ID);
                    data.set("spmid", "333.999.0.0");
                    data.set("extend_content", `{ "entity": "user", "entity_id": ${ROOM_USER_ID} }`);
                    fetch("https://api.bilibili.com/x/relation/modify", {
                        credentials: "include",
                        method: 'POST',
                        body: data
                    })
                        .then(res => res.json())
                        .then(json => {
                            console.log(json);
                        });
                }
            });
    }

    function radPacketWinner(message) {
        for (let winner of message.data.winner_info) {
            if (__NEPTUNE_IS_MY_WAIFU__.userLabInfo.data.uid == winner.uid) {
                showMessage(`抽中了${winner.award_name} *${winner.gift_num}个！`, "success", "中奖啦！", false);
                return;
            }
        }
        if (!followed) {
            unfollow();
        }
    }

    function showMessage(msg, type = "info", title, time = 30, pos = 'bottomLeft') {
        const TITLE = {
            "info": "提示",
            "error": "错误",
            "success": "成功",
            "warning": "警告",
        }
        // type: success[green] error[red] warning[orange] info[blue]
        // pos: topLeft, topCenter, middleLeft, middleRight, middleCenter, bottomLeft, bottomRight, bottomCenter
        // timeout: timeout * 100ms  代码内部似乎还有固定0.5s的前置/后置延迟
        return new NoticeJs({
            title: title || TITLE[type],
            text: msg,
            timeout: time,
            type: type,
            position: pos
        }).show();
    }

})()