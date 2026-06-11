export interface FormQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'checkbox';
  options: string[];
  required: boolean;
}

export interface Room {
  id: string;
  name: string;
  price: number;
  icon: string;
  forms: FormQuestion[];
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  icon: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  icon: string;
  pricingType: 'flat' | 'hourly';
  hourlyRate: number;
  flatRateMode: 'quote' | 'rooms';
  quoteDescription: string;
  rooms: Room[];
  extras: Extra[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BookingRoom {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface BookingExtra {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  _id: string;
  ref: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  customer: BookingCustomer;
  address: { line1: string; city: string; postcode: string };
  service: { id: string; name: string };
  propertyType: string;
  pricingType: 'flat' | 'hourly';
  rooms: BookingRoom[];
  extras: BookingExtra[];
  hours: number;
  hourlyDescription: string;
  frequency: string;
  date: string;
  timeSlot: string;
  notes: string;
  basePrice: number;
  discount: number;
  extrasTotal: number;
  totalPrice: number;
  createdAt: string;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: { line1: string; city: string; postcode: string };
  bookingCount: number;
  totalSpent: number;
  notes: string;
  createdAt: string;
}

export interface Availability {
  _id: string;
  date: string;
  available: boolean;
  slots: string[];
}

export interface Stats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  pending: number;
  totalRevenue: number;
  monthlyRevenue: number;
}
