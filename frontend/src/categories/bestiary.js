import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, capitalizeCommaSeparated, getBackend } from '../utils.js';

const BACKEND_URL = getBackend();

async function renderBestiaryList(container) {
    container.innerHTML = await loadTemplate('bestiary');
    try {
        const response = await fetch(BACKEND_URL + '/bestiary/search');
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
        const res = await fetch(BACKEND_URL + `/bestiary/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('bestiary-detail');

        // Load bestiary detail card template and replace tokens
        const tpl = await loadTemplate('bestiary-detail');
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
            // Helper function to reset bestiary content without full page reload
            async function resetBestiaryContent() {
                const id = window.location.pathname.split('/').pop();
                try {
                    const res = await fetch(BACKEND_URL + `/bestiary/${id}`);
                    if (!res.ok) throw new Error('Not found');
                    const item = await res.json();
                    const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
                    
                    // Update the card title to base name
                    const cardElem = document.querySelector('.card.bestiary-card');
                    if (cardElem) {
                        const nameElem = cardElem.querySelector('h3');
                        if (nameElem) {
                            nameElem.textContent = item.name ?? '';
                        }
                    }
                    
                    // Re-render the bestiary detail content
                    const el = document.getElementById('bestiary-detail');
                    if (el) {
                        const tpl = await loadTemplate('bestiary-detail');
                        const html = tpl
                            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
                            .replace('{{DESCRIPTION}}', renderBestiaryDescription(item))
                            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
                        el.innerHTML = html;
                    }
                } catch (e) {
                    console.error('Error resetting bestiary:', e);
                }
            }
            
            document.addEventListener('change', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('spell-level-select')) {
                    if (e.target.value === '') {
                        // Reset to base creature without page reload
                        resetBestiaryContent();
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
            // Helper function to reset bestiary content without full page reload (shared with spell level)
            async function resetBestiaryContent() {
                const id = window.location.pathname.split('/').pop();
                try {
                    const res = await fetch(BACKEND_URL + `/bestiary/${id}`);
                    if (!res.ok) throw new Error('Not found');
                    const item = await res.json();
                    const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
                    
                    // Update the card title to base name
                    const cardElem = document.querySelector('.card.bestiary-card');
                    if (cardElem) {
                        const nameElem = cardElem.querySelector('h3');
                        if (nameElem) {
                            nameElem.textContent = item.name ?? '';
                        }
                    }
                    
                    // Re-render the bestiary detail content
                    const el = document.getElementById('bestiary-detail');
                    if (el) {
                        const tpl = await loadTemplate('bestiary-detail');
                        const html = tpl
                            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
                            .replace('{{DESCRIPTION}}', renderBestiaryDescription(item))
                            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
                        el.innerHTML = html;
                    }
                } catch (e) {
                    console.error('Error resetting bestiary:', e);
                }
            }
            
            document.addEventListener('change', function(e) {
                if (e.target && e.target.classList && e.target.classList.contains('class-level-select')) {
                    if (e.target.value === '') {
                        // Reset to base creature without page reload
                        resetBestiaryContent();
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

export { renderBestiaryList, renderBestiaryDetail, renderBestiaryDescription };