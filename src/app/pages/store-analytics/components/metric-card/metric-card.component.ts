import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MetricData } from '../../models/analytics.models';

@Component({
  selector: 'app-metric-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.css'
})
export class MetricCardComponent {
  // Signal inputs
  data = input.required<MetricData>();
}
