<template>
  <div class="charts-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">统计分析</h2>
        <span class="page-subtitle">{{ store.assetList.length }} 件资产数据</span>
      </div>
    </div>

    <!-- 状态概览数字 -->
    <div class="status-overview">
      <div class="status-stat" v-for="s in [0,1,2,3,4]" :key="s">
        <div class="status-dot" :style="{ background: statusColorMap[s] }"></div>
        <div class="status-info">
          <span class="status-label">{{ statusTextMap[s] }}</span>
          <span class="status-val mono">{{ getCountByStatus(s) }} 项</span>
          <span class="status-money mono">¥{{ getAssetsByStatus(s).toFixed(0) }}</span>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="charts-grid">
      <!-- 全宽：日均成本趋势（31点，自适应间隔） -->
      <div class="chart-card full-width">
        <div class="chart-card-header">
          <span class="chart-title">整体日均成本趋势</span>
          <span class="chart-subtitle">{{ trendRangeLabel }}</span>
        </div>
        <div ref="barChartRef" class="chart-area large"></div>
      </div>

      <!-- 分类持仓饼图 -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">分类持仓占比</span>
        </div>
        <div ref="categoryPieChartRef" class="chart-area"></div>
      </div>

      <!-- 状态分布 -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">状态总览</span>
        </div>
        <div ref="statusOverviewRef" class="chart-area"></div>
      </div>

      <!-- 分类金额 -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">分类资产金额</span>
        </div>
        <div ref="categoryBarChartRef" class="chart-area"></div>
      </div>

      <!-- 持有周期 -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">持有周期分布</span>
        </div>
        <div ref="holdPeriodRef" class="chart-area"></div>
      </div>

      <!-- 全宽：每月新增 -->
      <div class="chart-card full-width">
        <div class="chart-card-header">
          <span class="chart-title">每月资产新增</span>
        </div>
        <div ref="monthlyChartRef" class="chart-area large"></div>
      </div>

      <!-- 全宽：散点图 -->
      <div class="chart-card full-width">
        <div class="chart-card-header">
          <span class="chart-title">价格 vs 日均成本</span>
          <span class="chart-subtitle">散点分布</span>
        </div>
        <div ref="scatterChartRef" class="chart-area medium"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'Charts' }
</script>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useAssetStore } from '../stores/assetStore';
import * as echarts from 'echarts';

const store = useAssetStore();

const barChartRef = ref<HTMLElement>();
const categoryBarChartRef = ref<HTMLElement>();
const categoryPieChartRef = ref<HTMLElement>();
const statusOverviewRef = ref<HTMLElement>();
const holdPeriodRef = ref<HTMLElement>();
const scatterChartRef = ref<HTMLElement>();
const monthlyChartRef = ref<HTMLElement>();

let barChart: echarts.ECharts | null = null;
let categoryBarChart: echarts.ECharts | null = null;
let categoryPieChart: echarts.ECharts | null = null;
let statusOverviewChart: echarts.ECharts | null = null;
let holdPeriodChart: echarts.ECharts | null = null;
let scatterChart: echarts.ECharts | null = null;
let monthlyChart: echarts.ECharts | null = null;

const PALETTE = ['#3b6fd4', '#3da871', '#d4933b', '#e05c5c', '#8c9fc7', '#6c56d4'];

const statusColorMap: Record<number, string> = {
  0: '#3da871', 1: '#3b6fd4', 2: '#d4933b', 3: '#e05c5c', 4: '#8c9fc7'
};

const statusTextMap: Record<number, string> = {
  0: '保障中', 1: '活跃中', 2: '已退役', 3: '已用完', 4: '已售出'
};

const baseChartOpt = {
  textStyle: { fontFamily: "'Noto Sans SC', sans-serif", fontSize: 11 },
  tooltip: {
    backgroundColor: '#fff',
    borderColor: '#e8ecf4',
    borderWidth: 1,
    textStyle: { color: '#1a2035', fontSize: 12 }
  }
};

// ===== 日均成本趋势：31个点，区间从最早购入日期到今天 =====
const POINT_COUNT = 31;

