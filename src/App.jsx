import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Bell, LayoutDashboard, Ticket, History, Wallet, Utensils, ScanLine,
  ClipboardList, Users, Settings, LogOut, Menu, X, Search, Download,
  Plus, CheckCircle2, Clock3, XCircle, ChevronRight, CalendarDays,
  IndianRupee, ShieldCheck, QrCode, RefreshCw, Camera, AlertCircle
} from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);
const seedMenu = {
  date: today(), meal: "Lunch", items: ["Dal Tadka", "Jeera Rice", "Seasonal Sabzi", "Roti", "Salad", "Curd"],
  price: 60, start: "12:30", end: "14:30", cutoff: "11:00", closed: false
};
const initialData = {
  menu: seedMenu,
  coupons: [],
  redemptions: [],
  users: [
    { id: "U1001", name: "Aarav Sharma", email: "aarav@abes.ac.in", role: "Student", enrollment: "ABES2024CS101" },
    { id: "U1002", name: "Priya Verma", email: "priya@abes.ac.in", role: "Student", enrollment: "ABES2024CS102" },
    { id: "U1003", name: "Mess Counter", email: "counter@abes.ac.in", role: "Mess Staff" },
    { id: "U1004", name: "Mess Manager", email: "manager@abes.ac.in", role: "Mess Manager" },
    { id: "U1005", name: "Administrator", email: "admin@abes.ac.in", role: "Admin" }
  ]
};
const readData = () => {
  try { return { ...initialData, ...JSON.parse(localStorage.getItem("messmate_data") || "{}") }; }
  catch { return initialData; }
};
const saveData = (data) => localStorage.setItem("messmate_data", JSON.stringify(data));
const money = (n) => `₹${Number(n || 0).toFixed(0)}`;
const makeCode = () => `LC-${today().replaceAll("-", "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const roles = ["Student", "Mess Staff", "Mess Manager", "Admin"];

function App() {
  const [data, setData] = useState(readData);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("messmate_user") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { if (user) localStorage.setItem("messmate_user", JSON.stringify(user)); else localStorage.removeItem("messmate_user"); }, [user]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); } }, [toast]);

  const notify = (message) => setToast(message);
  const update = (patch) => setData((d) => ({ ...d, ...patch }));
  const login = (form) => {
    const account = data.users.find((u) => u.email.toLowerCase() === form.email.toLowerCase());
    const next = account ? { ...account } : {
      id: `U${Date.now()}`, name: form.name || form.email.split("@")[0], email: form.email,
      role: form.role, enrollment: form.role === "Student" ? "ABES2024CS201" : ""
    };
    if (!account) update({ users: [...data.users, next] });
    setUser(next); setPage("Dashboard"); notify(`Welcome, ${next.name}`);
  };
  const logout = () => { setUser(null); setPage("Dashboard"); navigate("/"); };
  const navItems = user?.role === "Student"
    ? [["Dashboard", LayoutDashboard], ["My Coupons", Ticket], ["Coupon History", History], ["Wallet", Wallet]]
    : user?.role === "Mess Staff"
      ? [["Dashboard", LayoutDashboard], ["Scan & Redeem", ScanLine], ["Recent Scans", History]]
      : user?.role === "Mess Manager"
        ? [["Dashboard", LayoutDashboard], ["Menu Management", Utensils], ["Reports", ClipboardList], ["Scan & Redeem", ScanLine]]
        : [["Dashboard", LayoutDashboard], ["User Management", Users], ["Reports", ClipboardList], ["Menu Management", Utensils]];

  if (!user) return <Login onLogin={login} />;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Utensils size={21}/></div><div><b>MessMate</b><small>ABES Engineering College</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X/></button></div>
        <div className="side-label">WORKSPACE</div>
        <nav>{navItems.map(([label, Icon]) => <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => { setPage(label); setMobileOpen(false); }}><Icon size={18}/><span>{label}</span>{label === "My Coupons" && <span className="nav-count">{data.coupons.filter(c => c.studentId === user.id && c.status === "ACTIVE").length}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><ShieldCheck size={19}/><b>Secure mess access</b><span>Your meal activity is recorded for transparency.</span></div><button className="nav-item" onClick={logout}><LogOut size={18}/><span>Sign out</span></button></div>
      </aside>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{page}</b></div><div className="top-actions"><button className="icon-btn notification" title="Notifications"><Bell size={18}/><i/></button><div className="user-chip"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div><b>{user.name}</b><small>{user.role}</small></div></div></div></header>
        <div className="content">
          {page === "Dashboard" && <Dashboard user={user} data={data} setPage={setPage}/>}
          {page === "My Coupons" && <Coupons user={user} data={data} update={update} notify={notify}/>}
          {page === "Coupon History" && <HistoryPage user={user} data={data}/>}
          {page === "Wallet" && <WalletPage user={user} data={data}/>}
          {page === "Scan & Redeem" && <Scanner data={data} update={update} notify={notify}/>}
          {page === "Recent Scans" && <RecentScans data={data}/>}
          {page === "Menu Management" && <MenuManagement data={data} update={update} notify={notify}/>}
          {page === "Reports" && <Reports data={data}/>}
          {page === "User Management" && <UsersPage data={data} update={update} notify={notify}/>}
        </div>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [role, setRole] = useState("Student");
  const [name, setName] = useState("Aarav Sharma");
  const [email, setEmail] = useState("aarav@abes.ac.in");
  const submit = (e) => { e.preventDefault(); onLogin({ name, email, role }); };
  return <div className="login-page"><div className="login-art"><div className="art-top"><div className="brand-mark"><Utensils/></div><b>MessMate</b></div><div className="art-copy"><span className="eyebrow light">ABES ENGINEERING COLLEGE</span><h1>Your meals.<br/>One smart coupon.</h1><p>Skip paper tickets and long queues. Generate your lunch QR coupon and enjoy a smoother mess experience.</p><div className="art-stats"><div><b>QR</b><span>Quick verification</span></div><div><b>1×</b><span>One-time redemption</span></div><div><b>24/7</b><span>Coupon access</span></div></div></div><div className="art-footer">Digital Mess Experience <span>•</span> Version 1.0</div></div>
    <div className="login-form-wrap"><form className="login-card" onSubmit={submit}><span className="eyebrow">WELCOME TO MESSMATE</span><h2>Sign in to continue</h2><p className="muted">Choose a demo role to explore the project frontend.</p><label>Your name</label><input value={name} onChange={e=>setName(e.target.value)} required placeholder="Enter your name"/><label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="name@abes.ac.in"/><label>Continue as</label><select value={role} onChange={e=>{setRole(e.target.value); if(e.target.value==="Mess Staff"){setName("Mess Counter");setEmail("counter@abes.ac.in")} else if(e.target.value==="Mess Manager"){setName("Mess Manager");setEmail("manager@abes.ac.in")} else if(e.target.value==="Admin"){setName("Administrator");setEmail("admin@abes.ac.in")} else {setName("Aarav Sharma");setEmail("aarav@abes.ac.in")}}}>{roles.map(r=><option key={r}>{r}</option>)}</select><button className="primary-btn full-btn" type="submit">Continue to dashboard <ChevronRight size={17}/></button><div className="demo-note"><ShieldCheck size={16}/> Demo mode — no real password required.</div></form><div className="login-bottom">© 2026 MessMate · ABES Engineering College</div></div></div>;
}

function PageHeading({eyebrow, title, subtitle, action}) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }
function Stat({label,value,sub,icon:Icon,tone="burgundy"}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-copy"><span>{label}</span><b>{value}</b><small>{sub}</small></div></div>; }
function Dashboard({user,data,setPage}) {
  const isStudent = user.role === "Student";
  const mine = data.coupons.filter(c=>c.studentId===user.id);
  const active = mine.filter(c=>c.status==="ACTIVE");
  const redeemed = data.redemptions.length;
  const totalToday = data.coupons.filter(c=>c.date===today()).length;
  return <><PageHeading eyebrow="OVERVIEW" title={`Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${user.name.split(" ")[0]}`} subtitle={isStudent?"Here’s your mess activity for today. Your next meal is just a QR away.":"Here’s what’s happening at the mess today."} action={<div className="date-pill"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</div>}/>
    <div className="stats-grid">{isStudent?<><Stat label="Active coupons" value={active.length} sub="Ready to be scanned" icon={Ticket}/><Stat label="Meals redeemed" value={mine.filter(c=>c.status==="USED").length} sub="Your total usage" icon={CheckCircle2} tone="green"/><Stat label="Wallet balance" value={money(240)} sub="Demo wallet balance" icon={Wallet} tone="blue"/><Stat label="Today's menu" value={data.menu.closed?"Closed":money(data.menu.price)} sub={data.menu.meal+" · "+data.menu.start+" onwards"} icon={Utensils} tone="amber"/></>:<><Stat label="Coupons issued today" value={totalToday} sub="Across all students" icon={Ticket}/><Stat label="Redeemed today" value={data.redemptions.filter(r=>r.date===today()).length} sub="Successful counter scans" icon={CheckCircle2} tone="green"/><Stat label="Pending coupons" value={data.coupons.filter(c=>c.date===today()&&c.status==="ACTIVE").length} sub="Awaiting redemption" icon={Clock3} tone="amber"/><Stat label="Registered users" value={data.users.length} sub="Across all roles" icon={Users} tone="blue"/></>}</div>
    <div className="dashboard-grid"><div className="panel menu-panel"><div className="panel-head"><div><span className="eyebrow">TODAY'S MEAL</span><h3>{data.menu.meal} menu</h3></div><span className={`status ${data.menu.closed?"status-red":"status-green"}`}>{data.menu.closed?"Mess closed":"Available today"}</span></div><div className="meal-hero"><div className="meal-emoji">🍱</div><div><b>Freshly prepared for you</b><span>{data.menu.start} – {data.menu.end} · Coupon cut-off {data.menu.cutoff}</span></div><strong>{money(data.menu.price)}<small>/ meal</small></strong></div><div className="food-list">{data.menu.items.map((item,i)=><span key={item}><i>{["🥘","🍚","🥬","🫓","🥗","🥛"][i%6]}</i>{item}</span>)}</div>{isStudent?<button className="primary-btn" disabled={data.menu.closed} onClick={()=>setPage("My Coupons")}>Get lunch coupon <ChevronRight size={17}/></button>:<button className="secondary-btn" onClick={()=>setPage("Menu Management")}>Manage today's menu <ChevronRight size={17}/></button>}</div>
      <div className="panel quick-panel"><div className="panel-head"><div><span className="eyebrow">QUICK ACCESS</span><h3>{isStudent?"Your mess pass":"Counter & management"}</h3></div><div className="soft-icon"><QrCode/></div></div>{isStudent?<><div className="quick-qr"><QrCode size={42}/><div><b>{active.length?active[0].code:"No active coupon"}</b><span>{active.length?"Your QR coupon is ready":"Generate a coupon before cut-off"}</span></div></div><button className="secondary-btn full-btn" onClick={()=>setPage("My Coupons")}>View my coupons <ChevronRight size={16}/></button><div className="tip"><ShieldCheck size={16}/> Keep your QR ready at the serving counter.</div></>:<><div className="quick-action" onClick={()=>setPage("Scan & Redeem")}><div className="quick-action-icon"><ScanLine/></div><div><b>Scan a coupon</b><span>Validate and redeem a student's QR</span></div><ChevronRight/></div><div className="quick-action" onClick={()=>setPage("Reports")}><div className="quick-action-icon blue"><ClipboardList/></div><div><b>View reports</b><span>Track consumption and headcount</span></div><ChevronRight/></div></>}</div></div>
    <div className="section-title"><div><h3>{isStudent?"Recent coupon activity":"Latest coupon activity"}</h3><p>{isStudent?"Your latest generated coupons":"Recent activity recorded in the system"}</p></div><button className="text-btn" onClick={()=>setPage(isStudent?"Coupon History":"Recent Scans")}>View all <ChevronRight size={15}/></button></div><CouponTable coupons={(isStudent?mine:data.coupons).slice().reverse().slice(0,5)} users={data.users}/>
  </>;
}

function Coupons({user,data,update,notify}) {
  const [qr,setQr] = useState("");
  const [selected,setSelected] = useState(null);
  const mine = data.coupons.filter(c=>c.studentId===user.id).slice().reverse();
  useEffect(()=>{let alive=true;if(selected){QRCode.toDataURL(JSON.stringify({code:selected.code,date:selected.date,meal:selected.meal}),{width:240,margin:2,color:{dark:"#27151a",light:"#ffffff"}}).then(url=>{if(alive)setQr(url)}).catch(()=>{});}else setQr("");return()=>{alive=false}},[selected]);
  const generate = () => {
    if(data.menu.closed) return notify("Mess is closed for this date.");
    if(data.menu.date!==today()) return notify("Today's menu is not configured yet.");
    if(new Date().toTimeString().slice(0,5)>data.menu.cutoff) return notify("Coupon cut-off time has passed.");
    if(mine.some(c=>c.date===today()&&c.meal===data.menu.meal&&c.status!=="CANCELLED")) return notify("You already have a coupon for this meal.");
    const coupon={id:Date.now(),code:makeCode(),studentId:user.id,studentName:user.name,date:today(),meal:data.menu.meal,status:"ACTIVE",createdAt:new Date().toISOString(),price:data.menu.price};
    update({coupons:[...data.coupons,coupon]});setSelected(coupon);notify("Your lunch coupon was generated!");
  };
  const cancel = (coupon) => {update({coupons:data.coupons.map(c=>c.id===coupon.id?{...c,status:"CANCELLED"}:c)});setSelected(null);notify("Coupon cancelled.");};
  return <><PageHeading eyebrow="STUDENT / COUPONS" title="My coupons" subtitle="Generate a digital meal pass and show its QR code at the mess counter."/><div className="coupon-layout"><div><div className="panel generate-panel"><div className="panel-head"><div><span className="eyebrow">READY FOR LUNCH?</span><h3>Today's meal pass</h3></div><span className="status status-green">Digital coupon</span></div><div className="generate-meal"><div className="meal-emoji large">🍛</div><div><b>{data.menu.meal} · {new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</b><span>{data.menu.items.slice(0,4).join(" · ")}</span><small>{data.menu.start} – {data.menu.end} · Cut-off {data.menu.cutoff}</small></div><strong>{money(data.menu.price)}</strong></div><button className="primary-btn" onClick={generate} disabled={data.menu.closed||mine.some(c=>c.date===today()&&c.status==="ACTIVE")}> <Plus size={17}/> Generate lunch coupon</button><p className="helper-text"><ShieldCheck size={14}/> One coupon per student per meal. Coupon generation closes at {data.menu.cutoff}.</p></div><div className="section-title compact"><div><h3>Coupon history</h3><p>All your generated meal passes</p></div></div><CouponTable coupons={mine} users={data.users} onSelect={setSelected}/></div>
    <div className="panel qr-panel"><div className="panel-head"><div><span className="eyebrow">YOUR DIGITAL PASS</span><h3>Coupon QR code</h3></div><QrCode color="#7d1f32"/></div>{selected&&qr?<><div className="qr-frame"><img src={qr} alt="Coupon QR code"/></div><span className={`status ${selected.status==="ACTIVE"?"status-green":selected.status==="USED"?"status-blue":"status-red"}`}>{selected.status}</span><b className="qr-code">{selected.code}</b><span className="muted small">{selected.meal} · {selected.date}</span><div className="qr-actions"><button className="secondary-btn" onClick={()=>{const a=document.createElement("a");a.href=qr;a.download=`${selected.code}.png`;a.click();}}> <Download size={15}/> Save QR</button>{selected.status==="ACTIVE"&&<button className="ghost-btn danger" onClick={()=>cancel(selected)}>Cancel</button>}</div></>:<div className="qr-empty"><div><QrCode size={48}/></div><b>No coupon selected</b><span>Generate a coupon or select one from your history to view its QR code.</span></div>}<div className="qr-security"><ShieldCheck size={16}/><span>Show this QR to mess staff. Each coupon can be redeemed only once.</span></div></div></div></>;
}

function CouponTable({coupons,users,onSelect}) {
  if(!coupons.length)return <div className="empty-state"><Ticket size={28}/><b>No coupons yet</b><span>Generated coupons will appear here.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>COUPON ID</th><th>MEAL / DATE</th><th>STATUS</th><th>AMOUNT</th>{onSelect&&<th></th>}</tr></thead><tbody>{coupons.map(c=><tr key={c.id} onClick={()=>onSelect?.(c)} className={onSelect?"clickable-row":""}><td><b className="table-code">{c.code}</b>{users&&<small>{c.studentName}</small>}</td><td>{c.meal}<small>{c.date}</small></td><td><span className={`status ${c.status==="ACTIVE"?"status-green":c.status==="USED"?"status-blue":"status-red"}`}>{c.status}</span></td><td>{money(c.price)}</td>{onSelect&&<td><ChevronRight size={16}/></td>}</tr>)}</tbody></table></div>;
}

function HistoryPage({user,data}) {const mine=data.coupons.filter(c=>c.studentId===user.id).slice().reverse();return <><PageHeading eyebrow="STUDENT / ACTIVITY" title="Coupon history" subtitle="A record of your issued, redeemed and cancelled meal coupons."/><div className="stats-grid three"><Stat label="Total generated" value={mine.length} sub="All-time coupons" icon={Ticket}/><Stat label="Redeemed" value={mine.filter(c=>c.status==="USED").length} sub="Meals collected" icon={CheckCircle2} tone="green"/><Stat label="Cancelled / expired" value={mine.filter(c=>["CANCELLED","EXPIRED"].includes(c.status)).length} sub="Unused coupons" icon={XCircle} tone="amber"/></div><div className="panel"><div className="panel-head"><h3>All coupon records</h3><span className="muted small">{mine.length} records</span></div><CouponTable coupons={mine}/></div></>}
function WalletPage() {return <><PageHeading eyebrow="STUDENT / PAYMENTS" title="My wallet" subtitle="View your demo mess wallet and payment activity."/><div className="wallet-hero"><div><span>AVAILABLE BALANCE</span><h2>₹240.00</h2><p>Demo balance · Payment gateway is not connected</p></div><div className="wallet-symbol"><Wallet size={42}/></div></div><div className="panel"><div className="panel-head"><h3>Payment history</h3><span className="status status-amber">Demo data</span></div><div className="empty-state"><IndianRupee size={28}/><b>No transactions yet</b><span>Wallet top-ups and coupon payments will appear here after payment integration.</span></div></div></>}

function Scanner({data,update,notify}) {
  const [code,setCode]=useState("");const [result,setResult]=useState(null);const [scannerOn,setScannerOn]=useState(false);const scannerRef=useRef(null);
  useEffect(()=>{if(!scannerOn)return;let scanner;try{scanner=new Html5QrcodeScanner("messmate-qr-reader",{fps:10,qrbox:{width:220,height:220},rememberLastUsedCamera:true},false);scanner.render((decoded)=>{setCode(decoded);setScannerOn(false);try{scanner.clear()}catch{}},()=>{});scannerRef.current=scanner;}catch(e){notify("Camera scanner could not start. Use manual entry.");setScannerOn(false);}return()=>{if(scannerRef.current){scannerRef.current.clear().catch(()=>{});scannerRef.current=null;}}},[scannerOn]);
  const redeem=(raw=code)=>{const parsed=(()=>{try{return JSON.parse(raw)}catch{return null}})();const couponCode=parsed?.code||raw.trim();const coupon=data.coupons.find(c=>c.code===couponCode);if(!coupon){setResult({ok:false,message:"Coupon not found. Check the code and try again."});return;}if(coupon.date!==today()){setResult({ok:false,message:"This coupon is not valid for today."});return;}if(coupon.status!=="ACTIVE"){setResult({ok:false,message:`Coupon is already ${coupon.status.toLowerCase()}.`});return;}const redeemed={id:Date.now(),couponId:coupon.id,code:coupon.code,studentName:coupon.studentName,studentId:coupon.studentId,date:today(),time:new Date().toLocaleTimeString("en-IN"),counter:"Counter 01"};update({coupons:data.coupons.map(c=>c.id===coupon.id?{...c,status:"USED"}:c),redemptions:[...data.redemptions,redeemed]});setResult({ok:true,message:"Coupon verified and redeemed successfully.",coupon,redeemed});setCode("");notify("Meal coupon redeemed.");};
  return <><PageHeading eyebrow="MESS COUNTER" title="Scan & redeem" subtitle="Scan the student's QR code or enter the coupon ID to validate the meal pass."/><div className="scanner-layout"><div className="panel scanner-panel"><div className="panel-head"><div><span className="eyebrow">QR VALIDATION</span><h3>Scan student coupon</h3></div><span className="status status-green"><i className="pulse-dot"/> Counter active</span></div><div className="scanner-visual"><div className="scanner-icon"><ScanLine size={44}/></div><b>Position QR code inside the frame</b><span>Allow camera access when your browser asks.</span><button className="secondary-btn" onClick={()=>setScannerOn(v=>!v)}><Camera size={16}/>{scannerOn?"Stop camera":"Start camera scanner"}</button></div><div id="messmate-qr-reader" className={scannerOn?"scanner-reader":"scanner-reader hidden"}/><div className="or-divider"><span>OR ENTER CODE MANUALLY</span></div><div className="manual-entry"><input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&redeem()} placeholder="e.g. LC-20261127-ABC123"/><button className="primary-btn" disabled={!code.trim()} onClick={()=>redeem()}><ScanLine size={16}/> Verify coupon</button></div>{result&&<div className={`validation-result ${result.ok?"valid":"invalid"}`}>{result.ok?<CheckCircle2 size={23}/>:<AlertCircle size={23}/>}<div><b>{result.ok?"VALID COUPON":"INVALID COUPON"}</b><span>{result.message}</span>{result.ok&&<small>{result.coupon.studentName} · {result.coupon.code}</small>}</div></div>}</div><div className="panel instructions-panel"><div className="panel-head"><h3>Counter checklist</h3><ShieldCheck color="#7d1f32"/></div>{["Ask the student to open their active coupon.","Scan the QR code or enter the coupon ID.","Confirm the student and meal details.","Redeem only when the result shows VALID."].map((s,i)=><div className="instruction" key={s}><span>{i+1}</span>{s}</div>)}<div className="warning-note"><AlertCircle size={16}/> A coupon marked USED, EXPIRED or CANCELLED cannot be redeemed again.</div></div></div></>;
}
function RecentScans({data}) {const rows=data.redemptions.slice().reverse();return <><PageHeading eyebrow="MESS COUNTER" title="Recent scans" subtitle="Successful coupon redemptions recorded at the serving counter."/><div className="panel"><div className="panel-head"><h3>Redemption log</h3><span className="status status-green">{rows.length} successful</span></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>COUPON ID</th><th>DATE / TIME</th><th>COUNTER</th><th>STATUS</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.studentName}</b><small>{r.studentId}</small></td><td className="table-code">{r.code}</td><td>{r.date}<small>{r.time}</small></td><td>{r.counter}</td><td><span className="status status-green">Redeemed</span></td></tr>)}</tbody></table></div>:<div className="empty-state"><ScanLine size={28}/><b>No scans recorded</b><span>Redeemed coupons will show up here.</span></div>}</div></>}

function MenuManagement({data,update,notify}) {
  const [form,setForm]=useState({...data.menu,itemsText:data.menu.items.join(", ")});
  const change=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=(e)=>{e.preventDefault();update({menu:{...form,items:form.itemsText.split(",").map(x=>x.trim()).filter(Boolean)}});notify("Meal menu updated.");};
  return <><PageHeading eyebrow="MANAGEMENT" title="Menu management" subtitle="Publish the daily meal menu, serving window and coupon cut-off time."/><form className="panel menu-form" onSubmit={save}><div className="panel-head"><div><span className="eyebrow">MEAL CONFIGURATION</span><h3>Daily menu settings</h3></div><span className="status status-blue">Lunch · Default</span></div><div className="form-grid"><div><label>Menu date</label><input type="date" value={form.date} onChange={e=>change("date",e.target.value)}/></div><div><label>Meal type</label><select value={form.meal} onChange={e=>change("meal",e.target.value)}><option>Lunch</option><option>Breakfast</option><option>Dinner</option></select></div><div><label>Meal price (₹)</label><input type="number" min="0" value={form.price} onChange={e=>change("price",e.target.value)}/></div><div><label>Serving starts</label><input type="time" value={form.start} onChange={e=>change("start",e.target.value)}/></div><div><label>Serving ends</label><input type="time" value={form.end} onChange={e=>change("end",e.target.value)}/></div><div><label>Coupon cut-off</label><input type="time" value={form.cutoff} onChange={e=>change("cutoff",e.target.value)}/></div><div className="span-2"><label>Menu items <small>(separate with commas)</small></label><textarea rows="3" value={form.itemsText} onChange={e=>change("itemsText",e.target.value)}/></div><div className="span-2 closed-toggle"><div><b>Mess closed for this date</b><small>Students will not be able to generate coupons.</small></div><input type="checkbox" checked={form.closed} onChange={e=>change("closed",e.target.checked)}/></div></div><div className="form-footer"><span className="muted small">Changes are saved in this browser for demo purposes.</span><button className="primary-btn" type="submit">Save and publish menu <ChevronRight size={16}/></button></div></form></>;
}

function Reports({data}) {
  const issued=data.coupons.length;const used=data.coupons.filter(c=>c.status==="USED").length;const active=data.coupons.filter(c=>c.status==="ACTIVE").length;const exportCSV=()=>{const rows=[["Coupon Code","Student","Date","Meal","Status","Price"],...data.coupons.map(c=>[c.code,c.studentName,c.date,c.meal,c.status,c.price])];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="messmate-coupon-report.csv";a.click();URL.revokeObjectURL(a.href);};
  const max=Math.max(issued,1);
  return <><PageHeading eyebrow="MANAGEMENT / ANALYTICS" title="Reports & insights" subtitle="Monitor coupon issuance, redemption and mess consumption." action={<button className="secondary-btn" onClick={exportCSV}><Download size={16}/> Export CSV</button>}/><div className="stats-grid"><Stat label="Coupons issued" value={issued} sub="All recorded coupons" icon={Ticket}/><Stat label="Redeemed meals" value={used} sub={`${issued?Math.round(used/issued*100):0}% redemption rate`} icon={CheckCircle2} tone="green"/><Stat label="Pending coupons" value={active} sub="Awaiting collection" icon={Clock3} tone="amber"/><Stat label="Estimated revenue" value={money(data.coupons.reduce((s,c)=>s+Number(c.price||0),0))} sub="Based on coupon records" icon={IndianRupee} tone="blue"/></div><div className="report-grid"><div className="panel"><div className="panel-head"><div><span className="eyebrow">COUPON OVERVIEW</span><h3>Issuance status</h3></div></div><div className="bar-row"><div><span>Redeemed</span><b>{used}</b></div><div className="bar-track"><i className="bar-green" style={{width:`${used/max*100}%`}}/></div></div><div className="bar-row"><div><span>Active / pending</span><b>{active}</b></div><div className="bar-track"><i className="bar-burgundy" style={{width:`${active/max*100}%`}}/></div></div><div className="bar-row"><div><span>Cancelled / expired</span><b>{data.coupons.filter(c=>["CANCELLED","EXPIRED"].includes(c.status)).length}</b></div><div className="bar-track"><i className="bar-amber" style={{width:`${data.coupons.filter(c=>["CANCELLED","EXPIRED"].includes(c.status)).length/max*100}%`}}/></div></div><p className="helper-text">Charts reflect coupon records stored in this browser.</p></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">DAILY HEADCOUNT</span><h3>Today's meal summary</h3></div><CalendarDays/></div><div className="headcount-number">{data.coupons.filter(c=>c.date===today()).length}<small>coupons issued today</small></div><div className="headcount-meta"><span><i className="dot green-dot"/> Redeemed <b>{data.coupons.filter(c=>c.date===today()&&c.status==="USED").length}</b></span><span><i className="dot amber-dot"/> Pending <b>{data.coupons.filter(c=>c.date===today()&&c.status==="ACTIVE").length}</b></span></div></div></div><div className="panel"><div className="panel-head"><h3>Coupon register</h3><span className="muted small">{issued} records</span></div><CouponTable coupons={data.coupons.slice().reverse()}/></div></>;
}
function UsersPage({data,update,notify}) {const [search,setSearch]=useState("");const [role,setRole]=useState("All");const filtered=data.users.filter(u=>(role==="All"||u.role===role)&&`${u.name} ${u.email} ${u.enrollment||""}`.toLowerCase().includes(search.toLowerCase()));const changeRole=(id,newRole)=>{update({users:data.users.map(u=>u.id===id?{...u,role:newRole}:u)});notify("User role updated.");};return <><PageHeading eyebrow="ADMINISTRATION" title="User management" subtitle="View registered users and manage their role-based access."/><div className="panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or enrollment"/></div><select value={role} onChange={e=>setRole(e.target.value)}><option>All</option>{roles.map(r=><option key={r}>{r}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>USER</th><th>ENROLLMENT</th><th>ROLE</th><th>USER ID</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><div className="user-cell"><div className="avatar">{u.name[0]}</div><div><b>{u.name}</b><small>{u.email}</small></div></div></td><td>{u.enrollment||"—"}</td><td><select className="role-select" value={u.role} onChange={e=>changeRole(u.id,e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></td><td className="muted">{u.id}</td></tr>)}</tbody></table></div></div></>}

export default App;
