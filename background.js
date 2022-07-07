let adCounterLive = 0;
let isNetworkEnabled = true;
let isContainerEnabled = true;

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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.asking === "iwantdata") {
      sendResponse({data: adCounterLive});
    } else if (request.asking == "canidelete") {
      sendResponse({answer: isContainerEnabled})
    } else if (typeof request.info == "number"){
      console.log(typeof request.info);
      adCounterLive = request.info;
    } else if (request.buttonEvent == "network") {
      enableDisableNetwork();
    } else if (request.buttonEvent == "container") {
      enableDisableContainerDelete();
    }
  }
)