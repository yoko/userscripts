// ==UserScript==
// @name          Tumblr Life
// @description   Extends Tumblr dashboard: Adds quick reblog buttons, shortcut keys (requires Minibuffer and LDRize) and session bookmarks.
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.tumblr.com/*
// @version       0.3.3
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// @work          Google Chrome
// ==/UserScript==

new function() {

const BOOKMARK_SESSION = 5;

if (typeof unsafeWindow == 'undefined') unsafeWindow = window;

// prototype.js breakes native JSON
if (String.prototype.evalJSON && Object.toJSON)
	unsafeWindow.JSON = {
		parse: function(str) { return str.evalJSON(); },
		stringify: function(obj) { return Object.toJSON(obj); }
	};


GM_addStyle([
	'.tumblr-life-item { display:inline; position:relative; margin-left:10px; padding-bottom:5px; }',
	'.tumblr-life-item > a { margin-left:0 !important; }',
	'.tumblr-life-item > ul { display:none; position:absolute; z-index:100; left:0; top:8px; margin-left:-10px !important; padding:5px 0 0; font-size:12px; background-color:#f5f5f5; border-radius:5px; -moz-border-radius:5px; }',
	'.tumblr-life-item a.tumblr-life-reblogging { cursor:text; }',
	'.tumblr-life-item a.tumblr-life-reblogging:hover { color:#a8b1ba !important; }',
	'.tumblr-life-item li { display:block; padding:5px 10px; line-height:1; }',
	'.tumblr-life-item li:first { border-top:none; }',
	'.tumblr-life-item li a { display:block; margin:0!important; }',
	'.tumblr-life-item li input { font-size:12px; }',
	'.tumblr-life-item li input[type="text"] { width:150px; font-size:11px; }',
	'.tumblr-life-item > ul > li:hover { color:#7b8994; cursor:pointer; }',
	'.tumblr-life-item ul ul { margin:5px 0 0!important; padding:5px 10px; font-size:11px; background-color:#ebebeb; border-radius:0 0 5px 5px; -moz-border-radius:0 0 5px 5px; }',
	'.tumblr-life-item ul ul li { padding:0; }',
	'.tumblr-life-item ul ul li label:hover { color:#7b8994; }',
	'.tumblr-life-success { margin-left:10px; color:#c0c8d3; }',
	'.tumblr-life-fail { color:#c00; }',
	'.tumblr-life-session-bookmark { margin-left:-85px; font:11px "Lucida Grande",Verdana,sans-serif; text-align:center; color:#C4CDD6; background:url(http://assets.tumblr.com/images/dashboard_nav_border.png) repeat-x center; }',
	'.tumblr-life-session-bookmark img { margin-right:5px; vertical-align:middle; }',
	'.tumblr-life-session-bookmark span { padding:0 10px; background-color:#2c4762; }'
].join(''));


var TumblrLife = {
	setup: function() {
		var self = this;
		var posts = $X('id("posts")')[0];
		if (!posts) return;

		posts.addEventListener('DOMNodeInserted', this.setup_handler, false);
		var li = $X('./li', posts);
		li.forEach(function(li) {
			self.setup_handler({ target: li });
		});
		TumblrLife.sessionBookmark.setup(li[1]);
		TumblrLife.minibuffer.setup();
	},

	setup_handler: function(e) {
		var target = e.target;
		var tag = target.localName;
		if (tag == 'li' && target.id && target.id != 'new_post') {
			new TumblrLife.ReblogMenu(target);
			TumblrLife.sessionBookmark.check(target);
		}
	}
};


TumblrLife.sessionBookmark = {
	setup: function(entry) {
		if (location.pathname == '/dashboard') {
			var id = entry.id.replace('post', '');
			var data = this.load();
			if (!data.length || id != data[0].id) {
				data.unshift({
					id  : id,
					date: +(new Date)
				});
				data.length = BOOKMARK_SESSION;
				this.save(data);
			}
		}
	},

	check: function(entry) {
		if (!(/^\/dashboard/.test(location.pathname))) return;
		var id = entry.id.replace('post', '');
		var sessions = this.load();
		for (var i = 0, session; session = sessions[i]; i++) {
			if (id == session.id)
				this.show(entry, new Date(session.date));
		}
	},

	save: function(data) {
		var json = JSON.stringify(data);
		GM_log('save session bookmark: '+json);
		unsafeWindow.localStorage.tumblr_life_session_bookmark = json;
	},

	load: function() {
		var json = unsafeWindow.localStorage.tumblr_life_session_bookmark;
		GM_log('load session bookmark: '+json);
		return (json) ? JSON.parse(json) : [];
	},

	show: function(entry, date) {
		var text = 'Session bookmarked at '+this.format_date(date);

		var li = document.createElement('li');
		li.className = 'tumblr-life-session-bookmark';
		li.innerHTML = [
			'<p>',
			'<span>',
			'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAANCAYAAAB2HjRBAAAAV0lEQVQoz2NgoDbYduDWf3Q8qpnWmnccukO+5iXrT5CuedeRe/+nLNjx3z0i+yaIBvGJ1tw/e9M/55DUvVyy2qYgGsQnWrOisctPGWNHcxAbRIP4VE/GAIdHoPagSIsVAAAAAElFTkSuQmCC" alt="" width="15" height="13"/>',
			text,
			'</span>',
			'</p>'
		].join('');
		$X('id("posts")')[0].insertBefore(li, entry);
	},

	format_date: function(date) {
		var y = date.getFullYear();
		var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
		var d = date.getDate();
		d = d+(['st', 'nd', 'rd', 'th'][(/(1?\d)$/.exec(d))[1] - 1] || 'th');
		var h = date.getHours();
		var ampm = ['am', 'pm'][Number(h >= 12)];
		h = h % 12;
		var min = date.getMinutes();
		if (min < 10) min = '0'+min;
		return m+' '+d+', '+y+' '+h+':'+min+ampm;
	}
};


TumblrLife.minibuffer = {
	reblogging: {},

	setup: function() {
		if (!window.Minibuffer) return;

		window.Minibuffer.addShortcutkey({
			key        : 'r',
			description: 'Reblog',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-node | reblog | clear-pin');
			}
		});
		window.Minibuffer.addShortcutkey({
			key        : 'q',
			description: 'Reblog add to queue',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-node | reblog -q | clear-pin');
			}
		});
		window.Minibuffer.addShortcutkey({
			key        : 'w',
			description: 'Reblog private',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-node | reblog -p | clear-pin');
			}
		});
		window.Minibuffer.addShortcutkey({
			key        : 'e',
			description: 'Reblog manually',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-node | reblog -m | clear-pin');
			}
		});
		window.Minibuffer.addShortcutkey({
			key        : 'l', // XXX: this keybind conflicts with xLDRize
			description: 'Like',
			command    : function() {
				window.Minibuffer.execute('pinned-or-current-node | like | clear-pin');
			}
		});
		window.Minibuffer.addCommand({
			name   : 'reblog',
			command: function(stdin) {
				var args = this.args;
				var entries = stdin, entry;
				if (!stdin.length) {
					entry = window.Minibuffer.execute('current-node');
					if (entry) entries.push(entry);
					else return;
				}
				for (var i = 0, l = entries.length; i < l; i++) {
					entry = entries[i];
					var item;
					switch (args[0]) {
						case '-q':
							item = $X('.//li[@class="tumblr-life-add-to-queue"]', entry)[0];
							break;
						case '-p':
							item = $X('.//li[@class="tumblr-life-private"]', entry)[0];
							break;
						case '-m':
							item = $X('.//a[@class="tumblr-life-reblog-manually"]', entry)[0];
							break;
						default:
							item = $X('.//div[@class="tumblr-life-item"]/a[text()="reblog"]', entry)[0];
					}
					if (item) {
						var id = entry.id;
						TumblrLife.minibuffer.reblogging[id] = true;
						window.Minibuffer.status('reblog'+id, 'Reblogging...');
						click(item);
					}
				}
				return stdin;
			}
		});
		window.Minibuffer.addCommand({
			name   : 'like',
			command: function(stdin) {
				if (!stdin.length) {
					stdin = window.Minibuffer.execute('current-node');
				}
				var items = $X('.//input[contains(concat(" ",@class," "), " like_button ")]', stdin[0]);
				for (var i = 0; i < items.length; i++) {
					if (!items[i].clientWidth) continue;
					items[i].click();
					return stdin;
				}
				return stdin;
			}
		});
	},

	complete: function(id) {
		var reblogging = this.reblogging;
		if (window.Minibuffer && reblogging[id]) {
			window.Minibuffer.status('reblog'+id, 'Reblogged', 100);
			delete reblogging[id];
		}
	}
};


TumblrLife.ReblogMenu = function(container) {
	this.container = container;
	this.show();
};

TumblrLife.ReblogMenu.prototype = {
	reblogging: false,
	reblogged : false,
	container : null,
	menu      : null,
	label     : null,
	itemlist  : null,

	show: function() {
		var self = this;
		var link = $X('./div[@class="post_controls"]/a[text()="reblog"]', this.container)[0];
		if (!link) return;
		var href = link.href;
		var div = this.menu = document.createElement('div');
		div.className = 'tumblr-life-item';
		var a = this.label = document.createElement('a');
		a.href = href;
		a.innerHTML = 'reblog';
		div.appendChild(a);

		var ul = this.itemlist();
		div.appendChild(ul);

		a.addEventListener('click', function(e) {
			e.preventDefault();
			self.reblog();
		}, false);
		var timer;
		div.addEventListener('mouseover', function(e) {
			if (self.reblogging) return;
			ul.style.display = 'block';
		}, false);
		div.addEventListener('mouseout', function(e) {
			ul.style.display = 'none';
		}, false);
		
		link.parentNode.replaceChild(div, link);
	},

	itemlist: function(container) {
		var self = this;
		var ul = this.itemlist = document.createElement('ul');
		ul.innerHTML = [
			'<li class="tumblr-life-add-to-queue">add to queue</li>',
			'<li class="tumblr-life-private">private</li>',
			'<li><a href="'+this.label.href+'" target="_blank" class="tumblr-life-reblog-manually">reblog manually</a></li>',
			'<ul class="option">',
			'<li><input type="text" value="" placeholder="tags" class="tumblr-life-tags"/></li>',
			'<li><label><input type="checkbox" value="" class="tumblr-life-twitter"/> Send to Twitter</label></li>',
			'</ul>'
		].join('');
		$X('./li[@class]', ul).forEach(function(li) {
			var klass = li.className;
			var filter = self['filter_'+klass.slice(12)];
			if (filter)
				li.addEventListener('click', function() {
					self.reblog(filter);
				}, false);
		});
		return ul;
	},

	filter: function(param) {
		switch (param.name) {
			case 'preview_post': return false;
			case 'post[tags]':
				param.value = $X('.//input[@class="tumblr-life-tags"]', this.itemlist)[0].value;
				return true;
			case 'send_to_twitter':
				var value = $X('.//input[@class="tumblr-life-twitter"]', this.itemlist)[0].checked;
				return (value) ? !!(param.value = '1') : false;
			default: return true;
		}
	},

	'filter_private': function(param) {
		if (param.name == 'post[state]') param.value = 'private';
	},

	'filter_add-to-queue': function(param) {
		if (param.name == 'post[state]') param.value = '2';
	},

	reblog: function(filter) {
		var self = this;
		var label = this.label;
		var url = label.href;
		if (this.reblogging || this.reblogged) return;

		this.reblogging = true;
		label.className = 'tumblr-life-reblogging';
		label.innerHTML = 'reblogging...';
		this.itemlist.style.display = 'none';
		
		var xhr = new XMLHttpRequest;
		xhr.open('GET', url, true);
		xhr.onload = function() {
			var params = self.param(xhr.responseText, filter);

			xhr.open('POST', url, true);
			xhr.onload = function() {
				self.reblogging = false;
				self.reblogged = true;
				label.className = '';
				var span = document.createElement('span');
				span.className = 'tumblr-life-success';
				span.innerHTML = 'reblogged';
				var div = self.menu;
				div.parentNode.replaceChild(span, div);
				TumblrLife.minibuffer.complete(self.container.id);
			};
			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			xhr.send(params);
		};
		xhr.onerror = function() {
			self.reblogging = false;
			label.className = '';
			alert('Reblog Failed: '+e.target.status);
			label.innerHTML = '<span class="tumblr-life-fail">reblog</span>';
		};
		xhr.send();
	},

	param: function(html, filter) {
		var self = this;
		var params = $X(
			'id("edit_post")//*[name()="input" or name()="textarea" or name()="select"]',
			createDocumentFromString(html)
		);
		var q = [];
		params.forEach(function(p) {
			var param = { name: p.name, value: p.value };

			if (self.filter(param) !== false) {
				if (typeof filter != 'function' || filter(param) !== false)
					q.push(encodeURIComponent(param.name)+'='+encodeURIComponent(param.value));
			}
		});
		return q.join('&');
	}
};


TumblrLife.setup();


function extend(target, options) {
	for (var k in options) target[k] = options[k];
	return target;
}

function click(target) {
	var e = document.createEvent('MouseEvent');
	e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	target.dispatchEvent(e);
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
