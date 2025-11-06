<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="footer-icon">🐦</span>
        <span>© Wristo 2025</span>
      </div>
      <div class="footer-links">
        <a href="#">Terms of Use</a>
        <a href="#">Privacy Policy</a>
        <a href="mailto:support@wristo.io">support@wristo.io</a>
      </div>
      <div class="footer-right">
        <span>Wristo</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.footer {
  background: $color-footer-bg;
  padding: 8px 0;
  width: 100%;
  position: sticky;
  bottom: 0;
  left: 0;
  margin-top: auto;
  font-size: $font-size-xs;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  font-size: $font-size-sm;
  color: $color-footer-text;
}
.footer-left { display: flex; align-items: center; gap: 8px; }
.footer-icon { font-size: $font-size-sm; }
.footer-links { display: flex; gap: 18px; }
.footer-links a { color: $color-footer-text; text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: $color-success; }
.footer-right { font-weight: bold; color: $color-footer-text; }
</style>
