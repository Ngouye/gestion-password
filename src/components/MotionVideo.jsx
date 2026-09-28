import { useEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import videoSrc from '../assets/video/securevault-motion.mp4';
import posterSrc from '../assets/video/securevault-motion-poster.jpg';

// Débuts de chapitre légèrement avancés pour voir chaque titre apparaître.
const CHAPTERS = [
  { start: 0, label: 'Introduction', title: 'Le même mot de passe partout ?' },
  { start: 11.5, label: '01 — Déverrouillage', title: 'Un seul mot de passe à retenir' },
  { start: 17.5, label: '02 — Coffre', title: 'Vos accès retrouvés et copiés en un clic' },
  { start: 27.5, label: '03 — Générateur', title: 'Des mots de passe forts, générés pour vous' },
  { start: 37.5, label: '04 — Chiffrement', title: 'Chiffré de bout en bout : vous seul détenez la clé' },
];

function formatTime(seconds) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Pas de lecture automatique si l'utilisateur limite les animations ou les données.
function prefersStillMedia() {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return Boolean(reducedMotion || navigator.connection?.saveData);
}

export default function MotionVideo() {
  const videoRef = useRef(null);
  const userPaused = useRef(false);
  const heardWithSound = useRef(false);
  const [stillMedia] = useState(prefersStillMedia);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(56);

  // Lecture muette quand la vidéo est à l'écran, pause dès qu'elle en sort.
  useEffect(() => {
    const video = videoRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!stillMedia && !userPaused.current) video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }, { threshold: 0.55 });
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [stillMedia]);

  // Contrôles natifs uniquement en plein écran.
  useEffect(() => {
    const video = videoRef.current;
    const sync = () => {
      video.controls = document.fullscreenElement === video;
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const play = () => {
    userPaused.current = false;
    videoRef.current.play().catch(() => {});
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      play();
    } else {
      userPaused.current = true;
      videoRef.current.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (video.muted) {
      video.muted = false;
      // La première écoute reprend au début pour entendre toute la voix off.
      if (!heardWithSound.current) {
        heardWithSound.current = true;
        video.currentTime = 0;
      }
      play();
    } else {
      video.muted = true;
    }
  };

  const seek = (start) => {
    videoRef.current.currentTime = start;
    play();
  };

  const enterFullscreen = () => {
    const video = videoRef.current;
    if (video.requestFullscreen) video.requestFullscreen().catch(() => {});
    else video.webkitEnterFullscreen?.();
  };

  const activeIndex = CHAPTERS.findLastIndex((chapter) => time >= chapter.start);

  return (
    <section id="video" className="section video-section">
      <div className="container video-grid">
        <header className="section-heading align-left video-head">
          <span className="eyebrow">En vidéo · {formatTime(duration)}</span>
          <h2>
            SecureVault en une minute.
            <span className="text-accent">Tout comprendre, sans jargon.</span>
          </h2>
          <p>Déverrouillage, coffre, générateur et chiffrement : l’essentiel, chapitre par chapitre.</p>
        </header>

        <ol className="chapters" aria-label="Chapitres de la vidéo">
          {CHAPTERS.map((chapter, i) => {
            const end = CHAPTERS[i + 1]?.start ?? duration;
            const progress = i === activeIndex ? Math.min(1, (time - chapter.start) / (end - chapter.start)) : 0;
            return (
              <li key={chapter.start}>
                <button
                  type="button"
                  className={`chapter ${i === activeIndex ? 'is-active' : ''} ${i < activeIndex ? 'is-done' : ''}`}
                  onClick={() => seek(chapter.start)}
                  aria-current={i === activeIndex ? 'step' : undefined}
                >
                  <span className="chapter-label">{chapter.label}</span>
                  <span className="chapter-title">{chapter.title}</span>
                  <span className="chapter-time">{formatTime(chapter.start)}</span>
                  <span className="chapter-progress" style={{ '--progress': progress }} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="reel-wrap">
          <div className={`reel ${playing ? 'is-playing' : ''}`}>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              muted
              loop={muted}
              playsInline
              preload="none"
              aria-label="Présentation vidéo de SecureVault"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
            />

            <button
              type="button"
              className="reel-toggle"
              onClick={togglePlay}
              aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
            >
              <span className="reel-play" aria-hidden="true">
                {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
              </span>
            </button>

            <div className="reel-controls">
              <button
                type="button"
                className={`reel-sound ${muted ? 'is-muted' : ''}`}
                onClick={toggleSound}
                aria-label={muted ? 'Activer le son' : 'Couper le son'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>{muted ? 'Regarder avec le son' : 'Son activé'}</span>
              </button>
              <button type="button" className="reel-icon" onClick={enterFullscreen} aria-label="Plein écran">
                <Maximize2 size={16} />
              </button>
            </div>

            <span className="reel-progress" style={{ '--progress': time / duration }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
