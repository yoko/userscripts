// ==UserScript==
// @name          handlerFlickr Adds Focal Length on a 35mm
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.flickr.com/*/meta/*
// @include       http://flickr.com/*/meta/*
// @version       0.2.5
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// ==/UserScript==

new function() {
	var cacheable = (typeof GM_setValue == 'function' && typeof GM_getValue == 'function');

	var camera      = $X('id("Inbox")//tr/td[preceding-sibling::td/b[text()="Camera:"]]/b');
	var focalLength = $X('id("Inbox")//tr/td[preceding-sibling::td/b[text()="Focal Length:"]]/b');
	if (!camera || !focalLength) return;
	camera = camera[0];
	focalLength = focalLength[0];

	var w = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
	var now = new Date().getTime();
	var uri = 'http://wedata.net/databases/AngleOfView/items';

	var handler = function(data) {
		var text = 'unknown on a 35mm camera. <a href="'+uri+'">add angle of view data?</a>';
		for (var i = 0, length = data.length; i < length; i++) {
			var item = data[i];
			if (item.name == camera.textContent) {
				if (item.data.ratio == 1)
					text = 'with a full-frame';
				else {
					var angleOfView = Math.round(parseFloat(focalLength.textContent) * parseFloat(item.data.ratio));
					text = angleOfView+' mm on a 35 mm camera';
				}
				break;
			}
		}
		focalLength.innerHTML += ' ('+text+')';
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
		GM_registerMenuCommand('Clear Angle of View Data Cache', save);

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
		for (var i = 0, len = result.snapshotLength, res = []; i < len; i++) {
			res.push(result.snapshotItem(i));
		}
		return res;
	}
};
