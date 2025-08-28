// Capitalize the first letter of each comma-separated word in a string
    function capitalizeCommaSeparated(str) {
        if (typeof str !== 'string') return str;
        return str.split(', ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    }
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

    } else if (path === '/bestiary') {
        renderBestiaryList(container);
    } else if (path.startsWith('/bestiary/')) {
        renderBestiaryDetail(container);    

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

    } else if (path.startsWith('/spells')) {
        handleSpellsRoute(container);

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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading background:', e);
        const el = document.getElementById('background-detail');
        if (el) el.textContent = 'Error loading background';
    }
}

// ---------------------------
// Bestiary
// ---------------------------

async function renderBestiaryList(container) {
    container.innerHTML = await loadTemplate('/src/templates/bestiary.html');
    try {
        const response = await fetch('http://localhost:8000/bestiary/search');
        const bestiary = await response.json();

        const tbody = document.querySelector('#bestiary-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(bestiary) || bestiary.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No bestiary entries found</td></tr>';
            return;
        }

        bestiary.forEach(b => {
            const row = document.createElement('tr');
            const src = formatSourceWithPage(b.source, b.page);
            row.innerHTML = `
        <td><a href="/bestiary/${b.name}" data-link>${b.name ?? ''}</a></td>
        <td>${src}</td>
      `;
            tbody.appendChild(row);
        });
    } catch (error) {
        const tbody = document.querySelector('#bestiary-table tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2">Error loading bestiary</td></tr>';
        }
    }
}

async function renderBestiaryDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="bestiary-detail">Loading…</div>
  `;
    try {
        const res = await fetch(`http://localhost:8000/bestiary/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('bestiary-detail');

        // Load bestiary detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/bestiary-detail.html');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', renderBestiaryDescription(item))
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading bestiary:', e);
        const el = document.getElementById('bestiary-detail');
        if (el) el.textContent = 'Error loading bestiary';
    }
}

