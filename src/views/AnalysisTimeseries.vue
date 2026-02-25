<template>
  <div class="ts-page">
    <section class="toolbar" v-if="isAdmin">
      <div class="tool-left">
            <template v-if="isAdmin">
        <label class="lbl">IMEI</label>
        <input
          v-model.trim="imeiField"
          @keyup.enter="onSearch({ manual: true })"
          class="input"
          type="text"
          placeholder="예) 01-01-01-01-01-01-01-01"
            :readonly="!isAdmin"
            maxlength="23"
        />
        </template>

        <template v-if="isAdmin">
          <label class="lbl">이름</label>
          <input
            v-model.trim="nameField"
            @keyup.enter="onSearch({ manual: true })"
            class="input"
            type="text"
            placeholder="예) 홍길동"
            maxlength="30"
          />

          <label class="lbl">에너지</label>
          <select v-model="energyField" class="input sel" @change="handleEnergyManualChange">
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
    <span v-else class="ats-spinner" aria-hidden="true"></span>
  </button>
</div>
    </section>

<section class="kpi-row">


  <template v-if="loadingKpis">
    <div v-for="n in 6" :key="'sk-'+n" class="kpi kpi-skeleton">
      <div class="kpi-hd">
        <span class="kpi-title skeleton-line"></span>
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
          <h3>시간대별 그래프 <span style="font-size:12px; color:gray;"> ({{ unitEnergy }}) </span></h3>
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
    {{ (b.kw > 0) ? (energyField === '03' ? (b.kw / 1000).toFixed(0) : formatBigNumber(b.kw)) : '' }}
  </text>
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
  @touchstart.passive="onTouchMove"
  @touchmove.passive="onTouchMove"
  @touchend="onLeave"
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
      <li>
        <span>총 {{ labelEnergy }}</span>
        <strong>
          {{ energyField === '03' ? fmt(kpi.total_kwh / 1000, 0) : fmt(kpi.total_kwh, 2) }} 
          {{ unitEnergy }}
        </strong>
      </li>
      <li>
        <span>탄소 절감</span>
        <strong>{{ fmt(kpi.co2_ton, 2) }} 톤</strong>
      </li>
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
                class="btn primary sm"
                v-if="isAdmin"
                :disabled="!imeiUse"
                @click="openMaintModal('ADD')" 
            >
                기록 추가
            </button>
<button
  class="btn ghost sm"
  :disabled="!imeiUse || maintenance.records?.length === 0" 
  @click="openMaintModal('VIEW')" 
>
  이력 보기 ({{ maintenance.records?.length || 0 }})
</button>
        </div>
    </div>
    <ul class="kv">
        <template v-if="loadingMaint">
            <li><span>최근 점검</span><strong class="sk-line"></strong></li>
            <li><span>A/S 특이사항</span><strong class="sk-line"></strong></li>
        </template>

        <template v-else>
            <li>
                <span>최근 점검일</span>
                <strong>{{ maintenance.lastInspection || '—' }}</strong>
            </li>
<li>
    <span>최근 기록 내용</span>
    <strong :title="maintenance.asNotes">
        {{ maintenance.asNotes 
           ? (maintenance.asNotes.length > 20 
              ? maintenance.asNotes.substring(0, 20) + '...' 
              : maintenance.asNotes) 
           : '—' 
        }}
    </strong>
</li>
        </template>
    </ul>
</article>
    </section>
    
<section class="sub-dashboard">
  <EnergyDashboard
    v-if="imeiUse" 
    class="sub-dashboard-inner"
    :imei="imeiUse"
    :energy="energyField"
    :type="typeField"
    :is-admin="isAdmin"
    :multi="selectedMulti"
  />
  
  <div v-else class="dashboard-placeholder" style="padding: 50px; text-align: center; color: #999;">
    데이터를 조회하면 상세 분석 정보가 표시됩니다.
  </div>
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
          <input v-model="facilityForm.module_capacity" maxlength="30" placeholder="용량을 입력하세요" />
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
          <input v-model="facilityForm.project_name" maxlength="50" placeholder="사업명을 입력하세요"/>
          <label>시공사</label>
          <input v-model="facilityForm.contractor" maxlength="30" placeholder="시공사를 입력하세요" />
          <label>A/S 연락처</label>
          <input v-model="facilityForm.as_contact" maxlength="15" placeholder="연락처를 입력하세요" @input="handleContactInput"/>
          <label v-if="isAdmin"><span>설비 이미지</span>  <input
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
    <p class="img-empty-desc">파일 크기 제한 : 50MB</p>
    <p class="img-empty-sub">이미지 파일(jpg, jpeg, png, gif, webp)만 업로드 가능합니다.</p>
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
    v-model="searchModal.keyword" 
    class="ats-select-modal__input"
    type="text"
    ref="modalSearchInput"
    placeholder="새로운 이름 검색 또는 목록 필터"
    maxlength="50"
    @keyup.enter.stop="searchAgainInModal" 
    @keydown.stop
  />
  <button 
    class="btn primary sm" 
    style="margin-right: 8px;" 
    :disabled="searchModal.loading"
    @click="searchAgainInModal"
  >
    <span v-if="!searchModal.loading">검색</span>
    <span v-else class="ats-spinner"></span>
  </button>
  
  <button
    class="ats-select-modal__btn ats-select-modal__btn--primary"
    :disabled="filteredMatches.length === 0 || searchModal.selectedIdx < 0"
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

