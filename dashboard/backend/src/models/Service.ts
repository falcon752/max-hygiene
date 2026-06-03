import mongoose, { Document, Schema } from 'mongoose';

export interface IFormQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'checkbox';
  options: string[];
  required: boolean;
}

export interface IRoom {
  id: string;
  name: string;
  price: number;
  icon: string;
  forms: IFormQuestion[];
}

export interface IExtra {
  id: string;
  name: string;
  price: number;
  icon: string;
}

export interface IService extends Document {
  name: string;
  description: string;
  icon: string;
  pricingType: 'flat' | 'hourly';
  hourlyRate: number;
  flatRateMode: 'quote' | 'rooms';
  rooms: IRoom[];
  extras: IExtra[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FormQuestionSchema = new Schema<IFormQuestion>(
  {
    id: String,
    question: String,
    type: { type: String, enum: ['text', 'select', 'checkbox'] },
    options: [String],
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoomSchema = new Schema<IRoom>(
  {
    id: String,
    name: String,
    price: { type: Number, default: 0 },
    icon: { type: String, default: 'fas fa-home' },
    forms: [FormQuestionSchema],
  },
  { _id: false }
);

const ExtraSchema = new Schema<IExtra>(
  {
    id: String,
    name: String,
    price: { type: Number, default: 0 },
    icon: { type: String, default: 'fas fa-plus' },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-broom' },
    pricingType: { type: String, enum: ['flat', 'hourly'], default: 'flat' },
    hourlyRate: { type: Number, default: 0 },
    flatRateMode: { type: String, enum: ['quote', 'rooms'], default: 'rooms' },
    rooms: [RoomSchema],
    extras: [ExtraSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IService>('Service', ServiceSchema);