function renderBestiaryDescription(entry) {
    if (!entry) return '';
    // Stat block fields
    // Helper maps
    const SIZE_MAP = {
        't': 'Tiny',
        's': 'Small',
        'm': 'Medium',
        'l': 'Large',
        'h': 'Huge',
        'g': 'Gargantuan',
    };
    const ALIGNMENT_MAP = {
        'l': 'Lawful',
        'n': 'Neutral',
        'c': 'Chaotic',
        'g': 'Good',
        'e': 'Evil',
        'u': 'Unaligned',
    };
    // Capitalize type
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    // Size
    let sizeStr = '';
    if (Array.isArray(entry.size)) {
        const mapped = entry.size.map(s => SIZE_MAP[s.toLowerCase()] || capitalize(s));
        if (mapped.length === 1) {
            sizeStr = mapped[0];
        } else if (mapped.length === 2) {
            sizeStr = mapped.join(' or ');
        } else if (mapped.length > 2) {
            sizeStr = mapped.slice(0, -1).join(', ') + ', or ' + mapped[mapped.length - 1];
        } else {
            sizeStr = '';
        }
    } else if (entry.size) {
        sizeStr = SIZE_MAP[String(entry.size).toLowerCase()] || capitalize(entry.size);
    }
    // Type
    let typeStr = '';
    if (entry.type) {
        if (typeof entry.type === 'string') {
            typeStr = capitalize(entry.type);
        } else if (typeof entry.type === 'object') {
            // Handle {type: {choose: [...]}} or similar
            function joinWithCommasAndOr(arr) {
                if (!Array.isArray(arr) || arr.length === 0) return '';
                if (arr.length === 1) return capitalize(arr[0]);
                if (arr.length === 2) return capitalize(arr[0]) + ' or ' + capitalize(arr[1]);
                return arr.slice(0, -2).map(capitalize).join(', ') + (arr.length > 2 ? ', ' : '') + capitalize(arr[arr.length-2]) + ' or ' + capitalize(arr[arr.length-1]);
            }
            if (Array.isArray(entry.type.choose)) {
                typeStr = joinWithCommasAndOr(entry.type.choose);
            } else if (entry.type.type && Array.isArray(entry.type.type.choose)) {
                typeStr = joinWithCommasAndOr(entry.type.type.choose);
            } else if (entry.type.type && typeof entry.type.type === 'string') {
                typeStr = capitalize(entry.type.type);
            } else {
                typeStr = '';
            }
        }
    }
    // Alignment
    let alignmentStr = '';
    if (entry.alignment) {
        alignmentStr = ALIGNMENT_MAP[String(entry.alignment).toLowerCase()] || capitalize(entry.alignment);
    }
    // Compose type line
    const type = [sizeStr + " " + typeStr + ", " + alignmentStr];
    let ac = Array.isArray(entry.ac) ? entry.ac.map(a => a.special || a.ac || a).join(', ') : entry.ac;
    let hp = typeof entry.hp === 'object' ? (entry.hp.special || entry.hp.average || '') : entry.hp;
    const speed = (() => {
        if (!entry.speed) return '';
        if (typeof entry.speed === 'object') {
            const entries = Object.entries(entry.speed).filter(([k, v]) => k !== 'canHover' && v);
            // If only walk is present, just show the number
            if (entries.length === 1 && entries[0][0] === 'walk') {
                const v = entries[0][1];
                if (typeof v === 'object' && v.number !== undefined) {
                    return `${v.number} ft.`;
                } else {
                    return `${v} ft.`;
                }
            }
            // Otherwise, show all modes
            function renderSpeedMode(label, v) {
                let num = '';
                let cond = '';
                if (typeof v === 'object') {
                    num = v.number !== undefined ? v.number : '';
                    cond = v.condition ? ` ${v.condition}` : '';
                } else {
                    num = v;
                }
                // Always add 'ft.' after the number
                let numFt = num !== '' ? `${num} ft.` : '';
                return `${label}${label ? ' ' : ''}${numFt}${cond}`.trim();
            }
            if (entries.length === 1) {
                return entries
                    .map(([k, v]) => {
                        let label = k.capitalize();
                        return renderSpeedMode(label, v);
                    })
                    .join(', ');
            } else {
                return entries
                    .map(([k, v]) => {
                        let label = k === 'walk' ? '' : k.charAt(0).toUpperCase() + k.slice(1);
                        return renderSpeedMode(label, v);
                    })
                    .join(', ');
            }
        }
        return entry.speed;
    })();
    // Render ability table with name, score, mod, save in vertical layout
    function abilityMod(score) {
        if (typeof score !== 'number') score = Number(score);
        if (!Number.isFinite(score)) return '';
        const mod = Math.floor((score - 10) / 2);
        return (mod >= 0 ? '+' : '') + mod;
    }
    // Try to get save values from entry.saves or entry.savingThrowForced
    const saveObj = entry.saves || entry.savingThrowForced || {};
    function getSave(ability, score) {
        if (saveObj && typeof saveObj === 'object' && saveObj[ability] != null) {
            return (saveObj[ability] >= 0 ? '+' : '') + saveObj[ability];
        }
        return abilityMod(score);
    }
    // Helper to build a row for a set of abilities, with cell classes for styling
    function buildAbilityRow(abilities, rowClass) {
        return abilities.map(a => {
            const label = a.toUpperCase();
            const score = entry[a] ?? '';
            const mod = abilityMod(score);
            const save = getSave(a, score);
            return `
                <td class="cell-ability ${rowClass}"><strong>${label}</strong></td>
                <td class="cell-abilityscore ${rowClass}">${score}</td>
                <td class="cell-mod ${rowClass}">${mod}</td>
                <td class="cell-save ${rowClass}">${save}</td>
            `;
        }).join('');
    }
    const abilities = `
        <table class="bestiary-abilities-vertical">
            <thead>
                <tr>
                    <th></th><th></th><th>MOD</th><th>SAVE</th>
                    <th></th><th></th><th>MOD</th><th>SAVE</th>
                    <th></th><th></th><th>MOD</th><th>SAVE</th>
                </tr>
            </thead>
            <tbody>
                <tr class="row-1">
                    ${buildAbilityRow(['str','dex','con'], 'row-1')}
                </tr>
                <tr class="row-2">
                    ${buildAbilityRow(['int','wis','cha'], 'row-2')}
                </tr>
            </tbody>
        </table>
    `;
    let senses = capitalizeCommaSeparated(entry.senses?.join?.(', ') || entry.senses);
    if (entry.passive != null && entry.passive !== '') {
        senses = senses ? `${senses}, passive Perception ${entry.passive}` : `Passive Perception ${entry.passive}`;
    }
    let languages = capitalizeCommaSeparated(entry.languages?.join?.(', ') || entry.languages);
    let immunities = '';
    if (Array.isArray(entry.conditionImmune) && entry.conditionImmune.length) {
        immunities = entry.conditionImmune
            .map(c => renderEntries(`{@Condition ${c.charAt(0).toUpperCase() + c.slice(1)}|XPHB}`).replace(/^<p>|<\/p>$/g, ''))
            .join(', ');
    }
    let resistances = capitalizeCommaSeparated(entry.resist?.join?.(', ') || entry.resist);
    // Build spell level dropdown if available
    let spellLevelDropdown = '';
    let classLevelDropdown = '';
    if (entry.summonedBySpellLevel) {
        // Get all levels above the highest in summonedBySpellLevel, up to 9
        const levels = Array.isArray(entry.summonedBySpellLevel) ? entry.summonedBySpellLevel.map(Number) : [Number(entry.summonedBySpellLevel)];
        const maxLevel = Math.max(...levels);
        const allLevels = [];
        for (let lvl = maxLevel; lvl <= 9; lvl++) {
            allLevels.push(lvl);
        }
        spellLevelDropdown = `<select class="spell-level-select">
            <option value="" selected>-</option>
            ${allLevels.map(lvl => `<option value='${escapeHtml(String(lvl))}'${(lvl === entry.spellLevel || lvl === entry.spell_level) ? ' selected' : ''}>${escapeHtml(String(lvl))}</option>`).join('')}
        </select>`;
        // Add delegated event listener if not already present
        if (!window._spellLevelSelectListenerAdded) {
            document.addEventListener('change', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('spell-level-select')) {
                    if (e.target.value === '') {
                        // Re-render the base statblock by reloading the current route
                        router();
                        return;
                    }
                    // Update the name
                    // Get the creature name from the URL path
                    const pathParts = window.location.pathname.split('/').filter(Boolean);
                    let creatureName = '';
                    if (pathParts.length > 1 && pathParts[0].toLowerCase() === 'bestiary') {
                        creatureName = decodeURIComponent(pathParts[1] || '');
                    }
                    if (creatureName) {
                        // Get the base name (remove any previous (xth-Level Spell) suffix)
                        let baseName = creatureName.replace(/ \(\d+(st|nd|rd|th)-Level Spell\)$/, '');

                        // Format the level as ordinal
                        const level = Number(e.target.value || 0);
                        let ordinal = level + 'th';
                        if (level === 1) ordinal = '1st';
                        else if (level === 2) ordinal = '2nd';
                        else if (level === 3) ordinal = '3rd';
                        else if ([4,5,6,7,8,9].includes(level)) ordinal = level + 'th';

                        const newName = `${baseName} (${ordinal}-Level Spell)`;
                        // Find the closest card and update its h3
                        const cardElem = e.target.closest('.card.bestiary-card');
                        if (cardElem) {
                            const nameElem = cardElem.querySelector('h3');
                            if (nameElem) {
                                nameElem.textContent = newName;
                            }
                        }
                    }
                    
                    // Find the closest statblock container
                    const statblock = e.target.closest('.bestiary-statblock');
                    if (!statblock) {
                        return;
                    }
                    if (creatureName.toLowerCase().includes("celestial spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const a2 = document.querySelector('#bestiary-actions-a2');
                        const a3 = document.querySelector('#bestiary-actions-a3');
                        if (acP) {
                                const newAC = 11 + Number(e.target.value || 0);
                                acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span> + 2 (Defender only)';
                        }
                        if (hpP) {
                                const newHP = 40 + 10 * (Number(e.target.value || 0) - 5);
                                hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                                const newMA = Math.floor(Number(e.target.value || 0) / 2);
                                a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + newMA + '</span> attacks.';
                        }
                        if (a1) {
                                const newA1 = 2 + Number(e.target.value || 0);
                                a1.innerHTML = '<strong>Radiant Bow (Avenger Only).</strong> Ranged Attack Roll: Bonus equals your spell attack modifier, range 600 ft. Hit: 2d6 + <span class="bestiary-stat-changed">' + newA1 + '</span> Radiant damage.';
                        }
                        if (a2) {
                                const newA2 = 3 + Number(e.target.value || 0);
                                a2.innerHTML = '<strong>Radiant Mace (Defender Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d10 + <span class="bestiary-stat-changed">' + newA2 + '</span> Radiant damage, and the spirit can choose itself or another creature it can see within 10 feet of the target. The chosen creature gains 1d10 Temporary Hit Points.';
                        }
                        if (a3) {
                                const newA3 = Number(e.target.value || 0);
                                a3.innerHTML = '<strong>Healing Touch (1/Day).</strong> The spirit touches another creature. The target regains Hit Points equal to 2d8 + <span class="bestiary-stat-changed">' + newA3 + '</span>.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("aberrant spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const a2 = document.querySelector('#bestiary-actions-a2');
                        const a3 = document.querySelector('#bestiary-actions-a3');
                        if (acP) {
                            const newAC = 11 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 40 + 10 * (Number(e.target.value || 0) - 4);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const newMA = Math.floor(Number(e.target.value || 0) / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + newMA + '</span> attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const newA1 = 3 + spellLevel;
                            a1.innerHTML = '<strong>Claw (Slaad Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d10 + <span class="bestiary-stat-changed">' + newA1 + '</span> Slashing damage, and the target can\'t regain Hit Points until the start of the spirit\'s next turn.';
                        }
                        if (a2) {
                            const spellLevel = Number(e.target.value || 0);
                            const newA2 = 3 + spellLevel;
                            a2.innerHTML = '<strong>Eye Ray (Beholderkin Only).</strong> Ranged Attack Roll: Bonus equals your spell attack modifier, range 150 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + newA2 + '</span> Psychic damage.';
                        }
                        if (a3) {
                            const spellLevel = Number(e.target.value || 0);
                            const newA3 = 3 + spellLevel;
                            a3.innerHTML = '<strong>Psychic Slam (Mind Flayer Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + newA3 + '</span> Psychic damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("animated object")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            // No AC formula provided, skip or add if needed
                        }
                        if (hpP) {
                            // No HP formula provided, skip or add if needed
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const d4 = spellLevel - 4;
                            const d6 = spellLevel - 3;
                            const d12 = spellLevel - 3;
                            a1.innerHTML = '<strong>Slam.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: Force damage equal to <span class="bestiary-stat-changed">' + d4 + 'd4 + 3</span>, <span class="bestiary-stat-changed">' + d6 + 'd6 + 3</span> + your spellcasting ability modifier (Large), or <span class="bestiary-stat-changed">' + d12 + 'd12 + 3</span> + your spellcasting ability modifier (Huge).';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("bestial spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            const newAC = 11 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> ' + newAC;
                        }
                        if (hpP) {
                            const newHPAir = 20 + 5 * (Number(e.target.value || 0) - 2);
                            const newHPLand = 30 + 5 * (Number(e.target.value || 0) - 2);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHPAir + '</span> (Air only) or <span class="bestiary-stat-changed">' + newHPLand + '</span> (Land and Water only)';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> Rend attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 4 + spellLevel;
                            a1.innerHTML = '<strong>Rend.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + bonus + '</span> Piercing damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("construct spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            const newAC = 13 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 40 + 15 * (Number(e.target.value || 0) - 4);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> Slam attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 4 + spellLevel;
                            a1.innerHTML = '<strong>Slam.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + bonus + '</span> Bludgeoning damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("draconic spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            const newAC = 14 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 50 + 10 * (Number(e.target.value || 0) - 5);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> Rend attacks, and it uses Breath Weapon.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 4 + spellLevel;
                            a1.innerHTML = '<strong>Rend.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 10 ft. Hit: 1d6 + <span class="bestiary-stat-changed">' + bonus + '</span> Piercing damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("elemental spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            const newAC = 11 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 50 + 10 * (Number(e.target.value || 0) - 4);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> Slam attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 4 + spellLevel;
                            a1.innerHTML = '<strong>Slam.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d10 + <span class="bestiary-stat-changed">' + bonus + '</span> Bludgeoning (Earth only), Cold (Water only), Lightning (Air only), or Fire (Fire only) damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("fey spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        if (acP) {
                            const newAC = 12 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 30 + 10 * (Number(e.target.value || 0) - 3);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> Fey Blade attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a1.innerHTML = '<strong>Fey Blade.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 2d6 + <span class="bestiary-stat-changed">' + bonus + '</span> Force damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("fiendish spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const a2 = document.querySelector('#bestiary-actions-a2');
                        const a3 = document.querySelector('#bestiary-actions-a3');
                        if (acP) {
                            const newAC = 12 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHPDemon = 50 + 15 * (Number(e.target.value || 0) - 6);
                            const newHPDevil = 40 + 15 * (Number(e.target.value || 0) - 6);
                            const newHPYugoloth = 60 + 15 * (Number(e.target.value || 0) - 6);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHPDemon + '</span> (Demon only) or <span class="bestiary-stat-changed">' + newHPDevil + '</span> (Devil only) or <span class="bestiary-stat-changed">' + newHPYugoloth + '</span> (Yugoloth only)';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a1.innerHTML = '<strong>Bite (Demon Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d12 + <span class="bestiary-stat-changed">' + bonus + '</span> Necrotic damage.';
                        }
                        if (a2) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a2.innerHTML = '<strong>Claws (Yugoloth Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + bonus + '</span> Slashing damage. Immediately after the attack hits or misses, the spirit can teleport up to 30 feet to an unoccupied space it can see.';
                        }
                        if (a3) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a3.innerHTML = '<strong>Fiery Strike (Devil Only).</strong> Bonus equals your spell attack modifier, reach 5 ft. or range 150 ft. Hit: 2d6 + <span class="bestiary-stat-changed">' + bonus + '</span> Fire damage.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("giant insect")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const a2 = document.querySelector('#bestiary-actions-a2');
                        if (acP) {
                            const newAC = 11 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 30 + 10 * (Number(e.target.value || 0) - 4);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The insect makes <span class="bestiary-stat-changed">' + numAttacks + '</span> attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a1.innerHTML = '<strong>Poison Jab.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 10 ft. Hit: 1d6 + <span class="bestiary-stat-changed">' + bonus + '</span> Piercing damage plus 1d4 Poison damage.';
                        }
                        if (a2) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a2.innerHTML = '<strong>Web Bolt (Spider Only).</strong> Ranged Attack Roll: Bonus equals your spell attack modifier, range 60 ft. Hit: 1d10 + <span class="bestiary-stat-changed">' + bonus + '</span> Bludgeoning damage, and the target\'s Speed is reduced to 0 until the start of the insect\'s next turn.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("otherworldly steed")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const ba3 = document.querySelector('#bestiary-bonusactions-a3');
                        if (acP) {
                            const newAC = 10 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> <span class="bestiary-stat-changed">' + newAC + '</span>';
                        }
                        if (hpP) {
                            const newHP = 5 + 10 * (Number(e.target.value || 0));
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            a1.innerHTML = '<strong>Otherworldly Slam.</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + spellLevel + '</span> Radiant (Celestial), Psychic (Fey), or Necrotic (Fiend) damage.';
                        }
                        if (ba3) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = spellLevel;
                            ba3.innerHTML = '<strong>Healing Touch (Celestial Only; Recharges after a Long Rest).</strong> One creature within 5 feet of the steed regains a number of Hit Points equal to 2d8 + <span class="bestiary-stat-changed">' + bonus + '</span>.';
                        }
                    }
                    else if (creatureName.toLowerCase().includes("undead spirit")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        const a_ma = document.querySelector('#bestiary-actions-ma');
                        const a1 = document.querySelector('#bestiary-actions-a1');
                        const a2 = document.querySelector('#bestiary-actions-a2');
                        const a3 = document.querySelector('#bestiary-actions-a3');
                        if (acP) {
                            const newAC = 11 + Number(e.target.value || 0);
                            acP.innerHTML = '<strong>AC</strong> ' + newAC;
                        }
                        if (hpP) {
                            const newHPGhostly = 30 + 10 * (Number(e.target.value || 0) - 3);
                            const newHPSkeletal = 20 + 10 * (Number(e.target.value || 0) - 3);
                            hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHPGhostly + '</span> (Ghostly and Putrid only) or <span class="bestiary-stat-changed">' + newHPSkeletal + '</span> (Skeletal only)';
                        }
                        if (a_ma) {
                            const spellLevel = Number(e.target.value || 0);
                            const numAttacks = Math.floor(spellLevel / 2);
                            a_ma.innerHTML = '<strong>Multiattack.</strong> The spirit makes <span class="bestiary-stat-changed">' + numAttacks + '</span> attacks.';
                        }
                        if (a1) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a1.innerHTML = '<strong>Deathly Touch (Ghostly Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d8 + <span class="bestiary-stat-changed">' + bonus + '</span> Necrotic damage, and the target has the Frightened condition until the end of its next turn.';
                        }
                        if (a2) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a2.innerHTML = '<strong>Grave Bolt (Skeletal Only).</strong> Ranged Attack Roll: Bonus equals your spell attack modifier, range 150 ft. Hit: 2d4 + <span class="bestiary-stat-changed">' + bonus + '</span> Necrotic damage.';
                        }
                        if (a3) {
                            const spellLevel = Number(e.target.value || 0);
                            const bonus = 3 + spellLevel;
                            a3.innerHTML = '<strong>Rotting Claw (Putrid Only).</strong> Melee Attack Roll: Bonus equals your spell attack modifier, reach 5 ft. Hit: 1d6 + <span class="bestiary-stat-changed">' + bonus + '</span> Slashing damage. If the target has the Poisoned condition, it has the Paralyzed condition until the end of its next turn.';
                        }
                    }
                }
            });
            window._spellLevelSelectListenerAdded = true;
        }
    }
    else if (entry.spellLevel ?? entry.spell_level) {
        spellLevelDropdown = `<select class="spell-level-select"><option selected>${escapeHtml(String(entry.spellLevel ?? entry.spell_level))}</option></select>`;
    }
    else if (entry.summonedByClass) {
        // Get all levels above the highest in summonedBySpellLevel, up to 9
        const levels = Array.isArray(entry.summonedByClassLevel) ? entry.summonedByClassLevel.map(Number) : [Number(entry.summonedByClassLevel)];
        const maxLevel = 1;
        const allLevels = [];
        for (let lvl = maxLevel; lvl <= 20; lvl++) {
            allLevels.push(lvl);
        }
        classLevelDropdown = `<select class="class-level-select">
            <option value="" selected>-</option>
            ${allLevels.map(lvl => `<option value='${escapeHtml(String(lvl))}'${(lvl === entry.classLevel || lvl === entry.class_level) ? ' selected' : ''}>${escapeHtml(String(lvl))}</option>`).join('')}
        </select>`;
        // Add delegated event listener if not already present
        if (!window._classLevelSelectListenerAdded) {
            document.addEventListener('change', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('class-level-select')) {
                    if (e.target.value === '') {
                        // Re-render the base statblock by reloading the current route
                        router();
                        return;
                    }
                    // Find the closest statblock container
                    const statblock = e.target.closest('.bestiary-statblock');
                    if (!statblock) {
                        return;
                    }
                    const pathParts = window.location.pathname.split('/').filter(Boolean);
                    let creatureName = '';
                    if (pathParts.length > 1 && pathParts[0].toLowerCase() === 'bestiary') {
                        creatureName = decodeURIComponent(pathParts[1] || '');
                    }
                    if (creatureName) {
                        // Get the base name (remove any previous (xth-Level Spell) suffix)
                        let baseName = creatureName.replace(/ \(\d+(st|nd|rd|th)-Level Spell\)$/, '');

                        // Format the level
                        const level = Number(e.target.value || 0);

                        const newName = `${baseName} (Level ${level} Ranger)`;
                        // Find the closest card and update its h3
                        const cardElem = e.target.closest('.card.bestiary-card');
                        if (cardElem) {
                            const nameElem = cardElem.querySelector('h3');
                            if (nameElem) {
                                nameElem.textContent = newName;
                            }
                        }
                    }
                    if (creatureName.toLowerCase().includes("beast of the land")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        if (hpP) {
                                const newHP = 5 + 5 * Number(e.target.value || 0);
                                hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                    }
                    if (creatureName.toLowerCase().includes("beast of the sea")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        if (hpP) {
                            const newHP = 5 + 5 * Number(e.target.value || 0);
                            hpP.innerHTML = '<strong>HP</strong> ' + newHP;
                        }
                    }
                    if (creatureName.toLowerCase().includes("beast of the sky")) {
                        // Find <p> with <strong>AC</strong> and <p> with <strong>HP</strong>
                        const acP = statblock.querySelector('[data-bestiary-ac-line]');
                        const hpP = statblock.querySelector('[data-bestiary-hp-line]');
                        if (hpP) {
                                const newHP = 4 + 4 * Number(e.target.value || 0);
                                hpP.innerHTML = '<strong>HP</strong> <span class="bestiary-stat-changed">' + newHP + '</span>';
                        }
                    }
                }
            });
            window._classLevelSelectListenerAdded = true;
        }
    }


    // Traits and actions
    const renderSection = (arr, label) => {
        if (!Array.isArray(arr) || !arr.length) return '';
        // Apply unique div/id logic for Actions and Bonus Actions sections
        if (label === 'Actions' || label === 'Bonus Actions') {
            let sectionId = label === 'Actions' ? 'bestiary-actions' : 'bestiary-bonusactions';
            // Find index of multiattack (for Actions) or multiattack-like (for Bonus Actions)
            const multiattackIndex = arr.findIndex(
                t => t.name && t.name.trim().toLowerCase() === 'multiattack'
            );
            let nonMAIdx = 1;
            return `<div id="${sectionId}"><h4>${label}</h4>` + arr.map((t, i) => {
                const name = t.name ? `<strong>${escapeHtml(t.name)}.</strong> ` : '';
                let desc = renderEntries(t.entries ?? [])
                    .replace(/^<p>|<\/p>$/g, '')
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                let actionId = '';
                if (label === 'Actions' && i === multiattackIndex) {
                    actionId = 'bestiary-actions-ma';
                } else if (label === 'Actions') {
                    actionId = `bestiary-actions-a${nonMAIdx++}`;
                } else if (label === 'Bonus Actions') {
                    actionId = `bestiary-bonusactions-a${nonMAIdx++}`;
                }
                return `<div id="${actionId}" class="bestiary-section">${name}${desc}</div>`;
            }).join('') + '</div>';
        } else {
            return `<h4>${label}</h4>` + arr.map(t => {
                // Render trait name and description in a single line
                const name = t.name ? `<strong>${escapeHtml(t.name)}.</strong> ` : '';
                // Flatten paragraphs in trait description to plain text
                let desc = renderEntries(t.entries ?? [])
                    .replace(/^<p>|<\/p>$/g, '') // remove leading/trailing <p>
                    .replace(/<p>/g, '')
                    .replace(/<\/p>/g, ' ')
                    .replace(/\s+/g, ' ') // collapse whitespace
                    .trim();
                return `<div class="bestiary-section">${name}${desc}</div>`;
            }).join('');
        }
    };

    // Compose extra info lines below the table
    let extraLines = '';
    if (resistances) extraLines += `<p><strong>Resistances</strong> ${escapeHtml(resistances)}</p>`;
    if (immunities) extraLines += `<p><strong>Immunities</strong> ${immunities}</p>`;
    if (senses) extraLines += `<p><strong>Senses</strong> ${escapeHtml(senses)}</p>`;
    if (languages) extraLines += `<p><strong>Languages</strong> ${escapeHtml(languages)}</p>`;
    if (spellLevelDropdown) extraLines += `<p><strong>Spell Level</strong> ${spellLevelDropdown}</p>`;
    if (classLevelDropdown) extraLines += `<p><strong>Class Level</strong> ${classLevelDropdown}</p>`;

    return `
        <div class="bestiary-statblock">
            <p>${escapeHtml(type)}</p>
            <p data-bestiary-ac-line><strong>AC</strong> ${escapeHtml(ac ?? '')}</p>
            <p data-bestiary-hp-line><strong>HP</strong> ${escapeHtml(hp ?? '')}</p>
            <p><strong>Speed</strong> ${escapeHtml(speed ?? '')}</p>
            <p><strong>Initiative</strong> ${escapeHtml(abilityMod(entry.dex) ?? '')}</p>
            <table class="bestiary-abilities"><tr>${abilities}</tr></table>
            ${extraLines}
        </div>
        ${renderSection(entry.trait, 'Traits')}
        ${renderSection(entry.action, 'Actions')}
        ${renderSection(entry.bonus, 'Bonus Actions')}
    `;
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
        const res = await fetch(`http://localhost:8000/items/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('item-detail');

        // Load item detail card template and replace tokens
        const tpl = await loadTemplate('/src/templates/item-details.html');

        // Helper to fetch a base item by name|SRC
        async function fetchBaseItem(baseItemStr) {
            if (!baseItemStr) return null;
            let [name, src] = String(baseItemStr).split('|');
            name = (name || '').trim();
            src = (src || '').trim();
            if (!name) return null;
            // Try backend endpoint: /items/{name}?source={src}
            let url = `http://localhost:8000/items/${encodeURIComponent(name)}`;
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
            return `<p class="item-stats">${parts.join(' • ')}</p>`;
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
                    lines.push(filtered.join(', '));
                }
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

            const propDetails = await Promise.all(propNames.map(n => fetchSafe(`http://localhost:8000/item-properties/${encodeURIComponent(n)}`)));
            const masteryDetails = await Promise.all(masteryNames.map(n => fetchSafe(`http://localhost:8000/item-masteries/${encodeURIComponent(n)}`)));

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
                    const res = await fetch(`http://localhost:8000/item-groups/${encodeURIComponent(extractedName)}`);
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
        el.innerHTML = html;

    } catch (e) {
        console.error('Error loading skill:', e);
        const el = document.getElementById('skill-detail');
        if (el) el.textContent = 'Error loading skill';
    }
}

