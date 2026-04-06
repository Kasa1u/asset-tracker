<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-space vertical size="large" style="padding: 24px">
      <n-gradient-text type="info" :size="28" style="font-weight: bold">
        有数 - 个人资产管理
      </n-gradient-text>

      <n-tabs v-model:value="currentTab" type="line" animated>
        <n-tab-pane name="home" tab="首页">
          <n-space vertical size="large">
            <n-card v-if="expiringWarranties.length > 0 || highPriorityWishlist.length > 0" size="small" style="border-radius: 12px">
              <n-space vertical size="small">
                <n-space align="center">
                  <n-icon size="18" :component="NotificationsOutline" style="color: #d03050" />
                  <n-text strong size="large" style="color: #d03050">提醒</n-text>
                </n-space>
                <n-space vertical size="small">
                  <n-alert v-if="expiringWarranties.length > 0" type="warning" :title="`${expiringWarranties.length} 个资产保修即将到期`" style="margin: 0">
                    <div v-for="item in expiringWarranties" :key="item.id" style="padding: 4px 0">
                      <n-text strong>{{ item.name }}</n-text> - 还剩 {{ item.daysUntilExpire }} 天
                    </div>
                  </n-alert>
                  <n-alert v-if="highPriorityWishlist.length > 0" type="info" :title="`${highPriorityWishlist.length} 个高优先级心愿`" style="margin: 0">
                    <div v-for="item in highPriorityWishlist" :key="item.id" style="padding: 4px 0">
                      <n-text strong>{{ item.name }}</n-text> - 预期 ¥{{ item.expected_price.toFixed(0) }}
                    </div>
                  </n-alert>
                </n-space>
              </n-space>
            </n-card>
            <n-card size="small" style="border-radius: 12px">
              <n-space justify="space-between" align="center">
                <n-space align="center">
                  <n-icon size="24" :component="WalletOutline" />
                  <n-text strong size="large">资产</n-text>
                </n-space>
                <n-space>
                  <n-select 
                    v-model:value="sortBy" 
                    :options="sortOptions"
                    size="small"
                    style="width: 180px"
                    placeholder="排序方式"
                  />
                  <n-input v-model:value="searchKeyword" placeholder="搜索" clearable style="width: 140px" size="small" />
                  <n-button circle type="primary" @click="showAddModal = true">
                    <template #icon>
                      <n-icon size="18">
                        <AddOutline />
                      </n-icon>
                    </template>
                  </n-button>
                </n-space>
              </n-space>
            </n-card>

            <n-card size="small" style="border-radius: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white">
              <n-space vertical>
                <n-text style="color: rgba(255,255,255,0.8); font-size: 14px">总资产</n-text>
                <n-text strong style="font-size: 40px; font-weight: bold; display: block">
                  ¥{{ filteredTotalInvestment.toFixed(0) }}
                </n-text>
                <n-divider style="margin: 12px 0; border-color: rgba(255,255,255,0.2)" />
                <n-space justify="space-between">
                  <div>
                    <n-text style="color: rgba(255,255,255,0.7); font-size: 13px">日均成本</n-text>
                    <n-text strong style="font-size: 22px; display: block">¥{{ filteredDailyAverageCost.toFixed(2) }}</n-text>
                  </div>
                  <div style="text-align: right">
                    <n-text style="color: rgba(255,255,255,0.7); font-size: 13px">资产数量</n-text>
                    <n-text strong style="font-size: 22px; display: block">{{ filteredAssetCount }}/10</n-text>
                  </div>
                </n-space>
              </n-space>
            </n-card>

            <n-card size="small" style="border-radius: 12px">
              <n-space vertical size="medium">
                <div style="overflow-x: auto">
                  <n-space size="medium" style="white-space: nowrap">
                    <n-button 
                      v-for="status in ['', '0', '1', '2', '3', '4']" 
                      :key="status"
                      :type="filterStatus === status ? 'primary' : 'default'"
                      quaternary
                      size="small"
                      @click="filterStatus = status"
                    >
                      {{ status === '' ? '全部' : statusTextMap[Number(status)] }}
                    </n-button>
                  </n-space>
                </div>
                <div style="overflow-x: auto">
                  <n-space size="medium" style="white-space: nowrap">
                    <n-button 
                      v-for="cat in categoryOptionsWithAll" 
                      :key="cat.value"
                      :type="filterCategory === cat.value ? 'primary' : 'default'"
                      quaternary
                      size="small"
                      @click="filterCategory = cat.value"
                    >
                      {{ cat.label }}
                    </n-button>
                  </n-space>
                </div>
              </n-space>
            </n-card>

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
                      <n-text style="font-size: 18px; font-weight: bold">¥{{ item.dailyCost.toFixed(2) }}/天</n-text>
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
        </n-tab-pane>

        <n-tab-pane name="wishlist" tab="心愿清单">
          <n-card size="small">
            <template #header>
              <n-space align="center">
                <n-icon size="18" :component="ListOutline" />
                <span>心愿清单</span>
              </n-space>
            </template>
            <template #header-extra>
              <n-button type="primary" size="small" @click="handleAddWishlist">
                <template #icon><n-icon :component="CreateOutline" /></template>
                添加心愿
              </n-button>
            </template>
            <n-grid :cols="2" :x-gap="12" :y-gap="12" v-if="wishlist.length > 0">
              <n-gi v-for="item in wishlist" :key="item.id">
                <n-card hoverable size="small">
                  <template #header>
                    <n-ellipsis style="max-width: 150px">{{ item.name }}</n-ellipsis>
                  </template>
                  <template #header-extra>
                    <n-tag :type="getPriorityType(item.priority)" size="small">
                      {{ getPriorityText(item.priority) }}
                    </n-tag>
                  </template>
                  <n-space vertical size="small">
                    <n-space justify="space-between">
                      <span class="label">分类:</span>
                      <span>{{ item.category }}</span>
                    </n-space>
                    <n-space justify="space-between" v-if="item.expected_price">
                      <span class="label">预期价格:</span>
                      <span>¥{{ item.expected_price.toFixed(0) }}</span>
                    </n-space>
                    <n-space justify="space-between" v-if="item.remark">
                      <span class="label">备注:</span>
                      <n-ellipsis style="max-width: 100px">{{ item.remark }}</n-ellipsis>
                    </n-space>
                  </n-space>
                  <template #footer>
                    <n-space justify="end">
                      <n-button size="small" quaternary @click="handleEditWishlist(item)">编辑</n-button>
                      <n-button type="success" size="small" quaternary @click="handleBuyWishlist(item)">购入</n-button>
                      <n-button type="error" size="small" quaternary @click="handleDeleteWishlist(item.id)">删除</n-button>
                    </n-space>
                  </template>
                </n-card>
              </n-gi>
            </n-grid>
            <n-empty v-else description="暂无心愿，快去添加吧！" />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="timeline" tab="时间轴">
          <n-card size="small">
            <template #header>
              <n-space align="center">
                <n-icon size="18" :component="ListOutline" />
                <span>时间轴</span>
              </n-space>
            </template>
            <div style="max-height: 600px; overflow-y: auto; padding: 10px 0">
              <n-timeline :reverse="true" :item-placement="'left'" v-if="timelineData.length > 0">
                <n-timeline-item 
                  v-for="item in timelineData" 
                  :key="item.id"
                  :type="getTimelineType(item)"
                  :title="item.buy_date"
                >
                  <n-card size="small" hoverable style="cursor: pointer" @click="showDetail(item)">
                    <n-space vertical size="small">
                      <n-text strong>{{ item.name }}</n-text>
                      <n-space justify="space-between">
                        <span class="label">分类:</span>
                        <span>{{ item.category }}</span>
                      </n-space>
                      <n-space justify="space-between">
                        <span class="label">购入价格:</span>
                        <span>¥{{ item.buy_price.toFixed(0) }}</span>
                      </n-space>
                      <n-tag :type="getActualStatusType(item)" size="small" style="align-self: flex-start">
                        {{ getActualStatusText(item) }}
                      </n-tag>
                    </n-space>
                  </n-card>
                </n-timeline-item>
              </n-timeline>
              <n-empty v-else description="暂无资产" />
            </div>
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="stats" tab="统计分析">
          <n-space vertical size="large">
            <n-card size="small">
              <template #header>
                <n-space align="center" justify="space-between" style="width: 100%">
                  <n-space align="center">
                    <n-icon size="18" :component="BarChartOutline" />
                    <span>统计分析</span>
                  </n-space>
                  <n-select 
                    v-model:value="chartTimeRange" 
                    :options="[
                      { label: '近3个月', value: '3' },
                      { label: '近6个月', value: '6' },
                      { label: '近12个月', value: '12' },
                      { label: '全部', value: 'all' }
                    ]"
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
                        <span :style="{ color: statusColorMap[status] }">●</span>
                      </template>
                      <template #suffix>
                        <span style="font-size: 12px; color: #999">
                          ({{ totalInvestment > 0 ? ((getAssetsByStatus(status) / totalInvestment) * 100).toFixed(1) : 0 }}%)
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
                    <n-card :title="`状态总览 (${assetCount}项)`" size="small">
                      <div ref="statusOverviewRef" style="height: 250px"></div>
                    </n-card>
                  </n-gi>
                  <n-gi :span="12">
                    <n-card title="持有周期" size="small">
                      <div ref="holdPeriodRef" style="height: 250px"></div>
                    </n-card>
                  </n-gi>
                  <n-gi :span="24">
                    <n-card :title="`整体日均成本趋势（近${chartTimeRange === 'all' ? '全部' : chartTimeRange}个月）`" size="small">
                      <div ref="barChartRef" style="height: 300px"></div>
                    </n-card>
                  </n-gi>
                </n-grid>
              </n-space>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-space>

    <n-modal v-model:show="showDetailModal" preset="card" style="width: 800px; max-width: 95vw">
      <template #header>
        <n-space align="center">
          <n-icon size="20" :component="InformationCircleOutline" />
          <span>资产详情</span>
        </n-space>
      </template>
      <template #header-extra>
        <n-tag :type="getStatusType(currentAsset?.status)" size="small">
          {{ getStatusText(currentAsset?.status) }}
        </n-tag>
      </template>
      <n-grid :cols="2" :x-gap="24">
        <n-gi>
          <n-descriptions label-placement="left" :column="1" bordered size="small">
            <n-descriptions-item label="物品名称">{{ currentAsset?.name }}</n-descriptions-item>
            <n-descriptions-item label="分类">{{ currentAsset?.category }}</n-descriptions-item>
            <n-descriptions-item label="购入价格">¥{{ currentAsset?.buy_price?.toFixed(2) }}</n-descriptions-item>
            <n-descriptions-item label="购入日期">{{ currentAsset?.buy_date }}</n-descriptions-item>
            <n-descriptions-item label="保修截止">{{ currentAsset?.warranty_date || '-' }}</n-descriptions-item>
            <n-descriptions-item label="持有天数">{{ getHoldDays(currentAsset) }} 天</n-descriptions-item>
            <n-descriptions-item label="日均成本">
              <span :style="{ color: getDailyCost(currentAsset) > 1 ? '#d03050' : '#18a058' }">
                ¥{{ getDailyCost(currentAsset).toFixed(2) }}
              </span>
            </n-descriptions-item>
            <n-descriptions-item label="备注">{{ currentAsset?.remark || '-' }}</n-descriptions-item>
          </n-descriptions>
          <template v-if="currentAsset?.status === 4">
            <n-divider style="margin: 12px 0" />
            <n-descriptions label-placement="left" :column="1" bordered size="small">
              <n-descriptions-item label="卖出价格">¥{{ currentAsset?.sell_price?.toFixed(2) }}</n-descriptions-item>
              <n-descriptions-item label="卖出日期">{{ currentAsset?.sell_date }}</n-descriptions-item>
              <n-descriptions-item label="收益">
                <span :style="{ color: (currentAsset?.sell_price - currentAsset?.buy_price) >= 0 ? '#18a058' : '#d03050' }">
                  {{ (currentAsset?.sell_price - currentAsset?.buy_price) >= 0 ? '+' : '' }}¥{{ (currentAsset?.sell_price - currentAsset?.buy_price)?.toFixed(2) }}
                </span>
              </n-descriptions-item>
            </n-descriptions>
          </template>
          <n-divider style="margin: 12px 0" />
          <n-space>
            <n-button type="primary" @click="handleEdit(currentAsset)" :disabled="currentAsset?.status === 1">
              <template #icon><n-icon :component="CreateOutline" /></template>
              编辑
            </n-button>
            <n-button type="warning" @click="handleSell(currentAsset)">
              <template #icon><n-icon :component="TrendingUpOutline" /></template>
              状态变更
            </n-button>
            <n-button type="error" @click="handleDelete(currentAsset?.id)">
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

    <n-modal v-model:show="showEditModal" preset="card" title="编辑资产" style="width: 500px">
      <n-form :model="editForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="editForm.name" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="editForm.category" :options="categoryOptions" />
        </n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="editForm.buy_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="购入日期">
          <n-date-picker v-model:formatted-value="editForm.buy_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="保修截止">
          <n-date-picker v-model:formatted-value="editForm.warranty_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="editForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdate">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showSellModal" preset="card" title="状态变更" style="width: 500px">
      <n-form :model="sellForm" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="sellForm.name" disabled />
        </n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="sellForm.buy_price" disabled style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="新状态">
          <n-select v-model:value="sellForm.new_status" :options="statusOptions.filter(o => o.value !== '')" style="width: 100%" />
        </n-form-item>
        <n-form-item label="卖出价格" v-if="sellForm.new_status === 4">
          <n-input-number v-model:value="sellForm.sell_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="卖出日期" v-if="sellForm.new_status === 4">
          <n-date-picker v-model:formatted-value="sellForm.sell_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showSellModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmStatusChange">确认变更</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showWishlistModal" preset="card" title="添加心愿" style="width: 500px">
      <n-form :model="wishlistForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称">
          <n-input v-model:value="wishlistForm.name" placeholder="例如：MacBook Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="wishlistForm.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="wishlistForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="wishlistForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="wishlistForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showWishlistModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveWishlist">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showWishlistEditModal" preset="card" title="编辑心愿" style="width: 500px">
      <n-form :model="wishlistEditForm" label-placement="left" label-width="auto">
        <n-form-item label="心愿名称">
          <n-input v-model:value="wishlistEditForm.name" placeholder="例如：MacBook Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="wishlistEditForm.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="预期价格">
          <n-input-number v-model:value="wishlistEditForm.expected_price" :min="0" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="wishlistEditForm.priority" :options="priorityOptions" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="wishlistEditForm.remark" type="textarea" placeholder="添加备注信息..." :autosize="{ minRows: 2, maxRows: 4 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showWishlistEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleUpdateWishlist">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showAddModal" preset="card" title="录入新资产" style="width: 500px">
      <n-form :model="form" label-placement="left" label-width="auto">
        <n-form-item label="物品名称">
          <n-input v-model:value="form.name" placeholder="例如：iPhone 15 Pro" />
        </n-form-item>
        <n-form-item label="分类">
          <n-select v-model:value="form.category" :options="categoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="购入价格">
          <n-input-number v-model:value="form.buy_price" :min="0" style="width: 100%" :show-button="false">
            <template #prefix>¥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="购入日期">
          <n-date-picker v-model:formatted-value="form.buy_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" @update:value="handleDateChange" />
        </n-form-item>
        <n-form-item label="保修截止">
          <n-date-picker v-model:formatted-value="form.warranty_date" value-format="yyyy-MM-dd" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="form.remark" type="textarea" placeholder="添加备注..." :autosize="{ minRows: 1, maxRows: 3 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave">保存资产</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";

