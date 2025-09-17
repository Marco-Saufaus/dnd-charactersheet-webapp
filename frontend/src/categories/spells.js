import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

const SPELL_CATEGORY_DISPLAY_TO_BACKEND = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9'
};

function backendToDisplaySpellCategory(slug) {
    switch (slug) {
        case '0': return '0';
        case '1': return '1';
        case '2': return '2';

        case '3': return '3';
        case '4': return '4';
        case '5': return '5';
        case '6': return '6';
        case '7': return '7';
        case '8': return '8';
        case '9': return '9';
        default: return slug; // fallback
    }
}

function isDisplaySpellCategory(segment) {
    return Object.prototype.hasOwnProperty.call(SPELL_CATEGORY_DISPLAY_TO_BACKEND, segment);
}

function handleSpellsRoute(container) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 1) {
        renderSpellsList(container);
        return;
    }
    // parts[1] is either display category or a direct spell name (legacy)
    if (parts.length === 2) {
        if (isDisplaySpellCategory(parts[1])) {
            renderSpellsCategory(container, SPELL_CATEGORY_DISPLAY_TO_BACKEND[parts[1]]);
        } else {
            // treat as direct spell name
            renderSpellDetail(container);
        }
        return;
    }
    // length >=3 -> assume category + spell name (use last segment as spell)
    if (parts.length >= 3 && isDisplaySpellCategory(parts[1])) {
        renderSpellDetail(container);
        return;
    }
    // Fallback
    renderSpellDetail(container);
}

async function renderSpellsList(container) {
    container.innerHTML = await loadTemplate('spells');
    const ul = document.getElementById('spell-categories');
    if (!ul) return;
    ul.innerHTML = '<li>Loading…</li>';
    try {
        const res = await fetch('http://localhost:8000/spells/categories');
        if (!res.ok) throw new Error('Failed');
        const categories = await res.json();
        ul.innerHTML = '';
        categories.forEach(c => {
            const displaySlug = backendToDisplaySpellCategory(c.slug);
            const li = document.createElement('li');
            li.innerHTML = `<a href="/spells/${displaySlug}" data-link>${escapeHtml(c.label)} (${c.count})</a>`;
            ul.appendChild(li);
        });
    } catch (e) {
        ul.innerHTML = '<li>Error loading categories</li>';
    }
}

