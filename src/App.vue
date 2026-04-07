<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <!-- 悬浮导航栏 -->
    <div class="floating-nav" :class="{ 'nav-scrolled': isScrolled }">
      <div class="nav-inner">
        <div class="nav-brand">
          <span class="brand-icon">◈</span>
          <span class="brand-name">物账</span>
        </div>
        <div class="nav-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            class="nav-tab"
            :class="{ active: store.currentTab === tab.name }"
            @click="store.currentTab = tab.name"
          >
            <n-icon :component="tab.icon" size="15" />
            <span>{{ store.t(tab.name === 'home' ? 'home' : tab.name === 'wishlist' ? 'wishlist' : tab.name === 'timeline' ? 'timeline' : 'stats') }}</span>
          </button>
        </div>
        <button class="lang-toggle" @click="toggleLang" :title="store.currentLocale === 'zh' ? 'Switch to English' : '切换中文'">
          <span class="lang-icon">{{ store.currentLocale === 'zh' ? 'EN' : '中' }}</span>
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="page-container">
        <Transition name="tab-fade" mode="out-in">
          <AssetList v-if="store.currentTab === 'home'" key="home" />
          <Wishlist v-else-if="store.currentTab === 'wishlist'" key="wishlist" />
          <Timeline v-else-if="store.currentTab === 'timeline'" key="timeline" />
          <Charts v-else-if="store.currentTab === 'stats'" key="stats" />
        </Transition>
      </div>
    </div>

    <!-- 资产详情弹窗 -->
    <n-modal v-model:show="store.showDetailModal" preset="card" style="width: 820px; max-width: 96vw; border-radius: 16px;">
      <template #header>
        <div class="modal-header">
          <n-icon size="18" :component="InformationCircleOutline" />
          <span>资产详情</span>
          <n-tag :type="getStatusType(store.currentAsset?.status)" size="small" class="status-tag">
            {{ getStatusText(store.currentAsset?.status) }}
          </n-tag>
        </div>
      </template>
      <n-grid :cols="2" :x-gap="28">
        <n-gi>
          <n-descriptions label-placement="left" :column="1" bordered size="small" class="detail-desc">
            <n-descriptions-item label="物品名称">{{ store.currentAsset?.name }}</n-descriptions-item>
            <n-descriptions-item label="分类">{{ store.currentAsset?.category }}</n-descriptions-item>
            <n-descriptions-item label="购入价格"><span class="mono">¥{{ store.currentAsset?.buy_price?.toFixed(2) }}</span></n-descriptions-item>
            <n-descriptions-item label="购入日期">{{ store.currentAsset?.buy_date }}</n-descriptions-item>
            <n-descriptions-item label="保修截止">{{ store.currentAsset?.warranty_date || '—' }}</n-descriptions-item>
            <n-descriptions-item label="持有天数"><span class="mono">{{ getHoldDays(store.currentAsset) }} 天</span></n-descriptions-item>
            <n-descriptions-item label="日均成本">
              <span class="mono" :style="{ color: getDailyCost(store.currentAsset) > 1 ? '#e05c5c' : '#3da871', fontWeight: 600 }">
                ¥{{ getDailyCost(store.currentAsset).toFixed(2) }}/天
              </span>
            </n-descriptions-item>
            <n-descriptions-item label="备注">{{ store.currentAsset?.remark || '—' }}</n-descriptions-item>
          </n-descriptions>

          <template v-if="store.currentAsset?.status === 4">
            <n-divider style="margin: 14px 0" />
            <n-descriptions label-placement="left" :column="1" bordered size="small">
              <n-descriptions-item label="卖出价格"><span class="mono">¥{{ store.currentAsset?.sell_price?.toFixed(2) }}</span></n-descriptions-item>
              <n-descriptions-item label="卖出日期">{{ store.currentAsset?.sell_date }}</n-descriptions-item>
              <n-descriptions-item label="收益">
                <span class="mono" :style="{ color: ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)) >= 0 ? '#3da871' : '#e05c5c', fontWeight: 600 }">
                  {{ ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)) >= 0 ? '+' : '' }}¥{{ ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)).toFixed(2) }}
                </span>
              </n-descriptions-item>
            </n-descriptions>
          </template>

          <n-divider style="margin: 14px 0" />
          <div class="action-row">
            <n-button size="small" type="primary" @click="handleEdit(store.currentAsset)" :disabled="store.currentAsset?.status === 1">
              <template #icon><n-icon :component="CreateOutline" /></template>编辑
            </n-button>
            <n-button size="small" type="warning" @click="handleSell(store.currentAsset)">
              <template #icon><n-icon :component="TrendingUpOutline" /></template>状态变更
            </n-button>
            <n-button size="small" type="error" @click="handleDelete(store.currentAsset?.id)">
              <template #icon><n-icon :component="TrashOutline" /></template>删除
            </n-button>
          </div>
        </n-gi>
        <n-gi>
          <div class="chart-card">
            <div class="chart-title">日均成本趋势</div>
            <div ref="detailChartRef" style="height: 380px"></div>
          </div>
        </n-gi>
      </n-grid>
    </n-modal>

    <!-- 编辑资产弹窗 -->
    <n-modal v-model:show="store.showEditModal" preset="card" title="编辑资产" style="width: 500px; border-radius: 16px;">
      <n-form :model="store.editForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称"><n-input v-model:value="store.editForm.name" /></n-form-item>
        <n-form-item label="分类"><n-select v-model:value="store.editForm.category" :options="categoryOptions" /></n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="store.editForm.buy_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="购入日期">
          <n-date-picker v-model:formatted-value="store.editForm.buy_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="保修截止">
          <n-date-picker v-model:formatted-value="store.editForm.warranty_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.editForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="store.showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdate">保存</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 状态变更弹窗 -->
    <n-modal v-model:show="store.showSellModal" preset="card" title="状态变更" style="width: 500px; border-radius: 16px;">
      <n-form :model="store.sellForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称"><n-input v-model:value="store.sellForm.name" disabled /></n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="store.sellForm.buy_price" disabled style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="新状态">
          <n-select v-model:value="store.sellForm.new_status" :options="statusOptions.filter(o => o.value !== '')" style="width: 100%" />
        </n-form-item>
        <n-form-item label="卖出价格" v-if="store.sellForm.new_status === 4">
          <n-input-number v-model:value="store.sellForm.sell_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="卖出日期" v-if="store.sellForm.new_status === 4">
          <n-date-picker v-model:formatted-value="store.sellForm.sell_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="store.showSellModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmStatusChange">确认变更</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 添加心愿弹窗 -->
    <n-modal v-model:show="store.showWishlistModal" preset="card" title="添加心愿" style="width: 500px; border-radius: 16px;">
      <n-form :model="store.wishlistForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称"><n-input v-model:value="store.wishlistForm.name" placeholder="例如：MacBook Pro" /></n-form-item>
        <n-form-item label="分类"><n-select v-model:value="store.wishlistForm.category" :options="categoryOptions" placeholder="请选择分类" /></n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="store.wishlistForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级"><n-select v-model:value="store.wishlistForm.priority" :options="priorityOptions" /></n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.wishlistForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="store.showWishlistModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveWishlist">保存</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 编辑心愿弹窗 -->
    <n-modal v-model:show="store.showWishlistEditModal" preset="card" title="编辑心愿" style="width: 500px; border-radius: 16px;">
      <n-form :model="store.wishlistEditForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称"><n-input v-model:value="store.wishlistEditForm.name" placeholder="例如：MacBook Pro" /></n-form-item>
        <n-form-item label="分类"><n-select v-model:value="store.wishlistEditForm.category" :options="categoryOptions" placeholder="请选择分类" /></n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="store.wishlistEditForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级"><n-select v-model:value="store.wishlistEditForm.priority" :options="priorityOptions" /></n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.wishlistEditForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="store.showWishlistEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateWishlist">保存</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 录入新资产弹窗 -->
    <n-modal v-model:show="store.showAddModal" preset="card" title="录入新资产" style="width: 500px; border-radius: 16px;">
      <n-form :model="store.formData" label-placement="left" label-width="auto">
        <n-form-item label="物品名称"><n-input v-model:value="store.formData.name" placeholder="例如：iPhone 15 Pro" /></n-form-item>
        <n-form-item label="分类"><n-select v-model:value="store.formData.category" :options="categoryOptions" placeholder="请选择分类" /></n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="store.formData.buy_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="购入日期">
          <n-date-picker v-model:formatted-value="store.formData.buy_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" @update:value="handleDateChange" />
        </n-form-item>
        <n-form-item label="保修截止">
          <n-date-picker v-model:formatted-value="store.formData.warranty_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.formData.remark" type="textarea" placeholder="添加备注..." :autosize="{ minRows: 1, maxRows: 3 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="store.showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存资产</n-button>
        </div>
      </template>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAssetStore } from "./stores/assetStore";
