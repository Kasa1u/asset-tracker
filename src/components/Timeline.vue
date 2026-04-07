<template>
  <n-card size="small">
    <template #header>
      <n-space align="center">
        <n-icon size="18" :component="ListOutline" />
        <span>{{ store.t("timeline") }}</span>
      </n-space>
    </template>
    <div style="max-height: 600px; overflow-y: auto; padding: 10px 0">
      <n-timeline :reverse="true" :item-placement="'left'" v-if="timelineData.length > 0">
        <n-timeline-item 
          v-for="item in timelineData" 
          :key="item.id"
          :type="getTimelineType(item)"
          :title="item.buy_date"
        >
          <n-card size="small" hoverable style="cursor: pointer" @click="showDetail(item)">
            <n-space vertical size="small">
              <n-text strong>{{ item.name }}</n-text>
              <n-space justify="space-between">
                <span class="label">分类:</span>
                <span>{{ item.category }}</span>
              </n-space>
              <n-space justify="space-between">
                <span class="label">购入价格:</span>
                <span>¥{{ item.buy_price.toFixed(0) }}</span>
              </n-space>
              <n-tag :type="getActualStatusType(item)" size="small" style="align-self: flex-start">
                {{ getActualStatusText(item) }}
              </n-tag>
            </n-space>
          </n-card>
        </n-timeline-item>
      </n-timeline>
      <n-empty v-else description="暂无资产" />
    </div>
  </n-card>
</template>

<script lang="ts">
export default {
  name: 'Timeline'
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { ListOutline } from '@vicons/ionicons5';
import {
  NCard, NSpace, NIcon, NTimeline, NTimelineItem, 
  NText, NTag, NEmpty
} from "naive-ui";

const store = useAssetStore();

const timelineData = computed(() => {
  return [...store.assetList].sort((a, b) => {
    return new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime();
  });
});

const getTimelineType = (item: any): "default" | "success" | "error" | "warning" | "info" => {
  const typeMap: Record<number, "default" | "success" | "error" | "warning" | "info"> = {
    0: 'success',
    1: 'info',
    2: 'warning',
    3: 'error',
    4: 'default'
  };
  return typeMap[item.status] || 'default';
};

const getActualStatusType = (item: any): "default" | "success" | "error" | "warning" | "info" | undefined => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return 'success';
    }
  }
  const typeMap: Record<number, "default" | "success" | "error" | "warning" | "info"> = {
    0: 'success',
    1: 'info',
    2: 'warning',
    3: 'error',
    4: 'default'
  };
  return typeMap[item.status as number] || 'default';
};

const getActualStatusText = (item: any) => {
  const statusTextMap: Record<number, string> = {
    0: '保障中',
    1: '活跃中',
    2: '已退役',
    3: '已用完',
    4: '已售出'
  };
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return '保障中';
    }
  }
  return statusTextMap[item.status as number] || '未知';
};

const showDetail = (item: any) => {
  store.currentAsset = item;
  store.showDetailModal = true;
};
</script>

<style scoped>
.label {
  color: #666;
  font-size: 14px;
}

/* 动画效果 */
@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.n-timeline-item {
  animation: fadeInLeft 0.5s ease-out;
  animation-fill-mode: both;
}

/* 时间轴卡片样式 */
.n-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
}

.n-card:hover {
  transform: translateX(8px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #e8f5e8;
}

/* 时间轴样式 */
.n-timeline {
  padding-left: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .n-timeline {
    padding-left: 10px;
  }
  
  .n-card {
    margin-right: 10px;
  }
}
</style>