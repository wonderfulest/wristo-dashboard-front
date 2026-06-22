<template>
  <footer class="footer">
    <div class="footer-main desktop-layout">
      <div class="footer-brand">
        <img class="footer-mark" src="https://cdn.wristo.io/brands/wristo-logo/svg/wristo-mark.svg" alt="" aria-hidden="true" />
        <span>© Wristo 2026</span>
      </div>
      <nav class="footer-nav" aria-label="Footer links">
        <a href="#">Terms of Use</a>
        <a href="#">Privacy Policy</a>
        <a href="mailto:support@wristo.io">support@wristo.io</a>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.footer {
  color: $color-footer-text;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.8);
  padding: 14px 16px;
  width: 100%;
  position: relative;
  bottom: 0;
  left: 0;
  margin-top: auto;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
  text-align: center;
  outline: none;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.3s ease;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.footer-main {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: #4b5563;
  font-size: 0.95rem;
  letter-spacing: 0;
}
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #374151;
  font-weight: 700;
}
.footer-mark {
  width: 22px;
  height: 22px;
  padding: 3px;
  border: 1px solid rgba(15, 107, 104, 0.18);
  border-radius: 999px;
  background: #dff5f1;
}
.footer-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-nav a {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  color: #4b5563;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  margin: 0;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.footer-nav a:hover,
.footer-nav a:focus-visible {
  background: rgba(15, 107, 104, 0.1);
  color: #064e4b;
  outline: none;
  box-shadow: 0 0 0 3px rgba(15, 107, 104, 0.14);
}

@media (max-width: 768px) {
  .footer {
    z-index: 100;
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.96);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -10px 24px rgba(17, 24, 39, 0.08);
    padding: 12px 16px max(12px, env(safe-area-inset-bottom));
    min-height: auto;
    margin-top: 32px;
  }

  .footer-main {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .footer-brand {
    font-size: 0.9rem;
  }

  .footer-nav {
    justify-content: center;
  }
}
</style>
