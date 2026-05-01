import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Category {
  id: number;
  name: string;
  icon: string;
  iconFill: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  deliveryAddress = signal('123 Nguyễn Văn Linh, Quận 7, TP.HCM');

  categories = signal<Category[]>([
    { id: 1, name: 'Món Chính', icon: 'restaurant', iconFill: true },
    { id: 2, name: 'Đồ Uống', icon: 'local_cafe', iconFill: false },
    { id: 3, name: 'Tráng Miệng', icon: 'cake', iconFill: false },
    { id: 4, name: 'Ăn Vặt', icon: 'tapas', iconFill: false },
    { id: 5, name: 'Đồ Chay', icon: 'eco', iconFill: false },
  ]);

  activeCategoryId = signal(1);

  recommendedProducts = signal<Product[]>([
    {
      id: 1,
      name: 'Phở Bò Truyền Thống',
      description: 'Nước dùng thanh ngọt hầm từ xương bò 12 tiếng, bánh phở tươi, thịt bò Kobe thượng hạng.',
      price: 85000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpwmXHdHbTG5javU8Zt951XRCayJqtsMFr3vpN8m4hxlMqTJu-b2_yQ54imr-xhqjMVmtayhS2sivu8bKfCMCCQXvqNUQD5UhLKNoL5lY5ygrt_3UPGAUxDP6uuPrXhSpe90ZSrTekz5PJTGzSZJiaIMK3G6zPTQ3p8EX2YewasnqMYdpl1dc0LilMlg3DNDRxvnX_EF9S3annZ4QQAnEOEB2ad3dLm5Bn-pXNJo39bazKwwAEMIlt44soAufJ5N_9paqyXsEjkNGl',
      imageAlt: 'Phở Bò Truyền Thống'
    },
    {
      id: 2,
      name: 'Trà Sữa Thái Đỏ',
      description: 'Trà Thái đậm vị, sữa tươi thanh trùng, trân châu hoàng kim dai giòn sần sật.',
      price: 45000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9571ghY8GCtH374NpjNO1Mx1LQvKQbUubyIupEvYsD-Aa8CosE0vEUdv3VB7wuc2kptrJ5QI6LwmJeqDjDwyylp_GjfMHz1dWtDupwM3tXpmyrTSdOlzmurahjjim9rK0D5m9ZQrxY_VdMs43Y-xSnmUZeuZVo_F5BcN5MQQw_nHCB2zQNA3UgRvbLc9z6u3vw1oq3x6FJWr0xsBrOVb5AWONJRn8Udv6X_dhiey8UYpAxsLn-c9V-vroO40zsiJBOvmJZJBxOjHS',
      imageAlt: 'Trà Sữa Thái'
    },
    {
      id: 3,
      name: 'Salad Cá Hồi Hữu Cơ',
      description: 'Cá hồi Na-uy áp chảo, rau mầm hữu cơ, quả bơ sáp và sốt mè rang đặc biệt.',
      price: 120000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALqoV9ZC0ThCTeSd2VVyU7A0oJbWqbz0aHyaFF2lRH7zzUnFBjQpz7rHSTn2B44vLdPKbblXPoXf2u3mH048KRWNwvJ72kj9S4JiIMqBbhEWTHcRhxU-whFBrYiXO8wdvJBm4WcaCDpsQV0tD6mmVYOW0mOuqmYXH-Xq4Ed6_e7b1MdnmCYgTSYM0lzzBP-DhjmhEWxDh6jObXl6S9nvvRJwRAwMSK4qQqOInYm6bAe-u4yrvc7R6g4CewqRuYUrYJSMFquSAcvFyS',
      imageAlt: 'Salad Cá Hồi'
    },
    {
      id: 4,
      name: 'Pizza Hải Sản Pesto',
      description: 'Đế bánh mỏng giòn, hải sản tươi sống Cà Mau, phô mai Mozzarella và sốt Pesto.',
      price: 185000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIT7FF7U3OMAcSV40bs5ckDQ0lcqT0kTBWFrJILeTwMYbtU-rijSIFuGpTuYgy1WfjElbdzh2zaX5SL6eUyeSns3DsqBPR1hpZnWJZLUdK38pDxTu1BU2nL5Gsw7r4mWOTl-udR7Sb0wWSArzjlmUG16V5Q_UFtEg5GJo3tyU4AZyZyfYtMU5wPzmFoye6xmoQ6eDWMZx421JHH-MbrYPblvnjvfN_U2x7vlTNeNr7yNgHbA7G09tINyTHAwCe0Fi6i79alBxbqxC5',
      imageAlt: 'Pizza Hải Sản'
    },
    {
      id: 5,
      name: 'Gà Rán Giòn Rụm',
      description: 'Lớp vỏ siêu giòn, thịt gà thảo mộc mềm mọng bên trong, kèm sốt chấm phô mai cay.',
      price: 75000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkT3yZFKFBm9HmEbbSkPEQjYCIg9KoBc3FpT-H3h-Ya-plB8n6t-jdw6QFKsWxKoDoMfjYfN6VUUvbk7-7kgDymcEdUuM8VmE8PAkvs2cirSFPastF6KpnBhMP_nwR2BJtVLegyOdj1Amw0IOZ_mYW1kLs8OlKY6mJsGodF0n3Fs93XuCiGEXVJarbUqX8VVl4kj3TuXrnlvqFAg9-tqYmB11N_QJYjD1e-ODICC4lAVNe8O7_Nh_s4ICYdw_xyUq_xrnfGr3Y4ewa',
      imageAlt: 'Gà Rán Giòn'
    },
    {
      id: 6,
      name: 'Cà Phê Latte Nóng',
      description: 'Hạt Arabica rang vừa, sữa tươi đánh bọt mịn màng, hương vị béo ngậy tinh tế.',
      price: 55000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChWWP5u3FuXyTxMAH2023FaJ1vcKolNdxMxN0Mt8bkIDlg1RTFcO8QfYDirxRNlwQtX2TtzDdX6sAvimt6upDn2wez6cqhT0YY17vcJSo-pN_9X2ePPljP5tgzyfPEueLPBUlILU3s3dzR-K1Ld78bP8Yfu88wrtDHyVvMcW9p9ZhbZC4anPO7VvoGMp9DoSANBvBrL0dIDKErnSZbWDcHA4_jV_JaDJxT3Duh9clXCSuFtlM_ui4LYBf8G5KxBJDLyJ07IHybAwWu',
      imageAlt: 'Cà Phê Latte'
    }
  ]);

  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
  }
}