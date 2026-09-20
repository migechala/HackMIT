#!/usr/bin/env python3
"""Pi raw TCP client — auto-reconnect on Wi-Fi drops, no manual restart."""
import argparse, socket, struct, subprocess, threading, time
import numpy as np
import sounddevice as sd
from scipy.signal import resample_poly
from threshold_ml.ingest.raw_protocol import pack_frame

ALSA_DEVICE = "plughw:4,0"
ALSA_RATE = 48000
ALSA_CHANNELS = 2
_aplay = None
_prev_tail = None
FADE = 960

# Wi-Fi power save off — prevents drops
try:
    subprocess.run(["sudo", "iwconfig", "wlan0", "power", "off"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
except: pass

MIC_REF, MIC_ERR = None, None
for i, d in enumerate(sd.query_devices()):
    if int(d["max_input_channels"]) > 0 and ("UAC" in d["name"] or "USB" in d["name"]):
        if MIC_REF is None: MIC_REF = i
        elif MIC_ERR is None and i != MIC_REF: MIC_ERR = i
if MIC_REF is None:
    for i, d in enumerate(sd.query_devices()):
        if int(d["max_input_channels"]) > 0:
            MIC_REF = i; break
    else: MIC_REF = 0
if MIC_ERR is None: MIC_ERR = MIC_REF
MIC_RATE = 48000
print(f"mics ref={MIC_REF} {sd.query_devices(MIC_REF)['name']} err={MIC_ERR} {sd.query_devices(MIC_ERR)['name']}")

_ring_ref = np.zeros(int(MIC_RATE * 1), dtype=np.float32)
_ring_err = np.zeros(int(MIC_RATE * 1), dtype=np.float32)
_pos_ref = 0; _pos_err = 0
_lock_ref = threading.Lock(); _lock_err = threading.Lock()

def cb_ref(indata, frames, time_info, status):
    global _pos_ref
    mono = indata[:,0].astype(np.float32)
    with _lock_ref:
        n=len(mono)
        if n>=len(_ring_ref): _ring_ref[:]=mono[-len(_ring_ref):]; _pos_ref=0
        else:
            end=_pos_ref+n
            if end<=len(_ring_ref): _ring_ref[_pos_ref:end]=mono
            else: _ring_ref[_pos_ref:]=mono[:len(_ring_ref)-_pos_ref]; _ring_ref[:end-len(_ring_ref)]=mono[len(_ring_ref)-_pos_ref:]
            _pos_ref=end%len(_ring_ref)

def cb_err(indata, frames, time_info, status):
    global _pos_err
    mono = indata[:,0].astype(np.float32)
    with _lock_err:
        n=len(mono)
        if n>=len(_ring_err): _ring_err[:]=mono[-len(_ring_err):]; _pos_err=0
        else:
            end=_pos_err+n
            if end<=len(_ring_err): _ring_err[_pos_err:end]=mono
            else: _ring_err[_pos_err:]=mono[:len(_ring_err)-_pos_err]; _ring_err[:end-len(_ring_err)]=mono[len(_ring_err)-_pos_err:]
            _pos_err=end%len(_ring_err)

_rec_ref=None; _rec_err=None
def get_recs():
    global _rec_ref,_rec_err
    if _rec_ref is None:
        _rec_ref=sd.InputStream(device=MIC_REF, channels=1, samplerate=MIC_RATE, dtype="float32", callback=cb_ref, blocksize=480)
        _rec_ref.start()
    if MIC_ERR==MIC_REF: _rec_err=_rec_ref
    elif _rec_err is None:
        _rec_err=sd.InputStream(device=MIC_ERR, channels=1, samplerate=MIC_RATE, dtype="float32", callback=cb_err, blocksize=480)
        _rec_err.start()
    time.sleep(0.2)
    return _rec_ref,_rec_err

def get_aplay():
    global _aplay
    if _aplay is None or _aplay.poll() is not None:
        _aplay=subprocess.Popen(["aplay","-D",ALSA_DEVICE,"-f","FLOAT_LE","-r",str(ALSA_RATE),"-c",str(ALSA_CHANNELS),"-q"], stdin=subprocess.PIPE)
    return _aplay

_speaker_hist=None
try: _MEASURED_IR=np.load("data/secondary_ir.npz")["ir"].astype(np.float32); print(f"loaded ir {len(_MEASURED_IR)}")
except: _MEASURED_IR=np.array([0,0,0.6],dtype=np.float32)

def real_sensor(L=2048, M=3):
    global _speaker_hist
    ir=_MEASURED_IR
    needed=int(L*MIC_RATE/4000)
    with _lock_ref:
        mono_ref=_ring_ref[_pos_ref-needed:_pos_ref].copy() if _pos_ref>=needed else np.concatenate([_ring_ref[-(needed-_pos_ref):], _ring_ref[:_pos_ref]])
    if MIC_ERR==MIC_REF: mono_err=mono_ref.copy()
    else:
        with _lock_err:
            mono_err=_ring_err[_pos_err-needed:_pos_err].copy() if _pos_err>=needed else np.concatenate([_ring_err[-(needed-_pos_err):], _ring_err[:_pos_err]])
    ref=resample_poly(mono_ref,4000,MIC_RATE).astype(np.float32)[:L]
    err=resample_poly(mono_err,4000,MIC_RATE).astype(np.float32)[:L]
    if len(ref)<L: ref=np.pad(ref,(0,L-len(ref)))
    if len(err)<L: err=np.pad(err,(0,L-len(err)))
    if _speaker_hist is None: _speaker_hist=np.zeros(L+len(ir)-1,dtype=np.float32)
    return ref,err,_speaker_hist.copy(),ir

def play_anti(anti, fs=4000, gain=2.5):
    global _prev_tail,_speaker_hist
    anti=np.asarray(anti,dtype=np.float32)*float(gain)
    anti=np.clip(anti,-0.99,0.99)
    if _speaker_hist is not None:
        _speaker_hist=np.concatenate([_speaker_hist[len(anti):],anti]) if len(_speaker_hist)>len(anti) else anti[-len(_speaker_hist):].astype(np.float32)
    if fs!=ALSA_RATE: anti=resample_poly(anti,ALSA_RATE,fs).astype(np.float32)
    anti=anti.reshape(-1,1); anti=np.repeat(anti,ALSA_CHANNELS,axis=1)
    if _prev_tail is not None and len(anti)>=FADE:
        fade_out=np.linspace(1,0,FADE)[:,None]; fade_in=np.linspace(0,1,FADE)[:,None]
        anti[:FADE]=_prev_tail[-FADE:]*fade_out+anti[:FADE]*fade_in
    _prev_tail=anti.copy()
    data=anti.astype("<f4").tobytes()
    try:
        get_aplay().stdin.write(data); get_aplay().stdin.flush()
    except BrokenPipeError:
        global _aplay; _aplay=None; get_aplay().stdin.write(data); get_aplay().stdin.flush()

def run_once(server, fs, rate_hz):
    host,port=server.rsplit(":",1)
    s=socket.create_connection((host,int(port)), timeout=5)
    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
    print(f"connected to {server}")
    sample_index=0; interval=1/rate_hz
    while True:
        start=time.time()
        ref,err,speaker,ir=real_sensor()
        s.sendall(pack_frame(ref,err,speaker,ir,sample_index))
        hdr=b""
        while len(hdr)<4:
            chunk=s.recv(4-len(hdr))
            if not chunk: raise ConnectionError("server closed")
            hdr+=chunk
        H=struct.unpack(">I",hdr)[0]
        payload=b""
        while len(payload)<H*4:
            chunk=s.recv(H*4-len(payload))
            if not chunk: raise ConnectionError("server closed")
            payload+=chunk
        anti=np.frombuffer(payload,dtype="<f4").copy()
        if sample_index%(2048*20)==0: print(f"mic rms {np.std(ref):.3f} -> anti max {np.max(np.abs(anti)):.3f}")
        play_anti(anti, fs=fs)
        sample_index+=len(ref)
        sleep=interval-(time.time()-start)
        if sleep>0: time.sleep(sleep)

def stream(server, fs, rate_hz):
    get_recs()
    time.sleep(0.5)
    while True:
        try:
            run_once(server, fs, rate_hz)
        except Exception as e:
            print(f"disconnected: {e} — reconnecting in 2s")
            time.sleep(2)

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--server", default="192.168.10.1:5000")
    ap.add_argument("--fs", type=int, default=4000)
    ap.add_argument("--rate-hz", type=float, default=20)
    args=ap.parse_args()
    stream(args.server, args.fs, args.rate_hz)
