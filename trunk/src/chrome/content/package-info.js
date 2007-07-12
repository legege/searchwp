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

if (!this.searchwp) this.searchwp = {};

searchwp.playBeep = function() {
  Components.classes["@mozilla.org/sound;1"]
            .createInstance(Components.interfaces.nsISound)
            .beep();
}

searchwp.displayMessage = function(message, beep) {
  var xulBrowserWindow = window.XULBrowserWindow;

  if (!xulBrowserWindow) {
    return;
  }

  xulBrowserWindow.setOverLink(message, null);
  if (beep) {
    this.playBeep();
  }

  if (this._displayMessageTimeout) {
    clearTimeout(this._displayMessageTimeout);
  }

  this._displayMessageTimeout = setTimeout(function(text) {
    if (window.XULBrowserWindow.overLink == text) {
      window.XULBrowserWindow.setOverLink("", null);
    }
  }, 3000, message);

  return;
}

searchwp.loadStyleSheet = function(fileURI) {
  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
      .getService(Components.interfaces.nsIStyleSheetService);
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
      .getService(Components.interfaces.nsIIOService);
  var uri = ios.newURI(fileURI, null, null);
  if(!sss.sheetRegistered(uri, sss.USER_SHEET)) {
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
  }
}