interface Asset {
  id: number;
  name: string;
  buy_price: number;
  buy_date: string;
  warranty_date: string | null;
  category: string;
  status: number;
  sell_price?: number | null;
  sell_date?: string | null;
  remark?: string | null;
  created_at?: string;
  dailyCost?: number;
}

interface WishlistItem {
  id: number;
  name: string;
  category: string;
  expected_price: number;
  priority: number;
  remark?: string | null;
  created_at?: string;
}

import {
  NConfigProvider, NSpace, NCard, NForm, NFormItem, NInput, NInputNumber,
  NButton, NGradientText, NStatistic, NDatePicker, NGrid, NGi, NIcon,
  NSelect, NTag, NModal, NDescriptions, NDescriptionsItem, NDivider,
  NEllipsis, NEmpty, NTimeline, NTimelineItem, NText, NTabs, NTabPane, createDiscreteApi,
  NAlert,
} from "naive-ui";
import { BarChartOutline, ListOutline, InformationCircleOutline, CreateOutline, TrashOutline, TrendingUpOutline, AddOutline, NotificationsOutline, WalletOutline } from "@vicons/ionicons5";
import { initDatabase } from "./db";
import * as echarts from "echarts";

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

const categoryOptionsWithAll = [{ label: "全部", value: "" }, ...categoryOptions];
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

