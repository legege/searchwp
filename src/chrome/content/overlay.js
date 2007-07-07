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

var gSearchWPOverlay = {
  stringBundle: null,

  /**
   * Initializes this extension.
   * @param aEvent The load event.
   */
  onLoad: function(aEvent) {
    if (aEvent.target != document || !window.getBrowser) {
      return;
    }

    gSearchWPPreferencesObserver.register();
    window.getBrowser().addProgressListener(gSearchWPProgressListener,
        Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

    /* XXXLegege: Unfortunately, there is no event on the termisation of the
       toolbox customization. All EventListeners of the searchbar are lost when
       the user open the toolbox customizer. So, we have to reset/set those.
       Also, we cannot replace the customizeDone function without a setTimeout. */
    setTimeout(function() {
      var toolbox = document.getElementById("navigator-toolbox");
      if (toolbox.customizeDone != gSearchWPOverlay.customizeDone) {
        toolbox.__searchwp__customizeDone = toolbox.customizeDone;
        toolbox.customizeDone = gSearchWPOverlay.customizeDone;
      }
    }, 0);

    this.stringBundle = document.getElementById("bundle_searchwp");

    if (gSearchWP.pref.firstLaunch
        && !gSearchWPTermsToolbar.exist()
        && !gSearchWPHighlighting.exist()) {
      setTimeout(function() {
        gSearchWPOverlay.firstLaunchMessage();
      }, 50);
    }

    this._init();
    gSearchWPHighlighting.init();
    gSearchWPTermsToolbar.init();

    addEventListener("resize", function(event) { gSearchWPOverlay.onResize(event); }, false);
    addEventListener("unload", function(event) { gSearchWPOverlay.onUnload(event); }, false);
  },

  /**
   * Uninitializes this extension.
   * @param event The unload event.
   */
  onUnload: function(aEvent) {
    gSearchWPPreferencesObserver.unregister();
    window.getBrowser().removeProgressListener(gSearchWPProgressListener);

    this._uninit();
  },

  /**
   * Called when the window is resized.
   * @param aEvent The resize event.
   */
  onResize: function(aEvent) {
    gSearchWPTermsToolbar.refresh();
  },

  /**
   * Called when F3/Shift+F3 is pressed.
   * @param aEvent The event.
   */
  onFindAgain: function(aEvent) {
    var findString = getBrowser().fastFind.searchString;

    if (!gFindBar.hidden || gFindBar.hidden && findString != "") {
      gFindBar.onFindAgainCommand(aEvent.shiftKey);
    }
    else {
      var hasSearch = gSearchWPTermsToolbar.searchAgain(aEvent);
      if (!hasSearch) {
        gFindBar.onFindAgainCommand(aEvent.shiftKey);
      }
    }
  },

  /**
   * firstLaunchMessage
   */
  firstLaunchMessage: function() {
    var showAgain = {value: false};

    if (typeof(BrowserCustomizeToolbar) != "function") {
      return;
    }

    // confirm deletion
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    var no = promptService.confirmEx(window,
               this.stringBundle.getString("firstLaunchTitle"),
               this.stringBundle.getString("firstLaunchMessage"),
               Components.interfaces.nsIPromptService.BUTTON_TITLE_YES * Components.interfaces.nsIPromptService.BUTTON_POS_0
                 + Components.interfaces.nsIPromptService.BUTTON_TITLE_NO * Components.interfaces.nsIPromptService.BUTTON_POS_1,
               null, null, null,
               this.stringBundle.getString("firstLaunchCheckbox"),
               showAgain);
    if (!no) {
      BrowserCustomizeToolbar();
    }

    gSearchWP.pref.firstLaunch = showAgain.value;
  },

  /**
   * init
   */
  _init: function() {
    if (!this.searchBox.exist()) {
      return;
    }

    this.searchBox.ref.addEventListener("input", function(event) { gSearchWPOverlay.searchBox.onInput(event); }, false, true);

    /* XXXLegege: For SearchBox AutoUpdater, we have to listen the "oninput" event
       because it appears that we cannot fire/catch an "input" event on the
       searchbar. */
    this.searchBox.ref.addEventListener("oninput", function(event) { gSearchWPOverlay.searchBox.onInput(event); }, false, true);
  },

  /**
   * uninit
   */
  _uninit: function() {
    if (!this.searchBox.exist()) {
      return;
    }

    this.searchBox.ref.removeEventListener("input", function(event) { gSearchWPOverlay.searchBox.onInput(event); }, false);
    this.searchBox.ref.removeEventListener("oninput", function(event) { gSearchWPOverlay.searchBox.onInput(event); }, false);
  },

  /**
   * Called when the customization of the toolbar is finised.
   * @return Returns the original method.
   */
  customizeDone: function() {
    gSearchWPOverlay._init();
    gSearchWP.pref.highlighted = false;
    gSearchWPOverlay.searchBox.onInput();

    var toolbox = document.getElementById("navigator-toolbox");
    return toolbox.__searchwp__customizeDone();
  },

  /**
   * Called when the highlighting button is pressed/unpressed.
   */
  toggleHighlight: function(aHighlight) {
    gSearchWPHighlighting.toggleHighlight(aHighlight);
  },

  searchBox: {
    /**
     * Return a reference to the searchbar.
     */
    get ref() {
      return document.getElementById("searchbar");
    },

    /**
     * @return Returns the current searchbox value.
     */
    get value() {
      var textbox = document.getAnonymousElementByAttribute(this.ref, "class", "searchbar-textbox");
      if (textbox) {
        return textbox.inputField.value;
      }
    },

    /**
     * Sets the value of the searchbox.
     * @param value The value to set.
     */
    set value(v) {
      var textbox = document.getAnonymousElementByAttribute(this.ref, "class", "searchbar-textbox");
      if (textbox) {
        textbox.inputField.value = v;
      }
    },

    /**
     * Determines if the focus is in the searchbox.
     * @return Returns true if the focus is in the searchbox.
     */
    focused: function() {
      if (this.ref) {
        return this.ref.mTextbox.focused;
      }
      return false;
    },

    /**
     * Determines if the searchbox exists.
     * @return Returns true if the searchbox exists.
     */
    exist: function() {
      return this.ref != null;
    },

    /**
     * Called when an input event is detected on the searchbox.
     */
    onInput: function(aEvent) {
      var termsData = gSearchWPTermsUtil.getTermsDataArray(this.value);
      gSearchWPTermsToolbar.update(termsData, false);
      gSearchWPHighlighting.update(termsData, false);
    }
  }
}

/**
 * Preferences observer
 */
var gSearchWPPreferencesObserver = {

  register: function() {
    this._branch = Components.classes["@mozilla.org/preferences-service;1"]
                             .getService(Components.interfaces.nsIPrefService)
                             .getBranch(gSearchWP.pref.PREF_BRANCH);

    var pbi = this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    pbi.addObserver("", this, false);
  },

  unregister: function() {
    if (!this._branch) return;

    var pbi = this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    pbi.removeObserver("", this, false);
  },

  observe: function(aSubject, aTopic, aData) {
    if (aTopic != "nsPref:changed") {
      return;
    }

    switch (aData) {
      case gSearchWP.pref.PREF_HIGHLIGHT_STATE:
        setTimeout(
          function() {
            if (gSearchWPHighlighting.highlightButton) {
              gSearchWPHighlighting.highlightButton.checked = gSearchWP.pref.highlighted;
            }
          }, 0);
        gSearchWPHighlighting.refresh();
        break;
      case gSearchWP.pref.PREF_HIGHLIGHT_MINLENGTH:
        gSearchWPOverlay.searchBox.onInput();
        break;
      case gSearchWP.pref.PREF_MAX_TERM_BUTTONS:
        gSearchWPTermsToolbar.refresh();
        break;
    }
  }
}

/**
 * Automatically highlight terms on page load.
 */
var gSearchWPProgressListener = {
  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
      aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
      aIID.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_NOINTERFACE;
  },

  onProgressChange: function (aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {},

  onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {},

  onSecurityChange: function(aWebProgress, aRequest, aState) {},

  onLinkIconAvailable: function(a) {},

  onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
    if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
      /**
       * XXXLegege (July 15th, 2005): Some users report that the page never stop
       * to load. Make the highlighting asynchrone.
       */
      setTimeout(function() { gSearchWPHighlighting.refresh(); }, 0);
    }
  },

  onLocationChange: function(aProgress, aRequest, aLocation) {}
}

addEventListener("load", function(event) { gSearchWPOverlay.onLoad(event); }, false);