(function() {
  chrome.extension.sendRequest({}, function(r) {
    var favicon = document.createElement("link");
    favicon.rel = "shortcut icon";
    favicon.href = r.favicon;
    
    document.title = r.title;
    document.getElementsByTagName("head")[0].appendChild(favicon);
  });
})();