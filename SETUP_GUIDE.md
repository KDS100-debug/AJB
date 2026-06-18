# AJB LEARN - Complete Setup Guide

## Prerequisites

Before starting, ensure you have:

- [ ] Google account (for Google Sheets, Google Drive, Google Apps Script)
- [ ] Razorpay business account (for payment processing)
- [ ] GitHub account (for hosting frontend)
- [ ] Text editor (VS Code recommended)
- [ ] Basic knowledge of HTML, CSS, JavaScript, JSON

---

## Step 1: Google Sheets Setup

### 1.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Create new spreadsheet"**
3. Name it: **"AJB Learn Database"**

### 1.2 Create Database Sheets

Rename "Sheet1" to "USERS" and create 9 sheets total:

1. **USERS** - Student information
2. **SUBSCRIPTIONS** - Payment data
3. **CLASSES** - Class definitions
4. **SUBJECTS** - Subject information
5. **CHAPTERS** - Chapter structure
6. **VIDEOS** - Video content
7. **NOTES** - Study materials
8. **QUIZZES** - Quiz questions
9. **PROGRESS** - Student progress

### 1.3 Add Headers

For each sheet, add header row in row 1 with column names (see DATABASE_SCHEMA.md for details).

**Example for USERS sheet:**
```
Column A: User ID
Column B: Name
Column C: Mobile
Column D: Email
Column E: Password
Column F: Created Date
Column G: Status
```

Repeat for all sheets according to DATABASE_SCHEMA.md.

### 1.4 Add Sample Data

Add at least one sample entry in each sheet:

**USERS:**
```
USER1, Test User, 9876543210, test@example.com, pwd123, 2024-01-15T10:00:00Z, active
```

**CLASSES:**
```
CLASS1, Class 1, english
CLASS2, Class 2, english
CLASS10, Class 10, english
```

---

## Step 2: Google Apps Script Backend

### 2.1 Create Apps Script Project

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy all code from `GOOGLE_APPS_SCRIPT.gs`
4. Paste into the editor
5. Save the project (name: "AJB Learn API")

### 2.2 Get Sheet ID

