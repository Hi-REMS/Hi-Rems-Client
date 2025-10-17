<template>
  <div id="app">
    <!-- meta.showHeader가 false가 아니면 헤더 표시 (기본값: 표시) -->
      <Header v-if="!$route.meta.hideHeader" />

    <router-view />
  </div>
</template>

<script>
import AppHeader from '@/components/Header.vue'

export default {
  name: 'App',
  components: { AppHeader },
  computed: {
    showHeader () {
      // 중첩 라우트까지 고려: 어떤 매치라도 showHeader === false면 숨김
      const m = this.$route.matched
      if (!m.length) return true
      if (m.some(r => r.meta && r.meta.showHeader === false)) return false
      const explicit = m.find(r => r.meta && typeof r.meta.showHeader === 'boolean')
      return explicit ? explicit.meta.showHeader : true
    }
  }
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; padding: 0; }
*, *::before, *::after { box-sizing: border-box; }
</style>
