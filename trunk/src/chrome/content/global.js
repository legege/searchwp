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

var gSearchWP = {

  /**
   * Preferences
   */
  pref: {
    PREF_BRANCH: "extensions.searchwp.",
    PREF_BEEP_NOT_FOUND: "beep-not-found",
    PREF_HIGHLIGHTER_COUNT: "highlighter-count",
    PREF_HIGHLIGHT_MINLENGTH: "highlight-minlength",
    PREF_HIGHLIGHT_STATE: "highlight-state",
    PREF_FIRST_LAUNCH: "first-launch",
    PREF_MAX_TERM_BUTTONS: "max-term-buttons",
    _prefService: Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService),

    /**
     * @return Returns the preferences branch.
     */
    get branch() {
      return this._prefService.getBranch(this.PREF_BRANCH);
    },

    /**
     * @return Returns the state of the highlighting.
     */
    get highlighted() {
      try {
        return this.branch.getBoolPref(this.PREF_HIGHLIGHT_STATE);
      }
      catch (e) {
        this.highlighted = false;
        return false;
      }
    },

    /**
     * Sets the state of the highlighting.
     * @param v True or false
     */
    set highlighted(v) {
      this.branch.setBoolPref(this.PREF_HIGHLIGHT_STATE, v);
    },

    /**
     * @return Returns true if it is the first launch after installation.
     */
    get firstLaunch() {
      try {
        return this.branch.getBoolPref(this.PREF_FIRST_LAUNCH);
      }
      catch (e) {
        this.firstLaunch = false;
        return false;
      }
    },

    /**
     * Sets the first launch flag.
     * @param v True or false
     */
    set firstLaunch(v) {
      this.branch.setBoolPref(this.PREF_FIRST_LAUNCH, v);
    },

    /**
     * @return Returns the number of highlighter.
     */
    get highlighterCount() {
      try {
        return this.branch.getIntPref(this.PREF_HIGHLIGHTER_COUNT);
      }
      catch (e) {
        this.branch.setIntPref(this.PREF_HIGHLIGHTER_COUNT, 4);
        return 4;
      }
    },

    /**
     * @return Returns the mininum length to highlight a term.
     */
    get highlightMinLength() {
      try {
        return this.branch.getIntPref(this.PREF_HIGHLIGHT_MINLENGTH);
      }
      catch (e) {
        this.branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, 2);
        return 2;
      }
    },

    /**
     * Sets the mininum length to highlight a term.
     * @param v The minimum length
     */
    set highlightMinLength(v) {
      this.branch.setIntPref(this.PREF_HIGHLIGHT_MINLENGTH, v);
    },

    /**
     * @return Returns the maximum number of term's button. (-1: unlimited)
     */
    get maxTermButtons() {
      try {
        return this.branch.getIntPref(this.PREF_MAX_TERM_BUTTONS);
      }
      catch (e) {
        this.maxTermButtons = -1;
        return -1;
      }
    },

    /**
     * Changes the maximum number of term's button.
     * @param v An integer (-1: unlimited)
     */
    set maxTermButtons(v) {
      this.branch.setIntPref(this.PREF_MAX_TERM_BUTTONS, v);
    }
  },

  playBeep: function() {
    Components.classes["@mozilla.org/sound;1"]
              .createInstance(Components.interfaces.nsISound)
              .beep();
  },

  displayMessage: function(aMessage) {
    var xulBrowserWindow = window.XULBrowserWindow;

    if (!xulBrowserWindow) {
      return;
    }

    xulBrowserWindow.setOverLink(aMessage, null);
    this.playBeep();

    if (this._displayMessageTimeout) {
      clearTimeout(this._displayMessageTimeout);
    }

    this._displayMessageTimeout = setTimeout(function(aText) {
      if (window.XULBrowserWindow.overLink == aText) {
        window.XULBrowserWindow.setOverLink("", null);
      }
    }, 3000, aMessage);

    return;
  }
}

