# Store Analytics Dashboard - Angular 19 Refactoring

## Overview
Dashboard phân tích dữ liệu cho shop owner đã được tái cấu trúc từ HTML thuần sang các Angular 19 components hiện đại với signals và standalone architecture.

## Architecture

### Component Structure
```
store-analytics/
├── components/
│   ├── kpi-card/                    # KPI metric cards
│   ├── metric-card/                 # Secondary metric cards
│   ├── profit-chart/                # Line chart for profit timeline
│   ├── sales-channel-chart/         # Doughnut chart for sales channels
│   └── top-products-table/          # Top selling products table
├── models/
│   └── analytics.models.ts          # TypeScript interfaces
├── store-analytics.component.ts     # Main container component
├── store-analytics.component.html
└── store-analytics.component.css
```

## Angular 19 Patterns Used

### ✅ Signals for Reactive State
```typescript
// Writable signals
kpiData = signal<KpiData[]>([...]);
topProducts = signal<TopProduct[]>([...]);

// Computed signals (if needed)
totalRevenue = computed(() => 
  this.topProducts().reduce((sum, p) => sum + parseFloat(p.revenue), 0)
);
```

### ✅ Signal Inputs/Outputs
```typescript
// Input signals
data = input.required<KpiData>();

// Output signals
exportData = output<void>();
```

### ✅ Signal Queries (ViewChild)
```typescript
// Signal-based ViewChild
private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
```

### ✅ Control Flow Blocks
```typescript
// @for with track
@for (kpi of kpiData(); track $index) {
  <app-kpi-card [data]="kpi" />
}

// @if conditions
@if (data().trend.direction === 'up') {
  <span class="material-symbols-outlined">trending_up</span>
}
```

### ✅ inject() for Dependency Injection
```typescript
private userService = inject(UserService);
private destroyRef = inject(DestroyRef);
```

### ✅ OnPush Change Detection
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### ✅ Effects for Side Effects
```typescript
constructor() {
  // Effect to initialize/update chart when data changes
  effect(() => {
    const chartData = this.data();
    const canvas = this.canvasRef();
    
    if (canvas && chartData) {
      this.initChart(canvas.nativeElement, chartData);
    }
  });
}
```

### ✅ DestroyRef for Cleanup
```typescript
constructor() {
  this.destroyRef.onDestroy(() => {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  });
}
```

## Components

### 1. KpiCardComponent
**Purpose:** Display key performance indicators with trend indicators

**Inputs:**
- `data: KpiData` - KPI data including icon, label, value, and trend

**Features:**
- Dynamic icon with fill variation
- Trend indicator with direction (up/down/neutral)
- Color-coded backgrounds

### 2. MetricCardComponent
**Purpose:** Display secondary metrics with progress bars

**Inputs:**
- `data: MetricData` - Metric data including label, value, progress, and target

**Features:**
- Progress bar visualization
- Optional warning state
- Target display

### 3. ProfitChartComponent
**Purpose:** Display profit timeline as line chart

**Inputs:**
- `data: ProfitChartData` - Chart labels and data points

**Features:**
- Chart.js line chart with gradient fill
- Time range selector (today/week/month/year)
- Responsive design
- Auto-cleanup on destroy

**State:**
- `selectedRange: signal<TimeRange>` - Currently selected time range

### 4. SalesChannelChartComponent
**Purpose:** Display sales channel distribution as doughnut chart

**Inputs:**
- `data: SalesChannelData` - Online/offline percentages and revenues

**Features:**
- Chart.js doughnut chart
- Center text overlay
- Revenue breakdown legend
- Auto-cleanup on destroy

### 5. TopProductsTableComponent
**Purpose:** Display top selling products in a table

**Inputs:**
- `products: TopProduct[]` - Array of top products

**Outputs:**
- `exportData: void` - Emitted when export button is clicked

**Features:**
- Product images and details
- Inventory warnings
- Performance indicators
- Progress bars

## Data Models

### KpiData
```typescript
interface KpiData {
  icon: string;
  iconFilled?: boolean;
  label: string;
  value: string;
  trend: TrendData;
  iconBgColor: string;
  iconColor: string;
}
```

### MetricData
```typescript
interface MetricData {
  label: string;
  value: string;
  progress: number;
  progressColor: string;
  target?: string;
  isWarning?: boolean;
}
```

### ProfitChartData
```typescript
interface ProfitChartData {
  labels: string[];
  data: number[];
}
```

