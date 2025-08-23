import './style.css'

// ---------------------------
// Routing
// ---------------------------

// Simple client-side router
function router() {
    const path = window.location.pathname;
    const container = document.getElementById('route-container');
    container.innerHTML = '';

    if (path === '/' || path === '/index.html') {
        // Home page
    } else if (path === '/characters') {
        renderCharacterList(container);
    } else if (path === '/search') {
        renderSearchCategoryList(container);

    } else if (path === '/actions') {
        renderActionsList(container);
    } else if (path.startsWith('/actions/')) {
        renderActionDetail(container);

    } else if (path === '/backgrounds') {
        renderBackgroundsList(container);
    } else if (path.startsWith('/backgrounds/')) {
        renderBackgroundDetail(container);

    } else if (path === '/conditions') {
        renderConditionsList(container);
    } else if (path.startsWith('/conditions/')) {
        renderConditionDetail(container);

    } else if (path.startsWith('/feats')) {
        handleFeatsRoute(container);

    } else if (path.startsWith('/items')) {
        handleItemsRoute(container);

    } else if (path === '/item-masteries') {
        renderItemMasteriesList(container);
    } else if (path.startsWith('/item-masteries/')) {
        renderItemMasteryDetail(container);

    } else if (path === '/item-properties') {
        renderItemPropertiesList(container);
    } else if (path.startsWith('/item-properties/')) {
        renderItemPropertyDetail(container);

    } else if (path.startsWith('/languages')) {
        handleLanguagesRoute(container);

    } else if (path.startsWith('/optional-features')) {
        handleOptionalFeaturesRoute(container);
       
    } else if (path === '/races') {
        renderRacesList(container);
    } else if (path.startsWith('/races/')) {
        renderRaceDetail(container);

    } else if (path === '/senses') {
        renderSensesList(container);
    } else if (path.startsWith('/senses/')) {
        renderSenseDetail(container);

    } else if (path === '/skills') {
        renderSkillsList(container);
    } else if (path.startsWith('/skills/')) {
        renderSkillDetail(container);

    } else if (path.startsWith('/spells/')) {
        container.innerHTML = '<p>Spell detail (todo)</p>';

    } else if (path === '/variant-rules') {
        renderVariantsList(container);
    } else if (path.startsWith('/variant-rules/')) {
        renderVariantDetail(container);  

    } else {
        container.innerHTML = '<p>Page not found.</p>';
    }
}

async function renderSearchCategoryList(container) {
    container.innerHTML = await loadTemplate('/src/templates/search-categories.html');
}

// ---------------------------
// Characters
// ---------------------------

async function renderCharacterList(container) {
    container.innerHTML = await loadTemplate('/src/templates/characters.html');
    try {
        const response = await fetch('http://localhost:8000/characters/');
        const characters = await response.json();

        const tbody = document.querySelector('#characters-table tbody');
        tbody.innerHTML = '';

        if (characters.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4">No characters found</td>';
            tbody.appendChild(row);
            return;
        }

        characters.forEach(character => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${character.name}</td>
        <td>${character.race}</td>
        <td>${character.character_class}</td>
        <td>${character.level}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#characters-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Error loading characters</td></tr>';
        }
    }
}

// ---------------------------
// Actions
// ---------------------------

async function renderActionsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/actions.html');
    try {
        const response = await fetch('http://localhost:8000/actions/search');
        const actions = await response.json();

        const tbody = document.querySelector('#actions-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(actions) || actions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No actions found</td></tr>';
            return;
        }

        actions.forEach(a => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(a.source, a.page);
            row.innerHTML = `
        <td><a href="/actions/${a.name}" data-link>${a.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#actions-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading actions</td></tr>';
        }
    }
}

async function renderActionDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="action-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/actions/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('action-detail');

        // Load detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/action-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{TIME}}', escapeHtml(formatActionTime(item.time)) || '—')
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading action:', e);
        const el = document.getElementById('action-detail');
        if (el) el.textContent = 'Error loading action';
    }
}

// ---------------------------
// Backgrounds
// ---------------------------

async function renderBackgroundsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/backgrounds.html');
    try {
        const response = await fetch('http://localhost:8000/backgrounds/search');
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
        const res = await fetch(`http://localhost:8000/backgrounds/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('background-detail');

        // Load background detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/background-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading background:', e);
        const el = document.getElementById('background-detail');
        if (el) el.textContent = 'Error loading background';
    }
}

