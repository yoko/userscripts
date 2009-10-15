// ==UserScript==
// @name          Skip Redirector
// @namespace     http://codefairy.org/ns/userscripts
// @include       *
// @version       0.4.1
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// ==/UserScript==

new function() {
	var cacheable = (typeof GM_setValue == 'function' && typeof GM_getValue == 'function');

	var w = (typeof unsafeWindow != 'undefined') ? unsafeWindow : window;
	var now = new Date().getTime();
	var uri = 'http://wedata.net/databases/Redirector/items';

	var handler = function(data) {
		var i = data.length;
		while (i--) {
			var item = data[i].data;
			if (new RegExp(item.url).test(location.href)) {
				var a = $X(item.link)[0];
				if (a) {
					// [firefox] can not dispatch event that target is link.
					if (a.href)
						location.href = a.href;
					else {
						var e = document.createEvent('MouseEvent');
						e.initEvent('click', false, true);
						a.dispatchEvent(e);
					}
				}
				return;
			}
		}
	};

	var load = function() {
		return eval(GM_getValue('stash'));
	};

	var save = function(data) {
		var stash = data ?
			uneval({
				data   : data,
				expires: now + 1000 * 60 * 60 * 24
			}) :
			'';
		GM_setValue('stash', stash);
		return data;
	};


	if (cacheable && typeof GM_registerMenuCommand == 'function')
		GM_registerMenuCommand('Clear Redirector Data Cache', save);

	var api = uri+'.json';
	if (cacheable) {
		var complete = false;
		var stash = load();

		if (stash && stash.expires >= now)
			handler(stash.data);
		else {
			GM_xmlhttpRequest({
				method: 'GET',
				url   : api,
				onload: function(r) {
					var data = eval(r.responseText);
					save(data);
					if (!complete) handler(data);
				}
			});
			if (stash)
				setTimeout(function() {
					complete = true;
					handler(save(stash.data));
				}, 1000 * 30);
		}
	}
	else {
		w['jsonp'+now] = handler;

		var s = document.createElement('script');
		s.type    = 'text/javascript';
		s.src     = api+'?callback=jsonp'+now;
		s.charset = 'utf-8';
		document.body.appendChild(s);
	}


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
