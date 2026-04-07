<template>
  <div class="timeline-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">购入时间轴</h2>
        <span class="page-subtitle">共 {{ timelineData.length }} 条记录</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="timelineData.length === 0">
      <n-icon :component="TimeOutline" size="40" />
      <p>暂无资产记录</p>
    </div>

    <!-- 时间轴 -->
    <div class="timeline-wrap" v-else>
      <div
        class="timeline-item"
        v-for="(item, index) in timelineData"
        :key="item.id"
        :style="{ animationDelay: `${index * 0.04}s` }"
        @click="showDetail(item)"
      >
        <!-- 轴线 -->
        <div class="timeline-axis">
          <div class="axis-dot" :class="getStatusClass(item)"></div>
          <div class="axis-line" v-if="index < timelineData.length - 1"></div>
        </div>

        <!-- 内容 -->
        <div class="timeline-body">
          <div class="timeline-date">{{ formatDate(item.buy_date) }}</div>
          <div class="timeline-card">
            <div class="tl-card-top">
              <span class="tl-name">{{ item.name }}</span>
              <span class="tl-status" :class="getStatusClass(item)">{{ getActualStatusText(item) }}</span>
            </div>
            <div class="tl-info-row">
              <span class="tl-category">{{ item.category }}</span>
              <span class="tl-price mono">¥{{ item.buy_price.toFixed(0) }}</span>
            </div>
            <div class="tl-days">已持有 {{ getHoldDays(item) }} 天</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'Timeline' }
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { TimeOutline } from '@vicons/ionicons5';
import { NIcon } from "naive-ui";

const store = useAssetStore();

const timelineData = computed(() =>
  [...store.assetList].sort((a: any, b: any) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime())
);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年 ${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
};

const getHoldDays = (item: any) => {
  const today = new Date();
  return Math.max(1, Math.floor((today.getTime() - new Date(item.buy_date).getTime()) / 86400000));
};

const getStatusClass = (item: any) => {
  if (item.warranty_date && new Date(item.warranty_date) >= new Date()) return 'st-ok';
  const map: Record<number, string> = { 0: 'st-ok', 1: 'st-active', 2: 'st-retired', 3: 'st-used', 4: 'st-sold' };
  return map[item.status] || 'st-default';
};

const getActualStatusText = (item: any) => {
  const textMap: Record<number, string> = { 0: '保障中', 1: '活跃中', 2: '已退役', 3: '已用完', 4: '已售出' };
  if (item.warranty_date && new Date(item.warranty_date) >= new Date()) return '保障中';
  return textMap[item.status] || '未知';
};

const showDetail = (item: any) => {
  store.currentAsset = item;
  store.showDetailModal = true;
};
</script>

<style scoped>
.timeline-page { display: flex; flex-direction: column; gap: 20px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left { display: flex; flex-direction: column; gap: 2px; }

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-main);
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: var(--color-text-muted);
  gap: 12px;
  background: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.empty-state p { margin: 0; font-size: 14px; }

/* 时间轴 */
.timeline-wrap {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.timeline-item {
  display: flex;
  gap: 0;
  animation: fadeSlideIn 0.35s ease-out both;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* 轴 */
.timeline-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
  padding-top: 4px;
}

.axis-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2.5px solid var(--color-surface);
  box-shadow: 0 0 0 2px currentColor;
  flex-shrink: 0;
  z-index: 1;
}

.st-ok { color: var(--color-success); }
.st-active { color: var(--color-primary); }
.st-retired { color: var(--color-warning); }
.st-used { color: var(--color-danger); }
.st-sold { color: var(--color-text-muted); }
.st-default { color: var(--color-text-muted); }

.axis-line {
  width: 2px;
  flex: 1;
  min-height: 20px;
  background: var(--color-border);
  margin: 4px 0;
}

/* 内容区 */
.timeline-body {
  flex: 1;
  padding: 0 0 20px 16px;
  min-width: 0;
}

.timeline-date {
  font-size: 11.5px;
  color: var(--color-text-muted);
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: 0.03em;
}

.timeline-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.timeline-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(59,111,212,0.1);
  transform: translateX(4px);
}

.tl-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tl-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tl-status.st-ok { background: #edfaf3; color: var(--color-success); }
.tl-status.st-active { background: var(--color-primary-soft); color: var(--color-primary); }
.tl-status.st-retired { background: #fef6ea; color: var(--color-warning); }
.tl-status.st-used { background: #fdf0f0; color: var(--color-danger); }
.tl-status.st-sold { background: var(--color-bg); color: var(--color-text-muted); }
.tl-status.st-default { background: var(--color-bg); color: var(--color-text-muted); }

.tl-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tl-category {
  font-size: 12.5px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 5px;
}

.tl-price {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-main);
}

.tl-days {
  font-size: 12px;
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .timeline-axis { width: 24px; }
  .timeline-body { padding-left: 10px; }
  .tl-name { font-size: 13.5px; }
}
</style>