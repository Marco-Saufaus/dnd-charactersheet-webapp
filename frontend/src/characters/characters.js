import { loadTemplate } from '../utils.js';

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

export { renderCharacterList };