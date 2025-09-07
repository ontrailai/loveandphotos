// Supabase Edge Function: send-email
// Deploy this to Supabase Functions for email sending capability

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const POSTMARK_API_KEY = Deno.env.get('POSTMARK_API_KEY')

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, from, replyTo } = await req.json()

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html or text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the appropriate email service based on what's configured
    let result

    if (RESEND_API_KEY) {
      result = await sendViaResend({ to, subject, html, text, from, replyTo })
    } else if (SENDGRID_API_KEY) {
      result = await sendViaSendGrid({ to, subject, html, text, from, replyTo })
    } else if (POSTMARK_API_KEY) {
      result = await sendViaPostmark({ to, subject, html, text, from, replyTo })
    } else {
      // Fallback to logging (for development)
      console.log('Email would be sent:', { to, subject })
      result = { success: true, message: 'Email logged (no service configured)' }
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Resend implementation
async function sendViaResend({ to, subject, html, text, from, replyTo }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || 'LoveP <noreply@lovep.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo
    }),
  })

  const data = await response.json()
  
  if (response.ok) {
    return { success: true, data }
  } else {
    throw new Error(data.error || 'Failed to send email via Resend')
  }
}

// SendGrid implementation
async function sendViaSendGrid({ to, subject, html, text, from, replyTo }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }]
      }],
      from: { email: from || 'noreply@lovep.com', name: 'LoveP' },
      subject,
      content: [
        { type: 'text/plain', value: text || '' },
        { type: 'text/html', value: html || '' }
      ],
      reply_to: replyTo ? { email: replyTo } : undefined
    }),
  })

  if (response.ok || response.status === 202) {
    return { success: true, message: 'Email sent via SendGrid' }
  } else {
    const error = await response.text()
    throw new Error(`SendGrid error: ${error}`)
  }
}

// Postmark implementation
async function sendViaPostmark({ to, subject, html, text, from, replyTo }) {
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': POSTMARK_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      From: from || 'noreply@lovep.com',
      To: Array.isArray(to) ? to.join(', ') : to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      ReplyTo: replyTo,
      MessageStream: 'outbound'
    }),
  })

  const data = await response.json()
  
  if (response.ok) {
    return { success: true, data }
  } else {
    throw new Error(data.Message || 'Failed to send email via Postmark')
  }
}
