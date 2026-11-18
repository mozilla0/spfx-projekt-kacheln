import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  type IPropertyPaneField,
  type IPropertyPaneGroup,
  PropertyPaneButton,
  PropertyPaneButtonType,
  PropertyPaneDropdown,
  PropertyPaneHorizontalRule,
  PropertyPaneLabel,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'ProjektKachelnWebPartStrings';
import ProjektKacheln from './components/ProjektKacheln';
import type { IProjektKachelnProps } from './components/IProjektKachelnProps';
import { type IKachel, istLightbox, neueKachel, STANDARD_ORDNERPFAD } from './models/IKachel';
import { OrdnerService } from './services/OrdnerService';
import type { ISiteKontext } from './services/UrlHelper';

export interface IProjektKachelnWebPartProps {
  titel: string;
  kacheln: IKachel[];
  hintergrund: boolean;
  /** Optionale feste Kachelfarbe (#RRGGBB); leer = Primärfarbe des Website-Designs */
  kachelFarbe?: string;
}

const HEX_FARBE: RegExp = /^#[0-9a-f]{6}$/i;

export default class ProjektKachelnWebPart extends BaseClientSideWebPart<IProjektKachelnWebPartProps> {
  private _root: Root | undefined;
  private _site!: ISiteKontext;
  private _ordnerService!: OrdnerService;
  private _theme: IReadonlyTheme | undefined;

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._site = {
      absoluteUrl: this.context.pageContext.web.absoluteUrl,
      serverRelativeUrl: this.context.pageContext.web.serverRelativeUrl
    };
    this._ordnerService = new OrdnerService(this.context.spHttpClient, this._site);
    if (!Array.isArray(this.properties.kacheln)) {
      this.properties.kacheln = [];
    }
  }

  public render(): void {
    this._farbenSetzen();

    const element: React.ReactElement<IProjektKachelnProps> = React.createElement(ProjektKacheln, {
      titel: this.properties.titel,
      kacheln: this.properties.kacheln,
      site: this._site,
      ordnerService: this._ordnerService,
      hintergrund: this.properties.hintergrund !== false,
      bearbeitungsmodus: this.displayMode === DisplayMode.Edit,
      onKonfigurieren: () => this.context.propertyPane.open()
    });

    if (!this._root) {
      this._root = createRoot(this.domElement);
    }
    this._root.render(element);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    this._theme = currentTheme;
    this._farbenSetzen();
  }

  /** Farben aus dem Website-Design als CSS-Variablen setzen (Kacheln übernehmen so die Primärfarbe der Website) */
  private _farbenSetzen(): void {
    const palette = this._theme?.palette;
    const semantic = this._theme?.semanticColors;
    const style: CSSStyleDeclaration = this.domElement.style;
    const eigeneFarbe: string | undefined = HEX_FARBE.test(this.properties.kachelFarbe || '')
      ? this.properties.kachelFarbe
      : undefined;

    style.setProperty('--bodyText', semantic?.bodyText || null);
    style.setProperty('--neutralLighter', palette?.neutralLighter || null);
    style.setProperty('--kachelFarbe', eigeneFarbe || palette?.themePrimary || null);
    style.setProperty('--kachelFarbeHover', eigeneFarbe ? this._abdunkeln(eigeneFarbe) : palette?.themeDarkAlt || null);
    style.setProperty('--kachelText', eigeneFarbe ? '#ffffff' : palette?.white || null);
  }

  private _abdunkeln(hex: string): string {
    const kanal = (start: number): string =>
      ('0' + Math.round(parseInt(hex.substring(start, start + 2), 16) * 0.9).toString(16)).slice(-2);
    return `#${kanal(1)}${kanal(3)}${kanal(5)}`;
  }

  protected onDispose(): void {
    this._root?.unmount();
    this._root = undefined;
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected get disableReactivePropertyChanges(): boolean {
    return false;
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);
    // Aktion geändert → abhängige Felder (Ordnerpfad, Format) ein-/ausblenden
    if (/\.aktion$/.test(propertyPath)) {
      this.context.propertyPane.refresh();
    }
  }

  // ---------- Kacheln verwalten ----------

  private _kachelHinzufuegen(): void {
    this.properties.kacheln = [...(this.properties.kacheln || []), neueKachel()];
    this._nachAenderung();
  }

  private _kachelEntfernen(index: number): void {
    this.properties.kacheln = this.properties.kacheln.filter((_, i) => i !== index);
    this._nachAenderung();
  }

  private _kachelVerschieben(index: number, richtung: -1 | 1): void {
    const ziel: number = index + richtung;
    const liste: IKachel[] = [...this.properties.kacheln];
    if (ziel < 0 || ziel >= liste.length) {
      return;
    }
    [liste[index], liste[ziel]] = [liste[ziel], liste[index]];
    this.properties.kacheln = liste;
    this._nachAenderung();
  }

  private _nachAenderung(): void {
    this.context.propertyPane.refresh();
    this.render();
  }

  // ---------- Property Pane ----------

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const kacheln: IKachel[] = this.properties.kacheln || [];

    const kachelGruppen: IPropertyPaneGroup[] = kacheln.map((kachel, i) => {
      const felder: IPropertyPaneField<unknown>[] = [
        PropertyPaneTextField(`kacheln[${i}].titel`, { label: strings.KachelTitel }),
        PropertyPaneTextField(`kacheln[${i}].icon`, {
          label: strings.KachelIcon,
          description: strings.KachelIconBeschreibung
        }),
        PropertyPaneDropdown(`kacheln[${i}].aktion`, {
          label: strings.KachelAktion,
          options: [
            { key: 'lightbox', text: strings.AktionLightbox },
            { key: 'lightboxOrdner', text: strings.AktionLightboxOrdner },
            { key: 'neuerTab', text: strings.AktionNeuerTab },
            { key: 'gleichesFenster', text: strings.AktionGleichesFenster }
          ]
        }),
        PropertyPaneTextField(`kacheln[${i}].url`, {
          label: strings.KachelUrl,
          description: strings.KachelUrlBeschreibung,
          multiline: true,
          rows: 3,
          onGetErrorMessage: (wert: string) =>
            !wert || /^(https:\/\/|\/|\{site\}|\{siteRel\})/i.test(wert.trim()) ? '' : strings.KachelUrlFehler
        })
      ];

      if (kachel.aktion === 'lightboxOrdner') {
        felder.push(
          PropertyPaneTextField(`kacheln[${i}].ordnerPfad`, {
            label: strings.KachelOrdnerPfad,
            description: strings.KachelOrdnerPfadBeschreibung,
            placeholder: STANDARD_ORDNERPFAD
          })
        );
      }

      felder.push(
        PropertyPaneToggle(`kacheln[${i}].sourceAnhaengen`, {
          label: strings.KachelSource,
          onText: strings.Ja,
          offText: strings.Nein
        })
      );

      if (istLightbox(kachel.aktion)) {
        felder.push(
          PropertyPaneDropdown(`kacheln[${i}].format`, {
            label: strings.KachelFormat,
            options: [
              { key: '16:9', text: '16:9' },
              { key: '4:3', text: '4:3' },
              { key: '3:2', text: '3:2' },
              { key: 'gross', text: strings.FormatGross }
            ]
          })
        );
      }

      felder.push(
        PropertyPaneButton(`_aktion_hoch_${i}`, {
          text: strings.NachOben,
          icon: 'Up',
          buttonType: PropertyPaneButtonType.Command,
          disabled: i === 0,
          onClick: () => this._kachelVerschieben(i, -1)
        }),
        PropertyPaneButton(`_aktion_runter_${i}`, {
          text: strings.NachUnten,
          icon: 'Down',
          buttonType: PropertyPaneButtonType.Command,
          disabled: i === kacheln.length - 1,
          onClick: () => this._kachelVerschieben(i, 1)
        }),
        PropertyPaneButton(`_aktion_entfernen_${i}`, {
          text: strings.Entfernen,
          icon: 'Delete',
          buttonType: PropertyPaneButtonType.Command,
          onClick: () => this._kachelEntfernen(i)
        })
      );

      return {
        groupName: `${i + 1}. ${kachel.titel || strings.OhneTitel}`,
        isCollapsed: true,
        groupFields: felder
      };
    });

    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.AllgemeinGruppe,
              groupFields: [
                PropertyPaneTextField('titel', { label: strings.WebpartTitel }),
                PropertyPaneToggle('hintergrund', {
                  label: strings.Hintergrund,
                  onText: strings.Ja,
                  offText: strings.Nein
                }),
                PropertyPaneTextField('kachelFarbe', {
                  label: strings.KachelFarbe,
                  description: strings.KachelFarbeBeschreibung,
                  placeholder: '#0078D4',
                  onGetErrorMessage: (wert: string) => (!wert || HEX_FARBE.test(wert) ? '' : strings.KachelFarbeFehler)
                }),
                PropertyPaneHorizontalRule(),
                PropertyPaneLabel('_kachelAnzahl', {
                  text: strings.AnzahlKacheln.replace('{0}', String(kacheln.length))
                }),
                PropertyPaneButton('_aktion_hinzufuegen', {
                  text: strings.KachelHinzufuegen,
                  icon: 'Add',
                  buttonType: PropertyPaneButtonType.Primary,
                  onClick: () => this._kachelHinzufuegen()
                })
              ]
            },
            ...kachelGruppen
          ]
        }
      ]
    };
  }
}
