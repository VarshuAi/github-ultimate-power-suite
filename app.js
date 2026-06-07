// Safe LocalStorage Helper for file:/// or restricted environments
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('Storage access blocked:', e);
            return null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('Storage access blocked:', e);
        }
    }
};

// Safe Lucide Icon Renderer Helper
function safeCreateIcons() {
    if (typeof lucide !== 'undefined') {
        try {
            lucide.createIcons();
        } catch (e) {
            console.error('Error rendering Lucide icons:', e);
        }
    } else {
        console.warn('Lucide library is not loaded. Icons will not render.');
    }
}

// Application State
const state = {
    token: safeStorage.getItem('github_mass_follower_pat') || '',
    currentUser: null,
    
    // Sourced Campaigns State (Follow/Unfollow)
    candidates: [],
    sourcePage: 1,
    scannedCount: 0,
    followedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    goal: 30,
    concurrency: 5,
    delay: 500,
    status: 'idle', // idle, sourcing, sourced, running, paused, completed
    queue: [],
    shouldStop: false,
    
    // Campaign Mode
    mode: 'follow', // 'follow' or 'unfollow'
    unfollowOrder: 'oldest', // 'oldest' or 'newest'
    onlyNonFollowers: true,
    onlyInactive: true,
    
    // Matrix Booster State
    boosterStatus: 'idle',
    boosterCycles: 10,
    boosterDelay: 1000,
    boosterStats: { cycles: 0, commits: 0, issues: 0, prs: 0 },
    boosterShouldStop: false,
    
    // Repos, Stars, Gists, Issues
    repos: [],
    starredRepos: [],
    gists: [],
    issues: [],
    selectedRepoId: null,
    trafficChart: null,
    
    // Bulk Selection trackers
    selectedRepos: new Set(),
    selectedIssues: new Set(),
    selectedStars: new Set(),
    selectedGists: new Set()
};

// UI Elements mapping
const els = {
    tokenStatus: document.getElementById('token-status'),
    tokenStatusText: document.getElementById('token-status-text'),
    btnOpenTokenModal: document.getElementById('btn-open-token-modal'),
    apiLimitVal: document.getElementById('api-limit-val'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    
    // Modals
    settingsModal: document.getElementById('settings-modal'),
    patInput: document.getElementById('pat-input'),
    btnSaveToken: document.getElementById('btn-save-token'),
    btnCancelToken: document.getElementById('btn-cancel-token'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    
    deleteConfirmModal: document.getElementById('delete-confirm-modal'),
    deleteCountText: document.getElementById('delete-count-text'),
    deleteConfirmInput: document.getElementById('delete-confirm-input'),
    btnExecuteDelete: document.getElementById('btn-execute-delete'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    
    // Profile Tab
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userProfileUrl: document.getElementById('user-profile-url'),
    userBio: document.getElementById('user-bio'),
    statReposCount: document.getElementById('stat-repos-count'),
    statFollowersCount: document.getElementById('stat-followers-count'),
    statFollowingCount: document.getElementById('stat-following-count'),
    activityTimeline: document.getElementById('activity-timeline'),
    
    // Scope Badges
    scopeFollowBadge: document.getElementById('scope-follow-badge'),
    scopeRepoBadge: document.getElementById('scope-repo-badge'),
    scopeDeleteBadge: document.getElementById('scope-delete-badge'),
    scopeGistBadge: document.getElementById('scope-gist-badge'),
    scopeOrgBadge: document.getElementById('scope-org-badge'),
    
    // Follow/Unfollow Tab Inputs
    tabFollow: document.getElementById('tab-follow'),
    tabUnfollow: document.getElementById('tab-unfollow'),
    followSettingsGroup: document.getElementById('follow-settings-group'),
    unfollowSettingsGroup: document.getElementById('unfollow-settings-group'),
    unfollowOrder: document.getElementById('unfollow-order'),
    filterNonFollowers: document.getElementById('filter-non-followers'),
    filterInactive: document.getElementById('filter-inactive'),
    goalInputLabel: document.getElementById('goal-input-label'),
    scraperSource: document.getElementById('scraper-source'),
    sourceUsernameGroup: document.getElementById('source-username-group'),
    sourceUsername: document.getElementById('source-username'),
    usernameInputLabel: document.getElementById('username-input-label'),
    sourceHelpText: document.getElementById('source-help-text'),
    sourceSearchGroup: document.getElementById('source-search-group'),
    sourceSearch: document.getElementById('source-search'),
    activityThreshold: document.getElementById('activity-threshold'),
    followGoal: document.getElementById('follow-goal'),
    concurrency: document.getElementById('concurrency'),
    scanLimit: document.getElementById('scan-limit'),
    requestDelay: document.getElementById('request-delay'),
    btnInitialize: document.getElementById('btn-initialize'),
    btnLoadMore: document.getElementById('btn-load-more'),
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    
    // Stats Follow Tab
    statScanned: document.getElementById('stat-scanned'),
    statCandidatesCount: document.getElementById('stat-candidates-count'),
    statFollowed: document.getElementById('stat-followed'),
    statFollowedLabel: document.getElementById('stat-followed-label'),
    statSkipped: document.getElementById('stat-skipped'),
    statFailed: document.getElementById('stat-failed'),
    
    // Progress Follow Tab
    statusPulse: document.getElementById('status-pulse'),
    statusLabel: document.getElementById('status-label'),
    progressPercentage: document.getElementById('progress-percentage'),
    progressRatio: document.getElementById('progress-ratio'),
    campaignProgressBar: document.getElementById('campaign-progress-bar'),
    
    // Results & Logs Follow Tab
    emptyResults: document.getElementById('empty-results'),
    candidateGridContainer: document.getElementById('candidate-grid-container'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnExportJson: document.getElementById('btn-export-json'),
    consoleOutput: document.getElementById('console-output'),
    btnClearConsole: document.getElementById('btn-clear-console'),
    
    // Contribution Booster Tab
    boosterCycles: document.getElementById('booster-cycles'),
    boosterDelay: document.getElementById('booster-delay'),
    btnStartBoost: document.getElementById('btn-start-boost'),
    btnStopBoost: document.getElementById('btn-stop-boost'),
    boosterStatCycles: document.getElementById('booster-stat-cycles'),
    boosterStatCommits: document.getElementById('booster-stat-commits'),
    boosterStatIssues: document.getElementById('booster-stat-issues'),
    boosterStatPrs: document.getElementById('booster-stat-prs'),
    matrixGridVisual: document.getElementById('matrix-grid-visual'),
    boosterConsoleOutput: document.getElementById('booster-console-output'),
    
    // Repo Manager Tab
    repoSearch: document.getElementById('repo-search'),
    btnScanRepos: document.getElementById('btn-scan-repos'),
    reposBulkBar: document.getElementById('repos-bulk-bar'),
    repoSelectCount: document.getElementById('repo-select-count'),
    btnBulkArchive: document.getElementById('btn-bulk-archive'),
    btnBulkUnarchive: document.getElementById('btn-bulk-unarchive'),
    btnBulkDelete: document.getElementById('btn-bulk-delete'),
    checkAllRepos: document.getElementById('check-all-repos'),
    reposListContainer: document.getElementById('repos-list-container'),
    
    // Traffic HUD
    trafficRepoSelect: document.getElementById('traffic-repo-select'),
    trafficEmptyState: document.getElementById('traffic-empty-state'),
    trafficDataContainer: document.getElementById('traffic-data-container'),
    trafficViewsCount: document.getElementById('traffic-views-count'),
    trafficClonesCount: document.getElementById('traffic-clones-count'),
    trafficReferrersList: document.getElementById('traffic-referrers-list'),
    
    // README Builder Tab
    readmeTitle: document.getElementById('readme-title'),
    readmeSubtitle: document.getElementById('readme-subtitle'),
    readmeBio: document.getElementById('readme-bio'),
    socialLinkedin: document.getElementById('social-linkedin'),
    socialTwitter: document.getElementById('social-twitter'),
    socialYoutube: document.getElementById('social-youtube'),
    btnReadmePreviewTab: document.getElementById('btn-readme-preview-tab'),
    btnReadmeCodeTab: document.getElementById('btn-readme-code-tab'),
    readmeHtmlPreview: document.getElementById('readme-html-preview'),
    readmeRawEditor: document.getElementById('readme-raw-editor'),
    btnPublishReadme: document.getElementById('btn-publish-readme'),
    widgetStats: document.getElementById('widget-stats'),
    widgetLanguages: document.getElementById('widget-languages'),
    widgetStreak: document.getElementById('widget-streak'),
    
    // Issues Tab
    btnScanIssues: document.getElementById('btn-scan-issues'),
    issuesBulkBar: document.getElementById('issues-bulk-bar'),
    issueSelectCount: document.getElementById('issue-select-count'),
    bulkLabelInput: document.getElementById('bulk-label-input'),
    btnBulkLabel: document.getElementById('btn-bulk-label'),
    btnBulkCloseIssues: document.getElementById('btn-bulk-close-issues'),
    checkAllIssues: document.getElementById('check-all-issues'),
    issuesListContainer: document.getElementById('issues-list-container'),
    
    // Gists & Stars Tab
    btnScanStars: document.getElementById('btn-scan-stars'),
    starsBulkBar: document.getElementById('stars-bulk-bar'),
    starSelectCount: document.getElementById('star-select-count'),
    btnBulkUnstar: document.getElementById('btn-bulk-unstar'),
    starsListContainer: document.getElementById('stars-list-container'),
    btnScanGists: document.getElementById('btn-scan-gists'),
    gistsBulkBar: document.getElementById('gists-bulk-bar'),
    gistSelectCount: document.getElementById('gist-select-count'),
    btnBulkDeleteGists: document.getElementById('btn-bulk-delete-gists'),
    gistsListContainer: document.getElementById('gists-list-container')
};

// Initialize Icons safely
safeCreateIcons();

// Active tab switching
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        
        // Toggle Nav item active
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Toggle panel view
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(target).classList.add('active');
        
        // Update headers
        const titleText = button.querySelector('span').textContent;
        els.pageTitle.textContent = titleText;
        
        if (target === 'panel-profile') els.pageSubtitle.textContent = "Check Personal Access Token scopes and profile metrics.";
        else if (target === 'panel-follow') els.pageSubtitle.textContent = "Concurrently follow active profiles or unfollow non-followers.";
        else if (target === 'panel-booster') els.pageSubtitle.textContent = "Balance contribution grids with simulated cycles of issue, commit, and PR activity.";
        else if (target === 'panel-repos') els.pageSubtitle.textContent = "Bulk archive, archive restore, delete repos, and monitor web clone metrics.";
        else if (target === 'panel-readme') els.pageSubtitle.textContent = "Interactive visual generator for a stunning profile page. Push directly to GitHub.";
        else if (target === 'panel-issues') els.pageSubtitle.textContent = "Batch triage, tag labels, and close open issues or pull requests.";
        else if (target === 'panel-gists') els.pageSubtitle.textContent = "Bulk unstar repositories and clear unwanted Gists in seconds.";
    });
});

