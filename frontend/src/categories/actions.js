import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

async function renderActionsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/actions.html');
    try {
        const response = await fetch('http://localhost:8000/actions/search');
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
        <td><a href="/actions/${a.name}" data-link>${a.name ?? ''}</a></td>
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading action:', e);
        const el = document.getElementById('action-detail');
        if (el) el.textContent = 'Error loading action';
    }
}

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

export { renderActionsList, renderActionDetail };