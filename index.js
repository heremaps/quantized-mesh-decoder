const QUANTIZED_MESH_HEADER = new Map([
  ['centerX', Float64Array.BYTES_PER_ELEMENT],
  ['centerY', Float64Array.BYTES_PER_ELEMENT],
  ['centerZ', Float64Array.BYTES_PER_ELEMENT],

  ['minHeight', Float32Array.BYTES_PER_ELEMENT],
  ['maxHeight', Float32Array.BYTES_PER_ELEMENT],

  ['boundingSphereCenterX', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereCenterY', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereCenterZ', Float64Array.BYTES_PER_ELEMENT],
  ['boundingSphereRadius', Float64Array.BYTES_PER_ELEMENT],

  ['horizonOcclusionPointX', Float64Array.BYTES_PER_ELEMENT],
  ['horizonOcclusionPointY', Float64Array.BYTES_PER_ELEMENT],
  ['horizonOcclusionPointZ', Float64Array.BYTES_PER_ELEMENT]
])

function decodeZigZag (value) {
  return (value >> 1) ^ (-(value & 1))
}

function signNotZero (vector) {
  return new THREE.Vector2(
    vector.x >= 0 ? 1 : -1,
    vector.y >= 0 ? 1 : -1
    )
}

function decodeOct (encodedVector) {
  let decodedVector = encodedVector.divideScalar(255).multiplyScalar(2).subScalar(1)

  decodedVector = new THREE.Vector3(
    decodedVector.x,
    decodedVector.y,
    1 - Math.abs(decodedVector.x) - Math.abs(decodedVector.y)
    )

  if (decodedVector.z < 0) {
    const xy = new THREE.Vector2(decodedVector.x, decodedVector.y)
    const xyAbs = xy.distanceTo(new THREE.Vector2(0, 0))
    const xySign = signNotZero(xy)
    const decodedXy = xySign.multiplyScalar(1 - xyAbs)

    decodedVector.set(decodedXy.x, decodedXy.y, decodedVector.z)
  }

  return decodedVector.normalize()
}

function decodeHeader (dataView) {
  let position = 0
  const header = {}

  for (let [key, bytesCount] of QUANTIZED_MESH_HEADER) {
    const getter = bytesCount === 8 ? dataView.getFloat64 : dataView.getFloat32

    header[key] = getter.call(dataView, position, true)
    position += bytesCount
  }

  return { header, headerEndPosition: position }
}

function decodeVertexData (dataView, headerEndPosition) {
  let position = headerEndPosition
  const elementsPerVertex = 3
  const vertexCount = dataView.getUint32(position, true)
  const vertexData = new Uint16Array(vertexCount * elementsPerVertex)

  position += Uint32Array.BYTES_PER_ELEMENT

  const bytesPerArrayElement = Uint16Array.BYTES_PER_ELEMENT
  const elementArrayLength = vertexCount * bytesPerArrayElement
  const uArrayStartPosition = position
  const vArrayStartPosition = uArrayStartPosition + elementArrayLength
  const heightArrayStartPosition = vArrayStartPosition + elementArrayLength

  let u = 0
  let v = 0
  let height = 0

  for (let i = 0; i < vertexCount; i++) {
    u += decodeZigZag(dataView.getUint16(uArrayStartPosition + bytesPerArrayElement * i, true))
    v += decodeZigZag(dataView.getUint16(vArrayStartPosition + bytesPerArrayElement * i, true))
    height += decodeZigZag(dataView.getUint16(heightArrayStartPosition + bytesPerArrayElement * i, true))

    vertexData[i] = u
    vertexData[i + vertexCount] = v
    vertexData[i + vertexCount * 2] = height
  }

  position += elementArrayLength * 3

  return { vertexData, vertexDataEndPosition: position }
}

function decodeIndex (buffer, position, indicesCount, bytesPerIndex) {
  let indices

  if (bytesPerIndex === 2) {
    indices = new Uint16Array(buffer, position, indicesCount)
  } else {
    indices = new Uint32Array(buffer, position, indicesCount)
  }

  let highest = 0

  for (let i = 0; i < indices.length; ++i) {
    let code = indices[i]

    indices[i] = highest - code

    if (code === 0) {
      ++highest
    }
  }

  return indices
}

