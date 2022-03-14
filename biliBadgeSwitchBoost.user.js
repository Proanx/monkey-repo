// ==UserScript==
// @name         b站直播徽章切换增强
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  所有徽章都能看到了
// @author       Pronax
// @include      /https:\/\/live\.bilibili\.com\/(blanc\/)?\d+/
// @icon         http://bilibili.com/favicon.ico
// @grant        GM_addStyle
// @require		 https://lib.baomitu.com/vue/2.6.14/vue.js
// @require      https://greasyfork.org/scripts/439903-blive-room-info-api/code/blive_room_info_api.js?version=1020479
// ==/UserScript==


(function init() {
    'use strict';

    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    let controlPanelCtnrBox = document.querySelector(".medal-section");
    if (controlPanelCtnrBox && Object.keys(controlPanelCtnrBox.dataset).length) {
        // 浅拷贝一次，用于抹掉子元素的事件
        controlPanelCtnrBox.innerHTML = `<span id="medal-selector" class="dp-i-block"><span class="action-item medal get-medal"></span></span>`;
        let tempElement = document.createElement("div");
        tempElement.id = "medel_switch_box";
        document.querySelector(".bottom-actions").after(tempElement);
    } else {
        requestAnimationFrame(function () {
            init();
        });
        return;
    }

    // body内的条目css
    GM_addStyle(`
        .medal-wear-body{
            height: 335px;
            margin-top: 5px;
            padding-right: 2px;
            overflow:auto;
            scrollbar-width: thin;
        }
        .medal-wear-body::-webkit-scrollbar{
            width:6px
        }
        .medal-wear-body::-webkit-scrollbar-thumb{
            background-color:#aaa
        }
        
        .medal-item-content {
            display: flex;
            justify-content: space-between;
        }
        
        .medal-wear-body .medal-item {
            cursor:pointer;
            padding: 5px 5px 3px;
            background: 0;
            border: 1px solid transparent;
            border-radius:5px;
            width:calc(100% - 12px);
            text-align:left;
            transition: all .2s;
        }
        
        .medal-wear-body .medal-item:hover {
            border: 1px solid #d7d7d7;
            background-color: #f5f5f5;
        }

        .medal-item .face {
            width: auto;
            height: 34px;
            margin: 0 4px 0 2px;
            padding: 1px;
            border-radius: 50%;
        }
        .medal-item .face.live {
            height: 30px;
            border-width: 2px;
            border-style: solid;
            animation:looming 2s linear infinite
        }

        .medal-wear-body .medal-item .name{
            color: #666;
            position: relative;
            max-width: calc(100% - 78px);
            font-size: 14px;
            line-height: 18px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .medal-wear-body .medal-item .name:hover{
            color: #23ade5;
        }
        
        .medal-wear-body .medal-item .living-gif {
            background-image: url(//s1.hdslb.com/bfs/static/blive/live-fansmedal-wall/static/img/icon-online.fd4254c1.gif);
            background-size: cover;
            width: 16px;
            height: 16px;
            transform: rotateY(180deg);
        }

        .medal-item .wear-icon {
            background-color: #fb7299;
            padding: 0 2px;
            color: #fff;
            height: 16px;
            border: 1px solid #fff;
            border-radius: 4px;
            line-height: 16px;
            font-size: 14px;
        }

        .medal-item .room-icon {
            padding: 0 2px;
            color: #fea249;
            height: 16px;
            border: 1px solid #fea249;
            border-radius: 4px;
            line-height: 16px;
            font-size: 14px;
        }
        
        .medal-item .content-icon {
            padding: 0 2px;
            color: #40bf55;
            height: 16px;
            border: 1px solid #40bf55;
            border-radius: 4px;
            line-height: 16px;
            font-size: 14px;
        }
        
        .medal-wear-body .medal-item .text{
            color: #888;
            position: relative;
            line-height: 18px;
            font-size: 13px;
        }

        .medal-item-content .medal-content-head{
            width:206px;
        }

        .medal-item-content .medal-content-footer{
            height: 16px;
            position: absolute;
            bottom: 0px;
            width: 100%;
        }

        .medal-wear-body .medal-item .progress-level-div {
            margin-top: 5px;
            width:100%;
            text-align:center;
            display: flex;
            justify-content: space-between; 
            font-size: 13px;
        }

        .medal-wear-body .medal-item .progress-level-div .level-span-left {
            text-align: right !important;
        }
        
        .medal-wear-body .medal-item .progress-level-div .level-span {
            width: 33px;
            color: #999;
            padding-top: 1px;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div {
            line-height: 16px;
            height: 14px;
            width: 70%;
            background-color: #e2e8ec;
            border-radius: 2px;
            margin: 0 2px;
            position: relative;
            overflow: hidden;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div-cover {
            position: absolute;
            left: 0;
            top: 0;
            overflow: hidden;
            background-color: #23ade5;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div .progress-num-span {
            color: #23ade5;
        }

        .medal-wear-body .medal-item .progress-level-div .progress-div-cover .progress-num-span-cover {
            width: 174px;
            position: relative;
            z-index: 1000;
            color: #fff;
        }

        @keyframes looming {
            0% {
                border-color: #fb7299;
            }
            50% {
                border-color: #fb72994d;
            } 
            100% {
                border-color: #fb7299;
            } 
        }

    `);

    // 面板css
    GM_addStyle(`
        .chat-input-ctnr .medal-section{
            position: static;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            padding: 0 12px;
            min-width: 70px;
            height: 56px;
            border-right: 1px solid #e9eaec;
            box-sizing: border-box;
        }

        .medal-section .action-item.medal.get-medal,
        .medal-section .action-item.medal.wear-medal {
            width: 41px;
            height: 24px;
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAyCAMAAADx7dyJAAAA51BMVEUAAACampqZmZmampqZmZmampqampqZmZmdnZ2oqKiamprU1NSZmZmZmZmZmZmvr6+ampqampqamprIyMiZmZmampqampqZmZmZmZmampqenp6cnJyfn5+ampqbm5uampqenp7Q0NDOzs6ampqamprPz8/Ozs6ampqbm5vMzMyZmZmZmZnNzc2bm5ubm5uZmZmampqcnJyampqampqampqampqamprNzc2amprU1NTU1NTU1NSamprV1dXS0tLR0dHT09PU1NTT09PW1tbS0tLMzMzt7e2ZmZnj4+PPz8/V1dXo6OjZ2dk1f/nUAAAARXRSTlMA49Zr8zV1SzkGgKukj4UL+q5iA97uw1mpiSAbDupeQRX6eLPNPBnIT+bm0rI9JsFlLdmWm41G+buqn35xMBHr2r5WRCgCpQL/AAADqUlEQVRYw7TS226qQBiG4Q8cUAg7hbHIRo1Y0epCa2vbA0/Jf/93tBhApYqJK3G9yT+QQJ4ME/D/et2s8qe12rxW6ix/crNyr/n3bIGntZh952K/G6E/s1m+AbDKF3hqi3wFIM9xlariqoGCOx19iEK/i8kUIiG2spKE32lxmhmNXiBy7aKExKplpE75PPo3tkudHnnyKbIgGtO5TkA6vpzEbWOVXlUc9+o0lBnOtEd/cIpVbDAumpNYM8Giw5Q2ltF1AUQ2S3DLupqoT+UloFGxhprbwh7VKs7Vuqj+2hfBGm9lcs0a1JL1+NnaHimC3ZnmnJumVbOTTjNKy4vyOKtTxQIw5cbZhvq5CLyPqkfZgDntrELG4SDJh0NCIfZDYGJMb9mweyqOz7ch4DujitUZc4ix9MIugyDtB8GuYIcyoFMLu6OWdrBJfanYkXfcxsdEvrCMc8fhnBWsz4GfNW7ZbFA1lzmX54OqDLBcwU5IGQ3FIagNVgG2BrCkUOzUZeb9s+1SV5KWjoJLgl1ScMt6+z1j+71EoXhnQsu7bMC3kCRs1/ZvtkP2NRtNJuu0Gg3vNPh0pvdYLXXeBZuxxP3F6gxnlluof1xvXYxc/q6xwfu4x5o0gGCxpE+3yX54F1YaQWR5nsOq6QCGQ1932MigT1QsLErsBttPL6xnoouyYVKOaEweEGotrOKR4Z5YjGgeXFjJr1ldxvojIgWR7/uxVMxbcRNhRx+A7rnXrKs64smZhUVsd2LfaVyysS79YNvPKELUbxQFjGIbvoxr1qS/tdZvS8JQFMfxHy2SFNxqJJUau6ggCdnSxDacf093d/P9v56Gd7Gcyx2ofZ8Jh88D72Ecy8BPFk+XspmyV9I5sFa/NcN0NOzqR+sPk0d+dwBnZBnWg/08PWHdvotjFm6rnbLjPmB2kj9B/764Aczbluw9wja6l3XnTRqoy7mccT81mr2vIyllMZdDoG31Dgg6zTt38gpgIsf2GbZWw1EvhoOOXutrHGojycF3JnR6ETL2fyOq6Pyo6Fiq6LSr5hCt8GzOWgiKPnOFRA3kahCF+bmIxAI6tvoXNyhWPwC2G+C0Dalilesq2hRthiIVFqhMN1SkCvd0sCSK4rzKc+OIaDlAYbYv0tnstRiunhW+jd8K1sksS9VuNrsOcC6fVJypPDdW5KOkFe0zlefuaYWydoriTOW4MakdSvNIaZXrKvJQnilIq1yXhAlGW6E8sPOU2IKXjeL4w19GXEgqF0Zf/gAAAABJRU5ErkJggg==)
        }

        .medal-section .action-item.medal {
            background-size: cover;
            border: 0
        }

        .medal-section .action-item {
            display: inline-block;
            margin: 0 2px;
            font-size: 12px;
            color: #fff;
            line-height: 14px;
            text-align: center;
            border-radius: 2px;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }

        .dialog-ctnr.medal {
            z-index: 999;
            padding: 10px 14px 10px 16px;
            position: absolute;
            bottom: 100px;
            left: -1px;
            width: 302px;
        }
        
        .dialog-ctnr {
            padding: 16px;
            z-index: 699;
        }
        .medal-ctnr {
            width: 268px;
        }
        .title {
            font-weight: 400;
            font-size: 18px;
            margin: 0;
            color: #23ade5;
        }
        .qs-icon {
            width: 14px;
            height: 14px;
            background-size: 100%;
            background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAAXNSR0IArs4c6QAAA79JREFUSA29lk1IVFEYhpsZf0AwDDc5RlJBYepK+rHQFhUutaCdiyL8w5JWkijlIjNISBrTUYha2MZAjBZRmEERGa1CSwqysrSVCw2DGNGe93LP5TreOzOL8MC55zvf+37fe/7uuTewJYXS0NBQvLa2Vk0th54fCATCCqM/TzNH/xV1NBqNTsmfqAQSgfX19VUk7YRTRMIp7KfYs9gSkqCEd9KvxC7G/oDdNjAw8Ei4V/EUrKurU5IhkhwmaIDaMzg4+MUrgfERswf7ErWe2Alia4iZNbhpNwiyfEchj1CnIZ1PJmQSmdYWvotoIfU0y/zaYGrXCdpiz/HfQ7AZsZib3NLSkr24uKhZl5Asd3V19XMoFJro7+//5OYhmk4/Aucs9bhb1BG0l/EdxBH2oNGdQDb7WcEgHmDuoC6T6Df97bSr9O9kZ2e3dnd3L2M7hZxR8FPwDpjlDRoUYAj7o2ZmfKZtbGw8gX8cznwwGCwJh8NbGVReVlbWNjg3qU1LS0u3Dd/VXiRu2s5tua0Z2qfxIZ7C+D0bHh4OjY2NvRc7MzOzNBKJ/LUiXQ9mEqF7IS0t7WBfX59WySlgOkwSPaPTa82QUXTiiMaLKWp8fFzvXhEz6/ISE4cyqAd7ekituyincktD/iAjKKFVwh430dgkKZJNO2F88W1OTs43+Ui6Kx5T385dpAskiHoVvklO2owXmVMo/w327bsXLh8nd59aBD05yo2OLo7qNB7ldHSDeBbITwBUfQs52gBjGRkZj/1IcKRRrj3Mp264EfwC4/0cuOv4qhl0d29v79d43PTBNft8LWmYat2NBky1Zf+7GHkr8RFebs3St0hDWs576Mv0ARC7CnSZ2slxbybZmg91nVt7qNlZn5t1SIIOy1gGfIXYWxz79gRUB4IblpZmOIdR4CCpGbXELEFNSUwpbY057aE+npWp6TisI1hvmN0fx5PEkIa0JDiKejH35e4kMW74J523bkciW7mlIS2Lx55MUr0u30R5UsaUWxoKMKe0nRE02Bdt0kRwA0lJNkE5lZvrzXptnEBG8BJA37aT7E3ML2FTU9PeWCz2AnyG6+5YR0eHYjwLYuks4zPAEK9OhUhmhjpFNYD6LUi4tCsrK6XE6TUqW1hYyFUSv2Ln2q/chuPMUA7ziwHhPt2LXjO1R10L/oNRe96dNkcDP4eo9y8GoFU29SfKiDLCzftNNKJqOUj6Vl5jifUOWT/CtLr1fwmn5IEV4LN+hMXB165fCQv1eKzbQw/cculLTeL/8qv/D4FH4W+V11VGAAAAAElFTkSuQmCC);
            cursor: pointer;
            margin-left: 5px;
            position: relative;
            top: 0;
        }
        .link-radio-button-ctnr {
            display: inline-block;
            cursor: default;
            vertical-align: middle;
            font-size: 0;
        }
        .footer-line {
            position: relative;
            left: -16px;
            width: 300px;
            border-top: 1px solid #f0f0f0;
            margin-top: 3px;
        }
        .medal-wear-footer {
            margin-top: 10px;
            font-size: 14px;
            color: #23ade5;
        }
        .medal-wear-footer .cancel-wear {
            cursor: pointer;
        }
        .medal-wear-footer a {
            color: #23ade5;
        }
        
        .medal-wear-footer .right-span {
            float: right;
        }
        .medal-wear-footer .arrow-box{
            width: 10px;
            height: 10px;
            font-size: 10px;
            position: relative;
            top: 2px;
        }
    `);

    unsafeWindow.vm = new Vue({
        el: '#medel_switch_box',
        async created() {
            this.fansMedalInfo = await this.getFansMedelInfo();
            this.refreshMedalList();
        },
        mounted: function () {
            document.querySelector("#medal-selector").onclick = () => {
                this.togglePanel();
            };
        },
        computed: {
        },
        data() {
            return {
                jct: document.cookie.match(/bili_jct=(\w*); /)[1],
                fansMedalInfo: {
                    "has_fans_medal": false,
                    "my_fans_medal": {
                        "target_id": 0,
                    }
                },
                currentlyWearing: {
                    medal: {
                        medal_id: 0
                    }
                },
                panelStatus: false,
                medalWall: GM_getValue("medalWall", [])
            }
        },
        methods: {
            async getFansMedelInfo() {
                let rid = await ROOM_INFO_API.getRid();
                let uid = await ROOM_INFO_API.getUid();
                let res = await fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/fans_medal_info?target_id=${uid}&room_id=${rid}`, { credentials: 'include', });
                let json = await res.json();
                if (json.code == json.message) {
                    return json.data;
                }
                alert("徽章初始化失败：", json.message);
            },
            refreshMedalList(page = 1) {
                fetch(`https://api.live.bilibili.com/xlive/app-ucenter/v1/fansMedal/panel?page=${page}&page_size=200`, { credentials: 'include', })
                    .then(res => res.json())
                    .then(json => {
                        if (json.code == json.message) {
                            // if (page == 1) {
                            let list = [].concat(json.data.list, json.data.special_list);
                            list.sort((a, b) => {
                                if (a.medal.wearing_status) {
                                    this.currentlyWearing = a;
                                }
                                let count_a = a.medal.wearing_status * 600000000 + a.medal.level * 15000000 + a.medal.intimacy;
                                let count_b = b.medal.wearing_status * 600000000 + b.medal.level * 15000000 + b.medal.intimacy;
                                if (this.fansMedalInfo && this.fansMedalInfo.has_fans_medal) {
                                    if (a.medal.target_id == this.fansMedalInfo.my_fans_medal.target_id) {
                                        count_a = Number.MAX_VALUE;
                                    } else if (b.medal.target_id == this.fansMedalInfo.my_fans_medal.target_id) {
                                        count_b = Number.MAX_VALUE;
                                    }
                                }
                                return count_b - count_a;
                            });
                            this.medalWall = list;
                            // } else {
                            //     this.medalWall = this.medalWall.concat(json.data.list, json.data.special_list);
                            // }
                            this.refreshMedal();
                            GM_setValue("medalWall", this.medalWall);
                            if (json.data.page_info.has_more) {
                                alert("has_more");
                                // setTimeout(() => {
                                //     this.refreshMedalList(json.data.page_info.next_page);
                                // }, 2000);
                            }
                        }
                    });
            },
            switchBadge(badgeId, index) {
                this.currentlyWearing = this.medalWall[index];
                let params = new URLSearchParams();
                params.set("medal_id", badgeId);
                params.set("csrf_token", this.jct);
                params.set("csrf", this.jct);
                fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/wear", {
                    credentials: 'include',
                    method: 'POST',
                    body: params
                });
                this.refreshMedal();
            },
            takeOff() {
                this.currentlyWearing = { medal: { medal_id: 0 } };
                let params = new URLSearchParams();
                params.set("visit_id", '');
                params.set("csrf_token", this.jct);
                params.set("csrf", this.jct);
                fetch("https://api.live.bilibili.com/xlive/web-room/v1/fansMedal/take_off", {
                    "method": "POST",
                    "credentials": "include",
                    "body": params,
                });
                this.refreshMedal();
            },
            open: (uid) => {
                window.open(`//space.bilibili.com/${uid}`);
            },
            togglePanel() {
                if (this.panelStatus) {
                    this.refreshMedalList();
                    this.$refs.medalWearBody.scrollTop = 0;
                }
                this.panelStatus = !this.panelStatus;
            },
            refreshMedal() {
                let selector = document.querySelector("#medal-selector");
                if (this.currentlyWearing.medal.medal_id != 0) {
                    selector.innerHTML = `
                        <div class="v-middle fans-medal-item medal-item-margin"
                            style="border-color:#${this.currentlyWearing.medal.medal_color_border.toString(16)}">
                            <div class="fans-medal-label"
                                style="background-image:linear-gradient(45deg,#${this.currentlyWearing.medal.medal_color_start.toString(16)},#${this.currentlyWearing.medal.medal_color_end.toString(16)})">
                                <span class="fans-medal-content">${this.currentlyWearing.medal.medal_name}</span>
                            </div>
                            <div class="fans-medal-level" style="color:#${this.currentlyWearing.medal.medal_color_start.toString(16)}">${this.currentlyWearing.medal.level}</div>
                        </div>
                    `;
                } else {
                    selector.innerHTML = `<span class="action-item medal get-medal"></span>`;
                }
            }
        },
        template: `
            <div class="border-box dialog-ctnr common-popup-wrap medal a-scale-in" v-show="panelStatus" @mouseleave="togglePanel">
                <div class="medal-ctnr none-select">
                    <div class="medal-wear-component">
                        <h1 class="dp-i-block title">
                            我的粉丝勋章
                        </h1>
                        <a href="http://link.bilibili.com/p/help/index#/audience-fans-medal" target="_blank" class="dp-i-block qs-icon"></a>
                        <div class="medal-wear-body" ref="medalWearBody">
                            <div class="medal-item" v-for="(item,index) in medalWall" :key="item.medal.medal_id"
                                @click="switchBadge(item.medal.medal_id,index)">
                                <div class="medal-item-content">
                                    <img :src="item.anchor_info.avatar" onerror="this.src='//i0.hdslb.com/bfs/face/member/noface.jpg'"
                                        class="face dp-i-block" :class="{live:item.room_info.living_status == 1}">
                                        <div class="dp-i-block v-bottom w-100 p-relative">
                                            <div class="medal-content-head">
                                                <div class="fans-medal-item f-right" :style="'border-color:#'+(item.medal.medal_color_border.toString(16))">
                                                <div class="fans-medal-label"
                                                    :style="'background-image:linear-gradient(45deg,#'+(item.medal.medal_color_start.toString(16))+',#'+(item.medal.medal_color_end.toString(16))+')'">
                                                    <span class="fans-medal-content">{{item.medal.medal_name}}</span>
                                                </div>
                                                <div class="fans-medal-level" :style="'color:#'+(item.medal.medal_color_start.toString(16))">
                                                    {{item.medal.level}}
                                                </div>
                                            </div>
                                            <div class="name dp-i-block" @click.stop="open(item.medal.target_id)">{{item.anchor_info.nick_name}}</div>
                                        </div>
                                        <div class="medal-content-footer">
                                            <div class="wear-icon dp-i-block" v-if="item.medal.target_id == currentlyWearing.medal.target_id">
                                                佩戴中
                                            </div>
                                            <div class="room-icon dp-i-block" v-else-if="item.medal.target_id == fansMedalInfo.my_fans_medal.target_id">
                                                当前房间
                                            </div>
                                            <div class="content-icon dp-i-block" v-else-if="item.superscript != null">
                                                {{item.superscript.content}}
                                            </div>
                                            <span class="text f-right dp-i-block">{{item.medal.today_feed}}/{{item.medal.day_limit}}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="progress-level-div">
                                    <span class="dp-i-block level-span">Lv.{{item.medal.level}}</span>
                                    <div class="dp-i-block progress-div">
                                        <span class="dp-i-block progress-num-span">{{item.medal.intimacy}}/{{item.medal.next_intimacy}}</span>
                                        <div class="dp-i-block progress-div-cover"
                                            :style="'width:'+(item.medal.intimacy / item.medal.next_intimacy * 100) + '%'">
                                            <span class="dp-i-block progress-num-span-cover">
                                                {{item.medal.intimacy}}/{{item.medal.next_intimacy}}
                                            </span>
                                        </div>
                                    </div>
                                    <span class="dp-i-block level-span">Lv.{{item.medal.level + 1}}</span>
                                </div>
                            </div>
                        </div>
                        <div class="footer-line"></div>
                        <div class="dp-block medal-wear-footer">
                            <span class="dp-i-block cancel-wear" @click="takeOff">
                                不佩戴勋章
                            </span>
                            <a href="https://link.bilibili.com/p/center/index#/user-center/wearing-center/my-medal"
                                target="_blank" class="dp-i-block right-span">
                                装扮中心
                                <span class="dp-i-block icon-font icon-arrow-right arrow-box"></span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `,
    });

    // function toast() {
    //     let id = Math.random() * 1000 >> 1;
    //     let temp = document.createElement("div");
    //     temp.innerHTML = `<div id="badgeSwitcher-${id}" class="link-toast info badgeToast" style="left: 16px;bottom:360px"><span class="toast-text">佩戴成功！信仰爆表！&lt;(▰˘◡˘▰)&gt;</span></div>`;
    //     document.querySelector(".medal-section").append(temp.firstElementChild);
    //     let toast = document.querySelector(`#badgeSwitcher-${id}`);
    //     toast.style.opacity = 1;
    //     setTimeout(() => {
    //         fadeOut();
    //     }, 1000);

})();