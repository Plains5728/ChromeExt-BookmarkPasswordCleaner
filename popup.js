// popup.js
document.getElementById('analyzeBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'analyzeBookmarks' });
    document.getElementById('status').textContent = 'Running analysis... Check console for now.';
  });
  