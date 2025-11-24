<template>
  <div class="ts-page">
    <section class="toolbar" v-if="isAdmin">
      <div class="tool-left">
            <template v-if="isAdmin">
        <label class="lbl">IMEI</label>
        <input
          v-model.trim="imeiField"
          @keyup.enter="onSearch"
          class="input"
          type="text"
          placeholder="예) 01-01-01-01-01-01-01-01"
            :readonly="!isAdmin"
        />
        </template>

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

<template v-if="imeiUse">

  <template v-if="loadingHourly">
    <div class="chart-loading-skel">
      <div class="chart-skel-bar" v-for="n in 24" :key="'hb'+n"></div>
    </div>
  </template>

  <template v-else>
    <div class="chart-placeholder" v-if="bars.length">

      <svg
      ref="svg"
      :viewBox="`0 0 ${vb.w} ${vb.h}`"
      preserveAspectRatio="none" 
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

        <g class="grid">
          <line v-for="(t, i) in yTicks" :key="'gy'+i"
                :x1="pad.l" :x2="vb.w-pad.r"
                :y1="t.y" :y2="t.y" />
        </g>

        <g class="axis axis-left">
          <line :x1="pad.l" :x2="pad.l" :y1="pad.t" :y2="vb.h-pad.b"/>
          <g v-for="(t,i) in yTicks" :key="'yl'+i">
            <text :x="pad.l-6" :y="t.y+4" text-anchor="end">{{ t.label }}</text>
          </g>
          <text :x="pad.l-6" :y="pad.t-6" text-anchor="end" class="axis-title">
            {{ unitEnergy }}
          </text>
        </g>

        <g class="axis axis-bottom">
          <line :x1="pad.l" :x2="vb.w-pad.r" :y1="vb.h-pad.b" :y2="vb.h-pad.b"/>
          <g v-for="(x,i) in xTicks" :key="'xt'+i">
            <line :x1="x.x" :x2="x.x"
                  :y1="vb.h-pad.b" :y2="vb.h-pad.b+5"/>
            <text :x="x.x" :y="vb.h-pad.b+18"
                  text-anchor="middle">{{ x.label }}</text>
          </g>
        </g>

        <g fill="url(#barGrad)" filter="url(#dropShadow)">
          <rect v-for="(b, i) in bars" :key="'b'+i"
                class="bar"
                :x="b.x" :y="b.y"
                :width="b.w" :height="b.h"
                rx="4" />
        </g>

        <g class="bar-labels" v-if="!isMobile">
          <text
            v-for="(b, i) in bars"
            :key="'lbl'+i"
            class="bar-label"
            :x="b.xCenter"
            :y="Math.max(8, b.y-6)"
            text-anchor="middle"
          >
            {{ (b.kw > 0) ? formatBigNumber(b.kw) : '' }}
          </text>
        </g>

        <path v-if="bars.length" :d="linePath" class="line" />
        <g class="line-dots" v-if="bars.length">
          <circle v-for="(b,i) in bars" :key="'dot'+i"
                  class="line-dot"
                  :cx="b.xCenter" :cy="b.y" r="3" />
        </g>

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
              {{ hoverKw === null ? '—' : formatBigNumber(hoverKw) }}
              {{ unitEnergy }}
            </text>
          </g>
        </g>

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

</div>
  </template>
</template>

<template v-else>
  <div class="chart-placeholder" style="height:360px;"></div>
</template>

        <template v-else>
          <div class="chart-placeholder" style="height:360px;"></div>
        </template>
      </article>

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

  <template v-if="loadingDriver">
    <tr v-for="n in 5" :key="'drvsk'+n">
      <td colspan="999" class="tbl-skel"></td>
    </tr>
  </template>

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

