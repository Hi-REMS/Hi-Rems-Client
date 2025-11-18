<template>
  <div class="rems-dashboard">
    <section class="rems-grid">
      <!-- 1행: 요약 / 전기 / 열 -->
      <article class="rems-card rems-col-4 rems-kpi-card">
        <div class="rems-card-hd">
          <h3>전국 발전소 모니터링 운영 현황</h3>
          <span class="rems-updated" v-if="lastUpdated">Last updated · {{ fromNow(lastUpdated) }}</span>
        </div>
        <div class="rems-summary">
          <div class="kpi-grid-2x2">
            <div class="kpi-mini">
              <div class="kpi-mini-label">전체 발전소</div>
              <div class="kpi-mini-value">{{ nFmt(totals.total_plants) }}</div>
            </div>

            <div class="kpi-mini">
              <div class="kpi-mini-label">정상 상태</div>
              <div class="kpi-mini-value">{{ nFmt(totals.normal_plants) }}</div>
            </div>

            <div class="kpi-mini">
              <div class="kpi-mini-label">가동률</div>
              <div class="kpi-mini-value">
                {{ uptimeRate }}<span class="kpi-mini-unit">%</span>
              </div>
            </div>

            <!-- ✅ grid 안으로 이동 (클릭 시 이상 모달) -->
            <div
              class="kpi-mini kpi-mini--alert"
              role="button"
              tabindex="0"
              @click="openAbnModal"
              @keyup.enter="openAbnModal"
            >
              <div class="kpi-mini-label">상태 이상</div>
              <div class="kpi-mini-value kpi-warn">{{ nFmt(totals.abnormal_plants) }}</div>
 <div class="kpi-mini-detail link-style">
  <span>자세히 보기</span>
  <svg class="ic" width="14" height="14" viewBox="0 0 24 24">
    <path fill="currentColor" d="M9 6l6 6-6 6"/>
  </svg>
</div>
            </div>
          </div>

          <div class="kpi-inline">
            <div class="kpi-inline-item">
              <span class="kpi-inline-label">오늘 수신</span>
              <strong class="kpi-inline-value">{{ nFmt(today.total_messages) }}</strong>
            </div>
            <div class="kpi-inline-item">
              <span class="kpi-inline-label">오늘 장치수</span>
              <strong class="kpi-inline-value">{{ nFmt(today.devices) }}</strong>
            </div>
          </div>

          <div v-if="loadingDash" class="rems-loading-note">⏳ 데이터 불러오는 중…</div>
        </div>
      </article>

      <!-- 전국 전기에너지 -->
      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 발전량</div>
            <div class="rems-t-value" :title="rawTip(energy.electric.today_kwh, 'kWh')">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.electric.today_kwh) }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div class="rems-t-value" :title="rawTip(energy.electric.today_co2_ton, 'tCO₂')">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.electric.today_co2_ton) }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">설비용량</div>
            <div class="rems-t-value">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.electric.capacity_kw) }}</template>
              <span class="rems-unit">kW</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">누적발전량</div>
            <div class="rems-t-value" :title="rawTip(energy.electric.cumulative_kwh, 'kWh')">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.electric.cumulative_kwh) }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
        </div>
        <div v-if="energyError" class="rems-loading-note rems-txt-warn" style="margin-top:8px;">⚠️ 전기 집계 로딩 실패: {{ energyError }}</div>
      </article>

      <!-- 전국 열에너지 -->
      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 비태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 사용량</div>
            <div class="rems-t-value" :title="rawTip(energy.thermal.today_kwh, 'kWh')">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.thermal.today_kwh) }}</template>
              <span class="rems-unit">kWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div class="rems-t-value" :title="rawTip(energy.thermal.today_co2_ton, 'tCO₂')">
              <template v-if="energyLoading">—</template><template v-else>{{ dFmt(energy.thermal.today_co2_ton) }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>
        </div>
        <div v-if="energyError" class="rems-loading-note rems-txt-warn" style="margin-top:8px;">⚠️ 열 집계 로딩 실패: {{ energyError }}</div>
      </article>

      <!-- 2행: 지도 + 지역별 요약 -->
      <article class="rems-card rems-col-8 rems-row-2 rems-map-card">
        <div class="rems-card-hd rems-map-breadcrumbs">
          <div class="rems-map-hd-flex">
            <h3>대한민국 지도</h3>
            <!-- ✅ 지도 모드 전환 버튼 -->
            <div class="map-mode-tabs">
              <button :class="['map-tab', {active: mapMode==='ABNORMAL'}]" @click="setMapMode('ABNORMAL')">이상 보기</button>
              <button :class="['map-tab', {active: mapMode==='NORMAL'}]" @click="setMapMode('NORMAL')">정상 보기</button>
            </div>
          </div>

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

          <!-- ✅ 오른쪽 사이드 리스트 -->
          <aside class="rems-map-panel">
            <div class="rems-panel-hd" @click="resetAll" style="cursor:pointer;">전국으로 돌아가기</div>
            <ul>
              <li v-for="c in sideList" :key="c" class="rems-row-click"
                  :class="{ 'rems-active': (c===selectedSido || c===selectedSigungu) }"
                  @click="handleSideClick(c)">
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

          <!-- ✅ 우측 상세 패널 (마커 클릭 시) -->
          <aside v-if="selectedPoint" class="rems-detail-panel">
            <header class="detail-hd">
              <div class="detail-title">상세 정보</div>
              <button class="detail-close" @click="selectedPoint=null" aria-label="닫기">✕</button>
            </header>
            <div class="detail-body">
              <div class="detail-row"><span class="dt">IMEI</span><span class="dd mono">{{ selectedPoint.imei }}</span></div>
              <div class="detail-row" v-if="selectedPoint.worker"><span class="dt">담당자</span><span class="dd">{{ selectedPoint.worker }}</span></div>
              <div class="detail-row"><span class="dt">에너지원</span><span class="dd">{{ selectedPoint.energy }}</span></div>
              <div class="detail-row"><span class="dt">상태</span><span class="dd"><span :class="['rems-tag', reasonClass(selectedPoint.reason)]">{{ selectedPoint.reason }}</span></span></div>
              <div class="detail-row" v-if="selectedPoint.address"><span class="dt">주소</span><span class="dd">{{ selectedPoint.address }}</span></div>
              <div class="detail-row" v-if="selectedPoint.sido || selectedPoint.sigungu"><span class="dt">행정구역</span><span class="dd">{{ selectedPoint.sido }} {{ selectedPoint.sigungu }}</span></div>
              <div class="detail-row" v-if="selectedPoint.last_time"><span class="dt">최근 수신</span><span class="dd mono">{{ toKst(selectedPoint.last_time) }} <small class="rems-muted">({{ fromNow(selectedPoint.last_time) }})</small></span></div>
            </div>
            <footer class="detail-ft">
              <router-link
  class="btn primary w100"
  :to="{
    path: '/analysis/timeseries',
    query: {
      imei: selectedPoint.imei,
      energy: selectedPoint.energy,
      type: selectedPoint.type,
      multi: selectedPoint.multi
    }
  }"
