// ==UserScript==
// @name         B站直播抽奖姬
// @version      0.1
// @description  给主播用来的抽奖的
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    // 按钮
    GM_addStyle(".side-bar-gamble-cntr{width:47px;height:60px!important;position:fixed;right:0;bottom:13.5%;padding:0 4px 12px;background-color:#fff;z-index:11;border-radius:0 0 0 12px;box-shadow:0 5px 8px 0 rgb(0 85 255 / 5%);border:1px solid #e9eaec;border-top:0;transform:translate3d(0,0,0)}.side-bar-gamble-btn{height:56px;box-sizing:border-box;margin:4px 0;cursor:pointer;text-align:center;padding:5px 4px;position:relative}.side-bar-gamble-icon{font-size:26px !important;margin:0 auto;width:26px;height:26px}.side-bar-btn-cntr:hover .side-bar-gamble-icon{-webkit-animation:link-live-sidebar-jumping-data-v-7cd63ad2 cubic-bezier(.22,.58,.12,.98) 1.5s infinite;animation:link-live-sidebar-jumping-data-v-7cd63ad2 cubic-bezier(.22,.58,.12,.98) 1.5s infinite}.size-bar-gamble-text{margin:4px 0 0 0;font-size:12px;line-height:16px;color:#006cb5}");
    // 面板
    GM_addStyle(`

    .gamble-panel {
        width: 500px;
        height: auto;
        padding: 20px;
        border-radius: 5px;
        background-color: #fff;
        box-shadow: 0 0 10px 3px rgb(0 0 0 / 20%);
        word-wrap: break-word;
        word-break: break-word;
        z-index: 1000;
        top: calc(50% - 220px);
        left: calc(50% - 260px);
    }

    .gamble-progress-bar {
        border: 1px solid #eee;
        height: 0px;
        width:100%;
        margin: 10px 0;
        transition: border ease-out .5s,width 1s;
    }
    
    .gamble-progress-bar.loading {
        border: 1px solid #23ade5;
        height: 2px;
        width:0;
        margin: 9px 0;
        background-color: #23ade5;
    }
    
    .player-list-body {
        height: 247px;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .player-list-body::-webkit-scrollbar {
        width: 8px;
    }
    
    .player-list-body::-webkit-scrollbar-thumb {
        background-color: #aaa;
    }
    
    .player-list-body::-webkit-scrollbar-track {
        background-color: #eee;
    }

    .player-list>.list {
        width: 100%;
        border-collapse: collapse;
    }
    
    .player-list>.list .list-row {
        color: #999;
        height: 26px;
        opacity: 1;
        animation: gamble-fade-in cubic-bezier(0, 0, 0.2, 1) .5s;
    }

    .player-list>.list .list-row.lucky {
        background-color: #f7b500;
        color: #fff;
    }

    .player-list>.list tr.list-row:hover {
        background-color: #eef7fd;
    }

    .player-list>.list .list-row:nth-child(odd) {
        background-color: #f9f9f9;
    }
    
    .player-list>.list thead,
    .player-list>.list tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    
    .player-list>.list .list-head th {
        text-align: left;
        text-indent: 20px;
        font-size: 12px;
        color: #555;
        font-weight: 400;
        line-height: 20px;
    }
    
    .player-list>.list .list-row td {
        text-align: left;
        text-indent: 20px;
        font-size: 12px;
    }
    
    .gamble-timer {
        text-align: center;
    }
    
    .gamble-panel .tip {
        margin: -2px 3px 4px;
        color: #999;
        width: 33%;
    }
    .gamble-panel .tip:last-child {
        text-align: right;
    }
    
    .gamble-panel .player-list {
        position: relative;
        height: 210px;
    }
    
    .gamble-panel .link-progress-tv {
        background-color: #ffffffcc;
        width: 100%;
        height: 275px;
        position: absolute;
        top: 35px;
        z-index:10;
        background-image: url(https://i0.hdslb.com/bfs/live/28989a9df0bb4065a998c4f4df318d53107c9ff4.gif);
        background-repeat: no-repeat;
        background-position: center -1rem;
    }
    
    .gamble-panel .link-progress-tv .text {
        width: 100%;
        position: absolute;
        top: 28%;
        font-size: 14px;
        text-align: center;
        color: #555;
    }
    .gamble-panel .link-progress-tv .result {
        width: 100%;
        position: absolute;
        top: 38%;
        font-size: 16px;
        text-align: center;
        color: #f75800;
    }
    .gamble-panel .link-progress-tv .result>div {
        display: inline-block;
        margin: 0 10px;
    }
    
    .gamble-panel .popup-title {
        margin: 0;
        color: #23ade5;
        font-weight: 400;
        font-size: 18px;
    }
    
    .gamble-panel .room-manager-ctnr {
        margin-top: 0;
        height: 400px;
    }
    
    .gamble-panel .input-lable {
        color: #999;
    }
    
    .gamble-panel .input-wrap {
        padding-top: 10px;
        user-select: none;
        display: flex;
        justify-content: space-between;
    }
    
    .gamble-panel .link-input::placeholder {
        color: #bbb;
    }
    
    .gamble-panel .link-input {
        height: 26px;
        padding: 2px 8px;
        line-height: 25px;
        border: 1px solid #aaa;
        border-radius: 4px;
        background-color: #fff;
        outline: 0;
    }
    
    .gamble-panel input#gamble-keyword {
        width: 100px;
    }
    
    .gamble-panel input#gamble-player-limit {
        width: 75px;
    }
    
    .gamble-panel input#gamble-bouns-count {
        width: 40px;
    }
    
    .gamble-panel input#gamble-count_down {
        width: 90px;
    }
    
    .gamble-general-setting .check-icon {
        font-size: 16px;
        margin-right:5px;
    }
    
    .gamble-panel .bl-button-size {
        min-width: 104px;
        height: 32px;
        font-size: 14px;
    }
    
    .gamble-panel .bl-button-primary {
        background-color: #23ade5;
        color: #fff;
        border-radius: 4px;
    }
    
    .gamble-panel .bl-button-primary:hover {
        background-color: #39b5e7;
    }
    
    .gamble-panel .bl-button-error {
        background-color: #fb7299;
        color: #fff;
        border-radius: 4px;
    }
    
    .gamble-panel .bl-button-error:hover {
        background-color: #f981a3;
    }
    
    .gamble-panel .bl-button {
        position: relative;
        box-sizing: border-box;
        line-height: 1;
        margin: 0;
        padding: 6px 12px;
        border: 0;
        cursor: pointer;
        outline: 0;
        overflow: hidden;
        float:right;
    }
    
    .gamble-panel .bl-button:disabled {
        background-color: #e9eaec !important;
        color: #b4b4b4 !important;
        cursor: not-allowed !important;
    }
    
    .gamble-btn{
        width:190px
    }

    .gamble-panel .gamble-btn-small{
        min-width:70px;
        float: left;
    }

    #gamble-draw-btn{
        background-color:#F7B500;
    }
    
    .gamble-panel .close-btn {
        width: 20px;
        height: 20px;
        right: 12px;
        top: 12px;
        color: #999;
        line-height: 20px;
        transition: all cubic-bezier(.22, .58, .12, .98) .3s;
    }
    
    .gamble-panel .close-btn:hover {
        transform: rotate(180deg) scale(1.1);
    }
    
    .drag-bar {
        position: absolute;
        width: 200px;
        top: 0;
        margin: 0 150px;
        cursor: move;
        opacity: 0;
        transition: opacity .7s;
    }
    
    .drag-bar>.bar {
        width: 100%;
        height: 6px;
        margin: 7px 0;
        background-color: #ddd;
        border-radius: 25px;
        transition: background-color cubic-bezier(0.45, 0.45, 1, 1) .2s;
    }
    
    .drag-bar:hover>.bar {
        background-color: #bbb;
    }
    
    .gamble-panel:hover .drag-bar {
        opacity: 1;
    }
    
    @keyframes gamble-fade-in {
        from {
            opacity: 0;
        }
    
        to {
            opacity: 1;
        }
    }
    
    @keyframes gamble-fade-out {
        from {
            opacity: 1;
        }
    
        to {
            opacity: 0;
        }
    }
    `);

    var player = new Map();
    var panelOffsetX, panelOffsetY, dragging = false, scrolled = false;
    var keyWord = null, playerLimit = Infinity;

    var timeout, intervalCount = 0, interval = setInterval(() => {
        let sideBar = document.querySelector(".side-bar-cntr");
        // let sideBar = document.querySelector(".chat-items");
        if (sideBar) {
            clearInterval(interval);
            let divElement = document.createElement("div");
            // 抽奖姬按钮
            divElement.innerHTML = `<div class="side-bar-gamble-cntr"><div class="side-bar-gamble-btn"><div class="side-bar-btn-cntr"><span class="side-bar-gamble-icon dp-i-block svg-icon menu-img-hover"></span><p class="size-bar-gamble-text">抽奖姬</p></div></div></div>`;
            sideBar.style.width = "47px";       // 可能有新图标的加入，且文字长度大于3，我的标志就对不上了QAQ
            sideBar.after(divElement.firstElementChild);
            // 抽奖姬面板
            divElement.innerHTML = `
                <div class="gamble-panel m-auto dp-none p-fixed a-forwards">
                <div class="drag-bar">
                    <div class="bar"></div>
                </div>
                <div class="title-ctnr p-relative">
                    <h2 class="popup-title">抽奖设定</h2>
                </div>
                <div class="popup-content-ctnr">
                    <div class="room-manager-ctnr">
                        <div class="gamble-general-setting">
                            <div class="input-wrap">
                                <div>
                                    <label class="input-lable" for="gamble-keyword">弹幕关键字: </label>
                                    <input id="gamble-keyword" type="text" placeholder="支持正则表达式" class="link-input">
                                </div>
                                <div>
                                    <label class="input-lable" for="gamble-player-limit">人数限制: </label>
                                    <input id="gamble-player-limit" type="number" placeholder="0为无上限" min="0" class="link-input">
                                </div>
                                <div>
                                    <label class="input-lable" for="gamble-bouns-count">奖品数: </label>
                                    <input id="gamble-bouns-count" type="number" placeholder="1" min="0" class="link-input">
                                </div>
                            </div>
                            <div class="input-wrap">
                                <div>
                                    <label class="input-lable" for="gamble-count_down">限时(秒): </label>
                                    <input id="gamble-count_down" type="number" placeholder="0为手动停止" min="0" class="link-input">
                                </div>
                                <div style="margin-top: 8px;">
                                    <input id="gamble-repeatable" type="checkbox" style="display: none;">
                                    <span id="gamble-repeatable-icon"
                                        class="check-icon pointer svg-icon v-middle checkbox-default"></span>
                                    <label class="v-middle" for="gamble-repeatable" style="color:#666">可重复获奖</label>
                                </div>
                                <div class="gamble-btn">
                                    <button id="gamble-start-btn" class="bl-button bl-button-primary bl-button-size">
                                        <span class="txt">开始</span>
                                    </button>
                                    <button id="gamble-stop-btn" class="dp-none bl-button bl-button-error bl-button-size">
                                        <span class="txt">停止</span>
                                    </button>
                                    <button id="gamble-draw-btn" disabled class="gamble-btn-small bl-button bl-button-primary bl-button-size">
                                        <span class="txt">抽奖</span>
                                    </button>
                                </div>
                            </div>
                            <div><hr class="gamble-progress-bar"></div>
                            <div class="player-list">
                                <div id="biliTvLogo" class="dp-none link-progress-tv progress-tv">
                                    <div class="text">小电视祈祷中</div>
                                    <div class="result"></div>
                                </div>
                                <div class="dp-flex" style="justify-content: space-between;">
                                    <div class="tip">当前参与人数：<span class="player-count">0</span></div>
                                    <div class="gamble-timer tip"></div>
                                    <div class="tip" style="opacity:0">当前参与人数：0</div>
                                </div>
                                <table class="list">
                                    <thead>
                                        <tr class="list-head">
                                            <th width="35%">用户名</th>
                                            <th width="44%">弹幕时间</th>
                                            <th width="21%">UID</th>
                                        </tr>
                                    </thead>
                                    <tbody class="player-list-body p-relative dp-block">

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="gamble-panel-close-btn" title="关闭面板" class="close-btn p-absolute bg-center bg-no-repeat pointer t-center">
                    <i class="icon-font icon-close"></i>
                </div>
            </div>
            `;

            document.body.append(divElement.firstElementChild);


            initCloseBtn();
            initDragFunc();
            initRepeatableBtn();
            document.querySelector("#gamble-start-btn").onclick = startBtnFunc;
            document.querySelector("#gamble-stop-btn").onclick = stopBtnFunc;
            document.querySelector("#gamble-draw-btn").onclick = drawBtnFunc;
            initOpenBtn();

        } else if (++intervalCount > 50) {
            clearInterval(interval);
        }
    }, 100);

    function logPlayer(e) {
        let item = e.target;
        if (item.classList && item.className.match(/chat-item danmaku-item/)) {
            if (playerLimit <= player.size || player.has(item.getAttribute("data-uid")) || (keyWord && item.getAttribute("data-danmaku").search(keyWord) < 0)) {
                return;
            }
            // console.log(item.getAttribute("data-uname"), item.getAttribute("data-uid"), item.getAttribute("data-ts"));
            player.set(item.getAttribute("data-uid"), item.getAttribute("data-uname"));
            document.querySelector(".player-count").innerText = playerLimit == Infinity ? player.size : player.size + "/" + playerLimit;
            let tbody = document.querySelector(".player-list-body");
            let temp = document.createElement("tr");
            let ts = item.getAttribute("data-ts") > 0 ? item.getAttribute("data-ts") * 1000 : Date.now();      // 自己发的是0
            temp.className = "list-row";
            temp.innerHTML = `<td data-uid="${item.getAttribute("data-uid")}"" width="35%">${item.getAttribute("data-uname")}</td><td width="44%">${new Date(ts).toLocaleTimeString('chinese', { hour12: false })}</td><td width="21%">${item.getAttribute("data-uid")}</td>`;
            tbody.append(temp);
            tbody.scrollTop += 26;
            if (playerLimit <= player.size) {
                stopBtnFunc();
            }
        }
    }

    // 随机挑选固定数量
    function randomPick(num, allowRepeat) {
        let uidList = [];
        let resultElement = document.querySelector("#biliTvLogo>.result");
        if (isNaN(num) || num <= 0) {
            let tempElement = document.createElement("div");
            tempElement.innerText = "无人中奖";
            resultElement.append(tempElement);
            return;
        } else if (num >= player.size) {
            num = player.size;
        }
        for (let key of player.keys()) {
            uidList.push(key);
        }

        for (let i = 1; i <= num; i++) {
            let tempElement = document.createElement("div");
            resultElement.append(tempElement);
            let resultCount = 0;
            let resultInterval = setInterval(() => {
                let random = Math.round(Math.random() * uidList.length * 100) % uidList.length;
                if (++resultCount <= 20 * i) {
                    tempElement.innerText = uidList[random];
                    return;
                }
                clearInterval(resultInterval);
                tempElement.innerText = player.get(uidList[random]);
                if(!allowRepeat){
                    uidList[random] = uidList[uidList.length-1];
                    uidList.pop();
                }
            }, 50);
        }
    }

    function shuffleList(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function initDragFunc() {
        let dragBar = document.querySelector(".drag-bar");
        dragBar.onmousedown = (e) => {
            let panel = document.querySelector(".gamble-panel");
            panelOffsetX = e.pageX - panel.offsetLeft;
            panelOffsetY = e.pageY - panel.offsetTop;
            document.body.style.userSelect = "none";
            dragging = true;
        }
        dragBar.onmouseup = () => {
            document.body.style.userSelect = "";
            dragging = false;
        }
        document.onmousemove = (e) => {
            if (dragging) {
                let panel = document.querySelector(".gamble-panel");
                panel.style.left = e.pageX - panelOffsetX + "px";
                panel.style.top = e.pageY - panelOffsetY + "px";
            }
        }
    }

    function initOpenBtn() {
        let panelBtn = document.querySelector(".side-bar-gamble-btn");
        panelBtn.onclick = () => {
            let panel = document.querySelector(".gamble-panel");
            if (panel.classList.contains("dp-none")) {
                panel.style.left = "";
                panel.style.top = "";
                panel.classList.remove("dp-none");
                panel.classList.add("a-move-in-top");
            } else {
                panel.classList.remove("a-move-in-top");
                panel.classList.add("a-move-out-bottom");
                setTimeout(() => {
                    panel.classList.remove("a-move-out-bottom");
                    panel.classList.add("dp-none");
                }, 300);
            }
        }
    }

    function initCloseBtn() {
        let panelCloseBtn = document.querySelector("#gamble-panel-close-btn");
        panelCloseBtn.onclick = () => {
            let panel = document.querySelector(".gamble-panel");
            panel.classList.remove("a-move-in-top");
            panel.classList.add("a-move-out-bottom");
            setTimeout(() => {
                panel.classList.remove("a-move-out-bottom");
                panel.classList.add("dp-none");
            }, 300);
        }
    }

    function initRepeatableBtn() {
        document.querySelector("#gamble-repeatable").onchange = function () {
            let repeatableIcon = document.querySelector("#gamble-repeatable-icon");
            if (this.checked) {
                repeatableIcon.classList.add("checkbox-selected");
                repeatableIcon.classList.remove("checkbox-default");
            } else {
                repeatableIcon.classList.remove("checkbox-selected");
                repeatableIcon.classList.add("checkbox-default");
            }
        }
        document.querySelector("#gamble-repeatable-icon").onclick = function () {
            let repeatableBtn = document.querySelector("#gamble-repeatable");
            repeatableBtn.checked = !repeatableBtn.checked;
            if (repeatableBtn.checked) {
                this.classList.add("checkbox-selected");
                this.classList.remove("checkbox-default");
            } else {
                this.classList.remove("checkbox-selected");
                this.classList.add("checkbox-default");
            }
        }
    }

    function startBtnFunc() {
        let tbody = document.querySelector(".player-list-body");
        let progressGif = document.querySelector("#biliTvLogo");
        let drawBtn = document.querySelector("#gamble-draw-btn");
        let stopBtn = document.querySelector("#gamble-stop-btn");
        let startBtn = document.querySelector("#gamble-start-btn");
        let countDownTime = document.querySelector("#gamble-count_down").value;
        countDownTime = countDownTime.length && countDownTime > 0 ? countDownTime : null;
        let peopleLimit = document.querySelector("#gamble-player-limit").value;
        playerLimit = peopleLimit.length && peopleLimit > 0 ? peopleLimit : Infinity;
        let inputWord = document.querySelector("#gamble-keyword").value;
        keyWord = inputWord && inputWord.length > 2 && inputWord.match(/\/.*\//) ? eval(inputWord) : inputWord;
        this.disabled = true;
        drawBtn.disabled = true;
        player.clear();
        tbody.innerHTML = "";
        this.classList.add("dp-none");
        stopBtn.classList.remove("dp-none");
        progressGif.classList.add("dp-none");
        // drawBtn.classList.add("gamble-btn-small");       // 交换位置用
        // startBtn.classList.remove("gamble-btn-small");   // 交换位置用
        document.querySelector(".player-count").innerText = 0;
        document.querySelector(".chat-items").addEventListener('DOMNodeInserted', logPlayer, true);
        if (countDownTime) {
            timeout = setTimeout(stopBtnFunc, countDownTime * 1000);
            let timerElement = document.querySelector(".gamble-timer");
            let progressBar = document.querySelector(".gamble-progress-bar");
            progressBar.classList.add("loading");
            progressBar.style.transition = `border ease-out .4s,width cubic-bezier(0, 0, 0.5, 1) ${+countDownTime + 0.1}s`;
            let end = Date.now() + countDownTime * 1000;
            interval = setInterval(() => {
                if (end - Date.now() > 0) {
                    timerElement.innerText = ((end - Date.now()) / 1000).toFixed(1);
                } else {
                    clearInterval(interval);
                }
            }, 100);
        }
    }

    function stopBtnFunc() {
        document.querySelector(".chat-items").removeEventListener('DOMNodeInserted', logPlayer, true);
        clearTimeout(timeout); clearInterval(interval);
        let drawBtn = document.querySelector("#gamble-draw-btn");
        let stopBtn = document.querySelector("#gamble-stop-btn");
        let startBtn = document.querySelector("#gamble-start-btn");
        let progressBar = document.querySelector(".gamble-progress-bar");
        let timerElement = document.querySelector(".gamble-timer");
        timerElement.innerText = "";
        progressBar.style.transition = "";
        progressBar.classList.remove("loading");
        if (player.size > 0) {
            drawBtn.disabled = false;
            // startBtn.classList.add("gamble-btn-small");      // 交换位置用
            // drawBtn.classList.remove("gamble-btn-small");    // 交换位置用
        }
        startBtn.disabled = false;
        startBtn.classList.remove("dp-none");
        startBtn.firstElementChild.innerText = "重新开始";
        stopBtn.classList.add("dp-none");
        keyWord = null;
    }

    function drawBtnFunc() {
        let progressGif = document.querySelector("#biliTvLogo");
        let drawBtn = document.querySelector("#gamble-draw-btn");
        let startBtn = document.querySelector("#gamble-start-btn");
        let bounsNumber = document.querySelector("#gamble-bouns-count").value;
        let resultElement = document.querySelector("#biliTvLogo>.result");
        bounsNumber = bounsNumber.length && bounsNumber >= 0 ? bounsNumber : 1;
        let repeatableClaim = document.querySelector("#gamble-repeatable").checked;
        resultElement.innerHTML = "";
        progressGif.classList.remove("dp-none");
        // drawBtn.classList.add("gamble-btn-small");       // 交换位置用
        // startBtn.classList.remove("gamble-btn-small");   // 交换位置用
        startBtn.firstElementChild.innerText = "开始";
        randomPick(bounsNumber, repeatableClaim);
    }

})();