import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries, capitalizeCommaSeparated, getBackend, formatInlineRefs } from '../utils.js';

const BACKEND_URL = getBackend();

// D&D 5e proficiency bonus by level
function getProficiencyBonus(level) {
    return Math.floor((level - 1) / 4) + 2;
}

// Slugify a feature name with level to form a stable anchor ID
function featureSlug(name, level) {
    const base = String(name || 'feature').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'feature';
    const lvl = level ? `-${level}` : '';
    return `feature-${base}${lvl}`;
}

// Sanitize renderEntries HTML for inline use: remove outer <p>, collapse newlines/spaces
function sanitizeInlineHtml(html) {
    if (html == null) return '';
    let s = String(html).trim();
    // Strip a single wrapping <p>...</p>
    s = s.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '');
    // Collapse newlines and excessive spaces
    s = s.replace(/\s*\n\s*/g, ' ');
    // Remove spaces between tags
    s = s.replace(/>\s+</g, '><');
    return s.trim();
}

// Build clickable skill HTML using 5etools {@skill ...} tags
function toSkillTagHtml(name) {
    if (!name) return '';
    const str = String(name).trim();
    if (!str) return '';
    // If already a 5e tag, render directly
    if (str.includes('{@')) {
        return sanitizeInlineHtml(renderEntries([str]));
    }
    const pretty = str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const tag = `{@skill ${pretty}}`;
    const html = renderEntries([tag]);
    return sanitizeInlineHtml(html) || escapeHtml(pretty);
}

// Format values that appear inside class table groups (cells may be numbers, strings, arrays, or objects)
function formatClassTableCell(value, ctx = {}) {
    const columnLabel = (ctx.columnLabel || '').toLowerCase();
    if (value == null) return '—';

    // Primitive
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
        // Display zero as hyphen per requirement
        if (value === 0 || (t === 'string' && value.trim() === '0')) return '-';

        // Special-case: Unarmored Movement (Monk) should render as "+N ft."
        if (columnLabel.includes('unarmored movement')) {
            const num = t === 'number' ? value : parseInt(String(value), 10);
            if (Number.isFinite(num)) return num === 0 ? '-' : `+${num} ft.`;
        }

        return String(value);
    }

    // Arrays: join formatted parts
    if (Array.isArray(value)) {
        return value.map(v => formatClassTableCell(v)).join(', ');
    }

    // Objects: handle known shapes used by 5etools
    if (typeof value === 'object') {
        // e.g., { type: 'dice', toRoll: [{ number: 1, faces: 6 }], rollable: true } -> "1d6"
        if (value.type === 'dice' && Array.isArray(value.toRoll) && value.toRoll.length > 0) {
            const parts = value.toRoll.map(d => {
                const num = (typeof d.number === 'number') ? d.number : 1;
                if (typeof d.faces === 'number' && d.faces > 0) {
                    if (num === 0) return '-';
                    return `${num}d${d.faces}`;
                }
                if (num === 0) return '-';
                return String(num);
            });
            const text = parts.join(' + ');
            return text.trim() === '0' ? '-' : text;
        }

        // e.g., { type: 'bonus', value: 2 } -> "+2"
        if (Object.prototype.hasOwnProperty.call(value, 'value')) {
            const v = value.value;
            if (v === 0 || (typeof v === 'string' && v.trim() === '0')) return '-';

            // Special-case: Unarmored Movement (Monk) should render as "+N ft."
            if (columnLabel.includes('unarmored movement')) {
                const num = typeof v === 'number' ? v : parseInt(String(v), 10);
                if (Number.isFinite(num)) return num === 0 ? '-' : `+${num} ft.`;
            }

            if (value.type === 'bonus' && (typeof v === 'number' || (typeof v === 'string' && v.trim()))) {
                return `+${v}`;
            }
            return String(v ?? '—');
        }

        // e.g., dice objects { number: 2, faces: 6 } -> "2d6"
        if (
            Object.prototype.hasOwnProperty.call(value, 'number') &&
            Object.prototype.hasOwnProperty.call(value, 'faces')
        ) {
            return `${value.number}d${value.faces}`;
        }

        // Fallback: try to stringify meaningful fields or return dash
        const vals = Object.values(value).filter(v => v != null && v !== '');
        if (vals.length) {
            const txt = vals.map(v => (typeof v === 'object' ? '' : String(v))).filter(Boolean).join(' ');
            return txt.trim() === '0' ? '-' : txt;
        }
        return '—';
    }

    // Last resort
    return '—';
}

