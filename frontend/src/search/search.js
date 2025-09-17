import { loadTemplate } from '../utils.js';

async function renderSearchCategoryList(container) {
    container.innerHTML = await loadTemplate('search-categories');
}

export { renderSearchCategoryList };