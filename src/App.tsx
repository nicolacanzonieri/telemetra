import { useState } from 'react';
import { LatLng } from 'leaflet';
import { db, type Track, type Gate } from './db/database.ts'

// PAGES
import StartMenuPage from './pages/StartMenuPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import DataViewerPage from './pages/DataViewerPage.tsx'
import TrackSelectionPage from './pages/TrackSelectionPage.tsx';
import EndpointSelectionPage from './pages/EndpointSelectionPage.tsx';
import OnBoardPage from './pages/OnboardPage.tsx';

export default function App() {
  // PAGES STATES
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataViewerPage, setIsDataViewerPage] = useState(false);
  const [isTrackSelectionOpen, setIsTrackSelectionPageOpen] = useState(false);
  const [isEndpointPageOpen, setIsEndpointPageOpen] = useState(false);
  const [isOnBoardPageOpen, setIsOnBoardPageOpen] = useState(false);

  // TRACK LOGIC
  const [currentTrackName, setCurrentTrackName] = useState("");
  const [startGate, setStartGate] = useState<Gate | null>(null);
  const [finishGate, setFinishGate] = useState<Gate | null>(null);
  const [trackType, setTrackType] = useState<'Circuit' | 'Sprint' | null>(null);
  const [gateStep, setSettingStep] = useState<'start' | 'finish'>('finish');

  // When opening settings...
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    setIsStartMenuOpen(false);
  };

  // When closing settings...
  const handleCloseSettings = () => {
    setIsStartMenuOpen(true);
    setIsSettingsOpen(false);
  }

  // When opening session...
  const handleOpenDataViewer = () => {
    setIsDataViewerPage(true);
    setIsStartMenuOpen(false);
  }

  // When opening session...
  const handleCloseDataViewer = () => {
    setIsDataViewerPage(false);
    setIsStartMenuOpen(true);
  }

  // When opening session...
  const handleOpenSession = () => {
    setIsTrackSelectionPageOpen(true);
    setIsStartMenuOpen(false);
  }

  // When closing the track selection menu...
  const handleCloseTrackSelection = () => {
    setIsStartMenuOpen(true);
    setIsTrackSelectionPageOpen(false);
  }

  // When creating a new track and then selecting a track type...
  const handleSelectTrackType = (type: 'Circuit' | 'Sprint') => {
    setTrackType(type);
    setStartGate(null);
    setFinishGate(null);

    // If user selected a 'Sprint' type track then we have to set the 'start' point first and then
    // the 'finish' point. If we are instead setting a 'Circuit' type track then we only need the 
    // 'finish' point
    setSettingStep(type === 'Sprint' ? 'start' : 'finish');
    
    // Open the endpoint selection page
    setIsTrackSelectionPageOpen(false);
    setIsEndpointPageOpen(true);
  };

  // When selecting a saved track...
  const handleSelectSavedTrack = async (track: Track) => {
    console.log("LOADED SAVED TRACK:", track);
    setCurrentTrackName(track.name);
    setStartGate(track.startGate || null);
    setFinishGate(track.finishGate);
    setTrackType(track.type);
    setIsTrackSelectionPageOpen(false);
    setIsOnBoardPageOpen(true);
  };

  // When closing the endpoint page...
  const handleCloseEndpointPage = () => {
    setIsTrackSelectionPageOpen(true);
    setIsEndpointPageOpen(false);
  }

  // When closing onboard page...
  const handleCloseOnboardPage = () => {
    setIsStartMenuOpen(true);
    setIsEndpointPageOpen(false);
    setIsOnBoardPageOpen(false);
  }

  // When conferming gate...
  const handleConfirmGate = async (p1: LatLng, p2: LatLng) => {
    if (gateStep === 'start') {
      setStartGate({ p1, p2 });
      setSettingStep('finish');
    } else {
      setFinishGate({ p1, p2 });

      const trackName = prompt("ENTER TRACK NAME:") || "New Track";
      const newTrack: Track = {
        name: trackName.toUpperCase(),
        type: trackType!,
        finishGate: { 
          p1: { lat: p1.lat, lng: p1.lng }, 
          p2: { lat: p2.lat, lng: p2.lng } 
        },
        createdAt: Date.now()
      };

      if (trackType === 'Sprint' && newTrack.startGate != null && startGate != null) {
        newTrack.startGate.p1 = startGate.p1;
        newTrack.startGate.p2 = startGate.p2;
      }

      console.log("NEW TRACK CREATED:", newTrack);
      await db.tracks.add(newTrack);

      setIsEndpointPageOpen(false);
      setIsOnBoardPageOpen(true);
    }

  };

  return (
    <div className='relative'>

      {/* MAIN MENU PAGE */}
      { isStartMenuOpen && (
        <StartMenuPage 
          onOpenSettings={handleOpenSettings} 
          onOpenSession={handleOpenSession}
          onOpenDataViewer={handleOpenDataViewer}
        />
      )}

      {/* SETTINGS PAGE */}
      { isSettingsOpen && (
        <SettingsPage 
          onCloseSettings={handleCloseSettings}
        />
      )}

      { isDataViewerPage && (
        <DataViewerPage 
          onCloseDataViewerPage={handleCloseDataViewer}
        />
      )}

      {/* TRACK SELECTION PAGE */}
      { isTrackSelectionOpen && (
        <TrackSelectionPage 
          onCloseTrackSelection={handleCloseTrackSelection}
          onClickTrackType={handleSelectTrackType}
          onSelectSavedTrack={handleSelectSavedTrack}
        />
      )}
      
      {/* TRACK ENDPOINTS PAGE */}
      { isEndpointPageOpen && (
        <EndpointSelectionPage 
          title={gateStep === 'start' ? "Set Start Line" : "Set Finish Line"}
          onCloseEndpointPage={handleCloseEndpointPage}
          onConfirm={handleConfirmGate} 
        />
      )}

      {/* ONBOARD PAGE */}
      { isOnBoardPageOpen && (
        <OnBoardPage 
          trackName={currentTrackName}
          startGate={startGate}
          finishGate={finishGate}
          onCloseOnboardPage={handleCloseOnboardPage}
        />
      )}

    </div>
  )
}