<article class="card col-3 status-card">
        <div class="status-header">
          <h3>장비 상태</h3>
        </div>

        <div v-if="isSearched && mets" class="status-body">
          <div class="status-main">
            <div class="status-ring-wrapper" :class="statusClass">
              <svg class="status-ring-svg" viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="45"></circle>
                <circle class="ring-progress" cx="50" cy="50" r="45"></circle>
              </svg>
              <div class="status-ring-content">
                <i class="mdi" :class="statusIcon"></i>
                <span class="status-text">{{ overallStatusText }}</span>
              </div>
            </div>
            <div class="status-main-desc">
              <span class="desc-label">현재 상태</span>
              <span class="desc-value">{{ overallStatusText }} 중입니다</span>
            </div>
          </div>

          <div class="status-detail-list" v-if="inverterStatusList.length">
          <div class="list-header">
          <i class="mdi mdi-bell-ring-outline"></i> 상세 알림
          </div>
          <ul>
          <li v-for="(s, idx) in inverterStatusList" :key="idx"><i class="mdi mdi-alert-outline warning-icon"></i>
          <span class="message-text">{{ s }}</span>
          </li>
          </ul>
          </div>
          
          <div v-else class="status-ok-message">
             <i class="mdi mdi-check-circle-outline"></i>
             <span>모든 장비가 정상 작동 중입니다.</span>
          </div>
        </div>
        
        <div v-else class="status-empty">
           데이터를 불러오는 중...
        </div>
      </article>

    </section>
    <section class="row bottom-info-row">
      <article class="card col-4">
        <div class="card-hd"><h3>추가 정보</h3></div>
        <ul class="kv">
          <li><span>총 {{ labelEnergy }}</span><strong>{{ fmt(kpi.total_kwh, 2) }} {{ unitEnergy }}</strong></li>
          <li><span>탄소 절감</span><strong>{{ fmt(kpi.co2_ton, 2) }} 톤</strong></li>
        </ul>
      </article>

      <article class="card col-4 weather-card">
   <template v-if="loadingWeather">
    <div class="weather-skel">
      <div class="wx-temp-skel"></div>
      <div class="wx-pills-skel"></div>
      <div class="wx-strip-skel"></div>
    </div>
  </template>

  <template v-else>
        <div class="card-hd">
          <h3>환경 데이터</h3>
          <small class="muted" v-if="envHourly && envHourly.length">
            기준 {{ new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}) }}
          </small>
        </div>

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

        <div class="wx-strip thin-scroll" v-if="envHourly && envHourly.length">
          <svg viewBox="0 0 720 140" class="wx-svg" aria-hidden="true">
            <g class="wx-grid">
              <line x1="0" x2="720" y1="100" y2="100" />
            </g>

            <g>
              <rect v-for="(h,i) in wxStripPoints" :key="'b'+i"
                    :x="h.x - wxBarW/2" :y="100 - h.popH" :width="wxBarW" :height="h.popH"
                    class="wx-bar"/>
            </g>

            <path :d="wxTempPath" class="wx-line"/>
            <g>
              <circle v-for="(h,i) in wxStripPoints" :key="'d'+i" :cx="h.x" :cy="h.tempY" r="3" class="wx-dot"/>
            </g>

            <g class="wx-wind">
              <path v-for="(h,i) in wxStripPoints" :key="'w'+i"
                    :d="`M${h.x-4},${110} L${h.x+4},${110} L${h.x},${110 - h.windH} Z`"/>
            </g>

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

          <div class="wx-hit"
               @mousemove="onWxMove"
               @mouseleave="onWxLeave"
               @click="onWxClick"></div>
        </div>

        <div v-else class="wx-empty">
          <span class="pill muted">날씨 데이터 수집 중</span>
        </div>
  </template>
      </article>

      <article class="card col-4">
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
    </section>
    
<section class="sub-dashboard">
  <EnergyDashboard
    class="sub-dashboard-inner"
    :imei="imeiUse"
    :is-admin="isAdmin"
    :multi="selectedMulti"
  />