const getTrendPoints = () => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (store.assetList.length === 0) return { points: [], start: now, end: now };

  // 找最早购入日期
  const earliest = store.assetList.reduce((min: Date, item: any) => {
    const d = new Date(item.buy_date);
    return d < min ? d : min;
  }, new Date(store.assetList[0].buy_date));

  earliest.setHours(0, 0, 0, 0);

  const totalMs = now.getTime() - earliest.getTime();
  // 31个点 = 30个间隔
  const stepMs = totalMs / (POINT_COUNT - 1);

  const points: { date: Date; dateStr: string; cost: number }[] = [];

  for (let i = 0; i < POINT_COUNT; i++) {
    const d = new Date(earliest.getTime() + stepMs * i);
    const dateStr = d.toISOString().split('T')[0];

    const totalCost = store.assetList.reduce((sum: number, item: any) => {
      const buyDate = new Date(item.buy_date);
      if (buyDate > d) return sum;
      const endDateForItem = item.status === 4 && item.sell_date ? new Date(item.sell_date) : d;
      if (endDateForItem < buyDate) return sum;
      const days = Math.max(1, Math.floor((endDateForItem.getTime() - buyDate.getTime()) / 86400000) + 1);
      const sellPrice = item.status === 4 && item.sell_date ? (item.sell_price || 0) : 0;
      return sum + (item.buy_price - sellPrice) / days;
    }, 0);

    points.push({ date: d, dateStr, cost: totalCost });
  }

  return { points, start: earliest, end: now };
};

// 区间描述
const trendRangeLabel = computed(() => {
  if (store.assetList.length === 0) return '暂无数据';
  const { start, end } = getTrendPoints();
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
  if (days < 60) return `近 ${days} 天`;
  if (days < 365) return `近 ${Math.round(days / 30)} 个月`;
  return `近 ${(days / 365).toFixed(1)} 年`;
});

// x 轴标签：根据总区间智能格式化
const formatPointLabel = (date: Date, totalDays: number): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (totalDays > 365) {
    return `${date.getFullYear()}-${m}`;
  }
  return `${m}-${d}`;
};

const getAssetsByStatus = (status: number) =>
  store.assetList.reduce((s: number, i: any) => i.status === status ? s + i.buy_price : s, 0);

const getCountByStatus = (status: number) =>
  store.assetList.reduce((s: number, i: any) => i.status === status ? s + 1 : s, 0);

