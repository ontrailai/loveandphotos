import{j as e,K as u,v as x,T as f}from"./ui-D86Mbp3F.js";import"./react-C3Xvg9zH.js";const _=({photographer:s,className:i="",size:r="default"})=>{if(!s)return null;const t=s.manual_override_acceptance_rate??s.acceptance_rate,n=s.manual_override_response_time??s.avg_response_time_minutes,m=s.has_minimum_data??!1,c=a=>{if(!a||a<0)return null;if(a<60)return`${a} minute${a===1?"":"s"}`;if(a<1440){const l=Math.round(a/60);return`${l} hour${l===1?"":"s"}`}else{const l=Math.round(a/1440);return`${l} day${l===1?"":"s"}`}};if(!m&&!t&&!n)return e.jsxs("div",{className:`flex items-center gap-2 text-muted-foreground ${i}`,children:[e.jsx(u,{className:"w-4 h-4"}),e.jsx("span",{className:"text-sm",children:"New photographer - metrics coming soon"})]});const o={small:"text-xs px-2 py-0.5 gap-1",default:"text-sm px-3 py-1 gap-1.5",large:"text-base px-4 py-1.5 gap-2"},d={small:"w-3 h-3",default:"w-4 h-4",large:"w-5 h-5"};return e.jsxs("div",{className:`flex flex-wrap items-center gap-2 ${i}`,children:[n!=null&&e.jsxs("div",{className:`
            inline-flex items-center
            bg-green-100 text-green-800 
            rounded-full font-medium
            ${o[r]}
          `,role:"status","aria-label":`Typically responds in ${c(n)}`,children:[e.jsx(x,{className:d[r]}),e.jsxs("span",{children:["Responds in ",c(n)]})]}),t!=null&&e.jsxs("div",{className:`
            inline-flex items-center
            ${t>=80?"bg-blue-100 text-blue-800":t>=60?"bg-yellow-100 text-yellow-800":"bg-gray-100 text-gray-800"}
            rounded-full font-medium
            ${o[r]}
          `,role:"status","aria-label":`Accepts ${Math.round(t)}% of booking requests`,children:[e.jsx(f,{className:d[r]}),e.jsxs("span",{children:["Accepts ",Math.round(t),"% of bookings"]})]}),(s.manual_override_acceptance_rate||s.manual_override_response_time)&&e.jsx("div",{className:"text-xs text-muted-foreground italic",title:"Manually set by admin",children:"(admin override)"})]})};export{_ as P};
//# sourceMappingURL=PhotographerMetricBadges-DrpFpWa-.js.map
