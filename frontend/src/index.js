import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './fonts.css';
import Home from './Home';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Home />, document.getElementById('root'));
var select = document.getElementsByClassName('Select-control');
if (select && select.length > 0)
{
	select[0].setAttribute('id', 'SelectControl');
}
registerServiceWorker();
