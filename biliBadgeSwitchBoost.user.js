// ==UserScript==
// @name         b站直播徽章切换增强
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  所有徽章都能看到了
// @author       You
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        .medal-wear-body .medal-item {
            cursor: pointer;
            padding: 5px;
            margin: 1px;
            background: 0;
            border: 1px solid transparent;
            border-radius:5px;
            width:calc(100% - 5px);
            text-align:left
        }
        .medal-wear-body .medal-item:hover {
            border:1px solid #5dcef5;
        }
        .medal-wear-body .medal-item .living-gif {
            background-image: url(//s1.hdslb.com/bfs/static/blive/live-fansmedal-wall/static/img/icon-online.fd4254c1.gif);
            background-size: cover;
            width: 12px;
            height: 12px;
			margin-left: 2px;
			transform: rotateY(180deg);
        }
        .medal-wear-body{
            padding-top:4px !important;
            max-height:240px;
            overflow:auto;
			scrollbar-width: thin;
        }

        .medal-wear-body::-webkit-scrollbar{
            width:6px
        }
        .medal-wear-body::-webkit-scrollbar-thumb{
            background-color:#aaa
        }

        .medal-wear-body .medal-item>.name{
            margin-left:5px;
            color: #666;
            position: relative;
        }

        .medal-wear-body .medal-item>.text{
            color: #666;
            position: relative;
        }
        .medal-wear-body .medal-item .progress-level-div {
            margin-top: 5px;
        }

        .medal-wear-body .medal-item .progress-level-div .level-span-left {
            text-align: right;
        }

        .medal-wear-body .medal-item .progress-level-div .level-span {
            width: 29px;
            color: #999;
            position: relative;
            top: -2px;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div {
            line-height: 14px;
            height: 14px;
            width: 174px;
            background-color: #e2e8ec;
            border-radius: 2px;
            text-align: center;
            margin: 0 5px;
            position: relative;
            overflow: hidden;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div-cover {
            width: 80px;
            position: absolute;
            left: 0;
            top: 0;
            overflow: hidden;
            background-color: #23ade5;
            height: 14px;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div .progress-num-span {
            color: #23ade5;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div-cover .progress-num-span-cover {
            width: 174px;
            position: relative;
            z-index: 1000;
            line-height: 14px;
            color: #fff;
        }
    `);

    function ajaxEventTrigger(event) {
        var ajaxEvent = new CustomEvent(event, { detail: this });
        unsafeWindow.dispatchEvent(ajaxEvent);
    }

    var oldXHR = unsafeWindow.XMLHttpRequest;

    function newXHR() {
        var realXHR = new oldXHR();

        realXHR.addEventListener('abort', function () { ajaxEventTrigger.call(this, 'ajaxAbort'); }, false);

        realXHR.addEventListener('error', function () { ajaxEventTrigger.call(this, 'ajaxError'); }, false);

        realXHR.addEventListener('load', function () { ajaxEventTrigger.call(this, 'ajaxLoad'); }, false);

        realXHR.addEventListener('loadstart', function () { ajaxEventTrigger.call(this, 'ajaxLoadStart'); }, false);

        realXHR.addEventListener('progress', function () { ajaxEventTrigger.call(this, 'ajaxProgress'); }, false);

        realXHR.addEventListener('timeout', function () { ajaxEventTrigger.call(this, 'ajaxTimeout'); }, false);

        realXHR.addEventListener('loadend', function () { ajaxEventTrigger.call(this, 'ajaxLoadEnd'); }, false);

        realXHR.addEventListener('readystatechange', function () { ajaxEventTrigger.call(this, 'ajaxReadyStateChange'); }, false);

        return realXHR;
    }

    unsafeWindow.XMLHttpRequest = newXHR;

    var jct = document.cookie.match(/bili_jct=(\w*); /) && document.cookie.match(/bili_jct=(\w*); /)[1];

    unsafeWindow.addEventListener('ajaxLoadEnd', function (e) {
        if (e.detail.responseURL.indexOf("fans_medal/v1/FansMedal/get_list_in_room") > 0) {
            let body = document.querySelector(".medal-wear-body");
            body.innerHTML = "";
            ajax("https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall?target_id=2060727", "GET", null,
                function (result) {
                    if (result.code == 0) {
                        body.innerHTML = "";
                        for (let item of result.data.list) {
                            let ele = document.createElement("button");
                            ele.className = "medal-item";
                            ele.setAttribute("data-medal_id", item.medal_info.medal_id);
                            ele.innerHTML = `<div class="v-middle fans-medal-item" style="border-color:#${item.medal_info.medal_color_border.toString(16)}"><div class="fans-medal-label" style="background-image:linear-gradient(45deg,#${item.medal_info.medal_color_start.toString(16)},#${item.medal_info.medal_color_end.toString(16)});"><span class="fans-medal-content">${item.medal_info.medal_name}</span></div><div class="fans-medal-level" style="color:#${item.medal_info.medal_color_start.toString(16)}">${item.medal_info.level}</div></div><span class="name v-middle">${item.target_name}${item.live_status == 1 ? '<span class="dp-i-block living-gif v-middle"></span>' : ''}</span><span class="text v-middle f-right"">${item.medal_info.today_feed}/${item.medal_info.day_limit}</span><div class="dp-i-block progress-level-div"><span class="dp-i-block level-span level-span-left">Lv.${item.medal_info.level}</span><div class="dp-i-block progress-div"><span class="dp-i-block progress-num-span">${item.medal_info.intimacy}/${item.medal_info.next_intimacy}</span><div class="dp-i-block progress-div-cover" style="width: ${item.medal_info.intimacy / item.medal_info.next_intimacy * 100}%;"><span class="dp-i-block progress-num-span-cover">${item.medal_info.intimacy}/${item.medal_info.next_intimacy}</span></div></div><span class="dp-i-block level-span">Lv.${item.medal_info.level + 1}</span></div>`;
                            ele.onclick = async function (e) {
                                try {
                                    await switchBadge(this.getAttribute("data-medal_id"));
                                    document.querySelector(".medal-section>span").innerHTML = this.firstElementChild.outerHTML;
                                    toast();
                                } catch (error) {
                                    console.log(error);
                                }
                            }
                            body.append(ele);
                        }
                    }
                }
            );
        }
    });

    function switchBadge(badgeId) {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams();
            params.set("medal_id", badgeId);
            params.set("csrf_token", jct);
            params.set("csrf", jct);
            ajax("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear", "POST", params,
                function (result) {
                    if (result.message == "佩戴成功") {
                        resolve(true);
                    }
                    reject();
                }
            );
        });
    }

    function ajax(url, method = "GET", data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200 || xhr.status == 304) {
                    callback && callback(JSON.parse(xhr.response));
                }
            }
        }
        xhr.send(data);
    }

    function toast() {
        let id = Math.random() * 1000 >> 1;
        let temp = document.createElement("div");
        temp.innerHTML = `<div id="badgeSwitcher-${id}" class="link-toast info badgeToast" style="left: 16px;bottom:360px"><span class="toast-text">佩戴成功！信仰爆表！&lt;(▰˘◡˘▰)&gt;</span></div>`;
        document.querySelector(".medal-section").append(temp.firstElementChild);
        let toast = document.querySelector(`#badgeSwitcher-${id}`);
        toast.style.opacity = 1;
        setTimeout(() => {
            fadeOut();
        }, 1000);

        function fadeOut() {
            let itv = setInterval(() => {
                if (toast.style.opacity > 0) {
                    toast.style.opacity -= 0.1;
                } else {
                    clearInterval(itv);
                    toast.remove();
                }
            }, 20);
        }
    }

})();