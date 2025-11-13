<template>
  <div id="app">
    <AppHeader v-if="!$route.meta.hideHeader" />
    <router-view />
  </div>
</template>

<script>
import AppHeader from '@/components/Header.vue'

export default {
  name: 'App',
  components: { AppHeader }
}
</script>

import AppHeader from '@/components/Header.vue'

export default {
  name: 'App',
  components: { AppHeader },

  computed: {
    showHeader() {
      const path = this.$route.path

      // 로그인 관련 화면에서는 무조건 헤더 숨김
      const hideList = [
        '/login',
        '/register',
        '/findpassword',
        '/reset',
        '/change-password'
      ]

      if (hideList.includes(path)) return false

      // 나머지는 전부 헤더 표시
      return true
    }
  }
}
</script>