// ---------------------------
// Spells
// ---------------------------

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
    container.innerHTML = await loadTemplate('/src/templates/spells.html');
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

    // Compose HTML
    const html = `
<div class="card spell-card">
  <h3>${escapeHtml(item.name ?? '')}</h3>
  <div><strong>${headerLine}</strong></div>
  <div><strong>Casting Time:</strong> ${escapeHtml(castingTime)}</div>
  <div><strong>Range:</strong> ${escapeHtml(range)}</div>
  <div><strong>Components:</strong> ${escapeHtml(components)}</div>
    <div><strong>Duration:</strong> ${duration}</div>
  <section style="margin-top:1em;">${description}</section>
  ${scalingNote}
  <p><strong>Source:</strong> ${escapeHtml(displaySource)}${item.page != null ? ` p.${item.page}` : ''}</p>
</div>
`;
    el.innerHTML = html;

    } catch (e) {
        console.error('Error loading spell:', e);
        const el = document.getElementById('spell-detail');
        if (el) el.textContent = 'Error loading spell';
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
            .replace('{{DESCRIPTION}}', renderEntries(item.entries ?? []) || '')
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
        case 'M': return 'melee Weapon';
        case 'R': return 'ranged weapon';
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

// Parse 5eTools-style inline refs like {@skill Insight|XPHB}
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

        // Custom handling for spirit statblock action tags
        if (type === 'actsave') {
            // e.g., {@actSave wis} or {@actSave wis|XPHB}
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
        // {@atkr m} or {@atkr r} or similar
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

// Map 5eTools weapon property codes to display names for lookup
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

router();
