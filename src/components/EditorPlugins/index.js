// Page-only Plugins
import pubListPlugin from './pubListPlugin';
import collectionListPlugin from './collectionListPlugin';
import linkPlugin 	from './linkPlugin';
import searchPlugin 	from './searchPlugin';

// Async plugins
import ImagePlugin from './AsyncPlugins/imagePlugin';
import VideoPlugin from './AsyncPlugins/videoPlugin';
import QuotePlugin from './AsyncPlugins/quotePlugin';
import CitePlugin from './AsyncPlugins/citePlugin';
import IFramePlugin from './AsyncPlugins/iframePlugin';
import FootnotePlugin from './AsyncPlugins/footnotePlugin';
import SelectionPlugin from './AsyncPlugins/selectionPlugin';

// This is the master index for all the plugins.
const pluginList = {	
	pubList: pubListPlugin,
	collectionList: collectionListPlugin,
	link: linkPlugin,
	search: searchPlugin,

	image: ImagePlugin,
	quote: QuotePlugin,
	video: VideoPlugin,
	cite: CitePlugin,
	iframe: IFramePlugin,
	highlight: SelectionPlugin,
	footnote: FootnotePlugin
};

// This is the dictionary of plugin objects.
// It starts empty. Some plugins are added immediately (synchronously).
// Some plugins are loaded via Bluebird promises and added asynchronously.
const Plugins = { };

// This is the dictionary of plugins that are waiting to load.
// Code that executes on the Editor page immediately and tries
// to import the plugins might miss them if they haven't loaded yet,
// so we also export PluginPromises in case we need it elsewhere.
const PluginPromises = { };

// This is the default predicate for deciding if an async plugin should be loaded or not.
// For now we default to always including every plugin.
function includePlugins(pluginName) {
	return true;
}

function loadPlugins(predicate) {
	// default to includePlugins to determine if a plugin should be loaded,
	// but use the provided predicate as the test if it exists
	predicate = predicate || includePlugins;
	
	// for every plugin in the pluginList
	for (const pluginName in pluginList) {
		if (pluginList.hasOwnProperty(pluginName)) {
			
			// check if it's loaded synchronously or asynchronously
			if (typeof pluginList[pluginName] === 'function') {
				// the plugin is a async plugin to be loaded by promise
				
				// make sure the plugin isn't already loaded, isn't being loaded, and test the plugin's name on the predicate
				if (!Plugins[pluginName] && !PluginPromises[pluginName] && predicate(pluginName)) {
					// plugin needs to be loaded
					
					// resolve the promise
					PluginPromises[pluginName] = pluginList[pluginName]().then(function (plugin) {
						// plugin is now the actual, loaded plugin object
						
						// delete the pluginName key from PluginPromises in case we use PluginPromises for something elsewhere
						delete PluginPromises[pluginName];
						
						// add the resolved plugin to the exported dictionary
						Plugins[pluginName] = plugin;
						// console.log('loaded', pluginName, 'plugin');
						
						// return the plugin from the callback so that we can chain .then() callbacks off of the Promises,
						// see /containers/Editor/editorCodeMirrorMode.js for examples of this
						return plugin;
					});
				}
			} else {
				// the plugin is a sync plugin imported locally
				
				// add it directly to the exported dictionary
				Plugins[pluginName] = pluginList[pluginName];
			}
		}
	}
}

export {loadPlugins, PluginPromises, Plugins as default}