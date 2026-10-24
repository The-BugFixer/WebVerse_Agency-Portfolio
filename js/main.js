import { initScene, initCursor3D } from './scene.js';
import { projects } from './data.js';

const C = window.WEBVERSE || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
let curEl = null;   // the 3D cursor element (moved into the popup while it is open)
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
const mobile = innerWidth < 800;
const state = { hue: '#2de38a', x: 4.4, s: 1, scroll: 0, mx: 0, my: 0 };
const mouse = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0 };

/* ---------- contact links from config ---------- */
const wa = (txt = "Hi WebVerse, I'd like to grow my business online.") =>
  C.whatsapp ? `https://wa.me/${String(C.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(txt)}` : '';
$$('[data-wa]').forEach(a => {
  if (C.whatsapp) { a.href = wa(); a.target = '_blank'; a.rel = 'noopener'; a.hidden = false; }
  else if (a.classList.contains('wa-float') || a.closest('.contact')) a.hidden = true;
  else { a.textContent = 'Get in touch'; a.href = '#contact'; }
});
const setLink = (sel, href, show) => $$(sel).forEach(a => { if (show) { a.href = href; a.hidden = false; } else if (a.closest('.contact')) a.hidden = true; });
setLink('[data-book]', C.bookingUrl, !!C.bookingUrl);
setLink('[data-mail]', `mailto:${C.email}`, !!C.email);
setLink('[data-tel]', `tel:${(C.phone || '').replace(/[^\d+]/g, '')}`, !!C.phone);
setLink('[data-ig]', C.instagram, !!C.instagram);
$$('[data-ln]').forEach(a => a.href = C.linkedin || '#');
$$('[data-gh]').forEach(a => a.href = C.github || '#');
if (C.location) $('#loc').textContent = C.location; else $('#loc').closest('.tile').hidden = true;
$$('[data-fill=phone]').forEach(e => e.textContent = C.phone || '');
$$('[data-fill=email]').forEach(e => e.textContent = C.email || '');
$('#yr').textContent = new Date().getFullYear();

/* ---------- headline word split ---------- */
$$('[data-split]').forEach(h => {
  let i = 0;
  (function walk(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w.trim()) { frag.append(w); return; }
          const o = document.createElement('span'); o.dataset.w = '';
          const s = document.createElement('span'); s.textContent = w; s.style.setProperty('--i', i++);
          o.append(s); frag.append(o);
        });
        n.replaceWith(frag);
      } else walk(n);
    });
  })(h);
});

