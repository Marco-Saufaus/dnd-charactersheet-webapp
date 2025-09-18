import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

async function renderBackgroundsList(container) {
    container.innerHTML = await loadTemplate('backgrounds');
    try {
        const response = await fetch(BACKEND_URL + '/backgrounds/search');
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
        <td><a href="/backgrounds/${b.name}" data-link>${b.name ?? ''}</a></td>
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
        const res = await fetch(BACKEND_URL + `/backgrounds/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('background-detail');

        // Load background detail card template and replace tokens
        const tpl = await loadTemplate('background-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading background:', e);
        const el = document.getElementById('background-detail');
        if (el) el.textContent = 'Error loading background';
    }
}

export { renderBackgroundsList, renderBackgroundDetail };