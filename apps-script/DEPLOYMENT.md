# AJB LEARN Apps Script Deployment

## 1. Create the backend

1. Open the target Google Spreadsheet.
2. Select **Extensions > Apps Script**.
3. Replace the editor contents with `apps-script/Code.gs`.
4. Open **Project Settings > Script Properties**.
5. Add the properties listed below.
6. Run `setupSheets()` once and approve the requested permissions.

For a standalone Apps Script project, set `SPREADSHEET_ID`. A spreadsheet-bound
project can omit it.

## 2. Required Script Properties

```text
ADMIN_API_KEY=use-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-strong-admin-password
SUPPORT_EMAIL=support@example.com
DEFAULT_PHONE_COUNTRY_CODE=+91
```

`RESET_OTP_PEPPER` is created automatically on the first email OTP request. You
may set it yourself to a long random value before launch. Do not change it while
unexpired email OTP requests exist.

For phone OTP by SMS, create a Twilio Verify Service and add:

```text
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Email OTP works through Google Apps Script `MailApp` without Twilio. Phone OTP
shows a configuration error until all three Twilio properties are present.

## 3. Deploy the Web App

1. Select **Deploy > New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Deploy and copy the `/exec` Web App URL.
6. Put that URL in `CONFIG.APPS_SCRIPT_URL` inside `js/api.js`.

Browser POST calls must use:

```js
headers: { 'Content-Type': 'text/plain;charset=utf-8' }
```

This avoids an Apps Script CORS preflight.

## 4. Password Reset Behavior

- Email and phone resets use the registered contact stored in `USERS`.
- Email OTPs are hashed before being stored.
- OTP requests expire after 10 minutes.
- Each request allows five verification attempts.
- A user can request at most three OTPs in 15 minutes.
- A successful reset revokes all active sessions for that student.
- `PASSWORD_RESETS` and `SESSIONS` are created by `setupSheets()`.

## 5. Release Checklist

- Test registration with a new email and phone.
- Test login by email and phone.
- Test email OTP delivery and password reset.
- Test SMS OTP with a verified Twilio destination while the account is in trial mode.
- Confirm an expired or reused OTP is rejected.
- Confirm the old password fails after reset.
- Confirm the new password succeeds.
- Confirm `CONFIG.APPS_SCRIPT_URL` uses the latest `/exec` deployment.
- Replace test payment credentials before accepting live payments.

## Updating the deployment

After changing `Code.gs`:

1. Select **Deploy > Manage deployments**.
2. Edit the Web App deployment.
3. Create a **New version**.
4. Deploy it.

## Troubleshooting: "Unable to reach the AJB LEARN backend"

That frontend message means the browser could not read a JSON response from
Apps Script. Check these items first:

1. `CONFIG.APPS_SCRIPT_URL` in `js/api.js` must be the latest Web App `/exec`
   URL, not the editor URL, `/dev` URL, or an old deployment.
2. The deployment must be **Web app**, **Execute as: Me**, and **Who has
   access: Anyone**.
3. After editing `Code.gs`, always create a **New version** in **Manage
   deployments**. Saving the script alone does not update the live `/exec`
   endpoint.
4. Open the `/exec?action=health` URL in a browser. It should return JSON with
   `success: true`; if it shows a Google sign-in, authorization, or HTML error
   page, redeploy with the settings above.