const statusColorMap: Record<number, string> = {
  0: "#2080f0",
  1: "#18a058",
  2: "#909399",
  3: "#f0a020",
  4: "#d03050"
};

const sortOptions = [
  { label: "最新添加", value: "id_desc" },
  { label: "最早添加", value: "id_asc" },
  { label: "最新购买", value: "date_desc" },
  { label: "最早购买", value: "date_asc" },
  { label: "价格最高", value: "price_desc" },
  { label: "价格最低", value: "price_asc" },
  { label: "日均最贵", value: "dailyCost_desc" },
  { label: "日均最便宜", value: "dailyCost_asc" }
];

const themeOverrides = {
  common: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  }
};

const dbInstance = ref<any>(null);
const assetList = ref<Asset[]>([]);
const wishlist = ref<WishlistItem[]>([]);
const totalInvestment = ref(0);
const assetCount = ref(0);
const currentTab = ref("home");
const showEditModal = ref(false);
const showSellModal = ref(false);
const showDetailModal = ref(false);
const showWishlistModal = ref(false);
const showWishlistEditModal = ref(false);
const editingId = ref<number | null>(null);
const sellingId = ref<number | null>(null);
const editingWishlistId = ref<number | null>(null);
const currentAsset = ref<Asset | null>(null);
const searchKeyword = ref("");
const filterCategory = ref("");
const filterStatus = ref("");
const currentTime = ref(new Date());
const showAddModal = ref(false);
const sortBy = ref("id_desc");
const chartTimeRange = ref<"3" | "6" | "12" | "all">("6");

