/* ============================================================
   Ashram Visitor Registration — Shared App Logic
   Pure vanilla JS · No frameworks · Supabase persistence
   ============================================================ */

const SUPABASE_URL = "https://vqebrffoqcetypzerfmd.supabase.co";
const SUPABASE_KEY = "sb_publishable_hRHuxu74astcH9ksWBQ46g_ROeCrkwA";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

(function () {
  'use strict';

  // ----- Constants & options -----
  const STORAGE_KEY = 'ashram_visitors_v1';

  const PROGRAM_OPTIONS = [
    'वार्षिक उत्सव', 'शिबिर', 'बालसंस्कार वर्ग', 'ऑनलाइन कार्यक्रम',
    'सत्संग / प्रवचन', 'सेवा कार्य', 'इतर',
  ];
  const PURPOSE_OPTIONS = [
    'दीक्षा', 'शिबिर अटेंड करणे', 'पारायण करणे',
    'रुद्राभिषेक', 'वेदांत शास्त्र शिकणे', 'सेवा करणे',
  ];
  const PROFESSION_OPTIONS = [
    'Student', 'Business', 'Service', 'IT Professional', 'Teacher',
    'Doctor', 'Engineer', 'Homemaker', 'Retired', 'Freelancer', 'Farmer',
  ];
  const HEALTH_OPTIONS = [
    { value: 'BP', label: 'BP (रक्तदाब)' },
    { value: 'Diabetes', label: 'Diabetes (मधुमेह)' },
    { value: 'Asthma', label: 'Asthma (दमा)' },
    { value: 'Seizure', label: 'Seizure (फिट्स)' },
    { value: 'Heart', label: 'Heart (हृदयरोग)' },
    { value: 'Thyroid', label: 'Thyroid (थायरॉईड)' },
  ];

  // ----- Storage helpers -----
  // FIX 1: supabase → supabaseClient
  async function loadVisitors() {
    const { data, error } = await supabaseClient
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    const grouped = {};

    data.forEach(row => {
      if (!grouped[row.mobile]) {
        grouped[row.mobile] = {
          name: row.name,
          mobile: row.mobile,
          address: row.address,
          city: row.city,
          professions: row.profession
            ? row.profession.split(',').map(s => s.trim())
            : [],
          visits: []
        };
      }

      grouped[row.mobile].visits.push({
        date: row.visit_date,
        days: Number(row.stayed_days || 0),
        stayingNow: Number(row.stayed_days || 0) > 0 ? 'होय' : 'नाही',
        purposes: row.purposes
          ? row.purposes.split(',').map(s => s.trim())
          : [],
        programs: row.programs
          ? row.programs.split(',').map(s => s.trim())
          : [],
        healthConditions: row.health
          ? row.health.split(',').map(s => s.trim())
          : [],
        note: row.note || ''
      });
    });

    return Object.values(grouped);
  }

  function saveVisitors(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
    catch (e) { console.warn('storage save failed', e); }
  }

  // FIX 2: findByMobile — make async, add await
  async function findByMobile(mobile) {
    const all = await loadVisitors();
    return all.find(v => v.mobile === mobile);
  }

  // FIX 3: searchVisitors — add await before loadVisitors()
  async function searchVisitors({ mobile, name } = {}) {
    const all = await loadVisitors();
    if (mobile && /^\d{10}$/.test(mobile)) {
      const exact = all.find(v => v.mobile === mobile);
      return exact ? [exact] : all.filter(v => v.mobile.includes(mobile));
    }
    if (mobile) return all.filter(v => v.mobile.includes(mobile));
    if (name) {
      const q = name.toLowerCase().trim();
      return all.filter(v => v.name.toLowerCase().includes(q));
    }
    return [];
  }

  // FIX 4: addVisitor — make async, add await before loadVisitors()
  async function addVisitor(data) {
    const visitEntry = {
      date: data.visitDate || new Date().toISOString().slice(0, 16),
      stayingNow: data.stayingNow,
      days: data.days ? parseInt(data.days) : 0,
      programs: data.programs || [],
      purposes: [...(data.purposes || []), ...(data.purposeOther ? [data.purposeOther] : [])],
      healthConditions: data.hasHealth === 'होय'
        ? [...(data.healthConditions || []), ...(data.healthOther ? [data.healthOther] : [])]
        : [],
      note: data.note || '',
    };

    await saveVisitorToSupabase({
      name: data.name,
      mobile: data.mobile,
      city: extractCity(data.address),
      profession: (data.professions || []).join(", "),
      address: data.address,
      visit_date: visitEntry.date,
      stayed_days: String(visitEntry.days),
      purposes: visitEntry.purposes.join(", "),
      programs: visitEntry.programs.join(", "),
      health: visitEntry.healthConditions.join(", "),
      note: visitEntry.note,
    });

    // For visit number, fetch updated data
    const all = await loadVisitors();
    const existing = all.find(v => v.mobile === data.mobile);
    if (existing) {
      return { visitor: existing, visitNumber: existing.visits.length };
    }
    return { visitor: { mobile: data.mobile, name: data.name }, visitNumber: 1 };
  }

  function resetSeed() {
    console.warn('resetSeed is a no-op in Supabase mode');
  }

  function extractCity(addr) {
    if (!addr) return '';
    const cleaned = addr.split('-')[0];
    const parts = cleaned.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  // ----- Formatting helpers -----
  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return s; }
  }
  function fmtMonthYear(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('mr-IN', { month: 'short', year: 'numeric' }); }
    catch { return s; }
  }
  function nowLocalISO() {
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    return n.toISOString().slice(0, 16);
  }
  function getInitials(name) {
    return (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?';
  }
  function maskMobile(m) {
    if (!m) return '—';
    return m.slice(0, 2) + '••••••' + m.slice(-2);
  }
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ----- Excel/CSV export -----
  function exportCSV(rows, filename) {
    if (!rows || !rows.length) { showToast('एक्सपोर्ट करण्यासाठी डेटा नाही'); return; }
    const headers = Object.keys(rows[0]);
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))];
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'visitors.csv';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ----- Toast -----
  function showToast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ----- Header rendering -----
  function renderHeader(activePage) {
    const yantra = '<svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="#B85A1A" stroke-width="1"><circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="8"/><path d="M16 5 L25 21 L7 21 Z"/><path d="M16 27 L7 11 L25 11 Z"/><circle cx="16" cy="16" r="1.8" fill="#B85A1A" stroke="none"/></svg>';
    const navItems = [
      { id: 'new',    href: 'index.html',     label: 'नवीन विजिटर',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>' },
      { id: 'search', href: 'search.html',    label: 'यापूर्वी भेट दिलेली', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
      { id: 'dash',   href: 'dashboard.html', label: 'सर्व नोंदी',       icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' },
    ];
    const html = `
      <div class="site-header-inner">
        <a href="index.html" class="brand">
          <div class="brand-mark">${yantra}</div>
          <div class="brand-text">
            <div class="brand-eyebrow">आश्रम सेवा</div>
            <div class="brand-title">विजिटर नोंदणी</div>
          </div>
        </a>
        <nav class="site-nav">
          ${navItems.map(it => `
            <a href="${it.href}" class="${it.id === activePage ? 'active' : ''}">
              <span class="nav-icon">${it.icon}</span>
              <span class="nav-label">${it.label}</span>
            </a>
          `).join('')}
        </nav>
      </div>
    `;
    const headerEl = document.querySelector('header.site-header');
    if (headerEl) headerEl.innerHTML = html;
  }

  // ----- Multi-select chip group -----
  // FIX 5: removed 'async' from inner render (not needed)
  function makeChipGroup({ container, options, values = [], otherValue = '', otherLabel = 'इतर', otherPlaceholder = 'टाइप करा...', allowOther = true, onChange }) {
    const selected = new Set(values);
    let other = otherValue;
    let showOther = !!otherValue;

    function render() {
      const opts = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
      const chipsHTML = opts.map(o => {
        const isSel = selected.has(o.value);
        return `<button type="button" class="chip ${isSel ? 'selected' : ''}" data-value="${escapeHTML(o.value)}">
          <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ${escapeHTML(o.label)}
        </button>`;
      }).join('');
      const otherBtn = allowOther ? `<button type="button" class="chip dashed ${showOther ? 'selected' : ''}" data-action="toggle-other">+ ${escapeHTML(otherLabel)}</button>` : '';
      const otherInput = (allowOther && showOther) ? `<div class="chip-other-input"><input type="text" class="input" data-other-input value="${escapeHTML(other)}" placeholder="${escapeHTML(otherPlaceholder)}" /></div>` : '';
      container.innerHTML = `<div class="chip-group">${chipsHTML}${otherBtn}</div>${otherInput}`;
      container.querySelectorAll('.chip[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.value;
          if (selected.has(v)) selected.delete(v); else selected.add(v);
          render(); emit();
        });
      });
      const otherToggle = container.querySelector('[data-action="toggle-other"]');
      if (otherToggle) otherToggle.addEventListener('click', () => {
        showOther = !showOther;
        if (!showOther) other = '';
        render(); emit();
      });
      const otherEl = container.querySelector('[data-other-input]');
      if (otherEl) otherEl.addEventListener('input', (e) => { other = e.target.value; emit(); });
    }
    function emit() { if (onChange) onChange(Array.from(selected), other); }
    function getValues() { return Array.from(selected); }
    function getOther() { return other; }
    render();
    return { getValues, getOther, rerender: render };
  }

  // ----- DOM helpers -----
  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  }

  // ----- Supabase save helper -----
  async function saveVisitorToSupabase(data) {
    const { error } = await supabaseClient
      .from('visitors')
      .insert([data]);

    if (error) {
      console.error("Supabase Error:", error);
      showToast("डेटा जतन अयशस्वी");
      return false;
    }
    return true;
  }

  // ----- Public API -----
  window.AshramApp = {
    PROGRAM_OPTIONS, PURPOSE_OPTIONS, PROFESSION_OPTIONS, HEALTH_OPTIONS,
    loadVisitors, saveVisitors, addVisitor, searchVisitors, findByMobile, resetSeed,
    fmtDate, fmtMonthYear, nowLocalISO, getInitials, maskMobile, escapeHTML,
    extractCity, exportCSV, showToast,
    renderHeader, makeChipGroup,
    $, $$, el,
  };

  // ----- Auto-init -----
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    renderHeader(page);
  });

})();
