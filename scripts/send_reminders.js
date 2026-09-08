// Reads bills.json and emails a reminder if any bill is overdue or due within
// the next REMINDER_DAYS_AHEAD days. Intended to be run once a day by the
// GitHub Actions workflow in .github/workflows/reminders.yml
//
// Required environment variables (set as GitHub repo secrets):
//   EMAIL_USER  - the Gmail address used to send from (e.g. you@gmail.com)
//   EMAIL_PASS  - a Gmail "App Password" (NOT your normal password)
//   EMAIL_TO    - the address that should receive reminders (can be same as EMAIL_USER)

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const REMINDER_DAYS_AHEAD = 7;

function loadBills() {
  const file = path.join(__dirname, '..', 'bills.json');
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.round((due - today) / 86400000);
}

function fmtMoney(n) {
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function main() {
  const bills = loadBills();

  const overdue = [];
  const dueSoon = [];

  for (const bill of bills) {
    if (bill.paid) continue;
    const d = daysUntil(bill.due);
    if (d < 0) overdue.push({ ...bill, daysOver: -d });
    else if (d <= REMINDER_DAYS_AHEAD) dueSoon.push({ ...bill, daysLeft: d });
  }

  if (overdue.length === 0 && dueSoon.length === 0) {
    console.log('No overdue or upcoming bills. No email sent.');
    return;
  }

  const lines = [];
  if (overdue.length) {
    lines.push('OVERDUE:');
    overdue
      .sort((a, b) => b.daysOver - a.daysOver)
      .forEach(b => lines.push(`  - ${b.name}: ${fmtMoney(b.amount)}, ${b.daysOver} day(s) overdue (was due ${b.due})`));
    lines.push('');
  }
  if (dueSoon.length) {
    lines.push(`DUE WITHIN ${REMINDER_DAYS_AHEAD} DAYS:`);
    dueSoon
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .forEach(b => lines.push(`  - ${b.name}: ${fmtMoney(b.amount)}, due ${b.due} (${b.daysLeft} day(s) left)`));
  }

  const bodyText = lines.join('\n');
  const subject = `Bill reminder: ${overdue.length} overdue, ${dueSoon.length} due soon`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject,
    text: bodyText,
  });

  console.log('Reminder email sent:\n' + bodyText);
}

main().catch(err => {
  console.error('Failed to send reminders:', err);
  process.exit(1);
});
