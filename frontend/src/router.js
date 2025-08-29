import { renderActionsList, renderActionDetail } from './categories/actions.js';
import { renderBackgroundsList, renderBackgroundDetail } from './categories/backgrounds.js';
import { renderBestiaryList, renderBestiaryDetail } from './categories/bestiary.js';
import { renderConditionsList, renderConditionDetail } from './categories/conditions.js';
import { handleFeatsRoute } from './categories/feats.js';
import { handleItemsRoute } from './categories/items.js';
import { handleLanguagesRoute } from './categories/languages.js';
import { handleOptionalFeaturesRoute } from './categories/optionalfeatures.js';
import { renderRacesList, renderRaceDetail } from './categories/races.js';
import { renderSensesList, renderSenseDetail } from './categories/senses.js';
import { renderSkillsList, renderSkillDetail } from './categories/skills.js';
import { handleSpellsRoute } from './categories/spells.js';
import { renderVariantsList, renderVariantDetail } from './categories/variants.js';
import { renderItemMasteriesList, renderItemMasteryDetail } from './categories/item-masteries.js';
import { renderItemPropertiesList, renderItemPropertyDetail } from './categories/item-properties.js';
import { renderSearchCategoryList } from './search/search.js';

import { renderCharacterList } from './characters/characters.js';

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

export { router };