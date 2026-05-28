/**
 * Payment Modal Component
 *
 * Handles Midtrans payment flow integration.
 * Plug-and-play design - works with or without Midtrans configured.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const PAYMENT_CONFIG = {
  // Product prices (USD)
  snapshotPrice: 29,
  blueprintPrice: 85,
  // Subscription prices
  foundationPrice: 200,
  proPrice: 500,
  enterprisePrice: 1000,
  // Credit prices
  creditPrices: {
    50: 5,
    100: 9,
    250: 20,
    500: 38,
    1000: 70,
    2500: 165,
    5000: 300,
    10000: 550,
  },
  
  // Product IDs
  products: {
    SNAPSHOT: "ai_snapshot",
    BLUEPRINT: "ai_blueprint",
    FOUNDATION: "foundation",
    PRO: "pro",
    ENTERPRISE: "enterprise",
  },
  
  // Credit products
  credits: [50, 100, 250, 500, 1000, 2500, 5000, 10000],
  
  // Payment methods
  paymentMethods: {
    MIDTRANS: "midtrans",
    MANUAL: "manual",
  },
};

// ============================================================================
// STATE
// ============================================================================

let currentPaymentProduct = null;
let currentPaymentAmount = null;
let paymentModalListeners = [];

// ============================================================================
// DOM ELEMENTS
// ============================================================================

let paymentModal = null;
let paymentContent = null;
let paymentStatus = null;
let paymentButton = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize payment modal
 */
function initPaymentModal() {
  console.log("PaymentModal: Initializing...");
  
  // Check if Midtrans is available
  if (typeof Snap !== "undefined") {
    console.log("✓ Midtrans Snap SDK loaded");
  } else {
    console.log("ℹ️ Midtrans Snap SDK not loaded (will use fallback)");
  }
  
  // Create modal structure
  createPaymentModal();
  
  console.log("✓ PaymentModal ready");
}

/**
 * Create payment modal HTML structure
 */
function createPaymentModal() {
  // Check if modal already exists
  if (document.getElementById("payment-modal")) {
    return;
  }
  
  // Create modal container
  const modal = document.createElement("div");
  modal.id = "payment-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-close" onclick="closePaymentModal()">&times;</div>
      <h2 id="payment-modal-title">Complete Payment</h2>
      <div id="payment-modal-body">
        <!-- Payment content will be injected here -->
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closePaymentModal();
    }
  });
  
  // Store references
  paymentModal = modal;
  paymentContent = modal.querySelector("#payment-modal-body");
  paymentStatus = modal.querySelector("#payment-modal-status");
  
  console.log("✓ Payment modal created");
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Open payment modal for a specific product
 * @param {string|number} product - Product to purchase (ai_snapshot, ai_blueprint, foundation, pro, enterprise, or credit amount)
 */
function openPaymentModal(product) {
  console.log("PaymentModal: Opening for product:", product);
  
  currentPaymentProduct = product;
  
  // Set price based on product type
  if (product === PAYMENT_CONFIG.products.SNAPSHOT) {
    currentPaymentAmount = PAYMENT_CONFIG.snapshotPrice;
  } else if (product === PAYMENT_CONFIG.products.BLUEPRINT) {
    currentPaymentAmount = PAYMENT_CONFIG.blueprintPrice;
  } else if (product === PAYMENT_CONFIG.products.FOUNDATION) {
    currentPaymentAmount = PAYMENT_CONFIG.foundationPrice;
  } else if (product === PAYMENT_CONFIG.products.PRO) {
    currentPaymentAmount = PAYMENT_CONFIG.proPrice;
  } else if (product === PAYMENT_CONFIG.products.ENTERPRISE) {
    currentPaymentAmount = PAYMENT_CONFIG.enterprisePrice;
  } else if (typeof product === 'number') { // Credit top-up
    currentPaymentAmount = PAYMENT_CONFIG.creditPrices[product];
    currentPaymentProduct = `credits_${product}`;
  } else {
    console.error("Invalid product:", product);
    alert("Invalid product selected");
    return;
  }
  
  // Check authentication - user must be registered
  if (typeof AuthManager !== "undefined") {
    if (!AuthManager.isAuthenticated()) {
      console.log("User not authenticated, showing login modal");
      alert("Please log in to access payment options");
      if (typeof showLoginModal === "function") {
        showLoginModal();
      }
      return;
    }
    
    // Verify user has valid user_id
    const user = AuthManager.getUser();
    if (!user || !user.user_id) {
      console.error("User missing user_id:", user);
      alert("User account not properly configured. Please log in again.");
      return;
    }
  }
  
  // Show payment options
  showPaymentOptions();
}

