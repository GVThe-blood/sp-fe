import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import {
  AdminRevenueService,
  AdminRevenueStats,
  PageResp,
  RevenueByPayment,
  RevenueByShop,
  RevenueDailyPoint,
} from '../../../services/admin-revenue.service';

Chart.register(...registerables);

interface RangeOption {
  value: '7d' | '30d' | '90d' | 'ytd';
  label: string;
}

const PAGE_SIZE = 15;

/**
 * Trang "Doanh thu nền tảng".
 *
 * Cấu trúc:
 *  - KPI cards (GMV all-time, commission, GMV 30d ± trend, AOV, active shops…)
 *  - Line chart: doanh thu theo ngày (range filter 7d/30d/90d/ytd)
 *  - Doughnut chart: doanh thu theo payment method
 *  - Bảng paginated: doanh thu theo shop (search + page)
 *
 * <p>Toàn bộ data fetch qua {@link AdminRevenueService} → BE
 * {@code /statistical-reports/admin/revenue/**}. Không cần local cache vì
 * data thường xem 1 lần trên dashboard.</p>
 */
@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-revenue.component.html',
  styleUrl: './admin-revenue.component.css',
})
export class AdminRevenueComponent implements AfterViewInit, OnDestroy {
  private api = inject(AdminRevenueService);

  protected readonly ranges: ReadonlyArray<RangeOption> = [
    { value: '7d', label: '7 ngày' },
    { value: '30d', label: '30 ngày' },
    { value: '90d', label: '90 ngày' },
    { value: 'ytd', label: 'Năm nay' },
  ];

  protected readonly range = signal<RangeOption['value']>('30d');
  protected readonly shopSearch = signal<string>('');
  protected readonly shopPage = signal<number>(0);

