Integrating your security audits into a CI/CD pipeline ensures that no code reaches your users unless it passes your UI, React, and Security benchmarks.

Below is a **GitHub Actions** configuration designed for an Expo/React Native project. It automates the "Security Audit" by running static analysis, credential checks, and preventing insecure deployments.

---

## The Secure CI/CD Workflow (`.github/workflows/security-audit.yml`)

YAML

```
name: Expo Security & Quality Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: 🏗 Checkout Repository
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Install Dependencies
        run: npm ci

      # 1. Dependency Security Scan
      - name: 🛡️ Audit Dependencies
        run: npm audit --audit-level=high

      # 2. Secret Leak Detection (Scanning for keys in code)
      - name: 🔍 Scan for Secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

      # 3. Expo-Specific Configuration Audit
      - name: 🩺 Expo Doctor
        run: npx expo-doctor

      # 4. Linting & UI Consistency (Using your custom rules)
      - name: 🎨 Linting & Code Standards
        run: npm run lint

      # 5. Verify EAS Update Code Signing (Production only)
      - name: 🔑 Verify Code Signing Configuration
        if: github.ref == 'refs/heads/main'
        run: |
          if ! grep -q "codeSigningCertificate" app.json; then
            echo "CRITICAL: Code signing is missing in app.json for production!"
            exit 1
          fi

  deploy_preview:
    needs: audit
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: 🚀 Deploy to EAS Preview Channel
        uses: expo/expo-github-action@v8
        with:
          eas-cache: true
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          command: eas update --auto --channel preview
```

---

## Security Gates in the Pipeline

### Why these steps matter:

1. **`npm audit --audit-level=high`**: Immediately kills the build if you are using a library with a known critical vulnerability (like an old version of `axios` or `expo-router`).
    
2. **TruffleHog**: Scans your commit history for API keys or private certificates that might have been accidentally committed.
    
3. **Code Signing Check**: A custom script that ensures you haven't accidentally disabled **EAS Code Signing** for your main branch.
    
4. **Expo Doctor**: Ensures that your native versions (SDK) match your JS versions, preventing "Runtime Mismatch" crashes.
    

---

## Pipeline Best Practices (2025)

|**Feature**|**Implementation**|**Why?**|
|---|---|---|
|**EXPO_TOKEN**|GitHub Encrypted Secrets|Prevents unauthorized persons from triggering builds.|
|**Environments**|Use GitHub Environments|Protects your `main` branch with manual approval steps.|
|**Artifacts**|`actions/upload-artifact`|Store build logs for 30 days to audit failed security scans.|
|**Short-Lived Tokens**|Use OIDC with AWS/GCP|Avoids using long-lived IAM keys in your CI.|

---

### How to use the "AI Agent" with this Pipeline

You can now direct your AI Agent (the one we built in the previous steps) to **maintain** this pipeline:

> "Review my `.github/workflows` folder. Ensure the security audit job includes a check for `EXPO_PUBLIC_` variables and verifies that `eas-cli` is always pinned to a safe version."
