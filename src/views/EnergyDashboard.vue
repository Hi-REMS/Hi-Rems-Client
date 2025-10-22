<!-- src/views/EnergyDashboard.vue -->
<template>
  <main class="edb-page">
    <div class="edb-inner">
      <!-- SEARCH BAR -->
      <section class="edb-toolbar edb-card edb-card--soft">
        <div class="edb-tool-left">
          <label class="edb-label">IMEI</label>
          <div class="edb-input-wrap">
            <input
              v-model.trim="imeiField"
              @keyup.enter="onSearch"
              class="edb-input"
              placeholder="예) 03-58-48-00-70-54-06-06"
            />
            <span class="edb-input-ico">⌕</span>
          </div>

          <label class="edb-label">지역</label>
          <select v-model="regionField" class="edb-select edb-select--sm">
            <option value="yesan">예정</option>
          </select>

          <label class="edb-label">에너지</label>
          <select v-model="energyField" class="edb-select edb-select--sm" disabled>
            <option value="01">태양광(0x01)</option>
          </select>

          <label class="edb-label">타입</label>
          <select v-model="typeField" class="edb-select edb-select--sm">
            <option disabled value="">선택</option>
            <option value="01">단상(0x01)</option>
            <option value="02">삼상(0x02)</option>
          </select>

          <!-- ▼ 설비(멀티) 선택 -->
          <label class="edb-label">멀티</label>
          <select v-model="multiField" class="edb-select edb-select--sm" :title="multiLabel">
            <option value="">전체</option>
            <option value="00">0</option>
            <option value="01">1</option>
            <option value="02">2</option>
            <option value="03">3</option>
          </select>
        </div>

        <div class="edb-tool-right">
          <button class="edb-btn edb-btn--ghost" @click="reset">초기화</button>
          <button class="edb-btn edb-btn--primary" :disabled="loading || !imeiField" @click="onSearch">
            <span v-if="!loading">조회</span>
            <span v-else class="edb-spinner"></span>
          </button>
        </div>
      </section>

      <!-- TOP KPIs: 주간 · 월간 · 연간 -->
      <section class="edb-stat-row edb-center edb-stat-row--triple">
        <!-- 주간 -->
        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">주간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiWeek.kwh, 2) }}</b><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              CO₂ {{ fmt(kpiWeek.co2, 2) }} kg · 식수 {{ fmt(kpiWeek.trees, 0) }} 그루
            </div>
            <div v-if="weekRangeText" class="edb-stat-sub edb-muted">집계: {{ weekRangeText }}</div>
          </div>
        </article>

        <!-- 월간 -->
        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">월간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiMonth.kwh, 2) }}</b><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              CO₂ {{ fmt(kpiMonth.co2, 2) }} kg · 식수 {{ fmt(kpiMonth.trees, 0) }} 그루
            </div>
            <div v-if="monthRangeText" class="edb-stat-sub edb-muted">집계: {{ monthRangeText }}</div>
          </div>
        </article>

        <!-- 연간(YTD) -->
        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">연간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiYear.kwh, 2) }}</b><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              누적 CO₂ {{ fmt(kpiYear.co2, 2) }} kg · 식수 {{ fmt(kpiYear.trees, 0) }} 그루
            </div>
            <div v-if="yearRangeText" class="edb-stat-sub edb-muted">집계: {{ yearRangeText }}</div>
          </div>
        </article>
      </section>

      <!-- 1행: 주간 · 월간(주차) · 연간 -->
      <section class="edb-charts3">
        <!-- 주간 -->
        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3><span class="edb-dot edb-dot--cyan"></span>주간발전량</h3>
            <span v-if="bars.length" class="edb-chip edb-chip--strong">합계 {{ fmt(totalKwh, 2) }} kWh</span>
          </div>

          <div class="edb-chart__body" ref="weekWrap">
            <svg
              v-if="bars.length"
              ref="svg"
              :viewBox="`0 0 ${vb.w} ${vb.h}`"
              class="edb-svg-chart"
              aria-hidden="true"
              :style="axisStyle"
            >
              <g class="grid">
                <line v-for="(t, i) in yTicks" :key="'gy'+i" :x1="pad.l" :x2="vb.w-pad.r" :y1="t.y" :y2="t.y"/>
              </g>
              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
                <g v-for="(t,i) in yTicks" :key="'yl'+i">
                  <text :x="pad.l-8" :y="t.y+4" text-anchor="end">{{ t.label }}</text>
                </g>
              </g>
              <g class="axis axis-bottom">
                <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
                <g v-for="(x,i) in xTicks" :key="'xt'+i">
                  <line :x1="x.x" :x2="x.x" :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">{{ x.label }}</text>
                </g>
              </g>

              <g fill="url(#barGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%"  stop-color="#34d5ff" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#34d5ff" stop-opacity=".35"/>
                  </linearGradient>
                  <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
                  </filter>
                </defs>
                <rect
                  v-for="(b, i) in barsGeom"
                  :key="'b'+i"
                  class="bar"
                  :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="10"
                  @mouseenter="onBarEnter('week', i, $event)"
                  @mousemove="onBarMove('week', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>{{ formatDay(bucketsWeek[i]) }}: {{ fmt(valuesWeek[i], valuesWeek[i]>=10?0:1) }}</title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b,i) in barsGeom"
                  :key="'lblw'+i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesWeek[i], valuesWeek[i]>=10?0:1) }}
                </text>
              </g>
            </svg>

            <div v-else class="edb-empty">
              <div v-if="errorMsg" class="edb-empty-msg">{{ errorMsg }}</div>
              <div v-else-if="loading" class="edb-loading">
                <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
              </div>
              <div v-else class="edb-empty-msg">데이터가 없습니다. IMEI 입력 후 <b>조회</b>를 눌러주세요.</div>
            </div>

            <!-- 커스텀 툴팁 -->
            <div
              v-if="tip.show && tip.chart==='week'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">{{ fmt(tip.value, tip.value>=10?0:1) }}</div>
            </div>
          </div>
          <p class="edb-range" v-if="weekRangeText">집계기간: {{ weekRangeText }}</p>
        </article>

        <!-- 월간 (주차 집계) -->
        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3><span class="edb-dot edb-dot--amber"></span>월간발전량(주차)</h3>
            <div class="edb-card-actions">
              <span class="edb-chip">kWh</span>
              <button
                class="edb-btn edb-btn--primary edb-btn--sm"
                :disabled="downloading || !canDownload"
                @click="openDownloadModal"
                :title="canDownload ? '월별 CSV 다운로드' : '조회 후 활성화됩니다'"
              >
                ⬇ 데이터 다운로드
              </button>
            </div>
          </div>
          <div class="edb-chart__body" ref="monthWrap">
            <svg v-if="monthSeries.length" :viewBox="`0 0 ${vb.w} ${vb.h}`" class="edb-svg-chart" :style="axisStyle" aria-hidden="true">
              <g class="grid"><line v-for="(t,i) in yTicksMonth" :key="'gmy'+i" :x1="pad.l" :x2="vb.w-pad.r" :y1="t.y" :y2="t.y"/></g>
              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
                <g v-for="(t,i) in yTicksMonth" :key="'my'+i"><text :x="pad.l-8" :y="t.y+4" text-anchor="end">{{ t.label }}</text></g>
              </g>
              <g class="axis axis-bottom">
                <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
                <g v-for="(x,i) in xTicksMonth" :key="'mx'+i">
                  <line :x1="x.x" :x2="x.x" :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">{{ x.label }}</text>
                </g>
              </g>
              <g fill="url(#monthGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="monthGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#ffb22e" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#ffb22e" stop-opacity=".35"/>
                  </linearGradient>
                </defs>
                <rect
                  v-for="(b,i) in barsGeomMonth"
                  :key="'mb'+i"
                  class="bar"
                  :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="10"
                  @mouseenter="onBarEnter('month', i, $event)"
                  @mousemove="onBarMove('month', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>{{ monthSeries[i].label }}: {{ fmt(valuesMonth[i], valuesMonth[i]>=10?0:1) }}</title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b,i) in barsGeomMonth"
                  :key="'lblm'+i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesMonth[i], valuesMonth[i]>=10?0:1) }}
                </text>
              </g>
            </svg>
            <div class="edb-empty" v-else>데이터가 없습니다. IMEI를 입력 후 조회를 눌러주세요.</div>

            <div
              v-if="tip.show && tip.chart==='month'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">{{ fmt(tip.value, tip.value>=10?0:1) }}</div>
            </div>
          </div>
          <p class="edb-range" v-if="monthRangeText">집계기간: {{ monthRangeText }}</p>
        </article>

        <!-- 연간 -->
        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3><span class="edb-dot edb-dot--cyan"></span>연간발전량</h3>
            <span class="edb-chip">kWh</span>
          </div>
          <div class="edb-chart__body" ref="yearWrap">
            <svg v-if="yearSeries.length" :viewBox="yearViewBox" class="edb-svg-chart" :style="axisStyle" aria-hidden="true">
              <g class="grid"><line v-for="(t,i) in yTicksYear" :key="'gy'+i" :x1="pad.l" :x2="vb.w-pad.r" :y1="t.y" :y2="t.y"/></g>
              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
                <g v-for="(t,i) in yTicksYear" :key="'yl'+i"><text :x="pad.l-8" :y="t.y+4" text-anchor="end">{{ t.label }}</text></g>
              </g>
              <g class="axis axis-bottom">
                <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
                <g v-for="(x,i) in xTicksYear" :key="'xt'+i">
                  <line :x1="x.x" :x2="x.x" :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">{{ x.label }}</text>
                </g>
              </g>
              <g fill="url(#yearGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="yearGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#22d3ee" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#22d3ee" stop-opacity=".35"/>
                  </linearGradient>
                </defs>
                <rect
                  v-for="(b, i) in barsGeomYear"
                  :key="'yb'+i"
                  class="bar"
                  :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="10"
                  @mouseenter="onBarEnter('year', i, $event)"
                  @mousemove="onBarMove('year', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>{{ bucketsYear[i] }}: {{ fmt(valuesYear[i], valuesYear[i]>=10?0:1) }}</title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b,i) in barsGeomYear"
                  :key="'lbly'+i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesYear[i], valuesYear[i]>=10?0:1) }}
                </text>
              </g>
            </svg>
            <div class="edb-empty" v-else>데이터가 없습니다. IMEI를 입력 후 조회를 눌러주세요.</div>

            <div
              v-if="tip.show && tip.chart==='year'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">{{ fmt(tip.value, tip.value>=10?0:1) }}</div>
            </div>
          </div>
          <p class="edb-range" v-if="yearRangeText">집계기간: {{ yearRangeText }}</p>
        </article>
      </section>

      <!-- 2행: 요약 · 날짜별 상세 -->
      <section class="edb-grid edb-bottom2">
        <!-- 요약 -->
        <section class="edb-card edb-summary">
          <div class="edb-sum-hd">
            <h4 class="edb-sum__title">요약 정보</h4>
          </div>

          <div class="edb-sum-grid">
            <article class="edb-sum-block">
              <div class="edb-detail-hd"><h3 class="edb-detail__title">발전량</h3></div>
              <div class="edb-table-wrap edb-thin-scroll">
                <table class="edb-tbl edb-tbl--kpi">
                  <thead>
                    <tr>
                      <th style="text-align:center;">지표</th>
                      <th class="ar">수치</th>
                      <th class="ar">단위</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>일간</td>
                      <td class="edb-num">{{ fmt(summary.today_kwh, 2) }}</td>
                      <td class="edb-num">kWh</td>
                    </tr>
                    <tr>
                      <td>주간</td>
                      <td class="edb-num">{{ fmt(kpiWeek.kwh, 2) }}</td>
                      <td class="edb-num">kWh</td>
                    </tr>
                    <tr>
                      <td>월간</td>
                      <td class="edb-num">{{ fmt(kpiMonth.kwh, 2) }}</td>
                      <td class="edb-num">kWh</td>
                    </tr>
                    <tr>
                      <td>연간</td>
                      <td class="edb-num">{{ fmt(kpiYear.kwh, 2) }}</td>
                      <td class="edb-num">kWh</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <!-- 환경 기여도 -->
            <article class="edb-sum-block">
              <div class="edb-detail-hd"><h3 class="edb-detail__title">환경 기여도</h3></div>
              <div class="edb-table-wrap edb-thin-scroll">
                <table class="edb-tbl edb-tbl--kpi">
                  <thead>
                    <tr>
                      <th style="text-align :center;">지표</th>
                      <th class="ar">수치</th>
                      <th class="ar">단위</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>CO₂ 절감량 - 주간</td>
                      <td class="edb-num">{{ fmt(kpiWeek.co2, 2) }}</td>
                      <td class="edb-num">kg</td>
                    </tr>
                    <tr>
                      <td>CO₂ 절감량 - 월간</td>
                      <td class="edb-num">{{ fmt(kpiMonth.co2, 2) }}</td>
                      <td class="edb-num">kg</td>
                    </tr>
                    <tr>
                      <td>CO₂ 절감량 - 연간</td>
                      <td class="edb-num">{{ fmt(kpiYear.co2, 2) }}</td>
                      <td class="edb-num">kg</td>
                    </tr>
                    <tr>
                      <td>식수 효과 - 주간</td>
                      <td class="edb-num">{{ fmt(kpiWeek.trees, 0) }}</td>
                      <td class="edb-num">그루</td>
                    </tr>
                    <tr>
                      <td>식수 효과 - 월간</td>
                      <td class="edb-num">{{ fmt(kpiMonth.trees, 0) }}</td>
                      <td class="edb-num">그루</td>
                    </tr>
                    <tr>
                      <td>식수 효과 - 연간</td>
                      <td class="edb-num">{{ fmt(kpiYear.trees, 0) }}</td>
                      <td class="edb-num">그루</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>

        <!-- 날짜별 상세 -->
        <section class="edb-card edb-detail" aria-live="polite">
          <div class="edb-detail-hd">
            <h3 class="edb-detail__title">시간별 상세정보</h3>
            <div class="edb-detail-meta" v-if="detailDay">
              <span class="edb-meta">기준 날짜: <b>{{ detailDay }}</b></span>
            </div>
          </div>

          <div class="edb-detail-body">
            <div v-if="!detailRows.length && loading" class="edb-detail-empty">
              <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
            </div>

            <div v-else class="edb-table-wrap edb-thin-scroll">
              <table class="edb-tbl">
                <thead>
                  <tr>
                    <th style="width:62px">시</th>
                    <th>발전량(kWh)</th>
                    <th>날씨/기온</th>
                    <th>CO₂저감량(kg)</th>
                  </tr>
                </thead>
