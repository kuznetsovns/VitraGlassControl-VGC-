import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('App component mounted')
    return () => {
      console.log('App component unmounted')
    }
  }, [])

  const handleCountIncrement = () => {
    console.log('Count button clicked, current count:', count)
    setCount((count) => count + 1)
  }

  const handleLogoClick = (logoName: string) => {
    console.log(`${logoName} logo clicked`)
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" onClick={() => handleLogoClick('Vite')}>
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" onClick={() => handleLogoClick('React')}>
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={handleCountIncrement}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
