<!-- src/views/AnalysisTimeseries.vue -->
<template>
  <div class="ts-page">
    <!-- SEARCH BAR -->
    <section class="toolbar">
      <div class="tool-left">
        <!--  IMEI: 항상 표시 -->
            <template v-if="isAdmin">
        <label class="lbl">IMEI</label>
        <input
          v-model.trim="imeiField"
          @keyup.enter="onSearch"
          class="input"
          type="text"
          placeholder="예) 03-58-48-00-70-54-06-06"
            :readonly="!isAdmin"
        />
        </template>

        <!--  아래 필드들은 관리자만 표시 -->
        <template v-if="isAdmin">
          <label class="lbl">이름</label>
          <input
            v-model.trim="nameField"
            @keyup.enter="onSearch"
            class="input"
            type="text"
            placeholder="예) 홍길동"
          />

          <label class="lbl">에너지</label>
          <select v-model="energyField" class="input sel">
            <option value="01">태양광(0x01)</option>
            <option value="02">태양열(0x02)</option>
            <option value="03">지열(0x03)</option>
            <option value="04">풍력(0x04)</option>
            <option value="06">연료전지(0x06)</option>
            <option value="07">ESS(0x07)</option>
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
        </template>
      </div>

      <div class="tool-right" v-if="isAdmin">
        <button class="btn ghost" :disabled="loading" @click="resetAll">초기화</button>
        <button class="btn primary" :disabled="loading" @click="onSearch">
          <span v-if="!loading">조회</span>
          <span v-else class="btn-spinner" aria-hidden="true"></span>
        </button>
      </div>
    </section>

<section class="kpi-row">

  <!-- 🔵 로딩 상태: 스켈레톤 6개 표시 -->
  <template v-if="loadingKpis">
    <div v-for="n in 6" :key="'sk-'+n" class="kpi kpi-skeleton">
      <div class="kpi-hd">
        <span class="kpi-title skeleton-line"></span>
        <span class="kpi-ico skeleton-ico"></span>
      </div>
      <div class="kpi-main">
        <span class="skeleton-value"></span>
      </div>
      <div class="kpi-sub skeleton-line"></div>
    </div>
  </template>

  <!-- 🔵 실제 데이터 -->
  <template v-else>
    <div v-for="k in kpisShown" :key="k.key" class="kpi">
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
  </template>

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

  <!-- 🔵 로딩 상태 -->
  <template v-if="loadingHourly">
    <div class="chart-loading-skel">
      <div class="chart-skel-bar" v-for="n in 24" :key="'hb'+n"></div>
    </div>
  </template>

  <!-- 🔵 실제 차트 -->
  <template v-else>
    <div class="chart-placeholder" v-if="bars.length">

      <!-- ★★★ SVG 전체 복구 ★★★ -->
      <svg
        ref="svg"
        viewBox="0 0 1000 360"
        class="svg-chart"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#34f5e5" stop-opacity="1" />
            <stop offset="100%" stop-color="#34f5e5" stop-opacity=".38" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.28" />
          </filter>
        </defs>

        <!-- grid -->
        <g class="grid">
          <line v-for="(t, i) in yTicks" :key="'gy'+i"
                :x1="pad.l" :x2="vb.w-pad.r"
                :y1="t.y" :y2="t.y" />
        </g>

        <!-- left axis -->
        <g class="axis axis-left">
          <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
          <g v-for="(t,i) in yTicks" :key="'yl'+i">
            <text :x="pad.l-6" :y="t.y+4" text-anchor="end">{{ t.label }}</text>
          </g>
          <text :x="pad.l-6" :y="pad.t-6" text-anchor="end" class="axis-title">
            {{ unitEnergy }}
          </text>
        </g>

        <!-- bottom axis -->
        <g class="axis axis-bottom">
          <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
          <g v-for="(x,i) in xTicks" :key="'xt'+i">
            <line :x1="x.x" :x2="x.x"
                  :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
            <text :x="x.x" :y="vb.h-pad.b+18"
                  text-anchor="middle">{{ x.label }}</text>
          </g>
        </g>

        <!-- bars -->
        <g fill="url(#barGrad)" filter="url(#dropShadow)">
          <rect v-for="(b, i) in bars" :key="'b'+i"
                class="bar"
                :x="b.x" :y="b.y"
                :width="b.w" :height="b.h"
                rx="4" />
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
        <path v-if="bars.length" :d="linePath" class="line" />
        <g class="line-dots" v-if="bars.length">
          <circle v-for="(b,i) in bars" :key="'dot'+i"
                  class="line-dot"
                  :cx="b.xCenter" :cy="b.y" r="3" />
        </g>

        <!-- hover tooltip -->
        <g v-if="hoverIdx !== null">
          <line class="hover-line"
                :x1="hoverX" :x2="hoverX" :y1="pad.t" :y2="vb.h-pad.b" />
          <circle class="dot"
                  :cx="hoverX" :cy="hoverLineY" r="4" />

          <g :transform="tooltipTransform">
            <rect class="tt" :width="tt.w" :height="tt.h" rx="8" />
            <text class="tt-text" x="10" y="18">시간: {{ hoverLabel }}</text>
            <text class="tt-text" x="10" y="36">
              {{ labelEnergy }}:
              {{ hoverKw === null ? '—' : formatKwh1(hoverKw) }}
              {{ unitEnergy }}
            </text>
          </g>
        </g>

        <!-- hit area -->
        <rect
          class="hit"
          :x="pad.l"
          :y="pad.t"
          :width="inner.w"
          :height="inner.h"
          @mousemove="onMove"
          @mouseleave="onLeave"
        />
      </svg>

      <!-- legend -->
      <div class="legend">
        <span class="dot"></span>
        {{ selectedMulti ? `선택 설비 ${labelEnergy}(${unitEnergy})`
                         : `합산 ${labelEnergy}(${unitEnergy})` }}
        <span class="sep">•</span>
        <span class="linekey"></span> 꼭짓점 연결선
      </div>

    </div>

    <!-- bars 없음 -->
    <div class="chart-placeholder" v-else>
      <div class="legend">
        <span class="dot"></span> {{ labelEnergy }}({{ unitEnergy }})
        <span class="sep">•</span>
        <span class="linekey"></span> 꼭짓점 연결선
      </div>
    </div>

  </template>
</template>

<!-- 조회 전 -->
<template v-else>
  <div class="chart-placeholder" style="height:360px;"></div>
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
              v-if="isAdmin && !hasFacility"
              class="btn primary sm"
              :disabled="!imeiUse"
              @click="openFacilityEditor(false)"
            >설비정보 등록</button>
            <button
              v-if="isAdmin && hasFacility"
              class="btn ghost sm"
              :disabled="!imeiUse"
              @click="openFacilityEditor(true)"
            >수정</button>
          </div>
        </div>

<div class="facility-card">

  <!-- 🔵 로딩 상태 -->
  <template v-if="loadingFacility">
    <div class="fac-skel">
      <div class="fac-img-skel"></div>
      <ul class="kv">
        <li v-for="n in 6" :key="'fsk'+n">
          <span class="sk-line"></span>
          <strong class="sk-line"></strong>
        </li>
      </ul>
    </div>
  </template>

  <!-- 🔵 로딩 완료 -->
  <template v-else>
    <div v-if="facilityInfo.image" class="facility-img">
      <img :src="resolveImg(facilityInfo.image)"
           :alt="facilityInfo.projectName || '설비 이미지'" />
    </div>

    <ul class="kv">
      <li><span>모듈 용량</span><strong>{{ facilityInfo.moduleCapacity || '—' }}</strong></li>
      <li><span>설치일</span><strong>{{ facilityInfo.installDate || '—' }}</strong></li>
      <li><span>모니터링 시작</span><strong>{{ facilityInfo.monitorStart || '—' }}</strong></li>
      <li><span>사업명</span><strong>{{ facilityInfo.projectName || '—' }}</strong></li>
      <li><span>시공사</span><strong>{{ facilityInfo.contractor || '—' }}</strong></li>
      <li><span>A/S연락처</span><strong>{{ facilityInfo.asContact || '—' }}</strong></li>
    </ul>
  </template>

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
              <col
                v-for="(c,ci) in tableCols"
                :key="'col'+ci"
                :style="c.colStyle || 'width:110px'"
              />
            </colgroup>

            <thead>
              <tr>
                <th>NO</th>
                <th style="position:relative; left:3%;">RTU IMEI</th>
                <th>멀티 ID</th>
                <th style="position:relative; left:3%;">수집일시</th>
                <th v-for="(c,ci) in tableCols" :key="'th'+ci" :style="c.thStyle || 'position:relative; left:2%;'">
                  {{ c.label }}
                </th>
              </tr>
            </thead>
 <tbody>

  <!-- 🔵 운전이력 로딩 -->
  <template v-if="loadingDriver">
    <tr v-for="n in 5" :key="'drvsk'+n">
      <td colspan="999" class="tbl-skel"></td>
    </tr>
  </template>

  <!-- 🔵 실제 데이터 -->
  <template v-else>
    <tr
      v-for="(r,i) in driverRows"
      :key="'drv'+i"
      class="row-click"
      :title="r.multiId ? (multiLabel(r.multiId)+' 차트 보기') : '합산 보기'"
      @click="onRowClick(r)"
    >
      <td class="mono">{{ i+1 }}</td>
      <td class="mono">{{ r.imei }}</td>
      <td class="mono">{{ r.multiId || '—' }}</td>
      <td class="mono">{{ r.collectedAt || '—' }}</td>

      <td
        v-for="(c, ci) in tableCols"
        :key="'td' + i + '-' + ci"
        :class="c.num ? 'num' : ''"
      >
        {{ c.format ? c.format(r[c.key]) :
           (c.num ? fmt(r[c.key], c.digits || 0) : (r[c.key] ?? '—')) }}
      </td>
    </tr>
  </template>
