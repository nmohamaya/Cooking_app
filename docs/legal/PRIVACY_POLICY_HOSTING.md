# Privacy Policy Hosting Guide

## Overview

The privacy policy for MyRecipeApp is located in [docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Hosting Options

### Option 1: GitHub Pages (Recommended - Free)

Host the privacy policy on GitHub Pages so it has a permanent URL that can be referenced in the Play Store listing.

#### Steps:

1. **Enable GitHub Pages** for your repository:
   - Go to repository Settings → Pages
   - Select `main` branch as source
   - Select `/docs` folder
   - Click Save

2. **Access the policy** at:
   ```
   https://nmohamaya.github.io/Cooking_app/PRIVACY_POLICY.md
   ```
   
   Or format as HTML at:
   ```
   https://github.com/nmohamaya/Cooking_app/blob/main/docs/PRIVACY_POLICY.md
   ```

### Option 2: Create HTML Version

Convert the markdown to HTML for better formatting:

```bash
# Install pandoc (if not already installed)
brew install pandoc  # macOS
# or
sudo apt-get install pandoc  # Ubuntu/Debian

# Convert to HTML
pandoc docs/PRIVACY_POLICY.md -o docs/privacy-policy.html
```

Then host the HTML file on GitHub Pages.

### Option 3: External Hosting

Host on a dedicated service:
- **Termly** (https://termly.io) - Paid, AI-generated policies
- **iubenda** (https://www.iubenda.com) - Paid, specialized for apps
- **Your own website** - Self-hosted on your domain

## Using in Play Store

### To add the privacy policy URL in Google Play Console:

1. Go to **App content** section
2. Find **Privacy policy** field
3. Enter the URL:
   ```
   https://github.com/nmohamaya/Cooking_app/blob/main/docs/PRIVACY_POLICY.md
   ```
   
   Or if using HTML on GitHub Pages:
   ```
   https://nmohamaya.github.io/Cooking_app/privacy-policy.html
   ```

4. Save the listing

## Important Notes

### Review Before Submission
- Ensure all placeholder information is updated
- Replace email address with actual contact: `privacy@myrecipeapp.com`
- Update company address and mailing address
- Verify all third-party service policies are linked correctly

### Keep Updated
- Review and update the policy annually
- Update whenever you:
  - Add new data collection features
  - Change third-party services
  - Change data retention policies
  - Update privacy practices

### Legal Compliance
- This template should be reviewed by a lawyer before submission
- Ensure compliance with:
  - **GDPR** (for EU users)
  - **CCPA** (for California residents)
  - **Google Play policies** (https://play.google.com/about/privacy-security-deception/)
  - Local privacy laws in your jurisdiction

## Privacy Policy Checklist for Play Store

- [ ] Privacy policy is accessible at a permanent URL
- [ ] Policy covers all data collection and use
- [ ] Policy discloses third-party services (Anthropic Claude API)
- [ ] Policy explains local storage and data retention
- [ ] Policy describes user rights and data deletion options
- [ ] Contact information is provided
- [ ] Policy is in English (or translated appropriately)
- [ ] Policy does not contain misleading information
- [ ] Policy is reviewed by legal counsel
- [ ] URL is added to Play Store listing

## Updating the Privacy Policy

When you need to update the privacy policy:

1. Update [docs/PRIVACY_POLICY.md](PRIVACY_POLICY.md)
2. Update the "Last Updated" date at the top
3. Document what changed in a changelog (optional)
4. Commit and push changes
5. If using GitHub Pages, it updates automatically
6. Notify users of material changes through app or email

## Example: Adding New Data Collection

If you add a new feature that collects data:

1. Add section to Section 2 (Information We Collect)
2. Explain use case in Section 3 (How We Use)
3. Add data retention info in Section 8
4. Update effective date
5. Notify users of the change

---

**Important**: Always ensure your privacy policy accurately reflects your actual data practices. Misleading users about privacy can result in app removal from Play Store and legal consequences.
