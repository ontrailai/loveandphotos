/**
 * Email Client
 * Handles email sending via Supabase Edge Functions or external service
 */

import { supabase } from './supabase'
import { format } from 'date-fns'

/**
 * Send booking confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.recipientType - 'customer' or 'photographer'
 */
export const sendConfirmationEmail = async ({ bookingId, recipientType }) => {
  try {
    // Load booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:users!customer_id (
          full_name,
          email,
          phone
        ),
        photographers (
          *,
          users!inner (
            full_name,
            email,
            phone
          ),
          pay_tiers (
            name,
            hourly_rate
          )
        ),
        packages (
          title,
          duration_minutes,
          deliverables
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError

    // Determine recipient
    const recipient = recipientType === 'customer' 
      ? {
          email: booking.customer.email,
          name: booking.customer.full_name,
          type: 'customer'
        }
      : {
          email: booking.photographers.users.email,
          name: booking.photographers.users.full_name,
          type: 'photographer'
        }

    // Generate email content based on recipient type
    const emailContent = recipientType === 'customer' 
      ? generateCustomerEmail(booking)
      : generatePhotographerEmail(booking)

    // Send via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipient.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
    })

    if (error) {
      console.error('Email send error:', error)
      // Fallback to alternative method or queue for retry
      await queueEmailForRetry({
        bookingId,
        recipientType,
        recipient,
        content: emailContent
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}

/**
 * Generate customer confirmation email
 */
const generateCustomerEmail = (booking) => {
  const eventDate = format(new Date(booking.event_date), 'EEEE, MMMM dd, yyyy')
  const contractUrl = booking.contract_url || '#'
  const dashboardUrl = `${import.meta.env.VITE_APP_URL}/dashboard`
  const quizUrl = `${import.meta.env.VITE_APP_URL}/book/quiz/${booking.id}`

  const subject = `Booking Confirmed - ${booking.photographers.users.full_name} for ${eventDate}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f5a3b5 0%, #a8c7aa 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #f5a3b5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .info-row:last-child { border-bottom: none; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { color: #333; margin-top: 30px; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your photography session is all set</p>
        </div>
        
        <div class="content">
          <p>Hi ${booking.customer.full_name},</p>
          
          <p>Great news! Your booking with <strong>${booking.photographers.users.full_name}</strong> has been confirmed and paid in full.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📅 Event Details</h3>
            <div class="info-row">
              <strong>Date:</strong>
              <span>${eventDate}</span>
            </div>
            <div class="info-row">
              <strong>Time:</strong>
              <span>${booking.event_time}</span>
            </div>
            <div class="info-row">
              <strong>Duration:</strong>
              <span>${booking.packages.duration_minutes} minutes</span>
            </div>
            <div class="info-row">
              <strong>Venue:</strong>
              <span>${booking.venue_name}</span>
            </div>
            <div class="info-row">
              <strong>Package:</strong>
              <span>${booking.packages.title}</span>
            </div>
            <div class="info-row">
              <strong>Total Paid:</strong>
              <span style="color: #4CAF50; font-weight: bold;">$${booking.total_amount}</span>
            </div>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📸 Your Photographer</h3>
            <p><strong>${booking.photographers.users.full_name}</strong></p>
            <p>📧 ${booking.photographers.users.email}</p>
            <p>📱 ${booking.photographers.users.phone}</p>
            <p style="margin-bottom: 0;">✨ ${booking.photographers.pay_tiers.name} Tier Photographer</p>
          </div>
          
          <h2>📋 Next Steps</h2>
          <ol>
            <li><strong>Complete Your Style Quiz</strong> - Help your photographer understand your vision
              <br><a href="${quizUrl}" class="button">Take Quiz →</a>
            </li>
            <li><strong>Review Your Contract</strong> - Download and review your service agreement
              <br><a href="${contractUrl}" class="button">View Contract →</a>
            </li>
            <li><strong>Prepare for Your Session</strong> - Your photographer will contact you 1 week before the event</li>
            <li><strong>Enjoy Your Event!</strong> - Photos will be delivered within 4-6 weeks</li>
          </ol>
          
          <h2>🚫 Cancellation Policy</h2>
          <ul>
            <li>More than 30 days before: 50% refund</li>
            <li>15-30 days before: 25% refund</li>
            <li>Less than 15 days: No refund</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${dashboardUrl}" class="button">View in Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Questions? Reply to this email or contact us at support@lovep.com</p>
          <p>© ${new Date().getFullYear()} LoveP Marketplace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Booking Confirmed!

Hi ${booking.customer.full_name},

Your booking with ${booking.photographers.users.full_name} has been confirmed.

EVENT DETAILS:
- Date: ${eventDate}
- Time: ${booking.event_time}
- Duration: ${booking.packages.duration_minutes} minutes
- Venue: ${booking.venue_name}
- Package: ${booking.packages.title}
- Total Paid: $${booking.total_amount}

NEXT STEPS:
1. Complete your style quiz: ${quizUrl}
2. Review your contract: ${contractUrl}
3. Your photographer will contact you 1 week before the event
4. Photos will be delivered within 4-6 weeks

View in dashboard: ${dashboardUrl}

Questions? Contact us at support@lovep.com
  `

  return { subject, html, text }
}

/**
 * Generate photographer notification email
 */
const generatePhotographerEmail = (booking) => {
  const eventDate = format(new Date(booking.event_date), 'EEEE, MMMM dd, yyyy')
  const jobQueueUrl = `${import.meta.env.VITE_APP_URL}/dashboard/photographer/job-queue`

  const subject = `New Booking Alert - ${booking.customer.full_name} on ${eventDate}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        h1 { margin: 0; font-size: 28px; }
        .new-badge { background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 New Booking!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You have a new confirmed booking</p>
        </div>
        
        <div class="content">
          <p>Congratulations! You have a new booking that has been paid in full.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">👤 Client Information</h3>
            <p><strong>${booking.customer.full_name}</strong></p>
            <p>📧 ${booking.customer.email}</p>
            <p>📱 ${booking.customer.phone}</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📅 Event Details</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${booking.event_time}</p>
            <p><strong>Duration:</strong> ${booking.packages.duration_minutes} minutes</p>
            <p><strong>Event Type:</strong> ${booking.event_type}</p>
            <p><strong>Venue:</strong> ${booking.venue_name}</p>
            <p><strong>Address:</strong> ${booking.venue_address?.street}, ${booking.venue_address?.city}, ${booking.venue_address?.state} ${booking.venue_address?.zip}</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">💰 Payment Details</h3>
            <p><strong>Package:</strong> ${booking.packages.title}</p>
            <p><strong>Amount:</strong> <span style="color: #4CAF50; font-size: 18px; font-weight: bold;">$${booking.total_amount}</span></p>
            <p><strong>Status:</strong> <span class="new-badge">PAID IN FULL</span></p>
          </div>
          
          ${booking.special_requests ? `
          <div class="alert-box">
            <strong>Special Requests:</strong>
            <p style="margin: 10px 0 0 0;">${booking.special_requests}</p>
          </div>
          ` : ''}
          
          <h3>📝 Action Required</h3>
          <ol>
            <li>Review the booking details in your dashboard</li>
            <li>Contact the client 1 week before the event to confirm details</li>
            <li>Check if the client has completed their style quiz (once available)</li>
            <li>Deliver photos within 4-6 weeks after the event</li>
          </ol>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${jobQueueUrl}" class="button">View in Job Queue</a>
          </div>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <strong>Delivery Deadline:</strong> Photos must be delivered by ${format(addDays(new Date(booking.event_date), 42), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
New Booking Alert!

You have a new confirmed booking:

CLIENT:
${booking.customer.full_name}
Email: ${booking.customer.email}
Phone: ${booking.customer.phone}

EVENT DETAILS:
- Date: ${eventDate}
- Time: ${booking.event_time}
- Duration: ${booking.packages.duration_minutes} minutes
- Venue: ${booking.venue_name}
- Package: ${booking.packages.title}
- Amount: $${booking.total_amount} (PAID IN FULL)

ACTION REQUIRED:
1. Review booking in your dashboard
2. Contact client 1 week before event
3. Deliver photos within 4-6 weeks

View in Job Queue: ${jobQueueUrl}
  `

  return { subject, html, text }
}

/**
 * Queue email for retry if initial send fails
 */
const queueEmailForRetry = async ({ bookingId, recipientType, recipient, content }) => {
  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        booking_id: bookingId,
        recipient_type: recipientType,
        recipient_email: recipient.email,
        recipient_name: recipient.name,
        subject: content.subject,
        html_content: content.html,
        text_content: content.text,
        status: 'pending',
        attempts: 0,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  } catch (error) {
    console.error('Error queuing email:', error)
  }
}

/**
 * Send delivery notification to customer
 */
export const sendDeliveryNotification = async ({ bookingId, deliveryUrl, deliveryPassword }) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:users!customer_id (
          full_name,
          email
        ),
        photographers (
          users!inner (
            full_name
          )
        ),
        packages (
          title
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error) throw error

    const subject = `Your photos are ready! - ${booking.photographers.users.full_name}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .content { padding: 30px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          .credentials { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 Your Photos Are Ready!</h1>
          </div>
          <div class="content">
            <p>Hi ${booking.customer.full_name},</p>
            <p>Great news! ${booking.photographers.users.full_name} has delivered your photos from ${format(new Date(booking.event_date), 'MMMM dd, yyyy')}.</p>
            
            <div class="credentials">
              <h3>Access Your Photos:</h3>
              <p><strong>Gallery URL:</strong> ${deliveryUrl}</p>
              <p><strong>Password:</strong> ${deliveryPassword}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${deliveryUrl}" class="button">View Your Photos</a>
            </p>
            
            <p>Thank you for choosing LoveP!</p>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        to: booking.customer.email,
        subject,
        html
      }
    })

    if (sendError) throw sendError
    return { success: true }
  } catch (error) {
    console.error('Error sending delivery notification:', error)
    throw error
  }
}
