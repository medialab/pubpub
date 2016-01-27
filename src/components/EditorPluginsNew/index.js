const plugins = {
	image: require('./image/index.js'),
	video: require('./video/index.js'),
	cite: require('./cite/index.js'),
	quote: require('./quote/index.js')
};

const includePlugins = {
	image: true,
	quote: false,
	video: true,
	cite: false,
};

const exportPlugins = {};

for (const pluginName in plugins) {
	if (plugins.hasOwnProperty(pluginName) && typeof plugins[pluginName] === 'function' && includePlugins[pluginName]) {
		console.log('requesting', pluginName);
		exportPlugins[pluginName] = plugins[pluginName]();
	}
}

export {exportPlugins as default};
