/*background.js ist im Hintergrund immer aktiv, wenn man den Browser offen hat. 
Wird auch nie neu aufgerufen. Deshalb eignet es sich gut, um Daten zwischenzuspeichern (z.B tabAdCountArray)*/


let isNetworkEnabled = true;
let isContainerEnabled = false;
let tabAdCountArray = [];
let tabId;
let totalAdCount;

let networkBeforeArray = [];
let networkAfterArray = [];


//sobald der Browser geöffnet wird, wird totalAdCount definiert
chrome.storage.sync.get(["totalAdCount"], function(response) {
  if (response.totalAdCount === undefined) {
    totalAdCount = 0;
    return;
  }
  totalAdCount = response.totalAdCount;
  //console.log("totaladcount has been set: " + totalAdCount);
})

/*wenn die Extension gestartet wird, muss die Black- und Whitelist von 
declarativeNetRequest festgelegt werden*/
updateWhitelistBlacklist(isNetworkEnabled);


chrome.webRequest.onBeforeRequest.addListener(function(request) { //zählen, wie viele Anfragen reingehen
  networkBeforeArray.push(request.url);
}, {urls: ["<all_urls>"]})


/*zählen, wie viele Anfragen es durch den Filter schaffen, 
Differenz von vorher ist die Anzahl geblockter Werbung*/
chrome.webRequest.onCompleted.addListener(function(request) { 
 networkAfterArray.push(request.url);
}, {urls: ["<all_urls>"]})


//immer den aktiven tab wissen (um adCounter richtig zwischenzuspeichern), getAdCount() aufrufen, damit alle Netzwerkanfragen, welche geblockt wurden
//(seit dem letzten Öffnen vom adblocker), beim richtigen tab gespeichert werden.
chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (typeof tabId != "undefined") console.log("changed tab, old count: " + getAdCount(tabId));
  tabId = activeInfo.tabId;
})

//falls der Netzwerk-Knopf gedrück wurde, wird dann schlussendlich diese Funktion aufgerufen
function enableDisableNetwork() {
  if(isNetworkEnabled) {
    isNetworkEnabled = false;
    updateWhitelistBlacklist(false);
  } else {
    isNetworkEnabled = true;
    updateWhitelistBlacklist(true);
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
  console.log("currently on tab: " + tabId);
  let tabAdCount = tabAdCountArray.find(tabAdCount => tabAdCount.tab == tab);
  let tabAdIndex = tabAdCountArray.indexOf(tabAdCount);
  console.log("index found at: " + tabAdIndex);
  if (tabAdIndex == -1) {
    let networkCount = getNetworkCount();
    saveAdCount(tabId, networkCount);
    console.log("index = -1, saving and getting networkcount: " + networkCount);
    return networkCount;
  }

  console.log("index found, getting both: saved count: " + tabAdCountArray[tabAdIndex].count);
  tabAdCountArray[tabAdIndex].count += getNetworkCount();
  console.log("with network: " + tabAdCountArray[tabAdIndex].count);

  return tabAdCountArray[tabAdIndex].count;
}

//adCount wird beim aktiven tab gespeichert
function saveAdCount(tab, adCount) {

  if (adCount > 0) {
    chrome.storage.sync.get(["totalAdCount"], function (response) {
      if (response.totalAdCount > -1) {

        totalAdCount = response.totalAdCount + adCount;
        chrome.storage.sync.set({totalAdCount: totalAdCount});
      }
    })
  }

  let tabAdCount = {
    "tab": tab, 
    "count": adCount
  }
  tabAdCountArray.push(tabAdCount)
}


//wird gezählt, wie viele Netzwerk-Anfragen durchgekommen sind
function getNetworkCount() {
  let networkCount = networkBeforeArray.length-networkAfterArray.length;
  networkBeforeArray = [];
  networkAfterArray = [];
  if (networkCount > 0) {
    chrome.storage.sync.get(["totalAdCount"], function (response) {
      if (response.totalAdCount > -1) {
        totalAdCount = response.totalAdCount + networkCount;
        chrome.storage.sync.set({totalAdCount: totalAdCount});
      }
    })
  } 
  console.log("getting networkcount: " + networkCount);
  return networkCount;
}

//wenn eine Nachricht reinkommt, wird das aufgerufen. Damit können die anderen Skripte mit background.js kommunizieren
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.asking === "iwantdata") {
      console.log("data asked");
      let adCount = getAdCount(tabId);
      console.log("got " + adCount + " back");
      chrome.storage.sync.get(["totalAdCount"], function (response) {
        totalAdCount = response.totalAdCount;
      })
      if (adCount < 0) adCount = 0; 
      sendResponse({dataLive: adCount, dataTotal: totalAdCount});     
    } else if (request.asking == "canidelete") {
      sendResponse({answer: isContainerEnabled});
    } else if (request.asking == "networkEnabled") {
      sendResponse({answer: isNetworkEnabled});
    } else if (typeof request.info == "number"){
      saveAdCount(tabId, request.info);
    } else if (request.buttonEvent == "network") {
      enableDisableNetwork();
    } else if (request.buttonEvent == "container") {
      enableDisableContainerDelete();
    } else if (request.buttonEvent == "whitelist") {
      updateWhitelistBlacklist(isNetworkEnabled);  //whitelist wurde geändert und hochgeladen. Nun muss sie nur noch eingesetzt werden, deshalb updateWhitelistBlacklist
    }
  }
)


/*excludedInitiatorDomains und requestDomains von declarativeNetRequest wird aktualisiert
(falls z.B die Whitelist in den Settings geändert wurde)*/ 
function updateWhitelistBlacklist(action) {
  let blacklist;
  let whitelist;
  const url = chrome.runtime.getURL("storage/blacklist.json");
  fetch(url)
  .then(function(response) {
    response.json().then(function(response){
      blacklist = response;
      //console.log("got blacklist");
      chrome.storage.sync.get(["whitelist"], function(response) {
        if(response.whitelist === undefined) {
          whitelist = [];
        } else {
          whitelist = response.whitelist;
        }
        if (!action) blacklist = [""];
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