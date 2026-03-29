import { useState, useMemo, useRef, useEffect } from "react";
import { FONTS, GLOBAL_STYLES, WashiTape, TapeStrip, PaperClip, ScrapCard, LinedPaper } from "../components/ScrapUI";
import { FlowerSticker, DropSticker, SparkleSticker, HeartSticker, MagnifySticker, JournalSticker, PencilSticker, MicSticker, ClipboardSticker, CalendarSticker, ChartSticker, SettingsSticker, BulbSticker, MoodFace } from "../components/Stickers";

/* ════════════════════════════════════════
   DATE UTILS — always YYYY-MM-DD, no bugs
════════════════════════════════════════ */
function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function todayKey() { return toKey(new Date()); }

function diffDays(keyA, keyB) {
  return Math.round((fromKey(keyB) - fromKey(keyA)) / 86400000);
}

function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/* ════════════════════════════════════════
   PERIOD COLORS — day 1 = darkest
════════════════════════════════════════ */
function periodDayColor(n) {
  return ["#B83050","#D4506A","#E8607A","#F0849A","#FAB8C4","#FDD8E0"][Math.min((n||1)-1, 5)];
}

function deriveCycleContext(periodLog) {
  const periodDayKeys = Object.entries(periodLog || {})
    .filter(([, v]) => v && v.isPeriod)
    .map(([k]) => k)
    .sort();

  if (!periodDayKeys.length) {
    return {
      cycle_phase: "unknown",
      cycle_day: null,
      cycle_length: 28,
      last_period_start: null,
    };
  }

  const runs = [];
  let cur = [periodDayKeys[0]];
  for (let i = 1; i < periodDayKeys.length; i += 1) {
    if (diffDays(periodDayKeys[i - 1], periodDayKeys[i]) <= 2) cur.push(periodDayKeys[i]);
    else {
      runs.push(cur);
      cur = [periodDayKeys[i]];
    }
  }
  runs.push(cur);

  const starts = runs.map((r) => r[0]);
  let cycleLength = 28;
  if (starts.length >= 2) {
    const gaps = [];
    for (let i = 1; i < starts.length; i += 1) gaps.push(diffDays(starts[i - 1], starts[i]));
    cycleLength = Math.max(21, Math.min(35, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)));
  }

  const lastStartKey = starts[starts.length - 1];
  const daysSince = diffDays(lastStartKey, todayKey());
  const dayInCycle = (daysSince % cycleLength) + 1;

  let cyclePhase = "luteal";
  if (dayInCycle <= 5) cyclePhase = "menstrual";
  else if (dayInCycle <= 13) cyclePhase = "follicular";
  else if (dayInCycle <= 16) cyclePhase = "ovulation";

  return {
    cycle_phase: cyclePhase,
    cycle_day: dayInCycle,
    cycle_length: cycleLength,
    last_period_start: lastStartKey,
  };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const FLOW_LEVELS = [
  {id:"spotting",label:"spotting",color:"#FFD0D8"},
  {id:"light",   label:"light",   color:"#FF9EB8"},
  {id:"medium",  label:"medium",  color:"#E8607A"},
  {id:"heavy",   label:"heavy",   color:"#B83050"},
];
const SYMPTOMS   = ["cramps","bloating","headache","back pain","mood swings","fatigue","acne","cravings","nausea","anxiety","crying spells","tender breasts"];
const MOOD_TYPES = ["awful","low","meh","okay","good","great"];
const AVG_PERIOD_LEN = 5;

/* ════════════════════════════════════════
   PDF GENERATOR — girly scrapbook style
════════════════════════════════════════ */
import { jsPDF } from "jspdf";

/* Colour palette */
const C = {
  bg:       [245,236,224],  // kraft paper
  pink:     [196,96,122],   // #C4607A
  pinkLt:   [253,238,242],  // #FDEEF2
  rose:     [139,48,80],    // #8B3050
  cream:    [255,248,240],  // #FFF8F0
  green:    [127,191,123],  // #7BBF7B
  greenLt:  [212,240,212],  // #D4F0D4
  yellow:   [232,184,48],   // #E8B830
  yellowLt: [253,245,212],  // #FDF5D4
  red:      [200,64,64],    // #C84040
  redLt:    [253,228,228],  // #FDE4E4
  purple:   [128,64,160],   // #8040A0
  purpleLt: [248,240,255],  // #F8F0FF
  grey:     [154,112,128],  // #9A7080
  text:     [58,24,32],     // #3A1820
  white:    [255,255,255],
};

function drawPdfFlower(doc, x, y, size) {
  const r = size * 0.38;
  [0,60,120,180,240,300].forEach((a,i)=>{
    const rad = (a-90)*Math.PI/180;
    const cx = x + r*Math.cos(rad), cy = y + r*Math.sin(rad);
    doc.setFillColor(...(i%2===0 ? [244,168,188] : [251,205,216]));
    doc.ellipse(cx, cy, size*0.22, size*0.15, "F");
  });
  doc.setFillColor(253,238,160);
  doc.circle(x, y, size*0.18, "F");
}

function drawPdfHeart(doc, x, y, s) {
  doc.setFillColor(...C.pink);
  doc.circle(x - s*0.25, y - s*0.1, s*0.28, "F");
  doc.circle(x + s*0.25, y - s*0.1, s*0.28, "F");
  doc.triangle(x - s*0.48, y + s*0.05, x + s*0.48, y + s*0.05, x, y + s*0.55, "F");
}

function drawPdfSparkle(doc, x, y, s) {
  doc.setFillColor(244,208,32);
  const pts = [];
  for(let i=0;i<8;i++){
    const a = (i*45-90)*Math.PI/180;
    const r = i%2===0 ? s*0.5 : s*0.2;
    pts.push([x+r*Math.cos(a), y+r*Math.sin(a)]);
  }
  pts.forEach((p,i)=>{
    const n = pts[(i+1)%pts.length];
    doc.triangle(x,y, p[0],p[1], n[0],n[1], "F");
  });
}

function drawWashiStrip(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.setGState(new doc.GState({opacity:0.55}));
  doc.rect(x, y, w, h, "F");
  // stripe lines
  doc.setDrawColor(255,255,255);
  doc.setLineWidth(0.3);
  for(let lx=x+3; lx<x+w; lx+=4){
    doc.line(lx, y, lx, y+h);
  }
  doc.setGState(new doc.GState({opacity:1}));
}

function drawDashedLine(doc, x1, y1, x2, y2, dash=2, gap=2) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  const ux = dx/len, uy = dy/len;
  let d = 0;
  while(d < len) {
    const sx = x1+ux*d, sy = y1+uy*d;
    const end = Math.min(d+dash, len);
    doc.line(sx, sy, x1+ux*end, y1+uy*end);
    d = end+gap;
  }
}

function drawRoundedCard(doc, x, y, w, h, r, fillColor, borderColor) {
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y, w, h, r, r, "F");
  if(borderColor) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, r, r, "S");
  }
}

function addPageDecor(doc, pageW, pageH) {
  // corner flowers
  drawPdfFlower(doc, 18, 16, 8);
  drawPdfFlower(doc, pageW-18, 16, 7);
  drawPdfFlower(doc, 18, pageH-14, 6);
  drawPdfFlower(doc, pageW-18, pageH-14, 7);
  // tiny hearts
  drawPdfHeart(doc, pageW-35, 20, 3);
  drawPdfHeart(doc, 35, pageH-12, 2.5);
  // sparkles
  drawPdfSparkle(doc, pageW/2+40, 12, 4);
  drawPdfSparkle(doc, pageW/2-50, pageH-10, 3.5);
  // bottom washi tape
  drawWashiStrip(doc, pageW/2-30, pageH-6, 60, 4, [255,182,193]);
}

