<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <div class="art-pad"></div>

      <div class="auth-panel">
        <header class="platform-head">
          <h1 class="hero-title">비밀번호 재설정</h1>
          <p class="hero-sub">
            현재 비밀번호를 확인한 후 새 비밀번호를 설정하세요.
          </p>
        </header>

        <main class="auth-card">
          <div class="cardc-hd">
            <h2>보안 업데이트</h2>
            <p class="sub">개인정보 보호를 위해 주기적으로 비밀번호를 변경해주세요.</p>
          </div>

          <form class="cardc-form" @submit.prevent="onSubmit" novalidate>
            <div class="field">
              <label for="current">현재 비밀번호</label>
              <div class="pill" :class="{ error: curTouched && !curValid }">
                <input
                  id="current"
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="current"
                  placeholder="현재 비밀번호 입력"
                  required
                  maxlength="255"
                  @blur="curTouched = true"
                  @keydown.space.prevent
                />
                <button
                  type="button"
                  class="pill-action"
                  @click="showCurrent = !showCurrent"
                >
                  {{ showCurrent ? "숨김" : "표시" }}
                </button>
              </div>
              <p v-if="curTouched && !curValid" class="pw-error-text">
                현재 비밀번호를 입력하세요 (9자 이상).
              </p>
            </div>

            <div class="field">
              <label for="newPw">새 비밀번호</label>
              <div class="pill" :class="{ error: newTouched && !newValid }">
                <input
                  id="newPw"
                  :type="showNew ? 'text' : 'password'"
                  v-model="newPw"
                  placeholder="새 비밀번호 입력 (9자 이상)"
                  required
                  maxlength="255"
                  @blur="newTouched = true"
                  @keydown.space.prevent
                />
                <button
                  type="button"
                  class="pill-action"
                  @click="showNew = !showNew"
                >
                  {{ showNew ? "숨김" : "표시" }}
                </button>
              </div>
              <div class="pw-strength slim" v-if="newPw">
                <div class="bar" :style="{ width: (newValid ? 100 : 40) + '%' }"></div>
              </div>
              <ul v-if="newTouched && newErrors.length" class="pw-errors compact">
                <li v-for="(err, i) in newErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <div class="field">
              <label for="confirmPw">새 비밀번호 확인</label>
              <div class="pill" :class="{ error: confTouched && !confValid }">
                <input
                  id="confirmPw"
                  :type="showNew ? 'text' : 'password'"
                  v-model="confirmPw"
                  placeholder="새 비밀번호 재입력"
                  required
                  maxlength="255"
                  @blur="confTouched = true"
                  @keydown.space.prevent
                />
              </div>
              <p v-if="confTouched && !confValid" class="pw-error-text">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>

            <button class="btn-teal mt8" :disabled="loading || !canSubmit">
              <span v-if="!loading">비밀번호 변경하기</span>
              <span v-else class="spinner"></span>
            </button>

            <p class="foot mt8">
              비밀번호가 기억나지 않으신가요? 
              <a href="#" @click.prevent="onInquiry">고객지원 문의</a>
            </p>
          </form>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from "@/api";
import "@/assets/css/register.css"; 
import "@/assets/css/change-password.css";

export default {
  name: "ChangePassword",
  data() {
    return {
      current: "",
      curTouched: false,
      newPw: "",
      newTouched: false,
      confirmPw: "",
      confTouched: false,
      showCurrent: false,
      showNew: false,
      loading: false,
    };
  },
  computed: {
    curValid() {
      const val = this.current || "";
      return val.trim().length >= 9;
    },
    newErrors() {
      const pw = this.newPw;
      const e = [];
      if (pw.length === 0) {
      e.push("새 비밀번호를 입력해주세요.");
      return e;
    }
      if (!pw || pw.length < 9) e.push("9자 이상이어야 합니다.");
      if (!/[A-Z]/.test(pw)) e.push("대문자(A-Z)를 포함하세요.");
      if (!/[a-z]/.test(pw)) e.push("소문자(a-z)를 포함하세요.");
      if (!/[0-9]/.test(pw)) e.push("숫자(0-9)를 포함하세요.");
      if (!/[^A-Za-z0-9]/.test(pw)) e.push("특수문자를 포함하세요.");
      if (/\s/.test(pw)) e.push("공백 문자는 사용할 수 없습니다.");
      if (this.username && pw.toLowerCase().includes(this.username.toLowerCase()))
        e.push("비밀번호에 아이디(이메일)를 포함할 수 없습니다.");
      return e;
    },
    newValid() {
      return this.newPw.length >= 9 && this.newErrors.length === 0;
    },
    confValid() {
      return this.newPw && this.newPw === this.confirmPw;
    },
    canSubmit() {
      return this.curValid && this.newValid && this.confValid;
    },
  },
  methods: {
    onInquiry() {
      alert("관리자에게 문의해주세요.");
    },
    async onSubmit() {
      if (!this.canSubmit) return;
      this.loading = true;
      try {
        await api.post("/auth/change-password", {
          current_password: this.current,
          new_password: this.newPw,
        });
        alert("비밀번호가 성공적으로 변경되었습니다.");
        this.$router.replace("/analysis/timeseries");
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || "비밀번호 변경 실패";
        alert(msg);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>