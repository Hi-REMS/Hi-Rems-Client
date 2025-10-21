<template>
  <div class="rems-dashboard">
    <section class="rems-grid">
      <!-- 1행: 요약 / 전기 / 열 -->
      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 발전소 모니터링 운영 현황</h3></div>
        <div class="rems-summary">
          <ul>
            <li><span>전체 발전소</span><strong>{{ nFmt(totals.total_plants) }}</strong></li>
            <li><span>정상 상태</span><strong>{{ nFmt(totals.normal_plants) }}</strong></li>
            <li><span>상태 이상 발전소</span><strong class="rems-txt-warn">{{ nFmt(totals.abnormal_plants) }}</strong></li>

          </ul>

          <ul class="rems-mt-split">
            <li><span>오늘 수신 건수</span><strong>{{ nFmt(today.total_messages) }}</strong></li>
            <li><span>오늘 등장 장치수</span><strong>{{ nFmt(today.devices) }}</strong></li>
          </ul>

          <div v-if="loadingDash" class="rems-loading-note">⏳ 대시보드 데이터 불러오는 중…</div>
        </div>
      </article>

      <!-- 전국 전기에너지 -->
      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 발전량</div>
            <div class="rems-t-value" :title="rawTip(energy.electric.today_kwh, 'kWh')">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.electric.today_kwh) }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div class="rems-t-value" :title="rawTip(energy.electric.today_co2_ton, 'tCO₂')">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.electric.today_co2_ton) }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">설비용량</div>
            <div class="rems-t-value">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.electric.capacity_kw) }}</template>
              <span class="rems-unit">kW</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">누적발전량</div>
            <!-- cumulative_mwh → cumulative_kwh -->
            <div class="rems-t-value" :title="rawTip(energy.electric.cumulative_kwh, 'kWh')">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.electric.cumulative_kwh) }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
        </div>
        <div v-if="energyError" class="rems-loading-note rems-txt-warn" style="margin-top:8px;">
          ⚠️ 전기 집계 로딩 실패: {{ energyError }}
        </div>
      </article>

      <!-- 전국 열에너지 -->
      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 비태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 사용량</div>
            <div class="rems-t-value" :title="rawTip(energy.thermal.today_kwh, 'kWh')">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.thermal.today_kwh) }}</template>
              <span class="rems-unit">kWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div class="rems-t-value" :title="rawTip(energy.thermal.today_co2_ton, 'tCO₂')">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.thermal.today_co2_ton) }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">태양열 집열면적</div>
            <div class="rems-t-value">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.thermal.collector_area_m2) }}</template>
              <span class="rems-unit">㎡</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">집열 출력</div>
            <div class="rems-t-value">
              <template v-if="energyLoading">—</template>
              <template v-else>{{ dFmt(energy.thermal.output_kw) }}</template>
              <span class="rems-unit">kW</span>
            </div>
          </div>
        </div>
        <div v-if="energyError" class="rems-loading-note rems-txt-warn" style="margin-top:8px;">
          ⚠️ 열 집계 로딩 실패: {{ energyError }}
        </div>
      </article>

      <!-- 2행: 지도 + 지역별 요약 -->
      <article class="rems-card rems-col-8 rems-row-2 rems-map-card">
        <div class="rems-card-hd rems-map-breadcrumbs">
          <h3>대한민국 지도</h3>
          <div class="rems-crumbs">
            <button class="rems-chip" @click="resetAll" title="전국으로">전국</button>
            <template v-if="selectedSido">
              <span class="rems-sep">›</span>
              <button class="rems-chip rems-strong" @click="resetToSido" :title="selectedSido">{{ selectedSido }}</button>
            </template>
            <template v-if="selectedSigungu">
              <span class="rems-sep">›</span>
              <span class="rems-chip rems-dim">{{ selectedSigungu }}</span>
            </template>
          </div>
        </div>

        <div class="rems-map">
          <div ref="kmap" class="rems-kmap" tabindex="0" @keydown.esc="resetAll"></div>

          <aside class="rems-map-panel">
            <div class="rems-panel-hd" @click="resetAll" style="cursor:pointer;">전국으로 돌아가기</div>
            <ul>
              <li
                v-for="c in sideList"
                :key="c"
                class="rems-row-click"
                :class="{ 'rems-active': (c===selectedSido || c===selectedSigungu) }"
                @click="handleSideClick(c)"
              >
                {{ c }}
              </li>
            </ul>
          </aside>

          <div class="rems-legend">
            <span class="rems-lg rems-lg-danger">고장</span>
            <span class="rems-lg rems-lg-warn">경고</span>
            <span class="rems-lg rems-lg-paused">운전대기중</span>
            <span class="rems-lg rems-lg-idle">미작동</span>
            <span class="rems-lg rems-lg-ok">정상</span>
          </div>
        </div>
      </article>

      <article class="rems-card rems-col-4 rems-row-2">
        <div class="rems-card-hd" style="gap:8px;">
          <h3>지역별 요약</h3>
          <select v-model="selectedSido" @change="onSelectSido" class="rems-chip rems-select-dark" style="margin-left:auto;">
            <option value="">전국(시·도)</option>
            <option v-for="s in sidos" :key="s.name" :value="s.name">{{ s.name }}</option>
          </select>
        </div>

        <div class="rems-table-wrap">
          <table class="rems-table">
            <thead>
              <tr>
                <th>{{ selectedSido ? selectedSido + ' (시·군·구)' : '시·도' }}</th>
                <th class="rems-num">발전수</th>
                <th class="rems-num">가동률(%)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingRegions"><td colspan="3">⏳ 집계 중…</td></tr>
              <tr v-else-if="!regions.length"><td colspan="3">표시할 데이터가 없습니다.</td></tr>
              <tr
                v-else
                v-for="r in regions"
                :key="r.name"
                class="rems-row-click"
                :class="{ 'rems-active': r.name===selectedSigungu }"
                @click="onRowClick(r.name)"
              >
                <td>{{ r.name }}</td>
                <td class="rems-num">{{ nFmt(r.count) }}</td>
                <td class="rems-num">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <!-- 3행: 빠른 이동 -->
      <article class="rems-card rems-col-12">
        <div class="rems-card-hd">
          <div class="rems-hint">주요 분석/검색 페이지로 바로 이동</div>
        </div>

        <div class="rems-quick-actions">
          <router-link class="rems-qa-btn" to="/analysis/timeseries">
            <div class="rems-qa-icon">📈</div>
            <div class="rems-qa-text">
              <div class="rems-qa-title">상세 모니터링</div>
              <div class="rems-qa-desc">실시간·상세 데이터</div>
            </div>
          </router-link>
