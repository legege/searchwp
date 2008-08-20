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

gSearchWP.Options.OptionsDialog = new function() {
  this.onLoad = function() {
    document.getElementById("highlightMinlength").selectedIndex = gSearchWP.Preferences.highlightMinLength - 1;
    document.getElementById("groupTokensSingleMenu").checked = gSearchWP.Preferences.tokensDisplayMode == 3;
  }

  this.onAccept = function() {
    // Highlighting options
    var highlightMinLength = document.getElementById("highlightMinlength").selectedIndex + 1;
    if (highlightMinLength > 0) {
      gSearchWP.Preferences.highlightMinLength = highlightMinLength;
    }

    if (document.getElementById("groupTokensSingleMenu").checked) {
      gSearchWP.Preferences.tokensDisplayMode = 3;
    }
    else {
      gSearchWP.Preferences.tokensDisplayMode = 2;
    }

    return true;
  }
}