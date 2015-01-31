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

if (!this.gSearchWP) this.gSearchWP = {};
if (!this.gSearchWP.Highlighter) this.gSearchWP.Highlighter = {};

// TODO: refactoring preferences.js into a module?
Services.scriptloader.loadSubScript("chrome://@NAME@/content/preferences.js", {}, "UTF-8");

// TODO: evaluate if loading as subscripts is the best possibility here
Services.scriptloader.loadSubScript("chrome://@NAME@/content/highlighter/nodeHighlighter.js", {}, "UTF-8");
Services.scriptloader.loadSubScript("chrome://@NAME@/content/highlighter/nodeSearcher.js", {}, "UTF-8");
Services.scriptloader.loadSubScript("chrome://@NAME@/content/highlighter/highlighter.js", {}, "UTF-8");