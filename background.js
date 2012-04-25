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
    console.log("Reload: "+ this.id);
    chrome.tabs.reload(this.id);
  },
  startTimer: function(limit) {
    this.stopTimer();
    
    if (this.url.match(/^https?:\/\//)) {
      console.log("start timer: "+ this.id);
      
      var _self = this;
      this.timer = setTimeout(function() {
        _self.status = "sleep";
        chrome.tabs.executeScript(_self.id, {code:"document.body.innerHTML = '';"});
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
    console.log("get tab info: "+ tabId);
    console.log(this.tabs[tabId]);
    
    return this.tabs[tabId];
  },
  set: function(tab) {
    console.log("set tab info: "+ tab.id);
    console.log(tab);
    
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
    
    this.set(tab);
    console.log("tab load completed:"+ tab.id);
    
    if (this.activeTabId && (tab.id != this.activeTabId)) {
      console.log("inactive tab loaded (deactivate): "+ tab.id +" : "+ this.activeTabId);
      this.onDeactivated(tab.id);
    }
  },
  onActivated: function(activeInfo) {
    //
    console.log("tab activated: "+ activeInfo.tabId);
    
    var _tab = this.get(activeInfo.tabId);
    if (_tab == undefined) {
      console.log("unknown tab: "+ activeInfo.tabId);
      
      var _self = this;
      chrome.tabs.get(activeInfo.tabId, function(tab) {
        _self.set(tab);
      });
      return;
    }
    
    if (this.activeTabId != activeInfo.tabId) {
      console.log("active tab changed: "+ this.activeTabId +" -> "+ activeInfo.tabId);
      this.onDeactivated(this.activeTabId);
    }
    
    this.activeTabId = activeInfo.tabId;
    
    _tab.stopTimer();
    
    if (_tab.status == "sleep") {
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
    
    _tab.startTimer(5*60*1000);
  },
  onRemoved: function(tabId) {
    console.log("tab removed: "+ tabId);
    
    this.remove(tabId);
  }
}


var sntab = new SnoozeTab();

chrome.tabs.onUpdated.addListener  (function(){ sntab.onUpdated.apply(sntab, arguments); });
chrome.tabs.onRemoved.addListener  (function(){ sntab.onRemoved.apply(sntab, arguments); });
chrome.tabs.onActivated.addListener(function(){ sntab.onActivated.apply(sntab, arguments); });

