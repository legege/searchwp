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

// need to correct some XUL elements without IDs
searchwp.fixFirefoxKeyset = function() { 
  var mainKeyset = document.getElementById("mainKeyset");
  var elements = mainKeyset.getElementsByAttribute("keycode", "VK_F3");
  
  if (elements.length == 2) {
    if (!elements[0].getAttribute("id") && !elements[1].getAttribute("id")
        && elements[0].getAttribute("command") == "cmd_findAgain"
        && elements[1].getAttribute("command") == "cmd_findPrevious") {
      elements[0].setAttribute("id", "key_findAgainSWP");
      elements[0].setAttribute("command", "");
      elements[1].setAttribute("id", "key_findPreviousSWP");
      elements[1].setAttribute("command", "");
    }
  }
}

searchwp.fixFirefoxKeyset();