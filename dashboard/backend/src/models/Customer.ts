import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    city: string;
    postcode: string;
  };
  bookingCount: number;
  totalSpent: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      postcode: { type: String, default: '' },
    },
    bookingCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
