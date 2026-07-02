<script setup>
import { onMounted, ref } from 'vue'
import PuzzleCard from './components/PuzzleCard.vue'
import { puzzles } from './data/puzzles.js'

const mounted = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-black">
    <header
      class="absolute left-0 top-0 p-6 sm:p-8"
      :class="mounted ? 'animate-fade-up' : 'opacity-0'"
    >
      <a
        href="https://serveriry.fi/"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block transition-transform duration-700 hover:scale-105"
      >
        <img
          src="/logo.svg"
          alt="5@l@gr1ll1 logo"
          class="h-16 w-16 sm:h-20 sm:w-20 invert"
        />
      </a>
    </header>

    <main class="flex min-h-screen items-center justify-center px-6">
      <section
        class="flex flex-nowrap justify-center gap-6 sm:gap-10"
        :class="mounted ? 'animate-fade-in' : 'opacity-0'"
        style="animation-delay: 200ms"
      >
        <div
          v-for="(puzzle, index) in puzzles"
          :key="puzzle.id"
          :class="mounted ? 'animate-fade-up opacity-0' : 'opacity-0'"
          :style="{
            animationDelay: `${index * 100 + 400}ms`,
            animationFillMode: 'forwards',
          }"
        >
          <PuzzleCard :puzzle="puzzle" />
        </div>
      </section>
    </main>
  </div>
</template>
