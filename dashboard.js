// Admin Dashboard Session Manager & Interactive UI Controller
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
        const greetingName = document.querySelector('.header-greeting h1');
        const profileName = document.getElementById('user-name');
        const profileEmail = document.getElementById('user-email');
        const avatarInitials = document.getElementById('user-initials');
        
        // Check if the user is an admin or client
        const isClient = user.email !== 'swathy.krishnan.dominar@gmail.com';
        
        if (greetingName) {
            greetingName.innerHTML = `Welcome Back, ${user.name} 👋`;
        }
        
        if (profileName) {
            profileName.innerText = user.name;
        }
        
        if (profileEmail) {
            profileEmail.innerText = isClient ? user.email : 'PV Studios';
        }
        
        if (avatarInitials) {
            // Generate initials from user name
            const nameParts = user.name.split(' ');
            let initials = 'AD';
            if (nameParts.length > 1) {
                initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
            } else if (nameParts.length === 1 && nameParts[0]) {
                initials = nameParts[0].slice(0, 2).toUpperCase();
            }
            avatarInitials.innerText = initials;
        }
        
        console.log(`[Session] Admin/Client session active: ${user.name} (${user.email})`);
        
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
            
            if (confirm('Are you sure you want to log out of the portal?')) {
                console.log('[Session] Logging out...');
                localStorage.removeItem('user_session');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Task Checklist Interactivity: Toggle checked/unchecked
    const taskRows = document.querySelectorAll('.task-check-row');
    taskRows.forEach(row => {
        const checkbox = row.querySelector('.task-checkbox');
        if (checkbox) {
            row.addEventListener('click', () => {
                const isChecked = checkbox.classList.toggle('checked');
                if (isChecked) {
                    checkbox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                } else {
                    checkbox.innerHTML = '';
                }
            });
        }
    });

    // Calendar Interactivity: Toggle active date cells
    const dateCells = document.querySelectorAll('.date-cell');
    dateCells.forEach(cell => {
        cell.addEventListener('click', () => {
            // Remove active from any currently highlighted cell
            const currentActive = document.querySelector('.active-cal-day');
            if (currentActive) {
                currentActive.classList.remove('active-cal-day');
            }
            // Set current clicked day as active
            cell.classList.add('active-cal-day');
        });
    });
    
    // Optional Search Trigger simulation (Cmd+K focus)
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.header-search input');
            if (searchInput) searchInput.focus();
        }
    });
});
