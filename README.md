# Projekt-Kacheln (SPFx)

Webpart mit einer Kachel-Leiste für SharePoint-Websites. Die Kacheln öffnen Power Apps,
SharePoint-Seiten oder andere Ziele in einer Lightbox, in einem neuen Tab oder im gleichen Fenster
und übergeben Power Apps auf Wunsch Startparameter, damit die App weiss, von welcher Website sie gestartet wurde.

<img width="2560" height="1520" alt="image" src="https://github.com/user-attachments/assets/d2d6cd39-2f25-4065-bc6b-5878780f619b" />
<img width="2560" height="1520" alt="image" src="https://github.com/user-attachments/assets/ff48513e-6a1a-4b0e-aee6-c69b750208bf" />
<img width="2560" height="1520" alt="image" src="https://github.com/user-attachments/assets/7961a9d3-bcff-4e30-952e-99d801a4c936" />

## Funktionen

- Kachel-Leiste (Titel, Fluent-UI-Icon, Farbe aus dem Website-Design oder fest)
- Öffnen in **Lightbox** (Iframe mit Spinner, Schliessen per X / ESC / Klick auf Hintergrund,
  Knopf «In neuem Tab öffnen»), in neuem Tab oder im gleichen Fenster
- Startparameter für Power Apps:
  - `Source` = URL der aktuellen Website (z. B. `https://contoso.sharepoint.com/sites/projekt`)
  - `FolderList` (Aktion «Lightbox mit Ordnerliste») = Namen der Unterordner eines Ordners der Website,
    kommagetrennt, per SharePoint-REST gelesen
- Platzhalter in URLs: `{site}`, `{siteRel}` – dieselbe Konfiguration funktioniert auf jeder Website
- Kacheln im Property Pane hinzufügen, verschieben und entfernen

## Startparameter in der Power App

| Parameter    | Power Fx                           | Inhalt                                     |
|--------------|------------------------------------|--------------------------------------------|
| `Source`     | `Param("Source")`                  | URL der Website, auf der die Kachel liegt  |
| `FolderList` | `Split(Param("FolderList"), ",")`  | Unterordner des konfigurierten Ordners     |

Werte werden mit `encodeURIComponent` übergeben; `Param()` liefert sie decodiert zurück
(Sonderzeichen wie «&» oder Umlaute in Ordnernamen funktionieren).

## Entwicklung

- SPFx 1.24.1, Heft-Toolchain, React 18, Node 22 LTS
- `npm install`
- `npm start` – lokale Workbench
- `npm run build` – Produktionsbuild, Paket unter `sharepoint/solution/projekt-kacheln.sppkg`
- Vor jedem neuen Paket die Version in `config/package-solution.json` erhöhen.

## Deployment

```powershell
Connect-PnPOnline -Url https://<tenant>-admin.sharepoint.com -Interactive -ClientId <App-ID>
Add-PnPApp -Path .\sharepoint\solution\projekt-kacheln.sppkg -Scope Tenant -Publish -Overwrite
```

Das Paket nutzt `skipFeatureDeployment` – nach dem Hochladen ist das Webpart auf allen Websites verfügbar
(Toolbox-Gruppe «Projekt»). Es sind keine API-Berechtigungen nötig.
