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

var gSearchWPTermsToolbar = {

  _lastTermButtonSearch: null,

  /**
   * Initializes the terms toolbar
   */
  init: function() {
    this.stringBundle = document.getElementById("bundle_searchwp");
  },

  /**
   * Updates the terms toolbar.
   * @param aTermsData An terms array that contains 2 information per term: text, className.
   * @param aForceUpdate If true, the comparaison between the actual terms is not done.
   */
  update: function(aTermsData, aForceUpdate) {
    if (!this.exist()) {
      return;
    }

    // This is not in the init function because this can change in a session.
    if (gSearchWP.pref.maxTermButtons == 0) {
      this._menu.hidden = false;
      this._menu.className = ""; //Remove the chevron style
    }
    else {
      this._menu.className = "chevron";
    }

    if (!aForceUpdate && gSearchWPTermsUtil.areIdenticals(this._termsData, aTermsData)) {
      return;
    }
    this._termsData = aTermsData;
    this._clearTerms();

    for (var term in aTermsData) {
      this._addTerm(aTermsData[term].text, aTermsData[term].className);
    }

    this._updateSeparator();
  },

  /**
   * Refresh the terms toolbar.
   */
  refresh: function() {
    this.update(this._termsData, true);
  },

  /**
   * @return Returns true if the terms toolbar exists.
   */
  exist: function() {
    return this._container != null;
  },

  /**
   * This method is to be called when the user want to repeat
   * the last search action.
   * @return Returns false if the search cannot be performed.
   */
  searchAgain: function(aEvent) {
    if (!this._lastTermButtonSearch) {
      if (this._nextElemBoxId + this._nextElemPopupId == 1) { //Only one button
        if (this._nextElemBoxId == 1) {
          this._lastTermButtonSearch = this._boxTerms.firstChild;
        }
        else {
          this._lastTermButtonSearch = this._popup.firstChild;
        }
      }
      else {
        return false;
      }
    }

    var findBackwards = aEvent.shiftKey;
    var matchCase = aEvent.ctrlKey;

    this._doSearch(this._lastTermButtonSearch, findBackwards, matchCase);

    return true;
  },

  /**
   * This method is called when the user click on a term button.
   * @param aEvent The event to handle.
   * @param aItem
   */
  onTermCommand: function(aEvent, aItem) {
    this._lastTermButtonSearch = aItem;

    var findBackwards = aEvent.shiftKey;
    var matchCase = aEvent.ctrlKey;

    this._doSearch(aItem, findBackwards, matchCase);
  },

  /**
   * Updates all terms' icons.
   */
  updateTermsStyleClassName: function() {
    if (this._boxTerms) {
      for(var i = 0; i < this._boxTerms.childNodes.length; i++) {
        this.updateTermStyleClassName(this._boxTerms.childNodes[i]);
      }

      for(var i = 0; i < this._popup.childNodes.length; i++) {
        this.updateTermStyleClassName(this._popup.childNodes[i]);
      }
      return true;
    }
    return false;
  },

  /**
   * Resets the term's icon.
   * @param aItem The term button.
   */
  updateTermStyleClassName: function(aItem) {
    if (gSearchWP.pref.highlighted) {
      aItem.className = aItem.getAttribute("highlightStyleClassName");
    }
    else {
      aItem.className = "";
    }
  },

  /**
   * @return Returns a reference to the terms toolbar container.
   * @private
   */
  get _container() {
    return document.getElementById("searchwp-terms-container");
  },

  /**
   * @return Returns a reference to the palette that contains the terms toolbar.
   * @private
   */
  get _palette() {
    return this._container.parentNode;
  },

  /**
   * @return Returns XXX
   * @private
   */
  get _boxTerms() {
    return document.getElementById("searchwp-terms-box");
  },

  /**
   * @return Returns XXX
   * @private
   */
  get _popup() {
    return document.getElementById("searchwp-terms-popup");
  },

  /**
   * @return Returns XXX
   * @private
   */
  get _menu() {
    return document.getElementById("searchwp-terms-menu");
  },

  /**
   * Adds a term to the toolbar.
   * @param aLabel
   * @param aStyleClassName
   * @private
   */
  _addTerm: function(aLabel, aStyleClassName) {
    var button = this._addTermButton(this._inBox, aLabel, aStyleClassName);

    //The popup menu is hidden.
    if (this._inBox) {
      var itemsWidth = 0;
      for (var j = 0; j < this._palette.childNodes.length; j++) {
        if (this._palette.childNodes[j].nodeName.toLowerCase() in {toolbarspring:null}) {
          continue;
        }
        itemsWidth += this._palette.childNodes[j].boxObject.width;
      }
      itemsWidth = itemsWidth + this._menu.boxObject.width;

      if (itemsWidth > window.innerWidth || (gSearchWP.pref.maxTermButtons > -1
          && this._nextElemBoxId > gSearchWP.pref.maxTermButtons)) {
        this._removeTermButton(button);
        button = this._addTermButton(false, aLabel, aStyleClassName);
        this._inBox = false;
        this._menu.hidden = false;
      }
    }

  },

  /**
   * Returns a reference to a newly created term button.
   * @param aInBox
   * @param aLabel
   * @param aStyleClassName
   * @private
   */
  _addTermButton: function(aInBox, aLabel, aStyleClassName) {
    var button = null;
    if (aInBox) {
      button = document.getElementById("searchwp-terms-box-" + this._nextElemBoxId);
    }
    else {
      button = document.getElementById("searchwp-terms-popup-" + this._nextElemPopupId);
    }

    if (!button) {
      button = document.createElement("toolbarbutton");
      if (aInBox) {
        button.id = "searchwp-terms-box-" + this._nextElemBoxId;
        this._boxTerms.appendChild(button);
      }
      else {
        button.id = "searchwp-terms-popup-" + this._nextElemPopupId;
        this._popup.appendChild(button);
      }
    }
    else {
      button.hidden = false;
    }

    if (aInBox) {
      this._nextElemBoxId++;
    }
    else {
      this._nextElemPopupId++;
    }

    button.setAttribute("label", aLabel);
    button.setAttribute("oncommand", "gSearchWPTermsToolbar.onTermCommand(event, this)");
    button.setAttribute("highlightStyleClassName", aStyleClassName);
    this.updateTermStyleClassName(button);

    return button;
  },

  /**
   * Remove a term button (the button itself is not truly removed).
   * @param aButton The button to remove.
   * @private
   */
  _removeTermButton: function(aButton) {
    aButton.hidden = true;
    if (aButton.id.indexOf("searchwp-terms-box") > -1) {
      this._nextElemBoxId--;
    }
    else {
      this._nextElemPopupId--;
    }
  },

  /**
   * Deletes all the terms in the toolbar.
   * @private
   */
  _clearTerms: function() {
    while (this._nextElemBoxId > 0) {
      this._removeTermButton(document.getElementById("searchwp-terms-box-"
        + (this._nextElemBoxId - 1)));
    }
    this._nextElemBoxId = 0;

    while (this._nextElemPopupId > 0) {
      this._removeTermButton(document.getElementById("searchwp-terms-popup-"
        + (this._nextElemPopupId - 1)));
    }
    this._nextElemPopupId = 0;

    this._inBox = true;
    if (gSearchWP.pref.maxTermButtons != 0) {
      this._menu.hidden = true;
    }

    // Forget the last term button clicked.
    this._lastTermButtonSearch = null;

    this._updateSeparator();
  },

  /**
   * Display or hide the separators.
   * @private
   */
  _updateSeparator: function() {
    if (this._nextElemBoxId > 0) {
      document.getElementById("searchwp-separator-1").hidden = false;
      document.getElementById("searchwp-separator-2").hidden = false;
    }
    else {
      document.getElementById("searchwp-separator-1").hidden = true;
      document.getElementById("searchwp-separator-2").hidden = true;
    }
  },

  /**
   * Search the term in the current document.
   * @param aTermButton
   * @param aFindBackwards
   * @param aMatchCase
   * @private
   */
  _doSearch: function(aTermButton, aFindBackwards, aMatchCase) {
    var term = aTermButton.getAttribute("label");

    // To handle F3 correctly, we have to clear this find bar search.
    if (!gSearchWPTermsUtil.findBar.isVisible()
        && document.getElementById("find-field").value.length > 0) {
      document.getElementById("find-field").value = "";
      gSearchWPTermsUtil.findBar.find("");
    }

    // Initialize a new finder
    var finder = window.getBrowser().docShell
                       .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                       .getInterface(Components.interfaces.nsIWebBrowserFind);

    // This finder is buggy with tabs.
    // var finder = window.getBrowser().webBrowserFind;

    finder.wrapFind = true;
    finder.searchString = term;
    finder.findBackwards = aFindBackwards;
    finder.matchCase = aMatchCase;

    // Detect if the search is returning to top/bottom
    var prevRange = null;
    try {
      var focusedWindow = document.commandDispatcher.focusedWindow;
      prevRange = focusedWindow.getSelection().getRangeAt(0);

      if (prevRange.toString().toLowerCase() != term.toLowerCase()) {
        prevRange = null;
      }
    }
    catch(e) {}

    var result = finder.findNext();
    if (!result) {
      /* Sometime, the term isn't found even if the word is in the page... try again */

      result = finder.findNext();
      if (!result) {
        this._setTermNotFound(aTermButton);
        gSearchWP.displayMessage(this.stringBundle.getFormattedString("notFound", [term], 1));
      }
    }

    if (result && prevRange) {
      // Detect if the search is returning to top/bottom
      try {
        var curRange = focusedWindow.getSelection().getRangeAt(0);
        var res = curRange.compareBoundaryPoints(Components.interfaces.nsIDOMRange.START_TO_START,
                    prevRange);
        if (res <= 0 && !aFindBackwards) {
          gSearchWP.displayMessage(this.stringBundle.getString("wrappedToTop"));
        }
        else if (res >= 0 && aFindBackwards) {
          gSearchWP.displayMessage(this.stringBundle.getString("wrappedToBottom"));
        }
      }
      catch(e) {}
    }
  },

  /**
   * Change the term's icon to a Not Found icon.
   * @param item
   * @private
   */
  _setTermNotFound: function(item) {
    item.className = "searchwp-term-notfound";

    if (this._termNotFoundTimeout) {
      clearTimeout(this._termNotFoundTimeout);
    }

    this._termNotFoundTimeout = setTimeout(function(e) { gSearchWPTermsToolbar.updateTermStyleClassName(e); }, 3000, item);
  }
}