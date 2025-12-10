<template>
  <main class="edb-page">
    <div class="edb-inner">
      <section class="edb-stat-row edb-center edb-stat-row--triple">
        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">주간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiWeek.kwh, 2) }}</b
              ><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              CO₂ {{ fmt(kpiWeek.co2, 2) }} kg · 식수
              {{ fmt(kpiWeek.trees, 0) }} 그루
            </div>
            <div v-if="weekRangeText" class="edb-stat-sub edb-muted">
              집계: {{ weekRangeText }}
            </div>
          </div>
        </article>

        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">월간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiMonth.kwh, 2) }}</b
              ><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              CO₂ {{ fmt(kpiMonth.co2, 2) }} kg · 식수
              {{ fmt(kpiMonth.trees, 0) }} 그루
            </div>
            <div v-if="monthRangeText" class="edb-stat-sub edb-muted">
              집계: {{ monthRangeText }}
            </div>
          </div>
        </article>

        <article class="edb-stat edb-card">
          <div class="edb-stat-main">
            <div class="edb-stat-title">연간발전량</div>
            <div class="edb-stat-value">
              <b>{{ fmt(kpiYear.kwh, 2) }}</b
              ><span>kWh</span>
            </div>
            <div class="edb-stat-sub edb-ok">
              누적 CO₂ {{ fmt(kpiYear.co2, 2) }} kg · 식수
              {{ fmt(kpiYear.trees, 0) }} 그루
            </div>
            <div v-if="yearRangeText" class="edb-stat-sub edb-muted">
              집계: {{ yearRangeText }}
            </div>
          </div>
        </article>
      </section>

      <section class="edb-charts3">
        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3><span class="edb-dot edb-dot--cyan"></span>주간발전량</h3>
            <span v-if="bars.length" class="edb-chip edb-chip--strong">
              합계 {{ fmt(totalKwh, 2) }} kWh
            </span>
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
                <line
                  v-for="(t, i) in yTicks"
                  :key="'gy' + i"
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="t.y"
                  :y2="t.y"
                />
              </g>

              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h - pad.b" />
                <g v-if="!isMobile" v-for="(t, i) in yTicks" :key="'yl' + i">
                  <text :x="pad.l - 8" :y="t.y + 4" text-anchor="end">
                    {{ t.label }}
                  </text>
                </g>
              </g>

              <g class="axis axis-bottom">
                <line
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="vb.h - pad.b"
                  :y2="vb.h - pad.b"
                />
                <g v-for="(x, i) in xTicks" :key="'xt' + i">
                  <line
                    :x1="x.x"
                    :x2="x.x"
                    :y1="vb.h - pad.b"
                    :y2="vb.h - pad.b + 5"
                  />
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">
                    {{ x.label }}
                  </text>
                </g>
              </g>

              <g fill="url(#barGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#34d5ff" stop-opacity="1" />
                    <stop
                      offset="100%"
                      stop-color="#34d5ff"
                      stop-opacity=".35"
                    />
                  </linearGradient>
                  <filter
                    id="dropShadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="2"
                      flood-opacity="0.25"
                    />
                  </filter>
                </defs>

                <rect
                  v-for="(b, i) in barsGeom"
                  :key="'b' + i"
                  class="bar"
                  :x="b.x"
                  :y="b.y"
                  :width="b.w"
                  :height="b.h"
                  rx="10"
                  @mouseenter="onBarEnter('week', i, $event)"
                  @mousemove="onBarMove('week', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>
                    {{ formatDay(bucketsWeek[i]) }}:
                    {{ fmt(valuesWeek[i], valuesWeek[i] >= 10 ? 0 : 1) }}
                  </title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b, i) in barsGeom"
                  :key="'lblw' + i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesWeek[i], valuesWeek[i] >= 10 ? 0 : 1) }}
                </text>
              </g>
            </svg>

            <div v-else class="edb-empty">
              <div v-if="errorMsg" class="edb-empty-msg">{{ errorMsg }}</div>
              <div v-else-if="loadingWeek" class="edb-loading">
                <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
              </div>
              <div v-else class="edb-empty-msg">
                데이터가 없습니다. IMEI 입력 후 <b>조회</b>를 눌러주세요.
              </div>
            </div>

            <div
              v-if="tip.show && tip.chart === 'week'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">
                {{ fmt(tip.value, tip.value >= 10 ? 0 : 1) }}
              </div>
            </div>
          </div>

          <p class="edb-range" v-if="weekRangeText">
            집계기간: {{ weekRangeText }}
          </p>
        </article>

        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3>
              <span class="edb-dot edb-dot--amber"></span>주간 발전량(최근 4주)
            </h3>
            <div class="edb-card-actions">
              <span class="edb-chip" style="position: relative; left: -5px"
                >kWh</span
              >
              <button
                class="edb-btn edb-btn--primary edb-btn--sm"
                :disabled="downloading || !canDownload"
                @click="openDownloadModal"
                :title="
                  canDownload ? '월별 CSV 다운로드' : '조회 후 활성화됩니다'
                "
              >
                다운로드
              </button>
            </div>
          </div>

          <div class="edb-chart__body" ref="monthWrap">
            <svg
              v-if="monthSeries.length"
              :viewBox="`0 0 ${vb.w} ${vb.h}`"
              class="edb-svg-chart"
              :style="axisStyle"
              aria-hidden="true"
            >
              <g class="grid">
                <line
                  v-for="(t, i) in yTicksMonth"
                  :key="'gmy' + i"
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="t.y"
                  :y2="t.y"
                />
              </g>

              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h - pad.b" />
                <g
                  v-if="!isMobile"
                  v-for="(t, i) in yTicksMonth"
                  :key="'my' + i"
                >
                  <text :x="pad.l - 8" :y="t.y + 4" text-anchor="end">
                    {{ t.label }}
                  </text>
                </g>
              </g>

              <g class="axis axis-bottom">
                <line
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="vb.h - pad.b"
                  :y2="vb.h - pad.b"
                />
                <g v-for="(x, i) in xTicksMonth" :key="'mx' + i">
                  <line
                    :x1="x.x"
                    :x2="x.x"
                    :y1="vb.h - pad.b"
                    :y2="vb.h - pad.b + 5"
                  />
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">
                    {{ x.label }}
                  </text>
                </g>
              </g>

              <g fill="url(#monthGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="monthGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#ffb22e" stop-opacity="1" />
                    <stop
                      offset="100%"
                      stop-color="#ffb22e"
                      stop-opacity=".35"
                    />
                  </linearGradient>
                </defs>

                <rect
                  v-for="(b, i) in barsGeomMonth"
                  :key="'mb' + i"
                  class="bar"
                  :x="b.x"
                  :y="b.y"
                  :width="b.w"
                  :height="b.h"
                  rx="10"
                  @mouseenter="onBarEnter('month', i, $event)"
                  @mousemove="onBarMove('month', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>
                    {{ monthSeries[i].label }}:
                    {{ fmt(valuesMonth[i], valuesMonth[i] >= 10 ? 0 : 1) }}
                  </title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b, i) in barsGeomMonth"
                  :key="'lblm' + i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesMonth[i], valuesMonth[i] >= 10 ? 0 : 1) }}
                </text>
              </g>
            </svg>

            <div v-else class="edb-empty">
              <div v-if="errorMsg" class="edb-empty-msg">{{ errorMsg }}</div>
              <div v-else-if="loadingMonth" class="edb-loading">
                <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
              </div>
              <div v-else class="edb-empty-msg">
                데이터가 없습니다. IMEI 입력 후 <b>조회</b>를 눌러주세요.
              </div>
            </div>

            <div
              v-if="tip.show && tip.chart === 'month'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">
                {{ fmt(tip.value, tip.value >= 10 ? 0 : 1) }}
              </div>
            </div>
          </div>

          <p class="edb-range" v-if="monthRangeText">
            집계기간: {{ monthRangeText }}
          </p>
        </article>

        <article class="edb-card edb-chart edb-week">
          <div class="edb-card-hd">
            <h3><span class="edb-dot edb-dot--cyan"></span>연간발전량</h3>
            <span class="edb-chip">kWh</span>
          </div>

          <div class="edb-chart__body" ref="yearWrap">
            <svg
              v-if="yearSeries.length"
              :viewBox="yearViewBox"
              class="edb-svg-chart"
              :style="axisStyle"
              aria-hidden="true"
            >
              <g class="grid">
                <line
                  v-for="(t, i) in yTicksYear"
                  :key="'gy' + i"
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="t.y"
                  :y2="t.y"
                />
              </g>

              <g class="axis axis-left">
                <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h - pad.b" />
                <g
                  v-if="!isMobile"
                  v-for="(t, i) in yTicksYear"
                  :key="'yl' + i"
                >
                  <text :x="pad.l - 8" :y="t.y + 4" text-anchor="end">
                    {{ t.label }}
                  </text>
                </g>
              </g>

              <g class="axis axis-bottom">
                <line
                  :x1="pad.l"
                  :x2="vb.w - pad.r"
                  :y1="vb.h - pad.b"
                  :y2="vb.h - pad.b"
                />
                <g v-for="(x, i) in xTicksYear" :key="'xt' + i">
                  <line
                    :x1="x.x"
                    :x2="x.x"
                    :y1="vb.h - pad.b"
                    :y2="vb.h - pad.b + 5"
                  />
                  <text :x="x.x" :y="vb.h - pad.b + 40" text-anchor="middle">
                    {{ x.label }}
                  </text>
                </g>
              </g>

              <g fill="url(#yearGrad)" filter="url(#dropShadow)">
                <defs>
                  <linearGradient id="yearGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#22d3ee" stop-opacity="1" />
                    <stop
                      offset="100%"
                      stop-color="#22d3ee"
                      stop-opacity=".35"
                    />
                  </linearGradient>
                </defs>

                <rect
                  v-for="(b, i) in barsGeomYear"
                  :key="'yb' + i"
                  class="bar"
                  :x="b.x"
                  :y="b.y"
                  :width="b.w"
                  :height="b.h"
                  rx="10"
                  @mouseenter="onBarEnter('year', i, $event)"
                  @mousemove="onBarMove('year', i, $event)"
                  @mouseleave="onBarLeave"
                >
                  <title>
                    {{ bucketsYear[i] }}:
                    {{ fmt(valuesYear[i], valuesYear[i] >= 10 ? 0 : 1) }}
                  </title>
                </rect>
              </g>

              <g class="edb-bar-labels" v-if="showValueLabels">
                <text
                  v-for="(b, i) in barsGeomYear"
                  :key="'lbly' + i"
                  class="edb-bar-label"
                  :x="b.cx"
                  :y="Math.max(8, b.y - 6)"
                  text-anchor="middle"
                >
                  {{ fmt(valuesYear[i], valuesYear[i] >= 10 ? 0 : 1) }}
                </text>
              </g>
            </svg>

            <div v-else class="edb-empty">
              <div v-if="errorMsg" class="edb-empty-msg">{{ errorMsg }}</div>
              <div v-else-if="loadingYear" class="edb-loading">
                <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
              </div>
              <div v-else class="edb-empty-msg">
                데이터가 없습니다. IMEI 입력 후 <b>조회</b>를 눌러주세요.
              </div>
            </div>

            <div
              v-if="tip.show && tip.chart === 'year'"
              class="edb-tip"
              :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
              role="tooltip"
            >
              <div class="edb-tip-title">{{ tip.label }}</div>
              <div class="edb-tip-value">
                {{ fmt(tip.value, tip.value >= 10 ? 0 : 1) }}
              </div>
            </div>
          </div>

          <p class="edb-range" v-if="yearRangeText">
            집계기간: {{ yearRangeText }}
          </p>
        </article>
      </section>

      <section class="edb-grid edb-bottom2">
        <section class="edb-card edb-summary">
          <div class="edb-sum-hd">
            <h4 class="edb-sum__title">요약 정보</h4>
          </div>

          <div class="edb-sum-grid">
            <article class="edb-sum-block">
              <div class="edb-detail-hd">
                <h3 class="edb-detail__title">발전량</h3>
              </div>
              <div class="edb-table-wrap edb-thin-scroll">
                <table class="edb-tbl edb-tbl--kpi">
                  <thead>
                    <tr>
                      <th style="text-align: center">지표</th>
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

            <article class="edb-sum-block">
              <div class="edb-detail-hd">
                <h3 class="edb-detail__title">환경 기여도</h3>
              </div>
              <div class="edb-table-wrap edb-thin-scroll">
                <table class="edb-tbl edb-tbl--kpi">
                  <thead>
                    <tr>
                      <th style="text-align: center">지표</th>
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

        <section class="edb-card edb-detail" aria-live="polite">
          <div class="edb-detail-hd">
            <div class="edb-detail-hgroup">
              <h3 class="edb-detail__title">시간별 상세정보</h3>
              <div class="edb-detail-meta" v-if="detailDay">
                <span class="edb-meta"
                  >기준 날짜: <b>{{ detailDay }}</b></span
                >
              </div>
            </div>

            <div class="edb-detail-actions">
              <button
                class="edb-week-btn"
                :disabled="!imeiField || wxLoading"
                @click="openWxModal"
                title="이번주(7일) 날씨 예보 보기"
              >
                <span v-if="!wxLoading" style="font-size: 12.5px"
                  >주간예보</span
                >
                <span v-else class="edb-spinner"></span>
              </button>
            </div>
          </div>
          <div class="edb-detail-body">
            <div
              v-if="!detailRows.length && loadingHourly"
              class="edb-detail-empty"
            >
              <span class="edb-spinner edb-spinner--lg"></span> 불러오는 중…
            </div>

            <div v-else class="edb-table-wrap edb-thin-scroll">
              <table class="edb-tbl">
                <thead>
                  <tr>
                    <th style="width: 62px">시</th>
                    <th>발전량(kWh)</th>
                    <th>날씨/기온</th>
                    <th>CO₂저감량(kg)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in detailRowsVisible" :key="'hr' + i">
                    <td>{{ r.hour.replace(":00", "시") }}</td>
                    <td class="edb-num">{{ fmt(r.kwh, 1) }}</td>
                    <td class="edb-num">{{ r.weather || "—" }}</td>
                    <td class="edb-num">
                      {{ r.co2_kg == null ? "—" : fmt(r.co2_kg, 2) }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p
                v-if="isWind && !hasAnyGeneration(detailRows)"
                class="edb-muted"
                style="margin-top: 8px"
              >
                * 풍력 장비가 하트비트(상태 보고)만 보내는 경우 시간대 발전량이
                0으로 표시될 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>

    <div
      v-if="showDl"
      class="edb-modal-backdrop"
      @click.self="closeDownloadModal"
    >
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
                <option v-for="y in yearOptions" :key="y" :value="y">
                  {{ y }}년
                </option>
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
          <div class="edb-modal-tip">
            선택된 기간: <b>{{ dlYear }}년 {{ dlMonth }}월</b>
          </div>
        </div>

        <footer class="edb-modal-ftr">
          <button class="edb-btn edb-btn--ghost" @click="closeDownloadModal">
            취소
          </button>
          <button
            class="edb-btn edb-btn--primary"
            :disabled="downloading"
            @click="doDownload"
          >
            <span v-if="!downloading">다운로드</span>
            <span v-else>다운로드 중...</span>
          </button>
        </footer>
      </div>
    </div>

    <div v-if="showWx" class="edb-modal-backdrop" @click.self="closeWxModal">
      <div class="edb-modal edb-modal--forecast">
        <header class="edb-modal-hd">
          <div class="edb-modal-ico">🌦</div>
          <div class="edb-modal-title">이번주 날씨 예보</div>
          <button class="edb-modal-x" @click="closeWxModal">✕</button>
        </header>

        <div class="edb-modal-body">
          <p class="edb-modal-desc">
            최저/최고 기온 추세와 강수확률을 함께 확인하세요.
          </p>

          <div v-if="wxLoading" class="edb-loading" style="min-height: 180px">
            <span class="edb-spinner edb-spinner--lg"></span> 예보 불러오는 중…
          </div>

          <template v-else>
            <div v-if="wxErr" class="edb-empty-msg">{{ wxErr }}</div>

            <div v-else-if="wxWeek.length" class="wx-chart-wrap">
              <svg
                :viewBox="`0 0 ${wxVb.w} ${wxVb.h}`"
                class="edb-svg-chart"
                :style="axisStyle"
              >
                <g class="grid">
                  <line
                    v-for="(t, i) in wxYTicks"
                    :key="'wgy' + i"
                    :x1="wxPad.l"
                    :x2="wxVb.w - wxPad.r"
                    :y1="t.y"
                    :y2="t.y"
                  />
                </g>
                <g class="axis axis-left">
                  <line
                    :x1="wxPad.l"
                    :x2="wxPad.l"
                    :y1="wxPad.t"
                    :y2="wxVb.h - wxPad.b"
                  />
                  <g v-for="(t, i) in wxYTicks" :key="'wyl' + i">
                    <text :x="wxPad.l - 8" :y="t.y + 4" text-anchor="end">
                      {{ t.label }}
                    </text>
                  </g>
                </g>
                <g class="axis axis-bottom">
                  <line
                    :x1="wxPad.l"
                    :x2="wxVb.w - wxPad.r"
                    :y1="wxVb.h - wxPad.b"
                    :y2="wxVb.h - wxPad.b"
                  />
                  <g v-for="(x, i) in wxXTicks" :key="'wxt' + i">
                    <line
                      :x1="x.x"
                      :x2="x.x"
                      :y1="wxVb.h - wxPad.b"
                      :y2="wxVb.h - wxPad.b + 5"
                    />
                    <text
                      :x="x.x"
                      :y="wxVb.h - wxPad.b + 28"
                      text-anchor="middle"
                    >
                      {{ x.label }}
                    </text>
                  </g>
                </g>

                <defs>
                  <filter
                    id="wxShadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="1"
                      stdDeviation="1.5"
                      flood-opacity="0.25"
                    />
                  </filter>
                </defs>

                <polyline
                  :points="wxPointsMax"
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="3"
                  filter="url(#wxShadow)"
                />
                <polyline
                  :points="wxPointsMin"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="3"
                  filter="url(#wxShadow)"
                />

                <g>
                  <circle
                    v-for="(p, i) in wxGeom"
                    :key="'dot-max' + i"
                    :cx="p.x"
                    :cy="p.yMax"
                    r="4"
                    fill="#ef4444"
                  />
                  <circle
                    v-for="(p, i) in wxGeom"
                    :key="'dot-min' + i"
                    :cx="p.x"
                    :cy="p.yMin"
                    r="4"
                    fill="#3b82f6"
                  />
                </g>

                <g class="wx-point-labels">
                  <text
                    v-for="(p, i) in wxGeom"
                    :key="'lbl-max' + i"
                    :x="p.x"
                    :y="p.yMax - 8"
                    text-anchor="middle"
                    class="wx-label wx-label--hi"
                  >
                    {{ fmt(wxWeek[i].tmax, 1) }}℃
                  </text>
                  <text
                    v-for="(p, i) in wxGeom"
                    :key="'lbl-min' + i"
                    :x="p.x"
                    :y="p.yMin + 18"
                    text-anchor="middle"
                    class="wx-label wx-label--lo"
                  >
                    {{ fmt(wxWeek[i].tmin, 1) }}℃
                  </text>
                </g>
              </svg>

              <div class="wx-bottom-band">
                <div class="wx-row wx-dates">
                  <span v-for="(d, i) in wxWeek" :key="'d' + i">{{
                    d.label
                  }}</span>
                </div>
                <div class="wx-row wx-highs">
                  <span v-for="(d, i) in wxWeek" :key="'h' + i"
                    >{{ fmt(d.tmax, 1) }}℃</span
                  >
                </div>
                <div class="wx-row wx-lows">
                  <span v-for="(d, i) in wxWeek" :key="'l' + i"
                    >{{ fmt(d.tmin, 1) }}℃</span
                  >
                </div>
                <div class="wx-row wx-pops">
                  <span v-for="(d, i) in wxWeek" :key="'p' + i"
                    >{{ d.pop ?? "0" }}%</span
                  >
                </div>
              </div>
            </div>

            <div v-else class="edb-table-wrap edb-thin-scroll">
              <table class="edb-tbl">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th class="ar">최저(℃)</th>
                    <th class="ar">최고(℃)</th>
                    <th class="ar">강수확률(%)</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, i) in wxWeek" :key="'wrow' + i">
                    <td>{{ d.label }}</td>
                    <td class="edb-num">{{ fmt(d.tmin, 1) }}</td>
                    <td class="edb-num">{{ fmt(d.tmax, 1) }}</td>
                    <td class="edb-num">{{ d.pop ?? "—" }}</td>
                    <td>{{ d.cond || "—" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <footer class="edb-modal-ftr">
          <button class="edb-btn edb-btn--ghost" @click="closeWxModal">
            닫기
          </button>
        </footer>
      </div>
    </div>
  </main>
</template>

<script>
import "@/assets/css/energy-dashboard.css";

const CO2_ELECTRIC = 0.4747;
const CO2_THERMAL = 0.198;
const TREE_KG = 6.6;
const DUMMY_CAP_KW = 3;

const SKY_LABEL = { 1: "맑음", 3: "구름많음", 4: "흐림" };
const PTY_LABEL = {
  0: "없음",
  1: "비",
  2: "비/눈",
  3: "눈",
  5: "빗방울",
  6: "빗방울/눈날림",
  7: "눈날림",
};

const DEFAULT_IMEI = "";
const round2 = (v) => Math.round(v * 100) / 100;

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export default {
  name: "EnergyDashboard",
  props: {
    imei: String,
    isAdmin: Boolean,
    multi: { type: String, default: "" },
  },
  data() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    return {
      isMobile: false,
      loadingWeek: false,
      loadingMonth: false,
      loadingYear: false,
      loadingHourly: false,
      isAdmin: false,
      imeiField: DEFAULT_IMEI,
      energyField: "01",
      typeField: "",
      multiField: "",
      bars: [],
      totalKwh: 0,
      weekRangeUtc: null,
      detailDay: "",
      detailRows: [],
      summary: {
        capacity_kw: DUMMY_CAP_KW,
        today_kwh: 0,
        month_kwh: 0,
        year_kwh: 0,
        co2_kg: 0,
        trees: 0,
        install_date: null,
        monitor_start: null,
      },

      monthSeries: [],
      yearSeries: [],
      monthRangeUtc: null,
      yearRangeUtc: null,
      kpis: { totalKwh: 0, totalCo2: 0, totalTrees: 0 },
      avgEff: null,
      loading: false,
      errorMsg: "",
      vb: { w: 1000, h: 420 },
      pad: { t: 24, r: 32, b: 60, l: 44 },
      axisXFontPx: 20,
      axisYFontPx: 16,
      resizeObserver: null,

      tip: { show: false, x: 0, y: 0, chart: null, label: "", value: 0 },
      showValueLabels: true,
      showDl: false,
      dlYear: y,
      dlMonth: m,
      downloading: false,
      yearOptions: Array.from({ length: 11 }, (_, i) => y - i),
      hasSearched: false,
      searching: false,
      currentReqId: 0,
      showWx: false,
      wxLoading: false,
      wxErr: "",
      wxWeek: [],
      wxVb: { w: 1200, h: 380 },
      wxPad: { t: 28, r: 36, b: 72, l: 56 },
    };
  },
  computed: {
    currentKstHour() {
      const kst = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
      });
      return new Date(kst).getHours();
    },
    detailRowsVisible() {
      const rows = Array.isArray(this.detailRows) ? this.detailRows : [];
      const startHour = this.energyField === "01" ? 6 : 0;

      const filtered = rows.filter((r) => {
        const hh = this.toHH(r.hour);
        if (hh == null) return false;
        const n = Number(hh);
        return n >= startHour && n <= this.currentKstHour;
      });

      let last = filtered.length - 1;
      for (; last >= 0; last--) {
        const v = filtered[last]?.kwh;
        if (v != null && Number.isFinite(Number(v))) break;
      }
      return last >= 0 ? filtered.slice(0, last + 1) : filtered;
    },
    isWind() {
      return this.energyField === "04";
    },
    maxY() {
      return Math.max(...this.bars.map((b) => b.y || 0), 1);
    },
    inner() {
      return {
        w: this.vb.w - this.pad.l - this.pad.r,
        h: this.vb.h - this.pad.t - this.pad.b,
      };
    },
    stepW() {
      return this.bars.length ? this.inner.w / this.bars.length : 0;
    },
    barW() {
      return Math.max(10, this.stepW * (this.isMobile ? 0.85 : 0.7));
    },
    yTicks() {
      const max = this.maxY,
        step = max / 4,
        arr = [];
      for (let i = 0; i <= 4; i++) {
        const v = step * i;
        const y = this.pad.t + (1 - v / max) * this.inner.h;
        arr.push({ y, label: this.fmt(v, v >= 10 ? 0 : 1) });
      }
      return arr;
    },
    xTicks() {
      const out = [],
        n = this.bars.length;
      for (let i = 0; i < n; i++) {
        const x = this.pad.l + i * this.stepW + this.stepW / 2;
        out.push({ x, label: this.formatDay(this.bars[i].x) });
      }
      return out;
    },
    barsGeom() {
      const g = [],
        max = this.maxY;
      for (let i = 0; i < this.bars.length; i++) {
        const v = this.bars[i].y || 0,
          cx = this.pad.l + i * this.stepW + this.stepW / 2,
          w = this.barW,
          x = cx - w / 2;
        const y = this.pad.t + (1 - v / max) * this.inner.h,
          h = this.pad.t + this.inner.h - y;
        g.push({ x, y, w, h, cx });
      }
      return g;
    },
    valuesWeek() {
      return this.bars.map((b) => b.y || 0);
    },
    bucketsWeek() {
      return this.bars.map((b) => b.x);
    },
    maxMonth() {
      return Math.max(...this.monthSeries.map((b) => b.y || 0), 1);
    },
    stepWMonth() {
      return this.monthSeries.length
        ? this.inner.w / this.monthSeries.length
        : 0;
    },
    barWMonth() {
      return Math.max(10, this.stepWMonth * 0.6);
    },
    yTicksMonth() {
      const max = this.maxMonth,
        step = max / 4,
        arr = [];
      for (let i = 0; i <= 4; i++) {
        const v = step * i;
        const y = this.pad.t + (1 - v / max) * this.inner.h;
        arr.push({ y, label: this.fmt(v, v >= 10 ? 0 : 1) });
      }
      return arr;
    },
    xTicksMonth() {
      const out = [],
        n = this.monthSeries.length;
      for (let i = 0; i < n; i++) {
        const x = this.pad.l + i * this.stepWMonth + this.stepWMonth / 2;
        out.push({ x, label: this.monthSeries[i].label });
      }
      return out;
    },
    barsGeomMonth() {
      const g = [],
        max = this.maxMonth;
      for (let i = 0; i < this.monthSeries.length; i++) {
        const v = this.monthSeries[i].y || 0,
          cx = this.pad.l + i * this.stepWMonth + this.stepWMonth / 2,
          w = this.barWMonth,
          x = cx - w / 2;
        const y = this.pad.t + (1 - v / max) * this.inner.h,
          h = this.pad.t + this.inner.h - y;
        g.push({ x, y, w, h, cx });
      }
      return g;
    },
    valuesMonth() {
      return this.monthSeries.map((s) => s.y || 0);
    },
    bucketsMonth() {
      return this.monthSeries.map((s) => s.label);
    },
    maxYear() {
      return Math.max(...this.yearSeries.map((b) => b.y || 0), 1);
    },
    stepWYear() {
      return this.yearSeries.length ? this.inner.w / this.yearSeries.length : 0;
    },
    barWYear() {
      return Math.max(10, this.stepWYear * 0.6);
    },
    yTicksYear() {
      const max = this.maxYear,
        step = max / 4,
        arr = [];
      for (let i = 0; i <= 4; i++) {
        const v = step * i;
        const y = this.pad.t + (1 - v / max) * this.inner.h;
        arr.push({ y, label: this.fmt(v, v >= 10 ? 0 : 1) });
      }
      return arr;
    },
    xTicksYear() {
      const out = [];
      const n = this.yearSeries.length;

      for (let i = 0; i < n; i++) {
        const x = this.pad.l + i * this.stepWYear + this.stepWYear / 2;
        out.push({
          x,
          label: this.yearSeries[i].x,
        });
      }

      return out;
    },
    barsGeomYear() {
      const g = [],
        max = this.maxYear;
      for (let i = 0; i < this.yearSeries.length; i++) {
        const v = this.yearSeries[i].y || 0,
          cx = this.pad.l + i * this.stepWYear + this.stepWYear / 2,
          w = this.barWYear,
          x = cx - w / 2;
        const y = this.pad.t + (1 - v / max) * this.inner.h,
          h = this.pad.t + this.inner.h - y;
        g.push({ x, y, w, h, cx });
      }
      return g;
    },
    yearExtraLeft() {
      const max = this.maxYear || 0;
      const s = this.fmt(max, max >= 10 ? 0 : 1);
      const est = Math.ceil(s.length * this.axisYFontPx * 0.6) + 12;
      return Math.max(0, est - this.pad.l);
    },
    yearViewBox() {
      return `${-this.yearExtraLeft} 0 ${this.vb.w + this.yearExtraLeft} ${
        this.vb.h
      }`;
    },
    valuesYear() {
      return this.yearSeries.map((s) => s.y || 0);
    },
    bucketsYear() {
      return this.yearSeries.map((s) => s.x);
    },

    monthRangeText() {
      return this.rangeText(this.monthRangeUtc);
    },
    yearRangeText() {
      return this.rangeText(this.yearRangeUtc);
    },
    weekRangeText() {
      return this.rangeText(this.weekRangeUtc);
    },

    axisStyle() {
      return {
        "--axis-x-font": this.axisXFontPx + "px",
        "--axis-y-font": this.axisYFontPx + "px",
      };
    },
    co2Factor() {
      return this.energyField === "02" || this.energyField === "03"
        ? CO2_THERMAL
        : CO2_ELECTRIC;
    },
    kpiWeek() {
      const kwh = this.totalKwh || 0;
      return { kwh, co2: this.co2(kwh), trees: this.treesFromKwh(kwh) };
    },
    kpiMonth() {
      const kwh = this.summary.month_kwh || 0;
      return {
        kwh: round2(kwh),
        co2: this.co2(kwh),
        trees: this.treesFromKwh(kwh),
      };
    },
    kpiYear() {
      const kwh = this.yearSeries.reduce((s, r) => s + (r.y || 0), 0);
      return {
        kwh: round2(kwh),
        co2: this.co2(kwh),
        trees: this.treesFromKwh(kwh),
      };
    },

    multiLabel() {
      if (!this.multiField) return "";
      const map = {
        "00": "설비 0",
        "01": "설비 1",
        "02": "설비 2",
        "03": "설비 3",
      };
      return map[this.multiField] || `설비 ${this.multiField}`;
    },

    hasAnyData() {
      return (
        (this.bars && this.bars.length) ||
        (this.monthSeries && this.monthSeries.length) ||
        (this.yearSeries && this.yearSeries.length)
      );
    },
    canDownload() {
      return this.hasSearched && !!this.hasAnyData;
    },

    wxInner() {
      return {
        w: this.wxVb.w - this.wxPad.l - this.wxPad.r,
        h: this.wxVb.h - this.wxPad.t - this.wxPad.b,
      };
    },
    wxXStep() {
      return this.wxWeek.length ? this.wxInner.w / this.wxWeek.length : 0;
    },
    wxTempMin() {
      const mins = this.wxWeek
        .map((d) => Number(d.tmin))
        .filter((n) => Number.isFinite(n));
      return mins.length ? Math.min(...mins) : 0;
    },
    wxTempMax() {
      const maxs = this.wxWeek
        .map((d) => Number(d.tmax))
        .filter((n) => Number.isFinite(n));
      return maxs.length ? Math.max(...maxs) : 1;
    },
    wxYTicks() {
      const min = Math.floor(this.wxTempMin - 1);
      const max = Math.ceil(this.wxTempMax + 1);
      const step = Math.max(1, Math.round((max - min) / 4));
      const ticks = [];
      for (let v = min; v <= max; v += step) {
        const y =
          this.wxPad.t + (1 - (v - min) / (max - min || 1)) * this.wxInner.h;
        ticks.push({ y, label: `${v}` });
      }
      return ticks;
    },
    wxXTicks() {
      const out = [];
      for (let i = 0; i < this.wxWeek.length; i++) {
        const x = this.wxPad.l + i * this.wxXStep + this.wxXStep / 2;
        out.push({ x, label: this.wxWeek[i].label });
      }
      return out;
    },
    wxGeom() {
      const min = Math.floor(this.wxTempMin - 1);
      const max = Math.ceil(this.wxTempMax + 1);
      const arr = [];
      for (let i = 0; i < this.wxWeek.length; i++) {
        const d = this.wxWeek[i];
        const cx = this.wxPad.l + i * this.wxXStep + this.wxXStep / 2;
        const yMax =
          this.wxPad.t +
          (1 - (d.tmax - min) / (max - min || 1)) * this.wxInner.h;
        const yMin =
          this.wxPad.t +
          (1 - (d.tmin - min) / (max - min || 1)) * this.wxInner.h;
        arr.push({ x: cx, yMax, yMin, pop: d.pop ?? 0 });
      }
      return arr;
    },
    wxPointsMax() {
      return this.wxGeom.map((p) => `${p.x},${p.yMax}`).join(" ");
    },
    wxPointsMin() {
      return this.wxGeom.map((p) => `${p.x},${p.yMin}`).join(" ");
    },
  },
  watch: {
    multi(nv) {
      this.multiField = nv;
      if (this.imeiField) {
        this.onSearch();
      }
    },

    energyField(nv) {
      if (nv !== "01") {
        this.typeField = "";
        this.multiField = "";
      }
    },

    "$route.query"(q) {
      const nextImei = (q.imei || "").toString().trim();
      const nextEnergy =
        typeof q.energy === "string" ? q.energy : this.energyField;
      const nextType = typeof q.type === "string" ? q.type : "";
      const nextMulti = typeof q.multi === "string" ? q.multi : "";
      const shouldReload =
        (nextImei && nextImei !== this.imeiField) ||
        nextEnergy !== this.energyField ||
        nextType !== this.typeField ||
        nextMulti !== this.multiField;

      if (shouldReload) {
        if (nextImei) this.imeiField = nextImei;
        this.energyField = nextEnergy;
        this.typeField = nextType;
        this.multiField = nextMulti;
        this.onSearch();
      }
    },
  },

  methods: {
    updateViewBox() {
      const w = window.innerWidth;
      this.isMobile = w < 768;

      if (this.isMobile) {
        this.vb.h = 800;
        this.pad.t = 50;
        this.pad.b = 100;
      } else if (w <= 1366) {
        this.vb.h = 650;
        this.pad.t = 75;
        this.pad.b = 120;
      } else {
        this.vb.h = 420;
        this.pad.t = 40;
        this.pad.b = 60;
      }
    },
    syncAdminFromStorage() {
      try {
        const flag = localStorage.getItem("isAdmin") === "true";
        const email = (localStorage.getItem("email") || "")
          .trim()
          .toLowerCase();
        this.isAdmin = flag || email === "admin@company.com";
      } catch {
        this.isAdmin = false;
      }
    },

    fmt(v, d = 0) {
      return v == null
        ? "—"
        : Number(v).toLocaleString(undefined, {
            minimumFractionDigits: d,
            maximumFractionDigits: d,
          });
    },
    dash(v) {
      return v == null || v === "" ? "-" : `${v}`;
    },
    formatDay(ymd) {
      const m = ymd?.match?.(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${Number(m[3])}일` : ymd || "";
    },
    rangeText(r) {
      if (!r?.start || !r?.end) return "";
      const f = (iso) =>
        new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
      return `${f(r.start)} ~ ${f(r.end)}`;
    },

    co2(kwh) {
      return round2((Number(kwh) || 0) * this.co2Factor);
    },
    treesFromKwh(kwh) {
      return Math.round(this.co2(kwh) / TREE_KG);
    },

    updateAxisFonts() {
      const wrap = this.$refs.monthWrap || this.$refs.yearWrap;
      const w = wrap ? wrap.clientWidth : 0;
      const containerWidth = w || this.$el.clientWidth || 360;
      const scale = containerWidth / this.vb.w;
      const TARGET_X = 16;
      const TARGET_Y = 15;

      this.axisXFontPx = Math.max(
        14,
        Math.min(Math.round(TARGET_X / Math.max(scale, 0.3)), 60)
      );
      this.axisYFontPx = Math.max(
        13,
        Math.min(Math.round(TARGET_Y / Math.max(scale, 0.3)), 55)
      );
    },

    aggregateWeeksFromDaily(dailySeries) {
      let yearStr = null,
        monthStr = null;
      if (Array.isArray(dailySeries) && dailySeries.length) {
        const b = String(dailySeries.find((r) => r?.bucket)?.bucket || "");
        const m = b.match(/^(\d{4})-(\d{2})-\d{2}$/);
        if (m) {
          yearStr = m[1];
          monthStr = m[2];
        }
      }
      if (!yearStr || !monthStr) {
        const now = new Date();
        yearStr = String(now.getFullYear());
        monthStr = String(now.getMonth() + 1).padStart(2, "0");
      }

      const y = parseInt(yearStr, 10);
      const mo = parseInt(monthStr, 10);
      const lastDay = new Date(y, mo, 0).getDate();

      const weeks = [1, 2, 3, 4, 5];
      const empty = new Map(
        weeks.map((wn) => {
          const startDay = (wn - 1) * 7 + 1;
          const endDay = Math.min(wn * 7, lastDay);
          return [wn, { y: 0, co2: 0, trees: 0, startDay, endDay }];
        })
      );

      if (Array.isArray(dailySeries)) {
        for (const row of dailySeries) {
          const b = String(row.bucket || "");
          const m = b.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!m) continue;
          const dd = parseInt(m[3], 10);
          const wn = Math.floor((dd - 1) / 7) + 1;
          const g = empty.get(wn);
          if (!g) continue;
          const kwh = Number(row.kwh || 0);
          g.y += kwh;
          g.co2 += this.co2(kwh);
          g.trees += this.treesFromKwh(kwh);
        }
      }

      const series = weeks.map((wn) => {
        const g = empty.get(wn);
        return {
          x: `W${wn}`,
          label: `${wn}주`,
          y: round2(g.y),
          co2: round2(g.co2),
          trees: Math.round(g.trees),
          rangeText: `${yearStr}-${monthStr}-${String(g.startDay).padStart(
            2,
            "0"
          )} ~ ${yearStr}-${monthStr}-${String(g.endDay).padStart(2, "0")}`,
        };
      });

      return { series };
    },

    _seriesEndpoint() {
      return "/api/energy/series";
    },

    _hourlyEndpoint() {
      switch (this.energyField) {
        case "01":
          return "/api/energy/electric/hourly";
        case "02":
          return "/api/energy/thermal/hourly";
        case "03":
          return "/api/energy/geothermal/hourly";
        case "04":
          return "/api/energy/wind/hourly";
        case "06":
          return "/api/energy/fuelcell/hourly";
        case "07":
          return "/api/energy/ess/hourly";
        default:
          return "/api/energy/electric/hourly";
      }
    },

    async fetchRange(range, withHourly = false, imeiOverride = null) {
      const imei = imeiOverride || this.imeiField?.trim();
      const params = new URLSearchParams({ rtuImei: imei, imei, range });
      if (this.energyField) params.set("energy", this.energyField);
      if (this.typeField && this.energyField === "01")
        params.set("type", this.typeField);
      if (this.multiField && this.energyField === "01")
        params.set("multi", this.multiField);
      if (withHourly) params.set("detail", "hourly");

      const r = await fetch(`${this._seriesEndpoint()}?${params.toString()}`);
      if (!r.ok) throw new Error("데이터를 가져오지 못했습니다.");
      return r.json();
    },

    async fetchHourlyForToday() {
      const imei = this.imeiField?.trim();
      if (!imei) return [];
      const today = this.todayKstYmd();

      const p = new URLSearchParams({ imei, rtuImei: imei, date: today });
      if (this.energyField) p.set("energy", this.energyField);
      if (this.typeField && this.energyField === "01")
        p.set("type", this.typeField);
      if (this.multiField && this.energyField === "01")
        p.set("multi", this.multiField);

      try {
        const r = await fetch(`${this._hourlyEndpoint()}?${p.toString()}`);
        if (!r.ok) return [];
        const j = await r.json();
        const hours = Array.isArray(j?.hours) ? j.hours : [];
        return hours.map((h) => ({
          hour: String(h.hour).padStart(2, "0"),
          kwh: h.kwh == null ? null : Number(h.kwh),
        }));
      } catch {
        return [];
      }
    },

    async fetchWeatherHourlyByImei() {
      const imei = this.imeiField?.trim();
      if (!imei) return { base_date: null, base_time: null, hourly: [] };

      const lat = 35.362999;
      const lon = 129.04677;
      const url = `/api/weather/openmeteo/by-imei?imei=${encodeURIComponent(
        imei
      )}&rtuImei=${encodeURIComponent(imei)}&lat=${lat}&lon=${lon}`;

      try {
        const r = await fetch(url);
        if (!r.ok) return { base_date: null, base_time: null, hourly: [] };
        const j = await r.json();
        return {
          base_date: j.base_date || null,
          base_time: j.base_time || null,
          hourly: Array.isArray(j.hourly) ? j.hourly : [],
        };
      } catch {
        return { base_date: null, base_time: null, hourly: [] };
      }
    },

    async fetchWeatherWeek() {
      const imei = this.imeiField?.trim();
      if (!imei) return [];

      const url = `/api/weather/openmeteo/by-imei/daily?imei=${encodeURIComponent(
        imei
      )}&days=7`;
      try {
        const r = await fetch(url);
        const j = await r.json();
        if (!r.ok || !j.ok) return [];

        return (j.daily || []).map((d) => ({
          date: d.date,
          label: this.kDateLabel?.(d.date) ?? d.date,
          tmin: d.tmin,
          tmax: d.tmax,
          pop: d.pop_max,
          wind: d.wind_max,
          cond: [d.sky, d.pty !== "없음" ? d.pty : null]
            .filter(Boolean)
            .join(" "),
        }));
      } catch {
        return [];
      }
    },

    toHH(h) {
      if (h == null) return null;
      const s = String(h).trim();
      let m = s.match(/^(\d{1,2})\s*:\s*\d{2}$/);
      if (m) return m[1].padStart(2, "0");
      m = s.match(/^(\d{1,2})\s*시$/);
      if (m) return m[1].padStart(2, "0");
      m = s.match(/^(\d{1,2})\d{2}$/);
      if (m) return m[1].padStart(2, "0");
      m = s.match(/^(\d{1,2})$/);
      if (m) return m[1].padStart(2, "0");
      return null;
    },
    skyText(code) {
      return SKY_LABEL[String(code)] ?? null;
    },
    ptyText(code) {
      return PTY_LABEL[String(code)] ?? null;
    },
    makeWeatherLabel(row) {
      const sky = this.skyText(row.SKY);
      const pty = this.ptyText(row.PTY);
      const ta = row.TA != null && !Number.isNaN(row.TA) ? `${row.TA}℃` : null;
      const hasPty = String(row.PTY) !== "0" && row.PTY != null;
      const cond = hasPty ? [sky, pty].filter(Boolean).join(", ") : sky;
      const label = [cond, ta].filter(Boolean).join(" / ");
      return label || "—";
    },
    todayKstYmd() {
      return new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
        .replace(/\./g, "-");
    },

    kDateLabel(iso) {
      if (!iso) return "";
      let s = String(iso).trim();

      if (/^\d{8}$/.test(s)) {
        s = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
      }

      const d = new Date(`${s}T00:00:00+09:00`);
      if (isNaN(d.getTime())) {
        return iso;
      }

      const md = `${d.getMonth() + 1}/${d.getDate()}`;
      const wd = WEEKDAY[d.getDay()];
      return `${md}(${wd})`;
    },
    wxCodeToText(code) {
      const c = Number(code);
      if ([0, 1].includes(c)) return "맑음";
      if ([2, 3].includes(c)) return "구름";
      if ([45, 48].includes(c)) return "안개";
      if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(c)) return "비";
      if ([56, 57, 66, 67].includes(c)) return "얼음비";
      if ([71, 73, 75, 77, 85, 86].includes(c)) return "눈";
      if ([95, 96, 99].includes(c)) return "뇌우";
      return "";
    },

    async onSearch(options = {}) {
      const loadDefault = options.loadDefault === true;
      const imei = this.imeiField?.trim();
      if (!imei && !loadDefault) return;
      if (this.searching) return;

      this.searching = true;
      this.errorMsg = "";
      const myReq = ++this.currentReqId;

      this.loadingWeek = true;
      this.loadingMonth = true;
      this.loadingYear = true;
      this.loadingHourly = true;

      this.bars = [];
      this.totalKwh = 0;
      this.monthSeries = [];
      this.yearSeries = [];
      this.detailRows = [];
      this.detailDay = "";
      this.monthRangeUtc = null;
      this.yearRangeUtc = null;
      this.weekRangeUtc = null;

      this.summary = {
        capacity_kw: DUMMY_CAP_KW,
        today_kwh: 0,
        month_kwh: 0,
        year_kwh: 0,
        co2_kg: 0,
        trees: 0,
        install_date: null,
        monitor_start: null,
      };

      this.kpis = { totalKwh: 0, totalCo2: 0, totalTrees: 0 };
      this.avgEff = null;

      await this.$nextTick();

      try {
        const cur = this.$route?.query || {};
        const nextQ = {
          ...(imei ? { imei } : {}),
          ...(this.energyField ? { energy: this.energyField } : {}),
          ...(this.typeField && this.energyField === "01"
            ? { type: this.typeField }
            : {}),
          ...(this.multiField && this.energyField === "01"
            ? { multi: this.multiField }
            : {}),
        };

        if (JSON.stringify(cur) !== JSON.stringify(nextQ)) {
          await this.$router.replace({ query: nextQ });
        }
      } catch (e) {}

      try {
        const weekly = await this.fetchRange("weekly", false, imei);

        if (myReq !== this.currentReqId) return;

        const wSeries = Array.isArray(weekly?.series)
          ? weekly.series
          : Array.isArray(weekly?.data?.series)
          ? weekly.data.series
          : [];

        this.bars = wSeries
          .map((s) => ({
            x: s.bucket || s.date || s.x,
            y: Number(s.kwh ?? s.y ?? 0),
          }))
          .filter((r) => r.x != null);

        {
          const today = this.todayKstYmd().replace(/-/g, "");
          this.bars = this.bars.filter((row) => {
            const ymd = String(row.x).replace(/-/g, "");
            if (ymd > today) return false;
            if ((row.y || 0) <= 0) return false;
            return true;
          });
        }

        this.totalKwh =
          round2(weekly?.summary?.total_kwh) ||
          round2(this.bars.reduce((a, c) => a + (c.y || 0), 0));

        this.weekRangeUtc = weekly?.range_utc || weekly?.range || null;
        this.detailDay = this.todayKstYmd();

        this.loadingWeek = false;

        const loadHourlyAndWeather = async () => {
          try {
            const [hourly, weather] = await Promise.all([
              this.fetchHourlyForToday(),
              this.fetchWeatherHourlyByImei(),
            ]);

            if (myReq !== this.currentReqId) return;

            const rows = (hourly || []).map((h) => ({
              hour: `${h.hour}:00`,
              kwh: h.kwh == null ? null : round2(h.kwh),
              co2_kg: h.kwh == null ? null : round2(this.co2(h.kwh)),
              weather: "—",
            }));

            if (weather?.hourly?.length) {
              const wmap = new Map(
                weather.hourly.map((h) => [this.toHH(h.hour), h])
              );
              this.detailRows = rows.map((r) => {
                const key = this.toHH(r.hour);
                const w = key ? wmap.get(key) : null;
                return w ? { ...r, weather: this.makeWeatherLabel(w) } : r;
              });
            } else {
              this.detailRows = rows;
            }

            this.summary.today_kwh = round2(
              this.detailRows.reduce(
                (s, x) => (x.kwh != null ? s + x.kwh : s),
                0
              )
            );

            if (this.bars.length > 0) {
              const lastBar = this.bars[this.bars.length - 1];
              const todayYmd = this.todayKstYmd(); // "2025-12-03"
              if (lastBar.x === todayYmd) {
                lastBar.y = this.summary.today_kwh;
                this.totalKwh = round2(
                  this.bars.reduce((a, c) => a + (c.y || 0), 0)
                );
              }
            }

            this.loadingHourly = false;
          } catch (e) {
            this.loadingHourly = false;
          }
        };

        const loadMonthly = async () => {
          try {
            const monthly = await this.fetchRange("last4weeks", false, imei);
            if (myReq !== this.currentReqId) return;

            const mSeries = Array.isArray(monthly?.series)
              ? monthly.series
              : [];
            this.monthRangeUtc = monthly?.range_utc || monthly?.range || null;

            const monthAgg = this.aggregateWeeksFromDaily(
              mSeries.map((r) => ({
                bucket: r.bucket || r.date || r.x,
                kwh: Number(r.kwh ?? r.y ?? 0),
              }))
            );

            this.monthSeries = monthAgg.series;

            this.monthSeries = this.monthSeries.map((item, idx) => ({
              ...item,
              x: `W${idx + 1}`,
              label: `${idx + 1}주`,
            }));

            // 최근 4주만 사용
            this.monthSeries = this.monthSeries.slice(-4);
            this.monthSeries = this.monthSeries.filter(
              (item) => (item.y || 0) >= 0.01
            );
            this.summary.month_kwh = round2(
              mSeries.reduce((s, r) => s + Number(r.kwh ?? r.y ?? 0), 0)
            );

            this.loadingMonth = false;
          } catch (e) {
            this.loadingMonth = false;
          }
        };

        const loadYearly = async () => {
          try {
            const yearly = await this.fetchRange("yearly", false, imei);
            if (myReq !== this.currentReqId) return;

            const ySeries = Array.isArray(yearly?.series) ? yearly.series : [];

            let ys = ySeries.map((r) => ({
              raw: r.bucket || r.x,
              kwh: Number(r.kwh ?? r.y ?? 0),
            }));
            ys = ys.map((row) => {
              const m = row.raw?.match?.(/^(\d{4})-(\d{2})/);
              const yearNum = m ? Number(m[1]) : null;
              const monthNum = m ? Number(m[2]) : null;
              return {
                yearNum,
                monthNum,
                x: `${monthNum}월`,
                y: round2(row.kwh),
              };
            });

            ys = ys.filter((i) => i.monthNum != null);
            ys.sort((a, b) => a.monthNum - b.monthNum);
            this.yearSeries = ys;

            this.yearRangeUtc = yearly?.range_utc || yearly?.range || null;
            this.summary.year_kwh = round2(
              this.yearSeries.reduce((s, r) => s + (r.y || 0), 0)
            );

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            if (this.yearSeries && this.yearSeries.length) {
              this.yearSeries = this.yearSeries.filter((item) => {
                if ((item.y || 0) < 0.01) return false;

                if (!item.yearNum || !item.monthNum) return true;

                if (item.yearNum < currentYear) return true;

                if (item.yearNum === currentYear) {
                  return item.monthNum <= currentMonth;
                }

                return false;
              });
            }

            this.kpis.totalKwh = this.summary.year_kwh;
            this.kpis.totalCo2 = this.co2(this.kpis.totalKwh);
            this.kpis.totalTrees = this.treesFromKwh(this.kpis.totalKwh);

            this.summary.co2_kg = this.co2(this.totalKwh);
            this.summary.trees = this.treesFromKwh(this.totalKwh);

            this.loadingYear = false;

            this.$nextTick(() =>
              this.updateAxisFonts ? this.updateAxisFonts() : null
            );
            if (this.updateChartDimensions) this.updateChartDimensions();
          } catch (e) {
            this.loadingYear = false;
          }
        };

        loadHourlyAndWeather();
        loadMonthly();
        loadYearly();

        this.hasSearched = true;
      } catch (e) {
        this.errorMsg = e?.message || "오z  류가 발생했습니다.";
      } finally {
        this.searching = false;
      }
    },
    reset() {
      if (this.searching) return;
      this.imeiField = "";
      this.energyField = "01";
      this.typeField = "";
      this.multiField = "";

      this.bars = [];
      this.totalKwh = 0;
      this.errorMsg = "";
      this.detailDay = "";
      this.detailRows = [];
      this.monthSeries = [];
      this.yearSeries = [];
      this.monthRangeUtc = null;
      this.yearRangeUtc = null;
      this.weekRangeUtc = null;
      this.summary = {
        capacity_kw: DUMMY_CAP_KW,
        today_kwh: 0,
        month_kwh: 0,
        year_kwh: 0,
        co2_kg: 0,
        trees: 0,
        install_date: null,
        monitor_start: null,
      };
      this.kpis = { totalKwh: 0, totalCo2: 0, totalTrees: 0 };
      this.avgEff = null;
      this.hasSearched = false;
      this.$router?.replace({ query: {} }).catch(() => {});
    },

    onBarEnter(chart, idx, evt) {
      this.updateTip(chart, idx, evt);
      this.tip.show = true;
    },
    onBarMove(chart, idx, evt) {
      this.updateTip(chart, idx, evt);
    },
    onBarLeave() {
      this.tip.show = false;
    },
    updateTip(chart, idx, evt) {
      let label = "",
        value = 0,
        wrap = null;
      if (chart === "week") {
        label = this.formatDay(this.bucketsWeek[idx]);
        value = this.valuesWeek[idx] || 0;
        wrap = this.$refs.weekWrap;
      } else if (chart === "month") {
        label = this.monthSeries[idx]?.label || this.bucketsMonth[idx];
        value = this.valuesMonth[idx] || 0;
        wrap = this.$refs.monthWrap;
      } else if (chart === "year") {
        label = this.bucketsYear[idx];
        value = this.valuesYear[idx] || 0;
        wrap = this.$refs.yearWrap;
      }

      const rect = wrap?.getBoundingClientRect?.();
      const cx = evt.clientX - (rect?.left || 0);
      const cy = evt.clientY - (rect?.top || 0);

      const margin = 10;
      const maxX = (rect?.width || 0) - 140;
      const maxY = (rect?.height || 0) - 60;
      const x = Math.min(Math.max(cx + 8, margin), maxX);
      const y = Math.min(Math.max(cy - 36, margin), maxY);

      this.tip = { show: true, x, y, chart, label, value };
    },

    hasAnyGeneration(rows) {
      return Array.isArray(rows) && rows.some((r) => Number(r?.kwh) > 0);
    },

    openDownloadModal() {
      if (!this.canDownload) {
        alert("먼저 조회를 수행하여 데이터를 불러와 주세요.");
        return;
      }
      const now = new Date();
      this.dlYear = now.getFullYear();
      this.dlMonth = now.getMonth() + 1;
      this.showDl = true;
    },
    closeDownloadModal() {
      if (this.downloading) return;
      this.showDl = false;
    },
    async doDownload() {
      const imei = this.imeiField?.trim();
      if (!imei) {
        alert("IMEI가 없습니다.");
        return;
      }

      if (!this.dlYear || !this.dlMonth) {
        alert("연/월을 선택해주세요.");
        return;
      }

      try {
        this.downloading = true;

        const qs = new URLSearchParams({
          imei,
          year: String(this.dlYear),
          month: String(this.dlMonth),
        });
        if (this.energyField) qs.set("energy", this.energyField);
        if (this.multiField && this.energyField === "01")
          qs.set("multi", this.multiField);

        const url = `/api/export/monthCsv?${qs.toString()}`;
        const resp = await fetch(url);

        if (!resp.ok) {
          let msg = `다운로드 실패 (HTTP ${resp.status})`;
          try {
            const j = await resp.json();
            if (j && j.error) msg = j.error;
          } catch (_) {
            /* non-JSON 응답일 수 있음 */
          }
          throw new Error(msg);
        }

        const blob = await resp.blob();

        let filename = `월별_${imei}_${this.dlYear}-${String(
          this.dlMonth
        ).padStart(2, "0")}`;
        if (this.energyField) filename += `_energy-${this.energyField}`;
        if (this.multiField && this.energyField === "01")
          filename += `_multi-${this.multiField}`;
        filename += `.csv`;

        const cd = resp.headers.get("Content-Disposition") || "";
        const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
        if (m && m[1]) filename = decodeURIComponent(m[1]);

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);

        this.showDl = false;
      } catch (e) {
        alert(e?.message || "다운로드 중 오류가 발생했습니다.");
      } finally {
        this.downloading = false;
      }
    },

    assertAggregateOrder() {
      const w = this.kpiWeek.kwh || 0;
      const m = this.kpiMonth.kwh || 0;
      const y = this.kpiYear.kwh || 0;
      if (y + 1e-6 < m || m + 1e-6 < w) {
      }
    },

    async openWxModal() {
      if (!this.imeiField?.trim()) {
        alert("IMEI를 먼저 입력해주세요.");
        return;
      }
      this.showWx = true;
      this.wxLoading = true;
      this.wxErr = "";
      this.wxWeek = [];

      try {
        const days = await this.fetchWeatherWeek();
        if (!days.length) {
          this.wxErr =
            "7일 예보 데이터를 불러올 수 없습니다. (서버의 daily 예보 지원 필요)";
        } else {
          this.wxWeek = days.slice(0, 7);
        }
      } catch (e) {
        this.wxErr = e?.message || "예보 로딩 중 오류가 발생했습니다.";
      } finally {
        this.wxLoading = false;
      }
    },
    closeWxModal() {
      this.showWx = false;
    },
  },

  mounted() {
    this.syncAdminFromStorage();
    this._storageHandler = (e) => {
      if (e.key === "isAdmin" || e.key === "email") this.syncAdminFromStorage();
    };
    window.addEventListener("storage", this._storageHandler);

    const q = this.$route?.query || {};
    this.imeiField =
      typeof q.imei === "string" && q.imei.trim()
        ? q.imei.trim()
        : DEFAULT_IMEI;
    this.energyField =
      typeof q.energy === "string" && q.energy.trim() ? q.energy.trim() : "01";
    this.typeField =
      typeof q.type === "string" && q.type.trim() ? q.type.trim() : "";
    this.multiField =
      typeof q.multi === "string" && q.multi.trim() ? q.multi.trim() : "";

    const handleResize = () => {
      this.updateAxisFonts();
      this.updateViewBox();
    };

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => handleResize());
      this.resizeObserver.observe(this.$el);
    } else {
      window.addEventListener("resize", handleResize);
    }

    this.$nextTick(() => {
      handleResize();
    });

    this.onSearch({ loadDefault: true });
  },

  beforeDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    else window.removeEventListener("resize", this.updateAxisFonts);
    if (this._storageHandler)
      window.removeEventListener("storage", this._storageHandler);
  },
};
</script>
