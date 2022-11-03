adCounter = 0;

//falls container-delete abgeschaltet wurde, kommt false zurück und es passiert nichts
chrome.runtime.sendMessage({asking: "canidelete"}, function (response) {
    if (response.answer) {
        blocking();
    }
})    

//blocken der werbung
function blocking() {
    regexSearch = /((?<![eofpt])(ads|ad|advertisement|werbung)(?!e))/i; //falls e,o,f,p oder t vor den wörter steht, wirds nicht gematched
    searchAds(document.body.children); //rekursive Funktion wird aufgerufen, Html ist wie ein "Baum" aufgebaut
    if(typeof maxAdCounter == "undefined") { 
        maxAdCounter = adCounter;
    }
    sendMessageToExtension(); //fertig geblockt, Anzahl geblockte Werbung wird weitergeleitet an background.js
}

//sende Anzahl blockierter Werbung an den Service Worker
function sendMessageToExtension() {
    chrome.runtime.sendMessage({info: maxAdCounter});
}

function searchAds(childList) { /*childlist ist eine Liste aus Html Elementen. Für jedes wird geprüft, ob es Werbung in der 
    Id und class hat. Falls ja, wird das Element gelöscht (dabei auch alle Kinder). Falls nein, werden die Kinder dieses 
    Elements mit der gleichen Funktion überprüft.*/
    Array.from(childList).forEach(child => {
       
        let foundIdElements = child.id.search(regexSearch);
        let foundClassElements = child.classList.value.search(regexSearch);
        if (foundIdElements >= 0 || foundClassElements >= 0) {
            adCounter++;
            child.remove();
        } else if(child.children != null) {
            searchAds(child.children);
        }
    })
}