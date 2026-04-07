<template>
  <div class="wishlist-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">心愿清单</h2>
        <span class="page-subtitle">{{ store.wishlist.length }} 个愿望待实现</span>
      </div>
      <button class="add-wish-btn" @click="store.showWishlistModal = true">
        <n-icon :component="AddOutline" size="16" />
        <span>添加心愿</span>
      </button>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="store.wishlist.length === 0">
      <div class="empty-icon">
        <n-icon :component="HeartOutline" size="40" />
      </div>
      <p class="empty-title">清单空空如也</p>
      <p class="empty-sub">记录你心心念念的好物</p>
      <button class="add-wish-btn" @click="store.showWishlistModal = true" style="margin-top: 16px">
        <n-icon :component="AddOutline" size="16" />
        <span>立即添加</span>
      </button>
    </div>

    <!-- 心愿列表：按优先级分组 -->
    <div v-else class="wish-groups">
      <div
        v-for="group in groupedWishlist"
        :key="group.priority"
        class="wish-group"
      >
        <div class="group-label">
          <span class="priority-dot" :class="`p${group.priority}`"></span>
          <span>{{ priorityTextMap[group.priority] }}</span>
          <span class="group-count">{{ group.items.length }}</span>
        </div>
        <div class="wish-grid">
          <div
            class="wish-card"
            v-for="item in group.items"
            :key="item.id"
          >
            <div class="wish-card-top">
              <span class="wish-name">{{ item.name }}</span>
              <span class="priority-badge" :class="`p${item.priority}`">
                {{ priorityTextMap[item.priority] }}
              </span>
            </div>

            <div class="wish-meta-row">
              <div class="wish-meta-item">
                <span class="meta-label">分类</span>
                <span class="meta-value">{{ item.category }}</span>
              </div>
              <div class="wish-meta-item" v-if="item.expected_price">
                <span class="meta-label">预期价格</span>
                <span class="meta-value mono">¥{{ item.expected_price.toFixed(0) }}</span>
              </div>
            </div>

            <div class="wish-remark" v-if="item.remark">
              <n-icon :component="ChatbubbleEllipsesOutline" size="12" style="opacity:.5" />
              <span>{{ item.remark }}</span>
            </div>

            <div class="wish-actions">
              <button class="wish-action-btn buy" @click="handleBuyWishlist(item)">
                <n-icon :component="CartOutline" size="13" />
                购入
              </button>
              <button class="wish-action-btn edit" @click="handleEditWishlist(item)">
                <n-icon :component="CreateOutline" size="13" />
                编辑
              </button>
              <button class="wish-action-btn delete" @click="handleDeleteWishlist(item.id)">
                <n-icon :component="TrashOutline" size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'Wishlist' }
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { AddOutline, HeartOutline, CreateOutline, TrashOutline, CartOutline, ChatbubbleEllipsesOutline } from '@vicons/ionicons5';
import { NIcon } from "naive-ui";

const store = useAssetStore();

const priorityTextMap: Record<number, string> = {
  0: '普通', 1: '低', 2: '中', 3: '较高', 4: '高', 5: '最高'
};

const groupedWishlist = computed(() => {
  const groups: Record<number, any[]> = {};
  store.wishlist.forEach((item: any) => {
    const p = item.priority ?? 0;
    if (!groups[p]) groups[p] = [];
    groups[p].push(item);
  });
  return Object.keys(groups)
    .map(k => ({ priority: Number(k), items: groups[Number(k)] }))
    .sort((a, b) => b.priority - a.priority);
});

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
.wishlist-page { display: flex; flex-direction: column; gap: 20px; }

/* 页头 */
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
  letter-spacing: -0.01em;
}

.page-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.add-wish-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 3px 12px rgba(59,111,212,0.28);
  transition: all 0.18s;
}

.add-wish-btn:hover { opacity: 0.9; transform: translateY(-1px); }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 20px;
  background: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.empty-icon {
  width: 72px;
  height: 72px;
  background: var(--color-primary-soft);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-main);
}

.empty-sub {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* 分组 */
.wish-groups { display: flex; flex-direction: column; gap: 20px; }

.wish-group { display: flex; flex-direction: column; gap: 10px; }

.group-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-sub);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.group-count {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 11px;
  padding: 0 6px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-dot.p5, .priority-dot.p4 { background: var(--color-danger); }
.priority-dot.p3 { background: var(--color-warning); }
.priority-dot.p2 { background: var(--color-primary); }
.priority-dot.p1, .priority-dot.p0 { background: var(--color-text-muted); }

/* 心愿网格 */
.wish-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wish-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 13px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-card);
  transition: all 0.2s;
}

.wish-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(59,111,212,0.1);
  transform: translateY(-2px);
}

.wish-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.wish-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-main);
  line-height: 1.3;
}

.priority-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.priority-badge.p5, .priority-badge.p4 { background: #fdf0f0; color: var(--color-danger); }
.priority-badge.p3 { background: #fef6ea; color: var(--color-warning); }
.priority-badge.p2 { background: var(--color-primary-soft); color: var(--color-primary); }
.priority-badge.p1, .priority-badge.p0 { background: var(--color-bg); color: var(--color-text-muted); }

.wish-meta-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.wish-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.meta-value {
  font-size: 13.5px;
  color: var(--color-text-main);
  font-weight: 500;
}

.wish-remark {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-radius: 7px;
  padding: 6px 10px;
  line-height: 1.5;
}

.wish-actions {
  display: flex;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

.wish-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-sub);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.wish-action-btn:hover { background: var(--color-bg); }

.wish-action-btn.buy {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.wish-action-btn.buy:hover { opacity: 0.88; }

.wish-action-btn.delete:hover {
  background: #fdf0f0;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

@media (max-width: 560px) {
  .wish-grid { grid-template-columns: 1fr; }
}
</style>