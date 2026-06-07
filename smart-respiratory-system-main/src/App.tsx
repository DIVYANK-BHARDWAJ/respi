import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Smartphone,
  Search,
  FileText,
  Database,
  BookOpen,
  Play,
  Square,
  Volume2,
  Bluetooth,
  Wifi,
  Battery,
  TrendingUp,
  Settings,
  AlertTriangle,
  CheckCircle,
  Download,
  Maximize2,
  Stethoscope,
  ShieldCheck
} from 'lucide-react';
import './App.css';
import Lightfall from './components/Lightfall';
import StethoscopeMap, { LOBE_ZONES } from './components/StethoscopeMap';
import type { LobeZone } from './components/StethoscopeMap';
import WaveformVisualizer from './components/WaveformVisualizer';
import { audioSynthInstance } from './utils/audioSynth';

// Mock Patient Log interface
interface PatientLog {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  timestamp: string;
  zoneName: string;
  zoneId: string;
  finding: 'normal' | 'wheeze' | 'crackle' | 'stridor';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  normalProb: number;
  wheezeProb: number;
  crackleProb: number;
  stridorProb: number;
  clinicalNotes: string;
}

// Initial Mock Logs
const INITIAL_LOGS: PatientLog[] = [
  {
    id: 'log-1',
    patientId: 'PT-4920',
    patientName: 'Arthur Pendelton',
    age: 64,
    gender: 'Male',
    timestamp: '2026-06-04 11:22',
    zoneName: 'Posterior Right Lower Lobe',
    zoneId: 'post-lr',
    finding: 'crackle',
    severity: 'moderate',
    normalProb: 15,
    wheezeProb: 5,
    crackleProb: 78,
    stridorProb: 2,
    clinicalNotes: 'Discontinuous popping sounds detected over bilateral bases. Highly suggestive of early pulmonary edema or fine bibasilar crackles. Advise clinical monitoring and fluid level evaluations.'
  },
  {
    id: 'log-2',
    patientId: 'PT-8812',
    patientName: 'Sophia Lin',
    age: 12,
    gender: 'Female',
    timestamp: '2026-06-03 15:45',
    zoneName: 'Anterior Left Lower Lobe',
    zoneId: 'ant-ll',
    finding: 'wheeze',
    severity: 'high',
    normalProb: 10,
    wheezeProb: 85,
    crackleProb: 3,
    stridorProb: 2,
    clinicalNotes: 'High-pitched expiratory wheezing heard clearly during forced expiration. Patient has history of childhood asthma. Re-evaluating post-bronchodilator is suggested.'
  },
  {
    id: 'log-3',
    patientId: 'PT-1093',
    patientName: 'Marcus Aurelius',
    age: 41,
    gender: 'Male',
    timestamp: '2026-06-03 09:12',
    zoneName: 'Anterior Right Upper Lobe',
    zoneId: 'ant-ur',
    finding: 'normal',
    severity: 'low',
    normalProb: 98,
    wheezeProb: 1,
    crackleProb: 1,
    stridorProb: 0,
    clinicalNotes: 'Normal vesicular breathing. Clear inspiratory sounds and soft expiratory sounds. No adventitious sounds detected.'
  },
  {
    id: 'log-4',
    patientId: 'PT-0125',
    patientName: 'Baby Noah (Infant)',
    age: 1,
    gender: 'Male',
    timestamp: '2026-06-02 18:30',
    zoneName: 'Anterior Right Upper Lobe',
    zoneId: 'ant-ur',
    finding: 'stridor',
    severity: 'critical',
    normalProb: 5,
    wheezeProb: 15,
    crackleProb: 5,
    stridorProb: 75,
    clinicalNotes: 'High-pitched, harsh inspiratory crowing sound localized in the upper trachea. Suggests upper airway obstruction / croup. Emergency pediatric triage initiated.'
  }
];

