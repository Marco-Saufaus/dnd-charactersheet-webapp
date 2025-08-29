import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

async function renderItemMasteriesList(container) {
    container.innerHTML = await loadTemplate('/src/templates/item-masteries.html');
    try {
        const response = await fetch('http://localhost:8000/item-masteries/search');
        const masteries = await response.json();

        const tbody = document.querySelector('#masteries-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(masteries) || masteries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No item masteries found</td></tr>';
            return;
        }

        masteries.forEach(m => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(m.source, m.page);
            row.innerHTML = `
        <td><a href="/item-masteries/${encodeURIComponent(m.name)}" data-link>${m.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#masteries-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading item masteries</td></tr>';
        }
    }
}

async function renderItemMasteryDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="item-mastery-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/item-masteries/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('item-mastery-detail');

        const tpl = await loadTemplate('/src/templates/item-mastery-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item mastery:', e);
        const el = document.getElementById('item-mastery-detail');
        if (el) el.textContent = 'Error loading item mastery';
    }
}

export { renderItemMasteriesList, renderItemMasteryDetail };