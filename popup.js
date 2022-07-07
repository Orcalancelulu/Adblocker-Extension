getLiveData();



buttonNetwork = document.getElementById("buttonNetwork");
buttonDeleter = document.getElementById("buttonDeleter");

slider = document.getElementById("checkboxSwitch");
slider.checked = true;

chrome.declarativeNetRequest.getEnabledRulesets({rulesetIds: ["weakRules"]}).then(function (response) {
  if (response.length == 0) {
    buttonNetwork.style.backgroundColor = "tomato";
    buttonNetworkEnabled = false;
  } else {
    buttonNetwork.style.backgroundColor = "LightGreen";
    buttonNetworkEnabled = true;
  }
});

chrome.runtime.sendMessage({asking: "canidelete"}, function (response) {
  if (response.answer) {
    buttonDeleter.style.backgroundColor = "LightGreen";
    buttonDeleterEnabled = true;
  } else {
    buttonDeleter.style.backgroundColor = "tomato";
    buttonDeleterEnabled = false;
  }
})    


buttonNetwork.addEventListener("click", sendNetworkMessage);
buttonDeleter.addEventListener("click", sendDeleterMessage);
slider.addEventListener("click", changeSlider);

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
    buttonDeleter.style.backgroundColor = "tomato";
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
    console.log(response.data);
    
    document.getElementById("showInfoLive").innerHTML = "Currently Blocking: " + response.data;
  })    
} 
