<template>
  <div class="admin-modern">
    <!-- 헤더 -->
    <header class="admin-header">
      <div>
        <h1>👥 사용자 관리</h1>
        <p>등록된 사용자 정보를 실시간으로 조회하고 수정할 수 있습니다.</p>
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

    <!-- 로딩 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>

    <!-- 테이블 -->
    <div v-else class="table-container">
      <table class="members-table">
        <thead>
          <tr>
            <th>ID</th>
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
              />
              <span v-else>{{ u.phoneNumber }}</span>
            </td>

            <td>{{ formatDate(u.created_at) }}</td>

            <td>
              <button
                v-if="editRow === u.member_id"
                class="btn-save"
                :disabled="savingId === u.member_id"
                @click="saveUser(u)"
              >
                <span v-if="savingId === u.member_id" class="spinner-mini"></span>
                <span v-else>저장</span>
              </button>
              <button
                v-else
                class="btn-edit"
                @click="editRow = u.member_id"
              >
                수정
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 토스트 -->
    <transition name="fade">
      <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/members.css'
export default {
  name: 'AdminMembersModern',
  data() {
    return {
      members: [],
      loading: true,
      savingId: null,
      editRow: null,
      searchQuery: '',
      toast: { visible: false, message: '' },
    }
  },
  async mounted() {
    await this.fetchMembers()
  },
  computed: {
    filteredMembers() {
      const q = this.searchQuery.toLowerCase()
      return this.members.filter(
        (m) =>
          m.username.toLowerCase().includes(q) ||
          (m.worker && m.worker.toLowerCase().includes(q))
      )
    },
  },
  methods: {
    async fetchMembers() {
      try {
        this.loading = true
        const { data } = await api.get('/members')
        this.members = data
      } catch (err) {
        const msg = err?.response?.data?.message || '회원 목록을 불러오지 못했습니다.'
        this.showToast(msg, true)
      } finally {
        this.loading = false
      }
    },
    async saveUser(u) {
      try {
        this.savingId = u.member_id
        const res = await api.put(`/members/${u.member_id}`, {
          worker: u.worker,
          username: u.username,
          phoneNumber: u.phoneNumber,
        })
        // 정상 응답
        const msg = res.data?.message || `"${u.worker}" 정보가 저장되었습니다.`
        this.showToast(msg)
        this.editRow = null
      } catch (err) {
        const status = err?.response?.status
        const msg =
          status === 409
            ? '이미 존재하는 이메일입니다.'
            : err?.response?.data?.message || '수정 중 오류가 발생했습니다.'
        this.showToast(msg, true)
      } finally {
        this.savingId = null
      }
    },
    formatDate(v) {
      return new Date(v).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    },
    showToast(msg, isError = false) {
      this.toast = { visible: true, message: msg }
      document.documentElement.style.setProperty('--toast-bg', isError ? '#f44336' : '#0b8')
      setTimeout(() => (this.toast.visible = false), 2500)
    },
  },
}
</script>