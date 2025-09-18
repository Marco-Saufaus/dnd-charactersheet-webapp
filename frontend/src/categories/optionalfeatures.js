import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

const OPTIONALFEATURE_CATEGORY_DISPLAY_TO_BACKEND = {
    'eldritch-invocations': 'invocation',
    'battlemaster-maneuvers': 'maneuver',
    'meta-magic': 'metamagic'
};

function backendToDisplayOptionalFeatureCategory(slug) {
    switch (slug) {
        case 'invocation': return 'eldritch-invocations';
        case 'maneuver': return 'battlemaster-maneuvers';
        case 'metamagic': return 'meta-magic';
        default: return slug; // fallback
    }
}

function isDisplayOptionalFeatureCategory(segment) {
    return Object.prototype.hasOwnProperty.call(OPTIONALFEATURE_CATEGORY_DISPLAY_TO_BACKEND, segment);
}

function handleOptionalFeaturesRoute(container) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
        renderOptionalFeaturesList(container);
        return;
    }
    if (parts.length === 2) {
        if (isDisplayOptionalFeatureCategory(parts[1])) {
            renderOptionalFeaturesCategory(container, OPTIONALFEATURE_CATEGORY_DISPLAY_TO_BACKEND[parts[1]]);
        } else {
            renderOptionalFeatureDetail(container);
        }
        return;
    }
    if (parts.length >= 3 && isDisplayOptionalFeatureCategory(parts[1])) {
        renderOptionalFeatureDetail(container);
        return;
    }
    renderOptionalFeatureDetail(container);
}

async function renderOptionalFeaturesList(container) {
    container.innerHTML = await loadTemplate('optionalfeatures');
    const ul = document.getElementById('optionalfeature-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch(BACKEND_URL + '/optional-features/categories');
        if (!res.ok) throw new Error('Failed');
        const categories = await res.json();
        ul.innerHTML = '';
        categories.forEach(c => {
            const displaySlug = backendToDisplayOptionalFeatureCategory(c.slug);
            const li = document.createElement('li');
            li.innerHTML = `<a href="/optional-features/${displaySlug}" data-link>${escapeHtml(c.label)} (${c.count})</a>`;
            ul.appendChild(li);
        });
    } catch (e) {
        ul.innerHTML = '<li>Error loading categories</li>';
    }
}

async function renderOptionalFeaturesCategory(container, backendSlug) {
    container.innerHTML = '<h2>Optional Features</h2><p>Loading category…</p>';
    try {
        const res = await fetch(BACKEND_URL + `/optional-features/category/${backendSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const { category, optionalfeatures } = data;
        const listHtml = optionalfeatures && optionalfeatures.length ? `<table class="optionalfeatures-table"><thead><tr><th>Name</th><th>Source</th></tr></thead><tbody>${optionalfeatures.map(f => {
            const src = formatSourceWithPage(f.source, f.page);
            return `<tr><td><a href="/optional-features/${backendToDisplayOptionalFeatureCategory(category.slug)}/${encodeURIComponent(f.name)}" data-link>${escapeHtml(f.name)}</a></td><td>${src}</td></tr>`;
        }).join('')}</tbody></table>` : '<p>No optional features in this category.</p>';
        container.innerHTML = `<h2>${escapeHtml(category.label)}</h2><p><a href="/optional-features" data-link>&larr; All Categories</a></p>${listHtml}`;
    } catch (e) {
        container.innerHTML = '<h2>Optional Features</h2><p>Error loading category.</p><p><a href="/optional-features" data-link>Back</a></p>';
    }
}

async function renderOptionalFeatureDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = '<div id="optionalfeature-detail">Loading…</div>';
    try {
        const res = await fetch(BACKEND_URL + `/optional-features/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('optionalfeature-detail');
        const tpl = await loadTemplate('optionalfeature-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = optionalfeatureCategoryLabel(item.featureType);
                return label ? `<p class="optionalfeature-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;
    } catch (e) {
        const el = document.getElementById('optionalfeature-detail');
        if (el) el.textContent = 'Error loading optional feature';
    }
}

function optionalfeatureCategoryLabel(code) {
    const c = (code ?? '').toString().trim().toUpperCase();
    switch (c) {
        case 'EI': return 'Eldritch Invocation';
        case 'MV:B': return 'Battle Master Maneuver';
        case 'MM': return 'Metamagic';
        default: return ''; // unknown / omit
    }
}

export { handleOptionalFeaturesRoute };