/* ---------- projects ---------- */
const palette = [['#2de38a33', '#4f8bff44'], ['#4f8bff44', '#9b6bff44'], ['#9b6bff44', '#2de38a33']];
const grid = $('#workGrid');
grid.innerHTML = projects.map((p, i) => {
  const [c1, c2] = palette[i % 3], ini = p.name.split(/\s+/).filter(w => /^[A-Za-z]/.test(w) && w !== '&').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const live = p.status === 'Ongoing';
  return `<article class="proj tilt" data-name="${p.name}" data-cat="${p.cat.join(' ')}" style="--c1:${c1};--c2:${c2};--d:${(i % 3) * .08}s" ${p.link ? `data-cursor-label="Visit"` : ''}>
    <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : ''}<b>${ini}</b></div>
    <div class="body">
      <div class="meta"><span>${p.type} · ${p.year}</span><span class="pill ${live ? 'live' : 'done'}">${live ? '● Ongoing' : 'Completed'}</span></div>
      <h3>${p.name}</h3><p>${p.did}</p>
      <div class="tools">${p.tools.map(t => `<span>${t}</span>`).join('')}</div>
      ${p.link ? `<a class="visit" href="${p.link}" target="_blank" rel="noopener">Visit live project ↗</a>` : `<span class="visit none">Brand work · no public link</span>`}
    </div></article>`;
}).join('');
$$('.proj', grid).forEach(card => {
  const a = $('a.visit', card);
  if (a) card.addEventListener('click', e => { if (!e.target.closest('a')) window.open(a.href, '_blank', 'noopener'); });
});
$$('.chip').forEach(b => b.addEventListener('click', () => {
  $$('.chip').forEach(x => x.classList.toggle('is-on', x === b));
  const f = b.dataset.f;
  $$('.proj', grid).forEach(c => {
    const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
    c.classList.toggle('gone', !show); if (show) { c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
  });
}));

/* ---------- pricing toggle ---------- */
const tog = $('.toggle'), tbtns = $$('button', tog), pill = $('i', tog);
function placePill() { const b = $('.is-on', tog); pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 5}px)`; }
const pricingEl = $('#pricing'), modeNote = $('#modeNote');
tbtns.forEach(b => b.addEventListener('click', () => {
  tbtns.forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); }); placePill();
  pricingEl.dataset.mode = b.dataset.mode; modeNote.hidden = b.dataset.mode !== 'setup';
  $$('.price').forEach(p => {
    const s = $('strong', p), small = $('small', p);
    s.style.opacity = 0; s.style.transform = 'translateY(10px)';
    setTimeout(() => { s.textContent = p.dataset[b.dataset.mode]; small.textContent = b.dataset.mode === 'setup' ? 'One-time' : '/ month'; s.style.opacity = 1; s.style.transform = 'none'; }, 160);
  });
}));
addEventListener('load', placePill); addEventListener('resize', placePill); document.fonts && document.fonts.ready.then(placePill);
$$('[data-pick]').forEach(b => b.addEventListener('click', () => { $('select[name=package]').value = b.dataset.pick; }));

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal:not(.hero .reveal), .proj').forEach(el => io.observe(el));

/* ---------- counters ---------- */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const end = +e.target.dataset.count; let n = 0; const t0 = performance.now();
  (function tick(t) { const k = Math.min((t - t0) / 1400, 1); e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(t0);
}));
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- mobile menu ---------- */
const siteNav = $('#nav'), navToggle = $('#navToggle');
function setMenu(open) { siteNav.classList.toggle('open', open); navToggle.setAttribute('aria-expanded', open); navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
navToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('open')));
$$('#mainNav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && siteNav.classList.contains('open')) { setMenu(false); navToggle.focus(); } });
document.addEventListener('click', e => { if (siteNav.classList.contains('open') && !siteNav.contains(e.target)) setMenu(false); });
matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

/* ---------- How it works: cards pop out in 3D, one by one, when the grid comes into view ---------- */
const stepsEl = $('#steps');
if (stepsEl) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { stepsEl.classList.add('pop'); o.disconnect(); } }), { threshold: .25 }).observe(stepsEl);

/* ---------- scroll-driven state ---------- */
const sections = $$('[data-hue]'), bar = $('.progress i'), nav = $('#nav');
let lastY = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
  state.scroll = max > 0 ? y / max : 0;
  bar.style.transform = `scaleX(${state.scroll})`;
  nav.classList.toggle('hide', y > lastY && y > 300 && !nav.classList.contains('open')); lastY = y;
  // active section by viewport centre
  let cur = sections[0];
  sections.forEach(s => { if (s.hidden) return; const r = s.getBoundingClientRect(); if (r.top <= innerHeight * .5) cur = s; });
  state.hue = cur.dataset.hue; state.x = +cur.dataset.x; state.s = +(cur.dataset.s || .5);
  document.documentElement.style.setProperty('--accent', cur.dataset.hue);
  // hero parallax
  const h = $('.hero h1'); if (h && y < innerHeight) h.style.transform = `translateY(${y * .12}px)`;
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

/* ---------- tilt + magnetic ---------- */
if (fine && !reduced) {
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('.tilt');
    $$('.tilt:hover').forEach(el => { if (el !== t) el.style.removeProperty('--rx'); });
    if (t) {
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--ry', ((x - .5) * 12).toFixed(2) + 'deg'); t.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
      t.style.setProperty('--mx', (x * 100) + '%'); t.style.setProperty('--my', (y * 100) + '%');
    }
  });
  $$('.tilt').forEach(t => t.addEventListener('pointerleave', () => { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }));
  $$('.magnetic').forEach(m => {
    m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    m.addEventListener('pointerleave', () => m.style.transform = '');
  });
}

/* ---------- mouse → scene + 3D cursor ---------- */
addEventListener('pointermove', e => {
  mouse.vx = e.clientX - mouse.x; mouse.vy = e.clientY - mouse.y; mouse.x = e.clientX; mouse.y = e.clientY;
  state.mx = (e.clientX / innerWidth - .5) * 2; state.my = (e.clientY / innerHeight - .5) * 2;
}, { passive: true });

initScene($('#bg'), state, { mobile, reduced });

if (fine && !reduced) {
  const cur = curEl = $('.cursor'), ring = $('.cursor-ring', cur), dot = $('.cursor-3d', cur), lab = $('span', ring);
  const ok = initCursor3D($('canvas', dot), () => ({ x: mouse.vx, y: mouse.vy }), () => state.hue);
  if (ok) {
    document.documentElement.classList.add('has-3d-cursor');
    let rx = mouse.x, ry = mouse.y, dx = mouse.x, dy = mouse.y;
    (function move() {
      dx += (mouse.x - dx) * .5; dy += (mouse.y - dy) * .5; rx += (mouse.x - rx) * .16; ry += (mouse.y - ry) * .16; mouse.vx *= .85; mouse.vy *= .85;
      dot.style.transform = `translate(${dx}px,${dy}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(move);
    })();
    document.addEventListener('pointerover', e => {
      const l = e.target.closest('[data-cursor-label]'), h = e.target.closest('a,button,select,.chip');
      cur.classList.toggle('label', !!l && !h); if (l) lab.textContent = l.dataset.cursorLabel;
      cur.classList.toggle('hover', !!h);
    });
    document.addEventListener('pointerdown', () => cur.classList.add('down'));
    document.addEventListener('pointerup', () => cur.classList.remove('down'));
    document.addEventListener('mouseleave', () => cur.style.opacity = 0); document.addEventListener('mouseenter', () => cur.style.opacity = 1);
  }
}

