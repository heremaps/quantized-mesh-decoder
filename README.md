Quantized Mesh Decoder
===========================================

JavaScript decoder for the [Quantized Mesh format](https://github.com/AnalyticalGraphicsInc/quantized-mesh).

```
npm i heremaps/quantized-mesh-decoder
```

### API Reference

```javascript
import decode from '@here/quantized-mesh-decoder'

decode(buffer, options)
```

* buffer: [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
* options: [DecoderOptions](#decoderoptions)

##### DecoderOptions

* maxDecodingStep: Number  
  Limits how deep decoder should go.  Takes of the properties of the `DECODING_STEPS` map. See `import { DECODING_STEPS } from '@here/quantized-mesh-decoder' `.   
  Default: `DECODING_STEPS.extensions`.


### Links

* [Quantized Mesh Specification](https://github.com/AnalyticalGraphicsInc/quantized-mesh)
* [Quantized Mesh Viewer](https://github.com/heremaps/quantized-mesh-viewer)
* [OpenTIN](https://github.com/heremaps/open-tin) — tool to generate Quantized Mesh tiles out of GeoTIFF

### Tiles attribution

- Two tiles are used for testing purposes
  - `src/assets/tile-with-extensions.terrain`: CesiumIon at https://cesiumjs.org/Cesium/Build/Apps/Sandcastle/index.html?src=Terrain.html
  - `src/assets/tile-opentin.terrain`: Open data from brazilian government [IBGE](https://ww2.ibge.gov.br/english/) at `ftp://geoftp.ibge.gov.br//modelos_digitais_de_superficie/modelo_digital_de_elevacao_mde/rj25/tif/mde_2685a3no_v1.zip`
