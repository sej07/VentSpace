import { useState } from "react";
import {
  FONTS, GLOBAL_STYLES, TornEdge, TornTop, WashiTape, TapeStrip, PaperClip, ScrapInput
} from "../components/ScrapUI";
import {
  FlowerSticker, SparkleSticker, HeartSticker,
  LockSticker, MailSticker, KeySticker, PersonSticker
} from "../components/Stickers";

/* ── Floral corner clusters ── */
function FloralCorners() {
  const petals = [
    {x:40,y:50,r:18,fill:"#F4A8BC",rotate:-30},{x:80,y:20,r:16,fill:"#FBCDD8",rotate:25},
    {x:120,y:60,r:14,fill:"#EE88A8",rotate:60},{x:20,y:90,r:12,fill:"#F4A8BC",rotate:-10},
    {x:160,y:30,r:10,fill:"#FBCDD8",rotate:45},
    {x:1180,y:40,r:18,fill:"#EE88A8",rotate:40},{x:1150,y:80,r:16,fill:"#F4A8BC",rotate:-25},
    {x:1120,y:20,r:14,fill:"#FBCDD8",rotate:70},{x:1190,y:100,r:12,fill:"#F4A8BC",rotate:-40},
    {x:60,y:780,r:16,fill:"#FBCDD8",rotate:20},{x:30,y:750,r:14,fill:"#F4A8BC",rotate:-15},
    {x:100,y:800,r:12,fill:"#EE88A8",rotate:50},
    {x:1160,y:770,r:16,fill:"#F4A8BC",rotate:-20},{x:1190,y:800,r:14,fill:"#FBCDD8",rotate:35},
  ];
  return (
    <svg aria-hidden="true" style={{ position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0 }} viewBox="0 0 1200 840" preserveAspectRatio="xMidYMid slice">
      <path d="M0,100 Q50,50 100,40 Q140,30 160,55" stroke="#C4856A" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d="M100,40 Q115,10 135,5" stroke="#C4856A" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round"/>
      <path d="M1200,90 Q1150,45 1100,38 Q1060,28 1040,52" stroke="#C4856A" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d="M0,790 Q45,760 80,730 Q108,705 95,670" stroke="#C4856A" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d="M1200,790 Q1155,758 1122,728 Q1094,704 1106,668" stroke="#C4856A" strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round"/>
      {petals.map((p,i)=>{
        const angles=[0,72,144,216,288];
        return(
          <g key={i} transform={`translate(${p.x},${p.y})`} opacity="0.82">
            {angles.map((a,j)=>{
              const rad=(a-90)*Math.PI/180;
              const px=Math.cos(rad)*p.r, py=Math.sin(rad)*p.r;
              return <ellipse key={j} cx={px} cy={py} rx={p.r*0.65} ry={p.r*0.4} fill={p.fill} stroke="#1A0A1020" strokeWidth="0.6" transform={`rotate(${a},${px},${py})`}/>;
            })}
            <circle cx="0" cy="0" r={p.r*0.35} fill="#FDEEA0" stroke="#1A0A1018" strokeWidth="0.8"/>
          </g>
        );
      })}
      <ellipse cx="55"  cy="65"  rx="14" ry="6" fill="#9DC48C" opacity="0.5" transform="rotate(-30,55,65)"/>
      <ellipse cx="145" cy="45"  rx="12" ry="5" fill="#9DC48C" opacity="0.45" transform="rotate(20,145,45)"/>
      <ellipse cx="1165" cy="55" rx="14" ry="6" fill="#9DC48C" opacity="0.5" transform="rotate(150,1165,55)"/>
      <ellipse cx="1130" cy="30" rx="12" ry="5" fill="#9DC48C" opacity="0.45" transform="rotate(200,1130,30)"/>
      <ellipse cx="40"  cy="760" rx="14" ry="6" fill="#9DC48C" opacity="0.5" transform="rotate(-60,40,760)"/>
      <ellipse cx="1155" cy="760" rx="14" ry="6" fill="#9DC48C" opacity="0.5" transform="rotate(240,1155,760)"/>
    </svg>
  );
}

