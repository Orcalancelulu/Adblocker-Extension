// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let saveText = document.getElementById("saveText");
let loadText = document.getElementById("loadText");


saveText.addEventListener("click", function(){
  var textKey = "testText";
  let input = document.getElementById("test").value;
  chrome.storage.sync.set({"testText": input});
  console.log(input);
});

loadText.addEventListener("click", function(){
  var textKey = "testText";
  chrome.storage.sync.get("testText", function (obj) {
    console.log(obj[textKey]);
    document.getElementById("test").value = obj[textKey];
  });
 
});


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.info);
    document.getElementById("showInfo").innerHTML = request.info;
  }
);


document.getElementById('testForm').addEventListener('submit', function(){
  let input = document.getElementById('test').value;
  console.log(input);
});


chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: setPageBackgroundColor,
    });
  });
  
  // The body of this function will be executed as a content script inside the
  // current page
  function setPageBackgroundColor() {
    let elements = document.querySelectorAll('*[id]');
    let regexSearch = /(?:ads|ad|advertisement|werbung)/i;
    console.log(elements);
    elements.forEach(element => {
    let foundElements = element.id.search(regexSearch);
      if (foundElements >= 0) {
        element.remove();
        chrome.runtime.sendMessage({info: foundElements.toString() + " ad(s) found"});
      } else {
        chrome.runtime.sendMessage({info: "no ad found"});
      }
    });
  }