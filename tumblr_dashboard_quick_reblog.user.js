// ==UserScript==
// @name          Tumblr Dashboard Quick Reblog
// @description   Adds quick reblog link to Tumblr dashboard for Safari + GreaseKit.
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.tumblr.com/*
// @version       0.2.1
// @license       MIT License
// @work          Greasekit
// ==/UserScript==

new function() {
	var posts = $X('id("posts")')[0];
	if (!posts) return;

	$X('./li', posts).forEach(function(li) {
		add(li);
	});

	posts.addEventListener('DOMNodeInserted', function(e) {
		var target = e.target;
		var tag = target.localName;
		if (tag && tag == 'li' && (/^post(\d+)$/.test(target.id)))
			add(target);
	}, false);

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
					return (/^https?:\/\/[^.]+\.tumblr\.com\/post\/\d+/.test(url));
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

		var link = a.nextSibling;
		link.innerHTML = '';
		link.style.padding    = '0 7px';
		link.style.background = 'url(data:image/gif;base64,R0lGODlhEAAQAPQAAP///6ixuvv8/LrByNTZ3aqyu7S8xPDx8+Dj5q+3v8/U2crP1fX299vf4uvt78DGzcXL0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAAFUCAgjmRpnqUwFGwhKoRgqq2YFMaRGjWA8AbZiIBbjQQ8AmmFUJEQhQGJhaKOrCksgEla+KIkYvC6SJKQOISoNSYdeIk1ayA8ExTyeR3F749CACH5BAAKAAEALAAAAAAQABAAAAVoICCKR9KMaCoaxeCoqEAkRX3AwMHWxQIIjJSAZWgUEgzBwCBAEQpMwIDwY1FHgwJCtOW2UDWYIDyqNVVkUbYr6CK+o2eUMKgWrqKhj0FrEM8jQQALPFA3MAc8CQSAMA5ZBjgqDQmHIyEAIfkEAAoAAgAsAAAAABAAEAAABWAgII4j85Ao2hRIKgrEUBQJLaSHMe8zgQo6Q8sxS7RIhILhBkgumCTZsXkACBC+0cwF2GoLLoFXREDcDlkAojBICRaFLDCOQtQKjmsQSubtDFU/NXcDBHwkaw1cKQ8MiyEAIfkEAAoAAwAsAAAAABAAEAAABVIgII5kaZ6AIJQCMRTFQKiDQx4GrBfGa4uCnAEhQuRgPwCBtwK+kCNFgjh6QlFYgGO7baJ2CxIioSDpwqNggWCGDVVGphly3BkOpXDrKfNm/4AhACH5BAAKAAQALAAAAAAQABAAAAVgICCOZGmeqEAMRTEQwskYbV0Yx7kYSIzQhtgoBxCKBDQCIOcoLBimRiFhSABYU5gIgW01pLUBYkRItAYAqrlhYiwKjiWAcDMWY8QjsCf4DewiBzQ2N1AmKlgvgCiMjSQhACH5BAAKAAUALAAAAAAQABAAAAVfICCOZGmeqEgUxUAIpkA0AMKyxkEiSZEIsJqhYAg+boUFSTAkiBiNHks3sg1ILAfBiS10gyqCg0UaFBCkwy3RYKiIYMAC+RAxiQgYsJdAjw5DN2gILzEEZgVcKYuMJiEAOwAAAAAAAAAAAA==) no-repeat -1px -1px'

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
						span.innerHTML = ':D';
						span.style.marginLeft = '10px';
						var parent = a.parentNode;
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
