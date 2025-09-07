// Supabase Edge Function: notify-photographer-quiz
// Notifies photographer when client completes style quiz

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, photographerId } = await req.json()

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get booking and photographer details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:users!customer_id (
          full_name,
          email
        ),
        packages (
          title
        ),
        personalization_data
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError) throw bookingError

    // Get photographer details
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select(`
        *,
        users!inner (
          full_name,
          email
        )
      `)
      .eq('id', photographerId)
      .single()

    if (photographerError) throw photographerError

    // Send notification email to photographer
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
          .quiz-section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Client Style Quiz Completed</h2>
          </div>
          
          <div class="content">
            <p>Hi ${photographer.users.full_name},</p>
            
            <p>Good news! Your client <strong>${booking.customer.full_name}</strong> has completed their style quiz for their upcoming session.</p>
            
            <div class="quiz-section">
              <h3>Client Preferences:</h3>
              <ul>
                <li><strong>Photography Style:</strong> ${booking.personalization_data?.style || 'Not specified'}</li>
                <li><strong>Color Mood:</strong> ${booking.personalization_data?.mood || 'Not specified'}</li>
                <li><strong>Music Preference:</strong> ${booking.personalization_data?.musicMood || 'Not specified'}</li>
                <li><strong>Must-Have Shots:</strong> ${booking.personalization_data?.shots?.length || 0} selected</li>
              </ul>
              
              ${booking.personalization_data?.notes ? `
                <p><strong>Special Notes:</strong></p>
                <p style="font-style: italic; padding: 10px; background: white; border-left: 3px solid #4F46E5;">
                  ${booking.personalization_data.notes}
                </p>
              ` : ''}
            </div>
            
            <p><strong>Event Details:</strong></p>
            <ul>
              <li>Date: ${new Date(booking.event_date).toLocaleDateString()}</li>
              <li>Time: ${booking.event_time}</li>
              <li>Venue: ${booking.venue_name}</li>
              <li>Package: ${booking.packages.title}</li>
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get('PUBLIC_URL')}/dashboard/photographer/job-queue" class="button">
                View in Job Queue
              </a>
            </p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Please review these preferences before the event to ensure you can deliver exactly what the client is looking for.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Invoke send-email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: photographer.users.email,
        subject: `Style Quiz Completed - ${booking.customer.full_name}`,
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      console.error('Failed to send email')
    }

    // Also create an in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: photographer.user_id,
        type: 'quiz_completed',
        title: 'Style Quiz Completed',
        message: `${booking.customer.full_name} has completed their style preferences quiz`,
        data: { bookingId },
        read: false,
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
