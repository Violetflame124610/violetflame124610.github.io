const GITHUB_USERNAME = 'Violetflame124610';
const GITHUB_API = 'https://api.github.com';

const languageColors = {
    'JavaScript': '#f1e05a', 'Python': '#3572A5', 'Java': '#b07219',
    'HTML': '#e34c26', 'CSS': '#563d7c', 'TypeScript': '#2b7489',
    'C++': '#f34b7d', 'C': '#555555', 'Go': '#00ADD8',
    'Rust': '#dea584', 'Ruby': '#701516', 'PHP': '#4F5D95',
    'Swift': '#ffac45', 'Kotlin': '#F18E33', 'Dart': '#00B4AB',
    'C#': '#178600', 'Shell': '#89e051', 'Vue': '#41b883',
    'React': '#61dafb',
};

// Fetch user profile (basic - only name and picture)
async function fetchUserProfileBasic() {
    try {
        const response = await fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}`);
        const data = await response.json();
        const userNameElement  = document.getElementById('userName');
        const profilePicElement = document.getElementById('profilePic');
        if (userNameElement)   userNameElement.textContent = data.name || GITHUB_USERNAME;
        if (profilePicElement) profilePicElement.src = data.avatar_url;
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}`);
        const data = await response.json();
        const userNameElement   = document.getElementById('userName');
        const profilePicElement = document.getElementById('profilePic');
        const userBioElement    = document.getElementById('userBio');
        if (userNameElement)   userNameElement.textContent = data.name || GITHUB_USERNAME;
        if (profilePicElement) profilePicElement.src = data.avatar_url;
        if (userBioElement)    userBioElement.textContent = data.bio || 'Welcome to my portfolio!';
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Fetch repositories — renders cards instantly, loads full language list lazily per card
async function fetchRepositories() {
    const projectsGrid = document.getElementById('projectsGrid');
    if (!projectsGrid) return;

    try {
        const response = await fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        const repos = await response.json();

        if (!Array.isArray(repos) || repos.length === 0) {
            projectsGrid.innerHTML = '<div class="loading"><p>No repositories found.</p></div>';
            return;
        }

        projectsGrid.innerHTML = '';

        const now           = new Date();
        const oneDayAgo     = new Date(now - 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        // ── Step 1: render all cards instantly ──
        repos.forEach((repo, index) => {
            const updatedDate = new Date(repo.updated_at);
            const createdDate = new Date(repo.created_at);
            const isNew     = createdDate > thirtyDaysAgo;
            const isUpdated = updatedDate > oneDayAgo && !isNew;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = `${index * 0.05}s`;

            const badges = [];
            if (isNew)     badges.push('<span class="badge badge-new">New</span>');
            if (isUpdated) badges.push('<span class="badge badge-updated">Updated</span>');

            const primaryColor = languageColors[repo.language] || '#858585';
            const primaryLang  = repo.language
                ? `<div class="project-language">
                       <span class="language-dot" style="background:${primaryColor}"></span>
                       <span>${repo.language}</span>
                   </div>`
                : '<span style="color:var(--text-muted);font-size:0.85rem;">Detecting languages…</span>';

            card.innerHTML = `
                <div class="project-header">
                    <h3 class="project-title">${repo.name}</h3>
                </div>
                ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
                <p class="project-description">${repo.description || 'No description provided'}</p>
                <div class="project-languages" id="langs-${repo.id}">${primaryLang}</div>
                <div class="project-meta">
                    <span>Updated: ${formatDate(updatedDate)}</span>
                </div>
                <a href="${repo.html_url}" target="_blank" class="project-link">View on GitHub →</a>
            `;

            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.project-link')) {
                    window.open(repo.html_url, '_blank');
                }
            });

            projectsGrid.appendChild(card);
        });

        // ── Step 2: fetch each repo's full language list one at a time in the background ──
        for (const repo of repos) {
            try {
                const langRes   = await fetch(repo.languages_url);
                const languages = await langRes.json();
                const langs     = Object.keys(languages);
                const container = document.getElementById(`langs-${repo.id}`);
                if (!container) continue;

                if (langs.length === 0) {
                    container.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">No languages detected</span>';
                } else {
                    container.innerHTML = langs.map(lang => {
                        const color = languageColors[lang] || '#858585';
                        return `<div class="project-language">
                                    <span class="language-dot" style="background:${color}"></span>
                                    <span>${lang}</span>
                                </div>`;
                    }).join('');
                }
            } catch (e) {
                // silently skip on failure
            }
        }

    } catch (error) {
        console.error('Error fetching repositories:', error);
        projectsGrid.innerHTML = '<div class="loading"><p>Error loading projects. Please try again later.</p></div>';
    }
}

// Fetch README for about section
async function fetchReadme() {
    const aboutContentElement = document.getElementById('aboutContent');
    if (!aboutContentElement) return;
    try {
        const profileRepoResponse = await fetch(`${GITHUB_API}/repos/${GITHUB_USERNAME}/${GITHUB_USERNAME}/readme`);
        if (profileRepoResponse.ok) {
            const data = await profileRepoResponse.json();
            aboutContentElement.innerHTML = convertMarkdownToHTML(atob(data.content));
        } else {
            const userResponse = await fetch(`${GITHUB_API}/users/${GITHUB_USERNAME}`);
            const userData = await userResponse.json();
            aboutContentElement.innerHTML = `
                <h2>About Me</h2>
                <p>${userData.bio || 'No bio available.'}</p>
                <h2>GitHub Stats</h2>
                <p><strong>Public Repositories:</strong> ${userData.public_repos}</p>
                <p><strong>Followers:</strong> ${userData.followers}</p>
                <p><strong>Following:</strong> ${userData.following}</p>
                <p><strong>Location:</strong> ${userData.location || 'Not specified'}</p>
                ${userData.blog ? `<p><strong>Website:</strong> <a href="${userData.blog}" target="_blank">${userData.blog}</a></p>` : ''}
            `;
        }
    } catch (error) {
        console.error('Error fetching README:', error);
        aboutContentElement.innerHTML = '<div class="loading"><p>Error loading about section.</p></div>';
    }
}

// Basic markdown to HTML converter
function convertMarkdownToHTML(markdown) {
    let html = markdown;
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/^#### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^### (.*$)/gim,  '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim,   '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim,    '<h2>$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim,     '<em>$1</em>');
    html = html.replace(/```[\s\S]*?```/g,  '');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
}

// Format date
function formatDate(date) {
    const now  = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)  return 'Today';
    if (days === 1)  return 'Yesterday';
    if (days < 7)   return `${days} days ago`;
    if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}
