define([
	'jquery',
	'aloha',
	'block/blockmanager',
	'block/block',
	'aloha/plugin',
	'ui/ui',
	'ui/button',
	'ui/menuButton'
], function(
	$,
	Aloha,
	BlockManager,
	Block,
	Plugin,
	Ui,
	Button,
	MenuButton
) {
	'use strict';
	var defaultSettings = {
		'macroRender': '/sparkalohasprint/admin/macro/render/token_filter', //[site:name]/context
		'macroList': '/sparkalohasprint/admin/macro/list/token_filter' //context
	};
	var settings = Aloha.settings.plugins['token-filter'] || defaultSettings;
	var LabelMenuButton = null;
	var menu = [];

	function clean(dom) {
		dom.find('.edit-editable-macro[data-macro-provider="token_filter"]').each(function(){
			var macro = $(this);
			var valueElem = macro.children('.aloha-token-value');
			if (!valueElem.length) {
				return;
			}
			var value = valueElem.text();
			var token = macro.children('select').val();
			macro.attr('data-macro', '[' + token + ']');
			macro.text(value);
		});
	}

	Plugin.create('token-filter', {
		makeClean: function(dom) {
			clean(dom);
		}
	});

	$.get(settings['macroList'] + '/context', function(data) {
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				for (var subKey in data[key]) {
					if (data[key].hasOwnProperty(subKey)) {
						menu.push({
							// TODO we should use data[key][subKey].name instead
							text: key + ":" + subKey
						});
					}
				}
			}
		}
	}, 'json');

	Ui.adopt('TokenFilterInsert', Button, {
		tooltip: 'Insert Token',
		text: 'Token',
		click: function() {
		}
	});

	Aloha.bind('aloha-editable-activated', function(){
		var macros = $('.edit-editable-macro[data-macro-provider="token_filter"]');
		macros.each(function(){
			$(this).alohaBlock({
				'aloha-block-type': 'TokenFilterBlock'
			});

		});
	});

	Aloha.bind('aloha-editable-deactivated', function(event, message){
		clean(message.editable.obj);
	});

	BlockManager.bind('block-selection-change', function(highlightedBlocks){
	});

	BlockManager.bind('block-activate', function(activatedBlocks) {
		var $element = activatedBlocks[0].$element;
		$('.aloha-token-value', $element).hide();
		$('.aloha-token-select', $element).show();
	});

	BlockManager.bind('block-deactivate', function(deactivatedBlocks) {
		var $element = deactivatedBlocks[0].$element;
		$('.aloha-token-select', $element).hide();
		$('.aloha-token-value', $element).show();
	});


	var TokenFilterBlock = Block.AbstractBlock.extend({
		title: 'Token',
		menuButton: null,
		init: function ($element, postProcessCallback) {
			if (this._initialized) {
				postProcessCallback();
				return;
			}
			if ($element.children('.aloha-token-value').length) {
				postProcessCallback();
				return;
			}

			var value = $('<span>', {'class': 'aloha-token-value'}).append($element.contents());
			$element.prepend(this._select($element));
			$element.append(value);
			postProcessCallback();
		},
		_select: function($element) {
			var token = $element.data('macro');
			var select = $('<select>', {'class': 'aloha-token-select'});
			var selected = false;
			for (var i = 0; i< menu.length; i++) {
				var option = $('<option>', {'text': menu[i].text});
				if ('[' + menu[i].text + ']' === token) {
					option.prop('selected', true);
					selected = true;
				}
				select.append(option);
			}
			if (!selected) {
				// TODO current-user:name for example does not appear in the list
				option = $('<option>', {'text': token.substring(1, token.length - 1)});
				option.prop('selected', true);
				select.prepend(option);
			}
			select.css({'display': 'inline-block'});
			select.change(function(){
				var sel = $(this).val();
				$.get(settings['macroRender'] + '/[' + sel + ']/context', function(data) {
					var newValue = data['[' + sel + ']'];
					if (null == newValue || newValue === '[' + sel + ']') {
						console.log('token_filter: no data for ' + sel);
						newValue = 'XX';
					}
					$('.aloha-token-value', $element).text(newValue);
				}, 'json');
			});
			// Initially hidden!
			select.hide();
			return select;
		},
		renderBlockHandlesIfNeeded: function() {
			// No block handles!
		},
		update: function ($element, postProcessCallback) {
			postProcessCallback();
		}
	});

	BlockManager.registerBlockType('TokenFilterBlock', TokenFilterBlock);
});
