import { loadTemplate, formatSourceWithPage, escapeHtml, renderEntries } from '../utils.js';

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

export { renderSkillsList, renderSkillDetail };