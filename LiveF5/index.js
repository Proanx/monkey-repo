import Livef5 from './src/Livef5.svelte';
require("./src/css/main.css");

let deadLine = Date.now() + 5000;

(function init() {
    if (!document.cookie.match(/bili_jct=(\w*); /)) { return; }

    let dom = document.querySelector("aside.left");
    if (dom) {
        
        let temp = document.createElement("section");
        temp.className = "sticky";
        temp.id = "live-f5";
        dom.append(temp);

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