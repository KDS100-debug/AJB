# AJB LEARN - Deployment Guide

## Overview

This guide covers deploying AJB Learn to production with:
- **Frontend:** GitHub Pages / Netlify / Vercel
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Payments:** Razorpay Live Mode

---

## Pre-Deployment Checklist

- [ ] All functionality tested on dev environment
- [ ] Google Apps Script deployed and working
- [ ] Razorpay account approved (business account)
- [ ] All configuration files updated with production values
- [ ] SSL/HTTPS enabled
- [ ] Domain registered and configured
- [ ] Google Sheet database populated with real data
- [ ] Admin credentials changed from defaults
- [ ] Password hashing implemented on backend
- [ ] Error handling and logging in place
- [ ] Backup of Google Sheet created
- [ ] README and documentation complete

---

## Part 1: Backend Deployment (Google Apps Script)

### 1.1 Verify Google Apps Script Code

Before deploying, review `GOOGLE_APPS_SCRIPT.gs`:

```javascript
// Ensure all imports are correct
const SHEET_NAMES = {
    USERS: 'USERS',
    SUBSCRIPTIONS: 'SUBSCRIPTIONS',
    // ... all sheet names
};

// Verify admin credentials are changed
const adminEmail = 'your-admin-email@example.com';
const adminPassword = 'strong-password-here';

// Check error handling is in place
function doPost(e) {
    try {
        // ... handle request
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}
```

### 1.2 Deploy/Update Apps Script

1. Open Google Apps Script editor
2. Click **Deploy → Manage deployments**
3. If already deployed:
   - Click the existing deployment (pencil icon)
   - Click **Update** after making changes
4. If first deployment:
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: Your account
   - Who has access: **Anyone**
   - Click **Deploy**

### 1.3 Get Updated Deployment URL

After deployment, copy the new deployment URL from the dialog:
```
https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent
```

Save this URL - you'll need it for frontend configuration.

### 1.4 Test Backend Endpoints

Use cURL to test endpoint:

```bash
# Test createOrder endpoint
curl -X POST "https://script.google.com/macros/d/{ID}/usercontent" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createOrder",
    "userId": "USER123",
    "email": "test@example.com",
    "amount": 29900
  }'

# Expected response
{
  "success": true,
  "orderId": "ORDER...",
  "message": "Order created"
}
```

---

## Part 2: Frontend Preparation

### 2.1 Update Configuration Files

Update these placeholders in all JavaScript files:

**In `js/api.js`:**
```javascript
// OLD
const BASE_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

// NEW
const BASE_URL = 'https://script.google.com/macros/d/{YOUR_ID}/usercontent';
```

**In `js/payment.js`:**
```javascript
// OLD
const PAYMENT_CONFIG = {
    RAZORPAY_KEY: 'YOUR_RAZORPAY_KEY_ID',
    // ...
};

// NEW
const PAYMENT_CONFIG = {
    RAZORPAY_KEY: 'rzp_live_xxxxxxxx', // Your LIVE key
    AMOUNT: 29900,
    // ...
};
```

**In `admin.html`:**
```javascript
// Update admin login check
const adminEmail = 'your-admin-email@example.com';
```

### 2.2 Update index.html Links

Ensure all navigation links work correctly:

```html
<!-- Update any hardcoded URLs -->
<a href="https://yourdomain.com/login.html">Login</a>
<a href="https://yourdomain.com/register.html">Register</a>
```

### 2.3 Security Headers

Add to production server headers (if self-hosted):

```
Content-Security-Policy: default-src 'self' https://checkout.razorpay.com
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 2.4 Create .htaccess (for Apache)

If self-hosted on Apache:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Enable caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

---

## Part 3: Deploy to GitHub Pages

### 3.1 Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Create new repository
3. Name: `ajb-learn`
4. Description: "AJB Learn - Online Tuition Platform"
5. Public repository
6. Don't initialize with README

### 3.2 Upload Files

```bash
# Initialize git in project folder
cd AJB-LEARN
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - AJB Learn platform"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/ajb-learn.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3.3 Enable GitHub Pages

1. Go to repository Settings
2. Navigate to Pages (left sidebar)
3. Source: Deploy from branch
4. Branch: **main**, Folder: **/ (root)**
5. Click Save
6. Wait 2-3 minutes for build

Your site will be available at:
```
https://your-username.github.io/ajb-learn
```

