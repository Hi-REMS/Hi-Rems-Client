<template>
  <div class="rems-dashboard">
    <section class="rems-grid">
      <article class="rems-card rems-col-4 rems-kpi-card">
        <div class="rems-card-hd">
          <h3>전국 발전소 모니터링 운영 현황</h3>
          <span class="rems-updated" v-if="lastUpdated"
            >Last updated · {{ fromNow(lastUpdated) }}</span
          >
        </div>
        <div class="rems-summary">
          <div class="kpi-grid-2x2">
            <div class="kpi-mini">
              <div class="kpi-mini-label">전체 발전소</div>
              <div class="kpi-mini-value">
                <CountUp :end-val="totals.total_plants" />
              </div>
            </div>

            <div class="kpi-mini">
              <div class="kpi-mini-label">정상 상태</div>
              <div class="kpi-mini-value">
                <CountUp :end-val="totals.normal_plants" />
              </div>
            </div>

            <div class="kpi-mini">
              <div class="kpi-mini-label">가동률</div>
              <div class="kpi-mini-value">
                {{ uptimeRate }}<span class="kpi-mini-unit">%</span>
              </div>
            </div>

            <div
              class="kpi-mini kpi-mini--alert"
              role="button"
              tabindex="0"
              @click="openAbnModal"
              @keyup.enter="openAbnModal"
            >
              <div class="kpi-mini-label">상태 이상</div>
              <div class="kpi-mini-value kpi-warn">
                <CountUp :end-val="totalAbnormal" />
              </div>
              <div class="kpi-mini-detail link-style">
                <span>자세히 보기</span>
                <svg class="ic" width="14" height="14" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9 6l6 6-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div class="kpi-inline">
            <div class="kpi-inline-item">
              <span class="kpi-inline-label">오늘 수신</span>
              <strong class="kpi-inline-value">{{
                nFmt(today.total_messages)
              }}</strong>
            </div>
            <div class="kpi-inline-item">
              <span class="kpi-inline-label">오늘 장치수</span>
              <strong class="kpi-inline-value">{{
                nFmt(today.devices)
              }}</strong>
            </div>
          </div>

          <div v-if="loadingDash" class="rems-loading-note">
            ⏳ 데이터 불러오는 중…
          </div>
        </div>
      </article>

      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 발전량</div>
            <div
              class="rems-t-value"
              :title="rawTip(energy.electric.today_kwh, 'kWh')"
            >
              <template v-if="energyLoading">—</template
              ><template v-else>{{ dFmt(energy.electric.today_kwh) }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div
              class="rems-t-value"
              :title="rawTip(energy.electric.today_co2_ton, 'tCO₂')"
            >
              <template v-if="energyLoading">—</template
              ><template v-else>{{
                dFmt(energy.electric.today_co2_ton)
              }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>

          <div class="rems-tile">
            <div class="rems-t-caption">설비용량</div>
            <div class="rems-t-value">
              3
              <span class="rems-unit">kW</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">누적발전량</div>
            <div
              class="rems-t-value"
              :title="rawTip(energy.electric.cumulative_kwh, 'kWh')"
            >
              <template v-if="energyLoading">—</template
              ><template v-else>{{
                dFmt(energy.electric.cumulative_kwh)
              }}</template>
              <span class="rems-unit">GWh</span>
            </div>
          </div>
        </div>
        <div
          v-if="energyError"
          class="rems-loading-note rems-txt-warn"
          style="margin-top: 8px"
        >
          ⚠️ 전기 집계 로딩 실패: {{ energyError }}
        </div>
      </article>

      <article class="rems-card rems-col-4">
        <div class="rems-card-hd"><h3>전국 비태양광 에너지</h3></div>
        <div class="rems-stat-tiles">
          <div class="rems-tile">
            <div class="rems-t-caption">금일 사용량</div>
            <div
              class="rems-t-value"
              :title="rawTip(energy.thermal.today_kwh, 'kWh')"
            >
              <template v-if="energyLoading">—</template
              ><template v-else>{{ dFmt(energy.thermal.today_kwh) }}</template>
              <span class="rems-unit">kWh</span>
            </div>
          </div>
          <div class="rems-tile">
            <div class="rems-t-caption">금일 CO₂ 저감</div>
            <div
              class="rems-t-value"
              :title="rawTip(energy.thermal.today_co2_ton, 'tCO₂')"
            >
              <template v-if="energyLoading">—</template
              ><template v-else>{{
                dFmt(energy.thermal.today_co2_ton)
              }}</template>
              <span class="rems-unit">tCO₂</span>
            </div>
          </div>
        </div>
        <div
          v-if="energyError"
          class="rems-loading-note rems-txt-warn"
          style="margin-top: 8px"
        >
          ⚠️ 열 집계 로딩 실패: {{ energyError }}
        </div>
      </article>

      <article class="rems-card rems-col-8 rems-row-2 rems-map-card">
        <div class="rems-card-hd rems-map-breadcrumbs">
          <div class="rems-map-hd-flex">
            <h3>대한민국 지도</h3>
            <div class="map-mode-tabs">
              <button
                :class="['map-tab', { active: mapMode === 'NORMAL' }]"
                @click="setMapMode('NORMAL')"
              >
                정상 보기
              </button>
              <button
                :class="['map-tab', { active: mapMode === 'ABNORMAL' }]"
                @click="setMapMode('ABNORMAL')"
              >
                이상 보기
              </button>
            </div>
          </div>

          <div class="rems-crumbs">
            <button class="rems-chip" @click="resetAll" title="전국으로">
              전국
            </button>
            <template v-if="selectedSido">
              <span class="rems-sep">›</span>
              <button
                class="rems-chip rems-strong"
                @click="resetToSido"
                :title="selectedSido"
              >
                {{ selectedSido }}
              </button>
            </template>
            <template v-if="selectedSigungu">
              <span class="rems-sep">›</span>
              <span class="rems-chip rems-dim">{{ selectedSigungu }}</span>
            </template>
          </div>
        </div>

        <div class="rems-map">
          <div
            ref="kmap"
            class="rems-kmap"
            tabindex="0"
            @keydown.esc="resetAll"
          ></div>
          <aside v-if="selectedPoint" class="rems-detail-panel">
            <header class="detail-hd">
              <div class="detail-title">상세 정보</div>
              <button
                class="detail-close"
                @click="selectedPoint = null"
                aria-label="닫기"
              >
                ✕
              </button>
            </header>
            <div class="detail-body">
              <div class="detail-row">
                <span class="dt">IMEI</span
                ><span class="dd mono">{{ selectedPoint.imei }}</span>
              </div>
              <div class="detail-row" v-if="selectedPoint.worker">
                <span class="dt">담당자</span
                ><span class="dd">{{ selectedPoint.worker }}</span>
              </div>
              <div class="detail-row">
                <span class="dt">상태</span
                ><span class="dd"
                  ><span
                    :class="['rems-tag', reasonClass(selectedPoint.reason)]"
                    >{{ selectedPoint.reason }}</span
                  ></span
                >
              </div>
              <div class="detail-row" v-if="selectedPoint.address">
                <span class="dt">주소</span
                ><span class="dd">{{ selectedPoint.address }}</span>
              </div>
              <div
                class="detail-row"
                v-if="selectedPoint.sido || selectedPoint.sigungu"
              >
                <span class="dt">행정구역</span
                ><span class="dd"
                  >{{ selectedPoint.sido }} {{ selectedPoint.sigungu }}</span
                >
              </div>
              <div class="detail-row" v-if="selectedPoint.last_time">
                <span class="dt">최근 수신</span
                ><span class="dd mono"
                  >{{ toKst(selectedPoint.last_time) }}
                  <small class="rems-muted"
                    >({{ fromNow(selectedPoint.last_time) }})</small
                  ></span
                >
              </div>
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
                    multi: selectedPoint.multi,
                    name: selectedPoint.worker,
                  },
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
        <div class="rems-card-hd" style="gap: 8px; position: relative">
          <h3>지역별 요약</h3>

          <div class="rems-dropdown rems-dropdown--enhanced">
            <button
              class="rems-dropdown-btn"
              @click="toggleDropdown"
              @keydown.esc="dropdownOpen = false"
            >
              {{ selectedSido || "전국(시·도)" }}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                :style="{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }"
              >
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>

            <div v-if="dropdownOpen" class="rems-dropdown-panel">
              <input
                v-model="regionQuery"
                class="rems-dropdown-search"
                placeholder="시·도 검색"
                @keydown.esc="dropdownOpen = false"
              />

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
            </div>
          </div>
        </div>

        <div class="rems-table-wrap rems-table-sticky">
          <table class="rems-table rems-table-compact">
            <thead>
              <tr>
                <th>
                  {{ selectedSido ? selectedSido + " (시·군·구)" : "시·도" }}
                </th>
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

              <tr
                v-else
                v-for="r in regions"
                :key="r.name"
                class="rems-row-click zebra"
                :class="{ 'rems-active': r.name === selectedSigungu }"
                @click="onRowClick(r.name)"
              >
                <td>{{ r.name }}</td>
                <td class="rems-num">{{ nFmt(r.count) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

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
        </div>
      </article>
    </section>

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
          <button class="modal__close" @click="closeAbnModal" aria-label="닫기">
            ✕
          </button>
        </header>

        <div class="modal__tools">
          <div
            class="rems-seg seg-modern"
            role="tablist"
            aria-label="이상 사유 필터"
          >
            <button
              class="seg-pill"
              :class="{ active: reasonFilter === 'ALL' }"
              @click="reasonFilter = 'ALL'"
            >
              <span class="seg-dot" style="background-color: #999"></span>
              전체
              <span class="seg-count">{{ nFmt(totalAbnormal) }}</span>
            </button>

            <button
              class="seg-pill"
              :class="{ active: reasonFilter === 'FAULT_BIT' }"
              @click="reasonFilter = 'FAULT_BIT'"
            >
              <span class="seg-dot seg-fault"></span>
              고장
              <span class="seg-count">{{ nFmt(abn.summary.FAULT_BIT) }}</span>
            </button>

            <button
              class="seg-pill"
              :class="{ active: reasonFilter === 'OFFLINE' }"
              @click="reasonFilter = 'OFFLINE'"
            >
              <span
                class="seg-dot seg-offline"
                style="background-color: #ef4444"
              ></span>
              오프라인
              <span class="seg-count">{{ nFmt(abn.summary.OFFLINE) }}</span>
            </button>
          </div>

          <div class="modal__search">
            <input
              class="modal__input"
              v-model.trim="imeiQuery"
              @input="onSearchImei"
              placeholder="IMEI로 필터링"
            />
          </div>
        </div>

        <div class="rems-abn-summaryline modal__summary">
          <span class="abn-total">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 5h18v2H3zm4 6h10v2H7zm-4 6h18v2H3z"
              />
            </svg>
          </span>
        </div>

        <div class="rems-table-wrap rems-table-sticky modal__table">
          <table class="rems-table rems-table-compact">
            <thead>
              <tr>
                <th style="width: 260px">IMEI</th>
                <th style="width: 140px">이유</th>

                <th style="width: 220px">마지막 수신(KST)</th>
                <th v-if="reasonFilter !== 'OFFLINE'">고장 원인</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="abn.loading">
                <td colspan="6">
                  <div class="loading-wrapper">⏳ 불러오는 중…</div>
                </td>
              </tr>
              <tr v-else-if="!filteredAbnItems.length">
                <td colspan="6">표시할 데이터가 없습니다.</td>
              </tr>
              <tr
                v-else
                v-for="row in filteredAbnItems"
                :key="row.imei"
                class="zebra rems-row-click"
                @click="focusImei(row)"
              >
                <td class="mono">
                  <span>{{ row.imei }}</span>
                </td>
                <td>
                  <span :class="['rems-tag', reasonClass(row.reason)]">{{
                    row.reason
                  }}</span>
                </td>
                <td class="mono">
                  {{ toKst(row.last_time) }}
                </td>
                <td v-if="reasonFilter !== 'OFFLINE'">
                  <span class="rems-tag tag-fault">{{ faultReason(row) }}</span>
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
import { api } from "@/api";
import "@/assets/css/dashboard.css";
import "@/assets/css/dashboard_modal.css";
import CountUp from "@/components/CountUp.vue";

const SIGUN_LEVEL = 8;
const FOCUS_LEVEL = 7;
const REGION_BUBBLE_LEVEL = 9;

const DASH_CACHE_KEY = "rems_dash_swr_v1"; // 대시보드 통계 캐시
// [MAP SWR 수정 1] 지도 데이터 캐시 키 및 유효시간(30분) 설정
const MAP_POINTS_CACHE_KEY = "rems_map_points_v1";
const MAP_CACHE_TTL = 30 * 60 * 1000;

const PROVINCE_CENTERS = {
  서울특별시: { lat: 37.5665, lng: 126.978 },
  부산광역시: { lat: 35.1796, lng: 129.0756 },
  대구광역시: { lat: 35.8714, lng: 128.6014 },
  인천광역시: { lat: 37.4563, lng: 126.7052 },
  광주광역시: { lat: 35.1595, lng: 126.8526 },
  대전광역시: { lat: 36.3504, lng: 127.3845 },
  울산광역시: { lat: 35.5397, lng: 129.3114 },
  세종특별자치시: { lat: 36.48, lng: 127.289 },
  경기도: { lat: 37.4138, lng: 127.5183 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555 },
  충청북도: { lat: 36.6359, lng: 127.4917 },
  충청남도: { lat: 36.5184, lng: 126.8 },
  전북특별자치도: { lat: 35.7175, lng: 127.153 },
  전라남도: { lat: 34.8679, lng: 126.991 },
  경상북도: { lat: 36.4919, lng: 128.8889 },
  경상남도: { lat: 35.2383, lng: 128.6929 },
  제주특별자치도: { lat: 33.489, lng: 126.4983 },
};

export default {
  name: "HomePage",
  components: { CountUp },
  data() {
    return {
      reasonFilter: "ALL",
      cachedNormalItems: window.__CACHE_NORMAL || null,
      cachedAbnormalItems: window.__CACHE_ABNORMAL || null,
      dropdownOpen: false,
      regionQuery: "",
      mapMode: "NORMAL",
      abnModal: { open: false },
      mapLoading: false,
      sidos: [],
      regions: [],
      loadingRegions: false,
      selectedSido: "",
      selectedSigungu: "",
      sideList: [],
      abnByRegion: {},
      map: null,
      markers: [],
      regionBubbles: [],
      clusterer: null,
      geoCache: {},
      selectedPoint: null,
      loadingDash: true,
      totals: { total_plants: 0, normal_plants: 0, abnormal_plants: 0 },
      today: { total_messages: 0, devices: 0 },
      refreshMs: 60000,
      timerId: null,
      lastUpdated: null,
      energyLoading: true,
      energyError: "",
      energy: {
        electric: {
          today_kwh: 0,
          today_co2_ton: 0,
          capacity_kw: 0,
          cumulative_kwh: 0,
        },
        thermal: {
          today_kwh: 0,
          today_co2_ton: 0,
          collector_area_m2: 0,
          output_kw: 0,
          cumulative_kwh: 0,
        },
      },
      abn: {
        loading: false,
        offlineMin: 90,
        limit: 200,
        summary: { OFFLINE: 0 },
        items: [],
        msgs24hMax: 1,
      },
      imeiQuery: "",
      isRestored: false,
    };
  },

  created() {
    this.restoreState();

    this.restoreMapCache();

    this.timerId = setInterval(() => this.refreshAll(true), this.refreshMs);
    this.refreshAll(this.isRestored);
    this.loadSidos().then(() => this.loadRegions());
  },

  async mounted() {
    if (this.map) return;
    try {
      await this.loadKakaoFromServerKey();
      await this.$nextTick();
      this.initMap();
      await this.refreshMapPoints();
      this.renderMap();
      this.ensureMapReady();
      window.addEventListener("resize", this.onWindowResize);
      document.addEventListener("click", this.handleOutsideClick);
    } catch (e) {}
  },

  beforeDestroy() {
    if (this.timerId) clearInterval(this.timerId);
    this.clearMarkers();
    this.clearRegionBubbles();
    this.clearFocus();
    window.removeEventListener("resize", this.onWindowResize);
    document.removeEventListener("click", this.handleOutsideClick);
  },

  computed: {
    totalAbnormal() {
      const s = this.abn.summary;
      return (s.FAULT_BIT || 0) + (s.OFFLINE || 0);
    },
    uptimeRate() {
      const t = Number(this.totals?.total_plants || 0);
      const n = Number(this.totals?.normal_plants || 0);
      if (!t) return "0.0";
      return ((n / t) * 100).toFixed(1);
    },
    filteredAbnItems() {
      const q = this.imeiQuery.trim();
      let list = this.abn.items;
      if (this.reasonFilter !== "ALL") {
        list = list.filter((i) => i.reason === this.reasonFilter);
      }
      return q ? list.filter((i) => i.imei.includes(q)) : list;
    },
  },

  watch: {
    reasonFilter() {
      if (this.mapMode === "ABNORMAL") {
        this.refreshMapPoints();
      }
    },
  },

  methods: {
    onWindowResize() {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        if (this.map) {
          window.kakao.maps.event.trigger(this.map, "resize");
          // 중심점 유지 (선택 사항)
          // this.map.setCenter(this.savedCenter);
        }
      }, 200); // 0.2초 대기 후 실행
    },
    faultReason(row) {
      const flagsArr = row.fault_flags || row.flags_1h || [];
      if (!Array.isArray(flagsArr)) return "";
      const reasons = new Set();
      const MAP = [
        { bit: 0, label: "인버터 미작동" },
        { bit: 1, label: "태양전지 과전압" },
        { bit: 2, label: "태양전지 저전압" },
        { bit: 3, label: "태양전지 과전류" },
        { bit: 4, label: "인버터 IGBT 에러" },
        { bit: 5, label: "인버터 과온" },
        { bit: 6, label: "계통 과전압" },
        { bit: 7, label: "계통 저전압" },
        { bit: 8, label: "계통 과전류" },
        { bit: 9, label: "계통 과주파수" },
        { bit: 10, label: "계통 저주파수" },
        { bit: 11, label: "단독운전(정전)" },
        { bit: 12, label: "지락(누전)" },
      ];
      for (const f of flagsArr) {
        for (const m of MAP) {
          if (f & (1 << m.bit)) {
            reasons.add(m.label);
          }
        }
      }
      return [...reasons].join(", ");
    },
    energyName(code) {
      const map = {
        "01": "태양광",
        "02": "태양열",
        "03": "지열",
        "04": "풍력",
        "06": "연료전지",
        "07": "ESS",
      };
      if (!code) return "미등록";
      return map[String(code).padStart(2, "0")] || "기타";
    },

    restoreState() {
      try {
        const cached = localStorage.getItem(DASH_CACHE_KEY);
        if (!cached) return;
        const d = JSON.parse(cached);
        this.totals = d.totals || this.totals;
        this.today = d.today || this.today;
        this.energy = d.energy || this.energy;
        this.abn.summary = d.abnSummary || this.abn.summary;
        this.lastUpdated = d.lastUpdated || null;
        this.loadingDash = false;
        this.energyLoading = false;
        this.abn.loading = false;
        this.isRestored = true;
      } catch (e) {
        console.warn("Cache restore failed", e);
      }
    },
    saveState() {
      try {
        const data = {
          totals: this.totals,
          today: this.today,
          energy: this.energy,
          abnSummary: this.abn.summary,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(DASH_CACHE_KEY, JSON.stringify(data));
      } catch (e) {}
    },

    restoreMapCache() {
      try {
        const cachedStr = localStorage.getItem(MAP_POINTS_CACHE_KEY);
        if (!cachedStr) return;
        const parsed = JSON.parse(cachedStr);
        const now = Date.now();

        if (now - parsed.timestamp < MAP_CACHE_TTL) {
          if (parsed.normalItems && parsed.normalItems.length) {
            this.cachedNormalItems = parsed.normalItems;
            window.__CACHE_NORMAL = parsed.normalItems;
            console.log(
              `[MAP SWR] Restored ${parsed.normalItems.length} normal points.`
            );
          }
        } else {
          localStorage.removeItem(MAP_POINTS_CACHE_KEY);
        }
      } catch (e) {
        console.warn("Map cache restore failed", e);
      }
    },

    saveMapCache(normalItems) {
      try {
        const data = { timestamp: Date.now(), normalItems: normalItems || [] };
        localStorage.setItem(MAP_POINTS_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        if (e.name === "QuotaExceededError") {
          console.warn("LocalStorage full, clearing old caches...");
          localStorage.clear();
        }
      }
    },

    async refreshAll(isBackground = false) {
      window.__CACHE_ABNORMAL = null;

      try {
        await Promise.all([
          this.loadBasic(isBackground),
          this.loadEnergy(isBackground),
          this.loadAbnormal(isBackground),
        ]);
        this.lastUpdated = new Date().toISOString();
        this.saveState();

        if (isBackground && this.mapMode === "ABNORMAL") {
          this.refreshMapPoints();
        }
      } catch (e) {}
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    filteredRegions(group) {
      const keyword = this.regionQuery.trim();
      const metro = [
        "서울특별시",
        "부산광역시",
        "대구광역시",
        "인천광역시",
        "광주광역시",
        "대전광역시",
        "울산광역시",
        "세종특별자치시",
      ];
      const provinces = [
        "경기도",
        "강원특별자치도",
        "충청북도",
        "충청남도",
        "전북특별자치도",
        "전라남도",
        "경상북도",
        "경상남도",
        "제주특별자치도",
      ];
      const list = group === "metro" ? metro : provinces;
      return keyword ? list.filter((r) => r.includes(keyword)) : list;
    },
    selectSido(name) {
      this.selectedSido = name;
      this.dropdownOpen = false;
      this.regionQuery = "";
      this.cachedAbnormalItems = null;
      this.onSelectSido();
    },
    handleOutsideClick(e) {
      const dropdown = this.$el.querySelector(".rems-dropdown");
      if (dropdown && !dropdown.contains(e.target)) {
        this.dropdownOpen = false;
      }
    },
    setMapMode(mode) {
      if (this.mapLoading || this.mapMode === mode) return;
      this.mapMode = mode;
      this.selectedPoint = null;
      this.refreshMapPoints();
    },

    async refreshMapPoints(isBackground = false) {
      if (this._refreshing) return;
      this._refreshing = true;

      if (!isBackground) {
        this.selectedPoint = null;
      }

      let hasCache = false;
      if (this.mapMode === "NORMAL" && this.cachedNormalItems) hasCache = true;
      if (this.mapMode === "ABNORMAL" && this.cachedAbnormalItems)
        hasCache = true;

      if (!isBackground) {
        this.mapLoading = !hasCache;
      }

      this.clearMarkers();
      this.clearRegionBubbles();

      try {
        if (!this.map) return;
        const currentMode = this.mapMode;

        if (this.mapMode === "ABNORMAL") {
          const level = this.map.getLevel();
          if (level > REGION_BUBBLE_LEVEL) {
            await this.loadRegions();
            await this.drawRegionClusters();
          } else {
            await this.drawAbnormalPoints({
              reason: this.reasonFilter,
              sido: this.selectedSido,
              sigungu: this.selectedSigungu,
            });
          }
        } else if (this.mapMode === "NORMAL") {
          await this.drawNormalPoints();
        }

        if (this.mapMode !== currentMode) return;
      } catch (e) {
      } finally {
        if (!isBackground) {
          this.mapLoading = false;
        }
        this._refreshing = false;
      }
    },

    async drawNormalPoints() {
      if (!this.map) return;
      this.clearMarkers();
      this.clearRegionBubbles();

      let items = [];

      if (this.cachedNormalItems) {
        items = this.cachedNormalItems;
      } else if (window.__CACHE_NORMAL) {
        items = window.__CACHE_NORMAL;
        this.cachedNormalItems = items;
      } else {
        const preload = window.__NORMAL_POINTS__;
        items =
          Array.isArray(preload) && preload.length
            ? preload
            : (
                await api.get("/dashboard/normal/points", {
                  params: { lookbackDays: 3 },
                })
              ).data?.items || [];

        this.cachedNormalItems = items;
        window.__CACHE_NORMAL = items;
        this.saveMapCache(items);
      }

      const kakao = window.kakao;
      const markers = [];
      const svgContent = encodeURIComponent(
        `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.5)"/></filter></defs>
            <circle cx="12" cy="12" r="7" fill="#02A39F" stroke="#ffffff" stroke-width="2.5" style="filter:url(#shadow);"/>
            </svg>`.trim()
      );
      const markerImage = new kakao.maps.MarkerImage(
        `data:image/svg+xml;utf8,${svgContent}`,
        new kakao.maps.Size(24, 24),
        { offset: new kakao.maps.Point(12, 12) }
      );

      if (this.clusterer) this.clusterer.clear();
      this.clusterer = new kakao.maps.MarkerClusterer({
        map: this.map,
        averageCenter: true,
        minLevel: 9,
        disableClickZoom: false,
        styles: [
          {
            width: "40px",
            height: "40px",
            background: "#02A39F",
            borderRadius: "50%",
            color: "#fff",
            textAlign: "center",
            lineHeight: "40px",
            fontWeight: "bold",
            fontSize: "14px",
            border: "3px solid #ffffff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          },
        ],
      });

      for (const pt of items) {
        const coord = await this.ensureCoordForPoint(pt);
        if (!coord) continue;
        const latlng = new kakao.maps.LatLng(coord.lat, coord.lng);
        const marker = new kakao.maps.Marker({
          position: latlng,
          image: markerImage,
        });
        kakao.maps.event.addListener(marker, "click", () => {
          this.selectedPoint = {
            imei: pt.imei,
            reason: pt.reason || "NORMAL",
            address: pt.address,
            sido: pt.sido,
            sigungu: pt.sigungu,
            last_time: pt.last_time,
          };
          this.focusImei(pt);
        });
        markers.push(marker);
      }

      this.clusterer.addMarkers(markers);
      this.markers = markers;
    },

    nFmt(n) {
      if (n == null || Number.isNaN(Number(n))) return "—";
      try {
        return Number(n).toLocaleString();
      } catch {
        return String(n);
      }
    },
    dFmt(n, digits = 3) {
      if (n == null || Number.isNaN(Number(n))) return "—";
      if (n > 1e9)
        return (n / 1e9).toLocaleString(undefined, {
          maximumFractionDigits: digits,
        });
      return Number(n).toLocaleString(undefined, {
        maximumFractionDigits: digits,
      });
    },
    rawTip(n, unit = "") {
      if (n == null || Number.isNaN(Number(n))) return "";
      return `${n} ${unit}`.trim();
    },
toKst(iso) {
  if (!iso) return "-";
  return iso; 
},
    fromNow(isoOrDate) {
      const base =
        typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
      const mins = (Date.now() - base.getTime()) / 60000;
      if (mins < 60) return `${mins.toFixed(0)}분 전`;
      const hours = mins / 60;
      if (hours < 48) return `${hours.toFixed(1)}시간 전`;
      return `${(hours / 24).toFixed(1)}일 전`;
    },
    reasonClass(reason) {
      if (reason === "OFFLINE") return "tag-offline";
      if (reason === "FAULT_BIT") return "tag-fault";
      return "tag-default";
    },
    barWidth(v) {
      const pct = Math.round((v / this.abn.msgs24hMax) * 100);
      return Math.min(100, pct) + "%";
    },
    async copy(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    },
    onSearchImei() {},

    async loadBasic(isBackground = false) {
      if (!isBackground) this.loadingDash = true;
      try {
        const { data } = await api.get("/dashboard/basic", {
          params: { lookbackDays: 3 },
        });
        if (data && data.totals) {
          this.totals = {
            total_plants: data.totals.total_plants || 0,
            normal_plants: data.totals.normal_plants || 0,
            abnormal_plants: data.totals.abnormal_plants || 0,
          };
        }
        if (data && data.today) {
          this.today = data.today;
        }
        const opCnt = data?.summary?.OPMODE_ABNORMAL || 0;
        if (this.totals) {
          this.totals.normal_plants = (this.totals.normal_plants || 0) + opCnt;
        }
      } catch (err) {
        console.error("Dashboard Load Failed:", err);
      } finally {
        this.loadingDash = false;
      }
    },

    async loadEnergy(isBackground = false) {
      if (!isBackground) this.energyLoading = true;
      this.energyError = "";
      try {
        const { data } = await api.get("/dashboard/energy");
        if (data && data.ok !== false) {
          const src = data.data || data;
          this.energy.electric = src.electric || this.energy.electric;
          this.energy.thermal = src.thermal || this.energy.thermal;
        } else {
          this.energyError =
            data && data.error ? String(data.error) : "알 수 없는 에러";
        }
      } catch (e) {
      } finally {
        this.energyLoading = false;
      }
    },

    async loadAbnormal(isBackground = false) {
      if (!isBackground) this.abn.loading = true;
      try {
        const sum = await api.get("/dashboard/abnormal/summary", {
          params: { offlineMin: this.abn.offlineMin },
        });
        this.abn.summary = sum.data?.summary || this.abn.summary;
        const list = await api.get("/dashboard/abnormal/list", {
          params: { offlineMin: this.abn.offlineMin, limit: this.abn.limit },
        });
        this.abn.items = (list.data?.items || []).filter(
          (i) => i.reason !== "OPMODE_ABNORMAL"
        );
        this.abn.msgs24hMax = Math.max(
          1,
          ...this.abn.items.map((i) => i.msgs_24h || 0)
        );
        await this.loadRegions();
      } catch (e) {
      } finally {
        this.abn.loading = false;
      }
    },

    onOfflineMinChange() {
      this.loadAbnormal();
    },

    async loadAbnormalByRegion() {
      const params = {
        lookbackDays: 3,
        offlineMin: this.abn.offlineMin || 90,
        level: this.selectedSido ? "sigungu" : "sido",
      };
      if (this.selectedSido) params.sido = this.selectedSido;
      try {
        const { data } = await api.get("/dashboard/abnormal/by-region", {
          params,
        });
        const m = {};
        for (const it of data?.items || []) {
          const key = this.selectedSido
            ? `${it.sido}/${it.sigungu || ""}`
            : it.sido;
          m[key] = (it.FAULT_BIT || 0) + (it.OFFLINE || 0);
        }
        this.abnByRegion = m;
      } catch (e) {
        this.abnByRegion = {};
      }
    },

    async loadSidos() {
      try {
        const { data } = await api.get("/rems/agg/sido");
        this.sidos = data || [];
        if (!this.selectedSido) this.sideList = this.sidos.map((s) => s.name);
      } catch (e) {}
    },

    async loadRegions() {
      const isNational = !this.selectedSido;
      if (isNational && window.__CACHE_REGIONS) {
        this.regions = window.__CACHE_REGIONS;
        this.sideList = this.regions.map((r) => r.name);
        this.loadingRegions = false;
      } else {
        this.loadingRegions = true;
      }
      try {
        if (!this.selectedSido) {
          const { data } = await api.get("/rems/agg/sido");
          this.regions = (data || []).map((r) => ({
            name: r.name,
            count: r.count,
          }));
          this.sideList = this.regions.map((r) => r.name);
        } else {
          const { data } = await api.get("/rems/agg/sigungu", {
            params: { sido: this.selectedSido },
          });
          this.regions = (data || []).map((r) => ({
            name: r.name,
            count: r.count,
          }));
          this.sideList = this.regions.map((r) => r.name);
        }
        await this.loadAbnormalByRegion();
        if (!this.selectedSido) {
          this.regions = this.regions.map((r) => {
            const abnormal = this.abnByRegion[r.name] || 0;
            const rate = r.count > 0 ? 100 * (1 - abnormal / r.count) : null;
            return { ...r, abnormal, rate };
          });
          window.__CACHE_REGIONS = this.regions;
        } else {
          this.regions = this.regions.map((r) => {
            const key = `${this.selectedSido}/${r.name}`;
            const abnormal = this.abnByRegion[key] || 0;
            const rate = r.count > 0 ? 100 * (1 - abnormal / r.count) : null;
            return { ...r, abnormal, rate };
          });
        }
        this.renderMap();
      } catch (e) {
        if (!this.regions.length) this.regions = [];
      } finally {
        this.loadingRegions = false;
      }
    },
    async loadKakaoFromServerKey() {
      if (window.kakao && window.kakao.maps) return;
      const { data } = await api.get("/rems/kakao-jskey");
      const JS_KEY = data?.key;
      if (!JS_KEY) throw new Error("No KAKAO_JS_KEY from server");
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false&libraries=services,clusterer`;
        s.onload = () => {
          window.kakao.maps.load(resolve);
        };
        s.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
        document.head.appendChild(s);
      });
    },
    initMap() {
      const kakao = window.kakao;
      this.map = new kakao.maps.Map(this.$refs.kmap, {
        center: new kakao.maps.LatLng(36.5, 127.8),
        level: 12,
      });
      kakao.maps.event.addListener(this.map, "zoom_changed", async () => {
        const level = this.map.getLevel();
        if (this.mapMode === "ABNORMAL") {
          if (level > REGION_BUBBLE_LEVEL) {
            this.clearMarkers();
            if (!this.regions.length) await this.loadRegions();
            this.drawRegionClusters();
          } else {
            this.clearRegionBubbles();
            await this.drawAbnormalPoints({
              reason: this.reasonFilter,
              sido: this.selectedSido,
              sigungu: this.selectedSigungu,
            });
          }
        } else {
          this.clearRegionBubbles();
        }
        this.renderMap();
      });
    },
    ensureMapReady() {
      const trigger = () => {
        if (!this.map) return;
        if (this.$refs.kmap && this.$refs.kmap.offsetHeight > 0)
          window.kakao.maps.event.trigger(this.map, "resize");
      };
      trigger();
      setTimeout(trigger, 200);
      setTimeout(trigger, 800);
    },
    onWindowResize() {
      if (this.map) window.kakao.maps.event.trigger(this.map, "resize");
    },
    clearMarkers() {
      this.markers.forEach((m) => {
        if (!m) return;
        if (m.setMap) m.setMap(null);
        if (m.overlay && m.overlay.setMap) m.overlay.setMap(null);
        if (m.tip && m.tip.setMap) m.tip.setMap(null);
      });
      this.markers = [];
      if (this.regionBubbles && this.regionBubbles.length) {
        this.regionBubbles.forEach((b) => {
          if (b && b.setMap) b.setMap(null);
        });
        this.regionBubbles = [];
      }
      if (this.clusterer) {
        this.clusterer.clear();
      }
    },
    clearRegionBubbles() {
      this.regionBubbles.forEach((b) => b && b.setMap && b.setMap(null));
      this.regionBubbles = [];
    },
    clearFocus() {
      if (this.focusCircle) {
        this.focusCircle.setMap(null);
        this.focusCircle = null;
      }
      if (this.focusPulse) {
        this.focusPulse.setMap(null);
        this.focusPulse = null;
      }
    },
    reasonColor(reason) {
      if (!reason) return "#22c55e";
      const R = String(reason).toUpperCase();
      if (R === "FAULT_BIT") return "#facc15";
      if (R === "OFFLINE") return "#6b7280";
      return "#22c55e";
    },
    makeMarkerEl(pt) {
      const el = document.createElement("div");
      el.className = "rems-marker rems-marker-fadein";
      const color = this.reasonColor(pt?.reason);
      el.style.borderColor = color;
      el.innerHTML = `<div class="rems-marker-dot" style="background:${color}; width:14px; height:14px; border-radius:50%; box-shadow:0 0 6px ${color}80;"></div>`;
      el.onclick = () => {
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
          worker: pt.worker ?? null,
        };
        this.focusImei(pt);
      };
      return el;
    },
    addMarker(latlng, pt) {
      const kakao = window.kakao;
      const el = this.makeMarkerEl(pt);
      const tip = document.createElement("div");
      tip.className = "rems-marker-tooltip";
      const addr = pt.address || "(주소 미등록)";
      const region = `${pt.sido || ""} ${pt.sigungu || ""}`.trim();
      const last = pt.last_time ? this.fromNow(pt.last_time) : "—";
      tip.innerHTML = `<strong>${addr}</strong><br/><small>${region}</small><br/><small>📡 ${last}</small>`;
      const tipOverlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: tip,
        yAnchor: 1.8,
        zIndex: 999,
      });
      el.addEventListener("mouseenter", () => tipOverlay.setMap(this.map));
      el.addEventListener("mouseleave", () => tipOverlay.setMap(null));
      const z = pt.reason === "OFFLINE" ? 300 : 200;
      const overlay = new kakao.maps.CustomOverlay({
        position: latlng,
        content: el,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: z,
      });
      overlay.setMap(this.map);
      this.markers.push({ overlay, tip: tipOverlay });
    },
    async ensureCoordForPoint(pt) {
      if (pt.lat && pt.lon && pt.lat !== 0 && pt.lon !== 0) {
        const c = { lat: pt.lat, lng: pt.lon };
        localStorage.setItem(`coord:imei:${pt.imei}`, JSON.stringify(c));
        return c;
      }
      const k1 = `coord:imei:${pt.imei}`;
      let c = JSON.parse(localStorage.getItem(k1) || "null");
      if (c && c.lat && c.lng) return c;
      const hint = pt.address || `${pt.sido || ""} ${pt.sigungu || ""}`.trim();
      const k2 = `coord:addr:${hint}`;
      c = JSON.parse(localStorage.getItem(k2) || "null");
      if (!c) {
        try {
          let data;
          if (hint) {
            const q = pt.address ? pt.address : `대한민국 ${hint}`.trim();
            const res = await api.get("/rems/geocode", {
              params: { query: q },
            });
            data = res.data;
          } else {
            const res = await api.get("/rems/geocode", {
              params: { imei: pt.imei },
            });
            data = res.data;
          }
          const d0 = (data?.results || [])[0] || data;
          if (d0?.lat && d0?.lon) c = { lat: d0.lat, lng: d0.lon };
          else if (d0?.y && d0?.x) c = { lat: d0.y, lng: d0.x };
          if (c) {
            localStorage.setItem(k2, JSON.stringify(c));
            localStorage.setItem(k1, JSON.stringify(c));
          }
        } catch (e) {
          return null;
        }
      }
      if (!c || !c.lat || !c.lng) return null;
      return c;
    },
    async drawAbnormalPoints({ reason = "ALL", sido = "", sigungu = "" } = {}) {
      if (!this.map || this.mapMode !== "ABNORMAL") return;
      this.clearMarkers();
      this.clearRegionBubbles();
      const params = { offlineMin: this.abn.offlineMin || 90, lookbackDays: 3 };
      if (reason !== "ALL") params.reason = reason;
      if (sido) params.sido = sido;
      if (sigungu) params.sigungu = sigungu;
      try {
        let items = [];
        const isDefaultFilter = reason === "ALL" && !sido && !sigungu;
        if (isDefaultFilter && this.cachedAbnormalItems) {
          items = this.cachedAbnormalItems;
        } else if (isDefaultFilter && window.__CACHE_ABNORMAL) {
          items = window.__CACHE_ABNORMAL;
          this.cachedAbnormalItems = items;
        } else {
          const { data } = await api.get("/dashboard/abnormal/points", {
            params,
          });
          items = data?.items || [];
          if (isDefaultFilter) {
            this.cachedAbnormalItems = items;
            window.__CACHE_ABNORMAL = items;
          }
        }
        const kakao = window.kakao;
        for (const pt of items) {
          const coord = await this.ensureCoordForPoint(pt);
          if (!coord) continue;
          const latlng = new kakao.maps.LatLng(coord.lat, coord.lng);
          this.addMarker(latlng, pt);
        }
      } catch (err) {}
    },
    async drawRegionClusters() {
      const kakao = window.kakao;
      this.clearRegionBubbles();
      this.clearMarkers();
      try {
        const params = {
          reason: "ALL",
          offlineMin: this.abn?.offlineMin || 30,
          lookbackDays: 3,
        };
        if (this.selectedSido) params.sido = this.selectedSido;
        if (this.selectedSigungu) params.sigungu = this.selectedSigungu;
        const { data } = await api.get("/dashboard/abnormal/points", {
          params,
        });
        const items = data?.items || [];
        for (const pt of items) {
          const coord = await this.ensureCoordForPoint(pt);
          if (!coord) continue;
          const latlng = new kakao.maps.LatLng(coord.lat, coord.lng);
          const el = this.makeMarkerEl(pt);
          const overlay = new kakao.maps.CustomOverlay({
            position: latlng,
            content: el,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 200,
          });
          overlay.setMap(this.map);
          this.regionBubbles.push(overlay);
        }
      } catch (err) {}
    },
    showFocus(latlng, radius = 8000, label = "") {
      this.clearFocus();
      return;
    },
async focusImei(ptOrRow) {
      const kakao = window.kakao;
      if (this.abnModal.open && this.mapMode !== "ABNORMAL") {
        this.mapMode = "ABNORMAL";
        await this.refreshMapPoints();
      }
      const pt = {
        imei: ptOrRow.imei,
        reason: ptOrRow.reason || "NORMAL",
        address: ptOrRow.address,
        sido: ptOrRow.sido,
        sigungu: ptOrRow.sigungu,
        last_time: ptOrRow.last_time,
        energy: ptOrRow.energy ?? null,
        type: ptOrRow.type ?? null,
        multi: ptOrRow.multi ?? null,
        worker: ptOrRow.worker ?? null,
      };

      const coord = await this.ensureCoordForPoint(ptOrRow);

      if (!coord) {
        const msg = ptOrRow.display_message 
          || "장비는 등록되었으나 주소 등록이 안되었습니다.\n상세 모니터링에서 검색 후 조회해주세요.";
        
        alert(msg); 
        return;
      }

      const latlng = new kakao.maps.LatLng(coord.lat, coord.lng);
      if (this.abnModal.open) {
        this.map.setLevel(7, { animate: true });
      }
      this.map.panTo(latlng);
      this.showFocus(latlng, 3000, pt.imei);
      this.selectedPoint = pt;
      if (this.abnModal.open) {
        this.closeAbnModal();
      }
      this.$nextTick(() => {
        const mapEl = this.$refs.kmap;
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    },
    async renderMap() {
      if (!this.map) return;
      if (this.selectedSigungu) {
        const key = `${this.selectedSido}/${this.selectedSigungu}`;
        const coord =
          this.geoCache[key] ||
          JSON.parse(localStorage.getItem(`geo:${key}`) || "null");
        if (coord)
          this.showFocus(
            new window.kakao.maps.LatLng(coord.lat, coord.lng),
            5000,
            this.selectedSigungu
          );
      } else if (this.selectedSido) {
        const c = PROVINCE_CENTERS[this.selectedSido];
        if (c)
          this.showFocus(
            new window.kakao.maps.LatLng(c.lat, c.lng),
            15000,
            this.selectedSido
          );
      } else {
        this.clearFocus();
      }
    },
    async focusSigungu(sigunguName) {
      if (!this.selectedSido) return;
      const key = `${this.selectedSido}/${sigunguName}`;
      let coord =
        this.geoCache[key] ||
        JSON.parse(localStorage.getItem(`geo:${key}`) || "null");
      if (!coord) {
        try {
          const q = `대한민국 ${this.selectedSido} ${sigunguName}`;
          const { data } = await api.get("/rems/geocode", {
            params: { query: q },
          });
          const d0 = (data?.results || [])[0];
          if (d0) coord = { lat: d0.y, lng: d0.x };
        } catch {}
        if (!coord) return;
        this.geoCache[key] = coord;
        localStorage.setItem(`geo:${key}`, JSON.stringify(coord));
      }
      const kakao = window.kakao;
      this.selectedSigungu = sigunguName;
      const latlng = new kakao.maps.LatLng(coord.lat, coord.lng);
      this.map.setLevel(FOCUS_LEVEL, { animate: true });
      this.map.panTo(latlng);
      this.renderMap();
      await this.refreshMapPoints();
    },
    async onRowClick(name) {
      if (!this.selectedSido) {
        this.selectedSido = name;
        this.selectedSigungu = "";
        await this.onSelectSido();
      } else {
        await this.focusSigungu(name);
      }
    },
    async onSelectSido() {
      this.selectedSigungu = "";
      this.selectedPoint = null;
      if (!this.selectedSido) {
        this.loadRegions();
        this.map.setLevel(12, { animate: true });
        this.map.panTo(new window.kakao.maps.LatLng(36.5, 127.8));
      } else {
        const c = PROVINCE_CENTERS[this.selectedSido];
        if (c) {
          this.map.setLevel(SIGUN_LEVEL, { animate: true });
          this.map.panTo(new window.kakao.maps.LatLng(c.lat, c.lng));
        }
        this.loadRegions();
      }
      await this.refreshMapPoints();
      this.ensureMapReady();
    },
    handleSideClick(name) {
      if (!this.selectedSido) {
        this.selectedSido = name;
        this.selectedSigungu = "";
        this.onSelectSido();
      } else {
        this.focusSigungu(name);
      }
    },
    resetAll() {
      this.selectedSido = "";
      this.selectedSigungu = "";
      this.selectedPoint = null;
      this.cachedAbnormalItems = null;
      this.onSelectSido();
    },
    resetToSido() {
      if (!this.selectedSido) return;
      this.selectedSigungu = "";
      this.selectedPoint = null;
      this.cachedAbnormalItems = null;
      this.onSelectSido();
    },
    rateClass(rate) {
      if (rate == null) return "";
      if (rate >= 95) return "rate-ok";
      if (rate >= 80) return "rate-warn";
      return "rate-bad";
    },
    openAbnModal() {
      this.abnModal.open = true;
      this.$nextTick(() => {
        this.$refs.abnModal?.querySelector?.(".modal__close")?.focus?.();
      });
    },
    closeAbnModal() {
      this.abnModal.open = false;
    },
  },
};
</script>