<tbody>
  <!-- 기존: v-for="(r, i) in detailRows" -->
  <tr v-for="(r, i) in detailRowsVisible" :key="'hr'+i">
    <td>{{ r.hour.replace(':00','시') }}</td>
    <td class="edb-num">{{ fmt(r.kwh, 1) }}</td>
    <td class="edb-num">{{ r.weather || '—' }}</td>
    <td class="edb-num">{{ r.co2_kg==null ? '—' : fmt(r.co2_kg, 2) }}</td>
  </tr>
</tbody>

              </table>
            </div>
          </div>
        </section>
      </section>

      <!-- 로딩 오버레이 -->
      <div v-if="loading" class="edb-loading-overlay" role="status" aria-live="polite">
        <div class="edb-spinner-neo"></div>
        <div class="edb-loading-text">불러오는 중…</div>
      </div>
    </div>

    <!-- ===== 다운로드 모달 ===== -->
    <div v-if="showDl" class="edb-modal-backdrop" @click.self="closeDownloadModal">
      <div class="edb-modal">
        <header class="edb-modal-hd">
          <div class="edb-modal-ico">⬇</div>
          <div class="edb-modal-title">데이터 다운로드</div>
          <button class="edb-modal-x" @click="closeDownloadModal">✕</button>
        </header>

        <div class="edb-modal-body">
          <p class="edb-modal-desc">다운로드할 기간을 선택해주세요.</p>
          <div class="edb-modal-row">
            <label class="edb-modal-label">연도</label>
            <div class="edb-modal-input">
              <select v-model.number="dlYear" class="edb-modal-select">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
              </select>
            </div>
          </div>
          <div class="edb-modal-row">
            <label class="edb-modal-label">월</label>
            <div class="edb-modal-input">
              <select v-model.number="dlMonth" class="edb-modal-select">
                <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
              </select>
            </div>
          </div>
          <div class="edb-modal-tip">선택된 기간: <b>{{ dlYear }}년 {{ dlMonth }}월</b></div>
        </div>

        <footer class="edb-modal-ftr">
          <button class="edb-btn edb-btn--ghost" @click="closeDownloadModal">취소</button>
          <button class="edb-btn edb-btn--primary" :disabled="downloading" @click="doDownload">
            <span v-if="!downloading">다운로드</span>
            <span v-else>다운로드 중...</span>
          </button>
        </footer>
      </div>
    </div>
  </main>