>
  상세 모니터링 이동
</router-link>
            </footer>
          </aside>
          <div v-if="mapLoading" class="map-loading-overlay">
  <div class="map-spinner"></div>
</div>
        </div>
      </article>

      <article class="rems-card rems-col-4 rems-row-2">
<div class="rems-card-hd" style="gap:8px; position: relative;">
  <h3>지역별 요약</h3>

<!-- ✅ 커스텀 드롭다운 -->
<!-- ✅ 개선된 커스텀 드롭다운 -->
<!-- ✅ 커스텀 드롭다운 -->
<div class="rems-dropdown rems-dropdown--enhanced">
  <button
    class="rems-dropdown-btn"
    @click="toggleDropdown"
    @keydown.esc="dropdownOpen = false"
  >
    {{ selectedSido || '전국(시·도)' }}
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      :style="{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
    >
      <path fill="currentColor" d="M7 10l5 5 5-5z" />
    </svg>
  </button>

  <!-- 🔽 드롭다운 목록 -->
  <div v-if="dropdownOpen" class="rems-dropdown-panel">
    <!-- 🔍 검색창 -->
    <input
      v-model="regionQuery"
      class="rems-dropdown-search"
      placeholder="시·도 검색"
      @keydown.esc="dropdownOpen = false"
    />

    <!-- 🔸 특별시/광역시 -->
    <div class="rems-group">
      <h4>특별시 / 광역시</h4>
      <ul>
        <li
          v-for="s in filteredRegions('metro')"
          :key="s"
          :class="{ active: selectedSido === s }"
          @click="selectSido(s)"
        >
          {{ s }}
          <svg
            v-if="selectedSido === s"
            width="14"
            height="14"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l8.1-8.1 1.4 1.4z"
            />
          </svg>
        </li>
      </ul>
    </div>

    <!-- 🔹 도 / 특별자치도 -->
    <div class="rems-group">
      <h4>도 / 특별자치도</h4>
      <ul>
        <li
          v-for="s in filteredRegions('province')"
          :key="s"
          :class="{ active: selectedSido === s }"
          @click="selectSido(s)"
        >
          {{ s }}
          <svg
            v-if="selectedSido === s"
            width="14"
            height="14"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l8.1-8.1 1.4 1.4z"
            />
          </svg>
        </li>
      </ul>
    </div>
  </div> <!-- ✅ 여기서 rems-dropdown-panel 닫힘 -->
</div> <!-- ✅ rems-dropdown 전체 닫힘 -->

</div>


<div class="rems-table-wrap rems-table-sticky">
  <table class="rems-table rems-table-compact">
    <thead>
      <tr>
        <th>{{ selectedSido ? selectedSido + ' (시·군·구)' : '시·도' }}</th>
        <th class="rems-num">발전수</th>
      </tr>
    </thead>

    <tbody>
      <tr v-if="loadingRegions">
        <td colspan="2">⏳ 집계 중…</td>
      </tr>

      <tr v-else-if="!regions.length">
        <td colspan="2">표시할 데이터가 없습니다.</td>
      </tr>

      <tr v-else 
          v-for="r in regions" 
          :key="r.name"
          class="rems-row-click zebra"
          :class="{ 'rems-active': r.name===selectedSigungu }"
          @click="onRowClick(r.name)"
      >
        <td>{{ r.name }}</td>
        <td class="rems-num">{{ nFmt(r.count) }}</td>
      </tr>
    </tbody>
  </table>
