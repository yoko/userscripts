// ==UserScript==
// @name           Google Submittable Radio Selector
// @namespace      http://codefairy.org/ns/userscripts
// @include        http://www.google.*/search?*
// @version        0.1
// @license        MIT License
// @work           Greasemonkey
// @work           GreaseKit
// ==/UserScript==

new function() {
	$X('//input[@id="all" or @id="il"]').forEach(function(radio) {
		radio.addEventListener('click', function() {
			$X('id("tsf")')[0].submit();
		}, false);
	});


	// @source http://gist.github.com/29681.txt
	function $X (exp, context, resolver, result_type) {
		context || (context = document);
		var Doc = context.ownerDocument || context;
		var result = Doc.evaluate(exp, context, resolver, result_type || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (result_type) return result;
		for (var i = 0, len = result.snapshotLength, res = new Array(len); i < len; i++) {
			res[i] = result.snapshotItem(i);
		}
		return res;
	}
};
