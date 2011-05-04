// ==UserScript==
// @name          Tumblr Life
// @description   Extends Tumblr Dashboard
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.tumblr.com/*
// @version       1.0 Pre 2
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// @work          Google Chrome
// ==/UserScript==

(function(w, content_window, d) {


GM_addStyle([
	'.tumblrlife-menu { display:inline; position:relative; margin-left:10px; padding-bottom:5px; }',
	'.tumblrlife-menu > a { margin-left:0 !important; /*padding-bottom:5px;*/ }',
	'.tumblrlife-menu:hover:after { display:block; position:absolute; bottom:0; left:50%; width:0; height:0; margin-left:-5px; border-top-width:0; border-right-width:5px; border-bottom-width:5px; border-left-width:5px; border-color:#eee transparent; border-style:solid; content:""; }',
	'.tumblrlife-menu > div { display:none; position:absolute; overflow:hidden; z-index:100; width:150px; margin: 5px 0 0 -10px !important; padding:5px 0 0; font-size:12px; background-color:#eee; border-radius:3px; -webkit-box-shadow: 0 2px 2px rgba(0,0,0,0.25); box-shadow: 0 2px 2px rgba(0,0,0,0.25); }',
	'.tumblrlife-menu:hover > div { display: block; }',

	'.tumblrlife-menu.tumblrlife-reblogging:hover:after, .tumblrlife-menu.tumblrlife-reblogged:hover:after { display:none; }',
	'.tumblrlife-menu.tumblrlife-reblogging > div, .tumblrlife-menu.tumblrlife-reblogged > div { display:none; }',
	'.tumblrlife-menu.tumblrlife-reblogging a { cursor:text; }',
	'.tumblrlife-menu.tumblrlife-reblogging a:hover { color:#a8b1ba !important; }',
	'.tumblrlife-menu-processing { cursor:text; color:#333 !important; }',
	'.tumblrlife-post-processing { background-color: rgba(255, 255, 255, 0.7) !important; }',
	'.tumblrlife-post-processing .post_content { opacity: 0.4 !important; }',
	'.tumblrlife-post-processing .post_controls , .tumblrlife-post-processing .post_controls * , .tumblrlife-post-processing .post_info , .tumblrlife-post-processing .post_info * { color: #777 !important; }',
	'.tumblrlife-post-processing .arrow { opacity: 0.7 !important; }',
	'.tumblrlife-post-done .post_content { opacity: 1 !important; }',

	'.tumblrlife-menu ul { margin:0 !important; padding:0; border-bottom:1px solid #d8d6d6; }',

	'.tumblrlife-menu li, .tumblrlife-menu li a { color:#777 !important; }',
	'.tumblrlife-menu li:hover, .tumblrlife-menu li a:hover { color:#7b8994 !important; }',
	'.tumblrlife-menu li { display:block; padding:5px 10px; line-height:1; }',
	'.tumblrlife-menu li a { display:block; margin:0 !important; }',
	'.tumblrlife-menu ul > li:hover { color:#7b8994; cursor:pointer; }',
	'.tumblrlife-menu ul ul { margin:0!important; padding:0;  }',
	'.tumblrlife-menu div div { padding:3px 9px 5px; background-color:#fff; border-radius:0 0 3px 3px; }',
	'.tumblrlife-menu div div input { width:132px; height:17px; padding:0; font-size:11px; color:#888; border:none; }',

	// '.tumblrlife-success { margin-left:10px; color:#c0c8d3; }',
	'.tumblrlife-fail { color:#c00; }',

	'.tumblrlife-session-bookmark { margin-left:-85px; font:11px "Lucida Grande",Verdana,sans-serif; text-align:center; color:#C4CDD6; background:url(http://assets.tumblr.com/images/dashboard_nav_border.png) repeat-x center; }',
	'.tumblrlife-session-bookmark img { margin-right:5px; vertical-align:middle; }',
	'.tumblrlife-session-bookmark span { padding:0 10px; background-color:#2c4762; }',

	'#tumblrlife-filter { display:none; position:absolute; z-index:100; top:0; left:0; margin:0; padding:0; background-color:#1f354c; }',
	'#nav a:hover #tumblrlife-filter { display:block; }',
	'#tumblrlife-filter li { list-style:none; font-size:16px; text-align:left; }',
	'#tumblrlife-filter li a { display:block; padding:3px 8px 2px; color:#fff; text-decoration:none; text-transform: capitalize; }',
	'html:lang(ja) #tumblrlife-filter li a { font-size:14px; }',
	'#tumblrlife-filter li a:first-child { text-transform: none; }',
	'#tumblrlife-filter li a.current, #tumblrlife-filter li a:hover { color:inherit !important; }',

	'#tumblrlife-shortcut-key-help { position:relative !important; padding-left:0 !important; }',
	'#tumblrlife-shortcut-key-help kbd { margin-right:7px; padding:0 3px; color:#2c4762; background-color:#c0c8d0; border-radius:2px; }'
].join(''));


