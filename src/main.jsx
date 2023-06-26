import { render } from 'preact'
import './index.css'
import Router from 'preact-router'
import TimelessMode from './timeless_mode.jsx'

const Main = () => (
  <Router>
    <TimelessMode path='/'/>
  </Router>
)

render(<Main />, document.getElementById('app'))
