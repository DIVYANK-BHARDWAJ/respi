import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  soundType: 'normal' | 'wheeze' | 'crackle' | 'stridor';
  isAnalyzing: boolean;
  isPlaying: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  soundType,
  isAnalyzing,
  isPlaying
}) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const scanCircleRef = useRef<SVGCircleElement | null>(null);
  const scanLineRef = useRef<SVGLineElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    let width = containerRef.current ? containerRef.current.offsetWidth : 400;
    let height = containerRef.current ? containerRef.current.offsetHeight : 200;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        width = containerRef.current.offsetWidth;
        height = containerRef.current.offsetHeight;
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const points = 180;
    const centerY = height / 2;
    const maxAmp = height * 0.35;

    const loop = () => {
      if (isPlaying) {
        phaseRef.current += isAnalyzing ? 0.22 : 0.08;
      }
      const t = phaseRef.current;

      let d = '';

      for (let i = 0; i < points; i++) {
        const x = (i / (points - 1)) * width;
        const normX = i / (points - 1);
        
        // Envelope to taper waves at edges
        const env = Math.sin(normX * Math.PI);

        let y = centerY;

        if (isPlaying) {
          switch (soundType) {
            case 'normal': {
              // Smooth, low frequency sinusoidal respiratory cycles
              const breathEnvelope = Math.sin(t * 0.15); // slow breathing rate
              const cycleAmplitude = Math.max(0.1, breathEnvelope);
              const freqVal = Math.sin(normX * 8 - t) * Math.cos(normX * 3);
              y += freqVal * cycleAmplitude * maxAmp * env;
              break;
            }
            case 'wheeze': {
              // Continuous high-pitched musical sound (sinusoidal but high frequency and overlapping harmonics)
              const breathEnvelope = Math.sin(t * 0.25);
              const cycleAmplitude = Math.max(0.15, breathEnvelope);
              const primary = Math.sin(normX * 28 - t * 2);
              const harmonic = Math.sin(normX * 56 - t * 3) * 0.4;
              const subHarmonic = Math.sin(normX * 14 - t * 0.5) * 0.2;
              y += (primary + harmonic + subHarmonic) * cycleAmplitude * maxAmp * 0.8 * env;
              break;
            }
            case 'crackle': {
              // Short, explosive, discontinuous bubbling sounds (transients super-imposed on a breathing wave)
              const baseBreath = Math.sin(normX * 5 - t * 0.5) * 0.15;
              
              // Simulate discontinuous crackling crackles (peaks)
              let crackleSum = 0;
              const seeds = [0.2, 0.45, 0.7, 0.85];
              seeds.forEach((seed, idx) => {
                const burstTime = (t * 0.8 + idx * 5) % 10;
                // create a burst centered around seed when burstTime is active
                const distance = Math.abs(normX - seed);
                if (burstTime < 1.5) {
                  // transient window
                  const burstAmp = Math.sin(burstTime * Math.PI / 1.5);
                  crackleSum += Math.sin(normX * 120 - t * 15) * Math.exp(-distance * 40) * burstAmp * 0.6;
                }
              });
              
              y += (baseBreath + crackleSum) * maxAmp * env;
              break;
            }
            case 'stridor': {
              // High-pitched, monophonic, intense crowing sound mostly during inspiration
              const breathCycle = Math.sin(t * 0.3);
              const isInspiration = breathCycle > 0;
              const cycleAmplitude = isInspiration ? breathCycle * 1.3 : 0.1;
              
              // Harsh jagged wave representing upper airway turbulence
              const base = Math.sin(normX * 32 - t * 3);
              const harshness1 = Math.sin(normX * 64 - t * 6) * 0.5;
              const harshness2 = (Math.random() - 0.5) * 0.15; // turbulent wind noise
              
              y += (base + harshness1 + harshness2) * cycleAmplitude * maxAmp * 0.9 * env;
              break;
            }
          }
        }

        // Add additional ripple if analyzing
        if (isAnalyzing) {
          y += Math.sin(normX * 100 - t * 4) * 3 * env;
        }

        if (i === 0) {
          d += `M ${x} ${y}`;
        } else {
          d += ` L ${x} ${y}`;
        }
      }

      // Direct DOM update on the SVG path for maximum performance
      if (pathRef.current) {
        pathRef.current.setAttribute('d', d);
      }

      // Handle animated scanning telemetry elements
      if (isAnalyzing) {
        const scanX = (t * 15) % width;
        if (scanLineRef.current) {
          scanLineRef.current.setAttribute('x1', String(scanX));
          scanLineRef.current.setAttribute('x2', String(scanX));
          scanLineRef.current.setAttribute('y2', String(height));
          scanLineRef.current.setAttribute('style', 'display: block');
        }
        if (scanCircleRef.current) {
          scanCircleRef.current.setAttribute('cx', String(scanX));
          scanCircleRef.current.setAttribute('cy', String(centerY));
          scanCircleRef.current.setAttribute('style', 'display: block');
        }
      } else {
        if (scanLineRef.current) scanLineRef.current.setAttribute('style', 'display: none');
        if (scanCircleRef.current) scanCircleRef.current.setAttribute('style', 'display: none');
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
    };
  }, [soundType, isAnalyzing, isPlaying]);

  // Color assignments
  let strokeColor = '#10B981';
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (soundType === 'wheeze') {
    strokeColor = '#3B82F6';
    glowColor = 'rgba(59, 130, 246, 0.4)';
  } else if (soundType === 'crackle') {
    strokeColor = '#F59E0B';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (soundType === 'stridor') {
    strokeColor = '#EF4444';
    glowColor = 'rgba(239, 68, 68, 0.5)';
  }

  return (
    <div ref={containerRef} className="waveform-feed-box">
      <svg className="waveform-canvas" style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* Background Grid Lines */}
        <g stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1">
          <line x1="20%" y1="0" x2="20%" y2="100%" />
          <line x1="40%" y1="0" x2="40%" y2="100%" />
          <line x1="60%" y1="0" x2="60%" y2="100%" />
          <line x1="80%" y1="0" x2="80%" y2="100%" />
          <line x1="0" y1="25%" x2="100%" y2="25%" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
          <line x1="0" y1="75%" x2="100%" y2="75%" />
        </g>

        {/* Dynamic Waveform Path */}
        <path
          ref={pathRef}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
            transition: 'stroke 0.3s ease'
          }}
        />

        {/* Diagnostic Scan Line indicator */}
        <line
          ref={scanLineRef}
          x1="0"
          y1="0"
          x2="0"
          y2="100"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="2"
          style={{ display: 'none' }}
        />
        <circle
          ref={scanCircleRef}
          cx="0"
          cy="0"
          r="6"
          fill={strokeColor}
          style={{ display: 'none', filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      
      <div className="waveform-badge">
        <span className={`waveform-dot ${
          soundType === 'normal' ? 'normal' :
          soundType === 'wheeze' ? 'wheeze' :
          soundType === 'crackle' ? 'crackle' : 'stridor'
        }`} />
        LIVE FEED: {soundType.toUpperCase()}
      </div>
      <div className="waveform-meta">
        44.1 kHz • 16-bit PCM
      </div>
    </div>
  );
};

export default WaveformVisualizer;
