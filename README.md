# Copenhagen AirTaxi Form Manager

A web-based application for creating, managing, and submitting structured forms for aircraft maintenance operations. This application allows for hierarchical form creation with a user-friendly interface.

## Features

- Role-based authentication (Employee, Manager, Admin)
- Hierarchical form structure (sections, subsections, sub-subsections)
- Support for multiple field types
- PDF generation
- Form drafts and submissions
- Company settings management

## Technology Stack

- Frontend: React.js with Material-UI
- Backend: Firebase (Authentication, Firestore, Storage)
- PDF Generation: jsPDF with AutoTable

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/your-username/copenhagen-air-taxi-form-manager.git
   cd copenhagen-air-taxi-form-manager
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure Firebase
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Set up Authentication, Firestore, and Storage
   - Update the Firebase configuration in `src/services/firebase/config.js`

4. Start the development server
   ```
   npm start
   ```

## Project Structure

The application follows a modular approach with smaller, focused files:

```
src/
├── components/
│   ├── admin/         # Admin interface components
│   ├── auth/          # Authentication components
│   ├── common/        # Shared UI components
│   └── user/          # User interface components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── services/          # Firebase and utility services
│   ├── auth/          # Authentication services
│   ├── firebase/      # Firebase configuration
│   ├── forms/         # Form data services
│   ├── pdf/           # PDF generation services
│   └── users/         # User management services
├── utils/             # Utility functions
├── theme.js           # Theme configuration
└── App.js             # Main application component
```

## License

This project is proprietary software owned by Copenhagen AirTaxi.