/**
 * Close payment modal
 */
function closePaymentModal() {
  if (paymentModal) {
    paymentModal.style.display = "none";
  }
  currentPaymentProduct = null;
  currentPaymentAmount = null;
  console.log("Payment modal closed");
}

/**
 * Subscribe to payment events
 * @param {function} callback - Callback function with payment result
 */
function onPayment(callback) {
  paymentModalListeners.push(callback);
}

// ============================================================================
// PAYMENT FLOW
// ============================================================================

/**
 * Show payment options (Midtrans or manual)
 */
function showPaymentOptions() {
  if (!paymentContent) return;
  
  const user = AuthManager ? AuthManager.getUser() : null;
  const userEmail = user ? user.email : "user@aivory.id";
  
  paymentContent.innerHTML = `
    <div class="payment-options">
      <h3>Select Payment Method</h3>
      <div class="payment-methods">
        <button class="payment-method-btn midtrans-btn" onclick="startMidtransPayment()">
          <span class="icon">💳</span>
          <span class="label">Credit Card / Bank Transfer (Midtrans)</span>
          <span class="price">$${currentPaymentAmount}</span>
        </button>
        <button class="payment-method-btn manual-btn" onclick="showManualPaymentForm()">
          <span class="icon">🏦</span>
          <span class="label">Bank Transfer / Cash (Manual)</span>
          <span class="price">$${currentPaymentAmount}</span>
        </button>
      </div>
      <p class="payment-note">Secure payment powered by Midtrans</p>
    </div>
  `;
  
  if (paymentModal) {
    paymentModal.style.display = "flex";
  }
}

/**
 * Start Midtrans payment flow
 */
