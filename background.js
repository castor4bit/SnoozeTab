TabInfo = function(id, url, title, favicon) {
  this.id = id;
  this.url = url;
  this.title = title;
  this.favicon  = favicon;
};
TabInfo.prototype = {
  id: null,
  url: null,
  title: null,
  favicon: null,
  status: "default",
  timer: null,
  
  reload: function() {
    chrome.tabs.reload(this.id);
  },
  startTimer: function(limit) {
    this.stopTimer();
    
    if (this.url.match(/^https?:\/\//)) {
      console.log("start timer: "+ this.id +" : "+ this.status);
      
      var _self = this;
      this.timer = setTimeout(function() {
        _self.status = "sleep";
        
        chrome.tabs.update(_self.id, { url: "about:blank" }, function(tab) {
          chrome.tabs.update(_self.id, { url: _self.url }, function(tab) {
            _self.status = "standby";
          });
        });
        console.log("suspended: "+ _self.id);
      }, limit);
    }
  },
  stopTimer: function() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
};
    

SnoozeTab = function() {
  /* */
};
SnoozeTab.prototype = {
  tabs: {},
  activeTabId: null,
  
  get: function(tabId) {
    return this.tabs[tabId];
  },
  set: function(tab) {
    if (this.tabs[tab.id]) {
      this.remove(tab.id);
    }
    
    this.tabs[tab.id] = new TabInfo(tab.id, tab.url, tab.title, tab.favIconUrl);
  },
  remove: function(tabId) {
    var _tab = this.get(tabId);
    
    if (_tab) {
      _tab.stopTimer();
      
      delete this.tabs[tabId];
    }
  },
  
  onUpdated: function(tabId, changeInfo, tab) {
    //
    if (changeInfo.status != "complete") {
      return;
    }
    
    if ((tab.id == this.activeTabId) || (this.status == "default")) {
      this.set(tab);
    }
    console.log("tab load completed:"+ tab.id);
    
    if (this.activeTabId && (tab.id != this.activeTabId)) {
      console.log("inactive tab loaded (deactivate): "+ tab.id +" : "+ this.activeTabId);
      this.onDeactivated(tab.id);
    }
  },
  onActivated: function(activeInfo) {
    //
    console.log("tab activated: "+ activeInfo.tabId);
    
    if (this.activeTabId != activeInfo.tabId) {
      console.log("active tab changed: "+ this.activeTabId +" -> "+ activeInfo.tabId);
      this.onDeactivated(this.activeTabId);
    }
    
    this.activeTabId = activeInfo.tabId;
    
    var _tab = this.get(activeInfo.tabId);
    if (_tab == undefined) {
      console.log("unknown tab: "+ activeInfo.tabId);
      
      var _self = this;
      chrome.tabs.get(activeInfo.tabId, function(tab) {
        _self.set(tab);
        _self.activeTabId = tab.id;
      });
      return;
    }
    _tab.stopTimer();
    
    if (_tab.status != "default") {
      _tab.reload();
    }
  },
  onDeactivated: function(tabId) {
    console.log("tab deactivated: "+ tabId);
    
    var _tab = this.get(tabId);
    if (_tab == undefined) {
      console.log("unknown tab (skip): "+ tabId);
      return;
    }
    
    if (_tab.status == "default") {
      _tab.startTimer(5*60*1000);
    }
  },
  onRemoved: function(tabId) {
    console.log("tab removed: "+ tabId);
    
    this.remove(tabId);
  },
  onRequest: function(details) {
    var cancel = false;
    if ((details.tabId != -1)
      && (details.tabId != this.activeTabId)
      && (details.type != "main_frame")
      && (this.activeTabId != null)) {
      //
      cancel = true;
    }
    return { cancel: cancel };
  }
}


var sntab = new SnoozeTab();

chrome.tabs.onUpdated.addListener  (function(){ sntab.onUpdated.apply(sntab, arguments); });
chrome.tabs.onRemoved.addListener  (function(){ sntab.onRemoved.apply(sntab, arguments); });
chrome.tabs.onActivated.addListener(function(){ sntab.onActivated.apply(sntab, arguments); });
/*
chrome.webRequest.onBeforeRequest.addListener(function(){ sntab.onRequest.apply(sntab, arguments); },
  { urls: ["<all_urls>"] },
  [ "blocking" ]
);
*/