var tumblrLife = {
	position        : 0,
	data            : null,
	postsContainer  : null,
	currentPost     : null,
	dashboard       : false,
	paginate        : false,
	setup           : setup,
	handleEvent     : handleEvent,
	getId           : getId,
	eachPost        : eachPost,
	getPosition     : getPosition,
	reblog          : reblog,
	like            : like,
	reblogAddToQueue: reblogAddToQueue,
	reblogPrivate   : reblogPrivate,
	reblogDraft     : reblogDraft,
	reblogManually  : reblogManually,
	publish         : publish,
	showShortcutHelp: showShortcutHelp
};

var post_id = /post_(\d+)/;
var post_selector = 'li.post[id]:not(#new_post)';
var next_selector = '#pagination a:last-child';

function setup() {
	this.postsContainer = d.getElementById('posts');
	this.dashboard = !!this.postsContainer;

	tumblrLife.appendFilter();

	if (this.dashboard) {
		this.currentPost = this.postsContainer.querySelector(post_selector);
		this.paginate = !!d.querySelector('body.with_auto_paginate');

		var sc = d.createElement("script");
		sc.type = "text/javascript";
		sc.text = "if (!document.onkeydown) start_observing_key_commands(" +
			(this.paginate ? "true" : "false") + ")";
		d.body.appendChild(sc);

		d.addEventListener('keydown', this, false);
		this.postsContainer.addEventListener('DOMNodeInserted', this, false);
		this.showShortcutHelp();

		this.eachPost(function(post) {
			new tumblrLife.Menu(post);
		});

		tumblrLife.fixPagenation.setup();
	}
}

var shortcuts = {
	/* J */ 74: 'getPosition',
	/* K */ 75: 'getPosition',
	/* R */ 82: 'reblog',
	/* A */ 65: 'like',
	/* Q */ 81: 'reblogAddToQueue',
	/* W */ 87: 'reblogPrivate',
	/* D */ 68: 'reblogDraft',
	/* E */ 69: 'reblogManually',
	/* P */ 80: 'publish'
};

function handleEvent(e) {
	switch (e.type) {
	case 'keydown':
		if (!e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
			var which = e.which,
				command = shortcuts[e.which];
			command && tumblrLife[command](e);
		}
		break;

	case 'DOMNodeInserted':
		var target = e.target;
		if (e.target.localName == 'li' && getId(target)) {
			new tumblrLife.Menu(target);
		}
		break;
	}
}

function eachPost(callback) {
	var posts = this.postsContainer.querySelectorAll(post_selector);
	for (var i = 0, post; post = posts[i]; ++i) {
		var ret = callback(post, i);
		if (ret === false) {
			break;
		}
	}
}

function getId(container) {
	return (post_id.exec(container.id) || [])[1];
}

function getStyle(element, property, to_number) {
	var style = d.defaultView.getComputedStyle(element);
	if (style && property) {
		style = style[property];
		to_number && (style = parseFloat(style));
	}
	return style;
}

