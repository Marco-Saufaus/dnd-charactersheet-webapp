import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

async function renderConditionsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/conditions.html');
    try {
        const response = await fetch('http://localhost:8000/conditions/search');
        const conditions = await response.json();

        const tbody = document.querySelector('#conditions-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(conditions) || conditions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No conditions found</td></tr>';
            return;
        }

        conditions.forEach(c => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(c.source, c.page);
            row.innerHTML = `
        <td><a href="/conditions/${c.name}" data-link>${c.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#conditions-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading conditions</td></tr>';
        }
    }
}

async function renderConditionDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="condition-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/conditions/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('condition-detail');

        // Load condition detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/condition-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading condition:', e);
        const el = document.getElementById('condition-detail');
        if (el) el.textContent = 'Error loading condition';
    }
}

export { renderConditionsList, renderConditionDetail };