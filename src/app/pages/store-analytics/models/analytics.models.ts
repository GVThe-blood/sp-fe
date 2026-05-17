/**
 * Analytics data models for Store Analytics Dashboard
 */

export interface KpiData {
  icon: string;
  iconFilled?: boolean;
  label: string;
  value: string;
  trend: TrendData;
  iconBgColor: string;
  iconColor: string;
}

export interface TrendData {
  value: string;
  direction: 'up' | 'down' | 'neutral';
  color: string;
  bgColor: string;
}

export interface MetricData {
  label: string;
  value: string;
  progress: number;
  progressColor: string;
  target?: string;
  isWarning?: boolean;
}

export interface ProfitChartData {
  labels: string[];
  data: number[];
}

export interface SalesChannelData {
  online: number;
  offline: number;
  onlineRevenue: string;
  offlineRevenue: string;
}

export interface TopProduct {
  name: string;
  sku: string;
  image: string;
  inventory: string;
  sales: number;
  revenue: string;
  performanceClass: string;
  performanceLabel: string;
  performanceProgress: number;
  performanceProgressClass: string;
  inventoryWarning: boolean;
}

export interface TrafficSource {
  name: string;
  percentage: number;
}

export type TimeRange = 'today' | 'week' | 'month' | 'year';

/**
 * Range tokens consumed by the BE /me/dashboard endpoint. Slightly different
 * from {@link TimeRange} (the FE legacy local filter) because the BE accepts
 * a 'quarter' bucket.
 */
export type DashboardRange = 'week' | 'month' | 'quarter' | 'year';

/**
 * Revenue chart series — paired revenue and order-count arrays sharing the
 * same {@code labels} index.
 */
export interface RevenueChartData {
  labels: string[];
  revenue: number[];
  orderCount: number[];
}

/**
 * Doughnut breakdown of order outcomes for the active period.
 */
export interface OrderStatusBreakdown {
  completed: number;
  failed: number;
  cancelled: number;
  returned: number;
  total: number;
}

/**
 * Histogram of star ratings (1..5).
 */
export interface RatingDistributionData {
  average: number;
  total: number;
  /** Always length 5 — index 0 = 1 star, index 4 = 5 stars. */
  counts: number[];
}