</div>

      </article>

      <!-- 3행: 빠른 이동 -->
      <article class="rems-card rems-col-12">
        <div class="rems-card-hd"><div class="rems-hint">주요 분석/검색 페이지로 바로 이동</div></div>
        <div class="rems-quick-actions">
          <router-link class="rems-qa-btn" to="/analysis/timeseries">
            <div class="rems-qa-icon">📈</div>
            <div class="rems-qa-text">
              <div class="rems-qa-title">상세 모니터링</div>
              <div class="rems-qa-desc">실시간·상세 데이터</div>
            </div>
          </router-link>
        </div>
      </article>
    </section>

    <!-- =======================
     이상 리스트 모달
     ======================= -->
    <div
      v-if="abnModal.open"
      class="modal-backdrop"
      @click.self="closeAbnModal"
      @keydown.esc="closeAbnModal"
    >
      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="abnModalTitle"
        ref="abnModal"
      >
        <header class="modal__hd">
          <h3 id="abnModalTitle">이상 발전소 현황</h3>
          <div class="rems-grow"></div>
          <button class="modal__close" @click="closeAbnModal" aria-label="닫기">✕</button>
        </header>

        <!-- 사유 필터 -->
        <div class="modal__tools">
          <div class="rems-seg seg-modern" role="tablist" aria-label="이상 사유 필터">
            <button
              class="seg-pill"
              :class="{active: reasonFilter==='ALL'}"
              @click="reasonFilter='ALL'"
              role="tab"
              :aria-selected="reasonFilter==='ALL'">
              <span class="seg-dot seg-all"></span>
              전체
              <span class="seg-count">{{ nFmt(totals.abnormal_plants) }}</span>
            </button>

            <button
              class="seg-pill"
              :class="{active: reasonFilter==='OFFLINE'}"
              @click="reasonFilter='OFFLINE'"
              role="tab"
              :aria-selected="reasonFilter==='OFFLINE'">
              <span class="seg-dot seg-offline"></span>
              OFFLINE
              <span class="seg-count">{{ nFmt(abn.summary.OFFLINE) }}</span>
            </button>

            <button
              class="seg-pill"
              :class="{active: reasonFilter==='OPMODE_ABNORMAL'}"
              @click="reasonFilter='OPMODE_ABNORMAL'"
              role="tab"
              :aria-selected="reasonFilter==='OPMODE_ABNORMAL'">
              <span class="seg-dot seg-op"></span>
              OPMODE
              <span class="seg-count">{{ nFmt(abn.summary.OPMODE_ABNORMAL) }}</span>
            </button>
          </div>

          <!-- IMEI 빠른 필터 -->
          <div class="modal__search">
            <input
              class="modal__input"
              v-model.trim="imeiQuery"
              @input="onSearchImei"
              placeholder="IMEI로 필터링" />
          </div>
        </div>

        <!-- 요약 라인 -->
        <div class="rems-abn-summaryline modal__summary">
          <span class="abn-chip danger"><i aria-hidden="true">●</i> OFFLINE <b>{{ nFmt(abn.summary.OFFLINE) }}</b></span>
          <span class="abn-chip warn"><i aria-hidden="true">●</i> OPMODE_ABNORMAL <b>{{ nFmt(abn.summary.OPMODE_ABNORMAL) }}</b></span>
          <span class="abn-total">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3 5h18v2H3zm4 6h10v2H7zm-4 6h18v2H3z"/>
            </svg>
            <b>{{ nFmt(abn.summary.OFFLINE + abn.summary.OPMODE_ABNORMAL) }}</b>
            <span class="label">이상 합계</span>
          </span>
        </div>

        <!-- 표 -->
        <div class="rems-table-wrap rems-table-sticky modal__table">
          <table class="rems-table rems-table-compact">
            <thead>
              <tr>
                <th style="width:260px">IMEI</th>
                <th style="width:140px">이유</th>
                <th style="width:120px">opMode</th>
                <th style="width:220px">마지막 수신(KST)</th>
                <th style="width:120px">경과(분)</th>
                <th>최근24h 메시지</th>
              </tr>
            </thead>
            <tbody>
            <tr v-if="abn.loading"><td colspan="6"><div class="loading-wrapper">⏳ 불러오는 중…</div></td></tr>
              <tr v-else-if="!filteredAbnItems.length"><td colspan="6">표시할 데이터가 없습니다.</td></tr>
              <tr
                v-else
                v-for="row in filteredAbnItems"
                :key="row.imei"
                class="zebra rems-row-click"
                @click="focusImei(row)">
                <td class="mono"><span>{{ row.imei }}</span></td>
                <td><span :class="['rems-tag', reasonClass(row.reason)]">{{ row.reason }}</span></td>
                <td class="mono"><span style="position:relative; left:25px;">{{ row.op_mode }}</span></td>
                <td class="mono">
                  {{ toKst(row.last_time) }}
                  <small class="rems-muted"> ({{ fromNow(row.last_time) }})</small>
                </td>
                <td class="mono">{{ Number(row.minutes_since).toFixed(1) }}</td>
                <td>
                  <div class="rems-bar">
                    <div class="rems-bar-fill" :style="{ width: barWidth(row.msgs_24h) }"></div>
                    <span class="mono rems-bar-txt">{{ row.msgs_24h }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="modal__ft">
          <button class="btn ghost" @click="closeAbnModal">닫기</button>
        </footer>
      </section>
    </div>

  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/dashboard.css'
import '@/assets/css/dashboard_modal.css'
const SIGUN_LEVEL  = 8
const FOCUS_LEVEL  = 7
const REGION_BUBBLE_LEVEL = 9 // level > 8 에서 버블 표시

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
    dropdownOpen: false,
    regionQuery: '',
    mapMode: 'ABNORMAL',
    abnModal: { open: false },
    mapLoading: false,

    // 집계
    sidos: [],
    regions: [],
    loadingRegions: false,
    selectedSido: '',
    selectedSigungu: '',
    sideList: [],

    // 지역별 이상수 캐시
    abnByRegion: {},

    // 맵
    map: null,
    markers: [],
    regionBubbles: [],
    clusterer: null,
    geoCache: {},

    // 우측 상세 패널
    selectedPoint: null,

    // 요약
    loadingDash: true,
    totals: { total_plants: 0, normal_plants: 0, abnormal_plants: 0 },
    today:  { total_messages: 0, devices: 0 },
    refreshMs: 3600000,
    timerId: null,
    lastUpdated: null,

    // 전기/열
    energyLoading: true,
    energyError: '',
    energy: {
      electric: { today_kwh: 0, today_co2_ton: 0, capacity_kw: 0, cumulative_kwh: 0 },
      thermal:  { today_kwh: 0, today_co2_ton: 0, collector_area_m2: 0, output_kw: 0, cumulative_kwh: 0 },
    },

    // 이상 발전소
    abn: {
      loading: false,
      offlineMin: 90,
      limit: 50,
      summary: { OFFLINE: 0, OPMODE_ABNORMAL: 0 },
      items: [],
      msgs24hMax: 1,
    },
    reasonFilter: 'ALL',
    imeiQuery: '',
  }
},
  created () {
    this.refreshAll()
    this.timerId = setInterval(this.refreshAll, this.refreshMs)
    this.loadSidos().then(() => this.loadRegions())
  },
