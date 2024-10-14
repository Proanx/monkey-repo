<script>
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    let liveList = [];
    let liveCount = 0;
    let listBody = undefined;
    let lasttime = Date.now();
    // let isWatch = false;
    let needUpdate = false;
    let timeout = null;

    onMount(() => {
        // let panel = document.querySelector(".boost.bili-dyn-live-users");
        // if (panel) {
        //     // 防止鼠标放在上面看的时候不刷新
        //     let timeout = undefined;
        //     panel.addEventListener("onmousemove", (e) => {
        //         console.log("定住");
        //         isWatch = true;
        //         clearTimeout(timeout);
        //         timeout = setTimeout(() => {
        //             console.log("超时取消定住");
        //             isWatch = false;
        //         }, 15000);
        //     });
        //     panel.addEventListener("mouseleave", () => {
        //         console.log("取消定住");
        //         clearTimeout(timeout);
        //         isWatch = false;
        //     });
        // }
        window.addEventListener("focus", function () {
            let start = Date.now();
            this.clearTimeout(timeout);
            timeout = this.setTimeout(() => {
                if (needUpdate) {
                    needUpdate = false;
                    main();
                }
            }, 750);
        });

        refreshLiveList();
        setInterval(() => {
            // 有刷新任务的情况下，定时任务挂起
            // 这样页面上不会因为定时任务恰好触发导致触发时机不理想
            if (!needUpdate) {
                main();
            }
        }, 10000);
    });

    function main() {
        if (Date.now() - lasttime > 120000) {
            if (document.hasFocus()) {
                refreshLiveList();
            } else {
                needUpdate = true;
            }
        }
    }

    async function refreshLiveList() {
        lasttime = Date.now();
        // "//api.bilibili.com/x/polymer/web-dynamic/v1/portal",
        // "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100",
        // let res = await fetch(`//api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/GetWebList?_=${Date.now()}`, {
        let res = await fetch(`//api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/GetWebList?hit_ab=true&_=${Date.now()}`, {
            credentials: "include",
        });
        let json = await res.json();
        if (!json.data.rooms) {
            return; // 排除返回0的情况
        }
        listBody.scrollTo({ top: 0, behavior: "smooth" });
        liveList = json.data.rooms || [];
        let count = json.data.count ? json.data.count : json.data.rooms.length;
        animateNumber(count, 300);
    }

    function animateNumber(target, duration) {
        // const start = 0;
        const startTime = performance.now(); // 动画开始时间
        // const endTime = startTime + duration; // 动画结束时间

        function updateNumber(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1); // 动画进度0到1
            const easedProgress = progress * (2 - progress); // 计算缓动

            const currentNumber = Math.floor(easedProgress * target); // 根据缓动进度计算当前值

            liveCount = currentNumber;

            if (elapsedTime < duration) {
                requestAnimationFrame(updateNumber);
            }
        }

        requestAnimationFrame(updateNumber);
    }
</script>

<div class="bili-dyn-live-users boost">
    <div class="bili-dyn-live-users__header">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="bili-dyn-live-users__title" on:click={refreshLiveList}>
            正在直播
            <span>{liveCount}</span>
        </div>
        <a class="bili-dyn-live-users__more" target="_blank" href="//link.bilibili.com/p/center/index#/user-center/follow/1">更多</a>
    </div>
    <div class="bili-dyn-live-users__body" bind:this={listBody}>
        {#each liveList as item (item.uid)}
            <a transition:slide|local class="bili-dyn-live-users__item" target="_blank" href="//live.bilibili.com/{item.room_id}">
                <div class="bili-dyn-live-users__item__left">
                    <div class="bili-dyn-live-users__item__face-container">
                        <div class="bili-dyn-live-users__item__face">
                            <div class="bili-awesome-img" style="background-image:url({item.face}@128w_128h.webp)" />
                        </div>
                    </div>
                </div>
                <div class="bili-dyn-live-users__item__right">
                    <div class="bili-dyn-live-users__item__uname bili-ellipsis">
                        {item.uname}
                    </div>
                    <div class="bili-dyn-live-users__item__title bili-ellipsis">
                        {item.title}
                    </div>
                </div>
            </a>
        {/each}
    </div>
</div>

<style>
    .bili-dyn-live-users__title {
        cursor: pointer;
    }
    .bili-awesome-img {
        width: 100%;
        height: 100%;
        background-size: contain;
    }
    .bili-dyn-live-users__item {
        padding-left: 1px;
    }
    .bili-dyn-live-users__item:hover .bili-dyn-live-users__item__uname,
    .bili-dyn-live-users__item:hover .bili-dyn-live-users__item__title {
        color: var(--brand_blue);
    }
    /* .bili-dyn-live-users__item__face-container {
        cursor: alias;
    } */
    .bili-dyn-live-users__body {
        max-height: 60vh;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
    }
    .bili-dyn-live-users__body::-webkit-scrollbar {
        width: 4px;
    }
    .bili-dyn-live-users__body:hover::-webkit-scrollbar-thumb {
        background-color: #ddd;
        border-radius: 2px;
    }
</style>
