// ==UserScript==
// @name         Steam市场 价格/比例/汇率 换算器
// @namespace    http://pronax.wtf/
// @version      2.0.1
// @description  见安装页面介绍
// @author       Pronax
// @include      *://steamcommunity.com/market/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @noframes
// @require      https://lib.baomitu.com/vue/2.6.14/vue.runtime.min.js
// ==/UserScript==

(function () {

    const 修改汇率时强行同步成本 = false;

    GM_addStyle('.profile_flag{width:16px;height:11px;}.price_tool input[type="number"]{color:#d6d9dc;}.grabbing{cursor:grabbing !important;}.price_tool_drag_bar{display:inline-block;width:100%;cursor:grab;opacity:1;border-radius:5px;background-color:#ffffff26;transition:all .5s;}.price_tool_drag_bar:hover{background-color:#7aa546d6;color:#fff;}.f-right{float:right;}.transparent{opacity:0;}.currency_selector_menu{width:160px;height:203px;overflow-y:scroll;scrollbar-width:thin;position:absolute;background-color:#171a21;box-shadow:0 3px 10px 0 #000;}.currency_selector_item{transition:all .2s;padding:5px;color:#b8b6b4;text-transform:none;font-size:13px;font-weight:normal;line-height:normal;text-align:left;cursor:pointer;display:block;text-decoration:none;border-left:3px solid #00000000;}.currency_selector_item:hover{color:#fff;background-color:#2c3340;}.currency_selector_item.checked{color:#fff;background-color:#548131;}.currency_selector_item.checked:hover{background-color:#609438;}.price_tool_hide{opacity:0;}.currency_selector_menu::-webkit-scrollbar{padding:0;margin:0;width:8px;}.currency_selector_menu::-webkit-scrollbar-thumb{padding:0;margin:0;background:#5e5f64;}.currency_selector_menu::-webkit-scrollbar-track{padding:0;margin:0;background-color:transparent;}.currency_selector_menu::-webkit-scrollbar-thumb:hover{padding:0;margin:0;background:#717276;}.currency_selector_menu::-webkit-scrollbar-thumb:active{padding:0;margin:0;background:#3c3e42;}.price_tool input::-webkit-outer-spin-button,.price_tool input::-webkit-inner-spin-button{-webkit-appearance:none;appearance:none;}.price_tool input[type="number"]{-moz-appearance:textfield;text-align:right;border-radius:0 3px 3px 0 !important;}.price_tool_input{width:90px;height:26px;font-size:16px !important;border:0 !important;padding:2px 4px 2px 18px !important;background-color:#101822 !important;transition:all .5s;}.price_tool_input_div>.price_tool_locked{background-color:#1b2838 !important;color:#3e759d !important;}.currency_loading{position:absolute;margin:5px 0;left:40px;fill:#C5C3C2;animation:rotate-R 1.5s linear infinite;}.icon_forbid{fill:#cc4033 !important;}.price_tool_input_div>.icon{position:absolute;margin-top:6px;left:50px;transition:all .3s;width:18px;height:18px;fill:#aaa;}.price_tool_input_btn:hover+.icon{opacity:.5;}.price_tool{font-variant-numeric:tabular-nums;user-select:none;z-index:500;position:fixed;border-radius:5px;padding:2px 5px 5px;font-family:Motiva Sans,Arial,Helvectica,Verdana,sans-serif;background-image:linear-gradient(140deg,#386797b3,#172e4ab3);text-align:center;box-shadow:0 0 10px 0 #0a0a0a;}.price_tool_rate_form{margin:3px 0}.price_tool_rate_div,.price_tool_input_div{margin:3px 0;display:flex;justify-content:center;width:160px;position:relative;}.price_tool_menu_text{width:12px;padding-right:3px;height:100%;float:right;}.price_tool_chose_btn{font-size:14px;transition:background-color .3s;width:60px;color:#C5C3C2;line-height:28px;border-radius:3px 0 0 3px;display:inline-block;background-color:#171a2185;cursor:pointer;}.price_tool_chose_btn:hover{background-color:#111b22cc;}.price_tool_rate_input{width:94px;height:24px;font-size:14px;border:0 !important;padding:2px 4px;background-color:#101822 !important;}.price_tool_input_btn{line-height:30px;width:50px;color:#ddd;display:inline-block;cursor:pointer;background-color:#467ea5d6;border:transparent;border-radius:3px 0 0 3px;transition:all .3s;font-weight:bold;font-size:16px;}.price_tool_input_btn:hover{background-color:#4090bf;}.price_tool_input_btn.price_tool_locked:hover{color:#bbb;}.price_tool_checkbox{display:none;}.price_tool_pagebtn{padding:0 10px;color:#f9f9f9;background-color:#f5f5f53b;width:15px;user-select:none;transition:all .3s;}.price_detail{user-select:text;width:158px;height:201px;display:flex;position:absolute;background-color:#333;border:1px solid #666;color:#acb2b8;flex-direction:column;justify-content:space-around;}.price_detail>span{display:block;}.price_detail>.in,.price_detail>.out{padding: 0 8px;display:flex;align-items: center;}.price_detail>.in span:last-child,.price_detail>.out span:last-child{margin-left:auto;text-align:right;}.detail_time{font-size:12px;margin-top:auto;color:#8b929a;}.currency_selector{position:relative;}.price_tool_alert_box{position:absolute;bottom:235px;}.price_tool_alert{width:140px;position:relative;color:#fff;word-break:break-all;padding:5px 10px;margin-top:7px;border-radius:5px;transition:opacity .5s;}.price_tool_alert.success{background-color:#379e2ed9;box-shadow:0 0 5px 0px #379e2e;}.price_tool_alert.failed{background-color:#d14c47d9;box-shadow:0 0 5px 0px #d04944;}.price_tool_alert.warning{background-color:#d4a925d9;box-shadow:0 0 5px 0px #d4a925;}.scale-in{-webkit-animation:scale-in cubic-bezier(.22,.58,.12,.98) .4s;animation:scale-in cubic-bezier(.22,.58,.12,.98) .4s;}.scale-out{-webkit-animation:scale-out cubic-bezier(.22,.58,.12,.98) .4s;animation:scale-out cubic-bezier(.22,.58,.12,.98) .4s;}@keyframes rotate-R{0%{-webkit-transform:rotate(0);transform:rotate(0);}100%{-webkit-transform:rotate(360deg);transform:rotate(360deg);}}@keyframes scale-in{0%{transform:scale(0);}100%{transform:scale(1);}}@keyframes scale-out{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(.8);}}');

    document.querySelector("body").insertAdjacentHTML("beforeEnd", `<div id="marketTool"></div>`);

    new Vue({
        el: '#marketTool',
        data() {
            return {
                CURRENCY_DATA: {"AED":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"ae","eCurrencyCode":32,"strCode":"AED","strDecimalSymbol":".","strName":"阿联酋迪拉姆","strSymbol":"AED","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"ARS":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"ar","eCurrencyCode":34,"strCode":"ARS","strDecimalSymbol":",","strName":"阿根廷比索","strSymbol":"ARS$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."},"AUD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"au","eCurrencyCode":21,"strCode":"AUD","strDecimalSymbol":".","strName":"澳大利亚元","strSymbol":"A$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"BRL":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"br","eCurrencyCode":7,"strCode":"BRL","strDecimalSymbol":",","strName":"巴西雷亚尔","strSymbol":"R$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."},"PLN":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"pl","eCurrencyCode":6,"strCode":"PLN","strDecimalSymbol":",","strName":"波兰兹罗提","strSymbol":"zł","strSymbolAndNumberSeparator":" ","strThousandsSeparator":" "},"RUB":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"countryCode":"ru","eCurrencyCode":5,"strCode":"RUB","strDecimalSymbol":",","strName":"俄罗斯卢布","strSymbol":"руб.","strSymbolAndNumberSeparator":" ","strThousandsSeparator":""},"PHP":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"ph","eCurrencyCode":12,"strCode":"PHP","strDecimalSymbol":".","strName":"菲律宾比索","strSymbol":"P","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"COP":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"co","eCurrencyCode":27,"strCode":"COP","strDecimalSymbol":",","strName":"哥伦比亚比索","strSymbol":"COL$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."},"CRC":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"cr","eCurrencyCode":40,"strCode":"CRC","strDecimalSymbol":",","strName":"哥斯达黎加科朗","strSymbol":"₡","strSymbolAndNumberSeparator":"","strThousandsSeparator":"."},"HKD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"hk","eCurrencyCode":29,"strCode":"HKD","strDecimalSymbol":".","strName":"港币","strSymbol":"HK$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"KZT":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"countryCode":"kz","eCurrencyCode":37,"strCode":"KZT","strDecimalSymbol":",","strName":"哈萨克斯坦坚戈","strSymbol":"₸","strSymbolAndNumberSeparator":"","strThousandsSeparator":" "},"KRW":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"kr","eCurrencyCode":16,"strCode":"KRW","strDecimalSymbol":".","strName":"韩元","strSymbol":"₩","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"CAD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"ca","eCurrencyCode":20,"strCode":"CAD","strDecimalSymbol":".","strName":"加拿大元","strSymbol":"CDN$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"QAR":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"qa","eCurrencyCode":39,"strCode":"QAR","strDecimalSymbol":".","strName":"卡塔尔里亚尔","strSymbol":"QR","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"KWD":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"kw","eCurrencyCode":38,"strCode":"KWD","strDecimalSymbol":".","strName":"科威特第纳尔","strSymbol":"KD","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"MYR":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"my","eCurrencyCode":11,"strCode":"MYR","strDecimalSymbol":".","strName":"马来西亚林吉特","strSymbol":"RM","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"USD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"us","eCurrencyCode":1,"strCode":"USD","strDecimalSymbol":".","strName":"美元","strSymbol":"$","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"MXN":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"mx","eCurrencyCode":19,"strCode":"MXN","strDecimalSymbol":".","strName":"墨西哥比索","strSymbol":"Mex$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"PEN":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"pe","eCurrencyCode":26,"strCode":"PEN","strDecimalSymbol":".","strName":"秘鲁索尔","strSymbol":"S/.","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"ZAR":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"za","eCurrencyCode":28,"strCode":"ZAR","strDecimalSymbol":".","strName":"南非兰特","strSymbol":"R","strSymbolAndNumberSeparator":" ","strThousandsSeparator":" "},"NOK":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"no","eCurrencyCode":9,"strCode":"NOK","strDecimalSymbol":",","strName":"挪威克朗","strSymbol":"kr","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."},"EUR":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"eu","eCurrencyCode":3,"strCode":"EUR","strDecimalSymbol":",","strName":"欧元","strSymbol":"€","strSymbolAndNumberSeparator":"","strThousandsSeparator":" "},"CNY":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"cn","eCurrencyCode":23,"strCode":"CNY","strDecimalSymbol":".","strName":"人民币","strSymbol":"¥","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"JPY":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"jp","eCurrencyCode":8,"strCode":"JPY","strDecimalSymbol":".","strName":"日元","strSymbol":"JP¥","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"CHF":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"ch","eCurrencyCode":4,"strCode":"CHF","strDecimalSymbol":".","strName":"瑞士法郎","strSymbol":"CHF","strSymbolAndNumberSeparator":" ","strThousandsSeparator":" "},"SAR":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"sa","eCurrencyCode":31,"strCode":"SAR","strDecimalSymbol":".","strName":"沙特里亚尔","strSymbol":"SR","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"THB":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"th","eCurrencyCode":14,"strCode":"THB","strDecimalSymbol":".","strName":"泰铢","strSymbol":"฿","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"TRY":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":false,"countryCode":"tr","eCurrencyCode":17,"strCode":"TRY","strDecimalSymbol":",","strName":"土耳其里拉","strSymbol":"TL","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."},"UAH":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"countryCode":"ua","eCurrencyCode":18,"strCode":"UAH","strDecimalSymbol":",","strName":"乌克兰格里夫纳","strSymbol":"₴","strSymbolAndNumberSeparator":"","strThousandsSeparator":" "},"UYU":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"uy","eCurrencyCode":41,"strCode":"UYU","strDecimalSymbol":",","strName":"乌拉圭比索","strSymbol":"$U","strSymbolAndNumberSeparator":"","strThousandsSeparator":"."},"TWD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"cn","eCurrencyCode":30,"strCode":"TWD","strDecimalSymbol":".","strName":"新台币","strSymbol":"NT$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"SGD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"sg","eCurrencyCode":13,"strCode":"SGD","strDecimalSymbol":".","strName":"新加坡元","strSymbol":"S$","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"NZD":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"nz","eCurrencyCode":22,"strCode":"NZD","strDecimalSymbol":".","strName":"新西兰元","strSymbol":"NZ$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"ILS":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"il","eCurrencyCode":35,"strCode":"ILS","strDecimalSymbol":".","strName":"以色列新谢克尔","strSymbol":"₪","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"INR":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"in","eCurrencyCode":24,"strCode":"INR","strDecimalSymbol":".","strName":"印度卢比","strSymbol":"₹","strSymbolAndNumberSeparator":" ","strThousandsSeparator":","},"IDR":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"id","eCurrencyCode":10,"strCode":"IDR","strDecimalSymbol":".","strName":"印度尼西亚卢比","strSymbol":"Rp","strSymbolAndNumberSeparator":" ","strThousandsSeparator":" "},"GBP":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":false,"countryCode":"gb","eCurrencyCode":2,"strCode":"GBP","strDecimalSymbol":".","strName":"英国英镑","strSymbol":"£","strSymbolAndNumberSeparator":"","strThousandsSeparator":","},"VND":{"bSymbolIsPrefix":false,"bWholeUnitsOnly":true,"countryCode":"vn","eCurrencyCode":15,"strCode":"VND","strDecimalSymbol":",","strName":"越南盾","strSymbol":"₫","strSymbolAndNumberSeparator":"","strThousandsSeparator":"."},"CLP":{"bSymbolIsPrefix":true,"bWholeUnitsOnly":true,"countryCode":"cl","eCurrencyCode":25,"strCode":"CLP","strDecimalSymbol":",","strName":"智利比索","strSymbol":"CLP$","strSymbolAndNumberSeparator":" ","strThousandsSeparator":"."}},
                inputList: {
                    "cost": {
                        id: "cost",
                        name: "cost",
                        value: "",
                        describe: {
                            name: "成本",
                            content: "购入价格"
                        }
                    },
                    "scale": {
                        id: "scale",
                        name: "scale",
                        value: GM_getValue("scale", ""),
                        describe: {
                            name: "比例",
                            content: "价格比例"
                        }
                    },
                    "withFee": {
                        id: "withFee",
                        name: "sell",
                        value: "",
                        describe: {
                            name: "税后",
                            content: "税后实收"
                        }
                    },
                    "withoutFee": {
                        id: "withoutFee",
                        name: "sell",
                        value: "",
                        describe: {
                            name: "售价",
                            content: "买家实付"
                        }
                    }
                },
                currency: {
                    origin: {
                        select: GM_getValue("originSelect", "CNY"),
                        loading: false
                    },
                    foreign: {
                        select: GM_getValue("foreignSelect", "CNY"),
                        loading: false
                    },
                    target: undefined,
                },
                exchangeRate: Object.assign(GM_getValue("exchangeRate", {}), {
                    "CNY": {
                        FtoC: 1,
                        CtoF: 1,
                        get timestamp() {
                            return Date.now();
                        }
                    },
                }),
                exchangeValue: {
                    origin: "",
                    foreign: ""
                },
                inputLockList: GM_getValue("inputLockList", ["scale"]),
                lastChanged: undefined,
                selectorStatus: false,
                selectorStyle: {
                    top: undefined
                },
                relevance: {
                    "cost": ["scale", "withFee"],
                    "scale": ["cost", "withFee"],
                    "withFee": ["withoutFee", "scale", "cost"],
                    "withoutFee": ["withFee", "scale", "cost"],
                },
                dragSetting: {
                    dragging: false,
                    panelOffsetX: undefined,
                    panelOffsetY: undefined
                },
                priceDetail: {
                    name: undefined,
                    display: false
                },
                alertMsg: [],
                panelStyle: GM_getValue("panelStyle", { top: "35%", right: "10px" }),
                forceSyncCost: 修改汇率时强行同步成本
            }
        },
        computed: {
            computedPriceDetail() {
                let obj = {};
                if (this.priceDetail.name) {
                    obj.name = this.CURRENCY_DATA[this.priceDetail.name].strName;
                    obj.flag = this.CURRENCY_DATA[this.priceDetail.name].countryCode;
                    obj.in = this.exchangeRate[this.priceDetail.name].CtoF;
                    obj.out = this.exchangeRate[this.priceDetail.name].FtoC;
                    let timestamp = this.exchangeRate[this.priceDetail.name].timestamp;
                    obj.time = new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
                    obj.diff = this.$options.methods.upToNow(Math.round((Date.now() - timestamp) / 1000));
                    obj.example = this.$options.methods.getCurrencyFormatExample(this.CURRENCY_DATA[this.priceDetail.name]);
                }
                return obj;
            },
            inputLock: {
                get() {
                    return this.inputLockList;
                },
                set(val) {
                    this.inputLockList.splice(0);
                    this.inputLockList.push(val.pop());
                    GM_setValue("inputLockList", this.inputLockList);
                }
            }
        },
        methods: {
            alert(option) {
                this.alertMsg.push(option);
                setTimeout(() => {
                    let index = this.alertMsg.indexOf(option);
                    if (index >= 0) {
                        this.alertMsg.splice(index, 1);
                    }
                }, option.time);
            },
            updateCurrency(currencyData, target = this.currency.target) {
                let select = this.currency[target].select;
                this.currency[target].loading = true;
                /* 请求一次人民币和一次目标货币来计算汇率 */
                let rmb = fetch("https://steamcommunity.com/market/priceoverview/?appid=730&country=TW&currency=23&market_hash_name=StatTrak%E2%84%A2%20Swap%20Tool").then(res => res.json());
                let targetCurrency = fetch(`https://steamcommunity.com/market/priceoverview/?appid=730&country=TW&currency=${currencyData.eCurrencyCode}&market_hash_name=StatTrak%E2%84%A2%20Swap%20Tool`).then(res => res.json());
                Promise.all([rmb, targetCurrency]).then(([rmbData, targetData]) => {
                    if (rmbData.success && targetData.success && rmbData.median_price && targetData.median_price) {
                        rmbPrice = rmbData.median_price.replace(/[^0-9]/g, "");
                        targetPrice = targetData.median_price.replace(/[^0-9]/g, "");
                        this.exchangeRate[currencyData.strCode] = {
                            FtoC: (rmbPrice / targetPrice).toFixed(6),
                            CtoF: (targetPrice / rmbPrice).toFixed(6),
                            timestamp: Date.now()
                        }
                        GM_setValue("exchangeRate", this.exchangeRate);
                    }
                    if (this.currency[target].select == select) {
                        this.currency[target].loading = false;
                        // 更新因为某些原因没有成功时恢复CNY
                        if (!this.exchangeRate[select]) {
                            this.alert({
                                time: 7000,
                                type: "warning",
                                msg: `没有汇率信息：${this.CURRENCY_DATA[this.currency[target].select].strName}`
                            });
                            this.currency[target].select = "CNY";
                            GM_setValue(`${select}Select`, "CNY");
                        } else {
                            this.alert({
                                time: 5000,
                                type: "success",
                                msg: `已更新汇率：${this.CURRENCY_DATA[this.currency[target].select].strName}`
                            });
                        }
                        this.calculateExchangeValue(this.currency.target == "origin" ? "foreign" : "origin");
                    }
                }).catch(err => {
                    if (this.currency[target].select == select) {
                        this.alert({
                            time: 7000,
                            type: "failed",
                            msg: `汇率更新失败：${this.CURRENCY_DATA[this.currency[target].select].strName}`
                        });
                        this.currency[target].loading = false;
                        // 更新因为某些原因没有成功时恢复CNY
                        if (!this.exchangeRate[select]) {
                            this.currency[target].select = "CNY";
                            GM_setValue(`${select}Select`, "CNY");
                        }
                        this.calculateExchangeValue(this.currency.target == "origin" ? "foreign" : "origin");
                    }
                    console.log(err);
                });
            },
            detailDisplaySide() {
                let selector = this.$refs.tool_panel;
                if (!selector) { return; }
                let style = getComputedStyle(selector);
                let left = parseInt(style.left);
                let right = parseInt(style.right);
                if (left > right) {
                    return {
                        left: "-165px"
                    }
                } else {
                    return {
                        right: "-165px"
                    }
                }
            },
            upToNow(sec) {
                // const uppercaseChinese = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
                if (sec <= 0) {
                    return "刚刚更新";
                }

                const units = [
                    { name: "年", value: 365 * 24 * 60 * 60 },
                    { name: "个月", value: 30 * 24 * 60 * 60 },
                    { name: "周", value: 7 * 24 * 60 * 60 },
                    { name: "天", value: 24 * 60 * 60 },
                    { name: "小时", value: 60 * 60 },
                    { name: "分", value: 60 },
                    { name: "秒", value: 1 }
                ];

                let result = "";
                let count = 0;

                for (const unit of units) {
                    const value = Math.floor(sec / unit.value);
                    if (value > 0) {
                        result += value + unit.name;
                        sec %= unit.value;
                        count++;
                        if (count >= 2) {
                            break;
                        }
                    }
                }

                return result + "前更新";
            },
            switchPage(target) {
                let temp = document.getElementById(`searchResults_btn_${target}`);
                temp && temp.click();
            },
            changeCurrency(event) {
                let val = event.target.getAttribute("value");
                this.currency[this.currency.target].select = val;
                this.selectorStatus = false;
                this.calculateExchangeValue(this.currency.target == "origin" ? "foreign" : "origin");
                if ((!this.exchangeRate[val]) || Date.now() - this.exchangeRate[val].timestamp > 1800000) {
                    this.updateCurrency(this.CURRENCY_DATA[val]);
                }
                GM_setValue(`${this.currency.target}Select`, val);
            },
            closeSelector() {
                this.selectorStatus = false;
            },
            showCurrencySelector(target) {
                if (this.selectorStatus && this.currency.target == target) {
                    this.selectorStatus = false;
                } else {
                    this.selectorStyle.top = target == "origin" ? '-5px' : '-36px';
                    this.currency.target = target;
                    this.selectorStatus = true;
                    let top = 0;
                    let selector = this.$refs.selector;
                    let checked = document.querySelector(".currency_selector_item.checked");
                    checked && checked.classList.remove("checked");
                    for (let index = 0; index < selector.children.length; index++) {
                        let item = selector.children[index];
                        if (item.getAttribute("value") == this.currency[target].select) {
                            top = index * 29 - 87;
                            item.classList.add("checked");
                            break;
                        }
                    }
                    this.$nextTick(() => {
                        this.$refs.selector.scrollTop = top;
                    });
                }
            },
            calculateExchangeValue(self) {
                if (!(this.exchangeRate[this.currency["foreign"].select] && this.exchangeRate[this.currency["origin"].select])) { return }
                let target = self == "origin" ? "foreign" : "origin";
                if (!+this.exchangeValue[self]) {
                    this.exchangeValue[target] = '';
                } else if (this.currency[self].select == this.currency[target].select) {
                    this.exchangeValue[target] = this.exchangeValue[self];
                    if (this.forceSyncCost || this.inputLockList[0] != "cost") {
                        this.inputList["cost"].value = this.exchangeValue[target]
                        this.updateValue("cost");
                    }
                } else {
                    let cny = this.exchangeRate[this.currency[self].select].FtoC * this.exchangeValue[self];
                    let foreign = this.exchangeRate[this.currency[target].select].CtoF * cny;
                    this.exchangeValue[target] = this.$options.methods.toFixed(foreign);
                    if (this.forceSyncCost || this.inputLockList[0] != "cost") {
                        this.inputList["cost"].value = this.exchangeValue[target]
                        this.updateValue("cost");
                    }
                }
            },
            toFixed(value) {
                return Math.round(value * 100) / 100;
            },
            updateValue(key) {
                this.lastChanged = key;
                for (const id of this.relevance[key]) {
                    if (this.inputLock.includes(this.inputList[id].name) && this.inputList[id].name != this.inputList[key].name) {
                        continue;
                    }
                    this.$options.methods[`update_${id}`](key, this);
                }
            },
            update_cost(target, vm) {
                if (!(+vm.inputList["scale"].value && +vm.inputList["withFee"].value)) { return; }
                vm.inputList["cost"].value = vm.$options.methods.toFixed(vm.inputList["scale"].value * vm.inputList["withFee"].value);
            },
            update_scale(target, vm) {
                if (!(+vm.inputList["cost"].value && +vm.inputList["withFee"].value)) { return; }
                vm.inputList["scale"].value = vm.$options.methods.toFixed(vm.inputList["cost"].value / vm.inputList["withFee"].value);
            },
            update_withFee(target, vm) {
                if (target == "withoutFee") {
                    if (!+vm.inputList["withoutFee"].value) { return; }
                    vm.inputList["withFee"].value = vm.$options.methods.toFixed(vm.inputList["withoutFee"].value / 1.15);
                } else {
                    if (!(+vm.inputList["cost"].value && +vm.inputList["scale"].value)) { return; }
                    vm.inputList["withFee"].value = vm.$options.methods.toFixed(vm.inputList["cost"].value / vm.inputList["scale"].value);
                    vm.$options.methods.update_withoutFee(target, vm);
                }
            },
            update_withoutFee(target, vm) {
                vm.inputList["withoutFee"].value = vm.$options.methods.toFixed(vm.inputList["withFee"].value * 1.15);
            },
            startDrag(e) {
                let panel = this.$refs["tool_panel"];
                this.dragSetting.panelOffsetX = e.pageX - panel.offsetLeft;
                this.dragSetting.panelOffsetY = e.pageY - panel.offsetTop;
                document.body.style.userSelect = "none";
                this.dragSetting.dragging = true;
            },
            dragging(e) {
                if (this.dragSetting.dragging) {
                    let panel = this.$refs["tool_panel"];
                    let width = panel.offsetWidth + 10;
                    let diffX = document.body.offsetWidth - (e.pageX - this.dragSetting.panelOffsetX);
                    let style = getComputedStyle(panel);
                    let left = parseInt(style.left);
                    if ((e.pageX - this.dragSetting.panelOffsetX) > 10 && diffX > width) {
                        if (left < document.body.offsetWidth >> 1) {
                            panel.style.right = "";
                            panel.style.left = e.pageX - this.dragSetting.panelOffsetX + "px";
                        } else {
                            panel.style.left = "";
                            panel.style.right = document.body.offsetWidth - 170 - (e.pageX - this.dragSetting.panelOffsetX) + "px";
                        }
                        panel.style.top = e.pageY - this.dragSetting.panelOffsetY + "px";
                    }
                }
            },
            currencyStatus(key) {
                if (this.exchangeRate[key]) {
                    let diff = Date.now() - this.exchangeRate[key].timestamp;
                    if (diff < 1800000) {
                        return "#0ac20a";
                    } else if (diff < 7200000) {
                        return "#98d000";
                    } else if (diff < 14400000) {
                        return "#dfc800";
                    } else if (diff < 28800000) {
                        return "#d36d03";
                    } else {
                        return "#616161";
                    }
                }
                return "#00000000";
            },
            getCurrencyFormatExample(currency) {
                let value = 12345;
                // 整数或保留两位小数
                const decimals = currency.bWholeUnitsOnly ? 0 : 2;
                let [integer, decimal = ""] = value.toFixed(decimals).split(".");
                // 千位分隔
                integer = integer.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    currency.strThousandsSeparator
                );
                // 数字部分
                let result = integer;

                if (decimals > 0) {
                    result += currency.strDecimalSymbol + decimal;
                }
                // 添加货币符号
                if (currency.bSymbolIsPrefix) {
                    result =
                        currency.strSymbol +
                        currency.strSymbolAndNumberSeparator +
                        result;
                } else {
                    result =
                        result +
                        currency.strSymbolAndNumberSeparator +
                        currency.strSymbol;
                }
                return result;
            },
            displayDetail(key) {
                if (this.exchangeRate[key]) {
                    this.priceDetail.display = true;
                    this.priceDetail.name = key;
                } else {
                    this.priceDetail.display = false;
                }
            }
        },
        watch: {
            'inputList.scale.value'(val) {
                if (this.inputLockList.includes("scale")) {
                    GM_setValue("scale", val);
                }
            }
        },
        mounted: function () {
            window.addEventListener('resize', e => {
                let panel = this.$refs["tool_panel"];
                let style = getComputedStyle(panel);
                let left = parseInt(style.left);
                let right = parseInt(style.right);
                if (left < 10 || right < 10) {
                    panel.style.right = panel.style.left = "";
                    if (left < 10) {
                        panel.style.right = right - 10 + left + "px";
                    } else {
                        panel.style.left = left - 10 + right + "px";
                    }
                }
            });
            window.addEventListener('mouseup', e => {
                if (this.dragSetting.dragging) {
                    document.body.style.userSelect = "";
                    this.dragSetting.dragging = false;
                    let panel = this.$refs["tool_panel"];
                    let style = getComputedStyle(panel);
                    let top = style.top;
                    let left = style.left;
                    let right = style.right;
                    let temp = {
                        top: top,
                    };
                    if (parseInt(left) > parseInt(right)) {
                        temp.right = right;
                    } else {
                        temp.left = left;
                    }
                    GM_setValue("panelStyle", temp);
                }
            });
            window.addEventListener('click', e => {
                if (e.target.classList.contains("price_tool_menu_text") || e.target.classList.contains("price_tool_chose_btn")) {
                    return;
                }
                if (this.selectorStatus) {
                    this.selectorStatus = false;
                }
            });
            GM_registerMenuCommand("恢复默认设置", () => {
                GM_deleteValue("inputLockList");
                GM_deleteValue("scale");
                GM_deleteValue("originSelect");
                GM_deleteValue("foreignSelect");
                GM_deleteValue("panelStyle");
                this.panelStyle = { top: "35%", right: "10px" };
            });
            this.$nextTick(function () {
                let buffPrice = location.search.match(/buffPrice=([\d\.]+)/);
                if (buffPrice != null) {
                    this.inputList.cost.value = buffPrice[1];
                    this.updateValue("cost");
                }
                if (Date.now() - this.exchangeRate[this.currency.origin.select].timestamp > 1800000) {
                    this.updateCurrency(this.CURRENCY_DATA[this.currency.origin.select], "origin");
                }
                if (Date.now() - this.exchangeRate[this.currency.foreign.select].timestamp > 1800000) {
                    this.updateCurrency(this.CURRENCY_DATA[this.currency.foreign.select], "foreign");
                }
            });
        },
        render: render
    });

  function render() {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{ref:"tool_panel",staticClass:"price_tool",style:(_vm.panelStyle)},[_c('div',{staticClass:"price_tool_alert_box"},_vm._l((_vm.alertMsg),function(item){return _c('div',{key:item.msg,staticClass:"price_tool_alert scale-in",class:item.type},[_vm._v("\n                        "+_vm._s(item.msg)+"\n                    ")])}),0),_vm._v(" "),_c('form',{attrs:{"id":"price_tool_form"}},_vm._l((_vm.inputList),function(item,index){return _c('div',{key:item.id,staticClass:"price_tool_input_div"},[_c('label',{staticClass:"price_tool_input_btn",class:{price_tool_locked:_vm.inputLock.includes(item.name)},attrs:{"for":item.id}},[_vm._v("\n                            "+_vm._s(item.describe.name)+"\n                        ")]),_vm._v(" "),_c('svg',{staticClass:"icon",class:{price_tool_hide:!_vm.inputLock.includes(item.name),icon_forbid:_vm.inputLock.includes(item.name)},attrs:{"viewBox":"0 0 1024 1024","version":"1.1","xmlns":"http://www.w3.org/2000/svg"}},[_c('path',{attrs:{"d":"M512 64c153.173333 0 277.333333 124.16 277.333333 277.333333v128a128 128 0 0 1 128 128v234.666667a128 128 0 0 1-128 128H234.666667a128 128 0 0 1-128-128V597.333333a128 128 0 0 1 128-128v-128c0-153.173333 124.16-277.333333 277.333333-277.333333z m277.333333 469.333333H234.666667a64 64 0 0 0-63.893334 60.245334L170.666667 597.333333v234.666667a64 64 0 0 0 60.245333 63.893333L234.666667 896h554.666666a64 64 0 0 0 63.893334-60.245333L853.333333 832V597.333333a64 64 0 0 0-60.245333-63.893333L789.333333 533.333333z m-243.2 106.666667c4.693333 0 8.533333 3.84 8.533334 8.533333v110.933334a8.533333 8.533333 0 0 1-8.533334 8.533333h-46.933333a8.533333 8.533333 0 0 1-8.533333-8.533333v-110.933334c0-4.693333 3.84-8.533333 8.533333-8.533333h46.933333zM512 128c-115.84 0-210.090667 92.309333-213.248 207.36L298.666667 341.333333v128h426.666666v-128c0-115.84-92.309333-210.090667-207.36-213.248L512 128z","p-id":"2041"}})]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.inputLock),expression:"inputLock"}],staticClass:"price_tool_checkbox",attrs:{"type":"checkbox","id":item.id,"disabled":_vm.inputLock.includes(item.name)},domProps:{"value":item.name,"checked":Array.isArray(_vm.inputLock)?_vm._i(_vm.inputLock,item.name)>-1:(_vm.inputLock)},on:{"change":function($event){var $$a=_vm.inputLock,$$el=$event.target,$$c=$$el.checked?(true):(false);if(Array.isArray($$a)){var $$v=item.name,$$i=_vm._i($$a,$$v);if($$el.checked){$$i<0&&(_vm.inputLock=$$a.concat([$$v]))}else{$$i>-1&&(_vm.inputLock=$$a.slice(0,$$i).concat($$a.slice($$i+1)))}}else{_vm.inputLock=$$c}}}}),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(item.value),expression:"item.value"}],ref:item.id,refInFor:true,staticClass:"price_tool_input",class:{price_tool_locked:_vm.inputLock.includes(item.name)},attrs:{"type":"number","step":"0.01","min":"0","placeholder":item.describe.content},domProps:{"value":(item.value)},on:{"input":[function($event){if($event.target.composing){ return; }_vm.$set(item, "value", $event.target.value)},function($event){return _vm.updateValue(index)}]}})])}),0),_vm._v(" "),_c('form',{attrs:{"id":"price_tool_rate_form"}},[_c('div',{staticClass:"price_tool_rate_div"},[_c('label',{staticClass:"price_tool_chose_btn",on:{"click":function($event){return _vm.showCurrencySelector('foreign')}}},[_vm._v("\n                            "+_vm._s(_vm.CURRENCY_DATA[_vm.currency.foreign.select].strSymbol)+"\n                            "),_c('svg',{staticClass:"price_tool_menu_text",class:{transparent:_vm.currency.foreign.loading},attrs:{"viewBox":"0 0 20 20"}},[_c('path',{attrs:{"d":"M5.14541 6.89977L10.0063 12.2027L14.8671 6.89977C15.3557 6.36674 16.145 6.36674 16.6336 6.89977C17.1221 7.4328 17.1221 8.29385 16.6336 8.82688L10.8832 15.1002C10.3946 15.6333 9.60537 15.6333 9.11678 15.1002L3.36644 8.82688C2.87785 8.29385 2.87785 7.4328 3.36644 6.89977C3.85503 6.38041 4.65682 6.36674 5.14541 6.89977Z","fill":"currentColor"}})]),_vm._v(" "),(_vm.currency.foreign.loading)?_c('svg',{staticClass:"currency_loading",attrs:{"viewBox":"0 0 1024 1024","width":"18","height":"18"}},[_c('path',{attrs:{"d":"M128 512c0-211.2 172.8-384 384-384s384 172.8 384 384c0 38.4-25.6 64-64 64s-64-25.6-64-64c0-140.8-115.2-256-256-256S256 371.2 256 512s115.2 256 256 256c38.4 0 64 25.6 64 64s-25.6 64-64 64c-211.2 0-384-172.8-384-384z","p-id":"4797"}})]):_vm._e()]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.exchangeValue.foreign),expression:"exchangeValue.foreign"}],staticClass:"price_tool_rate_input",attrs:{"type":"number","min":"0","step":"0.01","placeholder":_vm.CURRENCY_DATA[_vm.currency.foreign.select].strName},domProps:{"value":(_vm.exchangeValue.foreign)},on:{"input":[function($event){if($event.target.composing){ return; }_vm.$set(_vm.exchangeValue, "foreign", $event.target.value)},function($event){return _vm.calculateExchangeValue('foreign')}]}})]),_vm._v(" "),_c('div',{staticClass:"price_tool_rate_div"},[_c('label',{staticClass:"price_tool_chose_btn",on:{"click":function($event){return _vm.showCurrencySelector('origin')}}},[_vm._v("\n                            "+_vm._s(_vm.CURRENCY_DATA[_vm.currency.origin.select].strSymbol)+"\n                            "),_c('svg',{staticClass:"price_tool_menu_text",class:{transparent:_vm.currency.origin.loading},attrs:{"viewBox":"0 0 20 20"}},[_c('path',{attrs:{"d":"M5.14541 6.89977L10.0063 12.2027L14.8671 6.89977C15.3557 6.36674 16.145 6.36674 16.6336 6.89977C17.1221 7.4328 17.1221 8.29385 16.6336 8.82688L10.8832 15.1002C10.3946 15.6333 9.60537 15.6333 9.11678 15.1002L3.36644 8.82688C2.87785 8.29385 2.87785 7.4328 3.36644 6.89977C3.85503 6.38041 4.65682 6.36674 5.14541 6.89977Z","fill":"currentColor"}})]),_vm._v(" "),(_vm.currency.origin.loading)?_c('svg',{staticClass:"currency_loading",attrs:{"viewBox":"0 0 1024 1024","width":"18","height":"18"}},[_c('path',{attrs:{"d":"M128 512c0-211.2 172.8-384 384-384s384 172.8 384 384c0 38.4-25.6 64-64 64s-64-25.6-64-64c0-140.8-115.2-256-256-256S256 371.2 256 512s115.2 256 256 256c38.4 0 64 25.6 64 64s-25.6 64-64 64c-211.2 0-384-172.8-384-384z","p-id":"4797"}})]):_vm._e()]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.exchangeValue.origin),expression:"exchangeValue.origin"}],staticClass:"price_tool_rate_input",attrs:{"type":"number","min":"0","step":"0.01","placeholder":_vm.CURRENCY_DATA[_vm.currency.origin.select].strName},domProps:{"value":(_vm.exchangeValue.origin)},on:{"input":[function($event){if($event.target.composing){ return; }_vm.$set(_vm.exchangeValue, "origin", $event.target.value)},function($event){return _vm.calculateExchangeValue('origin')}]}})]),_vm._v(" "),_c('div',{staticClass:"currency_selector"},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.priceDetail.display),expression:"priceDetail.display"}],staticClass:"price_detail",style:([_vm.selectorStyle,_vm.detailDisplaySide()])},[_c('div',{staticClass:"name"},[_c('img',{staticClass:"profile_flag",attrs:{"src":'https://community.fastly.steamstatic.com/public/images/countryflags/' + _vm.computedPriceDetail.flag + '.gif'}}),_vm._v("\n                                "+_vm._s(_vm.computedPriceDetail.name)+"\n                            ")]),_vm._v(" "),_c('div',{staticClass:"in"},[_c('span',[_vm._v("兑入：")]),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.computedPriceDetail.in))])]),_vm._v(" "),_c('div',{staticClass:"out"},[_c('span',[_vm._v("兑回：")]),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.computedPriceDetail.out))])]),_vm._v(" "),_c('span',{staticStyle:{"font-size":"14px","color":"#c86375"}},[_vm._v("以上汇率基于人民币")]),_vm._v(" "),_c('div',{staticClass:"example"},[_vm._v("\n                            货币格式："),_c('br'),_vm._v("\n                                "+_vm._s(_vm.computedPriceDetail.example)+"\n                            ")]),_vm._v(" "),_c('div',{staticClass:"detail_time"},[_c('span',[_vm._v(_vm._s(_vm.computedPriceDetail.diff))]),_c('br'),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.computedPriceDetail.time))])])]),_vm._v(" "),_c('transition',{attrs:{"enter-active-class":"scale-in","leave-active-class":"scale-out"}},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.selectorStatus),expression:"selectorStatus"}],ref:"selector",staticClass:"currency_selector_menu",style:(_vm.selectorStyle),on:{"click":_vm.changeCurrency,"mouseleave":function($event){_vm.selectorStatus = false;_vm.priceDetail.display = false}}},_vm._l((_vm.CURRENCY_DATA),function(value,key){return _c('span',{key:key,staticClass:"currency_selector_item",style:({'border-color':_vm.currencyStatus(key)}),attrs:{"value":key},on:{"mouseover":function($event){return _vm.displayDetail(key)}}},[_c('img',{staticClass:"profile_flag",attrs:{"src":'https://community.fastly.steamstatic.com/public/images/countryflags/' + value.countryCode + '.gif'}}),_vm._v("\n                                    "+_vm._s(value.strName)+"\n                                    "),_c('span',{staticClass:"f-right",attrs:{"value":key}},[_vm._v(_vm._s(value.strSymbol))])])}),0)])],1)]),_vm._v(" "),_c('div',{staticStyle:{"margin-top":"5px"}},[_c('span',{staticClass:"price_tool_drag_bar",class:{grabbing:_vm.dragSetting.dragging},on:{"mousedown":_vm.startDrag,"mousemove":_vm.dragging}},[_vm._v("拖动")])])])};

})();