const barChartRef = ref<HTMLElement>();
const detailChartRef = ref<HTMLElement>();
const statusBarChartRef = ref<HTMLElement>();
const categoryBarChartRef = ref<HTMLElement>();
const categoryPieChartRef = ref<HTMLElement>();
const statusOverviewRef = ref<HTMLElement>();
const holdPeriodRef = ref<HTMLElement>();
let barChart: echarts.ECharts | null = null;
let detailChart: echarts.ECharts | null = null;
let statusBarChart: echarts.ECharts | null = null;
let categoryBarChart: echarts.ECharts | null = null;
let categoryPieChart: echarts.ECharts | null = null;
let statusOverviewChart: echarts.ECharts | null = null;
let holdPeriodChart: echarts.ECharts | null = null;

const today = new Date().toISOString().split("T")[0];
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
const defaultNextYear = nextYear.toISOString().split("T")[0];

const form = ref({ name: "", buy_price: 0, buy_date: today, warranty_date: defaultNextYear, category: "电子产品", remark: "" });
const editForm = ref({ name: "", buy_price: 0, buy_date: today, warranty_date: defaultNextYear, category: "电子产品", remark: "" });
const sellForm = ref({ name: "", buy_price: 0, sell_price: 0, sell_date: today, new_status: 1 });
const wishlistForm = ref({ name: "", category: "电子产品", expected_price: 0, priority: 0, remark: "" });
const wishlistEditForm = ref({ name: "", category: "电子产品", expected_price: 0, priority: 0, remark: "" });

