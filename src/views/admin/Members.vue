<template>
  <div class="admin-modern">
    <header class="admin-header">
      <div>
        <h1>사용자 관리</h1>
        <p>사용자 계정 권한 및 정보를 관리하는 화면입니다.</p>
      </div>
      <div class="search-area">
        <input
          v-model.trim="searchQuery"
          type="text"
          placeholder="이름 또는 이메일 검색"
          class="search-input"
        />
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>

    <div v-else class="table-container">
      <table class="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>권한</th> <th>이름</th>
            <th>이메일</th>
            <th>전화번호</th>
            <th>가입일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filteredMembers" :key="u.member_id">
            <td>{{ u.member_id }}</td>

            <td>
              <div v-if="editRow === u.member_id">
                <label class="admin-toggle">
                  <input 
                    type="checkbox" 
                    v-model="u.is_admin" 
                    :disabled="isMe(u)" 
                  />
                  관리자
                </label>
              </div>
              <span v-else :class="['role-badge', u.is_admin ? 'admin' : 'user']">
                {{ u.is_admin ? '관리자' : '일반' }}
              </span>
            </td>

            <td>
              <input
                v-if="editRow === u.member_id"
                v-model="u.worker"
                class="input-edit"
              />
              <span v-else>{{ u.worker }}</span>
            </td>

            <td>
              <input
                v-if="editRow === u.member_id"
                v-model="u.username"
                class="input-edit"
              />
              <span v-else>{{ u.username }}</span>
            </td>

            <td>
              <input
                v-if="editRow === u.member_id"
                v-model="u.phoneNumber"
                class="input-edit"
                @input="formatPhone(u)"
              />
              <span v-else>{{ u.phoneNumber }}</span>
            </td>

            <td>{{ formatDate(u.created_at) }}</td>

            <td class="action-cell">
              <template v-if="editRow === u.member_id">
                <button
                  class="btn-save"
                  :disabled="savingId === u.member_id"
                  @click="saveUser(u)"
                >
                  <span v-if="savingId === u.member_id" class="spinner-mini"></span>
                  <span v-else>저장</span>
                </button>
                <button
                  class="btn-cancel"
                  :disabled="savingId === u.member_id"
                  @click="cancelEdit(u)"
                >
                  취소
                </button>
              </template>
              <button v-else class="btn-edit" @click="startEdit(u)">
                수정
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script>
import { api } from "@/api";
import "@/assets/css/members.css";

export default {
  name: "AdminMembersModern",
  data() {
    return {
      members: [],
      loading: true,
      savingId: null,
      editRow: null,
      searchQuery: "",
      originalData: null,
      toast: { visible: false, message: "" },
      currentAdminEmail: localStorage.getItem('email') || '',
    };
  },
  async mounted() {
    await this.fetchMembers();
  },
  computed: {
    filteredMembers() {
      const q = this.searchQuery.toLowerCase();
      return this.members.filter(
        (m) =>
          m.username.toLowerCase().includes(q) ||
          (m.worker && m.worker.toLowerCase().includes(q))
      );
    },
  },
  methods: {
    isMe(u) {
      return u.username.toLowerCase() === this.currentAdminEmail.toLowerCase();
    },

    async fetchMembers() {
      try {
        this.loading = true;
        const { data } = await api.get("/members");
        this.members = data;
      } catch (err) {
        const msg = err?.response?.data?.message || "회원 목록을 불러오지 못했습니다.";
        this.showToast(msg, true);
      } finally {
        this.loading = false;
      }
    },

    startEdit(u) {
      if (this.editRow !== null && this.editRow !== u.member_id) {
        const prev = this.members.find((m) => m.member_id === this.editRow);
        if (prev) this.cancelEdit(prev);
      }
      this.originalData = { ...u };
      this.editRow = u.member_id;
    },

    cancelEdit(u) {
      if (this.originalData) {
        Object.assign(u, this.originalData);
      }
      this.editRow = null;
      this.originalData = null;
    },

    formatPhone(u) {
      if (!u.phoneNumber) return;
      u.phoneNumber = u.phoneNumber.replace(/[^0-9-]/g, "");
    },

    async saveUser(u) {
      if (!u.worker || u.worker.trim().length < 2) {
        this.showToast("이름은 2자 이상이어야 합니다.", true);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!u.username || !emailRegex.test(u.username)) {
        this.showToast("올바른 이메일 형식이 아닙니다.", true);
        return;
      }

      try {
        this.savingId = u.member_id;
        
        const res = await api.put(`/members/${u.member_id}`, {
          worker: u.worker,
          username: u.username,
          phoneNumber: u.phoneNumber,
          is_admin: !!u.is_admin
        });
        
        this.showToast(res.data?.message || "저장되었습니다.");
        this.editRow = null;
        this.originalData = null;
      } catch (err) {
        const status = err?.response?.status;
        const msg = status === 409 ? "이미 존재하는 이메일입니다." : "수정 중 오류가 발생했습니다.";
        this.showToast(msg, true);
      } finally {
        this.savingId = null;
      }
    },

    formatDate(v) {
      if (!v) return "—";
      return new Date(v).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },

    showToast(msg, isError = false) {
      this.toast = { visible: true, message: msg };
      document.documentElement.style.setProperty(
        "--toast-bg",
        isError ? "#f44336" : "#00b3a4"
      );
      setTimeout(() => (this.toast.visible = false), 2500);
    },
  },
};
</script>

<style scoped>
.role-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.role-badge.admin {
  background: #e0f2f1;
  color: #00796b;
}
.role-badge.user {
  background: #f5f5f5;
  color: #757575;
}
.admin-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
.admin-toggle input {
  cursor: pointer;
}
</style>