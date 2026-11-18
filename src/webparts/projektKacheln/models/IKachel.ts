/**
 * Wie eine Kachel ihr Ziel öffnet.
 * - lightbox:        Ziel-URL im Lightbox-Iframe öffnen (z. B. Power App, SharePoint-Seite)
 * - lightboxOrdner:  wie lightbox, zusätzlich wird die Unterordner-Liste eines Ordners
 *                    der aktuellen Website als Parameter «FolderList» mitgegeben
 * - neuerTab:        Ziel in neuem Browser-Tab öffnen
 * - gleichesFenster: Ziel im aktuellen Fenster öffnen
 */
export type KachelAktion = 'lightbox' | 'lightboxOrdner' | 'neuerTab' | 'gleichesFenster';

/** Format der Lightbox (Seitenverhältnis bzw. Vollbild). */
export type LightboxFormat = '16:9' | '4:3' | '3:2' | 'gross';

export interface IKachel {
  /** Anzeigetext unter dem Icon */
  titel: string;
  /** Fluent-UI-Iconname, z. B. «FabricNewFolder» */
  icon: string;
  aktion: KachelAktion;
  /**
   * Ziel-URL. Platzhalter:
   * {site}      absolute URL der aktuellen Website (https://…/sites/projekt)
   * {siteRel}   serverrelative URL der aktuellen Website (/sites/projekt)
   */
  url: string;
  /** Nur bei «lightboxOrdner»: Ordnerpfad relativ zur Website */
  ordnerPfad?: string;
  /** Hängt «Source=<Website-URL>» an die Ziel-URL an */
  sourceAnhaengen: boolean;
  /** Nur bei Lightbox-Aktionen */
  format?: LightboxFormat;
}

export const STANDARD_ORDNERPFAD: string = 'Freigegebene Dokumente';

export function neueKachel(): IKachel {
  return {
    titel: 'Neue Kachel',
    icon: 'AppIconDefault',
    aktion: 'lightbox',
    url: '',
    sourceAnhaengen: true,
    format: '16:9'
  };
}

export function istLightbox(aktion: KachelAktion): boolean {
  return aktion === 'lightbox' || aktion === 'lightboxOrdner';
}
