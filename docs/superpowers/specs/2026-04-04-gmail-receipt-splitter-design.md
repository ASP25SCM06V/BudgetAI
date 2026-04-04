# SpendShame — Gmail Scanner + Receipt Splitter Design

**Date:** 2026-04-04
**Features:** Feature 1 — Google Auth + Gmail Financial Scanner | Feature 2 — Smart Receipt Splitter

---

## Feature 1: Google Auth + Gmail Financial Scanner

### Goal
Allow users to connect their Gmail alongside Plaid so SpendShame can extract all financial activity from emails — shopping, credit card alerts, subscriptions, auto payments, insurance, pending payments, and purchase receipts — and feed them into the villain analysis.

### User Flow

1. **Landing page** shows inline consent terms listing exactly what will be accessed (Plaid bank data + Gmail financial emails). Single CTA: "I Accept — Connect My Bank".
2. User clicks → Plaid Link popup opens.
3. On Plaid success → Google OAuth popup opens automatically (no second button click).
4. Both data sources run in parallel: Plaid fetches bank transactions, Gmail API fetches financial emails.
5. Server merges both arrays → passes combined list to Claude `/api/analyze` → villain assigned → navigate to `/reveal`.

### Architecture

**Server additions:**
- `server/routes/auth.js` — `GET /api/auth/google` (initiates OAuth), `GET /api/auth/google/callback` (exchanges code for tokens, stores in memory)
- `server/services/gmailService.js` — fetches emails matching financial filters, calls Claude to extract structured data from each
- `server/store.js` — extended with `gmailTokens` (access + refresh token)

**Client additions:**
- `Landing.jsx` — updated with inline consent block + `consentGiven` state; after Plaid success, opens Google OAuth in a popup window; listens for `message` event from popup to know when Gmail auth is done
- `client/src/api/index.js` — add `fetchGmailTransactions()` call to `POST /api/gmail/transactions`
- `server/routes/gmail.js` — `POST /api/gmail/transactions` — uses stored Gmail tokens to fetch + extract emails

**Gmail API scope:** `https://www.googleapis.com/auth/gmail.readonly`

**Google OAuth credentials needed in `.env`:**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Email Categories & Extraction

Gmail query filters (run in parallel, results merged):

| Category | Gmail search query |
|---|---|
| Shopping / Orders | `subject:(order OR receipt OR confirmation OR purchase) category:primary` |
| Credit Card alerts | `subject:(transaction OR charged OR credit card OR statement) category:primary` |
| Subscriptions | `subject:(subscription OR renewal OR billing OR plan) category:primary` |
| Auto payments | `subject:(autopay OR automatic payment OR auto-pay) category:primary` |
| Insurance | `subject:(insurance OR premium OR policy payment) category:primary` |
| Pending payments | `subject:(pending OR payment due OR invoice) category:primary` |
| Purchases | `subject:(receipt OR paid OR payment confirmation) category:primary` |

**Extraction prompt (Claude):** Each matching email's subject + plain-text body is sent to Claude with:
- System: "Extract financial transaction data from this email. Return ONLY valid JSON: `{ merchant_name, amount, date, category }`. If no clear transaction found, return null."
- Null results are filtered out before merging.

**Deduplication:** After merging Plaid + Gmail transactions, deduplicate by `(merchant_name + amount + date)` to avoid double-counting the same transaction appearing in both sources.

### Landing Page — Inline Consent Block

Displayed above the CTA button. Contains:
- "By continuing you allow SpendShame to:"
- ✓ Connect your bank account and read transactions via Plaid
- ✓ Scan your Gmail for financial emails (receipts, subscriptions, card alerts, insurance, auto-payments)
- ✓ Analyze your spending with AI to assign your villain
- Fine print: "No data stored permanently. Read-only access."

`consentGiven` state — CTA button disabled until user has read and clicked (button is always enabled since consent is inline — user proceeds by clicking the CTA).

### Error Handling
- If Gmail OAuth fails or is denied → proceed with Plaid-only data, show toast: "Gmail skipped — using bank data only"
- If a batch of emails fails to parse → skip silently, use whatever extracted successfully
- If no financial emails found → proceed with Plaid transactions only

---

## Feature 2: Smart Receipt Splitter

### Goal
Let users upload a receipt photo or PDF, extract line items via Claude Vision, add names of people splitting the bill, choose a split mode, and track who has paid.

### User Flow

