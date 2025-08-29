import { loadTemplate } from '../utils.js';

async function renderSearchCategoryList(container) {
    container.innerHTML = await loadTemplate('/src/templates/search-categories.html');
}

export { renderSearchCategoryList };