import './style.css'

// ---------------------------
// Routing
// ---------------------------

// Simple client-side router
function router() {
    const path = window.location.pathname;
    const container = document.getElementById('route-container');
    container.innerHTML = '';

    if (path === '/' || path === '/index.html') {
        // Home page
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

    } else if (path === '/search/conditions') {
        // renderConditionsList(container);
        container.innerHTML = '<p>Condition search (todo)</p>';
    } else if (path.startsWith('/conditions/')) {
        // renderConditionDetail(container);
        container.innerHTML = '<p>Condition detail (todo)</p>';

    } else if (path === '/search/feats') {
        renderFeatsList(container);
    } else if (path.startsWith('/feats/')) {
        renderFeatDetail(container);

    } else if (path === '/search/items') {
        renderItemsList(container);
    } else if (path.startsWith('/items/')) {
        container.innerHTML = '<p>Item detail (todo)</p>';

    } else if (path.startsWith('/spells/')) {
        container.innerHTML = '<p>Spell detail (todo)</p>';

    } else {
        container.innerHTML = '<p>Page not found.</p>';
    }
}

async function renderSearchCategoryList(container) {
    container.innerHTML = await loadTemplate('/src/templates/search-categories.html');
}

// ---------------------------
// Characters
// ---------------------------

async function renderCharacterList(container) {
    container.innerHTML = await loadTemplate('/src/templates/characters.html');
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

// ---------------------------
// Actions
// ---------------------------

async function renderActionsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/actions.html');
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
            .replace('{{TIME}}', escapeHtml(formatActionTime(item.time)) || '—')
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading action:', e);
        const el = document.getElementById('action-detail');
        if (el) el.textContent = 'Error loading action';
    }
}

// ---------------------------
// Backgrounds
// ---------------------------

async function renderBackgroundsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/backgrounds.html');
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading background:', e);
        const el = document.getElementById('background-detail');
        if (el) el.textContent = 'Error loading background';
    }
}

// ---------------------------
// Feats
// ---------------------------

