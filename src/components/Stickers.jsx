/* ════════════════════════════════════════
   VENTSPACE — Custom SVG Sticker Library
   Hand-drawn illustrations, no emojis
════════════════════════════════════════ */

export const FlowerSticker = ({ size = 36, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
    style={{ transform: `rotate(${rotate}deg)`, display: "block", flexShrink: 0 }}>
    {[0,60,120,180,240,300].map((a, i) => {
      const r = 11, cx = 20 + r * Math.cos((a-90)*Math.PI/180), cy = 20 + r * Math.sin((a-90)*Math.PI/180);
      return <ellipse key={i} cx={cx} cy={cy} rx="7" ry="5"
        fill={i%2===0?"#F4A8BC":"#FBCDD8"} stroke="#1A0A10" strokeWidth="1.2"
        transform={`rotate(${a},${cx},${cy})`}/>;
    })}
    <circle cx="20" cy="20" r="6" fill="#FDEEA0" stroke="#1A0A10" strokeWidth="1.4"/>
    <circle cx="18.5" cy="19" r="1.2" fill="#E8C830"/>
    <circle cx="21.5" cy="19" r="1.2" fill="#E8C830"/>
    <path d="M18 21.5 Q20 23 22 21.5" stroke="#C4900A" strokeWidth="1" fill="none" strokeLinecap="round"/>
  </svg>
);

export const DropSticker = ({ size = 36, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 40 44" fill="none"
    style={{ transform: `rotate(${rotate}deg)`, display: "block", flexShrink: 0 }}>
    <path d="M20 4 C20 4 8 18 8 27 C8 34.5 13.5 40 20 40 C26.5 40 32 34.5 32 27 C32 18 20 4 20 4Z"
      fill="#F47090" stroke="#1A0A10" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M20 6 C20 6 10 19 10 27 C10 28.5 10.4 30 11 31.2"
      stroke="#F8A0B0" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <circle cx="17" cy="26" r="1.8" fill="#1A0A10"/>
    <circle cx="23" cy="26" r="1.8" fill="#1A0A10"/>
    <circle cx="17.5" cy="25.3" r="0.7" fill="white"/>
    <circle cx="23.5" cy="25.3" r="0.7" fill="white"/>
    <path d="M17.5 30 Q20 32.5 22.5 30" stroke="#1A0A10" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
  </svg>
);

export const SparkleSticker = ({ size = 28, color = "#F4D020" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <path d="M16 2 L17.8 12.5 L28 11 L19.5 17.5 L23 28 L16 21.5 L9 28 L12.5 17.5 L4 11 L14.2 12.5 Z"
      fill={color} stroke="#1A0A10" strokeWidth="1.4" strokeLinejoin="round"/>
    <circle cx="16" cy="16" r="3" fill="#fff" opacity="0.5"/>
  </svg>
);

export const HeartSticker = ({ size = 28, color = "#F47090" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <path d="M16 27 C16 27 4 19 4 11.5 C4 7.5 7 5 10.5 5 C12.8 5 14.8 6.2 16 8 C17.2 6.2 19.2 5 21.5 5 C25 5 28 7.5 28 11.5 C28 19 16 27 16 27Z"
      fill={color} stroke="#1A0A10" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 11 C10 9.5 11.2 8.5 12.5 8.5" stroke="#F8A0B0" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
  </svg>
);

export const MagnifySticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="15" cy="15" r="10" fill="#E8F4FF" stroke="#1A0A10" strokeWidth="1.6"/>
    <circle cx="15" cy="15" r="7" fill="#C8E8FF" stroke="#1A0A10" strokeWidth="1"/>
    <circle cx="12" cy="12" r="2" fill="white" opacity="0.7"/>
    <line x1="22.5" y1="22.5" x2="31" y2="31" stroke="#1A0A10" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="30" y1="30" x2="32" y2="32" stroke="#6A4020" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const JournalSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 36 40" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="5" y="4" width="24" height="32" rx="3" fill="#FFF0D0" stroke="#1A0A10" strokeWidth="1.6"/>
    <rect x="5" y="4" width="6" height="32" rx="2" fill="#F4A050" stroke="#1A0A10" strokeWidth="1.4"/>
    <line x1="14" y1="12" x2="25" y2="12" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="14" y1="17" x2="25" y2="17" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="14" y1="22" x2="22" y2="22" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="8" cy="10" r="1.5" fill="#fff" opacity="0.6"/>
    <circle cx="8" cy="20" r="1.5" fill="#fff" opacity="0.6"/>
    <circle cx="8" cy="30" r="1.5" fill="#fff" opacity="0.6"/>
  </svg>
);

export const PencilSticker = ({ size = 32, rotate = -20 }) => (
  <svg width={size} height={size} viewBox="0 0 16 40" fill="none"
    style={{ transform: `rotate(${rotate}deg)`, display: "block", flexShrink: 0 }}>
    <rect x="3" y="6" width="10" height="26" rx="2" fill="#FDEEA0" stroke="#1A0A10" strokeWidth="1.4"/>
    <rect x="3" y="6" width="10" height="6" rx="2" fill="#F4A8BC" stroke="#1A0A10" strokeWidth="1.4"/>
    <polygon points="3,32 8,38 13,32" fill="#F5D8A0" stroke="#1A0A10" strokeWidth="1.4" strokeLinejoin="round"/>
    <polygon points="5.5,34.5 8,38 10.5,34.5" fill="#1A0A10"/>
    <rect x="3" y="30" width="10" height="3" fill="#ddd" stroke="#1A0A10" strokeWidth="1.2"/>
  </svg>
);

export const MicSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 42" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="10" y="2" width="12" height="22" rx="6" fill="#C8DCFF" stroke="#1A0A10" strokeWidth="1.6"/>
    <path d="M6 20 C6 28 26 28 26 20" stroke="#1A0A10" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <line x1="16" y1="28" x2="16" y2="34" stroke="#1A0A10" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="11" y1="34" x2="21" y2="34" stroke="#1A0A10" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="13" y1="9" x2="19" y2="9" stroke="#1A0A10" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    <line x1="13" y1="13" x2="19" y2="13" stroke="#1A0A10" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const ClipboardSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 36 42" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="4" y="8" width="28" height="32" rx="3" fill="#EEF8FF" stroke="#1A0A10" strokeWidth="1.6"/>
    <rect x="11" y="4" width="14" height="8" rx="3" fill="#F4A8BC" stroke="#1A0A10" strokeWidth="1.4"/>
    <rect x="14" y="6" width="8" height="4" rx="2" fill="#FBCDD8"/>
    <line x1="10" y1="19" x2="26" y2="19" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="10" y1="25" x2="26" y2="25" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="10" y1="31" x2="20" y2="31" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M7 19 L8.5 21 L11 17" stroke="#4A9A4A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 25 L8.5 27 L11 23" stroke="#4A9A4A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CalendarSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 38 40" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="3" y="8" width="32" height="30" rx="4" fill="#FFF8F0" stroke="#1A0A10" strokeWidth="1.6"/>
    <rect x="3" y="8" width="32" height="10" rx="4" fill="#F4A8BC" stroke="#1A0A10" strokeWidth="1.6"/>
    <rect x="3" y="15" width="32" height="3" fill="#F4A8BC"/>
    <line x1="12" y1="4" x2="12" y2="12" stroke="#1A0A10" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="4" x2="26" y2="12" stroke="#1A0A10" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="13" cy="26" r="2.5" fill="#F4A8BC"/>
    <circle cx="22" cy="26" r="2.5" fill="#F4D020"/>
    <circle cx="31" cy="26" r="2.5" fill="#B8E8C8"/>
    <circle cx="13" cy="33" r="2.5" fill="#B8E8C8"/>
    <circle cx="22" cy="33" r="2.5" fill="#F4A8BC"/>
    <circle cx="31" cy="33" r="2.5" fill="#C8DCFF"/>
  </svg>
);

export const ChartSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 38 38" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="3" y="27" width="7" height="8" rx="2" fill="#F4A8BC" stroke="#1A0A10" strokeWidth="1.3"/>
    <rect x="13" y="17" width="7" height="18" rx="2" fill="#B8E8C8" stroke="#1A0A10" strokeWidth="1.3"/>
    <rect x="23" y="9" width="7" height="26" rx="2" fill="#F4D020" stroke="#1A0A10" strokeWidth="1.3"/>
    <line x1="2" y1="35" x2="35" y2="35" stroke="#1A0A10" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="5" x2="2" y2="35" stroke="#1A0A10" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 29 Q15 22 25 12" stroke="#E84060" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="2 2"/>
  </svg>
);

export const SettingsSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ display: "block", flexShrink: 0 }}>
    {[0,45,90,135,180,225,270,315].map((a,i) => {
      const r=12, cx=18+r*Math.cos((a-90)*Math.PI/180), cy=18+r*Math.sin((a-90)*Math.PI/180);
      return <rect key={i} x={cx-3} y={cy-4} width="6" height="8" rx="3"
        fill="#F4D8A0" stroke="#1A0A10" strokeWidth="1.2"
        transform={`rotate(${a},${cx},${cy})`}/>;
    })}
    <circle cx="18" cy="18" r="8" fill="#FFF0D0" stroke="#1A0A10" strokeWidth="1.6"/>
    <circle cx="18" cy="18" r="4" fill="#F4A050" stroke="#1A0A10" strokeWidth="1.2"/>
  </svg>
);

