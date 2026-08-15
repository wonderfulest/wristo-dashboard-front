<template>
  <section class="control-bar" aria-label="首页数据筛选">
    <div>
      <div class="eyebrow">OPERATIONS PULSE</div>
      <h1>业务仪表盘</h1>
      <p>聚焦经营结果与今天需要处理的事项</p>
    </div>
  </section>
</template>

<style scoped>
.control-bar { display: flex; justify-content: space-between; gap: 24px; padding: 22px 24px; border: 1px solid #dfe9e4; border-radius: 16px; background: linear-gradient(120deg, #f2faf6 0%, #fff 58%); box-shadow: 0 10px 30px rgba(28, 79, 55, .06); }
.eyebrow { color: #168456; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 4px 0 2px; font-size: 25px; color: #173c2b; }
p { margin: 0; color: #708078; font-size: 13px; }
@media (max-width: 768px) { .control-bar { padding: 18px; } }
</style>
