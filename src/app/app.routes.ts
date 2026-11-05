import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth/auth.guards';
import { AdminShell } from './features/admin/admin-shell/admin-shell';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search-page/search-page').then((m) => m.SearchPage),
  },
  {
    path: 'rooms/:roomId',
    loadComponent: () => import('./features/rooms/room-details-page/room-details-page').then((m) => m.RoomDetailsPage),
  },
  {
    path: 'checkout/:roomId',
    loadComponent: () => import('./features/checkout/checkout-page/checkout-page').then((m) => m.CheckoutPage),
    canActivate: [authGuard],
  },
  {
    path: 'pay/:bookingId',
    loadComponent: () => import('./features/checkout/mock-gateway-page/mock-gateway-page').then((m) => m.MockGatewayPage),
    canActivate: [authGuard],
  },
  {
    path: 'booking/:bookingId/result',
    loadComponent: () => import('./features/checkout/payment-result-page/payment-result-page').then((m) => m.PaymentResultPage),
    canActivate: [authGuard],
  },
  {
    path: 'bookings',
    loadComponent: () => import('./features/bookings/booking-page/booking-page').then((m) => m.BookingPage),
    canActivate: [authGuard],
  },
  {
    path: 'bookings/:bookingId',
    loadComponent: () => import('./features/bookings/booking-detail-page/booking-detail-page').then((m) => m.BookingDetailPage),
    canActivate: [authGuard],
  },
  {
    path: 'saved-searches',
    loadComponent: () => import('./features/saved-searches/saved-searches-page/saved-searches-page').then((m) => m.SavedSearchesPage),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard-page/dashboard-page.ts').then((m) => m.DashboardPage),
      },
      {
        path: 'destinations',
        loadComponent: () => import('./features/admin/admin-destinations/destination-page/destination-admin-page').then((m)=> m.DestinationAdminPage),
      },
      {
        path: 'destinations/new',
        loadComponent: () => import('./features/admin/admin-destinations/destination-from/destination-form-page').then((m) => m.DestinationFormPage),
      },
      {
        path: 'destinations/:id',
        loadComponent: () => import('./features/admin/admin-destinations/destination-from/destination-form-page').then((m) => m.DestinationFormPage),
      },
      {
        path: 'hotels',
        loadComponent: () => import('./features/admin/admin-hotels/hotel-page/hotel-admin-page').then((m) => m.HotelAdminPage),
      },
      {
        path: 'hotels/new',
        loadComponent: () => import('./features/admin/admin-hotels/hotel-form/hotel-form-page').then((m) => m.HotelFormPage),
      },
      {
        path: 'hotels/:id',
        loadComponent: () => import('./features/admin/admin-hotels/hotel-form/hotel-form-page').then((m) => m.HotelFormPage),
      },
      {
        path: 'rooms',
        loadComponent: () => import('./features/admin/admin-rooms/room-page/room-admin-page').then((m) => m.RoomAdminPage),
      },
      {
        path: 'rooms/new',
        loadComponent: () => import('./features/admin/admin-rooms/room-form/room-form-page').then((m) => m.RoomFormPage),
      },
      {
        path: 'rooms/:id',
        loadComponent: () => import('./features/admin/admin-rooms/room-form/room-form-page').then((m) => m.RoomFormPage),
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found-page').then((m) =>m.NotFoundPage),
  }
];
