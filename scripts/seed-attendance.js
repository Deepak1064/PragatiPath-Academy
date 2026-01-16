// Paste this in browser console while logged in as the teacher whose attendance you want to seed
// Make sure you're on the school-b1f8e.web.app site and logged in

(async function seedDummyAttendance() {
    // Get Firebase from the app
    const firebase = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

    // You'll need to get these from your app - or just use the Firestore console directly
    console.log(`
    ====================================
    EASY METHOD - Use Firebase Console:
    ====================================
    
    1. Go to: https://console.firebase.google.com/project/school-b1f8e/firestore
    2. Click on "attendance" collection
    3. Click "+ Add document"
    4. Add these fields for each record:
    
       - dateString: "2025-12-15" (or any date in YYYY-MM-DD format)
       - timestamp: (click timestamp type, pick date/time)
       - type: "arrival" or "leaving"
       - userId: "<paste the teacher's UID from 'teacher_profiles' collection>"
       - userName: "Teacher Name"
       - method: "qr_verified"
       - ipAddress: "192.168.1.1"
       - networkVerified: true
       - qrCodeUsed: "TEST"
    
    Repeat for each day you want to add.
    
    ====================================
    `);
})();