const priorityOptions = [
  { label: "一般", value: 0 },
  { label: "中等", value: 1 },
  { label: "重要", value: 2 },
  { label: "非常重要", value: 3 }
];

const timelineData = computed(() => {
  return [...assetList.value].sort((a, b) => new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime());
});

const getTimelineType = (item: any) => {
  const actualStatus = getActualStatus(item);
  const typeMap: Record<number, any> = {
    0: "info",
    1: "success",
    2: "default",
    3: "warning",
    4: "error"
  };
  return typeMap[actualStatus] || "default";
};

const getAssetsByStatus = (status: number) => {
  return assetList.value.reduce((sum, item) => {
    const actualStatus = getActualStatus(item);
    return actualStatus === status ? sum + item.buy_price : sum;
  }, 0);
};

const getCountByStatus = (status: number) => {
  return assetList.value.reduce((count, item) => {
    const actualStatus = getActualStatus(item);
    return actualStatus === status ? count + 1 : count;
  }, 0);
};

const getHoldPeriod = (item: any) => {
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : currentTime.value;
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



const filteredAssetList = computed(() => {
  currentTime.value;
  return assetList.value
    .filter(item => {
      const matchKeyword = !searchKeyword.value || item.name.toLowerCase().includes(searchKeyword.value.toLowerCase());
      const matchCategory = !filterCategory.value || item.category === filterCategory.value;
      const actualStatus = getActualStatus(item);
      const matchStatus = !filterStatus.value || String(actualStatus) === filterStatus.value;
      return matchKeyword && matchCategory && matchStatus;
    })
    .map(item => ({
      ...item,
      dailyCost: getDailyCost(item)
    }))
    .sort((a, b) => {
      const [field, order] = sortBy.value.split("_");
      const isDesc = order === "desc";
      let comparison = 0;

      switch (field) {
        case "id":
          comparison = a.id - b.id;
          break;
        case "date":
          comparison = new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime();
          break;
        case "price":
          comparison = a.buy_price - b.buy_price;
          break;
        case "dailyCost":
          comparison = a.dailyCost - b.dailyCost;
          break;
      }

      return isDesc ? -comparison : comparison;
    });
});

const filteredTotalInvestment = computed(() => {
  return filteredAssetList.value.reduce((sum, item) => sum + item.buy_price, 0);
});

const filteredAssetCount = computed(() => {
  return filteredAssetList.value.length;
});

const filteredDailyAverageCost = computed(() => {
  const now = currentTime.value;
  return filteredAssetList.value.reduce((total, item) => {
    const buyDate = new Date(item.buy_date);
    if (item.status === 4 && item.sell_date) {
      const sellDate = new Date(item.sell_date);
      const days = Math.max(1, Math.floor((sellDate.getTime() - buyDate.getTime()) / 86400000) + 1);
      return total + (item.buy_price - (item.sell_price || 0)) / days;
    } else if (item.status < 2) {
      const days = Math.max(1, Math.floor((now.getTime() - buyDate.getTime()) / 86400000) + 1);
      return total + item.buy_price / days;
    }
    return total;
  }, 0);
});

const getHoldDays = (item: any) => {
  if (!item) return 0;
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : currentTime.value;
  const days = Math.floor((endDate.getTime() - buyDate.getTime()) / 86400000) + 1;
  return Math.max(1, days);
};

const getDailyCost = (item: Asset) => {
  if (!item) return 0;
  const days = getHoldDays(item);
  const sellPrice = item.status === 1 ? (item.sell_price || 0) : 0;
  const cost = (item.buy_price - sellPrice) / days;
  return cost;
};

const getStatusText = (status: number) => statusTextMap[status] || "未知";
const getStatusType = (status: number): "primary" | "default" | "success" | "error" | "warning" | "info" => {
  const typeMap: Record<number, "primary" | "default" | "success" | "error" | "warning" | "info"> = {
    0: "info",
    1: "success",
    2: "default",
    3: "warning",
    4: "error"
  };
  return typeMap[status] || "default";
};

const getActualStatus = (item: any) => {
  if (item.status >= 2) return item.status;
  
  const warrantyDate = item.warranty_date ? new Date(item.warranty_date) : null;
  const now = currentTime.value;
  
  if (item.status === 0 && warrantyDate && now < warrantyDate) {
    return 0;
  }
  
  return 1;
};

const getDaysUntilWarrantyExpires = (item: any) => {
  if (!item.warranty_date) return Infinity;
  const warrantyDate = new Date(item.warranty_date);
  const now = currentTime.value;
  const days = Math.ceil((warrantyDate.getTime() - now.getTime()) / 86400000);
  return days;
};

const expiringWarranties = computed(() => {
  return assetList.value
    .filter(item => {
      const actualStatus = getActualStatus(item);
      if (actualStatus !== 0) return false;
      const days = getDaysUntilWarrantyExpires(item);
      return days > 0 && days <= 30;
    })
    .map(item => ({
      ...item,
      daysUntilExpire: getDaysUntilWarrantyExpires(item)
    }))
    .sort((a, b) => a.daysUntilExpire - b.daysUntilExpire);
});

const highPriorityWishlist = computed(() => {
  return wishlist.value
    .filter(item => item.priority >= 2)
    .sort((a, b) => b.priority - a.priority);
});

const getActualStatusText = (item: any) => {
  const actualStatus = getActualStatus(item);
  return statusTextMap[actualStatus] || "未知";
};

const getActualStatusType = (item: any) => {
  const actualStatus = getActualStatus(item);
  return getStatusType(actualStatus);
};



const showDetail = (item: any) => {
  currentTime.value = new Date();
  currentAsset.value = item;
  showDetailModal.value = true;
  nextTick(() => initDetailChart());
};

const initDetailChart = () => {
  if (!detailChartRef.value || !currentAsset.value) return;
  if (detailChart) detailChart.dispose();
  detailChart = echarts.init(detailChartRef.value);
  
  const item = currentAsset.value;
  const buyDate = new Date(item.buy_date);
  const endDate = item.status === 4 && item.sell_date ? new Date(item.sell_date) : currentTime.value;
  const totalDays = Math.floor((endDate.getTime() - buyDate.getTime()) / 86400000) + 1;
  
  const data: [number, string][] = [];
  const sellPrice = item.status === 4 ? (item.sell_price || 0) : 0;
  
  let power = 0;
  while (true) {
    const day = Math.pow(2, power);
    if (day > totalDays) break;
    const dailyCost = (item.buy_price - sellPrice) / day;
    data.push([day, dailyCost.toFixed(2)]);
    power++;
  }
  
  if (totalDays > 0 && data[data.length - 1][0] !== totalDays) {
    const finalCost = (item.buy_price - sellPrice) / totalDays;
    data.push([totalDays, finalCost.toFixed(2)]);
  }

  detailChart.setOption({
    tooltip: { 
      trigger: "axis", 
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        const day = data[index][0];
        const cost = data[index][1];
        return `第${day}天<br/>日均成本: ¥${cost}`;
      }
    },
    xAxis: { 
      type: "category", 
      name: "持有天数", 
      data: data.map(d => d[0]),
      axisLabel: { 
        fontSize: 11,
        interval: 0,
        rotate: 45
      }
    },
    yAxis: { 
      type: "value", 
      name: "日均成本(¥)",
      min: 0,
      axisLabel: { fontSize: 11 }
    },
    series: [{ 
      type: "line", 
      data: data.map(d => d[1]), 
      smooth: true, 
      areaStyle: { opacity: 0.3 }, 
      itemStyle: { color: "#18a058" },
      markPoint: {
        data: [
          { type: "max", name: "最高" },
          { type: "min", name: "最低" }
        ]
      }
    }],
    grid: { left: "15%", right: "5%", bottom: "15%", top: "15%" },
  });
};