// Helper: Add Console Log
function addLog(text, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.innerHTML = `<span style="color: var(--text-dark); font-weight: 500;">[${time}]</span> ${text}`;
    els.consoleOutput.appendChild(line);
    els.consoleOutput.scrollTop = els.consoleOutput.scrollHeight;
}

function addBoosterLog(text, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.innerHTML = `<span style="color: var(--text-dark); font-weight: 500;">[${time}]</span> ${text}`;
    els.boosterConsoleOutput.appendChild(line);
    els.boosterConsoleOutput.scrollTop = els.boosterConsoleOutput.scrollHeight;
}

// Helper: Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch with Authorization Headers
async function ghFetch(endpoint, options = {}) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Mass-Follower-Dashboard'
    };
    if (state.token) {
        headers['Authorization'] = `token ${state.token}`;
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    // Handle Rate Limiting headers
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const resetTime = response.headers.get('X-RateLimit-Reset');
    
    if (remaining !== null) {
        els.apiLimitVal.textContent = `${remaining}/${limit}`;
    }

    if (remaining !== null && parseInt(remaining) < 10) {
        const resetDate = new Date(parseInt(resetTime) * 1000).toLocaleTimeString();
        addLog(`[WARNING] GitHub API Limit warning: ${remaining}/${limit} remaining. Resets at ${resetDate}`, 'warning');
    }

    if (response.status === 403 && remaining === '0') {
        const resetDate = new Date(parseInt(resetTime) * 1000).toLocaleTimeString();
        addLog(`[CRITICAL] GitHub API Rate Limit Exceeded. Resets at ${resetDate}`, 'danger');
        alert('API Rate limit exceeded! Please wait for reset.');
        throw new Error('Rate limit exceeded');
    }

    return response;
}

// Token Scopes Audit & Auditor Badge Updates
function auditTokenScopes(scopesHeader) {
    if (!scopesHeader) {
        document.querySelectorAll('.scope-badge').forEach(b => {
            b.className = 'scope-badge locked';
            b.textContent = 'Locked';
        });
        return;
    }
    
    const scopes = scopesHeader.split(',').map(s => s.trim());
    
    const checkScope = (required, badgeEl) => {
        const unlocked = scopes.some(s => s === required || s.startsWith(required + ':'));
        if (unlocked || required === '') {
            badgeEl.className = 'scope-badge unlocked';
            badgeEl.textContent = 'Unlocked';
        } else {
            badgeEl.className = 'scope-badge locked';
            badgeEl.textContent = 'Locked';
        }
    };
    
    checkScope('user:follow', els.scopeFollowBadge);
    checkScope('repo', els.scopeRepoBadge);
    checkScope('delete_repo', els.scopeDeleteBadge);
    checkScope('gist', els.scopeGistBadge);
    checkScope('read:org', els.scopeOrgBadge);
}

