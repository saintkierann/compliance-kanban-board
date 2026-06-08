import React, { useState, useEffect } from "react";
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
} from "lucide-react";

/* ================================================================== */
/*  Config                                                             */
/* ================================================================== */

const STORAGE_KEY = "conform-kanban-v3";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
];

const EPICS = {
  research: { label: "Research", color: "#6D5BD0" },
  design: { label: "Design", color: "#2A8C82" },
  checks: { label: "Checks", color: "#2C6E49" },
  scanning: { label: "Scanning", color: "#B0731A" },
  log: { label: "Inspection log", color: "#2F6FB0" },
  accounts: { label: "Accounts & data", color: "#5B6470" },
  launch: { label: "Launch", color: "#B23A6B" },
};

// Build stages — when building control / compliance attends site, in order
const STAGE_ORDER = ["foundation", "digout", "formwork", "structure", "externals", "roofing", "internals", "finishing"];
const STAGES = {
  foundation: { label: "Foundation", color: "#7A5C3E" },
  digout: { label: "Dig out", color: "#9A6A3A" },
  formwork: { label: "Formwork", color: "#B0731A" },
  structure: { label: "Structure", color: "#2C6E49" },
  externals: { label: "Externals", color: "#2A8C82" },
  roofing: { label: "Roofing", color: "#2F6FB0" },
  internals: { label: "Internals", color: "#6D5BD0" },
  finishing: { label: "Finishing", color: "#B23A6B" },
};

const PRIORITY = { High: "#9B2C2C", Med: "#B0731A", Low: "#8A867D" };

let _n = 0;
const uid = () => Date.now().toString(36) + (_n++).toString(36);
const card = (ref, title, desc, epic, priority, col, stage = "") => ({ id: uid(), ref, title, desc, epic, priority, col, stage });

