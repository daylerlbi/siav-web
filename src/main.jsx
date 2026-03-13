import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/globals.css'
import { HeroUIProvider } from '@heroui/system'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getClientId } from './lib/controllers/endpoints.js'
const clientId = getClientId()

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <GoogleOAuthProvider clientId={clientId}>
    <BrowserRouter>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
  // </React.StrictMode>
)