// Fetch Profile stats and public timeline activity
async function loadProfileHUD() {
    try {
        const res = await ghFetch('/user');
        if (res.status === 200) {
            const data = await res.json();
            
            // Render Profile
            els.userAvatar.src = data.avatar_url;
            els.userName.textContent = data.name || data.login;
            els.userProfileUrl.href = data.html_url;
            els.userProfileUrl.textContent = `@${data.login}`;
            els.userBio.textContent = data.bio || 'Developer HUD fully loaded. No bio description.';
            
            els.statReposCount.textContent = data.public_repos + (data.total_private_repos || 0);
            els.statFollowersCount.textContent = data.followers;
            els.statFollowingCount.textContent = data.following;
            
            // Audit Scopes
            const scopesHeader = res.headers.get('X-OAuth-Scopes');
            auditTokenScopes(scopesHeader);
            
            // Sourced repos into traffic dropdown
            loadReposIntoDropdown();
            
            // Load Recent Activity Timeline
            loadActivityTimeline(data.login);
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadActivityTimeline(username) {
    try {
        const res = await ghFetch(`/users/${username}/events/public?per_page=10`);
        if (res.status === 200) {
            const events = await res.json();
            els.activityTimeline.innerHTML = '';
            
            if (!events || events.length === 0) {
                els.activityTimeline.innerHTML = '<div class="empty-state">No recent public events.</div>';
                return;
            }
            
            events.forEach(e => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                
                const time = new Date(e.created_at).toLocaleDateString();
                const type = e.type.replace('Event', '');
                const repo = e.repo.name;
                
                item.innerHTML = `
                    <span class="timeline-time">${time}</span>
                    <div>
                        <strong>${type}</strong> on <a href="https://github.com/${repo}" target="_blank" style="color:var(--secondary); text-decoration:none;">${repo.split('/')[1]}</a>
                    </div>
                `;
                els.activityTimeline.appendChild(item);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

// Validate & Save Credentials
async function validateAndSaveToken(pat) {
    if (!pat) {
        addLog('[ERROR] Please enter a valid Personal Access Token.', 'danger');
        return false;
    }
    
    addLog('[SYSTEM] Verifying credentials status with GitHub API...', 'system');
    els.btnSaveToken.disabled = true;
    
    try {
        const prevToken = state.token;
        state.token = pat;
        const res = await ghFetch('/user');
        
        if (res.status === 200) {
            const userData = await res.json();
            state.currentUser = userData.login;
            safeStorage.setItem('github_mass_follower_pat', pat);
            
            // Success Badge Updates
            els.tokenStatus.className = 'token-status-pill valid';
            els.tokenStatusText.textContent = `Connected: @${userData.login}`;
            const iconSpan = document.getElementById('token-status-icon');
            if (iconSpan) {
                iconSpan.innerHTML = '<i data-lucide="shield-check"></i>';
            }
            safeCreateIcons();
            
            addLog(`[SUCCESS] Credentials approved! Synced as @${userData.login}. (Perms active)`, 'success');
            els.settingsModal.classList.remove('active');
            els.btnInitialize.disabled = false;
            
            // Load dashboard stats
            loadProfileHUD();
            return true;
        } else {
            state.token = prevToken;
            addLog(`[ERROR] Authentication failed (HTTP ${res.status}).`, 'danger');
            alert('Invalid GitHub Token. Please check your credentials.');
            return false;
        }
    } catch (err) {
        console.error(err);
        addLog(`[ERROR] Token verification failed: ${err.message}`, 'danger');
        return false;
    } finally {
        els.btnSaveToken.disabled = false;
    }
}

// Init Token Load
if (state.token) {
    els.patInput.value = state.token;
    validateAndSaveToken(state.token).then(valid => {
        if (!valid) {
            setTimeout(() => {
                els.settingsModal.classList.add('active');
            }, 800);
        }
    });
} else {
    els.btnInitialize.disabled = true;
    setTimeout(() => {
        els.settingsModal.classList.add('active');
    }, 800);
}

// Mode Tabs (Follow / Unfollow Toggle UI)
function switchMode(newMode) {
    if (state.status === 'running' || state.status === 'sourcing') {
        alert("Cannot switch modes while campaign is running or sourcing.");
        return;
    }
    state.mode = newMode;
    
    if (newMode === 'follow') {
        els.tabFollow.classList.add('active');
        els.tabFollow.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        els.tabFollow.style.color = 'white';
        els.tabUnfollow.classList.remove('active');
        els.tabUnfollow.style.background = 'transparent';
        els.tabUnfollow.style.color = 'var(--text-muted)';
        
        els.followSettingsGroup.style.display = 'block';
        els.unfollowSettingsGroup.style.display = 'none';
        els.goalInputLabel.textContent = 'Follow Goal';
        els.statFollowedLabel.textContent = 'Followed';
        els.btnInitialize.innerHTML = '<i data-lucide="search-code"></i> Gather Candidates';
        els.btnStart.innerHTML = '<i data-lucide="play"></i> Start Follows';
    } else {
        els.tabUnfollow.classList.add('active');
        els.tabUnfollow.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        els.tabUnfollow.style.color = 'white';
        els.tabFollow.classList.remove('active');
        els.tabFollow.style.background = 'transparent';
        els.tabFollow.style.color = 'var(--text-muted)';
        
        els.followSettingsGroup.style.display = 'none';
        els.unfollowSettingsGroup.style.display = 'block';
        els.goalInputLabel.textContent = 'Unfollow Goal';
        els.statFollowedLabel.textContent = 'Unfollowed';
        els.btnInitialize.innerHTML = '<i data-lucide="search-code"></i> Scan Following List';
        els.btnStart.innerHTML = '<i data-lucide="play"></i> Start Unfollows';
    }
    safeCreateIcons();
    resetCampaign();
}

els.tabFollow.addEventListener('click', () => switchMode('follow'));
els.tabUnfollow.addEventListener('click', () => switchMode('unfollow'));

// Sourced Campaign Scraper toggles
els.scraperSource.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'search-query') {
        els.sourceUsernameGroup.style.display = 'none';
        els.sourceSearchGroup.style.display = 'flex';
    } else {
        els.sourceUsernameGroup.style.display = 'flex';
        els.sourceSearchGroup.style.display = 'none';
        if (val === 'followers') {
            els.usernameInputLabel.textContent = 'Target Username';
            els.sourceHelpText.textContent = 'Fetches followers of this user.';
            els.sourceUsername.placeholder = 'e.g. torvalds';
        } else if (val === 'following') {
            els.usernameInputLabel.textContent = 'Target Username';
            els.sourceHelpText.textContent = 'Fetches users followed by this user.';
            els.sourceUsername.placeholder = 'e.g. torvalds';
        } else if (val === 'org-members') {
            els.usernameInputLabel.textContent = 'Organization Name';
            els.sourceHelpText.textContent = 'Fetches members of this org.';
            els.sourceUsername.placeholder = 'e.g. google';
        }
    }
});

// Sourced Campaigns Sourcing and worker queues (Follow/Unfollow logic)
async function gatherFollowingList(isAppend = false) {
    const unfollowGoalCount = parseInt(els.followGoal.value) || 30;
    const unfollowOrderVal = els.unfollowOrder.value;
    const scanLimitVal = els.scanLimit.value;
    
    state.status = 'sourcing';
    updateCampaignStatusUI();
    
    state.goal = unfollowGoalCount;
    if (!isAppend) {
        state.candidates = [];
        state.sourcePage = 1;
        els.candidateGridContainer.innerHTML = '';
        state.scannedCount = 0;
        state.followedCount = 0;
        state.skippedCount = 0;
        state.failedCount = 0;
    }
    
    els.emptyResults.style.display = 'none';
    els.candidateGridContainer.style.display = 'grid';
    updateStatsUI();

    addLog(`[SYSTEM] Sourcing following list from GitHub (starting page ${state.sourcePage || 1})...`, 'system');
    
    try {
        let page = state.sourcePage || 1;
        const scanCount = scanLimitVal === 'all' ? Infinity : parseInt(scanLimitVal) || 500;
        const initialCount = state.candidates.length;
        const maxToFetch = initialCount + scanCount;
        addLog(`[SYSTEM] Sourcing limit for this batch: ${scanCount === Infinity ? 'All' : scanCount} followed profiles.`, 'info');

        while (state.candidates.length < maxToFetch) {
            addLog(`[API] Sourcing following list (Page ${page})...`, 'info');
            const res = await ghFetch(`/user/following?per_page=100&page=${page}`);
            
            if (res.status !== 200) {
                const data = await res.json().catch(() => ({}));
                addLog(`[ERROR] Sourcing failed: ${data.message || 'Unknown Error'}`, 'danger');
                break;
            }
            
            const data = await res.json();
            if (!data || data.length === 0) break;
            
            data.forEach(item => {
                if (!state.candidates.some(c => c.username === item.login)) {
                    state.candidates.push({
                        username: item.login,
                        avatar: item.avatar_url,
                        htmlUrl: item.html_url,
                        status: 'pending',
                        lastActiveEvent: 'N/A',
                        lastActiveTime: 'N/A'
                    });
                }
            });
            
            addLog(`[SYSTEM] Gathered ${state.candidates.length} followed profiles.`, 'info');
            page++;
            state.sourcePage = page;
            if (data.length < 100) break;
            await sleep(150);
        }

        if (state.candidates.length === 0) {
            addLog('[WARNING] No followed accounts found.', 'warning');
            els.emptyResults.style.display = 'flex';
            els.candidateGridContainer.style.display = 'none';
            state.status = 'idle';
        } else {
            if (unfollowOrderVal === 'newest' && !isAppend) {
                addLog('[SYSTEM] Reversing list for Newest Followed order...', 'info');
                state.candidates.reverse();
            }
            
            addLog(`[SUCCESS] Harvesting complete. Sourced ${state.candidates.length} profiles. Ready to run!`, 'success');
            state.status = 'sourced';
            renderCandidateCards();
            els.btnStart.disabled = false;
            els.btnReset.disabled = false;
            if (els.btnLoadMore) els.btnLoadMore.disabled = false;
        }
    } catch (err) {
        addLog(`[ERROR] Sourcing failed: ${err.message}`, 'danger');
        state.status = 'idle';
    } finally {
        updateCampaignStatusUI();
    }
}

async function gatherCandidates(isAppend = false) {
    if (state.mode === 'unfollow') {
        await gatherFollowingList(isAppend);
        return;
    }

    const source = els.scraperSource.value;
    const targetUser = els.sourceUsername.value.trim();
    const searchQuery = els.sourceSearch.value.trim();
    const followGoalCount = parseInt(els.followGoal.value) || 30;
    const scanLimitVal = els.scanLimit.value;
    
    if (source !== 'search-query' && !targetUser) {
        addLog('[ERROR] Sourcing parameters username/org required.', 'danger');
        return;
    }
    if (source === 'search-query' && !searchQuery) {
        addLog('[ERROR] Sourcing custom search query required.', 'danger');
        return;
    }
    
    state.status = 'sourcing';
    updateCampaignStatusUI();
    
    state.goal = followGoalCount;
    if (!isAppend) {
        state.candidates = [];
        state.sourcePage = 1;
        els.candidateGridContainer.innerHTML = '';
        state.scannedCount = 0;
        state.followedCount = 0;
        state.skippedCount = 0;
        state.failedCount = 0;
    }
    
    els.emptyResults.style.display = 'none';
    els.candidateGridContainer.style.display = 'grid';
    updateStatsUI();

    addLog(`[SYSTEM] Sourcing candidates from target: ${source} (starting page ${state.sourcePage || 1})...`, 'system');
    
    try {
        let endpoint = '';
        let searchMode = false;
        if (source === 'followers') endpoint = `/users/${targetUser}/followers?per_page=100`;
        else if (source === 'following') endpoint = `/users/${targetUser}/following?per_page=100`;
        else if (source === 'org-members') endpoint = `/orgs/${targetUser}/members?per_page=100`;
        else if (source === 'search-query') {
            endpoint = `/search/users?q=${encodeURIComponent(searchQuery)}&per_page=100`;
            searchMode = true;
        }

        let page = state.sourcePage || 1;
        const scanCount = scanLimitVal === 'all' ? Infinity : parseInt(scanLimitVal) || 500;
        const initialCount = state.candidates.length;
        const maxToFetch = initialCount + scanCount;
        addLog(`[SYSTEM] Sourcing limit for this batch: ${scanCount === Infinity ? 'All' : scanCount} profiles.`, 'info');

        while (state.candidates.length < maxToFetch) {
            addLog(`[API] Sourcing candidate page ${page}...`, 'info');
            const res = await ghFetch(`${endpoint}&page=${page}`);
            
            if (res.status !== 200) {
                const data = await res.json().catch(() => ({}));
                addLog(`[ERROR] Sourcing failed: ${data.message || 'Unknown Error'}`, 'danger');
                break;
            }
            
            let data = await res.json();
            if (searchMode) data = data.items || [];
            
            if (!data || data.length === 0) break;
            
            data.forEach(item => {
                if (item.login !== state.currentUser) {
                    if (!state.candidates.some(c => c.username === item.login)) {
                        state.candidates.push({
                            username: item.login,
                            avatar: item.avatar_url,
                            htmlUrl: item.html_url,
                            status: 'pending',
                            lastActiveEvent: 'N/A',
                            lastActiveTime: 'N/A'
                        });
                    }
                }
            });
            
            addLog(`[SYSTEM] Gathered ${state.candidates.length} candidates.`, 'info');
            page++;
            state.sourcePage = page;
            if (data.length < 100) break;
            await sleep(150);
        }

        if (state.candidates.length === 0) {
            addLog('[WARNING] No profiles found.', 'warning');
            els.emptyResults.style.display = 'flex';
            els.candidateGridContainer.style.display = 'none';
            state.status = 'idle';
        } else {
            addLog(`[SUCCESS] Sourcing complete. Gathered ${state.candidates.length} profiles.`, 'success');
            state.status = 'sourced';
            renderCandidateCards();
            els.btnStart.disabled = false;
            els.btnReset.disabled = false;
            if (els.btnLoadMore) els.btnLoadMore.disabled = false;
        }
    } catch (err) {
        addLog(`[ERROR] Sourcing failed: ${err.message}`, 'danger');
        state.status = 'idle';
    } finally {
        updateCampaignStatusUI();
    }
}

function renderCandidateCards() {
    els.candidateGridContainer.innerHTML = '';
    state.candidates.forEach(c => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.id = `candidate-${c.username}`;
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <img class="candidate-avatar" src="${c.avatar}" alt="${c.username}" loading="lazy">
                <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <a href="${c.htmlUrl}" target="_blank" class="candidate-name">@${c.username}</a>
                    <span class="candidate-activity" id="activity-${c.username}">Active: Pending...</span>
                </div>
            </div>
            <div class="card-actions">
                <div class="activity-detail" id="activity-detail-${c.username}" style="font-size:0.75rem; color:var(--text-muted);">
                    Last Event: None Checked
                </div>
                <div id="btn-container-${c.username}">
                    <span class="candidate-status-pill status-pending" id="status-pill-${c.username}">Pending</span>
                </div>
            </div>
        `;
        els.candidateGridContainer.appendChild(card);
    });
    safeCreateIcons();
    els.btnExportCsv.style.display = 'inline-flex';
    els.btnExportJson.style.display = 'inline-flex';
}

function updateCandidateCardUI(username, status, activityType = '', activeTime = '') {
    const pill = document.getElementById(`status-pill-${username}`);
    if (pill) {
        let text = status.replace('_', ' ');
        if (state.mode === 'unfollow') {
            if (status === 'followed') text = 'Unfollowed';
            if (status === 'already_following') text = 'Follows You';
            if (status === 'inactive') text = 'Active User';
        }
        pill.textContent = text;
        pill.className = `candidate-status-pill status-${status}`;
    }
    const activityText = document.getElementById(`activity-${username}`);
    if (activityText && activeTime) {
        activityText.textContent = `Active: ${activeTime}`;
    }
    const activityDetail = document.getElementById(`activity-detail-${username}`);
    if (activityDetail && activityType) {
        activityDetail.innerHTML = `Event: <span style="font-family:var(--font-mono); font-size:0.65rem;">${activityType}</span>`;
    }
}

// APIs Activity checks
async function checkUserActivity(username, maxDays) {
    if (maxDays === 'all') return { isActive: true, eventType: 'Skipped Check', timeAgo: 'N/A' };
    try {
        const res = await ghFetch(`/users/${username}/events/public?per_page=5`);
        if (res.status !== 200) return { isActive: false, eventType: 'API Error', timeAgo: 'N/A' };
        const events = await res.json();
        if (!events || events.length === 0) return { isActive: false, eventType: 'None (90d)', timeAgo: 'Inactive' };
        
        const lastEvent = events[0];
        const createdAt = lastEvent.created_at;
        if (!createdAt) return { isActive: false, eventType: 'Unknown', timeAgo: 'Inactive' };
        
        const lastActiveDate = new Date(createdAt);
        const diffDays = Math.ceil(Math.abs(new Date() - lastActiveDate) / (1000 * 60 * 60 * 24));
        
        let timeAgo = `${diffDays}d ago`;
        const thresholdDays = parseInt(maxDays);
        return { isActive: diffDays <= thresholdDays, eventType: lastEvent.type.replace('Event', ''), timeAgo };
    } catch (err) {
        return { isActive: false, eventType: 'Network Error', timeAgo: 'N/A' };
    }
}

async function checkFollowStatus(username) {
    const res = await ghFetch(`/user/following/${username}`);
    return res.status === 204;
}

async function checkFollowBackStatus(targetUser) {
    const res = await ghFetch(`/users/${targetUser}/following/${state.currentUser}`);
    return res.status === 204;
}

async function performFollow(username) {
    const res = await ghFetch(`/user/following/${username}`, { method: 'PUT' });
    return res.status === 204;
}

async function performUnfollow(username) {
    const res = await ghFetch(`/user/following/${username}`, { method: 'DELETE' });
    return res.status === 204;
}

// Queue Campaigns workers
async function processCandidateQueue() {
    while (state.queue.length > 0 && state.followedCount < state.goal && !state.shouldStop) {
        const c = state.queue.shift();
        if (!c) continue;
        
        state.scannedCount++;
        updateStatsUI();
        
        c.status = 'checking';
        updateCandidateCardUI(c.username, 'checking', 'Checking...', 'Checking...');
        addLog(`[CAMPAIGN] Evaluating: @${c.username}...`, 'info');
        
        try {
            if (state.mode === 'unfollow') {
                const onlyNonFollowers = els.filterNonFollowers.checked;
                const onlyInactive = els.filterInactive.checked;
                
                if (onlyNonFollowers) {
                    const followsBack = await checkFollowBackStatus(c.username);
                    if (followsBack) {
                        c.status = 'already_following';
                        state.skippedCount++;
                        updateCandidateCardUI(c.username, 'already_following', 'Follows You', 'Active');
                        addLog(`[-] @${c.username}: follows you. Skipped.`, 'warning');
                        updateStatsUI();
                        await sleep(state.delay);
                        continue;
                    }
                }
                
                let activityType = 'Pre-Unfollowed', timeAgo = 'N/A';
                if (onlyInactive) {
                    const act = await checkUserActivity(c.username, els.activityThreshold.value);
                    activityType = act.eventType;
                    timeAgo = act.timeAgo;
                    if (act.isActive) {
                        c.status = 'inactive'; // active user -> skip unfollow
                        state.skippedCount++;
                        updateCandidateCardUI(c.username, 'inactive', act.eventType, act.timeAgo);
                        addLog(`[-] @${c.username}: active recently (${act.timeAgo}). Skipped.`, 'warning');
                        updateStatsUI();
                        await sleep(state.delay);
                        continue;
                    }
                }
                
                const success = await performUnfollow(c.username);
                if (success) {
                    c.status = 'followed';
                    state.followedCount++;
                    updateCandidateCardUI(c.username, 'followed', activityType, timeAgo);
                    addLog(`[SUCCESS] @${c.username}: UNFOLLOWED! [${state.followedCount}/${state.goal}]`, 'success');
                } else {
                    c.status = 'failed';
                    state.failedCount++;
                    updateCandidateCardUI(c.username, 'failed', activityType, timeAgo);
                    addLog(`[ERROR] Unfollow failed: @${c.username}`, 'danger');
                }
                updateStatsUI();
            } else {
                const isFollowing = await checkFollowStatus(c.username);
                if (isFollowing) {
                    c.status = 'already_following';
                    state.skippedCount++;
                    updateCandidateCardUI(c.username, 'already_following', 'Already Followed', 'Yes');
                    addLog(`[-] @${c.username}: ALREADY FOLLOWING. Skipped.`, 'warning');
                    updateStatsUI();
                    await sleep(state.delay);
                    continue;
                }
                
                const act = await checkUserActivity(c.username, els.activityThreshold.value);
                if (!act.isActive) {
                    c.status = 'inactive';
                    state.skippedCount++;
                    updateCandidateCardUI(c.username, 'inactive', act.eventType, act.timeAgo);
                    addLog(`[-] @${c.username}: inactive (${act.timeAgo}). Skipped.`, 'warning');
                    updateStatsUI();
                    await sleep(state.delay);
                    continue;
                }
                
                const success = await performFollow(c.username);
                if (success) {
                    c.status = 'followed';
                    state.followedCount++;
                    updateCandidateCardUI(c.username, 'followed', act.eventType, act.timeAgo);
                    addLog(`[SUCCESS] @${c.username}: FOLLOWED! [${state.followedCount}/${state.goal}]`, 'success');
                } else {
                    c.status = 'failed';
                    state.failedCount++;
                    updateCandidateCardUI(c.username, 'failed', act.eventType, act.timeAgo);
                    addLog(`[ERROR] Follow failed: @${c.username}`, 'danger');
                }
                updateStatsUI();
            }
        } catch (err) {
            c.status = 'failed';
            state.failedCount++;
            updateCandidateCardUI(c.username, 'failed', 'API Fail', 'N/A');
        }
        await sleep(state.delay);
    }
}

async function startCampaign() {
    if (state.candidates.length === 0) return;
    state.goal = parseInt(els.followGoal.value) || 30;
    state.concurrency = Math.min(parseInt(els.concurrency.value) || 5, 20);
    state.delay = parseInt(els.requestDelay.value) || 500;
    state.status = 'running';
    state.shouldStop = false;
    updateCampaignStatusUI();
    
    addLog(`[CAMPAIGN] Initiating workers (Pool size: ${state.concurrency})...`, 'system');
    state.queue = state.candidates.filter(c => c.status === 'pending' || c.status === 'checking');
    
    const workerPromises = [];
    const actualWorkers = Math.min(state.concurrency, state.queue.length);
    for (let i = 0; i < actualWorkers; i++) {
        workerPromises.push(processCandidateQueue());
    }
    await Promise.all(workerPromises);
    
    if (state.shouldStop) {
        state.status = 'paused';
    } else {
        state.status = 'completed';
        alert(`Campaign complete! Target goal reached: ${state.followedCount}/${state.goal}`);
    }
    updateCampaignStatusUI();
}

function pauseCampaign() {
    state.shouldStop = true;
    state.status = 'paused';
    updateCampaignStatusUI();
}

function resetCampaign() {
    state.shouldStop = true;
    state.status = 'idle';
    state.candidates = [];
    state.queue = [];
    state.scannedCount = 0;
    state.followedCount = 0;
    state.skippedCount = 0;
    state.failedCount = 0;
    state.sourcePage = 1;
    els.candidateGridContainer.innerHTML = '';
    els.emptyResults.style.display = 'flex';
    els.candidateGridContainer.style.display = 'none';
    if (els.btnLoadMore) {
        els.btnLoadMore.disabled = true;
        els.btnLoadMore.style.display = 'none';
    }
    updateStatsUI();
    updateCampaignStatusUI();
}

function updateStatsUI() {
    els.statScanned.textContent = state.scannedCount;
    els.statFollowed.textContent = state.followedCount;
    els.statSkipped.textContent = state.skippedCount;
    els.statFailed.textContent = state.failedCount;
    els.progressRatio.textContent = `${state.followedCount}/${state.goal}`;
    const percentage = Math.min(Math.round((state.followedCount / state.goal) * 100), 100);
    els.progressPercentage.textContent = `${percentage}%`;
    els.campaignProgressBar.style.width = `${percentage}%`;
}

function updateCampaignStatusUI() {
    let pulseClass = 'pulse-dot';
    let label = 'Engine Ready';
    if (state.status === 'sourcing') { pulseClass += ' running'; label = 'Harvesting profiles...'; }
    else if (state.status === 'sourced') label = 'Profiles harvest complete';
    else if (state.status === 'running') { pulseClass += ' running'; label = 'Campaign running...'; }
    else if (state.status === 'paused') { pulseClass += ' paused'; label = 'Campaign paused'; }
    else if (state.status === 'completed') { pulseClass += ' success'; label = 'Campaign completed'; }
    
    els.statusPulse.className = pulseClass;
    els.statusLabel.textContent = label;
    
    const isWorking = state.status === 'running' || state.status === 'sourcing';
    els.btnInitialize.disabled = isWorking;
    if (els.btnLoadMore) {
        els.btnLoadMore.disabled = isWorking || state.status === 'idle';
        els.btnLoadMore.style.display = state.status === 'idle' ? 'none' : 'inline-block';
    }
    els.btnStart.disabled = isWorking || state.status === 'idle' || state.status === 'completed';
    els.btnPause.disabled = state.status !== 'running';
    els.btnReset.disabled = isWorking;
}

// PANEL 3: CONTRIBUTION MATRIX BOOSTER
function initMatrixGrid() {
    els.matrixGridVisual.innerHTML = '';
    // Draw 371 cells (53 weeks * 7 days)
    for (let i = 0; i < 371; i++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell level-0';
        cell.id = `matrix-cell-${i}`;
        els.matrixGridVisual.appendChild(cell);
    }
}
initMatrixGrid();

// Sourcing matrix booster loops
async function runContributionBooster() {
    state.boosterCycles = parseInt(els.boosterCycles.value) || 10;
    state.boosterDelay = parseInt(els.boosterDelay.value) || 1000;
    state.boosterStatus = 'running';
    state.boosterShouldStop = false;
    
    els.btnStartBoost.disabled = true;
    els.btnStopBoost.disabled = false;
    els.boosterCycles.disabled = true;
    els.boosterDelay.disabled = true;
    
    state.boosterStats = { cycles: 0, commits: 0, issues: 0, prs: 0 };
    updateBoosterStatsUI();
    
    addBoosterLog('[SYSTEM] Initializing Matrix Boost Campaign...', 'system');
    
    // Step 1: Check/Create matrix repository
    addBoosterLog('[API] Checking repository matrix availability...', 'info');
    const repoExists = await checkOrCreateMatrixRepo();
    if (!repoExists) {
        addBoosterLog('[ERROR] Failed to check/create private matrix repository.', 'danger');
        abortBooster();
        return;
    }
    
    // Step 2: Sourcing boost loops
    for (let i = 1; i <= state.boosterCycles; i++) {
        if (state.boosterShouldStop) break;
        
        addBoosterLog(`\n[CYCLE ${i}/${state.boosterCycles}] Triggering activity profile balance...`, 'system');
        
        // Commits & Branch PR activity
        try {
            const baseSha = await getBranchSha('main');
            if (baseSha) {
                const branchName = `matrix-patch-${Date.now()}-${i}`;
                addBoosterLog(`[API] Creating branch '${branchName}'...`, 'info');
                
                if (await createBranch(branchName, baseSha)) {
                    // Commit
                    if (await createCommit(branchName, i)) {
                        state.boosterStats.commits++;
                        
                        // Light up a cell dynamically
                        const cellId = Math.floor(Math.random() * 371);
                        const cell = document.getElementById(`matrix-cell-${cellId}`);
                        if (cell) cell.className = 'matrix-cell level-4';
                        
                        // PR
                        const prNum = await createPR(branchName, 'main', i);
                        if (prNum) {
                            state.boosterStats.prs++;
                            addBoosterLog(`[API] Triggering review metrics on PR #${prNum}...`, 'info');
                            await createPRReview(prNum);
                        }
                    }
                }
            }
        } catch (e) {
            addBoosterLog(`[ERROR] Commit/PR loop cycle failed: ${e.message}`, 'danger');
        }
        
        // Issue activity
        try {
            const issueNum = await createIssue(i);
            if (issueNum) {
                state.boosterStats.issues++;
                await sleep(state.boosterDelay / 2);
                await closeIssue(issueNum);
            }
        } catch (e) {
            addBoosterLog(`[ERROR] Issue loop cycle failed: ${e.message}`, 'danger');
        }
        
        state.boosterStats.cycles++;
        updateBoosterStatsUI();
        
        await sleep(state.boosterDelay);
    }
    
    addBoosterLog('\n[SUCCESS] Matrix Boost campaign complete! Contributions synced.', 'success');
    abortBooster(true);
}

