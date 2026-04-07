<template>
  <div class="asset-page">
    <!-- 总资产卡片 -->
    <div class="summary-card">
      <div class="summary-top">
        <div class="summary-label">总持有资产</div>
        <div class="summary-actions">
          <div class="search-wrap">
            <n-input
              v-model:value="store.searchKeyword"
              size="small"
              :placeholder="store.t('search') || '搜索资产'"
              clearable
            >
              <template #prefix>
                <n-icon size="14" :component="SearchOutline" style="color: rgba(255,255,255,0.6)" />
              </template>
            </n-input>
          </div>

          <!-- 排序下拉 -->
          <n-dropdown
            trigger="click"
            :options="sortDropdownOptions"
            @select="handleSortSelect"
            placement="bottom-end"
          >
            <button class="icon-btn" :title="currentSortLabel">
              <n-icon :component="SwapVerticalOutline" size="16" />
            </button>
          </n-dropdown>

          <button class="icon-btn primary-btn" @click="store.showAddModal = true" title="添加资产">
            <n-icon :component="AddOutline" size="16" />
          </button>
        </div>
      </div>

      <div class="summary-amount">
        <span class="mono">¥{{ store.totalInvestment.toFixed(2) }}</span>
      </div>

      <!-- 日均成本 + 资产数量：严格一行 -->
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">{{ store.t('dailyCost') }}</span>
          <span class="stat-value mono">¥{{ filteredDailyAverageCost.toFixed(2) }}<em>/天</em></span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">{{ store.t('assetCount') }}</span>
          <span class="stat-value mono">{{ filteredAssetCount }}<em>/{{ store.assetCount }}</em></span>
        </div>
      </div>
    </div>

    <!-- 提醒卡片 -->
    <div class="section-card reminder-card" v-if="expiringWarranties.length > 0 || highPriorityWishlist.length > 0">
      <div class="section-header">
        <n-icon :component="AlertCircleOutline" size="15" style="color: var(--color-warning)" />
        <span>待办提醒</span>
      </div>
      <div class="reminder-list">
        <div v-if="expiringWarranties.length > 0">
          <div class="remind-group-label warning">保修到期</div>
          <div class="remind-item" v-for="item in expiringWarranties" :key="item.id">
            <div class="remind-dot warning"></div>
            <div class="remind-info">
              <span class="remind-name">{{ item.name }}</span>
              <span class="remind-meta">剩余 {{ item.daysUntilExpire }} 天</span>
            </div>
            <button class="small-btn" @click="showDetail(item)">查看</button>
          </div>
        </div>
        <div v-if="highPriorityWishlist.length > 0" :style="expiringWarranties.length > 0 ? 'margin-top: 14px' : ''">
          <div class="remind-group-label info">高优先级心愿</div>
          <div class="remind-item" v-for="item in highPriorityWishlist" :key="item.id">
            <div class="remind-dot info"></div>
            <div class="remind-info">
              <span class="remind-name">{{ item.name }}</span>
              <span class="remind-meta mono">¥{{ item.expected_price }}</span>
            </div>
            <button class="small-btn primary" @click="handleBuyWishlist(item)">购入</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="section-card filter-card">
      <div class="section-header">
        <n-icon :component="FunnelOutline" size="15" />
        <span>筛选</span>
        <span class="sort-badge" v-if="store.sortBy !== 'id_desc'">{{ currentSortLabel }}</span>
      </div>
      <div class="filter-row">
        <span class="filter-label">状态</span>
        <div class="filter-chips">
          <button
            v-for="status in ['', '0', '1', '2', '3', '4']"
            :key="status"
            class="chip"
            :class="{ active: store.filterStatus === status }"
            @click="store.filterStatus = status"
          >{{ status === '' ? store.t('all') : statusTextMap[Number(status)] }}</button>
        </div>
      </div>
      <div class="filter-row" style="margin-top: 10px">
        <span class="filter-label">分类</span>
        <div class="filter-chips">
          <button
            v-for="cat in categoryOptionsWithAll"
            :key="cat.value"
            class="chip"
            :class="{ active: store.filterCategory === cat.value }"
            @click="store.filterCategory = cat.value"
          >{{ cat.label }}</button>
        </div>
      </div>
    </div>

    <!-- 资产列表 -->
    <div class="section-card list-card">
      <div class="section-header">
        <n-icon :component="LayersOutline" size="15" />
        <span>资产列表</span>
        <span class="count-badge">{{ filteredAssetCount }}</span>
      </div>

      <div class="asset-grid" v-if="filteredAssetList.length > 0">
        <div
          class="asset-card"
          v-for="item in filteredAssetList"
          :key="item.id"
          @click="showDetail(item)"
        >
          <!-- 图片区 -->
          <div class="card-image-area" @click.stop>
            <div
              class="card-image"
              :style="item.image_path ? `background-image: url('${item.image_path}')` : ''"
              :class="{ 'has-image': !!item.image_path }"
            >
              <div class="image-placeholder" v-if="!item.image_path">
                <n-icon :component="getCategoryIcon(item.category)" size="22" />
              </div>
            </div>
          </div>

          <!-- 内容区 -->
          <div class="card-content" @click="showDetail(item)">
            <div class="card-top-row">
              <span class="asset-name">{{ item.name }}</span>
              <span class="status-badge" :class="getStatusClass(item)">{{ getActualStatusText(item) }}</span>
            </div>

            <div class="card-price-row">
              <span class="daily-cost mono">¥{{ getDailyCost(item).toFixed(2) }}<span class="per-day">/天</span></span>
              <span class="buy-price mono">购入¥{{ item.buy_price.toFixed(0) }}</span>
            </div>

            <div class="card-footer-row">
              <span class="category-tag">{{ item.category }}</span>
              <span class="hold-days mono">{{ getHoldDays(item) }}天</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <n-icon :component="AppsOutline" size="36" />
        <p>暂无资产数据</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'AssetList' }
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import {
  SearchOutline, SwapVerticalOutline, AddOutline,
  AlertCircleOutline, FunnelOutline, LayersOutline,
  LaptopOutline, HomeOutline, ShirtOutline, BarbellOutline,
  BookOutline, FlaskOutline, AppsOutline
} from '@vicons/ionicons5';
import { NInput, NIcon, NDropdown } from "naive-ui";

