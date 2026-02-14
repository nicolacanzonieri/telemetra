import { useState } from 'react';

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className='relative'>
      <StartMenuPage onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}/>

      { isSettingsOpen && (
        <SettingsPage onCloseSettings={() => setIsSettingsOpen(!isSettingsOpen)}/>
      )}
      
    </div>
  )
}

export default App
