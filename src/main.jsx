import { render } from 'preact'
import './index.css'
import Router from 'preact-router'
import TimelessMode from './timeless_mode.jsx'
import About from './about'

const Main = () => (
  <Router>
    <TimelessMode path='/'/>
    <About path='/about' />
  </Router>
)

render(<Main />, document.getElementById('app'))