function getPosition() {
	var posts = this.postsContainer.querySelectorAll(post_selector),
		y = w.scrollY + 7;
	for (var i = 0, post; post = posts[i]; ++i) {
		if (post.offsetTop == y) {
			this.position = i;
			this.currentPost = posts[i];
			break;
		}
	}
}

function showShortcutHelp() {
	var container = d.getElementById('right_column');
	if (container) {
		var div = d.createElement('div');
		div.id = 'tumblrlife-shortcut-key-help';
		div.className = 'dashboard_nav_item';

		var li = [
			'<li><kbd>R</kbd>reblog</li>',
			'<li><kbd>A</kbd>like, unlike</li>',
			'<li><kbd>Q</kbd>add to queue</li>',
			'<li><kbd>W</kbd>private</li>',
			'<li><kbd>D</kbd>save as draft</li>',
			'<li><kbd>E</kbd>reblog manually</li>',
			'<li><kbd>P</kbd>publish</li>'
		];
		div.innerHTML = [
			'<div class="dashboard_nav_title">Shortcut Keys</div>',
			'<ul class="dashboard_subpages">',
			li.join(''),
			'</ul>'
		].join('');

		container.appendChild(div);
	}
}

function reblog() {
	click(this.currentPost.querySelector('a.tumblrlife-reblog'));
}

function like() {
	click(this.currentPost.querySelector('a.like_button'));
}

function reblogAddToQueue() {
	click(this.currentPost.querySelector('li.tumblrlife-reblog-add-to-queue'));
}

function reblogPrivate() {
	click(this.currentPost.querySelector('li.tumblrlife-reblog-private'));
}

function reblogDraft() {
	click(this.currentPost.querySelector('li.tumblrlife-reblog-draft'));
}

function reblogManually() {
//	click(this.currentPost.querySelector('a.tumblrlife-reblog-manually'));
	(function(a) {
		if (a && a.href) w.open(a.href)
	})(this.currentPost.querySelector('a.tumblrlife-reblog-manually'));
}

function publish() {
	click(this.currentPost.querySelector('a.tumblrlife-assort-publish'));
}


tumblrLife.fixPagenation = {
	setup       : fixPagenationSetup,
	process     : fixPagenationProcess,
	autoPagerize: fixPagenationAutoPagerize
};

var fix_pagenation_show_page = /(?:\/tumblelog\/[-\w]+)?\/show\/\w+/;

function fixPagenationSetup() {
	if (fix_pagenation_show_page.test(location.pathname)) {
		this.process(d, location.href);

		window.AutoPagerize ?
			this.autoPagerize() :
			window.addEventListener('GM_AutoPagerizeLoaded', this.autoPagerize, false);

		if (tumblrLife.paginate) {
			execute(function() {
				if (window.next_page) {
					var next = document.querySelector('#pagination a:last-child');
					next && (window.next_page = next.href);

					var __process_auto_paginator_response = window._process_auto_paginator_response;
					window._process_auto_paginator_response = function(transport) {
						history.replaceState('auto_paginator_response', '', window.next_page);

						__process_auto_paginator_response(transport);

						var post = document.querySelector('li.post[id]:not(#new_post):last-child');
						if (post) {
							var path = /(?:\/tumblelog\/[-\w]+)?\/show\/\w+/.exec(location.href),
								id = /post_(\d+)/.exec(post.id)[1];
							window.next_page = transport.responseText.match('id="next_page_link" href="') ?
								path[0] + '?offset=' + id :
								false;
						}
					};
				}
			});
		}
	}
	else if (tumblrLife.paginate) {
		execute(function() {
			var __process_auto_paginator_response = window._process_auto_paginator_response;
			window._process_auto_paginator_response = function(transport) {
				history.replaceState('auto_paginator_response', '', window.next_page);

				__process_auto_paginator_response(transport);
			};
		});
	}
}

function fixPagenationProcess(target, url) {
	var post = target.querySelector(post_selector + ':last-child'),
		path, pagination;
	if (post) {
		path = fix_pagenation_show_page.exec(url);
		pagination = target.querySelector(next_selector);
		pagination.href = path[0] + '?offset=' + getId(post);
	}
}

