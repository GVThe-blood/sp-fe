import { Component, ChangeDetectionStrategy, input, signal, effect, viewChild, ElementRef, inject, DestroyRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ProfitChartData, TimeRange } from '../../models/analytics.models';

Chart.register(...registerables);

@Component({
  selector: 'app-profit-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './profit-chart.component.html',
  styleUrl: './profit-chart.component.css'
})
export class ProfitChartComponent {
  private destroyRef = inject(DestroyRef);
  
  // Signal inputs
  data = input.required<ProfitChartData>();
  
  // Signal queries
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  
  // Local state
  selectedRange = signal<TimeRange>('week');
  
  private chart: Chart | null = null;

  constructor() {
    // Effect to initialize/update chart when data changes
    effect(() => {
      const chartData = this.data();
      const canvas = this.canvasRef();
      
      if (canvas && chartData) {
        this.initChart(canvas.nativeElement, chartData);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    });
  }

  private initChart(canvas: HTMLCanvasElement, chartData: ProfitChartData): void {
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(109, 179, 63, 0.2)');
    gradient.addColorStop(1, 'rgba(109, 179, 63, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Lợi Nhuận',
          data: chartData.data,
          borderColor: '#306c00',
          backgroundColor: gradient,
          borderWidth: 4,
          pointBackgroundColor: '#306c00',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#181c1e',
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: '#ffffff',
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: any) =>
                `${new Intl.NumberFormat('vi-VN').format(context.raw ?? 0)} ₫`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                size: 10,
                weight: 'bold',
                family: "'Plus Jakarta Sans', sans-serif"
              }
            }
          },
          y: {
            display: false,
            min: 0,
            max: Math.max(...chartData.data) * 1.2
          }
        }
      }
    });
  }

  selectRange(range: TimeRange): void {
    this.selectedRange.set(range);
    // TODO: Emit event to parent to fetch new data
  }
}