<!--
          <router-link class="rems-qa-btn" :to="{ name:'EnergyYearlyAndMonthly', query:{ imei: imeiToGo } }">
            <div class="rems-qa-icon">🏭</div>
            <div class="rems-qa-text">
              <div class="rems-qa-title">월간/연간 발전량</div>
              <div class="rems-qa-desc">월간/연간 발전량 데이터 지표</div>
            </div>
          </router-link>

          <router-link class="rems-qa-btn" :to="{ name:'EnergyWeekly', query:{ imei: imeiToGo, range:'weekly' } }">
            <div class="rems-qa-icon">⚡</div>
            <div class="rems-qa-text">
              <div class="rems-qa-title">주간 발전량</div>
              <div class="rems-qa-desc">금일/금월/금년 및 시간대별</div>
            </div>
          </router-link>
-->
        </div>
      </article>
    </section>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/dashboard.css'

const SIGUN_LEVEL  = 8
const FOCUS_LEVEL  = 7

const PROVINCE_CENTERS = {
  '서울특별시': { lat: 37.5665, lng: 126.9780 },
  '부산광역시': { lat: 35.1796, lng: 129.0756 },
  '대구광역시': { lat: 35.8714, lng: 128.6014 },
  '인천광역시': { lat: 37.4563, lng: 126.7052 },
  '광주광역시': { lat: 35.1595, lng: 126.8526 },
  '대전광역시': { lat: 36.3504, lng: 127.3845 },
  '울산광역시': { lat: 35.5397, lng: 129.3114 },
  '세종특별자치시': { lat: 36.4800, lng: 127.2890 },
  '경기도': { lat: 37.4138, lng: 127.5183 },
  '강원특별자치도': { lat: 37.8228, lng: 128.1555 },
  '충청북도': { lat: 36.6359, lng: 127.4917 },
  '충청남도': { lat: 36.5184, lng: 126.8000 },
  '전북특별자치도': { lat: 35.7175, lng: 127.1530 },
  '전라남도': { lat: 34.8679, lng: 126.9910 },
  '경상북도': { lat: 36.4919, lng: 128.8889 },
  '경상남도': { lat: 35.2383, lng: 128.6929 },
  '제주특별자치도': { lat: 33.4890, lng: 126.4983 },
}

