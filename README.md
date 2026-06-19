# Fraud Recovery & Investigation Program (FRIP) Portal

A high-fidelity, secure, and user-friendly multi-step portal designed for victims of fraud to securely submit details, digital evidence, and transaction records to recovery specialists. 

This application uses a supportive, stress-reducing design and official branding style guidelines to ensure trustworthiness and accessibility.

## 🚀 Features

- **6-Step Application Wizard**:
  1. **Victim Information**: Basic details and contact information.
  2. **Incident Details**: Type of fraud, dates, narrative description.
  3. **Financial Transactions**: Dynamic row additions for tracking transactions across multiple dates/amounts.
  4. **Fraudster Details**: Information on the suspect (phone numbers, emails, websites).
  5. **Evidence Vault**: Drag-and-drop file uploader with real-time simulated progress.
  6. **Consent & Signature**: HTML5 Canvas-based signature pad for consent verification.
- **Auto-Save Progress**: Caches progress locally using `localStorage` so victims can resume if they close the browser.
- **Responsive Layout**: Optimized for both desktop displays and mobile screens.
- **Premium Aesthetics**: Features smooth transitions, clean typography, secure badges, and a custom dark statistics panel showing impact metrics.

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid), and Modern ES6+ JavaScript.
- **Libraries**: Zero dependencies. Completely lightweight and fast-loading.

## 💻 Running the Project Locally

To run the project, simply open `index.html` in any web browser, or serve it locally:

```bash
# Using Python
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.