1. In your Google Sheet, note the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
   ```
2. Go back to Apps Script
3. Find this line:
   ```javascript
   const SHEET_ID = 'YOUR_SHEET_ID';
   ```
4. Replace with your Sheet ID

### 2.3 Deploy as Web App

1. Click **Deploy → New deployment**
2. Select type: **Web app**
3. Execute as: **Your Google account**
4. New users can access: **Anyone**
5. Click **Deploy**
6. Copy the deployment URL shown (looks like):
   ```
   https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
   ```

### 2.4 Configure Admin Credentials

In Apps Script, find the `adminLogin()` function and update:
```javascript
const adminEmail = 'your-email@example.com';
const adminPassword = 'secure-password-here'; // Change this!
```

---

## Step 3: Razorpay Payment Setup

### 3.1 Create Razorpay Account

1. Go to [Razorpay](https://razorpay.com)
2. Sign up for business account
3. Complete KYC verification

### 3.2 Get Razorpay Keys

1. Go to Dashboard → Settings → API Keys
2. Copy **Key ID** (public key)
3. Copy **Key Secret** (keep secure!)

### 3.3 Update Project Files

In `js/payment.js`, find:
```javascript
const PAYMENT_CONFIG = {
    RAZORPAY_KEY: 'YOUR_RAZORPAY_KEY_ID',
    // ... other config
};
```

Replace `YOUR_RAZORPAY_KEY_ID` with your Key ID from Razorpay.

---

## Step 4: Frontend Configuration

### 4.1 Update API Endpoint

In all JavaScript files that make API calls, replace:
```javascript
'YOUR_GOOGLE_APPS_SCRIPT_URL'
```

With your deployment URL from Step 2.3:
```javascript
'https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent'
```

**Files to update:**
- `js/api.js` (at the top in base URL)
- `js/payment.js` (in Razorpay order creation)
- `js/dashboard.js` (in API calls)
- `js/admin.js` (in admin functions)

### 4.2 Update Admin Email

In `js/admin.js`, find admin credential check and update with your admin email:
```javascript
if (!userId || !isAdmin) {
    // Redirect to admin login
}
```

### 4.3 Configure CORS Headers (if needed)

If hosting on different domain, ensure CORS is configured in Apps Script:
```javascript
function doPost(e) {
    // Add CORS headers
    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Step 5: Frontend Hosting

### Option A: GitHub Pages

1. Create GitHub repository: `ajb-learn`
2. Upload all files (HTML, CSS, JS)
3. Go to Settings → Pages
4. Select: **Deploy from a branch**
5. Select: **main** branch, **/root** folder
6. Your site will be available at:
   ```
   https://yourusername.github.io/ajb-learn
   ```

### Option B: Netlify

1. Go to [Netlify](https://netlify.com)
2. Connect GitHub repository
3. Select repository: `ajb-learn`
4. Build settings: Leave default
5. Click **Deploy**
6. Your site will be available at:
   ```
   https://random-name.netlify.app
   ```

### Option C: Vercel

1. Go to [Vercel](https://vercel.com)
2. Import GitHub repository
3. Select: `ajb-learn`
4. Click **Deploy**
5. Your site will be available at:
   ```
   https://random-name.vercel.app
   ```

---

## Step 6: Domain Setup (Optional)

### 6.1 Purchase Domain

1. Use: GoDaddy, Namecheap, or Google Domains
2. Purchase domain: `ajblearn.com`

### 6.2 Point to Hosting

**For GitHub Pages:**
1. Go to repository Settings → Pages
2. Add custom domain: `ajblearn.com`
3. Update DNS settings from registrar:
   ```
   A: 185.199.108.153
   A: 185.199.109.153
   A: 185.199.110.153
   A: 185.199.111.153
   ```

**For Netlify:**
1. In Netlify: Site settings → Domain management
2. Add custom domain
3. Update DNS settings from registrar (Netlify will show exact settings)

---

## Step 7: SSL Certificate

### For Self-Hosted
1. Use [Let's Encrypt](https://letsencrypt.org)
2. Install certificate on server

### For Netlify/Vercel
- Automatic SSL included!

### For GitHub Pages
1. Use CloudFlare (free)
2. Point domain to CloudFlare nameservers
3. Enable SSL/TLS

---

## Step 8: Testing

### 8.1 Test Registration

1. Visit your site
2. Click **Register**
3. Fill form with test data:
   ```
   Name: Test Student
   Mobile: 9876543210
   Email: test@example.com
   Password: test123
   ```
4. Submit and verify success message

### 8.2 Test Login

1. Go to **Login**
2. Enter test credentials:
   ```
   Email: test@example.com
   Password: test123
   ```
3. Should redirect to subscription page (if not subscribed)

### 8.3 Test Payment Flow

1. On subscription page, click **UNLOCK ALL COURSES**
2. Razorpay modal should open
3. In test mode, use test card:
   ```
   Card: 4111 1111 1111 1111
   Expiry: Any future date
   CVV: Any 3 digits
   ```
4. Should process and redirect to dashboard

### 8.4 Test Admin Panel

1. Open `admin.html` directly (or add login route)
2. Login with admin credentials:
   ```
   Email: your-email@example.com
   Password: your-password
   ```
3. Verify dashboard loads with sample data

---

## Step 9: Production Checklist

- [ ] Replace all placeholder values (API URLs, Razorpay key, etc.)
- [ ] Update admin credentials
- [ ] Test all features on all devices
- [ ] Enable HTTPS on domain
- [ ] Set up email notifications
- [ ] Configure Google Analytics
- [ ] Test payment with live Razorpay key
- [ ] Backup Google Sheet
- [ ] Set up SSL certificate
- [ ] Test on mobile browsers
- [ ] Verify responsive design
- [ ] Check all links work correctly

---

## Step 10: Maintenance

### Regular Tasks

**Daily:**
- Monitor payment notifications
- Check error logs in Apps Script

**Weekly:**
- Backup Google Sheet
- Review student progress
- Check system performance

**Monthly:**
- Analyze analytics
- Update content/videos
- Review student feedback
- Update quiz questions

**Quarterly:**
- Security audit
- Performance optimization
- Feature updates
- User feedback implementation

---

## Troubleshooting

### Issue: API returning 403 error
**Solution:** 
- Check Google Apps Script deployment settings
- Ensure "Anyone" has access
- Verify CORS headers

### Issue: Razorpay payment not working
**Solution:**
- Verify API key is correct
- Check Razorpay account status
- Test with test mode first

### Issue: Google Sheet not updating
**Solution:**
- Verify sheet name spelling matches exactly
- Check column indices are correct
- Ensure user has sheet access

### Issue: Videos not loading
**Solution:**
- Verify YouTube links are correct
- Check if videos are public/unlisted
- Test with different video IDs

### Issue: Student data not syncing
**Solution:**
- Check localStorage permissions
- Verify session token generation
- Clear browser cache and try again

---

## Useful Resources

- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Razorpay Documentation](https://razorpay.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [MDN Web Docs](https://developer.mozilla.org/)
- [GitHub Pages Guide](https://pages.github.com/)

---

## Support

For issues or questions:
1. Check error console (F12)
2. Review API response in network tab
3. Check Google Apps Script logs
4. Contact support: support@ajblearn.com

---

**Setup Guide v1.0**  
Last Updated: 2024-01-15  
Time to Setup: ~30-45 minutes
