// ==UserScript==
// @name          Skip Redirector
// @namespace     http://codefairy.org/ns/userscripts
// @include       *
// @version       0.5.3
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
			var url = item.url;
			var link = item.link;
			var replace_url = item.replace_url;
			if (new RegExp(url).test(location.href)) {
				if (replace_url) {
					var reditrect_url = decodeURIComponent(location.href.replace(new RegExp(url), replace_url));
					if (/^https?:\/\//.test(reditrect_url))
						location.href = reditrect_url;
				}
				else if (link) {
					var a = $X(link)[0];
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


	// http://gist.github.com/3242
	function $X (exp, context) {
		context || (context = document);
		var expr = (context.ownerDocument || context).createExpression(exp, function (prefix) {
			return document.createNSResolver(context.documentElement || context).lookupNamespaceURI(prefix) ||
				context.namespaceURI || document.documentElement.namespaceURI || "";
		});

		var result = expr.evaluate(context, XPathResult.ANY_TYPE, null);
			switch (result.resultType) {
				case XPathResult.STRING_TYPE : return result.stringValue;
				case XPathResult.NUMBER_TYPE : return result.numberValue;
				case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
					// not ensure the order.
					var ret = [], i = null;
					while (i = result.iterateNext()) ret.push(i);
					return ret;
			}
		return null;
	}
};
