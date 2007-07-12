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

  this.lastTermButtonSearch = null;

  /**
   * Initializes the terms toolbar
   */
  this.init = function() {
    this.stringBundle = document.getElementById("bundle_searchwp");
  }

  /**
   * Updates the terms toolbar.
   * @param termsData An terms array that contains 2 information per term: text, className.
   * @param forceUpdate If true, the comparaison between the actual terms is not done.
   */
  this.update = function(termsData, forceUpdate) {
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

    if (!forceUpdate && searchwp.TermsDataFactory.compareTermsData(this.termsData, termsData)) {
      return;
    }
    this.termsData = termsData;
    clearTerms();

    for (var term in termsData) {
      addTerm(termsData[term].text, termsData[term].className);
    }

    updateSeparator();
  }

  /**
   * Refresh the terms toolbar.
   */
  this.refresh = function() {
    this.update(this.termsData, true);
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
  this.searchAgain = function(event) {
    if (!this.lastTermButtonSearch) {
      if (this.nextElemBoxId + this.nextElemPopupId == 1) { //Only one button
        if (this.nextElemBoxId == 1) {
          this.lastTermButtonSearch = getBoxTerms().firstChild;
        }
        else {
          this.lastTermButtonSearch = getPopup().firstChild;
        }
      }
      else {
        return false;
      }
    }

    var findBackwards = event.shiftKey;
    var matchCase = event.ctrlKey;

    doSearch(this.lastTermButtonSearch, findBackwards, matchCase);

    return true;
  }

  /**
   * This method is called when the user click on a term button.
   * @param event The event to handle.
   * @param item
   */
  this.onTermCommand = function(event, item) {
    this.lastTermButtonSearch = item;

    var findBackwards = event.shiftKey;
    var matchCase = event.ctrlKey;

    doSearch(item, findBackwards, matchCase);
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
   * @param item The term button.
   */
  this.updateTermStyleClassName = function(item) {
    if (searchwp.Preferences.highlighted) {
      item.className = item.getAttribute("highlightStyleClassName");
    }
    else {
      item.className = "";
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
   * @param label
   * @param styleClassName
   */
  function addTerm(label, styleClassName) {
    var button = addTermButton(self.inBox, label, styleClassName);

    //The popup menu is hidden.
    if (self.inBox) {
      var itemsWidth = 0;
      for (var j = 0; j < getPalette().childNodes.length; j++) {
        if (getPalette().childNodes[j].nodeName.toLowerCase() in {toolbarspring: null}) {
          continue;
        }
        itemsWidth += getPalette().childNodes[j].boxObject.width;
      }
      itemsWidth = itemsWidth + getMenu().boxObject.width;

      if (itemsWidth > window.innerWidth || (searchwp.Preferences.maxTermButtons > -1
          && self.nextElemBoxId > searchwp.Preferences.maxTermButtons)) {
        removeTermButton(button);
        button = addTermButton(false, label, styleClassName);
        self.inBox = false;
        getMenu().hidden = false;
      }
    }

  }

  /**
   * @param inBox
   * @param label
   * @param styleClassName
   * @return a reference to a newly created term button.
   */
  function addTermButton(inBox, label, styleClassName) {
    var button = null;
    if (inBox) {
      button = document.getElementById("searchwp-terms-box-" + self.nextElemBoxId);
    }
    else {
      button = document.getElementById("searchwp-terms-popup-" + self.nextElemPopupId);
    }

    if (!button) {
      button = document.createElement("toolbarbutton");
      if (inBox) {
        button.id = "searchwp-terms-box-" + self.nextElemBoxId;
        getBoxTerms().appendChild(button);
      }
      else {
        button.id = "searchwp-terms-popup-" + self.nextElemPopupId;
        getPopup().appendChild(button);
      }
    }
    else {
      button.hidden = false;
    }

    if (inBox) {
      self.nextElemBoxId++;
    }
    else {
      self.nextElemPopupId++;
    }

    button.setAttribute("label", label);
    button.setAttribute("oncommand", "searchwp.TermsToolbar.onTermCommand(event, this)");
    button.setAttribute("highlightStyleClassName", styleClassName);
    self.updateTermStyleClassName(button);

    return button;
  }

  /**
   * Remove a term button (the button itself is not truly removed).
   * @param button The button to remove.
   */
  function removeTermButton(button) {
    button.hidden = true;
    if (button.id.indexOf("searchwp-terms-box") > -1) {
      self.nextElemBoxId--;
    }
    else {
      self.nextElemPopupId--;
    }
  }

  /**
   * Deletes all the terms in the toolbar.
   */
  function clearTerms() {
    while (self.nextElemBoxId > 0) {
      removeTermButton(document.getElementById("searchwp-terms-box-"
        + (self.nextElemBoxId - 1)));
    }
    self.nextElemBoxId = 0;

    while (self.nextElemPopupId > 0) {
      removeTermButton(document.getElementById("searchwp-terms-popup-"
        + (self.nextElemPopupId - 1)));
    }
    self.nextElemPopupId = 0;

    self.inBox = true;
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
    if (self.nextElemBoxId > 0) {
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
   * @param termButton
   * @param findBackwards
   * @param matchCase
   */
  function doSearch(termButton, findBackwards, matchCase) {
    var term = termButton.getAttribute("label");

    // To handle F3 correctly, we have to clear this find bar search.
    if (gFindBar.hidden && gFindBar.getElement("findbar-textbox").value.length > 0) {
      gFindBar.getElement("findbar-textbox").value = "";
      gFindBar.find("");
    }

    var fastFind = window.getBrowser().fastFind;
    fastFind.caseSensitive = matchCase;

    var result;
    if (fastFind.searchString != term) {
      result = fastFind.find(term, false);
    }
    else {
      result = fastFind.findAgain(findBackwards, false);
    }

    switch (result) {
      case 0: // Found
        break;
      case 1: // Not found
        setTermNotFound(termButton);
        searchwp.displayMessage(self.stringBundle.getFormattedString("notFound", [term], 1), true);
        break;
      case 2: // Wrapped
        if (findBackwards) {
          searchwp.displayMessage(self.stringBundle.getString("wrappedToBottom"), true);
        }
        else {
          searchwp.displayMessage(self.stringBundle.getString("wrappedToTop"), true);
        }
        break;
    }
  }

  /**
   * Change the term's icon to a Not Found icon.
   * @param item
   */
  function setTermNotFound(item) {
    item.className = "searchwp-term-notfound";

    if (self.termNotFoundTimeout) {
      clearTimeout(self.termNotFoundTimeout);
    }

    self.termNotFoundTimeout = setTimeout(function(e) { searchwp.TermsToolbar.updateTermStyleClassName(e); }, 3000, item);
  }
}