var openTabs = {};
var activeTab = null;

function doTimer(tabId) {
  console.log(">>> "+ tabId);
  var self = tabId;
  if (!openTabs[tabId]) {
    console.log("no buffer: "+ tabId);
    return;
  }
  openTabs[tabId].timer = setTimeout(function() {
    console.log("tick");
    console.log(tabId +" ; "+ self);

    if (openTabs[tabId]) {
      openTabs[tabId].status = "sleep";
      chrome.tabs.executeScript(tabId, {code:"document.body.innerHTML = '';"});
    }
  }, 5000);
}


chrome.pageAction.onClicked.addListener(function(tab){
  console.log("page action clicked.");
  console.log(tab);
});

chrome.tabs.onRemoved.addListener(function(tabId){
  console.log("tab removed.");
  console.log(tabId);

  delete openTabs[tabId];
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  /*
  console.log("tab updated.");
  console.log(tab);
  console.log(changeInfo);
  */

  if (changeInfo.status == "complete") {
    console.log("tab load completed.");
    console.log(tab);
    console.log(changeInfo);

    openTabs[tab.id] = {
      "id": tab.id,
      "title": tab.title,
      "url": tab.url,
      "favicon": tab.favIconUrl,
      "status": "default",
      "timer": null
    };
    console.log(openTabs[tab.id]);

    if (tab.id != activeTab) {
      //doTimer(tab.id);
      /*
      var self = tab.id;
      openTabs[tab.id].timer = setTimeout(function() {
        console.log("tick");
        console.log(self);
      }, 5000);
      */
    }
  }
});
chrome.tabs.onActivated.addListener(function(activeInfo){
  console.log("tab activated.");
  console.log(activeInfo);
  console.log(openTabs[activeInfo.tabId]);
  console.log(openTabs[activeInfo.tabId].status);

  if (activeTab != activeInfo.tabId) {
    if (activeTab) {
      console.log("tab inactivated.");
      console.log(openTabs[activeTab]);
      doTimer(activeTab);
      /*
      var self = activeTab;
      openTabs[activeTab].timer = setTimeout(function() {
        console.log("tick");
        console.log(self);
      }, 5000);
      */
    }

    activeTab = activeInfo.tabId;
    if (openTabs[activeTab] && openTabs[activeTab].timer) {
      clearTimeout(openTabs[activeTab].timer);
    }

    if (openTabs[activeTab].status == "sleep") {
      chrome.tabs.reload(activeTab);
    }
  }
});


