// ==UserScript==
// @name          Shinsei Power Redirect
// @namespace     http://codefairy.org/ns/userscripts
// @include       https://direct*.shinseibank.co.jp/*
// @version       0.3
// @license       MIT License
// @work          Firefox 3.5 + Greasemonkey 0.8.2, Safari 4 + Greasekit 1.7
// @inspired      http://blog.japan.cnet.com/kenn/archives/004415.html
// ==/UserScript==

new function() {
	/*** AT YOUR OWN RISK ***/
	var account_id = '';
	var security_card_table = {
		A: ['', '', '', '', ''],
		B: ['', '', '', '', ''],
		C: ['', '', '', '', ''],
		D: ['', '', '', '', ''],
		E: ['', '', '', '', ''],
		F: ['', '', '', '', ''],
		G: ['', '', '', '', ''],
		H: ['', '', '', '', ''],
		I: ['', '', '', '', ''],
		J: ['', '', '', '', '']
	};


	var w = (typeof unsafeWindow != 'undefined') ? unsafeWindow : window;

	if (document.title != 'ログインスクリーン') return;

	try {
		$X('id("securitykeyboard")')[0].checked = false;

		var page = (!!w.fldGridChallange1 ? 2 : 1);
		switch (page) {
			case 1:
				$X('//input[@name="fldUserID"]')[0].value = account_id;
				window.addEventListener('load', function() {
					$X('id("fldUserNumId")')[0].focus();
				}, false);
				break;

			case 2:
				var grid = 'fldGridChallange';
				var input = $X('//input[@type="password"]');
				for (var i = 0; i < 3; i++) {
					var g = w[grid+(i + 1)];
					input[i].value = security_card_table[g[0]][g[1]];
				}
				w.CheckLogonInputs();
		}
	}
	catch (e) {}


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