function fixPagenationAutoPagerize() {
	window.AutoPagerize.addDocumentFilter(tumblrLife.fixPagenation.process);
}


// tumblrLife.config = {
// 	data: null,
// 	load: configLoad,
// 	save: configSave
// };
// 
// function configLoad(key) {
// 	if (!this.data) {
// 		
// 		
// 
// 
// 		var json = content_window.localStorage.tumblrLife,
// 			config = json ? JSON.parse(json) : {};
// 
// 		
// 		
// 	}
// 
// 
// 	if (this.data) {
// 		var json = content_window.localStorage.tumblrLife,
// 			config = json ? JSON.parse(json) : {};
// 		// log('load config', data);
// 	}
// 
// 	var json = unsafeWindow.localStorage.tumblr_life_config;
// 
// 	this.data
// }
// 
// function configSave(config) {
// 	var json = JSON.stringify(extend(this.data, config));
// 	content_window.localStorage.tumblrLife = json;
// }


tumblrLife.appendFilter = appendFilter;

filters = ['dashboard', 'text', 'photos', 'quotes', 'links', 'chats', 'audio', 'videos'];
current_filter = (/^\/show\/([^\/]+)/.exec(location.pathname) || [])[1] || 'dashboard';

function appendFilter() {
	var a = d.querySelector('#nav > a');
	if (!a) {
		return;
	}

	var li = [],
		i = 0, filter, title,
		ul, style,
		nav = d.getElementById('nav'),
		target = nav.querySelector('.nav_item.active');
	for (; filter = filters[i]; ++i) {
		href = (filter == 'dashboard' ? '' : 'show/') + filter;
		klass = filter == current_filter ? ' class="current"' : '';
		title = filter == 'dashboard' ? a.querySelector('div').innerHTML : filter;
		li[i] = '<li><a href="/' + href + '"' + klass + '>' + title + '</a></li>';
	}

	ul = d.createElement('ul');
	ul.id = 'tumblrlife-filter';
	ul.innerHTML = li.join('');
	target && (ul.style.backgroundColor = getStyle(target, 'backgroundColor'));
	a.appendChild(ul);
}


tumblrLife.Menu = menuInitialize;
tumblrLife.Menu.prototype = {
	container      : null,
	reblogContainer: null,
	menuContainer  : null,
	id             : null,
	postURL        : null,
	reblogging     : false,
	handleEvent    : menuHandleEvent,
	append         : menuAppend,
	reblog         : menuReblog,
	assort         : menuAssort,
	reblogFail     : menuReblogFail,
	query          : menuQuery
};

function menuInitialize(container) {
	this.container = container;
	this.id = tumblrLife.getId(container);

	this.append();
}

function menuHandleEvent(e) {
	if (e.target.localName == 'input') {
		return;
	}
	switch (e.type) {
	case 'click':
		if (this.reblogging) {
			e.preventDefault();
		}
		else {
			var cmd = e.target.className.split('-');
			if (cmd.shift() != 'tumblrlife') break;
			var mode = cmd.shift();
			var state = cmd.join('-');
			if (state != 'manually') {
				e.preventDefault();
				if (mode == 'reblog' || mode == 'assort')
					this[mode](state, e.target);
			}
		}
		break;
	}
}

var menu_template_menu = [
	'<ul>',
	'<li class="tumblrlife-reblog-add-to-queue">add to queue</li>',
	'<li class="tumblrlife-reblog-private">private</li>',
	'<li class="tumblrlife-reblog-draft">draft</li>',
	'<li><a href="${href}" target="_blank" class="tumblrlife-reblog-manually">reblog manually</a></li>',
	'</ul>',
	'<div>',
	'<input type="text" value="" placeholder="tags" class="tumblrlife-tags" onkeydown="event.stopPropagation()"/>',
	'</div>'
].join('');

function menuAppend() {
	menuAppendDsbd.apply(this) || menuAppendOther.apply(this);
}

