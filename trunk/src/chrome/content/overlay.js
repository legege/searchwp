/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is SearchWP.
 *
 * The Initial Developer of the Original Code is 
 *  Georges-Etienne Legendre <legege@legege.com> <http://legege.com>.
 * Portions created by the Initial Developer are Copyright (C) 2004-2008.
 * All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

searchwp.Overlay = new function() {
  var self = this;
  var _stringBundle = null;
  var _oldCustomizeDone;

  /**
   * Initializes this extension.
   * @param aEvent The load event.
   */
  this.onLoad = function(aEvent) {
    if (aEvent.target != document || !window.getBrowser) {
      return;
    }

    _stringBundle = document.getElementById("bundle-searchwp");

    this.preferencesObserver.register();
    window.getBrowser().addProgressListener(this.progressListener,
        Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

    /* XXXLegege: Unfortunately, there is no event on the termisation of the
       toolbox customization. All EventListeners of the searchbar are lost when
       the user open the toolbox customizer. So, we have to reset/set those.
       Also, we cannot replace the customizeDone function without a setTimeout. */
    setTimeout(function() {
      var toolbox = document.getElementById("navigator-toolbox");
      if (toolbox.customizeDone != searchwp.Overlay.onCustomizeDone) {
        _oldCustomizeDone = toolbox.customizeDone;
        toolbox.customizeDone = searchwp.Overlay.onCustomizeDone;
      }
    }, 0);

    if (searchwp.Preferences.firstLaunch && !searchwp.Highlighting.exist()) {
      setTimeout(function() {
        searchwp.Overlay.firstLaunch();
      }, 50);
    }

    // Add platform CSS selection
    var win = document.getElementById("main-window");
    win.setAttribute("searchwp-moz-platform", navigator.platform);

    searchwp.Highlighting.init();

    addEventListener("unload", function(event) { searchwp.Overlay.onUnload(event); }, false);
  }

  /**
   * Uninitializes this extension.
   * @param aEvent The unload event.
   */
  this.onUnload = function(aEvent) {
    this.preferencesObserver.unregister();
    window.getBrowser().removeProgressListener(this.progressListener);
  }

  /**
   * @return the searchbox
   */
  this.__defineGetter__("searchbox", function() {
    var searchbar = document.getElementById("searchbar");
    return document.getAnonymousElementByAttribute(searchbar, "anonid", "searchbar-textbox");
  });

  /**
   * firstLaunch
   */
  this.firstLaunch = function() {
    if (typeof(BrowserCustomizeToolbar) != "function") {
      return;
    }

    // Adding the highlight button to the toolbar
    // http://developer.mozilla.org/en/docs/Code_snippets:Toolbar#Adding_button_by_default
    try {
      var nav = document.getElementById("nav-bar");
      var curSet = firefoxnav.currentSet;
      if (curSet.indexOf("searchwp-highlight-container") == -1) {
        var set;
        // Place the button before the searchbox
        if (curSet.indexOf("search-container") != -1) {
          set = curSet.replace(/search-container/, "search-container,searchwp-highlight-container");
        }
        else { // at the end
          set = nav.currentSet + ",searchwp-highlight-container";
        }
        nav.setAttribute("currentset", set);
        nav.currentSet = set;
        document.persist("nav-bar", "currentset");
        // If you don't do the following call, funny things happen
        try {
          BrowserToolboxCustomizeDone(true);
        }
        catch (e) { }
      }
    }
    catch(e) { }

    searchwp.Preferences.firstLaunch = false;
  }

  /**
   * Called when the customization of the toolbar is finised.
   * @return the original method.
   */
  this.onCustomizeDone = function() {
    searchwp.Preferences.highlighted = false;
    return _oldCustomizeDone();
  }

  /**
   * Called when F3/Shift+F3 is pressed.
   * @param aEvent The event.
   */
  this.onFindAgain = function(aEvent) {
    var findString = getBrowser().fastFind.searchString;

    if (!gFindBar.hidden || gFindBar.hidden && findString != "") {
      gFindBar.onFindAgainCommand(aEvent.shiftKey);
    }
    else {
      var hasSearch = this.searchbox.repeatTokenClick(aEvent);
      if (!hasSearch) {
        gFindBar.onFindAgainCommand(aEvent.shiftKey);
      }
    }
  }

  /**
   * Progress Listener to automatically highlight terms on page load.
   */
  this.progressListener = new function() {
    this.QueryInterface = function(aIID) {
      if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
        aIID.equals(Components.interfaces.nsISupports))
        return this;
      throw Components.results.NS_NOINTERFACE;
    }

    this.onProgressChange = function (aWebProgress, aRequest, aCurSelfProgress,
                                      aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {}

    this.onStatusChange = function(aWebProgress, aRequest, aStatus, message) {}

    this.onSecurityChange = function(aWebProgress, aRequest, aState) {}

    this.onLinkIconAvailable = function(a) {}

    this.onStateChange = function (aWebProgress, aRequest, aStateFlags, aStatus) {
      if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
        /**
         * XXXLegege (July 15th, 2005): Some users report that the page never stop
         * to load. The solution is to make the highlighting asynchrone.
         */
        setTimeout(function() { searchwp.Highlighting.refresh(); }, 0);
      }
    }

    this.onLocationChange = function(aProgress, aRequest, aLocation) {}
  }

  /**
   * Preferences Observer
   */
  this.preferencesObserver = new function() {
    var branch = searchwp.Preferences.branch;

    this.register = function() {
      var pbi = branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
      pbi.addObserver("", this, false);
    }

    this.unregister = function() {
      if (!branch) return;

      var pbi = branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
      pbi.removeObserver("", this, false);
    }

    this.observe = function(aSubject, aTopic, aData) {
      if (aTopic != "nsPref:changed") {
        return;
      }

      switch (aData) {
        case searchwp.Preferences.PREF_HIGHLIGHT_STATE:
          setTimeout(function() {
            var item = searchwp.Highlighting.highlightButton;
            if (item) {
              item.setAttribute("checked", searchwp.Preferences.highlighted);
            }
            searchwp.Highlighting.refresh();
          }, 0);
          break;
        case searchwp.Preferences.PREF_HIGHLIGHT_MATCH_CASE:
          setTimeout(function() {
            var item = searchwp.Highlighting.highlightButton;
            if (item) {
              item.setAttribute("matchcase", searchwp.Preferences.highlightMatchCase);
            }
            searchwp.Highlighting.refresh();
          }, 0);
          break;
        case searchwp.Preferences.PREF_HIGHLIGHT_MINLENGTH:
          setTimeout(function() {
            searchwp.Highlighting.refresh();
          }, 0);
          break;
      }
    }
  }
}

addEventListener("load", function(event) { searchwp.Overlay.onLoad(event); }, false);