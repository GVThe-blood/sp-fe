import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

import { environment } from '../../../../environments/environment';
import { DashboardRange } from '../../../services/analytics.service';
import {
  AdminAnalyticsService,
  AdminDashboardSnapshotDTO,
} from '../../../services/admin-analytics.service';

Chart.register(...registerables);

interface RangeOption {
  token: DashboardRange;
  label: string;
}

interface KpiCard {
  id: string;
  label: string;
  value: string;
  icon: string;
  tone: 'green' | 'orange' | 'blue' | 'purple';
  /** Trend % so với cùng kỳ trước (đã format), hoặc null khi không tính được. */
  trend: string | null;
  trendDirection: 'up' | 'down' | 'flat';
  helper: string;
}

/**
 * Admin Overview — gateway page của `/admin/**`.
 *
 * Pattern dữ liệu giống {@code StoreAnalyticsComponent} của shop owner:
 * `rxResource` + `signal()` cho range filter, computed cho derived data,
 * effect cho chart re-render. Chart.js được khởi tạo trong AfterViewInit
 * (cần canvas đã render) và destroy trong OnDestroy để tránh memory leak.
 */
@Component({
  selector: 'app-admin-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css',
})
export class AdminOverviewComponent implements AfterViewInit, OnDestroy {
  private adminApi = inject(AdminAnalyticsService);

  protected readonly placeholderShop = environment.placeholders.shop;

  // -----------------------------------------------------------------
  // Range filter
  // -----------------------------------------------------------------
  protected readonly rangeOptions: ReadonlyArray<RangeOption> = [
    { token: 'week', label: '7 ngày' },
    { token: 'month', label: '30 ngày' },
    { token: 'quarter', label: 'Quý' },
    { token: 'year', label: 'Năm' },
  ];

  protected readonly range = signal<DashboardRange>('week');

  protected selectRange(token: DashboardRange): void {
    this.range.set(token);
  }

  // -----------------------------------------------------------------
  // Data resource
  // -----------------------------------------------------------------
  protected readonly dashboard = rxResource<AdminDashboardSnapshotDTO, { range: DashboardRange }>({
    request: () => ({ range: this.range() }),
    loader: ({ request }) => this.adminApi.getAdminDashboard(request.range, 10),
  });

