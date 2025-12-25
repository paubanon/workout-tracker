To verify your Expo and EAS security posture, you should run these commands from your project root. These help you audit who has access, where your secrets are stored, and if your production updates are signed.

---

## EAS Security Verification Checklist

### 1. Audit Account & Project Permissions

The first step is ensuring only authorized users can push updates or access credentials.

- **Command:** `eas member:list`
    
- **What to check:** Verify that no former employees or unauthorized contractors have "Admin" or "Owner" access.
    
- **Command:** `eas project:info`
    
- **What to check:** Ensure the project is linked to the correct organization and not a personal account.
    

### 2. Verify EAS Secrets (Cloud)

Ensure sensitive keys (like Stripe Secret Keys or AWS Credentials) are stored in the cloud and not in your local environment files.

- **Command:** `eas secret:list`
    
- **What to check:** * Look for any secrets that look like they should be private but are missing from this list (meaning they might be hardcoded).
    
    - Ensure secrets are scoped to the correct environment (e.g., `production` vs `development`).
        

### 3. Check Code Signing (OTA Update Security)

This is the most critical security feature for Expo. It prevents unauthorized code from being executed on your users' devices.

- **Command:** `openssl x509 -in expo-updates-public-key.pem -text -noout` (If you have a local key)
    
- **What to check in code:** Check your `app.json` or `app.config.js` for the `updates.codeSigningCertificate` field.
    
- **Verification:** Run `eas update --preview` and check the EAS dashboard to ensure the "Signed" badge appears next to the update.
    

### 4. Audit Native Credentials

Check the health of your Android Keystore and iOS Distribution Certificates.

- **Command:** `eas credentials`
    
- **Action:** Select the platform (iOS/Android) and choose `production`.
    
- **What to check:** Ensure certificates are not expired and that "Push Notifications" or "Apple Sign-In" capabilities are only enabled if actually used.
    

---

## Automated Security Scan Commands

You can run these additional CLI tools to find "hidden" vulnerabilities in your JavaScript and Native layers:

|**Command**|**Purpose**|
|---|---|
|`npx expo-doctor`|Checks for mismatched dependencies and config issues.|
|`npm audit`|Finds known vulnerabilities in your `node_modules`.|
|`npx expo-env-config`|(Experimental) Shows exactly how your environment variables are resolved.|
|`eas build:view [ID]`|Reviews the build logs for any leaked secrets during the build process.|

---

## The "EAS Security Audit" Summary Table

|**Security Layer**|**Verification Action**|**Goal**|
|---|---|---|
|**Identity**|`eas whoami`|Ensure you aren't using a shared/insecure account.|
|**Integrity**|Check `eas.json` for `channel` mapping.|Prevent "Staging" code from leaking into "Production."|
|**Secrets**|Check `app.json` for `EXPO_PUBLIC_` prefixes.|Ensure no API keys are visible in the plain-text JS bundle.|
|**Delivery**|`eas update:list`|Monitor who is pushing code to your users and when.|
