import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

async function renderVariantsList(container) {
    container.innerHTML = await loadTemplate('variants');
    try {
        const response = await fetch(BACKEND_URL + '/variant-rules/search');
        const variants = await response.json();

        const tbody = document.querySelector('#variants-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(variants) || variants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No Variant Rules found</td></tr>';
            return;
        }

        variants.forEach(v => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(v.source, v.page);
            row.innerHTML = `
        <td><a href="/variant-rules/${v.name}" data-link>${v.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#variants-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading Variant Rules</td></tr>';
        }
    }
}

async function renderVariantDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="variant-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/variant-rules/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('variant-detail');

        // Load variant-rule detail card template and replace tokens
        const tpl = await loadTemplate('variant-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading Variant Rule:', e);
        const el = document.getElementById('variant-detail');
        if (el) el.textContent = 'Error loading Variant Rule';
    }
}

export { renderVariantsList, renderVariantDetail };