function pdfHeader(doc, title, subtitle, y, pageW) {
  // background strip
  drawRoundedCard(doc, 14, y-2, pageW-28, 22, 3, C.pinkLt, null);
  drawWashiStrip(doc, 20, y-5, 40, 5, [255,182,193]);

  doc.setFont("helvetica","bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.rose);
  doc.text(title, pageW/2, y+8, {align:"center"});

  doc.setFont("helvetica","normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.grey);
  doc.text(subtitle, pageW/2, y+16, {align:"center"});

  return y + 28;
}

function pdfSectionTitle(doc, title, y, x, emoji, color) {
  doc.setFont("helvetica","bold");
  doc.setFontSize(12);
  doc.setTextColor(...(color||C.pink));
  doc.text(`${emoji||""}  ${title}`, x, y);
  // underline
  doc.setDrawColor(...(color||C.pink));
  doc.setLineWidth(0.6);
  drawDashedLine(doc, x, y+2, x+doc.getTextWidth(`${emoji||""}  ${title}`), y+2, 3, 2);
  return y + 8;
}

function wrapText(doc, text, maxW) {
  return doc.splitTextToSize(text, maxW);
}

function addNewPageIfNeeded(doc, y, needed, pageH, pageW) {
  if(y + needed > pageH - 20) {
    doc.addPage();
    addPageDecor(doc, pageW, pageH);
    return 30;
  }
  return y;
}

/* ── SESSION NOTES PDF (from Today chat) ── */
function generateSessionPDF(messages) {
  const doc = new jsPDF({unit:"mm", format:"a4"});
  const pageW = 210, pageH = 297;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  // background
  doc.setFillColor(...C.bg);
  doc.rect(0,0,pageW,pageH,"F");
  addPageDecor(doc, pageW, pageH);

  let y = 20;
  y = pdfHeader(doc, "ventspace  ~  session notes", dateStr, y, pageW);

  const userMsgs = messages.filter(m=>m.role==="user");
  const redE = userMsgs.filter(m=>m.level==="red");
  const yellowE = userMsgs.filter(m=>m.level==="yellow");
  const greenE = userMsgs.filter(m=>m.level==="green");

  // summary card
  y += 4;
  drawRoundedCard(doc, 16, y, pageW-32, 30, 4, C.cream, C.pink);
  drawPdfHeart(doc, pageW-28, y+5, 3);

  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...C.rose);
  doc.text("session snapshot", 22, y+8);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...C.text);
  doc.text(`total entries: ${userMsgs.length}`, 22, y+15);

  // mini colored dots
  const dotY = y+22;
  [[greenE.length,"healthy venting",C.green,C.greenLt],[yellowE.length,"self-criticism",C.yellow,C.yellowLt],[redE.length,"flagged for support",C.red,C.redLt]].forEach(([ct,label,clr,bgc],i)=>{
    const dx = 22 + i*58;
    doc.setFillColor(...bgc); doc.roundedRect(dx, dotY-4, 52, 8, 2, 2, "F");
    doc.setFillColor(...clr); doc.circle(dx+4, dotY, 2, "F");
    doc.setFontSize(8); doc.setTextColor(...C.text);
    doc.text(`${ct} ${label}`, dx+8, dotY+1);
  });
  y += 36;

  // flagged entries
  if(redE.length > 0) {
    y = addNewPageIfNeeded(doc, y, 30, pageH, pageW);
    y = pdfSectionTitle(doc, "flagged entries", y, 18, "!!", C.red);
    drawRoundedCard(doc, 16, y-2, pageW-32, redE.length*14+6, 3, C.redLt, [232,144,144]);
    redE.forEach((e,i)=>{
      y = addNewPageIfNeeded(doc, y, 12, pageH, pageW);
      doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(...C.text);
      const lines = wrapText(doc, `"${e.text}"`, pageW-50);
      lines.forEach(line => {
        doc.text(line, 22, y+4);
        y += 5;
      });
      y += 3;
    });
    y += 6;
  }

  // self-criticism
  if(yellowE.length > 0) {
    y = addNewPageIfNeeded(doc, y, 30, pageH, pageW);
    y = pdfSectionTitle(doc, "self-criticism patterns", y, 18, "**", [180,130,40]);
    drawRoundedCard(doc, 16, y-2, pageW-32, yellowE.length*14+6, 3, C.yellowLt, [232,200,100]);
    yellowE.forEach((e)=>{
      y = addNewPageIfNeeded(doc, y, 12, pageH, pageW);
      doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(...C.text);
      const lines = wrapText(doc, `"${e.text}"`, pageW-50);
      lines.forEach(line => {
        doc.text(line, 22, y+4);
        y += 5;
      });
      y += 3;
    });
    y += 6;
  }

  // all entries
  y = addNewPageIfNeeded(doc, y, 20, pageH, pageW);
  y = pdfSectionTitle(doc, "all entries", y, 18, "~", C.purple);

  userMsgs.forEach((e)=>{
    y = addNewPageIfNeeded(doc, y, 18, pageH, pageW);
    const tagC = e.level==="red"?C.red:e.level==="yellow"?C.yellow:C.green;
    const tagBg = e.level==="red"?C.redLt:e.level==="yellow"?C.yellowLt:C.greenLt;
    const tagLabel = e.level==="red"?"flagged":e.level==="yellow"?"self-criticism":"healthy";

    // tag pill
    doc.setFillColor(...tagBg); doc.roundedRect(20, y-3, 28, 6, 2, 2, "F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...tagC);
    doc.text(tagLabel, 22, y+1);

    // entry text
    doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(...C.text);
    const lines = wrapText(doc, `"${e.text}"`, pageW-56);
    lines.forEach((line,li)=>{
      doc.text(line, 52, y-1+li*5);
    });
    y += Math.max(lines.length*5, 6) + 4;

    // divider
    doc.setDrawColor(...C.pinkLt); doc.setLineWidth(0.3);
    drawDashedLine(doc, 20, y-2, pageW-20, y-2);
  });

  // footer
  y = addNewPageIfNeeded(doc, y, 30, pageH, pageW);
  y += 6;
  drawRoundedCard(doc, 20, y, pageW-40, 20, 4, [255,240,245], C.pink);
  drawPdfFlower(doc, 30, y+10, 5);
  drawPdfFlower(doc, pageW-30, y+10, 5);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...C.grey);
  doc.text("generated by ventspace ~ bring this to a therapist or share with someone you trust", pageW/2, y+8, {align:"center"});
  doc.text("you don't have to explain everything from scratch", pageW/2, y+14, {align:"center"});

  doc.save(`ventspace-session-${now.toISOString().slice(0,10)}.pdf`);
}

