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

searchwp.TermsToolbar = new function() {
  var self = this;

  var _stringBundle;
  var _lastTermButtonSearch;
  var _termsDataCache;
  var _nextElemBoxId;
  var _nextElemPopupId;
  var _inBox;
  var _termNotFoundTimeout;

  /**
   * Initializes the terms toolbar
   */
  this.init = function() {
    _stringBundle = document.getElementById("bundle-searchwp");

    addEventListener("resize", function(aEvent) { searchwp.TermsToolbar.onResize(aEvent); }, false);
  }

  /**
   * Updates the terms toolbar.
   * @param aTermsData An terms array that contains 2 information per term: text, className.
   * @param aForceUpdate If true, the comparaison between the actual terms is not done.
   */
  this.update = function(aTermsData, aForceUpdate) {
    if (!this.exist()) {
      return;
    }

    // This is not in the init function because this can change in a session.
    if (searchwp.Preferences.maxTermButtons == 0) {
      getMenu().hidden = false;
      getMenu().className = ""; //Remove the chevron style
    }
    else {
      getMenu().className = "chevron";
    }

    if (!aForceUpdate && searchwp.TermsDataFactory.compare(_termsDataCache, aTermsData)) {
      return;
    }
    _termsDataCache = aTermsData;
    clearTerms();

    for (var i in aTermsData) {
      addTerm(aTermsData[i].text, aTermsData[i].className);
    }

    updateSeparator();
  }

  /**
   * Called when the window is resized.
   * @param aEvent The resize event.
   */
  this.onResize = function(aEvent) {
    this.refresh();
  }

  /**
   * Refresh the terms toolbar.
   */
  this.refresh = function() {
    this.update(_termsDataCache, true);
  }

  /**
   * @return true if the terms toolbar exists.
   */
  this.exist = function() {
    return getContainer() != null;
  }

  /**
   * This method is to be called when the user want to repeat
   * the last search action.
   * @return false if the search cannot be performed.
   */
  this.searchAgain = function(aEvent) {
    if (!_lastTermButtonSearch) {
      if (_nextElemBoxId + _nextElemPopupId == 1) { //Only one button
        if (_nextElemBoxId == 1) {
          _lastTermButtonSearch = getBoxTerms().firstChild;
        }
        else {
          _lastTermButtonSearch = getPopup().firstChild;
        }
      }
      else {
        return false;
      }
    }

    var findBackwards = aEvent.shiftKey;
    var matchCase = aEvent.ctrlKey;

    doSearch(_lastTermButtonSearch, findBackwards, matchCase);

    return true;
  }

  /**
   * This method is called when the user click on a term button.
   * @param aEvent The event to handle.
   * @param aItem
   */
  this.onTermCommand = function(aEvent, aItem) {
    _lastTermButtonSearch = aItem;

    var findBackwards = aEvent.shiftKey;
    var matchCase = aEvent.ctrlKey;

    doSearch(aItem, findBackwards, matchCase);
  }

  /**
   * Updates all terms' icons.
   */
  this.updateTermsStyleClassName = function() {
    if (getBoxTerms()) {
      for(var i = 0; i < getBoxTerms().childNodes.length; i++) {
        this.updateTermStyleClassName(getBoxTerms().childNodes[i]);
      }

      for(var i = 0; i < getPopup().childNodes.length; i++) {
        this.updateTermStyleClassName(getPopup().childNodes[i]);
      }
      return true;
    }
    return false;
  }

  /**
   * Resets the term's icon.
   * @param aItem The term button.
   */
  this.updateTermStyleClassName = function(aItem) {
    if (searchwp.Preferences.highlighted) {
      aItem.className = aItem.getAttribute("highlightStyleClassName");
    }
    else {
      aItem.className = "";
    }
  }

  /**
   * @return a reference to the terms toolbar container.
   */
  function getContainer() {
    return document.getElementById("searchwp-terms-container");
  }

  /**
   * @return a reference to the palette that contains the terms toolbar.
   */
  function getPalette() {
    return getContainer().parentNode;
  }

  /**
   * @return XXX
   */
  function getBoxTerms() {
    return document.getElementById("searchwp-terms-box");
  }

  /**
   * @return XXX
   */
  function getPopup() {
    return document.getElementById("searchwp-terms-popup");
  }

  /**
   * @return XXX
   */
  function getMenu() {
    return document.getElementById("searchwp-terms-menu");
  }

  /**
   * Adds a term to the toolbar.
   * @param aLabel
   * @param aStyleClassName
   */
  function addTerm(aLabel, aStyleClassName) {
    var button = addTermButton(_inBox, aLabel, aStyleClassName);

    //The popup menu is hidden.
    if (_inBox) {
      var itemsWidth = 0;
      for (var j = 0; j < getPalette().childNodes.length; j++) {
        if (getPalette().childNodes[j].nodeName.toLowerCase() in {toolbarspring: null}) {
          continue;
        }
        itemsWidth += getPalette().childNodes[j].boxObject.width;
      }
      itemsWidth = itemsWidth + getMenu().boxObject.width;

      if (itemsWidth > window.innerWidth || (searchwp.Preferences.maxTermButtons > -1
          && _nextElemBoxId > searchwp.Preferences.maxTermButtons)) {
        removeTermButton(button);
        button = addTermButton(false, aLabel, aStyleClassName);
        _inBox = false;
        getMenu().hidden = false;
      }
    }

  }

  /**
   * @param aInBox
   * @param aLabel
   * @param aStyleClassName
   * @return a reference to a newly created term button.
   */
  function addTermButton(aInBox, aLabel, aStyleClassName) {
    var button = null;
    if (aInBox) {
      button = document.getElementById("searchwp-terms-box-" + _nextElemBoxId);
    }
    else {
      button = document.getElementById("searchwp-terms-popup-" + _nextElemPopupId);
    }

    if (!button) {
      button = document.createElement("toolbarbutton");
      if (aInBox) {
        button.id = "searchwp-terms-box-" + _nextElemBoxId;
        getBoxTerms().appendChild(button);
      }
      else {
        button.id = "searchwp-terms-popup-" + _nextElemPopupId;
        getPopup().appendChild(button);
      }
    }
    else {
      button.hidden = false;
    }

    if (aInBox) {
      _nextElemBoxId++;
    }
    else {
      _nextElemPopupId++;
    }

    button.setAttribute("label", aLabel);
    button.setAttribute("oncommand", "searchwp.TermsToolbar.onTermCommand(event, this)");
    button.setAttribute("highlightStyleClassName", aStyleClassName);
    self.updateTermStyleClassName(button);

    return button;
  }

  /**
   * Remove a term button (the button itself is not truly removed).
   * @param aButton The button to remove.
   */
  function removeTermButton(aButton) {
    aButton.hidden = true;
    if (aButton.id.indexOf("searchwp-terms-box") > -1) {
      _nextElemBoxId--;
    }
    else {
      _nextElemPopupId--;
    }
  }

  /**
   * Deletes all the terms in the toolbar.
   */
  function clearTerms() {
    while (_nextElemBoxId > 0) {
      removeTermButton(document.getElementById("searchwp-terms-box-"
        + (_nextElemBoxId - 1)));
    }
    _nextElemBoxId = 0;

    while (_nextElemPopupId > 0) {
      removeTermButton(document.getElementById("searchwp-terms-popup-"
        + (_nextElemPopupId - 1)));
    }
    _nextElemPopupId = 0;

    _inBox = true;
    if (searchwp.Preferences.maxTermButtons != 0) {
      getMenu().hidden = true;
    }

    // Forget the last term button clicked.
    self.lastTermButtonSearch = null;

    updateSeparator();
  }

  /**
   * Display or hide the separators.
   */
  function updateSeparator() {
    if (_nextElemBoxId > 0) {
      document.getElementById("searchwp-separator-1").hidden = false;
      document.getElementById("searchwp-separator-2").hidden = false;
    }
    else {
      document.getElementById("searchwp-separator-1").hidden = true;
      document.getElementById("searchwp-separator-2").hidden = true;
    }
  }

  /**
   * Search the term in the current document.
   * @param aTermButton
   * @param aFindBackwards
   * @param aMatchCase
   */
  function doSearch(aTermButton, aFindBackwards, aMatchCase) {
    var term = aTermButton.getAttribute("label");

    // To handle F3 correctly, we have to clear this find bar search.
    if (gFindBar.hidden && gFindBar.getElement("findbar-textbox").value.length > 0) {
      gFindBar.getElement("findbar-textbox").value = "";
      gFindBar.find("");
    }

    var fastFind = window.getBrowser().fastFind;
    fastFind.caseSensitive = aMatchCase;

    var result;
    if (fastFind.searchString != term) {
      result = fastFind.find(term, false);
    }
    else {
      result = fastFind.findAgain(aFindBackwards, false);
    }

    switch (result) {
      case 0: // Found
        break;
      case 1: // Not found
        setTermNotFound(aTermButton);
        searchwp.displayMessage(_stringBundle.getFormattedString("notFound", [term], 1), true);
        break;
      case 2: // Wrapped
        if (aFindBackwards) {
          searchwp.displayMessage(_stringBundle.getString("wrappedToBottom"), true);
        }
        else {
          searchwp.displayMessage(_stringBundle.getString("wrappedToTop"), true);
        }
        break;
    }
  }

  /**
   * Change the term's icon to a Not Found icon.
   * @param aItem
   */
  function setTermNotFound(aItem) {
    aItem.className = "searchwp-term-notfound";

    if (_termNotFoundTimeout) {
      clearTimeout(_termNotFoundTimeout);
    }

    _termNotFoundTimeout = setTimeout(function(aEvent) { searchwp.TermsToolbar.updateTermStyleClassName(aEvent); }, 3000, aItem);
  }
}