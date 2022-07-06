let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ color });
    console.log('Default background color set to %cgreen', `color: ${color}`);
});

chrome.webNavigation.onCompleted.addListener(function(listener) {
  
  chrome.scripting.executeScript({
    target: { tabId: listener.tabId },
    files: ["injectedScript.js"],
  });
});