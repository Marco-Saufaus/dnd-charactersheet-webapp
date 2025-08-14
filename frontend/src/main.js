import './style.css'

// Simple template loader with caching
const templateCache = new Map();
async function loadTemplate(path) {
  if (templateCache.has(path)) return templateCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load template ${path}`);
  const html = await res.text();
  templateCache.set(path, html);
  return html;
}

// Simple client-side router
function router() {
  const path = window.location.pathname;
  const container = document.getElementById('route-container');
  container.innerHTML = '';

  if (path === '/' || path === '/index.html') {
    // Home page: leave blank or add a placeholder if desired
  } else if (path === '/characters') {
    renderCharacterList(container);
  } else if (path === '/search') {
    renderSearchCategoryList(container);
  } else if (path === '/search/actions') {
    renderActionsList(container);
  } else if (path.startsWith('/actions/')) {
    renderActionDetail(container);
  } else if (path === '/search/backgrounds') {
    renderBackgroundsList(container);
  } else if (path.startsWith('/backgrounds/')) {
    renderBackgroundDetail(container);
  } else if (path === '/settings') {
    container.innerHTML = '<p>Settings page coming soon.</p>';
  } else {
    container.innerHTML = '<p>Page not found.</p>';
  }
}

// Render character list table
async function renderCharacterList(container) {
  container.innerHTML = await loadTemplate('/src/templates/characters.html');
  await fetchCharacters();
}

// Render actions list table
async function renderActionsList(container) {
  container.innerHTML = await loadTemplate('/src/templates/actions.html');
  await fetchActions();
}

async function renderBackgroundsList(container) {
  container.innerHTML = await loadTemplate('/src/templates/backgrounds.html');
  await fetchBackgrounds();
}

async function renderSearchCategoryList(container) {
  container.innerHTML = await loadTemplate('/src/templates/search-categories.html');
}

// Fetch and display characters
async function fetchCharacters() {
  try {
    const response = await fetch('http://localhost:8000/characters/');
    const characters = await response.json();

    const tbody = document.querySelector('#characters-table tbody');
    tbody.innerHTML = '';

    if (characters.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="4">No characters found</td>';
      tbody.appendChild(row);
      return;
    }

    characters.forEach(character => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${character.name}</td>
        <td>${character.race}</td>
        <td>${character.character_class}</td>
        <td>${character.level}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    const tbody = document.querySelector('#characters-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4">Error loading characters</td></tr>';
    }
  }
}

// Handle navigation without full page reload
document.addEventListener('click', (e) => {
  if (e.target.matches('a[data-link]')) {
    e.preventDefault();
    window.history.pushState(null, '', e.target.href);
    router();
  }
});

// Handle browser navigation (back/forward)
window.addEventListener('popstate', router);

// Initial route
router();

// Fetch and display actions (simple list, no search)
async function fetchActions() {
  try {
    const response = await fetch('http://localhost:8000/search/actions');
    const actions = await response.json();

    const tbody = document.querySelector('#actions-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!Array.isArray(actions) || actions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No actions found</td></tr>';
      return;
    }

    actions.forEach(a => {
      const row = document.createElement('tr');
      const src = formatSourceWithPage(a.source, a.page);
      row.innerHTML = `
        <td><a href="/actions/${a._id}" data-link>${a.name ?? ''}</a></td>
        <td>${src}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    const tbody = document.querySelector('#actions-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="2">Error loading actions</td></tr>';
    }
  }
}

async function fetchBackgrounds() {
  try {
    const response = await fetch('http://localhost:8000/search/backgrounds');
    const backgrounds = await response.json();

    const tbody = document.querySelector('#backgrounds-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!Array.isArray(backgrounds) || backgrounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No backgrounds found</td></tr>';
      return;
    }

    backgrounds.forEach(b => {
      const row = document.createElement('tr');
      const src = formatSourceWithPage(b.source, b.page);
      row.innerHTML = `
        <td><a href="/backgrounds/${b._id}" data-link>${b.name ?? ''}</a></td>
        <td>${src}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    const tbody = document.querySelector('#backgrounds-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="2">Error loading backgrounds</td></tr>';
    }
  }
}

// Render single action details page
async function renderActionDetail(container) {
  const id = window.location.pathname.split('/').pop();
  container.innerHTML = `
    <div id="action-detail">Loading…</div>
  `;
  try {
    const res = await fetch(`http://localhost:8000/actions/${id}`);
    if (!res.ok) throw new Error('Not found');
    const item = await res.json();
    const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
    const el = document.getElementById('action-detail');

    // Load detail card template and replace tokens
    const tpl = await loadTemplate('/src/templates/action-detail.html');
    const html = tpl
      .replace('{{NAME}}', escapeHtml(item.name ?? ''))
      .replace('{{TIME}}', escapeHtml(formatTime(item.time)) || '—')
      .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? item.desc ?? item.description ?? []) || '<em>No description</em>')
      .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
    el.innerHTML = html;

  } catch (e) {
    console.error('Error loading action:', e);
    const el = document.getElementById('action-detail');
    if (el) el.textContent = 'Error loading action';
  }
}

