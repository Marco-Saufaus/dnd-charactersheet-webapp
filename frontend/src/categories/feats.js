import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

const FEAT_CATEGORY_DISPLAY_TO_BACKEND = {
    'origin-feats': 'origin',
    'general-feats': 'general',
    'fighting-styles': 'fighting-style',
    'epic-boons': 'epic-boon'
};

function backendToDisplayFeatCategory(slug) {
    switch (slug) {
        case 'origin': return 'origin-feats';
        case 'general': return 'general-feats';
        case 'fighting-style': return 'fighting-styles';
        case 'epic-boon': return 'epic-boons';
        default: return slug; // fallback
    }
}

function isDisplayFeatCategory(segment) {
    return Object.prototype.hasOwnProperty.call(FEAT_CATEGORY_DISPLAY_TO_BACKEND, segment);
}

function handleFeatsRoute(container) {
    const parts = window.location.pathname.split('/').filter(Boolean); // [ 'feats', ...]
    if (parts.length === 1) {
        renderFeatsList(container);
        return;
    }
    // parts[1] is either display category or a direct feat name (legacy)
    if (parts.length === 2) {
        if (isDisplayFeatCategory(parts[1])) {
            renderFeatsCategory(container, FEAT_CATEGORY_DISPLAY_TO_BACKEND[parts[1]]);
        } else {
            // treat as direct feat name
            renderFeatDetail(container);
        }
        return;
    }
    // length >=3 -> assume category + feat name (use last segment as feat)
    if (parts.length >= 3 && isDisplayFeatCategory(parts[1])) {
        renderFeatDetail(container);
        return;
    }
    // Fallback
    renderFeatDetail(container);
}

async function renderFeatsList(container) {
    container.innerHTML = await loadTemplate('feats');
    const ul = document.getElementById('feat-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch(BACKEND_URL + '/feats/categories');
        if (!res.ok) throw new Error('Failed');
        const categories = await res.json();
        ul.innerHTML = '';
        categories.forEach(c => {
            const displaySlug = backendToDisplayFeatCategory(c.slug);
            const li = document.createElement('li');
            li.innerHTML = `<a href="/feats/${displaySlug}" data-link>${escapeHtml(c.label)} (${c.count})</a>`;
            ul.appendChild(li);
        });
    } catch (e) {
        ul.innerHTML = '<li>Error loading categories</li>';
    }
}

async function renderFeatsCategory(container, backendSlug) {
    
    container.innerHTML = '<h2>Feats</h2><p>Loading category…</p>';
    try {
        const res = await fetch(BACKEND_URL + `/feats/category/${backendSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const { category, feats } = data;
        const listHtml = feats && feats.length ? `<table class="feats-table"><thead><tr><th>Name</th><th>Source</th></tr></thead><tbody>${feats.map(f => {
            const src = formatSourceWithPage(f.source, f.page);
            return `<tr><td><a href="/feats/${backendToDisplayFeatCategory(category.slug)}/${encodeURIComponent(f.name)}" data-link>${escapeHtml(f.name)}</a></td><td>${src}</td></tr>`;
        }).join('')}</tbody></table>` : '<p>No feats in this category.</p>';
        container.innerHTML = `<h2>${escapeHtml(category.label)}</h2><p><a href="/feats" data-link>&larr; All Categories</a></p>${listHtml}`;
    } catch (e) {
        container.innerHTML = '<h2>Feats</h2><p>Error loading category.</p><p><a href="/feats" data-link>Back</a></p>';
    }
}

async function renderFeatDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="feat-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/feats/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('feat-detail');

        // Load feat detail card template and replace tokens
        const tpl = await loadTemplate('feat-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = featCategoryLabel(item.category);
                return label ? `<p class="feat-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading feat:', e);
        const el = document.getElementById('feat-detail');
        if (el) el.textContent = 'Error loading feat';
    }
}

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

export { handleFeatsRoute };