# Cashless Fee System with Blockchain Integration

A modern, secure, and efficient cashless fee management system for educational institutions, integrated with blockchain for transaction verification and security.

## Features

- **Firebase Authentication**: Secure login for staff members
- **Student Management**: Add, search, and manage student records
- **Payment Processing**: Multiple payment methods including Razorpay and cash
- **Receipts Generation**: Automatic PDF receipts for all payments
- **Management Dashboard**: Track payments and view statistics
- **Blockchain Integration**: Store transaction records on blockchain using Bitquery for added security and verification

## Blockchain Integration

This system uses Bitquery to store transaction records on the blockchain, providing:

- **Immutable Record Keeping**: All payment transactions are stored on blockchain for permanent, tamper-proof record keeping
- **Transaction Verification**: Ability to verify any transaction against the blockchain
- **Enhanced Security**: Additional layer of security and transparency for fee payments
- **Non-Intrusive Implementation**: Blockchain storage works alongside existing Firebase storage without disrupting core functionality

### Setup Blockchain Integration

1. Create a Bitquery account at [bitquery.io](https://bitquery.io/)
2. Get your API key from Bitquery dashboard
3. Update the API key in `bitquery.js`:
   ```js
   const BITQUERY_API_KEY = 'YOUR_BITQUERY_API_KEY';
   ```
4. Update the smart contract address in `bitquery.js` if you have your own contract:
   ```js
   smartContractAddress: {is: "0xYourContractAddressHere"}
   ```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

## Technologies Used

- Firebase (Authentication, Firestore)
- Razorpay Payment Gateway
- jsPDF for PDF generation
- Bitquery for Blockchain Integration
- Webpack/Parcel for bundling