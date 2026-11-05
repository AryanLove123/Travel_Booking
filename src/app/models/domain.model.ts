export type UserRole = 'customer' | 'admin';
export type IsoDate = string;
export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating';
export type PropertyType = 'hotel' | 'guesthouse' | 'house' | 'apartment';
export const PROPERTY_TYPES: PropertyType[] = ['hotel', 'guesthouse', 'house', 'apartment'];
export type PaymentStatus = 'created' | 'processing' | 'succeeded' | 'failed' | 'cancelled';


export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  provider: 'google' | 'demo';
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  tagline: string;
  description: string;
  imageUrl: string;
  published: boolean;
}

export interface Hotel {
  id: string;
  destinationId: string;
  name: string;
  propertyType: PropertyType;
  address: string;
  description: string;
  rating: number;
  reviewCount: number;
  imageUrls: string[];
  published: boolean;
}

export interface Room {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  beds: number;
  bathrooms: number;
  totalUnits: number;
  amenities: string[];
  imageUrls: string[];
  freeCancellation: boolean;
  published: boolean;
}

export interface CatalogData {
  destinations: Destination[];
  hotels: Hotel[];
  rooms: Room[];
}

export interface SearchCriteria {
  destinationId: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  rooms: number;
}

export interface SearchFilters {
  propertyTypes: PropertyType[];
  maxPricePerNight: number | null;
  minRating: number;
  amenities: string[];
  sort: SortKey;
}

export const DEFAULT_FILTERS: SearchFilters = {
  propertyTypes: [],
  maxPricePerNight: null,
  minRating: 0,
  amenities: [],
  sort: 'relevance',
};

export interface SearchResult {
  room: Room;
  hotel: Hotel;
  destination: Destination;
  availableUnits: number;
  nights: number;
  estimatedSubtotal: number;
  relevance: number;
}

export interface SavedSearch {
  readonly id: string;
  readonly userId: string;
  readonly label: string;
  readonly criteria: SearchCriteria;
  readonly createdAt: string;
}

export interface PriceBreakdown {
  readonly currency: 'USD';
  readonly nightlyRate: number;
  readonly nights: number;
  readonly rooms: number;
  readonly subtotal: number;
  readonly discount: number;
  readonly serviceFee: number;
  readonly total: number;
}

export interface PaymentReference {
  readonly paymentId: string;
  readonly provider: 'local-mock';
  readonly status: PaymentStatus;
  readonly updatedAt: string;
}

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'payment_failed'
  | 'payment_cancelled'
  | 'cancelled';

export interface GuestDetails {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly specialRequests: string;
}

export interface BookingSnapshot {
  readonly destinationName: string;
  readonly hotelName: string;
  readonly roomName: string;
  readonly address: string;
  readonly imageUrl: string;
  readonly maxGuests: number;
  readonly beds: number;
  readonly bathrooms: number;
  readonly freeCancellation: boolean;
}

export interface Booking {
  readonly id: string;
  readonly confirmationCode: string;
  readonly userId: string;
  readonly destinationId: string;
  readonly hotelId: string;
  readonly roomId: string;
  readonly snapshot: BookingSnapshot;
  readonly checkIn: IsoDate;
  readonly checkOut: IsoDate;
  readonly guests: number;
  readonly rooms: number;
  readonly price: PriceBreakdown;
  readonly guest: GuestDetails;
  readonly status: BookingStatus;
  readonly payment: PaymentReference | null;
  readonly holdExpiresAt: number | null;
  readonly cancelReason: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}