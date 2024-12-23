import { GlyphOrganizer } from "/core/glyph-organizer.js";
import * as html from "/core/html-utils.js";
import { translate } from "/core/localization.js";
import { GlyphSearchField } from "/web-components/glyph-search-field.js";

export class FontOverviewNavigation extends HTMLElement {
  constructor(fontOverviewController) {
    super();

    this.fontController = fontOverviewController.fontController;
    this.fontOverviewSettingsObserver =
      fontOverviewController.fontOverviewSettingsObserver;
    this.glyphOrganizer = new GlyphOrganizer();
  }

  async start() {
    this.fontSources = await this.fontController.getSources();

    this.currentFontSourceIdentifier =
      this.fontController.fontSourcesInstancer.defaultSourceIdentifier;
    this.fontOverviewSettingsObserver.model.fontLocationSourceMapped = {
      ...this.fontSources[this.currentFontSourceIdentifier]?.location,
    }; // Note: a font may not have font sources therefore the ?-check.

    this._setupUI();
  }

  _setupUI() {
    // font source selector
    this.fontSourceInput = html.select(
      {
        id: "font-source-select",
        style: "width: 100%;",
        onchange: (event) => {
          this.currentFontSourceIdentifier = event.target.value;
          this.fontOverviewSettingsObserver.model.fontLocationSourceMapped = {
            ...this.fontSources[this.currentFontSourceIdentifier].location,
          };
        },
      },
      []
    );

    for (const fontSourceIdentifier of this.fontController.getSortedSourceIdentifiers()) {
      const sourceName = this.fontSources[fontSourceIdentifier].name;
      this.fontSourceInput.appendChild(
        html.option(
          {
            value: fontSourceIdentifier,
            selected: this.currentFontSourceIdentifier === fontSourceIdentifier,
          },
          [sourceName]
        )
      );
    }

    const fontSourceSelector = html.div(
      {
        class: "font-source-selector",
      },
      [
        html.label(
          { for: "font-source-select" },
          translate("sidebar.font-overview.font-source")
        ),
        this.fontSourceInput,
      ]
    );

    // glyph search
    this.searchField = new GlyphSearchField({
      observer: this.fontOverviewSettingsObserver,
      observerKey: "searchString",
    });

    this.appendChild(this.searchField);
    this.appendChild(fontSourceSelector);
  }

  getUserLocation() {
    const sourceLocation = this.fontSources[this.currentFontSourceIdentifier]
      ? this.fontSources[this.currentFontSourceIdentifier].location
      : {};
    return this.fontController.mapSourceLocationToUserLocation(sourceLocation);
  }
}

customElements.define("font-overview-navigation", FontOverviewNavigation);