/* ---------- forms: every enquiry goes straight to WhatsApp ---------- */
function toWhatsApp(text, note) {
  if (!C.whatsapp) { note.className = 'form-note err'; note.textContent = 'WhatsApp number is not set up yet. (Site owner: see README step 1.)'; return false; }
  const url = wa(text);
  const w = window.open(url, '_blank');
  if (w) w.opener = null; else location.href = url;   // popup blocked (some mobile browsers): open in the same tab
  note.className = 'form-note ok'; note.textContent = 'Opening WhatsApp. Press Send there to deliver your message.';
  return true;
}
const clean = v => String(v || '').trim();

const form = $('#leadForm'), note = $('#formNote');
form.addEventListener('submit', e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(form));
  if (d._gotcha) return;
  if (!clean(d.name)) { note.className = 'form-note err'; note.textContent = 'Please enter your name.'; return; }
  const text = `*New enquiry: WebVerse*\nName: ${clean(d.name)}${d.business ? '\nBusiness: ' + clean(d.business) : ''}\nInterested in: ${d.package}${d.phone ? '\nNumber: ' + clean(d.phone) : ''}\n\n${clean(d.message)}`;
  if (toWhatsApp(text, note)) form.reset();
});

/* ---------- Supabase (free): applications, files, glance lists, brands ---------- */
const SB = C.supabaseUrl && C.supabaseKey ? { url: String(C.supabaseUrl).replace(/\/+$/, ''), key: C.supabaseKey } : null;
const sbHeaders = extra => ({ apikey: SB.key, Authorization: 'Bearer ' + SB.key, ...extra });
const sbGet = async q => { const r = await fetch(`${SB.url}/rest/v1/${q}`, { headers: sbHeaders() }); if (!r.ok) throw 0; return r.json(); };
const pubUrl = (bucket, path) => `${SB.url}/storage/v1/object/public/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
const initials = n => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const watch = root => $$('.reveal', root).forEach(el => io.observe(el));

/* ----- Join my team (with attachments) ----- */
const IMG = ['image/jpeg', 'image/png', 'image/webp'];
const DOC = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' };
const MB = n => n * 1024 * 1024;
async function upload(bucket, path, file) {
  const r = await fetch(`${SB.url}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: sbHeaders({ 'Content-Type': file.type, 'x-upsert': 'false' }), body: file });
  if (!r.ok) throw new Error('upload');
  return path;
}

const jform = $('#joinForm'), jnote = $('#joinNote');
jform.addEventListener('submit', async e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(jform));
  if (d._gotcha) return;
  const say = (m, ok) => { jnote.className = 'form-note ' + (ok ? 'ok' : 'err'); jnote.textContent = m; };
  const photo = jform.photoFile.files[0], cv = jform.cv.files[0], imgs = [...jform.images.files];
  if (!clean(d.name)) return say('Please enter your full name.');
  if (clean(d.phone).replace(/\D/g, '').length < 10) return say('Please enter a valid WhatsApp number.');
  if (!d.role) return say('Please choose the role you want.');
  if (clean(d.about).length < 5) return say('Please write a short bio about yourself.');
  if (photo && (!IMG.includes(photo.type) || photo.size > MB(3))) return say('Your photo must be a JPG, PNG or WebP image under 3 MB.');
  if (cv && (!DOC.includes(cv.type) || cv.size > MB(5))) return say('Your CV must be a PDF or Word file under 5 MB.');
  if (imgs.length > 3) return say('Please choose at most 3 other images.');
  if (imgs.some(f => !IMG.includes(f.type) || f.size > MB(3))) return say('Other images must be JPG, PNG or WebP, each under 3 MB.');
  if (!d.consent) return say('Please tick the box to agree.');
  if (!SB) return say('Applications are not open yet. Please try again soon.');
  const btn = $('button[type=submit]', jform); btn.disabled = true;
  const id = crypto.randomUUID();
  try {
    const row = { id, name: clean(d.name), phone: clean(d.phone), city: clean(d.city) || null, role: d.role, skills: clean(d.skills) || null, link: safeUrl(clean(d.link)) || null, about: clean(d.about), image_paths: [] };
    if (photo) { say('Uploading your photo…', true); row.photo_path = await upload('team-photos', `${id}/photo.${EXT[photo.type]}`, photo); }
    if (cv) { say('Uploading your CV…', true); row.cv_path = await upload('applicant-files', `${id}/cv.${EXT[cv.type]}`, cv); }
    for (let i = 0; i < imgs.length; i++) { say(`Uploading image ${i + 1} of ${imgs.length}…`, true); row.image_paths.push(await upload('applicant-files', `${id}/image-${i + 1}.${EXT[imgs[i].type]}`, imgs[i])); }
    say('Submitting…', true);
    const r = await fetch(`${SB.url}/rest/v1/applications`, { method: 'POST', headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify(row) });
    if (!r.ok) throw new Error('insert');
    jform.reset(); say('Application received. I will review it and, if approved, your card will appear on this page.', true);
  } catch { say('Could not submit right now. Please check your files and try again in a moment.'); }
  btn.disabled = false;
});

