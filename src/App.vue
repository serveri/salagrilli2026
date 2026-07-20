<script setup>
import { computed, onMounted, ref } from 'vue'
import PuzzleCard from './components/PuzzleCard.vue'
import PuzzleModal from './components/PuzzleModal.vue'
import ChatWidgetLoader from './components/ChatWidgetLoader.vue'
import { puzzles } from './data/puzzles.js'
import { challenges } from './data/challenges.js'
import { useProgress } from './composables/useProgress.js'

const { isSolved, solvedCount } = useProgress()

// Merge each puzzle with its precomputed challenge (salt/iv/ciphertext) so a card
// carries everything the modal needs to validate a flag client-side.
const challengeById = new Map(challenges.map((c) => [c.id, c]))
const items = puzzles.map((puzzle) => ({
  ...puzzle,
  challenge: challengeById.get(puzzle.id) ?? null,
}))

const activeId = ref(null)
const activeItem = computed(() => items.find((item) => item.id === activeId.value) ?? null)

const mounted = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-black">
    <ChatWidgetLoader />

    <header
      class="absolute left-0 top-0 flex w-full items-center justify-between p-6 sm:p-8"
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

      <span class="font-mono text-sm tabular-nums text-white/50">
        {{ solvedCount }} / {{ items.length }}
      </span>
    </header>

    <main class="flex min-h-screen items-center justify-center px-6 py-28 sm:py-16">
      <section
        class="flex flex-col lg:flex-row flex-wrap justify-center gap-6 sm:gap-10"
        :class="mounted ? 'animate-fade-in' : 'opacity-0'"
        style="animation-delay: 200ms"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id"
          :class="mounted ? 'animate-fade-up opacity-0' : 'opacity-0'"
          :style="{
            animationDelay: `${index * 100 + 400}ms`,
            animationFillMode: 'forwards',
          }"
        >
          <PuzzleCard :puzzle="item" :solved="isSolved(item.id)" @open="activeId = item.id" />
        </div>
      </section>
    </main>

    <PuzzleModal :item="activeItem" @close="activeId = null" />
  </div>
</template>