function decodeIndices (dataView, vertexCount, vertexDataEndPosition) {
  let position = vertexDataEndPosition
  const bytesPerIndex = vertexCount > 65536
  ? Uint32Array.BYTES_PER_ELEMENT
  : Uint16Array.BYTES_PER_ELEMENT

  if (position % bytesPerIndex !== 0) {
    position += bytesPerIndex - (position % bytesPerIndex)
  }

  const triangleCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const triangleIndicesCount = triangleCount * 3
  const triangleIndices = decodeIndex(
    dataView.buffer,
    position,
    triangleIndicesCount,
    bytesPerIndex
    )
  position += triangleIndicesCount * bytesPerIndex

  const westVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const westIndices = decodeIndex(dataView.buffer, position, westVertexCount, bytesPerIndex)
  position += westVertexCount * bytesPerIndex

  const southVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const southIndices = decodeIndex(dataView.buffer, position, southVertexCount, bytesPerIndex)
  position += southVertexCount * bytesPerIndex

  const eastVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const eastIndices = decodeIndex(dataView.buffer, position, eastVertexCount, bytesPerIndex)
  position += eastVertexCount * bytesPerIndex

  const northVertexCount = dataView.getUint32(position, true)
  position += Uint32Array.BYTES_PER_ELEMENT

  const northIndices = decodeIndex(dataView.buffer, position, northVertexCount, bytesPerIndex)
  position += northVertexCount * bytesPerIndex

  return {
    indicesEndPosition: position,
    triangleIndices,
    westIndices,
    southIndices,
    eastIndices,
    northIndices
  }
}

function decodeVertexNormalsExtension (extensionDataView) {
  const normals = []

  for (let position = 0; position < extensionDataView.byteLength; position += Uint8Array.BYTES_PER_ELEMENT * 2) {
    const decodedNormal = decodeOct(new THREE.Vector2(
      extensionDataView.getUint8(position, true),
      extensionDataView.getUint8(position + Uint8Array.BYTES_PER_ELEMENT, true)
      ))

    normals.push({
      x: decodedNormal.x,
      y: decodedNormal.y,
      z: decodedNormal.z
    })
  }

  return normals
}

function decodeWaterMaskExtension (extensionDataView) {
  return extensionDataView.buffer.slice(
    extensionDataView.byteOffset,
    extensionDataView.byteOffset + extensionDataView.byteLength
    )
}

function decodeExtensions (dataView, indicesEndPosition) {
  const extensions = {}

  if (dataView.byteLength <= indicesEndPosition) {
    return { extensions, extensionsEndPosition: indicesEndPosition }
  }

  let position = indicesEndPosition

  while (position < dataView.byteLength) {
    const extensionId = dataView.getUint8(position, true)
    position += Uint8Array.BYTES_PER_ELEMENT

    const extensionLength = dataView.getUint32(position, true)
    position += Uint32Array.BYTES_PER_ELEMENT

    const extensionView = new DataView(dataView.buffer, position, extensionLength)

    switch (extensionId) {
      case 1: {
        extensions.vertexNormals = decodeVertexNormalsExtension(extensionView)

        break
      }
      case 2: {
        extensions.waterMask = decodeWaterMaskExtension(extensionView)

        break
      }
      default: {
        console.warn(`Unknown extension with id ${ extensionId }`)
      }
    }

    position += extensionLength
  }

  return { extensions, extensionsEndPosition: position }
}

export default function decode (data) {
  const view = new DataView(data)
  const { header, headerEndPosition } = decodeHeader(view)
  const { vertexData, vertexDataEndPosition } = decodeVertexData(view, headerEndPosition)
  const {
    triangleIndices,
    indicesEndPosition,
    westIndices,
    southIndices,
    eastIndices,
    northIndices
  } = decodeIndices(view, vertexData.length, vertexDataEndPosition)
  const { extensions } = decodeExtensions(view, indicesEndPosition)

  return {
    header,
    vertexData,
    triangleIndices,
    westIndices,
    northIndices,
    eastIndices,
    southIndices,
    extensions
  }
}