function abortBooster(completed = false) {
    state.boosterShouldStop = true;
    state.boosterStatus = 'idle';
    els.btnStartBoost.disabled = false;
    els.btnStopBoost.disabled = true;
    els.boosterCycles.disabled = false;
    els.boosterDelay.disabled = false;
    if (!completed) addBoosterLog('[WARNING] Matrix Boost aborted by operator.', 'warning');
}

function updateBoosterStatsUI() {
    els.boosterStatCycles.textContent = `${state.boosterStats.cycles}/${state.boosterCycles}`;
    els.boosterStatCommits.textContent = state.boosterStats.commits;
    els.boosterStatIssues.textContent = state.boosterStats.issues;
    els.boosterStatPrs.textContent = state.boosterStats.prs;
}

// APIs booster details
async function checkOrCreateMatrixRepo() {
    const res = await ghFetch('/user/repos');
    if (res.status === 200) {
        const repos = await res.json();
        const hasRepo = repos.some(r => r.name === 'profile-activity-matrix');
        if (hasRepo) {
            addBoosterLog('[INFO] Matrix repository already exists. Syncing.', 'info');
            return true;
        }
    }
    
    // Create private repository
    const createRes = await ghFetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
            name: 'profile-activity-matrix',
            private: true,
            auto_init: true,
            description: 'Automated activity matrix for profile stats balance.'
        })
    });
    return createRes.status === 201;
}

