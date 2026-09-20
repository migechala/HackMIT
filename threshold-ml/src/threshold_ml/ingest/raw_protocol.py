"""Minimal framing for Pi -> GX10 over direct Ethernet TCP. No HTTP/gRPC.

Frame: [magic 4][version 1][header_len 1][sample_index 8][L 2][M 2][H 2][crc32 4][payload float32 LE]
payload = reference[L] + error[L] + speaker[L+M-1] + secondary_ir[M]
All on a single TCP connection, no internet/DNS required.
"""
import struct, zlib

MAGIC = b'THRS'
VERSION = 1
HEADER_FMT = '>4s B B q H H H I'  # magic, ver, hdr_len, sample_index, L, M, H, crc
HEADER_SIZE = struct.calcsize(HEADER_FMT)

def pack_frame(reference, error, speaker, secondary_ir, sample_index):
    for name, arr in (('reference', reference), ('error', error), ('speaker', speaker), ('secondary_ir', secondary_ir)):
        if arr.dtype != 'float32' or not arr.flags['C_CONTIGUOUS']:
            raise ValueError(f'{name} must be float32 C-contiguous')
        if not (len(arr) > 0 and all(x == x and abs(float(x)) < 1e4 for x in arr[:1])):
            raise ValueError(f'{name} invalid')
    L, M = len(reference), len(secondary_ir)
    if len(error) != L or len(speaker) != L+M-1:
        raise ValueError(f'speaker must be L+M-1 ({L+M-1}), got {len(speaker)}')
    H = len(reference)  # not used, placeholder for H
    payload = b''.join(a.tobytes() for a in (reference, error, speaker, secondary_ir))
    crc = zlib.crc32(payload) & 0xffffffff
    header = struct.pack(HEADER_FMT, MAGIC, VERSION, HEADER_SIZE, int(sample_index), L, M, H, crc)
    return header + payload

def unpack_header(data):
    if len(data) < HEADER_SIZE:
        raise ValueError('short header')
    magic, ver, hdr_len, sample_index, L, M, H, crc = struct.unpack(HEADER_FMT, data[:HEADER_SIZE])
    if magic != MAGIC or ver != VERSION or hdr_len != HEADER_SIZE:
        raise ValueError('bad magic/version')
    return dict(sample_index=sample_index, L=L, M=M, H=H, crc=crc)
