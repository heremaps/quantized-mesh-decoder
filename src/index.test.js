/* eslint-env mocha */

import assert from 'assert'
import decode from './'
import {
  groundTruthTriangles,
  createTriangle,
  compareTriangles,
  fetchTile
} from './test-utils'

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
    'waterMask',
    'metadata'
  ]

  // copied from writerLog using OpenTIN (https://github.com/heremaps/open-tin) to generate tiles
  const TileEncoderLog = {
    QuantizedMeshHeader_start: 0,
    VertexData_vertexCount_start: 88,
    VertexData_vertexCount: 4,
    VertexData_u_start: 92,
    VertexData_v_start: 100,
    VertexData_height_start: 108,
    IndexData_bits: 16,
    IndexData_triangleCount_start: 116,
    IndexData_triangleCount: 2,
    IndexData_indices_start: 120
  }

  it('should contain metadata extension', function () {
    const tileUrl = '/base/src/assets/tile-with-metadata-extension.terrain'
    return fetchTile(tileUrl)
      .then(buffer => {
        const decodedTile = decode(buffer)

        assert(decodedTile.extensions.metadata instanceof Object)
      })
  })

  it('should contain all fields, except metadata extension', function () {
    const tileUrl = '/base/src/assets/tile-with-extensions.terrain'
    return fetchTile(tileUrl)
      .then(buffer => {
        const decodedTile = decode(buffer)
        assert(decodedTile.header instanceof Object)
        HEADERS.forEach(header => assert(typeof decodedTile.header[header] === 'number'))
        INDICES.forEach(indice => assert(decodedTile[indice] instanceof Uint16Array))
        assert(decodedTile.vertexData instanceof Uint16Array)
        assert(decodedTile.extensions instanceof Object)
        EXTENSIONS.forEach(extension => {
          switch (extension) {
            case 'vertexNormals': {
              assert(decodedTile.extensions[extension] instanceof Uint8Array)
              break
            }
            case 'waterMask': {
              assert(decodedTile.extensions[extension] instanceof ArrayBuffer)
              break
            }
          }
        })
      })
  })

  it('should have correct numbers', function () {
    const tileUrl = '/base/src/assets/tile-opentin.terrain'
    return fetchTile(tileUrl)
      .then(buffer => {
        const decodedTile = decode(buffer)

        assert.strictEqual(
          decodedTile.triangleIndices.length, TileEncoderLog.IndexData_triangleCount * 3)
        assert.strictEqual(
          decodedTile.vertexData.length, TileEncoderLog.VertexData_vertexCount * 3)

        for (let i = 0; i < TileEncoderLog.IndexData_triangleCount; i++) {
          const triangle = createTriangle(
            [
              decodedTile.triangleIndices[i * 3],
              decodedTile.triangleIndices[i * 3 + 1],
              decodedTile.triangleIndices[i * 3 + 2]
            ],
            decodedTile.vertexData
          )
          compareTriangles(triangle, groundTruthTriangles[i])
        }
      })
  })
})