function menuAppendDsbd() {
	var original = this.reblogContainer = this.container.querySelector('div.post_controls > a[href^="/reblog/"]'),
		container, div;
	if (original) {
		this.postURL = original.href;
		container = this.menuContainer = d.createElement('div');
		container.className = 'tumblrlife-menu';
		container.addEventListener('click', this, false);

		div = d.createElement('div');
		div.innerHTML = template(menu_template_menu, {
			href: this.postURL
		});

		container.appendChild(div);
		original.parentNode.insertBefore(container, original);
		container.insertBefore(original, div);
		original.className = 'tumblrlife-reblog';
	}
	return original;
}

function menuAppendOther() {	// drafts, queue
	var ctrls = this.reblogContainer = this.container.querySelectorAll(
			'div.post_controls > a');
	if (!ctrls) return;
	var id = this.id;
	for(var i = 0; i < ctrls.length; i++) {
		if (!ctrls[i]) continue;
		switch (ctrls[i].textContent.toLowerCase()) {
		case 'publish':
			ctrls[i].onclick = undefined;
			ctrls[i].className = 'tumblrlife-assort-publish';
			ctrls[i].addEventListener('click', this, false);
			break;
		}
	}
}

function menuReblog(state) {
	var self = this,
		menu_container = this.menuContainer,
		fail = function() { return self.reblogFail.apply(self) };

	if (this.reblogging) {
		return;
	}

	this.reblogging = true;
	menu_container.className = 'tumblrlife-menu tumblrlife-reblogging';
	this.reblogContainer.innerHTML = 'reblogging...';
	this.container.className += " tumblrlife-post-processing";

	get(this.postURL,
		function() {
			post(self.postURL, self.query(this.responseText, state),
				function(data) {
					var id = self.id;
					self.reblogging = false;
					menu_container.removeEventListener('click', self, false);
					menu_container.className = 'tumblrlife-menu tumblrlife-reblogged';
					menu_container.innerHTML = 'reblogged' + (state ? {
						'add-to-queue': ' (queue)',
						'private'     : ' (private)',
						'draft'       : ' (draft)'
					}[state] : '');

					execute('increment_note_count(' + id + ')');

					if (!state) {
						get('/dashboard', function() {
							var container = createDocumentFromString(this.responseText)
								.querySelector('div.post_info > a[href*="/post/' + id + '"]')
								.parentNode.parentNode;

							menu_container.innerHTML = '<a href="' + container.querySelector('a.permalink').href + '" target="_blank">reblogged</a>';
						});
					}
					self.container.className += " tumblrlife-post-done";
				},
				fail
			);
		},
		fail
	);
}

function menuReblogFail() {
	this.reblogging = false;
	this.menuContainer.className = 'tumblrlife-menu';
	this.reblogContainer.innerHTML = '<span class="tumblrlife-fail">reblog</span>';
	if (confirm('Reblog failed. Open the reblog page?')) {
		w.open(this.postURL);
	}
	this.container.className = (function(c) {
			var i, a = c.split(' '), r = [];
			for (i = 0; i < a.length; i++)
				if (a[i] && a[i] != 'tumblrlife-post-processing')
					r.push(a[i]);
			return r.join(' ');
	})(this.container.className);
}

function menuQuery(html, state) {
	var options, queries = {}, i, o;

	options = createDocumentFromString(html).querySelectorAll('#edit_post input, #edit_post textarea, #edit_post select');
	for (i = 0; o = options[i]; ++i) {
		if (o.type) {
			switch (o.type.toLowerCase()) {
			case 'checkbox':
			case 'radio':
				if (o.checked) queries[o.name] = o.value;
				break;
			default:
				queries[o.name] = o.value;
			}
		}
	}

	queries['post[state]'] = {
		'add-to-queue': '2',
		'private'     : 'private',
		'draft'       : '1'
	}[state] || '0';

	queries['post[tags]'] = this.menuContainer.querySelector('input.tumblrlife-tags').value;
	delete queries['preview_post'];

	trimReblogInfo(queries);

	return queries;
}

