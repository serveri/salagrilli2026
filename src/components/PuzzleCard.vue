<script setup>
defineProps({
  puzzle: {
    type: Object,
    required: true,
  },
  solved: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open'])
</script>

<template>
  <button
    type="button"
    class="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full text-3xl sm:text-4xl font-semibold tabular-nums transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    :class="solved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-black'"
    :aria-label="solved ? `Task ${puzzle.id}, solved` : `Task ${puzzle.id}`"
    @click="emit('open', puzzle)"
  >
    {{ puzzle.id }}
    <span
      v-if="solved"
      class="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-emerald-500 text-white sm:h-8 sm:w-8"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>
</template>
