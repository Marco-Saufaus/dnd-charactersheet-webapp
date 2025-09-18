import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

async function renderSensesList(container) {
    container.innerHTML = await loadTemplate('senses');
    try {
        const response = await fetch(BACKEND_URL + '/senses/search');
        const senses = await response.json();

        const tbody = document.querySelector('#senses-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(senses) || senses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No senses found</td></tr>';
            return;
        }

        senses.forEach(s => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(s.source, s.page);
            row.innerHTML = `
        <td><a href="/senses/${s.name}" data-link>${s.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#senses-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading senses</td></tr>';
        }
    }
}

async function renderSenseDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="sense-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/senses/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('sense-detail');

        // Load sense detail card template and replace tokens
        const tpl = await loadTemplate('sense-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading sense:', e);
        const el = document.getElementById('sense-detail');
        if (el) el.textContent = 'Error loading sense';
    }
}

export { renderSensesList, renderSenseDetail };