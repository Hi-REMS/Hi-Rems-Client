<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <div class="art-pad" aria-hidden="true"></div>

      <section class="auth-panel">
        <img
          src="@/assets/haeinlogo-main.png"
          alt="Hi-REMS 로고"
          class="auth-logo"
        />
        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">
            지속가능한 에너지 <br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">재생에너지 발전 상태를 한 곳에서 확인하세요.</p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="loginTitle">
          <header class="cardc-hd">
            <h2 id="loginTitle" style="color: #2d2d2d">로그인</h2>
            <p class="sub">계정으로 대시보드에 접속하세요.</p>
          </header>

          <form class="cardc-form" @submit.prevent="login">
            <div class="field">
              <label for="username">아이디</label>
              <div class="pill">
                <input
                  style="font-size: 14.5px"
                  id="username"
                  v-model.trim="username"
                  type="text"
                  autocomplete="username"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div class="field">
              <label for="password">비밀번호</label>
              <div class="pill">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  autocomplete="current-password"
                  placeholder="********"
                  @keyup="checkCaps"
                  @keydown.space.prevent
                />
                <button
                  type="button"
                  class="pill-action"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? "숨김" : "표시" }}
                </button>
              </div>
              <p v-if="capsOn" class="pw-error-text">
                Caps Lock이 켜져 있습니다.
              </p>
            </div>

            <button class="btn-teal" :disabled="loading">
              <span v-if="!loading">로그인</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <div class="auth-actions">
              <div class="act-row">
                <span class="act-label">회원가입이 필요하신가요?</span>
                <a
                  href="#"
                  class="auth-link strong"
                  @click.prevent="goToRegister"
                  >회원가입</a
                >
              </div>

              <div class="act-row">
                <span class="act-label">비밀번호를 잊으셨나요?</span>
                <router-link to="/findpassword" class="auth-link"
                  >비밀번호 찾기</router-link
                >
              </div>
            </div>
          </form>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from "@/api";
import "@/assets/css/login.css";

function isAdminUser(u) {
  return u?.is_admin === true;
}

export default {
  name: "Login",
  data() {
    return {
      username: "",
      password: "",
      showPassword: false,
      capsOn: false,
      loading: false,
      error: "",
    };
  },
  created() {
    const keysToRemove = [
      "isAdmin", "username", "worker", "phoneNumber", 
      "email", "defaultImei"
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
  methods: {
    goToRegister() {
      localStorage.clear();
      sessionStorage.clear();
      this.$router.push("/register");
    },
    checkCaps(e) {
      this.capsOn = e.getModifierState && e.getModifierState("CapsLock");
    },

    async login() {
      if (!this.username) {
        alert("아이디를 입력해 주세요.");
        return;
      }
      if (!this.password) {
        alert("비밀번호를 입력해 주세요.");
        return;
      }

      if (this.loading) return;

      try {
        this.loading = true;
        this.error = "";

        const { data: loginRes } = await api.post("/auth/login", {
          username: this.username,
          password: this.password,
        });
        
        const loginUser = loginRes?.user || {};

        const admin = isAdminUser(loginUser);

        try {
          localStorage.setItem("isAdmin", String(!!admin));
          localStorage.setItem("username", loginUser.username || "");
          localStorage.setItem("worker", loginUser.worker || "");
          localStorage.setItem("phoneNumber", loginUser.phoneNumber || "");
          
          localStorage.setItem("email", loginUser.username || "");
        } catch (e) {
          console.error("Storage error:", e);
        }

        if (admin) {
          this.$router.replace("/home");
          return;
        }

        let defaultImei = "";
        try {
          const { data: imeiRes } = await api.get("/user/imeis");
          defaultImei = imeiRes?.defaultImei || "";
          
          if (defaultImei) {
            localStorage.setItem("defaultImei", defaultImei);
          } else {
            localStorage.removeItem("defaultImei");
          }
        } catch (e) {
          console.warn("IMEI 조회 실패 (신규 사용자 가능성):", e);
        }

        const raw = this.$route.query.redirect;
        let to = raw ? decodeURIComponent(String(raw)) : "";

        const BLOCKED = ["/login", "/register", "/reset", "/forgot", "/findpassword"];
        const isUnsafe = !to || !to.startsWith("/") || BLOCKED.some((p) => to.startsWith(p));

        if (!isUnsafe) {
          this.$router.replace(to);
        } else if (defaultImei) {
          this.$router.replace(`/analysis/timeseries?imei=${encodeURIComponent(defaultImei)}`);
        } else {
          this.$router.replace("/analysis/timeseries");
        }

      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "로그인 실패";

        if (msg.toLowerCase().includes("credentials") || msg.toLowerCase().includes("invalid")) {
          alert("아이디 또는 비밀번호가 올바르지 않습니다.");
        } else {
          alert(`로그인 실패: ${msg}`);
        }
        this.error = msg;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>