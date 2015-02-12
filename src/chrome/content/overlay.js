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

gSearchWP.Overlay = new function() {
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
    window.getBrowser().addProgressListener(this.progressListener);

    /* XXXLegege: Unfortunately, there is no event on the termisation of the
       toolbox customization. All EventListeners of the searchbar are lost when
       the user open the toolbox customizer. So, we have to reset/set those.
       Also, we cannot replace the customizeDone function without a setTimeout. */
    setTimeout(function() {
      var toolbox = document.getElementById("navigator-toolbox");
      if (toolbox.customizeDone != gSearchWP.Overlay.onCustomizeDone) {
        _oldCustomizeDone = toolbox.customizeDone;
        toolbox.customizeDone = gSearchWP.Overlay.onCustomizeDone;
      }
    }, 0);

    if (gSearchWP.Preferences.firstLaunch && !gSearchWP.Highlighting.exist()) {
      setTimeout(function() {
        gSearchWP.Overlay.firstLaunch();
      }, 50);
    }

    // migration code for changed button ID in r237
    // can be removed in one of the next versions
    gSearchWP.Overlay.migrateButtonId();

    // Add platform CSS selection
    var win = document.getElementById("main-window");
    win.setAttribute("searchwp-moz-platform", navigator.platform);

    gSearchWP.Highlighting.init();

    addEventListener("unload", function(aEvent) { gSearchWP.Overlay.onUnload(aEvent); }, false);
  };

  /**
   * Uninitializes this extension.
   * @param aEvent The unload event.
   */
  this.onUnload = function(aEvent) {
    this.preferencesObserver.unregister();
    window.getBrowser().removeProgressListener(this.progressListener);
  };

  /**
   * @return the searchbox
   */
  this.__defineGetter__("searchbox", function() {
    var searchbar = document.getElementById("searchbar");
    if (searchbar) {
      return document.getAnonymousElementByAttribute(searchbar, "anonid", "searchbar-textbox");
    }
    return null;
  });

  /**
   * firstLaunch
   */
  this.firstLaunch = function() {
    // Adding the highlight button to the toolbar
    // http://developer.mozilla.org/en/docs/Code_snippets:Toolbar#Adding_button_by_default
    try {
      var nav = document.getElementById("nav-bar");
      var curSet = nav.currentSet;
      if (curSet.indexOf("searchwp-highlight-button") == -1) {
        var set;
        // Place the button before the searchbox
        if (curSet.indexOf("search-container") != -1) {
          set = curSet.replace(/search-container/, "search-container,searchwp-highlight-button");
        }
        else { // at the end
          set = nav.currentSet + ",searchwp-highlight-button";
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

    gSearchWP.Preferences.firstLaunch = false;
  };

  /**
   * migration code for changed button ID in r237
   * can be removed in one of the next versions
   */
  this.migrateButtonId = function() {
    toolbars = document.getElementsByTagName("toolbar");
    for (var i = 0; i < toolbars.length; i++) {
      try {
        var toolbar = toolbars[i];
        var curSet = toolbar.getAttribute("currentset");
        if (curSet.indexOf("searchwp-highlight-container") != -1) {
          curSet = curSet.replace(/searchwp-highlight-container/, "searchwp-highlight-button");
          toolbar.setAttribute("currentset", curSet);
          toolbar.currentSet = curSet;
          document.persist(toolbar.id, "currentset");
        }
      } catch (e) {}
    }
  };

  /**
   * Called when the customization of the toolbar is finished.
   * @return the original method.
   */
  this.onCustomizeDone = function() {
    gSearchWP.Preferences.highlighted = false;
    return _oldCustomizeDone();
  };

  /**
   * Executed when the higlighting button is clicked
   */
  this.buttonClicked = function(aEvent) {
    switch (aEvent.button) {
      case 0: // left mouse button
        gSearchWP.Highlighting.toggleHighlight(aEvent);
        break;
      case 1: // middle mouse button
        this.openOptions();
        break;
      case 2: // right mouse button
        // do nothing (right mouse button allows to customize toolbar by default)
        break;
    }
  };

  /**
   * Opens the options dialog
   */
  this.openOptions = function() {
    optionsURL = "chrome://@NAME@/content/options/optionsDialog.xul";
    // emulate "Options" button in "about:addons" as close as possible
    // TODO: Can we use "cmd_showItemPreferences" directly?
    // (see http://lxr.mozilla.org/mozilla-central/source/toolkit/mozapps/extensions/content/extensions.js#1034)
    var windows = Services.wm.getEnumerator(null);
    while (windows.hasMoreElements()) {
      var win = windows.getNext();
      if (win.closed) {
        continue;
      }
      if (win.document.documentURI == optionsURL) {
        win.focus();
        return;
      }
    }
    var features = "chrome,titlebar,toolbar,centerscreen";
    try {
      var instantApply = Services.prefs.getBoolPref("browser.preferences.instantApply");
      features += instantApply ? ",dialog=no" : ",modal";
    } catch (e) {
      features += ",modal";
    }
    window.openDialog(optionsURL, "", features);
  };

  /**
   * Progress Listener to automatically highlight terms on page load.
   */
  this.progressListener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),

    onProgressChange: function (aWebProgress, aRequest, aCurSelfProgress,
                                      aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {},

    onStatusChange: function(aWebProgress, aRequest, aStatus, message) {},

    onSecurityChange: function(aWebProgress, aRequest, aState) {},

    onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
      if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
        /**
         * XXXLegege (July 15th, 2005): Some users report that the page never stop
         * to load. The solution is to make the highlighting asynchrone.
         */
        setTimeout(function() {
          gSearchWP.Highlighting.refresh();
        }, 0);
      }
    },

    onLocationChange: function(aProgress, aRequest, aLocation) {}
  };

  /**
   * Preferences Observer
   */
  this.preferencesObserver = new gSearchWP.PreferencesObserver(function( pref_name ) {
      switch (pref_name) {
        case gSearchWP.Preferences.PREF_HIGHLIGHT_STATE:
          setTimeout(function() {
            var item = gSearchWP.Highlighting.highlightButton;
            if (item) {
              gSearchWP.Preferences.highlighted ? 
                item.setAttribute("checked", true) :
                item.removeAttribute("checked");
            }
            //gSearchWP.Highlighting.refresh();
          }, 0);
          break;
        case gSearchWP.Preferences.PREF_HIGHLIGHT_MATCH_CASE:
          setTimeout(function() {
            var item = gSearchWP.Highlighting.highlightButton;
            if (item) {
              item.setAttribute("matchcase", gSearchWP.Preferences.highlightMatchCase);
            }
            //gSearchWP.Highlighting.refresh();
          }, 0);
          break;
        case gSearchWP.Preferences.PREF_HIGHLIGHT_MINLENGTH:
          //setTimeout(function() {
          //  gSearchWP.Highlighting.refresh();
          //}, 0);
          break;
      }
    }
  );

};

addEventListener("load", function(aEvent) { gSearchWP.Overlay.onLoad(aEvent); }, false);
