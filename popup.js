getLiveData();

let buttonNetworkEnabled;
let buttonDeleterEnabled;

buttonNetwork = document.getElementById("buttonNetwork");
buttonDeleter = document.getElementById("buttonDeleter");
settingsButton = document.getElementById("settings");
slider = document.getElementById("checkboxSwitch");

chrome.declarativeNetRequest.getEnabledRulesets({rulesetIds: ["weakRules"]}).then(function (response) {
  if (response.length == 0) {
    buttonNetwork.style.backgroundColor = "tomato";
    buttonNetworkEnabled = false;
  } else {
    buttonNetwork.style.backgroundColor = "LightGreen";
    buttonNetworkEnabled = true;
  }
  checkSlider();
});

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


function openSettings() {
  window.open("settingsPage.html", "_self");
}

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

function checkSlider() {
  if (!buttonNetworkEnabled && !buttonDeleterEnabled) {
    slider.checked = false;
  } else {
    slider.checked = true;
  }
}

function changeSlider() {
  if (slider.checked) {
    if(!buttonNetworkEnabled) sendNetworkMessage();
    if(!buttonDeleterEnabled) sendDeleterMessage();
  } else {
    if (buttonNetworkEnabled) sendNetworkMessage();
    if (buttonDeleterEnabled) sendDeleterMessage();
  }
}

function getLiveData() {
  chrome.runtime.sendMessage({asking: "iwantdata"}, function (response) {
    console.log(response.dataLive);
    
    document.getElementById("showInfoLive").innerHTML = "Currently Blocking: " + response.dataLive;
    document.getElementById("showInfoTotal").innerHTML = "Total Blocked: " + response.dataTotal;
  })    
} 
