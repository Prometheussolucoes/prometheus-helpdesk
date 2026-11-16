"use strict";

const ZIP_CRC32_TABLE = (function(){
  const table = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k < 8; k++){
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function zipCrc32(bytes){
  let crc = 0xFFFFFFFF;
  for(let i = 0; i < bytes.length; i++){
    crc = ZIP_CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function zipUtf8Bytes(str){
  return new TextEncoder().encode(str);
}

function zipBase64ToBytes(b64){
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function zipDosDateTime(){
  // Fixed date/time: not meaningful for generated termo documents.
  return { time: 0, date: 0x21 };
}

function zipBuildStore(entries){
  const dt = zipDosDateTime();
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  entries.forEach(({ name, bytes }) => {
    const nameBytes = zipUtf8Bytes(name);
    const crc = zipCrc32(bytes);
    const size = bytes.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dt.time, true);
    local.setUint16(12, dt.date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);

    localChunks.push(new Uint8Array(local.buffer), nameBytes, bytes);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, dt.time, true);
    central.setUint16(14, dt.date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, size, true);
    central.setUint32(24, size, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint16(30, 0, true);
    central.setUint16(32, 0, true);
    central.setUint16(34, 0, true);
    central.setUint16(36, 0, true);
    central.setUint32(38, 0, true);
    central.setUint32(42, offset, true);

    centralChunks.push(new Uint8Array(central.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  });

  const centralStart = offset;
  let centralSize = 0;
  centralChunks.forEach(c => { centralSize += c.length; });

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, centralStart, true);
  eocd.setUint16(20, 0, true);

  const all = localChunks.concat(centralChunks, [new Uint8Array(eocd.buffer)]);
  let total = 0;
  all.forEach(c => { total += c.length; });
  const out = new Uint8Array(total);
  let pos = 0;
  all.forEach(c => { out.set(c, pos); pos += c.length; });
  return out;
}
