/* eslint-env mocha */

import assert from 'assert'
import decode from './'

describe('Decoded tile', function () {
  const HEADERS = [
    'centerX',
    'centerY',
    'centerZ',
    'minHeight',
    'maxHeight',
    'boundingSphereCenterX',
    'boundingSphereCenterY',
    'boundingSphereCenterZ',
    'boundingSphereRadius',
    'horizonOcclusionPointX',
    'horizonOcclusionPointY',
    'horizonOcclusionPointZ'
  ]

  const INDICES = [
    'northIndices',
    'eastIndices',
    'southIndices',
    'westIndices',
    'triangleIndices'
  ]

  const EXTENSIONS = [
    'vertexNormals',
    'waterMask'
  ]

  // copied from writerLog using OpenTIN (https://github.com/heremaps/open-tin) to generate tiles
  const TileEncoderLog = {
    QuantizedMeshHeader_start: 0,
    VertexData_vertexCount_start: 88,
    VertexData_vertexCount: 189,
    VertexData_u_start: 92,
    VertexData_v_start: 470,
    VertexData_height_start: 848,
    IndexData_bits: 16,
    IndexData_triangleCount_start: 1226,
    IndexData_triangleCount: 337,
    IndexData_indices_start: 1230
  }

  it('should contain all fields', function () {
    const tileUrl = '/base/src/assets/tile-with-extensions.terrain'
    return window.fetch(tileUrl, {
      headers: {
        'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error(`Unable to load tile ${tileUrl}`)
        }

        return res.arrayBuffer()
      })
      .then(buffer => {
        const decodedTile = decode(buffer)
        assert(decodedTile.header instanceof Object)
        HEADERS.forEach(header => assert(typeof decodedTile.header[header] === 'number'))
        INDICES.forEach(indice => assert(decodedTile[indice] instanceof Uint16Array))
        assert(decodedTile.vertexData instanceof Uint16Array)
        assert(decodedTile.extensions instanceof Object)
        EXTENSIONS.forEach(extension =>
          assert(decodedTile.extensions[extension] instanceof ArrayBuffer))
      })
  })

  it('should have correct numbers', function () {
    const tileUrl = '/base/src/assets/tile-opentin.terrain'
    return window.fetch(tileUrl, {
      headers: {
        'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'
      }
    })
      .then(res => {
        if (res.status !== 200) {
          throw new Error(`Unable to load tile ${tileUrl}`)
        }

        return res.arrayBuffer()
      })
      .then(buffer => {
        const decodedTile = decode(buffer)
        assert.strictEqual(
          decodedTile.triangleIndices.length, TileEncoderLog.IndexData_triangleCount * 3)
        assert.strictEqual(
          decodedTile.vertexData.length, TileEncoderLog.VertexData_vertexCount * 3)
      })
  })
})
