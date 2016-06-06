/* auto-require-tags
 * https://github.com/fengzilong/auto-require-tags
 *
 * Copyright (c) 2015 fengzilong
 * Licensed under the MIT license.
 */
var findRequires = require('requires');
var _ = require('lodash');
var CompositeDisposable = require('atom').CompositeDisposable;

module.exports = {
	config: {
		prefix: {
			type: 'string',
			default: '',
			title: 'path prefix for every required tag',
			description: 'such as "ui/"'
		},
		filters: {
			type: 'string',
			default: '',
			title: 'exclude tags containing following word',
			description: 'such as "x- y-", use whitespace as separator'
		}
	},
	subscriptions: null,
	activate: function( state ){
		var self = this;
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(
			atom.commands.add(
				'atom-workspace',
				{
					'auto-require-tags:require': function(){
						return self.requireAllComponent();
					}
				}
			)
		)
	},
	requireAllComponent: function(){
		var atomConfig = atom.config.get('auto-require-tags');

		var prefix = atomConfig.prefix;
		var filters = atomConfig.filters.split(' ');

		var editor = atom.workspace.getActivePaneItem();
		var editorContent = editor.getText();
		var HTML_TAGS = /<([-\w]+)\s*([^"'\/>]*(?:(?:"[^"]*"|'[^']*'|\/[^>])[^'"\/>]*)*)(\/?)>/g;

		// find tags
		var tag = null;
		var tags = [];
		while( ( tag = HTML_TAGS.exec( editorContent ) ) !== null ) {
			var tagName = tag[ 1 ];
			if( tagName.indexOf( '-' ) > 0 ) {
				var isValid = true;
				for( var i = 0, len = filters.length; i < len; i++ ){
					if( filters[ i ] !== '' && tagName.indexOf( filters[ i ] ) >= 0 ){
						isValid = false;
					}
				}

				if( isValid ){
					tags.push( tagName );
				}
			}
		}

		tags = _.uniq( tags );

		// add prefix
		tags = _.map(tags, function( tag, i ){
			return prefix + tag;
		});

		// find existed requires
		var existedRequires = findRequires( editorContent );
		existedRequires = _.pluck( existedRequires, 'path' );

		// make diff
		tags = _.difference( tags, existedRequires );

		if( tags.length === 0 ){
			return;
		}

		var requires = [];
		tags.forEach(function( v, k ){
			requires.push(
				'require(\'' + v + '\');'
			)
		});

		// add requires to top
		editor.setTextInBufferRange(
			[[0, 0], [0, 0]],
			( requires.join( '\n' ) ) + '\n\n'
		)
	},
	deactivate: function(){

	},
	serialize: function(){

	}
};
