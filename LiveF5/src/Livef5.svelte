<script>
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    let liveList = [];
    let liveCount = 0;
    let listBody = undefined;

    onMount(() => {
        refreshLiveList();
        setInterval(refreshLiveList, 30000);
    });

    async function refreshLiveList() {
        let res = await fetch(
            "//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100",
            { credentials: "include" }
        );
        let json = await res.json();
        if (!json.data.items) {
            return;     // 排除返回0的情况
        }
        listBody.scrollTop = 0;
        liveCount = json.data.count;
        liveList = json.data.items || [];
    }
</script>

<div class="bili-dyn-live-users boost">
    <div class="bili-dyn-live-users__header">
        <div class="bili-dyn-live-users__title">
            正在直播
            <span>（{liveCount}）</span>
        </div>
        <a
            class="bili-dyn-live-users__more"
            target="_blank"
            href="//link.bilibili.com/p/center/index#/user-center/follow/1"
            >更多</a
        >
    </div>
    <div class="bili-dyn-live-users__body" bind:this={listBody}>
        {#each liveList as item (item.uid)}
            <a
                transition:slide|local
                class="bili-dyn-live-users__item"
                target="_blank"
                href="https://space.bilibili.com/{item.uid}/"
            >
                <div class="bili-dyn-live-users__item__left">
                    <div class="bili-dyn-live-users__item__face-container">
                        <div class="bili-dyn-live-users__item__face">
                            <div
                                class="bili-awesome-img"
                                style="background-image:url({item.face}@50w_50h.webp)"
                            />
                        </div>
                    </div>
                </div>
                <a
                    class="bili-dyn-live-users__item__right"
                    target="_blank"
                    href={item.link}
                    on:click.stopPropagation
                >
                    <div class="bili-dyn-live-users__item__uname bili-ellipsis">
                        {item.uname}
                    </div>
                    <div class="bili-dyn-live-users__item__title bili-ellipsis">
                        {item.title}
                    </div>
                </a>
            </a>
        {/each}
    </div>
</div>

<style>
    .bili-dyn-live-users__item {
        padding-left: 1px;
    }
    .bili-dyn-live-users__item:hover .bili-dyn-live-users__item__uname,
    .bili-dyn-live-users__item:hover .bili-dyn-live-users__item__title {
        color: var(--brand_blue);
    }
    .bili-dyn-live-users__item__face-container {
        cursor: alias;
    }
    .bili-dyn-live-users__body {
        max-height: 50vh;
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