import type { Asset } from "./types";
import {
  NConfigProvider, NForm, NFormItem, NInput, NInputNumber,
  NButton, NDatePicker, NGrid, NGi, NIcon,
  NSelect, NTag, NModal, NDescriptions, NDescriptionsItem, NDivider,
  createDiscreteApi,
} from "naive-ui";
import { InformationCircleOutline, CreateOutline, TrashOutline, TrendingUpOutline,
         HomeOutline, HeartOutline, TimeOutline, BarChartOutline } from "@vicons/ionicons5";
import { initDatabase } from "./db";
import AssetList from './components/AssetList.vue';
import Wishlist from './components/Wishlist.vue';
import Timeline from './components/Timeline.vue';
import Charts from './components/Charts.vue';

const store = useAssetStore();
const { message } = createDiscreteApi(["message"]);
const isScrolled = ref(false);
const currentTime = ref(new Date());

const tabs = [
  { name: 'home', icon: HomeOutline },
  { name: 'wishlist', icon: HeartOutline },
  { name: 'timeline', icon: TimeOutline },
  { name: 'stats', icon: BarChartOutline },
];

const toggleLang = () => {
  store.currentLocale = store.currentLocale === 'zh' ? 'en' : 'zh';
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const themeOverrides = {
  common: {
    fontFamily: "'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif",
    primaryColor: '#3b6fd4',
    primaryColorHover: '#5585e0',
    primaryColorPressed: '#2a57b8',
    primaryColorSuppl: '#5585e0',
    borderRadius: '10px',
    borderRadiusSmall: '7px',
  },
  Card: {
    borderRadius: '14px',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
  },
};

const categoryOptions = [
  { label: "电子产品", value: "电子产品" },
  { label: "家具家电", value: "家具家电" },
  { label: "服装配饰", value: "服装配饰" },
  { label: "运动器材", value: "运动器材" },
  { label: "书籍文具", value: "书籍文具" },
  { label: "消耗品", value: "消耗品" },
  { label: "其他", value: "其他" },
];

const statusOptions = [
  { label: "全部", value: "" },
  { label: "保障中", value: "0" },
  { label: "活跃中", value: "1" },
  { label: "已退役", value: "2" },
  { label: "已用完", value: "3" },
  { label: "已售出", value: "4" }
];

const statusTextMap: Record<number, string> = { 0: "保障中", 1: "活跃中", 2: "已退役", 3: "已用完", 4: "已售出" };

const priorityOptions = [
  { label: "一般", value: 0 },
  { label: "中等", value: 1 },
  { label: "重要", value: 2 },
  { label: "非常重要", value: 3 }
];

const getHoldDays = (item: any | null) => {
  if (!item) return 0;
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : currentTime.value;
  const days = Math.floor((endDate.getTime() - buyDate.getTime()) / 86400000) + 1;
  return Math.max(1, days);
};

const getDailyCost = (item: Asset | null) => {
  if (!item) return 0;
  const days = getHoldDays(item);
  const sellPrice = item.status === 1 ? (item.sell_price || 0) : 0;
  return (item.buy_price - sellPrice) / days;
};

const getStatusText = (status: number | undefined) => statusTextMap[status as number] || "未知";
const getStatusType = (status: number | undefined): "primary" | "default" | "success" | "error" | "warning" | "info" => {
  const typeMap: Record<number, "primary" | "default" | "success" | "error" | "warning" | "info"> = {
    0: "info", 1: "success", 2: "default", 3: "warning", 4: "error"
  };
  return typeMap[status as number] || "default";
};

const handleDateChange = (val: any) => {
  if (!val) return;
  const date = new Date(val);
  if (isNaN(date.getTime())) return;
  date.setFullYear(date.getFullYear() + 1);
  store.formData.warranty_date = date.toISOString().split("T")[0];
};

const today = new Date().toISOString().split("T")[0];
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
const defaultNextYear = nextYear.toISOString().split("T")[0];

const refreshData = async () => {
  if (!store.dbInstance) return;
  currentTime.value = new Date();
  store.assetList = await store.dbInstance.select("SELECT * FROM assets ORDER BY id DESC");
  store.wishlist = await store.dbInstance.select("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC");
  const stats: any[] = await store.dbInstance.select("SELECT COUNT(*) as count, SUM(buy_price) as total FROM assets");
  store.assetCount = stats[0].count || 0;
  store.totalInvestment = stats[0].total || 0;
};

const handleSave = async () => {
  if (!store.formData.name || !store.formData.buy_price) { message.warning("请输入名称和价格"); return; }
  try {
    await store.dbInstance.execute(`INSERT INTO assets (name, buy_price, buy_date, warranty_date, category, status, remark) VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [store.formData.name, store.formData.buy_price, store.formData.buy_date, store.formData.warranty_date, store.formData.category, store.formData.remark || ""]);
    message.success("已保存");
    store.formData = { name: "", buy_price: 0, buy_date: today, warranty_date: defaultNextYear, category: "电子产品", remark: "" };
    store.showAddModal = false;
    await refreshData();
  } catch (e) { message.error("保存失败"); }
};

const handleEdit = (item: any) => {
  if (!item) return;
  store.editingId = item.id;
  store.editForm = { name: item.name, buy_price: item.buy_price, buy_date: item.buy_date, warranty_date: item.warranty_date || "", category: item.category, remark: item.remark || "" };
  store.showDetailModal = false;
  store.showEditModal = true;
};

const handleUpdate = async () => {
  if (!store.editForm.name || !store.editForm.buy_price) { message.warning("请输入名称和价格"); return; }
  try {
    await store.dbInstance.execute(`UPDATE assets SET name=?, buy_price=?, buy_date=?, warranty_date=?, category=?, remark=? WHERE id=?`,
      [store.editForm.name, store.editForm.buy_price, store.editForm.buy_date, store.editForm.warranty_date, store.editForm.category, store.editForm.remark || "", store.editingId]);
    message.success("已更新");
    store.showEditModal = false;
    await refreshData();
  } catch (e) { message.error("更新失败"); }
};

const handleSell = (item: any) => {
  if (!item) return;
  store.sellingId = item.id;
  store.sellForm = { name: item.name, buy_price: item.buy_price, sell_price: item.buy_price, sell_date: today, new_status: item.status };
  store.showDetailModal = false;
  store.showSellModal = true;
};

const handleConfirmStatusChange = async () => {
  if (store.sellForm.new_status === 4 && !store.sellForm.sell_price) { message.warning("请输入卖出价格"); return; }
  try {
    if (store.sellForm.new_status === 4) {
      await store.dbInstance.execute(`UPDATE assets SET status=?, sell_price=?, sell_date=? WHERE id=?`,
        [store.sellForm.new_status, store.sellForm.sell_price, store.sellForm.sell_date, store.sellingId]);
    } else {
      await store.dbInstance.execute(`UPDATE assets SET status=? WHERE id=?`, [store.sellForm.new_status, store.sellingId]);
    }
    message.success("状态已变更");
    store.showSellModal = false;
    await refreshData();
  } catch (e) { message.error("操作失败"); }
};

const handleDelete = async (id: number | undefined) => {
  if (!id) return;
  try {
    await store.dbInstance.execute("DELETE FROM assets WHERE id = ?", [id]);
    message.info("已删除");
    store.showDetailModal = false;
    await refreshData();
  } catch (e) { message.error("删除失败"); }
};

const handleSaveWishlist = async () => {
  if (!store.wishlistForm.name) { message.warning("请输入名称"); return; }
  try {
    await store.dbInstance.execute(`INSERT INTO wishlist (name, category, expected_price, priority, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [store.wishlistForm.name, store.wishlistForm.category, store.wishlistForm.expected_price, store.wishlistForm.priority, store.wishlistForm.remark || "", new Date().toISOString().split("T")[0]]);
    message.success("已添加到心愿清单");
    store.showWishlistModal = false;
    await refreshData();
  } catch (e) { message.error("添加失败"); }
};

const handleUpdateWishlist = async () => {
  if (!store.wishlistEditForm.name) { message.warning("请输入名称"); return; }
  try {
    await store.dbInstance.execute(`UPDATE wishlist SET name=?, category=?, expected_price=?, priority=?, remark=? WHERE id=?`,
      [store.wishlistEditForm.name, store.wishlistEditForm.category, store.wishlistEditForm.expected_price, store.wishlistEditForm.priority, store.wishlistEditForm.remark || "", store.editingWishlistId]);
    message.success("已更新");
    store.showWishlistEditModal = false;
    await refreshData();
  } catch (e) { message.error("更新失败"); }
};

onMounted(async () => {
  window.addEventListener('scroll', handleScroll);
  try {
    store.dbInstance = await initDatabase();
    await refreshData();
    setInterval(() => { currentTime.value = new Date(); }, 60000);
  } catch (e) { console.error("数据库初始化失败", e); }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --color-bg: #f4f6fb;
  --color-surface: #ffffff;
  --color-border: #e8ecf4;
  --color-primary: #3b6fd4;
  --color-primary-soft: #edf2fd;
  --color-text-main: #1a2035;
  --color-text-sub: #6b7799;
  --color-text-muted: #9ba8c5;
  --color-success: #3da871;
  --color-danger: #e05c5c;
  --color-warning: #d4933b;
  --nav-height: 62px;
  --shadow-card: 0 2px 12px rgba(30, 50, 100, 0.07);
  --shadow-nav: 0 4px 24px rgba(30, 50, 100, 0.13);
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg);
  font-family: 'Noto Sans SC', -apple-system, 'PingFang SC', sans-serif;
  color: var(--color-text-main);
  -webkit-font-smoothing: antialiased;
}

/* ===== 悬浮导航栏 ===== */
.floating-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 10px 24px;
  background: rgba(244, 246, 251, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.floating-nav.nav-scrolled {
  background: rgba(255, 255, 255, 0.92);
  border-bottom-color: var(--color-border);
  box-shadow: var(--shadow-nav);
}

.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 20px;
  color: var(--color-primary);
  line-height: 1;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-main);
  letter-spacing: 0.04em;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(59, 111, 212, 0.06);
  border-radius: 12px;
  padding: 4px;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  background: transparent;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-sub);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.nav-tab:hover {
  color: var(--color-primary);
  background: rgba(59, 111, 212, 0.08);
}

.nav-tab.active {
  color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 1px 6px rgba(59, 111, 212, 0.15);
  font-weight: 600;
}

.lang-toggle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.lang-toggle:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.lang-icon {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
}

/* ===== 主内容区 ===== */
.main-content {
  padding-top: calc(var(--nav-height) + 20px);
  min-height: 100vh;
}

.page-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

/* ===== Tab 切换动画 ===== */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== 通用组件样式 ===== */
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95em;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.status-tag {
  margin-left: 8px;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.chart-card {
  background: var(--color-bg);
  border-radius: 12px;
  padding: 16px;
  height: 100%;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-sub);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-desc {
  font-size: 13.5px;
}

/* ===== Naive UI 全局覆盖 ===== */
.n-card {
  --n-border-radius: 14px !important;
  box-shadow: var(--shadow-card) !important;
  border: 1px solid var(--color-border) !important;
}

.n-card .n-card-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
}

.n-button {
  font-family: 'Noto Sans SC', sans-serif !important;
  font-weight: 500 !important;
  letter-spacing: 0.01em;
}

.n-input, .n-select, .n-date-picker {
  font-family: 'Noto Sans SC', sans-serif !important;
}

/* 滚动条 */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c8d0e4; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #a0aec8; }

/* 响应式 */
@media (max-width: 640px) {
  .nav-tab span { display: none; }
  .nav-tab { padding: 8px 12px; }
  .brand-name { font-size: 16px; }
  .page-container { padding: 16px 12px 40px; }
}
</style>