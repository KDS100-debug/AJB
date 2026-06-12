/* ============================================
   PAYMENT MODULE - Razorpay Integration
   ============================================ */

const PAYMENT_CONFIG = {
    RAZORPAY_KEY_ID: CONFIG.RAZORPAY_KEY_ID,
    AMOUNT: CONFIG.PLAN_AMOUNT,
    CURRENCY: 'INR',
    PLAN_NAME: CONFIG.PLAN_NAME,
    DESCRIPTION: CONFIG.PLAN_DESCRIPTION,
    BRAND_NAME: CONFIG.BRAND_NAME,
    THEME_COLOR: CONFIG.THEME_COLOR,
    LOGO_URL: CONFIG.LOGO_URL,
    PAYMENT_LINK: CONFIG.RAZORPAY_PAYMENT_LINK
};

let razorpayScriptPromise = null;
const GUEST_PAYMENT_STORAGE_KEY = 'guestPaymentUser';

function showPaymentToast(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type, 4000);
        return;
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        max-width: 360px;
        padding: 14px 18px;
        border-radius: 8px;
        color: #fff;
        font-weight: 600;
        background: ${type === 'error' ? '#DC2626' : type === 'success' ? '#16A34A' : '#0F4C81'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function setSubscribeButtonState(isLoading, text = 'Unlock All Courses') {
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (!subscribeBtn) return;

    subscribeBtn.disabled = isLoading;
    subscribeBtn.textContent = isLoading ? 'Processing...' : text;
}

function openRazorpayPaymentLink() {
    if (!PAYMENT_CONFIG.PAYMENT_LINK) {
        showPaymentToast('Razorpay payment link is not configured.', 'error');
        return;
    }

    showPaymentToast('Opening Razorpay payment link. Access will be activated after payment confirmation.', 'info');
    window.location.href = PAYMENT_CONFIG.PAYMENT_LINK;
}

function loadRazorpayCheckoutScript() {
    if (window.Razorpay) {
        return Promise.resolve();
    }

    if (razorpayScriptPromise) {
        return razorpayScriptPromise;
    }

    razorpayScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
        document.head.appendChild(script);
    });

    return razorpayScriptPromise;
}

function getLoggedInPaymentUser() {
    const user = getCurrentUserFromStorage();
    if (!user.id) return null;
    if (String(user.id).startsWith('GUEST_')) {
        const savedGuest = readGuestPaymentUser();
        return {
            ...user,
            name: user.name || savedGuest.name || 'AJB Learner',
            email: user.email || savedGuest.email || '',
            mobile: user.mobile || savedGuest.mobile || '',
            isGuest: true
        };
    }
    return user;
}

function getFieldValue(id) {
    const field = document.getElementById(id);
    return field ? String(field.value || '').trim() : '';
}

function readGuestPaymentUser() {
    try {
        return JSON.parse(localStorage.getItem(GUEST_PAYMENT_STORAGE_KEY) || '{}');
    } catch (error) {
        return {};
    }
}

function saveGuestPaymentUser(user) {
    localStorage.setItem(GUEST_PAYMENT_STORAGE_KEY, JSON.stringify(user));
    return user;
}

function createGuestPaymentId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return `GUEST_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
    }
    return `GUEST_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getGuestPaymentUser() {
    const savedGuest = readGuestPaymentUser();
    const storedGuestId = String(localStorage.getItem('userId') || '').startsWith('GUEST_')
        ? localStorage.getItem('userId')
        : '';
    const guestId = savedGuest.id || storedGuestId || createGuestPaymentId();

    const guest = {
        id: guestId,
        userId: guestId,
        name: getFieldValue('buyerName') || savedGuest.name || localStorage.getItem('userName') || 'AJB Learner',
        email: getFieldValue('buyerEmail') || savedGuest.email || localStorage.getItem('userEmail') || '',
        mobile: getFieldValue('buyerMobile') || savedGuest.mobile || localStorage.getItem('userMobile') || '',
        isGuest: true
    };

    return saveGuestPaymentUser(guest);
}

