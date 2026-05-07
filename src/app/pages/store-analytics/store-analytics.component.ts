import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import { UserService } from '../../services/user.service';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { ProfitChartComponent } from './components/profit-chart/profit-chart.component';
import { SalesChannelChartComponent } from './components/sales-channel-chart/sales-channel-chart.component';
import { TopProductsTableComponent } from './components/top-products-table/top-products-table.component';
import { 
  KpiData, 
  MetricData, 
  ProfitChartData, 
  SalesChannelData, 
  TopProduct,
  TrafficSource 
} from './models/analytics.models';

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
    TopProductsTableComponent
  ],
  templateUrl: './store-analytics.component.html',
  styleUrl: './store-analytics.component.css'
})
export class StoreAnalyticsComponent {
  private userService = inject(UserService);
  
  // User signal
  user = this.userService.currentUser;

  // KPI Data signals
  kpiData = signal<KpiData[]>([
    {
      icon: 'payments',
      iconFilled: true,
      label: 'Tổng Lợi Nhuận',
      value: '$42,850.00',
      trend: {
        value: '+12.4%',
        direction: 'up',
        color: '#15803d',
        bgColor: '#f0fdf4'
      },
      iconBgColor: '#f0fdf4',
      iconColor: '#65a30d'
    },
    {
      icon: 'ads_click',
      iconFilled: true,
      label: 'Tỷ Lệ Chuyển Đổi',
      value: '4.85%',
      trend: {
        value: '+3.2%',
        direction: 'up',
        color: '#2563eb',
        bgColor: '#eff6ff'
      },
      iconBgColor: '#eff6ff',
      iconColor: '#2563eb'
    },
    {
      icon: 'check_circle',
      iconFilled: true,
      label: 'Tỷ Lệ Thành Công',
      value: '98.2%',
      trend: {
        value: '0.0%',
        direction: 'neutral',
        color: '#ea580c',
        bgColor: '#fff7ed'
      },
      iconBgColor: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      icon: 'groups',
      iconFilled: true,
      label: 'Khách Hàng Hoạt Động',
      value: '2,481',
      trend: {
        value: '-1.5%',
        direction: 'down',
        color: '#dc2626',
        bgColor: '#fef2f2'
      },
      iconBgColor: '#f1f5f9',
      iconColor: '#64748b'
    }
  ]);

  // Metrics data signals
  avgOrderValue = signal<MetricData>({
    label: 'Giá Trị Đơn Trung Bình',
    value: '$34.50',
    progress: 65,
    progressColor: '#6db33f',
    target: 'Mục tiêu: $40.00'
  });

  returnRate = signal<MetricData>({
    label: 'Tỷ Lệ Trả Hàng',
    value: '1.2%',
    progress: 12,
    progressColor: '#dc2626',
    target: 'Dưới trung bình (Tốt)',
    isWarning: true
  });

  // Chart data signals
  profitChartData = signal<ProfitChartData>({
    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
    data: [2500, 3200, 2800, 4100, 5000, 7500, 8420]
  });

  salesChannelData = signal<SalesChannelData>({
    online: 72,
    offline: 28,
    onlineRevenue: '$30,852',
    offlineRevenue: '$11,998'
  });

  // Traffic sources signal
  trafficSources = signal<TrafficSource[]>([
    { name: 'Mạng xã hội', percentage: 45 },
    { name: 'Trực tiếp', percentage: 30 },
    { name: 'Tìm kiếm', percentage: 25 }
  ]);

  // Top products signal
  topProducts = signal<TopProduct[]>([
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
  ]);

  // Event handlers
  handleExportData(): void {
    console.log('Exporting data...');
    // TODO: Implement export functionality
  }
}
