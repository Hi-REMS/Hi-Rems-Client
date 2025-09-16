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
          <!-- 시간대별 API는 멀티 개별 필터가 없으니 안내 칩은 숨김 -->
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

              <!-- bar labels (데이터 없으면 라벨 숨김) -->
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

              <!-- line (시간대 꼭짓점 연결선) -->
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
              <span class="dot"></span> 합산 발전량(kWh)
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
        <div class="card-hd"><h3>설비정보</h3></div>
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
      <!-- 운전이력 -->
      <article class="card col-9">
        <div class="card-hd"><h3>운전이력</h3></div>

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

      <!-- ▼ 효율지표 -->
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

      <article class="card col-3">
        <div class="card-hd"><h3>유지보수</h3></div>
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
    </section>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay" role="status" aria-live="polite">
      <div class="spinner-neo"></div>
      <div class="loading-text">불러오는 중…</div>
    </div>
  </div>
</template>

<script>
import '@/assets/css/analysis-timeseries.css';
import facilitySample from '@/assets/sampleimage.jpg';

const DEFAULT_IMEI = '03-58-48-00-70-54-06-06';

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
      // 시간대별 kWh 원본(백엔드 응답)
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
      controllers: { kpis:null, latest:null, hourly:null, driver:null, weather:null },

      currentReqId: 0,

      vb: { w: 1000, h: 360 },
      pad: { t: 16, r: 16, b: 28, l: 18 },
      hoverIdx: null,
      tt: { w: 180, h: 50 },

      // 환경 데이터
      envTempC: null,
      envCond: null,
      envPopPct: null,
      envHumidityPct: null,
      envWindMs: null,

      // 유지보수 더미 데이터 상태
      maintenance: {
        lastInspection: null,
        asNotes: null,
      },

      // 설비정보 더미 데이터 상태 (이미지 필드 추가)
      facilityInfo: {
        moduleCapacity: null,
        installDate: null,
        monitorStart: null,
        projectName: null,
        contractor: null,
        asContact: null,
        image: null,
      },
    }
  },
  computed: {
    inner () { return { w: this.vb.w - this.pad.l - this.pad.r, h: this.vb.h - this.pad.t - this.pad.b }; },

    // 시간대별 시리즈 (24개, null은 0으로 그리되 라벨은 숨김)
    series () {
      if (!Array.isArray(this.hourly) || !this.hourly.length) return [];
      return this.hourly.map(h => {
        const rawNull = (h.kwh == null || Number.isNaN(Number(h.kwh)));
        const kw = rawNull ? 0 : Number(h.kwh);
        // ts는 "HH시" 라벨 용도만 필요 → 실제 픽셀 계산은 인덱스로
        return { hour: String(h.hour).padStart(2,'0'), kw, rawNull };
      });
    },

    // y축 최대치
    maxKw () {
      const vals = this.series.map(p => p.kw || 0);
      return Math.max(...vals, 0.01);
    },

    // step 너비 (24등분)
    stepW () { return this.series.length ? this.inner.w / this.series.length : 0; },

    barW () { return Math.max(10, this.stepW * 0.6); },

    xTicks () {
      const out = []; const n = this.series.length;
      if (!n) return out;
      const every = 24 > 12 ? 2 : 1; // 2시간 간격 라벨
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
      const res = [];
      if (!this.series.length) return res;
      for (let i = 0; i < this.series.length; i++) {
        const item = this.series[i];
        const kw = item.kw || 0;
        const xCenter = this.pad.l + i * this.stepW + this.stepW / 2;
        const w = this.barW, x = xCenter - w / 2;
        const y = this.yKwToY(kw);
        const h = (this.pad.t + this.inner.h) - y;
        res.push({ x, y, w, h, kw, xCenter, rawNull: item.rawNull });
      }
      return res;
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
    }
  },
  methods: {

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

      // 유지보수 더미 초기화
      this.maintenance = { lastInspection: null, asNotes: null };

      // 설비정보 더미 초기화 (이미지 포함)
      this.facilityInfo = {
        moduleCapacity: null,
        installDate: null,
        monitorStart: null,
        projectName: null,
        contractor: null,
        asContact: null,
        image: null,
      };
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

      try {
        this.$router?.replace({ query: {} });
      } catch (e) {
        this.lastRouterErr = (e && e.message) ? e.message : 'router';
      }
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

      // 조회 직후 더미 데이터 주입
      this.maintenance  = this.genDummyMaintenance(imei);
      this.facilityInfo = this.genDummyFacility();

      this.loadAll();
    },

    async loadAll () {
      if (!this.imeiUse) return;
      const myReq = this.currentReqId;

      this.loading = true;
      try {
        await Promise.all([
          this.loadHourly(myReq),
          this.loadKpis(myReq),
        ]);
      } finally {
        this.loading = false;
      }

      this.loadLatest(myReq).catch(() => {});
      this.loadDriverUnits(myReq).catch(() => {});
      this.loadWeather(myReq).catch(() => {});
    },

    // KPI
    async loadKpis (reqId) {
      const params = new URLSearchParams({ rtuImei: this.imeiUse, energy: this.energyField || '01' });
      if (this.typeField) params.set('type', this.typeField);
      const url = `/api/energy/electric?${params.toString()}`;

      const r = await fetch(url, { signal: this.newController('kpis') });
      if (!r.ok) return;
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const k = j.kpis || {};
      // today_kwh는 loadHourly에서 시간합계로 갱신 예정 (우선 백엔드 값 반영)
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
      const url = `/api/energy/electric/debug?rtuImei=${encodeURIComponent(this.imeiUse)}&limit=1`;
      const r = await fetch(url, { signal: this.newController('latest') });
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
      const params = new URLSearchParams({ rtuImei: this.imeiUse, energy: this.energyField || '01' });
      if (this.typeField) params.set('type', this.typeField);
      // date는 생략 → 백엔드가 "오늘(KST)"로 처리
      const url = `/api/energy/electric/hourly?${params.toString()}`;

      const r = await fetch(url, { signal: this.newController('hourly') });
      if (!r.ok) return;
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const hours = Array.isArray(j?.hours) ? j.hours : [];
      // 정렬 보장 (00~23)
      this.hourly = hours
        .map(h => ({ hour: String(h.hour).padStart(2,'0'), kwh: (h.kwh==null?null:Number(h.kwh)) }))
        .sort((a,b) => a.hour.localeCompare(b.hour));

      // 금일 발전량(kWh) — 시간별 합계로 갱신
      const sum = this.hourly.reduce((s, x) => (Number.isFinite(x.kwh) ? s + x.kwh : s), 0);
      const today = Number.isFinite(sum) ? Math.round(sum*1000)/1000 : null;
      this.kpi.today_kwh = today;
    },

    async loadDriverUnits (reqId) {
      const params = new URLSearchParams({ imei: this.imeiUse, energy: this.energyField || '01' });
      if (this.typeField) params.set('type', this.typeField);
      const url = `/api/energy/electric/instant/multi?${params.toString()}`;

      const r = await fetch(url, { signal: this.newController('driver') });
      if (!r.ok) { this.driverUnits = []; return; }
      if (reqId && reqId !== this.currentReqId) return;
      const j = await r.json();
      const units = Array.isArray(j?.units) ? j.units : [];
      this.driverUnits = units;
      if (units.length) this.latestCollectedAt = units[0]?.ts || this.latestCollectedAt;
    },

    // ===== 날씨 로더 =====
    async loadWeather (reqId) {
      try {
        if (!this.imeiUse) return;
        const url = `/api/weather/vilageFcst/by-imei?imei=${encodeURIComponent(this.imeiUse)}`;
        const r = await fetch(url, { signal: this.newController('weather') });
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

    onSelectUnit () {
      // NOTE: 시간대별 API에는 멀티 필터가 없어 차트에는 미반영 (운전이력 행 클릭 시 동작만 유지)
      return;
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

    // ===== 날씨 유틸 =====
    getNum(row, keys){
      for (const k of keys){
        const n = Number(row?.[k]);
        if (Number.isFinite(n)) return n;
      }
      return null;
    },
    condFrom(row){
      const pty = this.getNum(row, ['PTY','pty']); // 강수형태
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

    // ===== 유지보수 더미 생성기 =====
    genDummyMaintenance(imei) {
      const seed = (imei || 'NA').split('')
        .reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 0);
      const rand = (n) => {
        let x = (seed || 1) + n * 101;
        x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
        return (x >>> 0) / 0xffffffff;
      };
      const daysAgo = Math.floor(rand(1) * 90);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const lastInspection = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

      const notesPool = [
        '이상 없음',
        '인버터 팬 청소',
        'DC 단자 체결 재점검',
        '인버터 내부 먼지 제거',
        'PV 스트링 절연 점검',
        '펌웨어 점검 및 업데이트',
        '통신 모뎀 재부팅 조치',
        '누설전류 감지 센서 확인',
      ];
      const idx = Math.floor(rand(2) * notesPool.length);
      const asNotes = notesPool[idx];

      return { lastInspection, asNotes };
    },

    // ===== 설비정보 더미 생성기 (이미지 포함) =====
    genDummyFacility() {
      return {
        moduleCapacity: '3kW',
        installDate: '2024-05-23',
        monitorStart: '2024-12-31',
        projectName: '2024 양산시 융복합지원사업',
        contractor: '(주)선한이엔지',
        asContact: '1800-5133',
        image: facilitySample,
      };
    },
  },
  mounted () {
    const q = this.$route?.query || {};
    const initImei   = this.imei || q.imei || DEFAULT_IMEI;
    const initEnergy = q.energy || '01';
    const initType   = q.type || '';

    this.imeiField   = typeof initImei === 'string' ? initImei : DEFAULT_IMEI;
    this.energyField = typeof initEnergy === 'string' ? initEnergy : '01';
    this.typeField   = typeof initType === 'string' ? initType : '';
    this.imeiUse     = '';
  }
}
</script>

<style>
/* 설비정보 이미지 스타일 */
.facility-wrap { padding: 10px 14px 16px; display: grid; gap: 12px; }
.facility-img img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border-1);
}
</style>
