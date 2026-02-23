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
          maxlength="50"
        />
        <p v-if="searchQuery.length === 0" class="search-tip">이름 또는 이메일을 입력하여 필터링하세요.</p>
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
            <th>권한</th> 
            <th>이름</th>
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
                maxlength="30"
                placeholder="이름 입력 (2~30자)"
              />
              <span v-else>{{ u.worker }}</span>
            </td>

            <td>
              <input
                v-if="editRow === u.member_id"
                v-model="u.username"
                class="input-edit"
                maxlength="50"
                placeholder="이메일 입력"
              />
              <span v-else>{{ u.username }}</span>
            </td>

            <td>
              <input
                v-if="editRow === u.member_id"
                v-model="u.phoneNumber"
                class="input-edit"
                @input="formatPhone(u)"
                maxlength="13"
                placeholder="010-0000-0000"
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
      
      <div v-if="filteredMembers.length === 0" class="empty-results">
        검색 결과가 없습니다.
      </div>
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
      const q = this.searchQuery.toLowerCase().trim();
      if (!q) return this.members;
      
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
        this.showToast("회원 목록을 불러오지 못했습니다.", true);
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
  let val = u.phoneNumber.replace(/\D/g, "");

  if (val.length <= 3) {
    u.phoneNumber = val;
  } else if (val.length <= 7) {
    u.phoneNumber = val.slice(0, 3) + "-" + val.slice(3);
  } else {
    u.phoneNumber = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
  }
},

    async saveUser(u) {
      const workerName = (u.worker || "").trim();
      if (workerName.length < 2) {
        this.showToast("이름은 최소 2자 이상 입력하셔야 합니다.", true);
        return;
      }
      if (workerName.length > 30) {
        this.showToast("이름은 30자 이내로 입력하셔야 합니다.", true);
        return;
      }

      const email = (u.username || "").trim();
      if (email.length === 0) {
        this.showToast("이메일(아이디)을 입력해주세요.", true);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showToast("올바른 이메일 형식이 아닙니다.", true);
        return;
      }
      if (email.length > 50 ) {
        this.showToast("이메일은 50자 이내로 입력하셔야 합니다.", true);
        return;
      }
      if (u.phoneNumber && u.phoneNumber.length > 13) {
        this.showToast("전화번호는 13자 이내로 입력해주세요.", true);
        return;
      }

      if (u.phoneNumber && u.phoneNumber.length < 12) {
        this.showToast("전화번호 형식이 올바르지 않습니다.", true);
        return;
      }
      try {
        this.savingId = u.member_id;
        
        const res = await api.put(`/members/${u.member_id}`, {
          worker: workerName,
          username: email,
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
/* 안내 문구 스타일 추가 */
.search-tip {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}
.empty-results {
  padding: 40px;
  text-align: center;
  color: #999;
}
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