<script setup>
defineProps({
  puzzle: {
    type: Object,
    required: true,
  },
})

const openPuzzle = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <button
    type="button"
    class="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-white text-3xl sm:text-4xl font-semibold tabular-nums text-black transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    @click="openPuzzle(puzzle.url)"
  >
    {{ puzzle.id }}
  </button>
</template>
