// background.js

// Utility function to normalize URLs for duplicate detection
function normalizeUrl(url) {
  try {
    let u = new URL(url);
    u.protocol = 'https:';
    u.hostname = u.hostname.replace(/^www\./, '');
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch (e) {
    return url;
  }
}

// Fetch metadata from the bookmarked page
async function fetchPageMetadata(url) {
  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!response.ok) return { broken: true };
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const title = doc.querySelector('title')?.innerText || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    return { title, description, keywords, broken: false };
  } catch (e) {
    return { broken: true };
  }
}

// Recursive function to walk the bookmark tree
async function analyzeBookmarks(node, results = [], seen = new Set()) {
  if (node.url) {
    const normUrl = normalizeUrl(node.url);
    if (seen.has(normUrl)) {
      results.push({ ...node, duplicate: true });
      return results;
    }
    seen.add(normUrl);
    const metadata = await fetchPageMetadata(node.url);
    results.push({ ...node, ...metadata });
  } else if (node.children && node.children.length > 0) {
    for (let child of node.children) {
      await analyzeBookmarks(child, results, seen);
    }
  }
  return results;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Bookmark Cleanup Manager extension installed.');

  chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
    const root = bookmarkTreeNodes[0];
    const results = await analyzeBookmarks(root);
    console.log('Analysis complete:', results);
    // Later: save to storage or communicate with popup.js
  });
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'analyzeBookmarks') {
    chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
      const root = bookmarkTreeNodes[0];
      const results = await analyzeBookmarks(root);
      console.log('Manual analysis complete:', results);
    });
  }
});