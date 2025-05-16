// Payment Animation System
// Advanced 3D animations for payment success and failure

// Animation Configuration
const animConfig = {
  duration: 1500,
  fadeOutDelay: 3000,
  container: {
    width: '300px',
    height: '300px',
  }
};

// Create the animation container
function createAnimationContainer() {
  // Remove any existing animation containers
  const existingContainer = document.getElementById('payment-animation-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement('div');
  container.id = 'payment-animation-container';
  document.body.appendChild(container);
  return container;
}

// Success Animation with 3D effects
function showSuccessAnimation(amount, callback) {
  const container = createAnimationContainer();
  
  // Create HTML structure for the animation
  container.innerHTML = `
    <div class="payment-animation success-animation">
      <div class="animation-backdrop"></div>
      <div class="animation-content">
        <div class="animation-circle">
          <div class="checkmark-container">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
        <div class="animation-particles-container">
          ${generateParticles(20)}
        </div>
        <div class="animation-coin-shower">
          ${generateCoins(15)}
        </div>
        <h2 class="animation-title">Payment Successful!</h2>
        <p class="animation-amount">₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        <div class="animation-message">Your transaction has been processed successfully</div>
      </div>
    </div>
  `;

  // Add to DOM with animation classes
  document.body.appendChild(container);
  
  // Trigger animation sequence
  setTimeout(() => {
    container.classList.add('active');
    animateParticles();
    animateCoins();
  }, 100);

  // Remove after delay
  setTimeout(() => {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.remove();
      if (typeof callback === 'function') callback();
    }, 1000);
  }, animConfig.fadeOutDelay);
}

// Failure Animation with 3D effects
function showFailureAnimation(message, callback) {
  const container = createAnimationContainer();
  
  // Create HTML structure for the error animation
  container.innerHTML = `
    <div class="payment-animation failure-animation">
      <div class="animation-backdrop error"></div>
      <div class="animation-content">
        <div class="animation-circle error">
          <div class="error-container">
            <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="error-x" fill="none" d="M16,16 L36,36 M36,16 L16,36"/>
            </svg>
          </div>
        </div>
        <div class="animation-error-particles">
          ${generateErrorParticles(15)}
        </div>
        <h2 class="animation-title error">Payment Failed</h2>
        <div class="animation-message error">${message || 'Your transaction could not be processed'}</div>
        <button class="animation-retry-button">Try Again</button>
      </div>
    </div>
  `;

  // Add to DOM with animation classes
  document.body.appendChild(container);
  
  // Trigger animation sequence
  setTimeout(() => {
    container.classList.add('active');
    animateErrorParticles();
  }, 100);

  // Add event listener to retry button
  const retryButton = container.querySelector('.animation-retry-button');
  retryButton.addEventListener('click', () => {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.remove();
      if (typeof callback === 'function') callback();
    }, 500);
  });

  // Remove after delay if not clicked
  setTimeout(() => {
    if (document.body.contains(container)) {
      container.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(container)) {
          container.remove();
          if (typeof callback === 'function') callback();
        }
      }, 1000);
    }
  }, animConfig.fadeOutDelay + 3000);
}

// Generate success particles
function generateParticles(count) {
  let particles = '';
  for (let i = 0; i < count; i++) {
    particles += `<div class="particle particle-${i}"></div>`;
  }
  return particles;
}

// Generate 3D coins for success animation
function generateCoins(count) {
  let coins = '';
  for (let i = 0; i < count; i++) {
    coins += `
      <div class="coin coin-${i}">
        <div class="coin-front"></div>
        <div class="coin-edge"></div>
        <div class="coin-back"></div>
      </div>
    `;
  }
  return coins;
}

// Generate error particles
function generateErrorParticles(count) {
  let particles = '';
  for (let i = 0; i < count; i++) {
    particles += `<div class="error-particle error-particle-${i}"></div>`;
  }
  return particles;
}

