# PragatiPath Academy - Attendance App Testing Guide

## Prerequisites
- Two devices (or browser windows/tabs)
- App running at `https://school-b1f8e.web.app` or locally at `https://localhost:5173`

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | draj12345raj@gmail.com | 123456 |
| Teacher | technodeepak6486@gmail.com | 1234567 |

---

## Test Scenarios

### 1. Admin: Generate QR Code
1. Login as **Admin**
2. Go to **QR Code** tab
3. Click **"Generate New Code"**
4. ✅ Verify: QR code appears with a 6-character code

### 2. Admin: Configure School WiFi
1. Login as **Admin**
2. Go to **Network** tab
3. Your current IP is shown
4. Click **"Set as Allowed School IP"**
5. ✅ Verify: IP is saved and shown as "Currently Whitelisted"

### 3. Teacher: Mark Attendance (On School WiFi)
1. Login as **Teacher** (on same network as admin)
2. Go to **Attend** tab
3. ✅ Verify: Green banner shows "Connected to School WiFi"
4. Click **"Scan QR Code"**
5. Point camera at admin's QR code
6. ✅ Verify: "Attendance Marked!" success message

### 4. Teacher: Block When NOT on School WiFi
1. Login as **Teacher** on a **different network** (e.g., mobile data)
2. Go to **Attend** tab
3. ✅ Verify: Red banner shows "Not on School WiFi"
4. ✅ Verify: Button says "Connect to School WiFi First" and is disabled
5. ✅ Verify: Cannot mark attendance

### 5. Admin: View Daily Attendance
1. Login as **Admin**
2. Go to **Daily Log** tab
3. ✅ Verify: See list of teachers who marked attendance today

### 6. Admin: View Monthly Reports
1. Login as **Admin**
2. Go to **Reports** tab
3. ✅ Verify: See monthly attendance summary per teacher

### 7. Teacher: View Attendance History
1. Login as **Teacher**
2. Go to **History** tab
3. ✅ Verify: See past attendance records grouped by month

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Camera not working | Must use HTTPS (not HTTP) |
| "Waiting for QR Code" | Admin needs to generate today's code |
| "Not on School WiFi" | Connect to school network first |
| QR not scanning | Hold steady, good lighting, 6-12 inches away |

---

## Local Development Testing

```bash
# Start dev server
npm run dev -- --host

# Access locally
https://localhost:5173

# Access from phone (same network)
https://192.168.x.x:5173
```

## Deploy to Production

```bash
npm run build
firebase deploy
```

Live URL: https://school-b1f8e.web.app