const store = useAssetStore();

// ===== 状态映射 =====
const statusTextMap: Record<number, string> = {
  0: '保障中', 1: '活跃中', 2: '已退役', 3: '已用完', 4: '已售出'
};

// ===== 排序 =====
const sortDropdownOptions = computed(() =>
  (store.sortOptions || []).map((o: any) => ({
    label: o.label,
    key: o.value,
    props: {
      style: store.sortBy === o.value
        ? 'color: var(--color-primary); font-weight: 600;'
        : ''
    }
  }))
);

const currentSortLabel = computed(() => {
  const opt = (store.sortOptions || []).find((o: any) => o.value === store.sortBy);
  return opt ? opt.label : '';
});

const handleSortSelect = (key: string) => {
  store.sortBy = key;
};

// ===== 分类图标 =====
const getCategoryIcon = (category: string) => {
  const map: Record<string, any> = {
    '电子产品': LaptopOutline,
    '家具家电': HomeOutline,
    '服装配饰': ShirtOutline,
    '运动器材': BarbellOutline,
    '书籍文具': BookOutline,
    '消耗品': FlaskOutline,
  };
  return map[category] || AppsOutline;
};

// ===== 分类 =====
const categoryOptionsWithAll = computed(() => {
  const defaultCats = ['电子产品', '家具家电', '服装配饰', '运动器材', '书籍文具', '消耗品', '其他'];
  const assetCats = Array.from(new Set(store.assetList.map((i: any) => i.category).filter(Boolean)));
  const all = [...new Set([...defaultCats, ...assetCats])];
  return [{ label: '全部', value: '' }, ...all.map(c => ({ label: c, value: c }))];
});