const App: React.FC = () => {
  // Navigation tabs: 'monitor' | 'logs' | 'library' | 'mobile'
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs' | 'library' | 'mobile'>('monitor');
  
  // Stethoscope connection states
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [signalStrength, setSignalStrength] = useState(4); // 1 to 5 bars

  // Active chest zone
  const [activeZone, setActiveZone] = useState<LobeZone>(LOBE_ZONES[0]);

  // Selected simulated sound type
  const [soundType, setSoundType] = useState<'normal' | 'wheeze' | 'crackle' | 'stridor'>('normal');
  const [isPlaying, setIsPlaying] = useState(false);

  // Diagnostic states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  
  // Classification breakdown telemetry
  const [normalProb, setNormalProb] = useState(0);
  const [wheezeProb, setWheezeProb] = useState(0);
  const [crackleProb, setCrackleProb] = useState(0);
  const [stridorProb, setStridorProb] = useState(0);
  const [detectedFinding, setDetectedFinding] = useState<'normal' | 'wheeze' | 'crackle' | 'stridor' | null>(null);

  // Logs Database
  const [logs, setLogs] = useState<PatientLog[]>(INITIAL_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Active Detail Report Modal
  const [selectedReport, setSelectedReport] = useState<PatientLog | null>(null);

  // New Scan Patient Details Input
  const [patientIdInput, setPatientIdInput] = useState('PT-2041');
  const [patientNameInput, setPatientNameInput] = useState('Helena Troy');
  const [patientAgeInput, setPatientAgeInput] = useState(38);
  const [patientGenderInput, setPatientGenderInput] = useState('Female');

  // Mobile companion app state
  const [mobileScreen, setMobileScreen] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [phoneAlert, setPhoneAlert] = useState<{
    show: boolean;
    title: string;
    description: string;
    finding: 'normal' | 'wheeze' | 'crackle' | 'stridor';
  } | null>(null);
  
  // Stethoscope simulation toggle logic
  const handleConnectStethoscope = () => {
    if (isConnected) {
      setIsConnected(false);
      audioSynthInstance.stop();
      setIsPlaying(false);
    } else {
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        setBatteryLevel(98);
        setSignalStrength(5);
      }, 1500);
    }
  };

  // Synthesizer management hooks
  useEffect(() => {
    if (isPlaying && isConnected) {
      audioSynthInstance.start(soundType);
    } else {
      audioSynthInstance.stop();
    }
    return () => {
      audioSynthInstance.stop();
    };
  }, [isPlaying, soundType, isConnected]);

  // Handle switching tabs
  const handleTabChange = (tab: 'monitor' | 'logs' | 'library' | 'mobile') => {
    setActiveTab(tab);
  };

  // Trigger sound type change
  const selectSound = (type: 'normal' | 'wheeze' | 'crackle' | 'stridor') => {
    setSoundType(type);
    setAnalysisCompleted(false);
    setDetectedFinding(null);
    setNormalProb(0);
    setWheezeProb(0);
    setCrackleProb(0);
    setStridorProb(0);
  };

  // Initiate AI Scan simulation
  const startAIDiagnostics = () => {
    if (!isConnected) {
      alert("Please connect the digital stethoscope to the system before starting diagnostic scans.");
      return;
    }
    setIsAnalyzing(true);
    setIsPlaying(true);
    setAnalyzeProgress(0);
    setAnalysisCompleted(false);

    const interval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAIDiagnostics();
          return 100;
        }
        return prev + 4;
      });
    }, 120);
  };

  // Complete diagnostic analysis and transition probabilities
  const completeAIDiagnostics = () => {
    setIsAnalyzing(false);
    setAnalysisCompleted(true);
    
    // Distribute probabilities based on active simulation source
    let norm = 0, whz = 0, crk = 0, std = 0;
    if (soundType === 'normal') {
      norm = 96 + Math.floor(Math.random() * 3);
      whz = Math.floor(Math.random() * 2);
      crk = Math.floor(Math.random() * 2);
      std = 0;
    } else if (soundType === 'wheeze') {
      norm = 5 + Math.floor(Math.random() * 5);
      whz = 82 + Math.floor(Math.random() * 10);
      crk = Math.floor(Math.random() * 5);
      std = Math.floor(Math.random() * 3);
    } else if (soundType === 'crackle') {
      norm = 8 + Math.floor(Math.random() * 5);
      whz = Math.floor(Math.random() * 4);
      crk = 80 + Math.floor(Math.random() * 12);
      std = Math.floor(Math.random() * 2);
    } else if (soundType === 'stridor') {
      norm = 3 + Math.floor(Math.random() * 3);
      whz = 10 + Math.floor(Math.random() * 5);
      crk = Math.floor(Math.random() * 4);
      std = 78 + Math.floor(Math.random() * 11);
    }

    setNormalProb(norm);
    setWheezeProb(whz);
    setCrackleProb(crk);
    setStridorProb(std);
    setDetectedFinding(soundType);

    // Save diagnostic results to history logs
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let clinicalNotes = '';

    if (soundType === 'normal') {
      severity = 'low';
      clinicalNotes = `Healthy vesicular breath sounds observed. The visual chest scan shows uniform sound dispersal in the ${activeZone.name}. No secondary murmurs or clicking sounds detected.`;
    } else if (soundType === 'wheeze') {
      severity = 'high';
      clinicalNotes = `Musical continuous breath wheezes captured during the exhalation interval in the ${activeZone.name}. Waveform frequencies show sharp peak resonance at 480Hz. Suggestive of active airway bronchospasm or subacute asthma flare.`;
    } else if (soundType === 'crackle') {
      severity = 'moderate';
      clinicalNotes = `Intermittent crackling sounds (crepitations) recorded in the posterior/anterior base of the ${activeZone.name}. Discontinuous transients suggest micro-opening of alveolar bags. Highly typical of fluid buildup or bronchial congestion.`;
    } else if (soundType === 'stridor') {
      severity = 'critical';
      clinicalNotes = `Harsh, violent inspiratory stridor sound captured in the upper vocal region of the ${activeZone.name}. The spectrogram registers extreme turbulence and vocal strain. Immediate airway clearance verification is clinically recommended.`;
    }

    const newLog: PatientLog = {
      id: `log-${Date.now()}`,
      patientId: patientIdInput,
      patientName: patientNameInput,
      age: patientAgeInput,
      gender: patientGenderInput,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      zoneName: activeZone.name,
      zoneId: activeZone.id,
      finding: soundType,
      severity,
      normalProb: norm,
      wheezeProb: whz,
      crackleProb: crk,
      stridorProb: std,
      clinicalNotes
    };

    setLogs((prev) => [newLog, ...prev]);

    // Push notification to Companion App Mirror
    setPhoneAlert({
      show: true,
      title: `${soundType.toUpperCase()} ALERT: ${activeZone.name}`,
      description: soundType === 'normal'
        ? "Bilateral breath cycles normal. Stethoscope scan synchronization complete."
        : `Abnormal ${soundType} findings detected. Report uploaded to clinical server. Check status.`,
      finding: soundType
    });
  };

  // Clear Phone notifications
  const clearPhoneAlert = () => {
    setPhoneAlert(null);
  };

  // Helper helper badge classes
  const getSeverityClass = (sev: string) => {
    if (sev === 'low') return 'normal';
    if (sev === 'moderate') return 'crackle';
    if (sev === 'high') return 'wheeze';
    return 'stridor';
  };

  // Filter logs list
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.zoneName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'abnormal') return matchesSearch && log.finding !== 'normal';
    return matchesSearch && log.finding === filterType;
  });

  return (
    <div className="app-container">
      {/* Lightfall Glowing Background behind components */}
      <div className="bg-canvas-wrapper">
        <Lightfall
          colors={['#10B981', '#3B82F6', '#06B6D4']}
          backgroundColor="#020617"
          speed={0.4}
          streakCount={4}
          streakWidth={1.2}
          streakLength={1.5}
          glow={0.8}
          density={0.5}
          zoom={3}
          backgroundGlow={0.35}
          opacity={0.8}
          mouseInteraction={true}
        />
      </div>

      {/* Primary Top Bar */}
      <header className="navbar">
        <div className="brand">
          <Activity size={24} className="brand-icon" />
          <span className="brand-text">RespiSound AI</span>
        </div>

        {/* Global tab triggers */}
        <nav className="nav-links">
          <button
            onClick={() => handleTabChange('monitor')}
            className={`nav-link ${activeTab === 'monitor' ? 'active' : ''}`}
          >
            <Stethoscope size={16} />
            Live Monitor
          </button>
          <button
            onClick={() => handleTabChange('logs')}
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <Database size={16} />
            Patient Logs
          </button>
          <button
            onClick={() => handleTabChange('library')}
            className={`nav-link ${activeTab === 'library' ? 'active' : ''}`}
          >
            <BookOpen size={16} />
            Acoustic Library
          </button>
          <button
            onClick={() => handleTabChange('mobile')}
            className={`nav-link ${activeTab === 'mobile' ? 'active' : ''}`}
          >
            <Smartphone size={16} />
            Companion Mirror
          </button>
        </nav>

        {/* Bluetooth status indicator */}
        <button
          onClick={handleConnectStethoscope}
          disabled={isConnecting}
          className={`stethoscope-sync-status ${!isConnected ? 'disconnected' : ''}`}
          style={{ cursor: 'pointer', border: 'none' }}
        >
          {isConnecting ? (
            <>
              <Bluetooth size={14} className="animate-spin" />
              <span>SEARCHING STETHOSCOPE...</span>
            </>
          ) : isConnected ? (
            <>
              <span className="sync-dot" />
              <span>SYNCED: STETH-490</span>
              <Battery size={14} style={{ marginLeft: 6 }} />
              <span>{batteryLevel}%</span>
            </>
          ) : (
            <>
              <Bluetooth size={14} />
              <span>CONNECT STETHOSCOPE</span>
            </>
          )}
        </button>
      </header>

      {/* Main Pages Router wrapper */}
      <main className="main-content">
        
        {/* --- PAGE 1: MONITOR & ANALYZER --- */}
        {activeTab === 'monitor' && (
          <>
            <div className="page-header">
              <h2>Stethoscope Analysis Workspace</h2>
              <p>Position your digital stethoscope, capture clinical lung acoustics, and trigger real-time AI classification.</p>
            </div>

            <div className="container-layout">
              {/* Left Console Panel */}
              <div className="control-panel">
                
                {/* 1. Stethoscope Bluetooth Link panel */}
                <div className="glass-panel panel-card">
                  <div className="card-title-row">
                    <h3>
                      <Bluetooth size={18} className="text-blue-500" />
                      Digital Stethoscope Sync
                    </h3>
                    <span className="text-xs font-mono text-white/40">v2.10 BLE</span>
                  </div>

                  <div className="stethoscope-connect-card">
                    <div className="stethoscope-info">
                      <div className={`device-avatar ${isConnected ? 'active' : ''}`}>
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div className="device-name">
                          {isConnected ? 'RespiSound Digital Stethoscope (Model 490)' : 'No Stethoscope Linked'}
                        </div>
                        <div className="device-signal">
                          {isConnected ? (
                            <>
                              <Wifi size={12} className="text-green-500" />
                              <span>Signal: {signalStrength}/5 Bars (Optimal -58dBm)</span>
                              <span className="text-white/30">•</span>
                              <span>Latency: 4ms</span>
                            </>
                          ) : (
                            <span>Switch on stethoscope to pair via Bluetooth</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleConnectStethoscope}
                      className={`glow-btn ${isConnected ? 'bg-red-600 hover:bg-red-700' : ''}`}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        background: isConnected ? 'rgba(239, 68, 68, 0.2)' : undefined,
                        border: isConnected ? '1px solid rgba(239, 68, 68, 0.4)' : undefined
                      }}
                    >
                      {isConnected ? 'Disconnect' : 'Connect Device'}
                    </button>
                  </div>
                </div>

                {/* 2. Audio simulation and oscilloscope feeds */}
                <div className="glass-panel panel-card">
                  <div className="card-title-row">
                    <h3>
                      <Activity size={18} className="text-emerald-400" />
                      Stethoscope Waveform Feed
                    </h3>
                    <div className="flex items-center gap-3">
                      {isPlaying && (
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          ACQUISITION LIVE
                        </span>
                      )}
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!isConnected}
                        className="secondary-action-btn"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        {isPlaying ? <Square size={12} /> : <Play size={12} />}
                        {isPlaying ? 'Pause Audio' : 'Play Audio'}
                      </button>
                    </div>
                  </div>

                  {/* Real-time wave drawing canvas */}
                  <div className="wave-visualizer-container">
                    <WaveformVisualizer
                      soundType={soundType}
                      isAnalyzing={isAnalyzing}
                      isPlaying={isPlaying && isConnected}
                    />
                  </div>

                  {/* Diagnostic Trigger Selection */}
                  <div className="mb-4">
                    <p className="text-xs font-mono text-white/40 uppercase mb-2">Simulate Sound Profile</p>
                    <div className="sound-selector-grid">
                      <button
                        onClick={() => selectSound('normal')}
                        className={`sound-select-btn ${soundType === 'normal' ? 'active normal' : ''}`}
                      >
                        <CheckCircle size={16} className={soundType === 'normal' ? 'text-green-500' : 'text-white/40'} />
                        <div>
                          <div className="sound-btn-label">Normal</div>
                          <div className="sound-btn-type">Vesicular</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectSound('wheeze')}
                        className={`sound-select-btn ${soundType === 'wheeze' ? 'active wheeze' : ''}`}
                      >
                        <Volume2 size={16} className={soundType === 'wheeze' ? 'text-blue-400' : 'text-white/40'} />
                        <div>
                          <div className="sound-btn-label">Wheeze</div>
                          <div className="sound-btn-type">Pathological</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectSound('crackle')}
                        className={`sound-select-btn ${soundType === 'crackle' ? 'active crackle' : ''}`}
                      >
                        <Activity size={16} className={soundType === 'crackle' ? 'text-amber-500' : 'text-white/40'} />
                        <div>
                          <div className="sound-btn-label">Crackle</div>
                          <div className="sound-btn-type">Adventitious</div>
                        </div>
                      </button>
                      <button
                        onClick={() => selectSound('stridor')}
                        className={`sound-select-btn ${soundType === 'stridor' ? 'active stridor' : ''}`}
                      >
                        <AlertTriangle size={16} className={soundType === 'stridor' ? 'text-red-500' : 'text-white/40'} />
                        <div>
                          <div className="sound-btn-label">Stridor</div>
                          <div className="sound-btn-type">Emergency</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Audio Synthesizer Instruction */}
                  <div className="info-alert-box">
                    <Volume2 size={16} className="text-cyan-400 flex-shrink-0" />
                    <div className="info-alert-text">
                      <strong>Acoustic Feedback active:</strong> Selecting a profile triggers browser-based real-time synthesizers mimicking breathing, wheezes, and crackles. Press <strong>Play Audio</strong> to listen.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Column (Lungs chest map + AI results) */}
              <div className="control-panel">
                
                {/* Torso Interactive Chest Map */}
                <StethoscopeMap
                  activeZoneId={activeZone.id}
                  onSelectZone={(zone) => setActiveZone(zone)}
                />

                {/* AI Diagnostics telemetry dashboard */}
                <div className="glass-panel panel-card">
                  <div className="card-title-row">
                    <h3>
                      <Activity size={18} className="text-blue-400" />
                      Deep Learning Classification Telemetry
                    </h3>
                  </div>

                  {/* Target Patient Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Patient ID</label>
                        <input
                          type="text"
                          value={patientIdInput}
                          onChange={(e) => setPatientIdInput(e.target.value)}
                          className="w-full bg-[#070b16] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Patient Name</label>
                        <input
                          type="text"
                          value={patientNameInput}
                          onChange={(e) => setPatientNameInput(e.target.value)}
                          className="w-full bg-[#070b16] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Patient Age</label>
                        <input
                          type="number"
                          value={patientAgeInput}
                          onChange={(e) => setPatientAgeInput(Number(e.target.value))}
                          className="w-full bg-[#070b16] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-white/40 uppercase block mb-1">Patient Gender</label>
                        <select
                          value={patientGenderInput}
                          onChange={(e) => setPatientGenderInput(e.target.value)}
                          className="w-full bg-[#070b16] border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic triggers */}
                  <div className="analyzer-actions mb-4">
                    <button
                      onClick={startAIDiagnostics}
                      disabled={isAnalyzing || !isConnected}
                      className="glow-btn action-btn"
                    >
                      <Activity size={16} />
                      {isAnalyzing ? `Analyzing... (${analyzeProgress}%)` : 'Run AI Lung Classification'}
                    </button>
                  </div>

                  {isAnalyzing && (
                    <div className="w-full mb-4">
                      <div className="flex justify-between text-xs font-mono text-white/60 mb-1">
                        <span>Running acoustic spectrogram analysis...</span>
                        <span>{analyzeProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${analyzeProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Results bars */}
                  {analysisCompleted ? (
                    <div className="telemetry-scans">
                      <div className="p-3 bg-white/3 rounded-lg border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-white/40">CLASSIFICATION CONCLUSION</div>
                          <div className="text-sm font-bold flex items-center gap-2 mt-0.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              detectedFinding === 'normal' ? 'bg-[#10B981]' :
                              detectedFinding === 'wheeze' ? 'bg-[#3B82F6]' :
                              detectedFinding === 'crackle' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                            }`} />
                            {detectedFinding?.toUpperCase() || 'UNKNOWN'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-white/40">SEVERITY LEVEL</div>
                          <span className={`badge ${getSeverityClass(soundType)} mt-0.5`}>
                            {soundType === 'normal' ? 'low' : soundType === 'crackle' ? 'moderate' : soundType === 'wheeze' ? 'high' : 'critical'}
                          </span>
                        </div>
                      </div>

                      <div className="diagnostic-meter-group">
                        {/* Normal meter */}
                        <div className="meter-row">
                          <div className="meter-label-row">
                            <span className="meter-label-name">Normal Vesicular</span>
                            <span>{normalProb}%</span>
                          </div>
                          <div className="meter-bar-container">
                            <div className="meter-bar-fill normal" style={{ width: `${normalProb}%` }} />
                          </div>
                        </div>

                        {/* Wheeze meter */}
                        <div className="meter-row">
                          <div className="meter-label-row">
                            <span className="meter-label-name">Wheeze (Obstructive)</span>
                            <span>{wheezeProb}%</span>
                          </div>
                          <div className="meter-bar-container">
                            <div className="meter-bar-fill wheeze" style={{ width: `${wheezeProb}%` }} />
                          </div>
                        </div>

                        {/* Crackle meter */}
                        <div className="meter-row">
                          <div className="meter-label-row">
                            <span className="meter-label-name">Crackle (Discontinuous)</span>
                            <span>{crackleProb}%</span>
                          </div>
                          <div className="meter-bar-container">
                            <div className="meter-bar-fill crackle" style={{ width: `${crackleProb}%` }} />
                          </div>
                        </div>

                        {/* Stridor meter */}
                        <div className="meter-row">
                          <div className="meter-label-row">
                            <span className="meter-label-name">Stridor (Harsh Tracheal)</span>
                            <span>{stridorProb}%</span>
                          </div>
                          <div className="meter-bar-container">
                            <div className="meter-bar-fill stridor" style={{ width: `${stridorProb}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="scanning-placeholder">
                      <Activity size={32} className="placeholder-icon" />
                      <div className="placeholder-text">
                        Connect stethoscope, select chest site, play audio, and trigger AI classifier to view diagnostic scores.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- PAGE 2: PATIENT RECORDS & HISTORY --- */}
        {activeTab === 'logs' && (
          <div className="page-header" style={{ maxWidth: '1200px', margin: '20px auto 40px', padding: '0 20px', width: '100%' }}>
            <h2>Diagnostic Archives & Logs</h2>
            <p>Access patient reports, filter based on severity classifications, and review detailed clinical audio files.</p>

            <div className="glass-panel panel-card mt-6">
              
              {/* Controls bar */}
              <div className="history-controls">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-input-icon" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Patient ID, Name, or Chest lobe..."
                    className="search-input"
                  />
                </div>

                <div className="filter-btn-group">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  >
                    All Logs
                  </button>
                  <button
                    onClick={() => setFilterType('abnormal')}
                    className={`filter-btn ${filterType === 'abnormal' ? 'active' : ''}`}
                  >
                    Abnormal Only
                  </button>
                  <button
                    onClick={() => setFilterType('normal')}
                    className={`filter-btn ${filterType === 'normal' ? 'active' : ''}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFilterType('wheeze')}
                    className={`filter-btn ${filterType === 'wheeze' ? 'active' : ''}`}
                  >
                    Wheezes
                  </button>
                  <button
                    onClick={() => setFilterType('crackle')}
                    className={`filter-btn ${filterType === 'crackle' ? 'active' : ''}`}
                  >
                    Crackles
                  </button>
                  <button
                    onClick={() => setFilterType('stridor')}
                    className={`filter-btn ${filterType === 'stridor' ? 'active' : ''}`}
                  >
                    Stridors
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="logs-table-container">
                {filteredLogs.length > 0 ? (
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Patient ID</th>
                        <th>Patient Name</th>
                        <th>Stethoscope Location</th>
                        <th>Primary Finding</th>
                        <th>Confidence</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => {
                        const prob = log.finding === 'normal' ? log.normalProb :
                                     log.finding === 'wheeze' ? log.wheezeProb :
                                     log.finding === 'crackle' ? log.crackleProb : log.stridorProb;
                        return (
                          <tr key={log.id}>
                            <td className="font-mono text-xs">{log.timestamp}</td>
                            <td className="font-bold text-white">{log.patientId}</td>
                            <td>{log.patientName} <span className="text-[10px] text-white/40">({log.age}y/o, {log.gender[0]})</span></td>
                            <td className="text-xs">{log.zoneName}</td>
                            <td>
                              <span className={`badge ${getSeverityClass(log.finding)}`}>
                                {log.finding}
                              </span>
                            </td>
                            <td className="font-mono text-xs font-semibold text-white/80">{prob}%</td>
                            <td>
                              <button
                                onClick={() => setSelectedReport(log)}
                                className="secondary-action-btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                <Maximize2 size={12} />
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-20 text-white/40">
                    <Database size={36} className="mx-auto mb-3 opacity-30" />
                    No patient recordings matching the selected query filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 3: ACOUSTIC LIBRARY & STUDY --- */}
        {activeTab === 'library' && (
          <div className="page-header" style={{ maxWidth: '1200px', margin: '20px auto 40px', padding: '0 20px', width: '100%' }}>
            <h2>Clinical Respiratory Library</h2>
            <p>Study standard acoustic features, understand pathophysiology mechanism, and play reference breath files.</p>

            <div className="library-grid mt-6">
              
              {/* Normal Box */}
              <div className="glass-panel library-card normal">
                <div>
                  <span className="badge normal mb-2">Vesicular Sound (Healthy)</span>
                  <h3 className="text-lg font-bold mb-2">Normal Pulmonary Air Intake</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Vesicular breathing represents turbulence from gas streams passing the bronchioles and alveoli. Characterized by soft, rustling sounds dominant throughout inhalation, fading silently halfway through exhalation.
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 block mb-1">Acoustic Characteristics</span>
                    <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
                      <li>Frequency Range: 100 Hz – 1000 Hz</li>
                      <li>Pitch: Gentle low pitch rustling</li>
                      <li>Duration Ratio: Inspiration 3 : Expiration 1</li>
                    </ul>
                  </div>
                </div>

                <div className="audio-player-widget">
                  <div className="audio-controls">
                    <button
                      onClick={() => {
                        if (isPlaying && soundType === 'normal') {
                          setIsPlaying(false);
                        } else {
                          setIsConnected(true);
                          setSoundType('normal');
                          setIsPlaying(true);
                        }
                      }}
                      className="play-circle-btn"
                    >
                      {isPlaying && soundType === 'normal' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold">Healthy Vesicular Audio</div>
                      <div className="text-[9px] font-mono text-white/40">44.1 kHz Mono Synthesis</div>
                    </div>
                  </div>
                  <Volume2 size={16} className="text-green-500" />
                </div>
              </div>

              {/* Wheeze Box */}
              <div className="glass-panel library-card wheeze">
                <div>
                  <span className="badge wheeze mb-2">Musical Sound (Pathological)</span>
                  <h3 className="text-lg font-bold mb-2">Asthmatic/Obstructive Wheeze</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Continuous musical tones representing turbulent airflow passing through constricted, narrowed bronchial channels. Typically heard during expiration in asthmatic airway contractions, COPD, or localized obstructions.
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 block mb-1">Acoustic Characteristics</span>
                    <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
                      <li>Frequency Range: 400 Hz – 1000 Hz</li>
                      <li>Pitch: Whistling high-frequency sinusoids</li>
                      <li>Duration Ratio: Predominantly active in Expiration</li>
                    </ul>
                  </div>
                </div>

                <div className="audio-player-widget">
                  <div className="audio-controls">
                    <button
                      onClick={() => {
                        if (isPlaying && soundType === 'wheeze') {
                          setIsPlaying(false);
                        } else {
                          setIsConnected(true);
                          setSoundType('wheeze');
                          setIsPlaying(true);
                        }
                      }}
                      className="play-circle-btn"
                    >
                      {isPlaying && soundType === 'wheeze' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold">Expiratory Wheezing Audio</div>
                      <div className="text-[9px] font-mono text-white/40">44.1 kHz Mono Synthesis</div>
                    </div>
                  </div>
                  <Volume2 size={16} className="text-blue-400" />
                </div>
              </div>

              {/* Crackle Box */}
              <div className="glass-panel library-card crackle">
                <div>
                  <span className="badge crackle mb-2">Adventitious Sound (Discontinuous)</span>
                  <h3 className="text-lg font-bold mb-2">Pulmonary Crackles (Crepitations)</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Discontinuous bubbling, clicking, or rattling sounds. Produced by the sudden reopening of small airways containing secretions or fluid. Typical diagnostic signature of pneumonia, bronchitis, or heart failure fluid backups.
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 block mb-1">Acoustic Characteristics</span>
                    <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
                      <li>Frequency Range: 150 Hz – 800 Hz</li>
                      <li>Pitch: Discontinuous explosive pulses</li>
                      <li>Duration Ratio: Occurs during mid-to-late Inspiration</li>
                    </ul>
                  </div>
                </div>

                <div className="audio-player-widget">
                  <div className="audio-controls">
                    <button
                      onClick={() => {
                        if (isPlaying && soundType === 'crackle') {
                          setIsPlaying(false);
                        } else {
                          setIsConnected(true);
                          setSoundType('crackle');
                          setIsPlaying(true);
                        }
                      }}
                      className="play-circle-btn"
                    >
                      {isPlaying && soundType === 'crackle' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold">Coarse Crackles Audio</div>
                      <div className="text-[9px] font-mono text-white/40">44.1 kHz Mono Synthesis</div>
                    </div>
                  </div>
                  <Volume2 size={16} className="text-amber-500" />
                </div>
              </div>

              {/* Stridor Box */}
              <div className="glass-panel library-card stridor">
                <div>
                  <span className="badge stridor mb-2">Emergency Sound (Critical)</span>
                  <h3 className="text-lg font-bold mb-2">Inspiratory Stridor</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Loud, intense, monophonic crowing sounds indicating severe constriction of the upper airway (trachea, larynx, or epiglottis). Represents a medical emergency requiring rapid intervention to avoid sudden suffocation or laryngospasms.
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 block mb-1">Acoustic Characteristics</span>
                    <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
                      <li>Frequency Range: 300 Hz – 500 Hz</li>
                      <li>Pitch: Harsh, metallic vibration resonance</li>
                      <li>Duration Ratio: Dominant during Inspiration cycle</li>
                    </ul>
                  </div>
                </div>

                <div className="audio-player-widget">
                  <div className="audio-controls">
                    <button
                      onClick={() => {
                        if (isPlaying && soundType === 'stridor') {
                          setIsPlaying(false);
                        } else {
                          setIsConnected(true);
                          setSoundType('stridor');
                          setIsPlaying(true);
                        }
                      }}
                      className="play-circle-btn"
                    >
                      {isPlaying && soundType === 'stridor' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                    <div>
                      <div className="text-xs font-semibold">Upper Tracheal Stridor Audio</div>
                      <div className="text-[9px] font-mono text-white/40">44.1 kHz Mono Synthesis</div>
                    </div>
                  </div>
                  <Volume2 size={16} className="text-red-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PAGE 4: VIRTUAL MOBILE APP COMPANION MIRROR --- */}
        {activeTab === 'mobile' && (
          <div className="page-header" style={{ maxWidth: '1200px', margin: '20px auto 40px', padding: '0 20px', width: '100%' }}>
            <h2>Mobile Companion App Simulator</h2>
            <p>Interact with the smartphone application emulator representing the patient companion experience, featuring alerts and settings.</p>

            <div className="companion-container">
              {/* Outer Phone viewport frame */}
              <div className="phone-frame">
                <div className="phone-notch">
                  <div className="phone-speaker" />
                </div>

                {/* Status Bar */}
                <div className="phone-status-bar">
                  <span>15:26</span>
                  <div className="status-bar-icons">
                    <Bluetooth size={12} className={isConnected ? 'text-blue-400' : 'opacity-40'} />
                    <Wifi size={12} />
                    <Battery size={14} />
                  </div>
                </div>

                {/* Phone App Content Screens */}
                <div className="phone-screen">
                  
                  {/* Phone Header */}
                  <div className="phone-header">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase font-mono block">Patient Companion</span>
                      <h4 className="text-md font-bold text-white">RespiCheck Go</h4>
                    </div>
                    <div className="phone-avatar">HT</div>
                  </div>

                  {/* Active Alert Banner inside Phone Screen */}
                  {phoneAlert && phoneAlert.show ? (
                    <div className={`phone-alert-banner ${phoneAlert.finding === 'normal' ? 'normal' : ''}`}>
                      {phoneAlert.finding === 'normal' ? (
                        <CheckCircle size={18} className="phone-alert-icon text-green-500" />
                      ) : (
                        <AlertTriangle size={18} className="phone-alert-icon text-red-500 animate-bounce" />
                      )}
                      <div className="phone-alert-content">
                        <div className="phone-alert-title flex justify-between items-center text-white">
                          <span>{phoneAlert.title}</span>
                          <button onClick={clearPhoneAlert} className="text-white/40 hover:text-white" style={{ background: 'none', border: 'none', fontSize: '0.65rem' }}>✕</button>
                        </div>
                        <p className="phone-alert-desc">{phoneAlert.description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="phone-alert-banner normal" style={{ animation: 'none' }}>
                      <ShieldCheck size={18} className="phone-alert-icon text-green-500" />
                      <div className="phone-alert-content">
                        <div className="phone-alert-title text-white">System Active & Secure</div>
                        <p className="phone-alert-desc">Stethoscope linked. Daily respiratory rate scores optimal.</p>
                      </div>
                    </div>
                  )}

                  {/* Phone Dashboard view screen */}
                  {mobileScreen === 'dashboard' && (
                    <>
                      {/* Stats grids */}
                      <div className="phone-stats-grid">
                        <div className="phone-stat-card">
                          <Heart size={16} className="text-red-500" />
                          <div className="phone-stat-val">16 bpm</div>
                          <div className="phone-stat-lbl">Resting Breathing Rate</div>
                        </div>
                        <div className="phone-stat-card">
                          <Activity size={16} className="text-green-500" />
                          <div className="phone-stat-val">98%</div>
                          <div className="phone-stat-lbl">SpO2 Blood Oxygen</div>
                        </div>
                      </div>

                      {/* Health trends card mockup */}
                      <div className="glass-panel p-3 mb-4" style={{ borderRadius: 12 }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-white/50 uppercase">7-Day Health Trend</span>
                          <TrendingUp size={12} className="text-green-500" />
                        </div>
                        {/* Simulated visual bar charts */}
                        <div className="flex items-end justify-between h-14 px-2 pt-2">
                          <div className="w-4 bg-green-500/80 rounded-t" style={{ height: '80%' }} />
                          <div className="w-4 bg-green-500/80 rounded-t" style={{ height: '90%' }} />
                          <div className="w-4 bg-amber-500/80 rounded-t" style={{ height: '70%' }} />
                          <div className="w-4 bg-green-500/80 rounded-t" style={{ height: '85%' }} />
                          <div className="w-4 bg-green-500/80 rounded-t" style={{ height: '92%' }} />
                          <div className="w-4 bg-red-500/80 rounded-t" style={{ height: '50%' }} />
                          <div className="w-4 bg-green-500/90 rounded-t" style={{ height: '88%' }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-white/30 mt-1">
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Today</span>
                        </div>
                      </div>

                      {/* Synced reports list */}
                      <div className="mb-2">
                        <span className="text-[10px] font-mono text-white/50 uppercase block mb-2">Scan Logs History</span>
                        <div className="phone-sync-history">
                          {logs.slice(0, 3).map((log) => (
                            <div key={log.id} className="phone-log-item">
                              <div className="phone-log-info">
                                <div className="phone-log-title">{log.finding.toUpperCase()}</div>
                                <div className="phone-log-sub">{log.zoneName}</div>
                              </div>
                              <span className={`badge ${getSeverityClass(log.finding)}`} style={{ padding: '2px 6px', fontSize: '0.55rem' }}>
                                {log.finding}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone Logs Tab view */}
                  {mobileScreen === 'logs' && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-mono text-white/50 uppercase">Clinical Telemetry Transcripts</span>
                      <div className="flex flex-col gap-2">
                        {logs.map((log) => (
                          <div key={log.id} className="p-3 bg-white/2 border border-white/5 rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white">{log.patientId}</span>
                              <span className="text-[8px] font-mono text-white/40">{log.timestamp}</span>
                            </div>
                            <div className="text-[10px] text-white/70">
                              Lobe: <strong className="text-white">{log.zoneName}</strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`badge ${getSeverityClass(log.finding)}`} style={{ padding: '2px 6px', fontSize: '0.55rem' }}>
                                {log.finding}
                              </span>
                              <span className="text-[9px] text-white/50 font-mono">
                                Conf: {log.finding === 'normal' ? log.normalProb : log.finding === 'wheeze' ? log.wheezeProb : log.finding === 'crackle' ? log.crackleProb : log.stridorProb}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Phone Settings Tab view */}
                  {mobileScreen === 'settings' && (
                    <div className="flex flex-col gap-4">
                      <span className="text-[10px] font-mono text-white/50 uppercase">App Preferences</span>
                      
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-2.5 bg-white/2 rounded-lg border border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white">Auto-Record on Breath Trigger</div>
                            <div className="text-[8px] text-white/40">Launches diagnostics upon high airway sound pressure</div>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded accent-blue-500" />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-white/2 rounded-lg border border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white">Emergency Physician Broadcast</div>
                            <div className="text-[8px] text-white/40">Forwards stridor/critical findings to care portals</div>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded accent-blue-500" />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-white/2 rounded-lg border border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white">SMS Alert Contacts</div>
                            <div className="text-[8px] text-white/40">Notifies designated family members of warnings</div>
                          </div>
                          <input type="checkbox" className="rounded accent-blue-500" />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-white/2 rounded-lg border border-white/5">
                          <div>
                            <div className="text-xs font-bold text-white">Haptic Stethoscope Guide</div>
                            <div className="text-[8px] text-white/40">Vibrates phone when stethoscope spot is correct</div>
                          </div>
                          <input type="checkbox" defaultChecked className="rounded accent-blue-500" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom App Navigation inside Phone Frame */}
                <div className="phone-tab-bar">
                  <button
                    onClick={() => setMobileScreen('dashboard')}
                    className={`phone-tab-btn ${mobileScreen === 'dashboard' ? 'active' : ''}`}
                  >
                    <Activity size={14} />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={() => setMobileScreen('logs')}
                    className={`phone-tab-btn ${mobileScreen === 'logs' ? 'active' : ''}`}
                  >
                    <FileText size={14} />
                    <span>Logs</span>
                  </button>
                  <button
                    onClick={() => setMobileScreen('settings')}
                    className={`phone-tab-btn ${mobileScreen === 'settings' ? 'active' : ''}`}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="phone-home-indicator" />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- REPORT DETAILS POPUP DRAWER MODAL --- */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="report-modal">
            <button
              onClick={() => setSelectedReport(null)}
              className="close-btn"
            >
              ✕
            </button>

            <div className="report-header">
              <div>
                <span className="text-[10px] font-mono text-white/40 uppercase">Acoustic Diagnostics Division</span>
                <h3 className="text-xl font-bold text-white mt-0.5">Clinical Examination Report</h3>
              </div>
              <span className={`badge ${getSeverityClass(selectedReport.finding)}`}>
                {selectedReport.finding} Alert
              </span>
            </div>

            {/* Patient Meta stats grid */}
            <div className="report-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Patient Name</span>
                <span className="meta-value">{selectedReport.patientName}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Patient ID</span>
                <span className="meta-value font-mono">{selectedReport.patientId}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Age / Gender</span>
                <span className="meta-value">{selectedReport.age} y/o • {selectedReport.gender}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Diagnostic Timestamp</span>
                <span className="meta-value font-mono text-xs">{selectedReport.timestamp}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
              <span className="meta-label">Stethoscope Auscultation Field</span>
              <span className="meta-value text-white">{selectedReport.zoneName} ({selectedReport.zoneId.toUpperCase()})</span>
            </div>

            {/* Model Confidence Meter breakdown */}
            <div className="p-4 bg-white/2 border border-white/5 rounded-xl">
              <span className="meta-label block mb-3">Model Classification Breakdown</span>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-white/2 rounded">
                  <div className="text-[10px] font-mono text-white/40">Normal</div>
                  <div className="text-sm font-bold text-green-400 mt-1">{selectedReport.normalProb}%</div>
                </div>
                <div className="p-2 bg-white/2 rounded">
                  <div className="text-[10px] font-mono text-white/40">Wheeze</div>
                  <div className="text-sm font-bold text-blue-400 mt-1">{selectedReport.wheezeProb}%</div>
                </div>
                <div className="p-2 bg-white/2 rounded">
                  <div className="text-[10px] font-mono text-white/40">Crackle</div>
                  <div className="text-sm font-bold text-amber-500 mt-1">{selectedReport.crackleProb}%</div>
                </div>
                <div className="p-2 bg-white/2 rounded">
                  <div className="text-[10px] font-mono text-white/40">Stridor</div>
                  <div className="text-sm font-bold text-red-500 mt-1">{selectedReport.stridorProb}%</div>
                </div>
              </div>
            </div>

            {/* Pathologist Diagnosis Notes */}
            <div className="report-diagnostic-summary flex flex-col gap-1">
              <span className="meta-label">Diagnostic Summary Notes</span>
              <p className="text-xs text-white/70 leading-relaxed mt-1">
                {selectedReport.clinicalNotes}
              </p>
            </div>

            {/* Actions for clinic */}
            <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
              <button
                onClick={() => {
                  alert(`Diagnostic report for ${selectedReport.patientName} (${selectedReport.patientId}) has been successfully exported to CSV / PDF download queue.`);
                }}
                className="secondary-action-btn"
              >
                <Download size={14} />
                Download PDF
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="glow-btn"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
