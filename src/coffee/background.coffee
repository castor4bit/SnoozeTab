class SnoozeTab
  constructor: (window) ->
    @window = window
    @tabs = {}
    @timeout = 1000 * 30
    @interval = 10000
    @activeTabId = -1

  init: ->
    chrome.tabs.query {status:"complete"}, (tabs) =>
      for tab in tabs
        @addTab tab

    chrome.tabs.onCreated.addListener @onCreated
    chrome.tabs.onUpdated.addListener @onUpdated
    chrome.tabs.onRemoved.addListener @onRemoved
    chrome.tabs.onActivated.addListener @onActivated

    @timer = do =>
      setInterval @onTick, @interval

  addTab: (tab) =>
    if not @tabs[tab.id]?
      @tabs[tab.id] =
        id: tab.id
        title: tab.title
        url: tab.url
        favIconUrl: tab.favIconUrl
        atime: (new Date()).getTime()
        snooze: false

  snoozeTab: (tabId) =>
    if @tabs[tabId]?
      tab = @tabs[tabId]
      if tab.url.match(/^https?:\/\//)
        html = "<!doctype html><meta charset='utf-8'><title>#{tab.title}</title>"
        html += "<link type='image/x-icon' rel='icon' href='#{tab.favIconUrl}'>" if tab.favIconUrl?
        html += "<a href='javascript:history.back()'>#{tab.title}</a>"
        html += "<script> window.onfocus = function(){ window.history.back(); } </script>"
        chrome.tabs.update (tabId), { url: 'data:text/html,'+ html }, (e) =>
          tab.snooze = true

  onCreated: (tab) =>
    @addTab tab

  onUpdated: (tabId, changeInfo, tab) =>
    if changeInfo.status is "complete"
      @addTab tab

  onRemoved: (tabId, removeInfo) =>
    delete @tabs[tabId] if @tabs[tabId]?

  onActivated: (activeInfo) =>
    if @activeTabId isnt activeInfo.tabId
      @activeTabId = activeInfo.tabId
      tab = @tabs[@activeTabId]
      if tab?
        tab.snooze = false
        tab.atime = (new Date).getTime()

  onTick: =>
    expire = (new Date()).getTime() - @timeout
    for id, tab of @tabs
      if not tab.snooze and tab.id != @activeTabId and tab.atime < expire
        @snoozeTab tab.id

this.onload = (new SnoozeTab(this)).init()