function menuAssort(state, e) {
	var self = this,
		fail = function() { return self.reblogFail.apply(self) };
	if (this.reblogging) {
		return;
	}
	this.reblogging = true;
	e.className = 'tumblrlife-menu-processing';
	e.innerHTML = 'processing...';
	this.container.className += " tumblrlife-post-processing";
	var assort_form = document.getElementById(state + '_post_' + this.id);
	var query = {}, i, fe;
	for (i = 0; fe = assort_form.elements[i]; ++i) {
		query[fe.name] = fe.value;
	}
	post(assort_form.action, query,
		function(data) {
			var id = self.id;
			self.reblogging = false;
			self.container.parentNode.removeChild(self.container);
		},
		fail
	);
}


// https://github.com/to/tombloo/blob/master/xpi/chrome/content/library/20_Tumblr.js
function trimReblogInfo(queries) {
	function trimQuote(entry) {
		entry = entry.replace(/<p><\/p>/g, '').replace(/<p><a[^<]+<\/a>:<\/p>/g, '');
		entry = (function loop(_, contents) {
			return contents.replace(/<blockquote>(([\n\r]|.)+)<\/blockquote>/gm, loop);
		})(null, entry);
		return entry.trim();
	}

	switch (queries['post[type]']) {
	case 'link':
		queries['post[three]'] = trimQuote(queries['post[three]']);
		break;
	case 'regular':
	case 'photo':
	case 'video':
		queries['post[two]'] = trimQuote(queries['post[two]']);
		break;
	case 'quote':
		queries['post[two]'] = queries['post[two]'].replace(/ \(via <a.*?<\/a>\)/g, '').trim();
		break;
	}
}

var template_variable = /\$\{([^\}]+)\}/g;

function template(str, data) {
	return str.replace(template_variable, function(_, v) {
		return data[v] ? data[v] : '';
	});
}

function param(data) {
	var ret = [], k, v;
	for (k in data) {
		v = data[k];
		v && ret.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
	}
	return ret.join('&');
}

function get(url, onload, onerror) {
	ajax('GET', url, null, onload, onerror);
}

function post(url, data, onload, onerror) {
	ajax('POST', url, data, onload, onerror);
}

function ajax(method, url, data, onload, onerror) {
	data = data ? param(data) : data;

	var xhr = new XMLHttpRequest;
	xhr.open(method, url, true);
	xhr.onload = onload;
	xhr.onerror = onerror;
	if (method == 'POST') {
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	}
	xhr.send(data);
}

function execute(code) {
	typeof code == 'function' && (code = '(' + code.toString() + ')()');
	location.href = 'javascript:' + code;
}

function click(target) {
	if (target) {
		var e = d.createEvent('MouseEvent');
		e.initMouseEvent('click', true, true, w, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		target.dispatchEvent(e);
	}
}

// http://gist.github.com/198443
function createDocumentFromString(source){
	var doc;
	if (d.implementation.createHTMLDocument) {
		doc = d.implementation.createHTMLDocument('title');
	} else {
		doc = d.cloneNode(false);
		if (doc) {
			doc.appendChild(doc.importNode(d.documentElement, false));
		} else {
			doc = d.implementation.createDocument(null, 'html', null);
		}
	}
	var range = d.createRange();
	range.selectNodeContents(d.documentElement);
	var fragment = range.createContextualFragment(source);
	var headChildNames = {title: true, meta: true, link: true, script: true, style: true, /*object: true,*/ base: true/*, isindex: true,*/};
	var child,
		head = doc.getElementsByTagName('head')[0] || doc.createElement('head'),
		body = doc.getElementsByTagName('body')[0] || doc.createElement('body');
	while ((child = fragment.firstChild)) {
		if (
			(child.nodeType === doc.ELEMENT_NODE && !(child.nodeName.toLowerCase() in headChildNames)) ||
			(child.nodeType === doc.TEXT_NODE && (/\S/.test(child.nodeValue)))
		)
			break;
		head.appendChild(child);
	}
	body.appendChild(fragment);
	doc.documentElement.appendChild(head);
	doc.documentElement.appendChild(body);
	return doc;
}


tumblrLife.setup();


})(this, this.unsafeWindow || this, document);
