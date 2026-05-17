import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { RevenueChartData } from '../../models/analytics.models';

Chart.register(...registerables);

/**
 * Bar chart visualising revenue per period bucket alongside the order count
 * (rendered as a secondary line on the right axis). Data is sourced from
 * {@code DashboardSnapshotDTO.revenueSeries}.
 */
@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="text-sm font-semibold tracking-wider text-slate-500 uppercase">Doanh Thu Theo Thời Gian</p>
          <h3 class="text-xl font-bold text-gray-900 mt-1">Tổng & số đơn theo bucket</h3>
        </div>
      </div>
      <div class="relative flex-1 min-h-[260px]">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class RevenueChartComponent {
  private destroyRef = inject(DestroyRef);

  data = input.required<RevenueChartData>();

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

  private render(canvas: HTMLCanvasElement, data: RevenueChartData) {
    this.chart?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            type: 'bar',
            label: 'Doanh thu (₫)',
            data: data.revenue,
            backgroundColor: 'rgba(109, 179, 63, 0.85)',
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Số đơn',
            data: data.orderCount,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.35,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: '#181c1e',
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: '#fff',
            padding: 10,
            callbacks: {
              label: (ctx: any) => {
                if (ctx.dataset.label?.includes('Doanh thu')) {
                  return `Doanh thu: ${new Intl.NumberFormat('vi-VN').format(ctx.raw)} ₫`;
                }
                return `Số đơn: ${ctx.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } },
          },
          y: {
            position: 'left',
            ticks: {
              color: '#94a3b8',
              callback: (v: any) =>
                new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v),
            },
            grid: { color: 'rgba(148,163,184,0.15)' },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            ticks: { color: '#2563eb', font: { size: 11 } },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }
}
