console.log("=== background starting ===");

// Global variable
var ws;
var wsIsEstablished = false;
var url = "";

function wsConnect() {

    ws = new WebSocket("ws://" + url + ":9090/connws/");

    ws.onopen = function() {
      console.log("[onopen] connect ws uri.");
      var data = {
        "Action" : "requireConnect"
      };
      ws.send(JSON.stringify(data));
      wsIsEstablished = true;
    }

    ws.onmessage = function(e) {
        var res = JSON.parse(e.data);
        if (wsIsEstablished && res["Action"] == "doReload") {
          pageReload();
        }
    }

    ws.onclose = function(e) {
        console.log("[onclose] connection closed (" + e.code + ")");
        delete ws;
        wsIsEstablished = false;
    }

    ws.onerror = function (e) {
        console.log("[onerror] error!");
        wsIsEstablished = false;
    }

    /*
    Check ws whether initial or not.
    ==================================
    CONNECTING 0 The connection is not yet open.
    OPEN  1 The connection is open and ready to communicate.
    CLOSING 2 The connection is in the process of closing.
    CLOSED  3 The connection is closed or couldn't be opened.

    if (ws.readyState != 1) {
        wsIsEstablished = false;
        return;
    }*/
}

function wsDisconnect() {
    var data = {
        "Action" : "requireDisconnect"
    };
    ws.send(JSON.stringify(data));
    wsIsEstablished = false;
}

function pageReload() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        lastTabID = tabs[0].id;
        chrome.tabs.sendMessage(lastTabID, "Tab " + lastTabID + " do reload.");
    });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.wsAction == "getConnStatus") {
       var connStatus = (wsIsEstablished) ? "connect" : "disconnect";
       changeBrowserActionIcon();
       sendResponse({"wsIsEstablished": wsIsEstablished, "connStatus": connStatus, "url": url});
    }

    if (request.wsAction == "doConnect") {
        if (request.wsConn) {
            url = request.url;
          wsConnect();
        } else {
          wsDisconnect();
        }
    }
});

// Change browser action icon
function changeBrowserActionIcon() {
    if (wsIsEstablished) {
        chrome.browserAction.setIcon({
              path : "img/browser_action_icon_enabled_19.png"
          });
    } else {
        chrome.browserAction.setIcon({
              path : "img/browser_action_icon_disabled_19.png"
          });
    }
}
