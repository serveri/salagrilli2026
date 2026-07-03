<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const script = document.createElement('script')
  script.src = '/chat-widget.js'
  script.dataset.puzzle = 'general'
  script.dataset.apiBase = import.meta.env.VITE_CHAT_API_BASE || 'https://salagrillitchat.serveriry.fi'
  script.defer = true
  document.body.appendChild(script)
})
</script>

<template></template>
