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

gSearchWP.Highlighter.NodeHighlighter = function(aName) {
  var self = this;
  var _name = aName;

  /**
   * Clear the highlighting for a particular document.
   * @param aDocument The document to clear.
   */
  this.clear = function(aDocument) {
    if (!aDocument) {
      return;
    }

    var documentMetaData = getNodeHighlighterMetaData(aDocument);

    // Find and remove all highlight nodes
    while (documentMetaData.count > 0) {
      var id = generateIdPrefix() + --documentMetaData.count;
      var clone = documentMetaData.originalNodes[id];
      var oldSpan = aDocument.getElementById(id);
      var parent = oldSpan.parentNode;
      parent.replaceChild(clone, oldSpan);
      parent.normalize();
    }
  }

  /**
   * Highlight all instances of a word in a particular node of
   * the given document.
   * @param aDocument The document.
   * @param aNode The node contained in the document.
   * @param aWord The word to highlight.
   * @param aMatchCase If highlighting should match case.
   * @param aElementCreator An element creator object (see DefaultElementCreator below).
   */
  this.highlight = function(aDocument, aNode, aWord, aMatchCase, aElementCreator) {
    if (aNode.nodeType != Node.TEXT_NODE) {
      return 0;
    }

    var documentMetaData = getNodeHighlighterMetaData(aDocument);

    var node = aNode;
    var text = node.data;
    var word = aWord;
    if (!aMatchCase) {
      text = text.toUpperCase();
      word = word.toUpperCase();
    }

    var count = 0;
    while (text.indexOf(word) != -1) {
      var matchText = node.splitText(text.indexOf(word));
      matchText.splitText(word.length);

      var id = generateIdPrefix() + documentMetaData.count++;

      // Check if id already exists.
      while (aDocument.getElementById(id) != null) {
        id = generateIdPrefix() + documentMetaData.count++;
      }

      var childNode = matchText.cloneNode(true);
      var element = aElementCreator.createElement(aDocument, id, childNode);
      matchText.parentNode.replaceChild(element, matchText);

      documentMetaData.originalNodes[id] = childNode.cloneNode(true);

      // Move to next node
      node = element.nextSibling;
      text = node.data;
      if (!aMatchCase) {
        text = text.toUpperCase();
      }

      count++;

      if (text == word) {
        break;
      }
    }

    return count;
  }

  function getNodeHighlighterMetaData(aDocument) {
    if (!aDocument._nodeHighlighter) {
      aDocument._nodeHighlighter = {};
    }

    if (!aDocument._nodeHighlighter[_name]) {
      aDocument._nodeHighlighter[_name] = {count: 0, originalNodes: {}};
    }
    return aDocument._nodeHighlighter[_name];
  }

  function generateIdPrefix() {
    return _name;
  }
}

gSearchWP.Highlighter.DefaultElementCreator = function(aElementName, aAttributes) {
  var elementName = aElementName;
  var attributes = aAttributes;

  this.createElement = function(aDocument, aId, aChildNode) {
    var element = aDocument.createElement(elementName);
    for (var name in attributes) {
      element.setAttribute(name, attributes[name]);
    }

    element.setAttribute("id", aId);
    element.appendChild(aChildNode);
    return element;
  }
}