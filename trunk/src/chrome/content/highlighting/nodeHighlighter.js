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

searchwp.highlighting.NodeHighlighter = function(name) {
  var self = this;
  this.name = name;

  /**
   * Clear the highlighting for a particular document.
   * @param document The document to clear.
   */
  this.clear = function(document) {
    if (!document) {
      return;
    }

    initNodeHighlighterMetaData(document);

    // Find and remove all highlight span nodes
    while (document.nodeHighlighter[this.name].count > 0) {
      var id = this.name + --document.nodeHighlighter[this.name].count;
      var clone = document.nodeHighlighter[this.name].originalNodes[id];
      var oldSpan = document.getElementById(id);
      var parent = oldSpan.parentNode;
      parent.replaceChild(clone, oldSpan);
      parent.normalize();
    }
  }

  /**
   * Highlight all instances of a word in a particular node of
   * the given document.
   * @param document The document
   * @param node The node contained in the document.
   * @param word The word to highlight.
   * @param matchCase If highlighting should match case.
   * @param elementCreator An element creator object (see DefaultElementCreator below).
   */
  this.highlight = function(document, node, word, matchCase, elementCreator) {
    if (node.nodeType != Node.TEXT_NODE) {
      return;
    }

    initNodeHighlighterMetaData(document);

    var text = node.data;
    if (!matchCase) {
      text = text.toUpperCase();
      word = word.toUpperCase();
    }

    var count = 0;
    while (text.indexOf(word) != -1) {
      var matchText = node.splitText(text.indexOf(word));
      matchText.splitText(word.length);

      var id = this.name + document.nodeHighlighter[this.name].count++;

      // Check if id already exists.
      while (document.getElementById(id) != null) {
        id = this.name + document.nodeHighlighter[this.name].count++;
      }

      var childNode = matchText.cloneNode(true);
      var element = elementCreator.createElement(document, id, childNode);
      matchText.parentNode.replaceChild(element, matchText);

      document.nodeHighlighter[this.name].originalNodes[id] = childNode.cloneNode(true);

      // Move to next node
      node = element.nextSibling;
      text = node.data;
      if (!matchCase) {
        text = text.toUpperCase();
      }

      count++;

      if (text == word) {
        break;
      }
    }

    return count;
  }

  function initNodeHighlighterMetaData(document) {
    if (!document.nodeHighlighter) {
      document.nodeHighlighter = {};
    }

    if (!document.nodeHighlighter[self.name]) {
      document.nodeHighlighter[self.name] = {count: 0, originalNodes: {}};
    }
  }
}

searchwp.highlighting.DefaultElementCreator = function(elementName, attributes) {
  this.elementName = elementName;
  this.attributes = attributes;

  this.createElement = function(document, id, childNode) {
    var element = document.createElement(this.elementName);
    for (var name in attributes) {
      element.setAttribute(name, this.attributes[name]);
    }

    element.setAttribute("id", id);
    element.appendChild(childNode);
    return element;
  }
}