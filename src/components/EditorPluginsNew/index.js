const plugins = {
	image: require('./image/index.js'),
	video: require('./video/index.js'),
	cite: require('./cite/index.js'),
	quote: require('./quote/index.js'),
	table: require('./table/index.js')
};

const includePlugins = {
	image: true,
	quote: false,
	video: false,
	cite: false,
	table: true
};

const exportPlugins = {};

for (const pluginName in plugins) {
	if (plugins.hasOwnProperty(pluginName) && typeof plugins[pluginName] === 'function' && includePlugins[pluginName]) {
		exportPlugins[pluginName] = plugins[pluginName]();
	}
}

export {exportPlugins as default};
