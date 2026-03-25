# Smart Campus Booking System

A comprehensive web application for booking campus resources including classrooms, food orders, and electric cabs.

## Features

- Google OAuth authentication with role-based access control
- Classroom booking with admin approval, waitlist, and faculty recurring scheduling
- Food ordering from campus vendors
- Electric cab booking with assignment and cancellation rules
- Vendor menu management and order status updates
- Admin dashboard for approvals, reports, and user role management
- Dedicated dashboards for Student/Faculty, Vendor, Cab Operator, and Admin
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Google OAuth 2.0

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   npm run install-client
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email_for_notifications
   EMAIL_PASS=your_email_password
   INSTITUTIONAL_EMAIL_DOMAIN=yourcollege.edu
   FOOD_SLOT_CAPACITY=50
   CAMPUS_LOCATIONS=Library,Main Gate,Hostel,Academic Block
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Access the application at `http://localhost:3000`
- Login with institutional Google account
- Navigate based on your role (Student, Faculty, Vendor, Admin)

## API Documentation

See the routes in `server/routes/` for API endpoints.

## Testing

Run tests with:
```bash
npm test
```

## Deployment

Build for production:
```bash
npm run build
```

Deploy to your preferred hosting service (e.g., Heroku, Vercel).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

This project is for academic purposes.