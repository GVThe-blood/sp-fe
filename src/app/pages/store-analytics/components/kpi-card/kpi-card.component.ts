import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { KpiData } from '../../models/analytics.models';

@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css'
})
export class KpiCardComponent {
  // Signal inputs
  data = input.required<KpiData>();
}