1. User clicks "Split a Receipt" button on the Dashboard (new button alongside "Ask for Help").
2. Navigates to `/split` page.
3. Uploads image (JPG/PNG) or PDF of receipt.
4. Server sends image to Claude Vision → returns structured line items + subtotal + tax + total.
5. User reviews extracted items (can edit inline).
6. User types names of people splitting (comma-separated or one-by-one).
7. User picks split mode:
   - **Equal** — total ÷ number of people (instant, no interaction)
   - **By Item** — user assigns each line item to a person via dropdown
   - **AI Split** — Claude looks at items and names, suggests a fair split with brief reasoning
8. Summary screen shows each person's amount owed.
9. User can tap "Mark Paid ✓" per person. Paid entries go green, crossed out.
10. Running "Still owed: $X" counter updates in real time.
11. Split state stored in-memory on server (keyed by a random split ID) + mirrored to `localStorage` on client for persistence across refreshes.

### Architecture

**New server route:** `server/routes/split.js`
- `POST /api/split/extract` — receives base64 image, sends to Claude Vision, returns `{ items: [{name, price}], subtotal, tax, total }`
- `POST /api/split/calculate` — receives `{ items, people, mode }`, returns `{ splits: [{person, amount, items[]}] }`
- `POST /api/split/save` — saves split state to in-memory store, returns `splitId`
- `PATCH /api/split/:id/pay` — marks a person as paid, returns updated split

**New server service:** `server/services/splitService.js`
- `extractReceiptData(base64Image)` — Claude Vision call, returns structured items
- `calculateSplit(items, people, mode)` — runs equal/item/AI logic
- In-memory splits store: `Map<splitId, SplitRecord>`

**New client page:** `client/src/pages/SplitReceipt.jsx`
- Step wizard: Upload → Review Items → Add People → Choose Mode → Summary
- `useLocalStorage` hook for split persistence
- File input accepts image/* and application/pdf (PDF converted to image client-side via `pdf.js` if needed — skip PDF for hackathon scope, images only)

**New client component:** `client/src/components/SplitSummary.jsx`
- Shows per-person amount + "Mark Paid" button
- Shows "Still owed" running total
- Reads from and writes to split state

**Router:** Add `<Route path="/split" element={<SplitReceipt />} />` to `App.jsx`

**Dashboard:** Add "Split a Receipt 🧾" button below the "Ask for Help" button.

### Claude Vision Prompt for Receipt Extraction

```
System: "You are a receipt parser. Extract all line items and totals from this receipt image. Return ONLY valid JSON with no markdown:
{ items: [{name: string, price: number}], subtotal: number, tax: number, total: number }
If a field is not visible, use null."
```

### Split Mode Logic

**Equal:** `amount = total / people.length` (rounded to 2 decimal places, last person absorbs rounding difference)

**By Item:** UI shows each item with a person dropdown. Unassigned items split equally among all. Person total = sum of their assigned items + their share of unassigned items + proportional tax.

**AI Split:** Send `{ items, people }` to Claude with prompt: "Suggest a fair split of this bill among these people based on the items. Return JSON: `{ splits: [{person, amount, reasoning}] }`. Be brief in reasoning (one phrase max)."

### Error Handling
- Image too large (>10MB) → client-side check, show error before upload
- Claude fails to parse receipt → show "Couldn't read receipt clearly — try a clearer photo"
- Split calculation error → fall back to equal split, show notice

---

## New `.env` variables required

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

## New npm packages required

**Server:** `googleapis` (Google OAuth + Gmail API)
**Client:** none (file input is native, Claude Vision handles OCR)

## What is NOT in scope

- Persistent database — all state is in-memory + localStorage
- Email notifications to split members
- Venmo/PayPal payment links
- PDF receipt support (images only)
- Multi-device sync for splits
- Gmail real-time push notifications
- Editing/deleting past splits

## File Map Summary

```
server/
  routes/
    auth.js          (new) Google OAuth endpoints
    gmail.js         (new) Gmail fetch + extract endpoint
    split.js         (new) Receipt extract, calculate, save, pay endpoints
  services/
    gmailService.js  (new) Gmail API wrapper + Claude extraction
    splitService.js  (new) Claude Vision OCR + split logic + in-memory store
  store.js           (modified) add gmailTokens

client/src/
  pages/
    Landing.jsx      (modified) inline consent, Gmail OAuth popup flow
    Dashboard.jsx    (modified) add Split Receipt button
    SplitReceipt.jsx (new) 5-step split wizard
  components/
    SplitSummary.jsx (new) per-person amounts + Mark Paid + still owed
  api/
    index.js         (modified) add gmailTransactions, splitExtract, splitCalculate, splitSave, splitPay
  App.jsx            (modified) add /split route
```
