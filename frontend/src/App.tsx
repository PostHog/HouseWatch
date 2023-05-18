import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import Sidebar from './Sidebar'
import ThemeCustomization from './themes'

function App() {
    return (
        <ThemeCustomization>
            <div className="App">
            {/* <script src="./sql-formatter.js"></script> */}
                
                <Router>
                    <Sidebar />
                </Router>
            </div>
        </ThemeCustomization>
    )
}

export default App
