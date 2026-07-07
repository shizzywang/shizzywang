import { useState } from 'react'
import {
  SPOTIFY_PROFILE_SUBTITLE,
  SPOTIFY_PROFILE_TITLE,
  SPOTIFY_PROFILE_URL,
} from '../data/spotify-playlists'

type SpotifyPlaylistsProps = {
  visible?: boolean
}

function SpotifyLogo() {
  return (
    <svg
      className="spotify-playlists__logo"
      viewBox="0 0 24 24"
      width="42"
      height="42"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </svg>
  )
}

export function SpotifyPlaylists({ visible = true }: SpotifyPlaylistsProps) {
  const [entered, setEntered] = useState(false)

  return (
    <section
      className={[
        'spotify-playlists',
        entered && 'spotify-playlists--entered',
        !visible && 'spotify-playlists--hidden',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Spotify playlists"
      aria-hidden={!visible}
      onAnimationEnd={(event) => {
        if (event.animationName === 'landing-crest-enter') {
          setEntered(true)
        }
      }}
    >
      <a
        className="spotify-playlists__bar"
        href={SPOTIFY_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
      >
        <SpotifyLogo />
        <span className="spotify-playlists__meta">
          <span className="spotify-playlists__title">{SPOTIFY_PROFILE_TITLE}</span>
          <span className="spotify-playlists__subtitle">{SPOTIFY_PROFILE_SUBTITLE}</span>
        </span>
        <span className="spotify-playlists__play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="currentColor" d="M8 5v14l11-7z" />
          </svg>
        </span>
      </a>
    </section>
  )
}
