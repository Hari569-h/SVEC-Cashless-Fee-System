// Test script to check and create blockchain collections in Firebase
const firebase = require('firebase');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkTBWZvm3gAH1njiSHYEPrZUJmF_DBT4c",
    authDomain: "cashless-fee-payment.firebaseapp.com",
    projectId: "cashless-fee-payment",
    storageBucket: "cashless-fee-payment.appspot.com",
    messagingSenderId: "528515335884",
    appId: "1:528515335884:web:3002a89c90844e960b2469"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Function to create test data
async function createTestData() {
    console.log("Checking if blockchain collections exist...");
    
    try {
        // Check if collections exist by getting a single document
        const verificationSnapshot = await db.collection('blockchain_verifications')
            .limit(1)
            .get();
        
        const failureSnapshot = await db.collection('blockchain_verification_failures')
            .limit(1)
            .get();
        
        console.log(`blockchain_verifications exists: ${!verificationSnapshot.empty || 'No, creating it now'}`);
        console.log(`blockchain_verification_failures exists: ${!failureSnapshot.empty || 'No, creating it now'}`);
        
        // Create test verification data if collection is empty
        if (verificationSnapshot.empty) {
            // Create sample verification
            await db.collection('blockchain_verifications').doc('test-transaction-1').set({
                transactionId: 'test-transaction-1',
                studentId: 'S12345',
                studentName: 'Test Student',
                paymentAmount: 1000,
                paymentMethod: 'Cash',
                receiptNumber: 'TEST-123456',
                blockchainReference: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                blockNumber: 12345678,
                network: 'polygon',
                verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                verifiedBy: 'test@example.com',
                isSimulated: true
            });
            
            console.log("Created test verification record");
        }
        
        // Create test failure data if collection is empty
        if (failureSnapshot.empty) {
            await db.collection('blockchain_verification_failures').doc('test-failure-1').set({
                transactionId: 'failed-transaction-1',
                studentId: 'S54321',
                error: 'Test error message',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                attemptedBy: 'test@example.com'
            });
            
            console.log("Created test failure record");
        }
        
        console.log("Test complete. Check your Firebase console.");
        
    } catch (error) {
        console.error("Error creating test data:", error);
    }
}

// Run the test
createTestData().then(() => {
    // Exit after 5 seconds to allow Firebase operations to complete
    setTimeout(() => process.exit(0), 5000);
}); 