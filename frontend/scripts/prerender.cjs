const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error("prerender.cjs: index.html not found. Run 'vite build' first.");
    process.exit(1);
}

const template = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

const pages = [
    {
        route: 'login',
        title: 'Login | TaskSutra',
        description: 'Log in to your TaskSutra account to manage your tasks, collaborate with your team, and access workspace analytics.',
        url: 'https://tasksutra.app/login'
    },
    {
        route: 'signup',
        title: 'Sign Up | TaskSutra',
        description: 'Create a new TaskSutra account to set up your team workspace, automate tasks with AI, and track cycle time.',
        url: 'https://tasksutra.app/signup'
    }
];

pages.forEach(page => {
    let html = template;
    
    // Replace Meta Tags
    html = html.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/g, `<meta name="title" content="${page.title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${page.description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/g, `<link rel="canonical" href="${page.url}" />`);
    
    // Replace Open Graph / Facebook Meta Tags
    html = html.replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${page.title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${page.description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/g, `<meta property="og:url" content="${page.url}/" />`);
    
    // Replace Twitter Meta Tags
    html = html.replace(/<meta property="twitter:title" content=".*?" \/>/g, `<meta property="twitter:title" content="${page.title}" />`);
    html = html.replace(/<meta property="twitter:description" content=".*?" \/>/g, `<meta property="twitter:description" content="${page.description}" />`);
    html = html.replace(/<meta property="twitter:url" content=".*?" \/>/g, `<meta property="twitter:url" content="${page.url}/" />`);

    const pageDir = path.join(DIST_DIR, page.route);
    if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(pageDir, 'index.html'), html);
    console.log(`Prerendered: /${page.route}/index.html with custom SEO tags`);
});

console.log("Static metadata prerendering completed successfully!");