/* ════════════════════════════════════════
   LOGIN
════════════════════════════════════════ */
function LoginPage({ onSwitch, onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"32px 20px", position:"relative", zIndex:1 }}>

      {/* Brand */}
      <div style={{ marginBottom:32, textAlign:"center", position:"relative" }}>
        <WashiTape color="rgba(255,182,193,0.65)" rotate={-2} top={-10} left={-10} width={160}/>
        <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <FlowerSticker size={32} rotate={-10}/>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:42, fontWeight:700, color:"#8B3050", letterSpacing:"-1px" }}>
            vent<span style={{ color:"#C4607A" }}>space</span>
          </span>
          <FlowerSticker size={28} rotate={15}/>
        </div>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:14, color:"#C4A0A8", marginTop:4 }}>your private sanctuary</p>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:420, position:"relative" }}>
        <TapeStrip rotate={-42} top={-10} left={14}/>
        <TapeStrip rotate={42}  top={-10} right={14}/>
        <PaperClip rotate={8}   top={-12} right={30}/>

        <div style={{ background:"#FFFEF8", boxShadow:"3px 6px 20px rgba(120,80,80,0.15), 0 1px 4px rgba(0,0,0,0.07)", position:"relative" }}>
          <TornTop color="#FFFEF8"/>
          <div style={{ padding:"8px 32px 28px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <LockSticker size={36}/>
              <div>
                <p style={{ fontFamily:"'Caveat',cursive", fontSize:26, fontWeight:700, color:"#8B3050", lineHeight:1.1 }}>welcome back</p>
                <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#B07080" }}>log in to your journal</p>
              </div>
            </div>
            <div style={{ height:1, background:"rgba(180,210,220,0.6)", marginBottom:20 }}/>

            <ScrapInput label="email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" icon={<MailSticker size={20}/>}/>
            <ScrapInput label="password"      type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" icon={<KeySticker size={22}/>}/>

            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:22, marginTop:-8 }}>
              <button style={{ fontFamily:"'Caveat',cursive", fontSize:14, color:"#C4607A", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", textDecorationStyle:"wavy" }}>
                forgot password?
              </button>
            </div>

            <button onClick={handleSubmit} style={{
              width:"100%", fontFamily:"'Caveat',cursive", fontSize:22, fontWeight:700,
              padding:"13px 28px", border:"2.5px solid #C4607A",
              background:loading?"#F0D0D4":"#C4607A",
              color:"#fff", borderRadius:4, cursor:"pointer",
              transform:"rotate(-0.5deg)",
              boxShadow:loading?"none":"3px 4px 0 rgba(139,48,80,0.35)",
              transition:"all 0.2s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              {loading
                ? <><SparkleSticker size={18} color="#fff"/> logging you in…</>
                : <><HeartSticker size={18} color="#fff"/> log in</>
              }
            </button>
          </div>
          <TornEdge color="#FFFEF8" side="bottom"/>
        </div>

        <div style={{ textAlign:"center", marginTop:24 }}>
          <span style={{ fontFamily:"'Kalam',cursive", fontSize:15, color:"#8A6068" }}>new here? </span>
          <button onClick={onSwitch} style={{ fontFamily:"'Caveat',cursive", fontSize:18, fontWeight:700, color:"#C4607A", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", textDecorationStyle:"wavy" }}>
            create your journal →
          </button>
        </div>
      </div>

      {/* Floating sticky notes */}
      <div style={{ position:"fixed", bottom:40, left:24, transform:"rotate(-8deg)", background:"#FDF5D4", padding:"8px 14px", borderRadius:3, boxShadow:"2px 3px 8px rgba(120,80,80,0.12)", border:"1.5px solid #E8D8A0", zIndex:0 }}>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#7A6020", lineHeight:1.5 }}>vent freely.</p>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#7A6020" }}>no judgment here 💛</p>
      </div>
      <div style={{ position:"fixed", bottom:60, right:28, transform:"rotate(5deg)", background:"#D4F0D4", padding:"8px 14px", borderRadius:3, boxShadow:"2px 3px 8px rgba(80,120,80,0.12)", border:"1.5px solid #A0D0A0", zIndex:0 }}>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#2E6B2E", lineHeight:1.5 }}>you're not alone.</p>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#2E6B2E" }}>your story matters 🌿</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SIGN UP
════════════════════════════════════════ */
function SignupPage({ onSwitch, onSignup }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [agree,    setAgree]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(1);
  const [pronoun,  setPronoun]  = useState("");

  const handleNext = () => {
    if (step===1 && name && email) { setStep(2); return; }
    if (step===2 && password && confirm && agree) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onSignup(); }, 1400);
    }
  };

  const cardBg = step===1 ? "#FFF8FD" : "#F8FFF8";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"32px 20px", position:"relative", zIndex:1 }}>

      {/* Brand */}
      <div style={{ marginBottom:28, textAlign:"center", position:"relative" }}>
        <WashiTape color="rgba(180,220,255,0.65)" rotate={2} top={-10} left={-10} width={180}/>
        <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <SparkleSticker size={26} color="#F4C020"/>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:42, fontWeight:700, color:"#8B3050", letterSpacing:"-1px" }}>
            vent<span style={{ color:"#C4607A" }}>space</span>
          </span>
          <SparkleSticker size={22} color="#E890A8"/>
        </div>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:14, color:"#C4A0A8", marginTop:4 }}>start your journey</p>
      </div>

      {/* Step dots */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
        {[1,2].map(s=>(
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:step>=s?"#C4607A":"rgba(255,255,255,0.7)", border:`2px solid ${step>=s?"#C4607A":"#E8C0C8"}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:step===s?"2px 3px 8px rgba(196,96,122,0.3)":"none", transform:step===s?"rotate(-3deg)":"none" }}>
              {step>s
                ? <SparkleSticker size={14} color="#fff"/>
                : <span style={{ fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:700, color:step>=s?"#fff":"#B07080" }}>{s}</span>
              }
            </div>
            {s<2 && <div style={{ width:32, height:2, background:step>1?"#C4607A":"#E8C0C8", borderRadius:2 }}/>}
          </div>
        ))}
        <span style={{ fontFamily:"'Caveat',cursive", fontSize:15, color:"#B07080", marginLeft:6 }}>
          {step===1?"about you":"set your password"}
        </span>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:440, position:"relative" }}>
        <TapeStrip rotate={-42} top={-10} left={18}/>
        <TapeStrip rotate={42}  top={-10} right={18}/>
        <div style={{ position:"absolute", top:-16, left:"50%", transform:"translateX(-50%)", zIndex:12 }}>
          <WashiTape color="rgba(255,182,193,0.7)" rotate={0} top={0} left={0} width={120} label={step===1?"step 1 of 2":"step 2 of 2"}/>
        </div>

        <div style={{ background:cardBg, boxShadow:"3px 6px 20px rgba(120,80,80,0.14), 0 1px 4px rgba(0,0,0,0.06)", marginTop:18, position:"relative" }}>
          <TornTop color={cardBg}/>
          <div style={{ padding:"12px 32px 28px" }}>
            {step===1 ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <PersonSticker size={40}/>
                  <div>
                    <p style={{ fontFamily:"'Caveat',cursive", fontSize:26, fontWeight:700, color:"#8B3050", lineHeight:1.1 }}>nice to meet you</p>
                    <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#B07080" }}>tell us a little about yourself</p>
                  </div>
                </div>
                <div style={{ height:1, background:"rgba(180,210,220,0.6)", marginBottom:20 }}/>
                <ScrapInput label="your name" value={name} onChange={e=>setName(e.target.value)} placeholder="what should we call you?" icon={<PersonSticker size={20}/>}/>
                <ScrapInput label="email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" icon={<MailSticker size={20}/>}/>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:600, color:"#8B3050", display:"block", marginBottom:8, marginLeft:2 }}>your pronouns (optional)</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {["she/her","they/them","he/him","prefer not to say"].map(p=>(
                      <button key={p} onClick={()=>setPronoun(p===pronoun?"":p)} style={{
                        fontFamily:"'Kalam',cursive", fontSize:13, padding:"6px 14px", borderRadius:20,
                        border:`2px solid ${pronoun===p?"#C4607A":"#E8C0C8"}`,
                        background: pronoun===p ? "#FDEEF2" : "rgba(255,255,255,0.7)",
                        color: pronoun===p ? "#C4607A" : "#8A5060",
                        cursor:"pointer", fontWeight: pronoun===p ? 700 : 400,
                        transform: pronoun===p ? "rotate(-1deg) scale(1.04)" : "none",
                        boxShadow: pronoun===p ? "1px 2px 6px rgba(196,96,122,0.2)" : "none",
                        transition:"all 0.15s",
                      }}>{p}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <LockSticker size={38} open={true}/>
                  <div>
                    <p style={{ fontFamily:"'Caveat',cursive", fontSize:26, fontWeight:700, color:"#2E6B2E", lineHeight:1.1 }}>almost there!</p>
                    <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#7A9070" }}>set a safe password</p>
                  </div>
                </div>
                <div style={{ height:1, background:"rgba(180,210,220,0.6)", marginBottom:20 }}/>
                <ScrapInput label="password"         type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="make it memorable"  icon={<KeySticker size={22}/>}/>
                <ScrapInput label="confirm password" type="password" value={confirm}  onChange={e=>setConfirm(e.target.value)}  placeholder="type it again"       icon={<KeySticker size={22}/>}/>
                {password.length>0 && (
                  <div style={{ marginBottom:18, marginTop:-8 }}>
                    <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                      {[1,2,3,4].map(i=>(
                        <div key={i} style={{ flex:1, height:5, borderRadius:10, background:password.length>=i*2?"#C4607A":"#F0D0D8" }}/>
                      ))}
                    </div>
                    <p style={{ fontFamily:"'Caveat',cursive", fontSize:12, color:"#B07080" }}>
                      {password.length<4?"too short":password.length<6?"getting there…":password.length<8?"almost good!":"strong password!"}
                    </p>
                  </div>
                )}
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:20, padding:"12px 14px", background:"rgba(255,240,180,0.35)", borderRadius:6, border:"1.5px dashed #E8D0A0" }}>
                  <div onClick={()=>setAgree(a=>!a)} style={{ width:22, height:22, borderRadius:4, border:"2px solid #C4607A", background:agree?"#C4607A":"#fff", flexShrink:0, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                    {agree && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <p style={{ fontFamily:"'Kalam',cursive", fontSize:13, color:"#6A4020", lineHeight:1.6 }}>
                    i understand this app is a companion tool, not a replacement for therapy. i'll seek professional help when needed 💛
                  </p>
                </div>
              </>
            )}

            <button onClick={handleNext} style={{
              width:"100%", fontFamily:"'Caveat',cursive", fontSize:22, fontWeight:700,
              padding:"13px 28px", border:"2.5px solid #C4607A",
              background:loading?"#F0D0D4":"#C4607A",
              color:"#fff", borderRadius:4, cursor:"pointer",
              transform:"rotate(-0.3deg)",
              boxShadow:loading?"none":"3px 4px 0 rgba(139,48,80,0.35)",
              transition:"all 0.2s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            }}>
              {loading
                ? <><SparkleSticker size={18} color="#fff"/> creating your space…</>
                : step===1
                  ? <><HeartSticker size={18} color="#fff"/> next step →</>
                  : <><FlowerSticker size={18}/> start journaling →</>
              }
            </button>

            {step===2 && (
              <button onClick={()=>setStep(1)} style={{ width:"100%", marginTop:10, fontFamily:"'Caveat',cursive", fontSize:16, background:"none", border:"none", color:"#C4607A", cursor:"pointer", textDecoration:"underline", textDecorationStyle:"wavy" }}>
                ← back
              </button>
            )}
          </div>
          <TornEdge color={cardBg} side="bottom"/>
        </div>

        <div style={{ textAlign:"center", marginTop:24 }}>
          <span style={{ fontFamily:"'Kalam',cursive", fontSize:15, color:"#8A6068" }}>already have an account? </span>
          <button onClick={onSwitch} style={{ fontFamily:"'Caveat',cursive", fontSize:18, fontWeight:700, color:"#C4607A", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", textDecorationStyle:"wavy" }}>
            log back in →
          </button>
        </div>
      </div>

      <div style={{ position:"fixed", top:80, right:32, transform:"rotate(4deg)", background:"#F9C4CC", padding:"8px 14px", borderRadius:3, boxShadow:"2px 3px 8px rgba(120,80,80,0.12)", border:"1.5px solid #E8A0B0", zIndex:0 }}>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#8B2040", lineHeight:1.5 }}>vent. reflect. grow.</p>
      </div>
      <div style={{ position:"fixed", top:120, left:28, transform:"rotate(-5deg)", background:"#D4E8FF", padding:"8px 14px", borderRadius:3, boxShadow:"2px 3px 8px rgba(80,100,160,0.1)", border:"1.5px solid #A0C0E8", zIndex:0 }}>
        <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#1A3A70", lineHeight:1.5 }}>your data stays yours.</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ROOT AUTH
════════════════════════════════════════ */
export default function AuthPages({ onAuth }) {
  const [page, setPage] = useState("login");
  return (
    <>
      <style>{FONTS}{GLOBAL_STYLES}</style>
      <FloralCorners/>
      {page==="login"
        ? <LoginPage  onSwitch={()=>setPage("signup")} onLogin={onAuth}/>
        : <SignupPage onSwitch={()=>setPage("login")}  onSignup={onAuth}/>
      }
    </>
  );
}