import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingRoom {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface IBookingExtra {
  id: string;
  name: string;
  price: number;
}

export interface IBooking extends Document {
  ref: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    city: string;
    postcode: string;
  };
  service: {
    id: string;
    name: string;
  };
  propertyType: string;
  pricingType: 'flat' | 'hourly';
  rooms: IBookingRoom[];
  extras: IBookingExtra[];
  hours: number;
  hourlyDescription: string;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly';
  date: Date;
  timeSlot: string;
  notes: string;
  basePrice: number;
  discount: number;
  extrasTotal: number;
  totalPrice: number;
  createdAt: Date;
}

const BookingRoomSchema = new Schema<IBookingRoom>(
  { id: String, name: String, qty: Number, price: Number },
  { _id: false }
);

const BookingExtraSchema = new Schema<IBookingExtra>(
  { id: String, name: String, price: Number },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    ref: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
      postcode: { type: String, required: true },
    },
    service: {
      id: String,
      name: String,
    },
    propertyType: { type: String, default: '' },
    pricingType: { type: String, enum: ['flat', 'hourly'], default: 'flat' },
    rooms: [BookingRoomSchema],
    extras: [BookingExtraSchema],
    hours: { type: Number, default: 0 },
    hourlyDescription: { type: String, default: '' },
    frequency: {
      type: String,
      enum: ['once', 'weekly', 'biweekly', 'monthly'],
      default: 'once',
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    notes: { type: String, default: '' },
    basePrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    extrasTotal: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
