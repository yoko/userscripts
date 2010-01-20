// ==UserScript==
// @name          Flickr Adds Markdown Template
// @namespace     http://codefairy.org/ns/userscripts
// @include       http://www.flickr.com/*/sizes/*
// @include       http://flickr.com/*/sizes/*
// @version       0.1
// @license       MIT License
// @work          Greasemonkey
// @work          GreaseKit
// ==/UserScript==

new function() {
	var container = document.getElementsByClassName('ThinBucket')[0];
	if (!container) return;
	var insert_point = document.getElementsByTagName('h3')[1].nextSibling;

	var base = container.getElementsByTagName('textarea')[0].innerHTML;
	var o = {
		title : /title="(.+?) by/.exec(base)[1],
		uri   : /href="(.+?)"/.exec(base)[1],
		src   : /src="(.+?)"/.exec(base)[1],
		width : /width="(.+?)"/.exec(base)[1],
		height: /height="(.+?)"/.exec(base)[1]
	};

	var label = document.createElement('p');
	label.innerHTML = '<p><b>0.</b> Post a entry using <a href="http://daringfireball.net/projects/markdown/syntax">Markdown</a> (ex. Tumblr):</p>';
	container.insertBefore(label, insert_point);
	var markdown = document.createElement('p');
	markdown.innerHTML = template([
		'<textarea wrap="virtual" style="width:520px;" rows="4" onfocus="this.select();" name="textfield">',
		'[![#{title}](#{src})](#{uri})',
		'</textarea>'
	].join(''), o);
	container.insertBefore(markdown, insert_point);

	function template(t, o) {
		return (!t || !o) ?
			t :
			t.replace(/#\{([^}]+)\}/g, function() {
				return o[arguments[1]] || '';
			});
	};
};
