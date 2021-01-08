// ==UserScript==
// @name         删除知乎文章板块
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.zhihu.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function deleteArticle(){
        var article = document.getElementsByClassName("ArticleItem");
        for(let i=0;i<article.length;i++){
            article[i].remove();
        }
        setTimeout(deleteArticle,1000);
    }

    deleteArticle();

    // Your code here...
})();