const getHoldPeriod = (item: any) => {
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : new Date();
  return Math.floor((endDate.getTime() - buyDate.getTime()) / 86400000);
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
  // ===== 日均成本趋势（31点） =====
  if (barChartRef.value) {
    if (barChart) barChart.dispose();
    barChart = echarts.init(barChartRef.value);

    const { points, start, end } = getTrendPoints();
    const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000);

    const xData = points.map(p => formatPointLabel(p.date, totalDays));
    const yData = points.map(p => p.cost.toFixed(2));
    const tooltipDates = points.map(p => p.dateStr);

    barChart.setOption({
      ...baseChartOpt,
      tooltip: {
        ...baseChartOpt.tooltip,
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          return `${tooltipDates[idx]}<br/>日均成本: ¥${yData[idx]}`;
        }
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: { rotate: 40, fontSize: 10, color: '#6b7799', interval: 0 },
        axisLine: { lineStyle: { color: '#e8ecf4' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '¥/天',
        nameTextStyle: { color: '#6b7799', fontSize: 11 },
        axisLabel: { color: '#6b7799', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f0f3f8' } }
      },
      series: [{
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#3b6fd4', width: 2 },
        itemStyle: { color: '#3b6fd4', borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59,111,212,0.2)' },
              { offset: 1, color: 'rgba(59,111,212,0)' }
            ]
          }
        }
      }],
      grid: { left: '12%', right: '4%', bottom: '26%', top: '10%' }
    });
  }

  // ===== 分类饼图 =====
  if (categoryPieChartRef.value) {
    if (categoryPieChart) categoryPieChart.dispose();
    categoryPieChart = echarts.init(categoryPieChartRef.value);
    const data: Record<string, number> = {};
    store.assetList.forEach((i: any) => { data[i.category] = (data[i.category] || 0) + i.buy_price; });
    categoryPieChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { color: '#6b7799', fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['42%', '68%'], center: ['38%', '50%'],
        data: Object.entries(data).map(([name, value], i) => ({ name, value, itemStyle: { color: PALETTE[i % PALETTE.length] } })),
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 }
      }]
    });
  }

  // ===== 状态总览 =====
  if (statusOverviewRef.value) {
    if (statusOverviewChart) statusOverviewChart.dispose();
    statusOverviewChart = echarts.init(statusOverviewRef.value);
    const counts = [0,1,2,3,4].map(s => getCountByStatus(s));
    const total = counts.reduce((a, b) => a + b, 0);
    statusOverviewChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value}项 (${total > 0 ? ((p[0].value/total)*100).toFixed(1) : 0}%)` },
      xAxis: { type: 'value', axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      yAxis: { type: 'category', data: [0,1,2,3,4].map(s => statusTextMap[s]), axisLabel: { color: '#6b7799', fontSize: 11 } },
      series: [{ type: 'bar', barMaxWidth: 20,
        data: counts.map((v,i) => ({ value: v, itemStyle: { color: statusColorMap[i], borderRadius: [0,6,6,0] }, label: { show: true, position: 'right', fontSize: 11, color: '#6b7799', formatter: (p: any) => `${p.value}项` } }))
      }],
      grid: { left: '18%', right: '18%', bottom: '6%', top: '6%' }
    });
  }

  // ===== 分类金额 =====
  if (categoryBarChartRef.value) {
    if (categoryBarChart) categoryBarChart.dispose();
    categoryBarChart = echarts.init(categoryBarChartRef.value);
    const data: Record<string, number> = {};
    store.assetList.forEach((i: any) => { data[i.category] = (data[i.category] || 0) + i.buy_price; });
    const cats = Object.keys(data);
    const vals = Object.values(data);
    categoryBarChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'axis', formatter: '{b}: ¥{c}' },
      xAxis: { type: 'value', axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      yAxis: { type: 'category', data: cats, axisLabel: { color: '#6b7799', fontSize: 11 } },
      series: [{ type: 'bar', barMaxWidth: 20,
        data: vals.map((v,i) => ({ value: v, itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [0,6,6,0] }, label: { show: true, position: 'right', fontSize: 10, color: '#6b7799', formatter: (p: any) => `¥${(p.value/1000).toFixed(1)}k` } }))
      }],
      grid: { left: '18%', right: '20%', bottom: '6%', top: '6%' }
    });
  }

  // ===== 持有周期 =====
  if (holdPeriodRef.value) {
    if (holdPeriodChart) holdPeriodChart.dispose();
    holdPeriodChart = echarts.init(holdPeriodRef.value);
    const periodLabels = ['0-3个月', '3-6个月', '6-12个月', '1-2年', '2-3年', '3年以上'];
    const counts: Record<string, number> = { '0-3个月': 0, '3-6个月': 0, '6-12个月': 0, '1-2年': 0, '2-3年': 0, '3年以上': 0 };
    store.assetList.forEach((i: any) => { counts[getHoldPeriodCategory(getHoldPeriod(i))]++; });
    const vals = periodLabels.map(l => counts[l]);
    const total = vals.reduce((a, b) => a + b, 0);
    holdPeriodChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value}项 (${total > 0 ? ((p[0].value/total)*100).toFixed(1) : 0}%)` },
      xAxis: { type: 'value', axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      yAxis: { type: 'category', data: periodLabels, axisLabel: { color: '#6b7799', fontSize: 10 } },
      series: [{ type: 'bar', barMaxWidth: 20,
        data: vals.map((v,i) => ({ value: v, itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [0,6,6,0] }, label: { show: true, position: 'right', fontSize: 10, color: '#6b7799', formatter: (p: any) => `${p.value}项` } }))
      }],
      grid: { left: '22%', right: '16%', bottom: '6%', top: '6%' }
    });
  }

  // ===== 每月新增 =====
  if (monthlyChartRef.value) {
    if (monthlyChart) monthlyChart.dispose();
    monthlyChart = echarts.init(monthlyChartRef.value);
    const monthlyData: Record<string, number> = {};
    store.assetList.forEach((i: any) => { const m = i.buy_date.slice(0, 7); monthlyData[m] = (monthlyData[m] || 0) + i.buy_price; });
    const months = Object.keys(monthlyData).sort();
    const vals = months.map(m => monthlyData[m]);
    monthlyChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>新增: ¥${p[0].value.toFixed(0)}` },
      xAxis: { type: 'category', data: months, axisLabel: { rotate: 45, fontSize: 10, color: '#6b7799' }, axisLine: { lineStyle: { color: '#e8ecf4' } } },
      yAxis: { type: 'value', name: '¥', nameTextStyle: { color: '#6b7799', fontSize: 11 }, axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      series: [{
        type: 'bar', barMaxWidth: 36,
        data: vals.map(v => ({ value: v, itemStyle: { color: '#3b6fd4', borderRadius: [6,6,0,0] } })),
        markLine: { data: [{ type: 'average', name: '均值' }], lineStyle: { color: '#3da871', type: 'dashed' }, label: { color: '#3da871', fontSize: 11 } }
      }],
      grid: { left: '12%', right: '6%', bottom: '28%', top: '10%' }
    });
  }

  // ===== 散点图 =====
  if (scatterChartRef.value) {
    if (scatterChart) scatterChart.dispose();
    scatterChart = echarts.init(scatterChartRef.value);
    const data = store.assetList.map((i: any) => [i.buy_price, getDailyCost(i), i.name]);
    scatterChart.setOption({
      ...baseChartOpt,
      tooltip: { ...baseChartOpt.tooltip, trigger: 'item', formatter: (p: any) => `${p.data[2]}<br/>购入: ¥${p.data[0]}<br/>日均: ¥${p.data[1].toFixed(2)}` },
      xAxis: { type: 'value', name: '购入价格 (¥)', nameTextStyle: { color: '#6b7799', fontSize: 11 }, axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      yAxis: { type: 'value', name: '日均成本 (¥)', nameTextStyle: { color: '#6b7799', fontSize: 11 }, axisLabel: { color: '#6b7799', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f3f8' } } },
      series: [{ type: 'scatter', data, itemStyle: { color: '#3b6fd4', opacity: 0.65 }, symbolSize: 9 }],
      grid: { left: '14%', right: '8%', bottom: '14%', top: '10%' }
    });
  }
};

onMounted(() => nextTick(() => initCharts()));
watch(() => store.assetList.length, () => nextTick(() => initCharts()));
</script>

<style scoped>
.charts-page { display: flex; flex-direction: column; gap: 20px; }

.page-header { display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; flex-direction: column; gap: 2px; }
.page-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--color-text-main); }
.page-subtitle { font-size: 13px; color: var(--color-text-muted); }

/* 状态概览 */
.status-overview {
  display: flex;
  background: var(--color-surface);
  border-radius: 14px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.status-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-right: 1px solid var(--color-border);
  transition: background 0.15s;
}
.status-stat:last-child { border-right: none; }
.status-stat:hover { background: var(--color-bg); }

.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.status-label { font-size: 11px; color: var(--color-text-muted); font-weight: 500; }
.status-val { font-size: 14px; font-weight: 700; color: var(--color-text-main); }
.status-money { font-size: 11px; color: var(--color-text-muted); }

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.chart-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}
.chart-card:hover { box-shadow: 0 4px 20px rgba(30,50,100,0.1); }
.chart-card.full-width { grid-column: 1 / -1; }

.chart-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.chart-title { font-size: 13.5px; font-weight: 600; color: var(--color-text-main); }
.chart-subtitle { font-size: 11.5px; color: var(--color-text-muted); }

.chart-area { width: 100%; height: 240px; }
.chart-area.large { height: 280px; }
.chart-area.medium { height: 220px; }

@media (max-width: 600px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.full-width { grid-column: unset; }
  .status-overview { flex-wrap: wrap; }
  .status-stat { flex: 0 0 50%; border-bottom: 1px solid var(--color-border); }
  .status-stat:nth-child(even) { border-right: none; }
}
</style>