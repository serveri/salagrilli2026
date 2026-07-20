<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { tryUnlock } from '../lib/challenge.js'
import { useProgress } from '../composables/useProgress.js'

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const { isSolved, rewardFor, markSolved } = useProgress()

const flag = ref('')
const status = ref('idle') // 'idle' | 'checking' | 'wrong'
const inputEl = ref(null)

const open = computed(() => Boolean(props.item))
const solved = computed(() => (props.item ? isSolved(props.item.id) : false))
const reward = computed(() => (props.item ? rewardFor(props.item.id) : null))

// Reset transient state whenever a different task is opened, and focus the input.
watch(
  () => props.item?.id,
  (id) => {
    flag.value = ''
    status.value = 'idle'
    if (id != null && !solved.value) {
      nextTick(() => inputEl.value?.focus())
    }
  },
)

// Close on Escape regardless of what's focused. The solved view has no focusable
// field, so a listener bound to the dialog element alone would miss the key.
function onKeydown(event) {
  if (event.key === 'Escape') close()
}
watch(
  open,
  (isOpen) => {
    if (isOpen) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function submit() {
  if (!props.item || status.value === 'checking') return
  const candidate = flag.value.trim()
  if (!candidate) return

  status.value = 'checking'
  const result = await tryUnlock(props.item.challenge, candidate)
  if (result.ok) {
    markSolved(props.item.id, result.reward)
    status.value = 'idle'
    flag.value = ''
  } else {
    status.value = 'wrong'
  }
}

function openTask() {
  if (props.item) {
    window.open(props.item.url, '_blank', 'noopener,noreferrer')
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="`Task ${item.id}`"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

      <div
        class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-900 p-7 text-white shadow-2xl"
      >
        <button
          type="button"
          class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
          @click="close"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>

        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold tabular-nums"
            :class="solved ? 'bg-emerald-500 text-white' : 'bg-white text-black'"
          >
            {{ item.id }}
          </span>
          <h2 class="text-lg font-semibold">Task {{ item.id }}</h2>
        </div>

        <button
          type="button"
          class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          @click="openTask"
        >
          Open task
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <!-- Solved: show the revealed reward -->
        <div v-if="solved" class="mt-6">
          <div class="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Solved
          </div>
          <div class="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
            {{ reward }}
          </div>
        </div>

        <!-- Unsolved: flag entry -->
        <form v-else class="mt-6" @submit.prevent="submit">
          <label :for="`flag-${item.id}`" class="block text-sm text-white/60">
            Enter the flag you found
          </label>
          <input
            :id="`flag-${item.id}`"
            ref="inputEl"
            v-model="flag"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="SALA{…}"
            class="mt-2 w-full rounded-xl border bg-black/40 px-4 py-2.5 font-mono text-sm text-white placeholder-white/30 outline-none transition focus:border-white/40"
            :class="status === 'wrong' ? 'border-red-500/70' : 'border-white/15'"
            @input="status = 'idle'"
          />
          <p v-if="status === 'wrong'" class="mt-2 text-sm text-red-400">
            That's not the right flag. Keep trying!
          </p>
          <button
            type="submit"
            class="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            :disabled="status === 'checking' || !flag.trim()"
          >
            {{ status === 'checking' ? 'Checking…' : 'Submit flag' }}
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