export const BulbSticker = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 42" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <path d="M16 4 C9 4 5 9 5 15 C5 20 8 23 10 26 L10 32 L22 32 L22 26 C24 23 27 20 27 15 C27 9 23 4 16 4Z"
      fill="#FDEEA0" stroke="#1A0A10" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M10 32 L10 35 C10 37 12 38 16 38 C20 38 22 37 22 35 L22 32"
      fill="#E8D880" stroke="#1A0A10" strokeWidth="1.4"/>
    <line x1="13" y1="34" x2="19" y2="34" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="13" y1="36" x2="19" y2="36" stroke="#1A0A10" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M13 15 Q14 12 16 12 Q18 12 19 15" stroke="#F4A020" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    <line x1="16" y1="1" x2="16" y2="3.5" stroke="#F4D020" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="23" y1="4" x2="21.5" y2="5.5" stroke="#F4D020" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="4" x2="10.5" y2="5.5" stroke="#F4D020" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const LockSticker = ({ size = 38, open = false }) => (
  <svg width={size} height={size} viewBox="0 0 42 48" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="6" y="22" width="30" height="22" rx="5" fill="#F9E8A0" stroke="#1A0A10" strokeWidth="1.8"/>
    <rect x="6" y="22" width="30" height="9" rx="5" fill="#F4D060" stroke="#1A0A10" strokeWidth="1.6"/>
    {open
      ? <path d="M14 22 L14 12 C14 6 28 6 28 12 L28 16" stroke="#1A0A10" strokeWidth="2" fill="none" strokeLinecap="round"/>
      : <path d="M14 22 L14 12 C14 6 28 6 28 12 L28 22" stroke="#1A0A10" strokeWidth="2" fill="none" strokeLinecap="round"/>
    }
    <circle cx="21" cy="33" r="4" fill="#E8A020" stroke="#1A0A10" strokeWidth="1.4"/>
    <rect x="19.5" y="33" width="3" height="5" rx="1.5" fill="#C47010" stroke="#1A0A10" strokeWidth="1"/>
  </svg>
);

