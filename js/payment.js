/* AJB LEARN - Razorpay checkout backed by Google Sheets */

function setSubscribeButtonState(loading, text = 'Unlock AJB Premium') {
  const button = document.getElementById('subscribeBtn');
  if (!button) return;
  button.setAttribute('aria-disabled', loading ? 'true' : 'false');
  button.style.pointerEvents = loading ? 'none' : '';
  button.innerHTML = loading ? 'Processing...' : `${text} <i data-lucide="arrow-right" size="16"></i>`;
  window.lucide?.createIcons();
}

function paymentMessage(message, type = 'info') {
  const element = document.getElementById('paymentMessage');
  if (element) {
    element.textContent = message;
    element.style.color = type === 'error' ? '#ff8b90' : type === 'success' ? '#63d6a0' : '#a9a9b0';
  }
}

async function initializePayment(event) {
  event?.preventDefault();
  if (!getSessionToken()) {
    location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
    return;
  }
  if (!window.Razorpay) {
    paymentMessage('Razorpay Checkout could not be loaded.', 'error');
    return;
  }
  try {
    setSubscribeButtonState(true);
    const subscription = await checkSubscription();
    if (subscription.isSubscribed) {
      paymentMessage('AJB Premium is already active on this account.', 'success');
      setSubscribeButtonState(false, 'Already Unlocked');
      return;
    }
    const user = (await getUserProfile()).user;
    const order = await createRazorpayOrder(user.id, user.email, CONFIG.PLAN_AMOUNT, CONFIG.PLAN_NAME);
    const razorpay = new Razorpay({
      key: CONFIG.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: CONFIG.BRAND_NAME,
      description: CONFIG.PLAN_DESCRIPTION,
      order_id: order.orderId,
      image: CONFIG.LOGO_URL,
      prefill: { name: user.name, email: user.email, contact: user.mobile },
      theme: { color: CONFIG.THEME_COLOR },
      handler: async (response) => {
        try {
          await verifyRazorpayPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            user.id,
            CONFIG.PLAN_AMOUNT,
            CONFIG.PLAN_NAME
          );
          paymentMessage('Payment verified. AJB Premium is active.', 'success');
          setSubscribeButtonState(false, 'Premium Active');
          setTimeout(() => { location.href = 'dashboard.html'; }, 900);
        } catch (error) {
          paymentMessage(error.message, 'error');
          setSubscribeButtonState(false);
        }
      },
      modal: {
        ondismiss() {
          paymentMessage('Checkout closed. No payment was recorded.');
          setSubscribeButtonState(false);
        }
      }
    });
    razorpay.on('payment.failed', (response) => {
      paymentMessage(response.error?.description || 'Payment failed.', 'error');
      setSubscribeButtonState(false);
    });
    razorpay.open();
  } catch (error) {
    paymentMessage(error.message, 'error');
    setSubscribeButtonState(false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const button = document.getElementById('subscribeBtn');
  button?.addEventListener('click', initializePayment);
  if (!getSessionToken()) {
    paymentMessage('Login is required so the payment can activate your Google Sheets subscription record.');
    return;
  }
  try {
    const profile = await getUserProfile();
    document.getElementById('buyerName').value = profile.user.name || '';
    document.getElementById('buyerEmail').value = profile.user.email || '';
    document.getElementById('buyerMobile').value = profile.user.mobile || '';
    const subscription = await checkSubscription(profile.user.id);
    if (subscription.isSubscribed) setSubscribeButtonState(false, 'Already Unlocked');
  } catch (error) {
    paymentMessage(error.message, 'error');
  }
});