// ===== 过滤+排序 =====
const filteredAssetList = computed(() => {
  let list = store.assetList.filter((item: any) => {
    const matchStatus = store.filterStatus === '' || item.status === Number(store.filterStatus);
    const matchCat = store.filterCategory === '' || item.category === store.filterCategory;
    const matchSearch = !store.searchKeyword ||
      item.name.includes(store.searchKeyword) ||
      item.category.includes(store.searchKeyword);
    return matchStatus && matchCat && matchSearch;
  });

  const sorted = [...list];
  switch (store.sortBy) {
    case 'id_desc':      sorted.sort((a: any, b: any) => b.id - a.id); break;
    case 'id_asc':       sorted.sort((a: any, b: any) => a.id - b.id); break;
    case 'date_desc':    sorted.sort((a: any, b: any) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime()); break;
    case 'date_asc':     sorted.sort((a: any, b: any) => new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()); break;
    case 'price_desc':   sorted.sort((a: any, b: any) => b.buy_price - a.buy_price); break;
    case 'price_asc':    sorted.sort((a: any, b: any) => a.buy_price - b.buy_price); break;
    case 'dailyCost_desc': sorted.sort((a: any, b: any) => getDailyCost(b) - getDailyCost(a)); break;
    case 'dailyCost_asc':  sorted.sort((a: any, b: any) => getDailyCost(a) - getDailyCost(b)); break;
  }
  return sorted;
});

const filteredDailyAverageCost = computed(() => {
  if (filteredAssetList.value.length === 0) return 0;
  return filteredAssetList.value.reduce((s: number, i: any) => s + getDailyCost(i), 0) / filteredAssetList.value.length;
});

const filteredAssetCount = computed(() => filteredAssetList.value.length);

// ===== 时间计算 =====
const getHoldDays = (item: any) => {
  const buyDate = new Date(item.buy_date);
  const today = new Date();
  return Math.max(1, Math.floor((today.getTime() - buyDate.getTime()) / 86400000));
};

const getDailyCost = (item: any): number => {
  const days = getHoldDays(item);
  if (days <= 0) return 0;
  const sellPrice = item.status === 4 && item.sell_date ? (item.sell_price || 0) : 0;
  return (item.buy_price - sellPrice) / days;
};

// ===== 保障中算法：以保修截止日期为准 =====
// 如果 warranty_date 存在且未过期 → 保障中（显示）
// 如果 warranty_date 不存在或已过期，且 status === 0 → 显示为活跃中
// 其余 status (1-4) 正常显示
const isUnderWarranty = (item: any): boolean => {
  if (!item.warranty_date) return false;
  return new Date(item.warranty_date) > new Date();
};

const getStatusClass = (item: any): string => {
  if (isUnderWarranty(item)) return 'status-warranty';
  // status=0 但保修已过期，显示为活跃中样式
  if (item.status === 0) return 'status-active';
  const map: Record<number, string> = {
    1: 'status-active',
    2: 'status-retired',
    3: 'status-used',
    4: 'status-sold'
  };
  return map[item.status] || 'status-default';
};

const getActualStatusText = (item: any): string => {
  if (isUnderWarranty(item)) return '保障中';
  if (item.status === 0) return '活跃中';
  const textMap: Record<number, string> = {
    1: '活跃中', 2: '已退役', 3: '已用完', 4: '已售出'
  };
  return textMap[item.status] || '未知';
};

// ===== 详情 & 购入 =====
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
};

// ===== 提醒 =====
const expiringWarranties = computed(() => {
  const today = new Date();
  return store.assetList
    .filter((item: any) => {
      if (!item.warranty_date) return false;
      const days = Math.floor((new Date(item.warranty_date).getTime() - today.getTime()) / 86400000);
      return days >= 0 && days <= 30;
    })
    .map((item: any) => ({
      ...item,
      daysUntilExpire: Math.floor((new Date(item.warranty_date!).getTime() - today.getTime()) / 86400000)
    }));
});

const highPriorityWishlist = computed(() => store.wishlist.filter((i: any) => i.priority >= 4));
</script>

<style scoped>
.asset-page { display: flex; flex-direction: column; gap: 16px; }

/* ===== 总资产卡片 ===== */
.summary-card {
  background: var(--color-primary);
  border-radius: 18px;
  padding: 22px 24px 20px;
  color: #fff;
  box-shadow: 0 6px 28px rgba(59, 111, 212, 0.28);
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
}

