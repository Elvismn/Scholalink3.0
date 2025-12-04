import React from 'react'
import ReactDOM from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import App from './App.jsx'
import './styles/globals.css'  

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Theme appearance="light" accentColor="blue" grayColor="gray" radius="large">
      <App />
    </Theme>
  </React.StrictMode>,
)
