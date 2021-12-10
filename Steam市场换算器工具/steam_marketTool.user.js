// ==UserScript==
// @name         Steam市场 价格/比例/汇率 换算器
// @namespace    http://pronax.wtf/
// @version      0.4.2
// @description  见安装页面介绍
// @author       Pronax
// @include      *://steamcommunity.com/market/*
// @require      https://code.jquery.com/jquery-1.12.4.min.js
// @connect      www.usd-cny.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    function getUrlParam(name, url) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var result
        if (url) {
            result = url.substr(34).match(reg);  //匹配目标参数
        } else {
            result = window.location.search.substr(1).match(reg);  //匹配目标参数
        }
        if (result != null) return unescape(result[2]); return null; //返回参数值
    }

    function roundToTwo(num) {
        return Math.round((num * 100)) / 100;
    }

    function currencyExchange(value, origin, target) {
        if (origin == target) {
            return value;
        }
        return (value / (exchangeRateList[origin + ":CUR"] || 1) * (exchangeRateList[target + ":CUR"] || 1)).toFixed(2);
    }

    function formatPrice(originPrice, currencyData) {
        if (!currencyData) {
            currencyData = g_rgCurrencyData[$("#price_tool_rate_form")[0].currency_origin.value];
        }
        originPrice = originPrice.replace(/[^0-9,\.]/g, "");
        if (originPrice.indexOf(",") >= 0 || originPrice.split(".").length > 2) {
            originPrice = originPrice.replaceAll(currencyData.strThousandsSeparator, "");
            if (currencyData.strDecimalSymbol == ",") {
                originPrice = originPrice.replaceAll(currencyData.strDecimalSymbol, ".");
            }
            while (originPrice.split(".").length > 2) {
                originPrice = originPrice.replace(".", "");
            }
        }
        return originPrice;
    }

    function updateRate(force) {
        if ((!force) && exchangeRateList.time_next_update_unix > Date.now()) {
            return;
        }
        GM_xmlhttpRequest({
            url: "https://www.usd-cny.com/hv.js",   // 这家的汇率差的挺多的
            method: "get",
            onload: function (response) {
                let text = response.responseText;
                let index = text.indexOf("price[\n");
                if (response.status == 200 && index >= 0) {
                    let data = text.slice(index,-1).replaceAll(/\r|\n|\s/g, "");
                    let price = new Object();
                    eval(data);
                    let timeUnix = Date.now();
                    price.time_next_update_unix = timeUnix + 10800000;
                    price.time_update_unix = timeUnix;
                    exchangeRateList = price;
                    console.log(exchangeRateList);
                    GM_setValue("exchangeRateList", exchangeRateList);
                } else {
                    console.log("更新汇率时出错：", response);
                }
            },
            onerror: function (err) {
                console.log("更新汇率失败：", err);
            }
        });
    }

    var exchangeRateList = GM_getValue("exchangeRateList") || {
        time_next_update_unix: 0,
        time_update_unix: 0
    };

    updateRate();

    GM_addStyle(
        ".price_tool_input{width:4.9rem;height:1rem;font-size:small!important;border:1px solid transparent!important}.price_tool_div{position:fixed;border-radius:.3rem;padding:.05rem .3rem .25rem;right:.6rem;top:35%;background-color:#53a3C399;text-align:center}.price_tool_input_div{margin:.2rem 0}.price_tool_rate_chose{height:1.4rem;border-radius:0;border:0;display:inline-block;background-color:#171a2185;cursor:pointer;color:#d2d2d2;text-align-last:center}.price_tool_rate_div{margin-top:1px}.price_tool_rate_input{height:.9rem;width:4.5rem;border:0!important}.price_tool_input_btn{display:inline-block;line-height:1.65rem;background-color:#eaeaea33;cursor:pointer;padding:0 12px;width:1.8rem;color:#d2d2d2}.price_tool_disabled{background-color:#0009}.price_tool_input_btn_toggle{display:inline-block;border:1px transparent;padding:0 .2rem;cursor:pointer;color:#d2e885;line-height:1.5rem}.price_tool_checkbox{display:none}.price_tool_pagebtn{padding:0 10px;color:#f9f9f9;background-color:#f5f5f53b;width:.8rem}"
    );
    GM_addStyle(
        ".market_listing_their_price{width:7rem;}.market_listing_their_price>span.market_table_value,.market_listing_my_price>span.market_table_value,.market_listing_num_listings>span.market_table_value{font-size:100%}.csgo_sticker>.stickers{margin-right:10px !important;}"
    );

    var demo_price_tool =
        "<div class='price_tool_div market_listing_filter_contents'><form onsubmit='return false' id='price_tool_form'><div class='price_tool_input_div'><label class='price_tool_input_btn price_tool_disabled' for='real_price'><b>成本</b></label><input class='price_tool_checkbox' type='checkbox' name='lock' value='1' checked><input type='text' step='0.01' min='0' class='price_tool_input filter_search_box' name='real_price' id='real_price' placeholder='现实价格'/></div><div class='price_tool_input_div'><label class='price_tool_input_btn' for='scale'><b>比例</b></label><input class='price_tool_checkbox' type='checkbox' name='lock' value='2'><input type='number' step='0.01' min='0' max='1' checked class='price_tool_input filter_search_box' name='scale' id='scale' placeholder='价格比例'/></div><div class='price_tool_input_div'><label class='price_tool_input_btn price_tool_disabled' for='money_receive'><b>收款</b></label><input class='price_tool_checkbox' type='checkbox' name='lock' value='3' checked><input type='text' class='price_tool_input filter_search_box' name='money_receive' id='money_receive' placeholder='收到的钱'/></div><div class='price_tool_input_div'><label class='price_tool_input_btn price_tool_disabled' for='money_pays'><b>付款</b></label><input type='text' class='price_tool_input filter_search_box' name='money_pays' id='money_pays' placeholder='支付价格'/></div></form><form id='price_tool_rate_form' onsubmit='return false'><div class='price_tool_rate_div'><select class='price_tool_rate_chose' name='currency_origin'><option value='ARS'>阿根廷</option><option value='AUD'>澳元</option><option value='BRL'>巴西</option><option value='RUB'>俄罗斯</option><option value='PHP'>菲律宾</option><option value='HKD'>港币</option><option value='KRW'>韩国</option><option value='CAD'>加拿大</option><option value='MYR'>林吉特</option><option value='USD'>美元</option><option value='EUR'>欧元</option><option value='CNY'>人民币</option><option value='JPY'>日元</option><option value='THB'>泰铢</option><option value='TRY'>土耳其</option><option value='SGD'>新加坡</option><option value='TWD'>新台币</option><option value='NZD'>新西兰</option><option value='INR'>印度</option><option value='IDR'>印尼</option><option value='GBP'>英镑</option><option value='SGD'>越南盾</option></select><input type='text' min='0' class='price_tool_rate_input filter_search_box' name='rate_origin' placeholder='输入数额' /></div><div class='price_tool_rate_div'><select class='price_tool_rate_chose' name='currency_result' style='cursor: default;' disabled><option value='CNY' selected>人民币</option></select><input type='text' min='0' class='price_tool_rate_input filter_search_box' name='rate_result' placeholder='输入数额' /></div></form><div style='margin-top: 0.3rem;'><span class='pagebtn price_tool_pagebtn' onclick='document.getElementById(\"searchResults_btn_prev\").click()'>&lt;</span><span class='price_tool_input_btn_toggle' data-status='false'><b>切换为买家</b></span><span class='pagebtn price_tool_pagebtn' onclick='document.getElementById(\"searchResults_btn_next\").click()'>&gt;</span></div></div>";

    document.getElementById("BG_bottom").insertAdjacentHTML("beforeEnd", demo_price_tool);
    var rateChose = GM_getValue("rate_chose");
    if (rateChose) {
        document.getElementsByClassName("price_tool_rate_chose")[0].value = rateChose;
    }

    $(".price_tool_rate_input").keyup(function () {
        let form = $("#price_tool_rate_form")[0];
        let targ = form.currency_origin;
        this.value = formatPrice(this.value);
        if (this.name == "rate_origin") {
            form.rate_result.value = currencyExchange(this.value, targ.value, "CNY");
        } else {
            form.rate_origin.value = currencyExchange(this.value, "CNY", targ.value);
            $("#real_price").val(form.rate_origin.value).trigger("keyup");
        }
    });

    let buffPrice = getUrlParam("buffPrice");
    if (buffPrice) {
        let rmb = $(".price_tool_rate_input")[1];
        $(rmb).val(buffPrice).trigger("keyup");
    }
    $(".price_tool_rate_chose").change(function () {
        GM_setValue("rate_chose", this.value);
        $(this.siblings()[0]).trigger("keyup");
    });

    var input_btn = document.getElementsByClassName("price_tool_input_btn");
    var checkbox = document.getElementsByClassName("price_tool_checkbox");
    for (let i = 0; i < input_btn.length - 2; i++) {
        input_btn[i].onclick = function () {
            let checkArr = [];
            for (let j = 0; j < checkbox.length; j++) {
                if (checkbox[j].checked) {
                    checkArr.push(1);
                }
            }
            let checked = checkbox[i].checked;
            if (checked) {
                input_btn[i].style.backgroundColor = "#eaeaea33"
            } else {
                if (checkArr.length > 1) {
                    return;
                }
                input_btn[i].style.backgroundColor = "#00000099"
            }
            checkbox[i].checked = !checked;
        }
    }

    var toggle_btn = document.getElementsByClassName("price_tool_input_btn_toggle")[0];

    input_btn[3].onclick = function () {
        let checkArr = [];
        for (let j = 0; j < checkbox.length; j++) {
            if (checkbox[j].checked) {
                checkArr.push(1);
            }
        }
        let checked = checkbox[2].checked;
        if (checked) {
            input_btn[3].style.backgroundColor = "#eaeaea33"
        } else {
            if (checkArr.length > 1) {
                return;
            }
            input_btn[3].style.backgroundColor = "#00000099"
        }
        checkbox[2].checked = !checked;
        if (toggle_btn.dataset.status == "false") {
            input_btn[2].style.backgroundColor = input_btn[3].style.backgroundColor;
        }
    }

    input_btn[2].onclick = function () {
        input_btn[3].click();
    }

    var real_price = document.getElementById("real_price");
    var scale = document.getElementById("scale");

    // var saved_scale = GM_getValue("price_tool_scale");
    // if (saved_scale != null) {
    //     scale.value = saved_scale;
    // }
    var money_receive = document.getElementById("money_receive");
    var money_pays = document.getElementById("money_pays");

    var toggle_div = document.getElementsByClassName("price_tool_input_div")[2];

    var tool_targ = document.getElementsByClassName("price_tool_div")[0];

    toggle_btn.onclick = function () {
        if (toggle_btn.dataset.status == "false") {
            this.style.color = "#65C3F7";
            this.innerHTML = "<b>切换为卖家</b>";
            toggle_btn.dataset.status = true;
            money_receive.disabled = true;
            tool_targ.style.backgroundColor = "#95b40699";
            toggle_div.style.opacity = "0.3";
            money_receive.value = "";
            input_btn[2].style.backgroundColor = "#eaeaea33"
        } else {
            this.style.color = "#ACD032";
            this.innerHTML = "<b>切换为买家</b>";
            toggle_btn.dataset.status = false;
            money_receive.disabled = false;
            tool_targ.style.backgroundColor = "#53A3C399";
            toggle_div.style.opacity = "1";
            input_btn[2].style.backgroundColor = input_btn[3].style.backgroundColor;
        }
    }

    real_price.onkeyup = function () {
        let checkArr = [];
        for (let j = 0; j < checkbox.length; j++) {
            checkArr.push(checkbox[j].checked);
        }
        this.value = formatPrice(this.value);
        if (toggle_btn.dataset.status == "false") {
            if (checkArr[1]) {
                if (checkArr[2]) {
                    money_receive.value = "";
                    money_pays.value = "";
                    scale.value = "";
                    return;
                }
                money_receive.value = Math.round(this.value / scale.value * 100) / 100;
                money_pays.value = Math.round(money_receive.value * 115) / 100;
            } else {
                scale.value = Math.round(this.value / money_receive.value * 100) / 100;
            }
        } else {
            if (checkArr[1]) {
                if (checkArr[2]) {
                    scale.value = "";
                    money_pays.value = "";
                    return;
                }
                money_pays.value = Math.round(this.value / scale.value * 100) / 100;
            } else {
                scale.value = Math.round(this.value / money_pays.value * 100) / 100;
            }
        }
    }

    scale.onkeyup = function () {
        // GM_setValue("price_tool_scale", this.value);
        let checkArr = [];
        for (let j = 0; j < checkbox.length; j++) {
            checkArr.push(checkbox[j].checked);
        }

        if (toggle_btn.dataset.status == "false") {
            if (checkArr[0]) {
                if (checkArr[2]) {
                    money_receive.value = "";
                    money_pays.value = "";
                    real_price.value = "";
                    return;
                }
                money_receive.value = Math.round(real_price.value / this.value * 100) / 100;
                money_pays.value = Math.round(money_receive.value * 115) / 100;
            } else {
                real_price.value = Math.round(money_receive.value * this.value * 100) / 100;
                if (checkArr[2]) {
                    return;
                }
                real_price.value = "";
                money_receive.value = "";
                money_pays.value = "";
            }
        } else {
            if (checkArr[0]) {
                if (checkArr[2]) {
                    money_pays.value = "";
                    real_price.value = "";
                    return;
                }
                money_pays.value = Math.round(real_price.value / this.value * 100) / 100;
            } else {
                if (checkArr[2]) {
                    real_price.value = Math.round(money_pays.value * this.value * 100) / 100;
                    return;
                }
                real_price.value = "";
                money_pays.value = "";
            }
        }

    }

    money_receive.onkeyup = function () {
        let checkArr = [];
        for (let j = 0; j < checkbox.length; j++) {
            checkArr.push(checkbox[j].checked);
        }
        this.value = formatPrice(this.value);
        if (toggle_btn.dataset.status == "false") {
            money_pays.value = Math.round(this.value * 115) / 100;
            if (checkArr[1]) {
                if (checkArr[0]) {
                    real_price.value = "";
                    scale.value = "";
                    return;
                }
                real_price.value = Math.round(this.value * scale.value * 100) / 100;
            } else {
                if (checkArr[0]) {
                    scale.value = Math.round(real_price.value / this.value * 100) / 100;
                    return;
                }
                real_price.value = "";
                scale.value = "";
            }
        }
    }

    money_pays.onkeyup = function () {
        let checkArr = [];
        for (let j = 0; j < checkbox.length; j++) {
            checkArr.push(checkbox[j].checked);
        }
        this.value = formatPrice(this.value);
        if (toggle_btn.dataset.status == "false") {
            money_receive.value = (Math.round(this.value / 0.0115) + 1) / 100;
            if (checkArr[1]) {
                if (checkArr[0]) {
                    real_price.value = "";
                    scale.value = "";
                    return;
                }
                real_price.value = Math.round(money_receive.value * scale.value * 100) / 100;
            } else {
                if (checkArr[0]) {
                    scale.value = Math.round(real_price.value / money_receive.value * 100) / 100;
                    return;
                }
                real_price.value = "";
                scale.value = "";
            }
        } else {
            if (checkArr[1]) {
                if (checkArr[0]) {
                    real_price.value = "";
                    scale.value = "";
                    return;
                }
                real_price.value = Math.round(this.value * scale.value * 100) / 100;
            } else {
                if (checkArr[0]) {
                    scale.value = Math.round(real_price.value / this.value * 100) / 100;
                    return;
                }
                real_price.value = "";
                scale.value = "";
            }
        }
    }

})();