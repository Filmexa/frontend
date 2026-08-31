import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-toast',
  imports: [NgClass],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent {
  constructor(protected toastService: ToastService) { }
}
