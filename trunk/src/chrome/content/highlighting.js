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

var gSearchWPHighlighting = {

  _stringBundle: null,
  _highlighter: null,
  _termsData: null,

  /**
   * Initializes the highlighting.
   */
  init: function() {
    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", function(event) { gSearchWPHighlighting.refresh() }, false);

    if (this.highlightButton) {
      this.highlightButton.setAttribute("checked", gSearchWP.pref.highlighted);
    }

    if (this.highlightMatchCase) {
      this.highlightMatchCase.setAttribute("checked", gSearchWP.pref.highlightMatchCase);
    }

    // Load the highlighting style sheet
    var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                        .getService(Components.interfaces.nsIStyleSheetService);
    var ios = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
    var uri = ios.newURI("chrome://@NAME@/skin/highlighting-user.css", null, null);
    if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
      sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
    }

    this._stringBundle = document.getElementById("bundle_searchwp");
    
    this._highlighter = new searchwp.Highlighter();
  },

  /**
   * Updates the highlighting according to the terms.
   */
  update: function(termsData, force) {
    if (force || !gSearchWPTermsUtil.areIdenticals(this._termsData, termsData)) {
      this._termsData = termsData;
      this._setRefreshTimeout();
    }
  },

  /**
   * Refreshes the current highlighting.
   */
  refresh: function() {
    if (gSearchWP.pref.highlighted) {
      this._highlight();
    }
    else {
      this._unhighlight();
    }

    gSearchWPTermsToolbar.updateTermsStyleClassName();
  },

  /**
   * Toggles on and off the highlighting.
   */
  toggleHighlight: function() {
    if (!this._disableToggleHighlight) {
      gSearchWP.pref.highlighted = !gSearchWP.pref.highlighted;
    }
  },

  /**
   * Set if the highlighting should match case.
   */
  changeMatchCase: function() {
    this._disableToggleHighlight = true;

    try {
      gSearchWP.pref.highlightMatchCase = !gSearchWP.pref.highlightMatchCase;
    }
    catch(e) {}

    this._disableToggleHighlight = false;
  },

  /**
   * @return true if the highlight button exists.
   */
  exist: function() {
    return this.highlightButton != null;
  },

  /**
   * @return a reference to the highlight button.
   */
  get highlightButton() {
    return document.getElementById("searchwp-highlight-button");
  },

  /**
   * @return a reference to the highlight match case menu.
   */
  get highlightMatchCase() {
    return document.getElementById("searchwp-highlight-match-case");
  },

  /**
   * Hightlights the current page.
   * @private
   */
  _highlight: function() {
    this._unhighlight();

    if (this._termsData) {
      var count = this._highlighter.add(this._termsData, gSearchWP.pref.highlightMatchCase);
      if (count > 1) {
        gSearchWP.displayMessage(this._stringBundle.getFormattedString("highlightCountN", [count], 1), false);
      }
      else if (count == 1) {
        gSearchWP.displayMessage(this._stringBundle.getFormattedString("highlightCount1", [count], 1), false);
      }
      else {
        gSearchWP.displayMessage(this._stringBundle.getString("highlightCount0"), false);
      }
    }
  },

  /**
   * Removes the highlighting of the current page.
   * @private
   */
  _unhighlight: function() {
    this._highlighter.clear();
  },

  /**
   * Sets a refresh for the highlighting in 500ms.
   * @private
   */
  _setRefreshTimeout: function() {
    if (this._highlightTimeout) {
      clearTimeout(this._highlightTimeout);
    }
    this._highlightTimeout = setTimeout(function() { gSearchWPHighlighting.refresh(); }, 500);
  }
}