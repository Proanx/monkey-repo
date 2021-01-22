// ==UserScript==
// @name         网易BUFF市场插件---CSGO版
// @namespace    http://pronax.wtf/
// @version      2021-1-6 17:31:47
// @description  try to take over the world! --Written by Pronax
// @copyright    2020, Pronax
// @author       Pronax
// @license      MIT
// @match        https://buff.163.com/market/goods*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const en_list = Array("Type |Gloves", "Type |Machineguns", "Type |Shotguns", "Type |SMGs", "Type |Rifles", "Type |Pistols", "Type |Knives");
    const zh_list = Array("类型 |手套", "类型 |机枪", "类型 |霰弹枪", "类型 |微型冲锋枪", "类型 |步枪", "类型 |手枪", "类型 |匕首");

    GM_addStyle(".list_tb_csgo .pic-cont{width:112px;height:84px}.list_tb_csgo .pic-cont img{height:-webkit-fill-available;max-height:max-content;}.csgo_sticker.has_wear .stickers{width:auto;height:2.2rem}.csgo_sticker{float:right;margin-right:1rem}");

    // 添加下一页标签
    $(".floatbar>ul").prepend("<li><a id='buff_tool_nextpage'><i class='icon icon_comment_arr' style='transform: rotate(90deg); width: 1.125rem; height: 1.125rem; left: 0.25rem; position: relative;'></i><p style='color:#fff;'>下一页</p></a></li>");
    // 设定下一页按钮的点击事件
    $("#buff_tool_nextpage").click(function () {
        $(".page-link.next").click();
    }).parent().css("cursor", "pointer");

    window.buff_csgo_buff_plugin_load = function (abx) {
        // 检测商品是否加载完成
        if ($("#market-selling-list").length == 0) {
            setTimeout(buff_csgo_buff_plugin_load, 100);
            return;
        }
        // 防止插件重复加载
        if ($("#market-selling-list").hasClass("buffed")) { return; }
        // 排除不支持的商品类型
        let goods_type = $(".detail-cont>p>span")[2].innerText;
        let isEn = $("#j_lang-switcher").data("current") === "en";
        let type_list = isEn ? en_list : zh_list;
        if (type_list.indexOf(goods_type) < 0) {
            return;
        }
        // 整体CSS
        $(".list_tb_csgo>tr>th.t_Left").css("padding-left", "20px");
        $(".list_tb_csgo>tr>th.t_Left")[0].style.width = "500px";
        $(".list_tb_csgo>tr>th.t_Left")[1].style.width = "140px";
        $(".list_tb_csgo>tr>th.t_Left")[2].style.width = "180px";
        // 给检视按钮去掉点击属性，防止产生图片无法关闭的bug
        $(".csgo_inspect_img_btn").attr("disabled", true).css({
            "pointer-events": "none"
        });
        // 给饰品图片加入点击属性用于检视
        $(".pic-cont.item-detail-img").click(function () {
            this.children[1].click();
        }).mouseenter(function () {
            $(this).css("background", $(this.children[1]).css("background"));
        }).mouseleave(function () {
            $(this).css("background", "");
        }).css("cursor", "pointer");
        // 拿到每个饰品对应的dom
        let skin_list = $(".list_tb_csgo").find("[id^='sell_order_']");
        for (let i = 0; i < skin_list.length; i++) {
            let mom = skin_list[i];
            // 拿到每个饰品的图片对象
            let skin = $(mom).find(".item-detail-img")[0];
            // 判断饰品是否属于CSGO区
            if ($(skin).data("appid") != 730) {
                return;
            }
            // 获取饰品对应的信息并加载进data
            let classid = $(skin).data("classid");
            let instanceid = $(skin).data("instanceid");
            let steamid = $(skin).data("steamid");
            let appid = $(skin).data("appid");
            let sell_order_id = $(skin).data("orderid");
            let origin = $(skin).data("origin");
            let hide_refresh_sticker = $(skin).hasClass("hide-refresh-sticker");
            let assetid = $(skin).data("assetid");
            let data = {
                appid: appid,
                game: "csgo",
                classid: classid,
                instanceid: instanceid,
                sell_order_id: sell_order_id,
                origin: origin,
                assetid: assetid
            };
            // 发送异步请求获取饰品详情
            $.ajax({
                url: "/market/item_detail",
                method: "get",
                data: data,
                success: function (data) {
                    let result = $(data)[0];
                    // 获取名称标签对象
                    let name = $(result).find("p.name_tag")[0];
                    if (name) {
                        // 设定名称标签的样式
                        $(name).css({
                            "background": "#fff",
                            "padding": "0 3px 3px",
                            "margin-bottom": "0.2rem"
                        });
                        // 获取待添加名称标签的对象并添加名称标签
                        let targ_name = $(mom).find(".progress")[0];
                        $(targ_name).after($(name));
                    }
                    // 获取待添加种子的dom对象
                    let targ_seed = $(mom).find(".wear-value")[0];
                    // 获取对应的种子
                    let seed = "<div class='wear-value'>图案模板(seed):<i style='color:crimson'>" + $(result).find(".skin-info>p")[0].innerText.trim().split(" ")[2] + "</i></div>";
                    $(targ_seed).before($(seed));
                    // 截取皮肤磨损并加粗
                    let float = targ_seed.innerText.split(" ");
                    targ_seed.innerHTML = float[0] + " <b>" + float[1] + "</b>";
                    // 获取排名对象
                    let rank = $(result).find(".skin-info>.des")[0];
                    if (rank) {
                        $(targ_seed).html(targ_seed.innerHTML + "<i style='color:green'>（#" + rank.innerText.split(" ")[isEn ? 3 : 1] + "）</i>");
                    }
                    /*                     // 获取贴纸对象，无贴纸则直接返回
                    let sticker = $(result).find(".sticker-name>div>div>span");
                    if (sticker.length <= 0) {
                        return;
                    }
                    // 获取待添加磨损的贴纸对象
                    let targ_sticker = $(mom).find(".csgo_sticker>.stickers");
                    // 遍历插入磨损
                    for (let i = 0; i < sticker.length; i++) {
                        $(targ_sticker[i]).append($("<div class='wear-value'>" + sticker[i].innerText.split(" ")[1] + "</div>"));
                    } */
                },
                error: function (msg) {
                    console.log("error");
                }
            });
        }
        $("#market-selling-list").addClass("buffed");
    };

    buff_csgo_buff_plugin_load();
    setTimeout(function () {
        $(document).ajaxSuccess(function (event, status, header, result) {
            if (header.url.slice(0, 28) === "/api/market/goods/sell_order") {
                buff_csgo_buff_plugin_load();
            }
        });
    }, 3000);

})();
