import * as React from 'react';
import { Layer, Icon, MessageBar, MessageBarType } from '@fluentui/react';
import * as strings from 'ProjektKachelnWebPartStrings';
import type { LightboxFormat } from '../models/IKachel';
import styles from './Lightbox.module.scss';

export interface ILightboxProps {
  /** Geladene Ziel-URL; undefined, solange sie noch ermittelt wird (z. B. Ordnerliste) */
  url?: string;
  titel: string;
  format: LightboxFormat;
  fehler?: string;
  onClose: () => void;
}

const SEITENVERHAELTNIS: Record<Exclude<LightboxFormat, 'gross'>, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '3:2': 3 / 2
};

/**
 * Lightbox mit Iframe:
 * abgedunkelter Hintergrund, Spinner bis das Iframe geladen ist,
 * Schliessen per X, Klick auf den Hintergrund oder ESC; Seite scrollt währenddessen nicht.
 */
export const Lightbox: React.FC<ILightboxProps> = (props) => {
  const { url, titel, format, fehler, onClose } = props;
  const [geladen, setGeladen] = React.useState<boolean>(false);
  const [sichtbar, setSichtbar] = React.useState<boolean>(false);
  const schliessenRef = React.useRef<HTMLButtonElement>(null);

  // sanft einblenden
  React.useEffect(() => {
    const frame: number = window.requestAnimationFrame(() => setSichtbar(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Neue URL → Spinner wieder anzeigen
  React.useEffect(() => {
    setGeladen(false);
  }, [url]);

  // ESC schliesst, Body-Scroll sperren, Fokus auf Schliessen-Knopf
  React.useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const vorherOverflow: string = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    schliessenRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = vorherOverflow;
    };
  }, [onClose]);

  const holderStyle: React.CSSProperties =
    format === 'gross'
      ? { width: '94vw', height: '90vh' }
      : {
          // so breit wie möglich (max. 80 % der Breite), aber nie höher als 85 % der Fensterhöhe
          width: `min(80vw, calc(85vh * ${SEITENVERHAELTNIS[format]}))`,
          aspectRatio: `${SEITENVERHAELTNIS[format]}`
        };

  return (
    <Layer>
      <div
        className={`${styles.lightbox} ${sichtbar ? styles.sichtbar : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titel}
      >
        <div className={styles.backdrop} onClick={onClose} />

        <div className={styles.contentHolder} style={holderStyle}>
          {fehler ? (
            <div className={styles.fehler}>
              <MessageBar messageBarType={MessageBarType.error}>{fehler}</MessageBar>
            </div>
          ) : (
            <>
              {!geladen && <div className={styles.spinner} aria-label={strings.LightboxLaedt}><div className={styles.circle1} /><div className={styles.circle2} /></div>}
              {url && (
                <iframe
                  key={url}
                  className={`${styles.iframe} ${geladen ? styles.iframeGeladen : ''}`}
                  src={url}
                  title={titel}
                  allow="camera; microphone; geolocation; clipboard-read; clipboard-write; fullscreen"
                  allowFullScreen={true}
                  onLoad={() => setGeladen(true)}
                />
              )}
            </>
          )}
        </div>

        <div className={styles.aktionen}>
          {url && (
            <a
              className={styles.aktion}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={strings.LightboxNeuerTab}
              aria-label={strings.LightboxNeuerTab}
              onClick={onClose}
            >
              <Icon iconName="OpenInNewWindow" />
            </a>
          )}
          <button
            ref={schliessenRef}
            type="button"
            className={styles.aktion}
            title={strings.LightboxSchliessen}
            aria-label={strings.LightboxSchliessen}
            onClick={onClose}
          >
            <Icon iconName="Cancel" />
          </button>
        </div>
      </div>
    </Layer>
  );
};
