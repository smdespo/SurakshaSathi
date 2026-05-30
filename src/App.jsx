import { useState } from 'react'
import LocationTracker from './Components/LocationFetch.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <LocationTracker />
    </>
  )
}

export default App
