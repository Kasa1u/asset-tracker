<template>
  <n-card size="small">
    <template #header>
      <n-space align="center">
        <n-icon size="18" :component="ListOutline" />
        <span>{{ store.t("wishlist") }}</span>
      </n-space>
    </template>
    <template #header-extra>
      <n-button type="primary" size="small" @click="store.showWishlistModal = true">
        <template #icon><n-icon :component="CreateOutline" /></template>
        {{ store.t("add") }}
      </n-button>
    </template>
    <n-grid :cols="2" :x-gap="12" :y-gap="12" v-if="store.wishlist.length > 0">
      <n-gi v-for="item in store.wishlist" :key="item.id">
        <n-card hoverable size="small">
          <template #header>
            <n-space align="center" justify="space-between" style="width: 100%">
              <n-text strong>{{ item.name }}</n-text>
              <n-tag :type="getPriorityType(item.priority)" size="small">
                {{ getPriorityText(item.priority) }}
              </n-tag>
            </n-space>
          </template>
          <n-space vertical size="small">
            <n-space justify="space-between">
              <span class="label">{{ store.t("category") }}:</span>
              <span>{{ item.category }}</span>
            </n-space>
            <n-space justify="space-between" v-if="item.expected_price">
              <span class="label">{{ store.t("expectedPrice") }}:</span>
              <span>¥{{ item.expected_price.toFixed(0) }}</span>
            </n-space>
            <n-space justify="space-between" v-if="item.remark">
              <span class="label">{{ store.t("remark") }}:</span>
              <n-ellipsis style="max-width: 100px">{{ item.remark }}</n-ellipsis>
            </n-space>
          </n-space>
          <template #footer>
            <n-space justify="end">
              <n-button size="small" quaternary @click="handleEditWishlist(item)">{{ store.t("edit") }}</n-button>
              <n-button type="success" size="small" quaternary @click="handleBuyWishlist(item)">购入</n-button>
              <n-button type="error" size="small" quaternary @click="handleDeleteWishlist(item.id)">{{ store.t("delete") }}</n-button>
            </n-space>
          </template>
        </n-card>
      </n-gi>
    </n-grid>
    <n-empty v-else description="暂无心愿，快去添加吧！" />
  </n-card>
</template>

<script setup lang="ts">
import { useAssetStore } from '../stores/assetStore';
import { ListOutline, CreateOutline } from '@vicons/ionicons5';

const store = useAssetStore();

const getPriorityType = (priority: number) => {
  const map = {
    0: 'default',
    1: 'default',
    2: 'info',
    3: 'warning',
    4: 'error',
    5: 'error'
  };
  return map[priority] || 'default';
};

const getPriorityText = (priority: number) => {
  const map = {
    0: '无',
    1: '低',
    2: '中',
    3: '较高',
    4: '高',
    5: '最高'
  };
  return map[priority] || '无';
};

const handleEditWishlist = (item: any) => {
  store.wishlistEditForm = {
    name: item.name,
    category: item.category,
    expected_price: item.expected_price,
    priority: item.priority,
    remark: item.remark || ''
  };
  store.editingWishlistId = item.id;
  store.showWishlistEditModal = true;
};

const handleBuyWishlist = (item: any) => {
  store.formData = {
    name: item.name,
    buy_price: item.expected_price,
    buy_date: new Date().toISOString().split('T')[0],
    warranty_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    category: item.category,
    remark: item.remark || ''
  };
  store.showAddModal = true;
  store.handleDeleteWishlist(item.id);
};

const handleDeleteWishlist = (id: number) => {
  store.handleDeleteWishlist(id);
};
</script>

<style scoped>
.label {
  color: #666;
  font-size: 14px;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.n-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  animation: fadeInUp 0.5s ease-out;
}

.n-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #e8f5e8;
}

/* 按钮样式 */
.n-button {
  transition: all 0.2s ease;
}

.n-button:hover {
  transform: translateY(-1px);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .n-card {
    margin-bottom: 12px;
  }
}
</style>