// ---------------------------
// Conditions
// ---------------------------

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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading condition:', e);
        const el = document.getElementById('condition-detail');
        if (el) el.textContent = 'Error loading condition';
    }
}

// ---------------------------
// Feats
// ---------------------------

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
    container.innerHTML = await loadTemplate('/src/templates/feats.html');
    const ul = document.getElementById('feat-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch('http://localhost:8000/feats/categories');
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
        const res = await fetch(`http://localhost:8000/feats/category/${backendSlug}`);
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
        const res = await fetch(`http://localhost:8000/feats/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('feat-detail');

        // Load feat detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/feat-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = featCategoryLabel(item.category);
                return label ? `<p class="feat-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading feat:', e);
        const el = document.getElementById('feat-detail');
        if (el) el.textContent = 'Error loading feat';
    }
}

// ---------------------------
// Items
// ---------------------------

const ITEM_CATEGORY_DISPLAY_TO_BACKEND = {
    "general-items": "general",
    "weapons": "weapons",
    "armor": "armor",
    "vehicles": "vehicles",
    "mounts": "mounts",
    "spellcasting-focus": "focus",
    "tools": "tools",
    "potions": "potions",
    "scrolls": "scrolls",
    "magic-items": "magic",
    "treasure": "treasure",
};

function backendToDisplayItemCategory(slug) {
    switch (slug) {
        case 'general': return 'general-items';
    case 'weapons': return 'weapons';
    case 'armor': return 'armor';
        case 'vehicles': return 'vehicles';
        case 'mounts': return 'mounts';
        case 'focus': return 'spellcasting-focus';
        case 'tools': return 'tools';
        case 'potions': return 'potions';
        case 'scrolls': return 'scrolls';
        case 'magic': return 'magic-items';
        case 'treasure': return 'treasure';
        default: return slug; // fallback
    }
}

function isDisplayItemCategory(segment) {
    return Object.prototype.hasOwnProperty.call(ITEM_CATEGORY_DISPLAY_TO_BACKEND, segment);
}

function handleItemsRoute(container) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
        renderItemsList(container);
        return;
    }
    // parts[1] is either display category or a direct item name (legacy)
    if (parts.length === 2) {
        if (isDisplayItemCategory(parts[1])) {
            renderItemsCategory(container, ITEM_CATEGORY_DISPLAY_TO_BACKEND[parts[1]]);
        } else {
            // treat as direct item name
            renderItemDetail(container);
        }
        return;
    }
    // length >=3 -> assume category + item name (use last segment as item)
    if (parts.length >= 3 && isDisplayItemCategory(parts[1])) {
        renderItemDetail(container);
        return;
    }
    // Fallback
    renderItemDetail(container);
}

async function renderItemsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/items.html');
    const ul = document.getElementById('item-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch('http://localhost:8000/items/categories');
        if (!res.ok) throw new Error('Failed');
        const categories = await res.json();
        ul.innerHTML = '';
        categories.forEach(c => {
            const displaySlug = backendToDisplayItemCategory(c.slug);
            const li = document.createElement('li');
            li.innerHTML = `<a href="/items/${displaySlug}" data-link>${escapeHtml(c.label)} (${c.count})</a>`;
            ul.appendChild(li);
        });
    } catch (e) {
        ul.innerHTML = '<li>Error loading categories</li>';
    }
}

