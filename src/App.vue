<template>
  <div id="app">
    <AppHeader v-if="!$route.meta?.hideHeader" />
    <router-view />
  </div>
</template>

<script>
import AppHeader from '@/components/Header.vue'
import { api } from '@/api'

export default {
  name: 'App',
  components: { AppHeader },

  data() {
    return {
      idleTimer: null,
      IDLE_TIMEOUT_MS: 10 * 60 * 1000,
      sessionCheckTimer: null, 
    }
  },

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
  },

  watch: {
    $route(to) {
      if (to.meta && to.meta.requiresAuth) {
        this.setupIdleListeners();
        this.resetIdleTimer();
      } else {
        this.removeIdleListeners();
        if (this.idleTimer) clearTimeout(this.idleTimer);
      }
    }
  },

  mounted() {
    if (this.$route.meta && this.$route.meta.requiresAuth) {
      this.setupIdleListeners();
      this.resetIdleTimer();
    }

    this.sessionCheckTimer = setInterval(async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token'); 
      if (token) {
        try {
          await api.get('/auth/me'); 
        } catch (error) {
          clearInterval(this.sessionCheckTimer);
        }
      }
    }, 10000);
  },

  beforeUnmount() { 
    this.cleanupTimers();
  },
  beforeDestroy() { 
    this.cleanupTimers();
  },

  methods: {
    cleanupTimers() {
      this.removeIdleListeners();
      if (this.idleTimer) clearTimeout(this.idleTimer);
      if (this.sessionCheckTimer) clearInterval(this.sessionCheckTimer);
    },

    setupIdleListeners() {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach(event => {
        document.addEventListener(event, this.resetIdleTimer, { passive: true });
      });
    },

    removeIdleListeners() {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
      events.forEach(event => {
        document.removeEventListener(event, this.resetIdleTimer);
      });
    },

    resetIdleTimer() {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout();
      }, this.IDLE_TIMEOUT_MS);
    },

    handleIdleTimeout() {
      alert("10분 동안 활동이 없어 보안을 위해 자동으로 로그아웃됩니다.");
      
      api.post('/auth/logout').finally(() => {
        const keysToRemove = [
          'token', 'access_token', 'isAdmin', 'username', 'email', 
          'worker', 'phoneNumber', 'defaultImei'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));

        localStorage.removeItem('rems_dash_swr_v1');
        localStorage.removeItem('rems_map_points_v1');

        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('coord:') || key.startsWith('geo:')) {
            localStorage.removeItem(key);
          }
        });

        if (api.defaults && api.defaults.headers && api.defaults.headers.common) {
          delete api.defaults.headers.common['Authorization'];
        }
        
        sessionStorage.clear();
        this.removeIdleListeners();
        
        if (this.$route.path !== '/login') {
          this.$router.replace('/login');
        }
      });
    }
  }
}
</script>