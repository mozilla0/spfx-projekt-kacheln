import * as React from 'react';
import { Icon, PrimaryButton } from '@fluentui/react';
import * as strings from 'ProjektKachelnWebPartStrings';
import styles from './ProjektKacheln.module.scss';
import type { IProjektKachelnProps } from './IProjektKachelnProps';
import { type IKachel, type LightboxFormat, STANDARD_ORDNERPFAD } from '../models/IKachel';
import { parameterAnhaengen, platzhalterErsetzen } from '../services/UrlHelper';
import { Lightbox } from './Lightbox';

interface ILightboxZustand {
  titel: string;
  format: LightboxFormat;
  url?: string;
  fehler?: string;
}

const ProjektKacheln: React.FC<IProjektKachelnProps> = (props) => {
  const { titel, kacheln, site, ordnerService, hintergrund, bearbeitungsmodus, onKonfigurieren } = props;
  const [lightbox, setLightbox] = React.useState<ILightboxZustand | undefined>(undefined);
  // verhindert, dass eine verspätete Ordnerabfrage eine bereits geschlossene Lightbox wieder öffnet
  const aufrufRef = React.useRef<number>(0);

  const schliessen = React.useCallback((): void => {
    aufrufRef.current++;
    setLightbox(undefined);
  }, []);

  /** Ziel-URL inkl. Startparameter aufbauen (wie bisher: Source=<Website-URL>) */
  const basisUrl = (kachel: IKachel): string => {
    const url: string = platzhalterErsetzen(kachel.url, site);
    return kachel.sourceAnhaengen ? parameterAnhaengen(url, { Source: site.absoluteUrl }) : url;
  };

  const kachelOeffnen = async (kachel: IKachel): Promise<void> => {
    if (!kachel.url) {
      return;
    }

    switch (kachel.aktion) {
      case 'neuerTab':
        window.open(basisUrl(kachel), '_blank', 'noopener');
        return;

      case 'gleichesFenster':
        window.location.href = basisUrl(kachel);
        return;

      case 'lightbox':
        setLightbox({ titel: kachel.titel, format: kachel.format || '16:9', url: basisUrl(kachel) });
        return;

      case 'lightboxOrdner': {
        // Lightbox sofort mit Spinner öffnen, Ordnerliste parallel lesen
        const aufruf: number = ++aufrufRef.current;
        setLightbox({ titel: kachel.titel, format: kachel.format || '16:9' });
        try {
          const ordner: string[] = await ordnerService.unterordnerLesen(kachel.ordnerPfad || STANDARD_ORDNERPFAD);
          if (aufruf !== aufrufRef.current) {
            return;
          }
          const url: string = parameterAnhaengen(basisUrl(kachel), { FolderList: ordner.join(',') });
          setLightbox({ titel: kachel.titel, format: kachel.format || '16:9', url });
        } catch (error) {
          if (aufruf !== aufrufRef.current) {
            return;
          }
          setLightbox({
            titel: kachel.titel,
            format: kachel.format || '16:9',
            fehler: error instanceof Error ? error.message : String(error)
          });
        }
        return;
      }
    }
  };

  const sichtbareKacheln: IKachel[] = (kacheln || []).filter((k) => k && k.titel);

  if (sichtbareKacheln.length === 0) {
    return bearbeitungsmodus ? (
      <div className={styles.leer}>
        <p>{strings.KeineKacheln}</p>
        <PrimaryButton text={strings.Konfigurieren} onClick={onKonfigurieren} />
      </div>
    ) : null;
  }

  return (
    <section className={`${styles.projektKacheln} ${hintergrund ? styles.mitHintergrund : ''}`}>
      {titel && <h2 className={styles.titel}>{titel}</h2>}

      <div className={styles.kacheln}>
        {sichtbareKacheln.map((kachel, index) => (
          <button
            key={`${index}-${kachel.titel}`}
            type="button"
            className={styles.kachel}
            title={kachel.titel}
            disabled={!kachel.url}
            onClick={() => {
              kachelOeffnen(kachel).catch(() => {
                /* Fehler werden in der Lightbox angezeigt */
              });
            }}
          >
            <Icon iconName={kachel.icon || 'AppIconDefault'} className={styles.icon} />
            <span className={styles.name}>{kachel.titel}</span>
          </button>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          titel={lightbox.titel}
          format={lightbox.format}
          url={lightbox.url}
          fehler={lightbox.fehler}
          onClose={schliessen}
        />
      )}
    </section>
  );
};

export default ProjektKacheln;
