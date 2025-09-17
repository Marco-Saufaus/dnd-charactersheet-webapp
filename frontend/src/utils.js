const templateCache = new Map();
async function loadTemplate(path) {

    path = '/templates/' + path + '.html';

    if (templateCache.has(path)) return templateCache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load template ${path}`);
    const html = await res.text();
    templateCache.set(path, html);
    return html;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

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

function renderEntries(entries, suppressSpellName = false) {
    if (!entries) return '';
    if (typeof entries === 'string') return `<p>${formatInlineRefs(entries)}</p>`;
    if (!Array.isArray(entries)) return '';

    const render = (it) => {
        if (it == null) return '';
        if (typeof it === 'string') return `<p>${formatInlineRefs(it)}</p>`;
        if (Array.isArray(it)) return it.map(render).join('');
        if (typeof it !== 'object') return '';

        if (it.entries) {
            // Suppress name if requested and entry is a spell scaling entry (e.g., Cantrip Upgrade)
            let name = '';
            if (!suppressSpellName && it.name) {
                name = `<p><strong>${escapeHtml(it.name)}</strong></p>`;
            }
            return `${name}${render(it.entries)}`;
        }

        if (it.type === 'list' && Array.isArray(it.items)) {
            return `<ul class="entry-list">${it.items.map(li => {
                if (typeof li === 'string') return `<li>${formatInlineRefs(li)}</li>`;
                if (!li || typeof li !== 'object') return '';

                const nameHtml = li.name && !suppressSpellName ? `<strong>${escapeHtml(li.name)}</strong>` : '';

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

function formatInlineRefs(str) {
    if (!str || typeof str !== 'string') return '';
    // Regex captures: type, inner content up to closing }
    // We then split inner content by '|' (first segment is display/name)
    // Also match tags with no argument, e.g. {@actSaveFail}
    const refRegex = /\{@([a-zA-Z]+)(?:\s+([^}]+))?}/g;
    let replaced = str.replace(refRegex, (_m, typeRaw, inner) => {
        const type = typeRaw.toLowerCase().trim();
        const parts = (inner || '').split('|').map(p => p.trim());
        let display = parts[0] || '';
        const source = parts[1] || '';

        if (type === 'actsave') {
            // Output: "Wisdom Saving Throw:"
            let ability = display;
            // Map abbreviations to full names
            const map = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
            ability = map[ability.toLowerCase()] || ability;
            return `${ability} Saving Throw:`;
        }
        if (type === 'actsavefail') {
            // Output: "Failure:"
            return 'Failure:';
        }
        // {@atkr m} or {@atkr r}
        if (type === 'atkr') {
            if (display.toLowerCase() === 'm') return 'Melee Attack Roll:';
            if (display.toLowerCase() === 'r') return 'Ranged Attack Roll:';
            return '';
        }
        // {@hitYourSpellAttack ...} or {@hit} or {@h}
        if (type.startsWith('hit')) {
            if (type === 'hit') {
                return 'Hit:';
            } else {
                // Only output the display (e.g. 'Bonus equals your spell attack modifier') for custom hit tags
                return display ? display : '';
            }
        }
        if (type === 'h') {
            return 'Hit: ';
        }
        // {@damage ...}
        if (type === 'damage') {
            return escapeHtml(display);
        }

        // Special cases with plain-text formatting (no links)
        if (type === 'dc') {
            // e.g., "{@dc 15}" -> "DC15"
            return `DC${escapeHtml(display)}`;
        }

        // Special handling for scaledamage: use the last segment as the display value
        if (type === 'scaledamage') {
            // e.g., {@scaledamage 8d6|3-9|1d6} => display 1d6
            display = parts[parts.length - 1] || display;
            return escapeHtml(display);
        }

        // For itemProperty, map code to full name for display and link
        if (type === 'itemproperty') {
            const fullName = propertyNameFromCode(display) || display;
            display = fullName;
        }

        const routeBase = resolveRefRouteBase(type);
        if (!routeBase || !display) {
            return escapeHtml(display || inner); // fallback plain text
        }

        const slug = encodeURIComponent(display);
        return `<a href="/${routeBase}/${slug}" data-link title="${escapeHtml(display)}${source ? ' (' + escapeHtml(source) + ')' : ''}">${escapeHtml(display)}</a>`;
    });

    // Post-process to replace 'summonSpellLevel' with 'the spell\'s level'
    replaced = replaced.replace(/\bsummonSpellLevel\b/g, "the spell's level");
    return replaced;
}

function propertyNameFromCode(code) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return '';
    const MAP = {
        'A': 'Ammunition',
        'F': 'Finesse',
        'H': 'Heavy',
        'L': 'Light',
        'LD': 'Loading',
        'R': 'Reach',
        'T': 'Thrown',
        '2H': 'Two-Handed',
        'V': 'Versatile',
        'S': 'Special'
    };
    return MAP[c] || '';
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

    function capitalizeCommaSeparated(str) {
        if (typeof str !== 'string') return str;
        return str.split(', ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    }

export { loadTemplate, escapeHtml, formatSourceWithPage, renderEntries, formatInlineRefs, normalizeSource, capitalizeCommaSeparated, propertyNameFromCode };