### SalesChannelData
```typescript
interface SalesChannelData {
  online: number;
  offline: number;
  onlineRevenue: string;
  offlineRevenue: string;
}
```

### TopProduct
```typescript
interface TopProduct {
  name: string;
  sku: string;
  image: string;
  inventory: string;
  sales: number;
  revenue: string;
  performanceClass: string;
  performanceLabel: string;
  performanceProgress: number;
  performanceProgressClass: string;
  inventoryWarning: boolean;
}
```

## Benefits of Refactoring

### 🎯 Maintainability
- **Separation of Concerns:** Mỗi component có trách nhiệm rõ ràng
- **Reusability:** Components có thể tái sử dụng ở các trang khác
- **Testability:** Dễ dàng test từng component riêng lẻ

### ⚡ Performance
- **OnPush Change Detection:** Chỉ re-render khi signals thay đổi
- **Fine-grained Reactivity:** Signals cập nhật chính xác những gì cần thiết
- **Lazy Loading Ready:** Components có thể lazy load dễ dàng

### 🔧 Developer Experience
- **Type Safety:** TypeScript interfaces cho tất cả data models
- **Modern Patterns:** Sử dụng Angular 19 best practices
- **Clean Code:** Dễ đọc, dễ hiểu, dễ maintain

### 🚀 Scalability
- **Easy to Extend:** Thêm KPI/metric mới chỉ cần thêm data vào signal
- **API Integration Ready:** Dễ dàng thay mock data bằng API calls
- **State Management Ready:** Có thể integrate với NgRx/Signals Store

## Next Steps (API Integration)

### 1. Create Analytics Service
```typescript
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  
  getKpiData() {
    return this.http.get<KpiData[]>('/api/analytics/kpi');
  }
  
  getProfitData(range: TimeRange) {
    return this.http.get<ProfitChartData>(`/api/analytics/profit?range=${range}`);
  }
  
  getTopProducts() {
    return this.http.get<TopProduct[]>('/api/analytics/top-products');
  }
}
```

### 2. Use Resource API for Data Fetching
```typescript
export class StoreAnalyticsComponent {
  private analyticsService = inject(AnalyticsService);
  
  // Replace signals with resources
  kpiResource = resource({
    request: () => ({}),
    loader: () => this.analyticsService.getKpiData()
  });
  
  // Access data with kpiResource.value()
  // Check loading with kpiResource.isLoading()
  // Handle errors with kpiResource.error()
}
```

### 3. Add Loading States
```typescript
@if (kpiResource.isLoading()) {
  <div class="loading-skeleton">Loading...</div>
}

@if (kpiResource.error(); as error) {
  <div class="error">{{ error.message }}</div>
}

@if (kpiResource.value(); as kpiData) {
  @for (kpi of kpiData; track $index) {
    <app-kpi-card [data]="kpi" />
  }
}
```

## Migration Notes

### Before (Legacy)
- ❌ ViewChild decorators
- ❌ AfterViewInit lifecycle
- ❌ Hardcoded HTML
- ❌ No component separation
- ❌ Manual chart initialization

### After (Angular 19)
- ✅ Signal queries (viewChild)
- ✅ Effects + DestroyRef
- ✅ Reusable components
- ✅ Clear separation of concerns
- ✅ Reactive chart updates

## Testing

### Unit Testing Example
```typescript
describe('KpiCardComponent', () => {
  it('should display KPI data', () => {
    const fixture = TestBed.createComponent(KpiCardComponent);
    const component = fixture.componentInstance;
    
    fixture.componentRef.setInput('data', {
      icon: 'payments',
      label: 'Revenue',
      value: '$1000',
      trend: { value: '+10%', direction: 'up', color: '#000', bgColor: '#fff' },
      iconBgColor: '#f0f0f0',
      iconColor: '#000'
    });
    
    fixture.detectChanges();
    
    expect(fixture.nativeElement.textContent).toContain('Revenue');
    expect(fixture.nativeElement.textContent).toContain('$1000');
  });
});
```

## Dependencies

- **Angular 19:** Core framework
- **Chart.js:** Chart visualization library
- **Tailwind CSS:** Styling framework
- **Material Symbols:** Icon font

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Metrics

- **Initial Bundle Size:** ~3.14 MB (development)
- **Change Detection:** OnPush (optimal)
- **Rendering:** Fine-grained with signals

## Contributing

Khi thêm features mới:
1. Tạo component mới trong `components/`
2. Define interfaces trong `models/analytics.models.ts`
3. Sử dụng signals cho state management
4. Sử dụng OnPush change detection
5. Document trong README này
