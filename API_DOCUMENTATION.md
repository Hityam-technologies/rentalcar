# Car Rental API Documentation

This document provides a comprehensive list of all API endpoints available in the system, categorized by module and their respective access levels.

## Base URL
All API endpoints (except the HTML viewer) are prefixed with `/api`.

---

## 1. Authentication Module (`/api/auth`)
Handles user registration, login, and OTP verification.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register a new user (requires verification). |
| `POST` | `/verify-registration` | Public | Verify registration using OTP. |
| `POST` | `/login` | Public | Login with email and password. |
| `POST` | `/send-login-otp` | Public | Send an OTP for login. |
| `POST` | `/login-with-otp` | Public | Login using email and OTP. |

---

## 2. User Module (`/api/users`)
Management of user profiles.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | User | Get current logged-in user profile. |
| `PATCH` | `/me` | User | Update current user profile. |

---

## 3. Admin Module (`/api/admin`)
Administrative operations and analytics.

### User Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Admin | Get list of all registered users. |

### Analytics Dashboard
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/revenue` | Admin | Get total revenue, revenue per car, and per user. |
| `GET` | `/analytics/bookings` | Admin | Get booking trends, status distribution, and popular cars. |
| `GET` | `/analytics/users` | Admin | Get user growth, total users, and active customer counts. |

---

## 4. Car Module (`/api/cars`)
Browsing and managing car listings.

### Public Endpoints (`/api/cars`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Get all available cars (supports filtering). |
| `GET` | `/nearby` | Public | Get cars near a specific location (lat/lng). |
| `GET` | `/:carId` | Public | Get detailed information about a specific car. |

### Admin Endpoints (`/api/admin/cars`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Admin | Create a new car listing. |
| `PATCH` | `/:carId` | Admin | Update existing car details. |
| `DELETE` | `/:carId` | Admin | Remove a car listing. |

---

## 5. Booking Module (`/api/bookings`)
Managing car rentals.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | User | Create a new car booking. |
| `GET` | `/me` | User | Get bookings for the current user. |
| `POST` | `/:bookingId/cancel` | User/Admin | Cancel an existing booking. |
| `GET` | `/` | Admin | Get all bookings in the system. |

---

## 6. Payment Module (`/api/payments`)
Handling transactions.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | User | Initiate a payment for a booking. |
| `POST` | `/:paymentId/verify` | User | Verify a payment (e.g., after Razorpay callback). |
| `GET` | `/me` | User | Get payment history for the current user. |

---

## 7. Review Module (`/api/reviews`)
User feedback for cars.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | User | Submit a review for a car. |
| `GET` | `/car/:carId` | Public | Get all reviews for a specific car. |

---

## 8. 360° Viewer Module
Features for interactive car viewing.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/cars/:carId/viewer360/upload` | Admin | Upload a 360° video for a car. |
| `GET` | `/api/viewer360/:carId` | Public | Get JSON data (frame list) for the 360 viewer. |
| `GET` | `/viewer360/:carId` | Public | **HTML Page**: Render the interactive 360 viewer. |

---

## 9. AI Assistant (`/api/ai`)
Role-based AI support for users and admins.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Registered | **Users**: Get car recommendations and booking help.<br>**Admins**: Get business insights and performance analysis. |

---
- **Public**: Accessible by anyone, no authentication required.
- **User**: Requires a valid JWT token (Authentication).
- **Admin**: Requires a valid JWT token and 'admin' role privileges.
