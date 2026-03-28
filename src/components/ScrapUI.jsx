/* ════════════════════════════════════════
   VENTSPACE — Scrapbook UI Primitives
════════════════════════════════════════ */
import { useState } from "react";

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Patrick+Hand&display=swap');`;

export const GLOBAL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #F5ECE0;
    background-image:
      radial-gradient(circle at 15% 20%, rgba(255,200,210,0.35) 0%, transparent 45%),
      radial-gradient(circle at 85% 75%, rgba(255,180,200,0.28) 0%, transparent 40%);
    min-height: 100vh;
  }
  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg transform='translate(30,30)' opacity='0.18'%3E%3Cellipse cx='0' cy='-16' rx='8' ry='5' fill='%23F4A0B4' transform='rotate(0)'/%3E%3Cellipse cx='0' cy='-16' rx='8' ry='5' fill='%23F4A0B4' transform='rotate(72)'/%3E%3Cellipse cx='0' cy='-16' rx='8' ry='5' fill='%23F4A0B4' transform='rotate(144)'/%3E%3Cellipse cx='0' cy='-16' rx='8' ry='5' fill='%23F4A0B4' transform='rotate(216)'/%3E%3Cellipse cx='0' cy='-16' rx='8' ry='5' fill='%23F4A0B4' transform='rotate(288)'/%3E%3Ccircle cx='0' cy='0' r='4' fill='%23FFD6E0'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 120px 120px;
  }
  input::placeholder { color: #C4A0A8; }
  textarea:focus, button:focus, input:focus { outline: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #E8C0C8; border-radius: 2px; }
`;

export function TornEdge({ color = "#FFF8F0", side = "bottom" }) {
  const h = 16, w = 400;
  const d = side === "bottom"
    ? `M0,0 L${w},0 L${w},${h} Q${w*.9},${h*.3} ${w*.8},${h*.7} Q${w*.7},${h} ${w*.6},${h*.4} Q${w*.5},${h*.1} ${w*.4},${h*.8} Q${w*.3},${h} ${w*.2},${h*.5} Q${w*.1},${h*.2} 0,${h} Z`
    : `M0,${h} L${w},${h} L${w},0 Q${w*.88},${h*.6} ${w*.75},${h*.2} Q${w*.62},0 ${w*.5},${h*.5} Q${w*.38},${h} ${w*.25},${h*.3} Q${w*.12},0 0,${h*.4} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ display:"block", width:"100%", height:h, overflow:"visible" }} preserveAspectRatio="none">
      <path d={d} fill={color}/>
    </svg>
  );
}

export function TornTop({ color = "#FFF8F0" }) {
  const h = 14, w = 400;
  const d = `M0,${h} L${w},${h} L${w},0 Q${w*.88},${h*.7} ${w*.75},${h*.2} Q${w*.62},0 ${w*.5},${h*.6} Q${w*.38},${h} ${w*.25},${h*.3} Q${w*.12},0 0,${h*.5} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ display:"block", width:"100%", height:h, overflow:"visible" }} preserveAspectRatio="none">
      <path d={d} fill={color}/>
    </svg>
  );
}

export function WashiTape({ color="rgba(255,182,193,0.6)", rotate=-2, top, left, right, width=90, label="" }) {
  return (
    <div style={{ position:"absolute", top, left, right, width, height:22, background:color, transform:`rotate(${rotate}deg)`, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10, backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(255,255,255,0.18) 6px,rgba(255,255,255,0.18) 7px)" }}>
      {label && <span style={{ fontFamily:"'Caveat',cursive", fontSize:11, color:"rgba(80,40,40,0.7)" }}>{label}</span>}
    </div>
  );
}

export function TapeStrip({ rotate=-45, top, left, right }) {
  return <div style={{ position:"absolute", top, left, right, width:38, height:17, background:"rgba(255,240,180,0.65)", transform:`rotate(${rotate}deg)`, zIndex:10, backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 5px,rgba(255,255,255,0.22) 5px,rgba(255,255,255,0.22) 6px)" }}/>;
}

export function PaperClip({ rotate=12, top=-10, right=20 }) {
  return (
    <svg width="20" height="40" viewBox="0 0 20 40" style={{ position:"absolute", top, right, transform:`rotate(${rotate}deg)`, zIndex:15, opacity:0.65 }}>
      <path d="M10,2 C6,2 3,5 3,9 L3,30 C3,35 7,38 10,38 C13,38 17,35 17,30 L17,12 C17,8 14,6 11,6 C8,6 6,8 6,11 L6,28 C6,30 8,32 10,32 C12,32 14,30 14,28 L14,14"
        fill="none" stroke="#A09090" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function ScrapCard({ children, bg="#FFFDF8", rotate=0, style={}, torn=true, tape=null }) {
  return (
    <div style={{ position:"relative", background:bg, transform:`rotate(${rotate}deg)`, boxShadow:"2px 4px 14px rgba(120,80,80,0.13), 0 1px 3px rgba(0,0,0,0.07)", ...style }}>
      {tape}
      {children}
      {torn && <TornEdge color={bg} side="bottom"/>}
    </div>
  );
}

export function LinedPaper({ value, onChange, placeholder, rows=6 }) {
  return (
    <div style={{ position:"relative", background:"#FFFEF8", borderRadius:4, overflow:"hidden" }}>
      <div style={{ position:"absolute", left:36, top:0, bottom:0, width:1, background:"rgba(255,160,160,0.4)", zIndex:1 }}/>
      {Array.from({ length:rows+2 }).map((_,i)=>
        <div key={i} style={{ position:"absolute", left:0, right:0, top:28+i*28, height:1, background:"rgba(180,210,220,0.5)", zIndex:1 }}/>
      )}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ position:"relative", zIndex:2, width:"100%", padding:"12px 14px 12px 44px", background:"transparent", border:"none", outline:"none", fontFamily:"'Kalam',cursive", fontSize:15, color:"#3A1820", lineHeight:"28px", resize:"none" }}/>
    </div>
  );
}

export function ScrapInput({ label, type="text", value, onChange, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:600, color:"#8B3050", display:"block", marginBottom:6, marginLeft:2 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:10, background:"#FFFEF8", border:`2px solid ${focused?"#C4607A":"#E8C0C8"}`, borderRadius:6, padding:"10px 14px", boxShadow:focused?"2px 3px 10px rgba(196,96,122,0.15)":"1px 2px 6px rgba(180,120,120,0.08)", transition:"all 0.2s", position:"relative" }}>
        <div style={{ position:"absolute", left:0, right:0, top:"50%", height:1, background:"rgba(180,210,220,0.4)", zIndex:0, transform:"translateY(8px)" }}/>
        {icon && <div style={{ flexShrink:0, zIndex:1 }}>{icon}</div>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'Kalam',cursive", fontSize:15, color:"#3A1820", position:"relative", zIndex:1 }}/>
      </div>
    </div>
  );
}
