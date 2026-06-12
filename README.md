# AJB LEARN

AJB Learn is a digital tuition platform for Assam Jatiya Bidyalaya students from Nursery to Class 10. It uses HTML, CSS, JavaScript, Google Apps Script, Google Sheets, and Razorpay.

## Payment System

The site now uses one subscription plan:

- Plan: AJB Premium
- Price: INR 299 one-time payment
- Access: all classes, subjects, mediums, videos, notes, quizzes, and course content
- Frontend key: Razorpay Key ID only
- Backend secret: Razorpay Key Secret stored only in Google Apps Script Properties

Payment flow:

1. Student registers.
2. Student logs in.
3. Student clicks any payment, subscribe, unlock, or Pay Now button.
4. The site redirects to `https://rzp.io/rzp/yLnOO4y`.
5. Student pays INR 299 on the Razorpay payment gateway.

## Files

```text
AJB-LEARN/
  index.html
  demo.html
  login.html
  register.html
  subscription.html
  dashboard.html
  course.html
  admin.html
  css/
  js/
    api.js
    auth.js
    payment.js
    dashboard.js
    admin.js
  apps-script/
    Code.gs
```

## Frontend Configuration

Open `js/api.js` and update:

```js
const CONFIG = {
    APPS_SCRIPT_URL: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",
    RAZORPAY_KEY_ID: "YOUR_RAZORPAY_KEY_ID",
    PLAN_AMOUNT: 29900,
    PLAN_AMOUNT_RUPEES: 299,
    PLAN_NAME: "AJB Premium",
    PLAN_DESCRIPTION: "Complete Course Access",
    BRAND_NAME: "AJB LEARN",
    THEME_COLOR: "#0F4C81",
    LOGO_URL: "assets/images/ajb-logo.png",
    RAZORPAY_PAYMENT_LINK: "https://rzp.io/rzp/yLnOO4y"
};
```

Do not put the Razorpay Key Secret in any frontend file.

The Razorpay payment link is used for instant payment collection. All payment CTAs redirect to this gateway.

## Google Sheets Setup

Deploy `apps-script/Code.gs` in Google Apps Script, then run `setupDatabase()` once. It creates or updates these sheets:

- `USERS`: `USER_ID`, `NAME`, `MOBILE`, `EMAIL`, `PASSWORD_HASH`, `REGISTER_DATE`, `SUBSCRIPTION_STATUS`, `ROLE`
- `PAYMENTS`: `PAYMENT_ID`, `USER_ID`, `NAME`, `EMAIL`, `MOBILE`, `AMOUNT`, `CURRENCY`, `PAYMENT_STATUS`, `RAZORPAY_PAYMENT_ID`, `RAZORPAY_ORDER_ID`, `RAZORPAY_SIGNATURE`, `PAYMENT_DATE`, `PLAN_NAME`
- `SUBSCRIPTIONS`: `SUBSCRIPTION_ID`, `USER_ID`, `PLAN_NAME`, `AMOUNT`, `START_DATE`, `END_DATE`, `STATUS`, `PAYMENT_ID`
- Content sheets: `CLASSES`, `SUBJECTS`, `CHAPTERS`, `VIDEOS`, `NOTES`, `QUIZZES`, `PROGRESS`

## Google Apps Script Properties

In Apps Script, go to Project Settings > Script Properties and add:

```text
SPREADSHEET_ID=your_google_sheet_id
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_EMAIL=admin@ajblearn.com
ADMIN_PASSWORD=change-this-password
```

For stronger admin security, store `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`. The backend hashes passwords with SHA256.

## Apps Script Deployment

1. Create a Google Sheet for the database.
2. Create a Google Apps Script project.
3. Paste `apps-script/Code.gs` into the script editor.
4. Add the Script Properties listed above.
5. Run `setupDatabase()` once and approve permissions.
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Copy the Web App URL.
10. Paste that URL into `CONFIG.APPS_SCRIPT_URL` in `js/api.js`.

## Razorpay Setup

1. Create or open your Razorpay account.
2. Use Test Mode first.
3. Copy the Razorpay Key ID to `js/api.js`.
4. Copy both Key ID and Key Secret to Apps Script Properties.
5. Keep the Key Secret out of GitHub, Netlify, Vercel, and all frontend files.
6. Test payments in Razorpay Test Mode.
7. Switch to Live Mode only after all tests pass.

## Access Control

- Demo content remains available before payment.
- `dashboard.html` requires login and ACTIVE subscription.
- `course.html` requires login and ACTIVE subscription.
- Locked course content shows: `Subscribe for INR 299 to unlock this course.`
- Unlock and payment buttons redirect to `https://rzp.io/rzp/yLnOO4y`.

## Admin Payment Panel

`admin.html` includes:

- Total revenue
- Total paid users
- Payment list
- Student name, email, mobile
- App payment ID
- Razorpay payment ID
- Amount, date, and status
- Filters by date, user query, and status

## Required Testing

Test in Razorpay Test Mode:

- Successful payment activates AJB Premium.
- Failed payment does not activate subscription.
- Cancelled payment shows a retry message.
- Duplicate payment verification returns an already-processed result.
- Dashboard redirects inactive users to the subscription page.
- Course page blocks inactive users and shows the unlock message.
- Admin payment filters work by date, user, and status.

## Hosting

The frontend can be hosted on GitHub Pages, Netlify, or Vercel. The backend runs as the deployed Google Apps Script Web App.

## Security Notes

- Razorpay orders are created on the backend.
- Razorpay signatures are verified on the backend.
- The Razorpay Key Secret is never exposed in browser JavaScript.
- Payment activation happens only after signature verification succeeds.
- Passwords are stored as SHA256 hashes in the Google Sheet.
