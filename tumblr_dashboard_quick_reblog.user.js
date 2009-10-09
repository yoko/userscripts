// ==UserScript==
// @name          Tumblr Dashboard Quick Reblog
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.tumblr.com/*
// @version       0.1.1
// @license       MIT License
// @work          Safari 4 + Greasekit 1.7
// ==/UserScript==

new function() {
	document.body.addEventListener('AutoPagerize_DOMNodeInserted', function(e) {
		add(e.target);
	}, false);

	$X('id("posts")/li').forEach(function(li) {
		add(li);
	});

	if (window.Minibuffer) {
		window.Minibuffer.addShortcutkey({
			key        : 't',
			description: 'Reblog',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-link | reblog | clear-pin');
			}
		});
		window.Minibuffer.addCommand({
			name   : 'reblog',
			command: function(stdin) {
				if (!stdin.length) {
					var link = window.Minibuffer.execute('current-link');
					if (link) urls = [link.toString()];
				}
				// 'location | reblog'
				else if (stdin.every(function(a) { return (typeof a == 'string'); }))
					urls = stdin;
				// 'pinned-or-current-link | reblog'
				else if (stdin.every(function(a) { return (a && a.nodeName.toLowerCase() == 'a'); }))
					urls = stdin.map(function(node) { return node.href; });

				urls = urls.filter(function(url) {
					return /^https?:\/\/[^.]+\.tumblr\.com\/post\/\d+/.test(url);
				});
				urls.map(reblog);

				return stdin;
			}
		});
	}

	function add(context) {
		var link = $X('./div[@class="post_controls"]/a[text()="reblog"]', context)[0];
		if (!link) return;
		var href = link.href;
		var a = document.createElement('a');
		a.href = href;
		a.innerHTML = ':)';
		a.addEventListener('click', function(e) {
			e.preventDefault();
			reblog(href);
		}, false);
		link.parentNode.insertBefore(a, link.nextSibling);
	}

	function reblog(url) {
		var id = /\/(?:reblog|post)\/(\d+)\//.exec(url)[1];
		var a = $X('id("post'+id+'")/div[@class="post_controls"]/a[text()="reblog"]')[0];
		if (!a) return;
		url = a.href;
		var uid = 'quick-reblog'+id;

		if (window.Minibuffer)
			window.Minibuffer.status(uid, 'Reblogging...');

		var reblog = new XMLHttpRequest;
		reblog.onreadystatechange = function() {
			if (reblog.readyState == 4 && reblog.status == 200) {
				var p = get_param(reblog.responseText);
				
				var post = new XMLHttpRequest;
				post.onreadystatechange = function() {
					if (post.readyState == 4 && post.status == 200) {
						var span = document.createElement('span');
						span.style.marginLeft = '10px';
						span.innerHTML = ':D';
						var parent = a.parentNode;
						var link = a.nextSibling;
						parent.insertBefore(span, link);
						parent.removeChild(link);
						if (window.Minibuffer)
							window.Minibuffer.status(uid, 'Reblogged', 100);
					}
				};
				post.open('POST', url, true);
				post.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				post.send(p);
			}
		};
		reblog.open('GET', url, true);
		reblog.send(null);
	}

	function get_param (html) {
		var params = $X(
			'id("edit_post")//*[name()="input" or name()="textarea" or name()="select"]',
			HTMLStringToDOM(html)
		);
		var q = [];
		params.forEach(function(param) {
			var name = param.name;
			if (name == 'preview_post' || name == 'send_to_twitter') return;
			q.push(encodeURIComponent(name)+'='+encodeURIComponent(param.value));
		});
		return q.join('&');
	}

	// @source http://gist.github.com/164430.txt
	function HTMLStringToDOM(str){
		var html = String(str).replace(/<script(?:[ \t\r\n][^>]*)?>[\S\s]*?<\/script[ \t\r\n]*>|<\/?(?:i?frame|html|script|object)(?:[ \t\r\n][^<>]*)?>/gi, ' ');
		var htmlDoc = document.implementation.createHTMLDocument ?
			document.implementation.createHTMLDocument('HTMLParser') :
			document.implementation.createDocument(null, 'html', null);
		var range = document.createRange();
		range.selectNodeContents(document.documentElement);
		htmlDoc.documentElement.appendChild(htmlDoc.importNode(range.createContextualFragment(html),true));
		return htmlDoc;
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
