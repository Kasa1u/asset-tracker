<template>
  <n-space vertical size="large">
    <!-- 总资产卡片 -->
    <n-card size="small" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <template #header>
        <n-space align="center" justify="space-between" style="width: 100%">
          <n-space align="center">
            <n-icon size="20" :component="HomeOutline" />
          </n-space>
          <n-space>
            <!-- 搜索框 -->
            <n-input
              v-model:value="store.searchKeyword"
              size="small"
              placeholder="搜索资产"
              style="width: 200px"
            >
              <template #prefix>
                <n-icon size="16" :component="SearchOutline" />
              </template>
            </n-input>
            <!-- 排序按钮 -->
            <n-dropdown trigger="click">
              <n-button circle size="small">
                <n-icon :component="SwapVerticalOutline" />
              </n-button>
              <template #menu>
                <n-menu @select="(value) => store.sortBy = value">
                  <n-menu-item v-for="option in store.sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </n-menu-item>
                </n-menu>
              </template>
            </n-dropdown>
            <!-- 添加资产按钮 -->
            <n-button circle type="primary" size="small" @click="store.showAddModal = true">
              <n-icon :component="AddOutline" />
            </n-button>
          </n-space>
        </n-space>
      </template>
      <n-space vertical align="center" justify="center" style="padding: 20px 0">
        <n-text style="font-size: 16px; opacity: 0.9">{{ store.t('totalAssets') }}</n-text>
        <n-text strong style="font-size: 36px; font-weight: bold; margin: 8px 0">¥{{ store.totalInvestment.toFixed(2) }}</n-text>
        <n-grid :cols="2" :x-gap="60" style="width: 90%; margin-top: 16px">
          <n-gi>
            <n-space align="center">
              <n-text style="color: #666; font-size: 14px; margin-right: 8px">{{ store.t('dailyCost') }}:</n-text>
              <n-text strong style="font-size: 18px; font-weight: bold">¥{{ filteredDailyAverageCost.toFixed(2) }}</n-text>
            </n-space>
          </n-gi>
          <n-gi>
            <n-space align="center">
              <n-text style="color: #666; font-size: 14px; margin-right: 8px">{{ store.t('assetCount') }}:</n-text>
              <n-text strong style="font-size: 18px; font-weight: bold">{{ filteredAssetCount }}/{{ store.assetCount }}</n-text>
            </n-space>
          </n-gi>
        </n-grid>
      </n-space>
    </n-card>

    <!-- 提醒卡片 -->
    <n-card size="small" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);" v-if="expiringWarranties.length > 0 || highPriorityWishlist.length > 0">
      <template #header>
        <n-space align="center">
          <n-icon size="18" :component="AlertCircleOutline" />
          <span style="font-size: 16px; font-weight: bold">提醒</span>
        </n-space>
      </template>
      <n-space vertical size="medium">
        <!-- 保修到期提醒 -->
        <div v-if="expiringWarranties.length > 0">
          <n-tag type="warning" size="small">保修到期提醒</n-tag>
          <n-list bordered style="margin-top: 12px; border-radius: 8px; overflow: hidden">
            <n-list-item v-for="item in expiringWarranties" :key="item.id" class="reminder-item">
              <n-space>
                <n-avatar round style="background: #fff1f0; color: #ff4d4f">
                  <n-icon :component="AlertCircleOutline" size="16" />
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
        <!-- 高优先级心愿提醒 -->
        <div v-if="highPriorityWishlist.length > 0" style="margin-top: 20px">
          <n-tag type="info" size="small">高优先级心愿</n-tag>
          <n-list bordered style="margin-top: 12px; border-radius: 8px; overflow: hidden">
            <n-list-item v-for="item in highPriorityWishlist" :key="item.id" class="reminder-item">
              <n-space>
                <n-avatar round style="background: #e6f7ff; color: #1890ff">
                  <n-icon :component="StarOutline" size="16" />
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

    <!-- 筛选按钮卡片 -->
    <n-card size="small" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <template #header>
        <n-space align="center">
          <n-icon size="18" :component="WalletOutline" />
          <span style="font-size: 16px; font-weight: bold">资产筛选</span>
        </n-space>
      </template>
      <n-space vertical size="medium">
        <!-- 状态筛选 -->
        <div>
          <n-text style="font-size: 14px; color: #666; margin-bottom: 8px; display: block">状态</n-text>
          <div style="overflow-x: auto">
            <n-space size="medium" style="white-space: nowrap">
              <n-button 
                v-for="status in ['', '0', '1', '2', '3', '4']" 
                :key="status"
                :type="store.filterStatus === status ? 'primary' : 'default'"
                quaternary
                size="small"
                @click="store.filterStatus = status"
                class="filter-button"
              >
                {{ status === '' ? store.t('all') : statusTextMap[Number(status)] }}
              </n-button>
            </n-space>
          </div>
        </div>
        <!-- 分类筛选 -->
        <div style="margin-top: 12px">
          <n-text style="font-size: 14px; color: #666; margin-bottom: 8px; display: block">分类</n-text>
          <div style="overflow-x: auto">
            <n-space size="medium" style="white-space: nowrap">
              <n-button 
                v-for="cat in categoryOptionsWithAll" 
                :key="cat.value"
                :type="store.filterCategory === cat.value ? 'primary' : 'default'"
                quaternary
                size="small"
                @click="store.filterCategory = cat.value"
                class="filter-button"
              >
                {{ cat.label }}
              </n-button>
            </n-space>
          </div>
        </div>
      </n-space>
    </n-card>

    <!-- 资产列表 -->
    <n-card size="small" style="border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
      <template #header>
        <n-space align="center" justify="space-between" style="width: 100%">
          <n-space align="center">
            <n-icon size="18" :component="BarChartOutline" />
            <span style="font-size: 16px; font-weight: bold">资产列表</span>
          </n-space>
          <n-text style="font-size: 14px; color: #666">{{ filteredAssetCount }} 个资产</n-text>
        </n-space>
      </template>
      <n-grid :cols="2" :x-gap="20" :y-gap="20" style="margin-top: 16px">
        <n-gi v-for="item in filteredAssetList" :key="item.id">
          <n-card hoverable size="small" class="asset-card" @click="showDetail(item)" style="border-radius: 12px; transition: all 0.3s ease; border: 1px solid #f0f0f0;">
            <n-space vertical size="small">
              <div style="text-align: right">
                <n-tag :type="getActualStatusType(item)" size="small" :style="getStatusTagStyle(item)">
                  {{ getActualStatusText(item) }}
                </n-tag>
              </div>
              <n-text strong style="font-size: 16px; margin: 8px 0">{{ item.name }}</n-text>
              <n-space justify="space-between" style="margin: 8px 0">
                <n-text style="font-size: 18px; font-weight: bold; color: #18a058">¥{{ getDailyCost(item).toFixed(2) }}/天</n-text>
                <n-text style="color: #999; font-size: 14px">
                  ¥{{ item.buy_price.toFixed(0) }}
                </n-text>
              </n-space>
              <n-text style="color: #666; font-size: 13px">
                已使用 {{ getHoldDays(item) }} 天
              </n-text>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
      <n-empty v-if="filteredAssetList.length === 0" description="暂无资产数据" style="margin: 60px 0" />
    </n-card>
  </n-space>
