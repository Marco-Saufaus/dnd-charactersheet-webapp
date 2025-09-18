import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, propertyNameFromCode, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

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
    container.innerHTML = await loadTemplate('items');
    const ul = document.getElementById('item-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch(BACKEND_URL + '/items/categories');
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
        const res = await fetch(BACKEND_URL + `/items/category/${backendSlug}`);
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
        // Insert plain text if item or baseItem is in a list
        function getSpecialText(item, baseItem) {
            const namesWithTest = [
                'Padded Armor',
                'Scale Mail',
                'Half Plate Armor',
                'Ring Mail',
                'Chain Mail',
                'Splint Armor',
                'Plate Armor'
            ];
            if (!item) return '';
            const result = [];
            // Stealth disadvantage line
            if (namesWithTest.includes(item.name)) {
                result.push('The wearer has {@variantrule Disadvantage|XPHB} on Dexterity ({@skill Stealth}) checks.');
            } else if (baseItem && namesWithTest.includes(baseItem.name)) {
                result.push('The wearer has {@variantrule Disadvantage|XPHB} on Dexterity ({@skill Stealth}) checks.');
            }

            // Speed reduction line for specific armors
            const speedReductionMap = {
                'Plate Armor': 15,
                'Splint Armor': 15,
                'Chain Mail': 13
            };
            let strengthReq = null;
            if (speedReductionMap[item.name]) {
                strengthReq = speedReductionMap[item.name];
            } else if (baseItem && speedReductionMap[baseItem.name]) {
                strengthReq = speedReductionMap[baseItem.name];
            }
            if (strengthReq) {
                result.push(`If the wearer has a Strength score lower than ${strengthReq}, their speed is reduced by 10 feet.`);
            }
            return result.length ? result : '';
        }
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="item-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/items/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('item-detail');

        // Load item detail card template and replace tokens
        const tpl = await loadTemplate('item-details');

        // Helper to fetch a base item by name|SRC
        async function fetchBaseItem(baseItemStr) {
            if (!baseItemStr) return null;
            let [name, src] = String(baseItemStr).split('|');
            name = (name || '').trim();
            src = (src || '').trim();
            if (!name) return null;
            // Try backend endpoint: /items/{name}?source={src}
            let url = BACKEND_URL + `/items/${encodeURIComponent(name)}`;
            if (src) url += `?source=${encodeURIComponent(src)}`;
            try {
                const r = await fetch(url);
                if (!r.ok) return null;
                return await r.json();
            } catch { return null; }
        }

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
            return `<p class="item-stats">${parts.join('<br>')}</p>`;
        })();
            
        // If baseItem, fetch and build its stats/extras
        let baseItemStatsHtml = '';
        let baseItemLinkHtml = '';
        let baseItem = null;
        if (item.baseItem) {
            baseItem = await fetchBaseItem(item.baseItem);
            if (baseItem) {
                // Only show base AC if the magic item does not have its own AC
                if (baseItem.ac != null && baseItem.ac !== '') {
                    const typeRaw = (baseItem.type ?? '').toString().toUpperCase();
                    const typeCode = typeRaw.includes('|') ? typeRaw.split('|', 1)[0] : typeRaw;
                    let acDetail = '';
                    if (((baseItem.armor && (typeCode === 'LA' || typeCode === 'MA' || typeCode === 'HA')) || typeCode === 'S')) {
                        if (typeCode === 'LA') acDetail = `${baseItem.ac} + Dex`;
                        else if (typeCode === 'MA') acDetail = `${baseItem.ac} + Dex (max 2)`;
                        else if (typeCode === 'S') acDetail = `+${baseItem.ac}`;
                        else acDetail = `${baseItem.ac}`;
                    }
                    if (acDetail) baseItemStatsHtml = `<p class=\"item-combat\">AC: ${escapeHtml(acDetail)}</p>`;
                }
                // Only the base item name is clickable, not the whole label
                let baseName = (baseItem.name || '').replace(/\b\w/g, c => c.toUpperCase());
                baseItemLinkHtml = `<a href=\"/items/${encodeURIComponent(baseName)}\" data-link>${escapeHtml(baseName)}</a>`;
            }
        }


        // Build weapon/armor extras (damage, properties, mastery, armor AC)
        const extrasHtml = (() => {
            const lines = [];
            // Armor AC (LA/MA/HA)
            try {
                const typeRaw = (item.type ?? '').toString().toUpperCase();
                const typeCode = typeRaw.includes('|') ? typeRaw.split('|', 1)[0] : typeRaw;
                if (((item.armor && (typeCode === 'LA' || typeCode === 'MA' || typeCode === 'HA')) || typeCode === 'S') && item.ac != null && item.ac !== '') {
                    let acDetail = '';
                    if (typeCode === 'LA') acDetail = `: ${item.ac} + Dex`;
                    else if (typeCode === 'MA') acDetail = `: ${item.ac} + Dex (max 2)`;
                    else if (typeCode === 'S') acDetail = ` +${item.ac}`;
                    else acDetail = `: ${item.ac}`; // HA
                    lines.push(`AC${escapeHtml(String(acDetail))}`);
                }
            } catch { /* noop */ }
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
            let showedVersatile = false;
            if (propCodes.includes('V') && item.dmg2) {
                lines.push(`Versatile (${escapeHtml(String(item.dmg2))})`);
                showedVersatile = true;
            }
            // Show other weapon properties as a comma-separated list
            if (propCodes.length) {
                const names = Array.from(new Set(propCodes
                    .map(propertyNameFromCode)
                    .filter(Boolean)));
                const filtered = showedVersatile ? names.filter(n => n.toLowerCase() !== 'versatile') : names;
                if (filtered.length) {
                    lines.push(filtered.map(n => `<a href="/item-properties/${encodeURIComponent(n)}" data-link>${escapeHtml(n)}</a>`).join(', '));
                }
            }

            // Mastery (2024): array of like "Topple|XPHB"
            const mastery = Array.isArray(item.mastery) ? item.mastery : [];
            const masteryNames = mastery
                .map(m => String(m))
                .map(m => (m.includes('|') ? m.split('|', 1)[0] : m))
                .filter(Boolean);
            if (masteryNames.length) {
                lines.push('Mastery: ' + masteryNames.map(m => `<a href="/item-masteries/${encodeURIComponent(m)}" data-link>${escapeHtml(m)}</a>`).join(', '));
            }

            if (!lines.length) return '';
            return `<p class="item-combat">${lines.join('<br>')}</p>`;
        })();

        // Fetch and render weapon property/mastery descriptions (details)
        const detailsHtml = await (async () => {
            const hasWeaponLike = !!(item.weapon || item.dmg1 || (Array.isArray(item.property) && item.property.length) || (Array.isArray(item.mastery) && item.mastery.length));
            if (!hasWeaponLike) return '';

            const rawProps = Array.isArray(item.property) ? item.property.map(p => String(p)) : [];
            const propCodes = rawProps
                .map(p => (p.includes('|') ? p.split('|', 1)[0] : p))
                .map(p => p.trim().toUpperCase())
                .filter(Boolean);
            const unique = (arr) => Array.from(new Set(arr));
            const propNames = unique(propCodes.map(propertyNameFromCode).filter(Boolean));

            const masteryRaw = Array.isArray(item.mastery) ? item.mastery.map(m => String(m)) : [];
            const masteryNames = unique(masteryRaw.map(m => (m.includes('|') ? m.split('|', 1)[0] : m).trim()).filter(Boolean));

            const fetchSafe = async (url) => {
                try {
                    const r = await fetch(url);
                    if (!r.ok) return null;
                    return await r.json();
                } catch {
                    return null;
                }
            };

            const propDetails = await Promise.all(propNames.map(n => fetchSafe(BACKEND_URL + `/item-properties/${encodeURIComponent(n)}`)));
            const masteryDetails = await Promise.all(masteryNames.map(n => fetchSafe(BACKEND_URL + `/item-masteries/${encodeURIComponent(n)}`)));

            const stripLeadingName = (html, name) => {
                if (!html || !name) return html || '';
                const escapedName = escapeHtml(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(`^\\s*<p><strong>${escapedName}<\\/strong><\\/p>\\s*`, 'i');
                return html.replace(re, '');
            };

            const propBlocks = (propDetails || [])
                .filter(Boolean)
                .map(d => {
                    const title = `<p><strong>${escapeHtml(d.name)}</strong></p>`; // no source for properties
                    const rawBody = renderEntries(d.entries ?? []) || '';
                    const body = stripLeadingName(rawBody, d.name);
                    return `<div class="item-prop">${title}${body}</div>`;
                });

            const masteryBlocks = (masteryDetails || [])
                .filter(Boolean)
                .map(d => {
                    const title = `<p><strong>Mastery: ${escapeHtml(d.name)}</strong></p>`;
                    const rawBody = renderEntries(d.entries ?? []) || '';
                    const body = stripLeadingName(rawBody, d.name);
                    return `<div class="item-mastery">${title}${body}</div>`;
                });

            if (!propBlocks.length && !masteryBlocks.length) return '';
            // No section headers; list properties then masteries
            return `<div class="item-feature-details">${propBlocks.join('')}${masteryBlocks.join('')}</div>`;
        })();

        // Compose type line for weapons (e.g., 'Martial weapon, melee weapon')
        const rawTypeCode = (item.type ?? item.category ?? '').toString();
        const weaponCat = weaponCategoryText(item.weaponCategory);
        const weaponKind = weaponKindFromType(rawTypeCode);
        let typeLine = '';
        if (weaponCat || weaponKind) {
            const typeParts = [];
            if (weaponCat) typeParts.push(weaponCat);
            if (weaponKind) typeParts.push(weaponKind);
            typeLine = `<p class=\"item-type-line\">${typeParts.join(', ')}</p>`;
        }

        // Render description: if item.hasRefs, use item group; else use item's own entries
        let descriptionHtml = '';
        if (item.hasRefs) {
            // Try to extract the referenced itemEntry name from the string, e.g. "{#itemEntry {name}|XDMG}"
            let extractedName = '';
            if (Array.isArray(item.entries) && item.entries.length > 0) {
                for (const entry of item.entries) {
                    if (typeof entry === 'string') {
                        const match = entry.match(/\{#itemEntry ([^}|]+)(?:\|[^}]*)?}/);
                        if (match && match[1]) {
                            extractedName = match[1].trim();
                            break;
                        }
                    }
                }
            }
            if (extractedName) {
                // Fetch the item group from the backend
                try {
                    const res = await fetch(BACKEND_URL + `/item-groups/${encodeURIComponent(extractedName)}`);
                    if (res.ok) {
                        const group = await res.json();
                        descriptionHtml = renderEntries(group.entries ?? []);
                    } else {
                        descriptionHtml = 'Item group not found';
                    }
                } catch (e) {
                    descriptionHtml = 'Error loading item group';
                }
            } else {
                descriptionHtml = 'no name found';
            }
        } else {
            // Standard item: render its own entries
            descriptionHtml = renderEntries(item.entries ?? []);
        }

        const html = tpl 
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{CATEGORY}}', (() => {
                const rawTypeCode = (item.type ?? item.category ?? '').toString();
                // For weapons, show 'Weapon (Greatsword)' as the main label
                let categoryLabel = '';
                if (item.weaponCategory && item.baseItem) {
                    // Use clickable base item name if available
                    let baseNameHtml = '';
                    if (baseItemLinkHtml) {
                        baseNameHtml = baseItemLinkHtml;
                    } else if (item.baseItem) {
                        let raw = String(item.baseItem).trim();
                        if (raw.includes('|')) raw = raw.split('|', 1)[0];
                        const baseName = raw.replace(/\b\w/g, c => c.toUpperCase());
                        baseNameHtml = escapeHtml(baseName);
                    }
                    categoryLabel = `Weapon${baseNameHtml ? ` (${baseNameHtml})` : ''}`;
                } else {
                    // fallback to typeLabel
                    const typeLabel = (() => {
                        const base = itemCategoryLabel(rawTypeCode) || '';
                        return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : '';
                    })();
                    if (baseItemLinkHtml) {
                        categoryLabel = `${typeLabel} (${baseItemLinkHtml})`;
                    } else {
                        let baseItemText = '';
                        if (item.baseItem) {
                            let raw = String(item.baseItem).trim();
                            if (raw.includes('|')) raw = raw.split('|', 1)[0];
                            baseItemText = raw.replace(/\b\w/g, c => c.toUpperCase());
                        }
                        categoryLabel = `${typeLabel}${baseItemText ? ` (${escapeHtml(baseItemText)})` : ''}`;
                    }
                }
                // Rarity + attunement
                const rarityRaw = (item.rarity ?? '').toString().trim();
                const raritySeg = (rarityRaw && rarityRaw.toLowerCase() !== 'none')
                    ? rarityRaw.toLowerCase() : '';
                const req = item.reqAttune ?? item.requiresAttunement ?? item.attunement;
                const attuneSeg = req ? 'requires attunement' : '';
                const right = raritySeg ? `${raritySeg}${attuneSeg ? ` (${attuneSeg})` : ''}` : '';
                const combined = [categoryLabel, right].filter(Boolean).join(', ');
                return combined ? `<p class=\"item-category\"><strong>${combined}</strong></p>` : '';
            })())
            // Insert type line after category for weapons
            .replace('{{TYPELINE}}', typeLine)
            .replace('{{STATS}}', baseItemStatsHtml + extrasHtml + statsHtml)
            .replace('{{DESCRIPTION}}', descriptionHtml)
            // Move property/mastery details after main description
            .replace('{{DETAILS}}', detailsHtml)
            // Insert special text between details and source
            .replace('{{SPECIALTEXT}}', renderEntries(getSpecialText(item, baseItem)))
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading item:', e);
        const el = document.getElementById('item-detail');
        if (el) el.textContent = 'Error loading item';
    }
}

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
        case 'M': return 'melee Weapon';
        case 'R': return 'ranged weapon';
        default: return '';
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
        'M': 'Weapon',
        'R': 'Weapon',
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

export { handleItemsRoute };