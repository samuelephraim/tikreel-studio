import { useState, useCallback, useEffect, useRef } from "react";

// ══════════════════════════════════════════════
//  CONFIG  — edit these before going live
// ══════════════════════════════════════════════
const PAYSTACK_PUBLIC_KEY = "psk_live_825a08aa33d6c43de8f1b05694665283d415c837"; // YOUR KEY
const ADMIN_PASSWORD      = "tiktok$444";   // change this!
const MONTHLY_AMOUNT      = 200000;        // ₦2,000 in kobo
const YEARLY_AMOUNT       = 1500000;       // ₦15,000 in kobo
const FREE_LIMIT          = 3;

// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════
const TOPICS = [
  { id:"motivation",    label:"💪 Motivation",    color:"#FF6B35" },
  { id:"business",      label:"💼 Business",       color:"#4ECDC4" },
  { id:"fashion",       label:"👗 Fashion",        color:"#FF0080" },
  { id:"food",          label:"🍕 Food & Recipe",  color:"#FFD93D" },
  { id:"fitness",       label:"🏋️ Fitness",       color:"#6BCB77" },
  { id:"education",     label:"📚 Education",      color:"#4D96FF" },
  { id:"entertainment", label:"🎭 Entertainment",  color:"#FF4D6D" },
  { id:"travel",        label:"✈️ Travel",         color:"#C77DFF" },
  { id:"finance",       label:"💰 Finance",        color:"#52B788" },
  { id:"love",          label:"❤️ Love & Dating",  color:"#FF6B9D" },
  { id:"tech",          label:"🤖 Tech & AI",      color:"#00B4D8" },
  { id:"beauty",        label:"💄 Beauty",         color:"#E040FB" },
  { id:"parenting",     label:"👶 Parenting",      color:"#FFB347" },
  { id:"spirituality",  label:"🙏 Spirituality",   color:"#A8DADC" },
];
const FORMATS = [
  { id:"hook",  label:"🪝 Hook Script"  },
  { id:"story", label:"📖 Story Arc"    },
  { id:"tips",  label:"✅ Tips List"    },
  { id:"pov",   label:"🎬 POV Format"   },
  { id:"trend", label:"🔥 Trend Caption"},
  { id:"cta",   label:"📣 CTA Post"     },
];
const TONES = ["Viral","Funny","Emotional","Informative","Hype","Calm"];

// ══════════════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════════════
const ls  = (k,fb)=>{ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):fb; }catch{ return fb; }};
const lss = (k,v) =>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };

