import type { IKachel } from '../models/IKachel';
import type { ISiteKontext } from '../services/UrlHelper';
import type { OrdnerService } from '../services/OrdnerService';

export interface IProjektKachelnProps {
  titel: string;
  kacheln: IKachel[];
  site: ISiteKontext;
  ordnerService: OrdnerService;
  /** Grauer Hintergrund hinter der Kachel-Leiste */
  hintergrund: boolean;
  /** Bearbeitungsmodus der Seite – zeigt Hinweise statt leerem Webpart */
  bearbeitungsmodus: boolean;
  onKonfigurieren: () => void;
}
