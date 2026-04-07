import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Asset, WishlistItem, Locale } from "../types";
import { initDatabase } from "../db";

export const useAssetStore = defineStore("asset", () => {
  const dbInstance = ref<any>(null);
  const assetList = ref<Asset[]>([]);
  const wishlist = ref<WishlistItem[]>([]);
  const totalInvestment = ref(0);
  const assetCount = ref(0);
  const currentTab = ref("home");
  const searchKeyword = ref("");
  const filterCategory = ref("");
  const filterStatus = ref("");
  const sortBy = ref("id_desc");
  const chartTimeRange = ref<"3" | "6" | "12" | "all">("6");
  const currentLocale = ref<Locale>("zh");
  const showAddModal = ref(false);
  const showEditModal = ref(false);
  const showSellModal = ref(false);
  const showDetailModal = ref(false);
  const showWishlistModal = ref(false);
  const showWishlistEditModal = ref(false);
  const editingId = ref<number | null>(null);
  const sellingId = ref<number | null>(null);
  const editingWishlistId = ref<number | null>(null);
  const currentAsset = ref<Asset | null>(null);
  
  const formData = ref({
    name: "",
    buy_price: 0,
    buy_date: new Date().toISOString().split("T")[0],
    warranty_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    category: "电子产品",
    remark: ""
  });
  
  const editForm = ref({
    name: "",
    buy_price: 0,
    buy_date: new Date().toISOString().split("T")[0],
    warranty_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    category: "电子产品",
    remark: ""
  });
  
  const sellForm = ref({
    name: "",
    buy_price: 0,
    sell_price: 0,
    sell_date: new Date().toISOString().split("T")[0],
    new_status: 0
  });
  
  const wishlistForm = ref({
    name: "",
    category: "电子产品",
    expected_price: 0,
    priority: 0,
    remark: ""
  });
  
  const wishlistEditForm = ref({
    name: "",
    category: "电子产品",
    expected_price: 0,
    priority: 0,
    remark: ""
  });

  const initDB = async () => {
    dbInstance.value = await initDatabase();
  };

  const refreshData = async () => {
    if (!dbInstance.value) return;
    assetList.value = await dbInstance.value.select("SELECT * FROM assets ORDER BY id DESC");
    wishlist.value = await dbInstance.value.select("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC");
    const stats: any[] = await dbInstance.value.select("SELECT COUNT(*) as count, SUM(buy_price) as total FROM assets");
    assetCount.value = stats[0].count || 0;
    totalInvestment.value = stats[0].total || 0;
  };

  const t = (key: string) => {
    const messages: Record<Locale, any> = {
      zh: {
        appName: "有数 - 个人资产管理",
        home: "首页",
        wishlist: "心愿清单",
        timeline: "时间轴",
        stats: "统计分析",
        assets: "资产",
        add: "录入新资产",
        search: "搜索",
        sort: "排序方式",
        totalAssets: "总资产",
        dailyCost: "日均成本",
        assetCount: "资产数量",
        all: "全部",
        underWarranty: "保障中",
        active: "活跃中",
        retired: "已退役",
        usedUp: "已用完",
        sold: "已售出",
        electronics: "电子产品",
        furniture: "家具家电",
        clothing: "服装配饰",
        sports: "运动器材",
        books: "书籍文具",
        consumables: "消耗品",
        other: "其他",
        reminder: "提醒",
        warrantyExpiring: "个资产保修即将到期",
        daysLeft: "天",
        highPriorityWishlist: "个高优先级心愿",
        expectedPrice: "预期",
        sortOptions: {
          id_desc: "最新添加",
          id_asc: "最早添加",
          date_desc: "最新购买",
          date_asc: "最早购买",
          price_desc: "价格最高",
          price_asc: "价格最低",
          dailyCost_desc: "日均最贵",
          dailyCost_asc: "日均最便宜"
        },
        itemName: "物品名称",
        category: "分类",
        buyPrice: "购入价格",
        buyDate: "购入日期",
        warrantyDate: "保修截止",
        remark: "备注",
        save: "保存",
        cancel: "取消",
        edit: "编辑",
        delete: "删除",
        sell: "售出",
        sellPrice: "售出价格",
        sellDate: "售出日期",
        assetDetail: "资产详情",
        holdDays: "持有天数",
        chartRange: {
          "3": "近3个月",
          "6": "近6个月",
          "12": "近12个月",
          "all": "全部"
        }
      },
      en: {
        appName: "Asset Tracker",
        home: "Home",
        wishlist: "Wishlist",
        timeline: "Timeline",
        stats: "Statistics",
        assets: "Assets",
        add: "Add Asset",
        search: "Search",
        sort: "Sort by",
        totalAssets: "Total Assets",
        dailyCost: "Daily Cost",
        assetCount: "Asset Count",
        all: "All",
        underWarranty: "Under Warranty",
        active: "Active",
        retired: "Retired",
        usedUp: "Used Up",
        sold: "Sold",
        electronics: "Electronics",
        furniture: "Furniture",
        clothing: "Clothing",
        sports: "Sports",
        books: "Books",
        consumables: "Consumables",
        other: "Other",
        reminder: "Reminders",
        warrantyExpiring: "assets with expiring warranty",
        daysLeft: "days left",
        highPriorityWishlist: "high priority wishes",
        expectedPrice: "Expected",
        sortOptions: {
          id_desc: "Latest Added",
          id_asc: "Earliest Added",
          date_desc: "Latest Purchased",
          date_asc: "Earliest Purchased",
          price_desc: "Highest Price",
          price_asc: "Lowest Price",
          dailyCost_desc: "Most Expensive/Day",
          dailyCost_asc: "Cheapest/Day"
        },
        itemName: "Item Name",
        category: "Category",
        buyPrice: "Purchase Price",
        buyDate: "Purchase Date",
        warrantyDate: "Warranty Expires",
        remark: "Remark",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        sell: "Sell",
        sellPrice: "Sell Price",
        sellDate: "Sell Date",
        assetDetail: "Asset Detail",
        holdDays: "Days Held",
        chartRange: {
          "3": "Last 3 months",
          "6": "Last 6 months",
          "12": "Last 12 months",
          "all": "All time"
        }
      }
    };
    const keys = key.split(".");
    let result: any = messages[currentLocale.value];
    for (const k of keys) {
      result = result[k];
      if (!result) return key;
    }
    return result;
  };

  const sortOptions = computed(() => [
    { label: t("sortOptions.id_desc"), value: "id_desc" },
    { label: t("sortOptions.id_asc"), value: "id_asc" },
    { label: t("sortOptions.date_desc"), value: "date_desc" },
    { label: t("sortOptions.date_asc"), value: "date_asc" },
    { label: t("sortOptions.price_desc"), value: "price_desc" },
    { label: t("sortOptions.price_asc"), value: "price_asc" },
    { label: t("sortOptions.dailyCost_desc"), value: "dailyCost_desc" },
    { label: t("sortOptions.dailyCost_asc"), value: "dailyCost_asc" }
  ]);

  const chartRangeOptions = computed(() => [
    { label: t("chartRange.3"), value: "3" },
    { label: t("chartRange.6"), value: "6" },
    { label: t("chartRange.12"), value: "12" },
    { label: t("chartRange.all"), value: "all" }
  ]);

  const handleDeleteWishlist = async (id: number) => {
    if (!dbInstance.value) return;
    try {
      await dbInstance.value.execute("DELETE FROM wishlist WHERE id = ?", [id]);
      await refreshData();
    } catch (e) {
      console.error("删除心愿失败:", e);
    }
  };

  return {
    dbInstance,
    assetList,
    wishlist,
    totalInvestment,
    assetCount,
    currentTab,
    searchKeyword,
    filterCategory,
    filterStatus,
    sortBy,
    chartTimeRange,
    currentLocale,
    showAddModal,
    showEditModal,
    showSellModal,
    showDetailModal,
    showWishlistModal,
    showWishlistEditModal,
    editingId,
    sellingId,
    editingWishlistId,
    currentAsset,
    formData,
    editForm,
    sellForm,
    wishlistForm,
    wishlistEditForm,
    initDB,
    refreshData,
    t,
    sortOptions,
    chartRangeOptions,
    handleDeleteWishlist
  };
});
