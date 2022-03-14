// ==UserScript==
// @name         B站直播通知
// @version      0.2.1
// @description  需要有至少一个b站页面开在后台，通常提醒延迟不超过3分钟
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
        data: null
    };
    // 单位都是ms
    const TITLE_ICON = "✔ ";
    const NOTIFACTION_TIMEOUT = 8000;
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
                TAB_DETAIL.data = json.data;
                bordercast({
                    type: "modify",
                    target: null,
                    variable: "blockList",
                    action: "add",
                    value: TAB_DETAIL.data.uid
                });
            });
    }

    observer();
    temp_variable.interval = setInterval(() => {
        observer();
    }, RETRY_LOOP_TERM);

    async function observer() {
        if (master == undefined || Date.now() - master.lastHeartbeat > CONSUMER_EXPIRE_TIME) {
            electSelf();
            await sleep(1000);
            if (master.name == TAB_DETAIL.name) {
                let diff = Date.now() - master.lastHeartbeat;
                if (diff > LIST_EXPIRE_TIME || diff < 1500) {
                    leader(true);
                } else {
                    leader();
                }
                clearCountdown(temp_variable.interval);
                temp_variable.interval = setInterval(() => {
                    leader();
                }, CONSUMER_LOOP_TERM);
                return;
            }
        }
        changeTabTitle();
    }

    async function leader(isInit) {
        changeTabTitle();
        if (master.name == TAB_DETAIL.name) {
            heartbeat();
            await checkLiveList(isInit);
            GM_setValue("sync", TAB_DETAIL.name);
        } else {
            clearCountdown(temp_variable.interval);
            temp_variable.interval = setTimeout(() => {
                observer();
            }, RETRY_LOOP_TERM);
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
                        if (!result.data.items) { return; }
                        let newList = new Set();
                        let count = 0;
                        for (let item of result.data.items) {
                            if (!(isInit || onlineList.has(item.uid) || blockList.has(item.uid))) {
                                console.log("发送" + item.uname + "的开播通知");
                                setTimeout(() => {
                                    notify(item.uid, item.uname, item.title, item.face, item.link);
                                }, NOTIFACTION_TIMEOUT * Math.floor(count++ / 3));
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
                        r(true);
                    } else {
                        j(result);
                        alert("在线列表获取失败：" + result.message);
                    }
                });
        });
    }

    function bordercast(msg) {
        GM_setValue("bordercast", msg);
    }

    function electSelf(timestamp = Date.now()) {
        bordercast({
            type: "election",
            target: null,
            variable: "master",
            action: "assign",
            value: {
                name: TAB_DETAIL.name,
                lastHeartbeat: timestamp
            }
        });
    }

    function election(msg) {
        master = msg.value;
    }

    function sync(msg) {
        clearCountdown(temp_variable.timeout);
        if (!msg.remote) {
            loadList();
        }
        if (TAB_DETAIL.type == "live") {
            bordercast({
                type: "modify",
                target: null,
                variable: "blockList",
                action: "add",
                value: TAB_DETAIL.data.uid
            });
        }
        if (master.name == TAB_DETAIL.name) {
            temp_variable.timeout = setTimeout(() => {
                saveList();
                bordercast({
                    type: "loadList",
                    target: null,
                    variable: null,
                    action: null,
                    value: null
                });
            }, 1000);
        }
    }

    function modify(msg) {
        eval(`${msg.variable}.${msg.action}(${msg.value})`);
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
            timeout: NOTIFACTION_TIMEOUT,
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
            electSelf(timestamp);
            return true;
        }
        return false;
    }

    function giveMeAName() {
        let name = Date.now().toString(16) + "-" + btoa(location.host);
        return name;
    }

    function loadList(msg) {
        onlineList = getList("onlineList");
        blockList = getList("blockList");
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
        document.title = (master.name == TAB_DETAIL.name ? TITLE_ICON : "") + document.title.replace(TITLE_ICON, "");
    }

})();