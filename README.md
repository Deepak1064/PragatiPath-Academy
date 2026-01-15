# 🎓 PragatiPath Academy - Attendance Management System

A modern, secure, and efficient attendance tracking system built with React, Firebase, and QR code technology. Designed specifically for educational institutions to streamline teacher attendance management with network-based security.

![License](https://img.shields.io/badge/license-Private-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.6.0-FFCA28?logo=firebase)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.17-38B2AC?logo=tailwind-css)

---

## ✨ Features

### 🔐 Role-Based Access Control
- **Admin Portal**: Complete system management and oversight
- **Teacher Portal**: Quick and easy attendance marking
- **Secure Authentication**: Email/password with password reset functionality

### 📱 QR Code Attendance
- **Daily QR Generation**: Admins generate unique QR codes for each day
- **Mobile Scanning**: Teachers scan QR codes using their mobile devices
- **Real-time Verification**: Instant attendance confirmation

### 🌐 Network Security
- **IP Whitelisting**: Restrict attendance marking to school network only
- **Network Validation**: Automatic IP verification before attendance submission

### 📊 Attendance Tracking
- **Daily Reports**: View today's attendance at a glance
- **Monthly Statistics**: Track attendance patterns over time
- **Personal History**: Teachers can view their own attendance records
- **Real-time Updates**: Instant synchronization across all devices

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Support**: Admin console with dark theme
- **Smooth Animations**: Polished transitions and micro-interactions
- **Intuitive Navigation**: Easy-to-use interface for all users

---

## 🏗️ Architecture

### Modular Structure
The application follows a clean, maintainable architecture with clear separation of concerns:

```
src/
├── App.jsx                    # Main application entry (54 lines)
├── config/
│   └── firebase.js           # Firebase configuration
├── utils/
│   └── constants.js          # Application constants
├── hooks/
│   ├── useAuth.js           # Authentication logic
│   ├── useIPAddress.js      # IP address management
│   └── useNetworkConfig.js  # Network configuration
├── components/
│   ├── shared/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── LoadingSpinner.jsx
│   ├── auth/                # Authentication components
│   │   └── LoginScreen.jsx
│   ├── admin/               # Admin portal components
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminQRGenerator.jsx
│   │   ├── AdminNetworkConfig.jsx
│   │   ├── AdminDailyReport.jsx
│   │   ├── AdminMonthlyReport.jsx
│   │   └── TabButton.jsx
│   └── teacher/             # Teacher portal components
│       ├── TeacherDashboard.jsx
│       ├── AttendanceMarker.jsx
│       ├── AttendanceHistory.jsx
│       ├── NetworkStatusBanner.jsx
│       ├── NavButton.jsx
│       └── Settings.jsx
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Firebase Account** with Firestore database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Deepak1064/PragatiPath-Academy.git
   cd school-attendance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Update `src/config/firebase.js` with your Firebase credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Update constants**
   
   Modify `src/utils/constants.js` to set your school name and admin email:
   ```javascript
   export const SCHOOL_NAME = "Your School Name";
   export const ADMIN_EMAIL = 'admin@yourschool.edu';
   ```

5. **Set up Firestore Database**
   
   Create the following Firestore structure:
   ```
   artifacts/
     └── school-attendance-v2/
         └── public/
             └── data/
                 ├── daily_codes/     # QR codes
                 ├── attendance/      # Attendance records
                 └── settings/
                     └── network_config  # IP configuration
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will run at `https://localhost:5173`

> **Note**: The app uses HTTPS for camera access (required for QR scanning). A self-signed certificate is automatically generated.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📖 Usage Guide

### Admin Workflow

1. **Login** with admin credentials (`draj12345raj@gmail.com`)
2. **Generate Daily QR Code** from the QR Code tab
3. **Configure Network** by setting the school's IP address
4. **Monitor Attendance** via Daily Log and Reports tabs
5. **Project QR Code** on a screen for teachers to scan

### Teacher Workflow

1. **Login** with teacher credentials
2. **Check Network Status** - ensure connected to school WiFi
3. **Scan QR Code** displayed on admin screen
4. **View Confirmation** - attendance marked successfully
5. **Check History** - review past attendance records

### Testing

Teachers can use the **Settings** tab to reset today's attendance and test the QR scanning feature again.

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - UI framework
- **Vite 7.2.4** - Build tool and dev server
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Backend & Database
- **Firebase 12.6.0** - Authentication and Firestore database
- **Firebase Firestore** - Real-time NoSQL database

### QR Code Technology
- **qrcode.react** - QR code generation
- **html5-qrcode** - QR code scanning with camera

### Additional Tools
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing

---

## 🔒 Security Features

- ✅ Firebase Authentication with email/password
- ✅ IP address whitelisting for attendance
- ✅ Network validation before submission
- ✅ Secure HTTPS-only operation
- ✅ Role-based access control (Admin vs Teacher)
- ✅ Daily rotating QR codes

---

## 📱 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

> **Camera Access**: Requires HTTPS connection. Works on localhost for development.

---

## 🤝 Contributing

This is a private educational project. For contributions or suggestions, please contact the repository owner.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Author

**Deepak Raj**
- GitHub: [@Deepak1064](https://github.com/Deepak1064)
- Project: [PragatiPath Academy](https://github.com/Deepak1064/PragatiPath-Academy)

---

## 🆘 Support

For issues or questions:
1. Check the [Walkthrough Documentation](file:///C:/Users/DEEPAK%20QUINKAS/.gemini/antigravity/brain/45e0979a-ace6-4ba2-ae72-75f0800dc90f/walkthrough.md)
2. Review the modular code structure for debugging
3. Contact the system administrator

---

## 📝 Changelog

### Version 2.0.0 (Latest)
- ✨ Complete modular refactoring (1042 lines → 24 files)
- 🎨 Improved code organization and maintainability
- 🔧 Custom hooks for reusable logic
- 📦 Separated admin and teacher components
- 🚀 Better developer experience

### Version 1.0.0
- 🎉 Initial release with QR-based attendance
- 🔐 Firebase authentication
- 🌐 Network security features
- 📊 Attendance reporting

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Vite for blazing-fast development experience
- TailwindCSS for beautiful, responsive UI
- React community for excellent documentation

---

<p align="center">Made with ❤️ for PragatiPath Academy</p>