// Animate success particles
function animateParticles() {
  const particles = document.querySelectorAll('.particle');
  particles.forEach((particle, index) => {
    const randomX = (Math.random() - 0.5) * 200;
    const randomY = (Math.random() - 0.5) * 200;
    const randomRotate = Math.random() * 360;
    const randomScale = 0.5 + Math.random() * 1.5;
    const randomDelay = Math.random() * 500;
    
    setTimeout(() => {
      particle.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg) scale(${randomScale})`;
      particle.style.opacity = '0';
    }, randomDelay);
  });
}

// Animate 3D coins
function animateCoins() {
  const coins = document.querySelectorAll('.coin');
  coins.forEach((coin, index) => {
    const randomX = (Math.random() - 0.5) * 300;
    const randomDelay = Math.random() * 1000;
    const randomDuration = 1000 + Math.random() * 1500;
    
    coin.style.animationDelay = `${randomDelay}ms`;
    coin.style.animationDuration = `${randomDuration}ms`;
    coin.style.left = `calc(50% + ${randomX}px)`;
  });
}

// Animate error particles
function animateErrorParticles() {
  const particles = document.querySelectorAll('.error-particle');
  particles.forEach((particle, index) => {
    const randomX = (Math.random() - 0.5) * 150;
    const randomY = (Math.random() - 0.5) * 150;
    const randomRotate = Math.random() * 360;
    const randomDelay = Math.random() * 300;
    
    setTimeout(() => {
      particle.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
      particle.style.opacity = '0';
    }, randomDelay);
  });
}

// Show a small popup toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success' 
        ? '<i class="fas fa-check-circle"></i>' 
        : '<i class="fas fa-exclamation-circle"></i>'}
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-visible');
  }, 50);
  
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Show a smooth processing animation while payment is being processed
function showProcessingAnimation(message = 'Processing your payment...') {
  const container = createAnimationContainer();
  
  // Create HTML structure for the processing animation
  container.innerHTML = `
    <div class="payment-animation processing-animation">
      <div class="animation-backdrop processing"></div>
      <div class="animation-content processing-content">
        <div class="processing-loader">
          <div class="processing-spinner-container">
            <div class="processing-spinner"></div>
            <div class="processing-spinner-inner"></div>
            <div class="processing-pulse-ring"></div>
          </div>
        </div>
        <div class="processing-particles">
          ${generateProcessingParticles(12)}
        </div>
        <h2 class="animation-title processing">${message}</h2>
        <div class="animation-message processing">
          <div class="processing-steps">
            <div class="processing-step active">Verifying details<span class="dot-animation">...</span></div>
            <div class="processing-step">Securing transaction<span class="dot-animation">...</span></div>
            <div class="processing-step">Updating records<span class="dot-animation">...</span></div>
            <div class="processing-step">Finalizing payment<span class="dot-animation">...</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add to DOM with animation classes
  document.body.appendChild(container);
  
  // Trigger animation sequence
  setTimeout(() => {
    container.classList.add('active');
    animateProcessingParticles();
    animateProcessingSteps();
  }, 100);

  // Return a function to hide the animation
  return {
    hide: (callback) => {
      container.classList.add('fade-out');
      setTimeout(() => {
        container.remove();
        if (typeof callback === 'function') callback();
      }, 500);
    }
  };
}

// Generate processing particles
function generateProcessingParticles(count) {
  let particles = '';
  for (let i = 0; i < count; i++) {
    particles += `<div class="processing-particle processing-particle-${i}"></div>`;
  }
  return particles;
}

// Animate processing particles
function animateProcessingParticles() {
  const particles = document.querySelectorAll('.processing-particle');
  particles.forEach((particle, index) => {
    const randomDelay = Math.random() * 2000;
    const randomDuration = 2000 + Math.random() * 3000;
    
    particle.style.animationDelay = `${randomDelay}ms`;
    particle.style.animationDuration = `${randomDuration}ms`;
  });
}

// Animate processing steps
function animateProcessingSteps() {
  const steps = document.querySelectorAll('.processing-step');
  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep > 0) {
      steps[currentStep - 1].classList.remove('active');
    }
    
    if (currentStep < steps.length) {
      steps[currentStep].classList.add('active');
      currentStep++;
    } else {
      // Restart animation
      steps.forEach(step => step.classList.remove('active'));
      currentStep = 0;
      steps[currentStep].classList.add('active');
      currentStep++;
    }
  }, 1500);
  
  // Store interval ID in a data attribute to clear it later
  const container = document.getElementById('payment-animation-container');
  if (container) {
    container.dataset.stepInterval = interval;
  }
}

// Export functions
window.PaymentAnimations = {
  showSuccessAnimation,
  showFailureAnimation,
  showProcessingAnimation,
  showToast
}; 