.summary-label {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.75;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.search-wrap { width: 160px; }

.search-wrap :deep(.n-input) {
  background: rgba(255,255,255,0.15) !important;
  border-color: rgba(255,255,255,0.25) !important;
  border-radius: 8px !important;
  font-size: 13px;
}
.search-wrap :deep(.n-input__input-el) { color: #fff !important; }
.search-wrap :deep(.n-input__placeholder) { color: rgba(255,255,255,0.5) !important; }
.search-wrap :deep(.n-input__clear) { color: rgba(255,255,255,0.6) !important; }

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
}
.icon-btn:hover { background: rgba(255,255,255,0.28); }
.primary-btn { background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.4); }

.summary-amount {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 6px 0 14px;
  line-height: 1;
}

/* 统计行 - 严格一行，不换行 */
.summary-stats {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.13);
  border-radius: 10px;
  padding: 10px 16px;
  gap: 0;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.stat-label {
  font-size: 12px;
  opacity: 0.72;
  font-weight: 500;
  flex-shrink: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value em {
  font-style: normal;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.7;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,0.25);
  margin: 0 16px;
  flex-shrink: 0;
}

/* ===== 通用卡片 ===== */
.section-card {
  background: var(--color-surface);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 14px;
}

.count-badge {
  margin-left: 4px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
}

.sort-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  padding: 2px 8px;
  border-radius: 10px;
}

/* ===== 提醒 ===== */
.reminder-list { display: flex; flex-direction: column; }
.remind-group-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}
.remind-group-label.warning { color: var(--color-warning); background: #fef6ea; }
.remind-group-label.info { color: var(--color-primary); background: var(--color-primary-soft); }

.remind-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}
.remind-item:last-child { border-bottom: none; }

.remind-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.remind-dot.warning { background: var(--color-warning); }
.remind-dot.info { background: var(--color-primary); }

.remind-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.remind-name { font-size: 13.5px; font-weight: 500; color: var(--color-text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.remind-meta { font-size: 12px; color: var(--color-text-muted); }

.small-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-sub);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;
}
.small-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.small-btn.primary { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.small-btn.primary:hover { opacity: 0.88; }

/* ===== 筛选 ===== */
.filter-row { display: flex; align-items: flex-start; gap: 12px; }
.filter-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
  padding-top: 5px;
  min-width: 28px;
  flex-shrink: 0;
}
.filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-sub);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59,111,212,0.22);
}

/* ===== 资产网格 ===== */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ===== 资产卡片 ===== */
.asset-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.asset-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 18px rgba(59,111,212,0.13);
  transform: translateY(-2px);
}

/* 图片区 */
.card-image-area {
  position: relative;
  width: 100%;
  height: 96px;
  flex-shrink: 0;
}

.card-image {
  width: 100%;
  height: 100%;
  background-color: var(--color-border);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 6px;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.18s;
}

.upload-overlay > * {
  background: rgba(0,0,0,0.55);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image:hover .upload-overlay { opacity: 1; }

.file-input {
  display: none;
}

/* 内容区 */
.card-content {
  padding: 12px 14px 13px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}

.card-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.asset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-main);
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.status-badge {
  font-size: 10.5px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 1px;
}

.status-warranty { background: #edfaf3; color: var(--color-success); }
.status-active   { background: var(--color-primary-soft); color: var(--color-primary); }
.status-retired  { background: #fef6ea; color: var(--color-warning); }
.status-used     { background: #fdf0f0; color: var(--color-danger); }
.status-sold     { background: #f4f6fb; color: var(--color-text-muted); }
.status-default  { background: #f4f6fb; color: var(--color-text-muted); }

.card-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.daily-cost {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.per-day {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-muted);
}

.buy-price {
  font-size: 12px;
  color: var(--color-text-muted);
}

.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.category-tag {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1px 7px;
  border-radius: 5px;
}

.hold-days {
  font-size: 11.5px;
  color: var(--color-text-muted);
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--color-text-muted);
  gap: 10px;
}
.empty-state p { margin: 0; font-size: 14px; }

/* ===== 响应式 ===== */
@media (max-width: 560px) {
  .asset-grid { grid-template-columns: 1fr; }
  .summary-amount { font-size: 30px; }
  .search-wrap { width: 120px; }
  .stat-label { font-size: 11px; }
  .stat-value { font-size: 16px; }
}
</style>