</template>

<script lang="ts">
export default {
  name: 'AssetList'
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { HomeOutline, CreateOutline, AlertCircleOutline, StarOutline, WalletOutline, BarChartOutline, SearchOutline, SwapVerticalOutline, AddOutline } from '@vicons/ionicons5';
import {
  NCard, NSpace, NIcon, NSelect, NButton, NTag, NList, NListItem, 
  NAvatar, NGrid, NGi, NText, NDivider, NEmpty, NInput, NDropdown, NMenu
} from "naive-ui";

const store = useAssetStore();

const statusTextMap: Record<number, string> = {
  0: '保障中',
  1: '活跃中',
  2: '已退役',
  3: '已用完',
  4: '已售出'
};

const categoryOptionsWithAll = computed(() => {
  const defaultCategories = ['电子产品', '家具家电', '服装配饰', '运动器材', '书籍文具', '消耗品', '其他'];
  const assetCategories = Array.from(new Set(store.assetList.map(item => item.category).filter(Boolean)));
  const allCategories = [...new Set([...defaultCategories, ...assetCategories])];
  return [
    { label: '全部', value: '' },
    ...allCategories.map(cat => ({ label: cat, value: cat }))
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

const getActualStatusType = (item: any): "primary" | "default" | "success" | "error" | "warning" | "info" | undefined => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return 'success';
    }
  }
  const typeMap: Record<number, "primary" | "default" | "success" | "error" | "warning" | "info"> = {
    0: 'success',
    1: 'primary',
    2: 'warning',
    3: 'error',
    4: 'default'
  };
  return typeMap[item.status as number] || 'default';
};

const getActualStatusText = (item: any) => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return '保障中';
    }
  }
  return statusTextMap[item.status as number] || '未知';
};

const getStatusTagStyle = (item: any) => {
  if (item.warranty_date) {
    const warrantyEnd = new Date(item.warranty_date);
    const today = new Date();
    if (warrantyEnd >= today) {
      return { background: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a', padding: '2px 8px' };
    }
  }
  const statusColors: Record<number, { background: string; borderColor: string; color: string; padding: string }> = {
    0: { background: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a', padding: '2px 8px' },
    1: { background: '#e6f7ff', borderColor: '#91d5ff', color: '#1890ff', padding: '2px 8px' },
    2: { background: '#fffbe6', borderColor: '#ffe58f', color: '#faad14', padding: '2px 8px' },
    3: { background: '#fff1f0', borderColor: '#ffccc7', color: '#f5222d', padding: '2px 8px' },
    4: { background: '#f5f5f5', borderColor: '#d9d9d9', color: '#8c8c8c', padding: '2px 8px' }
  };
  return statusColors[item.status as number] || { padding: '2px 8px' };
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
/* 筛选按钮样式 */
.filter-button {
  transition: all 0.2s ease;
  border-radius: 20px !important;
  padding: 6px 16px !important;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.2);
}

/* 资产卡片样式 */
.asset-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.asset-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  border-color: #18a058;
}

/* 提醒项样式 */
.reminder-item {
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
}

.reminder-item:hover {
  background-color: rgba(24, 160, 88, 0.05);
  transform: translateX(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

.reminder-desc {
  font-size: 12px;
  color: #999;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 应用动画到不同元素 */
.asset-card {
  animation: fadeInUp 0.5s ease-out forwards;
}

.reminder-item {
  animation: fadeIn 0.3s ease-out forwards;
}

/* 卡片头部动画 */
.n-card-header {
  animation: fadeIn 0.4s ease-out forwards;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .asset-card {
    margin-bottom: 16px;
  }
  
  .n-grid {
    grid-template-columns: 1fr !important;
  }
  
  .filter-button {
    font-size: 12px !important;
    padding: 4px 12px !important;
  }
  
  .n-card {
    margin-bottom: 16px;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>