function getPaymentUser() {
    return getLoggedInPaymentUser() || getGuestPaymentUser();
}

function activateGuestPaymentSession(user) {
    if (!user || !user.isGuest) return;

    const now = new Date();
    const sessionData = {
        userId: user.id,
        userEmail: user.email || '',
        userName: user.name || 'AJB Learner',
        userMobile: user.mobile || '',
        sessionToken: 'guest-payment-access',
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name || 'AJB Learner');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userMobile', user.mobile || '');
    localStorage.setItem('sessionToken', 'guest-payment-access');
    localStorage.setItem('guestCheckout', 'true');
}

async function verifySubscriptionStatus() {
    const user = getPaymentUser();
    if (!user) {
        return { success: false, subscriptionStatus: 'INACTIVE', isSubscribed: false };
    }

    try {
        const response = await verifySubscription(user.id);
        return {
            success: response.success,
            subscriptionStatus: response.subscriptionStatus || 'INACTIVE',
            isSubscribed: response.isSubscribed || normalizeSubscriptionStatus(response.subscriptionStatus)
        };
    } catch (error) {
        console.error('Subscription check failed:', error);
        return {
            success: false,
            subscriptionStatus: localStorage.getItem('subscriptionStatus') || 'INACTIVE',
            isSubscribed: localStorage.getItem('isSubscribed') === 'true'
        };
    }
}

async function initializePayment() {
    const user = getPaymentUser();

    if (PAYMENT_CONFIG.PAYMENT_LINK) {
        openRazorpayPaymentLink();
        return;
    }

    if (PAYMENT_CONFIG.RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID') {
        showPaymentToast('Razorpay Key ID is not configured in js/api.js.', 'error');
        return;
    }

    if (typeof isConfiguredApiUrl === 'function' && !isConfiguredApiUrl()) {
        openRazorpayPaymentLink();
        return;
    }

    try {
        setSubscribeButtonState(true);

        const subscription = await verifySubscriptionStatus();
        if (subscription.isSubscribed) {
            persistSubscriptionStatus('ACTIVE');
            activateGuestPaymentSession(user);
            showPaymentToast('Your AJB Premium access is already active.', 'success');
            window.location.href = 'dashboard.html';
            return;
        }

        const orderResponse = await createRazorpayOrder(
            user.id,
            user.email,
            PAYMENT_CONFIG.AMOUNT,
            PAYMENT_CONFIG.PLAN_NAME,
            user
        );

        if (orderResponse.alreadySubscribed) {
            persistSubscriptionStatus('ACTIVE');
            activateGuestPaymentSession(user);
            showPaymentToast('Your AJB Premium access is already active.', 'success');
            window.location.href = 'dashboard.html';
            return;
        }

        if (!orderResponse.success) {
            showPaymentToast(orderResponse.message || 'Unable to create payment order. Please try again.', 'error');
            return;
        }

        await openRazorpayCheckout(orderResponse, user);
    } catch (error) {
        console.error('Payment initialization failed:', error);
        showPaymentToast(error.message || 'Network error. Please try again.', 'error');
    } finally {
        setSubscribeButtonState(false);
    }
}

