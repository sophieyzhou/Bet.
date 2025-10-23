# Bet Mobile App

A React Native mobile app with Node.js/Express backend featuring Google OAuth authentication and MongoDB integration.

## Project Structure

```
bet/
├── client/                 # React Native app
│   ├── package.json
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   └── HomeScreen.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── context/
│   │       └── AuthContext.js
├── server/                 # Node.js/Express backend
│   ├── package.json
│   ├── index.js
│   ├── routes/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── middleware/
│   │   └── auth.js
│   └── .env.example
└── README.md
```

## Features

- **Google OAuth Integration**: Secure authentication using Google accounts
- **JWT Token Management**: Secure token storage using Expo SecureStore
- **MongoDB Integration**: User data persistence
- **React Navigation**: Smooth navigation between screens
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Clean, modern UI design

## Setup Instructions

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual values:
   - `MONGODB_URI`: Your MongoDB connection string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `JWT_SECRET`: A secure JWT secret key
   - `SESSION_SECRET`: A secure session secret key

4. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in `.env`

5. **Set up Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

6. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

### Health Check
- `GET /api/health` - Server health status

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js for OAuth
- JWT for token management
- CORS for cross-origin requests

### Frontend
- React Native
- Expo
- React Navigation
- Expo SecureStore
- Expo WebBrowser
- Axios for HTTP requests

## Development

### Running in Development Mode

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the React Native app:
   ```bash
   cd client
   npm start
   ```

### Testing

The app includes comprehensive error handling and user feedback. Test the authentication flow by:

1. Opening the app
2. Tapping "Continue with Google"
3. Completing the OAuth flow
4. Verifying user information is displayed
5. Testing logout functionality

## Security Considerations

- JWT tokens are stored securely using Expo SecureStore
- Session management with secure cookies
- CORS configuration for mobile app origins
- Environment variables for sensitive configuration
- Password hashing with bcrypt (for future password-based auth)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Ensure MongoDB is running and the connection string is correct
2. **Google OAuth Error**: Verify client ID and secret are correct, and redirect URI is properly configured
3. **CORS Issues**: Check that the client origin is included in the CORS configuration
4. **Token Verification Failed**: Ensure JWT secret is consistent between token creation and verification

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=* npm run dev
```

## License

This project is licensed under the MIT License.
