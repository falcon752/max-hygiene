import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Admin from '../models/Admin';
import Service from '../models/Service';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/max-hygiene');
  console.log('Connected to MongoDB');

  // Create admin
  await Admin.deleteMany({});
  await Admin.create({
    username: 'admin',
    email: process.env.ADMIN_EMAIL || 'atikuquadrisegun@gmail.com',
    password: 'Admin@123',
  });
  console.log('Admin created — username: admin, password: Admin@123');

  // Seed default rooms and extras (shared across services)
  const defaultRooms = [
    { id: 'bathroom', name: 'Bathroom', price: 36, icon: 'fas fa-bath', forms: [] },
    { id: 'bedroom', name: 'Bedroom', price: 24, icon: 'fas fa-bed', forms: [] },
    { id: 'livingroom', name: 'Living Room', price: 36, icon: 'fas fa-couch', forms: [] },
    { id: 'kitchen', name: 'Kitchen', price: 30, icon: 'fas fa-utensils', forms: [] },
    { id: 'conservatory', name: 'Conservatory', price: 24, icon: 'fas fa-sun', forms: [] },
    { id: 'hallway', name: 'Hallway', price: 15, icon: 'fas fa-door-open', forms: [] },
    { id: 'hood', name: 'Extractor Hood', price: 12, icon: 'fas fa-wind', forms: [] },
    { id: 'oven', name: 'Oven Cleaning', price: 36, icon: 'fas fa-fire', forms: [] },
    { id: 'windows', name: 'Internal Windows', price: 3, icon: 'fas fa-th', forms: [] },
    { id: 'cabinets', name: 'Cupboard Interior', price: 4, icon: 'fas fa-archive', forms: [] },
    { id: 'fridge', name: 'Inside Fridge', price: 12, icon: 'fas fa-snowflake', forms: [] },
  ];

  const defaultExtras = [
    { id: 'products', name: 'Cleaning Products', price: 5, icon: 'fas fa-flask' },
    { id: 'pet', name: 'Home with Pets', price: 6, icon: 'fas fa-paw' },
    { id: 'vacuum', name: 'Vacuum Provided', price: 5, icon: 'fas fa-broom' },
    { id: 'bedchange', name: 'Bed Making', price: 6, icon: 'fas fa-bed' },
    { id: 'ironing', name: 'Ironing (per hr)', price: 22, icon: 'fas fa-tshirt' },
  ];

  await Service.deleteMany({});
  await Service.insertMany([
    {
      name: 'Residential Standard Clean',
      description: 'Regular domestic cleaning for your home',
      icon: 'fas fa-home',
      pricingType: 'flat',
      hourlyRate: 20.5,
      flatRateMode: 'rooms',
      rooms: defaultRooms,
      extras: defaultExtras,
    },
    {
      name: 'Residential Deep Clean',
      description: 'Thorough deep clean for every corner of your home',
      icon: 'fas fa-house-chimney',
      pricingType: 'flat',
      hourlyRate: 25,
      flatRateMode: 'rooms',
      rooms: defaultRooms,
      extras: defaultExtras,
    },
    {
      name: 'Commercial Cleaning',
      description: 'Professional cleaning for offices and commercial spaces',
      icon: 'fas fa-building',
      pricingType: 'hourly',
      hourlyRate: 25,
      flatRateMode: 'rooms',
      rooms: [],
      extras: defaultExtras,
    },
    {
      name: 'Short-let / Airbnb',
      description: 'Quick turnaround cleaning between guest stays',
      icon: 'fas fa-key',
      pricingType: 'flat',
      hourlyRate: 20,
      flatRateMode: 'rooms',
      rooms: defaultRooms,
      extras: defaultExtras,
    },
    {
      name: 'End of Tenancy Cleaning',
      description: 'Comprehensive cleaning to ensure full deposit return',
      icon: 'fas fa-box',
      pricingType: 'flat',
      hourlyRate: 25,
      flatRateMode: 'rooms',
      rooms: defaultRooms,
      extras: defaultExtras,
    },
  ]);
  console.log('Services seeded');

  await mongoose.disconnect();
  console.log('Done — database seeded successfully');
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
