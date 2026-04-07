<template>
  <n-space vertical size="large">
    <n-card size="small" style="border-radius: 12px; background: linear-gradient(135deg, #18a058 0%, #13c2c2 100%); color: white;">
      <template #header>
        <n-space align="center" justify="space-between" style="width: 100%">
          <n-space align="center">
            <n-icon size="18" :component="HomeOutline" />
            <span>{{ store.t('home') }}</span>
          </n-space>
          <n-space>
            <n-select 
              v-model:value="store.sortBy" 
              :options="store.sortOptions"
              size="small"
              style="width: 180px; background: rgba(255,255,255,0.2); border: none; color: white"
              :placeholder="store.t('sort')"
            />
            <n-button type="primary" size="small" @click="store.showAddModal = true">
              <template #icon><n-icon :component="CreateOutline" /></template>
              {{ store.t('add') }}
            </n-button>
          </n-space>
        </n-space>
      </template>
      <n-space vertical align="center" justify="center" style="padding: 20px 0">
        <n-text style="font-size: 14px; opacity: 0.8">{{ store.t('totalInvestment') }}</n-text>
        <n-text strong style="font-size: 32px; font-weight: bold">¥{{ store.totalInvestment.toFixed(2) }}</n-text>
        <n-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.2)" />
        <n-space justify="space-between">
          <div>
            <n-text style="color: rgba(255,255,255,0.7); font-size: 13px">{{ store.t('dailyCost') }}</n-text>
            <n-text strong style="font-size: 22px; display: block">¥{{ filteredDailyAverageCost.toFixed(2) }}</n-text>
          </div>
          <div style="text-align: right">
            <n-text style="color: rgba(255,255,255,0.7); font-size: 13px">{{ store.t('assetCount') }}</n-text>
            <n-text strong style="font-size: 22px; display: block">{{ filteredAssetCount }}/10</n-text>
          </div>
        </n-space>
      </n-space>
    </n-card>

    <n-card size="small" style="border-radius: 12px" v-if="expiringWarranties.length > 0 || highPriorityWishlist.length > 0">
      <template #header>
        <n-space align="center">
          <n-icon size="18" :component="AlertCircleOutline" />
          <span>提醒</span>
        </n-space>
      </template>
      <n-space vertical>
        <div v-if="expiringWarranties.length > 0">
          <n-tag type="warning" size="small">保修到期提醒</n-tag>
          <n-list bordered style="margin-top: 8px">
            <n-list-item v-for="item in expiringWarranties" :key="item.id" class="reminder-item">
              <n-space>
                <n-avatar round>
                  <n-icon :component="AlertCircleOutline" />
                </n-avatar>
                <div class="reminder-content">
                  <div class="reminder-title">{{ item.name }}</div>
                  <div class="reminder-desc">剩余: {{ item.daysUntilExpire }} 天</div>
                </div>
                <n-button size="small" type="primary" @click="showDetail(item)">
                  查看
                </n-button>
              </n-space>
            </n-list-item>
          </n-list>
        </div>
        <div v-if="highPriorityWishlist.length > 0" style="margin-top: 16px">
          <n-tag type="info" size="small">高优先级心愿</n-tag>
          <n-list bordered style="margin-top: 8px">
            <n-list-item v-for="item in highPriorityWishlist" :key="item.id" class="reminder-item">
              <n-space>
                <n-avatar round>
                  <n-icon :component="StarOutline" />
                </n-avatar>
                <div class="reminder-content">
                  <div class="reminder-title">{{ item.name }}</div>
                  <div class="reminder-desc">预期价格: ¥{{ item.expected_price }}</div>
                </div>
                <n-button size="small" type="primary" @click="handleBuyWishlist(item)">
                  购入
                </n-button>
              </n-space>
            </n-list-item>
          </n-list>
        </div>
      </n-space>
    </n-card>

    <n-space vertical size="medium">
      <div style="overflow-x: auto">
        <n-space size="medium" style="white-space: nowrap">
          <n-button 
            v-for="status in ['', '0', '1', '2', '3', '4']" 
            :key="status"
            :type="store.filterStatus === status ? 'primary' : 'default'"
            quaternary
            size="small"
            @click="store.filterStatus = status"
          >
            {{ status === '' ? store.t('all') : statusTextMap[Number(status)] }}
          </n-button>
        </n-space>
      </div>
      <div style="overflow-x: auto">
        <n-space size="medium" style="white-space: nowrap">
          <n-button 
            v-for="cat in categoryOptionsWithAll" 
            :key="cat.value"
            :type="store.filterCategory === cat.value ? 'primary' : 'default'"
            quaternary
            size="small"
            @click="store.filterCategory = cat.value"
          >
            {{ cat.label }}
          </n-button>
        </n-space>
      </div>
    </n-space>

    <n-grid :cols="2" :x-gap="12" :y-gap="12">
      <n-gi v-for="item in filteredAssetList" :key="item.id">
        <n-card hoverable size="small" class="asset-card" @click="showDetail(item)" style="border-radius: 12px">
          <n-space vertical size="small">
            <div style="text-align: right">
              <n-tag :type="getActualStatusType(item)" size="small">
                {{ getActualStatusText(item) }}
              </n-tag>
            </div>
            <n-text strong style="font-size: 16px">{{ item.name }}</n-text>
            <n-space justify="space-between">
              <n-text style="font-size: 18px; font-weight: bold">¥{{ getDailyCost(item).toFixed(2) }}/天</n-text>
              <n-text style="color: #999; font-size: 14px">
                ¥{{ item.buy_price.toFixed(0) }} · 已使用 {{ getHoldDays(item) }} 天
              </n-text>
            </n-space>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
    <n-empty v-if="filteredAssetList.length === 0" description="暂无资产数据" style="margin: 40px 0" />
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { HomeOutline, CreateOutline, AlertCircleOutline, StarOutline } from '@vicons/ionicons5';

