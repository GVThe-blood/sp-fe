import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { StoreDetailComponent } from './pages/store-detail/store-detail.component';
import { OrderComponent } from './pages/order/order.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyStoreComponent } from './pages/my-store/my-store.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'store/:id', component: StoreDetailComponent },
    { path: 'order', component: OrderComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'my-store', component: MyStoreComponent }
];