export const MailSticker = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 44 36" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <rect x="3" y="4" width="38" height="28" rx="5" fill="#D8EEFF" stroke="#1A0A10" strokeWidth="1.8"/>
    <path d="M3 8 L22 20 L41 8" stroke="#1A0A10" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <path d="M3 32 L16 20" stroke="#1A0A10" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4"/>
    <path d="M41 32 L28 20" stroke="#1A0A10" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const KeySticker = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 32" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="12" cy="14" r="10" fill="#C8F0D8" stroke="#1A0A10" strokeWidth="1.8"/>
    <circle cx="12" cy="14" r="5.5" fill="#FAFAFA" stroke="#1A0A10" strokeWidth="1.4"/>
    <line x1="21" y1="17" x2="44" y2="17" stroke="#1A0A10" strokeWidth="2" strokeLinecap="round"/>
    <rect x="36" y="17" width="4" height="7" rx="1.5" fill="#F9E8A0" stroke="#1A0A10" strokeWidth="1.3"/>
    <rect x="29" y="17" width="4" height="5" rx="1.5" fill="#F9E8A0" stroke="#1A0A10" strokeWidth="1.3"/>
    <circle cx="11" cy="13" r="2" fill="#4A9A4A" stroke="#1A0A10" strokeWidth="1"/>
  </svg>
);