</tbody>
          </table>
        </div>
      </article>

      <article class="card col-3">
        <div class="card-hd"><h3>효율지표</h3></div>

        <!-- 상단 상태 배지 -->
        <div class="eff-head">
          <span class="badge" :class="statusBadgeClass">
            데이터 상태 · {{ overallStatusText }}
          </span>
          <span v-if="energyField==='03'" class="badge" :class="stateBadgeClass">
            상태 · {{ overallStateText }}
          </span>
        </div>

        <!-- 메인 게이지 (있을 때만) -->
        <div v-if="effRing.show" class="eff-gauge">
          <div class="eff-gauge__ring" :style="ringStyle(effRing.pct || 0)"></div>
          <div class="eff-gauge__center">
            <div class="eff-gauge__value">
              {{ effRing.pct==null ? '—' : number(effRing.pct,1) }}<small>%</small>
            </div>
            <div class="eff-gauge__label">{{ effRing.title }}</div>
          </div>
        </div>

        <!-- 건강도 (텍스트 배지형) -->
        <div class="eff-health">
          <span :class="['eff-status', effHealthClass]">{{ effHealthText }}</span>
        </div>

        <!-- 핵심 타일 그리드 -->
        <div class="eff-grid">
          <div v-for="t in effTiles" :key="t.key" class="eff-tile">
            <div class="eff-tile__label">{{ t.label }}</div>
            <div class="eff-tile__value">
              {{ t.value==null ? '—' : number(t.value, t.digits||0) }}
              <small v-if="t.unit">{{ t.unit }}</small>
            </div>
            <div v-if="t.sub" class="eff-tile__sub">{{ t.sub }}</div>
          </div>
        </div>

        <!-- 경고/메모 -->
        <div v-if="effNotes" class="eff-note">{{ effNotes }}</div>
      </article>
    </section>
    <section class="row">
      <!-- ▼ 추가 정보 -->
      <article class="card col-3">
        <div class="card-hd"><h3>추가 정보</h3></div>
        <ul class="kv">
          <li><span>총 {{ labelEnergy }}</span><strong>{{ fmt(kpi.total_kwh, 2) }} {{ unitEnergy }}</strong></li>
          <li><span>탄소 절감</span><strong>{{ fmt(kpi.co2_ton, 2) }} 톤</strong></li>
        </ul>
      </article>

      <!-- ▼ 날씨 데이터 (새 디자인) -->
      <article class="card col-3 weather-card">
   <template v-if="loadingWeather">
    <div class="weather-skel">
      <div class="wx-temp-skel"></div>
      <div class="wx-pills-skel"></div>
      <div class="wx-strip-skel"></div>
    </div>
  </template>

<!-- 🔵 완료 후 -->
  <template v-else>
        <div class="card-hd">
          <h3>환경 데이터</h3>
          <small class="muted" v-if="envHourly && envHourly.length">
            기준 {{ new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}) }}
          </small>
        </div>

        <!-- 스냅샷 헤더 -->
        <div class="wx-snapshot">
          <div class="wx-temp">
            <div class="wx-temp-main">
              <span class="wx-temp-now">{{ envTempC==null ? '—' : number(envTempC,1) }}</span><span class="unit">°C</span>
            </div>
            <div class="wx-temp-sub" v-if="envApparentC!=null">
              체감 {{ number(envApparentC,1) }}°C
            </div>
          </div>

          <div class="wx-pills">
            <span class="pill">
              {{ envCond || '—' }}
            </span>
            <span class="pill" v-if="envPopPct!=null">
              강수확률 {{ number(envPopPct,0) }}%
            </span>
            <span class="pill" v-if="envWindMs!=null">
              풍속 {{ number(envWindMs*3.6,0) }}km/h
            </span>
            <span class="pill" v-if="envHumidityPct!=null">
              습도 {{ number(envHumidityPct,0) }}%
            </span>
            <span class="pill" v-if="envIrradWm2!=null">
              일사 {{ number(envIrradWm2,0) }} W/m²
            </span>
          </div>
        </div>

        <!-- 시간대 스트립 -->
        <div class="wx-strip thin-scroll" v-if="envHourly && envHourly.length">
          <svg viewBox="0 0 720 140" class="wx-svg" aria-hidden="true">
            <!-- 가이드 라인 -->
            <g class="wx-grid">
              <line x1="0" x2="720" y1="100" y2="100" />
            </g>

            <!-- 막대: 강수확률(POP) -->
            <g>
              <rect v-for="(h,i) in wxStripPoints" :key="'b'+i"
                    :x="h.x - wxBarW/2" :y="100 - h.popH" :width="wxBarW" :height="h.popH"
                    class="wx-bar"/>
            </g>

            <!-- 라인: 기온 -->
            <path :d="wxTempPath" class="wx-line"/>
            <g>
              <circle v-for="(h,i) in wxStripPoints" :key="'d'+i" :cx="h.x" :cy="h.tempY" r="3" class="wx-dot"/>
            </g>

            <!-- 풍속: 화살표(삼각) -->
            <g class="wx-wind">
              <path v-for="(h,i) in wxStripPoints" :key="'w'+i"
                    :d="`M${h.x-4},${110} L${h.x+4},${110} L${h.x},${110 - h.windH} Z`"/>
            </g>

            <!-- 라벨(시간) -->
            <g class="wx-tick">
              <text v-for="(h,i) in wxStripPoints" :key="'t'+i"
                    :x="h.x" y="130" text-anchor="middle">
                {{ h.hh }}
              </text>
            </g>
          </svg>

          <div class="wx-inspect" :class="{ pinned: wxPinned }">
            <template v-if="inspectData">
              <strong>{{ inspectData.hh }}시</strong>
              <span class="sep">·</span>
              <span>{{ inspectData.cond || '—' }}</span>
              <span class="sep">·</span>
              <span>기온 {{ number(inspectData.temp,1) }}°C</span>
              <span v-if="inspectData.app!=null"> (체감 {{ number(inspectData.app,1) }}°C)</span>
              <span class="sep">·</span>
              <span>강수확률 {{ inspectData.pop!=null ? number(inspectData.pop,0)+'%' : '—' }}</span>
              <span class="sep">·</span>
              <span>풍속 {{ inspectData.wind!=null ? number(inspectData.wind*3.6,0)+'km/h' : '—' }}</span>
              <span v-if="inspectData.cloud!=null" class="sep">·</span>
              <span v-if="inspectData.cloud!=null">구름 {{ number(inspectData.cloud,0) }}%</span>
            </template>
            <template v-else>
              시간 축 위에 마우스를 올리면 상세가 여기에 표시됩니다.
            </template>
          </div>

          <!-- 히트 레이어: hover로 인덱스 갱신, 클릭 시 핀 고정 -->
          <div class="wx-hit"
               @mousemove="onWxMove"
               @mouseleave="onWxLeave"
               @click="onWxClick"></div>
        </div>

        <!-- 결측/로딩 -->
        <div v-else class="wx-empty">
          <span class="pill muted">날씨 데이터 수집 중</span>
        </div>
  </template>
      </article>

      <!-- ▼ 유지보수 -->
      <article class="card col-3">
        <div class="card-hd">
          <h3>유지보수</h3>
          <div class="card-actions">
            <button
              class="btn ghost sm"
              v-if="isAdmin"
              :disabled="!imeiUse"
              @click="openMaintModal"
            >
              수정
            </button>
          </div>
        </div>
<ul class="kv">
  <template v-if="loadingMaint">
    <li><span>마지막 점검</span><strong class="sk-line"></strong></li>
    <li><span>AS 특이사항</span><strong class="sk-line"></strong></li>
  </template>

  <template v-else>
    <li>
      <span>마지막 점검</span>
      <strong>{{ maintenance.lastInspection || '—' }}</strong>
    </li>
    <li>
      <span>AS 특이사항</span>
      <strong>{{ maintenance.asNotes || '—' }}</strong>
    </li>
  </template>
</ul>
      </article>

            <article class="card col-3">
          <div class="qa-main">
            <div class="qa-title"></div>
            <div class="qa-desc"></div>
          </div>
      </article>
    </section>
    
<section class="sub-dashboard">
  <EnergyDashboard
    class="sub-dashboard-inner"
    :imei="imeiUse"
    :is-admin="isAdmin"
    :multi="selectedMulti"
  />
</section>

    <!-- 설비정보 등록/수정 모달 -->
    <div v-if="showFacilityEditor" class="ats-modal" role="dialog" aria-modal="true">
      <div class="ats-modal__backdrop" @click="closeFacilityEditor"></div>
      <div class="ats-modal__panel">
        <header class="ats-modal__hd">
          <h4>{{ editingFacility ? '설비정보 수정' : '설비정보 등록' }}</h4>
          <button class="close" @click="closeFacilityEditor">✕</button>
        </header>
        <div class="ats-modal__body">
          <label>모듈 용량</label>
          <input v-model="facilityForm.module_capacity" />
          <label>설치일</label>
          <div class="date-field">
            <input type="date" v-model="facilityForm.install_date" ref="facInstall" />
            <button type="button" class="calendar-btn" @click="openDate('facInstall')" aria-label="설치일 선택">📅</button>
          </div>

          <label>모니터링 시작</label>
          <div class="date-field">
            <input type="date" v-model="facilityForm.monitor_start" ref="facMonitor" />
            <button type="button" class="calendar-btn" @click="openDate('facMonitor')" aria-label="모니터링 시작일 선택">📅</button>
          </div>
          <label>사업명</label>
          <input v-model="facilityForm.project_name" />
          <label>시공사</label>
          <input v-model="facilityForm.contractor" />
          <label>A/S 연락처</label>
          <input v-model="facilityForm.as_contact" />
          <label><span>설비 이미지</span>  <input
    type="file"
    accept="image/*"
    class="facility-image-input"
    @change="onFacilityImageChange"
  /></label>

<div class="img-upload-box">
  <!-- 프리뷰 이미지 -->
  <img
    v-if="previewImage || facilityForm.image_url"
    :src="previewImage || resolveImg(facilityForm.image_url)"
    class="img-preview"
  />

  <!-- 기본 UI (이미지 없을 때) -->
  <div v-else class="img-empty">
    <p class="img-empty-title">이미지를 업로드하세요</p>
    <p class="img-empty-desc">권장 크기: 380 × 260 px</p>
    <p class="img-empty-sub">JPG / PNG 지원</p>
  </div>