// Generate class progression table HTML
function generateClassProgressionTable(classData) {
    const features = classData.classFeatures || [];
    const tableGroups = classData.classTableGroups || [];

    // Build columns and rows by concatenating all classTableGroups in order
    // If there are no groups, there will be no additional columns
    const finalColumns = [];
    const finalRows = Array.from({ length: 20 }, () => []);
    if (Array.isArray(tableGroups) && tableGroups.length > 0) {
        tableGroups.forEach(group => {
            const cols = Array.isArray(group.colLabels) ? group.colLabels : [];
            cols.forEach(c => finalColumns.push(c));

            // Standard rows (non-spell slot progression)
            const rowsStandard = Array.isArray(group.rows) ? group.rows : [];
            // Spell slot progression rows (5etools uses rowsSpellProgression for caster tables)
            const rowsSpell = Array.isArray(group.rowsSpellProgression) ? group.rowsSpellProgression : [];

            // Choose which set(s) to process. If both exist, append standard first then spell (edge case; normally only one). Each contributes its own columns already captured in colLabels order.
            const rowSets = [];
            if (rowsStandard.length) rowSets.push(rowsStandard);
            if (rowsSpell.length) rowSets.push(rowsSpell);

            // If neither rows nor rowsSpellProgression provided but group has a caster title and casterProgression present, we could auto-generate later (future enhancement).
            rowSets.forEach(rows => {
                for (let i = 0; i < 20; i++) {
                    const row = rows[i];
                    if (Array.isArray(row)) {
                        row.forEach(cell => finalRows[i].push(cell));
                    } else if (row !== undefined) {
                        finalRows[i].push(row);
                    } else {
                        // No data for this level in this row set; leave gap (will render as —)
                    }
                }
            });
        });
    }
    
    // Group features by level
    const featuresByLevel = {};
    for (let i = 1; i <= 20; i++) {
        featuresByLevel[i] = [];
    }
    
    features.forEach(feature => {
        let featureName, level;
        if (typeof feature === 'string') {
            // Format: "Feature Name|Class|Source|Level"
            const parts = feature.split('|');
            featureName = parts[0];
            level = parseInt(parts[3]) || 1;
        } else if (feature.classFeature) {
            // Object format
            const parts = feature.classFeature.split('|');
            featureName = parts[0];
            level = parseInt(parts[3]) || 1;
        }
        
        if (featureName && level >= 1 && level <= 20) {
            featuresByLevel[level].push(featureName);
        }
    });
    
    // Build table HTML
    let tableHTML = '<div class="class-progression-table"><table class="table table-striped">';
    
    // Header row
    tableHTML += '<thead><tr>';
    tableHTML += '<th>Level</th>';
    tableHTML += '<th>Proficiency Bonus</th>';
    tableHTML += '<th>Features</th>';
    finalColumns.forEach(col => {
        // Allow filter tags (e.g., {@filter Cantrips|spells|level=0|class=Wizard}) to render as links
        tableHTML += `<th>${formatInlineRefs(col)}</th>`;
    });
    tableHTML += '</tr></thead>';
    
    // Data rows
    tableHTML += '<tbody>';
    for (let level = 1; level <= 20; level++) {
        tableHTML += '<tr>';
        
        // Level column
        const levelSuffix = level === 1 ? 'st' : level === 2 ? 'nd' : level === 3 ? 'rd' : 'th';
        tableHTML += `<td>${level}${levelSuffix}</td>`;
        
        // Proficiency bonus column
        tableHTML += `<td>+${getProficiencyBonus(level)}</td>`;
        
        // Features column
        const levelFeatures = featuresByLevel[level] || [];
        if (levelFeatures.length > 0) {
            const links = levelFeatures.map(fname => {
                const slug = featureSlug(fname, level);
                return `<a class="feature-link" href="#${slug}">${escapeHtml(fname)}</a>`;
            }).join(', ');
            tableHTML += `<td>${links}</td>`;
        } else {
            tableHTML += '<td>—</td>';
        }
        
        // Additional columns from classTableGroups or manual data
        finalColumns.forEach((col, colIndex) => {
            const rowData = finalRows[level - 1];
            if (rowData && rowData[colIndex] !== undefined) {
                const cellText = formatClassTableCell(rowData[colIndex], { columnLabel: col });
                // If the text itself contains a tag pattern, pass through formatInlineRefs; otherwise escape
                const rendered = /\{@[a-zA-Z0-9]+/.test(cellText) ? formatInlineRefs(cellText) : escapeHtml(cellText);
                tableHTML += `<td>${rendered}</td>`;
            } else {
                tableHTML += '<td>—</td>';
            }
        });
        
        tableHTML += '</tr>';
    }
    tableHTML += '</tbody>';
    tableHTML += '</table></div>';
    
    return tableHTML;
}

// Generate core traits section
function generateCoreTraits(classData) {
    const className = classData.name || 'Class';
    
    let html = '<div class="core-traits">';
    html += '<h4>Core Traits</h4>';
    
    // Primary Ability
    if (classData.primaryAbility && Array.isArray(classData.primaryAbility)) {
        const abilities = classData.primaryAbility.map(abilityObj => {
            const keys = Object.keys(abilityObj).filter(key => abilityObj[key] === true);
            return keys.map(key => key.charAt(0).toUpperCase() + key.slice(1)).join(', ');
        }).filter(ability => ability).join(' or ');
        
        if (abilities) {
            html += `<p><strong>Primary Ability:</strong> ${escapeHtml(abilities)}</p>`;
        }
    }
    
    // Hit Point Die
    if (classData.hd && classData.hd.faces) {
        html += `<p><strong>Hit Point Die:</strong> D${classData.hd.faces} per ${escapeHtml(className)} level</p>`;
        html += `<p><strong>Hit Points at Level 1:</strong> ${classData.hd.faces} + Con. modifier</p>`;
        html += `<p><strong>Hit Points per additional ${escapeHtml(className)} Level:</strong> D${classData.hd.faces} + your Con. modifier, or, ${Math.floor((classData.hd.faces + 1) / 2) + 1} + your Con. modifier</p>`;
    }
    
    // Saving Throw Proficiencies
    if (classData.proficiency && Array.isArray(classData.proficiency)) {
        const savingThrows = classData.proficiency.map(prof => {
            switch(prof.toLowerCase()) {
                case 'str': return 'Strength';
                case 'dex': return 'Dexterity';
                case 'con': return 'Constitution';
                case 'int': return 'Intelligence';
                case 'wis': return 'Wisdom';
                case 'cha': return 'Charisma';
                default: return prof.charAt(0).toUpperCase() + prof.slice(1);
            }
        }).join(', ');
        html += `<p><strong>Saving Throw Proficiencies:</strong> ${escapeHtml(savingThrows)}</p>`;
    }
    
    // Skill Proficiencies (clickable)
    if (classData.startingProficiencies && classData.startingProficiencies.skills) {
        const skillProfs = classData.startingProficiencies.skills;
        if (skillProfs.length > 0 && skillProfs[0].choose) {
            const skillCount = skillProfs[0].choose.count || 2;
            const skillListHtml = skillProfs[0].choose.from.map(skill => toSkillTagHtml(skill)).join(', ');
            html += `<p><strong>Skill Proficiencies:</strong> Choose ${skillCount}: ${skillListHtml}</p>`;
        }
    }
    
    // Weapon Proficiencies
    if (classData.startingProficiencies && classData.startingProficiencies.weapons) {
        const weaponProfs = classData.startingProficiencies.weapons.map(weapon => {
            return weapon.charAt(0).toUpperCase() + weapon.slice(1);
        }).join(' and ');
        html += `<p><strong>Weapon Proficiencies:</strong> ${escapeHtml(weaponProfs)} weapons</p>`;
    }
    
    // Armor Training
    if (classData.startingProficiencies && classData.startingProficiencies.armor) {
        const armorList = classData.startingProficiencies.armor.filter(armor => armor !== 'shield');
        const hasShield = classData.startingProficiencies.armor.includes('shield');
        
        let armorText = '';
        if (armorList.length > 0) {
            const armorTypes = armorList.map(armor => armor.charAt(0).toUpperCase() + armor.slice(1));
            if (armorTypes.length === 1) {
                armorText = `${armorTypes[0]} armor`;
            } else if (armorTypes.length === 2) {
                armorText = `${armorTypes[0]} and ${armorTypes[1]} armor`;
            } else {
                armorText = `${armorTypes.slice(0, -1).join(', ')}, and ${armorTypes[armorTypes.length - 1]} armor`;
            }
        }
        
        if (hasShield) {
            if (armorText) {
                armorText += ' and Shields';
            } else {
                armorText = 'Shields';
            }
        }
        
        if (armorText) {
            html += `<p><strong>Armor Training:</strong> ${escapeHtml(armorText)}</p>`;
        }
    }
    
    // Starting Equipment
    if (classData.startingEquipment && classData.startingEquipment.defaultData) {
        const defaultData = classData.startingEquipment.defaultData;

        // Collect options from objects which may contain multiple lettered keys (A, B, C, ...)
        const parsedOptions = [];

        const toItemTagHtml = (raw) => {
            const [rawName, rawSrc] = String(raw).split('|');
            const name = (rawName || '').trim();
            const prettyName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const src = ((rawSrc || '').trim() || 'XPHB').toUpperCase();
            const tag = `{@item ${prettyName}|${src}}`;
            const html = renderEntries([tag]);
            return sanitizeInlineHtml(html) || escapeHtml(prettyName);
        };

        defaultData.forEach(obj => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj)
                .filter(k => /^[A-Z]$/.test(k))
                .sort()
                .forEach(letter => {
                    const entries = obj[letter];
                    if (!Array.isArray(entries)) return;
                    const items = [];
                    entries.forEach(entry => {
                        if (entry.item) {
                            const qty = entry.quantity ? `${entry.quantity} ` : '';
                            const itemHtml = toItemTagHtml(entry.item);
                            items.push(`${qty}${itemHtml}`);
                        } else if (entry.value != null) {
                            // Values are in copper (per 5etools); convert to GP
                            items.push(`${Math.floor(entry.value / 100)} GP`);
                        }
                    });
                    if (items.length) parsedOptions.push({ letter, text: items.join(', ') });
                });
        });

        // De-duplicate by letter (keep first occurrence) and sort by letter
        const seenLetters = new Set();
        const uniqueOptions = parsedOptions.filter(opt => {
            if (seenLetters.has(opt.letter)) return false;
            seenLetters.add(opt.letter);
            return true;
        }).sort((a, b) => a.letter.localeCompare(b.letter));

        if (uniqueOptions.length) {
            const letters = uniqueOptions.map(o => o.letter);
            const choiceText = (() => {
                if (letters.length === 1) return '';
                if (letters.length === 2) return `Choose ${letters[0]} or ${letters[1]}`;
                const head = letters.slice(0, -1).join(', ');
                const last = letters[letters.length - 1];
                return `Choose ${head}, or ${last}`;
            })();

            const optionStrings = uniqueOptions.map(o => `(${o.letter}) ${o.text}`);
            const optionsHtml = (() => {
                if (optionStrings.length === 1) return optionStrings[0];
                if (optionStrings.length === 2) return `${optionStrings[0]}; or ${optionStrings[1]}`;
                return `${optionStrings.slice(0, -1).join('; ')}; or ${optionStrings[optionStrings.length - 1]}`;
            })();
            const lead = choiceText ? `${choiceText}: ` : '';
            html += `<p><strong>Starting Equipment:</strong> ${escapeHtml(lead)}${optionsHtml}</p>`;
        }
    }
    
    // Multiclassing
    html += '<h5>Multiclassing</h5>';
    html += '<p>To qualify for a new class, you must have a score of at least 13 in the primary ability of the new class and your current classes.</p>';
    
    if (classData.multiclassing && classData.multiclassing.proficienciesGained) {
        const multiProfs = classData.multiclassing.proficienciesGained;
        
        if (multiProfs.weapons) {
            const weaponProfs = multiProfs.weapons.map(weapon => {
                return weapon.charAt(0).toUpperCase() + weapon.slice(1);
            }).join(' and ');
            html += `<p><strong>Weapon Proficiencies:</strong> ${escapeHtml(weaponProfs)} weapons</p>`;
        }
        
        // Skill Proficiencies on multiclassing (choose-from list) — place before tool and armor (clickable)
        if (Array.isArray(multiProfs.skills) && multiProfs.skills.length > 0) {
            const chooseObj = multiProfs.skills[0].choose;
            if (chooseObj && Array.isArray(chooseObj.from)) {
                const skillCount = chooseObj.count || 1;
                const skillListHtml = chooseObj.from.map(skill => toSkillTagHtml(skill)).join(', ');
                html += `<p><strong>Skill Proficiencies:</strong> Choose ${skillCount}: ${skillListHtml}</p>`;
            }
        }
        
        // Tool Proficiencies (render 5etools tags as clickable links via renderEntries)
        if (multiProfs.tools || multiProfs.toolProficiencies) {
            const parts = [];
            if (Array.isArray(multiProfs.tools)) {
                multiProfs.tools.forEach(t => {
                    const str = String(t).trim();
                    if (!str) return;
                    if (str.includes('{@')) {
                        parts.push(sanitizeInlineHtml(renderEntries([str])));
                    } else {
                        parts.push(escapeHtml(str));
                    }
                });
            }
            if (parts.length > 0) {
                html += `<p><strong>Tool Proficiencies:</strong> ${parts.join(', ')}</p>`;
            }
        }
        
        if (multiProfs.armor) {
            const armorList = multiProfs.armor.filter(armor => armor !== 'shield');
            const hasShield = multiProfs.armor.includes('shield');
            
            let armorText = '';
            if (armorList.length > 0) {
                const armorTypes = armorList.map(armor => armor.charAt(0).toUpperCase() + armor.slice(1));
                if (armorTypes.length === 1) {
                    armorText = `${armorTypes[0]} armor`;
                } else if (armorTypes.length === 2) {
                    armorText = `${armorTypes[0]} and ${armorTypes[1]} armor`;
                } else {
                    armorText = `${armorTypes.slice(0, -1).join(', ')}, and ${armorTypes[armorTypes.length - 1]} armor`;
                }
            }
            
            if (hasShield) {
                if (armorText) {
                    armorText += ' and Shields';
                } else {
                    armorText = 'Shields';
                }
            }
            
            if (armorText) {
                html += `<p><strong>Armor Training:</strong> ${escapeHtml(armorText)}</p>`;
            }
        }
    }
    
    html += '</div>';
    return html;
}