const DEFAULT_CARDS = [
  // RESEARCH
  card("R-1", "Saturday working session with the PM", "Sit with the project manager: which checks would they trust the app to do, which would they never, and which would they pay for. Walk them through the prototype.", "research", "High", "todo"),
  card("R-2", "Check the 'contractor uploads, PM reviews' way of working", "Confirm with the PM on Saturday: does it match real life for the contractor to take and upload the photos, and the PM to read the report and decide where to focus on their visit?", "research", "High", "todo"),
  card("R-3", "Choose the first check to launch with", "Pick ONE check to get really right for launch. Strong option: fire-stopping around pipes and cables — it's a legal must and has to be caught before it's plastered over.", "research", "High", "todo"),
  card("R-4", "Talk to 5 PMs and contractors about defects caught too late", "Focus on things that were missed until after they were covered up and caused rework, failed inspections or warranty claims. Write down every answer.", "research", "Med", "backlog"),
  card("R-5", "Map when each check happens during a build", "Work out which build stage each check belongs to — foundation, dig out, formwork, structure, externals, roofing, internals, finishing. This decides when the app should prompt people.", "research", "Med", "backlog"),
  card("R-6", "Look at what's already out there", "Check existing snagging and fire-stopping apps — what they do, what they miss, and where our angle is different.", "research", "Low", "backlog"),

  // DESIGN
  card("D-1", "Opening screen that lists the checks", "A simple home screen that lists the checks available and grows as we add more. Already built in the prototype.", "design", "Med", "doing"),
  card("D-2", "Standard results layout for every check", "One consistent results screen: the overall verdict, how confident the app is, and a point-by-point checklist. Done in the prototype.", "design", "Med", "done"),
  card("D-3", "PM report that sorts items by where to look", "The report the PM opens, split into 'Looks good — quick check', 'Needs your eyes', and 'Couldn't tell from the photos'. Should be readable in ten seconds.", "design", "High", "backlog"),
  card("D-4", "Name, logo and colours", "Decide the product name and a simple look ('CONFORM' is a placeholder for now).", "design", "Low", "backlog"),

  // CHECKS (with a suggested build stage)
  card("C-1", "Plasterboard check", "Identify the board from a photo and confirm it's the right type for where it's being used. Prototype done.", "checks", "Med", "done", "internals"),
  card("C-2", "ComFlor floor decking check", "Overall verdict plus a checklist covering bearing onto supports, fixings, side laps, shear studs, propping, damage, and water leakage. Prototype done.", "checks", "Med", "done", "structure"),
  card("C-3", "Fire-stopping check — gaps around pipes and cables", "Spot unsealed gaps, the wrong or uncertified sealant, and missing fire collars where pipes and cables pass through fire walls and floors. Our highest-value check.", "checks", "High", "backlog", "internals"),
  card("C-4", "Fire door check", "Check the gaps around the door, the intumescent strips, the closer, and the certification label.", "checks", "Med", "backlog", "finishing"),
  card("C-5", "Damp-proof course check", "Check the damp-proof course height above the ground and whether it's been bridged.", "checks", "Low", "backlog", "foundation"),

  // SCANNING
  card("S-1", "Take a photo or pick one from the phone", "Let someone snap a photo or choose one from their phone, ready to be checked. Done.", "scanning", "Med", "done"),
  card("S-2", "Turn the photo into a clear result", "Send the photo to the AI and get back a clear, structured result for the screen. Done.", "scanning", "High", "done"),
  card("S-3", "Never guess measurements", "The AI can't measure a gap or a bearing length from a photo without something for scale. Never show exact measurements — flag them for the PM to check by hand, or ask for a known-size card in the shot.", "scanning", "High", "backlog"),
  card("S-4", "Make the photos trustworthy as evidence", "Because the person doing the work may also take the photo, use the live camera only with the time and location stamped on it, so shots can't be staged. The PM spot-checks the rest.", "scanning", "Med", "backlog"),
  card("S-5", "Ask for more photos when one isn't enough", "The 'add more photos or report anyway' steps built for the decking check should work for every check.", "scanning", "Med", "backlog"),
  card("S-6", "Handle things going wrong", "Clear messages and an easy retry for a blurry photo, no phone signal, or the AI not responding.", "scanning", "Med", "backlog"),

  // INSPECTION LOG
  card("L-1", "Save each check as a record", "Keep the photos, verdict, checklist, time and location together as one inspection record.", "log", "High", "backlog"),
  card("L-2", "A list of past checks for each job", "See the history of checks on a site so nothing gets lost.", "log", "High", "backlog"),
  card("L-3", "Save a check as a shareable PDF", "A tidy PDF the PM can file as proof — the kind of record the Building Safety Act expects (the 'golden thread').", "log", "High", "backlog"),
  card("L-4", "PM 'checked on site' tick", "When the PM verifies an item in person, they tick it off. That tick — with the photo, the app's view and the time — becomes the real sign-off record.", "log", "High", "backlog"),
  card("L-5", "Group records by site", "Organise checks under each job so a site's full history sits in one place.", "log", "Med", "backlog"),

  // ACCOUNTS & DATA
  card("A-1", "Two types of user: site team and PM", "Let a site person log in to capture and upload, and a PM log in to review and sign off.", "accounts", "High", "backlog"),
  card("A-2", "Store photos and records safely online", "Move records off a single phone so they're safe and everyone sees the same thing.", "accounts", "Med", "backlog"),
  card("A-3", "Data and privacy", "Site photos can be sensitive. Agree how data is stored, who owns it and how long it's kept, follow the data-protection rules (GDPR), and write a privacy policy.", "accounts", "Med", "backlog"),
  card("A-4", "Works with no signal, uploads later", "Sites often have poor signal — let people capture offline and upload once they're back on data.", "accounts", "Low", "backlog"),

  // LAUNCH
  card("X-1", "Get the terms and disclaimers checked", "Make it clear the app is a helper and the PM signs off. Get the terms and the on-screen wording checked by someone qualified.", "launch", "High", "backlog"),
  card("X-2", "Get one or two sites to trial it", "Find real sites to try the first check and give honest feedback.", "launch", "High", "backlog"),
  card("X-3", "Work out pricing", "Per person, per site, or per check? Test what a PM would actually pay. Likely the PM or company pays and site teams are free.", "launch", "Med", "backlog"),
  card("X-4", "Make it work like an app without the app store", "For the first version, a web link people add to their phone's home screen — no app-store wait.", "launch", "Med", "backlog"),
  card("X-5", "Simple website and waitlist", "A basic page explaining the app and collecting interested sites.", "launch", "Low", "backlog"),
];

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

