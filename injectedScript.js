adCounter = 0;

regexSearch = /((?<![eofpt])(ads|ad|advertisement|werbung)(?!e))/i;
searchAds(document.body.children);
if(typeof maxAdCounter == "undefined") {
    maxAdCounter = adCounter;
}
console.log(maxAdCounter);
chrome.runtime.sendMessage({info: maxAdCounter});



function searchAds(childList) {
    Array.from(childList).forEach(child => {
       
        let foundIdElements = child.id.search(regexSearch);
        let foundClassElements = child.classList.value.search(regexSearch);
        if (foundIdElements >= 0 || foundClassElements >= 0) {
            
            if (child.tagName == "DIV") adCounter++;
            child.remove();
        } else if(child.children != null) {
            searchAds(child.children);
        }
    })
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("back: " + request.info);
    }
  );

