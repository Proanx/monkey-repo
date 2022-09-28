<template>
  <div class="bili-dyn-live-users boost">
    <div class="bili-dyn-live-users__header">
      <div class="bili-dyn-live-users__title">
        正在直播
        <span>{{ liveCount }}</span>
      </div>
      <a class="bili-dyn-live-users__more" target="_blank"
        href="//link.bilibili.com/p/center/index#/user-center/follow/1">更多</a>
    </div>
    <div class="bili-dyn-live-users__body">
      <a class="bili-dyn-live-users__item" target="_blank" v-for="item of liveList" :key="item.uid" :href="item.link">
        <div class="bili-dyn-live-users__item__left">
          <div class="bili-dyn-live-users__item__face-container">
            <div class="bili-dyn-live-users__item__face">
              <div class="bili-awesome-img" :style="{backgroundImage:`url(${item.face}@50w_50h.webp)`}"></div>
            </div>
          </div>
        </div>
        <a class="bili-dyn-live-users__item__right" target="_blank" :href="`https://space.bilibili.com/${item.uid}/`"
            @click.stop>
          <div class="bili-dyn-live-users__item__uname bili-ellipsis">
            {{item.uname}}
          </div>
          <div class="bili-dyn-live-users__item__title bili-ellipsis">
            {{item.title}}
          </div>
        </a>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "LiveF5",
  created() {
    this.refreshLiveList();
    setInterval(this.refreshLiveList, 30000);
  },
  data() {
    return {
      liveCount: 0,
      liveList: []
    }
  },
  methods: {
    async refreshLiveList() {
      let res = await fetch("//api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/w_live_users?size=100", { "credentials": "include" });
      let json = await res.json();
      this.liveCount = json.data.count;
      this.liveList = json.data.items;
    }
  }
}
</script>

<style>
section.sticky>.bili-dyn-live-users:not(.boost) {
  display: none;
}
</style>