// ══════════════════════════════════════════════
//  PAYSTACK
// ══════════════════════════════════════════════
function loadPaystack(){
  return new Promise(res=>{
    if(window.PaystackPop){res();return;}
    const s=document.createElement("script");
    s.src="https://js.paystack.co/v1/inline.js";
    s.onload=res; document.head.appendChild(s);
  });
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
const fmt  = n=>"₦"+Number(n).toLocaleString();
const fmtD = ts=>new Date(ts).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"});
const fmtDT= ts=>new Date(ts).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const dayKey= ts=>new Date(ts).toLocaleDateString("en-NG",{day:"2-digit",month:"short"});

// ══════════════════════════════════════════════
//  SEED DEMO PAYMENTS (so dashboard isn't empty)
// ══════════════════════════════════════════════
function seedDemoPayments(){
  if(ls("tikr_seeded",false)) return;
  const emails=["ada@gmail.com","chidi@yahoo.com","ngozi@outlook.com","emeka@gmail.com","bola@icloud.com","tunde@gmail.com","amara@gmail.com"];
  const plans=["monthly","monthly","monthly","yearly","monthly","yearly","monthly"];
  const now=Date.now();
  const payments=emails.map((email,i)=>({
    ref:"demo_"+Math.random().toString(36).slice(2),
    email, plan:plans[i],
    amount:plans[i]==="monthly"?2000:15000,
    paidAt: now-(i*2+1)*86400000*2,
    expiry: now+(plans[i]==="monthly"?30:365)*86400000-(i*2)*86400000,
    status:"active",
    manual:false,
  }));
  lss("tikr_payments",payments);
  lss("tikr_seeded",true);
}

// ══════════════════════════════════════════════
//  SHARED COMPONENTS
// ══════════════════════════════════════════════
function Spinner(){
  return(
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid #1A1A30",borderTop:"3px solid #FF0050",animation:"spin .8s linear infinite",margin:"0 auto 16px"}}/>
      <p style={{color:"#555",fontSize:14}}>Crafting viral templates…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Badge({children,color="#FF0050"}){
  return <span style={{padding:"2px 8px",borderRadius:20,background:color+"22",border:`1px solid ${color}44`,color,fontSize:10,fontWeight:700}}>{children}</span>;
}

function StatCard({label,value,sub,color="#FF0050",icon}){
  return(
    <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:14,padding:"18px 20px",flex:1,minWidth:140}}>
      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
      <p style={{margin:"0 0 2px",fontSize:24,fontWeight:800,color}}>{value}</p>
      <p style={{margin:"0 0 4px",fontSize:12,color:"#888"}}>{label}</p>
      {sub && <p style={{margin:0,fontSize:10,color:"#444"}}>{sub}</p>}
    </div>
  );
}

// ── Mini Bar Chart (pure CSS) ──────────────────
function BarChart({data,color="#FF0050"}){
  const max=Math.max(...data.map(d=>d.v),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90,padding:"0 4px"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontSize:9,color:"#555"}}>{d.v>0?fmt(d.v*1000).replace("₦","₦"):"—"}</span>
          <div style={{width:"100%",background:color,borderRadius:"4px 4px 0 0",height:Math.max(4,(d.v/max)*64),opacity:.85,transition:"height .3s"}}/>
          <span style={{fontSize:8,color:"#444",whiteSpace:"nowrap"}}>{d.k}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════
//  PAYWALL MODAL
// ══════════════════════════════════════════════
function PricingModal({onClose,onSuccess}){
  const [plan,setPlan]   = useState("monthly");
  const [email,setEmail] = useState("");
  const [paying,setPaying]= useState(false);
  const [err,setErr]     = useState("");

  const pay=async()=>{
    if(!email.includes("@")){setErr("Enter a valid email address.");return;}
    setErr(""); setPaying(true);
    await loadPaystack();
    const amount=plan==="monthly"?MONTHLY_AMOUNT:YEARLY_AMOUNT;
    const handler=window.PaystackPop.setup({
      key:PAYSTACK_PUBLIC_KEY, email, amount, currency:"NGN",
      metadata:{plan},
      callback(res){
        const expiry=Date.now()+(plan==="monthly"?30:365)*86400000;
        const rec={ref:res.reference,email,plan,amount:plan==="monthly"?2000:15000,paidAt:Date.now(),expiry,status:"active",manual:false};
        lss("tikr_premium",{ref:res.reference,plan,expiry,email});
        const prev=ls("tikr_payments",[]);
        lss("tikr_payments",[rec,...prev]);
        setPaying(false);
        onSuccess({ref:res.reference,plan,email});
      },
      onClose(){ setPaying(false); },
    });
    handler.openIframe();
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0D0D18",border:"1px solid #222",borderRadius:20,width:"100%",maxWidth:420,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#FF0050,#000,#00F2EA)",padding:"2px"}}>
          <div style={{background:"#0D0D18",padding:"22px 24px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{margin:"0 0 4px",fontSize:11,color:"#FF0050",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>🔒 Free Limit Reached</p>
                <h2 style={{margin:0,fontSize:22,fontWeight:800}}>Unlock <span style={{background:"linear-gradient(90deg,#FF0050,#00F2EA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TikReel Pro</span></h2>
                <p style={{margin:"6px 0 0",fontSize:13,color:"#666"}}>Generate unlimited viral templates</p>
              </div>
              <button onClick={onClose} style={{background:"#1A1A30",border:"none",borderRadius:8,width:32,height:32,color:"#555",cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"18px 0"}}>
              {["♾️ Unlimited generations","14 topic categories","6 reel formats","6 content tones","✏️ Full editing","❤️ Save favourites","📋 1-click copy","🔥 Weekly new topics"].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#aaa"}}>
                  <span style={{color:"#00F2EA",fontWeight:700}}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:"18px 24px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[{id:"monthly",label:"Monthly",price:"₦2,000",sub:"/month",badge:null},{id:"yearly",label:"Yearly",price:"₦15,000",sub:"/year",badge:"Save 37%"}].map(p=>(
              <button key={p.id} onClick={()=>setPlan(p.id)} style={{padding:14,borderRadius:12,border:`2px solid ${plan===p.id?"#FF0050":"#1A1A30"}`,background:plan===p.id?"#FF005015":"#111",cursor:"pointer",textAlign:"left",position:"relative"}}>
                {p.badge&&<span style={{position:"absolute",top:-8,right:10,background:"#00F2EA",color:"#000",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{p.badge}</span>}
                <p style={{margin:"0 0 4px",fontSize:11,color:plan===p.id?"#FF0050":"#555",fontWeight:700,textTransform:"uppercase"}}>{p.label}</p>
                <p style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>{p.price}<span style={{fontSize:11,color:"#555",fontWeight:400}}>{p.sub}</span></p>
              </button>
            ))}
          </div>
          <input placeholder="Your email address" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}
            style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${err?"#FF0050":"#222"}`,background:"#111",color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:err?6:12}}/>
          {err&&<p style={{margin:"0 0 10px",fontSize:11,color:"#FF0050"}}>{err}</p>}
          <button onClick={pay} disabled={paying} style={{width:"100%",padding:14,borderRadius:12,border:"none",cursor:paying?"not-allowed":"pointer",fontSize:15,fontWeight:800,background:paying?"#222":"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",boxShadow:paying?"none":"0 4px 24px #FF005055"}}>
            {paying?"Opening Paystack…":`Pay ${plan==="monthly"?"₦2,000":"₦15,000"} — Go Pro`}
          </button>
          <p style={{margin:"10px 0 0",fontSize:11,color:"#333",textAlign:"center"}}>🔒 Secured by Paystack · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({info,onClose}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0D0D18",border:"1px solid #00F2EA44",borderRadius:20,padding:32,maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:12}}>🎉</div>
        <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800}}>You're <span style={{color:"#00F2EA"}}>Pro</span> now!</h2>
        <p style={{color:"#888",fontSize:13,margin:"0 0 4px"}}>Plan: <b style={{color:"#fff"}}>{info.plan==="monthly"?"Monthly ₦2,000":"Yearly ₦15,000"}</b></p>
        <p style={{color:"#555",fontSize:11,margin:"0 0 20px"}}>Ref: {info.ref}</p>
        <button onClick={onClose} style={{padding:"12px 32px",borderRadius:12,border:"none",background:"linear-gradient(90deg,#00F2EA,#4ECDC4)",color:"#000",fontWeight:800,fontSize:14,cursor:"pointer"}}>Start Creating ⚡</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  ADMIN LOGIN
// ══════════════════════════════════════════════
function AdminLogin({onSuccess,onBack}){
  const [pw,setPw]   = useState("");
  const [err,setErr] = useState("");
  const submit=()=>{
    if(pw===ADMIN_PASSWORD){onSuccess();}
    else{setErr("Wrong password. Try again."); setPw("");}
  };
  return(
    <div style={{minHeight:"100vh",background:"#08080F",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:20,padding:36,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🛡️</div>
        <h2 style={{margin:"0 0 6px",fontSize:22,fontWeight:800}}>Admin Login</h2>
        <p style={{color:"#555",fontSize:13,margin:"0 0 24px"}}>TikReel Studio Dashboard</p>
        <input type="password" placeholder="Admin password" value={pw}
          onChange={e=>{setPw(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${err?"#FF0050":"#222"}`,background:"#111",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:err?6:14}}/>
        {err&&<p style={{margin:"0 0 10px",fontSize:11,color:"#FF0050"}}>{err}</p>}
        <button onClick={submit} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",marginBottom:12}}>
          Enter Dashboard
        </button>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#444",fontSize:12,cursor:"pointer"}}>← Back to App</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  ADMIN DASHBOARD
// ══════════════════════════════════════════════
function AdminDashboard({onBack}){
  const [payments,setPayments]   = useState(()=>ls("tikr_payments",[]));
  const [adminTab,setAdminTab]   = useState("overview");
  const [search,setSearch]       = useState("");
  const [grantEmail,setGrantEmail]= useState("");
  const [grantPlan,setGrantPlan] = useState("monthly");
  const [grantMsg,setGrantMsg]   = useState("");
  const [revokeMsg,setRevokeMsg] = useState("");

  const refresh=()=>setPayments(ls("tikr_payments",[]));

  // ── Stats ──────────────────────────────────
  const now       = Date.now();
  const active    = payments.filter(p=>p.expiry>now);
  const monthly   = active.filter(p=>p.plan==="monthly");
  const yearly    = active.filter(p=>p.plan==="yearly");
  const totalRev  = payments.reduce((s,p)=>s+p.amount,0);
  const thisMonth = payments.filter(p=>p.paidAt>now-30*86400000).reduce((s,p)=>s+p.amount,0);

  // ── Revenue chart — last 7 days ────────────
  const chartData = [...Array(7)].map((_,i)=>{
    const d = new Date(now-(6-i)*86400000);
    const k = d.toLocaleDateString("en-NG",{day:"2-digit",month:"short"});
    const v = payments.filter(p=>dayKey(p.paidAt)===k).reduce((s,p)=>s+p.amount,0)/1000;
    return {k,v};
  });

  // ── Grant manual access ────────────────────
  const grantAccess=()=>{
    if(!grantEmail.includes("@")){setGrantMsg("❌ Invalid email"); return;}
    const expiry=now+(grantPlan==="monthly"?30:365)*86400000;
    const rec={ref:"manual_"+Date.now(),email:grantEmail,plan:grantPlan,amount:0,paidAt:now,expiry,status:"active",manual:true};
    const updated=[rec,...payments.filter(p=>p.email!==grantEmail)];
    lss("tikr_payments",updated); setPayments(updated);
    setGrantEmail(""); setGrantMsg(`✅ Access granted to ${grantEmail}`);
    setTimeout(()=>setGrantMsg(""),3000);
  };

  // ── Revoke access ──────────────────────────
  const revoke=email=>{
    const updated=payments.map(p=>p.email===email?{...p,expiry:0,status:"revoked"}:p);
    lss("tikr_payments",updated); setPayments(updated);
    setRevokeMsg(`Revoked: ${email}`);
    setTimeout(()=>setRevokeMsg(""),3000);
  };

  // ── Export CSV ─────────────────────────────
  const exportCSV=()=>{
    const header="Email,Plan,Amount (₦),Date,Expiry,Status,Manual\n";
    const rows=payments.map(p=>`${p.email},${p.plan},${p.amount},${fmtD(p.paidAt)},${fmtD(p.expiry)},${p.expiry>now?"active":"expired"},${p.manual?"yes":"no"}`).join("\n");
    const blob=new Blob([header+rows],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="tikreel_subscribers.csv"; a.click();
  };

  const filtered=payments.filter(p=>p.email.toLowerCase().includes(search.toLowerCase()));

  const tabStyle=(id)=>({padding:"8px 18px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:adminTab===id?"linear-gradient(90deg,#FF0050,#FF6B35)":"#1A1A2E",color:"#fff",transition:"all .15s"});

  return(
    <div style={{minHeight:"100vh",background:"#08080F",color:"#fff",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {/* Admin Header */}
      <header style={{background:"linear-gradient(135deg,#FF0050 0%,#000 50%,#00F2EA 100%)",padding:"2px"}}>
        <div style={{background:"#08080F",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={onBack} style={{background:"#1A1A30",border:"none",borderRadius:8,padding:"6px 12px",color:"#888",cursor:"pointer",fontSize:12}}>← App</button>
            <div>
              <h1 style={{margin:0,fontSize:18,fontWeight:800}}>
                <span style={{background:"linear-gradient(90deg,#FF0050,#00F2EA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TikReel</span>
                <span style={{color:"#fff",fontWeight:300}}> Admin</span>
              </h1>
              <p style={{margin:0,fontSize:10,color:"#444"}}>Business Dashboard</p>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["overview","📊 Overview"],["subscribers","👥 Subscribers"],["payments","💳 Payments"],["access","🔑 Access"]].map(([id,label])=>(
              <button key={id} onClick={()=>setAdminTab(id)} style={tabStyle(id)}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <div style={{padding:20,maxWidth:1100,margin:"0 auto"}}>

        {/* ── OVERVIEW TAB ────────────────────── */}
        {adminTab==="overview" && (
          <>
            {/* Stat cards */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
              <StatCard icon="💰" label="Total Revenue"     value={fmt(totalRev)} sub="All time"         color="#FFD93D"/>
              <StatCard icon="📅" label="This Month"        value={fmt(thisMonth)} sub="Last 30 days"    color="#00F2EA"/>
              <StatCard icon="⚡" label="Active Subs"       value={active.length}  sub={`${monthly.length} monthly · ${yearly.length} yearly`} color="#FF0050"/>
              <StatCard icon="👥" label="Total Customers"   value={payments.length} sub="All time"       color="#C77DFF"/>
            </div>

            {/* Revenue chart */}
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,padding:20,marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <p style={{margin:"0 0 3px",fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Revenue Chart</p>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700}}>Last 7 Days</h3>
                </div>
                <Badge color="#FFD93D">₦ {fmt(chartData.reduce((s,d)=>s+d.v*1000,0)).replace("₦","")}</Badge>
              </div>
              <BarChart data={chartData} color="#FF0050"/>
            </div>

            {/* Plan breakdown */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:14,padding:18}}>
                <p style={{margin:"0 0 12px",fontSize:11,color:"#555",fontWeight:700,textTransform:"uppercase"}}>Plan Split</p>
                {[["Monthly ₦2,000",monthly.length,"#FF0050"],["Yearly ₦15,000",yearly.length,"#00F2EA"]].map(([label,count,color])=>(
                  <div key={label} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#888"}}>{label}</span>
                      <span style={{fontSize:12,fontWeight:700,color}}>{count}</span>
                    </div>
                    <div style={{height:6,background:"#1A1A30",borderRadius:3}}>
                      <div style={{height:"100%",width:`${active.length>0?(count/active.length)*100:0}%`,background:color,borderRadius:3,transition:"width .5s"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:14,padding:18}}>
                <p style={{margin:"0 0 12px",fontSize:11,color:"#555",fontWeight:700,textTransform:"uppercase"}}>Quick Actions</p>
                <button onClick={()=>setAdminTab("access")} style={{display:"block",width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #FF005033",background:"#FF005011",color:"#FF0050",cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:8,textAlign:"left"}}>
                  🔑 Grant Manual Access
                </button>
                <button onClick={exportCSV} style={{display:"block",width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #00F2EA33",background:"#00F2EA11",color:"#00F2EA",cursor:"pointer",fontSize:12,fontWeight:600,marginBottom:8,textAlign:"left"}}>
                  📥 Export Subscribers CSV
                </button>
                <button onClick={refresh} style={{display:"block",width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#666",cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"left"}}>
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            {/* Recent payments */}
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,padding:20}}>
              <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700}}>Recent Payments</h3>
              {payments.slice(0,5).map(p=>(
                <div key={p.ref} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #111",flexWrap:"wrap",gap:6}}>
                  <div>
                    <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:"#ddd"}}>{p.email}</p>
                    <p style={{margin:0,fontSize:10,color:"#444"}}>{fmtDT(p.paidAt)} · {p.ref.slice(0,18)}…</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Badge color={p.plan==="yearly"?"#00F2EA":"#FF6B35"}>{p.plan}</Badge>
                    <span style={{fontSize:13,fontWeight:700,color:"#FFD93D"}}>{p.amount>0?fmt(p.amount):"Free"}</span>
                    <Badge color={p.expiry>now?"#6BCB77":"#FF4444"}>{p.expiry>now?"Active":"Expired"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SUBSCRIBERS TAB ─────────────────── */}
        {adminTab==="subscribers" && (
          <>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input placeholder="🔍 Search by email…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:1,minWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#fff",fontSize:13,outline:"none"}}/>
              <button onClick={exportCSV} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #00F2EA33",background:"#00F2EA11",color:"#00F2EA",cursor:"pointer",fontSize:12,fontWeight:700}}>📥 Export CSV</button>
              <Badge color="#888">{active.length} active · {payments.length} total</Badge>
            </div>
            {revokeMsg&&<div style={{background:"#FF000022",border:"1px solid #FF000044",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#FF6666"}}>{revokeMsg}</div>}
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,overflow:"hidden"}}>
              {/* Table header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 90px 80px 80px",gap:8,padding:"10px 16px",borderBottom:"1px solid #1A1A30",fontSize:10,color:"#444",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
                <span>Email</span><span>Plan</span><span>Amount</span><span>Paid</span><span>Status</span><span>Action</span>
              </div>
              {filtered.length===0&&<p style={{textAlign:"center",color:"#333",padding:24,fontSize:13}}>No subscribers found.</p>}
              {filtered.map((p,i)=>(
                <div key={p.ref} style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 90px 80px 80px",gap:8,padding:"12px 16px",borderBottom:"1px solid #0A0A15",alignItems:"center",background:i%2===0?"transparent":"#0A0A14"}}>
                  <div>
                    <p style={{margin:"0 0 2px",fontSize:12,color:"#ddd",fontWeight:500}}>{p.email}</p>
                    <p style={{margin:0,fontSize:10,color:"#444"}}>{p.manual?"Manual grant":"Paystack"}</p>
                  </div>
                  <Badge color={p.plan==="yearly"?"#00F2EA":"#FF6B35"}>{p.plan}</Badge>
                  <span style={{fontSize:12,color:"#FFD93D",fontWeight:700}}>{p.amount>0?fmt(p.amount):"—"}</span>
                  <span style={{fontSize:11,color:"#666"}}>{fmtD(p.paidAt)}</span>
                  <Badge color={p.expiry>now?"#6BCB77":"#FF4444"}>{p.expiry>now?"Active":"Expired"}</Badge>
                  {p.expiry>now
                    ? <button onClick={()=>revoke(p.email)} style={{padding:"4px 10px",borderRadius:8,border:"1px solid #FF444433",background:"#FF000011",color:"#FF6666",cursor:"pointer",fontSize:11,fontWeight:600}}>Revoke</button>
                    : <span style={{fontSize:11,color:"#333"}}>—</span>
                  }
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PAYMENTS TAB ────────────────────── */}
        {adminTab==="payments" && (
          <>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input placeholder="🔍 Search by email or ref…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:1,minWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#fff",fontSize:13,outline:"none"}}/>
              <Badge color="#FFD93D">Total: {fmt(totalRev)}</Badge>
            </div>
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 70px 80px 80px",gap:8,padding:"10px 16px",borderBottom:"1px solid #1A1A30",fontSize:10,color:"#444",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
                <span>Email</span><span>Reference</span><span>Plan</span><span>Amount</span><span>Date</span>
              </div>
              {payments.filter(p=>p.email.includes(search)||p.ref.includes(search)).map((p,i)=>(
                <div key={p.ref} style={{display:"grid",gridTemplateColumns:"1fr 1fr 70px 80px 80px",gap:8,padding:"12px 16px",borderBottom:"1px solid #0A0A15",alignItems:"center",background:i%2===0?"transparent":"#0A0A14"}}>
                  <span style={{fontSize:12,color:"#ddd"}}>{p.email}</span>
                  <span style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{p.ref.slice(0,20)}…</span>
                  <Badge color={p.plan==="yearly"?"#00F2EA":"#FF6B35"}>{p.plan}</Badge>
                  <span style={{fontSize:12,color:"#FFD93D",fontWeight:700}}>{p.amount>0?fmt(p.amount):"Free"}</span>
                  <span style={{fontSize:11,color:"#555"}}>{fmtD(p.paidAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ACCESS MANAGEMENT TAB ───────────── */}
        {adminTab==="access" && (
          <>
            {/* Grant access */}
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,padding:22,marginBottom:16}}>
              <h3 style={{margin:"0 0 6px",fontSize:16,fontWeight:700}}>🔑 Grant Manual Access</h3>
              <p style={{margin:"0 0 16px",fontSize:12,color:"#555"}}>Give a user free Pro access (useful for influencers, testers, or support cases)</p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <input placeholder="User email" value={grantEmail} onChange={e=>{setGrantEmail(e.target.value);setGrantMsg("");}}
                  style={{flex:1,minWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#fff",fontSize:13,outline:"none"}}/>
                <select value={grantPlan} onChange={e=>setGrantPlan(e.target.value)}
                  style={{padding:"10px 14px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#fff",fontSize:13,cursor:"pointer"}}>
                  <option value="monthly">Monthly (30 days)</option>
                  <option value="yearly">Yearly (365 days)</option>
                </select>
                <button onClick={grantAccess} style={{padding:"10px 20px",borderRadius:10,border:"none",background:"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                  Grant Access
                </button>
              </div>
              {grantMsg&&<p style={{margin:"10px 0 0",fontSize:12,color:grantMsg.startsWith("✅")?"#6BCB77":"#FF6666"}}>{grantMsg}</p>}
            </div>

            {/* Active manual grants */}
            <div style={{background:"#0D0D18",border:"1px solid #1A1A30",borderRadius:16,padding:22,marginBottom:16}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700}}>Manual Grants</h3>
              {payments.filter(p=>p.manual&&p.expiry>now).length===0&&<p style={{color:"#333",fontSize:13}}>No active manual grants.</p>}
              {payments.filter(p=>p.manual&&p.expiry>now).map(p=>(
                <div key={p.ref} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #111",flexWrap:"wrap",gap:8}}>
                  <div>
                    <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:"#ddd"}}>{p.email}</p>
                    <p style={{margin:0,fontSize:10,color:"#444"}}>Expires {fmtD(p.expiry)} · {p.plan}</p>
                  </div>
                  <button onClick={()=>revoke(p.email)} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #FF444433",background:"#FF000011",color:"#FF6666",cursor:"pointer",fontSize:11,fontWeight:600}}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div style={{background:"#110808",border:"1px solid #330000",borderRadius:16,padding:22}}>
              <h3 style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:"#FF4444"}}>⚠️ Danger Zone</h3>
              <p style={{margin:"0 0 14px",fontSize:12,color:"#555"}}>These actions cannot be undone.</p>
              <button onClick={()=>{if(window.confirm("Reset ALL demo data?")){lss("tikr_payments",[]); lss("tikr_seeded",false); refresh();}}}
                style={{padding:"10px 18px",borderRadius:10,border:"1px solid #FF444433",background:"transparent",color:"#FF6666",cursor:"pointer",fontSize:12,fontWeight:600}}>
                🗑️ Clear All Demo Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════
export default function App(){
  useEffect(()=>{ seedDemoPayments(); },[]);

  const [view,setView]           = useState("app");   // app | adminLogin | admin
  const [activeTopic,setTopic]   = useState(TOPICS[0]);
  const [activeFormat,setFormat] = useState(FORMATS[0]);
  const [activeTone,setTone]     = useState(TONES[0]);
  const [templates,setTemplates] = useState([]);
  const [loading,setLoading]     = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [editContent,setEdit]    = useState("");
  const [saved,setSaved]         = useState(()=>ls("tikr_saved",[]));
  const [tab,setTab]             = useState("generate");
  const [copied,setCopied]       = useState(null);
  const [count,setCount]         = useState(5);
  const [freeUsed,setFreeUsed]   = useState(()=>ls("tikr_free_used",0));
  const [showPaywall,setPaywall] = useState(false);
  const [successInfo,setSuccess] = useState(null);
  const [premium,setPremium]     = useState(()=>{ const p=ls("tikr_premium",null); return p&&p.expiry>Date.now()?p:null; });
  const logoClicks               = useRef(0);
  const logoTimer                = useRef(null);

  const isPro   = !!premium;
  const freeLeft= Math.max(0,FREE_LIMIT-freeUsed);

  // Secret logo click to open admin
  const handleLogoClick=()=>{
    logoClicks.current+=1;
    clearTimeout(logoTimer.current);
    if(logoClicks.current>=5){ logoClicks.current=0; setView("adminLogin"); return; }
    logoTimer.current=setTimeout(()=>{ logoClicks.current=0; },1500);
  };

  const generate=useCallback(async()=>{
    if(!isPro&&freeUsed>=FREE_LIMIT){setPaywall(true);return;}
    setLoading(true); setTemplates([]);
    if(!isPro){ const n=freeUsed+1; setFreeUsed(n); lss("tikr_free_used",n); }
    try{
      const prompt=`You are a viral TikTok content strategist. Generate exactly ${count} unique TikTok reel templates for the topic: "${activeTopic.label.replace(/[^\w\s]/g,"").trim()}".
Format: ${activeFormat.label.replace(/[^\w\s]/g,"").trim()}
Tone: ${activeTone}
Rules:
- Ready to use, punchy, TikTok-optimised
- Hook, body, CTA included
- 5-7 relevant hashtags
- Authentic, not corporate
Respond ONLY with valid JSON array, no markdown:
[{"id":"1","title":"Short catchy name","hook":"Opening line","body":"Main content","cta":"Call to action","hashtags":"#tag1 #tag2","tip":"One filming tip"}]`;
      const res =await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const raw =data.content?.map(b=>b.text||"").join("")||"[]";
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setTemplates(parsed.map((t,i)=>({...t,id:`${Date.now()}-${i}`,topic:activeTopic.id,format:activeFormat.id,tone:activeTone})));
    }catch{ setTemplates([{id:"err",title:"Error",hook:"Could not generate. Please try again.",body:"",cta:"",hashtags:"",tip:""}]); }
    setLoading(false);
  },[activeTopic,activeFormat,activeTone,count,isPro,freeUsed]);

  const startEdit=t=>{ setEditingId(t.id); setEdit(`${t.hook}\n\n${t.body}\n\n${t.cta}\n\n${t.hashtags}`); };
  const saveEdit =id=>{ const[hook,body,cta,hashtags]=editContent.split("\n\n"); setTemplates(p=>p.map(t=>t.id===id?{...t,hook:hook||t.hook,body:body||t.body,cta:cta||t.cta,hashtags:hashtags||t.hashtags}:t)); setEditingId(null); };
  const copyTpl  =t=>{ navigator.clipboard.writeText(`${t.hook}\n\n${t.body}\n\n${t.cta}\n\n${t.hashtags}`).catch(()=>{}); setCopied(t.id); setTimeout(()=>setCopied(null),2000); };
  const saveTpl  =t=>{ const s=[{...t,savedAt:Date.now()},...saved.filter(x=>x.id!==t.id)]; setSaved(s); lss("tikr_saved",s); };
  const remSaved =id=>{ const s=saved.filter(x=>x.id!==id); setSaved(s); lss("tikr_saved",s); };

  const handlePaySuccess=info=>{ setPremium(info); setSuccess(info); setPaywall(false); };

  if(view==="adminLogin") return <AdminLogin onSuccess={()=>setView("admin")} onBack={()=>setView("app")}/>;
  if(view==="admin")      return <AdminDashboard onBack={()=>setView("app")}/>;

  const display=tab==="saved"?saved:templates;

  return(
    <div style={{minHeight:"100vh",background:"#08080F",color:"#fff",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {showPaywall&&<PricingModal onClose={()=>setPaywall(false)} onSuccess={handlePaySuccess}/>}
      {successInfo &&<SuccessBanner info={successInfo} onClose={()=>setSuccess(null)}/>}

      {/* Header */}
      <header style={{background:"linear-gradient(135deg,#FF0050 0%,#000 50%,#00F2EA 100%)",padding:"2px"}}>
        <div style={{background:"#08080F",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div onClick={handleLogoClick} style={{cursor:"default",userSelect:"none"}}>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,letterSpacing:"-0.5px"}}>
              <span style={{background:"linear-gradient(90deg,#FF0050,#00F2EA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TikReel</span>
              <span style={{color:"#fff",fontWeight:300}}> Studio</span>
            </h1>
            <p style={{margin:"2px 0 0",fontSize:10,color:"#333"}}>AI-Powered TikTok Template Generator</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {isPro
              ? <span style={{padding:"5px 12px",borderRadius:20,background:"#00F2EA22",border:"1px solid #00F2EA44",color:"#00F2EA",fontSize:11,fontWeight:700}}>⚡ PRO</span>
              : <button onClick={()=>setPaywall(true)} style={{padding:"5px 12px",borderRadius:20,background:"#FF005022",border:"1px solid #FF005044",color:"#FF0050",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔓 {freeLeft} free left · Upgrade</button>
            }
            <button onClick={()=>setTab("generate")} style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab==="generate"?"linear-gradient(90deg,#FF0050,#FF6B35)":"#1A1A2E",color:"#fff"}}>✨ Generate</button>
            <button onClick={()=>setTab("saved")}    style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:tab==="saved"?"linear-gradient(90deg,#00F2EA,#4ECDC4)":"#1A1A2E",color:tab==="saved"?"#000":"#fff"}}>❤️ Saved ({saved.length})</button>
            <button onClick={()=>setView("adminLogin")} style={{padding:"7px 14px",borderRadius:20,border:"1px solid #333",background:"transparent",color:"#444",cursor:"pointer",fontSize:11,fontWeight:600}}>🛡️ Admin</button>
          </div>
        </div>
      </header>

      <div style={{display:"flex",minHeight:"calc(100vh - 60px)"}}>
        {/* Sidebar */}
        {tab==="generate"&&(
          <aside style={{width:200,minWidth:200,background:"#0D0D18",borderRight:"1px solid #1A1A30",padding:"14px 10px",overflowY:"auto"}}>
            <p style={{fontSize:9,fontWeight:700,color:"#333",textTransform:"uppercase",letterSpacing:1,margin:"0 0 8px 4px"}}>Topics</p>
            {TOPICS.map(t=>(
              <button key={t.id} onClick={()=>setTopic(t)} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"8px 10px",marginBottom:2,borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",fontSize:12,fontWeight:activeTopic.id===t.id?700:400,background:activeTopic.id===t.id?`${t.color}22`:"transparent",color:activeTopic.id===t.id?t.color:"#666",borderLeft:activeTopic.id===t.id?`3px solid ${t.color}`:"3px solid transparent",transition:"all .15s"}}>
                {t.label}
              </button>
            ))}
          </aside>
        )}

        <main style={{flex:1,padding:18,overflowY:"auto"}}>
          {tab==="generate"&&(
            <>
              <div style={{background:"#0D0D18",borderRadius:16,padding:16,marginBottom:18,border:"1px solid #1A1A30"}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
                  <div style={{flex:1,minWidth:150}}>
                    <label style={{fontSize:9,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:7}}>Format</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {FORMATS.map(f=>(
                        <button key={f.id} onClick={()=>setFormat(f)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${activeFormat.id===f.id?"#FF0050":"#222"}`,background:activeFormat.id===f.id?"#FF005022":"#111",color:activeFormat.id===f.id?"#FF0050":"#555",cursor:"pointer",fontSize:11,fontWeight:600}}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:9,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:7}}>Tone</label>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {TONES.map(tone=>(
                        <button key={tone} onClick={()=>setTone(tone)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${activeTone===tone?"#00F2EA":"#222"}`,background:activeTone===tone?"#00F2EA22":"#111",color:activeTone===tone?"#00F2EA":"#555",cursor:"pointer",fontSize:11,fontWeight:600}}>{tone}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                    <div>
                      <label style={{fontSize:9,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:7}}>Count</label>
                      <select value={count} onChange={e=>setCount(+e.target.value)} style={{padding:"8px 10px",borderRadius:10,border:"1px solid #222",background:"#111",color:"#fff",fontSize:13,cursor:"pointer"}}>
                        {[3,5,8,10].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <button onClick={generate} disabled={loading} style={{padding:"10px 20px",borderRadius:12,border:"none",cursor:loading?"not-allowed":"pointer",fontSize:13,fontWeight:700,background:loading?"#222":"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",boxShadow:loading?"none":"0 4px 20px #FF005044",whiteSpace:"nowrap"}}>
                      {loading?"⏳ Generating…":"⚡ Generate"}
                    </button>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,flexWrap:"wrap",gap:6}}>
                  <p style={{margin:0,fontSize:11,color:"#333"}}>
                    Topic: <span style={{color:activeTopic.color,fontWeight:600}}>{activeTopic.label}</span>
                    {" · "}Format: <span style={{color:"#fff"}}>{activeFormat.label}</span>
                    {" · "}Tone: <span style={{color:"#00F2EA"}}>{activeTone}</span>
                  </p>
                  {!isPro&&(
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {[...Array(FREE_LIMIT)].map((_,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:i<freeUsed?"#333":"#FF0050"}}/>)}
                      <span style={{fontSize:10,color:freeLeft===0?"#FF0050":"#555"}}>{freeLeft===0?"Upgrade to continue":freeLeft+" free left"}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isPro&&freeUsed>=FREE_LIMIT&&templates.length===0&&!loading&&(
                <div style={{background:"linear-gradient(135deg,#FF005015,#00F2EA10)",border:"1px solid #FF005033",borderRadius:16,padding:32,textAlign:"center",marginBottom:18}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔒</div>
                  <h2 style={{margin:"0 0 8px",fontSize:20,fontWeight:800}}>Free limit reached</h2>
                  <p style={{color:"#666",fontSize:13,margin:"0 0 20px"}}>Upgrade to Pro for unlimited access.</p>
                  <button onClick={()=>setPaywall(true)} style={{padding:"12px 28px",borderRadius:12,border:"none",background:"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 24px #FF005055"}}>
                    🚀 Upgrade to Pro — from ₦2,000/month
                  </button>
                </div>
              )}
              {loading&&<Spinner/>}
              {!loading&&templates.length===0&&(isPro||freeUsed<FREE_LIMIT)&&(
                <div style={{textAlign:"center",padding:"80px 20px"}}>
                  <div style={{fontSize:64,marginBottom:16}}>🎬</div>
                  <h2 style={{color:"#333",margin:"0 0 8px",fontSize:20}}>Ready to go viral?</h2>
                  <p style={{color:"#444",fontSize:14}}>Pick a topic, format & tone — then hit Generate</p>
                </div>
              )}
            </>
          )}

          {tab==="saved"&&saved.length===0&&(
            <div style={{textAlign:"center",padding:"80px 20px"}}>
              <div style={{fontSize:64,marginBottom:16}}>❤️</div>
              <h2 style={{color:"#333",margin:"0 0 8px",fontSize:20}}>No saved templates yet</h2>
              <p style={{color:"#444",fontSize:14}}>Generate templates and tap 🤍 to save them here</p>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
            {display.map(t=>(
              <div key={t.id} style={{background:"#0D0D18",borderRadius:16,border:"1px solid #1A1A30",overflow:"hidden",transition:"transform .2s,box-shadow .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 30px ${activeTopic.color}22`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #1A1A30",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontSize:9,fontWeight:700,color:activeTopic.color,textTransform:"uppercase",letterSpacing:1}}>{t.format||activeFormat.id}</span>
                    <h3 style={{margin:"3px 0 0",fontSize:13,fontWeight:700,color:"#ddd"}}>{t.title}</h3>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>saveTpl(t)} style={{background:saved.find(s=>s.id===t.id)?"#FF006022":"#111",border:`1px solid ${saved.find(s=>s.id===t.id)?"#FF0060":"#222"}`,borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:saved.find(s=>s.id===t.id)?"#FF0060":"#555"}}>
                      {saved.find(s=>s.id===t.id)?"❤️":"🤍"}
                    </button>
                    {tab==="saved"&&<button onClick={()=>remSaved(t.id)} style={{background:"#1A0808",border:"1px solid #330000",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:11,color:"#FF4444"}}>✕</button>}
                  </div>
                </div>
                <div style={{padding:"12px 14px"}}>
                  {editingId===t.id?(
                    <>
                      <textarea value={editContent} onChange={e=>setEdit(e.target.value)} style={{width:"100%",minHeight:180,background:"#111",border:"1px solid #FF005044",borderRadius:10,padding:12,color:"#fff",fontSize:12,lineHeight:1.6,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                      <div style={{display:"flex",gap:8,marginTop:10}}>
                        <button onClick={()=>saveEdit(t.id)} style={{flex:1,padding:8,borderRadius:8,border:"none",background:"linear-gradient(90deg,#FF0050,#FF6B35)",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12}}>✓ Save</button>
                        <button onClick={()=>setEditingId(null)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #222",background:"#111",color:"#666",cursor:"pointer",fontSize:12}}>Cancel</button>
                      </div>
                    </>
                  ):(
                    <>
                      <div style={{marginBottom:8}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#FF0050",textTransform:"uppercase",letterSpacing:1}}>🪝 Hook</span>
                        <p style={{margin:"3px 0 0",fontSize:13,color:"#e0e0e0",lineHeight:1.5,fontWeight:600}}>"{t.hook}"</p>
                      </div>
                      <div style={{marginBottom:8}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#00F2EA",textTransform:"uppercase",letterSpacing:1}}>📝 Body</span>
                        <p style={{margin:"3px 0 0",fontSize:12,color:"#aaa",lineHeight:1.6}}>{t.body}</p>
                      </div>
                      <div style={{marginBottom:8}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#FFD93D",textTransform:"uppercase",letterSpacing:1}}>📣 CTA</span>
                        <p style={{margin:"3px 0 0",fontSize:12,color:"#ccc",fontWeight:600}}>{t.cta}</p>
                      </div>
                      <div style={{background:"#111",borderRadius:8,padding:"7px 10px",marginBottom:8}}>
                        <p style={{margin:0,fontSize:11,color:"#555",lineHeight:1.5}}>{t.hashtags}</p>
                      </div>
                      {t.tip&&(
                        <div style={{background:"#0A1F1F",borderRadius:8,padding:"7px 10px",borderLeft:"3px solid #00F2EA",marginBottom:8}}>
                          <span style={{fontSize:9,fontWeight:700,color:"#00F2EA",textTransform:"uppercase",letterSpacing:1}}>💡 Tip</span>
                          <p style={{margin:"3px 0 0",fontSize:11,color:"#777"}}>{t.tip}</p>
                        </div>
                      )}
                      <div style={{display:"flex",gap:6,marginTop:10}}>
                        <button onClick={()=>copyTpl(t)} style={{flex:1,padding:8,borderRadius:8,border:"none",background:copied===t.id?"#00F2EA22":"#1A1A30",color:copied===t.id?"#00F2EA":"#777",fontWeight:700,cursor:"pointer",fontSize:11,transition:"all .2s"}}>
                          {copied===t.id?"✓ Copied!":"📋 Copy"}
                        </button>
                        <button onClick={()=>startEdit(t)} style={{flex:1,padding:8,borderRadius:8,border:"1px solid #222",background:"#111",color:"#777",fontWeight:700,cursor:"pointer",fontSize:11}}>
                          ✏️ Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
