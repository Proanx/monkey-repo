// ==UserScript==
// @name            网易BUFF市场CSGO板块增强
// @namespace       https://greasyfork.org/zh-CN/users/412840-newell-gabe-l
// @version         1.4.4
// @note            更新于2021年3月24日12:35:57
// @description     非CSGO板块可能会因为样式原因报错，不影响使用。问题反馈QQ群544144372
// @supportURL      https://jq.qq.com/?_wv=1027&k=U8mqorxQ
// @copyright       2021, Pronax
// @author          Pronax
// @license         AGPL-3.0
// @match           https://buff.163.com/market/goods*
// @run-at          document-body
// @grant           GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const support_list = Array("rifle", "knife", "pistol", "smg", "machinegun", "shotgun", "hands");

    GM_addStyle(".list_tb_csgo .pic-cont{width:112px;height:84px}.list_tb_csgo .pic-cont img{height:-webkit-fill-available;max-height:max-content;}.csgo_sticker.has_wear .stickers{width:auto;height:2.2rem}.csgo_sticker{float:right;margin-right:1rem}");

    function addNextPageBtn() {
        if ($(".floatbar>ul").length == 0) {
            setTimeout(() => { addNextPageBtn(); }, 100);
            return;
        }
        if ($("#buff_tool_nextpage").length != 0) { return; }
        // 下一页按钮
        $(".floatbar>ul").prepend("<li><a id='buff_tool_nextpage'><i class='icon icon_comment_arr' style='transform: rotate(90deg); width: 1.125rem; height: 1.125rem; left: 0.25rem; position: relative;'></i><p style='color:#fff;'>下一页</p></a></li>");
        $("#buff_tool_nextpage").click(function () {
            $(".page-link.next").click();
            $("#sort_scale").removeClass();
        }).parent().css("cursor", "pointer");
    }

    function getUrlParam(name, url) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        let result;
        if (url) {
            result = url.substr(34).match(reg);  //匹配目标参数
        } else {
            result = window.location.search.substr(1).match(reg);  //匹配目标参数
        }
        if (result != null) return unescape(result[2]); return null; //返回参数值
    }

    addNextPageBtn();

    window.buff_enhancement_csgo = function (data) {
        // 检测商品是否加载完成
        if ($("#market-selling-list").length == 0) {
            setTimeout(buff_enhancement_csgo, 100);
            return;
        }
        if ($("#market-selling-list").hasClass("buffed")) { return; }
        // 排除不支持的商品类型
        let goods_type = data.goods_infos[getUrlParam("goods_id")].tags.category_group.internal_name;
        let isEn = $("#j_lang-switcher").data("current") === "en";
        if (support_list.indexOf(goods_type) < 0) {
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
            if ($(skin).data("appid") != 730) { return; }
            // 获取饰品对应的信息并加载进data
            let classid = $(skin).data("classid");
            let instanceid = $(skin).data("instanceid");
            let sell_order_id = $(skin).data("orderid");
            let origin = $(skin).data("origin");
            let assetid = $(skin).data("assetid");
            let data = {
                appid: 730,
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
                },
                error: function (msg) {
                    console.log("error:", msg);
                }
            });
        }
        $("#market-selling-list").addClass("buffed");
    };

    $(document).ajaxSuccess(function (event, status, header, result) {
        if (header.url.slice(0, 28) === "/api/market/goods/sell_order") {
            buff_enhancement_csgo(result.data);
        }
    });

})();
