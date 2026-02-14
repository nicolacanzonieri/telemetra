import { useState } from 'react';

// PAGES
import StartMenuPage from './components/StartMenuPage.tsx'
import SettingsPage from './components/SettingsPage.tsx'


function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function onClickSettings() {
    setIsSettingsOpen(!isSettingsOpen);
  }

  return (
    <div className='relative'>
      <StartMenuPage onOpenSettings={onClickSettings}/>
      { isSettingsOpen && (
        <SettingsPage onCloseSettings={onClickSettings}/>
      )}
    </div>
  )
}

export default App