async function getBranchSha(branch) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/git/ref/heads/${branch}`);
    if (res.status === 200) {
        const data = await res.json();
        return data.object.sha;
    }
    return null;
}

async function createBranch(name, sha) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${name}`, sha })
    });
    return res.status === 201;
}

async function createCommit(branch, idx) {
    const base64Content = btoa(`Matrix boost sync check ${idx} passed.`);
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/contents/matrix_sync_${idx}.md`, {
        method: 'PUT',
        body: JSON.stringify({
            message: `Matrix balance sync #${idx}`,
            content: base64Content,
            branch
        })
    });
    return res.status === 200 || res.status === 201;
}

async function createPR(head, base, idx) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/pulls`, {
        method: 'POST',
        body: JSON.stringify({
            title: `Matrix checklist validation #${idx}`,
            head,
            base,
            body: `Automated PR validation. Cycle ${idx}.`
        })
    });
    if (res.status === 201) {
        const data = await res.json();
        return data.number;
    }
    return null;
}

async function createPRReview(prNumber) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/pulls/${prNumber}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
            body: 'Automated code review metrics checklist: LGTM.',
            event: 'COMMENT'
        })
    });
    return res.status === 200;
}

async function createIssue(idx) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/issues`, {
        method: 'POST',
        body: JSON.stringify({
            title: `Activity validation audit #${idx}`,
            body: `Logged system balance iteration #${idx}.`
        })
    });
    if (res.status === 201) {
        const data = await res.json();
        return data.number;
    }
    return null;
}

