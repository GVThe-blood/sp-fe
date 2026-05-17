import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import { UserService } from '../../services/user.service';
import { AnalyticsService, DashboardSnapshotDTO } from '../../services/analytics.service';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { ProfitChartComponent } from './components/profit-chart/profit-chart.component';
import { SalesChannelChartComponent } from './components/sales-channel-chart/sales-channel-chart.component';
import { TopProductsTableComponent } from './components/top-products-table/top-products-table.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';
import { OrderStatusChartComponent } from './components/order-status-chart/order-status-chart.component';
import { RatingDistributionChartComponent } from './components/rating-distribution-chart/rating-distribution-chart.component';
import {
  buildAvgOrderValueMetric,
  buildKpiCards,
  buildOrderStatusBreakdown,
  buildProfitChartData,
  buildRatingDistribution,
  buildReturnRateMetric,
  buildRevenueChartData,
  buildTopProducts,
} from './models/analytics.mappers';
import {
  DashboardRange,
  KpiData,
  MetricData,
  OrderStatusBreakdown,
  ProfitChartData,
  RatingDistributionData,
  RevenueChartData,
  SalesChannelData,
  TopProduct,
  TrafficSource,
} from './models/analytics.models';

interface RangeOption {
  token: DashboardRange;
  label: string;
}

@Component({
  selector: 'app-store-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoreSidebarComponent,
    KpiCardComponent,
    MetricCardComponent,
    ProfitChartComponent,
    SalesChannelChartComponent,
    TopProductsTableComponent,
    RevenueChartComponent,
    OrderStatusChartComponent,
    RatingDistributionChartComponent,
  ],
  templateUrl: './store-analytics.component.html',
  styleUrl: './store-analytics.component.css',
})
export class StoreAnalyticsComponent {
  private userService = inject(UserService);
  private analyticsService = inject(AnalyticsService);

  user = this.userService.currentUser;

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  protected readonly rangeOptions: ReadonlyArray<RangeOption> = [
    { token: 'week', label: 'Tuần này' },
    { token: 'month', label: '30 ngày' },
    { token: 'quarter', label: 'Quý' },
    { token: 'year', label: 'Năm' },
  ];

  protected range = signal<DashboardRange>('week');
  protected selectRange(range: DashboardRange) {
    this.range.set(range);
  }

  // -------------------------------------------------------------------------
  // Data resource — auto-fetches whenever the range changes and surfaces
  // value/error/isLoading signals to the template.
  // -------------------------------------------------------------------------
  protected dashboard = rxResource<DashboardSnapshotDTO, { range: DashboardRange }>({
    request: () => ({ range: this.range() }),
    loader: ({ request }) => this.analyticsService.getMyDashboard(request.range),
  });

  // Convenience computeds. They all degrade gracefully to safe defaults so the
  // template can stay declarative even before the first response arrives.
  protected snapshot = computed<DashboardSnapshotDTO | null>(() => this.dashboard.value() ?? null);

  protected kpiData = computed<KpiData[]>(() => {
    const s = this.snapshot();
    return s ? buildKpiCards(s) : [];
  });

  protected profitChartData = computed<ProfitChartData>(() => {
    const s = this.snapshot();
    return s ? buildProfitChartData(s) : { labels: [], data: [] };
  });

  protected revenueChartData = computed<RevenueChartData>(() => {
    const s = this.snapshot();
    return s ? buildRevenueChartData(s) : { labels: [], revenue: [], orderCount: [] };
  });

  protected orderStatusData = computed<OrderStatusBreakdown>(() => {
    const s = this.snapshot();
    return s
      ? buildOrderStatusBreakdown(s.successRate)
      : { completed: 0, failed: 0, cancelled: 0, returned: 0, total: 0 };
  });

  protected ratingData = computed<RatingDistributionData>(() => {
    const s = this.snapshot();
    return s ? buildRatingDistribution(s.ratings) : { average: 0, total: 0, counts: [0, 0, 0, 0, 0] };
  });

  protected topProducts = computed<TopProduct[]>(() => {
    const s = this.snapshot();
    return s ? buildTopProducts(s.topProducts) : [];
  });

  protected avgOrderValue = computed<MetricData>(() => {
    const s = this.snapshot();
    return s
      ? buildAvgOrderValueMetric(s)
      : {
          label: 'Giá Trị Đơn Trung Bình',
          value: '—',
          progress: 0,
          progressColor: '#6db33f',
          target: 'Đang tải…',
        };
  });

  protected returnRate = computed<MetricData>(() => {
    const s = this.snapshot();
    return s
      ? buildReturnRateMetric(s.successRate)
      : {
          label: 'Tỷ Lệ Trả Hàng',
          value: '—',
          progress: 0,
          progressColor: '#0f766e',
          target: 'Đang tải…',
        };
  });

  // -------------------------------------------------------------------------
  // Mock fallbacks for slices the BE doesn't expose yet (sales channel mix,
  // traffic sources). These are flagged as "Demo" in the template so users
  // know they aren't real-time data.
  // -------------------------------------------------------------------------
  protected salesChannelData = signal<SalesChannelData>({
    online: 72,
    offline: 28,
    onlineRevenue: '30.852.000 ₫',
    offlineRevenue: '11.998.000 ₫',
  });

  protected trafficSources = signal<TrafficSource[]>([
    { name: 'Mạng xã hội', percentage: 45 },
    { name: 'Trực tiếp', percentage: 30 },
    { name: 'Tìm kiếm', percentage: 25 },
  ]);

  // -------------------------------------------------------------------------
  // Loading / error helpers
  // -------------------------------------------------------------------------
  protected isLoading = computed(() => this.dashboard.isLoading());
  protected hasError = computed(() => this.dashboard.error() !== undefined);
  protected errorMessage = computed(() => {
    const err = this.dashboard.error() as { message?: string; status?: number } | undefined;
    if (!err) return '';
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần đăng nhập với tài khoản chủ shop để xem trang này.';
    }
    return err.message ?? 'Không tải được dữ liệu thống kê.';
  });

  protected reload() {
    this.dashboard.reload();
  }

  protected handleExportData(): void {
    // TODO: wire up Carbone /render endpoint in Pha 3.
    // For now we just trigger a CSV download of the in-memory top products.
    const products = this.topProducts();
    if (!products.length) return;
    const header = 'Tên,SKU,Số lượng bán,Doanh thu,Tồn kho';
    const rows = products
      .map((p) => `"${p.name}","${p.sku}",${p.sales},"${p.revenue}","${p.inventory}"`)
      .join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-products-${this.range()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