export const PersonSticker = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 40 46" fill="none" style={{ display: "block", flexShrink: 0 }}>
    <circle cx="20" cy="13" r="10" fill="#FDEEF2" stroke="#1A0A10" strokeWidth="1.8"/>
    <circle cx="16.5" cy="12" r="2" fill="#1A0A10"/>
    <circle cx="23.5" cy="12" r="2" fill="#1A0A10"/>
    <circle cx="17.2" cy="11.2" r="0.8" fill="white"/>
    <circle cx="24.2" cy="11.2" r="0.8" fill="white"/>
    <path d="M16 16.5 Q20 19.5 24 16.5" stroke="#1A0A10" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    <path d="M4 44 C4 34 10 28 20 28 C30 28 36 34 36 44"
      fill="#F4A8BC" stroke="#1A0A10" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 28 Q20 34 26 28" fill="#FDEEF2" stroke="#1A0A10" strokeWidth="1.4"/>
  </svg>
);

export const MoodFace = ({ type, size = 44, selected = false }) => {
  const cfg = {
    awful:  { fill:"#E8C8F0", stroke:"#8040A0" },
    low:    { fill:"#C8D8F8", stroke:"#2040A0" },
    meh:    { fill:"#F8F0C8", stroke:"#806000" },
    okay:   { fill:"#C8F0D8", stroke:"#105030" },
    good:   { fill:"#F8D8E8", stroke:"#902040" },
    great:  { fill:"#FFE8A0", stroke:"#806000" },
  };
  const f = cfg[type] || cfg.meh;
  const mouths = {
    awful:  <path d="M15 28 Q20 24 25 28" stroke={f.stroke} strokeWidth="1.8" fill="none" strokeLinecap="round"/>,
    low:    <path d="M15 27 Q20 24.5 25 27" stroke={f.stroke} strokeWidth="1.8" fill="none" strokeLinecap="round"/>,
    meh:    <line x1="15" y1="26" x2="25" y2="26" stroke={f.stroke} strokeWidth="1.8" strokeLinecap="round"/>,
    okay:   <path d="M15 25 Q20 27.5 25 25" stroke={f.stroke} strokeWidth="1.8" fill="none" strokeLinecap="round"/>,
    good:   <path d="M14 24 Q20 29 26 24" stroke={f.stroke} strokeWidth="1.8" fill="none" strokeLinecap="round"/>,
    great:  <path d="M13 23 Q20 31 27 23" stroke={f.stroke} strokeWidth="2" fill={f.fill} strokeLinecap="round"/>,
  };
  const brows = {
    awful:  <><path d="M13 15 Q16 13 18 15" stroke={f.stroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M22 15 Q24 13 27 15" stroke={f.stroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    low:    <><line x1="13" y1="15" x2="18" y2="16" stroke={f.stroke} strokeWidth="1.5" strokeLinecap="round"/><line x1="22" y1="16" x2="27" y2="15" stroke={f.stroke} strokeWidth="1.5" strokeLinecap="round"/></>,
    meh:    null,
    okay:   null,
    good:   <><line x1="13" y1="16" x2="18" y2="15" stroke={f.stroke} strokeWidth="1.5" strokeLinecap="round"/><line x1="22" y1="15" x2="27" y2="16" stroke={f.stroke} strokeWidth="1.5" strokeLinecap="round"/></>,
    great:  <><path d="M13 15 Q16 12 18 14" stroke={f.stroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M22 14 Q24 12 27 15" stroke={f.stroke} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display:"block" }}>
      <circle cx="20" cy="20" r="17"
        fill={selected ? f.fill : "#FFF8F4"}
        stroke={selected ? f.stroke : "#D0B0B8"}
        strokeWidth={selected ? "2.2" : "1.5"}/>
      {brows[type]}
      <circle cx="15.5" cy="20" r="2.5" fill={f.stroke}/>
      <circle cx="24.5" cy="20" r="2.5" fill={f.stroke}/>
      <circle cx="16.2" cy="19.2" r="1" fill="white"/>
      <circle cx="25.2" cy="19.2" r="1" fill="white"/>
      {mouths[type]}
      {type==="great" && <><path d="M12 12 L13.5 10 L15 12" stroke="#F4D020" strokeWidth="1" fill="none" strokeLinecap="round"/><path d="M25 10 L26.5 8 L28 10" stroke="#F4D020" strokeWidth="1" fill="none" strokeLinecap="round"/></>}
    </svg>
  );
};
