// ==UserScript==
// @name         Steam市场汇率转换小工具
// @namespace    http://pronax.wtf/
// @version      0.1.1
// @description  try to take over the world!
// @author       Pronax
// @include      *://steamcommunity.com/market/listings/*
// @require      https://code.jquery.com/jquery-1.12.4.min.js
// @connect      v6.exchangerate-api.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    function loadingRate(){
        GM_xmlhttpRequest({
            url: "https://v6.exchangerate-api.com/v6/6c4647edadf8a30d48167bab/latest/CNY",
            method: "get",
            onload: function (response) {
                var data = JSON.parse(response.responseText);
                 console.log(data)
                if(data.result=="success"){
                    var exchangeRate=data.conversion_rates.ARS;
                    GM_setValue("current_rate",exchangeRate);
                    GM_setValue("time_next_update_unix",data.time_next_update_unix);
                    return exchangeRate;
                }else{
                    alert(data.error-type);
                }
            }
        });
        return 1;
    }

    function roundToTwo(num,status){
        return status?Math.round((num*100)+0.5)/100:Math.round((num*100))/100;
    }

    var current_rate = GM_getValue("current_rate");
    if(current_rate==null){
        current_rate = loadingRate();
    }else{
        new Date().getTime()-5>GM_getValue("time_next_update_unix")?current_rate = loadingRate():0;
    }

    function addPrice(){
        var originalPriceList = $(".market_listing_price_with_fee");
        for(let i=0;i<originalPriceList.length;i++){
            let originalPrice = originalPriceList[i].innerText.slice(5).replace(".","").replace(",",".");
            let cnyPrice = roundToTwo(originalPrice/current_rate);
            $(originalPriceList[i]).append($("<span class='market_listing_price market_listing_price_with_publisher_fee_only' style='display:block'></span>").text("¥ "+cnyPrice));
        }
    }

    setTimeout(addPrice,2000);

})();