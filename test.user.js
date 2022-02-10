// ==UserScript==
// @name         B站直播通知
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  需要有至少一个b站页面开在后台，在有页面常驻的情况下提醒延迟不超过3分钟
// @author       Pronax
// @match        https://*.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
// @grant        GM_notification
// @grant        GM_addValueChangeListener 
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const TAB_DETAIL = {
        name: giveMeAName(),
        type: undefined,
    };
    // 单位都是ms
    const CONSUMER_LOOP_TERM = 90000;
    const RETRY_LOOP_TERM = CONSUMER_LOOP_TERM * 0.75;
    const LIST_EXPIRE_TIME = CONSUMER_LOOP_TERM * 10.0;
    const CONSUMER_EXPIRE_TIME = CONSUMER_LOOP_TERM * 1.5;

    var master = GM_getValue("master");
    // list存的都是uid
    var onlineList = getList("onlineList");
    var blockList = getList("blockList");

    var temp_variable = {
        timeout: null,
        interval: null
    };

    GM_addValueChangeListener("bordercast",
        function (name, last, msg, remote) {
            msg.remote = remote;
            console.log(msg);
            eval(`${msg.type}`)(msg);
        });

    window.addEventListener('beforeunload', (event) => {
        if (master.name == TAB_DETAIL.name) {
            GM_deleteValue("master");
        }
    });

    // 分类页面
    if (TAB_DETAIL.type = location.href.match(/live.bilibili.com\/(\d+)/)) {
        fetch(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${TAB_DETAIL.type[1]}`)
            .then(r => r.json())
            .then(json => {
                TAB_DETAIL.type = "live";
                TAB_DETAIL.data = json;
            });
    }

    observer();

    async function observer() {
        if (master == undefined || Date.now() - master.heartbeat > CONSUMER_EXPIRE_TIME) {
            electSelf();
            await sleep(1000);
            if (master.name == TAB_DETAIL.name) {
                let diff = Date.now() - master.heartbeat;
                if (diff > LIST_EXPIRE_TIME || diff < 1500) {
                    // await checkLiveList(true);
                    leader(true);
                } else {
                    leader();
                }
                temp_variable.interval = setInterval(() => {
                    leader();
                }, CONSUMER_LOOP_TERM);
            }
        } else {
            setTimeout(() => {
                observer();
            }, RETRY_LOOP_TERM);
        }
    }

    async function leader(isInit) {
        if (master.name == TAB_DETAIL.name) {
            heartbeat();
            await checkLiveList(isInit);
            GM_setValue("sync", TAB_DETAIL.name);
        } else {
            clearCountdown(temp_variable.interval);
        }
    }

    async function checkLiveList(isInit) {
        return new Promise((r, j) => {
            fetch(`https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100`, {
                credentials: 'include'
            })
                .then(r => r.json())
                .then(result => {
                    if (result.code == result.message) {
                        let newList = new Set();
                        for (let item of result.data.items) {
                            if (!(isInit || onlineList.has(item.uid) || blockList.has(item.uid))) {
                                console.log("发送" + item.uname + "的开播通知");
                                notify(item.uid, item.uname, item.title, item.face, item.link);
                            }
                            newList.add(item.uid);
                        }
                        onlineList = newList;
                        blockList.clear();
                        saveList();
                        bordercast({
                            type: "sync",
                            target: null,
                            variable: null,
                            action: null,
                            value: null
                        });
                    }
                    r(true);
                });
        });
    }

    function bordercast(msg) {
        GM_setValue("bordercast", msg);
    }

    function electSelf() {
        bordercast({
            type: "election",
            target: null,
            variable: "master",
            action: "assign",
            value: {
                name: TAB_DETAIL.name,
                heartbeat: Date.now()
            }
        });
    }

    function election(msg) {
        master = msg.value;
    }

    function sync(msg) {
        if (!msg.remote) {
            onlineList = getList("onlineList");
            blockList = getList("blockList");
        }
        if (TAB_DETAIL.type == "live") {
            clearCountdown(temp_variable.timeout);
            bordercast({
                type: "modify",
                target: master.name,
                variable: "blockList",
                action: "add",
                value: TAB_DETAIL.data.uid
            });
            if (master.name == TAB_DETAIL.name) {
                temp_variable.timeout = setTimeout(() => {
                    saveList();
                }, 3000);
            }
        }
    }

    async function sleep(ms) {
        return new Promise(r => {
            setTimeout(() => {
                r(true);
            }, ms);
        });
    }

    function notify(roomid, nickname, roomname, avatar, link) {
        GM_notification({
            text: nickname + "正在直播",
            title: roomname,
            image: avatar,
            timeout: 5000,
            onclick: () => {
                GM_openInTab(link, {
                    "active": true,
                    "insert": true,
                });
            },
        });
    }

    function heartbeat(timestamp = Date.now()) {
        if (master.name == TAB_DETAIL.name) {
            GM_setValue("master", {
                "name": TAB_DETAIL.name,
                "lastHeartbeat": timestamp
            });
            changeTabTitle();
            return true;
        }
        changeTabTitle();
        return false;
    }

    function giveMeAName() {
        let name = Date.now().toString(16) + "-" + btoa(location.host);
        return name;
    }

    function getList(name) {
        let list = GM_getValue(name);
        list = list ? list.split(",").map(Number) : [];
        return new Set(list);
    }

    function saveList() {
        GM_setValue("onlineList", Array.from(onlineList).toString());
        GM_setValue("blockList", Array.from(blockList).toString());
    }

    function clearCountdown(timeout) {
        clearInterval(timeout);
        clearTimeout(timeout);
    }

    function changeTabTitle() {
        let isConsumer = master.name == TAB_DETAIL.name;
        document.title = (isConsumer ? "「✔」" : "") + (document.title.startsWith("「") ? document.title.substring(3) : document.title);
    }

})();