async function closeIssue(number) {
    const res = await ghFetch(`/repos/${state.currentUser}/profile-activity-matrix/issues/${number}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' })
    });
    return res.status === 200;
}

// PANEL 4: BULK REPO MANAGER & TRAFFIC HUD
async function loadReposIntoDropdown() {
    try {
        const res = await ghFetch('/user/repos?per_page=100&affiliation=owner');
        if (res.status === 200) {
            const repos = await res.json();
            els.trafficRepoSelect.innerHTML = '<option value="">-- Select Repo to Inspect --</option>';
            repos.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.name;
                opt.textContent = r.name;
                els.trafficRepoSelect.appendChild(opt);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

async function fetchUserRepos() {
    els.btnScanRepos.disabled = true;
    els.reposListContainer.innerHTML = '<div class="empty-state">Fetching repositories...</div>';
    
    state.repos = [];
    state.selectedRepos.clear();
    updateReposBulkBar();
    
    try {
        let page = 1;
        while (true) {
            const res = await ghFetch(`/user/repos?per_page=100&page=${page}&affiliation=owner`);
            if (res.status !== 200) break;
            const data = await res.json();
            if (!data || data.length === 0) break;
            
            data.forEach(r => {
                state.repos.push({
                    id: r.id,
                    name: r.name,
                    fullName: r.full_name,
                    private: r.private,
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    archived: r.archived
                });
            });
            if (data.length < 100) break;
            page++;
        }
        
        renderReposTable();
    } catch (e) {
        els.reposListContainer.innerHTML = `<div class="empty-state">Error fetching repos: ${e.message}</div>`;
    } finally {
        els.btnScanRepos.disabled = false;
    }
}

function renderReposTable(filteredList = null) {
    const list = filteredList || state.repos;
    els.reposListContainer.innerHTML = '';
    
    if (list.length === 0) {
        els.reposListContainer.innerHTML = '<div class="empty-state">No repositories found.</div>';
        return;
    }
    
    list.forEach(r => {
        const row = document.createElement('div');
        row.className = 'repo-row';
        
        const isChecked = state.selectedRepos.has(r.name) ? 'checked' : '';
        const privacy = r.private ? '<span style="color:var(--danger)">Private</span>' : '<span style="color:var(--success)">Public</span>';
        const archiveBadge = r.archived ? ' <span style="font-size:0.65rem; color:var(--warning); border:1px solid rgba(245,158,11,0.3); padding:1px 4px; border-radius:3px; font-weight:700;">ARCHIVED</span>' : '';
        
        row.innerHTML = `
            <div style="width: 40px; display:flex; align-items:center; justify-content:center;">
                <input type="checkbox" class="repo-row-checkbox" data-repo="${r.name}" ${isChecked} style="cursor:pointer;">
            </div>
            <div style="flex:2; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${r.name}${archiveBadge}
            </div>
            <div style="flex:1;">${privacy}</div>
            <div style="flex:1; display:flex; align-items:center; gap:4px;"><i data-lucide="star" style="width:12px; height:12px; color:var(--warning)"></i> ${r.stars}</div>
            <div style="flex:1; display:flex; align-items:center; gap:4px;"><i data-lucide="git-fork" style="width:12px; height:12px; color:var(--secondary)"></i> ${r.forks}</div>
            <div style="width:120px; display:flex; gap:6px;">
                <button class="btn-inline" onclick="inspectRepoTraffic('${r.name}')" style="font-size:0.7rem;">Traffic</button>
            </div>
        `;
        els.reposListContainer.appendChild(row);
    });
    
    safeCreateIcons();
    
    // Attach check events
    document.querySelectorAll('.repo-row-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const repo = cb.getAttribute('data-repo');
            if (cb.checked) state.selectedRepos.add(repo);
            else state.selectedRepos.delete(repo);
            updateReposBulkBar();
        });
    });
}

function updateReposBulkBar() {
    const count = state.selectedRepos.size;
    els.repoSelectCount.textContent = count;
    els.reposBulkBar.style.display = count > 0 ? 'flex' : 'none';
}

// Archive repos bulk
async function bulkArchiveRepos(archiveStatus) {
    if (state.selectedRepos.size === 0) return;
    const targets = Array.from(state.selectedRepos);
    els.btnBulkArchive.disabled = true;
    els.btnBulkUnarchive.disabled = true;
    
    addLog(`[REPOS] Batch archiving ${targets.length} repositories...`, 'system');
    
    for (const repo of targets) {
        addLog(`[API] Modifying archive status for ${repo} to ${archiveStatus}...`, 'info');
        try {
            const res = await ghFetch(`/repos/${state.currentUser}/${repo}`, {
                method: 'PATCH',
                body: JSON.stringify({ archived: archiveStatus })
            });
            if (res.status === 200) {
                addLog(`[SUCCESS] Sourced repo ${repo} archive status updated.`, 'success');
            } else {
                addLog(`[ERROR] Sourced repo status update failed for ${repo}`, 'danger');
            }
        } catch (e) {
            addLog(`[ERROR] Failed: ${e.message}`, 'danger');
        }
    }
    
    els.btnBulkArchive.disabled = false;
    els.btnBulkUnarchive.disabled = false;
    fetchUserRepos(); // reload table
}

// Bulk delete repos
let deleteActionTarget = 'repos';
async function openBulkDeleteConfirmModal(targetType) {
    deleteActionTarget = targetType;
    let count = 0;
    if (targetType === 'repos') count = state.selectedRepos.size;
    else if (targetType === 'issues') count = state.selectedIssues.size;
    else if (targetType === 'gists') count = state.selectedGists.size;
    else if (targetType === 'stars') count = state.selectedStars.size;
    
    if (count === 0) return;
    els.deleteCountText.textContent = `${count} ${targetType}`;
    els.deleteConfirmInput.value = '';
    els.btnExecuteDelete.disabled = true;
    els.deleteConfirmModal.classList.add('active');
}

els.deleteConfirmInput.addEventListener('input', (e) => {
    els.btnExecuteDelete.disabled = e.target.value !== 'CONFIRM BULK DELETE';
});

els.btnExecuteDelete.addEventListener('click', async () => {
    els.deleteConfirmModal.classList.remove('active');
    
    if (deleteActionTarget === 'repos') {
        await executeBulkDeleteRepos();
    } else if (deleteActionTarget === 'gists') {
        await executeBulkDeleteGists();
    } else if (deleteActionTarget === 'issues') {
        await executeBulkCloseIssues();
    } else if (deleteActionTarget === 'stars') {
        await executeBulkUnstar();
    }
});

async function executeBulkDeleteRepos() {
    const targets = Array.from(state.selectedRepos);
    addLog(`[CRITICAL] Starting permanent deletion of ${targets.length} repositories...`, 'system');
    
    for (const repo of targets) {
        addLog(`[API] Sending DELETE request for ${repo}...`, 'info');
        try {
            const res = await ghFetch(`/repos/${state.currentUser}/${repo}`, {
                method: 'DELETE'
            });
            if (res.status === 204) {
                addLog(`[SUCCESS] Repository ${repo} permanently deleted.`, 'success');
            } else {
                const data = await res.json().catch(() => ({}));
                addLog(`[ERROR] Failed to delete ${repo}: ${data.message || 'Check token scopes'}`, 'danger');
            }
        } catch (e) {
            addLog(`[ERROR] Delete fail: ${e.message}`, 'danger');
        }
        await sleep(500);
    }
    
    fetchUserRepos();
}

// Fetch traffic graphs
window.inspectRepoTraffic = function(repoName) {
    els.trafficRepoSelect.value = repoName;
    loadTrafficHUD(repoName);
    // Switch to tab logic natively
    document.querySelectorAll('.nav-item').forEach(b => {
        if (b.getAttribute('data-target') === 'panel-repos') b.click();
    });
};

async function loadTrafficHUD(repoName) {
    if (!repoName) {
        els.trafficEmptyState.style.display = 'flex';
        els.trafficDataContainer.style.display = 'none';
        return;
    }
    
    els.trafficEmptyState.style.display = 'none';
    els.trafficDataContainer.style.display = 'none';
    
    try {
        const owner = state.currentUser;
        
        // Fetch views / clones / referrers in parallel
        const [viewsRes, clonesRes, referrersRes] = await Promise.all([
            ghFetch(`/repos/${owner}/${repoName}/traffic/views`),
            ghFetch(`/repos/${owner}/${repoName}/traffic/clones`),
            ghFetch(`/repos/${owner}/${repoName}/traffic/popular/referrers`)
        ]);
        
        if (viewsRes.status !== 200 || clonesRes.status !== 200) {
            alert('Failed to load repository traffic. Ensure your token has full "repo" scopes.');
            els.trafficEmptyState.style.display = 'flex';
            return;
        }
        
        const viewsData = await viewsRes.json();
        const clonesData = await clonesRes.json();
        const referrersData = await referrersRes.json();
        
        els.trafficViewsCount.textContent = viewsData.count || 0;
        els.trafficClonesCount.textContent = clonesData.count || 0;
        
        // Populate Referrers List
        els.trafficReferrersList.innerHTML = '';
        if (!referrersData || referrersData.length === 0) {
            els.trafficReferrersList.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted);">No referrals data available.</div>';
        } else {
            referrersData.slice(0, 5).forEach(ref => {
                const item = document.createElement('div');
                item.className = 'referrer-item';
                item.innerHTML = `<span>${ref.referrer}</span><span><strong>${ref.count}</strong> views</span>`;
                els.trafficReferrersList.appendChild(item);
            });
        }
        
        // Compile Daily View datasets mapping dates
        const dailyViews = {};
        const dailyClones = {};
        
        viewsData.views?.forEach(v => {
            const dateStr = new Date(v.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'});
            dailyViews[dateStr] = v.count;
        });
        
        clonesData.clones?.forEach(c => {
            const dateStr = new Date(c.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'});
            dailyClones[dateStr] = c.count;
        });
        
        // Merge date labels
        const allLabels = Array.from(new Set([...Object.keys(dailyViews), ...Object.keys(dailyClones)]));
        allLabels.sort((a,b) => new Date(a) - new Date(b));
        
        const viewsDataset = allLabels.map(l => dailyViews[l] || 0);
        const clonesDataset = allLabels.map(l => dailyClones[l] || 0);
        
        // Render Line Chart
        renderTrafficChart(allLabels, viewsDataset, clonesDataset);
        
        els.trafficDataContainer.style.display = 'flex';
    } catch (e) {
        console.error(e);
        els.trafficEmptyState.style.display = 'flex';
    }
}

function renderTrafficChart(labels, views, clones) {
    if (state.trafficChart) {
        state.trafficChart.destroy();
        state.trafficChart = null;
    }
    
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js library is not loaded. Cannot render traffic chart.');
        return;
    }
    
    const ctx = document.getElementById('traffic-chart').getContext('2d');
    state.trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Page Views',
                    data: views,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Repo Clones',
                    data: clones,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.05)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#f8fafc', font: { family: 'Outfit', weight: '600' } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// PANEL 5: PROFILE README BUILDER
function renderREADME() {
    const title = els.readmeTitle.value;
    const subtitle = els.readmeSubtitle.value;
    const bio = els.readmeBio.value;
    
    // Tech Stack select
    const checkedTech = Array.from(document.querySelectorAll('.tech-checkbox:checked')).map(cb => cb.value);
    
    // Badges markdown
    let techBadgesMd = '';
    checkedTech.forEach(tech => {
        let badgeUrl = '';
        if (tech === 'javascript') badgeUrl = 'https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E';
        else if (tech === 'typescript') badgeUrl = 'https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white';
        else if (tech === 'python') badgeUrl = 'https://img.shields.io/badge/python-35709F.svg?style=for-the-badge&logo=python&logoColor=white';
        else if (tech === 'go') badgeUrl = 'https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white';
        else if (tech === 'rust') badgeUrl = 'https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white';
        else if (tech === 'cpp') badgeUrl = 'https://img.shields.io/badge/c%2B%2B-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white';
        else if (tech === 'react') badgeUrl = 'https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB';
        else if (tech === 'nodejs') badgeUrl = 'https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white';
        else if (tech === 'docker') badgeUrl = 'https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white';
        else if (tech === 'aws') badgeUrl = 'https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white';
        else if (tech === 'git') badgeUrl = 'https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white';
        else if (tech === 'linux') badgeUrl = 'https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black';
        
        if (badgeUrl) techBadgesMd += `![${tech}](${badgeUrl}) `;
    });
    
    // Social Badges markdown
    let socialMd = '';
    const addSocialBadge = (val, label, color, logo) => {
        if (val) {
            socialMd += `[![${label}](https://img.shields.io/badge/${label}-${color}?style=for-the-badge&logo=${logo}&logoColor=white)](${val}) `;
        }
    };
    addSocialBadge(els.socialLinkedin.value.trim(), 'LinkedIn', '0077B5', 'linkedin');
    addSocialBadge(els.socialTwitter.value.trim(), 'Twitter', '1DA1F2', 'twitter');
    addSocialBadge(els.socialYoutube.value.trim(), 'YouTube', 'FF0000', 'youtube');
    
    // Metrics Cards
    let metricsMd = '';
    const user = state.currentUser || 'username';
    
    if (els.widgetStats.checked) {
        metricsMd += `![Stats Card](https://github-readme-stats.vercel.app/api?username=${user}&show_icons=true&theme=radial)\n`;
    }
    if (els.widgetLanguages.checked) {
        metricsMd += `![Languages Card](https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&theme=radial)\n`;
    }
    if (els.widgetStreak.checked) {
        metricsMd += `![Streak Card](https://github-readme-streak-stats.herokuapp.com/?user=${user}&theme=radial)\n`;
    }

    // Assemble final Markdown
    const markdown = `# ${title}

### ${subtitle}

${socialMd ? '#### Connect with me:\n' + socialMd + '\n\n' : ''}
#### About Me:
${bio.split('\n').map(l => `- ${l}`).join('\n')}

${techBadgesMd ? '#### Languages & Technologies:\n' + techBadgesMd + '\n\n' : ''}
${metricsMd ? '#### Sourced Analytics Metrics:\n' + metricsMd : ''}
`;

    // Render Preview
    els.readmeRawEditor.value = markdown;
    if (typeof marked !== 'undefined') {
        try {
            els.readmeHtmlPreview.innerHTML = marked.parse(markdown);
        } catch (e) {
            console.error('Error parsing markdown:', e);
            els.readmeHtmlPreview.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; padding: 12px; color: var(--text-main);">${markdown}</pre>`;
        }
    } else {
        els.readmeHtmlPreview.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; padding: 12px; color: var(--text-main);">${markdown}</pre>`;
    }
}

// Attach README builder dynamic listeners
[els.readmeTitle, els.readmeSubtitle, els.readmeBio, els.socialLinkedin, els.socialTwitter, els.socialYoutube].forEach(el => {
    el.addEventListener('input', renderREADME);
});

document.querySelectorAll('.tech-checkbox').forEach(cb => {
    cb.addEventListener('change', renderREADME);
});

[els.widgetStats, els.widgetLanguages, els.widgetStreak].forEach(el => {
    el.addEventListener('change', renderREADME);
});

// Toggle preview tabs
els.btnReadmePreviewTab.addEventListener('click', () => {
    els.btnReadmePreviewTab.classList.add('active');
    els.btnReadmeCodeTab.classList.remove('active');
    els.readmeHtmlPreview.style.display = 'block';
    els.readmeRawEditor.style.display = 'none';
});

els.btnReadmeCodeTab.addEventListener('click', () => {
    els.btnReadmeCodeTab.classList.add('active');
    els.btnReadmePreviewTab.classList.remove('active');
    els.readmeHtmlPreview.style.display = 'none';
    els.readmeRawEditor.style.display = 'block';
});

// Push README directly to github profile
els.btnPublishReadme.addEventListener('click', async () => {
    if (!state.currentUser) return;
    
    els.btnPublishReadme.disabled = true;
    addLog('[README] Preparing profile README publish...', 'system');
    
    const owner = state.currentUser;
    const repo = state.currentUser; // profile repo is username/username
    const markdown = els.readmeRawEditor.value;
    
    try {
        // Step 1: Ensure repository exists
        addLog(`[API] Checking profile repository: ${owner}/${repo}...`, 'info');
        const repoRes = await ghFetch(`/repos/${owner}/${repo}`);
        
        if (repoRes.status === 404) {
            // Create profile repo
            addLog(`[INFO] Profile repository not found. Creating '${owner}/${repo}'...`, 'info');
            const createRes = await ghFetch('/user/repos', {
                method: 'POST',
                body: JSON.stringify({ name: repo, private: false, auto_init: true, description: 'Profile README.' })
            });
            if (createRes.status !== 201) {
                addLog('[ERROR] Failed to create profile repository.', 'danger');
                els.btnPublishReadme.disabled = false;
                return;
            }
            await sleep(2000); // await github setup
        }
        
        // Step 2: Fetch README.md if it exists to get SHA
        addLog('[API] Checking file SHA...', 'info');
        const fileRes = await ghFetch(`/repos/${owner}/${repo}/contents/README.md`);
        let sha = null;
        if (fileRes.status === 200) {
            const fileData = await fileRes.json();
            sha = fileData.sha;
        }
        
        // Step 3: Put/Overwrite file
        const base64Content = btoa(unescape(encodeURIComponent(markdown)));
        const putBody = {
            message: 'Update profile README.md using GH Power Suite',
            content: base64Content
        };
        if (sha) putBody.sha = sha;
        
        addLog('[API] Committing file contents directly...', 'info');
        const putRes = await ghFetch(`/repos/${owner}/${repo}/contents/README.md`, {
            method: 'PUT',
            body: JSON.stringify(putBody)
        });
        
        if (putRes.status === 200 || putRes.status === 201) {
            addLog(`[SUCCESS] Profile README.md updated successfully! View at github.com/${owner}/${repo}`, 'success');
            alert(`Stunning Profile README successfully pushed to github.com/${owner}/${repo}!`);
        } else {
            addLog('[ERROR] Failed to push README file.', 'danger');
        }
    } catch (e) {
        addLog(`[ERROR] Publish failed: ${e.message}`, 'danger');
    } finally {
        els.btnPublishReadme.disabled = false;
    }
});

// PANEL 6: BULK ISSUE & PR TRIAGE
async function fetchUserIssues() {
    els.btnScanIssues.disabled = true;
    els.issuesListContainer.innerHTML = '<div class="empty-state">Scanning open issues & pull requests...</div>';
    
    state.issues = [];
    state.selectedIssues.clear();
    updateIssuesBulkBar();
    
    try {
        const res = await ghFetch('/user/issues?state=open&filter=created&per_page=100');
        if (res.status === 200) {
            const data = await res.json();
            
            data.forEach(item => {
                state.issues.push({
                    id: item.id,
                    number: item.number,
                    title: item.title,
                    repoName: item.repository.name,
                    repoOwner: item.repository.owner.login,
                    isPullRequest: !!item.pull_request,
                    created: new Date(item.created_at).toLocaleDateString()
                });
            });
            
            renderIssuesTable();
        } else {
            els.issuesListContainer.innerHTML = '<div class="empty-state">Failed to fetch issues. Check token scopes.</div>';
        }
    } catch (e) {
        els.issuesListContainer.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    } finally {
        els.btnScanIssues.disabled = false;
    }
}

function renderIssuesTable() {
    els.issuesListContainer.innerHTML = '';
    
    if (state.issues.length === 0) {
        els.issuesListContainer.innerHTML = '<div class="empty-state">No open issues or PRs found.</div>';
        return;
    }
    
    state.issues.forEach(i => {
        const row = document.createElement('div');
        row.className = 'issue-row';
        
        const isChecked = state.selectedIssues.has(i.id) ? 'checked' : '';
        const badge = i.isPullRequest ? '<span class="issue-type-badge badge-pr">PR</span>' : '<span class="issue-type-badge badge-issue">Issue</span>';
        
        row.innerHTML = `
            <div style="width: 40px; display:flex; align-items:center; justify-content:center;">
                <input type="checkbox" class="issue-row-checkbox" data-id="${i.id}" ${isChecked} style="cursor:pointer;">
            </div>
            <div style="flex:2; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                #${i.number}: ${i.title}
            </div>
            <div style="flex:1;">${i.repoName}</div>
            <div style="flex:1;">${badge}</div>
            <div style="flex:1;">${i.created}</div>
            <div style="width:100px;">
                <button class="btn-inline" onclick="manualCloseIssue('${i.repoOwner}', '${i.repoName}', ${i.number}, ${i.id})" style="font-size:0.7rem; color:var(--danger);">Close</button>
            </div>
        `;
        els.issuesListContainer.appendChild(row);
    });
    
    // Attach checklist change events
    document.querySelectorAll('.issue-row-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const id = parseInt(cb.getAttribute('data-id'));
            if (cb.checked) state.selectedIssues.add(id);
            else state.selectedIssues.delete(id);
            updateIssuesBulkBar();
        });
    });
}