async function renderFeatsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/feats.html');
    try {
        const response = await fetch('http://localhost:8000/search/feats');
        const feats = await response.json();

        const tables = {
            origin: document.querySelector('#origin-feats-table tbody'),
            general: document.querySelector('#general-feats-table tbody'),
            fightingStyle: document.querySelector('#fighting-styles-table tbody'),
            epicBoon: document.querySelector('#epic-boons-table tbody'),
        };

        if (Object.values(tables).some(t => !t)) return;
        Object.values(tables).forEach(t => t.innerHTML = '');

        if (!Array.isArray(feats) || feats.length === 0) {
            Object.values(tables).forEach(t => {
                t.innerHTML = '<tr><td colspan="2">No feats found</td></tr>';
            });
            return;
        }

        feats.forEach(f => {
            const categoryKey = resolveFeatCategory(f); // maps to one of the keys in tables
            const tbody = tables[categoryKey] ?? tables.general; // default fallback
            const row = document.createElement('tr');
            const src = formatSourceWithPage(f.source, f.page);
            row.innerHTML = `
        <td><a href="/feats/${f._id}" data-link>${f.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });

        Object.entries(tables).forEach(([key, t]) => {
            if (!t.hasChildNodes()) {
                t.innerHTML = '<tr><td colspan="2">No feats in this category</td></tr>';
            }
        });
    } catch (error) {
        // On error, show message in every table
        ['#origin-feats-table tbody',
         '#general-feats-table tbody',
         '#fighting-styles-table tbody',
         '#epic-boons-table tbody'
        ].forEach(sel => {
            const t = document.querySelector(sel);
            if (t) t.innerHTML = '<tr><td colspan="2">Error loading feats</td></tr>';
        });
    }
}

function resolveFeatCategory(feat) {
    const raw = (feat.category ?? '').toString().trim().toUpperCase();
    switch (raw) {
        case 'O': return 'origin';
        case 'FS': return 'fightingStyle';
        case 'EB': return 'epicBoon';
        case 'G': return 'general';
        default: return 'general';
    }
}

// New: user‑facing label for detail view
function featCategoryLabel(code) {
    const c = (code ?? '').toString().trim().toUpperCase();
    switch (c) {
        case 'O': return 'Origin Feat';
        case 'FS': return 'Fighting Style';
        case 'EB': return 'Epic Boon';
        case 'G': return 'General Feat';
        default: return ''; // unknown / omit
    }
}

async function renderFeatDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="feat-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/feats/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('feat-detail');

        // Load feat detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/feat-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = featCategoryLabel(item.category);
                return label ? `<p class="feat-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading feat:', e);
        const el = document.getElementById('feat-detail');
        if (el) el.textContent = 'Error loading feat';
    }
}

// ---------------------------
// Utility Functions
// ---------------------------

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

// Minimal HTML escaper for pre/dynamic inserts
function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// Format common 5eTools-style time fields
function formatActionTime(time) {
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
    if (typeof entries === 'string') return `<p>${formatInlineRefs(entries)}</p>`;
    if (!Array.isArray(entries)) return '';

    const render = (it) => {
        if (it == null) return '';
        if (typeof it === 'string') return `<p>${formatInlineRefs(it)}</p>`;
        if (Array.isArray(it)) return it.map(render).join('');
        if (typeof it !== 'object') return '';

        if (it.entries) {
            const name = it.name ? `<p><strong>${escapeHtml(it.name)}</strong></p>` : '';
            return `${name}${render(it.entries)}`;
        }

        if (it.type === 'list' && Array.isArray(it.items)) {
            return `<ul class="entry-list">${it.items.map(li => {
                if (typeof li === 'string') return `<li>${formatInlineRefs(li)}</li>`;
                if (!li || typeof li !== 'object') return '';
                const nameHtml = li.name ? `<strong>${escapeHtml(li.name)}</strong>` : '';
                const entryRaw = typeof li.entry === 'string'
                    ? formatInlineRefs(li.entry)
                    : (li.entry != null ? escapeHtml(JSON.stringify(li.entry)) : '');
                const combined = nameHtml && entryRaw ? `${nameHtml} ${entryRaw}` : (nameHtml || entryRaw || '');
                return `<li>${combined}</li>`;
            }).join('')}</ul>`;
        }

        return '';
    };

    return entries.map(render).join('');
}

// Parse 5eTools-style inline refs like {@skill Insight|XPHB}
function formatInlineRefs(str) {
    if (!str || typeof str !== 'string') return '';
    // Regex captures: type, inner content up to closing }
    // We then split inner content by '|' (first segment is display/name)
    const refRegex = /\{@([a-zA-Z]+)\s+([^}]+)}/g;
    return str.replace(refRegex, (_m, typeRaw, inner) => {
        const type = typeRaw.toLowerCase().trim();
        const parts = inner.split('|').map(p => p.trim());
        const display = parts[0] || '';
        const source = parts[1] || '';
        const routeBase = resolveRefRouteBase(type);
        if (!routeBase || !display) {
            return escapeHtml(display || inner); // fallback plain text
        }
        const slug = encodeURIComponent(display);
        return `<a href="/${routeBase}/${slug}" data-link title="${escapeHtml(display)}${source ? ' (' + escapeHtml(source) + ')' : ''}">${escapeHtml(display)}</a>`;
    });
}

function resolveRefRouteBase(type) {
    switch (type) {
        case 'item': return 'items';
        case 'feat': return 'feats';
        case 'spell': return 'spells';
        case 'background': return 'backgrounds';
        case 'action': return 'actions';
        case 'condition': return 'conditions';
        case 'variantrule': return 'variants';
        case 'filter': return 'spells';
        // Add more mappings as needed
        default: return '';
    }
}

// ---------------------------
// Main
// ---------------------------

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
