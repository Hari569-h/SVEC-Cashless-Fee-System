// OTP Verification Module for Staff Login using Firebase Phone Authentication
// This module handles phone number collection, OTP generation, and verification
// Version 2.0 - Fixed OTP verification flow for staff login

// Get Firebase Auth and Firestore instances from the global scope
// Don't redeclare auth and db to avoid conflicts

// For reCAPTCHA verification
let recaptchaVerifier;

// Configuration for OTP
const OTP_EXPIRY_SECONDS = 60; // Changed from minutes to seconds
const OTP_LENGTH = 6;

// DOM Elements for OTP UI
let otpVerificationContainer;
let phoneNumberForm;
let otpVerificationForm;
let phoneInput;
let otpInput;
let otpMessage;
let otpResendButton;
let otpTimer;
let otpCountdown;

// Current OTP state
let currentOTP = null;
let otpExpiry = null;
let verifiedUser = null;

// Cache for user data to improve performance
const userDataCache = {};

// Initialize OTP verification UI
function initOtpVerification() {
    // Create OTP verification UI if it doesn't exist
    createOtpVerificationUI();
    
    // Get form elements
    phoneNumberForm = document.getElementById('phone-number-form');
    phoneInput = document.getElementById('phone-number');
    otpVerificationForm = document.getElementById('otp-verification-form');
    otpInput = document.getElementById('otp-input');
    
    // Add event listeners
    if (phoneNumberForm) {
        phoneNumberForm.addEventListener('submit', handlePhoneNumberSubmit);
    }
    
    if (otpVerificationForm) {
        otpVerificationForm.addEventListener('submit', handleOtpVerification);
    }
    
    const resendButton = document.getElementById('otp-resend');
    if (resendButton) {
        resendButton.addEventListener('click', handleOtpResend);
    }
    
    // Add event listeners for Back buttons
    const phonePageBackButton = document.getElementById('phone-page-back');
    if (phonePageBackButton) {
        phonePageBackButton.addEventListener('click', handlePhonePageBack);
    }
    
    const displayPageBackButton = document.getElementById('display-page-back');
    if (displayPageBackButton) {
        displayPageBackButton.addEventListener('click', handleDisplayPageBack);
    }
    
    const otpPageBackButton = document.getElementById('otp-page-back');
    if (otpPageBackButton) {
        otpPageBackButton.addEventListener('click', handleOtpPageBack);
    }
    
    // Load the CSS file if not already loaded
    if (!document.getElementById('otp-verification-css')) {
        const link = document.createElement('link');
        link.id = 'otp-verification-css';
        link.rel = 'stylesheet';
        link.href = 'otp-verification.css';
        document.head.appendChild(link);
    }
}

