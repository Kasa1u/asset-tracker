<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-space vertical size="large" style="padding: 24px">
      <n-space justify="space-between" align="center" style="width: 100%">
        <n-gradient-text type="info" :size="28" style="font-weight: bold">
          {{ store.t("appName") }}
        </n-gradient-text>
        <n-button-group>
          <n-button 
            quaternary 
            :type="store.currentLocale === 'zh' ? 'primary' : 'default'" 
            @click="store.currentLocale = 'zh'"
          >
            中文
          </n-button>
          <n-button 
            quaternary 
            :type="store.currentLocale === 'en' ? 'primary' : 'default'" 
            @click="store.currentLocale = 'en'"
          >
            English
          </n-button>
        </n-button-group>
      </n-space>

      <n-tabs v-model:value="store.currentTab" type="line" animated>
        <n-tab-pane name="home" :tab="store.t('home')">
          <AssetList />
        </n-tab-pane>

        <n-tab-pane name="wishlist" :tab="store.t('wishlist')">
          <Wishlist />
        </n-tab-pane>

        <n-tab-pane name="timeline" :tab="store.t('timeline')">
          <Timeline />
        </n-tab-pane>

        <n-tab-pane name="stats" :tab="store.t('stats')">
          <Charts />
        </n-tab-pane>
      </n-tabs>
    </n-space>

    <n-modal v-model:show="store.showDetailModal" preset="card" style="width: 800px; max-width: 95vw">
      <template #header>
        <n-space align="center">
          <n-icon size="20" :component="InformationCircleOutline" />
          <span>资产详情</span>
        </n-space>
      </template>
      <template #header-extra>
        <n-tag :type="getStatusType(store.currentAsset?.status)" size="small">
          {{ getStatusText(store.currentAsset?.status) }}
        </n-tag>
      </template>
      <n-grid :cols="2" :x-gap="24">
        <n-gi>
          <n-descriptions label-placement="left" :column="1" bordered size="small">
            <n-descriptions-item label="物品名称">{{ store.currentAsset?.name }}</n-descriptions-item>
            <n-descriptions-item label="分类">{{ store.currentAsset?.category }}</n-descriptions-item>
            <n-descriptions-item label="购入价格">¥{{ store.currentAsset?.buy_price?.toFixed(2) }}</n-descriptions-item>
            <n-descriptions-item label="购入日期">{{ store.currentAsset?.buy_date }}</n-descriptions-item>
            <n-descriptions-item label="保修截止">{{ store.currentAsset?.warranty_date || '-' }}</n-descriptions-item>
            <n-descriptions-item label="持有天数">{{ getHoldDays(store.currentAsset) }} 天</n-descriptions-item>
            <n-descriptions-item label="日均成本">
              <span :style="{ color: getDailyCost(store.currentAsset) > 1 ? '#d03050' : '#18a058' }">
                ¥{{ getDailyCost(store.currentAsset).toFixed(2) }}
              </span>
            </n-descriptions-item>
            <n-descriptions-item label="备注">{{ store.currentAsset?.remark || '-' }}</n-descriptions-item>
          </n-descriptions>
          <template v-if="store.currentAsset?.status === 4">
            <n-divider style="margin: 12px 0" />
            <n-descriptions label-placement="left" :column="1" bordered size="small">
              <n-descriptions-item label="卖出价格">¥{{ store.currentAsset?.sell_price?.toFixed(2) }}</n-descriptions-item>
              <n-descriptions-item label="卖出日期">{{ store.currentAsset?.sell_date }}</n-descriptions-item>
              <n-descriptions-item label="收益">
                <span :style="{ color: ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)) >= 0 ? '#18a058' : '#d03050' }">
                  {{ ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)) >= 0 ? '+' : '' }}¥{{ ((store.currentAsset?.sell_price || 0) - (store.currentAsset?.buy_price || 0)).toFixed(2) }}
                </span>
              </n-descriptions-item>
            </n-descriptions>
          </template>
          <n-divider style="margin: 12px 0" />
          <n-space>
            <n-button type="primary" @click="handleEdit(store.currentAsset)" :disabled="store.currentAsset?.status === 1">
              <template #icon><n-icon :component="CreateOutline" /></template>
              编辑
            </n-button>
            <n-button type="warning" @click="handleSell(store.currentAsset)">
              <template #icon><n-icon :component="TrendingUpOutline" /></template>
              状态变更
            </n-button>
            <n-button type="error" @click="handleDelete(store.currentAsset?.id)">
              <template #icon><n-icon :component="TrashOutline" /></template>
              删除
            </n-button>
          </n-space>
        </n-gi>
        <n-gi>
          <n-card title="日均成本趋势" size="small">
            <div ref="detailChartRef" style="height: 400px"></div>
          </n-card>
        </n-gi>
      </n-grid>
    </n-modal>

    <n-modal v-model:show="store.showEditModal" preset="card" title="编辑资产" style="width: 500px">
      <n-form :model="store.editForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="store.editForm.name" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="store.editForm.category" :options="categoryOptions" />
        </n-form-item>
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
        <n-space justify="end">
          <n-button @click="store.showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdate">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="store.showSellModal" preset="card" title="状态变更" style="width: 500px">
      <n-form :model="store.sellForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="store.sellForm.name" disabled />
        </n-form-item>
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
        <n-space justify="end">
          <n-button @click="store.showSellModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmStatusChange">确认变更</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="store.showWishlistModal" preset="card" title="添加心愿" style="width: 500px">
      <n-form :model="store.wishlistForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称">
          <n-input v-model:value="store.wishlistForm.name" placeholder="例如：MacBook Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="store.wishlistForm.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="store.wishlistForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="store.wishlistForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.wishlistForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="store.showWishlistModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveWishlist">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="store.showWishlistEditModal" preset="card" title="编辑心愿" style="width: 500px">
      <n-form :model="store.wishlistEditForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称">
          <n-input v-model:value="store.wishlistEditForm.name" placeholder="例如：MacBook Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="store.wishlistEditForm.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="store.wishlistEditForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="store.wishlistEditForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="store.wishlistEditForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="store.showWishlistEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateWishlist">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="store.showAddModal" preset="card" title="录入新资产" style="width: 500px">
      <n-form :model="store.formData" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="store.formData.name" placeholder="例如：iPhone 15 Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="store.formData.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
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
        <n-space justify="end">
          <n-button @click="store.showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存资产</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useAssetStore } from "./stores/assetStore";
