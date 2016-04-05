/* global CodeMirror */

import Plugins, {PluginPromises} from '../../components/EditorPlugins/index.js';

export default function() {
	CodeMirror.registerHelper('hint', 'plugins', function(editor) { // (editor,options)

		let result = null;
		try {
			const cur = editor.getCursor();
			const token = editor.getTokenAt(cur);
			const isPageEditor = editor.getOption('isPage');

			if (token && token.type && token.type.indexOf('pubpub-markdown') !== -1) {

				const line = editor.getLine(cur.line);
				let startPos = token.start;
				let char = line.charAt(startPos);
				let completionString = '' + char;
				while (char !== '[' && startPos > 0) {
					startPos--;
					char = line.charAt(startPos);
					completionString = char + completionString;
				}

				const list = [];
				
				function addPlugin(pluginName, plugin) {
					if (plugin.Config.autocomplete === true && (!plugin.Config.page || isPageEditor)) {
						const pluginString = JSON.stringify({pluginType: pluginName});
						if (completionString.length >= 2 && plugin.charAt(0) === completionString.charAt(1)) {
							list.unshift({text: pluginString + ']]', displayText: pluginName});
						} else {
							list.push({text: pluginString + ']]', displayText: pluginName});
						}
					}
				}
				
				// for every plugin that we have loaded already
				for (const pluginName in Plugins) {
					if (Plugins.hasOwnProperty(pluginName)) {
						// add the plugin
						addPlugin(pluginName, Plugins[pluginName]);
					}
				}
				
				// for every plugin that we'll load eventually
				for (const pluginName in PluginPromises) {
					if (PluginPromises.hasOwnProperty(pluginName)) {
						console.log('waiting for async plugin', pluginName);
						PluginPromises[pluginName].then(function (plugin) {
							// when we get the plugin
							
							// add the plugin
							addPlugin(pluginName, plugin);
						});
					}
				}

				if (token.end - startPos <= 8 && completionString.indexOf(':') === -1) {
					result = {list: list, from: CodeMirror.Pos(cur.line, startPos + 1), to: CodeMirror.Pos(cur.line, token.end)};
				}
			}

		} catch (err) {
			console.warn(err);
		}
		return result;
	});


	const start = [
		{regex: /\[\[[a-zA-Z]*\]\]/, token: 'ppm ppm-autofill'}
	];

	// same structure here as above
	function pushPlugin(plugin) {
		start.push({
			regex: new RegExp('\\[\\[\{"pluginType":"' + plugin.Config.title + '".*\\]\\]'),
			token: 'ppm plugin plugin-' + plugin.Config.title
		});
	}
	
	// directly call pushPlugin for all the Plugins that we have
	for (const pluginKey in Plugins) {
		if (Plugins.hasOwnProperty(pluginKey)) {
			pushPlugin(Plugins[pluginKey]);
		}
	}
	
	// add promise callbacks for all the PluginPromises we don't have yet
	for (const pluginName in PluginPromises) {
		if (PluginPromises.hasOwnProperty(pluginName)) {
			PluginPromises[pluginName].then(function (plugin) {
				pushPlugin(plugin);
			});
		}
	}

	CodeMirror.defineSimpleMode('plugin', {
		start: start
	});

	CodeMirror.defineSimpleMode('math', {
		start: [
			{regex: /.*/, token: 'ppm ppm-math'}
		]
	});

	CodeMirror.defineSimpleMode('header', {
		start: [
			{regex: /title: .*/, token: 'pubheadertitle'}
		]
	});


	CodeMirror.defineMode('pubpubmarkdown', function(config) {
		return CodeMirror.multiplexingMode(
			CodeMirror.getMode(config, 'markdown'),
			{
				open: '[[', close: ']]',
				mode: CodeMirror.getMode(config, 'plugin'),
				innerStyle: 'pubpub-markdown',
				parseDelimiters: true
			},
			// {
			// 	open: '$', close: '$',
			// 	mode: CodeMirror.getMode(config, 'math'),
			// 	innerStyle: 'ppm-math',
			// 	parseDelimiters: false
			// }
			{
				open: 'title:', close: '\n',
				mode: CodeMirror.getMode(config, 'header'),
				parseDelimiters: true
			}


		);
	});
}
