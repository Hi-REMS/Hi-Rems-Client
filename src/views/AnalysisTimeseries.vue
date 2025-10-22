<!-- src/views/AnalysisTimeseries.vue -->
<template>
  <div class="ts-page">
    <!-- SEARCH BAR -->
    <section class="toolbar">
      <div class="tool-left">
        <label class="lbl">IMEI</label>
        <input
          v-model.trim="imeiField"
          @keyup.enter="onSearch"
          class="input"
          type="text"
          placeholder="예) 03-58-48-00-70-54-06-06"
        />
        <label class="lbl">에너지</label>
        <select v-model="energyField" class="input sel">
          <option value="01">태양광(0x01)</option>
          <option value="">전체</option>
        </select>
        <label class="lbl">타입</label>
        <select v-model="typeField" class="input sel" :disabled="energyField!=='01'">
          <option value="">전체</option>
          <option value="01">단상(0x01)</option>
          <option value="02">삼상(0x02)</option>
        </select>
        <label class="chk">
          <input type="checkbox" v-model="onlyOk" />
          정상 프레임만(0x00)
        </label>
      </div>

      <div class="tool-right">
        <button class="btn ghost" :disabled="loading" @click="resetAll">초기화</button>
        <button class="btn primary" :disabled="loading" @click="onSearch">
          <span v-if="!loading">조회</span>
          <span v-else class="btn-spinner" aria-hidden="true"></span>
        </button>
      </div>
    </section>

    <!-- KPI ROW -->
    <section class="kpi-row">
      <div v-for="k in kpis" :key="k.key" class="kpi">
        <div class="kpi-hd">
          <span class="kpi-title">{{ k.title }}</span>
          <span class="kpi-ico">⋯</span>
        </div>
        <div class="kpi-main">
          <span class="kpi-value">{{ valueFor(k.key) }}</span>
          <span class="kpi-unit">{{ k.unit }}</span>
        </div>
        <div class="kpi-sub">{{ subFor(k.key) }}</div>
      </div>
    </section>

    <!-- CHART + (우측) 설비정보  -->
    <section class="row">
      <article class="card col-9">
        <div class="card-hd">
          <h3>시간대별 그래프</h3>

          <div class="card-actions">
            <div v-if="selectedMulti" class="chip">
              {{ multiLabel(selectedMulti) }} 보기
            </div>
            <button
              class="btn ghost sm"
              :disabled="!selectedMulti"
              @click="clearMulti"
              title="전체 합산 그래프로 돌아가기"
            >
              전체보기
            </button>
          </div>
        </div>

        <!-- 조회 후 -->
        <template v-if="imeiUse">
          <div class="chart-placeholder" v-if="bars.length">
            <svg
              ref="svg"
              viewBox="0 0 1000 360"
              class="svg-chart"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"  stop-color="#34f5e5" stop-opacity="1"/>
                  <stop offset="100%" stop-color="#34f5e5" stop-opacity=".38"/>
                </linearGradient>
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.28"/>
                </filter>
              </defs>

              <!-- grid -->
              <g class="grid">
                <line v-for="(t, i) in yTicks" :key="'gy'+i" :x1="pad.l" :x2="vb.w-pad.r" :y1="t.y" :y2="t.y"/>
              </g>

              <!-- left axis -->
              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
                <g v-for="(t,i) in yTicks" :key="'yl'+i">
                  <text :x="pad.l-6" :y="t.y+4" text-anchor="end">{{ t.label }}</text>
                </g>
                <text :x="pad.l-6" :y="pad.t-6" text-anchor="end" class="axis-title">kWh</text>
              </g>

              <!-- bottom axis -->
              <g class="axis axis-bottom">
                <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
                <g v-for="(x,i) in xTicks" :key="'xt'+i">
                  <line :x1="x.x" :x2="x.x" :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
                  <text :x="x.x" :y="vb.h-pad.b+18" text-anchor="middle">{{ x.label }}</text>
                </g>
              </g>

              <!-- bars -->
              <g fill="url(#barGrad)" filter="url(#dropShadow)">
                <rect v-for="(b, i) in bars" :key="'b'+i" class="bar" :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="4"/>
              </g>

              <!-- bar labels -->
              <g class="bar-labels">
                <text
                  v-for="(b, i) in bars"
                  :key="'lbl'+i"
                  class="bar-label"
                  :x="b.xCenter"
                  :y="Math.max(8, b.y-6)"
                  text-anchor="middle"
                >
                  {{ b.rawNull ? '' : formatKwh1(b.kw) }}
                </text>
              </g>

              <!-- line -->
              <path v-if="bars.length" :d="linePath" class="line"/>
              <g class="line-dots" v-if="bars.length">
                <circle v-for="(b,i) in bars" :key="'dot'+i" class="line-dot" :cx="b.xCenter" :cy="b.y" r="3"/>
              </g>

              <!-- interaction -->
              <g v-if="hoverIdx !== null">
                <line class="hover-line" :x1="hoverX" :x2="hoverX" :y1="pad.t" :y2="vb.h-pad.b"/>
                <circle class="dot" :cx="hoverX" :cy="hoverLineY" r="4"/>
                <g :transform="tooltipTransform">
                  <rect class="tt" :width="tt.w" :height="tt.h" rx="8"/>
                  <text class="tt-text" x="10" y="18">시간: {{ hoverLabel }}</text>
                  <text class="tt-text" x="10" y="36">발전량: {{ hoverKw === null ? '—' : formatKwh1(hoverKw) }} kWh </text>
                </g>
              </g>

              <rect class="hit" :x="pad.l" :y="pad.t" :width="inner.w" :height="inner.h"
                    @mousemove="onMove" @mouseleave="onLeave"/>
            </svg>

            <div class="legend">
              <span class="dot"></span>
              {{ selectedMulti ? '선택 설비 발전량(kWh)' : '합산 발전량(kWh)' }}
              <span class="sep">•</span>
              <span class="linekey"></span> 꼭짓점 연결선
            </div>
          </div>

          <div class="chart-placeholder" v-else>
            <div class="legend">
              <span class="dot"></span> 발전량(kWh)
              <span class="sep">•</span>
              <span class="linekey"></span> 꼭짓점 연결선
            </div>
          </div>
        </template>

        <!-- 조회 전 -->
        <template v-else>
          <div class="chart-placeholder" style="height:360px;"></div>
        </template>
      </article>

      <!-- ▼ 설비정보 -->
      <article class="card col-3">
        <div class="card-hd">
          <h3>설비정보</h3>
          <div class="card-actions">
            <button
              v-if="imeiUse && !hasFacility"
              class="btn primary sm"
              @click="openFacilityEditor(false)"
            >설비정보 등록</button>
            <button
              v-if="imeiUse && hasFacility"
              class="btn ghost sm"
              @click="openFacilityEditor(true)"
            >수정</button>
          </div>
        </div>

        <div class="facility-card">
          <div v-if="facilityInfo.image" class="facility-img">
            <img :src="facilityInfo.image" :alt="facilityInfo.projectName || '설비 이미지'"/>
          </div>
          <ul class="kv">
            <li><span>모듈 용량</span><strong>{{ facilityInfo.moduleCapacity || '—' }}</strong></li>
            <li><span>설치일</span><strong>{{ facilityInfo.installDate || '—' }}</strong></li>
            <li><span>모니터링 시작</span><strong>{{ facilityInfo.monitorStart || '—' }}</strong></li>
            <li><span>사업명</span><strong>{{ facilityInfo.projectName || '—' }}</strong></li>
            <li><span>시공사</span><strong>{{ facilityInfo.contractor || '—' }}</strong></li>
            <li><span>A/S연락처</span><strong>{{ facilityInfo.asContact || '—' }}</strong></li>
          </ul>
        </div>
      </article>
    </section>

    <!-- BOTTOM GRID -->
    <section class="row">
      <article class="card col-9">
        <div class="card-hd">
          <h3>운전이력</h3>
          <div class="card-actions"></div>
        </div>

        <div class="table-wrap thin-scroll">
          <table class="tbl compact">
            <colgroup>
              <col style="width:56px" />
              <col style="width:170px" />
              <col style="width:90px" />
              <col />
              <col style="width:170px" />
              <col style="width:100px" />
              <col style="width:110px" />
              <col style="width:110px" />
              <col style="width:110px" />
              <col style="width:120px" />
              <col style="width:110px" />
              <col style="width:120px" />
              <col style="width:90px" />
              <col style="width:100px" />
              <col style="width:140px" />
            </colgroup>
            <thead>
              <tr>
                <th>NO</th>
                <th style="position : relative; left: 3%;">RTU IMEI</th>
                <th>멀티 ID</th>
                <th style="position : relative; left: 3%;">수집일시</th>
                <th>데이터 상태</th>
                <th style="position : relative; left: 2%;">PV전압(V)</th>
                <th style="position : relative; left: 2%;">PV전류(A)</th>
                <th style="position : relative; left: 2%;">PV출력(W)</th>
                <th style="position : relative; left: 2%;">계통전압(V)</th>
                <th style="position : relative; left: 2%;">계통전류(A)</th>
                <th style="position : relative; left: 2%;">현재출력(W)</th>
                <th style="position : relative; left: 2%;">역률(%)</th>
                <th style="position : relative; left: 2%;">주파수(Hz)</th>
                <th style="position : relative; left: 2%;">누적발전량(kWh)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r,i) in driverRows"
                :key="'drv'+i"
                class="row-click"
                :title="r.multiId ? (multiLabel(r.multiId)+' 차트 보기') : ''"
                @click="r.multiId && onSelectUnit(r.multiId)"
              >
                <td class="mono">{{ i+1 }}</td>
                <td class="mono">{{ r.imei }}</td>
                <td class="mono">{{ r.multiId || '—' }}</td>
                <td class="mono">{{ r.collectedAt || '—' }}</td>
                <td>{{ r.status || '정상' }}</td>
                <td class="num">{{ fmt(r.pvV, 0) }}</td>
                <td class="num">{{ fmt(r.pvA, 1) }}</td>
                <td class="num">{{ fmt(r.pvW, 0) }}</td>
                <td class="num">{{ fmt(r.gridV, 0) }}</td>
                <td class="num">{{ fmt(r.gridA, 1) }}</td>
                <td class="num">{{ fmt(r.nowW, 0) }}</td>
                <td class="num">{{ fmt(r.pf, 1) }}</td>
                <td class="num">{{ fmt(r.freq, 1) }}</td>
                <td class="num">{{ fmt(r.totalKwh, 2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card col-3">
        <div class="card-hd"><h3>효율지표</h3></div>
        <div class="gauges">
          <div class="gauge">
            <div class="ring" :style="ringStyle(kpi.inverter_efficiency_pct)"></div>
            <div class="g-meta">
              <div class="g-title">인버터 효율</div>
              <div class="g-val">{{ fmt(kpi.inverter_efficiency_pct, 1, '%') }}</div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="row">
      <article class="card col-3">
        <div class="card-hd"><h3>추가 정보</h3></div>
        <ul class="kv">
          <li><span>총 발전량</span><strong>{{ fmt(kpi.total_kwh, 2) }} kWh</strong></li>
          <li><span>탄소 절감</span><strong>{{ fmt(kpi.co2_ton, 2) }} 톤</strong></li>
        </ul>
      </article>

      <article class="card col-3">
        <div class="card-hd"><h3>환경 데이터</h3></div>
        <ul class="kv">
          <li>
            <span>외부 온도</span>
            <strong>{{ envTempC==null ? '—°C' : (fmt(envTempC,1)+'°C') }}</strong>
          </li>
          <li>
            <span>날씨</span>
            <strong>{{ envCond || '—' }}</strong>
          </li>
        </ul>
      </article>

      <!-- ▼ 유지보수 -->
      <article class="card col-3">
        <div class="card-hd">
          <h3>유지보수</h3>
          <div class="card-actions">
            <button class="btn ghost sm" :disabled="!imeiUse" @click="openMaintModal">
              수정
            </button>
          </div>
        </div>
        <ul class="kv">
          <li>
            <span>마지막 점검</span>
            <strong>{{ maintenance.lastInspection || '—' }}</strong>
          </li>
          <li>
            <span>AS 특이사항</span>
            <strong>{{ maintenance.asNotes || '—' }}</strong>
          </li>
        </ul>
      </article>

      <article class="card col-3">
        <router-link class="qa-card" :to="dashboardTo" :aria-disabled="!imeiForLink">
          <div class="qa-icon">⚡</div>
          <div class="qa-main">
            <div class="qa-title">발전량 모니터링</div>
            <div class="qa-desc">누적 · 일간 · 주간 · 연간 데이터</div>
          </div>
          <span class="qa-arrow">›</span>
        </router-link>
      </article>
    </section>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay" role="status" aria-live="polite">
      <div class="spinner-neo"></div>
      <div class="loading-text">불러오는 중…</div>
    </div>

    <!-- 설비정보 입력/수정 모달 -->
    <div
      v-if="showFacilityEditor"
      class="ats-modal"
      role="dialog"
      aria-modal="true"
      @keydown.esc.prevent.stop="closeFacilityEditor"
    >
      <div class="ats-modal__backdrop" @click="closeFacilityEditor"></div>
      <div class="ats-modal__panel" role="document" @click.stop>
        <header class="ats-modal__hd">
          <h3>{{ editingFacility ? '설비정보 수정' : '설비정보 등록' }}</h3>
          <button class="btn ghost sm" @click="closeFacilityEditor">닫기</button>
        </header>

        <form class="ats-form" @submit.prevent="saveFacility">
          <label class="ats-field">
            <span>RTU IMEI</span>
            <input class="input" type="text" :value="imeiUse" disabled />
          </label>

          <label class="ats-field">
            <span>모듈 용량</span>
            <input class="input" v-model.trim="facilityForm.module_capacity" placeholder="예) 100 kWp" />
          </label>

          <label class="ats-field">
            <span>설치일</span>
            <input class="input" v-model.trim="facilityForm.install_date" placeholder="YYYY-MM-DD" />
          </label>

          <label class="ats-field">
            <span>모니터링 시작</span>
            <input class="input" v-model.trim="facilityForm.monitor_start" placeholder="YYYY-MM-DD" />
          </label>

          <label class="ats-field">
            <span>사업명</span>
            <input class="input" v-model.trim="facilityForm.project_name" />
          </label>

          <label class="ats-field">
            <span>시공사</span>
            <input class="input" v-model.trim="facilityForm.contractor" />
          </label>

          <label class="ats-field">
            <span>A/S 연락처</span>
            <input class="input" v-model.trim="facilityForm.as_contact" placeholder="예) 010-1234-5678" />
          </label>

          <label class="ats-field">
            <span>이미지 URL</span>
            <input class="input" v-model.trim="facilityForm.image_url" placeholder="https://..." />
          </label>

          <div class="ats-modal__actions">
            <button type="button" class="btn ghost" @click="closeFacilityEditor">취소</button>
            <button type="submit" class="btn primary" :disabled="savingFacility">
              <span v-if="!savingFacility">저장</span>
              <span v-else class="btn-spinner" aria-hidden="true"></span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 유지보수 입력/수정 모달 -->
    <div
      v-if="maintModal.open"
      class="ats-modal"
      role="dialog"
      aria-modal="true"
      @keydown.esc.prevent.stop="closeMaintModal"
    >
      <div class="ats-modal__backdrop" @click="closeMaintModal"></div>
      <div class="ats-modal__panel" role="document" @click.stop>
        <header class="ats-modal__hd">
          <h3>유지보수 정보</h3>
          <button class="btn ghost sm" @click="closeMaintModal">닫기</button>
        </header>

        <form class="ats-form" @submit.prevent="saveMaintenance">
          <label class="ats-field">
            <span>RTU IMEI</span>
            <input class="input" type="text" :value="imeiUse" disabled />
          </label>

          <label class="ats-field">
            <span>마지막 점검</span>
            <input class="input" type="date" v-model="maintForm.lastInspection" />
          </label>

          <label class="ats-field" style="grid-column:1 / -1;">
            <span>A/S 특이사항</span>
            <textarea class="input" rows="5" v-model.trim="maintForm.asNotes" placeholder="메모/특이사항을 입력하세요."></textarea>
          </label>

          <div class="ats-modal__actions">
            <button type="button" class="btn ghost" @click="closeMaintModal">취소</button>
            <button type="submit" class="btn primary" :disabled="maintModal.saving">
              <span v-if="!maintModal.saving">저장</span>
              <span v-else class="btn-spinner" aria-hidden="true"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/analysis-timeseries.css';

const DEFAULT_IMEI = '';

export default {
  name: 'AnalysisTimeseries',
  props: { imei: { type: String, required: false } },
  data () {
    return {
      imeiField: DEFAULT_IMEI,
      energyField: '01',
      typeField: '',
      onlyOk: true,
      lastRouterErr: '',
      imeiUse: '',
      selectedMulti: null,

      driverUnits: [],

      kpis: [
        { key: 'now',     title: '현재 출력',            unit: 'kWh'  },
        { key: 'today',   title: '금일 발전량',          unit: 'kWh' },
        { key: 'co2',     title: 'CO₂ 저감',            unit: 'tCO₂' },
        { key: 'avg',     title: '지난 달 평균 발전량', unit: 'kWh'  },
        { key: 'status',  title: '시스템 상태',          unit: ''    },
        { key: 'total',   title: '누적 발전량',          unit: 'kWh' },
      ],
      kpi: {
        now_kw: null, today_kwh: null, total_kwh: null,
        co2_ton: null, last_month_avg_kw: null,
        inverter_efficiency_pct: null, _updatedAt: null
      },
      hourly: [],

      mets: {
        systemVoltage: null, systemCurrent: null,
        systemR_V: null, systemS_V: null, systemT_V: null,
        systemR_I: null, systemS_I: null, systemT_I: null,
        powerFactor: null, frequencyHz: null,
        statusList: []
      },
      latestCollectedAt: null,

      loading: false,
      controllers: { kpis:null, latest:null, hourly:null, driver:null, weather:null, facility:null, maintenance:null },

      currentReqId: 0,

      vb: { w: 1000, h: 360 },
      pad: { t: 16, r: 16, b: 28, l: 18 },
      hoverIdx: null,
      tt: { w: 180, h: 50 },

      envTempC: null,
      envCond: null,
      envPopPct: null,
      envHumidityPct: null,
      envWindMs: null,

      maintenance: { lastInspection: null, asNotes: null },

      facilityInfo: {
        moduleCapacity: null,
        installDate: null,
        monitorStart: null,
        projectName: null,
        contractor: null,
        asContact: null,
        image: null,
      },

      showFacilityEditor: false,
      editingFacility: false,
      savingFacility: false,
      facilityForm: {
        module_capacity: '',
        install_date: '',
        monitor_start: '',
        project_name: '',
        contractor: '',
        as_contact: '',
        image_url: '',
      },

      // 유지보수 모달/폼
      maintModal: { open: false, saving: false },
      maintForm: { lastInspection: '', asNotes: '' },
    }
  },
  computed: {
    inner () { return { w: this.vb.w - this.pad.l - this.pad.r, h: this.vb.h - this.pad.t - this.pad.b }; },
    series () {
      if (!Array.isArray(this.hourly) || !this.hourly.length) return [];
      return this.hourly.map(h => {
        const rawNull = (h.kwh == null || Number.isNaN(Number(h.kwh)));
        const kw = rawNull ? 0 : Number(h.kwh);
        return { hour: String(h.hour).padStart(2,'0'), kw, rawNull };
      });
    },
    maxKw () {
      const vals = this.series.map(p => p.kw || 0);
      return Math.max(...vals, 0.01);
    },
    stepW () { return this.series.length ? this.inner.w / this.series.length : 0; },
    barW () { return Math.max(10, this.stepW * 0.6); },
    xTicks () {
      const out = []; const n = this.series.length;
      if (!n) return out;
      const every = n > 12 ? 2 : 1;
      for (let i = 0; i < n; i += every) {
        const x = this.pad.l + i * this.stepW + this.stepW / 2;
        const label = `${this.series[i].hour}시`;
        out.push({ x, label });
      }
      return out;
    },
    yTicks () {
      const max = this.maxKw, step = max / 4, arr = [];
      for (let i = 0; i <= 4; i++) {
        const v = Math.round((step * i) * 1000) / 1000;
        const y = this.yKwToY(v);
        arr.push({ y, label: this.number(v, v >= 10 ? 0 : 3) });
      }
      return arr;
    },
    bars () {
      if (!this.series.length) return [];
      return this.series.map((item, i) => {
        const kw = item.kw || 0;
        const xCenter = this.pad.l + i * this.stepW + this.stepW / 2;
        const w = this.barW;
        const x = xCenter - w / 2;
        const y = this.yKwToY(kw);
        const h = (this.pad.t + this.inner.h) - y;
        return { x, y, w, h, kw, xCenter, rawNull: item.rawNull };
      });
    },
    linePath () {
      if (!this.bars.length) return '';
      let d = `M${this.bars[0].xCenter},${this.bars[0].y}`;
      for (let i = 1; i < this.bars.length; i++) d += ` L${this.bars[i].xCenter},${this.bars[i].y}`;
      return d;
    },
    hoverX () { if (this.hoverIdx === null || !this.bars.length) return 0; return this.bars[this.hoverIdx].xCenter; },
    hoverKw () { if (this.hoverIdx === null) return null; return this.series[this.hoverIdx]?.rawNull ? null : (this.bars[this.hoverIdx].kw || 0); },
    hoverLineY () { if (this.hoverIdx === null || !this.bars.length) return 0; return this.bars[this.hoverIdx].y; },
    hoverLabel () {
      if (this.hoverIdx === null) return '';
      const s = this.series[this.hoverIdx];
      return s ? `${s.hour}시` : `${this.hoverIdx + 1}`;
    },
    tooltipTransform () {
      const x = Math.min(Math.max(this.hoverX - this.tt.w / 2, this.pad.l), this.vb.w - this.pad.r - this.tt.w);
      const y = Math.max(this.pad.t + 6, this.hoverLineY - this.tt.h - 10);
      return `translate(${x},${y})`;
    },
    statusText () {
      if (!this.mets || !this.mets.statusList) return '—';
      return this.mets.statusList.length ? this.mets.statusList.join(' · ') : '알람 없음';
    },
    driverRows () {
      if (Array.isArray(this.driverUnits) && this.driverUnits.length) {
        return this.driverUnits
          .filter(u => u && u.ts)
          .sort((a, b) => (a.multi||'').localeCompare(b.multi||''))
          .map(u => ({
            imei: this.imeiUse || '—',
            multiId: u.multi || '—',
            facility: null,
            collectedAt: new Date(u.ts).toLocaleString('ko-KR'),
            status: '정상',
            pvV: u.pv_voltage_v ?? null,
            pvA: u.pv_current_a ?? null,
            pvW: u.pv_power_w ?? null,
            gridV: u.system_voltage_v ?? null,
            gridA: u.system_current_a ?? null,
            nowW: u.current_output_w ?? null,
            pf: u.power_factor ?? null,
            freq: u.frequency_hz ?? null,
            totalKwh: (typeof u.cumulative_wh === 'string' || typeof u.cumulative_wh === 'number')
              ? Math.round((Number(u.cumulative_wh)/1000)*100)/100
              : null
          }));
      }

      const m = this.mets || {};
      const pvV = this.pickFirstNum([m.pvVoltage, m.pvVoltageV, m.pv_v, m.PV_V, m.dcVoltage, m.dc_v]);
      const pvA = this.pickFirstNum([m.pvCurrent, m.pvCurrentA, m.pv_a, m.PV_A, m.dcCurrent, m.dc_a]);
      const pvW = this.pickFirstNum([m.pvPowerW, m.pvPower, m.PV_W, m.dcPower, m.dc_w]);

      const gridV = this.gridVoltageRaw;
      const gridA = this.pickFirstNum([m.systemCurrent, m.systemR_I, m.systemS_I, m.systemT_I]);

      const nowW   = (typeof this.kpi?.now_kw === 'number') ? Math.round(this.kpi.now_kw * 1000) : null;
      const pf     = this.pickFirstNum([m.powerFactor, m.pf, m.pfPct]);
      const freq   = this.pickFirstNum([m.frequencyHz, m.freq, m.frequency]);
      const totalK = this.kpi?.total_kwh ?? null;

      const collectedAt = this.latestCollectedAt
        ? new Date(this.latestCollectedAt).toLocaleString('ko-KR')
        : (this.kpi?._updatedAt ? new Date(this.kpi._updatedAt).toLocaleString('ko-KR') : null);

      return [{
        imei: this.imeiUse || '—',
        multiId: null,
        facility: null,
        collectedAt,
        status: this.mets?.statusList?.length ? '주의' : '정상',
        pvV, pvA, pvW,
        gridV, gridA,
        nowW, pf, freq,
        totalKwh: totalK
      }];
    },
    gridVoltageRaw () {
      const m = this.mets || {};
      if (m.systemR_V || m.systemS_V || m.systemT_V) {
        const arr = [m.systemR_V, m.systemS_V, m.systemT_V].filter(v => typeof v === 'number');
        if (arr.length) return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
      }
      if (typeof m.systemVoltage === 'number') return Math.round(m.systemVoltage);
      return null;
    },
    imeiForLink () {
      const qImei = (this.$route?.query?.imei || '').trim()
      return (this.imeiUse || this.imeiField || qImei || '').trim()
    },
    dashboardTo () {
      const imei = this.imeiForLink
      const q = {}
      if (imei) q.imei = imei
      if (this.energyField) q.energy = this.energyField
      if (this.typeField)   q.type   = this.typeField
      if (this.selectedMulti) q.multi = this.selectedMulti
      return { name: 'EnergyDashboard', query: q }
    },
    hasFacility () {
      return !!(this.facilityInfo.moduleCapacity || this.facilityInfo.projectName || this.facilityInfo.contractor || this.facilityInfo.asContact || this.facilityInfo.image)
    }
  },

  watch: {
    '$route.query.imei'(v) {
      if (typeof v === 'string' && v.trim()) {
        this.imeiField = v.trim()
        this.onSearch()
      }
    }
  },

  methods: {
    // fetch 옵션(쿠키 포함)
    fopts (key) {
      return { signal: this.newController(key), credentials: 'include' }
    },

    // 초기 IMEI 결정
    async initImeiFlow () {
      const qImei = (this.$route?.query?.imei || '').toString().trim()
      if (qImei) {
        this.imeiField = qImei
        this.onSearch()
        return
      }
      try {
        this.loading = true
        const { data } = await api.get('/user/imeis')
        const def = data?.defaultImei || (Array.isArray(data?.items) && data.items[0]?.rtuImei) || ''
        if (def) {
          this.imeiField = def
          const q = { ...(this.$route?.query || {}), imei: def }
          if (this.energyField) q.energy = this.energyField
          if (this.typeField)   q.type   = this.typeField
          this.$router?.replace({ query: q }).catch(()=>{})
          this.onSearch()
        } else {
          this.imeiField = ''
          this.imeiUse = ''
        }
      } catch (_e) {
        this.imeiField = ''
        this.imeiUse = ''
      } finally {
        this.loading = false
      }
    },

    formatKwh1(v) {
      if (v == null || Number.isNaN(Number(v))) return '—';
      if (Number(v) === 0) return '0';
      return Number(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    },
    abortAll() {
      for (const k of Object.keys(this.controllers)) {
        try { this.controllers[k]?.abort(); } catch (e) { void 0; }
        this.controllers[k] = null;
      }
    },
    newController(key) {
      this.controllers[key]?.abort();
      const c = new AbortController();
      this.controllers[key] = c;
      return c.signal;
    },

    emptyKpi () {
      return {
        now_kw: null, today_kwh: null, total_kwh: null,
        co2_ton: null, last_month_avg_kw: null,
        inverter_efficiency_pct: null, _updatedAt: null
      };
    },
    emptyMets () {
      return {
        systemVoltage: null, systemCurrent: null,
        systemR_V: null, systemS_V: null, systemT_V: null,
        systemR_I: null, systemS_I: null, systemT_I: null,
        powerFactor: null, frequencyHz: null,
        statusList: []
      };
    },

    clearForLoading () {
      this.kpi = this.emptyKpi();
      this.mets = this.emptyMets();
      this.driverUnits = [];
      this.selectedMulti = null;
      this.latestCollectedAt = null;
      this.hoverIdx = null;
      this.hourly = [];

      this.envTempC = null;
      this.envCond = null;
      this.envPopPct = null;
      this.envHumidityPct = null;
      this.envWindMs = null;

      this.maintenance = { lastInspection: null, asNotes: null };
      this.facilityInfo = this.emptyFacilityInfo();
    },

    resetAll () {
      this.imeiField = DEFAULT_IMEI;
      this.energyField = '01';
      this.typeField = '';
      this.onlyOk = true;
      this.imeiUse = '';
      this.clearForLoading();
      this.abortAll();
      this.currentReqId += 1;
      try { this.$router?.replace({ query: {} }); }
      catch (e) { this.lastRouterErr = (e && e.message) ? e.message : 'router'; }
    },

    yKwToY (kw) {
      const ratio = Math.min(1, Math.max(0, kw / this.maxKw));
      return this.pad.t + (1 - ratio) * this.inner.h;
    },

    onMove (evt) {
      if (!this.$refs.svg || !this.series.length) return;
      const rect = this.$refs.svg.getBoundingClientRect();
      const xPx = evt.clientX - rect.left;
      const scaleX = this.vb.w / rect.width;
      const xView = xPx * scaleX;
      const i = Math.round((xView - this.pad.l - this.stepW / 2) / this.stepW);
      this.hoverIdx = Math.min(this.series.length - 1, Math.max(0, i));
    },
    onLeave () { this.hoverIdx = null; },

    onSearch () {
      const imei = this.imeiField?.trim();
      if (!imei) { this.resetAll(); return; }

      this.abortAll();
      this.currentReqId += 1;

      this.imeiUse = imei;

      try {
        if (this.$router) {
          const q = { ...(this.$route?.query || {}), imei };
          if (this.energyField) q.energy = this.energyField;
          if (this.typeField)   q.type   = this.typeField;
          this.$router.replace({ query: q });
        }
      } catch (e) {
        this.lastRouterErr = (e && e.message) ? e.message : 'router';
      }

      this.clearForLoading();
      this.loadAll();
    },

    async loadAll () {
      if (!this.imeiUse) return;
      const myReq = this.currentReqId;

      this.loading = true;
      try {
        await Promise.all([ this.loadHourly(myReq), this.loadKpis(myReq) ]);
      } finally {
        this.loading = false;
      }

      this.loadLatest(myReq).catch(() => {});
      this.loadDriverUnits(myReq).catch(() => {});
      this.loadWeather(myReq).catch(() => {});
      this.loadFacility(myReq).catch(() => {});
      this.loadMaintenance(myReq).catch(() => {});
    },

    // KPI
    async loadKpis (reqId) {
      const params = new URLSearchParams({
        rtuImei: this.imeiUse,
        imei: this.imeiUse,
        energy: this.energyField || '01'
      });
      if (this.typeField) params.set('type', this.typeField);
      const url = `/api/energy/electric?${params.toString()}`;

      const r = await fetch(url, this.fopts('kpis'));
      if (!r.ok) return;
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const k = j.kpis || {};
      this.kpi = {
        now_kw: k.now_kw ?? null,
        today_kwh: k.today_kwh ?? null,
        total_kwh: k.total_kwh ?? null,
        co2_ton: k.co2_ton ?? null,
        last_month_avg_kw: k.last_month_avg_kw ?? null,
        inverter_efficiency_pct: k.inverter_efficiency_pct ?? null,
        _updatedAt: j.deviceInfo?.latestAt || null
      };
    },

    // 최신 프레임 디버그
    async loadLatest (reqId) {
      const url = `/api/energy/electric/debug?rtuImei=${encodeURIComponent(this.imeiUse)}&imei=${encodeURIComponent(this.imeiUse)}&limit=1`;
      const r = await fetch(url, this.fopts('latest'));
      if (!r.ok) return;
      if (reqId && reqId !== this.currentReqId) return;
      const arr = await r.json();
      const row = Array.isArray(arr) ? arr[0] : null;
      const p = row?.parsed?.metrics || {};
      this.mets = { ...this.emptyMets(), ...p, statusList: p.statusList || [] };
      this.latestCollectedAt = row?.time || row?.createdAt || row?.ts || null;
    },

    // 시간대별 발전량 (kWh)
    async loadHourly (reqId) {
      const hasMulti = !!this.selectedMulti;

      if (!hasMulti) {
        const params = new URLSearchParams({
          rtuImei: this.imeiUse,
          imei: this.imeiUse,
          energy: this.energyField || '01'
        });
        if (this.typeField) params.set('type', this.typeField);
        const url = `/api/energy/electric/hourly?${params.toString()}`;

        const r = await fetch(url, this.fopts('hourly'));
        if (!r.ok) return;
        if (reqId && reqId !== this.currentReqId) return;
        const j = await r.json();
        const hours = Array.isArray(j?.hours) ? j.hours : [];
        this.hourly = hours
          .map(h => ({ hour: String(h.hour).padStart(2,'0'), kwh: (h.kwh==null?null:Number(h.kwh)) }))
          .sort((a,b) => a.hour.localeCompare(b.hour));

        const sum = this.hourly.reduce((s, x) => (Number.isFinite(x.kwh) ? s + x.kwh : s), 0);
        this.kpi.today_kwh = Number.isFinite(sum) ? Math.round(sum*1000)/1000 : null;
        return;
      }

      // 멀티 선택 시
      const params = new URLSearchParams({
        rtuImei: this.imeiUse,
        imei: this.imeiUse,
        range: 'weekly',
        detail: 'hourly',
        energy: this.energyField || '01',
        multi: this.selectedMulti
      });
      if (this.typeField) params.set('type', this.typeField);
      const url = `/api/energy/electric/series?${params.toString()}`;

      const r = await fetch(url, this.fopts('hourly'));
      if (!r.ok) return;
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();

      const rows = j?.detail_hourly?.rows || [];
      this.hourly = rows
        .map(h => ({ hour: String(h.hour).slice(0,2), kwh: (h.kwh==null?null:Number(h.kwh)) }))
        .sort((a,b) => a.hour.localeCompare(b.hour));

      const sum = this.hourly.reduce((s, x) => (Number.isFinite(x.kwh) ? s + x.kwh : s), 0);
      this.kpi.today_kwh = Number.isFinite(sum) ? Math.round(sum*1000)/1000 : null;
    },

    async loadDriverUnits (reqId) {
      const params = new URLSearchParams({
        imei: this.imeiUse,
        rtuImei: this.imeiUse,
        energy: this.energyField || '01'
      });
      if (this.typeField) params.set('type', this.typeField);
      const url = `/api/energy/electric/instant/multi?${params.toString()}`;

      const r = await fetch(url, this.fopts('driver'));
      if (!r.ok) { this.driverUnits = []; return; }
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const units = Array.isArray(j?.units) ? j.units : [];
      this.driverUnits = units;
      if (units.length) this.latestCollectedAt = units[0]?.ts || this.latestCollectedAt;
    },

    // 날씨
    async loadWeather (reqId) {
      try {
        if (!this.imeiUse) return;
        const url = `/api/weather/vilageFcst/by-imei?imei=${encodeURIComponent(this.imeiUse)}&rtuImei=${encodeURIComponent(this.imeiUse)}`;
        const r = await fetch(url, this.fopts('weather'));
        if (!r.ok) return;
        if (reqId && reqId !== this.currentReqId) return;
        const j = await r.json();
        const hourly = Array.isArray(j.hourly) ? j.hourly : [];
        if (!hourly.length){
          this.envTempC = this.envCond = this.envPopPct = this.envHumidityPct = this.envWindMs = null;
          return;
        }

        const base = this.latestCollectedAt ? new Date(this.latestCollectedAt) : new Date();
        const kst  = new Date(base.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const hh   = String(kst.getHours()).padStart(2,'0');

        const map  = new Map(hourly.map(h => [ this.toHH(h.hour), h ]));
        const row  = map.get(hh) || hourly[0];

        if (!row){
          this.envTempC = this.envCond = this.envPopPct = this.envHumidityPct = this.envWindMs = null;
          return;
        }

        this.envTempC       = this.getTemp(row);
        this.envCond        = this.condFrom(row);
        this.envPopPct      = this.getNum(row, ['POP','pop','precipProb']);
        this.envHumidityPct = this.getNum(row, ['REH','humidity','reh']);
        this.envWindMs      = this.getNum(row, ['WSD','wsd','WS','ws','wind','windMs','windSpeed']);
      } catch (_e) {
        this.envTempC = this.envCond = this.envPopPct = this.envHumidityPct = this.envWindMs = null;
      }
    },

    // 설비정보
    async loadFacility (reqId) {
      if (!this.imeiUse) return;
      const url = `/api/facility?rtuImei=${encodeURIComponent(this.imeiUse)}`;
      const r = await fetch(url, this.fopts('facility'));
      if (!r.ok) { this.facilityInfo = this.emptyFacilityInfo(); return; }
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const it = j?.item || null;
      if (!it) { this.facilityInfo = this.emptyFacilityInfo(); return; }

      this.facilityInfo = {
        moduleCapacity: it.module_capacity || null,
        installDate: it.install_date ? this.toDateStr(it.install_date) : null,
        monitorStart: it.monitor_start ? this.toDateStr(it.monitor_start) : null,
        projectName: it.project_name || null,
        contractor: it.contractor || null,
        asContact: it.as_contact || null,
        image: it.image_url || null,
      };
    },
    emptyFacilityInfo() {
      return {
        moduleCapacity: null,
        installDate: null,
        monitorStart: null,
        projectName: null,
        contractor: null,
        asContact: null,
        image: null,
      };
    },
    toDateStr (v) {
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0,10);
      } catch { return null; }
    },

    openFacilityEditor (isEdit) {
      this.editingFacility = !!isEdit;
      this.facilityForm = {
        module_capacity: this.facilityInfo.moduleCapacity || '',
        install_date: this.facilityInfo.installDate || '',
        monitor_start: this.facilityInfo.monitorStart || '',
        project_name: this.facilityInfo.projectName || '',
        contractor: this.facilityInfo.contractor || '',
        as_contact: this.facilityInfo.asContact || '',
        image_url: this.facilityInfo.image || '',
      };
      this.showFacilityEditor = true;
      this.$nextTick(() => {
        const el = document.querySelector('.ats-modal__panel input:not([disabled])');
        el && el.focus();
      });
    },
    closeFacilityEditor () {
      if (this.savingFacility) return;
      this.showFacilityEditor = false;
    },
    async saveFacility () {
      if (!this.imeiUse) return;
      try {
        this.savingFacility = true;
        const url = `/api/facility/${encodeURIComponent(this.imeiUse)}`;
        const r = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(this.facilityForm),
        });
        if (!r.ok) {
          const msg = (await r.json().catch(()=>({message:''}))).message || '저장 실패';
          alert(msg);
          return;
        }
        this.showFacilityEditor = false;
        await this.loadFacility(this.currentReqId);
        alert('저장되었습니다.');
      } catch (e) {
        alert('저장 중 오류가 발생했습니다.');
      } finally {
        this.savingFacility = false;
      }
    },

    // 유지보수: 조회/모달/저장
    async loadMaintenance (reqId) {
      if (!this.imeiUse) return;
      try {
        const url = `/api/maintenance?rtuImei=${encodeURIComponent(this.imeiUse)}`;
        const r = await fetch(url, this.fopts('maintenance'));
        if (!r.ok) return;
        if (reqId && reqId !== this.currentReqId) return;
        const j = await r.json();
        const it = j?.item || {};
        this.maintenance = {
          lastInspection: it?.lastInspection || null,
          asNotes: it?.asNotes || null
        };
      } catch (_) {}
    },
    openMaintModal () {
      if (!this.imeiUse) return;
      this.maintForm.lastInspection = this.maintenance.lastInspection || '';
      this.maintForm.asNotes = this.maintenance.asNotes || '';
      this.maintModal.open = true;
      this.$nextTick(()=> {
        const el = document.querySelector('.ats-modal__panel input[type="date"]');
        el && el.focus();
      });
    },
    closeMaintModal () {
      if (this.maintModal.saving) return;
      this.maintModal.open = false;
    },
    async saveMaintenance () {
      if (!this.imeiUse || this.maintModal.saving) return;
      this.maintModal.saving = true;
      try {
        const body = {
          lastInspection: this.maintForm.lastInspection || null,
          asNotes: this.maintForm.asNotes || null,
        };
        const r = await fetch(`/api/maintenance/${encodeURIComponent(this.imeiUse)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        if (!r.ok) {
          const t = await r.text().catch(()=> '');
          throw new Error(t || 'save failed');
        }
        // 화면 갱신
        this.maintenance.lastInspection = body.lastInspection || null;
        this.maintenance.asNotes = body.asNotes || null;
        this.maintModal.open = false;
        alert('유지보수 정보가 저장되었습니다.');
      } catch (e) {
        alert('유지보수 저장 실패: ' + (e?.message || e));
      } finally {
        this.maintModal.saving = false;
      }
    },

    onSelectUnit (multiHex) {
      this.selectedMulti = (this.selectedMulti === multiHex) ? null : multiHex;
      this.loadHourly(this.currentReqId).catch(()=>{});
    },
    clearMulti(){
      if (!this.selectedMulti) return;
      this.selectedMulti = null;
      this.loadHourly(this.currentReqId).catch(()=>{});
    },

    number (v, digits = 0) {
      if (v === null || v === undefined || Number.isNaN(v)) return '—';
      return Number(v).toLocaleString(undefined, {
        maximumFractionDigits: digits, minimumFractionDigits: digits
      });
    },
    fmt (v, digits = 0, suffix = '') {
      return (v === null || v === undefined) ? '—'
        : `${this.number(v, digits)}${suffix ? suffix : ''}`;
    },
    valueFor (key) {
      switch (key) {
        case 'now':   return this.fmt(this.kpi.now_kw, 2);
        case 'today': return this.formatKwh1(this.kpi.today_kwh);
        case 'co2':   return this.fmt(this.kpi.co2_ton, 2);
        case 'avg':   return this.fmt(this.kpi.last_month_avg_kw, 2);
        case 'total': return this.fmt(this.kpi.total_kwh, 2);
        case 'status': return this.mets.statusList?.length ? '주의' : '정상';
        default: return '—';
      }
    },
    subFor (key) {
      if (key === 'status') return this.statusText;
      const t = this.kpi._updatedAt ? new Date(this.kpi._updatedAt) : null;
      return t ? `업데이트 ${t.toLocaleTimeString()}` : '—';
    },
    ringStyle (pct) {
      const p = (typeof pct === 'number' && pct >= 0) ? Math.max(0, Math.min(100, pct)) : 0;
      const deg = p * 3.6;
      return { background: `conic-gradient(#21e2cf 0deg, #21e2cf ${deg}deg, rgba(255,255,255,.08) ${deg}deg 360deg)` };
    },
    multiLabel (multiHex) {
      const n = parseInt(multiHex, 16);
      return isNaN(n) ? `멀티 ${multiHex}` : `설비 ${n+1} (멀티 ${multiHex})`;
    },
    pickFirstNum (candidates) {
      for (const v of candidates) {
        if (typeof v === 'number' && Number.isFinite(v)) return v;
      }
      return null;
    },

    toHH(h) {
      if (h == null) return null;
      const s = String(h).trim();
      let m = s.match(/^(\d{1,2})\s*:\s*\d{2}$/); if (m) return m[1].padStart(2,'0');
      m = s.match(/^(\d{1,2})\s*시$/);            if (m) return m[1].padStart(2,'0');
      m = s.match(/^(\d{1,2})\d{2}$/);            if (m) return m[1].padStart(2,'0');
      m = s.match(/^(\d{1,2})$/);                 if (m) return m[1].padStart(2,'0');
      return null;
    },

    getTemp(row){
      const cands = [row.TA, row.T1H, row.TMP, row.T3H, row.temp, row.temperature];
      for (const v of cands){
        const n = Number(v);
        if (Number.isFinite(n)) return Math.round(n*10)/10;
      }
      return null;
    },

    getNum(row, keys){
      for (const k of keys){
        const n = Number(row?.[k]);
        if (Number.isFinite(n)) return n;
      }
      return null;
    },
    condFrom(row){
      const pty = this.getNum(row, ['PTY','pty']);
      const sky = this.getNum(row, ['SKY','sky','SKY_CODE']);
      if (pty!=null && pty!==0){
        const map = {1:'비',2:'비/눈',3:'눈',5:'빗방울',6:'비/눈날림',7:'눈날림'};
        return map[pty] || '강수';
      }
      if (sky!=null){
        const map = {1:'맑음',3:'구름많음',4:'흐림'};
        return map[sky] || '—';
      }
      return row?.weather || row?.condition || null;
    },
  },

  mounted () {
    const q = this.$route?.query || {};
    const initEnergy = q.energy || '01';
    const initType   = q.type   || '';

    this.energyField = typeof initEnergy === 'string' ? initEnergy : '01';
    this.typeField   = typeof initType   === 'string' ? initType   : '';

    this.initImeiFlow();
  }
}
</script>

<style scoped>
/* ====== 모달(네임스페이스: ats-) ====== */
.ats-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999}
.ats-modal__backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:saturate(120%) blur(2px)}
.ats-modal__panel{
  position:relative;
  width:min(680px, 92vw);
  max-height:calc(100vh - 10vh);
  overflow:auto;
  background:#fff;
  border-radius:16px;
  box-shadow:0 20px 44px rgba(0,0,0,.22);
  padding:16px 16px 12px;
  z-index:1;
}
.ats-modal__hd{display:flex;align-items:center;justify-content:space-between;margin:4px 2px 10px}
.ats-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ats-field{display:flex;flex-direction:column;gap:6px}
.ats-field > span{font-size:12px;color:#666}
.input{border:1px solid #e3e6ea;border-radius:10px;padding:10px 12px;font-size:14px}
.ats-modal__actions{grid-column:1 / -1;display:flex;justify-content:flex-end;gap:8px;margin-top:4px}

.btn{cursor:pointer}
.btn.primary{background:#00b3a4;color:#fff;border:none;padding:8px 14px;border-radius:10px}
.btn.ghost{background:transparent;border:1px solid #d7dbe1;color:#333;padding:8px 14px;border-radius:10px}
.btn.sm{font-size:12px;padding:6px 10px}
.btn-spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:spin .9s linear infinite;vertical-align:-3px}
@keyframes spin{to{transform:rotate(360deg)}}

/* ====== 페이지 기타(기존 스타일 유지 가정) ====== */
.loading-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.35);z-index:8000}
</style>
