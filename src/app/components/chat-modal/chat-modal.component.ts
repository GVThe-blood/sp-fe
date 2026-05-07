import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-modal.component.html',
  styleUrl: './chat-modal.component.css'
})
export class ChatModalComponent {
  isOpen = true;

  closeModal() {
    this.isOpen = false;
  }
}