export default {
  name: 'HomePage',
  data () {
    return {
      // 집계
      sidos: [],
      regions: [],
      loadingRegions: false,
      selectedSido: '',
      selectedSigungu: '',
      sideList: [],
      imeiToGo: '',

      // 맵
      map: null,
      overlays: [],
      geoCache: {},
      focusCircle: null,
      focusPulse: null,

      // 요약(기존)
      loadingDash: true,
      totals: { total_plants: 0, normal_plants: 0, abnormal_plants: 0 },
      today:  { total_messages: 0, devices: 0 },
      todayByMsgType: {},
      todayByHour: [],
      latestByOpMode: {},
      refreshMs: 30000,
      timerId: null,

      // 전국 전기/열 에너지
      energyLoading: true,
      energyError: '',
      energy: {
        electric: { today_kwh: 0, today_co2_ton: 0, capacity_kw: 0, cumulative_kwh: 0 },
        thermal:  { today_kwh: 0, today_co2_ton: 0, collector_area_m2: 0, output_kw: 0, cumulative_kwh: 0 },
      },
    }
  },
  created () {
    this.loadBasic()
    this.loadEnergy()
    this.timerId = setInterval(() => {
      this.loadBasic()
      this.loadEnergy()
    }, this.refreshMs)
    this.loadSidos().then(() => this.loadRegions())
  },
  async mounted () {
    try {
      await this.loadKakaoFromServerKey()
      await this.$nextTick()
      this.initMap()
      this.renderMap()
      this.ensureMapReady()
      window.addEventListener('resize', this.onWindowResize)
    } catch (e) {
      console.error('Kakao SDK load/init failed:', e)
    }
  },
  beforeDestroy () {
    if (this.timerId) clearInterval(this.timerId)
    this.clearOverlays()
    this.clearFocus()
    window.removeEventListener('resize', this.onWindowResize)
  },
  methods: {
    nFmt (n) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
      try { return Number(n).toLocaleString() } catch { return String(n) }
    },
    dFmt (n, digits = 3) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
      if (n > 1e9) {
        return (n / 1e9).toLocaleString(undefined, { maximumFractionDigits: digits })
      }
      return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits })
    },
    rawTip (n, unit='') {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return ''
      return `${n} ${unit}`.trim()
    },

    /* ===== 대시보드 요약 ===== */
    async loadBasic () {
      this.loadingDash = true
      try {
        const { data } = await api.get('/dashboard/basic', { params: { lookbackDays: 1 } })
        this.totals = data.totals || this.totals
        this.today  = data.today  || this.today
        this.todayByMsgType = data.todayByMsgType || {}
        this.todayByHour    = data.todayByHour    || []
        this.latestByOpMode = data.latestByOpMode || {}
      } catch (err) {
        console.error('loadBasic failed:', err)
      } finally {
        this.loadingDash = false
      }
    },

    /* ===== 전국 전기/열 에너지 집계 ===== */
    async loadEnergy () {
      this.energyLoading = true
      this.energyError = ''
      try {
        const { data } = await api.get('/dashboard/energy')
        if (data && data.ok !== false) {
          const src = data.data || data
          this.energy.electric = src.electric || this.energy.electric
          this.energy.thermal  = src.thermal  || this.energy.thermal
        } else {
          this.energyError = (data && data.error) ? String(data.error) : '알 수 없는 에러'
        }
      } catch (e) {
        console.error('loadEnergy failed:', e)
        this.energyError = e?.message || '요청 실패'
      } finally {
        this.energyLoading = false
      }
    },

    /* ===== 집계 API ===== */
    async loadSidos () {
      try {
        const { data } = await api.get('/rems/agg/sido')
        this.sidos = data || []
        if (!this.selectedSido) this.sideList = this.sidos.map(s => s.name)
      } catch (e) {
        console.error('loadSidos failed:', e)
        this.sidos = []
      }
    },
    async loadRegions () {
      this.loadingRegions = true
      try {
        if (!this.selectedSido) {
          const { data } = await api.get('/rems/agg/sido')
          this.regions = (data || []).map(r => ({ name: r.name, count: r.count }))
          this.sideList = this.regions.map(r => r.name)
        } else {
          const { data } = await api.get('/rems/agg/sigungu', { params: { sido: this.selectedSido } })
          this.regions = (data || []).map(r => ({ name: r.name, count: r.count }))
          this.sideList = this.regions.map(r => r.name)
        }
        this.renderMap()
      } catch (e) {
        console.error('loadRegions failed:', e)
        this.regions = []
      } finally {
        this.loadingRegions = false
      }
    },

    /* ===== 카카오맵: 서버에서 JS 키 받아 로드 ===== */
    async loadKakaoFromServerKey () {
      if (window.kakao && window.kakao.maps) return
      const { data } = await api.get('/rems/kakao-jskey')
      const JS_KEY = data?.key
      if (!JS_KEY) throw new Error('No KAKAO_JS_KEY from server')

      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=services`
        s.onload = () => { window.kakao.maps.load(resolve) }
        s.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'))
        document.head.appendChild(s)
      })
    },

    initMap () {
      const kakao = window.kakao
      this.map = new kakao.maps.Map(this.$refs.kmap, {
        center: new kakao.maps.LatLng(36.5, 127.8),
        level: 12,
      })
      kakao.maps.event.addListener(this.map, 'zoom_changed', () => this.renderMap())
    },

    ensureMapReady () {
      const trigger = () => {
        if (!this.map) return
        if (this.$refs.kmap && this.$refs.kmap.offsetHeight > 0) {
          window.kakao.maps.event.trigger(this.map, 'resize')
        }
      }
      trigger()
      setTimeout(trigger, 200)
      setTimeout(trigger, 800)
    },
    onWindowResize () {
      if (this.map) window.kakao.maps.event.trigger(this.map, 'resize')
    },

    clearOverlays () {
      this.overlays.forEach(o => o.setMap(null))
      this.overlays = []
    },
    clearFocus () {
      if (this.focusCircle) { this.focusCircle.setMap(null); this.focusCircle = null }
      if (this.focusPulse)  { this.focusPulse.setMap(null);  this.focusPulse  = null }
    },

    /* ===== 지도 렌더링 ===== */
    async renderMap () {
      if (!this.map) return
      this.clearOverlays()

      const level = this.map.getLevel()
      const kakao = window.kakao

      if (!this.selectedSido || level > SIGUN_LEVEL) {
        // 시·도 버블
        for (const r of this.sidos) {
          const center = PROVINCE_CENTERS[r.name]
          if (!center) continue
          const pos = new kakao.maps.LatLng(center.lat, center.lng)
          const el = document.createElement('div')
          el.className = 'rems-count-bubble'
          if (this.selectedSido && r.name !== this.selectedSido) el.classList.add('rems-dim')
          if (r.name === this.selectedSido) el.classList.add('rems-active')

          el.innerHTML = `<div class="rems-cb-name">${r.name}</div><div class="rems-cb-num">${this.nFmt(r.count)}</div>`
          el.onclick = () => { this.selectedSido = r.name; this.selectedSigungu = ''; this.onSelectSido() }

          const ov = new kakao.maps.CustomOverlay({ position: pos, content: el, xAnchor: 0.5, yAnchor: 1 })
          ov.setMap(this.map)
          this.overlays.push(ov)
        }

        if (this.selectedSido) {
          const c = PROVINCE_CENTERS[this.selectedSido]
          if (c) this.showFocus(new kakao.maps.LatLng(c.lat, c.lng), 15000, this.selectedSido)
        } else {
          this.clearFocus()
        }
      } else {
        // 시군구 버블
        for (const r of this.regions) {
          const key = `${this.selectedSido}/${r.name}`
          let coord = this.geoCache[key] || JSON.parse(localStorage.getItem(`geo:${key}`) || 'null')

          if (!coord) {
            const q = `대한민국 ${this.selectedSido} ${r.name}`
            try {
              const { data } = await api.get('/rems/geocode', { params: { query: q } })
              const d0 = (data?.results || [])[0]
              if (d0) coord = { lat: d0.y, lng: d0.x }
            } catch (e) { /* ignore */ }

            if (!coord) continue
            this.geoCache[key] = coord
            localStorage.setItem(`geo:${key}`, JSON.stringify(coord))
          }

          const pos = new kakao.maps.LatLng(coord.lat, coord.lng)
          const el = document.createElement('div')
          el.className = 'rems-count-bubble rems-small'
          if (this.selectedSigungu && r.name !== this.selectedSigungu) el.classList.add('rems-dim')
          if (r.name === this.selectedSigungu) el.classList.add('rems-active')

          el.innerHTML = `<div class="rems-cb-name">${r.name}</div><div class="rems-cb-num">${this.nFmt(r.count)}</div>`
          el.onclick = () => this.focusSigungu(r.name)

          const ov = new kakao.maps.CustomOverlay({ position: pos, content: el, xAnchor: 0.5, yAnchor: 1 })
          ov.setMap(this.map)
          this.overlays.push(ov)
        }

        if (this.selectedSigungu) {
          const key = `${this.selectedSido}/${this.selectedSigungu}`
          const coord = this.geoCache[key] || JSON.parse(localStorage.getItem(`geo:${key}`) || 'null')
          if (coord) this.showFocus(new kakao.maps.LatLng(coord.lat, coord.lng), 5000, this.selectedSigungu)
        } else {
          this.clearFocus()
        }
      }
    },

    /* ===== 포커스 표현 ===== */
    showFocus (latlng, radius=8000, label='') {
      const kakao = window.kakao
      this.clearFocus()

      this.focusCircle = new kakao.maps.Circle({
        center: latlng,
        radius,
        strokeWeight: 2,
        strokeColor: '#22d3ee',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        fillColor: '#22d3ee',
        fillOpacity: 0.15,
      })
      this.focusCircle.setMap(this.map)

      const el = document.createElement('div')
      el.className = 'rems-focus-pulse'
      el.innerHTML = `<div class="rems-ring"></div><div class="rems-label">${label}</div>`
      this.focusPulse = new kakao.maps.CustomOverlay({
        position: latlng, content: el, xAnchor: 0.5, yAnchor: 0.5, zIndex: 99
      })
      this.focusPulse.setMap(this.map)
    },

    /* ===== 상호작용 ===== */
    async focusSigungu (sigunguName) {
      if (!this.selectedSido) return
      const key = `${this.selectedSido}/${sigunguName}`
      let coord = this.geoCache[key] || JSON.parse(localStorage.getItem(`geo:${key}`) || 'null')

      if (!coord) {
        try {
          const q = `대한민국 ${this.selectedSido} ${sigunguName}`
          const { data } = await api.get('/rems/geocode', { params: { query: q } })
          const d0 = (data?.results || [])[0]
          if (d0) coord = { lat: d0.y, lng: d0.x }
        } catch (e) { /* ignore */ }
        if (!coord) return
        this.geoCache[key] = coord
        localStorage.setItem(`geo:${key}`, JSON.stringify(coord))
      }

      const kakao = window.kakao
      this.selectedSigungu = sigunguName
      const latlng = new kakao.maps.LatLng(coord.lat, coord.lng)
      this.map.setLevel(FOCUS_LEVEL, { animate: true })
      this.map.panTo(latlng)
      this.renderMap()
    },

    onRowClick (name) {
      if (!this.selectedSido) {
        this.selectedSido = name
        this.selectedSigungu = ''
        this.onSelectSido()
      } else {
        this.focusSigungu(name)
      }
    },

    onSelectSido () {
      this.selectedSigungu = ''
      if (!this.selectedSido) {
        this.loadRegions()
        this.map.setLevel(12, { animate: true })
        this.map.panTo(new window.kakao.maps.LatLng(36.5, 127.8))
      } else {
        const c = PROVINCE_CENTERS[this.selectedSido]
        if (c) {
          this.map.setLevel(SIGUN_LEVEL, { animate: true })
          this.map.panTo(new window.kakao.maps.LatLng(c.lat, c.lng))
        }
        this.loadRegions()
      }
      this.ensureMapReady()
    },

    handleSideClick (name) {
      if (!this.selectedSido) {
        this.selectedSido = name
        this.selectedSigungu = ''
        this.onSelectSido()
      } else {
        this.focusSigungu(name)
      }
    },

    resetAll () {
      this.selectedSido = ''
      this.selectedSigungu = ''
      this.onSelectSido()
    },
    resetToSido () {
      if (!this.selectedSido) return
      this.selectedSigungu = ''
      this.onSelectSido()
    },
  }
}
</script>