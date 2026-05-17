import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderStatusBreakdown } from '../../models/analytics.models';

Chart.register(...registerables);

const INT = new Intl.NumberFormat('vi-VN');

/**
 * Doughnut breakdown of completed/failed/cancelled/returned orders for the
 * active period. Source: {@code OrderSuccessRateDTO}.
 */
@Component({
  selector: 'app-order-status-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
      <p class="text-sm font-semibold tracking-wider text-slate-500 uppercase">Phân bổ trạng thái đơn</p>
      <h3 class="text-xl font-bold text-gray-900 mt-1">Tỷ lệ hoàn thành & thất bại</h3>

      <div class="relative flex-1 flex items-center justify-center min-h-[220px]">
        <canvas #chartCanvas></canvas>
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span class="text-3xl font-extrabold text-gray-900">{{ totalLabel() }}</span>
          <span class="text-xs text-slate-500 uppercase tracking-wider">Tổng đơn</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs mt-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-green-600 inline-block"></span>
          <span class="text-slate-600">Hoàn thành</span>
          <span class="ml-auto font-bold text-gray-900">{{ formatInt(data().completed) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
          <span class="text-slate-600">Đang xử lý</span>
          <span class="ml-auto font-bold text-gray-900">{{ formatInt(data().cancelled) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span class="text-slate-600">Thất bại</span>
          <span class="ml-auto font-bold text-gray-900">{{ formatInt(data().failed) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
          <span class="text-slate-600">Trả hàng</span>
          <span class="ml-auto font-bold text-gray-900">{{ formatInt(data().returned) }}</span>
        </div>
      </div>
    </div>
  `,
})
export class OrderStatusChartComponent {
  private destroyRef = inject(DestroyRef);

  data = input.required<OrderStatusBreakdown>();
  totalLabel = computed(() => INT.format(this.data().total ?? 0));

  protected formatInt(v: number | null | undefined): string {
    return INT.format(v ?? 0);
  }

  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const data = this.data();
      const canvas = this.canvasRef();
      if (canvas && data) this.render(canvas.nativeElement, data);
    });
    this.destroyRef.onDestroy(() => {
      this.chart?.destroy();
      this.chart = null;
    });
  }

  private render(canvas: HTMLCanvasElement, data: OrderStatusBreakdown) {
    this.chart?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hoàn thành', 'Đang xử lý', 'Thất bại', 'Trả hàng'],
        datasets: [
          {
            data: [data.completed, data.cancelled, data.failed, data.returned],
            backgroundColor: ['#16a34a', '#f97316', '#ef4444', '#94a3b8'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#181c1e',
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: '#fff',
            padding: 10,
            callbacks: {
              label: (ctx: any) => {
                const total = data.total || 1;
                const pct = ((ctx.raw / total) * 100).toFixed(1);
                return `${ctx.label}: ${ctx.raw} (${pct}%)`;
              },
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}