// Create OTP verification UI dynamically
function createOtpVerificationUI() {
    // Check if container already exists
    if (document.getElementById('otp-verification-container')) {
        return;
    }
    
    const container = document.createElement('div');
    container.id = 'otp-verification-container';
    container.className = 'otp-verification-container hidden';
    
    container.innerHTML = `
        <!-- Phone Number Verification Page (for first-time users) -->
        <div id="phone-number-page" class="verification-page hidden">
            <div class="card-header">
                <h2 class="verification-title">Mobile Verification</h2>
                <p class="verification-subtitle">Please verify your mobile number</p>
            </div>
            
            <form id="phone-number-form">
                <div class="form-group">
                    <label for="phone-number">Mobile Number</label>
                    <input type="tel" id="phone-number" name="phone-number" 
                        placeholder="+91 9876543210" required
                        pattern="\\+[0-9]{1,4}\\s[0-9]{10}">
                </div>
                <div class="form-note">
                    <small>Format: +91 9876543210 (with country code)</small>
                    <p class="note">Once verified, this number cannot be changed.</p>
                </div>
                <button type="submit" class="verification-btn">
                    <span>Send OTP</span>
                    <i class="fas fa-paper-plane"></i>
                </button>
                <div id="phone-error" class="error-message"></div>
            </form>
            
            <!-- Back button added as requested -->
            <button id="phone-page-back" class="back-btn">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>
        
        <!-- Send OTP Page (for returning users with verified phone) -->
        <div id="phone-display-page" class="verification-page hidden">
            <div class="card-header">
                <h2 class="verification-title">Two-Factor Authentication</h2>
                <p class="verification-subtitle">Secure your account with OTP</p>
            </div>
            
            <div id="phone-display">
                <div class="form-group">
                    <label>Your Registered Mobile Number</label>
                    <div class="verified-phone">
                        <i class="fas fa-check-circle"></i>
                        <span id="display-phone-number"></span>
                    </div>
                    <div class="form-note">
                        <p class="note">We'll send a verification code to this number</p>
                    </div>
                </div>
                <button id="send-otp-button" class="verification-btn">
                    <span>Send OTP</span>
                    <i class="fas fa-paper-plane"></i>
                </button>
                <div id="display-phone-error" class="error-message"></div>
            </div>
            
            <!-- Back button added as requested -->
            <button id="display-page-back" class="back-btn">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>
        
        <!-- OTP Verification Page -->
        <div id="otp-page" class="verification-page hidden">
            <div class="card-header">
                <h2 class="verification-title">Enter OTP</h2>
                <p class="verification-subtitle">Check your phone for the verification code</p>
            </div>
            
            <form id="otp-verification-form">
                <div class="form-group">
                    <label for="otp-input">Enter 6-digit OTP</label>
                    <input type="text" id="otp-input" name="otp-input" 
                        placeholder="123456" required maxlength="6" pattern="[0-9]{6}"
                        inputmode="numeric" autocomplete="one-time-code">
                    <div class="otp-timer">
                        <i class="far fa-clock"></i>
                        <span id="otp-timer">Expires in <span id="otp-countdown">05:00</span></span>
                    </div>
                </div>
                <button type="submit" class="verification-btn">
                    <span>Verify OTP</span>
                    <i class="fas fa-check-circle"></i>
                </button>
                <button type="button" id="otp-resend" class="resend-btn">
                    <i class="fas fa-sync-alt"></i> Resend OTP
                </button>
                <div id="otp-message" class="error-message"></div>
            </form>
            
            <!-- Back button added as requested -->
            <button id="otp-page-back" class="back-btn">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        </div>
    `;
    
    // Find the login form container to insert the OTP container inside it
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        // Insert the OTP container inside the login card
        loginCard.appendChild(container);
    } else {
        // Fallback to body if login card not found
        document.body.appendChild(container);
    }
    
    // Back button functionality removed as requested
    // No longer need to return to login form from OTP verification
    
    // Add send OTP button functionality for returning users
    const sendOtpButton = document.getElementById('send-otp-button');
    if (sendOtpButton) {
        // Ensure button is visible
        sendOtpButton.style.display = 'flex';
        sendOtpButton.style.visibility = 'visible';
        sendOtpButton.style.opacity = '1';
        console.log('Adding event listener to send OTP button');
        sendOtpButton.addEventListener('click', async () => {
            console.log('Send OTP button clicked');
            const phoneNumberElement = document.getElementById('display-phone-number');
            
            if (!phoneNumberElement) {
                console.error('Phone number element not found');
                return;
            }
            
            const phoneNumber = phoneNumberElement.textContent;
            console.log('Retrieved phone number:', phoneNumber);
            
            if (phoneNumber) {
                try {
                    // Get the error message element
                    const phoneError = document.getElementById('display-phone-error');
                    
                    // Disable the button while sending OTP
                    sendOtpButton.disabled = true;
                    // Add sending animation to the button
                    sendOtpButton.innerHTML = '<span class="sending-animation">Sending OTP</span>';
                    
                    // Show sending animation in the message area
                    if (phoneError) {
                        phoneError.innerHTML = '<span class="sending-animation">Sending OTP...</span>';
                        phoneError.style.color = 'var(--primary)';
                        phoneError.classList.add('visible');
                    }
                    
                    // Generate and send OTP immediately
                    generateAndSendOTP(phoneNumber).then(otpSent => {
                        if (otpSent) {
                            // Hide phone display page and show OTP verification page
                            document.getElementById('phone-display-page').classList.add('hidden');
                            document.getElementById('otp-page').classList.remove('hidden');
                            
                            // Show success message
                            const otpMessage = document.getElementById('otp-message');
                            if (otpMessage) {
                                otpMessage.textContent = 'OTP sent successfully! Please check your phone.';
                                otpMessage.style.color = 'var(--success)';
                                otpMessage.classList.add('visible');
                            }
                            
                            // Clear any previous OTP input
                            const otpInput = document.getElementById('otp-input');
                            if (otpInput) {
                                otpInput.value = '';
                                otpInput.focus();
                            }
                            
                            // Start OTP timer
                            startOtpTimer();
                        } else {
                            // Re-enable button if OTP sending failed
                            sendOtpButton.disabled = false;
                            sendOtpButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
                            
                            // Show error message
                            if (phoneError) {
                                phoneError.textContent = 'Failed to send OTP. Please try again.';
                                phoneError.style.color = 'var(--danger)';
                                phoneError.classList.add('visible');
                            }
                        }
                    }).catch(error => {
                        console.error('Error sending OTP:', error);
                        // Re-enable button on error
                        sendOtpButton.disabled = false;
                        sendOtpButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
                        
                        // Show error message
                        if (phoneError) {
                            phoneError.textContent = `Error: ${error.message || 'Failed to send OTP'}`;
                            phoneError.style.color = 'var(--danger)';
                            phoneError.classList.add('visible');
                        }
                    });
                } catch (error) {
                    console.error('Error sending OTP:', error);
                    
                    // Re-enable button on error
                    sendOtpButton.disabled = false;
                    sendOtpButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
                    
                    // Show error message
                    const phoneError = document.getElementById('display-phone-error');
                    if (phoneError) {
                        phoneError.textContent = `Error: ${error.message || 'Failed to send OTP'}`;
                        phoneError.style.color = 'var(--danger)';
                        phoneError.classList.add('visible');
                    }
                }
            } else {
                console.error('Phone number is empty');
                
                // Show error message
                const phoneError = document.getElementById('display-phone-error');
                if (phoneError) {
                    phoneError.textContent = 'Phone number not found. Please try logging in again.';
                    phoneError.style.color = 'var(--danger)';
                    phoneError.classList.add('visible');
                }
            }
        });
    } else {
        console.error('Send OTP button not found');
    }
    
    // Add CSS for the readonly phone display
    const style = document.createElement('style');
    style.textContent = `
        .readonly-phone {
            padding: var(--space-sm) var(--space-md);
            border: 2px solid var(--gray-light);
            border-radius: var(--radius-lg);
            background-color: var(--gray-light);
            font-weight: bold;
            margin-bottom: var(--space-xs);
        }
        
        .note {
            font-size: 0.8rem;
            color: var(--gray);
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
}

// Show OTP verification container and hide login form
function showOtpVerification() {
    const otpContainer = document.getElementById('otp-verification-container');
    if (otpContainer) {
        otpContainer.classList.remove('hidden');
        
        // Ensure all verification pages are hidden initially
        const phoneNumberPage = document.getElementById('phone-number-page');
        const phoneDisplayPage = document.getElementById('phone-display-page');
        const otpPage = document.getElementById('otp-page');
        
        if (phoneNumberPage) phoneNumberPage.classList.add('hidden');
        if (phoneDisplayPage) phoneDisplayPage.classList.add('hidden');
        if (otpPage) otpPage.classList.add('hidden');
    }
    
    // Remove login elements completely
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    
    // Remove the login title
    const loginTitle = document.querySelector('.portal-title');
    if (loginTitle) {
        loginTitle.style.display = 'none';
    }
    
    // Remove any other login-related elements
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.style.display = 'none';
    }
}

// Hide OTP verification container
function hideOtpVerification() {
    otpVerificationContainer.classList.add('hidden');
    resetOtpForms();
}

// Show login form
function showLoginForm() {
    // Hide OTP verification container
    const otpContainer = document.getElementById('otp-verification-container');
    if (otpContainer) {
        otpContainer.classList.add('hidden');
    }
    
    // Show login form
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.classList.remove('hidden');
    }
    
    // Show login form elements
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    
    // Show the login title
    const loginTitle = document.querySelector('.portal-title');
    if (loginTitle) {
        loginTitle.style.display = 'block';
    }
    
    // Reset OTP state
    currentOTP = null;
    otpExpiry = null;
    clearOtpTimer();
}

// Reset OTP forms
function resetOtpForms() {
    phoneNumberForm.classList.remove('hidden');
    otpVerificationForm.classList.add('hidden');
    phoneInput.value = '';
    otpInput.value = '';
    otpMessage.textContent = '';
    clearOtpTimer();
}

// Format phone number as user types
function formatPhoneNumber() {
    let value = phoneInput.value.replace(/\D/g, '');
    
    // Ensure it starts with a plus sign
    if (value.length > 0 && !phoneInput.value.startsWith('+')) {
        value = '+' + value;
    }
    
    // Format with a space after country code
    if (value.length > 3) {
        const countryCode = value.substring(0, 3);
        const number = value.substring(3);
        value = countryCode + ' ' + number;
    }
    
    phoneInput.value = value;
}

// Handle phone number submission
async function handlePhoneNumberSubmit(e) {
    e.preventDefault();
    
    const phoneNumber = phoneInput.value.trim();
    const phoneError = document.getElementById('phone-error');
    
    // Validate phone number
    if (!phoneNumber) {
        phoneError.textContent = 'Please enter a valid phone number';
        phoneError.style.color = 'var(--danger)';
        phoneError.classList.add('visible');
        phoneNumberForm.classList.add('shake');
        setTimeout(() => phoneNumberForm.classList.remove('shake'), 500);
        return;
    }
    
    // Basic validation for phone number format
    if (!/^\+[0-9]{1,4}\s[0-9]{10}$/.test(phoneNumber)) {
        phoneError.textContent = 'Please enter a valid phone number in format: +91 9876543210';
        phoneError.style.color = 'var(--danger)';
        phoneError.classList.add('visible');
        phoneNumberForm.classList.add('shake');
        setTimeout(() => phoneNumberForm.classList.remove('shake'), 500);
        return;
    }
    
    try {
        // Disable the submit button to prevent multiple submissions
        const submitButton = phoneNumberForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Processing...</span><i class="fas fa-spinner fa-spin"></i>';
            submitButton.classList.add('btn-loading');
        }
        
        // Show loading state
        phoneError.textContent = 'Verifying and saving phone number...';
        phoneError.style.color = 'var(--primary)';
        phoneError.classList.add('visible');
        
        // Save phone number to user profile in Firestore
        const saved = await savePhoneNumber(verifiedUser.uid, phoneNumber);
        
        if (!saved) {
            // Re-enable the button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
                submitButton.classList.remove('btn-loading');
            }
            
            phoneError.textContent = 'Failed to save phone number. Please try again.';
            phoneError.style.color = 'var(--danger)';
            phoneError.classList.add('visible');
            return;
        }
        
        // Clear any previous error message
        phoneError.textContent = '';
        
        // Generate and send OTP
        const otpSent = await generateAndSendOTP(phoneNumber);
        
        if (otpSent) {
            // Hide phone number page and show ONLY the OTP verification page
            document.getElementById('phone-number-page').classList.add('hidden');
            document.getElementById('phone-display-page').classList.add('hidden');
            document.getElementById('otp-page').classList.remove('hidden');
            
            // Start OTP timer
            startOtpTimer();
            
            console.log('Phone number saved and OTP sent successfully');
        } else {
            // Re-enable the button on error
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
                submitButton.classList.remove('btn-loading');
            }
            
            phoneError.textContent = 'Failed to send OTP. Please try again.';
            phoneError.style.color = 'var(--danger)';
            phoneError.classList.add('visible');
        }
    } catch (error) {
        console.error('Error in phone verification process:', error);
        
        // Re-enable the button on error
        const submitButton = phoneNumberForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Send OTP</span><i class="fas fa-paper-plane"></i>';
            submitButton.classList.remove('btn-loading');
        }
        
        phoneError.textContent = `Error: ${error.message || 'Failed to process your request'}`;
        phoneError.style.color = 'var(--danger)';
        phoneError.classList.add('visible');
    }
}

// Save phone number to user profile in Firestore
async function savePhoneNumber(userId, phoneNumber) {
    try {
        // Get Firebase Firestore instance
        const db = firebase.firestore();
        
        // Update user document with phone number
        await db.collection('staff').doc(userId).update({
            phoneNumber: phoneNumber,
            phoneUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isFirstLogin: false
        });
        
        console.log('Phone number saved successfully:', phoneNumber);
        return true;
    } catch (error) {
        console.error('Error saving phone number:', error);
        return false;
    }
}

// Check if user has a phone number saved
async function checkPhoneNumber(userId) {
    try {
        // Check cache first for faster retrieval
        if (userDataCache[userId] && userDataCache[userId].phoneNumber) {
            console.log('Using cached phone number for', userId);
            return userDataCache[userId].phoneNumber;
        }
        
        // Get Firebase Firestore instance
        const db = firebase.firestore();
        
        const doc = await db.collection('staff').doc(userId).get();
        
        if (doc.exists && doc.data().phoneNumber) {
            // Save to cache
            if (!userDataCache[userId]) {
                userDataCache[userId] = {};
            }
            userDataCache[userId].phoneNumber = doc.data().phoneNumber;
            
            return doc.data().phoneNumber;
        }
        
        return null;
    } catch (error) {
        console.error('Error checking phone number:', error);
        return null;
    }
}

// Generate and send OTP (using reliable fallback method)
async function generateAndSendOTP(phoneNumber) {
    try {
        // Show loading state
        if (otpMessage) {
            otpMessage.textContent = 'Generating OTP...';
            otpMessage.style.color = 'var(--primary)';
            otpMessage.classList.add('visible');
        }
        
        console.log('Starting OTP generation for phone:', phoneNumber);
        
        // Format phone number if needed (strip any spaces or special characters)
        const formattedPhone = phoneNumber.replace(/\s+/g, '').trim();
        
        // Ensure it has a country code
        const finalPhone = !formattedPhone.startsWith('+') ? '+' + formattedPhone : formattedPhone;
        
        console.log('Formatted phone number for OTP:', finalPhone);
        
        // Clear previous OTP state
        currentOTP = null;
        otpExpiry = null;
        
        // Generate a random 6-digit OTP
        currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry time (60 seconds from now)
        otpExpiry = new Date();
        otpExpiry.setSeconds(otpExpiry.getSeconds() + OTP_EXPIRY_SECONDS);
        
        console.log(`Generated OTP for ${finalPhone}: ${currentOTP}`);
        
        // Save OTP to user profile in Firestore (non-blocking)
        if (verifiedUser) {
            // Get Firebase Firestore instance
            const db = firebase.firestore();
            
            console.log('Saving OTP to Firestore for user:', verifiedUser.uid);
            
            // Update the document with the new OTP (in a real app, you would hash this)
            // Using non-blocking promise to avoid waiting for Firestore
            db.collection('staff').doc(verifiedUser.uid).update({
                lastOtpSent: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('OTP timestamp saved to Firestore successfully');
            }).catch(firestoreError => {
                console.error('Error updating Firestore:', firestoreError);
                // Continue even if Firestore update fails
            });
        }
        
        // No delay needed for faster response
        
        // Show success message with animation
        if (otpMessage) {
            otpMessage.innerHTML = `<span class="success-animation">OTP sent to ${phoneNumber}. For demo purposes, the OTP is: ${currentOTP}</span>`;
            otpMessage.style.color = 'var(--primary)';
            otpMessage.classList.add('visible');
        }
        
        // Start OTP timer
        startOtpTimer();
        
        return true;
    } catch (error) {
        console.error('Error generating OTP:', error);
        if (otpMessage) {
            otpMessage.textContent = `Error: ${error.message || 'Failed to generate OTP'}`;
            otpMessage.style.color = 'var(--danger)';
            otpMessage.classList.add('visible');
        }
        return false;
    }
}

// Handle OTP verification
async function handleOtpVerification(e) {
    e.preventDefault();
            
    const otp = otpInput.value.trim();
    const otpMessage = document.getElementById('otp-message');
            
    // Validate OTP
    if (!otp || otp.length !== 6 || !/^[0-9]{6}$/.test(otp)) {
        otpMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter a valid 6-digit OTP';
        otpMessage.style.color = 'var(--danger)';
        otpMessage.classList.add('visible');
        otpVerificationForm.classList.add('shake');
        setTimeout(() => otpVerificationForm.classList.remove('shake'), 500);
        return;
    }

    try {
        // Show loading state
        otpMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying OTP...';
        otpMessage.style.color = 'var(--primary)';
        otpMessage.classList.add('visible');

        // Disable the verify button while processing
        const verifyButton = otpVerificationForm.querySelector('button[type="submit"]');
        if (verifyButton) {
            verifyButton.disabled = true;
            verifyButton.innerHTML = '<span>Verifying...</span><i class="fas fa-spinner fa-spin"></i>';
        }
                
        // Disable the resend button while verifying
        const resendButton = document.getElementById('otp-resend');
        if (resendButton) {
            resendButton.disabled = true;
        }

        // Verify OTP
        const isValid = await verifyOTP(otp);

        if (isValid) {
            // Mark phone as verified in Firestore
            await markPhoneAsVerified(verifiedUser.uid);

            // Show success message
            otpMessage.innerHTML = '<i class="fas fa-check-circle"></i> Phone verified successfully! Redirecting...';
            otpMessage.style.color = 'var(--success)';
            otpMessage.classList.add('visible');

            // Clear OTP timer
            clearOtpTimer();

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                redirectToDashboard();
            }, 2000);
        } else {
            // Re-enable buttons
            if (verifyButton) {
                verifyButton.disabled = false;
                verifyButton.innerHTML = '<span>Verify OTP</span><i class="fas fa-check-circle"></i>';
            }
                    
            if (resendButton) {
                resendButton.disabled = false;
            }

            // Clear OTP input
            otpInput.value = '';
            otpInput.focus();

            // Show error message
            otpMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid OTP. Please try again or request a new OTP.';
            otpMessage.style.color = 'var(--danger)';
            otpMessage.classList.add('visible');
            otpVerificationForm.classList.add('shake');
            setTimeout(() => otpVerificationForm.classList.remove('shake'), 500);
        }
    } catch (error) {
        console.error('Error in OTP verification:', error);

        // Re-enable buttons
        const verifyButton = otpVerificationForm.querySelector('button[type="submit"]');
        if (verifyButton) {
            verifyButton.disabled = false;
            verifyButton.innerHTML = '<span>Verify OTP</span><i class="fas fa-check-circle"></i>';
        }
                
        const resendButton = document.getElementById('otp-resend');
        if (resendButton) {
            resendButton.disabled = false;
        }

        // Show error message
        otpMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${error.message || 'Failed to verify OTP'}`;
        otpMessage.style.color = 'var(--danger)';
        otpMessage.classList.add('visible');
    }
}