async mounted () {
  if (this.map) return  // ✅ 이미 초기화된 경우 방지
  try {
    await this.loadKakaoFromServerKey()
    await this.$nextTick()
    this.initMap()
    await this.refreshMapPoints()  // renderMap보다 먼저
    this.renderMap()
    this.ensureMapReady()
    window.addEventListener('resize', this.onWindowResize)
    document.addEventListener('click', this.handleOutsideClick)
  } catch (e) {
    console.error('[mounted] Kakao SDK init 실패:', e)
  }
},
beforeDestroy () {
  if (this.timerId) clearInterval(this.timerId)
  this.clearMarkers()
  this.clearRegionBubbles()
  this.clearFocus()
  window.removeEventListener('resize', this.onWindowResize)

  // ✅ 외부 클릭 감지 해제
  document.removeEventListener('click', this.handleOutsideClick)
},
  computed: {
    uptimeRate () {
      const t = Number(this.totals?.total_plants || 0)
      const n = Number(this.totals?.normal_plants || 0)
      if (!t) return '0.0'
      return ((n / t) * 100).toFixed(1)
    },
    filteredAbnItems () {
      const q = this.imeiQuery?.trim()
      const list = (this.reasonFilter === 'ALL')
        ? this.abn.items
        : this.abn.items.filter(i => i.reason === this.reasonFilter)
      if (!q) return list
      return list.filter(i => i.imei.includes(q))
    }
  },
  watch: {
    // 필터 바뀌면 마커 즉시 갱신
reasonFilter () {
  if (this.mapMode !== 'ABNORMAL') return;  // 🔒 정상보기(NORMAL)일 땐 무시
  this.refreshMapPoints(); // 중앙화 (sido/sigungu 판단은 내부에서 처리)
}
  },
  methods: {
    energyName(code) {
  const map = {
    '01': '태양광',
    '02': '태양열',
    '03': '지열',
    '04': '풍력',
    '06': '연료전지',
    '07': 'ESS'
  }
  if (!code) return '미등록'
  return map[String(code).padStart(2,'0')] || '기타'
},
    async refreshAll () {
    try {
      await Promise.all([
        this.loadBasic(),
        this.loadEnergy(),
        this.loadAbnormal()
      ])
      this.lastUpdated = new Date().toISOString()
    } catch (e) {
      console.error('[refreshAll] failed:', e)
    }
  },
      toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen
  },
  filteredRegions(group) {
    const keyword = this.regionQuery.trim()
    const metro = [
      '서울특별시','부산광역시','대구광역시','인천광역시',
      '광주광역시','대전광역시','울산광역시','세종특별자치시'
    ]
    const provinces = [
      '경기도','강원특별자치도','충청북도','충청남도',
      '전북특별자치도','전라남도','경상북도','경상남도','제주특별자치도'
    ]
    const list = group === 'metro' ? metro : provinces
    return keyword ? list.filter(r => r.includes(keyword)) : list
  },
  selectSido(name) {
    this.selectedSido = name
    this.dropdownOpen = false
    this.regionQuery = ''
    this.onSelectSido() // 기존 메서드 호출 유지
  },
  handleOutsideClick (e) {
    const dropdown = this.$el.querySelector('.rems-dropdown')
    if (dropdown && !dropdown.contains(e.target)) {
      this.dropdownOpen = false
    }
  },
