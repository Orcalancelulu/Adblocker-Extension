let homeButton = document.getElementById("backToHome");
let plusElement = document.getElementById("addInput");

let whitelist;


//damit die Whitelist angezeigt werden kann, muss sie zuerst geladen werden
chrome.storage.sync.get(["whitelist"], function(response) {
    whitelist = response.whitelist;
    if (whitelist === undefined) whitelist = [];
    whitelist.forEach(siteName => createListElement(siteName));
})




plusElement.addEventListener("click", addToWhitelist)
homeButton.addEventListener("click", openHome);

//wenn man auf das + drückt, wird der Inhalt des Textfeldes gesichtert
function addToWhitelist() {
    let inputElement = document.getElementById("whitelistInput");
    if (inputElement.value.length < 1) return;
    whitelist.push(inputElement.value);
    createListElement(inputElement.value);
    inputElement.value = "";
    chrome.storage.sync.set({whitelist: whitelist});
    chrome.runtime.sendMessage({buttonEvent: "whitelist"});
}

//ein Html Listenelement wird mit gegebenem Inhalt erstellt und hinzugefügt
function createListElement(siteName) {
    LiElement = document.createElement("li");
    siteNameElement = document.createElement("a");
    closeElement = document.createElement("a");

    closeElement.classList.add("deleteSite");
    closeElement.setAttribute("id", siteName);
    closeElement.addEventListener("click", function(response) {
        let elementId = response.srcElement.id;
        let LiToDelete = document.getElementById(elementId).parentElement;
        LiToDelete.remove();
        whitelistIndex = whitelist.indexOf(elementId);
        if (whitelistIndex < 0) console.log("something went wrong");
        whitelist.splice(whitelistIndex, 1);
        chrome.storage.sync.set({whitelist: whitelist});
        chrome.runtime.sendMessage({buttonEvent: "whitelist"});
    });

    siteNameElement.innerText = siteName;
    closeElement.innerText = "x";
    LiElement.appendChild(siteNameElement);
    LiElement.appendChild(closeElement);
    document.getElementById("list").appendChild(LiElement);
}

//wenn der Pfeil gedrückt wird, kommt man zurück zur Hauptseite
function openHome() {
    window.open("popup.html", "_self");
}