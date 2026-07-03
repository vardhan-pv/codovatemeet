import nodemailer from 'nodemailer'

const transporter = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const brevoApiKey = process.env.BREVO_API_KEY
  if (brevoApiKey && brevoApiKey !== 'your_brevo_api_key_here') {
    // If it is an SMTP Master Key (starts with xsmtpsib-), use Brevo SMTP Relay
    if (brevoApiKey.startsWith('xsmtpsib-')) {
      try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@codovate.com'
        const senderName = process.env.BREVO_SENDER_NAME || 'CodovateMeet'

        const brevoTransporter = nodemailer.createTransport({
          host: 'smtp-relay.brevo.com',
          port: 587,
          secure: false, // TLS
          auth: {
            user: process.env.BREVO_LOGIN_EMAIL || senderEmail,
            pass: brevoApiKey
          }
        })

        await brevoTransporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to,
          subject,
          text,
          html
        })

        console.log(`[BREVO SMTP SUCCESS] Email successfully dispatched to ${to}`)
        return true
      } catch (err: any) {
        console.error(`[BREVO SMTP ERROR] Failed to send email to ${to}:`, err.message)
      }
    } else {
      // Otherwise, use Brevo Transactional Email HTTP API (for keys starting with xkeysib- or similar)
      try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@codovate.com'
        const senderName = process.env.BREVO_SENDER_NAME || 'CodovateMeet'

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': brevoApiKey
          },
          body: JSON.stringify({
            sender: {
              name: senderName,
              email: senderEmail
            },
            to: [
              {
                email: to
              }
            ],
            subject: subject,
            htmlContent: html,
            textContent: text
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(JSON.stringify(errorData))
        }

        console.log(`[BREVO API SUCCESS] Email successfully dispatched to ${to}`)
        return true
      } catch (err: any) {
        console.error(`[BREVO API ERROR] Failed to send email to ${to}:`, err.message)
      }
    }
  }

  // Fallback to Nodemailer SMTP
  if (!transporter) {
    console.warn(`\n======================================================`)
    console.warn(`[EMAIL LOG FALLBACK] No valid Brevo or SMTP credentials in .env!`)
    console.warn(`TO: ${to}`)
    console.warn(`SUBJECT: ${subject}`)
    console.warn(`BODY: ${text}`)
    console.warn(`======================================================\n`)
    return false
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"CodovateMeet" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    })
    console.log(`[EMAIL SUCCESS] Email successfully dispatched to ${to}`)
    return true
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message)
    return false
  }
}
