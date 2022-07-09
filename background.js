/*background.js ist im Hintergrund immer aktiv, wenn man den Browser offen hat. 
Wird auch nie neu aufgerufen. Deshalb eignet es sich gut, um Daten zwischenzuspeichern (z.B adCounter)*/


let isNetworkEnabled = true;
let isContainerEnabled = false;
let tabAdCountArray = [];
let tabId;
let totalAdCount;
let networkAdCount = 0;
let networkBeforeArray = [];
let networkAfterArray = [];


//sobald der Browser geöffnet wird, wird totalAdCount definiert
chrome.storage.sync.get(["totalAdCount"], function(response) {
  if (response.totalAdCount === undefined) {
    totalAdCount = 0;
    return;
  }
  totalAdCount = response.totalAdCount;
  console.log("totaladcount has been set: " + totalAdCount);
})

/*wenn die Extension installiert wird, muss die Black- und Whitelist von 
declarativeNetRequest festgelegt werden*/
chrome.runtime.onInstalled.addListener(function() { 
  updateWhitelistBlacklist
})


chrome.webRequest.onBeforeRequest.addListener(function(request) { //zählen, wie viele Anfragen reingehen
  networkBeforeArray.push(request.url);
}, {urls: ["<all_urls>"]})


/*zählen, wie viele Anfragen es durch den Filter schaffen, 
Differenz von vorher ist die Anzahl geblockter Werbung*/
chrome.webRequest.onCompleted.addListener(function(request) { 
  networkAfterArray.push(request.url);
}, {urls: ["<all_urls>"]})


//immer den aktiven tab wissen (um adCounter richtig zwischenzuspeichern)
chrome.tabs.onActivated.addListener(function(activeInfo) {
  tabId = activeInfo.tabId;
})

//falls der Netzwerk-Knopf gedrück wurde, wird dann schlussendlich diese Funktion aufgerufen
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


//falls der Container-Delete-Knopf gedrück wurde, wird dann schlussendlich diese Funktion aufgerufen
function enableDisableContainerDelete() {
  if (isContainerEnabled) {
    isContainerEnabled = false;
  } else {
    isContainerEnabled = true;
  }
}

//durch den aktiven tab wird der zwischengespeicherte AdCount ausgelesen
function getAdCount(tab) {
  let tabAdCount = tabAdCountArray.find(tabAdCount => tabAdCount.tab == tab);
  if (tabAdCount === undefined) return networkAdCount;
  return tabAdCount.count + networkAdCount;
}

//adCount wird beim aktiven tab gespeichert
function saveAdCount(tab, adCount) {
  let tabAdCount = {
    "tab": tab, 
    "count": adCount
  }
  tabAdCountArray.push(tabAdCount)
}


//wird gezählt, wie viele Anfragen durchgekommen sind
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

//wenn eine Nachricht reinkommt, wird das aufgerufen. Damit können die anderen Skripte mit background.js kommunizieren
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
    } else if (request.buttonEvent == "whitelist") {
      updateWhitelistBlacklist();
    }
  }
)


/*excludedInitiatorDomains und requestDomains von declarativeNetRequest wird aktualisiert
(falls z.B die Whitelist in den Settings geändert wurde)*/ 
function updateWhitelistBlacklist() {
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
}