// Render single background details page
async function renderBackgroundDetail(container) {
  const id = window.location.pathname.split('/').pop();
  container.innerHTML = `
    <div id="background-detail">Loading…</div>
  `;
  try {
    const res = await fetch(`http://localhost:8000/backgrounds/${id}`);
    if (!res.ok) throw new Error('Not found');
    const item = await res.json();
    const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
    const el = document.getElementById('background-detail');

    // Load background detail card template and replace tokens
    const tpl = await loadTemplate('/src/templates/background-detail.html');
    const html = tpl
      .replace('{{NAME}}', escapeHtml(item.name ?? ''))
      .replace('{{TIME}}', escapeHtml(formatTime(item.time)) || '—')
      .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? item.desc ?? item.description ?? []) || '<em>No description</em>')
      .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
    el.innerHTML = html;
    
  } catch (e) {
    console.error('Error loading background:', e);
    const el = document.getElementById('background-detail');
    if (el) el.textContent = 'Error loading background';
  }
}

// Minimal HTML escaper for pre/dynamic inserts
function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

// Format common 5eTools-style time fields
function formatTime(time) {
  if (!time) return '';
  if (typeof time === 'string') return time;
  const fmt = (t) => {
    if (!t || typeof t !== 'object') return '';
    const n = t.number ?? t.amount ?? '';
    // Units can be e.g., 'action', 'bonus', 'reaction', 'minute'
    const u = t.unit ?? t.type ?? '';
    const base = [n, u].filter(Boolean).join(' ');
    // Some entries might have 'condition' or 'reactionTrigger'
    const extra = t.condition ? ` (${t.condition})` : (t.reactionTrigger ? ` (${t.reactionTrigger})` : '');
    return `${base}${extra}`.trim();
  };
  if (Array.isArray(time)) return time.map(fmt).filter(Boolean).join(', ');
  return fmt(time);
}

// Add a shared formatter for displaying source and page together.
// 'XPHB' is normalized to 'PHB24' to match your display convention.
function normalizeSource(src) {
  return src === 'XPHB' ? 'PHB24' : (src ?? '');
}
function formatSourceWithPage(source, page) {
  const s = normalizeSource(source);
  const hasPage = page !== undefined && page !== null && page !== '';
  if (s && hasPage) return `${s} p.${page}`;
  if (s) return s;
  if (hasPage) return `p.${page}`;
  return '';
}

// Render simple description from 5eTools-style entries arrays
function renderEntries(entries) {
  if (!entries) return '';
  if (typeof entries === 'string') return `<p>${escapeHtml(entries)}</p>`;
  if (!Array.isArray(entries)) return '';

  const render = (it) => {
    if (it == null) return '';
    if (typeof it === 'string') return `<p>${escapeHtml(it)}</p>`;
    if (Array.isArray(it)) return it.map(render).join('');
    if (typeof it !== 'object') return '';

    // Named + nested entries
    if (it.entries) {
      const name = it.name ? `<p><strong>${escapeHtml(it.name)}</strong></p>` : '';
      return `${name}${render(it.entries)}`;
    }

    // List type
    if (it.type === 'list' && Array.isArray(it.items)) {
      return `<ul>${it.items.map(li => `<li>${escapeHtml(typeof li === 'string' ? li : (li?.entry ?? li?.name ?? JSON.stringify(li)))}</li>`).join('')}</ul>`;
    }

    // Table or other complex types can be added later
    return '';
  };

  return entries.map(render).join('');
}
