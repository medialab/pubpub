import React from 'react';
import {IndexRoute, Route} from 'react-router';
import {App, CreatePub, Editor, Explore, Landing, Profile, Reader, NotFound, SubdomainTest} from 'containers';
import MarkdownEditor from 'containers/Editor/MarkdownEditor';

export default () => {

	return (
		<Route path="/" component={App}>

			{ /* Home (main) route */ }
			<IndexRoute component={Landing}/>

			{ /* Routes */ }
			<Route path="/explore" component={Explore}/>
			<Route path="/newpub" component={CreatePub}/>
			<Route path="/profile/:username" component={Profile}/>
			<Route path="/pub/:slug" component={Reader}/>
			{ <Route path="/pub/:slug/editMD" component={MarkdownEditor}/> }
			<Route path="/pub/:slug/edit" component={Editor}/>
			<Route path="/subdomain" component={SubdomainTest}/>

			{ /* Catch all route */ }
			<Route path="*" component={NotFound} status={404} />

		</Route>
	);

};