</div>
</div>
        <footer class="ats-modal__ft">
          <button class="btn ghost" @click="closeFacilityEditor">취소</button>
          <button class="btn primary" @click="saveFacility" :disabled="savingFacility">저장</button>
        </footer>
      </div>
    </div>

    <!-- 이름/중복 선택 모달 -->
    <div
      v-if="searchModal.visible"
      class="ats-select-modal"
      role="dialog"
      aria-modal="true"
      @keydown.stop.prevent="onSearchModalKeydown"
    >
      <div class="ats-select-modal__backdrop" @click="closeSearchModal"></div>

      <div class="ats-select-modal__panel" tabindex="-1">
        <!-- 헤더 -->
        <header class="ats-select-modal__hd">
          <h4 class="ats-select-modal__title">장비 선택</h4>
          <button
            type="button"
            class="ats-select-modal__close"
            aria-label="닫기"
            @click="closeSearchModal"
          >
            ✕
          </button>
        </header>

        <!-- 툴바 -->
        <div class="ats-select-modal__toolbar">
          <input
            v-model.trim="searchModal.keyword"
            class="ats-select-modal__input"
            type="text"
            placeholder="이름/주소/IMEI로 필터"
          />
          <button
            class="ats-select-modal__btn ats-select-modal__btn--primary"
            :disabled="filteredMatches.length===0 || searchModal.selectedIdx<0"
            @click="confirmSearchSelection"
          >
            선택
          </button>
        </div>

        <!-- 리스트 -->
        <div class="ats-select-modal__body thin-scroll">
          <table class="ats-select-modal__table">
            <thead>
              <tr>
                <th style="width:44px">#</th>
                <th>이름</th>
                <th>주소</th>
                <th>설치사</th>
                <th>모니터사</th>
                <th>IMEI</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(m, i) in filteredMatches"
                :key="m.rtuImei || m.imei || i"
                :class="{'is-selected': i === searchModal.selectedIdx}"
                @click="confirmSearchSelection(i)"
                @mouseenter="selectSearchRow(i)"
              >
                <td class="mono">{{ i+1 }}</td>
                <td class="cell-strong">{{ m.name || '—' }}</td>
                <td class="cell-dim">{{ m.address || '—' }}</td>
                <td>{{ m.facCompany || '—' }}</td>
                <td>{{ m.monitorCompany || '—' }}</td>
                <td class="mono">{{ m.rtuImei || m.imei }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredMatches.length===0" class="ats-select-modal__empty">
            일치 항목이 없습니다.
          </div>
        </div>
      </div>
    </div>

    <!-- 유지보수 입력/수정 모달 -->
    <div
      v-if="maintModal.open"
      class="ats-modal"
      role="dialog"
      aria-modal="true"
      @keydown.esc="closeMaintModal"
    >
      <div class="ats-modal__backdrop" @click="closeMaintModal"></div>

      <div class="ats-modal__panel" tabindex="-1">
        <!-- 헤더 -->
        <header class="ats-modal__hd">
          <h4 class="ats-modal__title">유지보수 정보</h4>
          <button
            type="button"
            class="ats-modal__close"
            aria-label="닫기"
            @click="closeMaintModal"
          >✕</button>
        </header>

        <!-- 바디 -->
        <div class="ats-modal__body">
          <label class="form-label">마지막 점검</label>
          <div class="date-field">
            <input type="date" class="form-input" v-model="maintForm.lastInspection" ref="maintDate" />
            <button type="button" class="calendar-btn" @click="openDate('maintDate')" aria-label="마지막 점검일 선택">📅</button>
          </div>

          <label class="form-label">AS 특이사항</label>
          <textarea
            class="form-textarea"
            rows="6"
            placeholder="점검/교체 내용, 고장 내역, 방문 필요 여부 등을 적어주세요."
            v-model="maintForm.asNotes"
          ></textarea>
        </div>

        <!-- 푸터 -->
        <footer class="ats-modal__ft">
          <button
            class="btn ghost"
            @click="closeMaintModal"
            :disabled="maintModal.saving"
          >취소</button>

          <button
            class="btn primary"
            @click="saveMaintenance"
            :disabled="maintModal.saving"
          >
            <span v-if="!maintModal.saving">저장</span>
            <span v-else class="btn-spinner" aria-hidden="true"></span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/analysis-timeseries.css';
import EnergyDashboard from '@/views/EnergyDashboard.vue'

const DEFAULT_IMEI = '';

export default {
  name: 'AnalysisTimeseries',
  props: {
    imei: { type: String, default: '' },       // 부모로부터 IMEI 전달받음
    isAdmin: { type: Boolean, default: false } // 관리자 여부 전달받음
  },
  components: { EnergyDashboard },
  data () {
    return {
    loadingKpis: false,
loadingHourly: false,
loadingLatest: false,
loadingDriver: false,
loadingFacility: false,
loadingMaint: false,
loadingWeather: false,
    previewImage: null,
      inspectIdx: null,
      wxPinned: false,
      _searchTimer: null,
      nameField: '',
      imeiField: DEFAULT_IMEI,
      energyField: '01',
      typeField: '',
      onlyOk: true,
      lastRouterErr: '',
      imeiUse: '',
      envHourly: [],

      // 관리자 여부
      isAdmin: false,

      searching: false,
      _inited: false,

      driverUnits: [],

      // 이름/중복 선택 모달 상태
      searchModal: {
        visible: false,
        loading: false,
        matches: [],
        keyword: '',
        selectedIdx: -1,
      },

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
        statusList: [], faultList: [],
        state: null, state_raw: null,
        isOperating: null
      },
      latestCollectedAt: null,

      loading: false,
      /* probe 컨트롤러 분리하여 경합 제거 */
      controllers: { probe:null, kpis:null, latest:null, hourly:null, driver:null, weather:null, facility:null, maintenance:null },

      currentReqId: 0,

      vb: { w: 1000, h: 360 },
      pad: { t: 16, r: 16, b: 28, l: 18 },
      hoverIdx: null,
      tt: { w: 180, h: 50 },

      /* 확장된 날씨 지표 (카드에 표시) */
      envTempC: null,
      envApparentC: null,
      envCond: null,
      envPopPct: null,
      envHumidityPct: null,
      envWindMs: null,
      envPressureHpa: null,
      envCloudPct: null,
      envPrecipMm: null,
      envIrradWm2: null, // 선택적으로 노출

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

      maintModal: { open: false, saving: false },
      maintForm: { lastInspection: '', asNotes: '' },

      /* 멀티 선택 등 기존 로직에서 사용 */
      selectedMulti: '',
    }
  },
  computed: {
    inspectData () {
      const i = this.inspectIdx;
      const arr = this.wxStripPoints || [];
      if (i==null || !arr.length) return null;
      return arr[i];
    },

    // 날씨 스트립 포인트 계산
    wxStripPoints () {
      const rows = Array.isArray(this.envHourly) ? this.envHourly : [];
      if (!rows.length) return [];

      const hours = Array.from({length: 18}, (_,i) => 6 + i); // 06~23
      const xStep = 720 / (hours.length - 1);
      const tempVals = [];
      const windVals = [];
      const pops = [];

      const pickByHour = (hh) => {
        return rows.find(r => Number(r.hour) === hh) || null;
      };

      const pts = hours.map((hh, idx) => {
        const r = pickByHour(hh) || {};
        const t = (typeof r.temp === 'number') ? r.temp : null;
        const w = (typeof r.wind === 'number') ? r.wind : null;
        const p = (typeof r.pop  === 'number') ? r.pop  : null;

        if (t!=null) tempVals.push(t);
        if (w!=null) windVals.push(w);
        if (p!=null) pops.push(p);

        return {
          hh,
          x: Math.round(idx * xStep),
          temp: t, app: r.app ?? null,
          wind: w, pop: p, precip: r.precip ?? null,
          cloud: r.cloud ?? null,
          cond: this.envCondFromHour ? this.envCondFromHour(hh) : null,
        };
      });

      // 스케일링
      const tMin = Math.min(...tempVals, 0);
      const tMax = Math.max(...tempVals, 1);
      const wMax = Math.max(...windVals, 1);
      const pMax = Math.max(...pops, 1);

      pts.forEach(p => {
        // 온도는 20~90px 사이로 normalize
        const ratio = (p.temp==null) ? 0 : (p.temp - tMin) / Math.max(1e-6, (tMax - tMin));
        p.tempY = 80 - ratio * 60 + 20; // 20~80

        // POP 막대
        p.popH = (p.pop==null) ? 0 : (p.pop / pMax) * 70;

        // 풍속 화살표 높이
        p.windH = (p.wind==null) ? 0 : (p.wind / wMax) * 24 + 4;
      });

      return pts;
    },
    wxTempPath () {
      const pts = this.wxStripPoints.filter(p => p.temp!=null);
      if (!pts.length) return '';
      return 'M' + pts.map(p => `${p.x},${p.tempY}`).join(' L');
    },
    // 날씨 전용 막대 폭(충돌 방지)
    wxBarW () { return 18; },

    effRing () {
      if (this.eff.kind === 'electric') {
        const pct = (typeof this.eff.inverterEffPct === 'number') ? Math.max(0, Math.min(100, this.eff.inverterEffPct)) : null;
        return { show: pct != null, pct, title: this.inverterTitle };
      }
      return { show: false, pct: null, title: '' };
    },

    effTiles () {
      if (this.eff.kind === 'electric') {
        return [
          { key:'pf',   label:'역률',   value: this.eff.pfPct==null?null:this.eff.pfPct, digits:1, unit:'%' },
          { key:'freq', label:'주파수', value: this.eff.freqHz,                             digits:1, unit:'Hz' },
        ];
      }
      if (this.eff.kind === 'thermal') {
        return [
          { key:'supply', label:'공급온도', value:this.eff.supplyC, digits:1, unit:'°C' },
          { key:'return', label:'환수온도', value:this.eff.returnC, digits:1, unit:'°C' },
          { key:'delta',  label:'ΔT',     value:this.eff.deltaC,  digits:1, unit:'°C', sub:'공급-환수' },
          { key:'flow',   label:'유량',    value:this.eff.flowLpm, digits:1, unit:'LPM' },
          { key:'q',      label:'순간열량', value:this.eff.thermalKw, digits:2, unit:'kW' },
        ];
      }
      // geothermal
      return [
        { key:'elec',  label:'전력 입력', value:this.eff.elecKw,  digits:2, unit:'kW' },
        { key:'heat',  label:'열 생산',   value:this.eff.heatKw,  digits:2, unit:'kW' },
        { key:'cop',   label:'COP',      value:this.eff.cop,     digits:2, unit:''   },
        { key:'dsrc',  label:'소스 ΔT',   value:this.eff.deltaSrcC, digits:1, unit:'°C' },
        { key:'dload', label:'부하 ΔT',   value:this.eff.deltaLoadC, digits:1, unit:'°C' },
      ];
    },

    effNotes () {
      if (this.overallStatusText === '고장') return '고장 알람이 감지되었습니다. 인버터/센서 점검이 필요합니다.';
      if (this.overallStatusText === '주의') return '주의 상태입니다. 최근 운전 이력과 알람 로그를 확인해 주세요.';
      return null;
    },

    effHealthText() {
      if (!this.mets) return '—';
      if (Array.isArray(this.mets.faultList) && this.mets.faultList.length) return '⚠️ 고장 발생';
      if (Array.isArray(this.mets.statusList) && this.mets.statusList.length) return '주의 상태';
      if (this.mets.isOperating === false) return '미작동';
      return '정상 운전 중';
    },
    effHealthClass() {
      const t = this.effHealthText;
      if (t.includes('고장')) return 'crit';
      if (t.includes('주의')) return 'warn';
      if (t.includes('미작동')) return 'idle';
      return 'ok';
    },

    overallStatusText () {
      const sList = Array.isArray(this.mets?.statusList) ? this.mets.statusList : [];
      const fList = Array.isArray(this.mets?.faultList) ? this.mets.faultList : [];
      if (fList.length) return '고장';
      if (sList.length) return '주의';
      if (Array.isArray(this.driverRows) && this.driverRows.some(r => r.status && r.status !== '정상')) return '주의';
      return '정상';
    },
    statusBadgeClass () {
      const text = this.overallStatusText;
      if (text === '정상') return 'ok';
      if (text === '주의') return 'warn';
      if (text === '고장') return 'crit';
      return '';
    },

    eff() {
      const row = Array.isArray(this.driverUnits) && this.driverUnits.length
        ? this.driverUnits[0]
        : null;
      const m   = row || this.mets || {};
      const nz = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);

      if (!this.isHeat) {
        let pfPct = null;
        const pfRaw = nz(m.power_factor ?? m.pf ?? m.pfPct);
        if (pfRaw != null) pfPct = pfRaw > 1 ? pfRaw : Math.round(pfRaw * 1000) / 10;
        const freqHz = nz(m.frequency_hz ?? m.freq ?? this.mets?.frequencyHz);
        return {
          kind: 'electric',
          inverterEffPct: nz(this.kpi?.inverter_efficiency_pct),
          pfPct,
          freqHz
        };
      }

      if (this.energyField === '02') {
        const supply = nz(row?.supplyC) ?? nz(this.mets?.supplyC);
        const ret    = nz(row?.returnC) ?? nz(this.mets?.returnC);
        const flow   = nz(row?.flowLpm) ?? nz(this.mets?.flowLpm);
        const dT = (supply!=null && ret!=null) ? Math.round((supply - ret) * 10) / 10 : null;
        let qKw = null;
        if (flow != null && dT != null) qKw = Math.max(0, Math.round((0.069 * flow * dT) * 100) / 100);
        return { kind: 'thermal', supplyC: supply, returnC: ret, deltaC: dT, flowLpm: flow, thermalKw: qKw };
      }

      const elecW = nz(row?.nowW) ?? nz(this.mets?.nowW);
      const heatW = nz(row?.heatW) ?? (typeof this.mets?.heat_kw === 'number' ? this.mets.heat_kw * 1000 : null);
      const elecKw = elecW != null ? Math.round(elecW) / 1000 : null;
      const heatKw = heatW != null ? Math.round(heatW) / 1000 : null;

      const totalKwh = nz(row?.totalKwh) ?? nz(this.kpi?.total_kwh);
      const elecKwh  = nz(row?.elecKwh);

      let cop = null;
      if (heatKw != null && elecKw != null && elecKw > 0) cop = Math.round((heatKw / elecKw) * 100) / 100;
      else if (totalKwh != null && elecKwh != null && elecKwh > 0) cop = Math.round((totalKwh / elecKwh) * 100) / 100;

      const srcIn  = nz(row?.srcInC);  const srcOut = nz(row?.srcOutC);
      const loadIn = nz(row?.loadInC); const loadOut = nz(row?.loadOutC);
      const dSrc  = (srcIn!=null && srcOut!=null) ? Math.round((srcOut - srcIn) * 10) / 10 : null;
      const dLoad = (loadIn!=null && loadOut!=null) ? Math.round((loadOut - loadIn) * 10) / 10 : null;

      return { kind: 'geothermal', elecKw, heatKw, cop, deltaSrcC: dSrc, deltaLoadC: dLoad };
    },

    isHeat () { return this.energyField === '02' || this.energyField === '03'; },
    isElectricFamily() { return !this.isHeat; },
    apiNS () {
      if (this.energyField === '02') return 'thermal';
      if (this.energyField === '03') return 'geothermal';
      return 'electric';
    },
    labelEnergy () { return this.isHeat ? '열량' : '발전량'; },
    unitEnergy () { return 'kWh'; },

    inverterTitle () {
      return this.energyField === '01' ? '인버터 효율' : '시스템 효율';
    },

    kpisShown () {
      return [
        { key: 'now',     title: this.isHeat ? '현재 열출력' : '현재 출력',     unit: 'kW'  },
        { key: 'today',   title: this.isHeat ? '금일 열량'   : '금일 발전량',   unit: this.unitEnergy },
        { key: 'co2',     title: 'CO₂ 저감',                                   unit: 'tCO₂' },
        { key: 'avg',     title: this.isHeat ? '지난 달 평균 열출력' : '지난 달 평균 출력', unit: 'kW'  },
        { key: 'status',  title: '시스템 상태',                                 unit: ''    },
        { key: 'total',   title: this.isHeat ? '누적 열량' : '누적 발전량',     unit: this.unitEnergy },
      ];
    },

    filteredMatches () {
      const kw = (this.searchModal.keyword || '').trim().toLowerCase();
      let arr = Array.isArray(this.searchModal.matches) ? [...this.searchModal.matches] : [];
      if (kw) {
        arr = arr.filter(m => {
          const s = [
            m.name, m.address, m.facCompany, m.monitorCompany,
            m.rtuImei || m.imei
          ].filter(Boolean).join(' ').toLowerCase();
          return s.includes(kw);
        });
      }
      arr.sort((a,b) =>
        (a.name||'').localeCompare(b.name||'', 'ko') ||
        (a.address||'').localeCompare(b.address||'', 'ko') ||
        (String(a.rtuImei||a.imei||'')).localeCompare(String(b.rtuImei||b.imei||''))
      );
      return arr;
    },

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
    // 에너지 차트 전용 막대폭
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

    tableCols () {
      if (!this.isHeat) {
        return [
          { key:'pvV',      label:'PV전압(V)',             num:true, digits:0 },
          { key:'pvA',      label:'PV전류(A)',             num:true, digits:1 },
          { key:'pvW',      label:'PV출력(W)',             num:true, digits:0 },
          { key:'gridV',    label:'계통전압(V)',           num:true, digits:0 },
          { key:'gridA',    label:'계통전류(A)',           num:true, digits:1 },
          { key:'nowW',     label:'현재출력(W)',           num:true, digits:0 },
          { key:'pf',       label:'역률(%)',               num:true, digits:1 },
          { key:'freq',     label:'주파수(Hz)',            num:true, digits:1 },
          { key:'totalKwh', label:'누적발전량(kWh)',       num:true, digits:2 },
        ];
      }
      if (this.energyField === '03') {
        return [
          { key:'gridV',      label:'계통전압(V)',             num:true, digits:0 },
          { key:'gridA',      label:'계통전류(A)',             num:true, digits:1 },
          { key:'nowW',       label:'소비전력(W)',             num:true, digits:0 },
          { key:'heatW',      label:'열생산량(W)',             num:true, digits:0 },
          { key:'pf',         label:'역률(%)',                 num:true, digits:1 },
          { key:'freq',       label:'주파수(Hz)',              num:true, digits:1 },
          { key:'srcInC',     label:'지열수 입구(°C)',         num:true, digits:1 },
          { key:'srcOutC',    label:'지열수 출구(°C)',         num:true, digits:1 },
          { key:'loadInC',    label:'로드 입구(°C)',           num:true, digits:1 },
          { key:'loadOutC',   label:'로드 출구(°C)',           num:true, digits:1 },
          { key:'flowLpm',    label:'유량(LPM)',               num:true, digits:1 },
          { key:'elecKwh',    label:'누적전력(kWh)',           num:true, digits:2 },
          { key:'totalKwh',   label:'누적열량(kWh)',           num:true, digits:2 },
        ];
      }
      return [
        { key:'supplyC',   label:'공급온도(°C)',          num:true, digits:1 },
        { key:'returnC',   label:'환수온도(°C)',          num:true, digits:1 },
        { key:'tankC',     label:'탱크온도(°C)',          num:true, digits:1 },
        { key:'flowLpm',   label:'유량(LPM)',             num:true, digits:1 },
        { key:'totalKwh',  label:'누적열량(kWh)',         num:true, digits:2 },
      ];
    },

    driverRows () {
      if (Array.isArray(this.driverUnits) && this.driverUnits.length) {
        return this.driverUnits
          .filter(u => u && (u.ts || u.time || u.collectedAt))
          .sort((a, b) => (a.multi || '').localeCompare(b.multi || ''))
          .map(u => {
            const collectedAt = new Date(u.ts || u.time || u.collectedAt).toLocaleString('ko-KR');

            if (!this.isHeat) {
              return {
                imei: this.imeiUse || '—',
                multiId: u.multi || null,
                collectedAt,
                status: Array.isArray(u.status_list) && u.status_list.length ? '주의' : '정상',
                pvV: u.pv_voltage_v ?? null,
                pvA: u.pv_current_a ?? null,
                pvW: u.pv_power_w ?? null,
                gridV: u.system_voltage_v ?? u.grid_voltage_v ?? null,
                gridA: u.system_current_a ?? u.grid_current_a ?? null,
                nowW: u.current_output_w ?? u.input_power_w ?? null,
                pf: u.power_factor ?? u.pf ?? null,
                freq: u.frequency_hz ?? u.freq ?? null,
                totalKwh: (typeof u.cumulative_wh === 'string' || typeof u.cumulative_wh === 'number')
                  ? Math.round((Number(u.cumulative_wh) / 1000) * 100) / 100
                  : (u.cumulative_kwh ?? null)
              };
            }

            if (this.energyField === '03') {
              const elecKwh = (typeof u.cumulative_wh === 'string' || typeof u.cumulative_wh === 'number')
                ? Number(u.cumulative_wh) / 1000
                : (typeof u.cumulativeWh === 'string' || typeof u.cumulativeWh === 'number')
                  ? Number(u.cumulativeWh) / 1000
                  : (u.cumulative_kwh ?? u.energy_used_kwh ?? null);

              const stateByBool = (typeof u.isOperating === 'boolean')
                ? (u.isOperating ? '운전중' : '미작동')
                : null;

              return {
                imei: this.imeiUse || '—',
                multiId: u.multi || null,
                collectedAt,
                status: Array.isArray(u.status_list) && u.status_list.length ? '주의' : '정상',
                state: stateByBool
                  || (typeof u.state === 'string' ? u.state
                  : (typeof u.state_raw === 'number' ? (u.state_raw === 0 ? '미작동' : '운전중') : null)),
                gridV: u.system_voltage_v ?? u.grid_voltage_v ?? null,
                gridA: u.system_current_a ?? u.grid_current_a ?? null,
                nowW: u.current_output_w ?? u.input_power_w ?? null,
                heatW: (typeof u.heat_kw === 'number' ? u.heat_kw * 1000
                      : typeof u.thermal_kw === 'number' ? u.thermal_kw * 1000
                      : typeof u.q_kw === 'number' ? u.q_kw * 1000
                      : u.heat_output_w ?? null),
                pf: u.power_factor ?? u.pf ?? null,
                freq: u.frequency_hz ?? u.freq ?? null,

                srcInC:  this.pickFirstNum([u.inlet_temp_c, u.source_in_c, u.ground_in_c, u.brine_in_c, u.srcInC]),
                srcOutC: this.pickFirstNum([u.outlet_temp_c, u.source_out_c, u.ground_out_c, u.brine_out_c, u.srcOutC]),
                loadInC: this.pickFirstNum([u.load_in_temp_c, u.load_in_c, u.chilled_in_c, u.heating_in_c, u.loadInTempC]),
                loadOutC:this.pickFirstNum([u.load_out_temp_c, u.load_out_c, u.chilled_out_c, u.heating_out_c, u.loadOutTempC]),
                flowLpm: this.pickFirstNum([u.load_flow_lpm, u.brine_flow_lpm, u.primary_flow_lpm, u.secondary_flow_lpm, u.flow_lpm, u.flow_rate_lpm]),

                elecKwh: elecKwh ?? null,
                totalKwh: this.pickFirstNum([u.produced_kwh, u.thermal_total_kwh, u.heating_kwh, u.used_kwh, u.tapUsedKwh])
              };
            }

            // 태양열(02)
            return {
              imei: this.imeiUse || '—',
              multiId: u.multi || null,
              collectedAt,
              status: Array.isArray(u.status_list) && u.status_list.length ? '주의' : '정상',
              supplyC: this.pickFirstNum([u.outlet_temp_c, u.hot_temp_c, u.t_out_c]),
              returnC: this.pickFirstNum([u.inlet_temp_c, u.cold_temp_c, u.t_in_c]),
              tankC:   this.pickFirstNum([u.tank_top_temp_c, u.tank_bottom_temp_c, u.tank_temp_c, u.storage_temp_c, u.buffer_tank_temp_c]),
              flowLpm: this.pickFirstNum([u.flow_lpm, u.flow_rate_lpm]),
              totalKwh: this.pickFirstNum([
                u.produced_kwh, u.used_kwh, u.heating_kwh, u.thermal_total_kwh,
                (typeof u.cumulative_wh === 'string' || typeof u.cumulative_wh === 'number')
                  ? Number(u.cumulative_wh) / 1000
                  : null
              ])
            };
          });
      }

      // ▼ 멀티가 없는 합산 단일행 (전기)
      if (!this.isHeat) {
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
          collectedAt,
          status: this.mets?.statusList?.length ? '주의' : '정상',
          pvV, pvA, pvW,
          gridV, gridA,
          nowW, pf, freq,
          totalKwh: totalK
        }];
      }

      // ▼ 멀티가 없는 합산 단일행 (지열)
      if (this.energyField === '03') {
        const t = this.mets || {};
        const collectedAt = this.latestCollectedAt
          ? new Date(this.latestCollectedAt).toLocaleString('ko-KR')
          : (this.kpi?._updatedAt ? new Date(this.kpi._updatedAt).toLocaleString('ko-KR') : null);

        const heatW = (typeof t.heat_kw === 'number' ? t.heat_kw * 1000
                     : typeof t.thermal_kw === 'number' ? t.thermal_kw * 1000
                     : typeof t.q_kw === 'number' ? t.q_kw * 1000
                     : t.heatProductionW ?? t.heat_output_w ?? null);

        const elecKwh = (typeof t.cumulative_wh === 'string' || typeof t.cumulative_wh === 'number')
          ? Number(t.cumulative_wh) / 1000
          : (typeof t.cumulativeWh === 'string' || typeof t.cumulativeWh === 'number'
              ? Number(t.cumulativeWh) / 1000
              : (t.cumulative_kwh ?? t.energy_used_kwh ?? null));

        const stateByBool = (typeof t.isOperating === 'boolean')
          ? (t.isOperating ? '운전중' : '미작동')
          : null;

        return [{
          imei: this.imeiUse || '—',
          multiId: null,
          collectedAt,
          status: t.statusList?.length ? '주의' : '정상',
          state: stateByBool || (typeof t.state === 'string' ? t.state
                : (typeof t.state_raw === 'number' ? (t.state_raw === 0 ? '미작동' : '운전중') : null)),
          gridV: this.gridVoltageRaw,
          gridA: this.pickFirstNum([t.systemCurrent, t.systemR_I, t.systemS_I, t.systemT_I]),
          nowW:  (typeof this.kpi?.now_kw === 'number') ? Math.round(this.kpi.now_kw * 1000) : null,
          heatW,
          pf:    this.pickFirstNum([t.powerFactor, t.pf, t.pfPct]),
          freq:  this.pickFirstNum([t.frequencyHz, t.freq, t.frequency]),
          srcInC:  this.pickFirstNum([t.inlet_temp_c, t.source_in_c, t.ground_in_c, t.brine_in_c, t.srcInC]),
          srcOutC: this.pickFirstNum([t.outlet_temp_c, t.source_out_c, t.ground_out_c, t.brine_out_c, t.srcOutC]),
          loadInC: this.pickFirstNum([t.load_in_temp_c, t.load_in_c, t.chilled_in_c, t.heating_in_c, t.loadInTempC]),
          loadOutC:this.pickFirstNum([t.load_out_temp_c, t.load_out_c, t.chilled_out_c, t.heating_out_c, t.loadOutTempC]),
          flowLpm: this.pickFirstNum([t.load_flow_lpm, t.brine_flow_lpm, t.primary_flow_lpm, t.secondary_flow_lpm, t.flow_lpm, t.flow_rate_lpm]),

          elecKwh: elecKwh ?? null,
          totalKwh: this.kpi?.total_kwh ?? null
        }];
      }

      // ▼ 멀티가 없는 합산 단일행 (태양열)
      const t = this.mets || {};
      const collectedAt = this.latestCollectedAt
        ? new Date(this.latestCollectedAt).toLocaleString('ko-KR')
        : (this.kpi?._updatedAt ? new Date(this.kpi._updatedAt).toLocaleString('ko-KR') : null);

      return [{
        imei: this.imeiUse || '—',
        multiId: null,
        collectedAt,
        status: t.statusList?.length ? '주의' : '정상',
        supplyC: this.pickFirstNum([t.outlet_temp_c, t.hot_temp_c, t.t_out_c]),
        returnC: this.pickFirstNum([t.inlet_temp_c, t.cold_temp_c, t.t_in_c]),
        tankC:   this.pickFirstNum([t.tank_top_temp_c, t.tank_bottom_temp_c, t.tank_temp_c, t.storage_temp_c, t.buffer_tank_temp_c]),
        flowLpm: this.pickFirstNum([t.flow_lpm, t.flow_rate_lpm]),
        totalKwh: this.kpi?.total_kwh ?? null
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
      const hex = this.normMulti(this.selectedMulti)
      if (hex) q.multi = hex
      return { name: 'EnergyDashboard', query: q}
    },
    hasFacility () {
      return !!(this.facilityInfo.moduleCapacity || this.facilityInfo.projectName || this.facilityInfo.contractor || this.facilityInfo.asContact || this.facilityInfo.image)
    },

    overallStateText () {
      if (this.energyField !== '03') return '—';
      const first = Array.isArray(this.driverRows) && this.driverRows.length ? this.driverRows[0] : null;
      if (first && typeof first.state === 'string' && first.state.trim()) return first.state.trim();
      if (typeof this.mets?.state === 'string' && this.mets.state.trim()) return this.mets.state.trim();
      if (typeof this.mets?.state_raw === 'number') return this.mets.state_raw === 0 ? '미작동' : '운전중';
      return '—';
    },
    stateBadgeClass () {
      if (this.energyField !== '03') return 'ok';
      const s = this.overallStateText;
      if (s === '운전중') return 'ok';
      if (s === '미작동') return 'crit';
      return 'warn';
    }
  },

  watch: {
    imeiField (v) {
    if (!this.isAdmin && v && v.trim()) {
      // 즉시(지연 0ms) 조회 스케줄
      this.scheduleSearch(0);
    }
  },
    nameField (v) {
      if (v && this.imeiField) {
        // 이름 기반 검색을 의도한 것으로 보고 IMEI를 비워서 충돌 방지
        this.imeiField = '';
      }
    },
    '$route.query.imei'(v) {
      const next = (typeof v === 'string') ? v.trim() : ''
      if (!next) return
      if (next === this.imeiUse || next === this.imeiField) return
      this.imeiField = next
      this.selectedMulti = ''
      this.onSearch()
    },
  energyField() {
    if (this.energyField !== '01') this.selectedMulti = '';
    if (this.imeiUse || this.imeiField || this.nameField) this.scheduleSearch();
    this.syncQuery();
  },
  typeField() {
    this.syncQuery();
    if (this.imeiUse) this.scheduleSearch();
  }
  },
