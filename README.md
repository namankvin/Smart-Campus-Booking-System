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
- In-app notification center with unread tracking and mark-as-read actions
- Real-time user-scoped notification delivery over Socket.IO
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
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=12h
   EMAIL_USER=your_email_for_notifications
   EMAIL_PASS=your_email_password
   INSTITUTIONAL_EMAIL_DOMAIN=yourcollege.edu
   FOOD_SLOT_CAPACITY=50
   CAMPUS_LOCATIONS=Library,Main Gate,Hostel,Academic Block
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- Access the application at `http://localhost:3000`
- Quick Dev Login (best for presentations)
  - Choose role from dropdown
  - Click `Quick Dev Login` or `Sign in (Development)`
  - Uses dev account `avi.verma2006@gmail.com` and sets the selected role
- Google OAuth Login
  - Click `Sign in with Google` (requires `REACT_APP_GOOGLE_CLIENT_ID`)
  - For Student role, Google email must end with `@student.nitw.ac.in`
  - For Faculty/Vendor/Cab Operator/Admin, any Gmail address is accepted
- Navigate based on current role (Student, Faculty, Vendor, Cab Operator, Admin)

## Authentication Notes

- The backend verifies Google ID tokens using `google-auth-library`.
- Client-side decoded profile data is no longer trusted for login.
- Authentication attempts (success/failure/logout) are logged for auditing.

## API Documentation

See the routes in `server/routes/` for API endpoints.

Notification APIs are available under `server/routes/notification.js`.

## Testing

Run tests with:
```bash
npm test
```

Additional test commands:
```bash
npm run test:server
npm run test:client
npm run test:all
```

## Implementation Status (Completed)

- Phase 1-4 core flows implemented:
   - classroom booking (pending/approval/rejection/waitlist/recurring)
   - food ordering (menu availability, slot capacity, status transitions)
   - booking cancellation rules (classroom/food/cab)
   - cab booking assignment with release on cancellation
- Role-based dashboards for Student/Faculty, Vendor, Cab Operator, and Admin
- Admin features:
   - pending classroom approval/rejection
   - reports endpoint and dashboard summary
   - user role management UI and API
- Secure auth improvements:
   - backend Google ID token verification via `google-auth-library`
   - institutional domain restriction support
   - auth activity logging
- Notification system:
   - persistent notifications model + API
   - in-app notification center with unread tracking
   - real-time user-scoped Socket.IO delivery
- Automated test infrastructure:
   - backend integration tests (booking/admin/notifications)
   - frontend tests for key auth/routing/notification components

## Remaining Work

- No blocking implementation items remain from the previous backlog.
- Current status:
   - frontend tests no longer emit React `act(...)` warnings
   - backend auth integration tests now cover mocked Google token verification paths
   - UI tests now cover booking forms and key role dashboards
   - development role selector is hidden in production login flow
   - new user sign-in role is enforced as `Student`; role changes remain admin-only
   - seed/reset scripts are available for classrooms, menus, cabs, and sample users
   - CI workflow runs `npm run test:all` and `npm run build` on push and pull requests

Developer scripts added:

```bash
npm run seed
npm run reset:db
npm run reset:db:seed
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