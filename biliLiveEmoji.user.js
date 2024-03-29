// ==UserScript==
// @name         颜文字输入插件
// @namespace    https://github.com/NieR4ever
// @version      10.1.2
// @description  在↓的基础上修改了一下
// @author       爱虎虎的小饼干
// @inlcude      /https:\/\/live.bilibili.com\/\d+/
// @icon         http://i2.hdslb.com/bfs/face/e95015d06a56f732fd5d6a33250412f434b3c0f5.jpg@125w_125h.webp
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// @require      https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/1.12.4/jquery.min.js
// @require      https://greasyfork.org/scripts/439903-blive-room-info-api/code/blive_room_info_api.js?version=1037039
// ==/UserScript==

; (async function () {
    'use strict';

    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    const JCT = document.cookie.match(/bili_jct=(\w*); /)[1];
    const ROOM_ID = await ROOM_INFO_API.getRid();

    GM_addStyle(`
        #kaomojiDiv {
            scrollbar-width: thin
        }
        #kaomojiDiv::-webkit-scrollbar {
            width: 6px
        }
        #kaomojiDiv::-webkit-scrollbar-thumb {
            background-color: #aaa
        }

        #kaomojiIcon {
            display: inline-block;
            margin-left: 4px;
            font-size: 24px;
            transition: color cubic-bezier(.22, .58, .12, .98) .4s;
            color: #C9CCD0;
        }
        #kaomojiIcon:hover {
            color: #23ade5;
        }
        span.list-content-candidate:hover span:first-child {
            opacity: 0;
        }
        span.list-content-candidate:hover .bold-candidate{
            opacity: 1;
        }
        span.list-content-candidate:hover {
            background-color: #f7f7f7;
            border-radius: 5px;
        }
        span.list-content-candidate {
            color: #666;
            font-size: 14px;
            cursor: pointer;
            padding: 6px 8px;
            margin-bottom: 0px;
            position: relative;
        }
        .bold-candidate{
            color: #fb7299;
            font-weight: bold;
            opacity: 0;
        }
		#kaomojiDiv{
            height: 300px;
			overflow-y: auto;
			display: flex;
			justify-content: space-around;
			flex-wrap: wrap;
		}
		#kaomojiPanel{
            width: 280px;
			margin: 0px 0px 0px -140px;
			left: 50%;
			bottom: 100%;
			padding: 6px;
			position: absolute;
			z-index: 699;
			display: none;
		}
        `);

    //颜文字列表 会自动按长度排序
    var kaomojiList = ["～♪好听♪～～♫好听♫～～♬好听♬～～♫", "( ｣ﾟДﾟ)｣＜", "✧*ヾ(*ˊᗜˋ)ﾉ✧*", "(o´ω`o)", "爫A爫", "( ☉д⊙)", "/ᐠ｡ꞈ｡ᐟ\\", "ᗜ ‸ ᗜ", "(╥ ‸ ╥)", "੭ ᐕ)੭*⁾⁾", "(〃╹╹〃)♡", "ヽ(◍╹▿╹◍)/♡", "♡(⋈◍╹╹◍)", "|•'▿'•)✧", "ε=(´ο｀*)", "( ˶'∽'˶)", "( •᷄⌓•᷅ )", "ᕕ( ´Д` )ᕗ", "(ꐦÒ‸Ó)", "⚈△⚈", "꒪꒫꒪)", "(›´ω`‹ )", "_(´□`」 ∠)_", "_(꒪□꒪」∠)_", "┭┮﹏┭┮", "Σ>―(〃°ω°〃)♡→", "ヽ(ﾟ∀ﾟ)♡(ﾟ∀ﾟ)ﾉ", "ヽ( ´Д｀)ﾉ", "━━━∑(ﾟ□ﾟ*|||━", "(,,´•ω•)ノ(´っω•｀。)", "ヽ(･ω･｡)ﾉ", "_(┐「ε:)_", "⊙_⊙", "(・_・;)", "（ '▿ ' ）", "●█▀█▄", "▄█▀█●", "(｡･ω･｡)", "⊙ω⊙", "( ˘•ω•˘ )", "(〃∀〃)", "(´･_･`)", "ᶘ ᵒᴥᵒᶅ", "(っ ‸ -｡)", "乛◡乛", "(っ °Д °;)っ", "⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄", "o(o･`з･´o)ﾉ!!!", "(=^･ｪ･^=)", "｜д•´)!!", " ( ´･ᴗ･` ) ", "(●ˇ∀ˇ●)", "(◍ ´꒳` ◍)", "ヾ(●´∇｀●)ﾉ", "ヾ(❀╹◡╹)ﾉ~", "( ✿＞◡❛)", "(°ロ°)", "( ・◇・)?", "վ'ᴗ' ի", "Ծ‸Ծ", "(｡•ˇ‸ˇ•｡)", "╮(￣▽￣)╭", "( ´_ゝ`)", "(´-ι_-｀)", "(〜￣△￣)〜", "～(￣▽￣～)", "ヾ(•ω•`)o", "( ๑╹ ꇴ╹) ｸﾞ好耶", "ಥ_ಥ", "ಠ_ಠ", "(´ฅω•ฅ`)", "(´・ω・`)", "_(:3ゝ∠)_", "Σ( ° △ °|||)", "(ﾟДﾟ≡ﾟдﾟ)!?", "(＃°Д°)", "Σ( ￣□￣||)", "(´；ω；`)", "(▔□▔)/", "(⊙x⊙;)", "(っ╥╯﹏╰╥c)", "(●￣(ｴ)￣●)", "(´∀｀)♡", "(≖_≖ )", "（￣へ￣）", "[┐'_'┌]", "ヽ(`Д´)ﾉ", "(╯°口°)╯︵ ┻━┻"];
    kaomojiList.sort((a, b) => {
        return getTextWidth(a) - getTextWidth(b);
    });

    //绘制面板框架
    const kaomojiPanel = $(`
		<div id="kaomojiPanel" class="border-box dialog-ctnr common-popup-wrap top-left a-scale-out v-leave-to">
			<div id="kaomojiDiv"></div>
		</div>
	`);

    //绘制颜文字按钮组件
    const kaomojiIcon = $(`<div title="颜文字面板" id="kaomojiIcon"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-mood-smile" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path> <path d="M9 10l.01 0"></path> <path d="M15 10l.01 0"></path> <path d="M9.5 15a3.5 3.5 0 0 0 5 0"></path></svg></div>`);

    //元素定位参数
    const iconPanelStr = ".icon-left-part";
    const controlPanelStr = "#control-panel-ctnr-box";
    const kaomojiDivStr = "#kaomojiDiv";
    const kaomojiPanelStr = "#kaomojiPanel";
    const kaomojiIconStr = "#kaomojiIcon";
    const textareaStr = "textarea.chat-input";
    const sendBtnStr = "div.right-action button";

    //添加图标到页面
    (function insertKaomojiIcon() {
        var iconPanel = $(iconPanelStr);
        if (iconPanel.length > 0) {
            iconPanel.append(kaomojiIcon);
        } else {
            requestAnimationFrame(function () {
                insertKaomojiIcon();
            });
        }
    })();
    //添加面板到页面
    (function insertKaomojiPanel() {
        var panel = $(controlPanelStr);
        if (panel.length > 0) {
            panel.append(kaomojiPanel);
        } else {
            requestAnimationFrame(function () {
                insertKaomojiPanel();
            });
        }
    })();
    //加载颜文字列表
    (function insertKaomojiSpan() {
        var panel = $(kaomojiDivStr);
        if (panel.length > 0) {
            for (var i = 0; i < kaomojiList.length; i++) {
                let kaomojiSpan = $(`<span class="list-content-candidate dp-i-block" data-content="${kaomojiList[i]}" ><span style="position:absolute">${kaomojiList[i]}</span><span class="bold-candidate">${kaomojiList[i]}</span></span>`);
                kaomojiSpan.click(inputToText);
                kaomojiSpan.mouseup(sendKaomoji);
                panel.append(kaomojiSpan);
            }
        } else {
            requestAnimationFrame(function () {
                insertKaomojiSpan();
            });
        }
    })();

    //给图标和面板添加点击事件
    (function setKaomojiBtn() {
        var panel = $(kaomojiPanelStr);
        var icon = $(kaomojiIconStr);
        var timer = 0;
        function setTimer() {
            timer = setTimeout(hidePanel, 100);
        };
        function clearTimer() {
            clearTimeout(timer);
            openPanel();
        };
        function openPanel() {
            panel.attr("class", "border-box dialog-ctnr common-popup-wrap top-left a-scale-in-ease v-leave-to");
            panel.css("display", "block");
        }
        function hidePanel() {
            panel.attr("class", "border-box dialog-ctnr common-popup-wrap top-left a-scale-out v-leave-to");
            panel.css("display", "none");
        }
        if (icon.length > 0) {
            icon.mouseenter(clearTimer);
            icon.mouseleave(setTimer);
            panel.mouseenter(clearTimer);
            panel.mouseleave(setTimer);
            panel.bind("contextmenu", () => { return false });
        } else {
            requestAnimationFrame(function () {
                setKaomojiBtn();
            });
        }
    })();

    // 输入框光标位置
    var cursorPosition = 0;
    setTimeout(() => {
        $("textarea.chat-input").blur(function () {
            cursorPosition = this.selectionStart;
        });
    }, 3000);

    //给颜文字添加点击事件
    function inputToText() {
        var text = $(this).data("content");
        var textarea = $(textareaStr);
        var con = textarea.val();
        textarea.val(con.substr(0, cursorPosition) + text + con.substr(cursorPosition));
        cursorPosition += text.length;
        textarea[0].dispatchEvent(new Event('input', { "bubbles": true, "cancelable": true }));
    }

    //右键直接发送表情
    function sendKaomoji(e) {
        if (e.which == 3) {
            let text = $(this).data("content");
            sendDanmu(text);
        } else {
            return;
        }
    }

    function sendDanmu(msg, callback) {
        ajax("https://api.live.bilibili.com/msg/send", "POST", {
            "bubble": 0,
            "msg": msg,
            "color": 16777215,
            "mode": 1,
            "fontsize": 25,
            "rnd": Date.now(),
            "roomid": ROOM_ID,
            "csrf": JCT,
            "csrf_token": JCT
        }, callback);
    }

    async function ajax(url, type, data, callback) {
        return new Promise((resolve, reject) => {
            let params = new URLSearchParams();
            for (let key in data) {
                params.set(key, data[key]);
            }
            let xhr = new XMLHttpRequest();
            xhr.open(type, url, true);
            xhr.withCredentials = true;
            xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 304) {
                        resolve(JSON.parse(xhr.response));
                        callback && callback(JSON.parse(xhr.response));
                    } else {
                        reject(xhr.response);
                    }
                }
            }
            xhr.send(params);
        });
    }

    function getTextWidth(text) {
        var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = "bold 14px Arial,'Microsoft YaHei','Microsoft Sans Serif','Microsoft SanSerf','微软雅黑'";
        var metrics = context.measureText(text);
        return metrics.width;
    }

})();