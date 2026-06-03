import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  date: string; // YYYY-MM-DD
  available: boolean;
  slots: string[]; // ['08:00', '09:00', ...]
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    date: { type: String, required: true, unique: true },
    available: { type: Boolean, default: true },
    slots: {
      type: [String],
      default: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAvailability>('Availability', AvailabilitySchema);
