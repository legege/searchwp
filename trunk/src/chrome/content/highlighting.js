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

  _termsData: null,

  /**
   * Initializes the highlighting.
   */
  init: function() {
    var tabBox = document.getElementById("content").mTabBox;
    tabBox.addEventListener("select", function(event) { gSearchWPHighlighting.refresh() }, false);

    if (this.highlightButton) {
      this.highlightButton.checked = gSearchWP.pref.highlighted;
      // It's better to have the ability to unpress this button at any time.
      // this.highlightButton.disabled = true;
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

    this.stringBundle = document.getElementById("bundle_searchwp");
  },

  /**
   * Updates the highlighting according to the terms.
   */
  update: function(termsData, force) {
    // Highlight terms even if the hightlight button is not there.
    // if (!this.exist()) {
    //   return;
    // }

    if (force || !gSearchWPTermsUtil.areIdenticals(this._termsData, termsData)) {
      this._termsData = termsData;
      this._setRefreshTimeout();
    }

    // It's better to have the ability to unpress this button at any time.
    // if (this.highlightButton != null && this._termsData != null) {
    //  this.highlightButton.disabled = this._termsData.length <= 0;
    // }
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
  toggleHighlight: function(aHighlight) {
    if (aHighlight == null) {
      gSearchWP.pref.highlighted = !gSearchWP.pref.highlighted;
    }
    else {
      gSearchWP.pref.highlighted = aHighlight;
    }
  },

  /**
   * @return Returns true if the highlight button exists.
   */
  exist: function() {
    return this.highlightButton != null;
  },

  /**
   * Returns a reference to the highlight button.
   */
  get highlightButton() {
    return document.getElementById("searchwp-highlight-button");
  },

  /**
   * Hightlights the current page.
   * @private
   */
  _highlight: function() {
    this._unhighlight();

    if (this._termsData) {
      var count = gSearchWPHighligther.add(this._termsData);
      if (count > 1) {
        gSearchWP.displayMessage(this.stringBundle.getFormattedString("highlightCountN", [count], 1), false);
      }
      else if (count == 1) {
        gSearchWP.displayMessage(this.stringBundle.getFormattedString("highlightCount1", [count], 1), false);
      }
      else {
        gSearchWP.displayMessage(this.stringBundle.getString("highlightCount0"), false);
      }
    }
  },

  /**
   * Removes the highlighting of the current page.
   * @private
   */
  _unhighlight: function() {
    gSearchWPHighligther.clear();
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