  protected readonly snapshot = computed<AdminDashboardSnapshotDTO | null>(() => this.dashboard.value() ?? null);
  protected readonly isLoading = computed(() => this.dashboard.isLoading());
  protected readonly hasError = computed(() => this.dashboard.error() !== undefined);
  protected readonly errorMessage = computed(() => {
    const err = this.dashboard.error() as { message?: string; status?: number } | undefined;
    if (!err) return '';
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần đăng nhập với tài khoản admin để xem trang này.';
    }
    return err.message ?? 'Không tải được dữ liệu dashboard.';
  });

  protected reload(): void {
    this.dashboard.reload();
  }

  // -----------------------------------------------------------------
  // KPI mapping
  // -----------------------------------------------------------------
  protected readonly kpiCards = computed<KpiCard[]>(() => {
    const s = this.snapshot();
    if (!s) {
      // Loading skeleton placeholders
      const placeholder = '—';
      return [
        { id: 'rev', label: 'Doanh thu kỳ này', value: placeholder, icon: 'payments', tone: 'green', trend: null, trendDirection: 'flat', helper: 'Đang tải…' },
        { id: 'ord', label: 'Đơn hoàn tất kỳ này', value: placeholder, icon: 'receipt_long', tone: 'orange', trend: null, trendDirection: 'flat', helper: 'Đang tải…' },
        { id: 'shp', label: 'Tổng shop', value: placeholder, icon: 'storefront', tone: 'blue', trend: null, trendDirection: 'flat', helper: 'Đang tải…' },
        { id: 'usr', label: 'Tổng người dùng', value: placeholder, icon: 'group', tone: 'purple', trend: null, trendDirection: 'flat', helper: 'Đang tải…' },
      ];
    }

    return [
      {
        id: 'rev',
        label: 'Doanh thu kỳ này',
        value: this.formatVnd(s.windowRevenue),
        icon: 'payments',
        tone: 'green',
        ...this.computeTrend(s.windowRevenue, s.previousRevenue),
        helper: `Cùng kỳ: ${this.formatVnd(s.previousRevenue)}`,
      },
      {
        id: 'ord',
        label: 'Đơn hoàn tất kỳ này',
        value: this.formatNumber(s.windowOrders),
        icon: 'receipt_long',
        tone: 'orange',
        ...this.computeTrend(s.windowOrders, s.previousOrders),
        helper: `Cùng kỳ: ${this.formatNumber(s.previousOrders)} đơn`,
      },
      {
        id: 'shp',
        label: 'Tổng shop',
        value: this.formatNumber(s.overview.totalShops),
        icon: 'storefront',
        tone: 'blue',
        trend: s.overview.pendingRegistrations > 0 ? `${s.overview.pendingRegistrations} đơn chờ` : null,
        trendDirection: 'flat',
        helper: `${s.overview.activeShops} active · ${s.overview.suspendedShops} suspended`,
      },
      {
        id: 'usr',
        label: 'Tổng người dùng',
        value: this.formatNumber(s.overview.totalUsers),
        icon: 'group',
        tone: 'purple',
        trend: null,
        trendDirection: 'flat',
        helper: `${s.overview.totalCustomers} khách · ${s.overview.totalShopOwners} chủ shop`,
      },
    ];
  });

  protected readonly topShops = computed(() => this.snapshot()?.topShops ?? []);

  // -----------------------------------------------------------------
  // Charts
  // -----------------------------------------------------------------
  private readonly revenueCanvas = viewChild<ElementRef<HTMLCanvasElement>>('revenueCanvas');
  private readonly orderStatusCanvas = viewChild<ElementRef<HTMLCanvasElement>>('orderStatusCanvas');
  private readonly signupsCanvas = viewChild<ElementRef<HTMLCanvasElement>>('signupsCanvas');

  private revenueChart?: Chart;
  private orderStatusChart?: Chart;
  private signupsChart?: Chart;

  /** Cờ tránh effect chạy trước khi AfterViewInit khởi tạo Chart instances. */
  private readonly viewReady = signal(false);

  constructor() {
    // Effect tự render lại tất cả chart khi snapshot thay đổi.
    effect(() => {
      if (!this.viewReady()) return;
      const s = this.snapshot();
      if (!s) return;
      this.renderRevenueChart(s);
      this.renderOrderStatusChart(s);
      this.renderSignupsChart(s);
    });
  }

  ngAfterViewInit(): void {
    // Khởi tạo các chart rỗng — effect sẽ fill data khi resource resolve.
    this.revenueChart = this.createLineChart(this.revenueCanvas()!.nativeElement);
    this.orderStatusChart = this.createDonutChart(this.orderStatusCanvas()!.nativeElement);
    this.signupsChart = this.createBarChart(this.signupsCanvas()!.nativeElement);
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.orderStatusChart?.destroy();
    this.signupsChart?.destroy();
  }

  // -----------------------------------------------------------------
  // Chart factories
  // -----------------------------------------------------------------
  private createLineChart(canvas: HTMLCanvasElement): Chart {
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.formatVnd(Number(ctx.parsed.y))}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => this.formatVndShort(Number(val)),
              font: { size: 11 },
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false },
          },
        },
      },
    };
    return new Chart(canvas, config);
  }

  private createBarChart(canvas: HTMLCanvasElement): Chart {
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 11 } } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    };
    return new Chart(canvas, config);
  }

  private createDonutChart(canvas: HTMLCanvasElement): Chart {
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 11 } } },
        },
      },
    };
    return new Chart(canvas, config);
  }

  // -----------------------------------------------------------------
  // Render data into charts
  // -----------------------------------------------------------------
  private renderRevenueChart(s: AdminDashboardSnapshotDTO): void {
    if (!this.revenueChart) return;
    const labels = s.revenueSeries.map((p) => this.formatPeriod(p.period, s.range));
    this.revenueChart.data.labels = labels;
    this.revenueChart.data.datasets = [
      {
        label: 'Doanh thu',
        data: s.revenueSeries.map((p) => Number(p.revenue) || 0),
        borderColor: '#6db33f',
        backgroundColor: 'rgba(109, 179, 63, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ];
    this.revenueChart.update();
  }

  private renderOrderStatusChart(s: AdminDashboardSnapshotDTO): void {
    if (!this.orderStatusChart) return;
    const palette: Record<string, string> = {
      COMPLETED: '#6db33f',
      PENDING: '#ff8928',
      PENDING_PAYMENT: '#fbbf24',
      CANCELLED: '#94a3b8',
      FAILED: '#ba1a1a',
      ORDER_RETURN: '#a78bfa',
      DELETED: '#71717a',
    };
    const fallback = '#bdc7dc';

    this.orderStatusChart.data.labels = s.orderStatusBreakdown.map((b) => this.formatStatus(b.status));
    this.orderStatusChart.data.datasets = [
      {
        data: s.orderStatusBreakdown.map((b) => b.count),
        backgroundColor: s.orderStatusBreakdown.map((b) => palette[b.status] ?? fallback),
        borderWidth: 0,
      },
    ];
    this.orderStatusChart.update();
  }

  private renderSignupsChart(s: AdminDashboardSnapshotDTO): void {
    if (!this.signupsChart) return;
    const labels = s.signupSeries.map((p) => this.formatPeriod(p.period, s.range));
    this.signupsChart.data.labels = labels;
    this.signupsChart.data.datasets = [
      {
        label: 'User mới',
        data: s.signupSeries.map((p) => p.newUsers),
        backgroundColor: '#98a2b7',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Shop mới',
        data: s.signupSeries.map((p) => p.newShops),
        backgroundColor: '#ff8928',
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ];
    this.signupsChart.update();
  }

  // -----------------------------------------------------------------
  // Formatters
  // -----------------------------------------------------------------
  protected formatVnd(amount: number | string | null | undefined): string {
    const n = Number(amount ?? 0);
    if (!Number.isFinite(n)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
  }

  private formatVndShort(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
    return amount.toString();
  }

  private formatNumber(n: number): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  }

  private formatPeriod(iso: string, range: DashboardRange): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    if (range === 'year') {
      return d.toLocaleString('vi-VN', { month: 'short' });
    }
    if (range === 'quarter' || range === 'month') {
      return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      COMPLETED: 'Hoàn tất',
      PENDING: 'Chờ duyệt',
      PENDING_PAYMENT: 'Chờ thanh toán',
      CANCELLED: 'Đã huỷ',
      FAILED: 'Thất bại',
      ORDER_RETURN: 'Trả hàng',
      DELETED: 'Đã xoá',
    };
    return map[status] ?? status;
  }

  private computeTrend(current: number, previous: number): { trend: string | null; trendDirection: 'up' | 'down' | 'flat' } {
    const c = Number(current) || 0;
    const p = Number(previous) || 0;
    if (p === 0) {
      // Tránh chia 0 — không hiển thị trend nếu không có baseline.
      return { trend: null, trendDirection: 'flat' };
    }
    const diff = ((c - p) / p) * 100;
    const direction: 'up' | 'down' | 'flat' = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat';
    const sign = diff > 0 ? '+' : '';
    return {
      trend: `${sign}${diff.toFixed(1)}%`,
      trendDirection: direction,
    };
  }

  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderShop;
  }
}
