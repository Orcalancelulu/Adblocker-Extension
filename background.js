let isNetworkEnabled = true;
let isContainerEnabled = true;
let tabAdCountArray = [];
let tabId;
let totalAdCount;

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
  if (typeof tabAdCount.count == "number") return tabAdCount.count;
  return 0;
}

function saveAdCount(tab, adCount) {
  let tabAdCount = {
    "tab": tab, 
    "count": adCount
  }
  tabAdCountArray.push(tabAdCount)
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.asking === "iwantdata") {
      console.log(totalAdCount);
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
/*
chrome.declarativeNetRequest.addListener("MatchedRule", function(result) {
  console.log("matched");
})*/