function updateIssuesBulkBar() {
    const count = state.selectedIssues.size;
    els.issueSelectCount.textContent = count;
    els.issuesBulkBar.style.display = count > 0 ? 'flex' : 'none';
}

window.manualCloseIssue = async function(owner, repo, number, id) {
    addLog(`[ISSUES] Closing item #${number} on ${repo}...`, 'system');
    try {
        const res = await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
            method: 'PATCH',
            body: JSON.stringify({ state: 'closed' })
        });
        if (res.status === 200) {
            addLog(`[SUCCESS] Closed item #${number} successfully.`, 'success');
            state.issues = state.issues.filter(i => i.id !== id);
            renderIssuesTable();
        }
    } catch (e) {
        addLog(`[ERROR] Close failed: ${e.message}`, 'danger');
    }
};

// Apply tags to selected issues
els.btnBulkLabel.addEventListener('click', async () => {
    const label = els.bulkLabelInput.value.trim();
    if (!label || state.selectedIssues.size === 0) return;
    
    els.btnBulkLabel.disabled = true;
    const selectedIds = Array.from(state.selectedIssues);
    addLog(`[ISSUES] Applying label '${label}' to ${selectedIds.length} items...`, 'system');
    
    for (const id of selectedIds) {
        const item = state.issues.find(i => i.id === id);
        if (!item) continue;
        
        addLog(`[API] Adding label to ${item.repoName} #${item.number}...`, 'info');
        try {
            await ghFetch(`/repos/${item.repoOwner}/${item.repoName}/issues/${item.number}/labels`, {
                method: 'POST',
                body: JSON.stringify({ labels: [label] })
            });
        } catch (e) {}
    }
    
    addLog('[SUCCESS] Batch labelling complete.', 'success');
    els.btnBulkLabel.disabled = false;
    els.bulkLabelInput.value = '';
    fetchUserIssues();
});

