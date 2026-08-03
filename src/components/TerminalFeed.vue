<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { extractCoreIntel } from '../lib/rewardParser.js'

const props = defineProps({
  solvedList: {
    type: Array,
    default: () => [],
  },
})

// Parsed intel entries with core reward text extracted
const intelEntries = computed(() => {
  return props.solvedList.map((item) => ({
    id: item.id,
    intel: extractCoreIntel(item.reward),
  }))
})

// Typewriter state for newly unlocked rewards
const typedOutputs = ref({}) // { [taskId]: string }

function typeIntel(taskId, text) {
  if (typedOutputs.value[taskId] === text) return

  let currentLength = 0
  typedOutputs.value[taskId] = ''

  const timer = setInterval(() => {
    currentLength++
    typedOutputs.value[taskId] = text.slice(0, currentLength)

    if (currentLength >= text.length) {
      clearInterval(timer)
    }
  }, 25)
}

watch(
  intelEntries,
  (newEntries, oldEntries) => {
    const oldIds = new Set((oldEntries || []).map((e) => e.id))
    for (const entry of newEntries) {
      if (!oldIds.has(entry.id)) {
        typeIntel(entry.id, entry.intel)
      } else if (typedOutputs.value[entry.id] === undefined) {
        typedOutputs.value[entry.id] = entry.intel
      }
    }
  },
  { immediate: true, deep: true },
)

onMounted(() => {
  for (const entry of intelEntries.value) {
    typedOutputs.value[entry.id] = entry.intel
  }
})
</script>

<template>
  <div v-if="intelEntries.length > 0" class="w-full font-mono text-xs sm:text-sm text-emerald-400 space-y-1 text-left">
    <div
      v-for="entry in intelEntries"
      :key="entry.id"
      class="flex items-baseline gap-1.5"
    >
      <span class="text-emerald-500 font-semibold select-none">&gt;</span>
      <span class="text-emerald-300 font-mono tracking-wide">
        {{ typedOutputs[entry.id] !== undefined ? typedOutputs[entry.id] : entry.intel }}
      </span>
    </div>
  </div>
</template>
