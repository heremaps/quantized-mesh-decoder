Quantized-mesh decoder
===========================================

- Format specification: https://github.com/AnalyticalGraphicsInc/quantized-mesh
- Works both client-side and node.js

- Example:

```javascript
import decode from 'quantized-mesh-decoder'

const tileUrl = 'http://assets.agi.com/stk-terrain/world/tiles/0/0/0.terrain'
window.fetch(tileUrl, {
  headers: {
    'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'
  }
})
  .then(res => {
    if (res.status !== 200) {
      throw new Error(`Unable to load tile ${ tileUrl }`)
    }

    return res.arrayBuffer()
  })
  .then(buffer => {
    const decodedTile = decode(buffer)
    console.log(decodedTile)
  })
```