</template>

<script>
import '@/assets/css/energy-dashboard.css'

// 계산 상수
const CO2_FACTOR = 0.4747; // kg/kWh
const TREE_KG = 6.6;       // 1그루가 연간 흡수하는 CO₂(kg) 가정
const DUMMY_CAP_KW = 3;

const SKY_LABEL = { '1':'맑음', '3':'구름많음', '4':'흐림' };
const PTY_LABEL = { '0':'없음','1':'비','2':'비/눈','3':'눈','5':'빗방울','6':'빗방울/눈날림','7':'눈날림' };

const DEFAULT_IMEI = '';
const round2 = v => Math.round(v * 100) / 100;

export default {
  name: 'EnergyDashboard',
  data () {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    return {
      imeiField: DEFAULT_IMEI,
      regionField: 'yesan',
      energyField: '01',
      typeField: '',
      multiField: '', // '' | '00'|'01'|'02'|'03'

      // 주간
      bars: [], totalKwh: 0, weekRangeUtc: null,
      detailDay: '', detailRows: [],

      // 요약
      summary: {
        capacity_kw: DUMMY_CAP_KW,
        today_kwh: 0, month_kwh: 0, year_kwh: 0,
        co2_kg: 0, trees: 0,
        install_date: null, monitor_start: null
      },

      // 월/연
      monthSeries: [], yearSeries: [],
      monthRangeUtc: null, yearRangeUtc: null,

      // KPI 캐시
      kpis: { totalKwh: 0, totalCo2: 0, totalTrees: 0 },

      avgEff: null,

      loading: false, errorMsg: '',
      vb: { w: 1000, h: 420 }, pad: { t: 24, r: 32, b: 60, l: 44 },
      axisXFontPx: 20, axisYFontPx: 16, resizeObserver: null,

      tip: { show:false, x:0, y:0, chart:null, label:'', value:0 },
      showValueLabels: true,

      // 다운로드 모달
      showDl: false,
      dlYear: y,
      dlMonth: m,
      downloading: false,
      yearOptions: Array.from({ length: 11 }, (_, i) => y - i),

      hasSearched: false,
    }
  },
  computed: {
detailRowsVisible() {
  const rows = Array.isArray(this.detailRows) ? this.detailRows : [];

  const inWindow = rows.filter(r => {
    const hh = this.toHH(r.hour);           // "08:00" → "08"
    if (hh == null) return false;
    const n = Number(hh);
    return n >= 6 && n <= 18;
  });

  let last = -1;
  for (let i = inWindow.length - 1; i >= 0; i--) {
    const v = inWindow[i]?.kwh;
    if (v != null && Number.isFinite(Number(v))) { last = i; break; }
  }
  return last >= 0 ? inWindow.slice(0, last + 1) : inWindow;
},
    trendDay(){
      const base = this.summary.today_kwh || 0;
      return Math.min(99, Math.max(0, Math.round(base * 1.2)));
    },

    /* ===== 주간 ===== */
    maxY(){ return Math.max(...this.bars.map(b => b.y || 0), 1) },
    inner(){ return { w: this.vb.w - this.pad.l - this.pad.r, h: this.vb.h - this.pad.t - this.pad.b } },
    stepW(){ return this.bars.length ? this.inner.w / this.bars.length : 0 },
    barW(){ return Math.max(10, this.stepW * 0.6) },
    yTicks(){
      const max=this.maxY, step=max/4, arr=[]
      for(let i=0;i<=4;i++){ const v=step*i; const y=this.pad.t+(1-v/max)*this.inner.h; arr.push({y,label:this.fmt(v, v>=10?0:1)}) }
      return arr
    },
    xTicks(){
      const out=[], n=this.bars.length
      for(let i=0;i<n;i++){
        const x=this.pad.l+i*this.stepW+this.stepW/2
        out.push({ x, label: this.formatDay(this.bars[i].x) })
      }
      return out
    },
    barsGeom(){
      const g=[], max=this.maxY
      for(let i=0;i<this.bars.length;i++){
        const v=this.bars[i].y||0, cx=this.pad.l+i*this.stepW+this.stepW/2, w=this.barW, x=cx-w/2
        const y=this.pad.t+(1-v/max)*this.inner.h, h=(this.pad.t+this.inner.h)-y
        g.push({x,y,w,h,cx})
      }
      return g
    },
    valuesWeek(){ return this.bars.map(b=>b.y||0) },
    bucketsWeek(){ return this.bars.map(b=>b.x) },

    /* ===== 월(주차) ===== */
    maxMonth(){ return Math.max(...this.monthSeries.map(b=>b.y||0),1) },
    stepWMonth(){ return this.monthSeries.length ? this.inner.w / this.monthSeries.length : 0 },
    barWMonth(){ return Math.max(10, this.stepWMonth*0.6) },
    yTicksMonth(){
      const max=this.maxMonth, step=max/4, arr=[]
      for(let i=0;i<=4;i++){ const v=step*i; const y=this.pad.t+(1-v/max)*this.inner.h; arr.push({y,label:this.fmt(v, v>=10?0:1)}) }
      return arr
    },
    xTicksMonth(){
      const out=[], n=this.monthSeries.length
      for(let i=0;i<n;i++){
        const x=this.pad.l+i*this.stepWMonth+this.stepWMonth/2
        out.push({ x, label: this.monthSeries[i].label })
      }
      return out
    },
    barsGeomMonth(){
      const g=[], max=this.maxMonth
      for(let i=0;i<this.monthSeries.length;i++){
        const v=this.monthSeries[i].y||0, cx=this.pad.l+i*this.stepWMonth+this.stepWMonth/2, w=this.barWMonth, x=cx-w/2
        const y=this.pad.t+(1-v/max)*this.inner.h, h=(this.pad.t+this.inner.h)-y; g.push({x,y,w,h,cx})
      } return g
    },
    valuesMonth(){ return this.monthSeries.map(s=>s.y||0) },
    bucketsMonth(){ return this.monthSeries.map(s=>s.label) },

    /* ===== 연(YTD) ===== */
    maxYear(){ return Math.max(...this.yearSeries.map(b=>b.y||0),1) },
    stepWYear(){ return this.yearSeries.length ? this.inner.w / this.yearSeries.length : 0 },
    barWYear(){ return Math.max(10, this.stepWYear*0.6) },
    yTicksYear(){
      const max=this.maxYear, step=max/4, arr=[]
      for(let i=0;i<=4;i++){ const v=step*i; const y=this.pad.t+(1-v/max)*this.inner.h; arr.push({y,label:this.fmt(v, v>=10?0:1)}) }
      return arr
    },
    xTicksYear(){
      const out=[], n=this.yearSeries.length, every=n>12?Math.ceil(n/12):1
      for(let i=0;i<n;i+=every){
        const x=this.pad.l+i*this.stepWYear+this.stepWYear/2
        out.push({ x, label: this.yearSeries[i].x })
      }
      return out
    },
    barsGeomYear(){
      const g=[], max=this.maxYear
      for(let i=0;i<this.yearSeries.length;i++){
        const v=this.yearSeries[i].y||0, cx=this.pad.l+i*this.stepWYear+this.stepWYear/2, w=this.barWYear, x=cx-w/2
        const y=this.pad.t+(1-v/max)*this.inner.h, h=(this.pad.t+this.inner.h)-y; g.push({x,y,w,h,cx})
      } return g
    },
    yearExtraLeft(){
      const max = this.maxYear || 0;
      const s = this.fmt(max, max >= 10 ? 0 : 1);
      const est = Math.ceil(s.length * this.axisYFontPx * 0.6) + 12;
      return Math.max(0, est - this.pad.l);
    },
    yearViewBox(){
      return `${-this.yearExtraLeft} 0 ${this.vb.w + this.yearExtraLeft} ${this.vb.h}`;
    },
    valuesYear(){ return this.yearSeries.map(s=>s.y||0) },
    bucketsYear(){ return this.yearSeries.map(s=>s.x) },

    monthRangeText(){ return this.rangeText(this.monthRangeUtc) },
    yearRangeText(){ return this.rangeText(this.yearRangeUtc) },
    weekRangeText(){ return this.rangeText(this.weekRangeUtc) },

    axisStyle(){ return {'--axis-x-font': this.axisXFontPx+'px','--axis-y-font': this.axisYFontPx+'px'} },

    // ===== KPI (차트 집계에 100% 일치) =====
    kpiWeek(){
      const kwh = this.totalKwh || 0;
      return { kwh, co2: this.co2(kwh), trees: this.treesFromKwh(kwh) };
    },
    kpiMonth(){
      const kwh = this.monthSeries.reduce((s,r)=>s+(r.y||0),0);
      return { kwh: round2(kwh), co2: this.co2(kwh), trees: this.treesFromKwh(kwh) };
    },
    kpiYear(){
      const kwh = this.yearSeries.reduce((s,r)=>s+(r.y||0),0);
      return { kwh: round2(kwh), co2: this.co2(kwh), trees: this.treesFromKwh(kwh) };
    },

    // 멀티 라벨
    multiLabel(){
      if (!this.multiField) return '';
      const map = { '00': '설비 0', '01': '설비 1', '02': '설비 2', '03': '설비 3' };
      return map[this.multiField] || `설비 ${this.multiField}`;
    },

    /* ===== 다운로드 가능 여부 ===== */
    hasAnyData(){
      return (this.bars && this.bars.length)
          || (this.monthSeries && this.monthSeries.length)
          || (this.yearSeries && this.yearSeries.length);
    },
    canDownload(){
      return this.hasSearched && !!this.hasAnyData;
    },
  },
  // <script> 안에 추가 (watch)
watch: {
  '$route.query'(q) {
    const imei = (q.imei || '').toString().trim()
    if (imei && imei !== this.imeiField) {
      this.imeiField = imei
      this.typeField  = typeof q.type  === 'string' ? q.type  : ''
      this.multiField = typeof q.multi === 'string' ? q.multi : ''
      this.onSearch()
    }
  }
},
  methods: {
    fmt(v,d=0){ return v==null?'—':Number(v).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}) },
    dash(v){ return (v==null||v==='')?'-':`${v}` },
    formatDay(ymd){ const m=ymd?.match?.(/^(\d{4})-(\d{2})-(\d{2})$/); return m?`${Number(m[3])}일`:(ymd||'') },
    rangeText(r){ if(!r?.start||!r?.end) return ''; const f=(iso)=>new Date(iso).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'}); return `${f(r.start)} ~ ${f(r.end)}`; },
    co2(kwh){ return round2(kwh * CO2_FACTOR) },
    treesFromKwh(kwh){ const co2 = kwh * CO2_FACTOR; return Math.round(co2 / TREE_KG) },

    updateAxisFonts(){
      const wrap=this.$refs.monthWrap||this.$refs.yearWrap, w=wrap?wrap.clientWidth:0
      const containerWidth=w||this.$el.clientWidth||360, scale=containerWidth/this.vb.w
      const TARGET_X=13,TARGET_Y=12
      this.axisXFontPx=Math.max(14,Math.min(Math.round(TARGET_X/Math.max(scale,.3)),48))
      this.axisYFontPx=Math.max(13,Math.min(Math.round(TARGET_Y/Math.max(scale,.3)),44))
    },

    aggregateWeeksFromDaily(dailySeries){
      let yearStr = null, monthStr = null
      if (Array.isArray(dailySeries) && dailySeries.length) {
        const b = String(dailySeries.find(r => r?.bucket)?.bucket || '')
        const m = b.match(/^(\d{4})-(\d{2})-\d{2}$/)
        if (m) { yearStr = m[1]; monthStr = m[2] }
      }
      if (!yearStr || !monthStr) {
        const now = new Date()
        yearStr = String(now.getFullYear())
        monthStr = String(now.getMonth() + 1).padStart(2, '0')
      }

      const y = parseInt(yearStr, 10)
      const mo = parseInt(monthStr, 10)
      const lastDay = new Date(y, mo, 0).getDate()

      const weeks = [1,2,3,4,5]
      const empty = new Map(
        weeks.map(wn => {
          const startDay = (wn - 1) * 7 + 1
          const endDay = Math.min(wn * 7, lastDay)
          return [wn, { y:0, co2:0, trees:0, startDay, endDay }]
        })
      )

      if (Array.isArray(dailySeries)) {
        for (const row of dailySeries) {
          const b = String(row.bucket || '')
          const m = b.match(/^(\d{4})-(\d{2})-(\d{2})$/)
          if (!m) continue
          const dd = parseInt(m[3], 10)
          const wn = Math.floor((dd - 1) / 7) + 1
          const g = empty.get(wn)
          if (!g) continue
          const kwh = Number(row.kwh || 0)
          g.y    += kwh
          g.co2  += this.co2(kwh)
          g.trees += this.treesFromKwh(kwh)
        }
      }

      const series = weeks.map(wn => {
        const g = empty.get(wn)
        return {
          x: `W${wn}`,
          label: `${wn}주`,
          y: round2(g.y),
          co2: round2(g.co2),
          trees: Math.round(g.trees),
          rangeText: `${yearStr}-${monthStr}-${String(g.startDay).padStart(2,'0')} ~ ${yearStr}-${monthStr}-${String(g.endDay).padStart(2,'0')}`
        }
      })

      return { series }
    },

    ensureYearMonths(yearSeriesRaw, targetYear){
      const y = Number(targetYear) || new Date().getFullYear()
      const map = new Map()

      if (Array.isArray(yearSeriesRaw)) {
        for (const row of yearSeriesRaw) {
          const b = String(row.bucket || row.x || '')
          const m = b.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/)
          if (!m) continue
          const yyyy = Number(m[1])
          const mm   = m[2]
          if (yyyy !== y) continue
          const key = `${yyyy}-${mm}`

          const cur = map.get(key) || { kwh:0 }
          const kwh = Number(row.kwh ?? row.y ?? 0)
          cur.kwh  += kwh
          map.set(key, cur)
        }
      }

      const out = []
      for (let m = 1; m <= 12; m++){
        const mm = String(m).padStart(2,'0')
        const key = `${y}-${mm}`
        const agg = map.get(key) || { kwh:0 }
        out.push({
          x: `${m}월`,
          y: round2(agg.kwh),
          rawKey: key
        })
      }
      return out
    },

    async fetchRange(range, withHourly=false){
      const imei=this.imeiField?.trim()
      const params=new URLSearchParams({ rtuImei: imei, range })
      if(this.energyField) params.set('energy', this.energyField)
      if(this.typeField)   params.set('type', this.typeField)
      if(this.multiField)  params.set('multi', this.multiField) // ★ 멀티 전달
      if(withHourly)       params.set('detail', 'hourly')
      const r=await fetch(`/api/energy/electric/series?${params.toString()}`)
      if(!r.ok) throw new Error('데이터를 가져오지 못했습니다.')
      return r.json()
    },

    // ▼ AnalysisTimeseries.vue와 동일한 소스에서 ‘오늘 시간대별’ 로딩
    async fetchHourlyLikeAT(){
      const imei=this.imeiField?.trim()
      if(!imei) return []
      const params=new URLSearchParams({ rtuImei: imei, energy: this.energyField || '01' })
      if (this.typeField) params.set('type', this.typeField)
      const r = await fetch(`/api/energy/electric/hourly?${params.toString()}`)
      if(!r.ok) return []
      const j = await r.json()
      const hours = Array.isArray(j?.hours) ? j.hours : []
      return hours
        .map(h => ({ hour: String(h.hour).padStart(2,'0'), kwh: (h.kwh==null?null:Number(h.kwh)) }))
        .sort((a,b) => a.hour.localeCompare(b.hour))
    },

    async fetchWeatherHourlyByImei(){
      const imei = this.imeiField?.trim()
      if(!imei) return { base_date:null, base_time:null, hourly: [] }
      const r = await fetch(`/api/weather/vilageFcst/by-imei?imei=${encodeURIComponent(imei)}`)
      if(!r.ok) return { base_date:null, base_time:null, hourly: [] }
      const j = await r.json()
      return { base_date: j.base_date || null, base_time: j.base_time || null, hourly: Array.isArray(j.hourly)? j.hourly: [] }
    },

    toHH(h) {
      if (h == null) return null;
      const s = String(h).trim();
      let m = s.match(/^(\d{1,2})\s*:\s*\d{2}$/); if (m) return m[1].padStart(2, '0');
      m = s.match(/^(\d{1,2})\s*시$/);          if (m) return m[1].padStart(2, '0');
      m = s.match(/^(\d{1,2})\d{2}$/);          if (m) return m[1].padStart(2, '0');
      m = s.match(/^(\d{1,2})$/);               if (m) return m[1].padStart(2, '0');
      return null;
    },
    skyText(code){ return SKY_LABEL[String(code)] ?? null; },
    ptyText(code){ return PTY_LABEL[String(code)] ?? null; },
    makeWeatherLabel(row){
      const sky = this.skyText(row.SKY);
      const pty = this.ptyText(row.PTY);
      const ta  = (row.TA!=null && !Number.isNaN(row.TA)) ? `${row.TA}℃` : null;
      const hasPty = String(row.PTY) !== '0' && row.PTY != null;
      const cond = hasPty ? [sky, pty].filter(Boolean).join(', ') : sky;
      const label = [cond, ta].filter(Boolean).join(' / ');
      return label || '—';
    },

    async onSearch(){
      const imei=this.imeiField?.trim(); if(!imei) return
      this.loading=true; this.errorMsg=''
      this.hasSearched = false;

      // 초기화
      this.bars=[]; this.totalKwh=0; this.detailDay=''; this.detailRows=[]
      this.monthSeries=[]; this.yearSeries=[]; this.monthRangeUtc=null; this.yearRangeUtc=null; this.weekRangeUtc=null
      this.summary={capacity_kw:DUMMY_CAP_KW,today_kwh:0,month_kwh:0,year_kwh:0,co2_kg:0,trees:0,install_date:null,monitor_start:null}
      this.kpis={ totalKwh:0,totalCo2:0,totalTrees:0 }
      this.avgEff=null

      this.$router?.replace({ query:{
        imei,
        energy:this.energyField||undefined,
        type:this.typeField||undefined,
        multi:this.multiField||undefined
      }})

      try{
        //  주간(차트용) +  오늘 시간대별(표/일간 KPI용)
        const [weekly, hourly] = await Promise.all([
          this.fetchRange('weekly', false),
          this.fetchHourlyLikeAT()
        ])

        // 주간 차트
        this.bars=(weekly.series||[]).map(s=>({x:s.bucket,y:s.kwh}))
        this.totalKwh=round2(weekly.summary?.total_kwh ?? this.bars.reduce((a,c)=>a+(c.y||0),0))
        this.weekRangeUtc=weekly.range_utc||null

        // 시간대별 상세정보: AnalysisTimeseries와 동일 소스 사용
        const kstToday = new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' }).replace(/\./g,'-')
        this.detailDay = kstToday
        this.detailRows = (hourly||[]).map(h => ({
          hour: `${h.hour}:00`,
          kwh: (h.kwh==null ? null : round2(h.kwh)),
          co2_kg: (h.kwh==null ? null : round2(this.co2(h.kwh))),
          weather: '—'
        }))
        // 금일 합계
        const todaySum = (hourly||[]).reduce((s,x)=> (Number.isFinite(x.kwh) ? s + x.kwh : s), 0)
        this.summary.today_kwh = round2(todaySum)
        this.avgEff=13.9

        // 시간대별 날씨 병합
        const wx = await this.fetchWeatherHourlyByImei()
        if (wx.hourly.length){
          const wmap = new Map(wx.hourly.map(h => [ this.toHH(h.hour), h ]))
          this.detailRows = this.detailRows.map(r => {
            const key = this.toHH(r.hour)
            const w = key ? wmap.get(key) : null
            return w ? { ...r, weather: this.makeWeatherLabel(w) } : r
          })
        }

        // 월간(일별) / 연간(YTD)
        const now=new Date(); const y=now.getFullYear(); const m=String(now.getMonth()+1).padStart(2,'0'); const ym=`${y}-${m}`
        const [monthly,yearly]=await Promise.all([ this.fetchRange('monthly'), this.fetchRange('yearly') ])

        // 월간: 주차 집계
        this.monthRangeUtc=monthly.range_utc||null
        const monthAgg = this.aggregateWeeksFromDaily(monthly.series || [])
        this.monthSeries = monthAgg.series
        this.summary.month_kwh = round2((monthly.series||[])
          .filter(r => String(r.bucket||'').startsWith(ym))
          .reduce((s,r)=>s+(r.kwh||0),0))

        // 연간: 월 보정
        this.yearSeries = this.ensureYearMonths(yearly.series || [], y)
        this.yearRangeUtc=yearly.range_utc||null
        this.summary.year_kwh = round2(this.yearSeries.reduce((s,r)=>s+(r.y||0),0))

        // KPI 캐시
        this.kpis.totalKwh  = this.summary.year_kwh
        this.kpis.totalCo2  = this.co2(this.kpis.totalKwh)
        this.kpis.totalTrees= this.treesFromKwh(this.kpis.totalKwh)

        // 주간 환경 KPIs
        this.summary.co2_kg = this.co2(this.totalKwh)
        this.summary.trees  = this.treesFromKwh(this.totalKwh)

        if(!this.bars.length && !this.monthSeries.length && !this.yearSeries.length){
          this.errorMsg='선택한 조건에 해당하는 데이터가 없습니다.'
        }

        this.hasSearched = true
        this.$nextTick(this.updateAxisFonts)

        this.assertAggregateOrder()
      } catch(e){
        this.errorMsg=e?.message||'오류가 발생했습니다.'
        console.error('[EnergyDashboard:onSearch]', e)
      } finally{
        this.loading=false
      }
    },

    reset(){
      this.imeiField=''
      this.regionField='yesan'
      this.energyField='01'
      this.typeField=''
      this.multiField=''

      this.bars=[]; this.totalKwh=0; this.errorMsg=''; this.detailDay=''; this.detailRows=[]
      this.monthSeries=[]; this.yearSeries=[]; this.monthRangeUtc=null; this.yearRangeUtc=null; this.weekRangeUtc=null
      this.summary={capacity_kw:DUMMY_CAP_KW,today_kwh:0,month_kwh:0,year_kwh:0,co2_kg:0,trees:0,install_date:null,monitor_start:null}
      this.kpis={ totalKwh:0,totalCo2:0,totalTrees:0 }; this.avgEff=null
      this.hasSearched = false
      this.$router?.replace({ query:{} })
    },

    onBarEnter(chart, idx, evt){ this.updateTip(chart, idx, evt); this.tip.show = true },
    onBarMove(chart, idx, evt){ this.updateTip(chart, idx, evt) },
    onBarLeave(){ this.tip.show = false },
    updateTip(chart, idx, evt){
      let label='', value=0, wrap=null
      if(chart==='week'){ label = this.formatDay(this.bucketsWeek[idx]); value = this.valuesWeek[idx]||0; wrap = this.$refs.weekWrap }
      else if(chart==='month'){ label = this.monthSeries[idx]?.label || this.bucketsMonth[idx]; value = this.valuesMonth[idx]||0; wrap = this.$refs.monthWrap }
      else if(chart==='year'){ label = this.bucketsYear[idx]; value = this.valuesYear[idx]||0; wrap = this.$refs.yearWrap }

      const rect = wrap?.getBoundingClientRect?.()
      const cx = evt.clientX - (rect?.left || 0)
      const cy = evt.clientY - (rect?.top || 0)

      const margin = 10
      const maxX = (rect?.width || 0) - 140
      const maxY = (rect?.height || 0) - 60
      const x = Math.min(Math.max(cx + 8, margin), maxX)
      const y = Math.min(Math.max(cy - 36, margin), maxY)

      this.tip = { show:true, x, y, chart, label, value }
    },

    /* CSV 다운로드 */
    openDownloadModal(){
      if(!this.canDownload){
        alert('먼저 조회를 수행하여 데이터를 불러와 주세요.')
        return
      }
      const now = new Date()
      this.dlYear = now.getFullYear()
      this.dlMonth = now.getMonth() + 1
      this.showDl = true
    },
    closeDownloadModal(){
      if (this.downloading) return
      this.showDl = false
    },
    async doDownload(){
      const imei = this.imeiField?.trim()
      if(!imei){ alert('IMEI가 없습니다.'); return }

      if(!this.dlYear || !this.dlMonth){ alert('연/월을 선택해주세요.'); return }

      try{
        this.downloading = true
        const qs = new URLSearchParams({ imei, year: String(this.dlYear), month: String(this.dlMonth) })
        if (this.multiField) qs.set('multi', this.multiField) // ★ 멀티 전달
        const url = `/api/export/month-csv?${qs.toString()}`
        const res = await res.fetch(url)
        if(!res.ok){
          let msg = `다운로드 실패 (HTTP ${res.status})`
          try {
            const j = await res.json();
            if (j && j.error) msg = j.error;
          } catch (_e) { /* non-JSON 응답일 수 있음 */ }
          throw new Error(msg)
        }
        const blob = await res.blob()

        let filename = `월별_${imei}_${this.dlYear}-${String(this.dlMonth).padStart(2,'0')}${this.multiField?`_multi-${this.multiField}`:''}.csv`
        const cd = res.headers.get('Content-Disposition') || ''
        const m = cd.match(/filename\*=UTF-8''([^;]+)/i)
        if (m && m[1]) filename = decodeURIComponent(m[1])

        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(a.href)

        this.showDl = false
      } catch(e){
        alert(e?.message || '다운로드 중 오류가 발생했습니다.')
      } finally{
        this.downloading = false
      }
    },

    // 개발용 가드: 연간 ≥ 월간 ≥ 주간 확인
    assertAggregateOrder(){
      const w = this.kpiWeek.kwh || 0;
      const m = this.kpiMonth.kwh || 0;
      const y = this.kpiYear.kwh  || 0;
      if (y + 1e-6 < m || m + 1e-6 < w) {
        console.warn('[EnergyDashboard] Aggregate order broke (Y<M or M<W)', { w, m, y });
      }
    }
  },
  mounted(){
    const q = this.$route?.query || {}
    this.imeiField = (typeof q.imei === 'string' && q.imei.trim()) ? q.imei.trim() : DEFAULT_IMEI
    this.energyField = '01'
    this.typeField   = typeof q.type === 'string' ? q.type : ''
    this.multiField  = typeof q.multi === 'string' ? q.multi : ''

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.updateAxisFonts())
      this.resizeObserver.observe(this.$el)
    } else {
      window.addEventListener('resize', this.updateAxisFonts)
    }
    this.$nextTick(this.updateAxisFonts)

    if (q.imei && String(q.imei).trim()) this.onSearch()
  },
  beforeDestroy(){
    if(this.resizeObserver) this.resizeObserver.disconnect()
    else window.removeEventListener('resize', this.updateAxisFonts)
  }
}
</script>
