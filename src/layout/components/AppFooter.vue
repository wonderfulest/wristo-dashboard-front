<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <img class="footer-mark" src="https://cdn.wristo.io/brands/wristo-logo/svg/wristo-mark.svg" alt="" aria-hidden="true" />
        <span>© Wristo 2026</span>
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
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.8);
  padding: 14px 0;
  width: 100%;
  position: sticky;
  bottom: 0;
  left: 0;
  margin-top: auto;
  font-size: $font-size-xs;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 32px;
  font-size: $font-size-sm;
  color: $color-footer-text;
}
.footer-left { display: flex; align-items: center; gap: 10px; color: #4b5563; font-weight: 600; }
.footer-mark {
  width: 22px;
  height: 22px;
  padding: 3px;
  border: 1px solid rgba(25, 179, 107, 0.18);
  border-radius: 999px;
  background: #f0fdf7;
}
.footer-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
.footer-links a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  color: #4b5563;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.footer-links a:hover,
.footer-links a:focus-visible {
  background: rgba(25, 179, 107, 0.1);
  color: $color-success;
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 179, 107, 0.14);
}
.footer-right { font-weight: 700; color: #374151; }

@media (max-width: 768px) {
  .footer {
    position: static;
    padding: 16px 0;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }

  .footer-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 0 18px;
  }

  .footer-links {
    justify-content: flex-start;
  }
}
</style>
