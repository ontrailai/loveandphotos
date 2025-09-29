import{j as e,q as y,d as q,P as L,n as R,v as U,c as F,x as V,A as Q,a9 as H,W as O,aa as G}from"./ui-D86Mbp3F.js";import{r as x}from"./react-C3Xvg9zH.js";import{u as J,b as W,L as P}from"./router-BOsq01yh.js";import{s as m,u as X,C as v,a as b,B as g}from"./index-RsJSc-xP.js";import{f as p}from"./utils-CWWonWgh.js";import{z as u}from"./notifications-AAMUpyrg.js";import"./auth-BAx15x3q.js";import"./forms-BETPFrzU.js";const k=async({bookingId:t,recipientType:o})=>{try{const{data:a,error:l}=await m.from("bookings").select(`
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
      `).eq("id",t).single();if(l)throw l;const i=o==="customer"?{email:a.customer.email,name:a.customer.full_name,type:"customer"}:{email:a.photographers.users.email,name:a.photographers.users.full_name,type:"photographer"},d=o==="customer"?K(a):Z(a),{data:s,error:h}=await m.functions.invoke("send-email",{body:{to:i.email,subject:d.subject,html:d.html,text:d.text}});return h&&(console.error("Email send error:",h),await ee({bookingId:t,recipientType:o,recipient:i,content:d})),{success:!0,data:s}}catch(a){throw console.error("Error sending confirmation email:",a),a}},K=t=>{const o=p(new Date(t.event_date),"EEEE, MMMM dd, yyyy"),a=t.contract_url||"#",l="http://localhost:5173/dashboard",i=`http://localhost:5173/book/quiz/${t.id}`,d=`Booking Confirmed - ${t.photographers.users.full_name} for ${o}`,s=`
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
          <p>Hi ${t.customer.full_name},</p>
          
          <p>Great news! Your booking with <strong>${t.photographers.users.full_name}</strong> has been confirmed and paid in full.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📅 Event Details</h3>
            <div class="info-row">
              <strong>Date:</strong>
              <span>${o}</span>
            </div>
            <div class="info-row">
              <strong>Time:</strong>
              <span>${t.event_time}</span>
            </div>
            <div class="info-row">
              <strong>Duration:</strong>
              <span>${t.packages.duration_minutes} minutes</span>
            </div>
            <div class="info-row">
              <strong>Venue:</strong>
              <span>${t.venue_name}</span>
            </div>
            <div class="info-row">
              <strong>Package:</strong>
              <span>${t.packages.title}</span>
            </div>
            <div class="info-row">
              <strong>Total Paid:</strong>
              <span style="color: #4CAF50; font-weight: bold;">$${t.total_amount}</span>
            </div>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📸 Your Photographer</h3>
            <p><strong>${t.photographers.users.full_name}</strong></p>
            <p>📧 ${t.photographers.users.email}</p>
            <p>📱 ${t.photographers.users.phone}</p>
            <p style="margin-bottom: 0;">✨ ${t.photographers.pay_tiers.name} Tier Photographer</p>
          </div>
          
          <h2>📋 Next Steps</h2>
          <ol>
            <li><strong>Complete Your Style Quiz</strong> - Help your photographer understand your vision
              <br><a href="${i}" class="button">Take Quiz →</a>
            </li>
            <li><strong>Review Your Contract</strong> - Download and review your service agreement
              <br><a href="${a}" class="button">View Contract →</a>
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
            <a href="${l}" class="button">View in Dashboard</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Questions? Reply to this email or contact us at support@loveandphotos.com</p>
          <p>© ${new Date().getFullYear()} Love & Photos. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,h=`
Booking Confirmed!

Hi ${t.customer.full_name},

Your booking with ${t.photographers.users.full_name} has been confirmed.

EVENT DETAILS:
- Date: ${o}
- Time: ${t.event_time}
- Duration: ${t.packages.duration_minutes} minutes
- Venue: ${t.venue_name}
- Package: ${t.packages.title}
- Total Paid: $${t.total_amount}

NEXT STEPS:
1. Complete your style quiz: ${i}
2. Review your contract: ${a}
3. Your photographer will contact you 1 week before the event
4. Photos will be delivered within 4-6 weeks

View in dashboard: ${l}

Questions? Contact us at support@loveandphotos.com
  `;return{subject:d,html:s,text:h}},Z=t=>{const o=p(new Date(t.event_date),"EEEE, MMMM dd, yyyy"),a="http://localhost:5173/dashboard/photographer/job-queue",l=`New Booking Alert - ${t.customer.full_name} on ${o}`,i=`
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
            <p><strong>${t.customer.full_name}</strong></p>
            <p>📧 ${t.customer.email}</p>
            <p>📱 ${t.customer.phone}</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">📅 Event Details</h3>
            <p><strong>Date:</strong> ${o}</p>
            <p><strong>Time:</strong> ${t.event_time}</p>
            <p><strong>Duration:</strong> ${t.packages.duration_minutes} minutes</p>
            <p><strong>Event Type:</strong> ${t.event_type}</p>
            <p><strong>Venue:</strong> ${t.venue_name}</p>
            <p><strong>Address:</strong> ${t.venue_address?.street}, ${t.venue_address?.city}, ${t.venue_address?.state} ${t.venue_address?.zip}</p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">💰 Payment Details</h3>
            <p><strong>Package:</strong> ${t.packages.title}</p>
            <p><strong>Amount:</strong> <span style="color: #4CAF50; font-size: 18px; font-weight: bold;">$${t.total_amount}</span></p>
            <p><strong>Status:</strong> <span class="new-badge">PAID IN FULL</span></p>
          </div>
          
          ${t.special_requests?`
          <div class="alert-box">
            <strong>Special Requests:</strong>
            <p style="margin: 10px 0 0 0;">${t.special_requests}</p>
          </div>
          `:""}
          
          <h3>📝 Action Required</h3>
          <ol>
            <li>Review the booking details in your dashboard</li>
            <li>Contact the client 1 week before the event to confirm details</li>
            <li>Check if the client has completed their style quiz (once available)</li>
            <li>Deliver photos within 4-6 weeks after the event</li>
          </ol>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${a}" class="button">View in Job Queue</a>
          </div>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <strong>Delivery Deadline:</strong> Photos must be delivered by ${p(addDays(new Date(t.event_date),42),"MMMM dd, yyyy")}
          </p>
        </div>
      </div>
    </body>
    </html>
  `,d=`
New Booking Alert!

You have a new confirmed booking:

CLIENT:
${t.customer.full_name}
Email: ${t.customer.email}
Phone: ${t.customer.phone}

EVENT DETAILS:
- Date: ${o}
- Time: ${t.event_time}
- Duration: ${t.packages.duration_minutes} minutes
- Venue: ${t.venue_name}
- Package: ${t.packages.title}
- Amount: $${t.total_amount} (PAID IN FULL)

ACTION REQUIRED:
1. Review booking in your dashboard
2. Contact client 1 week before event
3. Deliver photos within 4-6 weeks

View in Job Queue: ${a}
  `;return{subject:l,html:i,text:d}},ee=async({bookingId:t,recipientType:o,recipient:a,content:l})=>{try{const{error:i}=await m.from("email_queue").insert({booking_id:t,recipient_type:o,recipient_email:a.email,recipient_name:a.name,subject:l.subject,html_content:l.html,text_content:l.text,status:"pending",attempts:0,created_at:new Date().toISOString()});if(i)throw i}catch(i){console.error("Error queuing email:",i)}},ce=()=>{const{user:t,profile:o}=X(),a=J(),[l]=W(),i=l.get("session_id"),d=l.get("booking_id"),[s,h]=x.useState(null),[D,M]=x.useState(!0),[S,w]=x.useState(!1),[j,_]=x.useState("");x.useEffect(()=>{i?z():d?N(d):(u.error("Invalid confirmation link"),a("/dashboard"))},[i,d]);const z=async()=>{try{const n=await(await fetch(`/api/verify-payment?session_id=${i}`)).json();if(!n.success)throw new Error("Payment verification failed");const c=n.metadata?.bookingId;if(!c)throw new Error("Booking ID not found");const{error:f}=await m.from("bookings").update({payment_status:"paid",booking_status:"confirmed",stripe_session_id:i,updated_at:new Date().toISOString()}).eq("id",c);if(f)throw f;await N(c),await B(c)}catch(r){console.error("Error verifying payment:",r),u.error("Failed to verify payment"),a("/dashboard")}},N=async r=>{try{const{data:n,error:c}=await m.from("bookings").select(`
          *,
          photographers (
            *,
            users!inner (
              full_name,
              email,
              phone,
              avatar_url
            ),
            pay_tiers (
              name,
              hourly_rate,
              badge_color
            )
          ),
          packages (
            title,
            duration_minutes,
            includes,
            deliverables
          )
        `).eq("id",r).eq("customer_id",t.id).single();if(c)throw c;if(!n){u.error("Booking not found"),a("/dashboard");return}h(n),n.contract_url?_(n.contract_url):await T(n)}catch(n){console.error("Error loading booking:",n),u.error("Failed to load booking details")}finally{M(!1)}},T=async r=>{try{const n=A(r),c=new Blob([n],{type:"text/html"}),f=new File([c],`contract-${r.id}.html`),$=`contracts/${r.id}/contract.html`,{data:te,error:C}=await m.storage.from("contracts").upload($,f,{contentType:"text/html",upsert:!0});if(C)throw C;const{data:{publicUrl:E}}=m.storage.from("contracts").getPublicUrl($);_(E),await m.from("bookings").update({contract_url:E,updated_at:new Date().toISOString()}).eq("id",r.id)}catch(n){console.error("Error generating contract:",n)}},A=r=>`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Photography Service Contract</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .signature { margin-top: 50px; border-top: 1px solid #333; padding-top: 10px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <h1>Photography Service Contract</h1>
        
        <div class="section">
          <h2>Agreement Details</h2>
          <p>This agreement is entered into on ${p(new Date,"MMMM dd, yyyy")} between:</p>
          <table>
            <tr>
              <td><strong>Client:</strong></td>
              <td>${o?.full_name}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>${o?.email}</td>
            </tr>
            <tr>
              <td><strong>Phone:</strong></td>
              <td>${o?.phone}</td>
            </tr>
            <tr>
              <td><strong>Photographer:</strong></td>
              <td>${r.photographers?.users?.full_name}</td>
            </tr>
            <tr>
              <td><strong>Package:</strong></td>
              <td>${r.packages?.title}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Event Details</h2>
          <table>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${p(new Date(r.event_date),"MMMM dd, yyyy")}</td>
            </tr>
            <tr>
              <td><strong>Time:</strong></td>
              <td>${r.event_time}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${r.packages?.duration_minutes} minutes</td>
            </tr>
            <tr>
              <td><strong>Venue:</strong></td>
              <td>${r.venue_name}</td>
            </tr>
            <tr>
              <td><strong>Address:</strong></td>
              <td>
                ${r.venue_address?.street}, 
                ${r.venue_address?.city}, 
                ${r.venue_address?.state} 
                ${r.venue_address?.zip}
              </td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Payment Terms</h2>
          <table>
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td>$${r.total_amount}</td>
            </tr>
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td>PAID IN FULL</td>
            </tr>
            <tr>
              <td><strong>Payment Date:</strong></td>
              <td>${p(new Date,"MMMM dd, yyyy")}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Deliverables</h2>
          <ul>
            ${r.packages?.deliverables?.map(n=>`<li>${n}</li>`).join("")||""}
          </ul>
          <p>Photos will be delivered within 4-6 weeks after the event date.</p>
        </div>
        
        <div class="section">
          <h2>Cancellation Policy</h2>
          <p>• Cancellations more than 30 days before event: 50% refund</p>
          <p>• Cancellations 15-30 days before event: 25% refund</p>
          <p>• Cancellations less than 15 days before event: No refund</p>
        </div>
        
        <div class="section">
          <h2>Terms and Conditions</h2>
          <p>1. The photographer retains copyright of all images</p>
          <p>2. Client has personal use rights for all delivered images</p>
          <p>3. Photographer may use images for portfolio and marketing</p>
          <p>4. Travel fees may apply for venues beyond 25 miles</p>
          <p>5. Overtime rates apply for coverage beyond contracted hours</p>
        </div>
        
        <div class="signature">
          <p><strong>Electronic Signature Confirmation</strong></p>
          <p>By completing payment, both parties agree to the terms outlined in this contract.</p>
          <p>Date: ${p(new Date,"MMMM dd, yyyy, h:mm a")}</p>
        </div>
      </body>
      </html>
    `,B=async r=>{w(!0);try{await k({bookingId:r,recipientType:"customer"}),await k({bookingId:r,recipientType:"photographer"}),u.success("Confirmation emails sent!")}catch(n){console.error("Error sending emails:",n)}finally{w(!1)}},Y=()=>{window.open(j,"_blank")?.print()},I=()=>{const r=`${window.location.origin}/booking/${s.id}`;navigator.clipboard.writeText(r),u.success("Booking link copied to clipboard")};return D?e.jsx("div",{className:"min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"})}):s?e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-green-50 to-blue-50",children:[e.jsx("div",{className:"bg-white border-b border-gray-200",children:e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center",children:[e.jsx("div",{className:"inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4",children:e.jsx(y,{className:"w-12 h-12 text-green-600"})}),e.jsx("h1",{className:"text-3xl font-display font-bold text-dusty-900 mb-2",children:"Booking Confirmed!"}),e.jsx("p",{className:"text-lg text-dusty-600",children:"Your photography session has been successfully booked"})]})}),e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:[e.jsxs(v,{className:"mb-8",children:[e.jsx("div",{className:"border-b border-gray-200 pb-6 mb-6",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h2",{className:"text-xl font-semibold text-dusty-900",children:"Booking Details"}),e.jsx(b,{variant:"success",size:"lg",children:"Confirmed"})]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-4",children:"Your Photographer"}),e.jsxs("div",{className:"flex items-center space-x-4 mb-4",children:[e.jsx("img",{src:s.photographers?.users?.avatar_url||`https://ui-avatars.com/api/?name=${s.photographers?.users?.full_name}`,alt:s.photographers?.users?.full_name,className:"w-16 h-16 rounded-full object-cover"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold text-dusty-900",children:s.photographers?.users?.full_name}),e.jsxs(b,{variant:s.photographers?.pay_tiers?.name?.toLowerCase(),size:"sm",children:[s.photographers?.pay_tiers?.name," Photographer"]})]})]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex items-center text-dusty-600",children:[e.jsx(q,{className:"w-4 h-4 mr-2"}),s.photographers?.users?.email]}),e.jsxs("div",{className:"flex items-center text-dusty-600",children:[e.jsx(L,{className:"w-4 h-4 mr-2"}),s.photographers?.users?.phone]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-4",children:"Event Details"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(R,{className:"w-5 h-5 mr-3 text-dusty-400"}),p(new Date(s.event_date),"EEEE, MMMM dd, yyyy")]}),e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(U,{className:"w-5 h-5 mr-3 text-dusty-400"}),s.event_time," • ",s.packages?.duration_minutes," minutes"]}),e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(F,{className:"w-5 h-5 mr-3 text-dusty-400"}),e.jsxs("div",{children:[e.jsx("p",{children:s.venue_name}),e.jsxs("p",{className:"text-sm text-dusty-600",children:[s.venue_address?.street,", ",s.venue_address?.city,", ",s.venue_address?.state," ",s.venue_address?.zip]})]})]})]})]})]}),e.jsx("div",{className:"mt-6 pt-6 border-t border-gray-200",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-3",children:"Package"}),e.jsxs(v,{className:"bg-gray-50",children:[e.jsx("h4",{className:"font-semibold text-dusty-900 mb-2",children:s.packages?.title}),s.packages?.includes&&e.jsx("ul",{className:"space-y-1",children:s.packages.includes.map((r,n)=>e.jsxs("li",{className:"text-sm text-dusty-600 flex items-center",children:[e.jsx(y,{className:"w-4 h-4 text-green-500 mr-2"}),r]},n))})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-3",children:"Payment Summary"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-dusty-700",children:[e.jsx("span",{children:"Package Price"}),e.jsxs("span",{className:"font-semibold",children:["$",s.total_amount]})]}),e.jsxs("div",{className:"flex justify-between text-green-600 text-lg pt-2 border-t",children:[e.jsx("span",{className:"font-semibold",children:"Total Paid"}),e.jsxs("span",{className:"font-bold",children:["$",s.total_amount]})]}),e.jsxs("div",{className:"flex items-center text-sm text-gray-500 mt-2",children:[e.jsx(V,{className:"w-4 h-4 mr-2"}),"Paid via Stripe"]})]})]})]})})]}),e.jsxs(v,{className:"mb-8",children:[e.jsx("h2",{className:"text-xl font-semibold text-dusty-900 mb-6",children:"What's Next?"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-primary-600 font-semibold text-sm",children:"1"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Complete Your Style Quiz"}),e.jsx("p",{className:"text-dusty-600 text-sm mb-2",children:"Help your photographer understand your vision"}),!s.personalization_data?.quizCompleted&&e.jsx(P,{to:`/book/quiz/${s.id}`,children:e.jsxs(g,{size:"sm",variant:"outline",children:["Take Quiz",e.jsx(Q,{className:"w-4 h-4 ml-2"})]})}),s.personalization_data?.quizCompleted&&e.jsxs(b,{variant:"success",children:[e.jsx(y,{className:"w-4 h-4 mr-1"}),"Completed"]})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-sage-600 font-semibold text-sm",children:"2"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Review Your Contract"}),e.jsx("p",{className:"text-dusty-600 text-sm mb-2",children:"Download or print your service agreement"}),e.jsxs("div",{className:"flex space-x-2",children:[e.jsxs(g,{size:"sm",variant:"outline",onClick:Y,children:[e.jsx(H,{className:"w-4 h-4 mr-2"}),"Print"]}),e.jsx("a",{href:j,download:!0,children:e.jsxs(g,{size:"sm",variant:"outline",children:[e.jsx(O,{className:"w-4 h-4 mr-2"}),"Download"]})})]})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-dusty-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-dusty-600 font-semibold text-sm",children:"3"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Prepare for Your Session"}),e.jsx("p",{className:"text-dusty-600 text-sm",children:"Your photographer will contact you 1 week before the event to finalize details"})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-yellow-600 font-semibold text-sm",children:"4"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Receive Your Photos"}),e.jsx("p",{className:"text-dusty-600 text-sm",children:"Photos will be delivered within 4-6 weeks after your event"})]})]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 justify-center",children:[e.jsx(P,{to:"/dashboard",children:e.jsx(g,{size:"lg",children:"Go to Dashboard"})}),e.jsxs(g,{size:"lg",variant:"outline",onClick:I,children:[e.jsx(G,{className:"w-5 h-5 mr-2"}),"Share Booking"]})]}),S&&e.jsx("div",{className:"mt-8 text-center text-dusty-600",children:e.jsxs("div",{className:"inline-flex items-center",children:[e.jsx("div",{className:"animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"}),"Sending confirmation emails..."]})})]})]}):null};export{ce as default};
//# sourceMappingURL=BookingConfirmation-DWuNNww7.js.map
