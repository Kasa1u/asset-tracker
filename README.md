# 资产追踪系统 (Asset Tracker)

一个基于 Tauri 2 + Vue 3 + TypeScript 开发的桌面资产追踪应用，帮助你高效管理个人资产和心愿清单。

## 📖 项目简介

资产追踪系统是一个功能完善的桌面应用程序，旨在帮助用户追踪和管理个人资产。通过直观的界面和强大的数据分析功能，用户可以轻松记录资产信息、追踪使用情况、分析资产价值，并管理心愿清单。

## ✨ 核心功能

### 🏠 首页（资产列表）
- **资产展示**：以卡片形式展示所有资产，包含名称、日均成本、购买价格、使用天数等信息
- **智能筛选**：支持按状态（保障中/活跃中/已退役/已用完/已售出）和分类（电子产品/家具家电/服装配饰等）筛选
- **灵活排序**：支持8种排序方式（最新添加、最早添加、最新购买、最早购买、价格最高、价格最低、日均最贵、日均最便宜）
- **搜索功能**：快速搜索资产名称
- **智能提醒**：自动提醒保修即将到期的资产和高优先级心愿清单
- **统计概览**：显示总资产、日均成本、资产数量等关键指标

### 💝 心愿清单
- **心愿管理**：记录想要购买的物品
- **优先级标注**：支持5级优先级（无/低/中/较高/高/最高）
- **预期价格**：记录预期购买价格
- **分类管理**：按分类组织心愿清单
- **备注功能**：添加详细备注信息

### ⏰ 时间轴
- **时间线展示**：按购买时间展示资产历史
- **状态标识**：清晰展示资产当前状态
- **详细信息**：包含购买日期、价格、保修状态等

### 📊 统计分析
- **总资产分布**：按状态展示资产价值分布
- **分类占比**：可视化展示各分类资产占比
- **日均成本趋势**：折线图展示日均成本变化趋势
- **持有周期分析**：分析资产持有时间分布
- **价格与成本关系**：散点图展示购入价格与日均成本关系
- **月度资产增加趋势**：柱状图展示每月新增资产情况
- **时间范围选择**：支持近3个月、近6个月、近12个月、全部时间范围

### 🌐 多语言支持
- **中英文切换**：支持中文和英文界面
- **动态切换**：实时切换语言，无需重启

## 🛠️ 技术栈

### 前端技术
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **UI组件库**: Naive UI
- **图表库**: ECharts
- **状态管理**: Pinia
- **构建工具**: Vite
- **图标**: @vicons/ionicons5

### 桌面技术
- **框架**: Tauri 2
- **后端语言**: Rust
- **数据库**: SQLite

## 📁 项目结构

```
zichan_youshu/
├── public/                    # 静态资源
│   ├── tauri.svg             # Tauri 图标
│   └── vite.svg              # Vite 图标
├── src/                      # 源代码目录
│   ├── assets/               # 静态资源
│   │   └── vue.svg          # Vue 图标
│   ├── components/           # Vue 组件
│   │   ├── AssetList.vue    # 资产列表组件
│   │   ├── Charts.vue       # 统计图表组件
│   │   ├── Timeline.vue     # 时间轴组件
│   │   └── Wishlist.vue     # 心愿清单组件
│   ├── stores/               # Pinia 状态管理
│   │   └── assetStore.ts    # 资产状态管理
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts         # 类型接口定义
│   ├── App.vue              # 主应用组件
│   ├── db.ts                # 数据库操作
│   ├── main.ts              # 应用入口
│   └── vite-env.d.ts        # Vite 环境类型
├── src-tauri/                # Tauri 后端代码
│   ├── capabilities/         # Tauri 权限配置
│   │   └── default.json     # 默认权限配置
│   ├── icons/               # 应用图标
│   │   ├── 128x128.png
│   │   ├── 32x32.png
│   │   ├── icon.icns        # macOS 图标
│   │   ├── icon.ico         # Windows 图标
│   │   └── icon.png         # Linux 图标
│   ├── src/                 # Rust 源代码
│   │   ├── lib.rs          # 库文件
│   │   └── main.rs         # 主入口
│   ├── Cargo.lock           # Rust 依赖锁定
│   ├── Cargo.toml           # Rust 项目配置
│   ├── build.rs             # 构建脚本
│   └── tauri.conf.json      # Tauri 配置
├── .gitignore               # Git 忽略文件
├── README.md                # 项目说明文档
├── index.html               # HTML 入口
├── package-lock.json        # NPM 依赖锁定
├── package.json             # NPM 项目配置
├── tsconfig.json            # TypeScript 配置
├── tsconfig.node.json       # Node TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 🚀 快速开始

### 环境要求
- **Node.js**: >= 18.0.0
- **Rust**: >= 1.70.0
- **操作系统**: Windows / macOS / Linux

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/Kasa1u/asset-tracker.git
cd asset-tracker
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run tauri dev
```

4. **构建生产版本**
```bash
npm run tauri build
```

## 📊 数据库结构

### 资产表 (assets)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 资产名称 |
| buy_price | REAL | 购买价格 |
| buy_date | TEXT | 购买日期 |
| warranty_date | TEXT | 保修截止日期 |
| category | TEXT | 分类 |
| status | INTEGER | 状态 (0-4) |
| sell_price | REAL | 售出价格 |
| sell_date | TEXT | 售出日期 |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

### 心愿清单表 (wishlist)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 物品名称 |
| category | TEXT | 分类 |
| expected_price | REAL | 预期价格 |
| priority | INTEGER | 优先级 (0-5) |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

## 🎨 界面预览

### 首页
- 总资产卡片：显示总资产、日均成本、资产数量
- 智能提醒：保修到期提醒、高优先级心愿提醒
- 资产列表：卡片式展示，支持筛选、排序、搜索

### 心愿清单
- 心愿卡片：显示名称、预期价格、优先级
- 快速操作：编辑、删除心愿

### 时间轴
- 时间线：按购买时间展示资产历史
- 状态标签：清晰标识资产状态

### 统计分析
- 多种图表：柱状图、饼图、折线图、散点图
- 时间范围：支持自定义时间范围
- 数据洞察：深入分析资产数据

## 🔧 开发指南

### 开发模式
```bash
npm run tauri dev
```

### 构建发布
```bash
npm run tauri build
```

### 类型检查
```bash
npm run type-check
```

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 进行代码规范检查

## 📝 更新日志

### v1.0.0
- ✅ 完成基础资产管理功能
- ✅ 实现心愿清单功能
- ✅ 添加统计分析功能
- ✅ 实现时间轴展示
- ✅ 添加多语言支持
- ✅ 优化UI界面和用户体验
- ✅ 添加智能提醒功能
- ✅ 实现灵活的排序和筛选功能

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Tauri](https://tauri.app/) - 现代化的桌面应用框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Naive UI](https://www.naiveui.com/) - Vue 3 组件库
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理

## 📮 联系方式

项目地址: [https://github.com/Kasa1u/asset-tracker](https://github.com/Kasa1u/asset-tracker)

---

**注意**: 本项目仅供学习和个人使用，请勿用于商业目的。
