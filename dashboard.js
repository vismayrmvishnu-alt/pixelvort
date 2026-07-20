// Client Dashboard Session Manager & UI Controller
document.addEventListener('DOMContentLoaded', () => {
    // Check if session token exists
    const sessionData = localStorage.getItem('user_session');
    
    if (!sessionData) {
        console.warn('[Session] No active session found. Redirecting to login portal.');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(sessionData);
        
        // Safety check: if onboarding profile is incomplete, send back to finish setup
        if (!user.name || !user.phone) {
            console.warn('[Session] Profile setup is incomplete. Redirecting to onboarding.');
            window.location.href = 'login.html';
            return;
        }
        
        // Populate greeting & profile details
        const clientGreetingName = document.getElementById('client-greeting-name');
        const profileName = document.getElementById('user-name');
        const profileEmail = document.getElementById('user-email');
        const avatarInitials = document.getElementById('user-initials');
        
        if (clientGreetingName) {
            clientGreetingName.innerText = user.name;
        }
        
        if (profileName) {
            profileName.innerText = user.name;
        }
        
        if (profileEmail) {
            profileEmail.innerText = user.email;
        }
        
        if (avatarInitials) {
            // Generate initials from client name
            const nameParts = user.name.split(' ');
            let initials = 'PV';
            if (nameParts.length > 1) {
                initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
            } else if (nameParts.length === 1 && nameParts[0]) {
                initials = nameParts[0].slice(0, 2).toUpperCase();
            }
            avatarInitials.innerText = initials;
        }
        
        console.log(`[Session] Client session active: ${user.name} (${user.email})`);
        
    } catch (err) {
        console.error('[Session] Error parsing active session:', err);
        localStorage.removeItem('user_session');
        window.location.href = 'login.html';
        return;
    }
    
    // Bind Logout action
    const logoutTrigger = document.getElementById('logout-trigger');
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out of your client portal?')) {
                console.log('[Session] Logging out client...');
                localStorage.removeItem('user_session');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Optional Search Trigger simulation (Cmd+K focus)
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.header-search input');
            if (searchInput) searchInput.focus();
        }
    });
});
