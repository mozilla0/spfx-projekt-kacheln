import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { ISiteKontext } from './UrlHelper';

interface IOrdnerAntwort {
  value: { Name: string }[];
}

/**
 * Liest die Namen der Unterordner eines Ordners der aktuellen Website.
 * Läuft mit den Rechten der angemeldeten Person über den SPFx-Kontext.
 */
export class OrdnerService {
  constructor(private readonly _spHttpClient: SPHttpClient, private readonly _site: ISiteKontext) {}

  public async unterordnerLesen(ordnerPfad: string): Promise<string[]> {
    const relativ: string = (ordnerPfad || '').trim().replace(/^\/+|\/+$/g, '');
    const serverRelativ: string = `${this._site.serverRelativeUrl.replace(/\/$/, '')}/${relativ}`;
    // Apostrophe für OData verdoppeln, danach als Ganzes URL-codieren (Umlaute, &, # usw.)
    const pfadParameter: string = encodeURIComponent(serverRelativ.replace(/'/g, "''"));

    const url: string =
      `${this._site.absoluteUrl.replace(/\/$/, '')}/_api/web/` +
      `GetFolderByServerRelativePath(decodedurl='${pfadParameter}')/Folders` +
      `?$select=Name&$orderby=Name`;

    const antwort: SPHttpClientResponse = await this._spHttpClient.get(url, SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata.metadata=none' }
    });

    if (!antwort.ok) {
      throw new Error(`Ordner «${serverRelativ}» konnte nicht gelesen werden (HTTP ${antwort.status}).`);
    }

    const daten: IOrdnerAntwort = await antwort.json();
    return (daten.value || [])
      .map((ordner) => ordner.Name)
      .filter((name) => name && name !== 'Forms');
  }
}
