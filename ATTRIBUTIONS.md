This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).
## Map and location data (bundled, used offline)

- Country outlines: [Natural Earth](https://www.naturalearthdata.com/) (public domain), via the [world-atlas](https://github.com/topojson/world-atlas) package (ISC).
- US state borders: U.S. Census Bureau cartographic boundaries (public domain), via the [us-atlas](https://github.com/topojson/us-atlas) package (ISC).
- Location gazetteer (`src/data/gazetteer.json`): [GeoNames](https://www.geonames.org/) data, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Compiled with `scripts/build-gazetteer.mjs` from `cities15000`, `admin1CodesASCII` and `countryInfo`; region and country positions are derived population-weighted centres.
- Map rendering: [d3-geo](https://github.com/d3/d3-geo) and [topojson-client](https://github.com/topojson/topojson-client) (ISC).