const store = useAssetStore();

const statusTextMap: Record<number, string> = {
  0: '保障中',
  1: '活跃中',
  2: '已退役',
  3: '已用完',
  4: '已售出'
};

const categoryOptionsWithAll = computed(() => {
  const categories = Array.from(new Set(store.assetList.map(item => item.category)));
  return [
    { label: '全部', value: '' },
    ...categories.map(cat => ({ label: cat, value: cat }))
  ];
});

const filteredAssetList = computed(() => {
  let filtered = store.assetList.filter(item => {
    const matchesStatus = store.filterStatus === '' || item.status === Number(store.filterStatus);
    const matchesCategory = store.filterCategory === '' || item.category === store.filterCategory;
    return matchesStatus && matchesCategory;
  });

  filtered.sort((a, b) => {
    switch (store.sortBy) {
      case 'id_desc':
        return b.id - a.id;
      case 'id_asc':
        return a.id - b.id;
      case 'date_desc':
        return new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime();
      case 'date_asc':
        return new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime();
      case 'price_desc':
        return b.buy_price - a.buy_price;
      case 'price_asc':
        return a.buy_price - b.buy_price;
      case 'dailyCost_desc':
        return getDailyCost(b) - getDailyCost(a);
      case 'dailyCost_asc':
        return getDailyCost(a) - getDailyCost(b);
      default:
        return 0;
    }
  });

  return filtered;
});

const filteredDailyAverageCost = computed(() => {
  if (filteredAssetList.value.length === 0) return 0;
  const totalDailyCost = filteredAssetList.value.reduce((sum, item) => sum + getDailyCost(item), 0);
  return totalDailyCost / filteredAssetList.value.length;
});

const filteredAssetCount = computed(() => filteredAssetList.value.length);

const getHoldDays = (item: any) => {
  const buyDate = new Date(item.buy_date);
  const today = new Date();
  return Math.floor((today.getTime() - buyDate.getTime()) / 86400000);
};

const getDailyCost = (item: any): number => {
  const days = getHoldDays(item);
  if (days <= 0) return 0;
  const sellPrice = item.status === 4 && item.sell_date ? (item.sell_price || 0) : 0;
  return (item.buy_price - sellPrice) / days;
};

const getActualStatusType = (item: any) => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return 'success';
    }
  }
  return ['success', 'primary', 'warning', 'error', 'default'][item.status];
};

const getActualStatusText = (item: any) => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return '保障中';
    }
  }
  return statusTextMap[item.status];
};

const showDetail = (item: any) => {
  store.currentAsset = item;
  store.showDetailModal = true;
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
  // 稍后在store中添加handleDeleteWishlist方法
};

const expiringWarranties = computed(() => {
  const today = new Date();
  return store.assetList.filter(item => {
    if (!item.warranty_date) return false;
    const warrantyEnd = new Date(item.warranty_date);
    const daysUntilExpire = Math.floor((warrantyEnd.getTime() - today.getTime()) / 86400000);
    return daysUntilExpire >= 0 && daysUntilExpire <= 30;
  }).map(item => {
    const warrantyEnd = new Date(item.warranty_date!);
    const daysUntilExpire = Math.floor((warrantyEnd.getTime() - new Date().getTime()) / 86400000);
    return { ...item, daysUntilExpire };
  });
});

const highPriorityWishlist = computed(() => {
  return store.wishlist.filter(item => item.priority >= 4);
});
</script>

<style scoped>
.asset-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e8f5e8;
}

.reminder-item {
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
}

.reminder-item:hover {
  background-color: rgba(24, 160, 88, 0.05);
  transform: translateX(4px);
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 14px;
}

.reminder-desc {
  font-size: 12px;
  color: #999;
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

.asset-card {
  animation: fadeInUp 0.5s ease-out;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .asset-card {
    margin-bottom: 12px;
  }
}
</style>