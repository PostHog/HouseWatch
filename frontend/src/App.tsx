import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './Layout'

function App() {
    return (
        <div className="App">
            <Router>
                <Layout />
            </Router>
        </div>
    )
}

export default App
