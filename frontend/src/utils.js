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

        if (it.type === 'table') {
            const caption = it.caption ? `<caption>${escapeHtml(it.caption)}</caption>` : '';
            const colLabels = Array.isArray(it.colLabels) ? it.colLabels : [];
            const colStyles = Array.isArray(it.colStyles) ? it.colStyles : [];
            const rows = Array.isArray(it.rows) ? it.rows : [];
            
            // Generate table header
            let headerHtml = '';
            if (colLabels.length > 0) {
                headerHtml = '<thead><tr>';
                colLabels.forEach((label, idx) => {
                    const style = colStyles[idx] ? ` class="${escapeHtml(colStyles[idx])}"` : '';
                    headerHtml += `<th${style}>${formatInlineRefs(label)}</th>`;
                });
                headerHtml += '</tr></thead>';
            }
            
            // Generate table body
            let bodyHtml = '<tbody>';
            rows.forEach(row => {
                if (!Array.isArray(row)) return;
                bodyHtml += '<tr>';
                row.forEach((cell, idx) => {
                    const style = colStyles[idx] ? ` class="${escapeHtml(colStyles[idx])}"` : '';
                    const cellContent = typeof cell === 'string' ? formatInlineRefs(cell) : escapeHtml(String(cell || ''));
                    bodyHtml += `<td${style}>${cellContent}</td>`;
                });
                bodyHtml += '</tr>';
            });
            bodyHtml += '</tbody>';
            
            return `<div class="class-progression-table feature-table"><table class="table table-striped">${caption}${headerHtml}${bodyHtml}</table></div>`;
        }

        return '';
    };

    return entries.map(render).join('');
}

function formatInlineRefs(str) {
    if (!str || typeof str !== 'string') return '';
    // Regex captures: type (letters or digits), inner content up to closing }
    // This now supports tags like {@5etools feat|feats.html}
    const refRegex = /\{@([a-zA-Z0-9]+)(?:\s+([^}]+))?}/g;
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

        // Inline italic formatting: {@i flavor text}
        if (type === 'i') {
            return `<em>${escapeHtml(display)}</em>`;
        }
        // Inline bold formatting (common in 5etools): {@b important text}
        if (type === 'b') {
            return `<strong>${escapeHtml(display)}</strong>`;
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

        // Special-case: generic feats listing reference from 5etools root tag
        if (type === '5etools' && display.toLowerCase() === 'feat') {
            return '<a href="/feats/general-feats" data-link title="Feat">Feat</a>';
        }

        // Special-case: Epic Boon category filter. Input tag: {@filter Epic Boon feat|feats|category=EB}

        if (type === 'filter') {
            const dl = display.toLowerCase();
            // Epic boon special case
            if (dl === 'epic boon feat' || dl === 'epic boon') {
                return '<a href="/feats/epic-boons" data-link title="Epic Boon">Epic Boon feat</a>';
            }
            // Generic spell filter of form: {@filter Cantrips|spells|level=0|class=Wizard}
            const category = (parts[1] || '').toLowerCase();
            if (category === 'spells') {
                const params = parts.slice(2);
                const paramMap = {};
                params.forEach(p => {
                    const [k, v] = p.split('=');
                    if (k && v) paramMap[k.trim().toLowerCase()] = v.trim();
                });
                if (paramMap.level != null) {
                    // Direct class based filter
                    if (paramMap.class) {
                        const level = encodeURIComponent(paramMap.level);
                        const cls = encodeURIComponent(paramMap.class.toLowerCase());
                        const href = `/spells/${cls}/${level}`;
                        return `<a href="${href}" data-link title="${escapeHtml(display)}">${escapeHtml(display)}</a>`;
                    }
                    // Subclass based filter (e.g., subclass=Rogue: Arcane Trickster). Map certain subclasses to their spell list class.
                    if (paramMap.subclass) {
                        // Extract the part after ':' (if any) as the subclass name
                        const rawSubclass = paramMap.subclass.split(':').slice(-1)[0].trim().toLowerCase();
                        const SUBCLASS_BASE_CLASS = {
                            'arcane trickster': 'wizard',
                            'eldritch knight': 'wizard'
                        };
                        const base = SUBCLASS_BASE_CLASS[rawSubclass];
                        if (base) {
                            const level = encodeURIComponent(paramMap.level);
                            const href = `/spells/${encodeURIComponent(base)}/${level}`;
                            return `<a href="${href}" data-link title="${escapeHtml(display)}">${escapeHtml(display)}</a>`;
                        }
                    }
                }
            }
            // Fall through: if not recognized, continue normal handling below
        }

        if (type === 'variantrule' && parts.length >= 3 && parts[2]) {
            display = parts[2];
            const dl = display.toLowerCase();
            if (dl === 'short' || dl === 'short rest') {
                return '<a href="/variant-rules/short rest" data-link title="Short">Short</a>';
            }
            if (dl === 'proficiency bonus' || dl === 'proficiency bonus') {
                return '<a href="/variant-rules/proficiency" data-link title="Proficiency Bonus">Proficiency Bonus</a>';
            }
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

function getBackend() {
    // Runtime configuration - placeholder gets replaced at container startup
    const runtimeUrl = '__API_BASE_URL_PLACEHOLDER__';
    
    // If runtime placeholder wasn't replaced, use default (for local development)
    if (runtimeUrl.includes('PLACEHOLDER')) {
        return 'http://localhost:8000';
    }
    
    return runtimeUrl;
}

export { loadTemplate, escapeHtml, formatSourceWithPage, renderEntries, formatInlineRefs, normalizeSource, capitalizeCommaSeparated, propertyNameFromCode, getBackend };