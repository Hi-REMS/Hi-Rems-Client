<template>
  <div id="app">
    <!-- ✅ 컴포넌트 이름 맞추고, 계산된 showHeader를 사용 -->
    <AppHeader v-if="showHeader" />
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
      // 중첩 라우트까지 고려: 하나라도 hideHeader === true면 숨김
      const m = this.$route.matched
      if (!m.length) return true
      if (m.some(r => r.meta && r.meta.hideHeader === true)) return false
      // (선택) showHeader를 명시한 경우 우선
      const explicit = m.find(r => r.meta && typeof r.meta.showHeader === 'boolean')
      return explicit ? explicit.meta.showHeader : true
    }
  }
}
</script>