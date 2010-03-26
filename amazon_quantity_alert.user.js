// ==UserScript==
// @name          Amazon Quantity Alert
// @namespace     http://codefairy.org/ns/userscripts
// @include       https://www.amazon.co.jp/gp/cart/view.html*
// @include       https://amazon.co.jp/gp/cart/view.html*
// @include       http://www.amazon.co.jp/gp/cart/view.html*
// @include       http://amazon.co.jp/gp/cart/view.html*
// @version       0.3
// ==/UserScript==

new function() {
	var w = (typeof unsafeWindow != 'undefined') ? unsafeWindow : window;
	var $ = w.jQuery;
	if (!$) return;

	var inputs = $('#cartViewForm :text');
	inputs.each(function() {
		var input = $(this);
		if (input.val() > 1)
			input.css('outline', '7px solid #ba3c4f');
	});

	$('#gutterCartViewForm').submit(function() {
		var ret = true;
		inputs.each(function() {
			if ($(this).val() > 1) {
				ret = confirm('同じ商品を複数注文しようとしています。レジに進みますか？');
				return false;
			}
		});
		return ret;
	});
};
