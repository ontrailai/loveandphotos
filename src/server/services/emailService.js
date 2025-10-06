/**
 * Email Service for Server-Side Email Sending
 * Handles booking confirmation emails after successful payment
 */

import { createClient } from '@supabase/supabase-js'
import { formatCurrency } from '../payments/compute.js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Send booking confirmation email after successful payment
 * @param {Object} params - Email parameters
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.paymentIntentId - Stripe Payment Intent ID
 * @param {number} params.amountPaid - Amount paid in cents
 * @param {string} params.paymentPlan - Payment plan selected
 * @returns {Promise<Object>} - Email sending result
 */
export const sendPaymentConfirmationEmail = async ({
  bookingId,
  paymentIntentId,
  amountPaid,
  paymentPlan
}) => {
  try {
    console.log(`📧 Sending payment confirmation email for booking ${bookingId}`)

    // Load booking details from database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:users!bookings_customer_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      console.error('Error loading booking:', bookingError)
      throw new Error(`Failed to load booking: ${bookingError.message}`)
    }

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`)
    }

    // Check if confirmation email already sent
    if (booking.confirmation_email_sent) {
      console.log(`⏭️  Confirmation email already sent for booking ${bookingId}`)
      return { success: true, alreadySent: true }
    }

    // Get photographer details (will add photographer name later when available)
    const photographerName = booking.photographer_name || 'Your Love & Photos Photographer'

    // Calculate remaining balance
    const totalAmount = booking.total_amount || 0
    const amountPaidDollars = amountPaid / 100
    const remainingBalance = Math.max(0, totalAmount - amountPaidDollars)

    // Format event date
    const eventDate = new Date(booking.event_date)
    const formattedEventDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Get payment plan name
    const paymentPlanName = getPaymentPlanName(paymentPlan)

    // Get dashboard URL
    const dashboardUrl = `${process.env.VITE_APP_URL || 'https://loveandphotos.onrender.com'}/dashboard`

    // Generate email content
    const emailContent = generateConfirmationEmail({
      customerName: booking.customer?.full_name || 'Valued Client',
      photographerName,
      eventDate: formattedEventDate,
      packageType: booking.package_type || 'Photography Package',
      paymentPlan: paymentPlanName,
      amountPaid: amountPaidDollars,
      remainingBalance,
      totalAmount,
      dashboardUrl,
      bookingId
    })

    // Send email via Supabase Edge Function
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: booking.customer?.email,
        from: 'Love & Photos <noreply@loveandphotos.com>',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
    })

    if (emailError) {
      console.error('❌ Email send error:', emailError)
      // Don't throw - booking should complete even if email fails
      // Queue for retry instead
      await queueEmailForRetry({
        bookingId,
        recipientEmail: booking.customer?.email,
        emailContent
      })
      return { success: false, error: emailError, queued: true }
    }

    // Mark email as sent in database
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        confirmation_email_sent: true,
        confirmation_email_sent_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('⚠️  Failed to mark email as sent:', updateError)
      // Email was sent, so still return success
    }

    console.log(`✅ Payment confirmation email sent successfully for booking ${bookingId}`)
    return { success: true, data: emailData }
  } catch (error) {
    console.error('❌ Error sending payment confirmation email:', error)
    // Don't throw - booking should complete even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Generate HTML and text content for confirmation email
 */
const generateConfirmationEmail = ({
  customerName,
  photographerName,
  eventDate,
  packageType,
  paymentPlan,
  amountPaid,
  remainingBalance,
  totalAmount,
  dashboardUrl,
  bookingId
}) => {
  const subject = `You're Booked! ✨ Your Wedding Photo Experience with Love & Photos`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - Love & Photos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #f5a3b5 0%, #a8c7aa 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .info-box {
          background: #f9f9f9;
          border-left: 4px solid #f5a3b5;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .info-box h2 {
          margin: 0 0 15px 0;
          font-size: 20px;
          color: #333;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-row strong {
          color: #666;
        }
        .highlight {
          color: #f5a3b5;
          font-weight: 700;
        }
        .amount-paid {
          color: #4CAF50;
          font-size: 24px;
          font-weight: 700;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #f5a3b5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background: #e392a4;
        }
        .footer {
          background: #f9f9f9;
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .footer a {
          color: #f5a3b5;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ You're Booked!</h1>
          <p>Your wedding photography experience is confirmed</p>
        </div>

        <div class="content">
          <p class="greeting">Hi ${customerName},</p>

          <p>Congratulations! Your booking with <strong>${photographerName}</strong> has been confirmed, and your payment has been received.</p>

          <div class="info-box">
            <h2>📅 Event Details</h2>
            <div class="info-row">
              <strong>Event Date:</strong>
              <span>${eventDate}</span>
            </div>
            <div class="info-row">
              <strong>Photographer:</strong>
              <span>${photographerName}</span>
            </div>
            <div class="info-row">
              <strong>Package:</strong>
              <span>${packageType}</span>
            </div>
            <div class="info-row">
              <strong>Payment Plan:</strong>
              <span>${paymentPlan}</span>
            </div>
          </div>

          <div class="info-box">
            <h2>💳 Payment Summary</h2>
            <div class="info-row">
              <strong>Total Package:</strong>
              <span>$${totalAmount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Amount Paid Today:</strong>
              <span class="amount-paid">$${amountPaid.toLocaleString()}</span>
            </div>
            ${remainingBalance > 0 ? `
            <div class="info-row">
              <strong>Remaining Balance:</strong>
              <span class="highlight">$${remainingBalance.toLocaleString()}</span>
            </div>
            ` : ''}
          </div>

          <p>
            <strong>📋 What's Next?</strong>
          </p>
          <ul style="line-height: 2;">
            <li>Log into your dashboard to view full booking details and track payments</li>
            <li>Review your service agreement and package details</li>
            <li>Your photographer will contact you 1-2 weeks before your event</li>
            <li>Prepare for your special day!</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="button">View Your Dashboard →</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; font-size: 14px; color: #666;">
            <strong>Questions or concerns?</strong><br>
            Contact us anytime at <a href="mailto:support@loveandphotos.com" style="color: #f5a3b5;">support@loveandphotos.com</a>
          </p>
        </div>

        <div class="footer">
          <p><strong>Love & Photos</strong></p>
          <p>Capturing your most precious moments</p>
          <p style="margin-top: 15px;">
            <a href="${dashboardUrl}">Dashboard</a> •
            <a href="mailto:support@loveandphotos.com">Support</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Love & Photos. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
YOU'RE BOOKED! ✨

Hi ${customerName},

Congratulations! Your booking with ${photographerName} has been confirmed, and your payment has been received.

EVENT DETAILS:
- Event Date: ${eventDate}
- Photographer: ${photographerName}
- Package: ${packageType}
- Payment Plan: ${paymentPlan}

PAYMENT SUMMARY:
- Total Package: $${totalAmount.toLocaleString()}
- Amount Paid Today: $${amountPaid.toLocaleString()}
${remainingBalance > 0 ? `- Remaining Balance: $${remainingBalance.toLocaleString()}` : ''}

WHAT'S NEXT?
1. Log into your dashboard to view full booking details and track payments
2. Review your service agreement and package details
3. Your photographer will contact you 1-2 weeks before your event
4. Prepare for your special day!

VIEW YOUR DASHBOARD:
${dashboardUrl}

QUESTIONS OR CONCERNS?
Contact us anytime at support@loveandphotos.com

---
Love & Photos
Capturing your most precious moments
© ${new Date().getFullYear()} Love & Photos. All rights reserved.
  `

  return { subject, html, text }
}

/**
 * Get human-readable payment plan name
 */
const getPaymentPlanName = (plan) => {
  const planNames = {
    'full': 'Pay in Full',
    'deposit500': '$500 Deposit + Monthly Payments',
    'monthly199': 'Monthly Payment Plan ($199/month)',
    'deposit+3': '$500 Deposit + 3 Payments',
    'installments': 'Monthly Installments'
  }
  return planNames[plan] || 'Custom Payment Plan'
}

/**
 * Queue email for retry if sending fails
 */
const queueEmailForRetry = async ({ bookingId, recipientEmail, emailContent }) => {
  try {
    console.log(`📬 Queuing email for retry: booking ${bookingId}`)

    const { error } = await supabase
      .from('email_queue')
      .insert({
        booking_id: bookingId,
        recipient_email: recipientEmail,
        recipient_type: 'customer',
        subject: emailContent.subject,
        html_content: emailContent.html,
        text_content: emailContent.text,
        status: 'pending',
        attempts: 0,
        email_type: 'booking_confirmation',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to queue email for retry:', error)
    } else {
      console.log(`✅ Email queued for retry: booking ${bookingId}`)
    }
  } catch (error) {
    console.error('Error queuing email:', error)
  }
}

/**
 * Send date change notification emails to customer and photographer
 * @param {Object} params - Email parameters
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.oldDate - Original event date (ISO format)
 * @param {string} params.newDate - New event date (ISO format)
 * @param {string} params.customerEmail - Customer email address
 * @param {string} params.customerName - Customer full name
 * @param {string} params.photographerEmail - Photographer email address
 * @param {string} params.photographerName - Photographer full name
 * @returns {Promise<Object>} - Email sending result
 */
export const sendDateChangeNotification = async ({
  bookingId,
  oldDate,
  newDate,
  customerEmail,
  customerName,
  photographerEmail,
  photographerName
}) => {
  try {
    console.log(`📧 Sending date change notifications for booking ${bookingId}`)

    // Format dates for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formattedOldDate = formatDate(oldDate)
    const formattedNewDate = formatDate(newDate)
    const dashboardUrl = `${process.env.VITE_APP_URL || 'https://loveandphotos.onrender.com'}/dashboard`

    // Send email to customer
    const customerEmailContent = generateDateChangeCustomerEmail({
      customerName,
      photographerName,
      oldDate: formattedOldDate,
      newDate: formattedNewDate,
      dashboardUrl,
      bookingId
    })

    const { error: customerEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: customerEmail,
        from: 'Love & Photos <noreply@loveandphotos.com>',
        subject: customerEmailContent.subject,
        html: customerEmailContent.html,
        text: customerEmailContent.text
      }
    })

    if (customerEmailError) {
      console.error('❌ Customer email send error:', customerEmailError)
    } else {
      console.log(`✅ Date change notification sent to customer: ${customerEmail}`)
    }

    // Send email to photographer
    const photographerEmailContent = generateDateChangePhotographerEmail({
      photographerName,
      customerName,
      oldDate: formattedOldDate,
      newDate: formattedNewDate,
      dashboardUrl,
      bookingId
    })

    const { error: photographerEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: photographerEmail,
        from: 'Love & Photos <noreply@loveandphotos.com>',
        subject: photographerEmailContent.subject,
        html: photographerEmailContent.html,
        text: photographerEmailContent.text
      }
    })

    if (photographerEmailError) {
      console.error('❌ Photographer email send error:', photographerEmailError)
    } else {
      console.log(`✅ Date change notification sent to photographer: ${photographerEmail}`)
    }

    return {
      success: true,
      customerEmailSent: !customerEmailError,
      photographerEmailSent: !photographerEmailError
    }
  } catch (error) {
    console.error('❌ Error sending date change notifications:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate customer email for date change
 */
const generateDateChangeCustomerEmail = ({
  customerName,
  photographerName,
  oldDate,
  newDate,
  dashboardUrl,
  bookingId
}) => {
  const subject = `📅 Your Shoot Date Has Been Updated - Love & Photos`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Date Change Confirmation - Love & Photos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #f5a3b5 0%, #a8c7aa 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .date-change-box {
          background: #f9f9f9;
          border-left: 4px solid #f5a3b5;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .date-row {
          margin: 15px 0;
          padding: 10px;
        }
        .date-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .old-date {
          text-decoration: line-through;
          color: #999;
          font-size: 16px;
        }
        .new-date {
          color: #4CAF50;
          font-size: 20px;
          font-weight: 700;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #f5a3b5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #f9f9f9;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Shoot Date Updated</h1>
        </div>

        <div class="content">
          <p style="font-size: 18px; margin-bottom: 20px;">
            Hi ${customerName},
          </p>

          <p>
            Your shoot date with <strong>${photographerName}</strong> has been successfully updated!
          </p>

          <div class="date-change-box">
            <div class="date-row">
              <div class="date-label">Previous Date:</div>
              <div class="old-date">${oldDate}</div>
            </div>
            <div class="date-row">
              <div class="date-label">New Date:</div>
              <div class="new-date">${newDate}</div>
            </div>
          </div>

          <p>
            <strong>📋 What's Next?</strong>
          </p>
          <ul style="line-height: 2;">
            <li>Your photographer has been notified of the change</li>
            <li>The new date is now reflected in your dashboard</li>
            <li>All other booking details remain the same</li>
            <li>Your photographer will contact you closer to your new event date</li>
          </ul>

          <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>⚠️ Important:</strong> This was your one-time date change. Additional date changes may incur extra fees.
          </p>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View Your Dashboard →</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; font-size: 14px; color: #666;">
            <strong>Questions?</strong><br>
            Contact us at <a href="mailto:support@loveandphotos.com" style="color: #f5a3b5;">support@loveandphotos.com</a>
          </p>
        </div>

        <div class="footer">
          <p><strong>Love & Photos</strong></p>
          <p>Capturing your most precious moments</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Love & Photos. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
SHOOT DATE UPDATED 📅

Hi ${customerName},

Your shoot date with ${photographerName} has been successfully updated!

PREVIOUS DATE: ${oldDate}
NEW DATE: ${newDate}

WHAT'S NEXT:
- Your photographer has been notified of the change
- The new date is now reflected in your dashboard
- All other booking details remain the same
- Your photographer will contact you closer to your new event date

⚠️ IMPORTANT: This was your one-time date change. Additional date changes may incur extra fees.

VIEW YOUR DASHBOARD:
${dashboardUrl}

QUESTIONS?
Contact us at support@loveandphotos.com

---
Love & Photos
Capturing your most precious moments
© ${new Date().getFullYear()} Love & Photos. All rights reserved.
  `

  return { subject, html, text }
}

/**
 * Generate photographer email for date change
 */
const generateDateChangePhotographerEmail = ({
  photographerName,
  customerName,
  oldDate,
  newDate,
  dashboardUrl,
  bookingId
}) => {
  const subject = `📅 Booking Date Changed - ${customerName}`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Date Changed - Love & Photos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .date-change-box {
          background: #f9f9f9;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .date-row {
          margin: 15px 0;
          padding: 10px;
        }
        .date-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .old-date {
          text-decoration: line-through;
          color: #999;
          font-size: 16px;
        }
        .new-date {
          color: #667eea;
          font-size: 20px;
          font-weight: 700;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #f9f9f9;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Booking Date Changed</h1>
        </div>

        <div class="content">
          <p style="font-size: 18px; margin-bottom: 20px;">
            Hi ${photographerName},
          </p>

          <p>
            <strong>${customerName}</strong> has changed their shoot date using their date change flexibility add-on.
          </p>

          <div class="date-change-box">
            <div class="date-row">
              <div class="date-label">Previous Date:</div>
              <div class="old-date">${oldDate}</div>
            </div>
            <div class="date-row">
              <div class="date-label">New Date:</div>
              <div class="new-date">${newDate}</div>
            </div>
          </div>

          <p>
            <strong>📋 Action Required:</strong>
          </p>
          <ul style="line-height: 2;">
            <li>Update your calendar to reflect the new shoot date</li>
            <li>Review your availability and confirm this date works for you</li>
            <li>Contact the customer if there are any concerns</li>
            <li>All other booking details remain unchanged</li>
          </ul>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">View Booking Details →</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; font-size: 14px; color: #666;">
            <strong>Need Help?</strong><br>
            Contact support at <a href="mailto:support@loveandphotos.com" style="color: #667eea;">support@loveandphotos.com</a>
          </p>
        </div>

        <div class="footer">
          <p><strong>Love & Photos</strong></p>
          <p>Professional Photography Platform</p>
          <p style="margin-top: 15px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Love & Photos. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
BOOKING DATE CHANGED 📅

Hi ${photographerName},

${customerName} has changed their shoot date using their date change flexibility add-on.

PREVIOUS DATE: ${oldDate}
NEW DATE: ${newDate}

ACTION REQUIRED:
- Update your calendar to reflect the new shoot date
- Review your availability and confirm this date works for you
- Contact the customer if there are any concerns
- All other booking details remain unchanged

VIEW BOOKING DETAILS:
${dashboardUrl}

NEED HELP?
Contact support at support@loveandphotos.com

---
Love & Photos
Professional Photography Platform
© ${new Date().getFullYear()} Love & Photos. All rights reserved.
  `

  return { subject, html, text }
}

/**
 * Send new booking notification email to photographer
 * @param {Object} params - Email parameters
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.photographerEmail - Photographer email address
 * @param {string} params.photographerFirstName - Photographer first name
 * @param {string} params.customerFullName - Customer full name
 * @param {string} params.eventDate - Event date (ISO format)
 * @param {string} params.eventTime - Event time
 * @param {string} params.eventLocation - Event venue/location
 * @param {string} params.packageType - Package tier (Bronze/Silver/Gold/Platinum)
 * @param {number} params.packagePrice - Package price in dollars
 * @returns {Promise<Object>} - Email sending result
 */
export const sendPhotographerBookingNotification = async ({
  bookingId,
  photographerEmail,
  photographerFirstName,
  customerFullName,
  eventDate,
  eventTime,
  eventLocation,
  packageType,
  packagePrice
}) => {
  try {
    console.log(`📸 Sending photographer booking notification for booking ${bookingId}`)

    // Format event date
    const formattedEventDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Format time
    const formatTime = (timeString) => {
      if (!timeString) return 'TBD'
      // Validate HH:MM format
      if (!timeString.includes(':')) return timeString // Return as-is if not in expected format
      const parts = timeString.split(':')
      if (parts.length < 2) return timeString
      const hours = parseInt(parts[0])
      const minutes = parts[1]
      if (isNaN(hours)) return timeString
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHour = hours % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }
    const formattedTime = formatTime(eventTime)

    // Get dashboard URL
    const dashboardUrl = `${process.env.VITE_APP_URL || 'https://loveandphotos.onrender.com'}/talent/dashboard/bookings`

    // Generate email content
    const emailContent = generatePhotographerBookingEmail({
      photographerFirstName,
      customerFullName,
      eventDate: formattedEventDate,
      eventTime: formattedTime,
      eventLocation: eventLocation || 'Location TBD',
      packageType: packageType || 'Photography Package',
      packagePrice,
      dashboardUrl
    })

    // Send email via Supabase Edge Function
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: photographerEmail,
        from: 'Love & Photos <hello@loveandphotos.com>',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
    })

    if (emailError) {
      console.error('❌ Photographer email send error:', emailError)
      // Queue for retry
      await queueEmailForRetry({
        bookingId,
        recipientEmail: photographerEmail,
        emailContent: {
          ...emailContent,
          recipient_type: 'photographer'
        }
      })
      return { success: false, error: emailError, queued: true }
    }

    console.log(`✅ Photographer notification sent successfully to ${photographerEmail}`)
    return { success: true, data: emailData }
  } catch (error) {
    console.error('❌ Error sending photographer notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate photographer email for new booking
 */
const generatePhotographerBookingEmail = ({
  photographerFirstName,
  customerFullName,
  eventDate,
  eventTime,
  eventLocation,
  packageType,
  packagePrice,
  dashboardUrl
}) => {
  const subject = `📸 You've been booked!`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking - Love & Photos</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .info-box {
          background: #f9f9f9;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .info-box h2 {
          margin: 0 0 15px 0;
          font-size: 20px;
          color: #333;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-row strong {
          color: #666;
        }
        .highlight {
          color: #667eea;
          font-weight: 700;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #f9f9f9;
          padding: 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 You've been booked!</h1>
          <p>New photo shoot confirmed</p>
        </div>

        <div class="content">
          <p class="greeting">Hi ${photographerFirstName},</p>

          <p>You've just been booked for a photo shoot with <strong>${customerFullName}</strong>.</p>

          <div class="info-box">
            <h2>📅 Shoot Details</h2>
            <div class="info-row">
              <strong>Event Date:</strong>
              <span>${eventDate}</span>
            </div>
            <div class="info-row">
              <strong>Event Time:</strong>
              <span>${eventTime}</span>
            </div>
            <div class="info-row">
              <strong>Location:</strong>
              <span>${eventLocation}</span>
            </div>
            <div class="info-row">
              <strong>Package:</strong>
              <span>${packageType} - $${packagePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <p>
            <strong>📝 What's Next?</strong>
          </p>
          <ul style="line-height: 2;">
            <li>Check your Talent Dashboard to view the full booking details and client preferences</li>
            <li>Review the client's style preferences and must-have shots</li>
            <li>Mark your calendar for the event date</li>
            <li>You'll be contacted 1-2 weeks before the event with final details</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="button">View Booking Details →</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0; font-size: 14px; color: #666;">
            <strong>Questions or concerns?</strong><br>
            Contact support at <a href="mailto:support@loveandphotos.com" style="color: #667eea;">support@loveandphotos.com</a>
          </p>
        </div>

        <div class="footer">
          <p><strong>Love & Photos</strong></p>
          <p>Professional Photography Platform</p>
          <p style="margin-top: 15px;">
            <a href="${dashboardUrl}">Dashboard</a> •
            <a href="mailto:support@loveandphotos.com">Support</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Love & Photos. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
YOU'VE BEEN BOOKED! 📸

Hi ${photographerFirstName},

You've just been booked for a photo shoot with ${customerFullName}.

SHOOT DETAILS:
- Event Date: ${eventDate}
- Event Time: ${eventTime}
- Location: ${eventLocation}
- Package: ${packageType} - $${packagePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}

WHAT'S NEXT?
1. Check your Talent Dashboard to view the full booking details and client preferences
2. Review the client's style preferences and must-have shots
3. Mark your calendar for the event date
4. You'll be contacted 1-2 weeks before the event with final details

VIEW BOOKING DETAILS:
${dashboardUrl}

QUESTIONS OR CONCERNS?
Contact support at support@loveandphotos.com

---
Love & Photos
Professional Photography Platform
© ${new Date().getFullYear()} Love & Photos. All rights reserved.
  `

  return { subject, html, text }
}