  /** Tính start/end ISO theo range filter; recompute khi range thay đổi. */
  private readonly window = computed(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    switch (this.range()) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'ytd':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  });

  // -----------------------------------------------------------------
  // Resources
  // -----------------------------------------------------------------
  private readonly statsResource = rxResource<AdminRevenueStats, void>({
    loader: () => this.api.getStats(),
  });

  private readonly dailyResource = rxResource<RevenueDailyPoint[], { start: string; end: string }>({
    request: () => this.window(),
    loader: ({ request }) => this.api.getDaily(request.start, request.end),
  });

  private readonly paymentResource = rxResource<RevenueByPayment[], { start: string; end: string }>(
    {
      request: () => this.window(),
      loader: ({ request }) => this.api.getByPayment(request.start, request.end),
    },
  );

  private readonly shopResource = rxResource<
    PageResp<RevenueByShop>,
    { start: string; end: string; search: string; page: number }
  >({
    request: () => ({
      start: this.window().start,
      end: this.window().end,
      search: this.shopSearch(),
      page: this.shopPage(),
    }),
    loader: ({ request }) =>
      this.api.getByShop({
        start: request.start,
        end: request.end,
        search: request.search,
        page: request.page,
        size: PAGE_SIZE,
      }),
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);
  protected readonly statsLoading = computed(() => this.statsResource.isLoading());
  protected readonly statsError = computed(() => this.statsResource.error() != null);

  protected readonly daily = computed(() => this.dailyResource.value() ?? []);
  protected readonly dailyLoading = computed(() => this.dailyResource.isLoading());

  protected readonly paymentBreakdown = computed(() => this.paymentResource.value() ?? []);

  protected readonly shopPage_ = computed(() => this.shopResource.value() ?? null);
  protected readonly shopRows = computed(() => this.shopPage_()?.content ?? []);
  protected readonly shopTotal = computed(() => this.shopPage_()?.totalElements ?? 0);
  protected readonly shopTotalPages = computed(() => this.shopPage_()?.totalPages ?? 0);
  protected readonly shopLoading = computed(() => this.shopResource.isLoading());

  /** % thay đổi GMV last30 vs prev30 (null nếu prev=0). */
  protected readonly gmvTrend = computed(() => {
    const s = this.stats();
    if (!s || s.gmvPrev30 === 0) return null;
    return ((s.gmvLast30 - s.gmvPrev30) / s.gmvPrev30) * 100;
  });

  protected readonly orderTrend = computed(() => {
    const s = this.stats();
    if (!s || s.ordersPrev30 === 0) return null;
    return ((s.ordersLast30 - s.ordersPrev30) / s.ordersPrev30) * 100;
  });

  // -----------------------------------------------------------------
  // Filter handlers
  // -----------------------------------------------------------------
  protected setRange(v: RangeOption['value']): void {
    this.range.set(v);
    this.shopPage.set(0);
  }

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  protected onShopSearchInput(v: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.shopSearch.set(v);
      this.shopPage.set(0);
    }, 300);
  }

  protected goPage(p: number): void {
    if (p < 0 || p >= this.shopTotalPages()) return;
    this.shopPage.set(p);
  }

  // -----------------------------------------------------------------
  // Charts
  // -----------------------------------------------------------------
  private readonly dailyCanvas = viewChild<ElementRef<HTMLCanvasElement>>('dailyCanvas');
  private readonly paymentCanvas = viewChild<ElementRef<HTMLCanvasElement>>('paymentCanvas');

  private dailyChart?: Chart;
  private paymentChart?: Chart;
  private readonly viewReady = signal(false);

  constructor() {
    effect(() => {
      if (!this.viewReady()) return;
      this.renderDailyChart();
      this.renderPaymentChart();
    });
  }

  ngAfterViewInit(): void {
    this.dailyChart = this.createLineChart(this.dailyCanvas()!.nativeElement);
    this.paymentChart = this.createDonutChart(this.paymentCanvas()!.nativeElement);
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.dailyChart?.destroy();
    this.paymentChart?.destroy();
  }

  private createLineChart(canvas: HTMLCanvasElement): Chart {
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => this.compactCurrency(Number(v)),
            },
          },
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
        plugins: { legend: { position: 'bottom' } },
        cutout: '62%',
      },
    };
    return new Chart(canvas, config);
  }

  private renderDailyChart(): void {
    if (!this.dailyChart) return;
    const data = this.daily();
    this.dailyChart.data.labels = data.map((p) => this.formatDate(p.date));
    this.dailyChart.data.datasets = [
      {
        label: 'Doanh thu',
        data: data.map((p) => p.revenue),
        borderColor: '#6db33f',
        backgroundColor: 'rgba(109, 179, 63, 0.18)',
        fill: true,
        tension: 0.32,
        borderWidth: 2,
        pointRadius: 2,
      },
      {
        label: 'Hoa hồng (10%)',
        data: data.map((p) => p.commission),
        borderColor: '#ec9836',
        backgroundColor: 'rgba(236, 152, 54, 0.16)',
        fill: false,
        tension: 0.32,
        borderWidth: 2,
        pointRadius: 2,
        borderDash: [5, 5],
      },
    ];
    this.dailyChart.update();
  }

  private renderPaymentChart(): void {
    if (!this.paymentChart) return;
    const data = this.paymentBreakdown();
    const palette = ['#6db33f', '#3079ed', '#ec9836', '#a052e8', '#e94f37', '#41b3a3'];
    this.paymentChart.data.labels = data.map((p) => p.paymentMethod || 'KHÔNG RÕ');
    this.paymentChart.data.datasets = [
      {
        data: data.map((p) => p.revenue),
        backgroundColor: data.map((_, i) => palette[i % palette.length]),
        borderWidth: 0,
      },
    ];
    this.paymentChart.update();
  }

  // -----------------------------------------------------------------
  // Formatting helpers
  // -----------------------------------------------------------------
  protected formatCurrency(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(v);
  }

  /** Compact "1,2M ₫" — dùng trên Y axis của line chart cho gọn. */
  protected compactCurrency(v: number): string {
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
    return String(v);
  }

  protected formatPercent(v: number | null): string {
    if (v == null) return '—';
    const sign = v > 0 ? '+' : '';
    return sign + v.toFixed(1) + '%';
  }

  protected formatNumber(v: number | null | undefined): string {
    if (v == null) return '0';
    return new Intl.NumberFormat('vi-VN').format(v);
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  protected paymentLabel(method: string): string {
    const m: Record<string, string> = {
      VNPAY: 'VNPay',
      MOMO: 'MoMo',
      ZALOPAY: 'ZaloPay',
      STRIPE: 'Stripe',
      COD: 'Tiền mặt (COD)',
      UNKNOWN: 'Không rõ',
    };
    return m[method.toUpperCase()] ?? method;
  }
}
