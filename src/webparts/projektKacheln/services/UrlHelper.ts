export interface ISiteKontext {
  /** z. B. https://contoso.sharepoint.com/sites/projekt */
  absoluteUrl: string;
  /** z. B. /sites/projekt */
  serverRelativeUrl: string;
}

/** Ersetzt die Platzhalter {site} und {siteRel} in einer konfigurierten URL. */
export function platzhalterErsetzen(url: string, site: ISiteKontext): string {
  return (url || '')
    .trim()
    .replace(/\{site\}/gi, site.absoluteUrl.replace(/\/$/, ''))
    .replace(/\{siteRel\}/gi, site.serverRelativeUrl.replace(/\/$/, ''));
}

/**
 * Hängt Query-Parameter an eine URL an – mit encodeURIComponent (Leerzeichen als %20),
 * damit Param() in Power Apps die Werte unverändert zurückliefert.
 * Ein vorhandener Hash (#…) bleibt am Ende erhalten.
 */
export function parameterAnhaengen(url: string, parameter: Record<string, string | undefined>): string {
  const hashIndex: number = url.indexOf('#');
  const basis: string = hashIndex >= 0 ? url.substring(0, hashIndex) : url;
  const hash: string = hashIndex >= 0 ? url.substring(hashIndex) : '';

  const teile: string[] = Object.keys(parameter)
    .filter((key) => parameter[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(parameter[key] as string)}`);

  if (teile.length === 0) {
    return url;
  }

  let trenner: string = '&';
  if (basis.indexOf('?') < 0) {
    trenner = '?';
  } else if (basis.endsWith('?') || basis.endsWith('&')) {
    trenner = '';
  }

  return `${basis}${trenner}${teile.join('&')}${hash}`;
}