<div v-if="maintModal.open" class="ats-modal" role="dialog" aria-modal="true" @keydown.esc="closeMaintModal">
    <div class="ats-modal__backdrop" @click="closeMaintModal"></div>

    <div class="ats-modal__panel" tabindex="-1">
      <header class="ats-modal__hd">
        <h4 class="ats-modal__title">
          {{ maintModal.mode === 'ADD' ? '유지보수 기록 추가' : (maintModal.mode === 'EDIT' ? '유지보수 기록 수정' : '유지보수 이력 목록') }}
        </h4>
        <button type="button" class="ats-modal__close" aria-label="닫기" @click="closeMaintModal">✕</button>
      </header>

      <div class="ats-modal__body" v-if="maintModal.mode === 'ADD' || maintModal.mode === 'EDIT'">
        <label class="form-label">점검/유지보수일</label>
        <div class="date-field">
          <input type="date" class="form-input" v-model="maintForm.lastInspection" ref="maintDate" />
          <button type="button" class="calendar-btn" @click="openDate('maintDate')" aria-label="점검일 선택">📅</button>
        </div>

        <label class="form-label">A/S 특이사항 및 기록</label>
        <textarea
          class="form-textarea"
          rows="6"
          placeholder="점검/교체 내용, 고장 내역 등을 상세히 기록해 주세요."
          v-model="maintForm.asNotes"
          maxlength="255"
        ></textarea>
      </div>

      <div class="ats-modal__body" v-else-if="maintModal.mode === 'VIEW'">