async function renderItemsCategory(container, backendSlug) {
    
    container.innerHTML = '<h2>Items</h2><p>Loading category…</p>';
    try {
        const res = await fetch(`http://localhost:8000/items/category/${backendSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const { category, items } = data;
        const isMagic = (category.slug || '').toLowerCase() === 'magic';
        const listHtml = items && items.length ? `<table class="items-table"><thead><tr>
            <th>Name</th>${isMagic ? '<th>Rarity</th>' : ''}<th>Source</th>
        </tr></thead><tbody>${items.map(i => {
            const src = formatSourceWithPage(i.source, i.page);
            const rarity = (() => {
                const r = (i.rarity ?? '').toString().trim();
                if (!r || r.toLowerCase() === 'none') return '';
                return r.replace(/\b\w/g, c => c.toUpperCase());
            })();
            return `<tr>
                <td><a href="/items/${backendToDisplayItemCategory(category.slug)}/${encodeURIComponent(i.name)}" data-link>${escapeHtml(i.name)}</a></td>
                ${isMagic ? `<td>${escapeHtml(rarity)}</td>` : ''}
                <td>${src}</td>
            </tr>`;
        }).join('')}</tbody></table>` : '<p>No items in this category.</p>';
        container.innerHTML = `<h2>${escapeHtml(category.label)}</h2><p><a href="/items" data-link>&larr; All Categories</a></p>${listHtml}`;
    } catch (e) {
        container.innerHTML = '<h2>Items</h2><p>Error loading category.</p><p><a href="/items" data-link>Back</a></p>';
    }
}

async function renderItemDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="item-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/items/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('item-detail');

        // Load item detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/item-details.html');
    // Build stats (value/weight) when available
        const statsHtml = (() => {
            const parts = [];

            const v = item.value ?? item.cost ?? item.price;
            let valueText = '';
            const formatCopper = (n) => {
                const cp = Number(n);
                if (!Number.isFinite(cp)) return '';                
                if (cp % 100 === 0) return `${cp / 100} gp`;
                if (cp % 10 === 0) return `${cp / 10} sp`;
                return `${cp} cp`;
            };
            if (v && typeof v === 'object') {
                const num = v.number ?? v.amount ?? v.value ?? v.qty ?? '';
                const cur = v.currency ?? v.unit ?? v.abbrev ?? v.type ?? '';
                if (cur) {
                    valueText = `${num}${cur ? ' ' + cur : ''}`.trim();
                } else if (num !== '') {
                    valueText = formatCopper(num);
                }
            } else if (v !== undefined && v !== null && v !== '') {
                if (typeof v === 'number' || /^\d+$/.test(String(v))) {
                    valueText = formatCopper(v);
                } else {
                    valueText = String(v);
                }
            }
            // Some datasets use 'value' and 'valueUnit'
            if (!valueText && (item.value != null) && (item.valueUnit || item.unit)) {
                valueText = `${item.value} ${item.valueUnit || item.unit}`.trim();
            }
            if (valueText) {
                let valueDisplay = valueText.trim();
                if (!/[.!?]$/.test(valueDisplay)) valueDisplay += '.'; // ensure trailing period
                parts.push(`<span><strong>Value:</strong> ${escapeHtml(valueDisplay)}</span>`);
            }

            // weight can be number or object; support common shapes
            const w = item.weight ?? item.wt ?? item.weightNumber;
            if (w !== undefined && w !== null && w !== '') {
                const wVal = typeof w === 'object' ? (w.number ?? w.amount ?? w.value) : w;
                if (wVal !== undefined && wVal !== null && wVal !== '') {
                    parts.push(`<span><strong>Weight:</strong> ${escapeHtml(String(wVal))} lb</span>`);
                }
            }

            if (!parts.length) return '';
            return `<p class="item-stats">${parts.join(' • ')}</p>`;
        })();

        // Build weapon/armor extras (damage, properties, mastery)
    const extrasHtml = (() => {
            const lines = [];
            // Damage and type
            const dmg1 = item.dmg1;
            const dmgType = item.dmgType;
            const dmgTypeText = damageTypeLabel(dmgType);
            if (dmg1 && dmgTypeText) {
                lines.push(`${escapeHtml(String(dmg1))} ${escapeHtml(dmgTypeText)}`);
            } else if (dmg1) {
                lines.push(`${escapeHtml(String(dmg1))}`);
            }

            // Properties (e.g., Versatile -> show dmg2 if present)
            const props = Array.isArray(item.property) ? item.property.map(p => String(p)) : [];
            const propCodes = props.map(p => (p.includes('|') ? p.split('|', 1)[0] : p).toUpperCase());
            if (propCodes.includes('V') && item.dmg2) {
                lines.push(`Versatile (${escapeHtml(String(item.dmg2))})`);
            }

            // Mastery (2024): array of like "Topple|XPHB"
            const mastery = Array.isArray(item.mastery) ? item.mastery : [];
            const masteryNames = mastery
                .map(m => String(m))
                .map(m => (m.includes('|') ? m.split('|', 1)[0] : m))
                .filter(Boolean);
            if (masteryNames.length) {
                lines.push(`Mastery: ${escapeHtml(masteryNames.join(', '))}`);
            }

            if (!lines.length) return '';
            return `<p class="item-combat">${lines.join('<br>')}</p>`;
        })();

        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const rawTypeCode = (item.type ?? item.category ?? '').toString();
                const typeLabel = (() => {
                    const base = itemCategoryLabel(rawTypeCode) || '';
                    return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : '';
                })();
                // Base item display from baseItem (e.g., "chain mail|XPHB" -> "Chain Mail")
                let baseItemText = '';
                if (item.baseItem) {
                    let raw = String(item.baseItem).trim();
                    if (raw.includes('|')) raw = raw.split('|', 1)[0];
                    baseItemText = raw.replace(/\b\w/g, c => c.toUpperCase());
                }
                // Rarity + attunement
                const rarityRaw = (item.rarity ?? '').toString().trim();
                const raritySeg = (rarityRaw && rarityRaw.toLowerCase() !== 'none')
                    ? rarityRaw.toLowerCase() : '';
                const req = item.reqAttune ?? item.requiresAttunement ?? item.attunement;
                const attuneSeg = req ? 'requires attunement' : '';
                // Weapon/armor specific labels
                const weaponCat = weaponCategoryText(item.weaponCategory);
                const weaponKind = weaponKindFromType(rawTypeCode);

                const leftParts = [];
                if (weaponCat) leftParts.push(weaponCat);
                if (weaponKind) leftParts.push(weaponKind);
                // Fallback to typeLabel for non-weapons/armors
                if (!leftParts.length && typeLabel) leftParts.push(`${typeLabel}${baseItemText ? ` (${baseItemText})` : ''}`);
                const left = leftParts.join(', ');
                const right = raritySeg ? `${raritySeg}${attuneSeg ? ` (${attuneSeg})` : ''}` : '';
                const combined = [left, right].filter(Boolean).join(', ');
                return combined ? `<p class="item-category"><strong>${escapeHtml(combined)}</strong></p>` : '';
            })())
            .replace('{{STATS}}', statsHtml + extrasHtml)
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item:', e);
        const el = document.getElementById('item-detail');
        if (el) el.textContent = 'Error loading item';
    }
}

// ---------------------------
// Languages
// ---------------------------

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
    container.innerHTML = await loadTemplate('/src/templates/languages.html');
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
        const tpl = await loadTemplate('/src/templates/language-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = languageCategoryLabel(item.type);
                return label ? `<p class="language-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading language:', e);
        const el = document.getElementById('language-detail');
        if (el) el.textContent = 'Error loading language';
    }
}

// ---------------------------
// Optional Features
// ---------------------------

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
    container.innerHTML = await loadTemplate('/src/templates/optionalfeatures.html');
    const ul = document.getElementById('optionalfeature-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch('http://localhost:8000/optional-features/categories');
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
        const res = await fetch(`http://localhost:8000/optional-features/category/${backendSlug}`);
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
        const res = await fetch(`http://localhost:8000/optional-features/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('optionalfeature-detail');
        const tpl = await loadTemplate('/src/templates/optionalfeature-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const label = optionalfeatureCategoryLabel(item.featureType);
                return label ? `<p class="optionalfeature-category"><strong>${escapeHtml(label)}</strong></p>` : '';
            })())
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;
    } catch (e) {
        const el = document.getElementById('optionalfeature-detail');
        if (el) el.textContent = 'Error loading optional feature';
    }
}

// ---------------------------
// Races
// ---------------------------

async function renderRacesList(container) {
    container.innerHTML = await loadTemplate('/src/templates/races.html');
    try {
        const response = await fetch('http://localhost:8000/races/search');
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
        const res = await fetch(`http://localhost:8000/races/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('race-detail');

        // Load race detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/race-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading race:', e);
        const el = document.getElementById('race-detail');
        if (el) el.textContent = 'Error loading race';
    }
}

// ---------------------------
// Senses
// ---------------------------

async function renderSensesList(container) {
    container.innerHTML = await loadTemplate('/src/templates/senses.html');
    try {
        const response = await fetch('http://localhost:8000/senses/search');
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
        const res = await fetch(`http://localhost:8000/senses/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('sense-detail');

        // Load sense detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/sense-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading sense:', e);
        const el = document.getElementById('sense-detail');
        if (el) el.textContent = 'Error loading sense';
    }
}

// ---------------------------
// Skills
// ---------------------------

async function renderSkillsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/skills.html');
    try {
        const response = await fetch('http://localhost:8000/skills/search');
        const skills = await response.json();

        const tbody = document.querySelector('#skills-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(skills) || skills.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No skills found</td></tr>';
            return;
        }

        skills.forEach(s => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(s.source, s.page);
            row.innerHTML = `
        <td><a href="/skills/${s.name}" data-link>${s.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#skills-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading skills</td></tr>';
        }
    }
}

async function renderSkillDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="skill-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/skills/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('skill-detail');

        // Load skill detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/skill-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
               .replace('{{ABILITY}}', escapeHtml(abilityFullName(item.ability)))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading skill:', e);
        const el = document.getElementById('skill-detail');
        if (el) el.textContent = 'Error loading skill';
    }
}

