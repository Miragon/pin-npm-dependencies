<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, provide, ref, watch } from "vue"
import LandingDemo from "./LandingDemo.vue"
import BandTimeline from "./bands/BandTimeline.vue"


const installs = [
  { name: "Repository", prompt: "", lines: ["- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2"] },
  {
    name: "Monorepo",
    prompt: "",
    lines: ["- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2", "  with:", "    root-path: packages/my-lib"],
  },
  {
    name: "Files",
    prompt: "",
    lines: ["- uses: miragon/pin-npm-dependencies@3f7f02fa2454cdd2cdb65df19b081c0d77d301a5 # v1.2.2", "  with:", "    files: packages/ui/package.json"],
  },
]
// Ground of the stage (landingpage.md, Variationsraum): "raster", "frei", "grau" or "schwarz".
const stage = "grau"
const status = { tone: "success", label: "v1.2.2", text: "npm, yarn and pnpm" }

const selected = ref(0)
const copied = ref(false)

// One clock per page (landingpage.md, Bewegung): the demo starts it and its Pause button stops
// everything. Only one side moves at a time: the demo plays one round, then the tabs switch through
// every channel once (6 s each), then the demo again. Hovering, focusing or choosing a tab stops the tabs.
const moving = ref(false)
provide("landing-moving", moving)
const turn = ref<"demo" | "tabs">("demo")
provide("landing-turn", turn)
const chosen = ref(false)
const held = ref(false)
const tabsCanMove = computed(() => !chosen.value && installs.length > 1)
const cycling = computed(() => moving.value && turn.value === "tabs" && tabsCanMove.value && !held.value)
let tick: ReturnType<typeof setInterval> | undefined
watch(cycling, (on) => {
  clearInterval(tick)
  if (on) tick = setInterval(nextTab, 6000)
})
watch([turn, tabsCanMove], () => {
  if (turn.value === "tabs" && !tabsCanMove.value) turn.value = "demo"
})
onBeforeUnmount(() => clearInterval(tick))

function nextTab() {
  step(1)
  if (selected.value === 0) turn.value = "demo"
}

function step(offset: number) {
  selected.value = (selected.value + offset + installs.length) % installs.length
}

function choose(index: number) {
  chosen.value = true
  selected.value = index
}

// Arrow keys move the selection and the focus together (ARIA tabs pattern).
const tabButtons = ref([] as HTMLButtonElement[])
async function selectBy(offset: number) {
  chosen.value = true
  step(offset)
  await nextTick()
  tabButtons.value[selected.value]?.focus()
}

async function copyInstall() {
  await navigator.clipboard.writeText(installs[selected.value].lines.join("\n"))
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="landing">
    <section class="hero">
      <div class="frame hero-frame">
        <div class="pitch">
          <h1>Every version, <span class="word">on purpose.</span></h1>
          <p class="lede">
            A GitHub Action that fails the build on ranges, floating tags and git branches in package.json,
            before the install step runs.
          </p>

          <div
            class="install"
            :class="{ cycling }"
            @mouseenter="held = true"
            @mouseleave="held = false"
            @focusin="held = true"
            @focusout="held = false"
          >
            <div class="tabs" role="tablist" aria-label="Install" @keydown.right.prevent="selectBy(1)" @keydown.left.prevent="selectBy(-1)">
              <button
                v-for="(install, index) in installs"
                :key="install.name"
                ref="tabButtons"
                class="tab"
                role="tab"
                :aria-selected="index === selected"
                :tabindex="index === selected ? 0 : -1"
                @click="choose(index)"
              >
                {{ install.name }}
              </button>
            </div>
            <div class="command" role="tabpanel">
              <div class="panels">
                <pre
                  v-for="(install, index) in installs"
                  :key="install.name"
                  :class="{ hidden: index !== selected }"
                  :aria-hidden="index !== selected"
                ><template v-for="line in install.lines" :key="line"><span v-if="install.prompt" class="prompt">{{ install.prompt }} </span>{{ line }}
</template></pre>
              </div>
              <button class="copy" type="button" @click="copyInstall">{{ copied ? "Copied" : "Copy" }}</button>
            </div>
          </div>
          <p class="meta">
            <span>GitHub Actions · node24 runtime</span>
            <span class="pre-release">
              <span class="marker" :class="status.tone" aria-hidden="true" />
              <span><strong>{{ status.label }}</strong> {{ status.text }}</span>
            </span>
          </p>
        </div>

        <div class="stage" :class="stage" :data-cd-theme="stage === 'schwarz' ? 'dark' : undefined">
          <LandingDemo />
        </div>
      </div>
    </section>

    <section class="loop" aria-label="Why pin">
      <div class="frame">
        <BandTimeline />
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  --gutter: 32px;
  --line: 1px solid var(--cd-ui-linie);
  display: flex;
  flex-direction: column;
  border-top: var(--line);
}

/* The frame lines up with the navigation bar above it. */
.frame {
  width: 100%;
  max-width: var(--vp-layout-max-width);
  margin: 0 auto;
}
@media (min-width: 1441px) {
  .frame {
    border-right: var(--line);
    border-left: var(--line);
  }
}