async function startMidtransPayment() {
  if (!paymentContent) return;
  
  // Show loading state
  paymentContent.innerHTML = `
    <div class="payment-loading">
      <div class="spinner"></div>
      <p>Connecting to payment gateway...</p>
    </div>
  `;
  
  try {
    // Get user info
    const user = AuthManager.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Create transaction with backend
    const response = await fetch(`${window.API_BASE_URL}/api/v1/payments/midtrans/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        amount: currentPaymentAmount,
        product: currentPaymentProduct,
        customer_email: user.email,
        customer_first_name: user.name || user.email.split("@")[0],
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create transaction");
    }
    
    const result = await response.json();
    
    if (!result.success || !result.token) {
      throw new Error("Failed to get payment token");
    }
    
    // Check if Midtrans Snap SDK is available
    if (typeof Snap !== "undefined") {
      // Use Midtrans Snap
      await startMidtransSnap(result.token);
    } else {
      // Fallback: Show redirect URL
      showPaymentRedirect(result.redirect_url || result.token);
    }
    
  } catch (error) {
    console.error("Payment initialization failed:", error);
    paymentContent.innerHTML = `
      <div class="payment-error">
        <p class="error-message">${error.message}</p>
        <button class="btn-primary" onclick="showPaymentOptions()">Try Again</button>
      </div>
    `;
  }
}

/**
 * Start Midtrans Snap payment
 * @param {string} token - Payment token from backend
 */
async function startMidtransSnap(token) {
  if (typeof Snap === "undefined") {
    throw new Error("Midtrans Snap SDK not loaded");
  }
  
  return new Promise((resolve, reject) => {
    Snap.pay(token, {
      // Optional: Callback functions
      onSuccess: (result) => {
        console.log("Payment successful:", result);
        handlePaymentSuccess(result);
        resolve(result);
      },
      onPending: (result) => {
        console.log("Payment pending:", result);
        handlePaymentPending(result);
        resolve(result);
      },
      onFailure: (result) => {
        console.log("Payment failed:", result);
        handlePaymentFailure(result);
        reject(result);
      },
      onClose: () => {
        console.log("Payment modal closed");
        reject(new Error("Payment closed"));
      },
    });
  });
}

/**
 * Show manual payment form
 */
function showManualPaymentForm() {
  if (!paymentContent) return;
  
  paymentContent.innerHTML = `
    <div class="manual-payment-form">
      <h3>Manual Payment</h3>
      <p>Send proof of payment to our team for manual verification.</p>
      
      <form id="manual-payment-form">
        <div class="form-group">
          <label for="payment-proof">Payment Proof / Screenshot</label>
          <input type="file" id="payment-proof" accept="image/*" required>
        </div>
        
        <div class="form-group">
          <label for="transaction-id">Transaction ID / Reference Number</label>
          <input type="text" id="transaction-id" placeholder="Enter transaction ID" required>
        </div>
        
        <div class="form-group">
          <label for="payment-method">Payment Method</label>
          <select id="payment-method">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="ewallet">E-Wallet</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick="showPaymentOptions()">Cancel</button>
          <button type="submit" class="btn-primary">Submit Payment</button>
        </div>
      </form>
    </div>
  `;
  
  // Add form submit handler
  const form = paymentContent.querySelector("#manual-payment-form");
  form.addEventListener("submit", handleManualPaymentSubmit);
}

/**
 * Handle manual payment submission
 */
async function handleManualPaymentSubmit(e) {
  e.preventDefault();
  
  if (!paymentContent) return;
  
  const formData = new FormData(e.target);
  const transactionId = formData.get("transaction-id");
  const paymentMethod = formData.get("payment-method");
  
  // Show loading
  paymentContent.innerHTML = `
    <div class="payment-loading">
      <div class="spinner"></div>
      <p>Submitting payment...</p>
    </div>
  `;
  
  try {
    const user = AuthManager.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Record manual payment
    const response = await fetch(`${window.API_BASE_URL}/api/v1/payments/record`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        amount: currentPaymentAmount,
        payment_method: paymentMethod,
        product: currentPaymentProduct,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to record payment");
    }
    
    const result = await response.json();
    
    // Show success
    paymentContent.innerHTML = `
      <div class="payment-success">
        <div class="success-icon">✓</div>
        <h3>Payment Recorded!</h3>
        <p>Your payment has been recorded and will be verified by our team.</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <button class="btn-primary" onclick="closePaymentModal()">Close</button>
      </div>
    `;
    
    // Notify listeners
    notifyPaymentSuccess({
      product: currentPaymentProduct,
      amount: currentPaymentAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
    });
    
  } catch (error) {
    console.error("Manual payment failed:", error);
    paymentContent.innerHTML = `
      <div class="payment-error">
        <p class="error-message">${error.message}</p>
        <button class="btn-primary" onclick="showManualPaymentForm()">Try Again</button>
      </div>
    `;
  }
}

/**
 * Handle successful payment
 */
function handlePaymentSuccess(result) {
  if (!paymentContent) return;
  
  paymentContent.innerHTML = `
    <div class="payment-success">
      <div class="success-icon">✓</div>
      <h3>Payment Successful!</h3>
      <p>Your payment has been processed successfully.</p>
      <p><strong>Order ID:</strong> ${result.order_id || result.transaction_id}</p>
      <p><strong>Status:</strong> ${result.transaction_status}</p>
      <button class="btn-primary" onclick="closePaymentModal()">Close</button>
    </div>
  `;
  
  // Notify listeners
  notifyPaymentSuccess({
    product: currentPaymentProduct,
    amount: currentPaymentAmount,
    payment_method: PAYMENT_CONFIG.paymentMethods.MIDTRANS,
    transaction_id: result.transaction_id,
    order_id: result.order_id,
  });
}

/**
 * Handle pending payment
 */
function handlePaymentPending(result) {
  if (!paymentContent) return;
  
  paymentContent.innerHTML = `
    <div class="payment-pending">
      <div class="pending-icon">⏳</div>
      <h3>Payment Pending</h3>
      <p>Your payment is being processed.</p>
      <p><strong>Order ID:</strong> ${result.order_id || result.transaction_id}</p>
      <p><strong>Status:</strong> ${result.transaction_status}</p>
      <p>We'll notify you once the payment is confirmed.</p>
      <button class="btn-primary" onclick="closePaymentModal()">Close</button>
    </div>
  `;
  
  // Notify listeners
  notifyPaymentPending({
    product: currentPaymentProduct,
    amount: currentPaymentAmount,
    payment_method: PAYMENT_CONFIG.paymentMethods.MIDTRANS,
    transaction_id: result.transaction_id,
    order_id: result.order_id,
  });
}

/**
 * Handle payment failure
 */
function handlePaymentFailure(result) {
  if (!paymentContent) return;
  
  paymentContent.innerHTML = `
    <div class="payment-error">
      <div class="error-icon">✗</div>
      <h3>Payment Failed</h3>
      <p>Sorry, your payment could not be processed.</p>
      <p><strong>Message:</strong> ${result.status_message || "Unknown error"}</p>
      <button class="btn-primary" onclick="showPaymentOptions()">Try Again</button>
    </div>
  `;
  
  // Notify listeners
  notifyPaymentFailure({
    product: currentPaymentProduct,
    amount: currentPaymentAmount,
    payment_method: PAYMENT_CONFIG.paymentMethods.MIDTRANS,
    transaction_id: result.transaction_id,
    order_id: result.order_id,
    error: result.status_message,
  });
}

/**
 * Show payment redirect URL
 */
function showPaymentRedirect(redirectUrl) {
  if (!paymentContent) return;
  
  paymentContent.innerHTML = `
    <div class="payment-redirect">
      <h3>Complete Payment</h3>
      <p>Please complete your payment on the payment gateway.</p>
      <a href="${redirectUrl}" class="btn-primary" target="_blank">
        Go to Payment Gateway
      </a>
      <p class="payment-note">Or copy and paste this URL into your browser:</p>
      <code>${redirectUrl}</code>
      <button class="btn-secondary" onclick="closePaymentModal()">Cancel</button>
    </div>
  `;
}

// ============================================================================
// NOTIFICATION
// ============================================================================

/**
 * Notify listeners of payment success
 */
function notifyPaymentSuccess(paymentResult) {
  paymentModalListeners.forEach((callback) => {
    try {
      callback({ status: "success", result: paymentResult });
    } catch (error) {
      console.error("Payment listener error:", error);
    }
  });
}

/**
 * Notify listeners of payment pending
 */
function notifyPaymentPending(paymentResult) {
  paymentModalListeners.forEach((callback) => {
    try {
      callback({ status: "pending", result: paymentResult });
    } catch (error) {
      console.error("Payment listener error:", error);
    }
  });
}

/**
 * Notify listeners of payment failure
 */
function notifyPaymentFailure(paymentResult) {
  paymentModalListeners.forEach((callback) => {
    try {
      callback({ status: "failure", result: paymentResult });
    } catch (error) {
      console.error("Payment listener error:", error);
    }
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get payment configuration
 */
function getPaymentConfig() {
  return PAYMENT_CONFIG;
}

/**
 * Check if Midtrans is available
 */
function isMidtransAvailable() {
  return typeof Snap !== "undefined";
}

// ============================================================================
// EXPORT
// ============================================================================

const PaymentModal = {
  init: initPaymentModal,
  open: openPaymentModal,
  close: closePaymentModal,
  onPayment: onPayment,
  getPaymentConfig: getPaymentConfig,
  isMidtransAvailable: isMidtransAvailable,
};

// Make globally available
window.PaymentModal = PaymentModal;

// Auto-initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPaymentModal);
} else {
  initPaymentModal();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = PaymentModal;
}