</section>

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
  <img
    v-if="previewImage || facilityForm.image_url"
    :src="previewImage || resolveImg(facilityForm.image_url)"
    class="img-preview"
  />

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

    <div
      v-if="searchModal.visible"
      class="ats-select-modal"
      role="dialog"
      aria-modal="true"
      @keydown.stop.prevent="onSearchModalKeydown"
    >
      <div class="ats-select-modal__backdrop" @click="closeSearchModal"></div>

      <div class="ats-select-modal__panel" tabindex="-1">
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

    <div
      v-if="maintModal.open"
      class="ats-modal"
      role="dialog"
      aria-modal="true"
      @keydown.esc="closeMaintModal"
    >
      <div class="ats-modal__backdrop" @click="closeMaintModal"></div>

      <div class="ats-modal__panel" tabindex="-1">
        <header class="ats-modal__hd">
          <h4 class="ats-modal__title">유지보수 정보</h4>
          <button
            type="button"
            class="ats-modal__close"
            aria-label="닫기"
            @click="closeMaintModal"
          >✕</button>
        </header>

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
    imei: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false }
  },
  components: { EnergyDashboard },
  data () {
    return {
    isMobile: false,
    mets: null,
    isSearched: false,
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
      lastRouterErr: '',
      imeiUse: '',
      envHourly: [],
      isAdmin: false,
      searching: false,
      _inited: false,
      driverUnits: [],

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
      controllers: { probe:null, kpis:null, latest:null, hourly:null, driver:null, weather:null, facility:null, maintenance:null },
      currentReqId: 0,
      vb: { w: 1000, h: 360 },
      pad: { t: 16, r: 16, b: 28, l: 18 },
      hoverIdx: null,
      tt: { w: 180, h: 50 },

      envTempC: null,
      envApparentC: null,
      envCond: null,
      envPopPct: null,
      envHumidityPct: null,
      envWindMs: null,
      envPressureHpa: null,
      envCloudPct: null,
      envPrecipMm: null,
      envIrradWm2: null,
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
      selectedMulti: '',
    }
  },
  computed: {
  isOffline() {
    if (!this.latestCollectedAt) return true;
    
    const last = new Date(this.latestCollectedAt).getTime();
    const now = Date.now();
    const diffMin = (now - last) / (1000 * 60);
    
    return diffMin >= 90; // 90분 기준 (필요시 조정 가능)
  },
inverterStatusList() {
    if (this.isOffline) {
        return ['최근 90분간 데이터 수신이 없습니다.'];
    }
    // 기존 로직
    const list = this.mets?.statusList;
    return (Array.isArray(list) && list.length > 0) ? list : [];
  },
    inspectData () {
      const i = this.inspectIdx;
      const arr = this.wxStripPoints || [];
      if (i==null || !arr.length) return null;
      return arr[i];
    },
    wxStripPoints () {
      const rows = Array.isArray(this.envHourly) ? this.envHourly : [];
      if (!rows.length) return [];

      const hours = Array.from({length: 18}, (_,i) => 6 + i);
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

      const tMin = Math.min(...tempVals, 0);
      const tMax = Math.max(...tempVals, 1);
      const wMax = Math.max(...windVals, 1);
      const pMax = Math.max(...pops, 1);

      pts.forEach(p => {
        const ratio = (p.temp==null) ? 0 : (p.temp - tMin) / Math.max(1e-6, (tMax - tMin));
        p.tempY = 80 - ratio * 60 + 20;
        p.popH = (p.pop==null) ? 0 : (p.pop / pMax) * 70;
        p.windH = (p.wind==null) ? 0 : (p.wind / wMax) * 24 + 4;
      });

      return pts;
    },
    wxTempPath () {
      const pts = this.wxStripPoints.filter(p => p.temp!=null);
      if (!pts.length) return '';
      return 'M' + pts.map(p => `${p.x},${p.tempY}`).join(' L');
    },
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

    overallStatusText() {
    const sList = Array.isArray(this.mets?.statusList) ? this.mets.statusList : [];
    const fList = Array.isArray(this.mets?.faultList) ? this.mets.faultList : [];

    if (fList.length) return '고장';

    if (this.isOffline) return '오프라인';

    if (sList.length) return '주의';
    if (Array.isArray(this.driverRows) && this.driverRows.some(r => r.status && r.status !== '정상')) return '주의';

    return '정상';
  },
  statusBadgeClass() {
    const text = this.overallStatusText;
    if (text === '정상') return 'ok';
    if (text === '주의') return 'warn';
    if (text === '고장') return 'crit';
    if (text === '오프라인') return 'offline'; // CSS에 .offline 추가 필요
    return '';
  },
    statusIcon() {
    const text = this.overallStatusText;
    if (text === '정상') return 'mdi-check-circle-outline';
    if (text === '주의') return 'mdi-alert-circle-outline';
    if (text === '고장') return 'mdi-alert-decagram-outline';
    if (text === '오프라인') return 'mdi-lan-disconnect';
    return 'mdi-help-circle-outline';
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
    barW () { return Math.max(10, this.stepW * 0.6); },

xTicks () {
    const out = []; 
    const n = this.series.length;
    if (!n) return out;
    
    let every = 1;
    if (this.isMobile) {
       every = 3;
    } else {
       every = n > 12 ? 2 : 1;
    }

    for (let i = 0; i < n; i += every) {
      const x = this.pad.l + i * this.stepW + this.stepW / 2;

      const label = this.isMobile ? `${this.series[i].hour}` : `${this.series[i].hour}시`;
      out.push({ x, label });
    }
    return out;
  },
    yTicks () {
      const max = this.maxKw, step = max / 4, arr = [];
      for (let i = 0; i <= 4; i++) {
        const v = Math.round((step * i) * 1000) / 1000;
        const y = this.yKwToY(v);
        
        arr.push({ y, label: this.formatBigNumber(v) }); 
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
  nameField(v) {
    if (v && this.imeiField) {
      this.imeiField = '';
    }
  },
  '$route.query.imei'(v) {
    const next = (typeof v === 'string') ? v.trim() : '';

    if (!next) return;

    if (next === this.imeiUse || next === this.imeiField) return;

    this.imeiField = next;

    this.selectedMulti = '';

    this.scheduleSearch();  
  },

  energyField(nv) {
    if (nv !== '01') {
      this.selectedMulti = '';
    }

    if (this.imeiField) {
      this.scheduleSearch();
    }
  }
},
async created () {
  this.syncAdminFromStorage()

  await this.enforceUserImei()

  this.scheduleSearch(80)
},
  methods: {
  formatBigNumber(num) {
      if (num == null || Number.isNaN(num)) return '0';
      const abs = Math.abs(num);
      if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'G';
      if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
      if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'k';
      return this.number(num, num >= 10 ? 0 : 1);
    },
    updateChartDimensions() {
      const width = window.innerWidth;
      
      if (width <= 767) {
        this.isMobile = true;
        this.vb = { w: 500, h: 320 }; 
        this.pad = { t: 20, r: 10, b: 30, l: 45 }; 
      } else {
        this.isMobile = false;
        this.vb = { w: 1000, h: 360 };
        
        
        this.pad = { t: 16, r: 16, b: 28, l: 35 }; 
      }
    },
async loadFastAndRenderImmediate() {
  if (!this.imeiUse) return;

  this.abortAll();
  const myReq = ++this.currentReqId;

  this.loadingKpis = true;
  this.loadingHourly = true;
  this.loadingLatest = true;

  await Promise.allSettled([
    this.loadKpis(myReq),
    this.loadHourly(myReq),
    this.loadLatest(myReq)
  ]);

  this.loadingKpis = false;
  this.loadingHourly = false;
  this.loadingLatest = false;

  this.loadingDriver = true;
  this.loadDriverUnits(myReq)
    .finally(() => { this.loadingDriver = false });

  this.loadingFacility = true;
  this.loadingMaint = true;
  Promise.allSettled([
    this.loadFacility(myReq),
    this.loadMaintenance(myReq)
  ]).finally(() => {
    this.loadingFacility = false;
    this.loadingMaint = false;
  });

  setTimeout(() => {
    if (this.currentReqId !== myReq) return;

    this.loadingWeather = true;
    this.loadWeather(myReq)
      .finally(() => { this.loadingWeather = false });
  }, 120);
},

async onFacilityImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const blobUrl = URL.createObjectURL(file);
  this.previewImage = blobUrl;

  this.facilityInfo.image_url = blobUrl;

  const imei = this.imeiUse;
  const form = new FormData();
  form.append("rtuImei", imei);
  form.append("file", file);

  const res = await fetch("/api/facility/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  }).then(r => r.json());

  if (res.ok) {
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

enforceUserImei() {
  const userImei = localStorage.getItem('userImei')
  const urlQ = this.$route.query

  if (!this.isAdmin) {
    if (!userImei) {
      console.warn('[보안] 사용자 IMEI가 localStorage에 없습니다.')
      return
    }

    const baseQuery = {
      imei: userImei,
      energy: urlQ.energy || '01',
      type: urlQ.type || '',
      multi: urlQ.multi || ''
    }

    this.$router.replace({ query: baseQuery })

    this.imeiField = userImei
    this.energyField = baseQuery.energy
    this.typeField = baseQuery.type
    this.multiField = baseQuery.multi
  } else {
    if (urlQ.imei) this.imeiField = urlQ.imei
    if (urlQ.energy) this.energyField = urlQ.energy
    if (urlQ.type) this.typeField = urlQ.type
    if (urlQ.multi) this.multiField = urlQ.multi
  }
},
      scheduleSearch(delay = 180) {
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.onSearch(), delay);
  },
normMulti(v) {
  if (v === undefined || v === null) return '';
  const s = String(v).trim().toLowerCase();

  if (s === '' || s === 'all' || s === 'null' || s === 'undefined' || s === '-') return '';

  if (/^(0x)?[0-9a-f]{2}$/.test(s)) return s.replace(/^0x/, '');

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n < 256) return n.toString(16).padStart(2, '0');
  }
  return '';
},
    multiIdDisp(v) {
      const hex = this.normMulti(v);
      return hex ? hex.toUpperCase() : '—';
    },
 onRowClick (r) {
    const hex = this.normMulti(r?.multiId)

    if (!hex) {
      this.clearMulti()
      return
    }

    if (hex === this.selectedMulti) {
      this.clearMulti()
      return
    }

    this.onSelectUnit(hex)
  },
onViewAll() {
  this.selectedMulti = ''
},
    onWxMove (e) {
      if (this.wxPinned) return;
      const box = e.currentTarget.getBoundingClientRect();
  const xPx = e.clientX - box.left;
  
  const xSvg = (xPx / box.width) * 720;

      const pts = this.wxStripPoints;
      if (!pts.length) { this.inspectIdx = null; return; }

      let idx = 0, min = Infinity;
  for (let i=0; i<pts.length; i++){
    const d = Math.abs(pts[i].x - xSvg);
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

      this.closeSearchModal();
      this.imeiField = imei;
      this.nameField = '';
      this.selectedMulti = '';

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
_abortStamp: 0,

abortAll() {
  for (const k of Object.keys(this.controllers)) {
    try {
      this.controllers[k]?.abort();
    } catch (_) {}
    this.controllers[k] = null;
  }

  this._abortStamp = Date.now();
},

newController(key) {
  const now = Date.now();

  if (this._abortStamp && now - this._abortStamp < 40) {
    return new AbortController().signal;
  }

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

async onSearch() {
  if (this.searching) return;
  this.searching = true;
  this.loading = true;

  try {
    const imeiInput = (this.imeiField || "").trim();
    const nameInput = (this.nameField || "").trim();

    if (!imeiInput && !nameInput) {
      this.resetAll();
      this.isSearched = false;
      return;
    }

    if (nameInput) {
      const resolved = await this.probeResolveByName(nameInput);
      if (resolved?.action === "modal") {
        this.openSearchModal(resolved.matches || []);
        this.isSearched = false;
        return;
      }
      if (!resolved?.imei) {
        alert("이름으로 장비를 찾을 수 없습니다.");
        this.isSearched = false;
        return;
      }

      if (resolved.energy && resolved.energy !== this.energyField) {
        this.energyField = resolved.energy;
      }

      this.abortAll();
      this.currentReqId += 1;
      this.imeiUse = resolved.imei;
      this.imeiField = resolved.imei;
      this.selectedMulti = "";
      this.clearForLoading();
      await this.loadFastAndRenderImmediate();
      this.isSearched = true;
      await this.syncQuery();
      return;
    }

    if (imeiInput) {
      const probeUrl = `/api/energy/${this.apiNS}/instant?imei=${encodeURIComponent(
        imeiInput
      )}&energy=${this.energyField || "01"}`;

      const probe = await fetch(probeUrl, this.fopts("probe"));

      if (!probe.ok) {
        let j = {};
        try { j = JSON.parse(await probe.text()); } catch {}
        alert(j?.error || "IMEI 장비를 찾을 수 없습니다.");
        this.isSearched = false;
        return;
      }

      this.abortAll();
      this.currentReqId += 1;
      this.imeiUse = imeiInput;
      this.imeiField = imeiInput;
      this.selectedMulti = "";
      this.clearForLoading();
      await this.loadFastAndRenderImmediate();
      this.isSearched = true;
      await this.syncQuery();
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

async loadAll() {
  if (!this.imeiUse) return;

  this.abortAll();
  const myReq = ++this.currentReqId;
  this.loadingKpis = true;
  this.loadingHourly = true;
  this.loadingLatest = true;
  await Promise.allSettled([
    this.loadKpis(myReq),
    this.loadHourly(myReq),
    this.loadLatest(myReq)
  ]);

  this.loadingKpis = false;
  this.loadingHourly = false;
  this.loadingLatest = false;
  this.loadingDriver = true;
  this.loadDriverUnits(myReq)
    .finally(() => { this.loadingDriver = false });
  this.loadingFacility = true;
  this.loadingMaint = true;

  Promise.allSettled([
    this.loadFacility(myReq),
    this.loadMaintenance(myReq)
  ]).finally(() => {
    this.loadingFacility = false;
    this.loadingMaint = false;
  });

  setTimeout(() => {
    if (this.currentReqId !== myReq) return;

    this.loadingWeather = true;

    this.loadWeather(myReq)
      .finally(() => { this.loadingWeather = false });
  }, 120);
},

async loadKpis(reqId) {
  this.loadingKpis = true;

  try {
    const params = new URLSearchParams({
      imei: this.imeiUse,
      energy: this.energyField || '01',
    });

    const hexMulti = this.normMulti(this.selectedMulti);
    if (hexMulti) params.set('multi', hexMulti);

    const url = `/api/energy/kpi-fast?${params.toString()}`;
    const r = await fetch(url, this.fopts('kpis'));

    if (!r.ok) return;
    if (reqId && reqId !== this.currentReqId) return;

    const j = await r.json();
    const k = j.kpis || {};

    const co2_ton = (k.co2_kg != null)
      ? Math.round((k.co2_kg / 1000) * 100) / 100
      : null;

    this.kpi = {
      now_kw: k.now_kw ?? null,
      today_kwh: k.today_kwh ?? null,
      total_kwh: k.total_kwh ?? null,
      co2_ton,
      last_month_avg_kw: null,
      inverter_efficiency_pct: k.inverter_efficiency_pct ?? null,
      _updatedAt: j.deviceInfo?.latestAt || null
    };

    if (this.chartTodaySum != null) {
      this.kpi.today_kwh = this.chartTodaySum;
    }

  } catch (err) {
    console.warn("loadKpis error:", err);

  } finally {
    this.loadingKpis = false;
  }
},
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

  const imei = this.imeiUse;

  this.facilityForm = {
    rtuimei: imei,
    module_capacity: this.facilityInfo.moduleCapacity || '',
    install_date: this.facilityInfo.installDate || '',
    monitor_start: this.facilityInfo.monitorStart || '',
    project_name: this.facilityInfo.projectName || '',
    contractor: this.facilityInfo.contractor || '',
    as_contact: this.facilityInfo.asContact || '',
    image_url: this.facilityInfo.image || ''
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
  this.previewImage = null;
  this.$nextTick(() => {
    const fileInput = this.$el.querySelector(".facility-image-input");
    if (fileInput) fileInput.value = "";
  });

  if (this.editingFacility) {
    this.loadFacility(this.currentReqId);
  } else {
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

    this.showFacilityEditor = false;

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

    const hexMulti = this.normMulti(this.selectedMulti);
    const isAdmin = this.isAdmin;

    const next = {
      ...(this.imeiUse ? { imei: this.imeiUse } : {}),
      ...(this.energyField ? { energy: this.energyField } : {}),
      ...(this.typeField ? { type: this.typeField } : {}),
      ...(hexMulti ? { multi: hexMulti } : {})
    };

    const nextKey = JSON.stringify(next);
    if (this._lastQueryKey === nextKey) return;
    this._lastQueryKey = nextKey;

    if (JSON.stringify(cur) === nextKey) return;

    await this.$router.replace({ query: next });

  } catch (e) {
    console.warn("syncQuery failed", e);
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

async clearMulti() {
  this.abortAll();

  const myReq = ++this.currentReqId;

  this.loadingHourly = true;
  this.loadingKpis = true;
  this.selectedMulti = '';
  this.hoverIdx = null;
  this.hourly = [];
  this.chartTodaySum = null;

  await this.$nextTick();

  await this.syncQuery(true);

  await Promise.allSettled([
    this.loadHourly(myReq),
    this.loadKpis(myReq)
  ]);

  this.loadingHourly = false;
  this.loadingKpis = false;
},
async onSelectUnit(hex) {
  const next = this.normMulti(hex);
  if (!next) return this.clearMulti();

  this.abortAll();
  const myReq = ++this.currentReqId;

  this.loadingHourly = true;
  this.loadingKpis = true;
  await this.$nextTick();

  if (this.selectedMulti === next) {
    await Promise.allSettled([
      this.loadHourly(myReq),
      this.loadKpis(myReq)
    ]);

    this.loadingHourly = false;
    this.loadingKpis = false;
    return;
  }

  this.selectedMulti = next;
  await this.syncQuery(true);

  this.hoverIdx = null;
  this.hourly = [];
  this.chartTodaySum = null;

  await Promise.allSettled([
    this.loadHourly(myReq),
    this.loadKpis(myReq)
  ]);

  this.loadingHourly = false;
  this.loadingKpis = false;
}
  },
mounted () {
  this.updateChartDimensions();
  window.addEventListener('resize', this.updateChartDimensions);
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
    this.imeiField = qImei;
    this.selectedMulti = '';
    this.syncQuery(true);
   this.$nextTick(() => this.onSearch());
  } else {
    this.initImeiFlow();
  }
},
  beforeDestroy () {
  window.removeEventListener('resize', this.updateChartDimensions);
    if (this._storageHandler) window.removeEventListener('storage', this._storageHandler);
  }
}
</script>