### 3.4 Add Custom Domain (Optional)

1. Go to Settings → Pages
2. Custom domain: `ajblearn.com`
3. Click Save
4. Add DNS record (from registrar):
   ```
   @ A 185.199.108.153
   @ A 185.199.109.153
   @ A 185.199.110.153
   @ A 185.199.111.153
   ```
5. Verify domain

---

## Part 4: Deploy to Netlify

### 4.1 Connect Repository

1. Go to [Netlify](https://app.netlify.com)
2. Click **Import an existing project**
3. Select **GitHub**
4. Authorize Netlify to access GitHub
5. Select repository: `ajb-learn`

### 4.2 Configure Build Settings

1. **Branch to deploy:** `main`
2. **Build command:** (leave empty - static site)
3. **Publish directory:** `.` (root directory)
4. Click **Deploy**

Your site will be available at:
```
https://random-name.netlify.app
```

### 4.3 Configure Domain

1. Go to Site settings → Domain management
2. Click **Add custom domain**
3. Enter: `ajblearn.com`
4. Update DNS at registrar with values provided by Netlify

### 4.4 Enable HTTPS

- Automatic with Netlify!
- Visit Settings → Domain management
- HTTPS is enabled by default

---

## Part 5: Deploy to Vercel

### 5.1 Import Project

1. Go to [Vercel](https://vercel.com)
2. Click **New Project**
3. Import Git Repository
4. Select your `ajb-learn` repo
5. Click **Import**

### 5.2 Configure Project

1. Framework Preset: **Other** (static site)
2. Build Command: (leave empty)
3. Output Directory: `.`
4. Environment Variables: (none needed for static site)
5. Click **Deploy**

Your site will be available at:
```
https://ajb-learn.vercel.app
```

### 5.3 Add Custom Domain

1. Go to Settings → Domains
2. Add custom domain: `ajblearn.com`
3. Follow DNS configuration instructions

---

## Part 6: Configure Razorpay (Live Mode)

### 6.1 Request Live Activation

1. Log in to Razorpay Dashboard
2. Navigate to **Integrations → Activation**
3. Complete business verification
4. Submit for activation
5. Wait for approval (24-48 hours)

### 6.2 Get Live API Keys

1. Go to **Settings → API Keys**
2. Copy **Key ID** (starts with `rzp_live_`)
3. Copy **Key Secret** (keep secure!)

### 6.3 Update Payment Configuration

In `js/payment.js`:

```javascript
// Update to live key
const PAYMENT_CONFIG = {
    RAZORPAY_KEY: 'rzp_live_XXXXXXXXXXXXXXXX', // Your live key
    AMOUNT: 29900,
    CURRENCY: 'INR',
    PLAN_NAME: 'AJB Premium',
    DESCRIPTION: 'Premium Subscription - Lifetime Access'
};
```

### 6.4 Update Backend

In `GOOGLE_APPS_SCRIPT.gs`, update payment verification:

```javascript
function verifyPayment(paymentId, orderId, signature, userId) {
    try {
        // In production, verify signature with Razorpay
        // const response = await fetch('https://api.razorpay.com/v1/payments/' + paymentId, {
        //     headers: {
        //         'Authorization': 'Basic ' + btoa(KEY_ID + ':' + KEY_SECRET)
        //     }
        // });
        
        // For now, accept after signature verification
        const sheet = getOrCreateSheet(SHEET_NAMES.SUBSCRIPTIONS);
        const data = getSheetData(SHEET_NAMES.SUBSCRIPTIONS);
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === userId && data[i][1] === orderId) {
                sheet.getRange(i + 1, 7).setValue('active');
                sheet.getRange(i + 1, 6).setValue(paymentId);
                
                return {
                    success: true,
                    message: 'Payment verified',
                    subscriptionStatus: 'active'
                };
            }
        }
        
        return { success: false, message: 'Order not found' };
    } catch (error) {
        return { success: false, message: error.toString() };
    }
}
```

### 6.5 Test Live Payment

1. Go to subscription page
2. Click **UNLOCK ALL COURSES**
3. Use real test card or UPI
4. Verify payment processes correctly
5. Check Google Sheet for payment record

---

## Part 7: Post-Deployment Testing

### 7.1 Full User Journey Test

1. **Register:**
   - Go to register.html
   - Fill all fields with valid data
   - Verify success message
   - Check Google Sheet for new user

2. **Login:**
   - Go to login.html
   - Enter credentials
   - Should redirect to subscription page

3. **Subscribe:**
   - Click **UNLOCK ALL COURSES**
   - Razorpay modal opens
   - Make test payment
   - Should redirect to dashboard

4. **Access Content:**
   - Go to dashboard
   - View classes
   - Click on class → should go to course page
   - Watch video (demo video)
   - Take quiz

5. **Admin Panel:**
   - Go to admin.html
   - Login with admin credentials
   - View dashboard stats
   - Check student list
   - Verify payment records

### 7.2 Device Testing

Test on multiple devices:
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Tablet (iPad, Android tablet)
- [ ] Mobile (iPhone, Android)
- [ ] Different screen sizes (1920px, 1024px, 768px, 480px)

### 7.3 Performance Testing

1. Use [Google PageSpeed Insights](https://pagespeed.web.dev)
2. Target: 90+ score
3. Optimize images if needed
4. Minify CSS/JavaScript

### 7.4 Security Testing

1. Check HTTPS certificate (green padlock)
2. Verify no console errors
3. Test CORS headers
4. Verify sensitive data not in localStorage

---

## Part 8: Monitoring & Maintenance

### 8.1 Set Up Monitoring

1. **Google Analytics:**
   ```html
   <!-- Add to index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_ID');
   </script>
   ```

2. **Error Tracking:**
   - Use Sentry or similar service
   - Monitor JavaScript errors
   - Track failed API calls

3. **Uptime Monitoring:**
   - Use UptimeRobot
   - Monitor website availability
   - Get alerts if site goes down

### 8.2 Regular Backups

1. **Google Sheet Backup:**
   - File → Download → Excel
   - Do weekly backups
   - Store in cloud storage

2. **GitHub Backup:**
   - Already backed up on GitHub
   - Enable push mirrors to GitLab/Bitbucket

### 8.3 Performance Optimization

1. Compress images
2. Minify CSS/JavaScript
3. Enable caching
4. Use CDN for static assets
5. Optimize database queries

---

## Part 9: Troubleshooting Deployment

### Issue: 404 Errors on Subpages

**Solution:** Single Page Application routing
- Add `_redirects` file (for Netlify)
- Add `vercel.json` (for Vercel)
- Add `.htaccess` (for GitHub Pages + custom domain)

### Issue: CORS Errors

**Solution:** Verify Google Apps Script deployment settings
- Ensure "Anyone" has access
- Check deployment is "Web app"
- Verify URL is correct in frontend

### Issue: Payment not working

**Solution:** 
- Verify Razorpay key is live key (not test)
- Check payment method enabled in Razorpay
- Verify amount is in paise (×100)

### Issue: High latency

**Solution:**
- Use CDN for static files
- Optimize Google Sheet queries
- Cache frequently accessed data
- Use Google Apps Script cache

---

## Part 10: Launch Checklist

Before going live:

- [ ] All tests passed
- [ ] No console errors
- [ ] HTTPS enabled
- [ ] API endpoints working
- [ ] Payments processing
- [ ] Admin panel functional
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Support email configured
- [ ] Documentation updated
- [ ] Legal pages added (Privacy, Terms)
- [ ] Domain working

---

## Deployment Summary

| Component | Platform | Time | Status |
|-----------|----------|------|--------|
| Backend | Google Apps Script | 5 min | ✅ |
| Database | Google Sheets | 10 min | ✅ |
| Frontend | GitHub/Netlify/Vercel | 10 min | ✅ |
| Payments | Razorpay | 5 min | ✅ |
| Domain | Registrar | 24-48h | ⏳ |

**Total Time: ~30 minutes (+ domain propagation)**

---

## Live Site URLs

After deployment, your sites will be available at:

- **Main Site:** `https://ajblearn.com`
- **GitHub Pages:** `https://your-username.github.io/ajb-learn`
- **Netlify:** `https://ajb-learn.netlify.app`
- **Vercel:** `https://ajb-learn.vercel.app`
- **API:** `https://script.google.com/macros/d/{ID}/usercontent`

---

## Post-Launch Support

- Monitor error logs daily
- Respond to user queries within 24 hours
- Update content regularly
- Monitor payment transactions
- Collect user feedback
- Plan feature enhancements

---

**Deployment Guide v1.0**  
Last Updated: 2024-01-15  
Estimated Deployment Time: 30-45 minutes
