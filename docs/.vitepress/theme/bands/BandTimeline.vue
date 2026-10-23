<script setup lang="ts">
import { withBase } from "vitepress"

// Axios releases matching ^1.7.2 on 2026-10-23 (docs/shots/why-number.sh), plus 1.14.1: published
// by an attacker on 2026-03-31 and removed after about three hours (docs/why-pin.md).
const compromised = "1.14.1"
const versions = ["1.7.2","1.7.3","1.7.4","1.7.5","1.7.6","1.7.7","1.7.8","1.7.9","1.8.0","1.8.1","1.8.2","1.8.3","1.8.4","1.9.0","1.10.0","1.11.0","1.12.0","1.12.1","1.12.2","1.13.0","1.13.1","1.13.2","1.13.3","1.13.4","1.13.5","1.13.6","1.14.0","1.14.1","1.15.0","1.15.1","1.15.2","1.16.0","1.16.1","1.17.0","1.18.0","1.18.1","1.19.0","1.20.0"]
</script>

<template>
  <div class="timeline">
    <div class="label">
      <h2>Why</h2>
      <p>What <code>npm ci</code> may install for axios today.</p>
      <a :href="withBase('/why-pin')">Why pin →</a>
    </div>
    <div class="chart" role="img" aria-label="The range ^1.7.2 matches 37 published axios versions, from 1.7.2 to 1.20.0. It also matched 1.14.1, published by an attacker on March 31, 2026 and removed after about three hours. The pin 1.7.2 matches one.">
      <div class="row range">
        <code>"^1.7.2"</code>
        <div class="ticks">
          <i v-for="v in versions" :key="v" :class="{ bad: v === compromised }" :title="v" />
        </div>
        <span class="count"><strong>37</strong> today</span>
        <span class="flag" :style="{ '--at': versions.indexOf(compromised) }">1.14.1 · RAT · 3 hours</span>
      </div>
      <div class="row pin">
        <code>"1.7.2"</code>
        <div class="ticks">
          <i v-for="(v, index) in versions" :key="v" :class="{ on: index === 0 }" :title="v" />
        </div>
        <span class="count"><strong>1</strong> version</span>
      </div>
      <div class="axis"><span>1.7.2</span><span>1.20.0</span></div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
}
.label {
  padding: 20px 32px;
  border-right: 1px solid var(--cd-ui-linie);
}
.label h2 {
  margin: 0 0 6px;
  padding: 0;
  border: 0;
  font: 500 12px/20px var(--vp-font-family-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cd-ui-text-leise);
}
.label p {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 22px;
}
.label a {
  font-weight: 600;
  color: var(--cd-ui-link);
  text-decoration: none;
}
.chart {
  padding: 24px 32px 16px;
}
.row {
  display: grid;
  grid-template-columns: 96px 1fr 110px;
  align-items: center;
  gap: 20px;
  height: 44px;
}
.row code {
  font: 400 14px/1 var(--vp-font-family-mono);
}
.ticks {
  display: grid;
  grid-template-columns: repeat(38, 1fr);
  gap: 3px;
  height: 28px;
}
.ticks i {
  border-radius: 2px;
}
.range .ticks i {
  background: var(--cd-ui-text);
}
.range .ticks i.bad {
  background: var(--cd-ui-danger);
}
.range {
  position: relative;
}
.flag {
  position: absolute;
  top: -14px;
  left: calc(116px + (100% - 246px) * (var(--at) + 0.5) / 38);
  transform: translateX(-50%);
  font: 500 11px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-danger);
  white-space: nowrap;
}
.pin .ticks i {
  background: var(--cd-ui-linie);
}
.pin .ticks i.on {
  background: var(--cd-ui-interaktion);
}
.count {
  font-size: 14px;
  color: var(--cd-ui-text-leise);
}
.count strong {
  font-size: 22px;
  font-weight: 700;
  color: var(--cd-ui-text);
}
.axis {
  display: flex;
  justify-content: space-between;
  margin: 6px 130px 0 116px;
  font: 400 12px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
@media (max-width: 959px) {
  .timeline {
    grid-template-columns: 1fr;
  }
  .label {
    border-right: 0;
    border-bottom: 1px solid var(--cd-ui-linie);
  }
  .row {
    grid-template-columns: 72px 1fr 70px;
    gap: 10px;
  }
  .ticks {
    gap: 1px;
  }
  .axis {
    margin: 6px 80px 0 82px;
  }
}
</style>