setMapMode(mode) {
  if (this.mapLoading || this.mapMode === mode) return
  this.mapMode = mode
  this.selectedPoint = null
  this.refreshMapPoints()
},
async refreshMapPoints() {
  // 🔒 중복 호출 방지 (줌/필터 이벤트 연속 호출 대비)
  if (this._refreshing) return
  this._refreshing = true
  this.mapLoading = true
  this.selectedPoint = null

  // 기존 마커, 버블 정리
  this.clearMarkers()
  this.clearRegionBubbles()

  try {
    // ✅ 지도 객체가 없을 경우 방지
    if (!this.map) return

    const currentMode = this.mapMode // 중간에 모드 바뀌는 것 감지용

    if (this.mapMode === 'ABNORMAL') {
      const level = this.map.getLevel()

      // 확대 레벨(지역 단위 이상) → 시도/시군 버블
      if (level > REGION_BUBBLE_LEVEL) {
        await this.loadRegions()
        // 버블 표시 중 다시 호출될 수 있으므로 await 필요
        await this.drawRegionClusters()
      } else {
        // ✅ 상세 이상 포인트 렌더링
        await this.drawAbnormalPoints({
          reason: this.reasonFilter,
          sido: this.selectedSido,
          sigungu: this.selectedSigungu
        })
      }
    } else if (this.mapMode === 'NORMAL') {
      // ✅ 정상 보기 모드 → 클러스터 표시
      await this.drawNormalPoints()
    }

    // ✅ 중간에 모드가 바뀌면 중단 (이전 그리기 무시)
    if (this.mapMode !== currentMode) {
      console.warn('[refreshMapPoints] mode changed during render → skip stale result')
      return
    }
  } catch (e) {
    console.error('[refreshMapPoints] failed:', e)
  } finally {
    this.mapLoading = false
    this._refreshing = false
  }
},

    /* ========== NORMAL 포인트 (클러스터) ========== */
    async drawNormalPoints() {
      if (!this.map) return
      this.clearMarkers()
      this.clearRegionBubbles()

      const preload = window.__NORMAL_POINTS__
      const items = Array.isArray(preload) && preload.length
        ? preload
        : (await api.get('/dashboard/normal/points', { params: { lookbackDays: 3 } })).data?.items || []

      const kakao = window.kakao

      const markers = []
      for (const pt of items) {
        const coord = await this.ensureCoordForPoint(pt)
        if (!coord) continue
        const latlng = new kakao.maps.LatLng(coord.lat, coord.lng)
        const marker = new kakao.maps.Marker({
          position: latlng,
          image: new kakao.maps.MarkerImage(
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="5" fill="%2322c55e" /></svg>',
            new kakao.maps.Size(12, 12)
          )
        })
        kakao.maps.event.addListener(marker, 'click', () => {
          this.selectedPoint = {
            imei: pt.imei,
            reason: 'NORMAL',
            address: pt.address,
            sido: pt.sido,
            sigungu: pt.sigungu,
            last_time: pt.last_time,
          }
          this.focusImei(pt)
        })
        markers.push(marker)
      }

      if (this.clusterer) this.clusterer.clear()
      this.clusterer = new kakao.maps.MarkerClusterer({
        map: this.map,
        averageCenter: true,
        minLevel: 8,
        disableClickZoom: false,
        styles: [{
          width: '32px',
          height: '32px',
          background: 'rgba(34,197,94,0.2)',
          borderRadius: '50%',
          color: '#22c55e',
          textAlign: 'center',
          lineHeight: '32px',
          fontWeight: '600',
          fontSize: '13px'
        }]
      })
      this.clusterer.addMarkers(markers)
      this.markers = markers
    },

    /* ========== 공통 포맷터 ========== */
    nFmt (n) { if (n==null || Number.isNaN(Number(n))) return '—'; try {return Number(n).toLocaleString()} catch {return String(n)} },
    dFmt (n, digits = 3) { if (n==null || Number.isNaN(Number(n))) return '—'; if (n>1e9) return (n/1e9).toLocaleString(undefined,{maximumFractionDigits:digits}); return Number(n).toLocaleString(undefined,{maximumFractionDigits:digits}) },
    rawTip (n, unit='') { if (n==null || Number.isNaN(Number(n))) return ''; return `${n} ${unit}`.trim() },
    toKst (iso) { const d=new Date(iso); const k=new Date(d.getTime()+9*3600*1000); const p=n=>String(n).padStart(2,'0'); return `${k.getFullYear()}-${p(k.getMonth()+1)}-${p(k.getDate())} ${p(k.getHours())}:${p(k.getMinutes())}:${p(k.getSeconds())}` },
    fromNow (isoOrDate) {
      const base = (typeof isoOrDate==='string') ? new Date(isoOrDate) : isoOrDate
      const mins = (Date.now() - base.getTime()) / 60000
      if (mins < 60) return `${mins.toFixed(0)}분 전`
      const hours = mins / 60
      if (hours < 48) return `${hours.toFixed(1)}시간 전`
      return `${(hours/24).toFixed(1)}일 전`
    },
    reasonClass (reason) { if (reason==='OFFLINE') return 'tag-offline'; if (reason==='OPMODE_ABNORMAL' || reason==='OPMODE') return 'tag-opmode'; if (reason==='FAULT_BIT') return 'tag-fault'; return 'tag-default' },
    barWidth (v) { const pct = Math.round((v / this.abn.msgs24hMax) * 100); return Math.min(100, pct) + '%' },
    async copy (text) { try { await navigator.clipboard.writeText(text) } catch {} },
    onSearchImei () {},

