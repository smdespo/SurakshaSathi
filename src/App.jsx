import { useState } from 'react'
import LocationTracker from './Components/LocationFetch.jsx'
import ClientDashboard from './Client/Dashboard.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ClientDashboard />
    </>
  )
}

export default App
