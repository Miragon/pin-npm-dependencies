<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue"

// Archetype "lint on files": one package.json, two real runs of the action (docs/shots/landing-demo.sh).
// First with a range and a branch ref, then pinned. The demo ends on the clean run, never on the error.
const command = "git push"
const runs = [
  {
    file: [
      { key: "axios", value: "^1.7.2", state: "bad" },
      { key: "react", value: "18.3.1", state: "" },
      { key: "ui-kit", value: "github:acme/ui-kit#main", state: "bad" },
    ],
    output: [
      { text: 'Checking "package.json" for pinned versions...', tone: "quiet" },
      { text: '::error file=package.json::axios: "^1.7.2" — caret/tilde range; use exact version "1.7.2"', tone: "error" },
      {
        text: '::error file=package.json::ui-kit: "github:acme/ui-kit#main" — mutable git branch ref; pin to a commit SHA (e.g. \"git+https://github.com/owner/repo.git#abc1234\")',
        tone: "error",
      },
      { text: '2 unpinned version(s) found. Use exact versions (e.g. "1.2.3" not "^1.2.3").', tone: "" },
    ],
  },
  {
    file: [
      { key: "axios", value: "1.7.2", state: "good" },
      { key: "react", value: "18.3.1", state: "" },
      { key: "ui-kit", value: "github:acme/ui-kit#4f2c9e1", state: "good" },
    ],
    output: [
      { text: 'Checking "package.json" for pinned versions...', tone: "quiet" },
      { text: "  ✓ package.json", tone: "quiet" },
      { text: "✓ All dependencies across 1 file(s) are pinned.", tone: "accent" },
    ],
  },
]

// The first paint (and reduced motion) shows the end state: the pinned file and the clean run.
const runIndex = ref(runs.length - 1)
const typedChars = ref(command.length)
const shownLines = ref(runs[runIndex.value].output.length)
const typing = ref(false)
const run = computed(() => runs[runIndex.value])
// The clock of the page (HomeLanding.vue): Pause here also stops the switching tabs.
const moving = inject("landing-moving", ref(false))
// Only one side of the page moves at a time: after one round the demo hands over to the tabs.
const turn = inject("landing-turn", ref<"demo" | "tabs">("demo"))
watch(turn, (current) => {
  if (current === "demo" && moving.value) after(600, () => play(0))
})

let timer: ReturnType<typeof setTimeout> | undefined
const after = (ms: number, step: () => void) => {
  timer = setTimeout(step, ms)
}

function play(index: number) {
  runIndex.value = index
  typedChars.value = 0
  shownLines.value = 0
  typing.value = true
  after(700, typeCommand)
}

function typeCommand() {
  if (typedChars.value < command.length) {
    typedChars.value += 1
    return after(32, typeCommand)
  }
  typing.value = false
  after(350, showOutput)
}

function showOutput() {
  if (shownLines.value < run.value.output.length) {
    shownLines.value += 1
    return after(260, showOutput)
  }
  if (runIndex.value < runs.length - 1) return after(3000, () => play(runIndex.value + 1))
  after(3000, () => (turn.value = "tabs"))
}

// WCAG 2.2.2: a loop that starts on its own needs a way to stop it. Stopping shows the end state.
function toggle() {
  clearTimeout(timer)
  moving.value = !moving.value
  if (moving.value) {
    if (turn.value === "tabs") turn.value = "demo"
    else after(600, () => play(0))
    return
  }
  runIndex.value = runs.length - 1
  typedChars.value = command.length
  shownLines.value = run.value.output.length
  typing.value = false
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  moving.value = true
  after(3500, () => play(0))
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure
    class="window"
    aria-label="The action fails on a caret range and a branch ref in package.json, and passes once both are pinned."
  >
    <div class="titlebar">
      <span class="dots" aria-hidden="true"><i /><i /><i /></span>
      <span>Enforce pinned dependencies</span>
      <span class="run">{{ runIndex === 0 ? "run 1 · failed" : "run 2 · passed" }}</span>
      <button class="toggle" type="button" :aria-pressed="!moving" @click="toggle">{{ moving ? "Pause" : "Play" }}</button>
    </div>
    <div class="file">
      <p class="filename">package.json</p>
      <pre><span class="quiet">"dependencies": {</span>
<template v-for="line in run.file" :key="line.key"><span class="entry" :class="line.state">  <span class="quiet">"{{ line.key }}":</span> <span class="value">"{{ line.value }}"</span></span>
</template><span class="quiet">}</span></pre>
    </div>
    <div class="terminal">
      <p class="line"><span class="prompt">$ </span>{{ command.slice(0, typedChars) }}<span v-if="typing" class="caret" aria-hidden="true" /></p>
      <p
        v-for="(line, index) in run.output"
        :key="`${runIndex}-${index}`"
        class="line"
        :class="[line.tone, { pending: shownLines <= index }]"
      >{{ line.text }}</p>
    </div>
  </figure>
</template>

<style scoped>
.window {
  width: 100%;
  margin: 0;
  border: 1px solid var(--cd-ui-linie);
  border-radius: var(--cd-radius-md);
  background: var(--cd-ui-seite);
  color: var(--cd-ui-text);
  overflow: hidden;
}

.titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--cd-ui-linie);
  font: 500 13px/1 var(--vp-font-family-mono);
}
.run {
  color: var(--cd-ui-text-leise);
}
.toggle {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: var(--cd-radius-sm);
  font: 500 11px/1 var(--vp-font-family-mono);
  color: var(--cd-ui-text-leise);
}
.toggle:hover {
  background: var(--cd-ui-hover);
  color: var(--cd-ui-text);
}
.dots {
  display: flex;
  gap: 6px;
}
.dots i {
  width: 9px;
  height: 9px;
  border: 1px solid var(--cd-ui-kontur);
  border-radius: 50%;
}

.file {
  padding: 16px 0 18px;
  border-bottom: 1px solid var(--cd-ui-linie);
}
.filename {
  margin: 0 0 10px;
  padding: 0 18px;
  font: 500 11px/1 var(--vp-font-family-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--cd-ui-text-leise);
}
.file pre {
  margin: 0;
  padding: 0 18px;
  font: 400 15px/1.75 var(--vp-font-family-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.entry {
  display: inline-block;
  width: calc(100% + 36px);
  margin: 0 -18px;
  padding: 0 18px 0 16px;
  border-left: 2px solid transparent;
  transition: background var(--cd-motion-fast) var(--cd-ease);
}
.entry.bad {
  border-left-color: var(--cd-ui-danger);
  background: var(--cd-ui-danger-flaeche);
}
.entry.bad .value {
  color: var(--cd-ui-danger);
}
.entry.good {
  border-left-color: var(--cd-ui-success);
  background: var(--cd-ui-success-flaeche);
}

.terminal {
  min-height: 168px;
  padding: 16px 18px;
  background: var(--cd-ui-flaeche);
  font: 400 12px/1.65 var(--vp-font-family-mono);
}
.line {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.line.pending {
  visibility: hidden;
}
.quiet {
  color: var(--cd-ui-text-leise);
}
.error {
  color: var(--cd-ui-danger);
}
.accent {
  margin-top: 8px;
  font-weight: 600;
  color: var(--cd-ui-link);
}
.prompt {
  color: var(--cd-ui-text-leise);
  user-select: none;
}
.caret {
  display: inline-block;
  width: 7px;
  height: 14px;
  margin-left: 1px;
  vertical-align: -2px;
  background: var(--cd-ui-text);
}

@media (prefers-reduced-motion: reduce) {
  .entry {
    transition: none;
  }
}
</style>
