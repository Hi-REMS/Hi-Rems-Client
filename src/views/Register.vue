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
            지속가능한 에너지<br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">재생에너지 발전 상태를 한 곳에서 확인하세요.</p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="regTitle">
          <header class="cardc-hd">
            <h2 id="regTitle" style="color: #2d2d2d">회원가입</h2>
            <p class="sub">새 계정을 만들어 대시보드를 이용해 보세요.</p>
          </header>

          <form class="cardc-form" @submit.prevent="onSubmit" novalidate>
            <div class="field">
              <label for="username">아이디(이메일)</label>
              <div
                class="pill"
                :class="{ error: usernameTouched && !usernameValid }"
              >
                <input
                  style="font-size: 14px"
                  id="username"
                  v-model.trim="username"
                  type="email"
                  inputmode="email"
                  autocomplete="username"
                  placeholder="이메일을 입력하세요."
                  required
                  @blur="usernameTouched = true"
                  @keydown.space.prevent
                />
              </div>
              <ul
                v-if="usernameTouched && usernameErrors.length"
                class="pw-errors compact"
              >
                <li v-for="(err, i) in usernameErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <div class="field">
              <label for="worker">담당자(이름)</label>
              <div
                class="pill"
                :class="{ error: workerTouched && !workerValid }"
              >
                <input
                  style="font-size: 14px"
                  id="worker"
                  v-model.trim="worker"
                  type="text"
                  autocomplete="name"
                  placeholder="홍길동"
                  required
                  @blur="workerTouched = true"
                />
              </div>
              <p v-if="workerTouched && !workerValid" class="pw-error-text">
                담당자 성함을 한글로 입력해 주세요. (2자 이상)
              </p>
            </div>

            <div class="field">
              <label for="phoneNumber">전화번호</label>
              <div class="pill" :class="{ error: phoneTouched && !phoneValid }">
                <input
                  style="font-size: 14px"
                  id="phoneNumber"
                  v-model.trim="phoneNumber"
                  type="tel"
                  autocomplete="tel"
                  placeholder="010-1234-5678"
                  maxlength="13" 
                  required
                  @blur="phoneTouched = true"
                />
              </div>
              <p v-if="phoneTouched && !phoneValid" class="pw-error-text">
                올바른 전화번호 형식이 아닙니다. (010-0000-0000)
              </p>
            </div>

            <div class="field">
              <label for="password">비밀번호</label>
              <div
                class="pill"
                :class="{ error: passwordTouched && !passwordValid }"
              >
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  autocomplete="new-password"
                  placeholder="********"
                  required
                  @keyup="checkCaps"
                  @blur="passwordTouched = true"
                />
                <button
                  type="button"
                  class="pill-action"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? "숨김" : "표시" }}
                </button>
              </div>

              <div class="pw-strength slim" aria-hidden="true">
                <div
                  class="bar"
                  :style="{ width: strengthPercent + '%' }"
                ></div>
              </div>
              <ul
                v-if="passwordTouched && passwordErrors.length"
                class="pw-errors compact"
              >
                <li v-for="(err, i) in passwordErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <div class="field">
              <label for="confirm">비밀번호 확인</label>
              <div
                class="pill"
                :class="{ error: confirmTouched && !confirmValid }"
              >
                <input
                  style="font-size: 14px"
                  id="confirm"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="confirm"
                  autocomplete="new-password"
                  placeholder="비밀번호 재입력"
                  required
                  @blur="confirmTouched = true"
                />
              </div>
              <p v-if="confirmTouched && !confirmValid" class="pw-error-text">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>

            <button class="btn-teal" :disabled="loading || !canSubmit">
              <span v-if="!loading">회원가입</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <p class="foot mt8">
              이미 계정이 있으신가요?
              <router-link to="/login">로그인</router-link>
            </p>
          </form>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from "@/api";
import "@/assets/css/register.css";

export default {
  name: "Register",
  data() {
    return {
      username: "",
      usernameTouched: false,
      worker: "",
      workerTouched: false,
      phoneNumber: "",
      phoneTouched: false,
      password: "",
      passwordTouched: false,
      confirm: "",
      confirmTouched: false,
      showPassword: false,
      capsOn: false,
      loading: false,
    };
  },
  watch: {
    // 전화번호 입력 시 숫자만 추출 후 하이픈 자동 삽입
    phoneNumber(val) {
      const nums = val.replace(/[^0-9]/g, "");
      let formatted = "";
      
      if (nums.length <= 3) {
        formatted = nums;
      } else if (nums.length <= 7) {
        formatted = nums.replace(/(\d{3})(\d{1,4})/, "$1-$2");
      } else {
        formatted = nums.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3");
      }
      this.phoneNumber = formatted;
    }
  },
  computed: {
    usernameValid() {
      const v = this.username;
      return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    },
    usernameErrors() {
      const e = [];
      if (!this.username) e.push("이메일을 입력해 주세요.");
      else if (!this.usernameValid) e.push("올바른 이메일 형식이 아닙니다.");
      return e;
    },
    workerValid() {
      const korRegex = /^[가-힣]+$/;
      return !!this.worker && this.worker.length >= 2 && korRegex.test(this.worker);
    },
    phoneValid() {
      const n = this.phoneNumber.replace(/[^0-9]/g, "");
      return /^010\d{7,8}$/.test(n);
    },
    strengthPercent() {
      let s = 0;
      if (this.password.length >= 8) s += 25;
      if (/[A-Z]/.test(this.password)) s += 25;
      if (/[0-9]/.test(this.password)) s += 25;
      if (/[^A-Za-z0-9]/.test(this.password)) s += 25;
      return s;
    },
    passwordErrors() {
      const e = [];
      const pw = this.password;
      if (!pw || pw.length < 8) e.push("8자 이상이어야 합니다.");
      if (!/[A-Z]/.test(pw)) e.push("대문자(A-Z)를 포함하세요.");
      if (!/[a-z]/.test(pw)) e.push("소문자(a-z)를 포함하세요.");
      if (!/[0-9]/.test(pw)) e.push("숫자(0-9)를 포함하세요.");
      if (!/[^A-Za-z0-9]/.test(pw)) e.push("특수문자를 포함하세요.");
      if (/\s/.test(pw)) e.push("공백 문자는 사용할 수 없습니다.");
      if (
        this.username &&
        pw.toLowerCase().includes(this.username.toLowerCase())
      )
        e.push("비밀번호에 아이디(이메일)를 포함할 수 없습니다.");
      return e;
    },
    passwordValid() {
      return this.passwordErrors.length === 0;
    },
    confirmValid() {
      return !!this.password && this.password === this.confirm;
    },
    canSubmit() {
      return (
        this.usernameValid &&
        this.workerValid &&
        this.phoneValid &&
        this.passwordValid &&
        this.confirmValid
      );
    },
  },
  methods: {
    checkCaps(e) {
      this.capsOn = e.getModifierState && e.getModifierState("CapsLock");
    },
    async onSubmit() {
      if (this.loading || !this.canSubmit) return;
      try {
        this.loading = true;
        await api.post("/auth/register", {
          username: this.username,
          password: this.password,
          worker: this.worker,
          phoneNumber: this.phoneNumber,
        });
        alert("회원가입에 성공하셨습니다!");
        this.$router.replace("/login");
      } catch (err) {
        let msg = "일시적인 오류로 가입에 실패했습니다. 잠시 후 다시 시도해주세요.";
        if (err?.response?.status === 409) {
          msg = "이미 가입된 이메일 주소입니다.";
        } else if (err?.response?.data?.message) {
          msg = err.response.data.message;
        }
        alert(msg);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>