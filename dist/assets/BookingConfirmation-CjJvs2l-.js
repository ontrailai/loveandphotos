import{c as le,s as u,u as fe,a as ye,h as ve,r as v,z as g,j as e,g as N,C as $,e as C,l as be,P as we,d as je,f as _e,M as Ne,m as $e,L as oe,B as b,A as Ce,D as Pe}from"./index-lNy3DQVp.js";import{f as x}from"./index-DhHBP2zF.js";const Ee=le("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]),ke=le("Share",[["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}],["polyline",{points:"16 6 12 2 8 6",key:"m901s6"}],["line",{x1:"12",x2:"12",y1:"2",y2:"15",key:"1p0rca"}]]),ie=async({bookingId:t,recipientType:r})=>{try{const{data:n,error:l}=await u.from("bookings").select(`
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
      `).eq("id",t).single();if(l)throw l;const i=r==="customer"?{email:n.customer.email,name:n.customer.full_name,type:"customer"}:{email:n.photographers.users.email,name:n.photographers.users.full_name,type:"photographer"},d=r==="customer"?De(n):Me(n),{data:s,error:m}=await u.functions.invoke("send-email",{body:{to:i.email,subject:d.subject,html:d.html,text:d.text}});return m&&(console.error("Email send error:",m),await Se({bookingId:t,recipientType:r,recipient:i,content:d})),{success:!0,data:s}}catch(n){throw console.error("Error sending confirmation email:",n),n}},De=t=>{const r=x(new Date(t.event_date),"EEEE, MMMM dd, yyyy"),n=t.contract_url||"#",l="http://localhost:5173/dashboard",i=`http://localhost:5173/book/quiz/${t.id}`,d=`Booking Confirmed - ${t.photographers.users.full_name} for ${r}`,s=`
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
              <span>${r}</span>
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
              <br><a href="${n}" class="button">View Contract →</a>
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
          <p>Questions? Reply to this email or contact us at support@lovep.com</p>
          <p>© ${new Date().getFullYear()} LoveP Marketplace. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,m=`
Booking Confirmed!

Hi ${t.customer.full_name},

Your booking with ${t.photographers.users.full_name} has been confirmed.

EVENT DETAILS:
- Date: ${r}
- Time: ${t.event_time}
- Duration: ${t.packages.duration_minutes} minutes
- Venue: ${t.venue_name}
- Package: ${t.packages.title}
- Total Paid: $${t.total_amount}

NEXT STEPS:
1. Complete your style quiz: ${i}
2. Review your contract: ${n}
3. Your photographer will contact you 1 week before the event
4. Photos will be delivered within 4-6 weeks

View in dashboard: ${l}

Questions? Contact us at support@lovep.com
  `;return{subject:d,html:s,text:m}},Me=t=>{var s,m,w,j;const r=x(new Date(t.event_date),"EEEE, MMMM dd, yyyy"),n="http://localhost:5173/dashboard/photographer/job-queue",l=`New Booking Alert - ${t.customer.full_name} on ${r}`,i=`
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
            <p><strong>Date:</strong> ${r}</p>
            <p><strong>Time:</strong> ${t.event_time}</p>
            <p><strong>Duration:</strong> ${t.packages.duration_minutes} minutes</p>
            <p><strong>Event Type:</strong> ${t.event_type}</p>
            <p><strong>Venue:</strong> ${t.venue_name}</p>
            <p><strong>Address:</strong> ${(s=t.venue_address)==null?void 0:s.street}, ${(m=t.venue_address)==null?void 0:m.city}, ${(w=t.venue_address)==null?void 0:w.state} ${(j=t.venue_address)==null?void 0:j.zip}</p>
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
            <a href="${n}" class="button">View in Job Queue</a>
          </div>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <strong>Delivery Deadline:</strong> Photos must be delivered by ${x(addDays(new Date(t.event_date),42),"MMMM dd, yyyy")}
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
- Date: ${r}
- Time: ${t.event_time}
- Duration: ${t.packages.duration_minutes} minutes
- Venue: ${t.venue_name}
- Package: ${t.packages.title}
- Amount: $${t.total_amount} (PAID IN FULL)

ACTION REQUIRED:
1. Review booking in your dashboard
2. Contact client 1 week before event
3. Deliver photos within 4-6 weeks

View in Job Queue: ${n}
  `;return{subject:l,html:i,text:d}},Se=async({bookingId:t,recipientType:r,recipient:n,content:l})=>{try{const{error:i}=await u.from("email_queue").insert({booking_id:t,recipient_type:r,recipient_email:n.email,recipient_name:n.name,subject:l.subject,html_content:l.html,text_content:l.text,status:"pending",attempts:0,created_at:new Date().toISOString()});if(i)throw i}catch(i){console.error("Error queuing email:",i)}},Ae=()=>{var M,S,z,T,A,B,I,Y,q,L,R,U,F,V,Q,H,O,G,J,W,X,K,Z,ee,te,se;const{user:t,profile:r}=fe(),n=ye(),[l]=ve(),i=l.get("session_id"),d=l.get("booking_id"),[s,m]=v.useState(null),[w,j]=v.useState(!0),[de,P]=v.useState(!1),[E,k]=v.useState("");v.useEffect(()=>{i?ce():d?D(d):(g.error("Invalid confirmation link"),n("/dashboard"))},[i,d]);const ce=async()=>{var a;try{const c=await(await fetch(`/api/verify-payment?session_id=${i}`)).json();if(!c.success)throw new Error("Payment verification failed");const p=(a=c.metadata)==null?void 0:a.bookingId;if(!p)throw new Error("Booking ID not found");const{error:h}=await u.from("bookings").update({payment_status:"paid",booking_status:"confirmed",stripe_session_id:i,updated_at:new Date().toISOString()}).eq("id",p);if(h)throw h;await D(p),await he(p)}catch(o){console.error("Error verifying payment:",o),g.error("Failed to verify payment"),n("/dashboard")}},D=async a=>{try{const{data:o,error:c}=await u.from("bookings").select(`
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
        `).eq("id",a).eq("customer_id",t.id).single();if(c)throw c;if(!o){g.error("Booking not found"),n("/dashboard");return}m(o),o.contract_url?k(o.contract_url):await me(o)}catch(o){console.error("Error loading booking:",o),g.error("Failed to load booking details")}finally{j(!1)}},me=async a=>{try{const o=pe(a),c=new Blob([o],{type:"text/html"}),p=new File([c],`contract-${a.id}.html`),h=`contracts/${a.id}/contract.html`,{data:_,error:f}=await u.storage.from("contracts").upload(h,p,{contentType:"text/html",upsert:!0});if(f)throw f;const{data:{publicUrl:y}}=u.storage.from("contracts").getPublicUrl(h);k(y),await u.from("bookings").update({contract_url:y,updated_at:new Date().toISOString()}).eq("id",a.id)}catch(o){console.error("Error generating contract:",o)}},pe=a=>{var o,c,p,h,_,f,y,ae,re,ne;return`
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
          <p>This agreement is entered into on ${x(new Date,"MMMM dd, yyyy")} between:</p>
          <table>
            <tr>
              <td><strong>Client:</strong></td>
              <td>${r==null?void 0:r.full_name}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>${r==null?void 0:r.email}</td>
            </tr>
            <tr>
              <td><strong>Phone:</strong></td>
              <td>${r==null?void 0:r.phone}</td>
            </tr>
            <tr>
              <td><strong>Photographer:</strong></td>
              <td>${(c=(o=a.photographers)==null?void 0:o.users)==null?void 0:c.full_name}</td>
            </tr>
            <tr>
              <td><strong>Package:</strong></td>
              <td>${(p=a.packages)==null?void 0:p.title}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Event Details</h2>
          <table>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${x(new Date(a.event_date),"MMMM dd, yyyy")}</td>
            </tr>
            <tr>
              <td><strong>Time:</strong></td>
              <td>${a.event_time}</td>
            </tr>
            <tr>
              <td><strong>Duration:</strong></td>
              <td>${(h=a.packages)==null?void 0:h.duration_minutes} minutes</td>
            </tr>
            <tr>
              <td><strong>Venue:</strong></td>
              <td>${a.venue_name}</td>
            </tr>
            <tr>
              <td><strong>Address:</strong></td>
              <td>
                ${(_=a.venue_address)==null?void 0:_.street}, 
                ${(f=a.venue_address)==null?void 0:f.city}, 
                ${(y=a.venue_address)==null?void 0:y.state} 
                ${(ae=a.venue_address)==null?void 0:ae.zip}
              </td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Payment Terms</h2>
          <table>
            <tr>
              <td><strong>Total Amount:</strong></td>
              <td>$${a.total_amount}</td>
            </tr>
            <tr>
              <td><strong>Payment Status:</strong></td>
              <td>PAID IN FULL</td>
            </tr>
            <tr>
              <td><strong>Payment Date:</strong></td>
              <td>${x(new Date,"MMMM dd, yyyy")}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h2>Deliverables</h2>
          <ul>
            ${((ne=(re=a.packages)==null?void 0:re.deliverables)==null?void 0:ne.map(ge=>`<li>${ge}</li>`).join(""))||""}
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
          <p>Date: ${x(new Date,"MMMM dd, yyyy, h:mm a")}</p>
        </div>
      </body>
      </html>
    `},he=async a=>{P(!0);try{await ie({bookingId:a,recipientType:"customer"}),await ie({bookingId:a,recipientType:"photographer"}),g.success("Confirmation emails sent!")}catch(o){console.error("Error sending emails:",o)}finally{P(!1)}},ue=()=>{var a;(a=window.open(E,"_blank"))==null||a.print()},xe=()=>{const a=`${window.location.origin}/booking/${s.id}`;navigator.clipboard.writeText(a),g.success("Booking link copied to clipboard")};return w?e.jsx("div",{className:"min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center",children:e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"})}):s?e.jsxs("div",{className:"min-h-screen bg-gradient-to-br from-green-50 to-blue-50",children:[e.jsx("div",{className:"bg-white border-b border-gray-200",children:e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center",children:[e.jsx("div",{className:"inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4",children:e.jsx(N,{className:"w-12 h-12 text-green-600"})}),e.jsx("h1",{className:"text-3xl font-display font-bold text-dusty-900 mb-2",children:"Booking Confirmed!"}),e.jsx("p",{className:"text-lg text-dusty-600",children:"Your photography session has been successfully booked"})]})}),e.jsxs("div",{className:"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:[e.jsxs($,{className:"mb-8",children:[e.jsx("div",{className:"border-b border-gray-200 pb-6 mb-6",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h2",{className:"text-xl font-semibold text-dusty-900",children:"Booking Details"}),e.jsx(C,{variant:"success",size:"lg",children:"Confirmed"})]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-4",children:"Your Photographer"}),e.jsxs("div",{className:"flex items-center space-x-4 mb-4",children:[e.jsx("img",{src:((S=(M=s.photographers)==null?void 0:M.users)==null?void 0:S.avatar_url)||`https://ui-avatars.com/api/?name=${(T=(z=s.photographers)==null?void 0:z.users)==null?void 0:T.full_name}`,alt:(B=(A=s.photographers)==null?void 0:A.users)==null?void 0:B.full_name,className:"w-16 h-16 rounded-full object-cover"}),e.jsxs("div",{children:[e.jsx("p",{className:"font-semibold text-dusty-900",children:(Y=(I=s.photographers)==null?void 0:I.users)==null?void 0:Y.full_name}),e.jsxs(C,{variant:(R=(L=(q=s.photographers)==null?void 0:q.pay_tiers)==null?void 0:L.name)==null?void 0:R.toLowerCase(),size:"sm",children:[(F=(U=s.photographers)==null?void 0:U.pay_tiers)==null?void 0:F.name," Photographer"]})]})]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex items-center text-dusty-600",children:[e.jsx(be,{className:"w-4 h-4 mr-2"}),(Q=(V=s.photographers)==null?void 0:V.users)==null?void 0:Q.email]}),e.jsxs("div",{className:"flex items-center text-dusty-600",children:[e.jsx(we,{className:"w-4 h-4 mr-2"}),(O=(H=s.photographers)==null?void 0:H.users)==null?void 0:O.phone]})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-4",children:"Event Details"}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(je,{className:"w-5 h-5 mr-3 text-dusty-400"}),x(new Date(s.event_date),"EEEE, MMMM dd, yyyy")]}),e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(_e,{className:"w-5 h-5 mr-3 text-dusty-400"}),s.event_time," • ",(G=s.packages)==null?void 0:G.duration_minutes," minutes"]}),e.jsxs("div",{className:"flex items-center text-dusty-700",children:[e.jsx(Ne,{className:"w-5 h-5 mr-3 text-dusty-400"}),e.jsxs("div",{children:[e.jsx("p",{children:s.venue_name}),e.jsxs("p",{className:"text-sm text-dusty-600",children:[(J=s.venue_address)==null?void 0:J.street,", ",(W=s.venue_address)==null?void 0:W.city,", ",(X=s.venue_address)==null?void 0:X.state," ",(K=s.venue_address)==null?void 0:K.zip]})]})]})]})]})]}),e.jsx("div",{className:"mt-6 pt-6 border-t border-gray-200",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-3",children:"Package"}),e.jsxs($,{className:"bg-gray-50",children:[e.jsx("h4",{className:"font-semibold text-dusty-900 mb-2",children:(Z=s.packages)==null?void 0:Z.title}),((ee=s.packages)==null?void 0:ee.includes)&&e.jsx("ul",{className:"space-y-1",children:s.packages.includes.map((a,o)=>e.jsxs("li",{className:"text-sm text-dusty-600 flex items-center",children:[e.jsx(N,{className:"w-4 h-4 text-green-500 mr-2"}),a]},o))})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-3",children:"Payment Summary"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-dusty-700",children:[e.jsx("span",{children:"Package Price"}),e.jsxs("span",{className:"font-semibold",children:["$",s.total_amount]})]}),e.jsxs("div",{className:"flex justify-between text-green-600 text-lg pt-2 border-t",children:[e.jsx("span",{className:"font-semibold",children:"Total Paid"}),e.jsxs("span",{className:"font-bold",children:["$",s.total_amount]})]}),e.jsxs("div",{className:"flex items-center text-sm text-gray-500 mt-2",children:[e.jsx($e,{className:"w-4 h-4 mr-2"}),"Paid via Stripe"]})]})]})]})})]}),e.jsxs($,{className:"mb-8",children:[e.jsx("h2",{className:"text-xl font-semibold text-dusty-900 mb-6",children:"What's Next?"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-blush-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-blush-600 font-semibold text-sm",children:"1"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Complete Your Style Quiz"}),e.jsx("p",{className:"text-dusty-600 text-sm mb-2",children:"Help your photographer understand your vision"}),!((te=s.personalization_data)!=null&&te.quizCompleted)&&e.jsx(oe,{to:`/book/quiz/${s.id}`,children:e.jsxs(b,{size:"sm",variant:"outline",children:["Take Quiz",e.jsx(Ce,{className:"w-4 h-4 ml-2"})]})}),((se=s.personalization_data)==null?void 0:se.quizCompleted)&&e.jsxs(C,{variant:"success",children:[e.jsx(N,{className:"w-4 h-4 mr-1"}),"Completed"]})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-sage-600 font-semibold text-sm",children:"2"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Review Your Contract"}),e.jsx("p",{className:"text-dusty-600 text-sm mb-2",children:"Download or print your service agreement"}),e.jsxs("div",{className:"flex space-x-2",children:[e.jsxs(b,{size:"sm",variant:"outline",onClick:ue,children:[e.jsx(Ee,{className:"w-4 h-4 mr-2"}),"Print"]}),e.jsx("a",{href:E,download:!0,children:e.jsxs(b,{size:"sm",variant:"outline",children:[e.jsx(Pe,{className:"w-4 h-4 mr-2"}),"Download"]})})]})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-dusty-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-dusty-600 font-semibold text-sm",children:"3"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Prepare for Your Session"}),e.jsx("p",{className:"text-dusty-600 text-sm",children:"Your photographer will contact you 1 week before the event to finalize details"})]})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("div",{className:"flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-4",children:e.jsx("span",{className:"text-yellow-600 font-semibold text-sm",children:"4"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium text-dusty-900 mb-1",children:"Receive Your Photos"}),e.jsx("p",{className:"text-dusty-600 text-sm",children:"Photos will be delivered within 4-6 weeks after your event"})]})]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 justify-center",children:[e.jsx(oe,{to:"/dashboard",children:e.jsx(b,{size:"lg",children:"Go to Dashboard"})}),e.jsxs(b,{size:"lg",variant:"outline",onClick:xe,children:[e.jsx(ke,{className:"w-5 h-5 mr-2"}),"Share Booking"]})]}),de&&e.jsx("div",{className:"mt-8 text-center text-dusty-600",children:e.jsxs("div",{className:"inline-flex items-center",children:[e.jsx("div",{className:"animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blush-500 mr-2"}),"Sending confirmation emails..."]})})]})]}):null};export{Ae as default};
