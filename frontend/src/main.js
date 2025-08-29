import './style.css'
import { router } from './router.js';


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