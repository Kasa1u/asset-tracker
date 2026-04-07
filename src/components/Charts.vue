<template>
  <n-card size="small">
    <template #header>
      <n-space align="center" justify="space-between" style="width: 100%">
        <n-space align="center">
          <n-icon size="18" :component="BarChartOutline" />
          <span>{{ store.t("stats") }}</span>
        </n-space>
        <n-select 
          v-model:value="store.chartTimeRange" 
          :options="store.chartRangeOptions"
          size="small"
          style="width: 140px"
        />
      </n-space>
    </template>
    <n-space vertical size="large">
      <n-grid :cols="5" :x-gap="12" :y-gap="12">
        <n-gi v-for="status in [0, 1, 2, 3, 4]" :key="status">
          <n-statistic :label="statusTextMap[status]" size="small">
            <template #prefix>
              <n-icon :component="EllipseOutline" :style="{ color: statusColorMap[status] }" size="12" />
            </template>
            <template #suffix>
              <span style="font-size: 12px; color: #999">
                ({{ store.totalInvestment > 0 ? ((getAssetsByStatus(status) / store.totalInvestment) * 100).toFixed(1) : 0 }}%)
              </span>
            </template>
            ¥{{ getAssetsByStatus(status).toFixed(0) }}
          </n-statistic>
        </n-gi>
      </n-grid>
      <n-grid :cols="24" :x-gap="20" :y-gap="20">
        <n-gi :span="24">
          <n-card title="总资产分布" size="small">
            <div ref="statusBarChartRef" style="height: 200px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="12">
          <n-card title="分类占比" size="small">
            <div ref="categoryBarChartRef" style="height: 250px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="12">
          <n-card title="分类持仓" size="small">
            <div ref="categoryPieChartRef" style="height: 250px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="12">
          <n-card :title="`状态总览 (${store.assetCount}项)`" size="small">
            <div ref="statusOverviewRef" style="height: 250px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="12">
          <n-card title="持有周期" size="small">
            <div ref="holdPeriodRef" style="height: 250px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="12">
          <n-card title="资产价格与日均成本关系" size="small">
            <div ref="scatterChartRef" style="height: 250px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="24">
          <n-card :title="`整体日均成本趋势（近${store.chartTimeRange === 'all' ? '全部' : store.chartTimeRange}个月）`" size="small">
            <div ref="barChartRef" style="height: 300px"></div>
          </n-card>
        </n-gi>
        <n-gi :span="24">
          <n-card title="每月资产增加趋势" size="small">
            <div ref="monthlyChartRef" style="height: 300px"></div>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </n-card>
</template>

<script lang="ts">
export default {
  name: 'Charts'
}
</script>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import { BarChartOutline, EllipseOutline } from '@vicons/ionicons5';
import * as echarts from 'echarts';
import {
  NCard, NSpace, NIcon, NSelect, NGrid, NGi, 
  NStatistic
} from "naive-ui";

const store = useAssetStore();

const barChartRef = ref<HTMLElement>();
const statusBarChartRef = ref<HTMLElement>();
const categoryBarChartRef = ref<HTMLElement>();
const categoryPieChartRef = ref<HTMLElement>();
const statusOverviewRef = ref<HTMLElement>();
const holdPeriodRef = ref<HTMLElement>();
const scatterChartRef = ref<HTMLElement>();
const monthlyChartRef = ref<HTMLElement>();

let barChart: echarts.ECharts | null = null;
let statusBarChart: echarts.ECharts | null = null;
let categoryBarChart: echarts.ECharts | null = null;
let categoryPieChart: echarts.ECharts | null = null;
let statusOverviewChart: echarts.ECharts | null = null;
let holdPeriodChart: echarts.ECharts | null = null;
let scatterChart: echarts.ECharts | null = null;
let monthlyChart: echarts.ECharts | null = null;

const currentTime = new Date();

const statusColorMap: Record<number, string> = {
  0: '#18a058',
  1: '#2080f0',
  2: '#f0a020',
  3: '#d03050',
  4: '#909399'
};

const statusTextMap: Record<number, string> = {
  0: '保障中',
  1: '活跃中',
  2: '已退役',
  3: '已用完',
  4: '已售出'
};