created () {
  this.syncAdminFromStorage()
  this.enforceUserImei()
},
  methods: {
async onFacilityImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // 1) 프론트 미리보기용 임시 URL (바로 보이게)
  const blobUrl = URL.createObjectURL(file);
  this.previewImage = blobUrl;

  // 2) 오른쪽 카드에도 즉시 반영
  this.facilityInfo.image_url = blobUrl;

  // 3) 서버 업로드 준비
  const imei = this.imeiUse;
  const form = new FormData();
  form.append("rtuImei", imei);
  form.append("file", file);

  // 4) 업로드 요청
  const res = await fetch("/api/facility/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  }).then(r => r.json());

  if (res.ok) {
    // 5) 업로드 완료된 실제 경로 저장
    this.facilityForm.image_url = res.url;
  } else {
    alert("이미지 업로드 실패");
  }
},
resolveImg(path) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
    return `http://127.0.0.1:8080${path}`;
  }

  return `https://kocome.com${path}`;
},
    syncAdminFromStorage () {
    try {
      const flag = (localStorage.getItem('isAdmin') === 'true')
      const email = (localStorage.getItem('email') || '').trim().toLowerCase()
      this.isAdmin = flag || (email === 'admin@company.com')
    } catch { this.isAdmin = false }
  },