import type { Asset } from "./types";

const store = useAssetStore();

import {
  NConfigProvider, NSpace, NCard, NForm, NFormItem, NInput, NInputNumber,
  NButton, NGradientText, NDatePicker, NGrid, NGi, NIcon,
  NSelect, NTag, NModal, NDescriptions, NDescriptionsItem, NDivider,
  NTabs, NTabPane, createDiscreteApi,
} from "naive-ui";
import { InformationCircleOutline, CreateOutline, TrashOutline, TrendingUpOutline } from "@vicons/ionicons5";
import { initDatabase } from "./db";
import AssetList from './components/AssetList.vue';
import Wishlist from './components/Wishlist.vue';
import Timeline from './components/Timeline.vue';
import Charts from './components/Charts.vue';

const { message } = createDiscreteApi(["message"]);

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

const statusTextMap: Record<number, string> = {
  0: "保障中",
  1: "活跃中",
  2: "已退役",
  3: "已用完",
  4: "已售出"
};



const themeOverrides = {
  common: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a'
  }
};

const currentTime = ref(new Date());

const today = new Date().toISOString().split("T")[0];
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
const defaultNextYear = nextYear.toISOString().split("T")[0];

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
  const cost = (item.buy_price - sellPrice) / days;
  return cost;
};

const getStatusText = (status: number | undefined) => statusTextMap[status as number] || "未知";
const getStatusType = (status: number | undefined): "primary" | "default" | "success" | "error" | "warning" | "info" => {
  const typeMap: Record<number, "primary" | "default" | "success" | "error" | "warning" | "info"> = {
    0: "info",
    1: "success",
    2: "default",
    3: "warning",
    4: "error"
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

const refreshData = async () => {
  if (!store.dbInstance) return;
  currentTime.value = new Date();
  store.assetList = await store.dbInstance.select("SELECT * FROM assets ORDER BY id DESC");
  store.wishlist = await store.dbInstance.select("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC");
  const stats: any[] = await store.dbInstance.select("SELECT COUNT(*) as count, SUM(buy_price) as total FROM assets");
  store.assetCount = stats[0].count || 0;
  store.totalInvestment = stats[0].total || 0;
  nextTick(() => {
    // Charts component will handle its own initialization
  });
};

const handleSave = async () => {
  if (!store.formData.name || !store.formData.buy_price) { message.warning("请输入名称和价格"); return; }
  try {
    await store.dbInstance.execute(`INSERT INTO assets (name, buy_price, buy_date, warranty_date, category, status, remark) VALUES (?, ?, ?, ?, ?, 0, ?)`, [store.formData.name, store.formData.buy_price, store.formData.buy_date, store.formData.warranty_date, store.formData.category, store.formData.remark || ""]);
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
    await store.dbInstance.execute(`UPDATE assets SET name=?, buy_price=?, buy_date=?, warranty_date=?, category=?, remark=? WHERE id=?`, [store.editForm.name, store.editForm.buy_price, store.editForm.buy_date, store.editForm.warranty_date, store.editForm.category, store.editForm.remark || "", store.editingId]);       
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
  if (store.sellForm.new_status === 4 && !store.sellForm.sell_price) { 
    message.warning("请输入卖出价格"); 
    return; 
  }
  try {
    if (store.sellForm.new_status === 4) {
      await store.dbInstance.execute(`UPDATE assets SET status=?, sell_price=?, sell_date=? WHERE id=?`, [store.sellForm.new_status, store.sellForm.sell_price, store.sellForm.sell_date, store.sellingId]);
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
    await store.dbInstance.execute(`INSERT INTO wishlist (name, category, expected_price, priority, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
      store.wishlistForm.name,
      store.wishlistForm.category,
      store.wishlistForm.expected_price,
      store.wishlistForm.priority,
      store.wishlistForm.remark || "",
      new Date().toISOString().split("T")[0]
    ]);
    message.success("已添加到心愿清单");
    store.showWishlistModal = false;
    await refreshData();
  } catch (e) { message.error("添加失败"); }
};

const handleUpdateWishlist = async () => {
  if (!store.wishlistEditForm.name) { message.warning("请输入名称"); return; }
  try {
    await store.dbInstance.execute(`UPDATE wishlist SET name=?, category=?, expected_price=?, priority=?, remark=? WHERE id=?`, [
      store.wishlistEditForm.name,
      store.wishlistEditForm.category,
      store.wishlistEditForm.expected_price,
      store.wishlistEditForm.priority,
      store.wishlistEditForm.remark || "",
      store.editingWishlistId
    ]);
    message.success("已更新");
    store.showWishlistEditModal = false;
    await refreshData();
  } catch (e) { message.error("更新失败"); }
};



onMounted(async () => {
  try {
    store.dbInstance = await initDatabase();
    await refreshData();
    setInterval(() => {
      currentTime.value = new Date();
    }, 60000);
  } catch (e) { console.error("数据库初始化失败", e); }
});
</script>

<style>
.asset-card { cursor: pointer; transition: all 0.2s; }
.asset-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.label { color: #666; font-size: 12px; }
</style>
