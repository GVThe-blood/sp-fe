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
