import {
  DashboardSnapshotDTO,
  OrderSuccessRateDTO,
  ProfitReportDTO,
  RatingReportDTO,
  RevenueReportDTO,
  TopProductDTO,
} from '../../../services/analytics.service';
import {
  KpiData,
  MetricData,
  ProfitChartData,
  RatingDistributionData,
  RevenueChartData,
  OrderStatusBreakdown,
  TopProduct,
  TrendData,
} from './analytics.models';

// ---------------------------------------------------------------------------
// Currency / number helpers — VND is the canonical currency in the project.
// ---------------------------------------------------------------------------

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const COMPACT_VND = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const INT = new Intl.NumberFormat('vi-VN');

const PCT = new Intl.NumberFormat('vi-VN', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatVnd(amount: number | null | undefined): string {
  return VND.format(amount ?? 0);
}

export function formatVndCompact(amount: number | null | undefined): string {
  return `${COMPACT_VND.format(amount ?? 0)} ₫`;
}

export function formatInt(value: number | null | undefined): string {
  return INT.format(value ?? 0);
}

export function formatPercent(value: number | null | undefined): string {
  return PCT.format((value ?? 0) / 100);
}

// ---------------------------------------------------------------------------
// Trend helper — used to compute "vs previous period" deltas for KPI cards.
// ---------------------------------------------------------------------------

function buildTrend(current: number, previous: number, palette: 'green' | 'blue' | 'orange' | 'red' | 'slate' = 'green'): TrendData {
  const direction = current > previous ? 'up' : current < previous ? 'down' : 'neutral';
  const ratio = previous === 0 ? (current === 0 ? 0 : 1) : (current - previous) / Math.abs(previous);
  const sign = ratio > 0 ? '+' : '';
  const value = `${sign}${(ratio * 100).toFixed(1)}%`;
  const colors = {
    green: { color: '#15803d', bgColor: '#f0fdf4' },
    blue: { color: '#2563eb', bgColor: '#eff6ff' },
    orange: { color: '#ea580c', bgColor: '#fff7ed' },
    red: { color: '#dc2626', bgColor: '#fef2f2' },
    slate: { color: '#64748b', bgColor: '#f1f5f9' },
  } as const;
  // Down-trends always use red regardless of the requested palette so the
  // visual signal is consistent.
  const palette$ = direction === 'down' ? colors.red : direction === 'neutral' ? colors.slate : colors[palette];
  return { value, direction, color: palette$.color, bgColor: palette$.bgColor };
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function buildKpiCards(snapshot: DashboardSnapshotDTO): KpiData[] {
  const currentRevenue = snapshot.revenueSeries.reduce((acc, r) => acc + (r.revenue ?? 0), 0);
  const currentOrders = snapshot.revenueSeries.reduce((acc, r) => acc + (r.orderCount ?? 0), 0);
  const netProfit = snapshot.profitSeries.reduce((acc, p) => acc + (p.netProfit ?? 0), 0);

  return [
    {
      icon: 'payments',
      iconFilled: true,
      label: 'Doanh Thu',
      value: formatVndCompact(currentRevenue),
      trend: buildTrend(currentRevenue, snapshot.previousRevenue ?? 0, 'green'),
      iconBgColor: '#f0fdf4',
      iconColor: '#65a30d',
    },
    {
      icon: 'savings',
      iconFilled: true,
      label: 'Lợi Nhuận Ròng',
      value: formatVndCompact(netProfit),
      // Profit trend is derived against revenue trend as a rough proxy until
      // the BE exposes a real `previousProfit` total.
      trend: buildTrend(netProfit, (snapshot.previousRevenue ?? 0) * (currentRevenue === 0 ? 0 : netProfit / currentRevenue), 'green'),
      iconBgColor: '#ecfeff',
      iconColor: '#0891b2',
    },
    {
      icon: 'check_circle',
      iconFilled: true,
      label: 'Tỷ Lệ Hoàn Thành',
      value: `${(snapshot.successRate.successRate ?? 0).toFixed(1)}%`,
      trend: {
        value: `${formatInt(snapshot.successRate.completedOrders ?? 0)} đơn`,
        direction: 'neutral',
        color: '#0f766e',
        bgColor: '#f0fdfa',
      },
      iconBgColor: '#fff7ed',
      iconColor: '#ea580c',
    },
    {
      icon: 'shopping_bag',
      iconFilled: true,
      label: 'Tổng Đơn',
      value: formatInt(currentOrders),
      trend: buildTrend(currentOrders, snapshot.previousOrders ?? 0, 'blue'),
      iconBgColor: '#eff6ff',
      iconColor: '#2563eb',
    },
  ];
}

export function buildProfitChartData(snapshot: DashboardSnapshotDTO): ProfitChartData {
  return {
    labels: snapshot.profitSeries.map((p) => formatPeriodLabel(p.period, snapshot.range)),
    data: snapshot.profitSeries.map((p) => p.netProfit ?? 0),
  };
}

export function buildRevenueChartData(snapshot: DashboardSnapshotDTO): RevenueChartData {
  return {
    labels: snapshot.revenueSeries.map((r) => formatPeriodLabel(r.period, snapshot.range)),
    revenue: snapshot.revenueSeries.map((r) => r.revenue ?? 0),
    orderCount: snapshot.revenueSeries.map((r) => r.orderCount ?? 0),
  };
}

export function buildOrderStatusBreakdown(rate: OrderSuccessRateDTO): OrderStatusBreakdown {
  return {
    completed: rate.completedOrders ?? 0,
    failed: rate.failedOrders ?? 0,
    cancelled: rate.cancelledOrders ?? 0,
    returned: rate.returnedOrders ?? 0,
    total: rate.totalOrders ?? 0,
  };
}

export function buildRatingDistribution(ratings: RatingReportDTO): RatingDistributionData {
  return {
    average: ratings.averageRating ?? 0,
    total: ratings.totalFeedbacks ?? 0,
    counts: [
      ratings.star1 ?? 0,
      ratings.star2 ?? 0,
      ratings.star3 ?? 0,
      ratings.star4 ?? 0,
      ratings.star5 ?? 0,
    ],
  };
}

export function buildAvgOrderValueMetric(snapshot: DashboardSnapshotDTO): MetricData {
  const totalRevenue = snapshot.revenueSeries.reduce((acc, r) => acc + (r.revenue ?? 0), 0);
  const totalOrders = snapshot.revenueSeries.reduce((acc, r) => acc + (r.orderCount ?? 0), 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  // Stretch target = 120% of current AOV; cap progress to 100.
  const target = aov * 1.2;
  const progress = target > 0 ? Math.min(100, Math.round((aov / target) * 100)) : 0;
  return {
    label: 'Giá Trị Đơn Trung Bình',
    value: formatVnd(aov),
    progress,
    progressColor: '#6db33f',
    target: `Mục tiêu: ${formatVnd(target)}`,
  };
}

export function buildReturnRateMetric(rate: OrderSuccessRateDTO): MetricData {
  const total = rate.totalOrders ?? 0;
  const returned = rate.returnedOrders ?? 0;
  const ratio = total > 0 ? (returned / total) * 100 : 0;
  return {
    label: 'Tỷ Lệ Trả Hàng',
    value: `${ratio.toFixed(1)}%`,
    progress: Math.min(100, Math.round(ratio * 10)),
    progressColor: ratio > 5 ? '#dc2626' : '#0f766e',
    target: ratio > 5 ? 'Cao hơn ngưỡng cảnh báo' : 'Trong ngưỡng an toàn',
    isWarning: ratio > 5,
  };
}

export function buildTopProducts(products: TopProductDTO[]): TopProduct[] {
  if (!products?.length) return [];
  const maxQty = Math.max(...products.map((p) => p.quantitySold ?? 0), 1);
  return products.map((p) => {
    const qty = p.quantitySold ?? 0;
    const stock = p.stockQuantity ?? 0;
    const lowStock = stock > 0 && stock < 50;
    return {
      name: p.productName,
      sku: p.sku ?? p.productId.slice(0, 8).toUpperCase(),
      image: p.imageUrl ?? '/assets/images/placeholder-product.png',
      inventory: lowStock ? `${formatInt(stock)} (Thấp)` : `${formatInt(stock)} đơn vị`,
      sales: qty,
      revenue: formatVnd(p.revenue ?? 0),
      performanceClass: lowStock ? 'text-secondary bg-orange-50' : 'text-primary bg-lime-50',
      performanceLabel: lowStock ? 'Sắp hết' : 'Tốt',
      performanceProgress: Math.round((qty / maxQty) * 100),
      performanceProgressClass: lowStock ? 'bg-secondary-container' : 'bg-primary-container',
      inventoryWarning: lowStock,
    };
  });
}

// ---------------------------------------------------------------------------
// Period label formatter — picks a sensible label depending on the active
// range. Period strings are ISO LocalDateTime (no zone), which the JS Date
// constructor parses as local time.
// ---------------------------------------------------------------------------

function formatPeriodLabel(period: string, range: 'week' | 'month' | 'quarter' | 'year'): string {
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return period;
  switch (range) {
    case 'week':
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    case 'month':
    case 'quarter':
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    case 'year':
      return date.toLocaleDateString('vi-VN', { month: 'short' });
    default:
      return date.toLocaleDateString('vi-VN');
  }
}
