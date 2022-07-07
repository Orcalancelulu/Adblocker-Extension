adCounter = 0;

chrome.runtime.sendMessage({asking: "canidelete"}, function (response) {
    if (response.answer) {
        blocking();
    }
})    

function blocking() {
    regexSearch = /((?<![eofpt])(ads|ad|advertisement|werbung)(?!e))/i;
    searchAds(document.body.children);
    if(typeof maxAdCounter == "undefined") {
        maxAdCounter = adCounter;
    }
    sendMessageToExtension();
}

function sendMessageToExtension() {
    console.log("sending");
    chrome.runtime.sendMessage({info: maxAdCounter});
}

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