import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

async function renderRacesList(container) {
    container.innerHTML = await loadTemplate('races');
    try {
        const response = await fetch(BACKEND_URL + '/races/search');
        const races = await response.json();

        const tbody = document.querySelector('#races-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(races) || races.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No races found</td></tr>';
            return;
        }

        races.forEach(r => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(r.source, r.page);
            row.innerHTML = `
        <td><a href="/races/${r.name}" data-link>${r.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#races-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading races</td></tr>';
        }
    }
}

async function renderRaceDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="race-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/races/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('race-detail');

        // Load race detail card template and replace tokens
        const tpl = await loadTemplate('race-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading race:', e);
        const el = document.getElementById('race-detail');
        if (el) el.textContent = 'Error loading race';
    }
}

export { renderRacesList, renderRaceDetail };