import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

async function renderItemPropertiesList(container) {
    container.innerHTML = await loadTemplate('/src/templates/item-properties.html');
    try {
        const response = await fetch('http://localhost:8000/item-properties/search');
        const properties = await response.json();

        const tbody = document.querySelector('#properties-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(properties) || properties.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No item properties found</td></tr>';
            return;
        }

        properties.forEach(p => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(p.source, p.page);
            row.innerHTML = `
        <td><a href="/item-properties/${encodeURIComponent(p.name)}" data-link>${p.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#properties-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading item properties</td></tr>';
        }
    }
}

async function renderItemPropertyDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="item-property-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/item-properties/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('item-property-detail');

        const tpl = await loadTemplate('/src/templates/item-property-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item property:', e);
        const el = document.getElementById('item-property-detail');
        if (el) el.textContent = 'Error loading item property';
    }
}

export { renderItemPropertiesList, renderItemPropertyDetail };