// ==UserScript==
// @name          Shinsei Power Direct AutoFill
// @namespace     http://codefairy.org/ns/userscripts
// @include       https://direct*.shinseibank.co.jp/FLEXCUBEAt/LiveConnect.dll*
// @include       https://direct*.shinseibank.co.jp/IbsJsps/ibloginnew1.jsp*
// @version       0.1
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// @work          Google Chrome
// ==/UserScript==

(function(d) {

/*** AT YOUR OWN RISK ***/
var account_id          = '1234567890';
var security_card_table = [
	/*       A B C D E F G H I J */
	/* 0 */ 'A 1 B 2 C 3 D 4 E 5',
	/* 1 */ 'F 6 G 7 H 8 I 9 J 0',
	/* 2 */ 'K 1 L 2 M 3 N 4 O 5',
	/* 3 */ 'P 6 Q 7 R 8 S 9 T 0',
	/* 4 */ 'U 1 V 2 W 3 X 4 Y 5'
];


if (document.title != 'ログインスクリーン') {
	return;
}

$X('id("securitykeyboard")')[0].checked = false;

try {
	var account_id_container = $X('id("main-left-account")//input')[0];
	d.onload = account_id_container ?
		function() { // page 1
			account_id_container.value = account_id;
			$X('id("main-left-pin")//input')[0].focus();
		} :
		function() { // page 2
			var n = 3,
				c,
				strong = $X('id("main-left-security")//strong'),
				input = $X('//input[@type="password"]');
			while (c = strong[--n]) {
				c = c.innerHTML;
				input[n].value = security_card_table[c.charAt(1)].split(' ')[c.charCodeAt(0) - 65];
			}
		};
	d.readyState == 'complete' && d.onload();
}
catch (e) {
	alert([
		'[Shinsei Power Direct AutoFill] Oops! Probably HTML has changed.',
		'',
		e
	].join('\n'));
}


// https://gist.github.com/29681
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

})(unsafeWindow || document);