<div class="maintenance-history-list thin-scroll" style="max-height: 400px; overflow-y: auto;">
          
          <template v-if="isMobile">
            <ul class="mobile-maint-list">
              <li v-for="r in maintenance.records" :key="r.id" class="mobile-maint-item">
                <div class="mo-header">
                  <span class="mo-date">{{ r.maintenanceDate || '—' }}</span>
                  <div class="mo-actions" v-if="isAdmin">
                    <button class="btn ghost xs" @click="openMaintModal('EDIT', r)">수정</button>
                    <button class="btn ghost xs warn" @click="deleteMaintenance(r.id)">삭제</button>
                  </div>
                </div>
                <div class="mo-content" style="white-space: pre-wrap; word-break: break-all;">
                  {{ r.asNotes || '내용 없음' }}
                </div>
              </li>
            </ul>
            <div v-if="maintenance.records.length === 0" style="padding: 20px; text-align: center; color: #999;">
              등록된 이력이 없습니다.
            </div>
          </template>

          <template v-else>
            <table class="tbl compact" style="width:100%; font-size: 13px; table-layout: fixed;">
              <colgroup>
                <col style="width: 100px;"> <col>                       
                <col style="width: 100px;"> </colgroup>
              <thead>
                <tr>
                  <th>점검일</th>
                  <th>기록 내용</th>
                  <th v-if="isAdmin">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in maintenance.records" :key="r.id">
                  <td style="text-align:center;">{{ r.maintenanceDate || '—' }}</td>
                  <td style="white-space: pre-wrap; word-break: break-all; text-align: left; padding: 8px;">{{ (r.asNotes || '').trim() || '—' }}</td>
                  
                  <td style="text-align:center;" v-if="isAdmin">
                    <button class="btn ghost xs" @click="openMaintModal('EDIT', r)" style="margin-right:4px;">수정</button>
                    <button class="btn ghost xs warn" @click="deleteMaintenance(r.id)">삭제</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="maintenance.records.length === 0" style="padding: 16px; text-align: center; color: #999;">
               등록된 유지보수 이력이 없습니다.
            </div>
          </template>

        </div>
      </div>

      <footer class="ats-modal__ft">
        <button 
          class="btn primary" 
          v-if="maintModal.mode === 'ADD' || maintModal.mode === 'EDIT'"
          @click="saveMaintenance"
          :disabled="maintModal.saving || !maintForm.lastInspection"
        >
          <span v-if="!maintModal.saving">{{ maintModal.mode === 'ADD' ? '기록 저장' : '수정 완료' }}</span>
          <span v-else class="btn-spinner" aria-hidden="true"></span>
        </button>

        <button
          class="btn ghost"
          v-if="maintModal.mode === 'EDIT'"
          @click="openMaintModal('VIEW')"
        >목록으로</button>

        <button class="btn ghost" @click="closeMaintModal">닫기</button>
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
    isAdminProp: { type: Boolean, default: false }
  },
  components: { EnergyDashboard },
  data () {
    return {
    _initializing: false,
    maintenance: { 
            records: [], 
            lastRecord: null,
            lastInspection: null,
            asNotes: null, 
        },
     maintModal: { open: false, saving: false, records: [], mode: 'VIEW', editingId: null },
     maintForm: { lastInspection: '', asNotes: '', rtuImei: '' },
    userImeiFromStorage: null,
    dashboardKey: 0,
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
      energyField: '',
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

      selectedMulti: '',
    }
  },
  computed: {
    unitEnergy() {
  return this.energyField === '03' ? 'MWh' : 'kWh';
},

unitEnergyTotal() {
  return this.energyField === '03' ? 'MWh' : 'kWh';
},
  isOffline() {
    if (!this.latestCollectedAt) return true;
    
    const last = new Date(this.latestCollectedAt).getTime();
    const now = Date.now();
    const diffMin = (now - last) / (1000 * 60);
    
    return diffMin >= 90;
  },
inverterStatusList() {
  if (this.isOffline) {
      return ['최근 90분간 데이터 수신이 없습니다.'];
  }

  const faults = Array.isArray(this.mets?.faultList) ? this.mets.faultList : [];
  const statuses = Array.isArray(this.mets?.statusList) ? this.mets.statusList : [];
  
  const combined = [...faults, ...statuses];
  return combined.length > 0 ? combined : [];
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
  const fList = Array.isArray(this.mets?.faultList) ? this.mets.faultList : [];
  const sList = Array.isArray(this.mets?.statusList) ? this.mets.statusList : [];

  if (fList.length > 0) return '고장';

  if (this.isOffline) return '오프라인';

  if (this.mets?.isOperating === false) return '미작동';

  if (sList.length > 0) return '주의';

  if (this.mets?.state_raw != null && this.mets.state_raw !== 0) {
    return '점검'; 
  }

  if (Array.isArray(this.driverRows) && this.driverRows.some(r => r.status && r.status !== '정상')) {
    return '주의';
  }

  return '정상';
},

  statusBadgeClass() {
    const text = this.overallStatusText;
    if (text === '정상') return 'ok';
    if (text === '주의') return 'warn';
    if (text === '고장') return 'crit';
    if (text === '오프라인') return 'offline';
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

    inverterTitle () {
      return this.energyField === '01' ? '인버터 효율' : '시스템 효율';
    },

    kpisShown () {
    const u = this.unitEnergy;
      return [
        { key: 'now',     title: this.isHeat ? '현재 열출력' : '현재 출력',     unit: u  },
        { key: 'today',   title: this.isHeat ? '금일 열량'   : '금일 발전량',   unit: u },
        { key: 'co2',     title: '누적 CO₂ 저감',                                   unit: 'tCO₂' },
        { key: 'avg',     title: this.isHeat ? '지난 달 평균 열출력' : '지난 달 평균 출력', unit: u  },
        { key: 'status',  title: '시스템 상태',                                 unit: ''    },
        { key: 'total',   title: this.isHeat ? '누적 열량' : '누적 발전량',  unit: u },
      ];
    },

filteredMatches() {
  const kw = (this.searchModal.keyword || '').trim().toLowerCase();
  let arr = Array.isArray(this.searchModal.matches) ? [...this.searchModal.matches] : [];
  
  if (kw) {
    arr = arr.filter(m => {
      return (m.name || '').toLowerCase().includes(kw);
    });
  }

  arr.sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'ko') ||
    (a.address || '').localeCompare(b.address || '', 'ko') ||
    (String(a.rtuImei || a.imei || '')).localeCompare(String(b.rtuImei || b.imei || ''))
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
maxKw() {
  const isGeothermal = this.energyField === '03';
  const vals = this.series.map(p => p.kw || 0);
  let max = Math.max(...vals, 0.01);
  return max;
},
    stepW () { return this.series.length ? this.inner.w / this.series.length : 0; },
    barW() { const ratio = this.isMobile ? 0.85 : 0.6; return Math.max(10, this.stepW * ratio); },

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
yTicks() {
  const isGeothermal = this.energyField === '03';
  const max = this.maxKw;
  const step = max / 4;
  const arr = [];
  
  for (let i = 0; i <= 4; i++) {
    const v = step * i;
    const y = this.yKwToY(v);
    const label = isGeothermal ? Math.round(v / 1000).toString() : this.formatBigNumber(v);
    arr.push({ y, label });
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
    hoverKw() {
  if (this.hoverIdx === null) return null;
  const isGeothermal = this.energyField === '03';
  const val = this.series[this.hoverIdx]?.rawNull ? null : (this.bars[this.hoverIdx].kw || 0);
  
  if (val === null) return null;
  return isGeothermal ? (val / 1000) : val;
},
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
    if (this.energyField === '03') {
    return [
      { key:'gridV',      label:'계통전압(V)',              num:true, digits:0 },
      { key:'gridA',      label:'계통전류(A)',              num:true, digits:1 },
      { key:'nowW',       label:'소비전력(kW)',             num:true, digits:0 }, 
      { key:'heatW',      label:'열생산량(kW)',             num:true, digits:0 },
      { key:'pf',         label:'역률(%)',                 num:true, digits:1 },
      { key:'freq',       label:'주파수(Hz)',               num:true, digits:1 },
      { key:'srcInC',     label:'지열수 입구(°C)',          num:true, digits:1 },
      { key:'srcOutC',    label:'지열수 출구(°C)',          num:true, digits:1 },
      { key:'loadInC',    label:'로드 입구(°C)',            num:true, digits:1 },
      { key:'loadOutC',   label:'로드 출구(°C)',            num:true, digits:1 },
      { key:'flowLpm',    label:'유량(LPM)',               num:true, digits:1 },
      { key:'elecKwh',    label:'누적전력(MWh)',            num:true, digits:0 },
      { key:'totalKwh',   label:'누적열량(MWh)',            num:true, digits:0 },
    ];
  }
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

driverRows() {
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
          const elecKwhRaw = (typeof u.cumulative_wh === 'string' || typeof u.cumulative_wh === 'number')
            ? Number(u.cumulative_wh) / 1000
            : (u.cumulative_kwh ?? u.energy_used_kwh ?? null);
          const totalKwhRaw = this.pickFirstNum([u.produced_kwh, u.thermal_total_kwh, u.heating_kwh, u.used_kwh, u.tapUsedKwh]);

          return {
            imei: this.imeiUse || '—',
            multiId: u.multi || null,
            collectedAt,
            status: Array.isArray(u.status_list) && u.status_list.length ? '주의' : '정상',
            state: (typeof u.isOperating === 'boolean') ? (u.isOperating ? '운전중' : '미작동')
              : (typeof u.state === 'string' ? u.state : (u.state_raw === 0 ? '미작동' : '운전중')),
            gridV: u.system_voltage_v ?? u.grid_voltage_v ?? null,
            gridA: u.system_current_a ?? u.grid_current_a ?? null,

            nowW: u.current_output_w ? Math.round(u.current_output_w / 1000) : null,
            heatW: (typeof u.heat_kw === 'number' ? Math.round(u.heat_kw) 
                  : (u.heat_output_w ? Math.round(u.heat_output_w / 1000) : null)),
            
            pf: u.power_factor ?? u.pf ?? null,
            freq: u.frequency_hz ?? u.freq ?? null,
            srcInC: this.pickFirstNum([u.inlet_temp_c, u.srcInC]),
            srcOutC: this.pickFirstNum([u.outlet_temp_c, u.srcOutC]),
            loadInC: this.pickFirstNum([u.load_in_temp_c, u.loadInTempC]),
            loadOutC:this.pickFirstNum([u.load_out_temp_c, u.loadOutTempC]),
            flowLpm: this.pickFirstNum([u.load_flow_lpm, u.flow_lpm, u.flow_rate_lpm]),

            elecKwh: elecKwhRaw ? Math.round(elecKwhRaw / 1000) : null,
            totalKwh: totalKwhRaw ? Math.round(totalKwhRaw / 1000) : null
          };
        }

        return {
          imei: this.imeiUse || '—',
          multiId: u.multi || null,
          collectedAt,
          status: Array.isArray(u.status_list) && u.status_list.length ? '주의' : '정상',
          supplyC: this.pickFirstNum([u.outlet_temp_c, u.hot_temp_c, u.t_out_c]),
          returnC: this.pickFirstNum([u.inlet_temp_c, u.cold_temp_c, u.t_in_c]),
          tankC:   this.pickFirstNum([u.tank_top_temp_c, u.tank_bottom_temp_c, u.tank_temp_c]),
          flowLpm: this.pickFirstNum([u.flow_lpm, u.flow_rate_lpm]),
          totalKwh: this.pickFirstNum([u.produced_kwh, u.used_kwh, (Number(u.cumulative_wh)/1000)])
        };
      });
  }

  if (this.energyField === '03') {
    const t = this.mets || {};
    const collectedAt = this.latestCollectedAt ? new Date(this.latestCollectedAt).toLocaleString('ko-KR') : null;
    const elecKwhRaw = (typeof t.cumulative_wh === 'string' || typeof t.cumulative_wh === 'number')
      ? Number(t.cumulative_wh) / 1000 : (t.cumulative_kwh ?? null);

    return [{
      imei: this.imeiUse || '—',
      multiId: null,
      collectedAt,
      status: t.statusList?.length ? '주의' : '정상',
      state: (typeof t.isOperating === 'boolean' ? (t.isOperating ? '운전중' : '미작동') : '—'),
      gridV: this.gridVoltageRaw,
      gridA: this.pickFirstNum([t.systemCurrent, t.systemR_I]),

      nowW: (typeof this.kpi?.now_kw === 'number') ? Math.round(this.kpi.now_kw) : null,
      heatW: (typeof t.heat_kw === 'number' ? Math.round(t.heat_kw) : null),
      
      pf: this.pickFirstNum([t.powerFactor, t.pf]),
      freq: this.pickFirstNum([t.frequencyHz, t.freq]),
      srcInC: this.pickFirstNum([t.inlet_temp_c, t.srcInC]),
      srcOutC: this.pickFirstNum([t.outlet_temp_c, t.srcOutC]),
      loadInC: this.pickFirstNum([t.load_in_temp_c, t.loadInTempC]),
      loadOutC:this.pickFirstNum([t.load_out_temp_c, t.loadOutTempC]),
      flowLpm: this.pickFirstNum([t.flowLpm, t.load_flow_lpm]),

      elecKwh: elecKwhRaw ? Math.round(elecKwhRaw / 1000) : null,
      totalKwh: this.kpi?.total_kwh ? Math.round(this.kpi.total_kwh / 1000) : null
    }];
  }

  const m = this.mets || {};
  const collectedAt = this.latestCollectedAt ? new Date(this.latestCollectedAt).toLocaleString('ko-KR') : null;
  
  if (!this.isHeat) {
    return [{
      imei: this.imeiUse || '—', multiId: null, collectedAt,
      status: m.statusList?.length ? '주의' : '정상',
      pvV: this.pickFirstNum([m.pvVoltage, m.pvVoltageV]),
      pvA: this.pickFirstNum([m.pvCurrent, m.pvCurrentA]),
      pvW: this.pickFirstNum([m.pvPowerW, m.pvPower]),
      gridV: this.gridVoltageRaw,
      gridA: this.pickFirstNum([m.systemCurrent, m.systemR_I]),
      nowW: (typeof this.kpi?.now_kw === 'number') ? Math.round(this.kpi.now_kw * 1000) : null,
      pf: this.pickFirstNum([m.powerFactor, m.pf]),
      freq: this.pickFirstNum([m.frequencyHz, m.freq]),
      totalKwh: this.kpi?.total_kwh ?? null
    }];
  }

  return [{
    imei: this.imeiUse || '—', multiId: null, collectedAt,
    status: m.statusList?.length ? '주의' : '정상',
    supplyC: this.pickFirstNum([m.outlet_temp_c, m.hot_temp_c]),
    returnC: this.pickFirstNum([m.inlet_temp_c, m.cold_temp_c]),
    tankC:   this.pickFirstNum([m.tank_top_temp_c, m.tank_temp_c]),
    flowLpm: this.pickFirstNum([m.flow_lpm, m.flow_rate_lpm]),
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
    if (this._initializing) return;
    if (this.searching) return;
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
    }
  },
async created () {
    this.syncAdminFromStorage();
    await this.enforceUserImei();
    this.scheduleSearch(80);
  },

  methods: {
  handleContactInput() {
    let val = this.facilityForm.as_contact.replace(/\D/g, "");
    let len = val.length;
    let res = "";

    if (val.startsWith("02")) {
      if (len <= 2) {
        res = val;
      } else if (len <= 5) {
        res = val.slice(0, 2) + "-" + val.slice(2);
      } else if (len <= 9) {
        res = val.slice(0, 2) + "-" + val.slice(2, 5) + "-" + val.slice(5);
      } else {
        res = val.slice(0, 2) + "-" + val.slice(2, 6) + "-" + val.slice(6, 10);
      }
    } else {
      if (len <= 3) {
        res = val;
      } else if (len <= 6) {
        res = val.slice(0, 3) + "-" + val.slice(3);
      } else if (len <= 10) {
        res = val.slice(0, 3) + "-" + val.slice(3, 6) + "-" + val.slice(6);
      } else {
        res = val.slice(0, 3) + "-" + val.slice(3, 7) + "-" + val.slice(7, 11);
      }
    }
    this.facilityForm.as_contact = res;
  },

  handleEnergyManualChange() {
    this.isSearched = false;
    this.imeiUse = '';
    this.clearForLoading();
    this.syncQuery();
  },

async searchAgainInModal() {
  const q = (this.searchModal.keyword || "").trim();
  if (!q) {
    this.searchModal.matches = [];
    return;
  }

  this.searchModal.loading = true;
  try {
    const res = await fetch(`/api/energy/search?q=${encodeURIComponent(q)}`, {
      ...this.fopts('probe'),
    });

    if (!res.ok) {
      if (res.status === 422) {
        const json = await res.json();
        if (json.code === 'MULTIPLE_MATCHES') {
          this.searchModal.matches = json.matches;
          this.searchModal.selectedIdx = 0;
          return;
        }
      }
      this.searchModal.matches = [];
      return;
    }

    const data = await res.json();
    if (data.found || (Array.isArray(data.matches) && data.matches.length > 0)) {
      this.searchModal.matches = data.matches || (data.imei ? [data] : []);
      this.searchModal.selectedIdx = 0;
    } else {
      this.searchModal.matches = [];
    }
  } catch (e) {
  } finally {
    this.searchModal.loading = false;
  }
},

  closeMaintModal () {
    this.maintModal.open = false;
    this.maintModal.saving = false; 
    this.maintModal.mode = 'VIEW';
    this.maintModal.editingId = null;
  },
  onTouchMove(e) {
  if (!this.$refs.svg || !this.series.length) return;
  
  const touch = e.touches[0];
  if (!touch) return;

  const rect = this.$refs.svg.getBoundingClientRect();
  const xPx = touch.clientX - rect.left;
  const scaleX = this.vb.w / rect.width;
  const xView = xPx * scaleX;
  
  const i = Math.round((xView - this.pad.l - this.stepW / 2) / this.stepW);
  this.hoverIdx = Math.min(this.series.length - 1, Math.max(0, i));
},

  formatBigNumber(num) {
      if (num == null || Number.isNaN(num)) return '0';
      const abs = Math.abs(num);
      if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'G';
      if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (abs >= 1e3) return (num / 1e3).toFixed(2) + 'k';
      return this.number(num, 2);
    },
updateChartDimensions() {
  const width = window.innerWidth;
  
  if (width <= 767) {
    this.isMobile = true;
    this.vb = { w: 600, h: 450 }; 
    this.pad = { t: 50, r: 15, b: 40, l: 50 }; 
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

  if (this.currentReqId === myReq && this.overallStatusText === '미작동') {
    alert(`[장비 미작동 경고]
현재 장비가 미작동(Idle) 상태로 감지되었습니다.

미작동 상태에서는 최신 데이터 수신이 원활하지 않을 수 있으며,
시간대별 그래프 및 KPI 데이터가 비어 있거나 0으로 표시될 수 있습니다.

장비 상태를 확인해 주세요.`);
  }

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

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("이미지 용량이 너무 큽니다. 50MB 이하의 파일만 업로드 가능합니다.");
    e.target.value = "";
    return;
  }

  const blobUrl = URL.createObjectURL(file);
  this.previewImage = blobUrl;

  const imei = this.imeiUse;
  const form = new FormData();
  form.append("rtuImei", imei);
  form.append("file", file);

  try {
    const response = await fetch("/api/facility/upload", {
      method: "POST",
      body: form,
      credentials: "include",
    });

    const res = await response.json();

    if (response.ok && res.ok) {
      this.facilityForm.image_url = res.url;
    } else {
      alert(res.message || "이미지 업로드에 실패했습니다.");
      this.previewImage = null; 
      e.target.value = ""; 
    }
  } catch (err) {
    alert("서버와 통신 중 오류가 발생했습니다.");
    this.previewImage = null;
    e.target.value = "";
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
        const flag = (localStorage.getItem('isAdmin') === 'true');
        this.isAdmin = flag;
      } catch { 
        this.isAdmin = false; 
      }
    },

enforceUserImei() {
      const userImei = localStorage.getItem('defaultImei'); 
      const urlQ = this.$route.query;

      if (!this.isAdmin) {
        if (!userImei) return;

        const baseQuery = {
          imei: userImei,
          energy: urlQ.energy || '',
          type: urlQ.type || '',
          multi: urlQ.multi || ''
        };

        if (urlQ.imei !== userImei) {
          this.$router.replace({ query: baseQuery });
        }

        this.imeiField = userImei;
        this.energyField = baseQuery.energy;
        this.typeField = baseQuery.type;
      } else {
        if (urlQ.imei) this.imeiField = urlQ.imei;
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
  this.selectedMulti = '';

  if (item.name) {
    this.nameField = item.name; 
  }

  await this.onSearch();
},

onSearchModalKeydown(e) {
  const n = this.filteredMatches.length;

  if (e.key === 'Enter') {
    if (e.target.tagName === 'INPUT') {
      e.preventDefault();
      this.searchAgainInModal();
    } else {
      e.preventDefault();
      if (n > 0) this.confirmSearchSelection();
    }
    return;
  }

  if (e.key === 'Escape') {
    this.closeSearchModal();
    return;
  }

  if (n > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(n - 1, (this.searchModal.selectedIdx ?? -1) + 1);
      this.searchModal.selectedIdx = next;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, (this.searchModal.selectedIdx ?? 0) - 1);
      this.searchModal.selectedIdx = prev;
    }
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
      if (Number(v) === 0) return '0.00';
      return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      this.maintenance = { records: [], lastInspection: null, asNotes: null };
      this.facilityInfo = this.emptyFacilityInfo();
    },

resetAll() {
      this.abortAll();
      this.currentReqId += 1;
      this.dashboardKey += 1;
      this.imeiField = ''; 
      this.nameField = '';
      this.energyField = '01';
      this.typeField = '';
      this.selectedMulti = '';

      this.imeiUse = '';
      this.isSearched = false;
      this.loading = false;
      this.searching = false;
      
      this.clearForLoading();
      this.mets = null;
      this.maintenance = { records: [], lastRecord: null, lastInspection: null, asNotes: null };

      try {
        this.$router?.replace({ query: {} }).catch(() => {});
      } catch (e) {}
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

async onSearch(options = {}) {
const isManual = options.manual === true;

  if (!this.imeiField && !this.nameField) {
    if (isManual) {
      alert("조회할 IMEI 혹은 이름을 입력해주세요.");
    }
    return;
  }

  if (this.searching) return;
  this.searching = true;
  this.loading = true;

  try {
    let imeiInput = (this.imeiField || "").trim();
    const nameInput = (this.nameField || "").trim();

    if (!imeiInput && !nameInput) {
      this.resetAll();
      return;
    }

    if (nameInput && !imeiInput) {
      const resolved = await this.probeResolveByName(nameInput);

      if (resolved?.action === "modal") {
        this.openSearchModal(resolved.matches || []);
        this.loading = false;
        this.isSearched = false;
        return;
      }

      if (!resolved?.imei) {
        alert("이름으로 장비를 찾을 수 없습니다.");
        this.loading = false;
        this.isSearched = false;
        return;
      }

      if (resolved.energy && resolved.energy !== this.energyField) {
        this.energyField = resolved.energy;
      }
      
      imeiInput = resolved.imei;
      this.imeiField = resolved.imei;
    }

    if (imeiInput) {
      if (imeiInput.length !== 23) {
          this.loading = false;
          alert("IMEI 형식이 올바르지 않습니다. (하이픈 '-'을 포함한 23자리 입력)");
          this.isSearched = false;
          return;
      }
      
      if (imeiInput.replace(/[^0-9A-Fa-f\-]/g, '').length < 8) {
          this.loading = false;
          this.isSearched = false;
          this.searching = false;
          alert("IMEI 형식이 올바르지 않습니다.");
          return;
      }

      const searchUrl = `/api/energy/search?q=${encodeURIComponent(imeiInput)}`;
      const res = await fetch(searchUrl, this.fopts('probe'));

      if (!res.ok) {
        this.loading = false;
        this.isSearched = false;
        
        if (res.status === 429) {
           alert("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
           return;
        }
        
        let j = {};
        try { j = await res.json(); } catch {}
        alert(j?.message || j?.error || "장비를 찾을 수 없습니다.");
        return;
      }

      const data = await res.json();

      if (!data.found && !data.imei) {
         this.loading = false;
         alert("등록되지 않은 장비입니다.");
         return;
      }

      if (data.energy && data.energy !== this.energyField) {
        this.energyField = data.energy;
      }
      
      if (data.name) {
        this.nameField = data.name;
      }

      this.abortAll();
      this.currentReqId += 1;
      this.imeiUse = data.imei;
      this.imeiField = data.imei;
      this.selectedMulti = "";
      this.clearForLoading();
      
      await this.loadFastAndRenderImmediate();
      
      this.isSearched = true;
      await this.syncQuery();
    }
    
  } catch (e) {
    alert("검색 중 오류가 발생했습니다.");
  } finally {
    if (this.searching) {
        this.loading = false;
        this.searching = false;
    }
  }
},

async probeResolveByName(name) {
  try {
    const signal = this.newController('probe');
    const res = await fetch(`/api/energy/search?q=${encodeURIComponent(name)}`, {
      signal,
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 422) {
        const json = await res.json();
        if (json.code === 'MULTIPLE_MATCHES') {
          return { action: 'modal', matches: json.matches };
        }
      }
      return null;
    }

    const data = await res.json();

    if (data.found && data.imei) {
      return {
        imei: data.imei,
        energy: data.energy,
        ns: data.ns,
        name: data.name
      };
    }

    return null;

  } catch (e) {
    return null;
  }
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
   last_month_avg_kw: (k.last_month_avg_kw != null) ? Number(k.last_month_avg_kw) : null,
   inverter_efficiency_pct: k.inverter_efficiency_pct ?? null,
   _updatedAt: j.deviceInfo?.latestAt || null
  };

  if (this.chartTodaySum != null) {
   this.kpi.today_kwh = this.chartTodaySum;
  }
 } catch (err) {
 } finally {
  this.loadingKpis = false;
 }
},

async loadLatest(reqId) {
  this.loadingLatest = true;
  try {
    const url = `/api/energy/${this.apiNS}/debug?rtuImei=${encodeURIComponent(this.imeiUse)}&imei=${encodeURIComponent(this.imeiUse)}&limit=1&ok=any`;

    const r = await fetch(url, this.fopts('latest'));
    if (!r.ok) return;
    if (reqId && reqId !== this.currentReqId) return;

    const arr = await r.json();
    const row = Array.isArray(arr) ? arr[0] : null;

    if (row) {
      const now = new Date();
      const lastTs = new Date(row.ts);
      const diffDays = (now - lastTs) / (1000 * 60 * 60 * 24);
      const hour = now.getHours();
      const isSolar = (this.energyField === '01');

      if (diffDays >= 1) {
         alert(`[장기 미수신 주의]\n마지막 데이터 수신일: ${lastTs.toLocaleString()}\n\n약 ${Math.floor(diffDays)}일 동안 데이터가 들어오지 않고 있습니다.\n현장 점검이 필요할 수 있습니다.`);
      }
      
    }

    const p = row?.parsed?.metrics || {};
    const state = typeof p.state === 'string' ? p.state : null;
    const state_raw = typeof p.state_raw === 'number' ? p.state_raw : null;

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

    this.latestCollectedAt = row?.time || row?.createdAt || row?.ts || null;

  } catch (e) {
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
if (!this.facilityForm.project_name || this.facilityForm.project_name.trim() === "") {
  alert("사업명을 한 글자 이상 입력해주세요.");
  return;
}

if (!this.isAdmin) {
    alert('권한이 없습니다.');
    return;
  }
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
            this.loadingMaint = true;
            if (!this.imeiUse) return;
            try {
                const url = `/api/maintenance?rtuImei=${encodeURIComponent(this.imeiUse)}`;
                const r = await fetch(url, this.fopts('maintenance'));
                
                if (!r.ok) {
                    this.maintenance.records = [];
                    this.maintenance.lastRecord = null;
                    this.maintenance.lastInspection = null;
                    this.maintenance.asNotes = null;
                    return;
                }
                if (reqId && reqId !== this.currentReqId) return;
        
                const j = await r.json();
                const records = Array.isArray(j?.records) ? j.records : [];
                
                this.maintenance.records = records;
                const lastRecord = records.length > 0 ? records[0] : null;
        
                this.maintenance.lastRecord = lastRecord;
                this.maintenance.lastInspection = lastRecord ? lastRecord.maintenanceDate : null;
                this.maintenance.asNotes = lastRecord ? lastRecord.asNotes : null;
        
            } catch (_) {
            } finally {
                this.loadingMaint = false;
            }
        },


openMaintModal(mode = 'ADD', record = null) {
      if (!this.imeiUse) return;

      this.maintModal.mode = mode;
      this.maintModal.editingId = null; 

      if (mode === 'ADD') {
        this.maintForm.lastInspection = new Date().toISOString().slice(0, 10);
        this.maintForm.asNotes = '';
        this.maintForm.rtuImei = this.imeiUse;

      } else if (mode === 'EDIT' && record) {
        this.maintModal.editingId = record.id;
        this.maintForm.lastInspection = record.maintenanceDate;
        this.maintForm.asNotes = record.asNotes || '';
        this.maintForm.rtuImei = this.imeiUse;
        
      } else if (mode === 'VIEW') {
      }

      this.maintModal.open = true;

      this.$nextTick(() => {
        const selector = (mode === 'ADD' || mode === 'EDIT') 
          ? '.ats-modal__panel input[type="date"]' 
          : '.ats-modal__panel';
        const el = document.querySelector(selector);
        el && el.focus();
      });
    },

    async saveMaintenance() {
    if (!this.maintForm.asNotes || this.maintForm.asNotes.trim() === "") {
  alert("기록 내용을 입력해주세요.");
  return;
}

      if (!this.imeiUse || this.maintModal.saving) return;
      if (!this.maintForm.lastInspection) {
        alert('점검일을 입력해 주세요.');
        return;
      }

      this.maintModal.saving = true;
      try {
        const body = {
          rtuImei: this.imeiUse,
          lastInspection: this.maintForm.lastInspection || null,
          asNotes: this.maintForm.asNotes || null,
        };

        let url = '/api/maintenance';
        let method = 'POST';

        if (this.maintModal.mode === 'EDIT' && this.maintModal.editingId) {
          url = `/api/maintenance/${this.maintModal.editingId}`;
          method = 'PUT';
        }

        const r = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const t = await r.text().catch(() => '');
          throw new Error(t || 'save failed');
        }

        if (this.maintModal.mode === 'EDIT') {
           alert('수정되었습니다.');
           this.openMaintModal('VIEW');
           await this.loadMaintenance(this.currentReqId);
        } else {
           alert('저장되었습니다.');
           this.maintModal.open = false;
           await this.loadMaintenance(this.currentReqId);
        }

      } catch (e) {
        alert('저장 실패: ' + (e?.message || e));
      } finally {
        this.maintModal.saving = false;
      }
    },

    async deleteMaintenance(id) {
    if (!this.isAdmin) {
    alert('권한이 없습니다.');
    return;
  }
      if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) return;

      try {
        const r = await fetch(`/api/maintenance/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!r.ok) throw new Error('Delete failed');

        alert('삭제되었습니다.');
        await this.loadMaintenance(this.currentReqId);

      } catch (e) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    },

formatDate(isoString) {
            if (!isoString) return '—';
            try {
                const d = new Date(isoString);
                return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            } catch {
                return String(isoString).slice(0, 10);
            }
        },

async saveMaintenance() {
      if (!this.imeiUse || this.maintModal.saving) return;
      
      if (!this.maintForm.lastInspection) {
        alert('점검일을 입력해 주세요.');
        return;
      }

      this.maintModal.saving = true;
      try {
        const body = {
          rtuImei: this.imeiUse,
          lastInspection: this.maintForm.lastInspection || null,
          asNotes: this.maintForm.asNotes || null,
        };

        let url = '/api/maintenance';
        let method = 'POST';

        if (this.maintModal.mode === 'EDIT' && this.maintModal.editingId) {
          url = `/api/maintenance/${this.maintModal.editingId}`;
          method = 'PUT';
        }

        const r = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const t = await r.text().catch(() => '');
          throw new Error(t || 'Request failed');
        }

        if (this.maintModal.mode === 'EDIT') {
           alert('수정되었습니다.');
           this.openMaintModal('VIEW');
        } else {
           alert('저장되었습니다.');
           this.maintModal.open = false;
        }
        
        await this.loadMaintenance(this.currentReqId);

      } catch (e) {
        alert('저장/수정 실패: ' + (e?.message || e));
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
valueFor(key) {
  const isGeothermal = this.energyField === '03';
  
  switch (key) {
    case 'now': {
      const v = this.kpi.now_kw;
      if (v == null) return '—';
      return isGeothermal ? this.fmt(v / 1000, 0) : this.fmt(v, 2);
    }
    case 'today': {
      const v = this.kpi.today_kwh;
      if (v == null) return '—';
      return isGeothermal ? this.number(v / 1000, 0) : this.formatKwh1(v);
    }
    case 'avg': {
      const v = this.kpi.last_month_avg_kw;
      if (v == null) return '—';
      return isGeothermal ? this.fmt(v / 1000, 0) : this.fmt(v, 2);
    }
    case 'total': {
      const v = this.kpi.total_kwh;
      if (v == null) return '—';
      return isGeothermal ? this.fmt(v / 1000, 0) : this.fmt(v, 2);
    }
    case 'status':
      return this.overallStatusText;
    case 'co2':
      return this.fmt(this.kpi.co2_ton, 2);
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
mounted() {
    this.updateChartDimensions();
    window.addEventListener('resize', this.updateChartDimensions);

    this.syncAdminFromStorage();
    this._storageHandler = (e) => {

      if (e.key === 'isAdmin') {
        this.syncAdminFromStorage();
      }
    };
    window.addEventListener('storage', this._storageHandler);

    this._initializing = true;

    const q = this.$route?.query || {};
    const initEnergy = (typeof q.energy === 'string') ? q.energy : '';
    const initType   = (typeof q.type   === 'string') ? q.type   : '';
    const initMulti  = (typeof q.multi  === 'string') ? q.multi  : '';
    const initName   = (typeof q.name   === 'string') ? q.name   : '';

    this.energyField     = initEnergy;
    this.typeField       = initType;
    this.selectedMulti   = this.normMulti(initMulti) || '';
    this.nameField       = initName; 

        const qImei = (typeof q.imei === 'string') ? q.imei.trim() : '';

    if (qImei) {
      this.imeiField = qImei;
      this.selectedMulti = '';
      this.syncQuery(true);
      this.$nextTick(() => this.onSearch());
    } else {
      this.initImeiFlow();
    }

    this.$nextTick(() => {
      this._initializing = false;
    });
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.updateChartDimensions);
    if (this._storageHandler) {
      window.removeEventListener('storage', this._storageHandler);
    }
    }
  };
</script>