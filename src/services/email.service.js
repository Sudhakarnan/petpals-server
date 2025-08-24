import { createTransporter } from '../config/mailer.js'

const from = process.env.SMTP_FROM || 'noreply@example.com'
let _tx = null
function tx() {
  if (_tx) return _tx
  try {
    _tx = createTransporter()
  } catch (err) {
    console.warn('Mailer init failed; using no-op. Reason:', err.message)
    _tx = { async sendMail() {} }
  }
  return _tx
}

export async function sendEmail({ to, subject, html }) {
  if (!to) return
  try {
    await tx().sendMail({ from, to, subject, html })
  } catch (err) {
    console.warn('Email send failed:', err.message)
  }
}