async function executeBulkCloseIssues() {
    const selectedIds = Array.from(state.selectedIssues);
    addLog(`[ISSUES] Bulk closing ${selectedIds.length} items...`, 'system');
    
    for (const id of selectedIds) {
        const item = state.issues.find(i => i.id === id);
        if (!item) continue;
        
        try {
            await ghFetch(`/repos/${item.repoOwner}/${item.repoName}/issues/${item.number}`, {
                method: 'PATCH',
                body: JSON.stringify({ state: 'closed' })
            });
        } catch (e) {}
    }
    
    addLog('[SUCCESS] Closed items.', 'success');
    fetchUserIssues();
}

// PANEL 7: STAR & GISTS MANAGER
async function fetchUserStars() {
    els.btnScanStars.disabled = true;
    els.starsListContainer.innerHTML = '<div class="empty-state">Loading starred repositories...</div>';
    
    state.starredRepos = [];
    state.selectedStars.clear();
    updateStarsBulkBar();
    
    try {
        const res = await ghFetch('/user/starred?per_page=100');
        if (res.status === 200) {
            const data = await res.json();
            
            data.forEach(r => {
                state.starredRepos.push({
                    fullName: r.full_name,
                    name: r.name,
                    owner: r.owner.login,
                    description: r.description || 'No description provided.'
                });
            });
            renderStarsList();
        }
    } catch (e) {
        els.starsListContainer.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    } finally {
        els.btnScanStars.disabled = false;
    }
}

function renderStarsList() {
    els.starsListContainer.innerHTML = '';
    if (state.starredRepos.length === 0) {
        els.starsListContainer.innerHTML = '<div class="empty-state">No starred repositories found.</div>';
        return;
    }
    
    state.starredRepos.forEach(r => {
        const row = document.createElement('div');
        row.className = 'star-row';
        const isChecked = state.selectedStars.has(r.fullName) ? 'checked' : '';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; overflow:hidden;">
                <input type="checkbox" class="star-row-checkbox" data-repo="${r.fullName}" ${isChecked} style="cursor:pointer;">
                <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <strong>${r.fullName}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${r.description}</span>
                </div>
            </div>
            <button class="btn-inline" onclick="manualUnstar('${r.owner}', '${r.name}', '${r.fullName}')" style="font-size:0.7rem; color:var(--danger);">Unstar</button>
        `;
        els.starsListContainer.appendChild(row);
    });
    
    document.querySelectorAll('.star-row-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const repo = cb.getAttribute('data-repo');
            if (cb.checked) state.selectedStars.add(repo);
            else state.selectedStars.delete(repo);
            updateStarsBulkBar();
        });
    });
}

function updateStarsBulkBar() {
    const count = state.selectedStars.size;
    els.starSelectCount.textContent = count;
    els.starsBulkBar.style.display = count > 0 ? 'flex' : 'none';
}

window.manualUnstar = async function(owner, name, fullName) {
    addLog(`[STARS] Unstarring ${fullName}...`, 'system');
    try {
        const res = await ghFetch(`/user/starred/${owner}/${name}`, { method: 'DELETE' });
        if (res.status === 204) {
            addLog('[SUCCESS] Unstarred.', 'success');
            state.starredRepos = state.starredRepos.filter(r => r.fullName !== fullName);
            renderStarsList();
        }
    } catch (e) {}
};

async function executeBulkUnstar() {
    const repos = Array.from(state.selectedStars);
    addLog(`[STARS] Unstarring ${repos.length} repos...`, 'system');
    for (const fullName of repos) {
        const [owner, name] = fullName.split('/');
        try {
            await ghFetch(`/user/starred/${owner}/${name}`, { method: 'DELETE' });
        } catch (e) {}
    }
    addLog('[SUCCESS] Unstarred selected repositories.', 'success');
    fetchUserStars();
}

// Gists Manager
async function fetchUserGists() {
    els.btnScanGists.disabled = true;
    els.gistsListContainer.innerHTML = '<div class="empty-state">Loading Gists...</div>';
    
    state.gists = [];
    state.selectedGists.clear();
    updateGistsBulkBar();
    
    try {
        const res = await ghFetch('/gists?per_page=100');
        if (res.status === 200) {
            const data = await res.json();
            
            data.forEach(g => {
                state.gists.push({
                    id: g.id,
                    description: g.description || 'Gist File (No description)',
                    public: g.public,
                    filesCount: Object.keys(g.files).length
                });
            });
            renderGistsList();
        }
    } catch (e) {
        els.gistsListContainer.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
    } finally {
        els.btnScanGists.disabled = false;
    }
}

function renderGistsList() {
    els.gistsListContainer.innerHTML = '';
    if (state.gists.length === 0) {
        els.gistsListContainer.innerHTML = '<div class="empty-state">No Gists found.</div>';
        return;
    }
    
    state.gists.forEach(g => {
        const row = document.createElement('div');
        row.className = 'gist-row';
        const isChecked = state.selectedGists.has(g.id) ? 'checked' : '';
        const visibility = g.public ? 'Public' : 'Secret';
        
        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; overflow:hidden;">
                <input type="checkbox" class="gist-row-checkbox" data-id="${g.id}" ${isChecked} style="cursor:pointer;">
                <div class="gist-meta">
                    <strong>${g.description}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${g.filesCount} file(s) • ${visibility}</span>
                </div>
            </div>
            <button class="btn-inline" onclick="manualDeleteGist('${g.id}')" style="font-size:0.7rem; color:var(--danger);">Delete</button>
        `;
        els.gistsListContainer.appendChild(row);
    });
    
    document.querySelectorAll('.gist-row-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const id = cb.getAttribute('data-id');
            if (cb.checked) state.selectedGists.add(id);
            else state.selectedGists.delete(id);
            updateGistsBulkBar();
        });
    });
}

function updateGistsBulkBar() {
    const count = state.selectedGists.size;
    els.gistSelectCount.textContent = count;
    els.gistsBulkBar.style.display = count > 0 ? 'flex' : 'none';
}

window.manualDeleteGist = async function(id) {
    addLog(`[GISTS] Deleting gist ${id}...`, 'system');
    try {
        const res = await ghFetch(`/gists/${id}`, { method: 'DELETE' });
        if (res.status === 204) {
            addLog('[SUCCESS] Deleted Gist.', 'success');
            state.gists = state.gists.filter(g => g.id !== id);
            renderGistsList();
        }
    } catch (e) {}
};

async function executeBulkDeleteGists() {
    const ids = Array.from(state.selectedGists);
    addLog(`[GISTS] Deleting ${ids.length} Gists...`, 'system');
    for (const id of ids) {
        try {
            await ghFetch(`/gists/${id}`, { method: 'DELETE' });
        } catch (e) {}
    }
    addLog('[SUCCESS] Bulk Gist deletion complete.', 'success');
    fetchUserGists();
}

// Checkall binds
els.checkAllRepos.addEventListener('change', (e) => {
    document.querySelectorAll('.repo-row-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        const repo = cb.getAttribute('data-repo');
        if (e.target.checked) state.selectedRepos.add(repo);
        else state.selectedRepos.delete(repo);
    });
    updateReposBulkBar();
});

els.checkAllIssues.addEventListener('change', (e) => {
    document.querySelectorAll('.issue-row-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        const id = parseInt(cb.getAttribute('data-id'));
        if (e.target.checked) state.selectedIssues.add(id);
        else state.selectedIssues.delete(id);
    });
    updateIssuesBulkBar();
});

// Event Bindings UI Actions
els.btnInitialize.addEventListener('click', () => gatherCandidates(false));
els.btnLoadMore.addEventListener('click', () => gatherCandidates(true));
els.btnStart.addEventListener('click', startCampaign);
els.btnPause.addEventListener('click', pauseCampaign);
els.btnReset.addEventListener('click', resetCampaign);

els.btnStartBoost.addEventListener('click', runContributionBooster);
els.btnStopBoost.addEventListener('click', () => abortBooster(false));

els.btnScanRepos.addEventListener('click', fetchUserRepos);
els.btnBulkArchive.addEventListener('click', () => bulkArchiveRepos(true));
els.btnBulkUnarchive.addEventListener('click', () => bulkArchiveRepos(false));
els.btnBulkDelete.addEventListener('click', () => openBulkDeleteConfirmModal('repos'));

els.btnScanIssues.addEventListener('click', fetchUserIssues);
els.btnBulkCloseIssues.addEventListener('click', () => openBulkDeleteConfirmModal('issues'));

els.btnScanStars.addEventListener('click', fetchUserStars);
els.btnBulkUnstar.addEventListener('click', () => openBulkDeleteConfirmModal('stars'));

els.btnScanGists.addEventListener('click', fetchUserGists);
els.btnBulkDeleteGists.addEventListener('click', () => openBulkDeleteConfirmModal('gists'));

els.btnOpenTokenModal.addEventListener('click', () => {
    els.patInput.value = state.token;
    els.settingsModal.classList.add('active');
});
els.btnCloseSettings.addEventListener('click', () => els.settingsModal.classList.remove('active'));
els.btnCancelToken.addEventListener('click', () => els.settingsModal.classList.remove('active'));
els.btnSaveToken.addEventListener('click', () => {
    const val = els.patInput.value.trim();
    validateAndSaveToken(val);
});

els.btnCancelDelete.addEventListener('click', () => els.deleteConfirmModal.classList.remove('active'));

els.trafficRepoSelect.addEventListener('change', (e) => {
    loadTrafficHUD(e.target.value);
});

els.btnExportCsv.addEventListener('click', () => {
    let csv = 'Username,HtmlUrl,Status,LastEvent,TimeActive\n';
    state.candidates.forEach(c => {
        csv += `"${c.username}","${c.htmlUrl}","${c.status}","${c.lastActiveEvent}","${c.lastActiveTime}"\n`;
    });
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    link.download = `github_campaign_report_${Date.now()}.csv`;
    link.click();
});

els.btnExportJson.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.candidates, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `github_campaign_report_${Date.now()}.json`;
    link.click();
});

els.btnClearConsole.addEventListener('click', () => {
    els.consoleOutput.innerHTML = '';
});

// Init README render on launch
renderREADME();