// Handle OTP resend
async function handleOtpResend() {
    const otpMessage = document.getElementById('otp-message');
    const resendButton = document.getElementById('otp-resend');
    
    try {
        // Disable resend button immediately to prevent multiple clicks
        if (resendButton) {
            resendButton.disabled = true;
            resendButton.innerHTML = '<span class="sending-animation">Sending OTP</span>';
        }
        
        // Clear any previous message
        if (otpMessage) {
            otpMessage.innerHTML = '';
            otpMessage.classList.remove('visible');
        }
        
        // Check if user is authenticated
        if (!verifiedUser) {
            handleResendError(resendButton, otpMessage, 'User not authenticated. Please log in again.');
            return;
        }
        
        // Get phone number from cache if possible to avoid Firestore delay
        let phoneNumber = null;
        if (userDataCache[verifiedUser.uid] && userDataCache[verifiedUser.uid].phoneNumber) {
            phoneNumber = userDataCache[verifiedUser.uid].phoneNumber;
            console.log('Using cached phone number');
        } else {
            // Only fetch from Firestore if not in cache
            const db = firebase.firestore();
            try {
                const userDoc = await db.collection('staff').doc(verifiedUser.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    phoneNumber = userData.phoneNumber;
                    // Cache the data for future use
                    userDataCache[verifiedUser.uid] = userData;
                }
            } catch (dbError) {
                console.error('Error fetching from Firestore:', dbError);
            }
        }
        
        if (!phoneNumber) {
            handleResendError(resendButton, otpMessage, 'Phone number not found. Please go back and enter your phone number.');
            return;
        }
        
        // Generate a random 6-digit OTP immediately
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry time (60 seconds from now)
        const expiryTime = new Date();
        expiryTime.setSeconds(expiryTime.getSeconds() + OTP_EXPIRY_SECONDS);
        
        // Store OTP and expiry time for verification
        currentOTP = otp;
        otpExpiry = expiryTime;
        
        console.log('OTP generated:', otp, 'Expires at:', expiryTime);
        console.log('DEMO MODE: Your OTP is:', otp);
        
        // Show success message with animation immediately
        if (otpMessage) {
            otpMessage.innerHTML = '<span class="success-animation"><i class="fas fa-check-circle"></i> New OTP sent successfully!</span>';
            otpMessage.style.color = 'var(--success)';
            otpMessage.classList.add('visible');
        }
        
        // Reset OTP timer immediately
        startOtpTimer();
        
        // Update Firestore in the background (non-blocking) - moved after UI updates
        const db = firebase.firestore();
        db.collection('staff').doc(verifiedUser.uid).update({
            lastOtpSent: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('OTP timestamp saved to Firestore successfully');
        }).catch(firestoreError => {
            console.error('Error updating Firestore:', firestoreError);
        });
        
        // Clear OTP input
        const otpInput = document.getElementById('otp-input');
        if (otpInput) {
            otpInput.value = '';
            otpInput.focus();
        }
        
        // Re-enable resend button after minimal delay with countdown
        if (resendButton) {
            // Show countdown on button
            let countdown = 3;
            resendButton.innerHTML = `<i class="fas fa-clock"></i> Resend in ${countdown}s`;
            
            // Update countdown every second
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    resendButton.disabled = false;
                    resendButton.innerHTML = '<i class="fas fa-sync-alt"></i> Resend OTP';
                } else {
                    resendButton.innerHTML = `<i class="fas fa-clock"></i> Resend in ${countdown}s`;
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        handleResendError(resendButton, otpMessage, error.message || 'Failed to resend OTP');
    }
}

// Helper function to handle resend errors
function handleResendError(resendButton, otpMessage, errorMessage) {
    // Re-enable the button on error
    if (resendButton) {
        resendButton.disabled = false;
        resendButton.innerHTML = '<i class="fas fa-sync-alt"></i> Resend OTP';
    }
    
    if (otpMessage) {
        otpMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${errorMessage}`;
        otpMessage.style.color = 'var(--danger)';
        otpMessage.classList.add('visible');
    }
}

// Start OTP timer
function startOtpTimer() {
    // Get the countdown element
    const otpCountdown = document.getElementById('otp-countdown');
    const otpMessage = document.getElementById('otp-message');
    
    if (!otpCountdown) {
        console.error('OTP countdown element not found');
        return;
    }
    
    // Clear any existing timer
    clearOtpTimer();
    
    // Set timer for 60 seconds
    let timeLeft = OTP_EXPIRY_SECONDS;
    
    // Update timer every second
    const timerInterval = setInterval(() => {
        // Calculate minutes and seconds
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        // Display time in MM:SS format
        if (otpCountdown) {
            otpCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Decrease time left
        timeLeft--;
        
        // If timer expires, clear interval and show message
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            if (otpCountdown) {
                otpCountdown.textContent = '00:00';
            }
            if (otpMessage) {
                otpMessage.innerHTML = '<i class="fas fa-clock"></i> OTP has expired. Please request a new one.';
                otpMessage.style.color = 'var(--warning)';
                otpMessage.classList.add('visible');
            }
        }
    }, 1000);
    
    // Save interval ID for clearing later
    window.otpTimerInterval = timerInterval;
}

// Clear OTP timer
function clearOtpTimer() {
    if (window.otpTimerInterval) {
        clearInterval(window.otpTimerInterval);
        window.otpTimerInterval = null;
    }
}

// Handle Back button click on phone number page
function handlePhonePageBack() {
    // Hide the entire OTP verification container
    const otpContainer = document.getElementById('otp-verification-container');
    if (otpContainer) {
        otpContainer.classList.add('hidden');
    }
    
    // Show login form
    showLoginForm();
    
    console.log('Redirecting to login page from phone number page');
}

// Handle Back button click on phone display page
function handleDisplayPageBack() {
    // Hide the entire OTP verification container
    const otpContainer = document.getElementById('otp-verification-container');
    if (otpContainer) {
        otpContainer.classList.add('hidden');
    }
    
    // Show login form
    showLoginForm();
    
    console.log('Redirecting to login page from phone display page');
}

// Handle Back button click on OTP page
function handleOtpPageBack() {
    // Hide the entire OTP verification container
    const otpContainer = document.getElementById('otp-verification-container');
    if (otpContainer) {
        otpContainer.classList.add('hidden');
    }
    
    // Show login form directly instead of going back to previous OTP pages
    showLoginForm();
    
    // Clear OTP timer
    clearOtpTimer();
    
    console.log('Redirecting to login page from OTP page');
}

// Verify OTP
async function verifyOTP(otp) {
    // Check if OTP has expired
    if (!currentOTP || !otpExpiry || new Date() > otpExpiry) {
        const otpMessage = document.getElementById('otp-message');
        if (otpMessage) {
            otpMessage.innerHTML = '<i class="fas fa-clock"></i> OTP has expired. Please request a new one.';
            otpMessage.style.color = 'var(--danger)';
            otpMessage.classList.add('visible');
        }
        return false;
    }
    
    console.log('Verifying OTP:', otp, 'Current OTP:', currentOTP);
    
    // Verify OTP
    return otp === currentOTP;
}

// Mark phone as verified in Firestore
async function markPhoneAsVerified(userId) {
    try {
        console.log('Marking phone as verified for user:', userId);
        const db = firebase.firestore();
        
        // Update user document with verification status
        await db.collection('staff').doc(userId).update({
            phoneVerified: true,
            otpVerified: true,
            lastVerified: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Phone marked as verified successfully');
        return true;
    } catch (error) {
        console.error('Error marking phone as verified:', error);
        return false;
    }
}

// Redirect to dashboard after successful verification
function redirectToDashboard() {
    console.log('Redirecting to staff dashboard');
    window.location.href = 'staff_dashboard.html';
}

// Get user's phone number from Firestore
async function getUserPhoneNumber(userId) {
    try {
        console.log('Getting phone number for user:', userId);
        const db = firebase.firestore();
        
        // Check if we have it in cache
        if (userDataCache[userId] && userDataCache[userId].phoneNumber) {
            console.log('Using cached phone number');
            return userDataCache[userId].phoneNumber;
        }
        
        // Get user document from Firestore
        const userDoc = await db.collection('staff').doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Cache the user data
            userDataCache[userId] = userData;
            
            console.log('Retrieved phone number:', userData.phoneNumber);
            return userData.phoneNumber;
        } else {
            console.error('User document not found');
            return null;
        }
    } catch (error) {
        console.error('Error getting user phone number:', error);
        return null;
    }
}

// Generate and send OTP (using reliable fallback method)
async function generateAndSendOTP(phoneNumber) {
    try {
        console.log('Starting OTP generation for phone:', phoneNumber);
        
        // Clear any previous message
        const otpMessage = document.getElementById('otp-message');
        if (otpMessage) {
            otpMessage.innerHTML = '';
            otpMessage.classList.remove('visible');
        }
        
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry time (60 seconds from now)
        const expiryTime = new Date();
        expiryTime.setSeconds(expiryTime.getSeconds() + OTP_EXPIRY_SECONDS);
        
        // Store OTP and expiry time for verification
        currentOTP = otp;
        otpExpiry = expiryTime;
        
        console.log('OTP generated:', otp, 'Expires at:', expiryTime);
        
        // In a real-world scenario, you would send the OTP via SMS
        // For demo purposes, we'll just log it to the console
        console.log('DEMO MODE: Your OTP is:', otp);
        
        // Show success message with animation immediately
        if (otpMessage) {
            otpMessage.innerHTML = '<span class="success-animation"><i class="fas fa-check-circle"></i> OTP sent to your phone</span>';
            otpMessage.style.color = 'var(--success)';
            otpMessage.classList.add('visible');
        }
        
        return true;
    } catch (error) {
        console.error('Error generating OTP:', error);
        const otpMessage = document.getElementById('otp-message');
        if (otpMessage) {
            otpMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${error.message || 'Failed to generate OTP'}`;
            otpMessage.style.color = 'var(--danger)';
            otpMessage.classList.add('visible');
        }
        return false;
    }
}

