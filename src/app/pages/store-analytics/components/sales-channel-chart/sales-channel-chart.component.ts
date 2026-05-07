import { Component, ChangeDetectionStrategy, input, effect, viewChild, ElementRef, inject, DestroyRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { SalesChannelData } from '../../models/analytics.models';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-channel-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './sales-channel-chart.component.html',
  styleUrl: './sales-channel-chart.component.css'
})
export class SalesChannelChartComponent {
  private destroyRef = inject(DestroyRef);
  
  // Signal inputs
  data = input.required<SalesChannelData>();
  
  // Signal queries
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  
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

  private initChart(canvas: HTMLCanvasElement, chartData: SalesChannelData): void {
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Trực tuyến', 'Trực tiếp/POS'],
        datasets: [{
          data: [chartData.online, chartData.offline],
          backgroundColor: [
            '#6db33f',
            '#ff8928'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }
}
