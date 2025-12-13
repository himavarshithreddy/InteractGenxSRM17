# Admin Dashboard - E-commerce Platform

A comprehensive admin dashboard for managing e-commerce operations across multiple domains including operations, marketing, inventory, and logistics.

## Tech Stack

- **Frontend**: Next.js 14, React, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Styling**: CSS with modern design system

## Features

### Multi-Domain Management
- **Operations**: Orders and customer management
- **Marketing**: Campaigns and promotions
- **Inventory**: Products and stock movements
- **Logistics**: Shipments and warehouses
- **Analytics**: Dashboard overview and insights
- **Users**: User management with personas, preferences, and activity history

### User Management
- Static user switching (no authentication)
- Role-based domain access
- User preferences (theme, language, notifications, etc.)
- Activity history tracking
- User personas with detailed profiles

### Low Stock Alerts
- Real-time low stock detection
- Visual alerts on inventory page
- Category-based stock statistics
- Filter to show only low stock items

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies for all packages:
```bash
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend server on `http://localhost:3000`

### Database Setup

The database is automatically initialized and seeded when the server starts. If you need to reset the database:

1. Delete the `server/database.sqlite` file
2. Restart the server

The database will be recreated with fresh seed data including:
- 15 orders and customers
- 15 products (5 with low stock to trigger alerts)
- 12 marketing campaigns and promotions
- 12 shipments and 10 warehouses
- 12 users with preferences and activity history

## API Endpoints

### Operations
- `GET /api/operations/orders` - Get all orders
- `GET /api/operations/orders/stats` - Get order statistics
- `GET /api/operations/customers` - Get all customers

### Marketing
- `GET /api/marketing/campaigns` - Get all campaigns
- `GET /api/marketing/promotions` - Get all promotions

### Inventory
- `GET /api/inventory/products` - Get all products
- `GET /api/inventory/products?low_stock=true` - Get low stock products
- `GET /api/inventory/products/stats` - Get product statistics
- `GET /api/inventory/stock-movements` - Get stock movements

### Logistics
- `GET /api/logistics/shipments` - Get all shipments
- `GET /api/logistics/shipments/stats` - Get shipment statistics
- `GET /api/logistics/warehouses` - Get all warehouses

### Analytics
- `GET /api/analytics/overview` - Get dashboard overview
- `GET /api/analytics/revenue-trends` - Get revenue trends
- `GET /api/analytics/top-products` - Get top products

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/user-preferences/:userId` - Get user preferences
- `PUT /api/user-preferences/:userId` - Update user preferences
- `GET /api/user-activity/:userId` - Get user activity history
- `GET /api/user-activity/:userId/stats` - Get activity statistics

## Project Structure

```
.
├── client/                 # Next.js frontend
│   ├── app/               # Next.js app directory
│   │   ├── page.js        # Dashboard overview
│   │   ├── operations/    # Operations pages
│   │   ├── marketing/     # Marketing pages
│   │   ├── inventory/    # Inventory pages
│   │   ├── logistics/     # Logistics pages
│   │   └── users/        # User management pages
│   ├── components/        # React components
│   └── lib/              # API client and utilities
├── server/               # Express backend
│   ├── routes/           # API routes
│   ├── database.js       # Database setup and seeding
│   └── server.js         # Express server
└── package.json          # Root package.json
```

## Low Stock Alerts

The system automatically detects products with stock quantities below their low stock threshold. Products with low stock are:

- Displayed with red badges in the inventory table
- Shown in category statistics
- Highlighted in a prominent alert banner
- Filterable using the "Show Low Stock Only" checkbox

## User Management

### Roles and Domains

Users are assigned roles that map to domain access:
- **Domain-specific roles**: `operations`, `marketing`, `inventory`, `logistics` → access to their respective domain
- **All-access roles**: `admin`, `manager`, `viewer`, `support`, `analyst`, `coordinator`, `supervisor` → access to all domains

### User Personas

Each user has:
- **Preferences**: Theme, language, timezone, notifications, dashboard layout, etc.
- **Activity History**: Tracked actions, views, edits, and system interactions
- **Sessions**: Login history and session management

## Development

### Adding New Features

1. Backend: Add routes in `server/routes/`
2. Frontend: Add pages in `client/app/`
3. Database: Update schema in `server/database.js`

### Database Schema

The database includes tables for:
- Orders, Customers
- Campaigns, Promotions
- Products, Stock Movements
- Shipments, Warehouses
- Users, User Preferences, User Activity History
- Daily Stats

## Troubleshooting

### Users Not Showing

If users are not appearing:
1. Delete `server/database.sqlite`
2. Restart the server
3. The database will be recreated with seed data

### Low Stock Not Showing

Low stock alerts appear when:
- Product `stock_quantity <= low_stock_threshold`
- Check the inventory page with the "Show Low Stock Only" filter

## License

MIT
