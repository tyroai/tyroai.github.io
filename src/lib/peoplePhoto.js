/**
 * Graph'ta bir kişinin fotoğrafının göreli yolu (`size` px kare; Graph'ın boyları 48 · 64 · 96 ·
 * 120 · 240…). Toplu istek (`lib/photoBatch`) alt isteklerde göreli yol ister.
 */
export const photoRelPath = (address, size) =>
  `/users/${encodeURIComponent(address)}/photos/${size}x${size}/$value`
