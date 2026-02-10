# JAMB Mastermind 300 - Orient Neo 7 Edition

Ultimate UTME Preparation Platform with AI Analytics and Premium Features.

## Features
- 8 Subjects with 2,000+ questions each
- Practice Mode & Mock Exams
- Premium Subscription System
- Payment Integration (Flutterwave/Paystack)
- PWA (Progressive Web App) Support
- Offline Functionality
- Mobile Responsive Design

## Installation

### Option 1: Static Hosting (Netlify/Vercel/GitHub Pages)
1. Upload all files to hosting service
2. No server setup required
3. Works with simulated payments

### Option 2: Full Hosting with PHP/MySQL
1. Upload files to web server
2. Create MySQL database
3. Import `database.sql`
4. Update `api/config.php` with credentials
5. Configure payment API keys

## Configuration

### Payment Setup
1. Get API keys from:
   - Flutterwave: https://dashboard.flutterwave.com
   - Paystack: https://dashboard.paystack.com
2. Update in `api/payment-handler.php`

### Database Setup
Run `database.sql` to create tables:
```sql
CREATE DATABASE jamb_mastermind;
USE jamb_mastermind;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    plan VARCHAR(20) DEFAULT 'free',
    subscription_date DATETIME,
    expiry_date DATETIME,
    questions_attempted INT DEFAULT 0,
    total_score FLOAT DEFAULT 0,
    session_time INT DEFAULT 0,
    mock_exams_taken INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) UNIQUE,
    user_id INT,
    plan VARCHAR(20),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'NGN',
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    status VARCHAR(20),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
