import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { TopProduct } from '../../models/analytics.models';

@Component({
  selector: 'app-top-products-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: './top-products-table.component.html',
  styleUrl: './top-products-table.component.css'
})
export class TopProductsTableComponent {
  // Signal inputs
  products = input.required<TopProduct[]>();
  
  // Signal outputs
  exportData = output<void>();
  
  onExport(): void {
    this.exportData.emit();
  }
}