// Check if user needs OTP verification
async function checkOtpVerificationNeeded(user) {
    try {
        if (!user || !user.uid) {
            console.error('Invalid user object');
            return true;
        }
        
        console.log('Checking if OTP verification is needed for user:', user.uid);
        
        // Get Firebase Firestore instance
        const db = firebase.firestore();
        
        // Get user document from Firestore
        const doc = await db.collection('staff').doc(user.uid).get();
        
        // If user document doesn't exist, verification is needed
        if (!doc.exists) {
            console.log('User document does not exist, first-time login - verification needed');
            return true;
        }
        
        const userData = doc.data();
        console.log('User data retrieved:', userData);
        
        // For security, we always require OTP verification on login
        // But we'll show different UI for first-time vs. returning users
        return true;
    } catch (error) {
        console.error('Error checking OTP verification:', error);
        // Default to requiring verification if there's an error
        return true;
    }
}

// Start OTP verification process
async function startOtpVerification(user) {
    // Save user for later use
    verifiedUser = user;
    console.log('Starting OTP verification for user:', user.uid);
    
    // Initialize OTP verification UI
    initOtpVerification();
    
    // Show OTP verification container (this will hide all forms initially)
    showOtpVerification();
    
    try {
        // Get user data directly from Firestore
        const db = firebase.firestore();
        console.log('Fetching user data from Firestore for user:', user.uid);
        const userDoc = await db.collection('staff').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('User data retrieved from Firestore:', userData);
            
            // Update first login flag if needed
            if (userData.isFirstLogin === true) {
                await db.collection('staff').doc(user.uid).update({
                    isFirstLogin: false
                });
            }
            
            // Check if the user has a verified phone number
            if (userData.phoneNumber && userData.phoneVerified === true) {
                console.log('User has verified phone number:', userData.phoneNumber);
                
                // Show ONLY the phone display page for returning users with verified phones
                const phoneDisplayPage = document.getElementById('phone-display-page');
                if (!phoneDisplayPage) {
                    console.error('Phone display page not found');
                    return;
                }
                
                // Show the phone display page
                phoneDisplayPage.classList.remove('hidden');
                
                // Display the phone number
                const displayPhoneElement = document.getElementById('display-phone-number');
                if (displayPhoneElement) {
                    displayPhoneElement.textContent = userData.phoneNumber;
                    console.log('Displayed phone number:', userData.phoneNumber);
                }
                
                // Ensure the send OTP button is visible
                const sendOtpButton = document.getElementById('send-otp-button');
                if (sendOtpButton) {
                    sendOtpButton.style.display = 'flex';
                    console.log('Send OTP button should be visible now');
                } else {
                    console.error('Send OTP button not found');
                }
                
                // Show message to get OTP
                const phoneError = document.getElementById('display-phone-error');
                if (phoneError) {
                    phoneError.textContent = 'Click the Above button to receive OTP';
                    phoneError.style.color = 'var(--primary)';
                    phoneError.classList.add('visible');
                }
                
                return;
            }
            
            // If user has a phone number but it's not verified, or no phone number at all
            // Show the phone number registration page
            
            // CASE 2: First-time user without a phone number
            console.log('First-time user, showing phone number form');
            
            // Show ONLY the phone number page for new users
            const phoneNumberPage = document.getElementById('phone-number-page');
            if (!phoneNumberPage) {
                console.error('Phone number page not found');
                return;
            }
            
            // Show the phone number page
            phoneNumberPage.classList.remove('hidden');
            
            // Show message to enter phone number
            const phoneError = document.getElementById('phone-error');
            if (phoneError) {
                phoneError.textContent = 'Please enter your mobile number for verification';
                phoneError.style.color = 'var(--primary)';
                phoneError.classList.add('visible');
            }
            
            return;
        }
        
        // CASE 3: User document doesn't exist (should not happen, but just in case)
        console.log('User document not found, showing phone number form');
        
        // Show ONLY the phone number page
        const phoneNumberPage = document.getElementById('phone-number-page');
        if (!phoneNumberPage) {
            console.error('Phone number page not found');
            return;
        }
        
        // Show the phone number page
        phoneNumberPage.classList.remove('hidden');
        
        // Show message to enter phone number
        const phoneError = document.getElementById('phone-error');
        if (phoneError) {
            phoneError.textContent = 'Please enter your mobile number for verification';
            phoneError.style.color = 'var(--primary)';
            phoneError.classList.add('visible');
        }
    } catch (error) {
        console.error('Error in startOtpVerification:', error);
        
        // Default to showing phone number page on error
        const phoneNumberPage = document.getElementById('phone-number-page');
        if (phoneNumberPage) {
            phoneNumberPage.classList.remove('hidden');
            
            // Show error message
            const phoneError = document.getElementById('phone-error');
            if (phoneError) {
                phoneError.textContent = `Error: ${error.message || 'Failed to retrieve user data'}`;
                phoneError.style.color = 'var(--danger)';
                phoneError.classList.add('visible');
            }
        }
    }
}

