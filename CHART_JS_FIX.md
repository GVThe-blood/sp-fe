# Chart.js Missing Dependency Fix

## 🎯 Problem

Sau khi merge branch `dev` vào branch `chat-modal`, xuất hiện lỗi thiếu module `chart.js`:

```
TS2307: Cannot find module 'chart.js' or its corresponding type declarations.

Files affected:
- src/app/pages/store-analytics/components/profit-chart/profit-chart.component.ts
- src/app/pages/store-analytics/components/sales-channel-chart/sales-channel-chart.component.ts
```

## 🔧 Solution

### Install chart.js
```bash
npm install chart.js --legacy-peer-deps
```

## ✅ Result

```bash
✅ Build Successful
Bundle: 1.17 MB (269.39 kB gzipped)
Time: 8.918 seconds

⚠️ Warning: Bundle size exceeded budget by 166.11 kB
(Budget: 1.00 MB, Actual: 1.17 MB)
```

## 📦 Package Added

```json
{
  "chart.js": "^4.4.8"
}
```

## 📊 Bundle Size Impact

### Before (Chat Only)
```
Bundle: 937.98 kB (204.04 kB gzipped)
```

### After (Chat + Store Analytics)
```
Bundle: 1.17 MB (269.39 kB gzipped)
Increase: +232 kB (+65.35 kB gzipped)
```

**Reason:** Added Chart.js library for store analytics charts

## 🎨 Features Now Available

### Store Analytics Components
- ✅ Profit Chart (Line/Bar charts)
- ✅ Sales Channel Chart (Pie/Doughnut charts)
- ✅ Revenue tracking
- ✅ Performance metrics

### Chart.js Capabilities
- Line charts
- Bar charts
- Pie charts
- Doughnut charts
- Radar charts
- Polar area charts
- Bubble charts
- Scatter charts

## ⚠️ Bundle Size Warning

Bundle exceeded budget by **166.11 kB**. Consider:

### Option 1: Increase Budget (Quick Fix)
```json
// angular.json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "1.2mb",
    "maximumError": "1.5mb"
  }
]
```

### Option 2: Lazy Load Analytics (Recommended)
```typescript
// app.routes.ts
{
  path: 'store-analytics',
  loadComponent: () => import('./pages/store-analytics/store-analytics.component')
}
```

### Option 3: Use Lighter Chart Library
- Consider `ng2-charts` (wrapper for Chart.js)
- Or `ngx-charts` (native Angular, smaller)
- Or `echarts` (more features, similar size)

## 📝 Files Using Chart.js

1. **profit-chart.component.ts**
   - Line/Bar charts for profit tracking
   - Time series data visualization

2. **sales-channel-chart.component.ts**
   - Pie/Doughnut charts for sales channels
   - Distribution visualization

## 🚀 Status

- ✅ chart.js installed
- ✅ Build successful
- ✅ Store analytics working
- ⚠️ Bundle size warning (can be ignored or fixed later)

---

**Fixed:** 2026-05-08
**Status:** ✅ COMPLETE
