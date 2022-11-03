//fragt den Service Worker nach der Anzahl blockierter Werbung. Diese wird dann angezeigt
getLiveData();

let buttonNetworkEnabled;
let buttonDeleterEnabled;

buttonNetwork = document.getElementById("buttonNetwork");
buttonDeleter = document.getElementById("buttonDeleter");
settingsButton = document.getElementById("settings");
slider = document.getElementById("checkboxSwitch");

//fragt den Service Worker, ob das blockieren über das Netzwerk aktiv ist oder nicht. Dementsprechend wird dann auch die Farbe des Knopfes und der Zustand des Schiebereglers geändert
chrome.runtime.sendMessage({asking: "networkEnabled"}, function (response) {
  if (response.answer) {
    buttonNetwork.style.backgroundColor = "LightGreen";
    buttonNetworkEnabled = true;
  } else {
    buttonNetwork.style.backgroundColor = "tomato";
    buttonNetworkEnabled = false;
  }
  checkSlider();
})

//fragt den Service Worker, ob das blockieren der HTML-Elementen aktiv ist oder nicht. Dementsprechend wird dann auch die Farbe des Knopfes und der Zustand des Schiebereglers geändert
chrome.runtime.sendMessage({asking: "canidelete"}, function (response) {
  if (response.answer) {
    buttonDeleter.style.backgroundColor = "LightGreen";
    buttonDeleterEnabled = true;
  } else {
    buttonDeleter.style.backgroundColor = "Gainsboro";
    buttonDeleterEnabled = false;
  }
  checkSlider(); //2 mal checkSlider, weil die Funktionen asynchron sind. Man weiss nicht, welches zuerst fertig ist, deshalb einfach 2 mal checken
})    

//die Funktion baut den Url so um, dass schlussendlich nur die Domain angezeigt wird
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
  let url = tabs[0].url;

  if(url.indexOf("https://") > -1) {
    url = url.substr(8);
  } else url = url.substr(7);

  if (url.indexOf("www") > -1) {
    url = url.substr(4);
  }
  urlArray = url.split("/", 1);
  url = urlArray[0];
  
  urlElement = document.getElementById("siteName");
  urlElement.innerHTML = url;  
});


buttonNetwork.addEventListener("click", sendNetworkMessage);
buttonDeleter.addEventListener("click", sendDeleterMessage);
slider.addEventListener("click", changeSlider);
settingsButton.addEventListener("click", openSettings);

//Wenn der Nutzer auf die Einstellungen klickt, wird die Einstellungenseite geöffnet
function openSettings() {
  window.open("settingsPage.html", "_self");
}

//wenn der Knopf für das Blockieren über das Netzwerk gedrückt wird, wird er entweder ein- oder ausgeschaltet. Dies wird dann dem Service Worker mitgeteilt.
function sendNetworkMessage() {
  if (buttonNetworkEnabled) {
    buttonNetwork.style.backgroundColor = "tomato";
    buttonNetworkEnabled = false;
    checkSlider();
  } else {
    buttonNetwork.style.backgroundColor = "LightGreen";
    buttonNetworkEnabled = true;
    checkSlider();
  }
  chrome.runtime.sendMessage({buttonEvent: "network"});
}

//wenn der Knopf für das Löschen gewisser HTML-Elementen gedrückt wird, wird er entweder ein- oder ausgeschaltet. Dies wird dann dem Service Worker mitgeteilt.
function sendDeleterMessage() {
  if (buttonDeleterEnabled) {
    buttonDeleter.style.backgroundColor = "Gainsboro";
    buttonDeleterEnabled = false
    checkSlider();
  } else {
    buttonDeleter.style.backgroundColor = "LightGreen";
    buttonDeleterEnabled = true;
    checkSlider();
  }
  chrome.runtime.sendMessage({buttonEvent: "container"});
}

//überprüft, ob der Schieberegler ein- oder ausgeschaltet sein soll. Sobald keine der Blockier-Methoden eingeschaltet ist, ist der Schieberegler ausgeschaltet. Ansonsten ist er eingeschaltet. 
function checkSlider() {
  if (!buttonNetworkEnabled && !buttonDeleterEnabled) {
    slider.checked = false;
  } else {
    slider.checked = true;
  }
}

//falls auf den Schieberegler gedrückt wird, werden die Funktionen ein- oder ausgeschaltet. Beim Einschaltet wird aber nur das Blockieren über das Netzwerk eingeschaltet, weil die andere Methode standardmässig deaktiviert ist. 
function changeSlider() {
  if (slider.checked) {
    if(!buttonNetworkEnabled) sendNetworkMessage();
  } else {
    if (buttonNetworkEnabled) sendNetworkMessage();
    if (buttonDeleterEnabled) sendDeleterMessage(); //hier
  }
}

//fragt den Service Worker nach der Anzahl blockierter Werbung. Diese wird dann angezeigt
function getLiveData() {
  chrome.runtime.sendMessage({asking: "iwantdata"}, function (response) {    
    document.getElementById("showInfoLive").innerHTML = "Currently Blocking: " + response.dataLive;
    document.getElementById("showInfoTotal").innerHTML = "Total Blocked: " + response.dataTotal;
  })    
} 
