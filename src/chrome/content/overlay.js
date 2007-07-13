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

 * The Initial Developer of the Original Code is Georges-Etienne Legendre.
 * Portions created by Georges-Etienne Legendre are Copyright (C) 2004-2007.
 * All Rights Reserved.
 *
 * Contributor(s):
 *  Georges-Etienne Legendre <legege@legege.com> <http://legege.com>
 *
 * ***** END LICENSE BLOCK ***** */

searchwp.Overlay = new function() {
  var self = this;
  var _stringBundle = null;

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
      if (toolbox.customizeDone != searchwp.Overlay.customizeDone) {
        toolbox.__searchwp__customizeDone = toolbox.customizeDone;
        toolbox.customizeDone = searchwp.Overlay.customizeDone;
      }
    }, 0);

    if (searchwp.Preferences.firstLaunch && !searchwp.TermsToolbar.exist()
        && !searchwp.Highlighting.exist()) {
      setTimeout(function() {
        searchwp.Overlay.firstLaunchMessage();
      }, 50);
    }

    init();
    searchwp.Highlighting.init();
    searchwp.TermsToolbar.init();

    addEventListener("unload", function(event) { searchwp.Overlay.onUnload(event); }, false);
  }

  /**
   * Uninitializes this extension.
   * @param aEvent The unload event.
   */
  this.onUnload = function(aEvent) {
    this.preferencesObserver.unregister();
    window.getBrowser().removeProgressListener(this.progressListener);

    uninit();
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
      var hasSearch = searchwp.TermsToolbar.searchAgain(aEvent);
      if (!hasSearch) {
        gFindBar.onFindAgainCommand(aEvent.shiftKey);
      }
    }
  }

  /**
   * firstLaunchMessage
   */
  this.firstLaunchMessage = function() {
    var showAgain = {value: false};

    if (typeof(BrowserCustomizeToolbar) != "function") {
      return;
    }

    // confirm deletion
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    var no = promptService.confirmEx(window,
        _stringBundle.getString("firstLaunchTitle"),
        _stringBundle.getString("firstLaunchMessage"),
          Components.interfaces.nsIPromptService.BUTTON_TITLE_YES * Components.interfaces.nsIPromptService.BUTTON_POS_0
            + Components.interfaces.nsIPromptService.BUTTON_TITLE_NO * Components.interfaces.nsIPromptService.BUTTON_POS_1,
        null, null, null,
        _stringBundle.getString("firstLaunchCheckbox"),
        showAgain);
    if (!no) {
      BrowserCustomizeToolbar();
    }

    searchwp.Preferences.firstLaunch = showAgain.value;
  }

  /**
   * Called when the customization of the toolbar is finised.
   * @return the original method.
   */
  this.customizeDone = function() {
    searchwp.Overlay._init();
    searchwp.Preferences.highlighted = false;
    searchwp.Overlay.searchBox.onInput();

    var toolbox = document.getElementById("navigator-toolbox");
    return toolbox.__searchwp__customizeDone();
  }

  this.searchBox = new function() {
    /**
     * Return a reference to the searchbar.
     */
    this.__defineGetter__("ref", function() {
      return document.getElementById("searchbar");
    });

    /**
     * @return the current searchbox value.
     */
    this.__defineGetter__("value", function() {
      var textbox = document.getAnonymousElementByAttribute(this.ref, "class", "searchbar-textbox");
      if (textbox) {
        return textbox.inputField.value;
      }
      return "";
    });

    /**
     * Sets the value of the searchbox.
     * @param aValue The value to set.
     */
    this.__defineSetter__("value", function(aValue) {
      var textbox = document.getAnonymousElementByAttribute(this.ref, "class", "searchbar-textbox");
      if (textbox) {
        textbox.inputField.value = aValue;
      }
    });

    /**
     * Determines if the focus is in the searchbox.
     * @return true if the focus is in the searchbox.
     */
    this.focused = function() {
      if (this.ref) {
        return this.ref.mTextbox.focused;
      }
      return false;
    }

    /**
     * Determines if the searchbox exists.
     * @return true if the searchbox exists.
     */
    this.exist = function() {
      return this.ref != null;
    }

    /**
     * Called when an input event is detected on the searchbox.
     */
    this.onInput = function(aEvent) {
      var termsData = searchwp.TermsDataFactory.createTermsData(this.value);
      searchwp.TermsToolbar.update(termsData, false);
      searchwp.Highlighting.update(termsData, false);
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
         * to load. Make the highlighting asynchrone.
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
          setTimeout(
            function() {
              var item = searchwp.Highlighting.getHighlightButton();
              if (item) {
                item.checked = searchwp.Preferences.highlighted;
              }
            }, 0);
          searchwp.Highlighting.refresh();
          break;
        case searchwp.Preferences.PREF_HIGHLIGHT_MATCH_CASE:
          setTimeout(
            function() {
              var item = searchwp.Highlighting.getHighlightMatchCase();
              if (item) {
                item.setAttribute("checked", searchwp.Preferences.highlightMatchCase);
              }
            }, 0);
          searchwp.Highlighting.refresh();
          break;
        case searchwp.Preferences.PREF_HIGHLIGHT_MINLENGTH:
          searchwp.Overlay.searchBox.onInput();
          break;
        case searchwp.Preferences.PREF_MAX_TERM_BUTTONS:
          searchwp.TermsToolbar.refresh();
          break;
      }
    }
  }

  /**
   * init
   */
  function init() {
    if (!self.searchBox.exist()) {
      return;
    }

    self.searchBox.ref.addEventListener("input",
      function(event) { searchwp.Overlay.searchBox.onInput(event); }, false, true);

    /* XXXLegege: For SearchBox Sync, we have to listen the "oninput" event
       because it appears that we cannot fire/catch an "input" event on the
       searchbar. */
    self.searchBox.ref.addEventListener("oninput",
      function(event) { searchwp.Overlay.searchBox.onInput(event); }, false, true);
  }

  /**
   * uninit
   */
  function uninit() {
    if (!self.searchBox.exist()) {
      return;
    }

    self.searchBox.ref.removeEventListener("input", function(event) { searchwp.Overlay.searchBox.onInput(event); }, false);
    self.searchBox.ref.removeEventListener("oninput", function(event) { searchwp.Overlay.searchBox.onInput(event); }, false);
  }
}

addEventListener("load", function(event) { searchwp.Overlay.onLoad(event); }, false);