// using OpenTIN (https://github.com/heremaps/open-tin) to generate tiles
// this logging information was added for this testing purpose, it is not in the standard output of OpenTIN
// from 0 to 1
// triangle encoded values: dvec3(0.255763, 0.805321, 0.000000), dvec3(0.300351, 0.760477, 1.000000), dvec3(0.300351, 0.805321, 0.000000)
// triangle encoded values: dvec3(0.300351, 0.760477, 1.000000), dvec3(0.255763, 0.805321, 0.000000), dvec3(0.255763, 0.760477, 0.000000)

import assert from 'assert'

const OLD_MIN = 0
const OLD_MAX = 1

const NEW_MIN = 0
const NEW_MAX = 32767
const changeRange = value => (((value - OLD_MIN) * (NEW_MAX - NEW_MIN)) / (OLD_MAX - OLD_MIN)) + NEW_MIN

// Math.floor is needed because quantized-mesh uses integers
const triangleOne = [
  [0.255763, 0.805321, 0.000000].map(v => Math.floor(changeRange(v))),
  [0.300351, 0.760477, 1.000000].map(v => Math.floor(changeRange(v))),
  [0.300351, 0.805321, 0.000000].map(v => Math.floor(changeRange(v)))
]

const triangleTwo = [
  [0.300351, 0.760477, 1.000000].map(v => Math.floor(changeRange(v))),
  [0.255763, 0.805321, 0.000000].map(v => Math.floor(changeRange(v))),
  [0.255763, 0.760477, 0.000000].map(v => Math.floor(changeRange(v)))
]

export const groundTruthTriangles = [triangleOne, triangleTwo]

export function createTriangle (indices, vertexData) {
  const vertexCount = vertexData.length / 3
  return indices.map(i => [
    vertexData[i],
    vertexData[i + vertexCount],
    vertexData[i + vertexCount * 2]
  ])
}

export function compareTriangles (t1, t2) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      assert.strictEqual(t1[i][j], t2[i][j])
    }
  }
}

export function fetchTile (url) {
  return window.fetch(url, {
    headers: {
      'Accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9'
    }
  })
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`Unable to load tile ${url}`)
      }

      return res.arrayBuffer()
    })
}
