// ==UserScript==
// @name            B站直播自动抢红包
// @version         0.1.13
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
// @require         https://greasyfork.org/scripts/439903-blive-room-info-api/code/blive_room_info_api.js?version=1037039
// ==/UserScript==

; (async function () {

    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    // 抢红包门槛，只有红包价值大于等于门槛的时候才会抢
    // 单位是电池
    const doorSill = 0;

    const RED_PACKET_ICON = "🧧";
    const GIFT_ICON = "🎁";
    const JCT = document.cookie.match(/bili_jct=(\w*); /)[1];
    const MY_ID = document.cookie.match(/DedeUserID=(\d+);/)[1];
    const ROOM_ID = await ROOM_INFO_API.getRid();
    const ROOM_USER_ID = await ROOM_INFO_API.getUid();
    const FOLLOWED = await getFollowStatus(ROOM_USER_ID);

    window.addEventListener('focus', e => {
        giftCount = 0;
        setTimeout(() => {
            updateTabTitle();
        }, 3000);
    });

    // 通知css    
    GM_addStyle(".noticejs-heading{user-select:none;}.noticejs-content>span{line-height:20px}.noticejs-content .currency-icon{margin: -6px -4px 0 0;width: 14px;height: 14px;display: inline-block;vertical-align: middle;background-size: cover;background-position: center center;}.noticejs-content .img{margin-left: 15px;width:40px;opacity:1;float:right}.noticejs-link{margin-right:15px}.noticejs-top{top:0;width:100%!important}.noticejs-top .item{border-radius:0!important;margin:0!important}.noticejs-topRight{top:10px;right:10px}.noticejs-topLeft{top:10px;left:10px}.noticejs-topCenter{top:10px;left:50%;transform:translate(-50%)}.noticejs-middleLeft,.noticejs-middleRight{right:10px;top:50%;transform:translateY(-50%)}.noticejs-middleLeft{left:10px}.noticejs-middleCenter{top:50%;left:50%;transform:translate(-50%,-50%)}.noticejs-bottom{bottom:0;width:100%!important}.noticejs-bottom .item{border-radius:0!important;margin:0!important}.noticejs-bottomRight{bottom:10px;right:10px}.noticejs-bottomLeft{bottom:10px;left:10px}.noticejs-bottomCenter{bottom:10px;left:50%;transform:translate(-50%)}.noticejs{font-size: 14px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif}.noticejs .item{margin:0 0 10px;border-radius:5px;overflow:hidden}.noticejs .item .close{cursor:pointer;width:21px;height:21px;text-align: center;margin-top: -3px;margin-right: -3px;float:right;font-size:18px;font-weight:700;line-height:1;color:#fff;text-shadow:0 1px 0 #fff;opacity:1;}.noticejs .item .close:hover{opacity:.5;color:#000}.noticejs .item a{color:#fff;border-bottom:1px dashed #fff}.noticejs .item a,.noticejs .item a:hover{text-decoration:none}.noticejs .success{background-color:#64ce83b3}.noticejs .success .noticejs-heading{background-color:#3da95cb3;color:#fff;padding:5px}.noticejs .success .noticejs-body{color:#fff;padding:5px 10px}.noticejs .success .noticejs-body:hover{visibility:visible!important}.noticejs .success .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .info{background-color:#3ea2ffb3}.noticejs .info .noticejs-heading{background-color:#067ceab3;color:#fff;padding:5px}.noticejs .info .noticejs-body{color:#fff;padding:5px 10px}.noticejs .info .noticejs-body:hover{visibility:visible!important}.noticejs .info .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .warning{background-color:#ff7f48b3}.noticejs .warning .noticejs-heading{background-color:#f44e06b3;color:#fff;padding:5px}.noticejs .warning .noticejs-body{color:#fff;padding:5px 10px}.noticejs .warning .noticejs-body:hover{visibility:visible!important}.noticejs .warning .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .error{background-color:#e74c3cb3}.noticejs .error .noticejs-heading{background-color:#ba2c1db3;color:#fff;padding:5px}.noticejs .error .noticejs-body{color:#fff;padding:5px 10px}.noticejs .error .noticejs-body:hover{visibility:visible!important}.noticejs .error .noticejs-content{visibility:visible;word-break:break-all;}.noticejs .progressbar{width:100%}.noticejs .progressbar .bar{width:1%;height:30px;background-color:#4caf50b3}.noticejs .success .noticejs-progressbar{width:100%;background-color:#64ce83b3;margin-top:-1px}.noticejs .success .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#3da95cb3}.noticejs .info .noticejs-progressbar{width:100%;background-color:#3ea2ffb3;margin-top:-1px}.noticejs .info .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#067ceab3}.noticejs .warning .noticejs-progressbar{width:100%;background-color:#ff7f48b3;margin-top:-1px}.noticejs .warning .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#f44e06b3}.noticejs .error .noticejs-progressbar{width:100%;background-color:#e74c3cb3;margin-top:-1px}.noticejs .error .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#ba2c1db3}@keyframes noticejs-fadeOut{0%{opacity:1}to{opacity:0}}.noticejs-fadeOut{animation-name:noticejs-fadeOut}@keyframes noticejs-modal-in{to{opacity:.3}}@keyframes noticejs-modal-out{to{opacity:0}}.noticejs-rtl .noticejs-heading{direction:rtl}.noticejs-rtl .close{float:left!important;margin-left:7px;margin-right:0!important}.noticejs-rtl .noticejs-content{direction:rtl}.noticejs{position:fixed;z-index:10050;}.noticejs ::-webkit-scrollbar{width:8px}.noticejs ::-webkit-scrollbar-button{width:8px;height:5px}.noticejs ::-webkit-scrollbar-track{border-radius:10px}.noticejs ::-webkit-scrollbar-thumb{background:hsla(0,0%,100%,.5);border-radius:10px}.noticejs ::-webkit-scrollbar-thumb:hover{background:#fff}.noticejs-modal{position:fixed;width:100%;height:100%;background-color:#000;z-index:10000;opacity:.3;left:0;top:0}.noticejs-modal-open{opacity:0;animation:noticejs-modal-in .3s ease-out}.noticejs-modal-close{animation:noticejs-modal-out .3s ease-out;animation-fill-mode:forwards}");

    var notice;
    var timeout;
    var giftCount = 0;
    var unpacking = false;
    var giftList = new Map();

    var formData = new FormData();
    formData.set("csrf", JCT);
    formData.set("visit_id", "");
    formData.set("jump_from", "");
    formData.set("session_id", "");
    formData.set("csrf_token", JCT);
    formData.set("room_id", ROOM_ID);
    formData.set("ruid", ROOM_USER_ID);
    formData.set("spm_id", "444.8.red_envelope.extract");

    bliveproxy.addCommandHandler("POPULARITY_RED_POCKET_START", (message) => {
        if (doorSill <= (message.data.total_price / 100)) {
            setTimeout(() => {
                drawRadPacket(message);
            }, Math.random() * 10000);
        }
    });
    bliveproxy.addCommandHandler("POPULARITY_RED_POCKET_WINNER_LIST", radPacketWinner);

    window.addEventListener('beforeunload', (event) => {
        if (timeout) {
            clearTimeout(timeout);
            unfollow();
        }
    });

    fetch(`https://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb?roomid=${ROOM_ID}`)
        .then(res => res.json())
        .then(json => {
            if (json.data.popularity_red_pocket && json.data.popularity_red_pocket[0].user_status == 2) {
                let message = {
                    data: json.data.popularity_red_pocket[0]
                };
                if (doorSill <= (message.data.total_price / 100)) {
                    setTimeout(() => {
                        drawRadPacket(message);
                    }, Math.random() * 10000);
                }
            }
        });

    function drawRadPacket(message) {
        if (GM_getValue("limitWarning") == new Date().toLocaleDateString('zh')) {
            return;
        }

        if (giftList.size == 0) {
            initGiftList();
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
                    switch (json.code) {
                        case 1009109:
                            showMessage(json.message, "warning", null, false);
                            GM_setValue("limitWarning", new Date().toLocaleDateString('zh'));
                            return;
                        case 1009114:       // 已抽奖
                            let countdown = message.data.end_time * 1000 - Date.now();
                            notice = showMessage(`坐等 ${message.data.sender_name} 的红包开奖<br>红包ID：${message.data.lot_id}`, "info", "啊哈哈哈哈哈哈，红包来咯", countdown);
                            unpacking = true;
                            updateTabTitle();
                            return;
                        default:
                    }
                    showMessage(json.message, "error", "抢红包失败", false);
                } else {
                    clearTimeout(timeout);
                    timeout = null;
                    let countdown = message.data.end_time * 1000 - Date.now();
                    notice = showMessage(`坐等 ${message.data.sender_name} 的红包开奖<br>红包ID：${message.data.lot_id}`, "info", "啊哈哈哈哈哈哈，红包来咯", countdown);
                    unpacking = true;
                    updateTabTitle();
                }
            });
    }

    async function unfollow() {
        return new Promise((r, j) => {
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
                                return r(json.code != json.message);
                            });
                    }
                });
        });
    }

    function radPacketWinner(message) {
        unpacking = false;
        for (let winner of message.data.winner_info) {
            if (MY_ID == winner.uid) {
                let giftDetail = giftList.get(winner.award_id);
                showMessage(`
                    <img src="${giftDetail ? giftDetail.gif : winner.award_pic}" class="img"></img>
                    <span>
                        获得：${winner.award_name}
                    </span>
                    <br>
                    <span>
                        价值：
                        <span class="coin-type dp-i-block v-middle none-select">
                            <i class="currency-icon" style="background-image: url(&quot;data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABDBJREFUaAXVWt1rFFcU/92Z3Z3sJiHRxBhNRe0ihSLSF20fBBWDL/og2Pf+A774IKGU0gXf2jcf/RMsQkXwg4IgVKxUUBB9SJssRtGQaLr52J1sZmduz93qujt752Nn713WE8jOPeeee36/O+d+zQzwiQtThZ8/K2QwZBxAzctGtmlhDVP4h7GCF1k3okIqwh7LzDmBL+Iv1NxDsRyqVKvIrtH/b2PVD6lkhNjimxaMw+A8HvgPrXJ+jhcLox+KSX/VEPC84UQA0hhK5NfkpIZAU4O9vow1Bji/auLN822B4KpsBOCB5kDDFrbz14VNqd3LcEx9v8IYC204dBbi85e+ANzLFOAo5XhOGkinkrES9ctNDOICmywsyUIFEuALl/Jw3CfUs13nqSxwRzrGijRaDrGJwobfLziFHPdnZeANC8hM+GO3l70twFmlsL6s4nw/1tlFcvjJ7xRMQKSNKjEHgaGD8Vuz54HyLNVvSX8pnpBZiMfosviYOqqZ/RzI7vO7SPGEEPD797icy8cK2L8EWBpgA5Ek+peAgG6Y/UHAfvMrSn8ew9bynUhAnVbQfgectafYXPkD3KvCeXe3U3yR9bUS4LV1VJZvNkAY1njjWtWFVgLlpRvw3I+LkpGZVIW70Y42Altrj+Fs/N0IJC4Ma2dLWUVBCwGvtorK0u02fIa1q03XrUIDAY7K4nUatLSv8ckncQeqq4/gVIo+6LQmMRMs0+eD2HNWYC//3gZeKAxLbGXU33CFLXKUF3+j1HHkBDTMQPWOkUZLoKz++wA1+2Wgp2GJKdSDV5mjFfk2PLs9zQKdQwxh54EQt1YTdzdgvw1fZZ3SQ5QeToO7lbozM3MYPXxL5FZrYx2WFBGw6cjsNkIbBIqLv6aZSIyPZmHikGPQjrNLUULAyOzA8GffQcz/qYHdMGi2WV+4gtrmYiC8XH6GbN0PQSUEBMpUbp/4aYgnzrYBYk2cQXqb9IQY4BGs7r4LZG1zh/ZAtsxS307k9l+Q2pIotRAI6n3xDGcw/wMg8l+RaCJQksKzJs8hNXpEakuq1EOABrNfzIEpZPee96u7LveEAAND7sCPlDrR7z46ZaSHgG8GssaOIzX8VafYYtXXTsCkNSE7cToWmCSV9BBw1+pYROoM7jqrZMUNIqeFQHroS4JOTwfHT8K0poJiK9ErW4mb0WTHp5EdO0GnmOgHU81+Sa613IE6EBXgefRbWH0EknRnsw9tR+jQ0KyRXvcvAcm5WsYghABbljn0RGe/AOw5fygpnrBBfJ9aoDlQgdTK9MbleXRD4gAktiHvT20tDgwCT5uEEZihZyGnlLyd5PRtgejVxMIWMIJfZO6BKcTyhVmk8DWRuEfzYftTKllrqnWMlSn+NZjpb9hY4f/V0ReD+crSYv1jjlepHVKjLiWvcezBYtQXLf8BGOoetC6LwK8AAAAASUVORK5CYII=&quot;);"></i>
                        </span>
                        <span class="text">${Math.round(winner.award_price / 100)}</span>
                    </span>
                `, "success", "中奖啦！", false);
                giftCount++;
                break;
            }
        }
        updateTabTitle();
        if (!FOLLOWED) {
            timeout = setTimeout(async () => {
                let unfollowed = await unfollow();
                if (unfollowed) {
                    unfollow();
                }
            }, 10000);
        }
    }

    function showMessage(msg, type = "info", title, time = 3000, pos = 'bottomLeft') {
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
            timeout: time ? Math.round(time / 100) : time,
            type: type,
            position: pos
        }).show();
    }

    function updateTabTitle() {
        let title = document.title.replace(/(🧧 🎁\*\d* )|(🧧 )|(🎁\*\d* )/, "");
        let header = "";
        if (unpacking) {
            header += RED_PACKET_ICON;
        }
        if (giftCount > 0) {
            if (header) {
                header += " ";
            }
            header += GIFT_ICON + "*" + giftCount;
        }
        if (header) {
            header += " ";
        }
        document.title = header + title;
    }

    async function getFollowStatus(uid) {
        return new Promise((r, j) => {
            fetch(`https://api.bilibili.com/x/space/acc/info?mid=${uid}&jsonp=jsonp`, {
                "credentials": "include"
            })
                .then(res => res.json())
                .then(json => {
                    r(json.data.is_followed);
                });
        });
    }

    function initGiftList() {
        fetch(`https://api.live.bilibili.com/xlive/web-room/v1/giftPanel/giftConfig?platform=pc&room_id=${ROOM_ID}`)
            .then(res => res.json())
            .then(json => {
                if (json.code == json.message) {
                    for (const item of json.data.list) {
                        giftList.set(item.id, item);
                    }
                }
            });
    }

})();