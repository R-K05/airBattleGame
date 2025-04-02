<template>
  <div id="app">
    <game-canvas></game-canvas>
  </div>
</template>

<script>
import GameCanvas from './components/GameCanvas.vue'

export default {
  name: 'App',
  components: {
    GameCanvas
  }
}
</script>

<style>
#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style> 