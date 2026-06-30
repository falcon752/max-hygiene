# Max-Hygiene Admin Dashboard — Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (running locally on port 27017, or a MongoDB Atlas URI)

## Quick Start

### 1. Install all dependencies
```bash
cd dashboard
npm run install:all
```

### 2. Configure backend environment
The `.env` file is already pre-filled with your SMTP credentials.
Edit `backend/.env` if needed (MongoDB URI, JWT secret, etc).

### 3. Seed the database (creates admin user + default services)
```bash
npm run seed
```
Default admin credentials: **username: admin / password: Admin@123**

### 4. Start both servers
```bash
npm run dev
```
- **Admin Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000

---

## Individual Start Commands

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

---

## Key API Endpoints

| Route | Auth | Description |
|---|---|---|
| POST /api/auth/login | Public | Admin login |
| GET /api/services | Public | List active services (used by booking form) |
| POST /api/bookings | Public | Submit a booking |
| POST /api/bookings/lead | Public | Save lead from step 0 |
| GET /api/availability | Public | Get available dates/slots |
| GET /api/bookings | Admin | List all bookings |
| GET /api/customers | Admin | List all customers |
| GET /api/services/all | Admin | List all services (inc. inactive) |
| GET /api/availability/all | Admin | All availability entries |

---

## Dashboard Features

- **Overview** — Stats, monthly revenue, recent bookings
- **Bookings** — Full CRUD, status management, detail view
- **Services** — Add/edit/delete services, rooms/tasks, extras, pricing
- **Customers** — Customer contact management
- **Schedule** — Calendar-based availability management per date/time

---

## Booking Form Integration

The main `booking.html` now calls the Express API at `http://localhost:4000/api`:
- Services loaded dynamically from the database
- Availability calendar reflects admin-configured dates
- Bookings saved to MongoDB + emails sent via Nodemailer
- Customers auto-created/updated on each booking

To use in production, update `API_BASE` in `booking.html` to your server URL.
