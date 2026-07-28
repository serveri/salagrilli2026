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
    class="flex h-24 w-24 sm:h-32 sm:w-32 xl:h-28 xl:w-28 items-center justify-center rounded-full text-3xl sm:text-4xl xl:text-3xl font-semibold tabular-nums transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    :class="solved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-black'"
    :aria-label="solved ? `Task ${puzzle.id}, solved` : `Task ${puzzle.id}`"
    @click="emit('open', puzzle)"
  >
    {{ puzzle.id }}
  </button>
</template>
