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
import { RatingDistributionData } from '../../models/analytics.models';

Chart.register(...registerables);

const INT = new Intl.NumberFormat('vi-VN');

/**
 * Horizontal bar chart of star-rating histogram (1..5) plus the average score
 * as a hero number. Source: {@code RatingReportDTO}.
 */
@Component({
  selector: 'app-rating-distribution-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
      <p class="text-sm font-semibold tracking-wider text-slate-500 uppercase">Phân phối đánh giá</p>
      <div class="flex items-baseline gap-3 mt-2">
        <span class="text-4xl font-extrabold text-gray-900">{{ averageLabel() }}</span>
        <span class="material-symbols-outlined text-yellow-400" style="font-variation-settings: 'FILL' 1">star</span>
        <span class="text-sm text-slate-500">/ 5 ({{ totalLabel() }} đánh giá)</span>
      </div>

      <div class="relative flex-1 min-h-[180px] mt-4">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class RatingDistributionChartComponent {
  private destroyRef = inject(DestroyRef);

  data = input.required<RatingDistributionData>();
  averageLabel = computed(() => (this.data().average ?? 0).toFixed(1));
  totalLabel = computed(() => INT.format(this.data().total ?? 0));

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

  private render(canvas: HTMLCanvasElement, data: RatingDistributionData) {
    this.chart?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
        datasets: [
          {
            data: data.counts,
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#16a34a'],
            borderRadius: 6,
            barThickness: 14,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#181c1e',
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: '#fff',
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.15)' },
            ticks: { color: '#94a3b8', precision: 0 },
            beginAtZero: true,
          },
          y: {
            grid: { display: false },
            ticks: { color: '#475569', font: { size: 12, weight: 'bold' } },
          },
        },
      },
    });
  }
}