async function renderSpellsCategory(container, backendSlug) {
    
    container.innerHTML = '<h2>spells</h2><p>Loading category…</p>';
    try {
        const res = await fetch(`http://localhost:8000/spells/category/${backendSlug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const { category, spells } = data;
        const listHtml = spells && spells.length ? `<table class="spells-table"><thead><tr><th>Name</th><th>Source</th></tr></thead><tbody>${spells.map(f => {
            const src = formatSourceWithPage(f.source, f.page);
            return `<tr><td><a href="/spells/${backendToDisplaySpellCategory(category.slug)}/${encodeURIComponent(f.name)}" data-link>${escapeHtml(f.name)}</a></td><td>${src}</td></tr>`;
        }).join('')}</tbody></table>` : '<p>No spells in this category.</p>';
        container.innerHTML = `<h2>${escapeHtml(category.label)}</h2><p><a href="/spells" data-link>&larr; All Categories</a></p>${listHtml}`;
    } catch (e) {
        container.innerHTML = '<h2>Spells</h2><p>Error loading category.</p><p><a href="/spells" data-link>Back</a></p>';
    }
}

async function renderSpellDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="spell-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/spells/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('spell-detail');

        // Compose spell header line: e.g. "V Cantrip" or "A 2nd-level"
        // Map school code to full name
        const SCHOOL_MAP = {
            V: 'Evocation',
            A: 'Abjuration',
            D: 'Divination',
            E: 'Enchantment',
            N: 'Necromancy',
            C: 'Conjuration',
            T: 'Transmutation',
            I: 'Illusion',
        };
        let schoolFull = '';
        if (item.school) {
            const code = String(item.school).trim().toUpperCase();
            schoolFull = SCHOOL_MAP[code] || escapeHtml(item.school);
        }
        let headerLine = '';
        if (item.level === 0) {
            // Evocation Cantrip
            headerLine = `${schoolFull} Cantrip`;
        } else if (typeof item.level === 'number') {
            // Level 1 Evocation
            headerLine = `Level ${item.level} ${schoolFull}`;
        } else {
            headerLine = schoolFull;
        }

        // Casting time
        let castingTime = '';
        if (item.time) {
            if (typeof item.time === 'string') {
                castingTime = item.time;
            } else if (Array.isArray(item.time) && item.time.length > 0) {
                castingTime = item.time.map(t => {
                    if (typeof t === 'string') return t;
                    // Normalize '1 action' -> 'Action', '1 bonus action' -> 'Bonus Action', etc.
                    if (t.number === 1 && t.unit) {
                        let u = String(t.unit).toLowerCase();
                        if (u === 'action') return 'Action';
                        if (u === 'bonus') return 'Bonus Action';
                        if (u === 'reaction') return 'Reaction';
                        return u.charAt(0).toUpperCase() + u.slice(1);
                    }
                    // fallback
                    return (t.number ? t.number + ' ' : '') + (t.unit ? t.unit : '');
                }).join(', ');
            }
        }
        // Also handle string '1 action' -> 'Action'
        if (castingTime.trim().toLowerCase() === '1 action') castingTime = 'Action';
        if (castingTime.trim().toLowerCase() === '1 bonus action') castingTime = 'Bonus Action';
        if (castingTime.trim().toLowerCase() === '1 reaction') castingTime = 'Reaction';
        if (!castingTime) castingTime = 'Action'; // fallback

        // Range
        let range = '';
        if (item.range) {
            if (typeof item.range === 'string') {
                range = item.range;
            } else if (typeof item.range === 'object' && item.range.distance) {
                range = item.range.distance.amount + ' ' + item.range.distance.type;
            } else if (typeof item.range === 'object' && item.range.type) {
                range = item.range.type;
            }
        }

        // Normalize 'undefined self' or similar to 'Self'
        if (typeof range === 'string' && range.trim().toLowerCase().includes('self')) {
            range = 'Self';
        }

        // Components
        let components = '';
        if (item.components) {
            if (typeof item.components === 'string') {
                components = item.components;
            } else if (typeof item.components === 'object') {
                // e.g. { v: true, s: true, m: "a bit of fur" }
                const arr = [];
                if (item.components.v) arr.push('V');
                if (item.components.s) arr.push('S');
                if (item.components.m) arr.push('M');
                components = arr.join(', ');
                if (item.components.m && typeof item.components.m === 'string') {
                    components += ` (${item.components.m})`;
                }
            }
        }
        if (!components) components = 'V, S'; // fallback for Acid Splash

        // Duration
        let duration = '';
        if (item.duration) {
            const formatDuration = (d) => {
                if (typeof d === 'string') return d;
                if (typeof d === 'object') {
                    // Handle 5eTools duration object
                    if (d.type === 'timed' && d.duration) {
                        const amt = d.duration.amount;
                        const unit = d.duration.type;
                        let upTo = '';
                        if (d.concentration) {
                            upTo = `<a href="http://localhost:5173/conditions/Concentration" data-link>Concentration</a>, up to `;
                        }
                        // Pluralize unit if needed
                        let unitStr = unit;
                        if (amt > 1 && unit) unitStr = unit + 's';
                        return `${upTo}${amt} ${unitStr}`.trim();
                    }
                    if (d.type === 'permanent') return 'Permanent';
                    if (d.type === 'instant') return 'Instantaneous';
                    if (d.type) return d.type.charAt(0).toUpperCase() + d.type.slice(1);
                }
                return '';
            };
            if (typeof item.duration === 'string') {
                duration = item.duration;
            } else if (Array.isArray(item.duration) && item.duration.length > 0) {
                duration = item.duration.map(formatDuration).join(', ');
            } else if (typeof item.duration === 'object') {
                duration = formatDuration(item.duration);
            }
        }
        // Normalize 'instant' or 'instantaneous' (case-insensitive) to 'Instantaneous'
        if (duration && duration.trim().toLowerCase().startsWith('instant')) duration = 'Instantaneous';
        if (!duration) duration = 'Instantaneous';

        // Description
        const description = renderEntries(item.entries ?? []) || '';

        // Special notes for spell scaling
        let scalingNote = '';
        if (item.level === 0 && Array.isArray(item.entriesHigherLevel) && item.entriesHigherLevel.length > 0) {
            scalingNote = `<div><strong>Cantrip Upgrade:</strong> <span>${renderEntries(item.entriesHigherLevel, true).replace(/^<p>|<\/p>$/g, '')}</span></div>`;
        } else if (typeof item.level === 'number' && item.level > 0 && Array.isArray(item.entriesHigherLevel) && item.entriesHigherLevel.length > 0) {
            scalingNote = `<div><strong>Using a Higher-Level Spell Slot:</strong> <span>${renderEntries(item.entriesHigherLevel, true).replace(/^<p>|<\/p>$/g, '')}</span></div>`;
        }

        // Load spell detail template and replace tokens
        const tpl = await loadTemplate('spell-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{HEADER_LINE}}', headerLine)
            .replace('{{CASTING_TIME}}', escapeHtml(castingTime))
            .replace('{{RANGE}}', escapeHtml(range))
            .replace('{{COMPONENTS}}', escapeHtml(components))
            .replace('{{DURATION}}', duration)
            .replace('{{DESCRIPTION}}', description)
            .replace('{{SCALING_NOTE}}', scalingNote)
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading spell:', e);
        const el = document.getElementById('spell-detail');
        if (el) el.textContent = 'Error loading spell';
    }
}

export { handleSpellsRoute };