// ---------------------------
// Variant Rules
// ---------------------------

async function renderVariantsList(container) {
    container.innerHTML = await loadTemplate('/src/templates/variants.html');
    try {
        const response = await fetch('http://localhost:8000/variant-rules/search');
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
        const res = await fetch(`http://localhost:8000/variant-rules/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('variant-detail');

        // Load variant-rule detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/variant-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading Variant Rule:', e);
        const el = document.getElementById('variant-detail');
        if (el) el.textContent = 'Error loading Variant Rule';
    }
}

// ---------------------------
// Item Masteries
// ---------------------------

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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item mastery:', e);
        const el = document.getElementById('item-mastery-detail');
        if (el) el.textContent = 'Error loading item mastery';
    }
}

// ---------------------------
// Item Properties
// ---------------------------

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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '<em>No description</em>')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item property:', e);
        const el = document.getElementById('item-property-detail');
        if (el) el.textContent = 'Error loading item property';
    }
}

// ---------------------------
// Utility Functions
// ---------------------------

// Simple template loader with caching
const templateCache = new Map();
async function loadTemplate(path) {
    if (templateCache.has(path)) return templateCache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load template ${path}`);
    const html = await res.text();
    templateCache.set(path, html);
    return html;
}

// Minimal HTML escaper for pre/dynamic inserts
function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// Format common 5eTools-style time fields
function formatActionTime(time) {
    if (!time) return '';
    if (typeof time === 'string') return time;
    const fmt = (t) => {
        if (!t || typeof t !== 'object') return '';
        const n = t.number ?? t.amount ?? '';
        // Units can be e.g., 'action', 'bonus', 'reaction', 'minute'
        const u = t.unit ?? t.type ?? '';
        const base = [n, u].filter(Boolean).join(' ');
        // Some entries might have 'condition' or 'reactionTrigger'
        const extra = t.condition ? ` (${t.condition})` : (t.reactionTrigger ? ` (${t.reactionTrigger})` : '');
        return `${base}${extra}`.trim();
    };
    if (Array.isArray(time)) return time.map(fmt).filter(Boolean).join(', ');
    return fmt(time);
}

// Add a shared formatter for displaying source and page together.
// 'XPHB' is normalized to 'PHB24' to match your display convention.
function normalizeSource(src) {
    return src === 'XPHB' ? 'PHB24' : (src ?? '');
}
function formatSourceWithPage(source, page) {
    const s = normalizeSource(source);
    const hasPage = page !== undefined && page !== null && page !== '';
    if (s && hasPage) return `${s} p.${page}`;
    if (s) return s;
    if (hasPage) return `p.${page}`;
    return '';
}

function abilityFullName(abbrev) {
    if (!abbrev) return '';
    const map = {
        STR: 'Strength',
        DEX: 'Dexterity',
        CON: 'Constitution',
        INT: 'Intelligence',
        WIS: 'Wisdom',
        CHA: 'Charisma'
    };
    const key = String(abbrev).trim().toUpperCase();
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

// New: user‑facing label for detail view
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

function itemCategoryLabel(code) {
    if (code == null || String(code).trim() === '') return 'Magic Item';

    // Normalize and strip qualifiers like '|XDMG'
    const raw = String(code).trim().toUpperCase();
    const c = raw.includes('|') ? raw.split('|', 1)[0] : raw;

    // Known item type code labels (5eTools-style)
    const MAP = {
        // Weapons
        'M': 'Melee Weapon',
        'R': 'Ranged Weapon',
        'A': 'Ammunition',
        'AF': 'Ammunition',

        // Armor & shields
        'LA': 'Light Armor',
        'MA': 'Medium Armor',
        'HA': 'Heavy Armor',
        'S': 'Shield',

        // Tools & sets
        'AT': "Artisan's Tools",
        'T': 'Tool',
        'GS': 'Gaming Set',
        'INS': 'Musical Instrument',

        // Spellcasting focus
        'SCF': 'Spellcasting Focus',

        // Equipment & consumables
        'G': 'Adventuring Gear',
        'FD': 'Food and Drink',
        'P': 'Potion',
        'SC': 'Spellscroll',
        'MNT': 'Mount',
        'TG': 'Trade Good',
        'TAH': 'Tack and Harness',
        'EXP': 'Explosive',
        'TB': 'Tool Bundle',

        // Vehicles
        'VEH': 'Vehicle',
        'AIR': 'Air Vehicle',
        'SHP': 'Ship',

        // Magic item categories
        'RD': 'Rod',
        'WD': 'Wand',
        'RG': 'Ring',
        'W': 'Wondrous Item',

        // Common treasure codes
        '$': 'Treasure',
        '$A': 'Art Object',
        '$C': 'Coin',
        '$G': 'Gemstone',
    };

    if (Object.prototype.hasOwnProperty.call(MAP, c)) return MAP[c];
    if (c.startsWith('$')) return 'Treasure';

    // Fallbacks: treat unknowns conservatively
    return '';
}

// Helpers for item detail labels
function damageTypeLabel(code) {
    if (!code) return '';
    const c = String(code).trim().toUpperCase();
    const MAP = {
        A: 'Acid',
        B: 'Bludgeoning',
        C: 'Cold',
        F: 'Fire',
        O: 'Force',
        L: 'Lightning',
        N: 'Necrotic',
        P: 'Piercing',
        I: 'Poison',
        Y: 'Psychic',
        R: 'Radiant',
        S: 'Slashing',
        T: 'Thunder'
    };
    return MAP[c] || c.charAt(0) + c.slice(1).toLowerCase();
}

function weaponCategoryText(cat) {
    if (!cat) return '';
    const c = String(cat).trim().toLowerCase();
    if (!c) return '';
    // Common values: 'simple', 'martial'
    return `${c.charAt(0).toUpperCase()}${c.slice(1)} weapon`;
}

function weaponKindFromType(typeCode) {
    if (!typeCode) return '';
    const raw = String(typeCode).trim().toUpperCase();
    const c = raw.includes('|') ? raw.split('|', 1)[0] : raw;
    switch (c) {
        case 'M': return 'Melee weapon';
        case 'R': return 'Ranged weapon';
        case 'A':
        case 'AF':
            return 'Ammunition';
        default: return '';
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

function optionalfeatureCategoryLabel(code) {
    const c = (code ?? '').toString().trim().toUpperCase();
    switch (c) {
        case 'EI': return 'Eldritch Invocation';
        case 'MV:B': return 'Battle Master Maneuver';
        case 'MM': return 'Metamagic';
        default: return ''; // unknown / omit
    }
}

// Render simple description from 5eTools-style entries arrays
function renderEntries(entries) {
    if (!entries) return '';
    if (typeof entries === 'string') return `<p>${formatInlineRefs(entries)}</p>`;
    if (!Array.isArray(entries)) return '';

    const render = (it) => {
        if (it == null) return '';
        if (typeof it === 'string') return `<p>${formatInlineRefs(it)}</p>`;
        if (Array.isArray(it)) return it.map(render).join('');
        if (typeof it !== 'object') return '';

        if (it.entries) {
            const name = it.name ? `<p><strong>${escapeHtml(it.name)}</strong></p>` : '';
            return `${name}${render(it.entries)}`;
        }

        if (it.type === 'list' && Array.isArray(it.items)) {
            return `<ul class="entry-list">${it.items.map(li => {
                if (typeof li === 'string') return `<li>${formatInlineRefs(li)}</li>`;
                if (!li || typeof li !== 'object') return '';

                const nameHtml = li.name ? `<strong>${escapeHtml(li.name)}</strong>` : '';

                // Prefer 'entry' if present; otherwise support 'entries'
                let contentHtml = '';
                if (li.entry != null) {
                    contentHtml = (typeof li.entry === 'string') ? formatInlineRefs(li.entry) : render(li.entry);
                } else if (li.entries != null) {
                    contentHtml = render(li.entries);
                }
                // Flatten paragraph wrappers for inline list presentation
                contentHtml = (contentHtml || '').replace(/<\/?p>/g, '').trim();

                const combined = nameHtml && contentHtml ? `${nameHtml} ${contentHtml}` : (nameHtml || contentHtml || '');
                return combined ? `<li>${combined}</li>` : '';
            }).join('')}</ul>`;
        }

        return '';
    };

    return entries.map(render).join('');
}

// Parse 5eTools-style inline refs like {@skill Insight|XPHB}
function formatInlineRefs(str) {
    if (!str || typeof str !== 'string') return '';
    // Regex captures: type, inner content up to closing }
    // We then split inner content by '|' (first segment is display/name)
    const refRegex = /\{@([a-zA-Z]+)\s+([^}]+)}/g;
    return str.replace(refRegex, (_m, typeRaw, inner) => {
        const type = typeRaw.toLowerCase().trim();
        const parts = inner.split('|').map(p => p.trim());
        const display = parts[0] || '';
        const source = parts[1] || '';

        // Special cases with plain-text formatting (no links)
        if (type === 'dc') {
            // e.g., "{@dc 15}" -> "DC15"
            return `DC${escapeHtml(display)}`;
        }

        const routeBase = resolveRefRouteBase(type);
        if (!routeBase || !display) {
            return escapeHtml(display || inner); // fallback plain text
        }
        const slug = encodeURIComponent(display);
        return `<a href="/${routeBase}/${slug}" data-link title="${escapeHtml(display)}${source ? ' (' + escapeHtml(source) + ')' : ''}">${escapeHtml(display)}</a>`;
    });
}

function resolveRefRouteBase(type) {
    switch (type) {
        case 'item': return 'items';
    case 'itemproperty': return 'item-properties';
    case 'itemmastery': return 'item-masteries';
        case 'feat': return 'feats';
        case 'spell': return 'spells';
        case 'background': return 'backgrounds';
        case 'action': return 'actions';
        case 'condition': return 'conditions';
        case 'variantrule': return 'variant-rules';
        case 'filter': return 'items';
        case 'skill': return 'skills';
        // Add more mappings as needed
        default: return '';
    }
}

// ---------------------------
// Main
// ---------------------------

// Handle navigation without full page reload
document.addEventListener('click', (e) => {
    if (e.target.matches('a[data-link]')) {
        e.preventDefault();
        window.history.pushState(null, '', e.target.href);
        router();
    }
});

// Handle browser navigation (back/forward)
window.addEventListener('popstate', router);

// Initial route
router();
