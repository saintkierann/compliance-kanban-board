import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Download,
  Upload,
} from "lucide-react";

/* ================================================================== */
/*  Config                                                             */
/* ================================================================== */

const STORAGE_KEY = "conform-kanban-v4";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "This Week" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
];

/* Workstreams (the coloured lanes / filters) — business & project focused */
const EPICS = {
  launch: { label: "Launch", color: "#B23A6B" },
  pitch: { label: "Pitch", color: "#6D5BD0" },
  leadgen: { label: "Lead Gen", color: "#B0731A" },
  crm: { label: "CRM", color: "#2F6FB0" },
  product: { label: "Product", color: "#2A8C82" },
  website: { label: "Website", color: "#2C6E49" },
  business: { label: "Business", color: "#5B6470" },
};

const PRIORITY = { High: "#9B2C2C", Med: "#B0731A", Low: "#8A867D" };

let _n = 0;
const uid = () => Date.now().toString(36) + (_n++).toString(36);
const card = (ref, title, desc, epic, priority, col) => ({ id: uid(), ref, title, desc, epic, priority, col });

const DEFAULT_CARDS = [
  // LAUNCH (Track 1 — start now)
  card("LAU-1", "Set up sending inbox", "Create a real, personal-looking inbox (firstname@conform...) to send the interview invites from.", "launch", "High", "todo"),
  card("LAU-2", "Set up calendar booking link", "Cal.com/Calendly 30-min interview slot. Share it only after a prospect says yes, never in Email 1.", "launch", "High", "todo"),
  card("LAU-3", "Pull first contact batch", "Export 30-50 top-scored HRB contacts (names + emails) from the lead-gen tool; hand-check the top 10.", "launch", "High", "todo"),
  card("LAU-4", "Send & run email sequence", "Send Email 1 and run the 4-touch interview-invite sequence ('The Building Safety Brief').", "launch", "High", "todo"),
  card("LAU-5", "Run Call 1 interviews", "Book and run the recorded interviews; use the anchor question (~75% in) to transition to the free audit.", "launch", "High", "todo"),

  // PITCH & SALES KIT
  card("PIT-1", "Cold email sequence", "Done - 4-touch interview-invite sequence drafted (The Building Safety Brief).", "pitch", "Med", "done"),
  card("PIT-2", "Call scripts", "Done - Call 1 interview + Call 2 audit/demo scripts drafted.", "pitch", "Med", "done"),
  card("PIT-3", "Free audit definition + questions", "Done - Golden Thread Readiness audit scope + assessment questions drafted.", "pitch", "High", "done"),
  card("PIT-4", "Objection-handling scripts", "Done - responses for the 8 common Call 2 objections.", "pitch", "Med", "done"),
  card("PIT-5", "Pitch deck - full copy", "Done - build-ready copy for all 10 slides.", "pitch", "Med", "done"),
  card("PIT-6", "Build the designed pitch deck", "Turn the slide copy into a designed deck in the Conform house style.", "pitch", "Med", "backlog"),
  card("PIT-7", "Designed 1-page scorecard PDF", "Turn the scorecard template into a designed PDF leave-behind.", "pitch", "Med", "backlog"),
  card("PIT-8", "Decide scorecard scoring model", "Choose R/A/G only vs a 0-100 composite score.", "pitch", "Low", "backlog"),

  // LEAD GENERATION
  card("LG-1", "Lead-gen tool", "Done - Companies House + Google + scoring; outputs named contacts with emails.", "leadgen", "Med", "done"),
  card("LG-2", "Tune scoring for HRB developers", "Adjust the scoring to surface HRB developers / dutyholders first.", "leadgen", "High", "todo"),
  card("LG-3", "Lead-gen -> CRM integration", "Build the pipe from the lead-gen tool into the CRM (self-build, timing TBD).", "leadgen", "Low", "backlog"),

  // CRM
  card("CRM-1", "Stand up a simple pipeline tracker", "Interim one-sheet tracker: sent -> replied -> Call 1 -> Call 2 -> proposal -> won/lost. Don't let 'build a CRM' block outreach.", "crm", "High", "todo"),
  card("CRM-2", "Decide CRM approach", "Build your own vs an off-the-shelf tool.", "crm", "Med", "backlog"),
  card("CRM-3", "Build the CRM", "Build the chosen CRM.", "crm", "Low", "backlog"),

  // PRODUCT
  card("PRD-1", "Compliance demo ready", "Done - the existing Conform Compliance product is demo-ready (used in Call 2).", "product", "High", "done"),
  card("PRD-2", "Define extra demo features", "Specify the additional features to add to the Compliance demo.", "product", "Med", "backlog"),
  card("PRD-3", "Build extra Compliance features", "Build the additional features feeding into the Compliance demo.", "product", "Med", "doing"),
  card("PRD-4", "Architect shared evidence-record schema", "Design the shared data model underpinning Products A/B/C.", "product", "Low", "backlog"),
  card("PRD-5", "Product A - Site Diary demo MVP", "Deferred until post-launch / a paying client needs it.", "product", "Low", "backlog"),

  // WEBSITE
  card("WEB-1", "Audit landing page", "Add a 'Golden Thread Readiness audit' landing page the cold emails can point to.", "website", "Med", "backlog"),
  card("WEB-2", "Website credibility pass", "Light pass; show the suite as flagship Compliance + complementary modules (in development).", "website", "Med", "backlog"),
  card("WEB-3", "Product pages for A / C", "Full product pages for Product A and Product C. Post-launch.", "website", "Low", "backlog"),

  // BUSINESS FOUNDATIONS (Track 3 — before first signed build)
  card("BIZ-1", "UK incorporation", "Set up the company. Week-1 task.", "business", "High", "todo"),
  card("BIZ-2", "Bank account + invoicing", "Business bank account and the ability to invoice / take payment.", "business", "High", "todo"),
  card("BIZ-3", "Professional indemnity insurance", "PI cover for compliance advice. Highest lead-time item and non-negotiable - start the quotes now.", "business", "High", "todo"),
  card("BIZ-4", "Set committed pricing", "Decide prices you'll quote out loud: discovery / build / retainer.", "business", "Med", "backlog"),
  card("BIZ-5", "One-page SOW / proposal template", "Scope, deliverables, price, timeline + the advisory-aid disclaimer.", "business", "Med", "backlog"),
];

