# Before releasing to the App Store

Things in the code that are deliberately unfinished until release.

- [ ] **Support email.** Set `supportEmail` in `config/legal.json`. Until then
      Settings > Help Center says "Support email coming soon." Then run
      `npm run legal:export` so the hosted copies include it.
- [ ] **Review the Terms and Privacy Policy** in `config/legal.json` (they're a
      plain-language draft written from what the app does; have a lawyer look
      if you can). Update `effectiveDate` when you publish them, then run
      `npm run legal:export`.
- [ ] **Host the Privacy Policy** (`docs/privacy.md`, and `docs/terms.md`) at a
      public web address and enter that URL in App Store Connect.
- [ ] **App Store privacy answers** ("nutrition label") should match the
      Privacy Policy: name, email, phone (optional), photos, user content,
      coarse location is not collected (device location stays on the phone).
- [ ] **Age rating:** the Terms say 18+; set the App Store age rating to match.
- [ ] **`FIREBASE_STORAGE_BUCKET` is set on the server**, exactly as it appears
      in photo URLs (the part after `/v0/b/`, e.g. `your-app.firebasestorage.app`).
      The server only accepts photos from that bucket, so without it every
      new photo upload is refused.