.kb-stagefilter{display:flex;align-items:center;gap:8px;margin:4px 0 2px;font-size:12px;color:var(--muted);}
.kb-stagefilter select{font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:8px;padding:6px 9px;background:var(--surface);color:var(--ink);cursor:pointer;}

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
.kb-stage{display:inline-flex;align-items:center;gap:6px;margin-top:9px;font-size:11.5px;font-weight:600;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:7px;padding:4px 9px;}
.kb-desc{font-size:13.5px;color:var(--muted);line-height:1.55;margin:9px 0 0;}
.kb-card-actions{display:flex;align-items:center;gap:6px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line);}
.kb-iconbtn{background:none;border:1px solid var(--line);border-radius:9px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink);transition:border-color .15s ease;}
.kb-iconbtn:hover{border-color:var(--ink);}
.kb-iconbtn:disabled{opacity:.3;cursor:default;}
.kb-iconbtn.danger:hover{border-color:#9B2C2C;color:#9B2C2C;}
.kb-spacer{flex:1;}

.kb-form{background:var(--surface);border:1px solid var(--ink);border-radius:13px;padding:13px;}
.kb-flabel{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:600;margin:2px 0 6px;}
.kb-input,.kb-textarea,.kb-select{width:100%;border:1px solid var(--line);border-radius:9px;padding:10px;font-family:inherit;font-size:14.5px;color:var(--ink);background:var(--paper);margin-bottom:8px;}
.kb-textarea{resize:vertical;min-height:64px;line-height:1.5;}
.kb-row2{display:flex;gap:8px;}
.kb-row2 .kb-select{flex:1;}
.kb-form-actions{display:flex;gap:8px;margin-top:4px;}
.kb-btn{flex:1;border-radius:10px;font-size:14.5px;font-weight:600;padding:12px;cursor:pointer;border:1px solid var(--line);font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
.kb-btn-primary{background:var(--ink);color:#fff;border-color:var(--ink);}
.kb-btn-ghost{background:var(--surface);color:var(--ink);}

.kb-foot{display:flex;align-items:center;justify-content:space-between;margin-top:24px;padding-top:16px;border-top:1px solid var(--line);}
.kb-stat{font-size:12px;color:var(--muted);}
.kb-reset{background:none;border:none;color:var(--muted);font-family:inherit;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;}
.kb-reset:hover{color:#9B2C2C;}
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
  const [epic, setEpic] = useState(initial ? initial.epic : "checks");
  const [priority, setPriority] = useState(initial ? initial.priority : "Med");
  const [stage, setStage] = useState(initial ? (initial.stage || "") : "");
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
      <div className="kb-flabel">Build stage compliance attends</div>
      <select className="kb-select" value={stage} onChange={(e) => setStage(e.target.value)}>
        <option value="">— No build stage —</option>
        {STAGE_ORDER.map((k) => <option key={k} value={k}>{STAGES[k].label}</option>)}
      </select>
      <div className="kb-form-actions">
        <button className="kb-btn kb-btn-ghost" onClick={onCancel}><X size={16} /> Cancel</button>
        <button className="kb-btn kb-btn-primary" onClick={() => { if (!title.trim()) return; onSave({ title: title.trim(), desc: desc.trim(), epic, priority, stage, col: initial ? initial.col : defaultCol }); }}>
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
  const [stageFilter, setStageFilter] = useState("all");
  const [activeCol, setActiveCol] = useState("todo");
  const [addingCol, setAddingCol] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = const saved = localStorage.getItem(STORAGE_KEY); const r = saved ? { value: saved } : null;
        if (r && r.value) setCards(JSON.parse(r.value));
        else throw new Error("seed");
      } catch {
        setCards(DEFAULT_CARDS);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARDS)); } catch (e) {}
      }
      setLoading(false);
    })();
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
    if (landed) setActiveCol(landed);
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

  if (loading) return <div className="kb"><style>{CSS}</style><div className="kb-shell"><div className="kb-loading">Loading board…</div></div></div>;

  const inCol = (col) => cards.filter((c) =>
    c.col === col &&
    (filter === "all" || c.epic === filter) &&
    (stageFilter === "all" || (c.stage || "") === stageFilter)
  );
  const doneCount = cards.filter((c) => c.col === "done").length;

  return (
    <div className="kb">
      <style>{CSS}</style>
      <div className="kb-shell">
        <div className="kb-top">
          <div className="kb-brand"><span className="kb-dot" /> CONFORM · BOARD</div>
          <button className="kb-addbtn" onClick={() => { setAddingCol("backlog"); setActiveCol("backlog"); }}><Plus size={15} /> New ticket</button>
        </div>
        <p className="kb-sub">Tap a column tab to switch. Drag a card or use the arrows to move it along — everything saves as you go.</p>

        {/* epic filters */}
        <div className="kb-filters">
          <button className={"kb-fchip" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>All</button>
          {Object.keys(EPICS).map((k) => (
            <button key={k} className={"kb-fchip" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>
              <span className="kb-edot" style={{ background: EPICS[k].color }} />{EPICS[k].label}
            </button>
          ))}
        </div>

        {/* build-stage filter */}
        <div className="kb-stagefilter">
          <span>Build stage</span>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">All stages</option>
            {STAGE_ORDER.map((k) => <option key={k} value={k}>{STAGES[k].label}</option>)}
          </select>
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
                    const st = c.stage && STAGES[c.stage] ? STAGES[c.stage] : null;
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
                        {st && <div className="kb-stage"><span className="kb-edot" style={{ background: st.color }} />{st.label}</div>}
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
          <button className="kb-reset" onClick={resetBoard}><RotateCcw size={13} /> Reset to starter backlog</button>
        </div>
      </div>
    </div>
  );
}
