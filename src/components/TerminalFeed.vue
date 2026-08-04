<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { extractCoreIntel } from '../lib/rewardParser.js'

const props = defineProps({
  solvedList: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 9,
  },
})

const emit = defineEmits(['openInfo'])

const intelEntries = computed(() => {
  const isFiveSolved = props.solvedList.length >= 5
  const hasTaskZero = props.solvedList.some((item) => String(item.id) === '0')

  let entries = []

  if (hasTaskZero) {
    entries = props.solvedList.map((item) => {
      if (String(item.id) === '0') {
        return {
          id: item.id,
          intel: isFiveSolved ? 'Additional info found' : 'Started locating the secret grill',
          isInfoLink: isFiveSolved,
        }
      }
      return {
        id: item.id,
        intel: extractCoreIntel(item.reward),
        isInfoLink: false,
      }
    })
  } else if (isFiveSolved) {
    entries = [
      {
        id: 0,
        intel: 'Additional info found',
        isInfoLink: true,
      },
      ...props.solvedList.map((item) => ({
        id: item.id,
        intel: extractCoreIntel(item.reward),
        isInfoLink: false,
      })),
    ]
  } else {
    entries = props.solvedList.map((item) => ({
      id: item.id,
      intel: extractCoreIntel(item.reward),
      isInfoLink: false,
    }))
  }

  if (props.solvedList.length > 0 && props.solvedList.length >= props.totalCount) {
    entries.push({
      id: 'all-completed',
      intel: 'All secrets found! A shot of jallu (or ginger shot) earned in the event',
      isInfoLink: false,
    })
  }

  return entries
})

const typedOutputs = ref({})

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
        <template v-if="entry.isInfoLink && (typedOutputs[entry.id] === undefined || typedOutputs[entry.id] === entry.intel)">
          Additional
          <button
            type="button"
            class="text-emerald-200 hover:text-emerald-100 font-semibold underline cursor-pointer transition-colors focus:outline-none"
            @click="emit('openInfo')"
          >
            info
          </button>
          found
        </template>
        <template v-else>
          {{ typedOutputs[entry.id] !== undefined ? typedOutputs[entry.id] : entry.intel }}
        </template>
      </span>
    </div>
  </div>
</template>