// Add CSS styles for OTP verification
function addOtpStyles() {
    // Check if styles already exist
    if (document.getElementById('otp-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'otp-styles';
    style.textContent = `
        .otp-verification-container {
            width: 100%;
            margin-top: 20px;
            transition: all 0.3s ease;
        }
        
        .otp-verification-container.hidden {
            display: none;
        }
        
        .otp-card {
            background: var(--light);
            padding: var(--space-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
        }
        
        .otp-back-button {
            position: absolute;
            top: 15px;
            left: 15px;
            background: transparent;
            border: none;
            color: var(--primary);
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .otp-title {
            text-align: center;
            margin-bottom: 10px;
            color: var(--dark);
            font-family: var(--font-display);
            font-size: 1.5rem;
        }
        
        .otp-subtitle {
            text-align: center;
            margin-bottom: 20px;
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .otp-form {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: var(--radius-sm);
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(0, 107, 84, 0.2);
        }
        
        .form-group small {
            display: block;
            margin-top: 5px;
            color: var(--gray);
            font-size: 0.8rem;
        }
        
        .form-group .note {
            margin-top: 8px;
            color: var(--primary);
            font-size: 0.8rem;
            font-style: italic;
        }
        
        .readonly-phone {
            padding: 12px;
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: var(--radius-sm);
            font-weight: 500;
        }
        
        .otp-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            border: none;
            border-radius: var(--radius-sm);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
            box-shadow: var(--shadow-sm);
        }
        
        .otp-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        .otp-resend-btn {
            background: transparent;
            border: none;
            color: var(--primary);
            text-align: center;
            margin-top: 10px;
            font-size: 0.9rem;
            cursor: pointer;
            text-decoration: underline;
            width: 100%;
        }
        
        .otp-timer {
            text-align: center;
            margin-top: 10px;
            color: var(--gray);
            font-size: 0.9rem;
        }
        
        .error-message {
            color: var(--secondary);
            margin-top: 10px;
            text-align: center;
            font-size: 0.9rem;
            display: none;
        }
        
        .error-message.visible {
            display: block;
        }
        
        .shake {
            animation: shake 0.5s;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// Export the OTP verification handler
window.OtpHandler = {
    // Add OTP styles
    addOtpStyles,
    
    // Initialize OTP verification
    initOtpVerification,
    
    // Check if OTP verification is needed and start the process
    checkAndStartVerification: async function(user) {
        try {
            console.log('Starting OTP verification flow for user:', user.uid);
            
            // Get Firebase Firestore instance
            const db = firebase.firestore();
            
            // First, check if the user exists in the staff collection
            const userDoc = await db.collection('staff').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // First-time user - create a new document for them
                console.log('First-time user, creating staff document');
                await db.collection('staff').doc(user.uid).set({
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    otpVerified: false,
                    phoneVerified: false,
                    isFirstLogin: true
                });
            } else {
                // Check if we need to add the phoneVerified field for existing users
                const userData = userDoc.data();
                if (userData.phoneNumber && userData.otpVerified === true && userData.phoneVerified === undefined) {
                    // User has verified before but doesn't have the phoneVerified flag
                    await db.collection('staff').doc(user.uid).update({
                        phoneVerified: true
                    });
                    console.log('Updated existing user with phoneVerified flag');
                }
            }
            
            // Always require OTP verification for security
            await startOtpVerification(user);
            
        } catch (error) {
            console.error('Error in OTP verification flow:', error);
            // Show error to user
            alert('Error in verification process. Please try again.');
        }
    }
};

// Initialize OTP verification when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Add OTP styles
    OtpHandler.addOtpStyles();
    
    // Initialize OTP verification UI
    OtpHandler.initOtpVerification();
    
    console.log('OTP verification module initialized');
});
