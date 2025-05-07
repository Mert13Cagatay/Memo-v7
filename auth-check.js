// auth-check.js
(function() {
    // Debug log to see what's happening
    console.log('Auth check running on:', window.location.pathname);
    
    // Get current page name - GitHub Pages daha güvenilir işleme
    const pathParts = window.location.pathname.split('/');
    let pageName = pathParts[pathParts.length - 1];
    
    // Eğer path boşsa veya / ile bitiyorsa, muhtemelen index.html demektir
    if (pageName === '' || pageName === '/') {
        pageName = 'index.html';
    }
    
    console.log('Detected page name:', pageName);
    
    // Skip auth check on these pages - login ve signup ekleyerek daha güvenli hale getiriyoruz
    const publicPages = ['login.html', 'signup.html', 'index.html', '', '/', 'terms-and-conditions.html', 'privacy-policy.html'];
    
    if (publicPages.includes(pageName)) {
        console.log('Public page, skipping auth check');
        return;
    }
    
    // Sonsuz yönlendirme döngüsünü önlemek için kontrol - önemli iyileştirme
    const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
    if (redirectCount > 2) {
        console.error('Too many redirects, breaking potential redirect loop');
        sessionStorage.removeItem('redirectCount');
        sessionStorage.removeItem('redirecting');
        return;
    }
    
    // "redirecting" bayrağı kaldırıldı ve yerine sayaç kullanıldı
    if (sessionStorage.getItem('redirecting') === 'true') {
        sessionStorage.removeItem('redirecting');
        sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
        return;
    }
    
    // Check for user in localStorage first
    const localUser = JSON.parse(localStorage.getItem('memo-current-user'));
    
    if (!localUser || !localUser.loggedIn) {
        console.log('No local user found, redirecting to login');
        sessionStorage.setItem('redirecting', 'true');
        sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
        sessionStorage.setItem('intendedDestination', window.location.href);
        window.location.href = 'login.html';
        return;
    }
    
    // Reset redirect counter since we found a valid user
    sessionStorage.removeItem('redirectCount');
    
    // If we have a local user, check Firebase state
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!user && localUser) {
                // Firebase doesn't have user, but localStorage does
                console.log('Firebase auth missing, but localStorage has user - allowing access');
                return;
            }
            
            if (!user) {
                console.log('No Firebase user, redirecting to login');
                localStorage.removeItem('memo-current-user');
                sessionStorage.setItem('redirecting', 'true');
                sessionStorage.setItem('redirectCount', '1');
                sessionStorage.setItem('intendedDestination', window.location.href);
                window.location.href = 'login.html';
            }
        });
    }
})();