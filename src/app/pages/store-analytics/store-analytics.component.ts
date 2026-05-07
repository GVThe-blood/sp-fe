import { Component, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import { UserService } from '../../services/user.service';

Chart.register(...registerables);

@Component({
  selector: 'app-store-analytics',
  standalone: true,
  imports: [CommonModule, StoreSidebarComponent],
  templateUrl: './store-analytics.component.html',
  styleUrl: './store-analytics.component.css'
})
export class StoreAnalyticsComponent implements AfterViewInit {
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  userService = inject(UserService);
  user = this.userService.currentUser;

  lineChart: any;
  doughnutChart: any;

  // Mock data for top selling products
  topProducts = [
    {
      name: 'Cải xoăn hữu cơ tươi',
      sku: 'VG-001-KLE',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMqK8iE_KNxsNT6AyPushm9OTRDRzQVUnAr1uyqG2NaunT60yDDSLH1zbVwh1_uFb_t_uAgMTvb7an2wpCt1cmzQVlipOONgY_8zEjPOmYgVqKE2aveWAfic3XExLSXYM869mfBXjLARf8O23cEOAO3AMdi-oBNYoI0wEMybKS6izPY3Igjii8GYBKcHmtgr_uuvhCervAmpD7lyYlY78Av3a4RafpgCdaNS2iUSxnuOXGSuoACyxtDNWkyl4zaXHBwvJ5Moh2UcN2',
      inventory: '1,240 đơn vị',
      sales: 842,
      revenue: '$4,210.00',
      performanceClass: 'text-primary bg-lime-50',
      performanceLabel: '+18%',
      performanceProgress: 80,
      performanceProgressClass: 'bg-primary-container',
      inventoryWarning: false
    },
    {
      name: 'Cà rốt cầu vồng Heritage',
      sku: 'VG-042-CRT',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoEhfLlW23mlXZyTJtzRpQAhqFAbU22R5NeoJ1V_OKsMJZVrMEt7OmgFQCHQhT0a6HgMC3wcQvWjLMUOBzYtGzkyLKy7WoGCGsRKNgp6Yids9Oy3edu3UFD4i5JewoHNGbmCsdFG0emB_UiFwCYMMirk7Z60Q8JsJWlk5Gd3qyyKTxoFhDtyxQuZ8wRwUVK6gvw0YaSoHDS9R6MGCk_ULucP0jDy-vLKO4lZtczMfXR5YpT00OrnKrFDRQmaCXbSiZXrH8zNwHZTuU',
      inventory: '450 đơn vị',
      sales: 312,
      revenue: '$1,872.00',
      performanceClass: 'text-primary bg-lime-50',
      performanceLabel: '+5%',
      performanceProgress: 60,
      performanceProgressClass: 'bg-primary-container',
      inventoryWarning: false
    },
    {
      name: 'Mật ong hoa dại (500g)',
      sku: 'PN-009-HNY',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdOn0cAgRPhWmghDQmCBk9Lb5-4dnZ-fSh86exjzdVnxyTeBka2gfo_baR6DRREizvXniSl4GL7AciBAnC8pmIQefLBw7p9r2cq65FxGs_uUeWhQPvDgKGY4sPM0hkRMuzyiR2CpaZuMZxZ-7YorwL1EeEY_U7YLKFkeK9qgdrYNUU4ptbj17MZPRw43B2vAMN1D6uO4Yaxljm2SzAeo5M_IURgFg8HihiE6QY0nt4bvSbXJCQxUXMPOvEDJLh_Qnb-Umx9wqYKMoD',
      inventory: '24 đơn vị (Thấp)',
      sales: 195,
      revenue: '$3,900.00',
      performanceClass: 'text-secondary bg-orange-50',
      performanceLabel: 'Tốc độ cao',
      performanceProgress: 95,
      performanceProgressClass: 'bg-secondary-container',
      inventoryWarning: true
    }
  ];

  ngAfterViewInit(): void {
    this.initLineChart();
    this.initDoughnutChart();
  }

  initLineChart() {
    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(109, 179, 63, 0.2)');
    gradient.addColorStop(1, 'rgba(109, 179, 63, 0)');

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
        datasets: [{
          label: 'Lợi Nhuận',
          data: [2500, 3200, 2800, 4100, 5000, 7500, 8420],
          borderColor: '#306c00', // primary color
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
            backgroundColor: '#181c1e', // on-surface
            titleColor: 'rgba(255,255,255,0.7)',
            bodyColor: '#ffffff',
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => `$${context.raw}`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94a3b8', // slate-400
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
            max: 10000
          }
        }
      }
    });
  }

  initDoughnutChart() {
    const ctx = this.doughnutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Trực tuyến', 'Trực tiếp/POS'],
        datasets: [{
          data: [72, 28],
          backgroundColor: [
            '#6db33f', // primary-container
            '#ff8928'  // secondary-container
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
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }
}