// Generate subclass selection interface
function generateSubclassSelection(subclasses, subclassFeaturesFull) {
    if (!subclasses || subclasses.length === 0) {
        return '<div class="subclass-selection"><h4>Subclasses</h4><p><em>No subclasses available for this class.</em></p></div>';
    }
    
    let html = '<div class="subclass-selection">';
    html += '<h4>Subclasses</h4>';
    html += '<div class="subclass-buttons">';
    
    // Helper to escape double quotes for attribute context
    const attrEscape = (str) => String(str).replace(/"/g, '&quot;');

    subclasses.forEach(subclass => {
        const displayName = subclass.shortName || subclass.name;
        const subclassId = `${subclass.name}-${subclass.source}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        // Filter subclass features for this specific subclass using the shortName as the primary key
        const subclassKey = subclass.shortName || subclass.name;
        const subclassSpecificFeatures = (subclassFeaturesFull || []).filter(feature => 
            feature.subclassShortName === subclassKey
        );
        
        // Encode subclass features JSON to avoid breaking attribute with quotes/apostrophes
        const featuresPayload = encodeURIComponent(JSON.stringify(subclassSpecificFeatures));
        const tableGroupsPayload = encodeURIComponent(JSON.stringify(subclass.subclassTableGroups || []));
        html += `
            <button 
                class="subclass-button" 
                data-subclass-id="${subclassId}"
                data-subclass-name="${attrEscape(subclass.name)}"
                data-subclass-source="${attrEscape(subclass.source)}"
                data-subclass-features="${featuresPayload}"
                data-subclass-groups="${tableGroupsPayload}"
                onclick="toggleSubclass('${subclassId}', this)"
            >
                ${escapeHtml(displayName)}
            </button>
        `;
    });
    
    html += '</div>';
    html += '</div>';
    
    return html;
}

// Generate class features list
function generateClassFeaturesList(classData) {
    const featuresFull = classData.classFeaturesFull || [];
    
    if (featuresFull.length === 0) {
        return '<div class="class-features-list"><h4>Class Features</h4><p><em>No class features found.</em></p></div>';
    }
    
    // Group features by level
    const featuresByLevel = {};
    for (let i = 1; i <= 20; i++) {
        featuresByLevel[i] = [];
    }
    
    featuresFull.forEach(feature => {
        const level = feature.level || 1;
        if (level >= 1 && level <= 20) {
            featuresByLevel[level].push(feature);
        }
    });
    
    // Precompute quick lookup by name
    const featureByName = new Map();
    featuresFull.forEach(f => {
        if (f && f.name) featureByName.set(f.name, f);
    });


    const CUNNING_STRIKE_CHILD_NAMES = new Set([
        'Poison (Cost: 1d6)',
        'Trip (Cost: 1d6)',
        'Withdraw (Cost: 1d6)'
    ]);

    const DEVIOUS_STRIKE_CHILD_NAMES = new Set([
        'Knock Out (Cost: 6d6)',
        'Obscure (Cost: 3d6)',
        'Daze (Cost: 2d6)'
    ]);

    // Collect child feature objects if present
    const cunningStrikeChildren = Array.from(CUNNING_STRIKE_CHILD_NAMES)
        .map(n => featureByName.get(n))
        .filter(Boolean);

    // Remove child features from their level bucket so they are not rendered separately
    if (cunningStrikeChildren.length) {
        cunningStrikeChildren.forEach(child => {
            const lvl = child.level || 1;
            if (featuresByLevel[lvl]) {
                featuresByLevel[lvl] = featuresByLevel[lvl].filter(f => f !== child);
            }
        });
    }

    // Collect child feature objects if present
    const deviousStrikeChildren = Array.from(DEVIOUS_STRIKE_CHILD_NAMES)
        .map(n => featureByName.get(n))
        .filter(Boolean);

    // Remove child features from their level bucket so they are not rendered separately
    if (deviousStrikeChildren.length) {
        deviousStrikeChildren.forEach(child => {
            const lvl = child.level || 1;
            if (featuresByLevel[lvl]) {
                featuresByLevel[lvl] = featuresByLevel[lvl].filter(f => f !== child);
            }
        });
    }

    // Build features list HTML
    let html = '<div class="class-features-list">';
    html += '<h4>Class Features</h4>';
    html += '<div class="features-by-level">';
    
    for (let level = 1; level <= 20; level++) {
        const levelFeatures = featuresByLevel[level];
        if (levelFeatures.length > 0) {
            levelFeatures.forEach(feature => {
                const isCunningStrike = feature.name === 'Cunning Strike';
                // NOTE: Data uses plural "Devious Strikes"; previous code compared singular and never matched.
                const isDeviousStrike = feature.name === 'Devious Strikes';
                // Universal detection for subclass feature placeholders (e.g., "Rogue Subclass", "Wizard Subclass")
                const fname = feature.name || '';
                const isSubclassFeatureSlot = /\bSubclass$/i.test(fname) || fname.toLowerCase() === 'subclass feature';
                const anchorId = featureSlug(feature.name, level);
                html += `<h5 id="${anchorId}">Level ${level}: ${escapeHtml(feature.name || 'Unknown Feature')}</h5>`;

                // Render the feature description using renderEntries
                const description = renderEntries(feature.entries || []);
                // Wrap description; placeholder feature message removed per request
                html += `<div class="feature-description">${description}`;

                // Insert a dynamic placeholder that is shown only when no subclass is selected
                if (isSubclassFeatureSlot) {
                    const show = selectedSubclasses.size === 0; // evaluated at first render; later toggles use updateSubclassPlaceholders()
                    html += `<div class="no-subclass-placeholder" data-subclass-placeholder data-subclass-slot-level="${level}" style="${show ? '' : ''}"><em>No Subclass Selected</em></div>`;
                }

                // Inline the child options under Cunning Strike
                // Helper to append strike option blocks (reuses existing cunning-strike CSS classes)
                const appendStrikeOptions = (parentHtml, opts) => {
                    opts.forEach(opt => {
                        parentHtml += `<div class="strike-option"><strong>${escapeHtml(opt.name)}.</strong>`;
                        const optDesc = renderEntries(opt.entries || []);
                        let cleaned = optDesc
                            .replace(/^<p>/i, '')
                            .replace(/<\/p>$/i, '')
                            .replace(/<\/p>\s*<p>/gi, ' ')
                            .trim()
                            .replace(/\s{2,}/g, ' ');
                        parentHtml += `<div class="strike-option-body">${cleaned}</div></div>`;
                    });
                    return parentHtml;
                };

                if (isCunningStrike && cunningStrikeChildren.length) {
                    html = appendStrikeOptions(html, cunningStrikeChildren);
                }
                if (isDeviousStrike && deviousStrikeChildren.length) {
                    html = appendStrikeOptions(html, deviousStrikeChildren);
                }

                html += '</div>'; // close feature-description
            });
        }
    }
    
    html += '</div>';
    html += '</div>';
    
    return html;
}

// Global function to handle subclass selection
window.toggleSubclass = function(subclassId, buttonElement) {
    const button = buttonElement;
    const isSelected = button.classList.contains('selected');
    
    if (isSelected) {
        // Deselect
        button.classList.remove('selected');
        removeSelectedSubclass(subclassId);
    } else {
        // Select
        button.classList.add('selected');
        let features = [];
        let tableGroups = [];
        try {
            features = JSON.parse(decodeURIComponent(button.dataset.subclassFeatures || '[]'));
        } catch (e) {
            console.warn('Failed to parse subclass features payload', e);
        }
        try {
            tableGroups = JSON.parse(decodeURIComponent(button.dataset.subclassGroups || '[]'));
        } catch (e) {
            console.warn('Failed to parse subclass table groups payload', e);
        }
        addSelectedSubclass(subclassId, {
            name: button.dataset.subclassName,
            source: button.dataset.subclassSource,
            features,
            tableGroups
        });
    }
    
    updateSubclassPlaceholders();
    updateProgressionTableForSelectedSubclasses();
};

// Store selected subclasses
let selectedSubclasses = new Map();

function addSelectedSubclass(id, data) {
    selectedSubclasses.set(id, data);
}

function removeSelectedSubclass(id) {
    selectedSubclasses.delete(id);
}

// Rebuild the class progression table including any selected subclass spellcasting progressions
function updateProgressionTableForSelectedSubclasses() {
    if (!window.currentClassData) return;
    const baseData = window.currentClassData;
    // Start with original class table groups (store a cached copy on first run to avoid duplication)
    if (!baseData._originalClassTableGroups) {
        baseData._originalClassTableGroups = Array.isArray(baseData.classTableGroups) ? JSON.parse(JSON.stringify(baseData.classTableGroups)) : [];
    }
    const combinedGroups = JSON.parse(JSON.stringify(baseData._originalClassTableGroups));

    // Append subclass table groups for selected subclasses that appear to grant spellcasting (heuristic: has rowsSpellProgression or colLabels referencing 'Prepared Spells' or spell slot levels)
    selectedSubclasses.forEach(sub => {
        const groups = Array.isArray(sub.tableGroups) ? sub.tableGroups : [];
        groups.forEach(g => {
            const hasSpellRows = Array.isArray(g.rowsSpellProgression) && g.rowsSpellProgression.length;
            const labels = Array.isArray(g.colLabels) ? g.colLabels.join(' ').toLowerCase() : '';
            const looksLikeSpells = /prepared spells|1st|spell slots per spell level/.test((g.title || '').toLowerCase()) || /level=1|subclass=|spells/.test(labels);
            if (hasSpellRows || looksLikeSpells) {
                // Tag columns with subclass short name prefix if multiple spellcasting subclasses might be selected
                if (selectedSubclasses.size > 1 && Array.isArray(g.colLabels)) {
                    g.colLabels = g.colLabels.map(lbl => `(${sub.name}) ${lbl}`);
                }
                combinedGroups.push(g);
            }
        });
    });

    const workingData = { ...baseData, classTableGroups: combinedGroups };
    const newTableHtml = generateClassProgressionTable(workingData);
    const tableEl = document.querySelector('.class-progression-table');
    if (tableEl) {
        // Replace entire wrapper
        tableEl.outerHTML = newTableHtml;
    }
}

// Ensure inline subsection headings (e.g., "Initiative") end with a period exactly once
function punctuateInlineFeatureHeadings() {
    // Target only the inline strong elements inside rendered feature body paragraphs
    const nodes = document.querySelectorAll('.subclass-feature.major-feature .feature-description p > strong');
    nodes.forEach(el => {
        const txt = (el.textContent || '').trim();
        // If it already ends with typical terminal punctuation, leave it
        if (!txt || /[.!?:]$/.test(txt)) return;
        el.textContent = txt + '.';
    });
}

// Show or hide subclass placeholders based on whether any subclass is selected
function updateSubclassPlaceholders() {
    const noneSelected = selectedSubclasses.size === 0;
    const placeholders = document.querySelectorAll('[data-subclass-placeholder]');
    // Helper: show/hide the Rogue subclass guidance paragraph (or similar) if present
    const toggleRogueSubclassGuidance = (show) => {
        // We search for a paragraph containing the distinctive leading sentence.
        const guidanceSelectorRoot = document.getElementById('class-detail');
        if (!guidanceSelectorRoot) return;
        const MATCH_SNIPPET = 'You gain a Rogue subclass of your choice';
        const paragraphs = guidanceSelectorRoot.querySelectorAll('p');
        paragraphs.forEach(p => {
            if (p.textContent && p.textContent.includes(MATCH_SNIPPET)) {
                // Store original display once
                if (!p.dataset.originalDisplay) {
                    p.dataset.originalDisplay = p.style.display || '';
                }
                p.style.display = show ? p.dataset.originalDisplay : 'none';
            }
        });
    };
    if (noneSelected) {
        placeholders.forEach(el => {
            el.style.display = '';
            // Add a dedicated class so we can style this specific placeholder in CSS
            el.innerHTML = '<em class="no-subclass-selected">No Subclass Selected</em>';
        });
        // Ensure the Rogue subclass guidance text is visible again when nothing is selected
        toggleRogueSubclassGuidance(true);
        return;
    }

    // Build a cache of subclass features grouped by level using the full feature objects
    const subclassFeaturesByLevel = {}; // level -> { subclassName: [feature objects] }
    selectedSubclasses.forEach(sub => {
        const features = Array.isArray(sub.features) ? sub.features : [];
        features.forEach(feature => {
            // Now we have full feature objects instead of reference strings
            if (!feature || !feature.level || !feature.name) return;
            
            const level = feature.level;
            if (level < 1 || level > 20) return;
            
            if (!subclassFeaturesByLevel[level]) subclassFeaturesByLevel[level] = {};
            if (!subclassFeaturesByLevel[level][sub.name]) subclassFeaturesByLevel[level][sub.name] = [];
            subclassFeaturesByLevel[level][sub.name].push(feature);
        });
    });

    placeholders.forEach(el => {
        const levelAttr = el.getAttribute('data-subclass-slot-level');
        const levelNum = parseInt(levelAttr, 10);
        el.style.display = '';
        const perSubclass = subclassFeaturesByLevel[levelNum] || {};
        const subclassNames = Object.keys(perSubclass);
        if (!subclassNames.length) {
            el.innerHTML = '<em>No subclass features at this level for selected subclass(es)</em>';
            return;
        }
        
        // Build detailed feature descriptions instead of just summaries
        const parts = subclassNames.map(scName => {
            let features = perSubclass[scName];
            // Ensure subclass summary (feature whose name == subclass name) appears first
            if (Array.isArray(features) && features.length > 1) {
                const idxSummary = features.findIndex(f => f && f.name && f.name.toLowerCase() === scName.toLowerCase());
                if (idxSummary > 0) {
                    const copy = features.slice();
                    const [summary] = copy.splice(idxSummary, 1);
                    copy.unshift(summary);
                    features = copy; // reordered
                }
            }
            // GENERAL CONTAINER COLLAPSE:
            // For a single level's feature set, identify any feature that references other features at the SAME level
            // via refSubclassFeature entries, and collapse those referenced children under the container.

            // Build quick lookup by name for this level
            const byName = new Map();
            features.forEach(f => { if (f && f.name) byName.set(f.name, f); });

            // Determine container relationships
            const containerChildren = new Map(); // featureObj -> [childFeatureObjs]
            const referencedChildren = new Set();

            const parseRefName = (ref) => {
                if (!ref || typeof ref !== 'object') return null;
                if (ref.type !== 'refSubclassFeature') return null;
                const raw = ref.subclassFeature || '';
                return raw.split('|')[0] || null;
            };

            features.forEach(f => {
                if (!f || !Array.isArray(f.entries)) return;
                // Do NOT treat the subclass summary (its name == subclass name) as a container that absorbs its children.
                if (f.name && f.name.toLowerCase() === scName.toLowerCase()) return;
                const refNames = f.entries
                    .map(parseRefName)
                    .filter(Boolean);
                if (!refNames.length) return; // not a container candidate
                // Collect valid same-level children
                const children = refNames
                    .map(n => byName.get(n))
                    .filter(ch => ch && ch !== f && ch.level === f.level);
                if (!children.length) return;
                // Heuristic: require at least one non-ref entry to keep container descriptive
                const hasNonRefContent = f.entries.some(en => !(en && typeof en === 'object' && en.type === 'refSubclassFeature'));
                if (!hasNonRefContent) return; // skip pure aggregator to avoid empty description scenario
                containerChildren.set(f, children);
                children.forEach(ch => referencedChildren.add(ch));
            });

            const featureHtml = features.map((feature, idx) => {
                if (referencedChildren.has(feature)) return ''; // child rendered inside its container

                const isContainer = containerChildren.has(feature);
                if (isContainer) {
                    const children = containerChildren.get(feature);
                    // Split entries into descriptive vs refs
                    const descriptiveEntries = (feature.entries || []).filter(en => !(en && typeof en === 'object' && en.type === 'refSubclassFeature'));
                    const descHtml = sanitizeInlineHtml(renderEntries(descriptiveEntries));
                    const childBlocks = children.map(cf => {
                        const raw = renderEntries(cf.entries || []);
                        const cleaned = raw.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '').trim();
                        return `<p><strong>${escapeHtml(cf.name)}</strong> ${cleaned}</p>`;
                    }).join('');
                    const anchorId = featureSlug(feature.name, feature.level);
                    return `
                        <div class="subclass-feature major-feature" id="${anchorId}">
                            <strong>Level ${feature.level}: ${escapeHtml(feature.name)}</strong>
                            <div class="feature-description">${descHtml ? `<p>${descHtml}</p>` : ''}${childBlocks}</div>
                        </div>
                    `;
                }

                const description = sanitizeInlineHtml(renderEntries(feature.entries || []));
                const showHeading = !(idx === 0 && feature.name && feature.name.toLowerCase() === scName.toLowerCase());
                if (showHeading && feature.level) {
                    const anchorId = featureSlug(feature.name, feature.level);
                    return `
                        <div class="subclass-feature major-feature" id="${anchorId}">
                            <strong>Level ${feature.level}: ${escapeHtml(feature.name)}</strong>
                            <div class="feature-description">${description}</div>
                        </div>
                    `;
                } else if (showHeading) {
                    return `<span class="minor-feature"><strong>${escapeHtml(feature.name)}:</strong> ${description}</span>`;
                }
                return `<div class="feature-description">${description}</div>`;
            }).join(' ');
            
            return `
                <div class="subclass-summary">
                    <strong>${escapeHtml(scName)}:</strong>
                    ${featureHtml}
                </div>
            `;
        });
        el.innerHTML = `<div class="subclass-features-summary">${parts.join('')}</div>`;
    });

    // Hide Rogue subclass guidance text once at least one subclass is selected
    toggleRogueSubclassGuidance(false);

    // After DOM updates, normalize punctuation on inline headings
    punctuateInlineFeatureHeadings();
}

async function renderClassList(container) {
    container.innerHTML = await loadTemplate('classes');
        try {
            const response = await fetch(BACKEND_URL + '/classes/search');
            const classes = await response.json();
    
            const tbody = document.querySelector('#classes-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
    
            if (!Array.isArray(classes) || classes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2">No class entries found</td></tr>';
                return;
            }
    
            classes.forEach(c => {
                const row = document.createElement('tr');
                const src = formatSourceWithPage(c.source, c.page);
                row.innerHTML = `
            <td><a href="/classes/${c.name}" data-link>${c.name ?? ''}</a></td>
            <td>${src}</td>
          `;
                tbody.appendChild(row);
            });
        } catch (error) {
            const tbody = document.querySelector('#classes-table tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="2">Error loading classes</td></tr>';
            }
        }
}

async function renderClassDetail(container) {
    const id = window.location.pathname.split('/').pop();
    container.innerHTML = `
    <div id="class-detail">Loading…</div>
  `;
    try {
        const res = await fetch(BACKEND_URL + `/classes/${id}`);
        if (!res.ok) throw new Error('Not found');
        const item = await res.json();
        const displaySource = item.source === 'XPHB' ? 'PHB24' : (item.source ?? '');
        const el = document.getElementById('class-detail');

        // Generate the core traits section
        const coreTraits = generateCoreTraits(item);

        // Generate the class progression table
    const progressionTable = generateClassProgressionTable(item);
        
        // Generate the subclass selection interface
        const subclassSelection = generateSubclassSelection(item.subclasses || [], item.subclassFeaturesFull || []);
        
        // Generate the class features list
        const classFeaturesList = generateClassFeaturesList(item);
        
        // Combine the core traits, progression table, subclass selection, class features list, and any existing entries
        const description = coreTraits + progressionTable + subclassSelection + classFeaturesList + (renderEntries(item.entries ?? []) || '');

        // Load class detail card template and replace tokens
        const tpl = await loadTemplate('class-detail');
        const html = tpl
            .replace('{{NAME}}', escapeHtml(item.name ?? ''))
            .replace('{{DESCRIPTION}}', description)
            .replace('{{SOURCE}}', `${displaySource}${item.page != null ? ` p.${item.page}` : ''}`);
    el.innerHTML = html;
    // After rendering, enable delegated click for feature links to smooth-scroll
    enableFeatureLinkNavigation();
    // Persist current class data globally for dynamic table augmentation
    window.currentClassData = item;

    // Clear any previous selections when loading a new class
    selectedSubclasses.clear();
    // Ensure placeholders reflect cleared state
    updateSubclassPlaceholders();
    updateProgressionTableForSelectedSubclasses();

    } catch (e) {
        console.error('Error loading class:', e);
        const el = document.getElementById('class-detail');
        if (el) el.textContent = 'Error loading class';
    }
}

export { renderClassList, renderClassDetail };

// Attach a single delegated listener to handle clicks on feature anchor links within the class detail
function enableFeatureLinkNavigation() {
    const root = document.getElementById('class-detail');
    if (!root) return;
    // Avoid double-binding
    if (root._featureLinkBound) return; 
    root._featureLinkBound = true;
    root.addEventListener('click', (e) => {
        const a = e.target.closest('a.feature-link');
        if (!a) return;
        const hash = a.getAttribute('href');
        if (!hash || !hash.startsWith('#')) return;
        e.preventDefault();
        const id = hash.slice(1);
        const target = document.getElementById(id);
        if (target) {
            // Optional: update location hash without full jump
            history.replaceState(null, '', hash);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Brief highlight effect
            target.classList.add('feature-anchor-highlight');
            setTimeout(() => target.classList.remove('feature-anchor-highlight'), 1500);
        }
    });
}