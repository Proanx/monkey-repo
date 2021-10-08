// ==UserScript==
// @name         b站直播徽章切换增强
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  所有徽章都能看到了
// @author       You
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        .medal-item>.progress-level-div,
        .medal-item>.limit-progress-div {
            display: none
        }
        .medal-wear-body .medal-item {
            cursor: pointer;
            padding: 6px 6px 7px;
            margin: 1px;
            background: 0;
            border: 1px solid transparent;
            border-radius:5px;
            width:calc(100% - 5px);
            text-align:left
        }
        .medal-wear-body .medal-item:hover {
            background-color: #eef5fb;
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
        }
        .medal-wear-body .medal-item>span{
            margin-left: 10px;
            color: #666;
            max-width: 68px;
            position: relative;
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
            let list = JSON.parse(e.detail.responseText).data;
            let body = document.querySelector(".medal-wear-body");
            body.innerHTML = "";
            for (let item of list) {
                let ele = document.createElement("button");
                ele.className = "medal-item";
                ele.setAttribute("data-medal_id", item.medal_id);
                ele.innerHTML = `<div class="v-middle fans-medal-item" style="border-color:#${item.medal_color.toString(16)}"><div class="fans-medal-label" style="background-image:linear-gradient(45deg,#${item.medal_color_start.toString(16)},#${item.medal_color_end.toString(16)});"><span class="fans-medal-content">${item.medal_name}</span></div><div class="fans-medal-level" style="color:#${item.medal_color.toString(16)}">${item.level}</div></div><span class="v-middle">${item.target_name}</span>${item.live_stream_status ? '<span class="dp-i-block living-gif v-middle"></span>' : ''}`;
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
    });

    function switchBadge(badgeId) {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams();
            params.set("medal_id", badgeId);
            params.set("csrf_token", jct);
            params.set("csrf", jct);
            ajax("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear", params,
                function (result) {
                    if (result.message == "佩戴成功") {
                        resolve(true);
                    }
                    reject();
                }
            );
        });
    }

    function ajax(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
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
