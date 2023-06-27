import { render } from 'preact'
import './index.css'
import Router from 'preact-router'
import TimelessMode from './timeless_mode.jsx'
import About from './about'
import Contact from './contact'

const Main = () => (
  <Router>
    <TimelessMode path='/'/>
    <About path='/about' />
    <Contact path='/contact' />
  </Router>
)

render(<Main />, document.getElementById('app'))