async loadBasic () {
  this.loadingDash = true
  try {
    const { data } = await api.get('/dashboard/basic', { params: { lookbackDays: 3 } })
    console.log('[loadBasic] 응답:', data)
    this.totals = data.totals || this.totals
    this.today  = data.today  || this.today
  } catch (err) {
    console.error('[loadBasic] failed:', err)
  } finally {
    this.loadingDash = false
  }
},

    /* ===== API: 전기/열 ===== */
    async loadEnergy () {
      this.energyLoading = true; this.energyError = ''
      try {
        const { data } = await api.get('/dashboard/energy')
        if (data && data.ok !== false) {
          const src = data.data || data
          this.energy.electric = src.electric || this.energy.electric
          this.energy.thermal  = src.thermal  || this.energy.thermal
        } else {
          this.energyError = (data && data.error) ? String(data.error) : '알 수 없는 에러'
        }
      } catch (e) { console.error('loadEnergy failed:', e); this.energyError = e?.message || '요청 실패' }
      finally { this.energyLoading = false }
    },

    /* ===== API: 이상 발전소 ===== */
    async loadAbnormal () {
      this.abn.loading = true
      try {
        const sum = await api.get('/dashboard/abnormal/summary', { params: { offlineMin: this.abn.offlineMin } })
        this.abn.summary = sum.data?.summary || this.abn.summary
        const list = await api.get('/dashboard/abnormal/list', { params: { offlineMin: this.abn.offlineMin, limit: this.abn.limit } })
        this.abn.items = list.data?.items || []
        this.abn.msgs24hMax = Math.max(1, ...this.abn.items.map(i => i.msgs_24h || 0))
        await this.loadRegions()
      } catch (e) { console.error('loadAbnormal failed:', e) }
      finally { this.abn.loading = false }
    },
    onOfflineMinChange () { this.loadAbnormal() },

    /* ===== 지역별 이상수 로딩 ===== */
    async loadAbnormalByRegion () {
      const params = {
        lookbackDays: 3,
        offlineMin: this.abn.offlineMin || 90,
        level: this.selectedSido ? 'sigungu' : 'sido'
      }
      if (this.selectedSido) params.sido = this.selectedSido

      try {
        const { data } = await api.get('/dashboard/abnormal/by-region', { params })
        const m = {}
        for (const it of (data?.items || [])) {
          const key = this.selectedSido ? `${it.sido}/${it.sigungu || ''}` : it.sido
          m[key] = it.total || 0
        }
        this.abnByRegion = m
      } catch (e) {
        console.error('loadAbnormalByRegion failed:', e)
        this.abnByRegion = {}
      }
    },

    /* ===== 지도/지역 ===== */
    async loadSidos () {
      try {
        const { data } = await api.get('/rems/agg/sido')
        this.sidos = data || []
        if (!this.selectedSido) this.sideList = this.sidos.map(s => s.name)
      } catch (e) { console.error('loadSidos failed:', e); this.sidos = [] }
    },

    // 전체/시군구 집계 + 이상수 결합 → 가동률 계산
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

        await this.loadAbnormalByRegion()

        // 가동률 합성
        if (!this.selectedSido) {
          this.regions = this.regions.map(r => {
            const abnormal = this.abnByRegion[r.name] || 0
            const rate = (r.count > 0) ? (100 * (1 - abnormal / r.count)) : null
            return { ...r, abnormal, rate }
          })
        } else {
          this.regions = this.regions.map(r => {
            const key = `${this.selectedSido}/${r.name}`
            const abnormal = this.abnByRegion[key] || 0
            const rate = (r.count > 0) ? (100 * (1 - abnormal / r.count)) : null
            return { ...r, abnormal, rate }
          })
        }

        // 지도 포커스/UI만 갱신
        this.renderMap()
      } catch (e) {
        console.error('loadRegions failed:', e)
        this.regions = []
      } finally {
        this.loadingRegions = false
      }
    },

    async loadKakaoFromServerKey () {
      if (window.kakao && window.kakao.maps) return
      const { data } = await api.get('/rems/kakao-jskey')
      const JS_KEY = data?.key
      if (!JS_KEY) throw new Error('No KAKAO_JS_KEY from server')
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=services,clusterer`
        s.onload = () => { window.kakao.maps.load(resolve) }
        s.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'))
        document.head.appendChild(s)
      })
    },

    initMap () {
      const kakao = window.kakao
      this.map = new kakao.maps.Map(this.$refs.kmap, { center: new kakao.maps.LatLng(36.5, 127.8), level: 12 })

      // ✅ 줌 변경 시 버블/포인트 자동 전환
      kakao.maps.event.addListener(this.map, 'zoom_changed', async () => {
        const level = this.map.getLevel()
        if (this.mapMode === 'ABNORMAL') {
          if (level > REGION_BUBBLE_LEVEL) {
            this.clearMarkers()
            if (!this.regions.length) await this.loadRegions()
            this.drawRegionClusters()
          } else {
            this.clearRegionBubbles()
            await this.drawAbnormalPoints({ reason: this.reasonFilter, sido: this.selectedSido, sigungu: this.selectedSigungu })
          }
        } else {
          // NORMAL: 포인트 클러스터만
          this.clearRegionBubbles()
        }
        this.renderMap() // 포커스 링 유지
      })
    },

    ensureMapReady () {
      const trigger = () => { if (!this.map) return; if (this.$refs.kmap && this.$refs.kmap.offsetHeight > 0) window.kakao.maps.event.trigger(this.map, 'resize') }
      trigger(); setTimeout(trigger, 200); setTimeout(trigger, 800)
    },
    onWindowResize () { if (this.map) window.kakao.maps.event.trigger(this.map, 'resize') },

    /* ====== 마커/버블/포커스 ====== */
    clearMarkers () {
      // overlay(CustomOverlay) 또는 Marker 모두 안전 해제
      this.markers.forEach(m => {
        if (!m) return
        if (m.setMap) m.setMap(null)
        if (m.overlay && m.overlay.setMap) m.overlay.setMap(null)
        if (m.tip && m.tip.setMap) m.tip.setMap(null)
      })
      this.markers = []
      if (this.clusterer) this.clusterer.clear()
    },
    clearRegionBubbles () {
      this.regionBubbles.forEach(b => b && b.setMap && b.setMap(null))
      this.regionBubbles = []
    },
    clearFocus () {
      if (this.focusCircle) { this.focusCircle.setMap(null); this.focusCircle = null }
      if (this.focusPulse)  { this.focusPulse.setMap(null);  this.focusPulse  = null }
    },

reasonColor (reason) {
  if (!reason) return '#22c55e' // 기본: 초록 (정상)
  const R = String(reason).toUpperCase()
  if (R === 'OFFLINE') return '#ef4444'             // 🔴 빨간색
  if (R === 'OPMODE_ABNORMAL' || R === 'OPMODE') return '#64748b' // 회색 (대기 등)
  return '#22c55e'                                  // NORMAL 초록색
},
makeMarkerEl (pt) {
  const el = document.createElement('div')
  el.className = 'rems-marker rems-marker-fadein'

  // ✅ 색상 지정 (OFFLINE → 빨강)
  const color = this.reasonColor(pt?.reason)
  el.style.borderColor = color

  // ✅ 원형 마커만 표시 (텍스트 제거)
  el.innerHTML = `
    <div class="rems-marker-dot" style="
      background:${color};
      width:14px;
      height:14px;
      border-radius:50%;
      box-shadow:0 0 6px ${color}80;
    "></div>
  `

  // ✅ 클릭 시 상세 패널 표시
  el.onclick = () => {
    console.log('🔍[MarkerClick] 원본 pt 객체:', pt)

    this.selectedPoint = {
      imei: pt.imei,
      reason: pt.reason,
      address: pt.address,
      sido: pt.sido,
      sigungu: pt.sigungu,
      last_time: pt.last_time,
      energy: this.energyName(pt.energy),
      type: pt.type ?? null,
      multi: pt.multi ?? null,
      worker: pt.worker ?? null 
    }

    console.log('✅[MarkerClick] selectedPoint:', this.selectedPoint)

    this.focusImei(pt)
  }

  return el
},

    addMarker (latlng, pt) {
      const kakao = window.kakao
      const el = this.makeMarkerEl(pt)

      // ✅ Hover 툴팁
      const tip = document.createElement('div')
      tip.className = 'rems-marker-tooltip'
      const addr = pt.address || '(주소 미등록)'
      const region = `${pt.sido || ''} ${pt.sigungu || ''}`.trim()
      const last = pt.last_time ? this.fromNow(pt.last_time) : '—'
      tip.innerHTML = `
        <strong>${addr}</strong><br/>
        <small>${region}</small><br/>
        <small>📡 ${last}</small>
      `
      const tipOverlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: tip,
        yAnchor: 1.8,
        zIndex: 999,
      })

      el.addEventListener('mouseenter', () => tipOverlay.setMap(this.map))
      el.addEventListener('mouseleave', () => tipOverlay.setMap(null))

      const z =
        pt.reason === 'OFFLINE' ? 300 :
        (pt.reason === 'OPMODE_ABNORMAL' || pt.reason === 'OPMODE') ? 250 :
        200

      const overlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: el,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: z,
      })
      overlay.setMap(this.map)
      this.markers.push({ overlay, tip: tipOverlay }) // 둘 다 추적
    },


async ensureCoordForPoint(pt) {
  // ✅ 정상 좌표가 있는 경우 빠르게 반환 (0,0 방지)
  if (pt.lat && pt.lon && pt.lat !== 0 && pt.lon !== 0) {
    const c = { lat: pt.lat, lng: pt.lon }
    localStorage.setItem(`coord:imei:${pt.imei}`, JSON.stringify(c))
    return c
  }

  const k1 = `coord:imei:${pt.imei}`
  let c = JSON.parse(localStorage.getItem(k1) || 'null')
  if (c && c.lat && c.lng) return c

  // 주소 기반 키 캐시 조회
  const hint = pt.address || `${pt.sido || ''} ${pt.sigungu || ''}`.trim()
  const k2 = `coord:addr:${hint}`
  c = JSON.parse(localStorage.getItem(k2) || 'null')

  if (!c) {
    try {
      let data
      // ✅ 주소 또는 IMEI 기준으로 지오코딩
      if (hint) {
        const q = pt.address ? pt.address : `대한민국 ${hint}`.trim()
        const res = await api.get('/rems/geocode', { params: { query: q } })
        data = res.data
      } else {
        const res = await api.get('/rems/geocode', { params: { imei: pt.imei } })
        data = res.data
      }

      // ✅ 다양한 포맷 대응
      const d0 = (data?.results || [])[0] || data
      if (d0?.lat && d0?.lon)
        c = { lat: d0.lat, lng: d0.lon }
      else if (d0?.y && d0?.x)
        c = { lat: d0.y, lng: d0.x }

      // ✅ 캐싱 (주소 + imei 키 모두)
      if (c) {
        localStorage.setItem(k2, JSON.stringify(c))
        localStorage.setItem(k1, JSON.stringify(c))
      }
    } catch (e) {
      console.warn('[ensureCoordForPoint] geocode 실패:', pt.imei, e.message)
      return null
    }
  }

  // ✅ 반환 전에 최종 검증
  if (!c || !c.lat || !c.lng) return null
  return c
},
async drawAbnormalPoints ({ reason = 'ALL', sido = '', sigungu = '' } = {}) {
  if (!this.map || this.mapMode !== 'ABNORMAL') return // ✅ 모드 가드
  this.clearMarkers()
  this.clearRegionBubbles()

  // ✅ 기본 파라미터
  const params = {
    offlineMin: this.abn.offlineMin || 90,
    lookbackDays: 3,
  }

  // ✅ reason 처리 로직 (기본은 OFFLINE만 표시)
  if (reason === 'ALL') {
    params.reason = 'OFFLINE'
  } else {
    params.reason = reason
  }

  if (sido) params.sido = sido
  if (sigungu) params.sigungu = sigungu

  try {
    const { data } = await api.get('/dashboard/abnormal/points', { params })
    const items = data?.items || []
    const kakao = window.kakao

    console.log(`[drawAbnormalPoints] 표시 대상 ${items.length}개, reason=${params.reason}`)

    for (const pt of items) {
      const coord = await this.ensureCoordForPoint(pt)
      if (!coord) continue

      const latlng = new kakao.maps.LatLng(coord.lat, coord.lng)
      this.addMarker(latlng, pt)
    }

    if (!items.length) {
      console.warn('[drawAbnormalPoints] 표시할 OFFLINE 발전소가 없습니다.')
    }
  } catch (err) {
    console.error('[drawAbnormalPoints] failed:', err)
  }
},


/* ====== 시·도 요약 대신 OFFLINE 마커 표시 ====== */
async drawRegionClusters () {
  const kakao = window.kakao

  // ✅ 기존 버블 제거
  this.clearRegionBubbles()
  this.clearMarkers()

  // ✅ 전국 OFFLINE 상태만 표시
  try {
    const params = {
      reason: 'OFFLINE',   // 🔴 오프라인 상태만
      offlineMin: this.abn?.offlineMin || 30,  // (필요시 유지)
      lookbackDays: 3
    }

    // 선택된 시도/시군구가 있으면 필터 추가
    if (this.selectedSido) params.sido = this.selectedSido
    if (this.selectedSigungu) params.sigungu = this.selectedSigungu

    const { data } = await api.get('/dashboard/abnormal/points', { params })
    const items = data?.items || []
    console.log(`[drawRegionClusters] OFFLINE markers: ${items.length}`)

    for (const pt of items) {
      const coord = await this.ensureCoordForPoint(pt)
      if (!coord) continue

      const latlng = new kakao.maps.LatLng(coord.lat, coord.lng)
      const el = this.makeMarkerEl(pt)
      const overlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: el,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 200,
      })
      overlay.setMap(this.map)
      this.regionBubbles.push(overlay)
    }
  } catch (err) {
    console.error('[drawRegionClusters] OFFLINE marker error:', err)
  }
},


showFocus (latlng, radius=8000, label='') {
  // 🔒 파란 원형 포커스 버블 제거 (지도 이동/줌만 유지)
  // 기존 focusCircle, focusPulse 생성을 막음
  this.clearFocus()
  return
},

async focusImei (ptOrRow) {
  const kakao = window.kakao

  const pt = {
    imei: ptOrRow.imei,
    reason: ptOrRow.reason || 'NORMAL',
    address: ptOrRow.address,
    sido: ptOrRow.sido,
    sigungu: ptOrRow.sigungu,
    last_time: ptOrRow.last_time,
    energy: ptOrRow.energy ?? null,
    type: ptOrRow.type ?? null,
    multi: ptOrRow.multi ?? null,
    worker: ptOrRow.worker ?? null
  }

  const coord = await this.ensureCoordForPoint(ptOrRow)
  if (!coord) return

  const latlng = new kakao.maps.LatLng(coord.lat, coord.lng)

  const currentLevel = this.map.getLevel()
  this.map.setLevel(currentLevel, { animate: false })

  this.map.panTo(latlng)

  this.showFocus(latlng, 3000, pt.imei)

  this.selectedPoint = pt
},

    /* ===== 버블 제거: renderMap은 포커스만 유지 ===== */
    async renderMap () {
      if (!this.map) return
      if (this.selectedSigungu) {
        const key = `${this.selectedSido}/${this.selectedSigungu}`
        const coord = this.geoCache[key] || JSON.parse(localStorage.getItem(`geo:${key}`) || 'null')
        if (coord) this.showFocus(new window.kakao.maps.LatLng(coord.lat, coord.lng), 5000, this.selectedSigungu)
      } else if (this.selectedSido) {
        const c = PROVINCE_CENTERS[this.selectedSido]
        if (c) this.showFocus(new window.kakao.maps.LatLng(c.lat, c.lng), 15000, this.selectedSido)
      } else {
        this.clearFocus()
      }
    },

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
    } catch {}
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
  await this.refreshMapPoints() 
},

async onRowClick (name) {
  if (!this.selectedSido) {
    this.selectedSido = name;
    this.selectedSigungu = '';
    await this.onSelectSido();   // 내부에서 refreshMapPoints() 호출
  } else {
    await this.focusSigungu(name); // 내부에서 refreshMapPoints() 호출
  }
},

async onSelectSido () {
  this.selectedSigungu = ''
  this.selectedPoint = null

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
  await this.refreshMapPoints()
  this.ensureMapReady()
},

    handleSideClick (name) {
      if (!this.selectedSido) {
        this.selectedSido = name; this.selectedSigungu = ''; this.onSelectSido()
      } else {
        this.focusSigungu(name)
      }
    },
resetAll () {
  this.selectedSido = ''
  this.selectedSigungu = ''
  this.selectedPoint = null
  this.onSelectSido()            // 내부에서 refreshMapPoints 호출
},
resetToSido () {
  if (!this.selectedSido) return
  this.selectedSigungu = ''
  this.selectedPoint = null
  this.onSelectSido()
},

    // (선택) 가동률 색상 강조
    rateClass (rate) {
      if (rate == null) return ''
      if (rate >= 95) return 'rate-ok'
      if (rate >= 80) return 'rate-warn'
      return 'rate-bad'
    },

    openAbnModal () {
      this.abnModal.open = true
      this.$nextTick(() => {
        this.$refs.abnModal?.querySelector?.('.modal__close')?.focus?.()
      })
    },
    closeAbnModal () {
      this.abnModal.open = false
    },
  }
}
</script>
