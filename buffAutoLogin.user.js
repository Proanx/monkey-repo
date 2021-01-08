// ==UserScript==
// @name         buff自动登录
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://buff.163.com/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	if($(".login-user.j_drop-handler").length==0){
		loginModule.steamLogin();
		//window.open("/account/login/steam?back_url=/account/steam_bind/finish", "_blank", "width=1,height=1");
	}

})();