async function openRazorpayCheckout(orderResponse, user) {
    await loadRazorpayCheckoutScript();

    if (!window.Razorpay) {
        showPaymentToast('Payment gateway is not available. Please try again later.', 'error');
        return false;
    }

    const orderId = orderResponse.orderId || orderResponse.order_id || orderResponse.id;
    const amount = Number(orderResponse.amount || PAYMENT_CONFIG.AMOUNT);
    const currency = orderResponse.currency || PAYMENT_CONFIG.CURRENCY;

    const options = {
        key: PAYMENT_CONFIG.RAZORPAY_KEY_ID,
        amount,
        currency,
        name: PAYMENT_CONFIG.BRAND_NAME,
        description: PAYMENT_CONFIG.DESCRIPTION,
        image: PAYMENT_CONFIG.LOGO_URL || undefined,
        order_id: orderId,
        prefill: {
            name: user.name,
            email: user.email,
            contact: user.mobile || ''
        },
        notes: {
            userId: user.id,
            planName: PAYMENT_CONFIG.PLAN_NAME,
            checkoutMode: user.isGuest ? 'guest' : 'logged-in'
        },
        theme: {
            color: PAYMENT_CONFIG.THEME_COLOR
        },
        modal: {
            ondismiss: function() {
                showPaymentToast('Payment failed or cancelled. Please try again.', 'error');
            }
        },
        handler: async function(response) {
            await handlePaymentSuccess(response);
        }
    };

    const checkout = new window.Razorpay(options);
    checkout.on('payment.failed', handlePaymentFailure);
    checkout.open();
    return true;
}

async function handlePaymentSuccess(response) {
    try {
        setSubscribeButtonState(true, 'Verifying...');
        const user = getPaymentUser();
        const verified = await savePaymentToGoogleSheet(response);

        if (!verified.success) {
            showPaymentToast(verified.message || 'Payment verification failed. Please contact support.', 'error');
            return;
        }

        persistSubscriptionStatus('ACTIVE');
        activateGuestPaymentSession(user);
        localStorage.setItem('subscriptionDate', new Date().toISOString());
        showPaymentToast('Payment successful. Your AJB Premium access is now active.', 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);
    } catch (error) {
        console.error('Payment success handling failed:', error);
        showPaymentToast('Apps Script error while verifying payment. Please contact support.', 'error');
    } finally {
        setSubscribeButtonState(false);
    }
}

async function savePaymentToGoogleSheet(response) {
    const user = getPaymentUser();
    if (!user) {
        return { success: false, message: 'Payment user details are missing. Please try again.' };
    }

    return verifyRazorpayPayment(
        response.razorpay_payment_id,
        response.razorpay_order_id,
        response.razorpay_signature,
        user.id,
        PAYMENT_CONFIG.AMOUNT,
        PAYMENT_CONFIG.PLAN_NAME,
        user
    );
}

function handlePaymentFailure(response) {
    console.error('Payment failed:', response);
    showPaymentToast('Payment failed or cancelled. Please try again.', 'error');
}

function checkSubscriptionStatus() {
    return localStorage.getItem('isSubscribed') === 'true' ||
        normalizeSubscriptionStatus(localStorage.getItem('subscriptionStatus'));
}

function getSubscriptionInfo() {
    return {
        subscriptionDate: localStorage.getItem('subscriptionDate'),
        subscriptionStatus: localStorage.getItem('subscriptionStatus') || 'INACTIVE',
        planName: PAYMENT_CONFIG.PLAN_NAME,
        amount: PAYMENT_CONFIG.AMOUNT
    };
}

async function subscribe() {
    return initializePayment();
}

const paymentManager = {
    isSubscriptionActive: checkSubscriptionStatus,
    verifySubscriptionStatus,
    initializePayment,
    openRazorpayCheckout,
    handlePaymentSuccess,
    savePaymentToGoogleSheet
};

document.addEventListener('DOMContentLoaded', async function() {
    const subscribeBtn = document.getElementById('subscribeBtn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', initializePayment);
    }

    if (document.body.dataset.page === 'subscription') {
        const subscription = await verifySubscriptionStatus();
        if (subscription.isSubscribed) {
            setSubscribeButtonState(false, 'Already Unlocked');
        }
    }

    const paymentLinkBtn = document.getElementById('paymentLinkBtn');
    if (paymentLinkBtn && PAYMENT_CONFIG.PAYMENT_LINK) {
        paymentLinkBtn.href = PAYMENT_CONFIG.PAYMENT_LINK;
    }
});