/* ── WEEKLY REPORT PDF (from Report tab) ── */
function generateReportPDF(entries, periodLog, summary) {
  const doc = new jsPDF({unit:"mm", format:"a4"});
  const pageW = 210, pageH = 297;
  const now = new Date();
  const dateRange = `${new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).toLocaleDateString("en-US",{month:"short",day:"numeric"})} - ${now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;

  const total = entries.length;
  const green = entries.filter(e=>e.level==="green").length;
  const yellow = entries.filter(e=>e.level==="yellow").length;
  const red = entries.filter(e=>e.level==="red").length;
  const gPct = total?Math.round(green/total*100):0;
  const yPct = total?Math.round(yellow/total*100):0;
  const rPct = total?Math.round(red/total*100):0;

  // phrases
  const phraseList=["not good enough","don't deserve","always mess up","nobody understands","can't do this","i'm stupid","overwhelmed","i failed","worthless","everyone except me"];
  const topPhrases = phraseList.map(p=>({phrase:p,count:entries.filter(e=>e.text.toLowerCase().includes(p)).length})).filter(p=>p.count>0).sort((a,b)=>b.count-a.count).slice(0,5);

  // period stats
  const periodDayCount = Object.values(periodLog).filter(v=>v&&v.isPeriod).length;
  const loggedDayCount = Object.values(periodLog).filter(v=>v).length;
  const symCount = {}; Object.values(periodLog).filter(v=>v).forEach(l=>(l.symptoms||[]).forEach(s=>{symCount[s]=(symCount[s]||0)+1;}));
  const topSym = Object.entries(symCount).sort((a,b)=>b[1]-a[1])[0];

  // streak
  let streak=0; const d2=new Date(now);
  while(streak<=365){
    const dk2=toKey(d2);
    const hasE2=entries.some(e=>new Date(e.date).toDateString()===d2.toDateString());
    if(hasE2||periodLog[dk2]){streak++;d2.setDate(d2.getDate()-1);}else break;
  }

  // bg
  doc.setFillColor(...C.bg);
  doc.rect(0,0,pageW,pageH,"F");
  addPageDecor(doc, pageW, pageH);

  let y = 20;
  y = pdfHeader(doc, "ventspace  ~  weekly report", dateRange, y, pageW);

  // ── SNAPSHOT ROW ──
  y += 4;
  const cardW = (pageW-44)/3;
  [
    {label:"entries",   val:`${total}`,     sub:"this week",     bg:C.pinkLt, accent:C.pink},
    {label:"streak",    val:`${streak}d`,   sub:"days in a row", bg:C.yellowLt, accent:C.yellow},
    {label:"overall",   val:red>0?"needs support":yellow>green?"check-in":"thriving", sub:"mood zone", bg:C.greenLt, accent:C.green},
  ].forEach((card,i)=>{
    const cx = 16 + i*(cardW+6);
    drawRoundedCard(doc, cx, y, cardW, 26, 3, card.bg, card.accent);
    doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(...C.grey);
    doc.text(card.label.toUpperCase(), cx+5, y+7);
    doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(...C.text);
    doc.text(card.val, cx+5, y+17);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...C.grey);
    doc.text(card.sub, cx+5, y+22);
  });
  y += 34;

  // ── MOOD BREAKDOWN ──
  y = pdfSectionTitle(doc, "mood breakdown", y, 18, "~", C.pink);
  drawRoundedCard(doc, 16, y-2, pageW-32, 34, 3, C.cream, null);
  [
    {label:"healthy venting", pct:gPct, count:green, clr:C.green,   bgc:C.greenLt},
    {label:"self-criticism",  pct:yPct, count:yellow,clr:C.yellow,  bgc:C.yellowLt},
    {label:"reach out",       pct:rPct, count:red,   clr:C.red,     bgc:C.redLt},
  ].forEach((b,i)=>{
    const by = y + 2 + i*10;
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...C.text);
    doc.text(b.label, 22, by+4);
    // bar bg
    doc.setFillColor(...b.bgc); doc.roundedRect(65, by+0.5, 90, 5, 1.5, 1.5, "F");
    // bar fill
    if(b.pct>0){
      doc.setFillColor(...b.clr); doc.roundedRect(65, by+0.5, Math.max(90*(b.pct/100),3), 5, 1.5, 1.5, "F");
    }
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...b.clr);
    doc.text(`${b.pct}%`, 160, by+4);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(...C.grey);
    doc.text(`(${b.count})`, 172, by+4);
  });
  y += 40;

  // ── RECURRING PHRASES ──
  if(topPhrases.length>0) {
    y = addNewPageIfNeeded(doc, y, 14+topPhrases.length*10, pageH, pageW);
    y = pdfSectionTitle(doc, "phrases you keep repeating", y, 18, "~", C.purple);
    drawRoundedCard(doc, 16, y-2, pageW-32, topPhrases.length*10+6, 3, C.purpleLt, null);
    topPhrases.forEach((p,i)=>{
      const py = y + 2 + i*10;
      doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(...C.text);
      doc.text(`"${p.phrase}"`, 22, py+4);
      // mini bar
      const maxC = Math.max(...topPhrases.map(x=>x.count));
      const barW = 40*(p.count/maxC);
      doc.setFillColor(232,144,168); doc.roundedRect(130, py+0.5, barW, 4, 1, 1, "F");
      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...C.pink);
      doc.text(`${p.count}x`, 175, py+4);
    });
    y += topPhrases.length*10 + 12;
  }

  // ── CYCLE DATA ──
  if(loggedDayCount>0) {
    y = addNewPageIfNeeded(doc, y, 36, pageH, pageW);
    y = pdfSectionTitle(doc, "period & cycle data", y, 18, "~", [184,48,80]);
    drawRoundedCard(doc, 16, y-2, pageW-32, 28, 3, C.pinkLt, null);
    drawPdfHeart(doc, pageW-28, y+4, 3);
    [
      {label:"period days logged", val:`${periodDayCount} day${periodDayCount!==1?"s":""}`},
      {label:"symptom days logged",val:`${loggedDayCount} day${loggedDayCount!==1?"s":""}`},
      {label:"top symptom",        val:topSym?`${topSym[0]} (${topSym[1]}x)`:"none yet"},
    ].forEach((s,i)=>{
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...C.grey);
      doc.text(s.label, 22, y+4+i*8);
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...C.text);
      doc.text(s.val, 80, y+4+i*8);
    });
    y += 34;
  }

  // ── THERAPIST SUMMARY ──
  y = addNewPageIfNeeded(doc, y, 40, pageH, pageW);
  y = pdfSectionTitle(doc, "therapist-ready summary", y, 18, "~", C.purple);
  drawRoundedCard(doc, 16, y-2, pageW-32, 26, 3, C.purpleLt, [190,160,240]);
  drawPdfFlower(doc, pageW-28, y+4, 4);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...C.text);
  const summaryLines = wrapText(doc, summary, pageW-50);
  summaryLines.forEach((line,i)=>{
    doc.text(line, 22, y+5+i*5);
  });
  y += Math.max(summaryLines.length*5+10, 28) + 6;

  // ── ALL ENTRIES ──
  if(total>0) {
    y = addNewPageIfNeeded(doc, y, 20, pageH, pageW);
    y = pdfSectionTitle(doc, "all entries this week", y, 18, "~", C.pink);

    entries.forEach((e)=>{
      y = addNewPageIfNeeded(doc, y, 18, pageH, pageW);
      const tagC = e.level==="red"?C.red:e.level==="yellow"?C.yellow:C.green;
      const tagBg = e.level==="red"?C.redLt:e.level==="yellow"?C.yellowLt:C.greenLt;
      const tagLabel = e.level==="red"?"flagged":e.level==="yellow"?"self-criticism":"healthy";
      const d = new Date(e.date);

      // timestamp
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...C.grey);
      doc.text(d.toLocaleDateString()+" "+d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), 20, y);

      // tag pill
      doc.setFillColor(...tagBg); doc.roundedRect(70, y-3.5, 24, 5, 1.5, 1.5, "F");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...tagC);
      doc.text(tagLabel, 72, y);

      // text
      y += 4;
      doc.setFont("helvetica","italic"); doc.setFontSize(9); doc.setTextColor(...C.text);
      const lines = wrapText(doc, `"${e.text}"`, pageW-50);
      lines.forEach((line)=>{
        doc.text(line, 22, y+1);
        y += 5;
      });
      y += 3;

      doc.setDrawColor(...C.pinkLt); doc.setLineWidth(0.3);
      drawDashedLine(doc, 22, y-1, pageW-22, y-1);
    });
  }

  // ── FOOTER ──
  y = addNewPageIfNeeded(doc, y, 30, pageH, pageW);
  y += 8;
  drawRoundedCard(doc, 20, y, pageW-40, 22, 4, [255,240,245], C.pink);
  drawPdfFlower(doc, 30, y+11, 5);
  drawPdfFlower(doc, pageW-30, y+11, 5);
  drawPdfHeart(doc, pageW/2, y+3, 3);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...C.grey);
  doc.text("generated by ventspace ~ bring this to a therapist or share with someone you trust", pageW/2, y+10, {align:"center"});
  doc.text("you don't have to explain everything from scratch <3", pageW/2, y+16, {align:"center"});

  doc.save(`ventspace-report-${now.toISOString().slice(0,10)}.pdf`);
}

/* ════════════════════════════════════════
   TODAY — CONTINUOUS CHAT
════════════════════════════════════════ */
function TodayScreen({ onAddEntry, cycleContext }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [sampleAudio, setSampleAudio] = useState(null);
  const chatEndRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL || "https://ood.explorer.northeastern.edu/node/d1007/5050";

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const localAnalyze = (input) => {
    const l = input.toLowerCase();
    if (l.includes("don't deserve") || l.includes("worthless") || l.includes("hate myself") || l.includes("want to die") || l.includes("end it")) return "red";
    if (l.includes("not good enough") || l.includes("stupid") || l.includes("fail") || l.includes("not enough") || l.includes("ugly") || l.includes("nobody cares") || l.includes("always mess")) return "yellow";
    return "green";
  };

  const responses = {
    green: [
      "that sounds really hard and it makes complete sense you needed to get it out. you're not overreacting — bad days don't define you.",
      "thank you for sharing that. getting it out of your head and onto the page is already a brave step.",
      "that's valid. sometimes just naming the feeling takes away some of its power.",
    ],
    yellow: [
      "i hear you being really hard on yourself. those thoughts can feel loud, but they're not the full picture of who you are.",
      "that inner critic is loud today. one small act of self-kindness right now can help soften that edge.",
    ],
    red: [
      "this feels heavier than a rough day. please reach out to 988 (call/text) or text HOME to 741741. you deserve support now.",
      "you don't have to carry this alone. if you're in immediate danger, call emergency services now; otherwise 988 can support you right away.",
    ],
  };

  const mapTierToLevel = (tierOrLevel) => {
    const v = (tierOrLevel || "").toString().toLowerCase();
    if (v === "red") return "red";
    if (v === "yellow") return "yellow";
    if (v === "green") return "green";
    if (v === "red" || v === "yellow" || v === "green") return v;
    return "green";
  };

  const addTurn = (userText, botText, level, extra = {}) => {
    const ts = new Date();
    const userMsg = {
      role: "user",
      text: userText,
      level,
      time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const botMsg = {
      role: "bot",
      text: botText,
      level,
      time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...extra,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    onAddEntry({ date: ts.toISOString(), text: userText, level, ...extra });
  };

  const fallbackTurn = (inputText) => {
    const level = localAnalyze(inputText);
    const pool = responses[level];
    const botText = pool[Math.floor(Math.random() * pool.length)];
    addTurn(inputText, botText, level, { source: "fallback" });
  };

  const analyzeText = async (inputText) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          cycle_phase: cycleContext?.cycle_phase || "unknown",
        }),
      });
      if (!res.ok) throw new Error("analyze request failed");

      const data = await res.json();
      const level = mapTierToLevel(data.spectrum_level || data.tier);
      addTurn(inputText, data.response || "Thanks for sharing.", level, {
        source: "backend",
        tier: data.tier,
        spectrum_score: data.spectrum_score,
        phase_display: data.phase_display,
      });
    } catch (err) {
      fallbackTurn(inputText);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAudio = async (blobOrFile) => {
    setLoading(true);
    try {
      const form = new FormData();
      const name = blobOrFile?.name || "ventspace-recording.webm";
      form.append("audio", blobOrFile, name);
      form.append("cycle_phase", cycleContext?.cycle_phase || "unknown");

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("audio analyze request failed");

      const data = await res.json();
      const transcript = (data.transcript || "").trim();
      const userDisplayText = transcript || "(audio clip - transcription unavailable)";
      const level = mapTierToLevel(data.spectrum_level || data.tier);
      addTurn(userDisplayText, data.response || "Thanks for sharing that.", level, {
        source: "backend-audio",
        tier: data.tier,
        spectrum_score: data.spectrum_score,
        audio_emotion: data.audio_emotion,
        audio_error: data.audio_error || null,
      });
    } catch (err) {
      const fallbackText = text.trim() || "voice note";
      fallbackTurn(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const input = text.trim();
    if (!input || loading) return;
    setText("");
    await analyzeText(input);
  };

  const startRecording = async () => {
    if (recording) return;
    setRecordingError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;

      rec.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
      };

      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (blob.size > 0) {
          await analyzeAudio(blob);
        }
      };

      rec.start();
      setRecording(true);
    } catch (err) {
      setRecordingError("mic permission denied or unavailable — use sample audio upload.");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current) return;
    if (recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  };

  const submitSampleAudio = async () => {
    if (!sampleAudio || loading) return;
    await analyzeAudio(sampleAudio);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasRedMessages = messages.some((m) => m.role === "user" && m.level === "red");

  const handleDownloadSession = async () => {
    if (!messages.length || loading) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/report/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) throw new Error("chat report request failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ventspace-chat-report-${ts}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback keeps demo resilient if backend report endpoint fails.
      generateSessionPDF(messages);
    } finally {
      setLoading(false);
    }
  };

  const lc = { green: "#D4F0D4", yellow: "#FDF5D4", red: "#FDE4E4" };
  const lb = { green: "#8FCC8F", yellow: "#E8C84A", red: "#E89090" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <ScrapCard bg="#FFF0F4" rotate={-0.5}
        tape={<WashiTape color="rgba(255,182,193,0.6)" rotate={-1.5} top={-10} left={30} width={90} label="today"/>}
        style={{ padding:"28px 24px 8px", borderRadius:3 }}>
        <div style={{ position:"absolute", top:-10, right:18 }}><FlowerSticker size={38} rotate={12}/></div>
        <h1 style={{ fontFamily:"'Caveat',cursive", fontSize:34, fontWeight:700, color:"#8B3050", lineHeight:1.1, marginBottom:6 }}>how are you feeling?</h1>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:15, color:"#B07080" }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
      </ScrapCard>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:10, paddingLeft:4 }}>
        {[{id:"text",label:"write it out"},{id:"voice",label:"speak it out"}].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{ fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:600, padding:"6px 20px", border:"2px solid", borderColor:mode===m.id?"#C4607A":"#E8C0C8", background:mode===m.id?"#C4607A":"rgba(255,255,255,0.6)", color:mode===m.id?"#fff":"#C4607A", borderRadius:3, cursor:"pointer", transform:mode===m.id?"rotate(-1deg)":"rotate(0.5deg)", boxShadow:mode===m.id?"2px 3px 8px rgba(196,96,122,0.25)":"none", display:"flex", alignItems:"center", gap:8 }}>
            {m.id==="text"?<PencilSticker size={18} rotate={0}/>:<MicSticker size={18}/>}
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:14, maxHeight:420, overflowY:"auto", padding:"4px 2px", scrollBehavior:"smooth" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems: msg.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth:"85%",
                background: msg.role==="user" ? "#FFFEF8" : lc[msg.level],
                border: msg.role==="user" ? "1.5px solid #E8C0C8" : `1.5px solid ${lb[msg.level]}`,
                borderRadius: msg.role==="user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding:"12px 16px",
                boxShadow:"1px 2px 6px rgba(120,80,80,0.08)",
                position:"relative",
              }}>
                {msg.role==="bot" && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    {msg.level==="green"?<FlowerSticker size={16} rotate={10}/>:msg.level==="yellow"?<SparkleSticker size={14} color="#E8D020"/>:<HeartSticker size={14} color="#E84060"/>}
                    <span style={{ fontFamily:"'Caveat',cursive", fontSize:12, color:"#B07080" }}>ventspace</span>
                  </div>
                )}
                <p style={{ fontFamily:"'Kalam',cursive", fontSize:14, color:"#3A1820", lineHeight:1.7, margin:0 }}>
                  {msg.role==="user" ? `"${msg.text}"` : msg.text}
                </p>
                {msg.role==="user" && (
                  <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:6, marginTop:6 }}>
                    <div style={{ background:lc[msg.level], border:`1.5px solid ${lb[msg.level]}`, borderRadius:3, padding:"2px 8px", fontFamily:"'Caveat',cursive", fontSize:11, fontWeight:700, color:msg.level==="green"?"#2E6B2E":msg.level==="yellow"?"#7A5B00":"#8B2020" }}>
                      {msg.level==="green"?"healthy venting":msg.level==="yellow"?"self-criticism":"reach out"}
                    </div>
                  </div>
                )}
                {msg.role==="bot" && msg.level==="red" && (
                  <button onClick={handleDownloadSession} style={{ marginTop:10, fontFamily:"'Caveat',cursive", fontSize:15, fontWeight:700, padding:"6px 16px", border:"2px solid #C4607A", background:"#C4607A", color:"#fff", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    <ClipboardSticker size={16}/> download session PDF
                  </button>
                )}
              </div>
              <span style={{ fontFamily:"'Patrick Hand',cursive", fontSize:11, color:"#C4A0A8", marginTop:3, padding:"0 4px" }}>{msg.time}</span>
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>
      )}

      {/* Prompt area — always visible */}
      <ScrapCard bg="#FFFEF8" rotate={0.3}
        tape={messages.length===0 ? <WashiTape color="rgba(180,220,255,0.5)" rotate={1} top={-10} left={60} width={70}/> : null}
        style={{ padding:"16px 18px 8px", borderRadius:2 }}>
        <div style={{ position:"absolute", top:8, right:14 }}><PencilSticker size={20} rotate={-8}/></div>
        {mode==="text" ? (
          <div>
            <LinedPaper
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder={messages.length===0 ? "just dump it all here… no judgment, no structure needed" : "keep going… what else is on your mind?"}
              rows={3}
            />
            <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:10, paddingBottom:4 }}>
              <button onClick={handleSubmit} disabled={!text.trim() || loading} onKeyDown={handleKeyDown} style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, padding:"7px 22px", border:"2px solid #C4607A", background:text.trim()&&!loading?"#C4607A":"#F5D8DC", color:text.trim()&&!loading?"#fff":"#C4A0A8", borderRadius:3, cursor:text.trim()&&!loading?"pointer":"not-allowed", transform:"rotate(-0.5deg)", boxShadow:text.trim()&&!loading?"2px 3px 8px rgba(196,96,122,0.2)":"none" }}>
                  {loading ? "analyzing..." : messages.length===0 ? "read my entry →" : "send →"}
              </button>
              <span style={{ fontFamily:"'Patrick Hand',cursive", fontSize:12, color:"#C4A0A8" }}>
                press enter to send
              </span>
            </div>
          </div>
        ) : (
            <div style={{ padding:"20px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, background:"#FFFEF8" }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
                {!recording ? (
                  <button onClick={startRecording} disabled={loading} style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, padding:"8px 18px", border:"2px solid #C4607A", background:loading?"#F5D8DC":"#C4607A", color:"#fff", borderRadius:4, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8 }}>
                    <MicSticker size={18}/>
                    start recording
                  </button>
                ) : (
                  <button onClick={stopRecording} style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, padding:"8px 18px", border:"2px solid #8B2040", background:"#8B2040", color:"#fff", borderRadius:4, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                    <MicSticker size={18}/>
                    stop + analyze
                  </button>
                )}
              </div>

              <span style={{ fontFamily:"'Kalam',cursive", fontSize:14, color:"#B07080", textAlign:"center" }}>
                {recording ? "recording... tap stop when done" : "live mic for demo"}
              </span>

              <div style={{ width:"100%", borderTop:"1px dashed #F0D8DC", paddingTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                <span style={{ fontFamily:"'Patrick Hand',cursive", fontSize:12, color:"#9A7080" }}>fallback: upload prerecorded audio</span>
                <input type="file" accept="audio/*" onChange={(e) => setSampleAudio(e.target.files?.[0] || null)} style={{ fontFamily:"'Kalam',cursive", fontSize:13 }} />
                <button onClick={submitSampleAudio} disabled={!sampleAudio || loading} style={{ fontFamily:"'Caveat',cursive", fontSize:16, fontWeight:700, padding:"7px 16px", border:"2px solid #C4607A", background:sampleAudio&&!loading?"#C4607A":"#F5D8DC", color:sampleAudio&&!loading?"#fff":"#C4A0A8", borderRadius:4, cursor:sampleAudio&&!loading?"pointer":"not-allowed" }}>
                  analyze uploaded audio
                </button>
                {!!recordingError && <span style={{ fontFamily:"'Patrick Hand',cursive", fontSize:12, color:"#B04050" }}>{recordingError}</span>}
              </div>
          </div>
        )}
      </ScrapCard>

      {/* Session stats bar */}
      {messages.length > 0 && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", paddingLeft:4 }}>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:14, color:"#9A7080" }}>
            {messages.filter(m=>m.role==="user").length} entries this session
          </span>
          {hasRedMessages && (
            <button onClick={handleDownloadSession} style={{ fontFamily:"'Caveat',cursive", fontSize:14, fontWeight:700, padding:"5px 14px", border:"1.5px solid #C4607A", background:"rgba(255,255,255,0.7)", color:"#C4607A", borderRadius:3, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <ClipboardSticker size={14}/> download full session PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   PATTERNS
════════════════════════════════════════ */
function PatternsScreen({ entries }) {
  const now = new Date();
  const weekData = useMemo(()=>{
    const days=["sun","mon","tue","wed","thu","fri","sat"];
    const cm={green:"#7BBF7B",yellow:"#E8B830",red:"#C84040"};
    const res=days.map(d=>({day:d,val:0,color:"#E8D0D4",count:0}));
    entries.forEach(e=>{
      const d=new Date(e.date);
      if(Math.floor((now-d)/86400000)<7){
        const i=d.getDay();
        res[i].val=Math.max(res[i].val,e.level==="red"?85:e.level==="yellow"?60:40);
        res[i].color=cm[e.level]; res[i].count++;
      }
    });
    return res;
  },[entries]);

  const total=entries.length;
  const red=entries.filter(e=>e.level==="red").length;
  const yellow=entries.filter(e=>e.level==="yellow").length;

  const topPhrases=useMemo(()=>{
    const ps=["not good enough","don't deserve","always mess up","nobody understands","everyone except me","can't do this","i'm stupid","overwhelmed","i failed","worthless"];
    return ps.map(p=>({phrase:p,count:entries.filter(e=>e.text.toLowerCase().includes(p)).length})).filter(p=>p.count>0).sort((a,b)=>b.count-a.count).slice(0,5);
  },[entries]);

  const zone=red>0?"🔴 red zone":yellow>0?"🟡 check in":"🟢 healthy";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:26 }}>
      <ScrapCard bg="#FFF4EC" rotate={0.4} tape={<WashiTape color="rgba(255,200,150,0.55)" rotate={-1} top={-10} left={20} width={110} label="my patterns"/>} style={{ padding:"24px 22px 8px", borderRadius:3 }}>
        <div style={{ position:"absolute", top:-10, right:20 }}><ChartSticker size={32}/></div>
        <h1 style={{ fontFamily:"'Caveat',cursive", fontSize:34, fontWeight:700, color:"#7A3828" }}>this week's vibes</h1>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:14, color:"#A07060" }}>last 7 days · {total} {total===1?"entry":"entries"}</p>
      </ScrapCard>

      <div style={{ display:"flex", gap:18, flexWrap:"wrap", paddingLeft:8 }}>
        {[
          {icon:<JournalSticker size={38}/>,label:`${total} entries`,rotate:-3,bg:"#fff"},
          {icon:<ChartSticker size={38}/>,  label:`${yellow+red} flagged`,rotate:2,bg:"#FFF8F0"},
          {icon:<SparkleSticker size={36} color="#E8C820"/>,label:zone,rotate:-1.5,bg:"#FFFBF0"},
        ].map((p,i)=>(
          <div key={i} style={{ background:p.bg,padding:"10px 10px 28px",boxShadow:"2px 4px 10px rgba(120,80,80,0.18)",transform:`rotate(${p.rotate}deg)`,display:"inline-block",minWidth:90 }}>
            <div style={{ width:"100%",aspectRatio:"1",background:"#F5ECF0",display:"flex",alignItems:"center",justifyContent:"center" }}>{p.icon}</div>
            <p style={{ fontFamily:"'Caveat',cursive",fontSize:13,color:"#8A5060",textAlign:"center",marginTop:6 }}>{p.label}</p>
          </div>
        ))}
      </div>

      <ScrapCard bg="#FFFDF8" rotate={-0.5} tape={<TapeStrip rotate={-42} top={-8} left={12}/>} style={{ padding:"20px 22px 8px", borderRadius:2 }}>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#C4607A",marginBottom:18 }}>mood chart</p>
        {total===0 ? <p style={{ fontFamily:"'Kalam',cursive",fontSize:14,color:"#B07080",fontStyle:"italic",paddingBottom:12 }}>no entries yet — start venting!</p> : (
          <div style={{ display:"flex",gap:10,alignItems:"flex-end",height:90 }}>
            {weekData.map((d,i)=>(
              <div key={i} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1 }}>
                <div style={{ width:"100%",height:80,background:"#F5E8EC",borderRadius:4,display:"flex",alignItems:"flex-end",overflow:"hidden" }}>
                  <div style={{ width:"100%",height:`${d.val||8}%`,background:d.count>0?d.color:"#F0D8DC",borderRadius:4 }}/>
                </div>
                <span style={{ fontFamily:"'Caveat',cursive",fontSize:12,color:d.count>0?"#7A5060":"#C0A0A8" }}>{d.day}</span>
              </div>
            ))}
          </div>
        )}
      </ScrapCard>

      <ScrapCard bg="#FDF0F8" rotate={0.7} tape={<WashiTape color="rgba(230,180,220,0.55)" rotate={1.5} top={-10} right={30} width={70}/>} style={{ padding:"20px 22px 8px", borderRadius:2 }}>
        <div style={{ position:"absolute", top:8, right:16 }}><MagnifySticker size={28}/></div>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#A040A0",marginBottom:16 }}>words that keep coming up</p>
        {topPhrases.length===0 ? <p style={{ fontFamily:"'Kalam',cursive",fontSize:14,color:"#B07080",fontStyle:"italic",paddingBottom:12 }}>no patterns yet — keep journaling!</p> : (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {topPhrases.map((p,i)=>(
              <div key={i}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4 }}>
                  <span style={{ fontFamily:"'Kalam',cursive",fontSize:14,color:"#4A2830",fontStyle:"italic" }}>"{p.phrase}"</span>
                  <span style={{ fontFamily:"'Caveat',cursive",fontSize:15,color:"#C4607A",fontWeight:700 }}>{p.count}×</span>
                </div>
                <div style={{ height:7,background:"#F5D8E8",borderRadius:20,overflow:"hidden" }}>
                  <div style={{ width:`${(p.count/Math.max(...topPhrases.map(x=>x.count)))*100}%`,height:"100%",background:"linear-gradient(90deg,#E890A8,#C4607A)",borderRadius:20 }}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrapCard>
    </div>
  );
}

/* ════════════════════════════════════════
   PERIOD TRACKER — Flo-style
════════════════════════════════════════ */
function PeriodScreen({ periodLog, onBulkSave }) {
  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [selDay,  setSelDay]  = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [flow,     setFlow]     = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [mood,     setMood]     = useState(null);
  const [notes,    setNotes]    = useState("");
  const [saved,    setSaved]    = useState(false);
  const [avgPeriodLen, setAvgPeriodLen] = useState(AVG_PERIOD_LEN);

  const toggle = s => setSymptoms(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  const periodDayKeys = useMemo(()=>
    Object.entries(periodLog).filter(([,v])=>v.isPeriod).map(([k])=>k).sort()
  ,[periodLog]);

  const periodRuns = useMemo(()=>{
    if(!periodDayKeys.length) return [];
    const runs=[]; let cur=[periodDayKeys[0]];
    for(let i=1;i<periodDayKeys.length;i++){
      const d=diffDays(periodDayKeys[i-1],periodDayKeys[i]);
      if(d<=2) cur.push(periodDayKeys[i]);
      else { runs.push(cur); cur=[periodDayKeys[i]]; }
    }
    runs.push(cur); return runs;
  },[periodDayKeys]);

  const lastRun    = periodRuns[periodRuns.length-1]||null;
  const lastStart  = lastRun ? fromKey(lastRun[0]) : null;
  const lastLength = lastRun ? lastRun.length : 0;
  const daysSince  = lastStart ? Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - new Date(lastStart.getFullYear(),lastStart.getMonth(),lastStart.getDate())) / 86400000) : null;
  const isOnPeriod = daysSince !== null && daysSince < avgPeriodLen + 2;
  const cycleDay   = daysSince !== null ? daysSince + 1 : null;

  const avgCycle = useMemo(()=>{
    if(periodRuns.length<2) return 28;
    const gaps=[];
    for(let i=1;i<periodRuns.length;i++) gaps.push(diffDays(periodRuns[i-1][0],periodRuns[i][0]));
    return Math.round(gaps.reduce((s,g)=>s+g,0)/gaps.length);
  },[periodRuns]);

  const nextIn = daysSince !== null ? Math.max(0, avgCycle - daysSince) : null;

  function getDayOfPeriod(dk){
    for(const run of periodRuns){ const i=run.indexOf(dk); if(i!==-1) return i+1; }
    return null;
  }

  const logPeriodStart = (startKey, flow, symptoms, mood, notes) => {
    const bulk = {};
    for(let i=0;i<avgPeriodLen;i++){
      const dk = addDays(startKey, i);
      bulk[dk] = {
        isPeriod: true,
        flow: i===0 ? flow : i<=1 ? "heavy" : i<=3 ? "medium" : "light",
        symptoms: i===0 ? symptoms : [],
        mood: i===0 ? mood : null,
        notes: i===0 ? notes : "",
        predicted: i > 0,
      };
    }
    onBulkSave(bulk);
  };

  const save = () => {
    if(!selDay) return;
    if(flow !== null) {
      logPeriodStart(selDay, flow, symptoms, mood, notes);
    } else {
      onBulkSave({ [selDay]: { isPeriod:false, flow:null, symptoms, mood, notes, predicted:false } });
    }
    setSaved(true);
    setTimeout(()=>{ setSaved(false); setShowLog(false); }, 1500);
  };

  const openLog = (dk) => {
    const log = periodLog[dk];
    setSelDay(dk);
    setFlow(log?.isPeriod ? (log.flow||"medium") : null);
    setSymptoms(log?.symptoms||[]);
    setMood(log?.mood||null);
    setNotes(log?.notes||"");
    setSaved(false);
    setShowLog(true);
  };

  const removePeriod = (startKey) => {
    const run = periodRuns.find(r=>r[0]===startKey);
    if(!run) return;
    const bulk = {};
    run.forEach(dk=>{ bulk[dk]=null; });
    onBulkSave(bulk, true);
  };

  const firstDay   = new Date(year,month,1).getDay();
  const daysInMonth= new Date(year,month+1,0).getDate();
  const cells      = [...Array(firstDay).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  const tk         = todayKey();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <ScrapCard bg="#FFF0F4" rotate={-0.4}
        tape={<WashiTape color="rgba(255,150,170,0.6)" rotate={-1.5} top={-10} left={20} width={130} label="cycle tracker"/>}
        style={{ padding:"26px 22px 8px", borderRadius:3 }}>
        <div style={{ position:"absolute", top:-12, right:20 }}><DropSticker size={38} rotate={8}/></div>
        <h1 style={{ fontFamily:"'Caveat',cursive", fontSize:34, fontWeight:700, color:"#8B2040", lineHeight:1.1, marginBottom:4 }}>my cycle</h1>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:14, color:"#B07080" }}>{MONTHS[month]} {year}</p>
      </ScrapCard>

      {isOnPeriod && daysSince !== null ? (
        <div style={{ background:`${periodDayColor(cycleDay)}30`, border:`2px solid ${periodDayColor(cycleDay)}`, borderRadius:8, padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
          <DropSticker size={36}/>
          <div>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:22, fontWeight:700, color:"#8B2040" }}>
              day {cycleDay} of your period
            </p>
            <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#B05060" }}>
              {daysSince===0?"started today":`started ${daysSince} day${daysSince>1?"s":""} ago`}
              {" · "}expected {avgPeriodLen} days total
              {" · "}flow today: {periodLog[tk]?.flow||"not logged yet"}
            </p>
          </div>
        </div>
      ) : lastStart ? (
        <div style={{ background:"#FFF8F0", border:"1.5px dashed #E8C0C8", borderRadius:8, padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
          <CalendarSticker size={32}/>
          <div>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:18, fontWeight:700, color:"#8B3050" }}>
              period ended {Math.max(0,daysSince-lastLength+1)} days ago
            </p>
            <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#B07080" }}>
              lasted {lastLength} days · next period in ~{nextIn} days · avg cycle {avgCycle} days
            </p>
          </div>
        </div>
      ) : (
        <div style={{ background:"#FFF0F4", border:"2px dashed #F4A8BC", borderRadius:8, padding:"14px 18px", textAlign:"center" }}>
          <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, color:"#C4607A", marginBottom:4 }}>no period logged yet</p>
          <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:13, color:"#B07080" }}>tap "log period start" below to begin tracking — we'll auto-fill the next {AVG_PERIOD_LEN} days for you!</p>
        </div>
      )}

      <div style={{ display:"flex", gap:16, flexWrap:"wrap", paddingLeft:8 }}>
        {[
          {icon:<DropSticker size={36}/>,    label:isOnPeriod?`day ${cycleDay}`:daysSince!==null?`${daysSince}d since`:"-", rotate:-3},
          {icon:<CalendarSticker size={36}/>, label:nextIn!==null?`in ~${nextIn}d`:"—", rotate:2, bg:"#FFF8F0"},
          {icon:<SparkleSticker size={32} color="#F4A020"/>,label:`${avgCycle}d cycle`, rotate:-1.5, bg:"#FFF0F4"},
        ].map((p,i)=>(
          <div key={i} style={{ background:p.bg||"#fff", padding:"10px 10px 28px", boxShadow:"2px 4px 10px rgba(120,80,80,0.18)", transform:`rotate(${p.rotate}deg)`, display:"inline-block", minWidth:90 }}>
            <div style={{ width:"100%", aspectRatio:"1", background:"#F5ECF0", display:"flex", alignItems:"center", justifyContent:"center" }}>{p.icon}</div>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#8A5060", textAlign:"center", marginTop:6 }}>{p.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", paddingLeft:2, alignItems:"center" }}>
        <span style={{ fontFamily:"'Caveat',cursive", fontSize:12, color:"#B07080" }}>colour = day of period:</span>
        {[1,2,3,4,5].map(n=>(
          <div key={n} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:14, height:14, borderRadius:3, background:periodDayColor(n), border:"1px solid rgba(0,0,0,0.1)" }}/>
            <span style={{ fontFamily:"'Caveat',cursive", fontSize:11, color:"#9A7080" }}>d{n}{n===5?"+":" "}</span>
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:14, height:14, borderRadius:3, background:"#FFE8EE", border:"1px dashed #E8C0C8" }}/>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:11, color:"#9A7080" }}>symptoms</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:14, height:14, borderRadius:3, background:`${periodDayColor(3)}60`, border:`1px dashed ${periodDayColor(3)}` }}/>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:11, color:"#9A7080" }}>predicted</span>
        </div>
      </div>

      <ScrapCard bg="#FFFDF8" rotate={0.3} tape={<TapeStrip rotate={-42} top={-8} left={12}/>} style={{ padding:"20px 20px 8px", borderRadius:2 }}>
        <PaperClip rotate={8} top={-8} right={18}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)} style={{ fontFamily:"'Caveat',cursive", fontSize:22, background:"none", border:"none", cursor:"pointer", color:"#C4607A", padding:"4px 8px" }}>←</button>
          <span style={{ fontFamily:"'Caveat',cursive", fontSize:20, fontWeight:700, color:"#8B2040", fontStyle:"italic" }}>{MONTHS[month]} {year}</span>
          <button onClick={()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)} style={{ fontFamily:"'Caveat',cursive", fontSize:22, background:"none", border:"none", cursor:"pointer", color:"#C4607A", padding:"4px 8px" }}>→</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
          {["S","M","T","W","T","F","S"].map((d,i)=>(
            <div key={i} style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#B07080", textAlign:"center", paddingBottom:4 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
          {cells.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const dk  = toKey(new Date(year, month, d));
            const log = periodLog[dk];
            const isPeriod   = log?.isPeriod;
            const isPredicted= log?.predicted;
            const dayN       = isPeriod ? getDayOfPeriod(dk) : null;
            const isSel      = selDay===dk;
            const isToday    = dk===tk;

            let bg, border, textColor="";
            if(isSel)        { bg="#C4607A"; border="2px solid #8B2040"; textColor="#fff"; }
            else if(isPeriod && isPredicted) { bg=`${periodDayColor(dayN||1)}55`; border=`2px dashed ${periodDayColor(dayN||1)}`; textColor="#8B2040"; }
            else if(isPeriod) { bg=periodDayColor(dayN||1); border=`2px solid ${periodDayColor(dayN||1)}`; textColor="#fff"; }
            else if(log)      { bg="#FFE8EE"; border="1px dashed #E8C0C8"; textColor="#4A2030"; }
            else if(isToday)  { bg="#FFF0F4"; border="2px solid #C4607A"; textColor="#4A2030"; }
            else              { bg="rgba(255,255,255,0.5)"; border="1px solid rgba(200,150,160,0.15)"; textColor="#4A2030"; }

            return (
              <div key={i} onClick={()=>openLog(dk)}
                style={{ aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRadius:6, cursor:"pointer", position:"relative", background:bg, border, transition:"all 0.12s", transform:isSel?"scale(1.1)":"none" }}>
                <span style={{ fontFamily:"'Caveat',cursive", fontSize:14, fontWeight:isSel||isPeriod?700:400, color:textColor||"#4A2030", lineHeight:1 }}>{d}</span>
                {isPeriod&&!isSel&&<span style={{ fontFamily:"'Caveat',cursive", fontSize:9, color:isPredicted?periodDayColor(dayN||1):"rgba(255,255,255,0.9)", lineHeight:1 }}>d{dayN}</span>}
                {log&&!isPeriod&&!isSel&&<div style={{ position:"absolute", top:3, right:3, width:5, height:5, borderRadius:"50%", background:"#E890A8" }}/>}
              </div>
            );
          })}
        </div>
        {periodRuns.length > 0 && (
          <div style={{ marginTop:14, borderTop:"1px dashed #F0D8DC", paddingTop:12 }}>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#9A7080", marginBottom:8 }}>logged periods:</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {periodRuns.map((run,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:"#FFE0E8", border:"1.5px solid #E8607A", borderRadius:20, padding:"3px 10px" }}>
                  <span style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:"#8B2040" }}>
                    {fromKey(run[0]).toLocaleDateString("en-US",{month:"short",day:"numeric"})} ({run.length}d)
                  </span>
                  <button onClick={()=>removePeriod(run[0])} style={{ background:"none", border:"none", cursor:"pointer", color:"#C84060", fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrapCard>

      {!showLog && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <button onClick={()=>openLog(tk)}
            style={{ fontFamily:"'Caveat',cursive", fontSize:19, fontWeight:700, padding:"12px 24px", border:"2.5px solid #C4607A", background:"#C4607A", color:"#fff", borderRadius:4, cursor:"pointer", transform:"rotate(-0.4deg)", boxShadow:"2px 4px 10px rgba(196,96,122,0.3)", display:"flex", alignItems:"center", gap:8 }}>
            <DropSticker size={22}/>
            {isOnPeriod ? "log today's symptoms" : "log period start"}
          </button>
          <button onClick={()=>openLog(tk)}
            style={{ fontFamily:"'Caveat',cursive", fontSize:17, padding:"12px 20px", border:"2px dashed #E8C0C8", background:"rgba(255,255,255,0.7)", color:"#C4607A", borderRadius:4, cursor:"pointer" }}>
            log symptoms only
          </button>
        </div>
      )}

      {showLog&&(
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <ScrapCard bg="#FFF0F4" rotate={-0.3}
            tape={<WashiTape color="rgba(255,150,170,0.55)" rotate={-1} top={-10} left={16} width={170} label="logging this day"/>}
            style={{ padding:"20px 20px 12px", borderRadius:3 }}>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:15, color:"#8B2040", marginBottom:12 }}>
              <strong>{selDay ? fromKey(selDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}) : ""}</strong>
            </p>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, color:"#8B2040", marginBottom:10 }}>what are you logging?</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:4 }}>
              {[
                {label:"period started today 🩸", isP:true },
                {label:"symptoms only",           isP:false},
              ].map((opt,i)=>(
                <button key={i} onClick={()=>{ if(opt.isP&&flow===null) setFlow("medium"); if(!opt.isP) setFlow(null); }}
                  style={{ fontFamily:"'Kalam',cursive", fontSize:14, padding:"9px 18px", borderRadius:4, border:`2px solid ${opt.isP===(flow!==null)?"#8B2040":"rgba(200,150,160,0.4)"}`, background:opt.isP===(flow!==null)?"#FFD0DC":"rgba(255,255,255,0.7)", color:opt.isP===(flow!==null)?"#8B2040":"#B07080", cursor:"pointer", fontWeight:opt.isP===(flow!==null)?700:400, transition:"all 0.15s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {flow !== null && (
              <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:12, color:"#C4607A", marginTop:6 }}>
                we'll automatically predict the next {avgPeriodLen} days as your period too (like Flo!)
              </p>
            )}
          </ScrapCard>

          {flow!==null&&(
            <ScrapCard bg="#FFF0F4" rotate={-0.6}
              tape={<WashiTape color="rgba(255,150,170,0.55)" rotate={-1} top={-10} left={16} width={100} label="flow level"/>}
              style={{ padding:"20px 20px 8px", borderRadius:3 }}>
              <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, color:"#8B2040", marginBottom:12 }}>how's the flow today?</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {FLOW_LEVELS.map(f=>(
                  <button key={f.id} onClick={()=>setFlow(f.id)} style={{ fontFamily:"'Kalam',cursive", fontSize:14, padding:"8px 18px", borderRadius:4, border:`2px solid ${flow===f.id?"#8B2040":"rgba(200,150,160,0.35)"}`, background:flow===f.id?f.color:"rgba(255,255,255,0.7)", color:flow===f.id?"#fff":"#B07080", cursor:"pointer", fontWeight:flow===f.id?700:400, transform:flow===f.id?"scale(1.04)":"none", transition:"all 0.15s" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </ScrapCard>
          )}

          <ScrapCard bg="#FDF0F8" rotate={0.5}
            tape={<WashiTape color="rgba(230,180,220,0.55)" rotate={1.5} top={-10} right={30} width={110} label="symptoms"/>}
            style={{ padding:"20px 20px 8px", borderRadius:3 }}>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, color:"#A040A0", marginBottom:12 }}>how's your body?</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SYMPTOMS.map(s=>(
                <button key={s} onClick={()=>toggle(s)} style={{ fontFamily:"'Kalam',cursive", fontSize:13, padding:"6px 14px", borderRadius:20, border:`2px solid ${symptoms.includes(s)?"#A040A0":"rgba(180,140,180,0.3)"}`, background:symptoms.includes(s)?"#E8D0F0":"rgba(255,255,255,0.7)", color:symptoms.includes(s)?"#7028A0":"#9A7080", cursor:"pointer", fontWeight:symptoms.includes(s)?700:400, transition:"all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </ScrapCard>

          <ScrapCard bg="#FFFBEC" rotate={-0.4}
            tape={<WashiTape color="rgba(255,220,120,0.55)" rotate={-1} top={-10} left={20} width={90} label="mood check"/>}
            style={{ padding:"20px 20px 8px", borderRadius:3 }}>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, color:"#8B6000", marginBottom:12 }}>how are you feeling overall?</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {MOOD_TYPES.map(m=>(
                <button key={m} onClick={()=>setMood(m)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 12px", borderRadius:4, border:`2px solid ${mood===m?"#C4900A":"rgba(200,170,100,0.25)"}`, background:mood===m?"#FFF0C0":"rgba(255,255,255,0.7)", cursor:"pointer", transform:mood===m?"scale(1.06)":"none", transition:"all 0.15s" }}>
                  <MoodFace type={m} size={42} selected={mood===m}/>
                  <span style={{ fontFamily:"'Caveat',cursive", fontSize:12, color:"#8B6000", fontWeight:mood===m?700:400 }}>{m}</span>
                </button>
              ))}
            </div>
          </ScrapCard>

          <ScrapCard bg="#FFFEF8" rotate={0.3} tape={<TapeStrip rotate={-42} top={-8} left={10}/>} style={{ padding:"20px 20px 8px", borderRadius:2 }}>
            <div style={{ position:"absolute", top:8, right:14 }}><PencilSticker size={22} rotate={-8}/></div>
            <p style={{ fontFamily:"'Caveat',cursive", fontSize:17, fontWeight:700, color:"#4A2830", marginBottom:10 }}>notes</p>
            <LinedPaper value={notes} onChange={e=>setNotes(e.target.value)} placeholder="anything else to remember about today…" rows={3}/>
          </ScrapCard>

          <div style={{ display:"flex", gap:12, paddingLeft:4 }}>
            {saved ? (
              <div style={{ fontFamily:"'Caveat',cursive", fontSize:20, fontWeight:700, color:"#2E6B2E", background:"#D4F0D4", border:"2px solid #8FCC8F", padding:"10px 24px", borderRadius:4, display:"flex", alignItems:"center", gap:8 }}>
                <SparkleSticker size={20} color="#4A9A4A"/>
                {flow!==null?`saved! ${avgPeriodLen} days predicted`:"saved!"}
              </div>
            ):(
              <>
                <button onClick={save} style={{ fontFamily:"'Caveat',cursive", fontSize:19, fontWeight:700, padding:"11px 26px", border:"2.5px solid #C4607A", background:"#C4607A", color:"#fff", borderRadius:4, cursor:"pointer", boxShadow:"2px 3px 8px rgba(196,96,122,0.25)", display:"flex", alignItems:"center", gap:8 }}>
                  <DropSticker size={20}/>
                  {flow!==null?`save + predict ${avgPeriodLen} days`:"save symptoms"}
                </button>
                <button onClick={()=>setShowLog(false)} style={{ fontFamily:"'Caveat',cursive", fontSize:17, padding:"11px 20px", border:"2px dashed #E8C0C8", background:"transparent", color:"#C4607A", borderRadius:4, cursor:"pointer" }}>cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {!showLog&&(
        <ScrapCard bg="#FFF4F8" rotate={0.6}
          tape={<WashiTape color="rgba(255,182,193,0.55)" rotate={1} top={-10} right={20} width={90} label="cycle insights"/>}
          style={{ padding:"20px 20px 8px", borderRadius:3 }}>
          <div style={{ position:"absolute", top:8, right:18 }}><BulbSticker size={26}/></div>
          <p style={{ fontFamily:"'Caveat',cursive", fontSize:18, fontWeight:700, color:"#8B2040", marginBottom:14 }}>cycle insights</p>
          {periodRuns.length===0 ? (
            <p style={{ fontFamily:"'Kalam',cursive", fontSize:14, color:"#B07080", fontStyle:"italic", paddingBottom:8 }}>start logging to see insights!</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                {label:"avg cycle length",    val:`${avgCycle} days`},
                {label:"last period length",  val:`${lastLength} days`},
                {label:"periods tracked",     val:`${periodRuns.length}`},
                {label:"predicted period len",val:<div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"'Kalam',cursive", fontSize:15, fontWeight:700 }}>{avgPeriodLen} days</span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>setAvgPeriodLen(n=>Math.max(2,n-1))} style={{ fontFamily:"'Caveat',cursive", fontSize:16, background:"#F5D8DC", border:"1px solid #E8C0C8", borderRadius:4, width:24, height:24, cursor:"pointer", color:"#C4607A" }}>-</button>
                    <button onClick={()=>setAvgPeriodLen(n=>Math.min(9,n+1))} style={{ fontFamily:"'Caveat',cursive", fontSize:16, background:"#F5D8DC", border:"1px solid #E8C0C8", borderRadius:4, width:24, height:24, cursor:"pointer", color:"#C4607A" }}>+</button>
                  </div>
                </div>},
                {label:"most logged symptom",val:(()=>{
                  const c={}; Object.values(periodLog).forEach(l=>(l.symptoms||[]).forEach(s=>{c[s]=(c[s]||0)+1;}));
                  const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; return t?`${t[0]} (${t[1]}×)`:"none yet";
                })()},
              ].map((s,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:8, borderBottom:i<4?"1.5px dashed #F0C8D0":"none" }}>
                  <span style={{ fontFamily:"'Caveat',cursive", fontSize:14, color:"#9A7080", minWidth:150 }}>{s.label}</span>
                  {typeof s.val === "string"
                    ? <span style={{ fontFamily:"'Kalam',cursive", fontSize:15, color:"#3A1820", fontWeight:700 }}>{s.val}</span>
                    : s.val}
                </div>
              ))}
            </div>
          )}
        </ScrapCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   REPORT — dynamic with working download
════════════════════════════════════════ */
function ReportScreen({ entries, periodLog }) {
  const now = new Date();
  const total   = entries.length;
  const green   = entries.filter(e=>e.level==="green").length;
  const yellow  = entries.filter(e=>e.level==="yellow").length;
  const red     = entries.filter(e=>e.level==="red").length;
  const gPct    = total ? Math.round(green/total*100)  : 0;
  const yPct    = total ? Math.round(yellow/total*100) : 0;
  const rPct    = total ? Math.round(red/total*100)    : 0;

  const weekMood = useMemo(()=>{
    const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const res=days.map(d=>({day:d,level:null,count:0}));
    entries.forEach(e=>{
      const d=new Date(e.date);
      if(Math.floor((now-d)/86400000)<7){ res[d.getDay()].level=e.level; res[d.getDay()].count++; }
    });
    return res;
  },[entries]);

  const lc={green:"#7BBF7B",yellow:"#E8B830",red:"#C84040",null:"#F0D8DC"};
  const lh={green:40,yellow:65,red:85};

  const topPhrases=useMemo(()=>{
    const ps=["not good enough","don't deserve","always mess up","nobody understands","can't do this","i'm stupid","overwhelmed","i failed","worthless","everyone except me"];
    return ps.map(p=>({phrase:p,count:entries.filter(e=>e.text.toLowerCase().includes(p)).length})).filter(p=>p.count>0).sort((a,b)=>b.count-a.count).slice(0,4);
  },[entries]);

  const periodDayCount = Object.values(periodLog).filter(v=>v&&v.isPeriod).length;
  const loggedDayCount = Object.values(periodLog).filter(v=>v).length;
  const topSymptom = useMemo(()=>{
    const c={}; Object.values(periodLog).filter(v=>v).forEach(l=>(l.symptoms||[]).forEach(s=>{c[s]=(c[s]||0)+1;}));
    const t=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]; return t?t[0]:null;
  },[periodLog]);

  const streak=useMemo(()=>{
    let s=0; const d=new Date(now);
    while(s<=365){
      const dk=toKey(d);
      const hasE=entries.some(e=>new Date(e.date).toDateString()===d.toDateString());
      if(hasE||periodLog[dk]){s++;d.setDate(d.getDate()-1);}else break;
    }
    return s;
  },[entries,periodLog]);

  const zone=red>0?"🔴 needs support":yellow>green?"🟡 check-in zone":"🟢 thriving";

  const summary=total===0
    ?"no entries yet — start journaling and your summary will appear here."
    :`this week: ${total} entr${total===1?"y":"ies"} logged. ${gPct}% healthy venting${yPct>0?`, ${yPct}% self-criticism`:""}${rPct>0?`, ${rPct}% flagged for support`:""}. ${topPhrases[0]?`top pattern: "${topPhrases[0].phrase}" (${topPhrases[0].count}×). `:""}${streak>1?`${streak}-day streak 🔥`:""} `;

  const handleDownloadReport = () => {
    generateReportPDF(entries, periodLog, summary);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <ScrapCard bg="#F0F8FF" rotate={-0.3}
        tape={<WashiTape color="rgba(160,200,255,0.55)" rotate={-1} top={-10} left={25} width={110} label="weekly report"/>}
        style={{ padding:"24px 22px 8px", borderRadius:3 }}>
        <PaperClip rotate={10} top={-8} right={24}/>
        <h1 style={{ fontFamily:"'Caveat',cursive", fontSize:34, fontWeight:700, color:"#284870" }}>my report</h1>
        <p style={{ fontFamily:"'Patrick Hand',cursive", fontSize:14, color:"#6080A0" }}>
          {new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
        </p>
      </ScrapCard>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          {label:"entries", val:total,     sub:"this week",     bg:"#FFF0F4",r:-1},
          {label:"streak",  val:`${streak}d`,sub:"days in a row",bg:"#FDF5D4",r:0.5},
          {label:"overall", val:zone,      sub:"mood zone",     bg:"#F0FFF4",r:-0.5},
        ].map((s,i)=>(
          <div key={i} style={{ background:s.bg,borderRadius:4,padding:"14px 12px",boxShadow:"2px 3px 8px rgba(120,80,80,0.1)",transform:`rotate(${s.r}deg)`,border:"1.5px solid rgba(200,150,160,0.2)" }}>
            <p style={{ fontFamily:"'Caveat',cursive",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#9A7080",marginBottom:6 }}>{s.label}</p>
            <p style={{ fontFamily:"'Caveat',cursive",fontSize:22,fontWeight:700,color:"#2A1018",lineHeight:1,marginBottom:4 }}>{s.val}</p>
            <p style={{ fontFamily:"'Patrick Hand',cursive",fontSize:12,color:"#B07080" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <ScrapCard bg="#FFFDF8" rotate={0.3} tape={<TapeStrip rotate={-42} top={-8} left={12}/>} style={{ padding:"20px 22px 8px", borderRadius:2 }}>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#C4607A",marginBottom:8 }}>mood this week</p>
        {total===0 ? <p style={{ fontFamily:"'Kalam',cursive",fontSize:13,color:"#B07080",fontStyle:"italic",paddingBottom:12 }}>no entries yet!</p> : (
          <>
            <div style={{ display:"flex",gap:10,alignItems:"flex-end",marginBottom:14 }}>
              {weekMood.map((d,i)=>(
                <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                  <div style={{ width:"100%",height:80,background:"#F5E8EC",borderRadius:4,display:"flex",alignItems:"flex-end",overflow:"hidden" }}>
                    <div style={{ width:"100%",height:`${lh[d.level]||8}%`,background:lc[d.level]||"#F0D8DC",borderRadius:4 }}/>
                  </div>
                  <span style={{ fontFamily:"'Caveat',cursive",fontSize:11,color:d.count>0?"#7A5060":"#C0A0A8" }}>{d.day}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:7,borderTop:"1px dashed #F0D8DC",paddingTop:12 }}>
              {[{label:"healthy venting",pct:gPct,c:"#7BBF7B"},{label:"self-criticism",pct:yPct,c:"#E8B830"},{label:"reach out",pct:rPct,c:"#C84040"}].map((b,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontFamily:"'Caveat',cursive",fontSize:13,color:"#9A7080",minWidth:110 }}>{b.label}</span>
                  <div style={{ flex:1,height:10,background:"#F5E0E4",borderRadius:20,overflow:"hidden" }}>
                    <div style={{ width:`${b.pct}%`,height:"100%",background:b.c,borderRadius:20 }}/>
                  </div>
                  <span style={{ fontFamily:"'Caveat',cursive",fontSize:14,fontWeight:700,color:b.c,minWidth:36 }}>{b.pct}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </ScrapCard>

      <ScrapCard bg="#FDF0F8" rotate={-0.5} tape={<WashiTape color="rgba(230,180,220,0.55)" rotate={1.5} top={-10} right={30} width={80}/>} style={{ padding:"20px 22px 8px", borderRadius:2 }}>
        <div style={{ position:"absolute",top:8,right:16 }}><MagnifySticker size={26}/></div>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#A040A0",marginBottom:14 }}>phrases you repeated</p>
        {topPhrases.length===0 ? <p style={{ fontFamily:"'Kalam',cursive",fontSize:13,color:"#B07080",fontStyle:"italic",paddingBottom:8 }}>no repeating patterns yet!</p> : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {topPhrases.map((p,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontFamily:"'Kalam',cursive",fontSize:14,color:"#4A2830",fontStyle:"italic",flex:1 }}>"{p.phrase}"</span>
                <div style={{ width:70,height:7,background:"#F5D8E8",borderRadius:20,overflow:"hidden" }}>
                  <div style={{ width:`${(p.count/Math.max(...topPhrases.map(x=>x.count)))*100}%`,height:"100%",background:"linear-gradient(90deg,#E890A8,#C4607A)",borderRadius:20 }}/>
                </div>
                <span style={{ fontFamily:"'Caveat',cursive",fontSize:14,fontWeight:700,color:"#C4607A",minWidth:28 }}>{p.count}×</span>
              </div>
            ))}
          </div>
        )}
      </ScrapCard>

      <ScrapCard bg="#FFF4F8" rotate={0.5} tape={<WashiTape color="rgba(255,182,193,0.55)" rotate={-1} top={-10} left={20} width={120} label="cycle this week"/>} style={{ padding:"20px 22px 8px", borderRadius:3 }}>
        <div style={{ position:"absolute",top:8,right:16 }}><DropSticker size={26}/></div>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#8B2040",marginBottom:12 }}>period & cycle</p>
        {loggedDayCount===0 ? <p style={{ fontFamily:"'Kalam',cursive",fontSize:13,color:"#B07080",fontStyle:"italic",paddingBottom:8 }}>no cycle data yet!</p> : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {[
              {label:"period days logged",  val:`${periodDayCount} day${periodDayCount!==1?"s":""}`},
              {label:"symptom days logged", val:`${loggedDayCount} day${loggedDayCount!==1?"s":""}`},
              {label:"top symptom",         val:topSymptom||"none yet"},
            ].map((s,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline",paddingBottom:6,borderBottom:i<2?"1px dashed #F0C8D0":"none" }}>
                <span style={{ fontFamily:"'Caveat',cursive",fontSize:14,color:"#9A7080" }}>{s.label}</span>
                <span style={{ fontFamily:"'Kalam',cursive",fontSize:15,fontWeight:700,color:"#3A1820" }}>{s.val}</span>
              </div>
            ))}
          </div>
        )}
      </ScrapCard>

      <ScrapCard bg="#F8F0FF" rotate={-0.4} tape={<WashiTape color="rgba(190,160,240,0.55)" rotate={1} top={-10} left={20} width={130} label="session notes"/>} style={{ padding:"20px 22px 8px", borderRadius:3 }}>
        <div style={{ position:"absolute",top:8,right:16 }}><ClipboardSticker size={28}/></div>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#4A2080",marginBottom:10 }}>therapist-ready summary</p>
        <div style={{ background:"rgba(255,255,255,0.6)",borderRadius:4,padding:"12px 14px",marginBottom:14,border:"1px solid rgba(180,140,220,0.3)" }}>
          <p style={{ fontFamily:"'Kalam',cursive",fontSize:13,color:"#3A1820",lineHeight:1.8 }}>{summary}</p>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={total===0}
          style={{ fontFamily:"'Caveat',cursive",fontSize:17,fontWeight:700,padding:"8px 22px",border:"2px solid #C4607A",background:total>0?"#C4607A":"#F0D0D8",color:"#fff",borderRadius:3,cursor:total>0?"pointer":"not-allowed",transform:"rotate(-0.5deg)" }}>
          📥 download my report PDF
        </button>
      </ScrapCard>
    </div>
  );
}

/* ════════════════════════════════════════
   SETTINGS
════════════════════════════════════════ */
function SettingsScreen() {
  const [notifs,setNotifs]=useState(true);
  const [voice,setVoice]=useState(false);
  const Toggle=({on,toggle})=>(
    <div onClick={toggle} style={{ width:46,height:26,borderRadius:13,cursor:"pointer",background:on?"#C4607A":"#E8D0D4",border:`2px solid ${on?"#A04060":"#D0B0B8"}`,position:"relative",flexShrink:0,transition:"background 0.2s" }}>
      <div style={{ position:"absolute",top:2,left:on?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"1px 1px 3px rgba(0,0,0,0.15)",transition:"left 0.2s" }}/>
    </div>
  );
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
      <ScrapCard bg="#FFF4F8" rotate={0.3} tape={<WashiTape color="rgba(255,182,193,0.55)" rotate={-1.5} top={-10} left={20} width={90} label="settings"/>} style={{ padding:"24px 22px 8px",borderRadius:3 }}>
        <div style={{ position:"absolute",top:8,right:18 }}><SettingsSticker size={28}/></div>
        <h1 style={{ fontFamily:"'Caveat',cursive",fontSize:34,fontWeight:700,color:"#8B3050" }}>my space</h1>
      </ScrapCard>
      <ScrapCard bg="#FFFDF8" rotate={-0.4} tape={<TapeStrip rotate={-42} top={-8} left={10}/>} style={{ padding:"20px 22px 8px",borderRadius:2 }}>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:16,fontWeight:700,color:"#C4607A",marginBottom:14 }}>PROFILE</p>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:4 }}>
          <div style={{ width:52,height:52,borderRadius:"50%",background:"#FDEEF2",border:"3px solid #F5D0D8",display:"flex",alignItems:"center",justifyContent:"center" }}><FlowerSticker size={30}/></div>
          <div>
            <p style={{ fontFamily:"'Caveat',cursive",fontSize:18,fontWeight:700,color:"#2A1018",marginBottom:2 }}>she / her</p>
            <p style={{ fontFamily:"'Patrick Hand',cursive",fontSize:13,color:"#9A7080" }}>member since march 2025</p>
          </div>
        </div>
      </ScrapCard>
      <ScrapCard bg="#F8F4FF" rotate={0.5} tape={<WashiTape color="rgba(200,180,240,0.5)" rotate={1} top={-10} right={30} width={80}/>} style={{ padding:"20px 22px 8px",borderRadius:2 }}>
        <p style={{ fontFamily:"'Caveat',cursive",fontSize:16,fontWeight:700,color:"#8040A0",marginBottom:16 }}>PREFERENCES</p>
        {[
          {label:"daily check-in reminder",sub:"gentle nudge at 8pm",on:notifs,toggle:()=>setNotifs(n=>!n)},
          {label:"voice mode default",sub:"open in speak mode",on:voice,toggle:()=>setVoice(n=>!n)},
        ].map((s,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:12,paddingBottom:i===0?14:0,marginBottom:i===0?14:0,borderBottom:i===0?"1.5px dashed #E0C8D8":"none" }}>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"'Kalam',cursive",fontSize:15,color:"#2A1018",marginBottom:2 }}>{s.label}</p>
              <p style={{ fontFamily:"'Patrick Hand',cursive",fontSize:13,color:"#9A7080" }}>{s.sub}</p>
            </div>
            <Toggle on={s.on} toggle={s.toggle}/>
          </div>
        ))}
      </ScrapCard>
    </div>
  );
}

/* ════════════════════════════════════════
   TAB NAV
════════════════════════════════════════ */
function TabNav({screen,setScreen}) {
  const tabs=[
    {id:"today",    icon:<FlowerSticker size={18}/>,   label:"today"},
    {id:"patterns", icon:<ChartSticker size={18}/>,    label:"patterns"},
    {id:"period",   icon:<DropSticker size={18}/>,     label:"cycle"},
    {id:"report",   icon:<ClipboardSticker size={18}/>,label:"report"},
    {id:"settings", icon:<SettingsSticker size={18}/>, label:"me"},
  ];
  return (
    <div style={{ display:"flex",gap:0,borderBottom:"3px solid #E8C0C8",background:"rgba(255,248,250,0.92)",backdropFilter:"blur(8px)",padding:"14px 20px 0",flexWrap:"wrap" }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setScreen(t.id)} style={{ fontFamily:"'Caveat',cursive",fontSize:17,fontWeight:700,padding:"8px 18px 10px",background:screen===t.id?"#FFF0F4":"transparent",border:screen===t.id?"2px solid #E8C0C8":"2px solid transparent",borderBottom:screen===t.id?"3px solid #FFF0F4":"2px solid transparent",marginBottom:screen===t.id?-3:0,color:screen===t.id?"#C4607A":"#B08090",cursor:"pointer",transition:"all 0.15s",borderRadius:"4px 4px 0 0",zIndex:screen===t.id?2:1,display:"flex",alignItems:"center",gap:7 }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   ROOT
════════════════════════════════════════ */
export default function MainApp({ onLogout }) {
  const [screen,    setScreen]    = useState("today");
  const [entries,   setEntries]   = useState([]);
  const [periodLog, setPeriodLog] = useState({});
  const cycleContext = useMemo(() => deriveCycleContext(periodLog), [periodLog]);

  const addEntry   = e   => setEntries(prev=>[e,...prev]);

  const bulkSave = (updates, deleteMissing=false) => {
    setPeriodLog(prev => {
      const next = { ...prev };
      Object.entries(updates).forEach(([k,v]) => {
        if (v === null) delete next[k];
        else next[k] = v;
      });
      return next;
    });
  };

  const streak = useMemo(()=>{
    let s=0; const d=new Date();
    while(s<=365){
      const dk=toKey(d);
      const hasE=entries.some(e=>new Date(e.date).toDateString()===d.toDateString());
      if(hasE||periodLog[dk]){s++;d.setDate(d.getDate()-1);}else break;
    }
    return s;
  },[entries,periodLog]);

  return (
    <>
      <style>{FONTS}{GLOBAL_STYLES}</style>
      <div style={{ position:"relative",zIndex:1,minHeight:"100vh" }}>
        <div style={{ background:"rgba(255,240,245,0.9)",backdropFilter:"blur(12px)",borderBottom:"2px solid #F0C8D0",padding:"14px 28px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:20 }}>
          <div style={{ position:"relative",display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ position:"absolute",top:-8,left:-6,zIndex:0 }}><WashiTape color="rgba(255,182,193,0.7)" rotate={-2} top={0} left={0} width={130}/></div>
            <span style={{ fontFamily:"'Caveat',cursive",fontSize:30,fontWeight:700,color:"#8B3050",position:"relative",zIndex:2 }}>vent</span>
            <span style={{ fontFamily:"'Caveat',cursive",fontSize:30,fontWeight:700,color:"#C4607A",position:"relative",zIndex:2 }}>space</span>
            <div style={{ position:"relative",zIndex:2 }}><FlowerSticker size={24} rotate={12}/></div>
          </div>
          <span style={{ fontFamily:"'Patrick Hand',cursive",fontSize:13,color:"#C4A0A8",marginLeft:4 }}>your private scrapbook</span>
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ fontFamily:"'Caveat',cursive",fontSize:15,color:"#C4607A",background:"#FDEEF2",padding:"4px 14px",borderRadius:3,border:"1.5px solid #F5D0D8",transform:"rotate(-1deg)",display:"flex",alignItems:"center",gap:6 }}>
              <SparkleSticker size={14} color="#E8A020"/>
              {streak>0?`${streak} day streak`:"start your streak!"}
            </div>
            <button onClick={onLogout} style={{ fontFamily:"'Caveat',cursive",fontSize:14,color:"#9A7080",background:"rgba(255,255,255,0.7)",border:"1.5px dashed #E8C0C8",padding:"4px 12px",borderRadius:3,cursor:"pointer" }}>
              log out
            </button>
          </div>
        </div>
        <TabNav screen={screen} setScreen={setScreen}/>
        <div style={{ maxWidth:700,margin:"0 auto",padding:"32px 24px 80px" }}>
          {screen==="today"    && <TodayScreen    onAddEntry={addEntry} cycleContext={cycleContext}/>}
          {screen==="patterns" && <PatternsScreen entries={entries}/>}
          {screen==="period"   && <PeriodScreen   periodLog={periodLog} onBulkSave={bulkSave}/>}
          {screen==="report"   && <ReportScreen   entries={entries} periodLog={periodLog}/>}
          {screen==="settings" && <SettingsScreen/>}
        </div>
      </div>
    </>
  );
}