/* ----- Team: approved members only (section stays hidden if none) ----- */
(async function loadTeam() {
  if (!SB) return;
  try {
    const list = await sbGet('applications?select=id,name,role,city,skills,link,photo_path,about,approved_at&status=eq.approved&order=approved_at.asc');
    if (!Array.isArray(list) || !list.length) return;
    $('#teamGrid').innerHTML = list.map((m, i) => {
      const link = safeUrl(m.link), skills = String(m.skills || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 8);
      const joined = m.approved_at ? new Date(m.approved_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
      return `<article class="member reveal" id="team-${i}" style="--d:${(i % 3) * .08}s">
        <div class="avatar">${m.photo_path ? `<img src="${esc(pubUrl('team-photos', m.photo_path))}" alt="${esc(m.name)}" loading="lazy">` : esc(initials(m.name))}</div>
        <div><h3>${esc(m.name)}</h3><span class="role">${esc(m.role)}</span></div>
        ${m.about ? `<p>${esc(m.about)}</p>` : ''}
        ${skills.length ? `<div class="skills">${skills.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="meta">${m.city ? `<span>📍 ${esc(m.city)}</span>` : ''}${joined ? `<span>Joined ${esc(joined)}</span>` : ''}</div>
        ${link ? `<a class="visit" href="${esc(link)}" target="_blank" rel="noopener">View profile ↗</a>` : ''}
      </article>`;
    }).join('');
    $('#team').hidden = false; $$('[data-nav-team]').forEach(a => a.hidden = false);
    watch($('#team')); onScroll();
  } catch { /* service unreachable: Team section simply stays hidden */ }
})();

/* ----- At a glance: summaries + "View all" popups (admin-editable, built-in fallback) ----- */
const GLANCE_DEFAULT = [
  ...['Google Business Profile management', 'Local SEO', 'Website building', 'Reels editing & content', 'Graphics & brand designing', 'Advanced review management', 'Social media management (SMM)'].map(label => ({ category: 'skills', label })),
  ...['Adv. Python', 'HTML/CSS'].map(label => ({ category: 'languages', grp: 'learned', label })),
  ...['GBP Tools', 'Google Sites', 'Google Studio', 'Adobe Photoshop', 'Claude & AI tools', 'VS Code', 'Google Analytics', 'Meta Analytics'].map(label => ({ category: 'tools', label })),
  ...['Set up and manage a Google Business Profile', 'Help nearby customers find you on Google & Maps', 'Fast business website with call & WhatsApp buttons', 'Instagram reels for food, fitness & events', 'Logo, graphics and visual identity', 'Review replies, monitoring & an advanced review management system'].map(label => ({ category: 'usecases', label }))
];
const GLANCE_TITLE = { skills: 'All skills', languages: 'Languages & tech', tools: 'Tools I use', usecases: 'Use cases' };
let glance = GLANCE_DEFAULT;
function drawGlanceSummaries() {
  ['skills', 'languages', 'tools', 'usecases'].forEach(cat => {
    const items = glance.filter(i => i.category === cat), el = $(`[data-sum="${cat}"]`);
    if (!el) return;
    const shown = (cat === 'languages' ? items.filter(i => i.grp === 'learned') : items).slice(0, cat === 'usecases' ? 1 : 3).map(i => i.label);
    const more = items.length - shown.length;
    el.textContent = shown.length ? shown.join(' · ') + (more > 0 ? ` +${more}` : '') : '—';
  });
}
drawGlanceSummaries();
(async () => { if (!SB) return; try { const rows = await sbGet('glance_items?select=category,grp,label&order=sort.asc,created_at.asc'); if (Array.isArray(rows) && rows.length) { glance = rows; drawGlanceSummaries(); } } catch { /* keep fallback */ } })();

const dlg = $('#glanceDialog');
$$('.more').forEach(b => b.addEventListener('click', () => {
  const cat = b.dataset.open, items = glance.filter(i => i.category === cat);
  $('#gdTitle').textContent = GLANCE_TITLE[cat];
  const tags = a => a.length ? `<div class="tags">${a.map(i => `<span>${esc(i.label)}</span>`).join('')}</div>` : '<p class="gd-empty">Nothing added yet.</p>';
  $('#gdBody').innerHTML = cat === 'languages'
    ? [['learned', 'Learned'], ['learning', 'Learning']].map(([g, t]) => { const x = items.filter(i => i.grp === g); return x.length ? `<h4>${t}</h4>${tags(x)}` : ''; }).join('') || '<p class="gd-empty">Nothing added yet.</p>'
    : cat === 'usecases'
      ? (items.length ? `<ul class="gd-list">${items.map(i => `<li>${esc(i.label)}</li>`).join('')}</ul>` : '<p class="gd-empty">Nothing added yet.</p>')
      : tags(items);
  dlg.showModal();
  if (curEl) dlg.appendChild(curEl);   // the popup lives in the browser's top layer, so the cursor must live inside it too
}));
$('#gdClose').addEventListener('click', () => dlg.close());
dlg.addEventListener('close', () => { if (curEl) document.body.appendChild(curEl); });
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // click outside closes

/* ----- Brand collaboration: logo wall (only brands that have a logo; hidden if none) ----- */
(async () => {
  if (!SB) return;
  try {
    const rows = await sbGet('brands?select=name,category,url,logo_path&visible=eq.true&logo_path=not.is.null&order=sort.asc,created_at.asc');
    const list = Array.isArray(rows) ? rows.filter(b => b.logo_path) : [];
    if (!list.length) return;
    $('#brandWall').innerHTML = list.map(b => {
      const url = safeUrl(b.url), tag = url ? 'a' : 'div', attrs = url ? ` href="${esc(url)}" target="_blank" rel="noopener"` : '';
      return `<${tag} class="bw reveal"${attrs}>
        <div class="logo"><img src="${esc(pubUrl('brand-logos', b.logo_path))}" alt="${esc(b.name)} logo" loading="lazy"></div>
        <b>${esc(b.name)}</b>${b.category ? `<span>${esc(b.category)}</span>` : ''}
      </${tag}>`;
    }).join('');
    $('#brandWallBox').hidden = false; watch($('#brandWallBox')); onScroll();
  } catch { /* wall stays hidden */ }
})();

/* ----- Brand enquiry: opens WhatsApp right away AND saves a copy in the admin inbox ----- */
const bform = $('#brandForm'), bnote = $('#brandNote');
bform.addEventListener('submit', e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(bform));
  if (d._gotcha) return;
  const say = (m, ok) => { bnote.className = 'form-note ' + (ok ? 'ok' : 'err'); bnote.textContent = m; };
  if (clean(d.brand).length < 2) return say('Please enter your brand name.');
  if (clean(d.contact).length < 2) return say('Please enter the contact person’s name.');
  if (clean(d.phone).replace(/\D/g, '').length < 10) return say('Please enter a valid WhatsApp number.');
  if (!d.collab) return say('Please choose the collaboration you want.');
  if (clean(d.message).length < 5) return say('Please write a short message.');
  const link = clean(d.link);
  if (link && !safeUrl(link)) return say('The link must start with https://');
  if (!C.whatsapp && !SB) return say('Enquiries are not open yet. Please try again soon.');

  const text = `*Brand collaboration enquiry: WebVerse*\nBrand: ${clean(d.brand)}\nContact: ${clean(d.contact)}\nWhatsApp: ${clean(d.phone)}${d.btype ? '\nType: ' + d.btype : ''}${d.stage ? '\nStage: ' + d.stage : ''}\nCollaboration: ${d.collab}${d.budget ? '\nBudget: ' + clean(d.budget) : ''}${link ? '\nLink: ' + link : ''}\n\n${clean(d.message)}`;
  // 1) open WhatsApp immediately (must happen inside the click so browsers do not block it)
  let opened = false;
  if (C.whatsapp) { const w = window.open(wa(text), '_blank'); if (w) { w.opener = null; opened = true; } }
  // 2) save a copy in the admin inbox (keepalive lets it finish even if the page is left)
  const saved = SB ? fetch(`${SB.url}/rest/v1/brand_enquiries`, {
    method: 'POST', keepalive: true, headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ brand_name: clean(d.brand), contact_name: clean(d.contact), phone: clean(d.phone), brand_type: d.btype || null, stage: d.stage || null,
      collab_type: d.collab, budget: clean(d.budget) || null, link: link || null, message: clean(d.message) })
  }).then(r => r.ok).catch(() => false) : Promise.resolve(false);
  say(opened ? 'Opening WhatsApp. Press Send there to deliver your message.' : 'Sending…', true);
  saved.then(ok => {
    if (!opened && C.whatsapp) { location.href = wa(text); return; }   // popup blocked: continue in this tab
    if (ok) { bform.reset(); say(opened ? 'Opening WhatsApp. Press Send there to deliver your message. A copy is also saved in my inbox.' : 'Enquiry received. I will get back to you soon.', true); }
    else if (opened) { bform.reset(); say('Opening WhatsApp. Press Send there to deliver your message.', true); }
    else say('Could not send right now. Please try again in a moment.');
  });
});

/* ======================= WEBVERSE07 ======================= */

/* ----- File fields: choose, preview and REMOVE (single or multiple) ----- */
const fmtSize = b => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
function initFileField(label) {
  const input = $('input[type=file]', label), multi = input.multiple, max = multi ? 3 : 1;
  const isDoc = /pdf/i.test(input.accept), okTypes = isDoc ? DOC : IMG, maxBytes = MB(isDoc ? 5 : 3);
  const text = [...label.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const wrap = document.createElement('div'); wrap.className = 'filebox';
  const cap = Object.assign(document.createElement('span'), { textContent: text, id: 'fb-' + Math.random().toString(36).slice(2, 8) });
  const pick = Object.assign(document.createElement('button'), { type: 'button', className: 'pick' });
  const list = Object.assign(document.createElement('div'), { className: 'fl' }); list.setAttribute('aria-live', 'polite');
  const err = Object.assign(document.createElement('div'), { className: 'ferr' }); err.setAttribute('role', 'alert');
  pick.setAttribute('aria-describedby', cap.id);
  label.replaceWith(wrap); wrap.append(cap, pick, list, err, input); input.tabIndex = -1; input.setAttribute('aria-hidden', 'true');
  let files = [], urls = [];
  const sync = () => { const dt = new DataTransfer(); files.forEach(f => dt.items.add(f)); input.files = dt.files; };
  function render() {
    urls.forEach(u => URL.revokeObjectURL(u)); urls = []; list.replaceChildren();
    files.forEach((f, i) => {
      const it = document.createElement('div'); it.className = 'fitem';
      if (f.type.startsWith('image/')) { const u = URL.createObjectURL(f); urls.push(u); it.append(Object.assign(document.createElement('img'), { src: u, alt: '' })); }
      else it.append(Object.assign(document.createElement('span'), { className: 'fdoc', textContent: (f.name.split('.').pop() || 'file').slice(0, 4).toUpperCase() }));
      const rm = Object.assign(document.createElement('button'), { type: 'button', className: 'frm', textContent: '✕' });
      rm.setAttribute('aria-label', 'Remove file ' + f.name);
      rm.addEventListener('click', () => { files.splice(i, 1); sync(); err.textContent = ''; render(); pick.focus(); });
      it.append(Object.assign(document.createElement('span'), { className: 'fn', textContent: f.name }), Object.assign(document.createElement('span'), { className: 'fs', textContent: fmtSize(f.size) }), rm);
      list.append(it);
    });
    pick.textContent = !files.length ? (multi ? 'Choose images' : 'Choose file') : multi ? (files.length >= max ? `Maximum ${max} images` : 'Add another image') : 'Replace file';
    pick.disabled = multi && files.length >= max;
  }
  pick.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const picks = [...input.files]; err.textContent = ''; const bad = [];
    const good = picks.filter(f => { if (!okTypes.includes(f.type)) { bad.push(`${f.name}: wrong file type`); return false; } if (f.size > maxBytes) { bad.push(`${f.name}: bigger than ${isDoc ? 5 : 3} MB`); return false; } return true; });
    if (multi) { const room = max - files.length; if (good.length > room) bad.push(`Only ${max} images are allowed`); files = files.concat(good.slice(0, room)); }
    else if (good.length) files = [good[0]];
    if (bad.length) err.textContent = bad.join('. ') + '.';
    sync(); render();
  });
  const form = input.form; if (form) form.addEventListener('reset', () => setTimeout(() => { files = []; sync(); err.textContent = ''; render(); }, 0));
  render();
}
$$('#joinForm .filebox').forEach(initFileField);

/* ----- Join my team: role cards + Part 2 unlocks after Part 1 ----- */
const jp1 = $('#jp1'), jp2 = $('#jp2'), unlockHint = $('#unlockHint');
let part2Open = false;
const part1Ok = () => clean(jform.name.value).length >= 2 && clean(jform.phone.value).replace(/\D/g, '').length >= 10 && !!jform.role.value;
function setPart2(open, animate) {
  part2Open = open; jp2.disabled = !open; jp2.classList.toggle('locked', !open); jp1.classList.toggle('p1done', open);
  unlockHint.textContent = open ? 'Part 1 done. Part 2 is unlocked.' : 'Fill name, WhatsApp number and role to unlock Part 2.';
  if (open && animate) { jp2.classList.add('unlocking'); setTimeout(() => jp2.classList.remove('unlocking'), 950); }
}
const checkPart1 = () => { if (!part2Open && part1Ok()) setPart2(true, true); };
jp1.addEventListener('input', checkPart1); jp1.addEventListener('change', checkPart1);
jform.addEventListener('reset', () => setTimeout(() => { setPart2(false); markRole(); }, 0));
const roleBtns = $$('#roles .role');
const markRole = () => roleBtns.forEach(b => b.classList.toggle('sel', b.dataset.role === jform.role.value));
roleBtns.forEach(b => b.addEventListener('click', () => {
  jform.role.value = b.dataset.role; markRole(); checkPart1();
  jform.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => (clean(jform.name.value) ? jform.phone : jform.name).focus({ preventScroll: true }), 450);
}));
jform.role.addEventListener('change', markRole);

/* ----- Contact: quick-pick chips stay in sync with "Interested in" ----- */
const leadSel = $('#leadForm select[name=package]'), qchips = $$('#qchips button');
const syncChips = () => qchips.forEach(b => { const on = b.dataset.interest === leadSel.value; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
qchips.forEach(b => b.addEventListener('click', () => { leadSel.value = b.dataset.interest; syncChips(); }));
leadSel.addEventListener('change', syncChips);
$$('[data-pick]').forEach(b => b.addEventListener('click', () => setTimeout(syncChips, 0)));
syncChips();

/* ----- Creators: WhatsApp right away + copy saved in the admin inbox ----- */
const cform = $('#creatorForm'), cnote = $('#creatorNote');
cform.addEventListener('submit', e => {
  e.preventDefault(); const d = Object.fromEntries(new FormData(cform));
  if (d._gotcha) return;
  const say = (m, ok) => { cnote.className = 'form-note ' + (ok ? 'ok' : 'err'); cnote.textContent = m; };
  if (clean(d.name).length < 2) return say('Please enter your name.');
  if (clean(d.phone).replace(/\D/g, '').length < 10) return say('Please enter a valid WhatsApp number.');
  if (!d.platform) return say('Please choose your main platform.');
  if (!safeUrl(clean(d.link))) return say('Please add your profile link (it must start with https://).');
  if (clean(d.message).length < 5) return say('Please write a few lines about yourself.');
  if (!C.whatsapp && !SB) return say('Applications are not open yet. Please try again soon.');
  const text = `*Creator application: WebVerse*\nName: ${clean(d.name)}\nWhatsApp: ${clean(d.phone)}\nPlatform: ${d.platform}\nProfile: ${clean(d.link)}${d.niche ? '\nNiche: ' + clean(d.niche) : ''}${d.experience ? '\nExperience: ' + d.experience : ''}${d.followers ? '\nFollowers: ' + clean(d.followers) : ''}${d.city ? '\nCity: ' + clean(d.city) : ''}\n\n${clean(d.message)}`;
  let opened = false;
  if (C.whatsapp) { const w = window.open(wa(text), '_blank'); if (w) { w.opener = null; opened = true; } }
  const saved = SB ? fetch(`${SB.url}/rest/v1/creator_applications`, {
    method: 'POST', keepalive: true, headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ name: clean(d.name), phone: clean(d.phone), city: clean(d.city) || null, platform: d.platform, profile_link: clean(d.link), niche: clean(d.niche) || null, experience: d.experience || null, followers: clean(d.followers) || null, message: clean(d.message) })
  }).then(r => r.ok).catch(() => false) : Promise.resolve(false);
  say(opened ? 'Opening WhatsApp. Press Send there to deliver your message.' : 'Sending…', true);
  saved.then(ok => {
    if (!opened && C.whatsapp) { location.href = wa(text); return; }
    if (ok) { cform.reset(); say(opened ? 'Opening WhatsApp. Press Send there to deliver your message. A copy is also saved in my inbox.' : 'Application received. I will get back to you soon.', true); }
    else if (opened) { cform.reset(); say('Opening WhatsApp. Press Send there to deliver your message.', true); }
    else say('Could not send right now. Please try again in a moment.');
  });
});

/* ----- Work: real photos / short videos (from admin) in a hover popup ----- */
const MEDIA = {};
const pop = document.createElement('div'); pop.id = 'mediaPop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Business preview'); pop.setAttribute('aria-hidden', 'true');
pop.innerHTML = '<div class="mp-stage"></div><div class="mp-bar"><span class="mp-cap"></span><span class="mp-dots"></span><button type="button" class="mp-x" aria-label="Close preview">✕</button></div>';
document.body.appendChild(pop);
const mpStage = $('.mp-stage', pop), mpCap = $('.mp-cap', pop), mpDots = $('.mp-dots', pop);
let popFor = null, popTimer = 0;
function showItem(it) {
  mpStage.replaceChildren();
  if (it.kind === 'video') { const v = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, autoplay: true, controls: false }); v.setAttribute('muted', ''); v.src = it.url; mpStage.append(v); v.play().catch(() => {}); }
  else mpStage.append(Object.assign(document.createElement('img'), { src: it.url, alt: popFor ? popFor.dataset.name : '' }));
}
function openPop(card, centered) {
  const m = MEDIA[card.dataset.name]; if (!m) return; clearTimeout(popTimer); popFor = card;
  const items = [...m.videos, ...m.images]; mpCap.textContent = card.dataset.name; mpDots.replaceChildren();
  if (items.length > 1) items.forEach((it, i) => { const b = Object.assign(document.createElement('button'), { type: 'button' }); b.setAttribute('aria-label', (it.kind === 'video' ? 'Video ' : 'Photo ') + (i + 1)); b.style.backgroundImage = it.kind === 'image' ? `url("${it.url}")` : 'linear-gradient(120deg,#2de38a,#4f8bff)'; if (i === 0) b.classList.add('on'); b.addEventListener('click', () => { $$('button', mpDots).forEach(x => x.classList.toggle('on', x === b)); showItem(it); }); mpDots.append(b); });
  showItem(items[0]);
  const r = card.getBoundingClientRect(), w = Math.min(340, innerWidth - 24), h = w * 1.25 + 56;
  let x, y;
  if (centered || innerWidth < 760) { x = (innerWidth - w) / 2; y = Math.max(12, (innerHeight - h) / 2); }
  else { x = r.right + 14 + w < innerWidth ? r.right + 14 : Math.max(12, r.left - w - 14); y = Math.min(Math.max(12, r.top + r.height / 2 - h / 2), innerHeight - h - 12); }
  pop.style.left = x + 'px'; pop.style.top = y + 'px'; pop.classList.add('show'); pop.setAttribute('aria-hidden', 'false');
}
function closePop() {
  clearTimeout(popTimer); popFor = null; pop.classList.remove('show'); pop.setAttribute('aria-hidden', 'true');
  const v = $('video', mpStage); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } mpStage.replaceChildren();   // video only downloads while the popup is open
}
const closeSoon = () => { clearTimeout(popTimer); popTimer = setTimeout(closePop, 180); };
pop.addEventListener('mouseenter', () => clearTimeout(popTimer)); pop.addEventListener('mouseleave', closeSoon);
$('.mp-x', pop).addEventListener('click', closePop);
addEventListener('keydown', e => { if (e.key === 'Escape' && popFor) closePop(); });
document.addEventListener('click', e => { if (popFor && !pop.contains(e.target) && !e.target.closest('.mbadge')) closePop(); });
function applyMedia() {
  $$('.proj', grid).forEach(card => {
    const m = MEDIA[card.dataset.name]; if (!m || card.classList.contains('has-media')) return;
    card.classList.add('has-media');
    if (m.images[0]) { const t = $('.thumb', card); t.classList.add('has-img'); t.style.backgroundImage = `url("${m.images[0].url}")`; }
    const badge = Object.assign(document.createElement('button'), { type: 'button', className: 'mbadge', textContent: m.videos.length ? '▶ Preview' : '▣ Photos' });
    badge.setAttribute('aria-label', 'Preview ' + card.dataset.name); card.append(badge);
    badge.addEventListener('click', e => { e.stopPropagation(); popFor === card ? closePop() : openPop(card, !fine); });
    badge.addEventListener('focus', () => openPop(card));
    if (fine) { card.addEventListener('mouseenter', () => { clearTimeout(popTimer); popTimer = setTimeout(() => openPop(card), 140); }); card.addEventListener('mouseleave', closeSoon); }
  });
}
(async () => {
  if (!SB) return;
  try {
    const rows = await sbGet('project_media?select=project,kind,path&order=sort.asc,created_at.asc');
    (rows || []).forEach(r => { const m = MEDIA[r.project] || (MEDIA[r.project] = { images: [], videos: [] }); (r.kind === 'video' ? m.videos : m.images).push({ kind: r.kind, url: pubUrl('work-media', r.path) }); });
    applyMedia();
  } catch { /* no media: cards keep their initials */ }
})();

/* ----- Generic quick-pick chips: a row of chips that sets (and follows) a <select> ----- */
$$('.qchips[data-target]').forEach(box => {
  const sel = $(box.dataset.target); if (!sel) return;
  const btns = $$('button', box);
  const sync = () => btns.forEach(b => { const on = b.dataset.value === sel.value; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  btns.forEach(b => b.addEventListener('click', () => { sel.value = b.dataset.value; sel.dispatchEvent(new Event('change', { bubbles: true })); sync(); }));
  sel.addEventListener('change', sync); sel.form.addEventListener('reset', () => setTimeout(sync, 0)); sync();
});
