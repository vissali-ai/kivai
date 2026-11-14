function readAscii(bytes: Uint8Array, start: number, length: number) {
  let value = "";
  const end = Math.min(start + length, bytes.length);
  for (let index = start; index < end; index += 1) value += String.fromCharCode(bytes[index]);
  return value;
}

/** Remove JPEG application/comment segments that can carry EXIF, IPTC, XMP, ICC or C2PA data. */
export async function stripJpegMetadata(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return blob;

  const chunks: Uint8Array[] = [bytes.subarray(0, 2)];
  let offset = 2;

  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    let markerOffset = offset;
    while (markerOffset < bytes.length && bytes[markerOffset] === 0xff) markerOffset += 1;
    if (markerOffset >= bytes.length) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    const marker = bytes[markerOffset];
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    if (marker === 0x00 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      chunks.push(bytes.subarray(offset, markerOffset + 1));
      offset = markerOffset + 1;
      continue;
    }

    if (markerOffset + 2 >= bytes.length) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    const length = (bytes[markerOffset + 1] << 8) | bytes[markerOffset + 2];
    const segmentEnd = markerOffset + 1 + length;
    if (length < 2 || segmentEnd > bytes.length) {
      chunks.push(bytes.subarray(offset));
      break;
    }

    const isMetadataSegment = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadataSegment) chunks.push(bytes.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }

  const segments = chunks.map((chunk) => {
    const copy = new ArrayBuffer(chunk.byteLength);
    new Uint8Array(copy).set(chunk);
    return copy;
  });
  return new Blob(segments, { type: "image/jpeg" });
}
