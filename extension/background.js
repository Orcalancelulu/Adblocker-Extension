let isNetworkEnabled = true;
let isContainerEnabled = false;
let tabAdCountArray = [];
let tabId;
let totalAdCount;

let networkBeforeArray = [];
let networkAfterArray = [];

//wenn das backgroundskript startet, muss der gerade geöffnete tab herausgefunden werden
chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
  tabId = tabs[0].id;
});


//beim starten des browsers müssen die alten daten noch gelöscht werden
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.set({tabAdCountArray: []});
  chrome.storage.sync.get(["totalAdCount"], function(response) {
    if (typeof response.totalAdCount != "number") {
      chrome.storage.sync.set({totalAdCount: 0});
    }
  });
})

//beim starten sollen die Einstellungen gleich bleiben. Deswegen wird isNetworkEnabled auf das gespeicherte gesetzt
chrome.storage.local.get(["networkEnabled"], function(response) {
  if (response.networkEnabled != undefined) {
    isNetworkEnabled = response.networkEnabled;
  }
});

//beim starten sollen die Einstellungen gleich bleiben. Deswegen wird isContainerEnabled auf das gespeicherte gesetzt
chrome.storage.local.get(["containerEnabled"], function(response) {
  if (response.containerEnabled != undefined) {
    isContainerEnabled = response.containerEnabled;
  }
});

//sobald der Browser geöffnet wird, wird totalAdCount definiert
chrome.storage.sync.get(["totalAdCount"], function(response) {
  if (response.totalAdCount === undefined) {
    totalAdCount = 0;
    return;
  }
  totalAdCount = response.totalAdCount;
})

/*wenn die Extension gestartet wird, muss die Black- und Whitelist von 
declarativeNetRequest festgelegt werden*/
updateWhitelistBlacklist(isNetworkEnabled);


chrome.webRequest.onBeforeRequest.addListener(function(request) { //zählen, wie viele Anfragen reingehen
  networkBeforeArray.push(request.url);
}, {urls: ['http://*/*', 'https://*/*']});


/*zählen, wie viele Anfragen es durch den Filter schaffen, 
Differenz von vorher ist die Anzahl geblockter Werbung*/
chrome.webRequest.onCompleted.addListener(function(request) { 
  networkAfterArray.push(request.url);
}, {urls: ['http://*/*', 'https://*/*']});


//immer den aktiven tab wissen (um adCounter richtig zwischenzuspeichern), getAdCount() aufrufen, damit alle Netzwerkanfragen, welche geblockt wurden
//(seit dem letzten Öffnen vom adblocker), beim richtigen tab gespeichert werden.
chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (typeof tabId == "number") getAdCount(tabId, function(response){
  });
  tabId = activeInfo.tabId;
});

//falls der Netzwerk-Knopf gedrück wurde, wird dann schlussendlich diese Funktion aufgerufen
function enableDisableNetwork() {
  if(isNetworkEnabled) {
    isNetworkEnabled = false;
    updateWhitelistBlacklist(false);
  } else {
    isNetworkEnabled = true;
    updateWhitelistBlacklist(true);
  }
  saveBlockingMethods()
}


//falls der Container-Delete-Knopf gedrück wurde, wird dann schlussendlich diese Funktion aufgerufen
function enableDisableContainerDelete() {
  if (isContainerEnabled) {
    isContainerEnabled = false; 
  } else {
    isContainerEnabled = true;
  }
  saveBlockingMethods()
}

//die Einstellungen werden gespeichert, damit sie beim Neustarten des Service Workers auch beibehalten werden.
function saveBlockingMethods() {
  chrome.storage.local.set({networkEnabled: isNetworkEnabled, containerEnabled: isContainerEnabled});
}

//durch den aktiven tab wird der zwischengespeicherte AdCount ausgelesen
function getAdCount(tab, functionToCall) { //asynchron
  getTabAdCountArray(function(tabAdCountArray) {
    let tabAdCount = tabAdCountArray.find(tabAdCount => tabAdCount.tab == tab);
    let tabAdIndex = tabAdCountArray.indexOf(tabAdCount);
    if (tabAdIndex == -1) {
      let networkCount = getNetworkCount();
      saveAdCount(tabId, networkCount)
      functionToCall(networkCount);
      return;
    }

    tabAdCountArray[tabAdIndex].count += getNetworkCount();
    setTabAdCountArray(tabAdCountArray);
    functionToCall(tabAdCountArray[tabAdIndex].count);
  
  });
}

//adCount wird beim aktiven tab gespeichert
function saveAdCount(tab, adCount) { //asynchron

  if (adCount > 0) {
    chrome.storage.sync.get(["totalAdCount"], function (response) {
      if (response.totalAdCount > -1) {

        totalAdCount = response.totalAdCount + adCount;
        chrome.storage.sync.set({totalAdCount: totalAdCount});
      } else {
        chrome.storage.sync.set({totalAdCount: adCount});

      }
    })
  }

  let tabAdCount = {
    "tab": tab, 
    "count": adCount
  }

  getTabAdCountArray(function(tabAdCountArray) {
    tabAdCountArray.push(tabAdCount);
    setTabAdCountArray(tabAdCountArray);
  });


}

//speichert die Liste mit der Anzahl blockierter Werbung pro Tab im lokalen Speicher
function setTabAdCountArray(tabAdCountArray) {
  chrome.storage.local.set({tabAdCountArray: tabAdCountArray});
}

//nimmt die Liste mit der Anzahl blockierter Werbung pro Tab aus dem lokalen Speicher
function getTabAdCountArray(functionToCall) {
  chrome.storage.local.get(["tabAdCountArray"], function (response) {
    functionToCall(response.tabAdCountArray);
  })
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
      } else {
        chrome.storage.sync.set({totalAdCount: networkCount});

      }
    })
  } 
  return networkCount;
}

//wenn eine Nachricht reinkommt, wird das aufgerufen. Damit können die anderen Skripte mit background.js kommunizieren
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.asking === "iwantdata") {
      getAdCount(tabId, function(adCount) {
        chrome.storage.sync.get(["totalAdCount"], function (response) {
          totalAdCount = response.totalAdCount;
          if (adCount < 0) adCount = 0; 
          sendResponse({dataLive: adCount, dataTotal: totalAdCount}); 
        });
      });
      return true; //damit der message port offen bleibt
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

  //the data of the blacklist is from: https://pgl.yoyo.org/adservers/
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
      })
    });
  })
}