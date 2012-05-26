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
  status: "waking",
  timer: null,
  
  
  lullaby: function(limit) {
    if (this.isWaking()) {
      this.startTimer(limit);
    }
  },
  wakeup: function() {
    this.stopTimer();
    if (this.isWaking() == false) {
      //chrome.tabs.update(this.id, { url: this.url });
    }
  },
  isWaking: function() {
    return (this.status == "waking");
  },
  startTimer: function(limit) {
    this.stopTimer();
    
    if (this.url.match(/^https?:\/\//)) {
      console.log("start timer: "+ this.id +" : "+ this.status);
      
      var _self = this;
      this.timer = setTimeout(function() {
        _self.status = "sleeping";
        
        chrome.tabs.update(_self.id, { url: chrome.extension.getURL("dummy.html") }, function(tab) {
          console.log("suspended: "+ _self.id +" : "+ _self.title);
          _self.status = "suspended";
        });
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
    this.remove(tab.id);
    this.tabs[tab.id] = new TabInfo(tab.id, tab.url, tab.title, tab.favIconUrl);
  },
  remove: function(tabId) {
    var _tab = this.get(tabId);
    
    if (_tab) {
      _tab.stopTimer();
      
      delete this.tabs[tabId];
      console.log("tab removed: "+ tabId);
    }
  },
  
  isActive: function(tabId) {
    return (this.activeTabId && (tabId == this.activeTabId));
  },
  onUpdated: function(tabId, changeInfo, tab) {
    //
    if (changeInfo.status != "complete") {
      return;
    }
    
    var _tab = this.get(tab.id);
    if (this.isActive(tab.id) || (_tab && _tab.isWaking())) {
      this.set(tab);
    }
    console.log("tab load completed:"+ tab.id);
    
    if (this.isActive(tab.id) == false) {
      console.log("inactive tab loaded (deactivate): "+ tab.id +" : "+ this.activeTabId);
      this.onDeactivated(tab.id);
    }
  },
  onActivated: function(activeInfo) {
    //
    console.log("tab activated: "+ activeInfo.tabId);
    
    if (this.isActive(activeInfo.tabId) == false) {
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
    
    _tab.wakeup();
  },
  onDeactivated: function(tabId) {
    console.log("tab deactivated: "+ tabId);
    
    var _tab = this.get(tabId);
    if (_tab) {
      _tab.lullaby(1*10*1000);  // limit
    }
    /*
    else {
      console.log("unknown tab (skip): "+ tabId);
    }
    */
  },
  onRemoved: function(tabId) {
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

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log("sender.tab.id -> "+ sender.tab.id);
    var _tab = sntab.get(sender.tab.id);
    if (_tab) {
      _res = {
        title: _tab.title,
        favicon: _tab.favicon
      }
    }
    sendResponse(_res);
  }
);

/*
chrome.webRequest.onBeforeRequest.addListener(function(){ sntab.onRequest.apply(sntab, arguments); },
  { urls: ["<all_urls>"] },
  [ "blocking" ]
);
*/
