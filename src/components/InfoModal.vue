<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const lang = ref('EN')

const FI_B64 =
  'TGlzw6R0aWV0b2phIHRhcGFodHVtYXN0YTogSGllbm9hISBPbGV0IGpvIG9ubmlzdHVudXQgcmF0a29tYWFuIHVzZWFtbWFuIHRlaHTDpHbDpG4uIFRlaHTDpHZpc3TDpCBzYWF0IHNlbHZpbGxlIHRhcGFodHVtYXBhaWthbiwgamEgZ3JpbGxpZW4gdGFya2FuIGFsa2FtaXNhamFuLiBWb2l0IG90dGFhIGhhbHV0ZXNzYXNpIG11a2FhbiBpc3R1aW5hbHVzdGFuIHRhaSBvbWFhIGdyaWxsYXR0YXZhYSBldsOkc3TDpC4gU2VydmVyaSB0YXJqb2FhIG1ha2thcmF0LiBKb3MgYXZhc2l0IGxpc8OkcGFsa2lubm9uLCBzYWF0IHNlbiB0YXBhaHR1bWFwYWlrYWxsYSBncmlsbGltYWlzdGVyZWlsdGEuIE15w7ZzIHVpbWFrYW1hdCBzYWEgb3R0YWEgbXVrYWFuIGhhbHV0ZXNzYWFuIGphIGtlbGluIHN1b3NpZXNzYS4='

const EN_B64 =
  'QWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZXZlbnQ6IEdyZWF0IGpvYiEgWW91IGhhdmUgYWxyZWFkeSBzdWNjZWVkZWQgaW4gc29sdmluZyBtdWx0aXBsZSB0YXNrcy4gVGhlIHRhc2tzIHJldmVhbCB0aGUgZXZlbnQgbG9jYXRpb24gYW5kIGV4YWN0IHRpbWUuIFlvdSBtYXkgYnJpbmcgYSBwaWNuaWMgbWF0L3NlYXQgb3IgeW91ciBvd24gZm9vZCB0byBncmlsbCBpZiB5b3UgbGlrZS4gU2VydmVyaSBwcm92aWRlcyBzYXVzYWdlcy4gSWYgeW91IHVubG9ja2VkIGEgYm9udXMgcmV3YXJkLCB5b3Ugd2lsbCByZWNlaXZlIGl0IGF0IHRoZSBldmVudCBsb2NhdGlvbiBmcm9tIHRoZSBncmlsbG1hc3RlcnMuIFlvdSBjYW4gYWxzbyBicmluZyBzd2ltd2VhciBpZiB5b3Ugd2lzaCBhbmQgd2VhdGhlciBpcyBnb29kLg=='

function decodeBase64(str) {
  try {
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

const content = computed(() => {
  return lang.value === 'FI' ? decodeBase64(FI_B64) : decodeBase64(EN_B64)
})

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

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
      aria-label="Secret grill info"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

      <div
        class="relative w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-7 text-white shadow-2xl"
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

        <div class="flex items-center justify-between pr-8">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white font-semibold"
            >
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <h2 class="text-lg font-semibold">Secret grill info</h2>
          </div>

          <div class="flex items-center rounded-full border border-white/15 bg-white/5 p-1 text-xs font-mono">
            <button
              type="button"
              class="px-2.5 py-1 rounded-full transition-colors"
              :class="lang === 'EN' ? 'bg-emerald-500 text-white font-semibold' : 'text-white/60 hover:text-white'"
              @click="lang = 'EN'"
            >
              EN
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-full transition-colors"
              :class="lang === 'FI' ? 'bg-emerald-500 text-white font-semibold' : 'text-white/60 hover:text-white'"
              @click="lang = 'FI'"
            >
              FI
            </button>
          </div>
        </div>

        <div class="mt-6 rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-sm leading-relaxed text-white/90 font-sans">
          {{ content }}
        </div>
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
