import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

const LANGUAGE_CATEGORY_DISPLAY_TO_BACKEND = {
    'standard-languages': 'standard',
    'rare-languages': 'rare'
};

function backendToDisplayLanguageCategory(slug) {
    switch (slug) {
        case 'standard': return 'standard-languages';
        case 'rare': return 'rare-languages';
        default: return slug; // fallback
    }
}

function isDisplayLanguageCategory(segment) {
    return Object.prototype.hasOwnProperty.call(LANGUAGE_CATEGORY_DISPLAY_TO_BACKEND, segment);
}

function handleLanguagesRoute(container) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
        renderLanguagesList(container);
        return;
    }
    // parts[1] is either display category or a direct language name (legacy)
    if (parts.length === 2) {
        if (isDisplayLanguageCategory(parts[1])) {
            renderLanguagesCategory(container, LANGUAGE_CATEGORY_DISPLAY_TO_BACKEND[parts[1]]);
        } else {
            // treat as direct language name
            renderLanguageDetail(container);
        }
        return;
    }
    // length >=3 -> assume category + language name (use last segment as language)
    if (parts.length >= 3 && isDisplayLanguageCategory(parts[1])) {
        renderLanguageDetail(container);
        return;
    }
    // Fallback
    renderLanguageDetail(container);
}

async function renderLanguagesList(container) {
    container.innerHTML = await loadTemplate('languages');
    const ul = document.getElementById('language-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch('http://localhost:8000/languages/categories');
        if (!res.ok) throw new Error('Failed');
        const categories = await res.json();
        ul.innerHTML = '';
        categories.forEach(c => {
            const displaySlug = backendToDisplayLanguageCategory(c.slug);
            const li = document.createElement('li');
            li.innerHTML = `<a href="/languages/${displaySlug}" data-link>${escapeHtml(c.label)} (${c.count})</a>`;
            ul.appendChild(li);
        });
    } catch (e) {
        ul.innerHTML = '<li>Error loading categories</li>';
    }
}

async function renderLanguagesCategory(container, backendSlug) {
    
    container.innerHTML = '<h2>Languages</h2><p>Loading category…</p>';
    try {
        const res = await fetch(`http://localhost:8000/languages/category/${backendSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const { category, languages } = data;
        const listHtml = languages && languages.length ? `<table class="languages-table"><thead><tr><th>Name</th><th>Source</th></tr></thead><tbody>${languages.map(f => {
            const src = formatSourceWithPage(f.source, f.page);
            return `<tr><td><a href="/languages/${backendToDisplayLanguageCategory(category.slug)}/${encodeURIComponent(f.name)}" data-link>${escapeHtml(f.name)}</a></td><td>${src}</td></tr>`;
        }).join('')}</tbody></table>` : '<p>No languages in this category.</p>';
        container.innerHTML = `<h2>${escapeHtml(category.label)}</h2><p><a href="/languages" data-link>&larr; All Categories</a></p>${listHtml}`;
    } catch (e) {
        container.innerHTML = '<h2>Languages</h2><p>Error loading category.</p><p><a href="/languages" data-link>Back</a></p>';
    }
}

async function renderLanguageDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="language-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/languages/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('language-detail');

        // Load language detail card template and replace tokens
        const tpl = await loadTemplate('language-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = languageCategoryLabel(item.type);
                return label ? `<p class="language-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading language:', e);
        const el = document.getElementById('language-detail');
        if (el) el.textContent = 'Error loading language';
    }
}

function languageCategoryLabel(code) {
    const c = (code ?? '').toString().trim().toLowerCase();
    switch (c) {
        case 'standard': return 'Standard Language';
        case 'rare': return 'Rare Language';
        default: return ''; // unknown / omit
    }
}

export { handleLanguagesRoute };