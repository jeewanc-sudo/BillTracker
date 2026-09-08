# Ledger — Bill & Invoice Tracker

A free-to-run dashboard for tracking which bills/invoices are paid, due soon,
or overdue — plus automatic email reminders, even when the page isn't open.

Everything here is free:
- **Dashboard hosting**: GitHub Pages (or Netlify/Vercel/Cloudflare Pages)
- **Data storage**: a `bills.json` file in your GitHub repo
- **Reminders**: a GitHub Actions workflow that runs once a day, for free
- **Email sending**: your own Gmail account (via an App Password)

## What you get

- `index.html` — the dashboard itself. Add bills, mark them paid, edit,
  delete, and see them grouped as Overdue / Due soon / Upcoming / Paid, with
  a running total of what's paid this month, due soon, and overdue.
- `bills.json` — where your bill data lives, in the repo.
- `scripts/send_reminders.js` + `.github/workflows/reminders.yml` — checks
  `bills.json` every day and emails you if anything is overdue or due within
  7 days (edit `REMINDER_DAYS_AHEAD` in the script to change that window).

## 1. Create the repo

1. Create a new **public or private** GitHub repository (e.g. `bill-dashboard`).
2. Upload all the files from this project into it (keep the folder structure,
   especially `.github/workflows/reminders.yml`).

## 2. Turn on GitHub Pages (free hosting)

1. In the repo, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)`.
3. Save. Your dashboard will be live at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## 3. Set up email sending (Gmail App Password — free)

1. Turn on 2-Step Verification on your Google account, if not already on.
2. Go to https://myaccount.google.com/apppasswords and create an App Password
   (choose "Mail" as the app).
3. Copy the 16-character password it gives you — you'll use it below.

## 4. Add repo secrets so the daily reminder can send email

In your repo: **Settings → Secrets and variables → Actions → New repository secret**.
Add three secrets:

| Name | Value |
|---|---|
| `EMAIL_USER` | your Gmail address, e.g. `you@gmail.com` |
| `EMAIL_PASS` | the App Password from step 3 |
| `EMAIL_TO` | where reminders should be sent (can be the same address) |

The workflow runs automatically every day at 08:00 UTC (edit the `cron` line
in `.github/workflows/reminders.yml` to change the time — cron times are in
UTC). You can also trigger it manually any time from the repo's **Actions**
tab → "Daily bill reminders" → "Run workflow", to test it.

## 5. Connect the dashboard to the same data (so reminders match what you see)

By default, the dashboard saves bills only in your browser (`localStorage`),
so the GitHub Action wouldn't see them. To fix that, open the dashboard, expand
**"Sync with GitHub"** near the top, and fill in:

- **GitHub username/org** and **repo name**
- A **personal access token**: go to
  https://github.com/settings/tokens → "Generate new token (classic)" →
  tick the `repo` scope → generate, and paste it in.

Then use:
- **Push to GitHub** after adding/editing bills, to save them to `bills.json`
  in the repo (this is what the daily reminder reads).
- **Load from GitHub** to pull the latest data if you're on a different device.

The token is stored only in your browser's `localStorage` — it isn't sent
anywhere except directly to GitHub's API.

> If you'd rather not deal with tokens, you can skip this step and just edit
> `bills.json` directly in GitHub whenever you add a bill — the dashboard
> will still work locally, and the reminder workflow reads straight from the
> repo file either way.

## Customizing

- Change the reminder window: edit `REMINDER_DAYS_AHEAD` in
  `scripts/send_reminders.js`.
- Change the reminder time: edit the `cron` schedule in
  `.github/workflows/reminders.yml`.
- Want SMS instead of email? Swap the `nodemailer` call in
  `send_reminders.js` for a free-tier API like Twilio or a webhook to
  something like ntfy.sh or Pushover.

## Data format

`bills.json` is a plain array, one object per bill:

```json
[
  {
    "id": "b_abc123",
    "name": "Electricity",
    "amount": 84.50,
    "due": "2026-09-15",
    "category": "Utilities",
    "recurring": "monthly",
    "paid": false,
    "paidOn": null
  }
]
```

`recurring` is one of `none`, `monthly`, `yearly`. Marking a recurring bill as
paid in the dashboard automatically creates the next occurrence.
