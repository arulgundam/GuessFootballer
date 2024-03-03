import React, { render } from 'preact'
import './index.css'
import Router from 'preact-router'
import TimelessMode from './timeless_mode.jsx'
import About from './about'

const Main = () => (
  <Router>
    <TimelessMode path='/GuessFootballer'/>
    <About path='/GuessFootballer/about' />
  </Router>
)

render(<Main />, document.getElementById('app'))
