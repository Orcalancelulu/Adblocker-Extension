chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.info);
    chrome.runtime.sendMessage({info: request.info});
    document.getElementById("showInfoLive").innerHTML = "Currently Blocking: " + request.info;
  }
);




  
 