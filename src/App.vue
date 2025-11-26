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
      const hideList = [
        '/login',
        '/register',
        '/findpassword',
        '/reset',
        '/change-password'
      ]

      if (hideList.includes(path)) return false
      return true
    }
  }
}
</script>
