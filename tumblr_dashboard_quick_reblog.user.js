// ==UserScript==
// @name          Tumblr Dashboard Quick Reblog
// @description   Adds quick reblog link to Tumblr dashboard for Safari + GreaseKit.
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.tumblr.com/*
// @version       0.2
// @license       MIT License
// @work          Greasekit
// ==/UserScript==

new function() {
	var posts = $X('id("posts")');
	if (!posts.length) return;

	document.body.addEventListener('DOMNodeInserted', function(e) {
		var target = e.target;
		if (target.tagName && target.tagName.toLowerCase() == 'li' && /^post(\d+)$/.test(target.id))
			add(target);
	}, false);

	$X('./li', posts[0]).forEach(function(li) {
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
			createDocumentFromString(html)
		);
		var q = [];
		params.forEach(function(param) {
			var name = param.name;
			if (name == 'preview_post' || name == 'send_to_twitter') return;
			q.push(encodeURIComponent(name)+'='+encodeURIComponent(param.value));
		});
		return q.join('&');
	}

	// http://gist.github.com/198443
	// via http://github.com/hatena/hatena-bookmark-xul/blob/master/chrome/content/common/05-HTMLDocumentCreator.js
	function createDocumentFromString(source){
		var doc = document.implementation.createHTMLDocument ?
				document.implementation.createHTMLDocument('hogehoge') :
				document.implementation.createDocument(null, 'html', null);
		var range = document.createRange();
		range.selectNodeContents(document.documentElement);
		var fragment = range.createContextualFragment(source);
		var headChildNames = {title: true, meta: true, link: true, script: true, style: true, /*object: true,*/ base: true/*, isindex: true,*/};
		var child, head = doc.getElementsByTagName('head')[0] || doc.createElement('head'),
		           body = doc.getElementsByTagName('body')[0] || doc.createElement('body');
		while ((child = fragment.firstChild)) {
			if (
				(child.nodeType === doc.ELEMENT_NODE && !(child.nodeName.toLowerCase() in headChildNames)) || 
				(child.nodeType === doc.TEXT_NODE &&/\S/.test(child.nodeValue))
			   )
				break;
			head.appendChild(child);
		}
		body.appendChild(fragment);
		doc.documentElement.appendChild(head);
		doc.documentElement.appendChild(body);
		return doc;
	}

	// http://gist.github.com/29681.txt
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
