import Livef5 from './src/Livef5.svelte';
require("./src/css/main.css");

let deadLine = Date.now() + 5000;

(function init() {
    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    let dom = document.querySelector(".bili-dyn-live-users");
    if (dom) {
        let dom = document.querySelector(".bili-dyn-live-users");
        dom.innerHTML = "";
        dom.className = "live-f5";
        dom.id = "live-f5";

        new Livef5({
            target: document.querySelector("#live-f5")
        });

    } else if (Date.now() < deadLine) {
        requestIdleCallback(function () {
            init();
        }, { timeout: 1000 });
        return;
    }
})();