const getAssetsByStatus = (status: number) => {
  return store.assetList.reduce((sum, item) => {
    return item.status === status ? sum + item.buy_price : sum;
  }, 0);
};

const getCountByStatus = (status: number) => {
  return store.assetList.reduce((count, item) => {
    return item.status === status ? count + 1 : count;
  }, 0);
};

const getHoldPeriod = (item: any) => {
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : currentTime;
  const days = Math.floor((endDate.getTime() - buyDate.getTime()) / 86400000);
  return days;
};

const getHoldPeriodCategory = (days: number) => {
  if (days < 90) return "0-3个月";
  if (days < 180) return "3-6个月";
  if (days < 365) return "6-12个月";
  if (days < 730) return "1-2年";
  if (days < 1095) return "2-3年";
  return "3年以上";
};

const getDailyCost = (item: any): number => {
  const days = getHoldPeriod(item);
  if (days <= 0) return 0;
  const sellPrice = item.status === 4 && item.sell_date ? (item.sell_price || 0) : 0;
  return (item.buy_price - sellPrice) / days;
};

const initCharts = () => {
  if (barChartRef.value) {
    if (barChart) barChart.dispose();
    barChart = echarts.init(barChartRef.value);
    const now = currentTime;
    const dailyCostData: [string, string][] = [];
    const endDate = new Date(now);
    
    if (store.chartTimeRange === "3") {
      endDate.setMonth(endDate.getMonth() - 3);
    } else if (store.chartTimeRange === "6") {
      endDate.setMonth(endDate.getMonth() - 6);
    } else if (store.chartTimeRange === "12") {
      endDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      const allDates = store.assetList.map(item => new Date(item.buy_date));
      if (allDates.length > 0) {
        endDate.setTime(Math.min(...allDates.map(d => d.getTime())));
      }
    }
    
    const step = store.chartTimeRange === "all" ? 7 : 3;
    for (let d = new Date(endDate); d <= now; d.setDate(d.getDate() + step)) {
      const dateStr = d.toISOString().split("T")[0];
      const totalCost = store.assetList.reduce((sum, item) => {
        const buyDate = new Date(item.buy_date);
        if (buyDate > d) return sum;
        const endDateForItem = item.status === 4 && item.sell_date ? new Date(item.sell_date) : d;
        if (endDateForItem < buyDate) return sum;
        const days = Math.max(1, Math.floor((endDateForItem.getTime() - buyDate.getTime()) / 86400000) + 1);
        const sellPrice = item.status === 4 && item.sell_date ? (item.sell_price || 0) : 0;
        const cost = (item.buy_price - sellPrice) / days;
        return sum + cost;
      }, 0);
      dailyCostData.push([dateStr, totalCost.toFixed(2)]);
    }
    
    barChart.setOption({
      tooltip: { 
        trigger: "axis", 
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const date = dailyCostData[index][0];
          const cost = dailyCostData[index][1];
          return `${date}<br/>日均成本: ¥${cost}`;
        }
      },
      xAxis: { type: "category", data: dailyCostData.map(d => d[0].slice(5)), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: "value", name: "¥/天" },
      series: [{ type: "line", data: dailyCostData.map(d => d[1]), smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: "#18a058" }, symbol: "none" }],
      grid: { left: "15%", right: "5%", bottom: "30%", top: "10%" },
    });
  }

  if (statusBarChartRef.value) {
    if (statusBarChart) statusBarChart.dispose();
    statusBarChart = echarts.init(statusBarChartRef.value);
    const statusLabels = [0, 1, 2, 3, 4].map(s => statusTextMap[s]);
    const statusValues = [0, 1, 2, 3, 4].map(s => getAssetsByStatus(s));
    const statusColors = [0, 1, 2, 3, 4].map(s => statusColorMap[s]);
    statusBarChart.setOption({
      tooltip: { trigger: "axis", formatter: "{b}: ¥{c}" },
      xAxis: { type: "category", data: statusLabels, axisLabel: { fontSize: 11 } },
      yAxis: { type: "value", name: "¥", axisLabel: { fontSize: 11 } },
      series: [{ type: "bar", data: statusValues.map((v, i) => ({ value: v, itemStyle: { color: statusColors[i] } })) }],
      grid: { left: "15%", right: "5%", bottom: "15%", top: "10%" },
    });
  }

  if (categoryBarChartRef.value) {
    if (categoryBarChart) categoryBarChart.dispose();
    categoryBarChart = echarts.init(categoryBarChartRef.value);
    const categoryPriceData: Record<string, number> = {};
    store.assetList.forEach(item => { categoryPriceData[item.category] = (categoryPriceData[item.category] || 0) + item.buy_price; });
    const categories = Object.keys(categoryPriceData);
    const values = Object.values(categoryPriceData);
    const colors = ["#2080f0", "#18a058", "#f0a020", "#d03050", "#909399", "#722ed1"];
    categoryBarChart.setOption({
      tooltip: { trigger: "axis", formatter: "{b}: ¥{c}" },
      xAxis: { type: "value", name: "¥", axisLabel: { fontSize: 11 } },
      yAxis: { type: "category", data: categories, axisLabel: { fontSize: 11 } },
      series: [{ 
        type: "bar", 
        data: values.map((v, i) => ({ 
          value: v, 
          itemStyle: { color: colors[i % colors.length] },
          label: { show: true, position: "right", formatter: (params: any) => `¥${(params.value / 1000).toFixed(1)}k` }
        })),
        label: { show: true }
      }],
      grid: { left: "15%", right: "20%", bottom: "5%", top: "5%" },
    });
  }

  if (categoryPieChartRef.value) {
    if (categoryPieChart) categoryPieChart.dispose();
    categoryPieChart = echarts.init(categoryPieChartRef.value);
    const categoryPieData: Record<string, number> = {};
    store.assetList.forEach(item => { categoryPieData[item.category] = (categoryPieData[item.category] || 0) + item.buy_price; });
    const colors = ["#2080f0", "#18a058", "#f0a020", "#d03050", "#909399", "#722ed1"];
    categoryPieChart.setOption({
      tooltip: { trigger: "item", formatter: "{b}: ¥{c} ({d}%)" },
      legend: { orient: "vertical", right: 10, top: "center", textStyle: { fontSize: 11 } },
      series: [{ 
        type: "pie", 
        radius: ["40%", "70%"], 
        center: ["35%", "50%"], 
        data: Object.entries(categoryPieData).map(([name, value], i) => ({ name, value, itemStyle: { color: colors[i % colors.length] } })),
        label: { show: false }
      }],
    });
  }

  if (statusOverviewRef.value) {
    if (statusOverviewChart) statusOverviewChart.dispose();
    statusOverviewChart = echarts.init(statusOverviewRef.value);
    const statusCountLabels = [0, 1, 2, 3, 4].map(s => statusTextMap[s]);
    const statusCountValues = [0, 1, 2, 3, 4].map(s => getCountByStatus(s));
    const statusColors = [0, 1, 2, 3, 4].map(s => statusColorMap[s]);
    const total = statusCountValues.reduce((a, b) => a + b, 0);
    statusOverviewChart.setOption({
      tooltip: { trigger: "axis", formatter: (params: any) => {
        const p = params[0];
        const percent = total > 0 ? ((p.value / total) * 100).toFixed(1) : 0;
        return `${p.name}: ${p.value}项 (${percent}%)`;
      } },
      xAxis: { type: "value", name: "项", axisLabel: { fontSize: 11 } },
      yAxis: { type: "category", data: statusCountLabels, axisLabel: { fontSize: 11 } },
      series: [{ 
        type: "bar", 
        data: statusCountValues.map((v, i) => ({ 
          value: v, 
          itemStyle: { color: statusColors[i] },
          label: { show: true, position: "right", formatter: (params: any) => `${params.value}项 (${total > 0 ? ((params.value / total) * 100).toFixed(1) : 0}%)` }
        }))
      }],
      grid: { left: "15%", right: "25%", bottom: "5%", top: "5%" },
    });
  }

  if (holdPeriodRef.value) {
    if (holdPeriodChart) holdPeriodChart.dispose();
    holdPeriodChart = echarts.init(holdPeriodRef.value);
    const periodLabels = ["0-3个月", "3-6个月", "6-12个月", "1-2年", "2-3年", "3年以上"];
    const periodCounts: Record<string, number> = {
      "0-3个月": 0,
      "3-6个月": 0,
      "6-12个月": 0,
      "1-2年": 0,
      "2-3年": 0,
      "3年以上": 0
    };
    store.assetList.forEach(item => {
      const days = getHoldPeriod(item);
      const category = getHoldPeriodCategory(days);
      periodCounts[category]++;
    });
    const periodValues = periodLabels.map(l => periodCounts[l]);
    const colors = ["#18a058", "#2080f0", "#722ed1", "#f0a020", "#d03050", "#909399"];
    const totalPeriod = periodValues.reduce((a, b) => a + b, 0);
    holdPeriodChart.setOption({
      tooltip: { trigger: "axis", formatter: (params: any) => {
        const p = params[0];
        const percent = totalPeriod > 0 ? ((p.value / totalPeriod) * 100).toFixed(1) : 0;
        return `${p.name}: ${p.value}项 (${percent}%)`;
      } },
      xAxis: { type: "value", name: "项", axisLabel: { fontSize: 11 } },
      yAxis: { type: "category", data: periodLabels, axisLabel: { fontSize: 11 } },
      series: [{ 
        type: "bar", 
        data: periodValues.map((v, i) => ({ 
          value: v, 
          itemStyle: { color: colors[i] },
          label: { show: true, position: "right", formatter: (params: any) => `${params.value}项 (${totalPeriod > 0 ? ((params.value / totalPeriod) * 100).toFixed(1) : 0}%)` }
        }))
      }],
      grid: { left: "15%", right: "25%", bottom: "5%", top: "5%" },
    });
  }

  if (scatterChartRef.value) {
    if (scatterChart) scatterChart.dispose();
    scatterChart = echarts.init(scatterChartRef.value);
    const scatterData = store.assetList.map(item => {
      const dailyCost = getDailyCost(item);
      return [item.buy_price, dailyCost, item.name];
    });
    scatterChart.setOption({
      tooltip: { 
        trigger: "item", 
        formatter: (params: any) => {
          return `${params.data[2]}<br/>购入价格: ¥${params.data[0]}<br/>日均成本: ¥${params.data[1].toFixed(2)}`;
        }
      },
      xAxis: { type: "value", name: "购入价格 (¥)", axisLabel: { fontSize: 11 } },
      yAxis: { type: "value", name: "日均成本 (¥/天)", axisLabel: { fontSize: 11 } },
      series: [{ 
        type: "scatter", 
        data: scatterData,
        itemStyle: { color: "#18a058", opacity: 0.6 },
        symbolSize: 8
      }],
      grid: { left: "15%", right: "10%", bottom: "15%", top: "10%" },
    });
  }

  if (monthlyChartRef.value) {
    if (monthlyChart) monthlyChart.dispose();
    monthlyChart = echarts.init(monthlyChartRef.value);
    const monthlyData: Record<string, number> = {};
    store.assetList.forEach(item => {
      const month = item.buy_date.slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + item.buy_price;
    });
    const months = Object.keys(monthlyData).sort();
    const values = months.map(m => monthlyData[m]);
    monthlyChart.setOption({
      tooltip: { trigger: "axis", formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>新增资产: ¥${p.value.toFixed(2)}`;
      } },
      xAxis: { type: "category", data: months, axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: "value", name: "新增资产 (¥)", axisLabel: { fontSize: 11 } },
      series: [{ 
        type: "bar", 
        data: values,
        itemStyle: { color: "#2080f0" },
        markLine: {
          data: [{ type: "average", name: "平均值" }]
        }
      }],
      grid: { left: "15%", right: "10%", bottom: "30%", top: "10%" },
    });
  }
};

onMounted(() => {
  nextTick(() => {
    initCharts();
  });
});

watch([() => store.assetList.length, () => store.chartTimeRange], () => {
  nextTick(() => {
    initCharts();
  });
});
</script>

<style scoped>
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

/* 统计卡片样式 */
.n-statistic {
  transition: all 0.3s ease;
}

.n-statistic:hover {
  transform: scale(1.02);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .n-grid {
    grid-template-columns: repeat(1, 1fr) !important;
  }
  
  .n-card {
    margin-bottom: 16px;
  }
}
</style>