enforceUserImei () {
  const userImei = localStorage.getItem('userImei')
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const urlImei = urlParams.get('imei')

  if (!this.isAdmin) {
    if (userImei) {
      // URL에 imei 쿼리 안 보이게 (숨김)
      this.imeiField = userImei
      window.history.replaceState(null, '', '#/analysis/timeseries') // ❌ imei 제거
    } else {
      console.warn('[보안] 사용자 IMEI가 localStorage에 없습니다.')
    }
  } else {
    // 관리자만 URL imei 사용 허용
    if (urlImei) this.imeiField = urlImei
  }
},
      scheduleSearch(delay = 180) {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.onSearch(), delay);
  },
normMulti(v) {
  if (v === undefined || v === null) return '';
  const s = String(v).trim().toLowerCase();

  //  빈값/의미없는 값은 그대로 공백 처리
  if (s === '' || s === 'all' || s === 'null' || s === 'undefined' || s === '-') return '';

  // 0x 프리픽스 허용
  if (/^(0x)?[0-9a-f]{2}$/.test(s)) return s.replace(/^0x/, '');

  // 숫자 형태면 2자리 hex로
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n < 256) return n.toString(16).padStart(2, '0');
  }
  return '';
},
    // (선택) 표시에 쓸 라벨: 내부 값/숫자 모두 깔끔하게
    multiIdDisp(v) {
      const hex = this.normMulti(v);
      return hex ? hex.toUpperCase() : '—';
    },
 onRowClick (r) {
    const hex = this.normMulti(r?.multiId)

    // 멀티 ID가 없으면 전체보기로 리셋
    if (!hex) {
      this.clearMulti()
      return
    }

    // 이미 선택된 행을 다시 클릭하면 전체보기로 리셋
    if (hex === this.selectedMulti) {
      this.clearMulti()
      return
    }

    // 새로운 멀티 설비 선택
    this.onSelectUnit(hex)
  },
