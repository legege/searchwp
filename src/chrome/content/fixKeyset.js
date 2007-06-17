/**
 * SearchWP, http://www.legege.com
 * Copyright (C) 2004-2006 All Rights Reserved.
 * Author: Georges-Etienne Legendre (legege@legege.com)
 */

// need to correct some XUL elements without IDs
const mainKeyset = document.getElementById("mainKeyset");
var elements = mainKeyset.getElementsByAttribute("keycode", "VK_F3");

if (elements.length == 2) {
  if (!elements[0].getAttribute("id") && !elements[1].getAttribute("id")
      && elements[0].getAttribute("command") == "cmd_findAgain"
      && elements[1].getAttribute("command") == "cmd_findPrevious") {
    elements[0].setAttribute("id", "key_findAgainSWP");
    elements[0].setAttribute("command", '');
    elements[1].setAttribute("id", "key_findPreviousSWP");
    elements[1].setAttribute("command", '');
  }
}