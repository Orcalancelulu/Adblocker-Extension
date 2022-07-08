let isNetworkEnabled = true;
let isContainerEnabled = false;
let tabAdCountArray = [];
let tabId;
let totalAdCount;
let networkAdCount = 0;
let networkBeforeArray = [];
let networkAfterArray = [];

chrome.runtime.onInstalled.addListener(function() {
  let blacklist;
  let whitelist;
  const url = chrome.runtime.getURL("storage/blacklist.json");
  fetch(url)
  .then(function(response) {
    response.json().then(function(response){
      blacklist = response;
      chrome.storage.sync.get(["whitelist"], function(response) {
        if(response.whitelist === undefined) {
          whitelist = [];
        } else {
          whitelist = response.whitelist;
        }
        console.log(whitelist);
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [1],
          addRules: [{
            "id": 1,
            "priority": 1,
            "action": {"type": "block"},
            "condition": {"excludedInitiatorDomains": whitelist, "requestDomains": blacklist}
          }]
        })
      }) //hier: networkadcounter auch mit tab listen machen
    });
  })

  chrome.storage.sync.get(["totalAdCount"], function(response) {
    totalAdCount = response.totalAdCount;
  })


})

chrome.webRequest.onBeforeRequest.addListener(function(request) { //zählen, wie viele Anfragen reingehen
  networkBeforeArray.push(request.url);
}, {urls: ["<all_urls>"]})

chrome.webRequest.onCompleted.addListener(function(request) { //zählen, wie viele Anfragen es durch den Filter schaffen, Differenz von vorher ist die Anzahl geblockter Werbung
  networkAfterArray.push(request.url);
}, {urls: ["<all_urls>"]})

chrome.tabs.onActivated.addListener(function(activeInfo) {
  tabId = activeInfo.tabId;
})

function enableDisableNetwork() {
  if(isNetworkEnabled) {
    isNetworkEnabled = false;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["weakRules"]
    }); 
  } else {
    isNetworkEnabled = true;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ["weakRules"]
    }); 
  }
}

function enableDisableContainerDelete() {
  if (isContainerEnabled) {
    isContainerEnabled = false;
  } else {
    isContainerEnabled = true;
  }
}

function getAdCount(tab) {
  let tabAdCount = tabAdCountArray.find(tabAdCount => tabAdCount.tab == tab);
  if (tabAdCount === undefined) return networkAdCount;
  return tabAdCount.count + networkAdCount;
}

function saveAdCount(tab, adCount) {
  let tabAdCount = {
    "tab": tab, 
    "count": adCount
  }
  tabAdCountArray.push(tabAdCount)
}

function getNetworkCount() {
  let networkCount = networkBeforeArray.length-networkAfterArray.length;
  networkBeforeArray = [];
  networkAfterArray = [];

  chrome.storage.sync.get(["totalAdCount"], function(result) {
    if (typeof result.totalAdCount != "undefined") {
      totalAdCount = result.totalAdCount + networkCount;
      chrome.storage.sync.set({totalAdCount: totalAdCount});
    } else {
      chrome.storage.sync.set({totalAdCount: 0});
      totalAdCount = 0;
    }
  })
  networkAdCount += networkCount;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.asking === "iwantdata") {
      getNetworkCount();
      adCount = getAdCount(tabId);
      if (!isContainerEnabled && !isNetworkEnabled) adCount = 0; 
      sendResponse({dataLive: adCount, dataTotal: totalAdCount});     
    } else if (request.asking == "canidelete") {
      sendResponse({answer: isContainerEnabled});
    } else if (typeof request.info == "number"){
      saveAdCount(sender.tab.id, request.info);
      chrome.storage.sync.get(["totalAdCount"], function(result) {
        if (typeof result.totalAdCount != "undefined") {
          totalAdCount = result.totalAdCount + request.info;
          chrome.storage.sync.set({totalAdCount: totalAdCount});
        } else {
          chrome.storage.sync.set({totalAdCount: 0});
          totalAdCount = 0;
        }
      })
    } else if (request.buttonEvent == "network") {
      enableDisableNetwork();
    } else if (request.buttonEvent == "container") {
      enableDisableContainerDelete();
    }
  }
)