/* ---- import/export helpers ---- */
const epicKeys = Object.keys(EPICS);
const PRIO_MAP = { p0: "High", p1: "Med", p2: "Low", high: "High", med: "Med", medium: "Med", low: "Low" };
const COL_MAP = {
  backlog: "backlog", parked: "backlog",
  todo: "todo", "to do": "todo", "this week": "todo", thisweek: "todo",
  doing: "doing", "in progress": "doing", inprogress: "doing",
  done: "done",
};
const normPrio = (p) => PRIO_MAP[String(p || "").trim().toLowerCase()] || "Med";
const normCol = (c) => COL_MAP[String(c || "").trim().toLowerCase()] || "backlog";
const normEpic = (e) => {
  const s = String(e || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (EPICS[s]) return s;
  const found = epicKeys.find((k) => s === k || s.startsWith(k));
  return found || "business";
};
const normCard = (raw) => ({
  id: uid(),
  ref: raw.ref || "IMP",
  title: String(raw.title || "").trim(),
  desc: String(raw.desc != null ? raw.desc : raw.description || "").trim(),
  epic: normEpic(raw.epic != null ? raw.epic : raw.lane),
  priority: normPrio(raw.priority),
  col: normCol(raw.col != null ? raw.col : raw.column),
});

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--paper:#F3F1EC;--surface:#FFFFFF;--ink:#1A1813;--muted:#6F6B62;--line:#E4DFD6;}
*{box-sizing:border-box;}
.kb{font-family:'Hanken Grotesk',-apple-system,sans-serif;background:var(--paper);color:var(--ink);min-height:100vh;width:100%;display:flex;flex-direction:column;align-items:center;padding:0 16px 40px;-webkit-font-smoothing:antialiased;}
.kb-mono{font-family:'JetBrains Mono',monospace;}
.kb-shell{width:100%;max-width:640px;}
.kb-top{display:flex;align-items:center;justify-content:space-between;padding:22px 2px 4px;}
.kb-brand{display:flex;align-items:center;gap:9px;font-weight:700;letter-spacing:.14em;font-size:14px;}
.kb-dot{width:9px;height:9px;background:var(--ink);border-radius:2px;}
.kb-sub{font-size:12.5px;color:var(--muted);margin:0 0 4px 2px;line-height:1.45;}

.kb-filters{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 6px;}
.kb-fchip{font-size:12px;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:6px 11px;cursor:pointer;font-family:inherit;color:var(--ink);display:flex;align-items:center;gap:6px;transition:border-color .15s ease;}
.kb-fchip:hover{border-color:var(--ink);}
.kb-fchip.active{background:var(--ink);color:#fff;border-color:var(--ink);}
.kb-edot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;}

/* column tabs — shown only on narrow widths */
.kb-tabs{display:flex;gap:8px;margin:10px 0 2px;overflow-x:auto;padding-bottom:4px;}
.kb-tab{flex:0 0 auto;font-size:13px;font-weight:600;border:1px solid var(--line);background:var(--surface);border-radius:11px;padding:9px 13px;cursor:pointer;font-family:inherit;color:var(--ink);display:flex;align-items:center;gap:7px;transition:border-color .15s ease;}
.kb-tab.active{background:var(--ink);color:#fff;border-color:var(--ink);}
.kb-tab .kb-count{background:rgba(255,255,255,.18);border-color:transparent;color:inherit;}
.kb-tab:not(.active) .kb-count{background:var(--paper);color:var(--muted);}

.kb-board{display:flex;flex-direction:column;}
.kb-col{margin-top:14px;border-radius:14px;transition:background .15s ease,border-color .15s ease;border:1px solid transparent;}
.kb-col.is-hidden{display:none;}
.kb-col.drop{border-color:var(--ink);background:rgba(26,24,19,.04);}
.kb-col-h{display:flex;align-items:center;justify-content:space-between;padding:0 4px 10px;border-bottom:1px solid var(--line);}
.kb-col-name{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:8px;}
.kb-count{font-size:11px;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:1px 8px;}
.kb-addbtn{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;gap:4px;font-family:inherit;font-size:13px;padding:6px;}
.kb-addbtn:hover{color:var(--ink);}
.kb-cards{display:flex;flex-direction:column;gap:10px;padding-top:12px;min-height:40px;}
.kb-empty{font-size:12.5px;color:var(--muted);padding:8px 4px;font-style:italic;}

.kb-card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:13px 14px;position:relative;overflow:hidden;}
.kb-card[draggable=true]{cursor:grab;}
.kb-card.dragging{opacity:.45;}
.kb-card-bar{position:absolute;left:0;top:0;bottom:0;width:3px;}
.kb-card-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.kb-grip{color:#C7C1B5;display:flex;align-items:center;}
.kb-ref{font-size:11px;letter-spacing:.06em;color:var(--muted);}
.kb-prio{font-size:10px;font-weight:700;letter-spacing:.05em;padding:2px 7px;border-radius:5px;color:#fff;text-transform:uppercase;}
.kb-eptag{font-size:11px;color:var(--muted);margin-left:auto;display:flex;align-items:center;gap:5px;}
.kb-title{font-size:15.5px;font-weight:600;line-height:1.35;margin:0;cursor:pointer;}
.kb-desc{font-size:13.5px;color:var(--muted);line-height:1.55;margin:9px 0 0;}
.kb-card-actions{display:flex;align-items:center;gap:6px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line);}
.kb-iconbtn{background:none;border:1px solid var(--line);border-radius:9px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink);transition:border-color .15s ease;}
.kb-iconbtn:hover{border-color:var(--ink);}
.kb-iconbtn:disabled{opacity:.3;cursor:default;}
.kb-iconbtn.danger:hover{border-color:#9B2C2C;color:#9B2C2C;}
.kb-spacer{flex:1;}

.kb-form{background:var(--surface);border:1px solid var(--ink);border-radius:13px;padding:13px;}
.kb-input,.kb-textarea,.kb-select{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font-family:inherit;font-size:14.5px;color:var(--ink);background:var(--paper);margin-bottom:8px;}
.kb-textarea{resize:vertical;min-height:64px;line-height:1.5;}
.kb-row2{display:flex;gap:8px;}
.kb-row2 .kb-select{flex:1;}
.kb-form-actions{display:flex;gap:8px;margin-top:4px;}
.kb-btn{flex:1;border-radius:10px;font-size:14.5px;font-weight:600;padding:12px;cursor:pointer;border:1px solid var(--line);font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
.kb-btn-primary{background:var(--ink);color:#fff;border-color:var(--ink);}
.kb-btn-ghost{background:var(--surface);color:var(--ink);}

.kb-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:24px;padding-top:16px;border-top:1px solid var(--line);}
.kb-foot-actions{display:flex;align-items:center;gap:14px;}
.kb-stat{font-size:12px;color:var(--muted);}
.kb-reset{background:none;border:none;color:var(--muted);font-family:inherit;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;}
.kb-reset:hover{color:var(--ink);}
.kb-reset.danger:hover{color:#9B2C2C;}
.kb-loading{text-align:center;color:var(--muted);padding:60px 0;font-size:14px;}

/* ---- WIDE: Jira-style side-by-side columns when there's room ---- */
@media (min-width:900px){
  .kb-shell{max-width:1180px;}
  .kb-tabs{display:none;}
  .kb-board{flex-direction:row;align-items:flex-start;gap:14px;}
  .kb-col{flex:1 1 0;min-width:0;margin-top:20px;background:rgba(26,24,19,.025);border:1px solid var(--line);padding:12px 11px 16px;}
  .kb-col.is-hidden{display:block;}
  .kb-col.drop{background:#fff;border-color:var(--ink);}
  .kb-cards{min-height:120px;}
}
`;

/* ================================================================== */
/*  Card editor                                                        */
/* ================================================================== */

function CardForm({ initial, defaultCol, onSave, onCancel }) {
  const [title, setTitle] = useState(initial ? initial.title : "");
  const [desc, setDesc] = useState(initial ? initial.desc : "");
  const [epic, setEpic] = useState(initial ? initial.epic : "launch");
  const [priority, setPriority] = useState(initial ? initial.priority : "Med");
  return (
    <div className="kb-form">
      <input className="kb-input" placeholder="Ticket title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <textarea className="kb-textarea" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <div className="kb-row2">
        <select className="kb-select" value={epic} onChange={(e) => setEpic(e.target.value)}>
          {Object.keys(EPICS).map((k) => <option key={k} value={k}>{EPICS[k].label}</option>)}
        </select>
        <select className="kb-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="High">High</option><option value="Med">Med</option><option value="Low">Low</option>
        </select>
      </div>
      <div className="kb-form-actions">
        <button className="kb-btn kb-btn-ghost" onClick={onCancel}><X size={16} /> Cancel</button>
        <button className="kb-btn kb-btn-primary" onClick={() => { if (!title.trim()) return; onSave({ title: title.trim(), desc: desc.trim(), epic, priority, col: initial ? initial.col : defaultCol }); }}>
          <Check size={16} /> Save
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

export default function Kanban() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activeCol, setActiveCol] = useState("todo");
  const [addingCol, setAddingCol] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCards(JSON.parse(raw));
      else throw new Error("seed");
    } catch {
      setCards(DEFAULT_CARDS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARDS)); } catch (e) {}
    }
    setLoading(false);
  }, []);

  const persist = (next) => {
    setCards(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
  };
  const move = (id, dir) => {
    let landed = null;
    const next = cards.map((c) => {
      if (c.id !== id) return c;
      const idx = COLUMNS.findIndex((k) => k.key === c.col);
      const ni = Math.min(COLUMNS.length - 1, Math.max(0, idx + dir));
      landed = COLUMNS[ni].key;
      return { ...c, col: landed };
    });
    persist(next);
    if (landed) setActiveCol(landed); // follow the card on narrow view
  };
  const moveTo = (id, col) => persist(cards.map((c) => (c.id === id ? { ...c, col } : c)));
  const remove = (id) => persist(cards.filter((c) => c.id !== id));
  const saveEdit = (id, data) => { persist(cards.map((c) => (c.id === id ? { ...c, ...data } : c))); setEditingId(null); };
  const addCard = (data) => { persist([{ id: uid(), ref: "NEW", ...data }, ...cards]); setAddingCol(null); setActiveCol(data.col); };
  const resetBoard = () => {
    if (window.confirm("Reset the board to the starter backlog? Your changes will be lost.")) {
      persist(DEFAULT_CARDS.map((c) => ({ ...c, id: uid() })));
    }
  };

  const exportBoard = () => {
    const data = cards.map(({ ref, title, desc, epic, priority, col }) => ({ ref, title, desc, epic, priority, col }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conform-board.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const arr = Array.isArray(data) ? data : (Array.isArray(data.cards) ? data.cards : []);
        const next = arr.map(normCard).filter((c) => c.title);
        if (!next.length) { window.alert("No valid tickets found in that file."); }
        else if (window.confirm("Import " + next.length + " tickets? This replaces the current board.")) { persist(next); }
      } catch {
        window.alert("That file isn't valid JSON.");
      }
      e.target.value = "";
    };
    reader.readAsText(f);
  };

  if (loading) return <div className="kb"><style>{CSS}</style><div className="kb-shell"><div className="kb-loading">Loading board…</div></div></div>;

  const inCol = (col) => cards.filter((c) => c.col === col && (filter === "all" || c.epic === filter));
  const doneCount = cards.filter((c) => c.col === "done").length;

  return (
    <div className="kb">
      <style>{CSS}</style>
      <div className="kb-shell">
        <div className="kb-top">
          <div className="kb-brand"><span className="kb-dot" /> CONFORM · BOARD</div>
          <button className="kb-addbtn" onClick={() => { setAddingCol("backlog"); setActiveCol("backlog"); }}><Plus size={15} /> New ticket</button>
        </div>
        <p className="kb-sub">Filter by workstream, tap a column to switch, drag a card or use the arrows to move it — everything saves as you go.</p>

        {/* workstream filters */}
        <div className="kb-filters">
          <button className={"kb-fchip" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>All</button>
          {Object.keys(EPICS).map((k) => (
            <button key={k} className={"kb-fchip" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>
              <span className="kb-edot" style={{ background: EPICS[k].color }} />{EPICS[k].label}
            </button>
          ))}
        </div>

        {/* column tabs (narrow only) */}
        <div className="kb-tabs">
          {COLUMNS.map((c) => (
            <button key={c.key} className={"kb-tab" + (activeCol === c.key ? " active" : "")} onClick={() => setActiveCol(c.key)}>
              {c.label} <span className="kb-count">{inCol(c.key).length}</span>
            </button>
          ))}
        </div>

        {addingCol && <div style={{ marginTop: 14 }}><CardForm defaultCol={addingCol} onSave={addCard} onCancel={() => setAddingCol(null)} /></div>}

        <div className="kb-board">
          {COLUMNS.map((colDef) => {
            const list = inCol(colDef.key);
            const hidden = activeCol !== colDef.key;
            return (
              <div
                className={"kb-col" + (hidden ? " is-hidden" : "") + (overCol === colDef.key ? " drop" : "")}
                key={colDef.key}
                onDragOver={(e) => { e.preventDefault(); if (overCol !== colDef.key) setOverCol(colDef.key); }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || dragId; if (id) moveTo(id, colDef.key); setOverCol(null); setDragId(null); }}
              >
                <div className="kb-col-h">
                  <span className="kb-col-name">{colDef.label} <span className="kb-count">{list.length}</span></span>
                  <button className="kb-addbtn" onClick={() => { setAddingCol(colDef.key); setActiveCol(colDef.key); }}><Plus size={14} /> Add</button>
                </div>
                <div className="kb-cards">
                  {list.length === 0 && <p className="kb-empty">Nothing here yet.</p>}
                  {list.map((c) => {
                    const ep = EPICS[c.epic] || { label: c.epic, color: "#999" };
                    const idx = COLUMNS.findIndex((k) => k.key === c.col);
                    const isOpen = !!expanded[c.id];
                    if (editingId === c.id) return <CardForm key={c.id} initial={c} onSave={(d) => saveEdit(c.id, d)} onCancel={() => setEditingId(null)} />;
                    return (
                      <div
                        className={"kb-card" + (dragId === c.id ? " dragging" : "")}
                        key={c.id}
                        draggable
                        onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.id); }}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      >
                        <div className="kb-card-bar" style={{ background: ep.color }} />
                        <div className="kb-card-top">
                          <span className="kb-grip"><GripVertical size={13} /></span>
                          <span className="kb-ref kb-mono">{c.ref}</span>
                          <span className="kb-prio" style={{ background: PRIORITY[c.priority] || "#888" }}>{c.priority}</span>
                          <span className="kb-eptag"><span className="kb-edot" style={{ background: ep.color }} />{ep.label}</span>
                        </div>
                        <p className="kb-title" onClick={() => setExpanded({ ...expanded, [c.id]: !isOpen })}>{c.title}</p>
                        {c.desc && isOpen && <p className="kb-desc">{c.desc}</p>}
                        <div className="kb-card-actions">
                          <button className="kb-iconbtn" disabled={idx === 0} onClick={() => move(c.id, -1)} title="Move back"><ChevronLeft size={16} /></button>
                          <button className="kb-iconbtn" disabled={idx === COLUMNS.length - 1} onClick={() => move(c.id, 1)} title="Move forward"><ChevronRight size={16} /></button>
                          {c.desc && <button className="kb-iconbtn" onClick={() => setExpanded({ ...expanded, [c.id]: !isOpen })} title="Details">{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>}
                          <span className="kb-spacer" />
                          <button className="kb-iconbtn" onClick={() => setEditingId(c.id)} title="Edit"><Pencil size={14} /></button>
                          <button className="kb-iconbtn danger" onClick={() => remove(c.id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="kb-foot">
          <span className="kb-stat">{cards.length} tickets · {doneCount} done</span>
          <div className="kb-foot-actions">
            <button className="kb-reset" onClick={exportBoard} title="Download the board as JSON"><Download size={13} /> Export</button>
            <button className="kb-reset" onClick={() => fileRef.current && fileRef.current.click()} title="Load tickets from a JSON file"><Upload size={13} /> Import</button>
            <button className="kb-reset danger" onClick={resetBoard}><RotateCcw size={13} /> Reset</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onImportFile} />
        </div>
      </div>
    </div>
  );
}