onViewAll() {
  this.selectedMulti = ''  // 전체보기 모드
},
    onWxMove (e) {
      if (this.wxPinned) return;
      const box = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - box.left;
      const pts = this.wxStripPoints;
      if (!pts.length) { this.inspectIdx = null; return; }
      let idx = 0, min = Infinity;
      for (let i=0;i<pts.length;i++){
        const d = Math.abs(pts[i].x - x);
        if (d < min){ min = d; idx = i; }
      }
      this.inspectIdx = idx;
    },
    onWxLeave () {
      if (this.wxPinned) return;
      this.inspectIdx = null;
    },
    onWxClick () {
      if (this.inspectIdx==null) return;
      this.wxPinned = !this.wxPinned;
    },

    openDate(refName) {
      const el = this.$refs[refName];
      if (!el) return;
      if (typeof el.showPicker === 'function') {
        try { el.showPicker(); return; } catch {}
      }
      el.focus();
    },

    // 선택: 시간별 하늘상태 추정이 필요하면 여기서 구현
    envCondFromHour(hh){
      const row = (this.envHourly || []).find(r => Number(r.hour)===hh) || {};
      if (row.precip && row.precip > 0) return '강수';
      if (typeof row.cloud === 'number') {
        if (row.cloud >= 75) return '흐림';
        if (row.cloud >= 40) return '구름많음';
        return '맑음';
      }
      return null;
    },

    openSearchModal(matches) {
      const raw = Array.isArray(matches)
        ? matches.map(m => ({ ...m, rtuImei: m.rtuImei || m.imei || m.RTU_IMEI || m.id }))
        : [];

      // 중복 제거: IMEI 기준(없으면 name+address 보조)
      const seen = new Set();
      const uniq = [];
      for (const m of raw) {
        const k = (m.rtuImei && String(m.rtuImei).toLowerCase().trim())
               || ((m.name||'').trim() + '|' + (m.address||'').trim()).toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(m);
      }

      this.searchModal.matches = uniq;
      this.searchModal.keyword = '';
      this.searchModal.selectedIdx = uniq.length ? 0 : -1;
      this.searchModal.visible = true;
      this.searchModal.loading = false;

      this.$nextTick(() => {
        // 클래스명 오타 수정
        document.querySelector('.ats-select-modal__panel')?.focus();
      });
    },
    selectSearchRow(idx) {
      this.searchModal.selectedIdx = idx;
    },

    async confirmSearchSelection(idx) {
      if (typeof idx === 'number') this.searchModal.selectedIdx = idx;

      const list = this.filteredMatches;
      const i = this.searchModal.selectedIdx;
      if (!list.length || i < 0 || i >= list.length) return;

      const item = list[i];
      const imei = item?.rtuImei || item?.imei;
      if (!imei) return;

      // 모달 닫기 + 이름 입력 초기화
      this.closeSearchModal();
      this.imeiField = imei;
      this.nameField = '';  //  루프 방지
      this.selectedMulti = ''; //  IMEI 변경 → 멀티 초기화(합산 모드)

      //  에너지 자동 판별
      const trials = [
        { ns: 'electric',   energy: '01' },
        { ns: 'thermal',    energy: '02' },
        { ns: 'geothermal', energy: '03' },
        { ns: 'electric',   energy: '04' },
        { ns: 'electric',   energy: '06' },
        { ns: 'electric',   energy: '07' },
      ];

      let detected = null;
      for (const t of trials) {
        const r = await fetch(
          `/api/energy/${t.ns}/instant?imei=${encodeURIComponent(imei)}&energy=${t.energy}`,
          this.fopts('probe')
        );
        if (r.ok) { detected = t.energy; break; }
      }

      if (detected) this.energyField = detected;

      await this.onSearch();
    },

    onSearchModalKeydown(e) {
      const n = this.filteredMatches.length;
      if (!n) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(n - 1, (this.searchModal.selectedIdx ?? -1) + 1);
        this.searchModal.selectedIdx = next;
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(0, (this.searchModal.selectedIdx ?? 0) - 1);
        this.searchModal.selectedIdx = prev;
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmSearchSelection();
      }
    },

    pickImeiFromProbe(json) {
      const cands = [
        json?.rtuImei, json?.imei,
        json?.device?.rtuImei, json?.device?.imei,
        json?.deviceInfo?.rtuImei, json?.item?.rtuImei,
        json?.latest?.rtuImei, json?.latest?.imei,
      ];
      for (const v of cands) {
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return null;
    },

    closeSearchModal() {
      this.searchModal.visible = false
      this.searchModal.matches = []
    },

    fopts (key) {
      return { signal: this.newController(key), credentials: 'include' }
    },

    syncAdminFromStorage () {
      try {
        const flag = (localStorage.getItem('isAdmin') === 'true');
        const email = (localStorage.getItem('email') || '').trim().toLowerCase();
        this.isAdmin = flag || (email === 'admin@company.com');
      } catch { this.isAdmin = false; }
    },

    async initImeiFlow () {
      if (this._inited) return
      this._inited = true

      const qImei = (this.$route?.query?.imei || '').toString().trim()
      if (qImei) {
        this.imeiField = qImei
        this.selectedMulti = ''
        this.onSearch()
        return
      }

      if (this.isAdmin) {
        this.imeiField = ''
        this.imeiUse = ''
        return
      }

      try {
        this.loading = true
        const { data } = await api.get('/user/imeis')
        const def = data?.defaultImei || (Array.isArray(data?.items) && data.items[0]?.rtuImei) || ''
        if (def) {
          this.imeiField = def
          this.selectedMulti = ''
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
        statusList: [], faultList: [],
        state: null, state_raw: null,
        isOperating: null
      };
    },

    clearForLoading () {
      this.kpi = this.emptyKpi();
      this.mets = this.emptyMets();
      this.driverUnits = [];
      this.latestCollectedAt = null;
      this.hoverIdx = null;
      this.hourly = [];

      this.envHourly = [];

      this.envTempC = null;
      this.envApparentC = null;
      this.envCond = null;
      this.envPopPct = null;
      this.envHumidityPct = null;
      this.envWindMs = null;
      this.envPressureHpa = null;
      this.envCloudPct = null;
      this.envPrecipMm = null;
      this.envIrradWm2 = null;

      this.maintenance = { lastInspection: null, asNotes: null };
      this.facilityInfo = this.emptyFacilityInfo();
    },

    resetAll () {
      this.imeiField = DEFAULT_IMEI;
      this.nameField = '';
      this.energyField = '01';
      this.typeField = '';
      this.selectedMulti = '';
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

    // === 조회 ===
    async onSearch () {
      if (this.searching) return;
      this.searching = true;
      this.loading = true;
      try {
        const imeiInput = (this.imeiField || '').trim();
        const nameInput = (this.nameField || '').trim();

        if (!imeiInput && !nameInput) { this.resetAll(); return; }

        // 1) 이름 검색 우선
        if (nameInput) {
          const resolved = await this.probeResolveByName(nameInput);
          if (resolved?.action === 'modal') {
            this.openSearchModal(resolved.matches || []);
            return;
          }
          if (!resolved?.imei) {
            alert('이름으로 장비를 찾을 수 없습니다.');
            return;
          }

          if (resolved.energy && resolved.energy !== this.energyField) {
            this.energyField = resolved.energy;
          }

          this.abortAll();
          this.currentReqId += 1;
          this.imeiUse = resolved.imei;
          this.imeiField = resolved.imei;
          this.selectedMulti = '';

          await this.syncQuery(true);
          this.clearForLoading();
          await this.loadAll();
          return;
        }

        // 2) IMEI 직접 조회
        if (imeiInput) {
          const probeUrl =
            `/api/energy/${this.apiNS}/instant?imei=${encodeURIComponent(imeiInput)}&energy=${this.energyField || '01'}`;
          const probe = await fetch(probeUrl, this.fopts('probe'));

          if (!probe.ok) {
            if (probe.status === 404) {
              let j = {}; try { j = JSON.parse(await probe.text()); } catch {}
              alert(j?.error || '해당 IMEI 장비를 찾을 수 없습니다.');
              return;
            }
            alert(`요청 실패 (${probe.status})`);
            return;
          }

          this.abortAll();
          this.currentReqId += 1;
          this.imeiUse = imeiInput;
          this.imeiField = imeiInput;
          this.selectedMulti = '';
          await this.syncQuery(true);
          this.clearForLoading();
          await this.loadAll();
          return;
        }
      } finally {
        this.loading = false;
        this.searching = false;
      }
    },

    async probeResolveByName(name) {
      const combos = [
        { ns: 'electric',   energy: '01' },
        { ns: 'thermal',    energy: '02' },
        { ns: 'geothermal', energy: '03' },
        { ns: 'electric',   energy: '04' },
        { ns: 'electric',   energy: '06' },
        { ns: 'electric',   energy: '07' },
      ];

      let modalMatches = [];
      for (const c of combos) {
        const url = `/api/energy/${c.ns}/instant?name=${encodeURIComponent(name)}&energy=${c.energy}`;
        const r = await fetch(url, this.fopts('probe'));

        if (r.ok) {
          let j = {};
          try { j = await r.json(); } catch {}
          const imei = this.pickImeiFromProbe(j);
          if (imei) return { imei, energy: c.energy, ns: c.ns };
          continue;
        }

        if (r.status === 422) {
          let j = {};
          try { j = JSON.parse(await r.text()); } catch {}
          const cand = j?.matches ?? j?.data?.matches ?? j?.result?.matches ?? j?.items ?? [];
          if (Array.isArray(cand) && cand.length) {
            const norm = cand.map(m => ({ ...m, rtuImei: m.rtuImei || m.imei || m.RTU_IMEI || m.id }));
            modalMatches = modalMatches.concat(norm);
          }
          continue;
        }
      }

      if (modalMatches.length) return { action: 'modal', matches: modalMatches };
      return null;
    },

async loadAll () {
  if (!this.imeiUse) return;

  this.abortAll();
  const myReq = ++this.currentReqId;

  //
  // 🔵 1) 빠른 API 먼저 (KPI + Hourly)
  //
  this.loadingHourly = true;
  this.loadingKpis = true;

  try {
    await Promise.all([
      this.loadHourly(myReq),
      this.loadKpis(myReq),
    ]);
  } catch (e) {
    console.warn('fast APIs failed', e);
  } finally {
    this.loadingHourly = false;
    this.loadingKpis = false;
  }

  //
  // 🔵 2) 중간급 API (latest, driver)
  //
  this.loadingLatest = true;
  this.loadLatest(myReq)
    .catch(() => {})
    .finally(() => { this.loadingLatest = false });

  this.loadingDriver = true;
  this.loadDriverUnits(myReq)
    .catch(() => {})
    .finally(() => { this.loadingDriver = false });

  //
  // 🔵 3) 느린 API (facility, maintenance)
  //
  setTimeout(() => {
    this.loadingFacility = true;
    this.loadFacility(myReq)
      .catch(() => {})
      .finally(() => { this.loadingFacility = false });

    this.loadingMaint = true;
    this.loadMaintenance(myReq)
      .catch(() => {})
      .finally(() => { this.loadingMaint = false });
  }, 200);

  //
  // 🔵 4) 가장 느린 Weather
  //
  setTimeout(() => {
    this.loadingWeather = true;

    this.loadWeather(myReq)
      .catch(() => {})
      .finally(() => { this.loadingWeather = false });
  }, 500);
},

// KPI
async loadKpis (reqId) {
  // 🔵 KPI 로딩 시작 → 스켈레톤 ON
  this.loadingKpis = true;

  try {
    const params = new URLSearchParams({
      rtuImei: this.imeiUse,
      imei: this.imeiUse,
      energy: this.energyField || '01'
    });

    if (this.typeField && !this.isHeat) params.set('type', this.typeField);

    // 멀티코드를 2자리 hex로 정규화
    const hexMulti = this.normMulti(this.selectedMulti);
    if (hexMulti) params.set('multi', hexMulti);

    const url = `/api/energy/${this.apiNS}?${params.toString()}`;
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

  } catch (err) {
    console.warn('loadKpis error:', err);

  } finally {
    // 🔵 KPI 로딩 종료 → 스켈레톤 OFF → 실제 KPI 표시
    this.loadingKpis = false;
  }
},
    // 최신 프레임
async loadLatest (reqId) {
  this.loadingLatest = true;
  try {
    const url =
      `/api/energy/${this.apiNS}/debug?rtuImei=${encodeURIComponent(this.imeiUse)}&imei=${encodeURIComponent(this.imeiUse)}&limit=1`;

    const r = await fetch(url, this.fopts('latest'));
    if (!r.ok) return;
    if (reqId && reqId !== this.currentReqId) return;

    const arr = await r.json();
    const row = Array.isArray(arr) ? arr[0] : null;
    const p = row?.parsed?.metrics || {};

    const state = typeof p.state === 'string' ? p.state : null;
    const state_raw = typeof p.stateRaw === 'number' ? p.stateRaw : null;

    this.mets = {
      ...this.emptyMets(),
      ...p,
      statusList: p.statusList || [],
      faultList: p.faultList || [],
      statusFlags: p.statusFlags ?? p.faultFlags ?? 0,
      isOperating: typeof p.isOperating === 'boolean' ? p.isOperating : null,
      state,
      state_raw
    };
    this.latestCollectedAt =
      row?.time || row?.createdAt || row?.ts || null;

  } catch (e) {
    console.warn('loadLatest error:', e);
  } finally {
    this.loadingLatest = false;
  }
},

async loadHourly(reqId) {
  if (!this.imeiUse) return;

  this.loadingHourly = true;
  try {
    const params = new URLSearchParams({
      imei: this.imeiUse,
      rtuImei: this.imeiUse,
      date: new Date().toISOString().slice(0,10),
    });
    if (this.energyField) params.set('energy', this.energyField);
    if (this.typeField && this.energyField === '01') params.set('type', this.typeField);

    const hexMulti = this.normMulti(this.selectedMulti);
    if (hexMulti) params.set('multi', hexMulti);

    const url = `/api/energy/${this.apiNS}/hourly?${params.toString()}`;
    const r = await fetch(url, this.fopts('hourly'));
    if (!r.ok) return;
    if (reqId && reqId !== this.currentReqId) return;

    const j = await r.json();
    const rows = Array.isArray(j.hours) ? j.hours : [];

    this.hourly = rows.map(h => ({
      hour: String(h.hour).padStart(2,'0'),
      kwh: (h.kwh == null ? null : Number(h.kwh))
    }));

    const sum = this.hourly.reduce(
      (s, x) => (Number.isFinite(x.kwh) ? s + x.kwh : s), 0
    );
    this.chartTodaySum = Number.isFinite(sum)
      ? Math.round(sum * 1000) / 1000
      : null;

  } catch (e) {
    console.warn('loadHourly error:', e);
  } finally {
    this.loadingHourly = false;
  }
},


async loadDriverUnits (reqId) {
  this.loadingDriver = true;
  try {
    const params = new URLSearchParams({
      imei: this.imeiUse,
      rtuImei: this.imeiUse,
      energy: this.energyField || '01'
    });
    if (this.typeField && !this.isHeat) params.set('type', this.typeField);

    const url = `/api/energy/${this.apiNS}/instant/multi?${params.toString()}`;
    const r = await fetch(url, this.fopts('driver'));

    if (!r.ok) { 
      this.driverUnits = []; 
      return; 
    }
    if (reqId && reqId !== this.currentReqId) return;

    const j = await r.json();
    const units = Array.isArray(j?.units) ? j.units : [];
    this.driverUnits = units;

    if (units.length)
      this.latestCollectedAt = units[0]?.ts || this.latestCollectedAt;

  } catch (e) {
    console.warn('loadDriverUnits error:', e);
  } finally {
    this.loadingDriver = false;
  }
},


    /* 날씨(외기) – 키 매핑 수정 + 확장 지표 */
async loadWeather(reqId) {
  this.loadingWeather = true;
  try {
    const url =
      `/api/weather/openmeteo/by-imei?imei=${encodeURIComponent(this.imeiUse)}`;

    const r = await fetch(url, this.fopts('weather'));
    if (!r.ok) return;
    if (reqId && reqId !== this.currentReqId) return;

    const j = await r.json();
    const hourly = Array.isArray(j?.hourly) ? j.hourly : [];

    const pickNum = (obj, keys) => {
      for (const k of keys) {
        const n = Number(obj?.[k]);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };

    const rows = hourly.map(h => {
      const hour = (h.hour || '').slice(0, 2);
      return {
        hour,
        temp: pickNum(h, ['TA','T1H','TMP','T3H','temp','temperature']),
        app:  pickNum(h, ['TAF','apparent','apparent_temperature']),
        hum:  pickNum(h, ['RH','REH','humidity','relative_humidity','relative_humidity_2m']),
        wind: pickNum(h, ['WSPD','WSD','wind','wind_ms','windspeed','windspeed_10m']),
        press:pickNum(h, ['PRESS','PRS','pressure','pressure_msl']),
        cloud:pickNum(h, ['CLOUD','cloud','clouds','cloud_cover']),
        pop:  pickNum(h, ['POP','prob','precipitation_probability']),
        precip: pickNum(h, ['PRECIP','RN1','precip','precipitation']),
        rad:  pickNum(h, ['RAD','GHI','SWRAD','shortwave','shortwave_radiation','global_radiation'])
      };
    });

    this.envHourly = rows;

    // 현재 시간데이터 추출
    const nowH = new Date().getHours();
    const cur = rows.find(r => Number(r.hour) === nowH)
      || rows[rows.length - 1]
      || rows[0];

    if (cur) {
      this.envTempC      = cur.temp;
      this.envApparentC  = cur.app;
      this.envHumidityPct= cur.hum;
      this.envWindMs     = cur.wind;
      this.envPressureHpa= cur.press;
      this.envCloudPct   = cur.cloud;
      this.envPrecipMm   = cur.precip;
      this.envPopPct     = cur.pop;
      this.envIrradWm2   = cur.rad ?? null;

      this.envCond = this.condFrom({
        PTY: pickNum(hourly[nowH]||{}, ['PTY','pty']),
        SKY: pickNum(hourly[nowH]||{}, ['SKY','sky','SKY_CODE']),
        weather: null,
        condition: null
      });
    }

  } catch (e) {
    console.warn('loadWeather() failed', e);
    this.envHourly = [];
    this.envTempC = this.envApparentC = this.envCond =
    this.envPopPct = this.envHumidityPct =
    this.envWindMs = this.envPressureHpa =
    this.envCloudPct = this.envPrecipMm =
    this.envIrradWm2 = null;

  } finally {
    this.loadingWeather = false;
  }
},


async loadFacility (reqId) {
  this.loadingFacility = true;
  try {
    if (!this.imeiUse) return;
    const url = `/api/facility?rtuImei=${encodeURIComponent(this.imeiUse)}`;

    const r = await fetch(url, this.fopts('facility'));
    if (!r.ok) {
      this.facilityInfo = this.emptyFacilityInfo();
      return;
    }
    if (reqId && reqId !== this.currentReqId) return;

    const j = await r.json();
    const it = j?.item || null;

    if (!it) {
      this.facilityInfo = this.emptyFacilityInfo();
      return;
    }

    this.facilityInfo = {
      moduleCapacity: it.module_capacity || null,
      installDate: it.install_date
        ? this.toDateStr(it.install_date)
        : null,
      monitorStart: it.monitor_start
        ? this.toDateStr(it.monitor_start)
        : null,
      projectName: it.project_name || null,
      contractor: it.contractor || null,
      asContact: it.as_contact || null,
      image: it.image_url || null,
    };

  } catch (e) {
    console.warn('loadFacility error:', e);
  } finally {
    this.loadingFacility = false;
  }
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

openFacilityEditor(isEdit) {
  this.editingFacility = !!isEdit;

  // 🔥 현재 조회 중 IMEI를 그대로 사용해야 한다!
  const imei = this.imeiUse;

  this.facilityForm = {
    rtuimei: imei,  // 서버는 snake_case 쓰면 rtu_imei 일 수도 있음 확인 필요
    module_capacity: this.facilityInfo.moduleCapacity || '',
    install_date: this.facilityInfo.installDate || '',
    monitor_start: this.facilityInfo.monitorStart || '',
    project_name: this.facilityInfo.projectName || '',
    contractor: this.facilityInfo.contractor || '',
    as_contact: this.facilityInfo.asContact || '',
    image_url: this.facilityInfo.image || ''   // 🔥 딱 이걸로 고쳐야 함!
  };

  this.showFacilityEditor = true;

  this.$nextTick(() => {
    const el = document.querySelector('.ats-modal__panel input:not([disabled])');
    el && el.focus();
  });
},
closeFacilityEditor () {
  if (this.savingFacility) return;

  // 모달 닫기
  this.showFacilityEditor = false;

  // 🔥 1) 프리뷰 이미지 초기화
  this.previewImage = null;

  // 🔥 2) 파일 input 초기화
  this.$nextTick(() => {
    const fileInput = this.$el.querySelector(".facility-image-input");
    if (fileInput) fileInput.value = "";
  });

  // 🔥 3) 수정모달이면 기존 DB 데이터 다시 불러오기
  if (this.editingFacility) {
    this.loadFacility(this.currentReqId);
  } else {
    // 등록 모달일 때는 폼 값 초기화
    this.facilityForm = {
      module_capacity: '',
      install_date: '',
      monitor_start: '',
      project_name: '',
      contractor: '',
      as_contact: '',
      image_url: ''
    };
  }
},
async saveFacility() {
  if (!this.imeiUse) return;

  try {
    this.savingFacility = true;

    const url = `/api/facility/${encodeURIComponent(this.imeiUse)}`;

    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(this.facilityForm),
    });

    if (!r.ok) {
      const msg = (await r.json().catch(() => ({ message: "" }))).message || "저장 실패";
      alert(msg);
      return;
    }

    // 저장 성공 → 모달 닫기
    this.showFacilityEditor = false;

    // 최신 데이터 다시 로드
    await this.loadFacility(this.currentReqId);

    alert("저장되었습니다.");
  } catch (e) {
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    this.savingFacility = false;
  }
},

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
        this.maintenance.lastInspection = body.lastInspection || null;
        this.maintModal.open = false;
        this.maintenance.asNotes = body.asNotes || null;
        alert('저장되었습니다.');
      } catch (e) {
        alert('유지보수 저장 실패: ' + (e?.message || e));
      } finally {
        this.maintModal.saving = false;
      }
    },

_syncQueryTimer: null,
_lastQueryKey: '',

async syncQuery() {
  try {
    if (!this.$router) return;
    const cur = this.$route?.query || {};

    // multi를 항상 2자리 HEX로 정규화
    const hexMulti = this.normMulti(this.selectedMulti);

    const isAdmin = this.isAdmin;

    const next = {
      ...cur,
      ...(isAdmin ? (this.imeiUse ? { imei: this.imeiUse } : {}) : {}),
      ...(this.energyField ? { energy: this.energyField } : {}),
      ...(this.typeField ? { type: this.typeField } : {}),
      ...(hexMulti ? { multi: hexMulti } : {})
    };

    if (!isAdmin && 'imei' in next) delete next.imei;

    // 문자열 비교용 key
    const nextKey = JSON.stringify(next);

    // 🔥 1) 최근 라우팅과 완전히 동일하면 무시 (성능 핵심)
    if (this._lastQueryKey === nextKey) return;

    // 🔥 2) debounce 적용
    if (this._syncQueryTimer) clearTimeout(this._syncQueryTimer);

    this._syncQueryTimer = setTimeout(async () => {
      // 최종 라우트 상태 캐싱
      this._lastQueryKey = nextKey;

      // cur와 next가 실제로 동일하면 router.replace 생략
      const same = JSON.stringify(cur) === nextKey;
      if (same) return;

      try {
        await this.$router.replace({ query: next });
      } catch (e) {
        console.warn('router.replace failed', e);
      }
    }, 120); // <-- 80~150ms 추천
  } catch (e) {
    console.warn('syncQuery failed', e);
  }
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
        case 'now':
          return this.fmt(this.kpi.now_kw, 2);
    case 'today': {
      const v = this.kpi.today_kwh;
      return this.formatKwh1(v);
    }
        case 'co2':
          return this.fmt(this.kpi.co2_ton, 2);
        case 'avg':
          return this.fmt(this.kpi.last_month_avg_kw, 2);
        case 'total':
          return this.fmt(this.kpi.total_kwh, 2);
        case 'status':
          return this.mets.statusList?.length ? '주의' : '정상';
        default:
          return '—';
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

async clearMulti () {
  // ✅ 이미 전체보기 상태면 그래프+KPI만 새로고침
  if (!this.selectedMulti) {
    await Promise.all([
      this.loadHourly(this.currentReqId),
      this.loadKpis(this.currentReqId)
    ])
    return
  }

  // ✅ 전체보기로 복귀
  this.selectedMulti = ''        // ⚡ EnergyDashboard에도 전달됨
  await this.syncQuery(true)

  // 내부 상태 리셋
  this.hoverIdx = null
  this.hourly = []
  this.chartTodaySum = null

  // ✅ 전체보기로 돌아올 때 KPI + 그래프 재조회
  await Promise.all([
    this.loadHourly(this.currentReqId),
    this.loadKpis(this.currentReqId)
  ])
},
async onSelectUnit (hex) {
  const next = this.normMulti(hex)
  if (!next) return this.clearMulti()

  // ✅ 동일한 멀티를 다시 클릭하면 → 강제 새로고침
  if (this.selectedMulti === next) {
    await Promise.all([
      this.loadHourly(this.currentReqId),
      this.loadKpis(this.currentReqId)
    ])
    return
  }

  // ✅ 새로운 멀티 선택
  this.selectedMulti = next      // ⚡ EnergyDashboard에 전달됨 (props 반응)
  await this.syncQuery(true)

  // 내부 상태 리셋
  this.hoverIdx = null
  this.hourly = []
  this.chartTodaySum = null

  // ✅ 현재 탭의 시간대별 그래프 + KPI 재조회
  await Promise.all([
    this.loadHourly(this.currentReqId),
    this.loadKpis(this.currentReqId)
  ])
},
  },
mounted () {
  this.syncAdminFromStorage();
  this._storageHandler = (e) => {
    if (e.key === 'isAdmin' || e.key === 'email') this.syncAdminFromStorage();
  };
  window.addEventListener('storage', this._storageHandler);

  const q = this.$route?.query || {};
  const initEnergy = (typeof q.energy === 'string') ? q.energy : '01';
  const initType   = (typeof q.type   === 'string') ? q.type   : '';
  const initMulti  = (typeof q.multi  === 'string') ? q.multi  : '';

  this.energyField   = initEnergy;
  this.typeField     = initType;
  this.selectedMulti = this.normMulti(initMulti) || '';

  const qImei = (typeof q.imei === 'string') ? q.imei.trim() : '';
  if (qImei) {
    // imeiField만 세팅하면 watch로는 안 터질 수 있으므로 직접 조회를 건다.
    this.imeiField = qImei;
    this.selectedMulti = '';
    this.syncQuery(true);
   // 즉시 조회
   this.$nextTick(() => this.onSearch());
  } else {
    this.initImeiFlow();
  }
},
  beforeDestroy () {
    if (this._storageHandler) window.removeEventListener('storage', this._storageHandler);
  }
}
</script>
