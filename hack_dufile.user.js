// ==UserScript==
// @name         破解废物网盘
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://dufile.com/file/794ee67196fa4c7a.html
// @include      *dufile.com/file/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	document.getElementById("slow_button").addEventListener("click",redirectDownPage);

})();