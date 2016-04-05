#How to make plugins:
##Format

Each Plugin must import ../PubPub.js which exposes a wrapper PubPub function that takes a:
  - reactComponent
  - config
  - inputFields
  - editorWidget

###Config:
An object that takes the following parameters:
- title: String, Of the plugin, used for all display purposes
- autocomplete: Boolean, determines whether the plugin shows up when the user autocompletes a popup
- color: the highlighting color of the widget

## Loading
When requiring modules, the WebPack configuration tests the file path against a regular 
expression that matches every .js file in /components/EditorPlugins/AsyncPlugins.
If it does not match, the module is loaded normally. If it matches, the module is loaded
as a promise that resolves to the module via promise-loader and Bluebird. In this case,
the plugin will be loaded on demand when the Editor is mounted.

Plugins in /AsyncPlugins/ and modules that are only imported by plugins in /AsyncPlugins/ 
will be automatically chunked by WebPack and loaded asynchronously.