const initCharts = () => {
  if (barChartRef.value) {
    if (barChart) barChart.dispose();
    barChart = echarts.init(barChartRef.value);
    const now = currentTime.value;
    const dailyCostData: [string, string][] = [];
    const endDate = new Date(now);
    
    if (chartTimeRange.value === "3") {
      endDate.setMonth(endDate.getMonth() - 3);
    } else if (chartTimeRange.value === "6") {
      endDate.setMonth(endDate.getMonth() - 6);
    } else if (chartTimeRange.value === "12") {
      endDate.setFullYear(endDate.getFullYear() - 1);
    } else {
      const allDates = assetList.value.map(item => new Date(item.buy_date));
      if (allDates.length > 0) {
        endDate.setTime(Math.min(...allDates.map(d => d.getTime())));
      }
    }
    
    const step = chartTimeRange.value === "all" ? 7 : 3;
    for (let d = new Date(endDate); d <= now; d.setDate(d.getDate() + step)) {
      const dateStr = d.toISOString().split("T")[0];
      const totalCost = assetList.value.reduce((sum, item) => {
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
    assetList.value.forEach(item => { categoryPriceData[item.category] = (categoryPriceData[item.category] || 0) + item.buy_price; });
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
    assetList.value.forEach(item => { categoryPieData[item.category] = (categoryPieData[item.category] || 0) + item.buy_price; });
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
    assetList.value.forEach(item => {
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
};

watch([() => assetList.value.length, showDetailModal, currentTime, currentTab, chartTimeRange], () => {
  nextTick(() => {
    if (currentTab.value === 'stats') {
      initCharts();
    }
  });
});

const handleDateChange = (val: any) => {
  if (!val) return;
  const date = new Date(val);
  if (isNaN(date.getTime())) return;
  date.setFullYear(date.getFullYear() + 1);
  form.value.warranty_date = date.toISOString().split("T")[0];
};

const refreshData = async () => {
  if (!dbInstance.value) return;
  currentTime.value = new Date();
  assetList.value = await dbInstance.value.select("SELECT * FROM assets ORDER BY id DESC");
  wishlist.value = await dbInstance.value.select("SELECT * FROM wishlist ORDER BY priority DESC, created_at DESC");
  const stats: any[] = await dbInstance.value.select("SELECT COUNT(*) as count, SUM(buy_price) as total FROM assets");
  assetCount.value = stats[0].count || 0;
  totalInvestment.value = stats[0].total || 0;
  nextTick(() => {
    if (currentTab.value === 'stats') {
      initCharts();
    }
  });
};

const handleSave = async () => {
  if (!form.value.name || !form.value.buy_price) { message.warning("请输入名称和价格"); return; }
  try {
    await dbInstance.value.execute(`INSERT INTO assets (name, buy_price, buy_date, warranty_date, category, status, remark) VALUES (?, ?, ?, ?, ?, 0, ?)`, [form.value.name, form.value.buy_price, form.value.buy_date, form.value.warranty_date, form.value.category, form.value.remark || ""]);
    message.success("已保存");
    form.value = { name: "", buy_price: 0, buy_date: today, warranty_date: defaultNextYear, category: "电子产品", remark: "" };
    showAddModal.value = false;
    await refreshData();
  } catch (e) { message.error("保存失败"); }
};

const handleEdit = (item: any) => {
  if (!item) return;
  editingId.value = item.id;
  editForm.value = { name: item.name, buy_price: item.buy_price, buy_date: item.buy_date, warranty_date: item.warranty_date || "", category: item.category, remark: item.remark || "" };
  showDetailModal.value = false;
  showEditModal.value = true;
};

const handleUpdate = async () => {
  if (!editForm.value.name || !editForm.value.buy_price) { message.warning("请输入名称和价格"); return; }
  try {
    await dbInstance.value.execute(`UPDATE assets SET name=?, buy_price=?, buy_date=?, warranty_date=?, category=?, remark=? WHERE id=?`, [editForm.value.name, editForm.value.buy_price, editForm.value.buy_date, editForm.value.warranty_date, editForm.value.category, editForm.value.remark || "", editingId.value]);
    message.success("已更新");
    showEditModal.value = false;
    await refreshData();
  } catch (e) { message.error("更新失败"); }
};

const handleSell = (item: any) => {
  if (!item) return;
  sellingId.value = item.id;
  sellForm.value = { name: item.name, buy_price: item.buy_price, sell_price: item.buy_price, sell_date: today, new_status: item.status };
  showDetailModal.value = false;
  showSellModal.value = true;
};

const handleConfirmStatusChange = async () => {
  if (sellForm.value.new_status === 4 && !sellForm.value.sell_price) { 
    message.warning("请输入卖出价格"); 
    return; 
  }
  try {
    if (sellForm.value.new_status === 4) {
      await dbInstance.value.execute(`UPDATE assets SET status=?, sell_price=?, sell_date=? WHERE id=?`, [sellForm.value.new_status, sellForm.value.sell_price, sellForm.value.sell_date, sellingId.value]);
    } else {
      await dbInstance.value.execute(`UPDATE assets SET status=? WHERE id=?`, [sellForm.value.new_status, sellingId.value]);
    }
    message.success("状态已变更");
    showSellModal.value = false;
    await refreshData();
  } catch (e) { message.error("操作失败"); }
};

const handleDelete = async (id: number) => {
  try {
    await dbInstance.value.execute("DELETE FROM assets WHERE id = ?", [id]);
    message.info("已删除");
    showDetailModal.value = false;
    await refreshData();
  } catch (e) { message.error("删除失败"); }
};



const getPriorityText = (priority: number) => {
  const map: Record<number, string> = {
    0: "一般",
    1: "中等",
    2: "重要",
    3: "非常重要"
  };
  return map[priority] || "一般";
};

const getPriorityType = (priority: number): "primary" | "default" | "success" | "error" | "warning" | "info" => {
  const map: Record<number, "primary" | "default" | "success" | "error" | "warning" | "info"> = {
    0: "default",
    1: "info",
    2: "warning",
    3: "error"
  };
  return map[priority] || "default";
};

const handleAddWishlist = () => {
  wishlistForm.value = { name: "", category: "电子产品", expected_price: 0, priority: 0, remark: "" };
  showWishlistModal.value = true;
};

const handleSaveWishlist = async () => {
  if (!wishlistForm.value.name) { message.warning("请输入名称"); return; }
  try {
    await dbInstance.value.execute(`INSERT INTO wishlist (name, category, expected_price, priority, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [
      wishlistForm.value.name,
      wishlistForm.value.category,
      wishlistForm.value.expected_price,
      wishlistForm.value.priority,
      wishlistForm.value.remark || "",
      new Date().toISOString().split("T")[0]
    ]);
    message.success("已添加到心愿清单");
    showWishlistModal.value = false;
    await refreshData();
  } catch (e) { message.error("添加失败"); }
};

const handleEditWishlist = (item: any) => {
  if (!item) return;
  editingWishlistId.value = item.id;
  wishlistEditForm.value = {
    name: item.name,
    category: item.category,
    expected_price: item.expected_price || 0,
    priority: item.priority || 0,
    remark: item.remark || ""
  };
  showWishlistEditModal.value = true;
};

const handleUpdateWishlist = async () => {
  if (!wishlistEditForm.value.name) { message.warning("请输入名称"); return; }
  try {
    await dbInstance.value.execute(`UPDATE wishlist SET name=?, category=?, expected_price=?, priority=?, remark=? WHERE id=?`, [
      wishlistEditForm.value.name,
      wishlistEditForm.value.category,
      wishlistEditForm.value.expected_price,
      wishlistEditForm.value.priority,
      wishlistEditForm.value.remark || "",
      editingWishlistId.value
    ]);
    message.success("已更新");
    showWishlistEditModal.value = false;
    await refreshData();
  } catch (e) { message.error("更新失败"); }
};

const handleDeleteWishlist = async (id: number) => {
  try {
    await dbInstance.value.execute("DELETE FROM wishlist WHERE id = ?", [id]);
    message.info("已删除");
    await refreshData();
  } catch (e) { message.error("删除失败"); }
};

const handleBuyWishlist = async (item: any) => {
  if (!item) return;
  form.value = {
    name: item.name,
    buy_price: item.expected_price || 0,
    buy_date: today,
    warranty_date: defaultNextYear,
    category: item.category,
    remark: item.remark || ""
  };
  await handleDeleteWishlist(item.id);
  currentTab.value = "home";
  message.success("已将心愿加入到新增资产表单中，快去保存吧！");
};

onMounted(async () => {
  try {
    dbInstance.value = await initDatabase();
    await refreshData();
    setInterval(() => {
      currentTime.value = new Date();
    }, 60000);
  } catch (e) { console.error("数据库初始化失败", e); }
});

const themeOverrides = { common: { primaryColor: "#18a058" } };
</script>

<style>
.asset-card { cursor: pointer; transition: all 0.2s; }
.asset-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.label { color: #666; font-size: 12px; }
</style>