/* Hero: name, install and status on the left, the demo on the right, split 50/50. */
.hero {
  flex: 1;
  display: flex;
  min-height: 0;
}
.hero-frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.pitch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px var(--gutter);
  border-bottom: var(--line);
}
h1 {
  margin: 0;
  font-size: clamp(56px, 8.4vh, 80px);
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.045em;
}
h1 {
  text-wrap: balance;
}
h1 .word {
  color: var(--cd-ui-link);
  white-space: nowrap;
}
.lede {
  max-width: 40ch;
  margin: 16px 0 0;
  font-size: 20px;
  line-height: 1.45;
  letter-spacing: -0.01em;
  text-wrap: pretty;
}

.install {
  margin-top: 28px;
  border: var(--line);
  border-radius: var(--cd-radius-sm);
  background: var(--cd-ui-abschnitt);
}
.tabs {
  display: flex;
  border-bottom: var(--line);
}
.tab {
  position: relative;
  padding: 11px 14px;
  border-right: var(--line);
  font: 500 13px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
.tab:first-child {
  border-top-left-radius: var(--cd-radius-sm);
}
.tab[aria-selected="true"] {
  color: var(--cd-ui-text);
  background: var(--cd-ui-seite);
}
.tab[aria-selected="true"]::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--cd-ui-interaktion);
  transform-origin: left;
}
/* While the tabs switch on their own, the line under the active tab fills in the 6 s. */
.cycling .tab[aria-selected="true"]::after {
  animation: fill 6s linear;
}
@keyframes fill {
  from {
    transform: scaleX(0);
  }
}
.command {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 12px 12px 16px;
}
/* Every channel sits in the same cell, so the box keeps the height of the longest and the pitch never moves. */
.panels {
  display: grid;
  flex: 1;
  min-width: 0;
}
.command pre {
  grid-area: 1 / 1;
  min-width: 0;
  margin: 0;
  font: 400 14px/1.7 var(--vp-font-family-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.command pre.hidden {
  visibility: hidden;
}
.command .prompt {
  color: var(--cd-ui-text-leise);
  user-select: none;
}
.copy {
  flex: none;
  height: 32px;
  padding: 0 10px;
  border: var(--line);
  border-radius: var(--cd-radius-sm);
  font: 500 12px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text);
}
.copy:hover {
  background: var(--cd-ui-hover);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--cd-ui-text-leise);
}
.meta > span:first-child {
  font: 400 12px/1.5 var(--vp-font-family-mono);
}
.pre-release {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cd-ui-text);
}
.pre-release strong {
  font: 500 12px/1 var(--vp-font-family-mono);
}
.marker {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--cd-ui-warning);
}
.marker.success {
  background: var(--cd-ui-success);
}

/* The demo stands on a quiet grid, the drawing surface of a modeler. */
.stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 32px var(--gutter);
}
.stage.raster {
  background-image:
    linear-gradient(var(--cd-ui-linie) 1px, transparent 1px),
    linear-gradient(90deg, var(--cd-ui-linie) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: -1px -1px;
}
.stage.grau {
  padding: 48px var(--gutter);
  background: var(--cd-ui-abschnitt);
}
.stage.frei :deep(.window) {
  border-color: var(--cd-ui-kontur);
}
.stage.schwarz {
  background: var(--cd-ui-seite);
  color: var(--cd-ui-text);
}

.loop {
  flex: none;
  border-top: var(--line);
}

@media (min-width: 960px) {
  .hero-frame {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  }
  .pitch {
    border-right: var(--line);
    border-bottom: 0;
  }
}

/* One screen on desktop: navigation, hero, loop and the legal row (53px) fill the viewport; on a
   short screen the page grows and scrolls instead of squeezing the hero. */
@media (min-width: 960px) and (min-height: 700px) {
  .landing {
    min-height: calc(100dvh - var(--vp-nav-height) - 53px);
  }
  .pitch {
    padding-top: 20px;
    padding-bottom: 20px;
  }
  h1 {
    font-size: clamp(48px, 7vh, 72px);
  }
  .lede {
    margin-top: 14px;
  }
  .install {
    margin-top: 14px;
  }
  .command pre {
    font-size: 13px;
  }
  .stage.grau {
    padding: 24px var(--gutter);
  }
  .stage :deep(.terminal) {
    min-height: 0;
  }
  .stage :deep(.file pre) {
    font-size: 14px;
    line-height: 1.6;
  }
}

@media (max-width: 640px) {
  .landing {
    --gutter: 20px;
  }
  .pitch {
    padding: 44px var(--gutter) 40px;
  }
  h1 {
    font-size: clamp(36px, 11.5vw, 56px);
  }
  .lede {
    font-size: 18px;
  }
  .stage {
    padding: 24px 12px;
  }
  .command {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  .panels,
  .command pre {
    width: 100%;
  }
  .command pre {
    font-size: 12px;
  }
  .copy {
    align-self: flex-end;
  }
}
</style>
