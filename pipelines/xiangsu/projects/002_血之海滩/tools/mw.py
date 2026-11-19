import numpy as np, subprocess, os
FF=r"D:\@kaifa\tools\ffmpeg\bin\ffmpeg.exe"
MP4=r"D:\@kaifa\Auto-Video\xiangsu\projects\002_血之海滩\out\001_血之海滩_第一大段_1080p.mp4"
p=subprocess.run([FF,"-v","quiet","-i",MP4,"-vf","scale=192:108:flags=area","-pix_fmt","gray","-f","rawvideo","-"],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
a=np.frombuffer(p.stdout,np.uint8).astype(np.int16).reshape(-1,108,192)
d=(np.abs(np.diff(a,axis=0))>8).mean(axis=(1,2))
s=np.convolve(d,np.ones(60)/60,mode="valid")
for i in range(0,len(s),15):
    print(f"t={i/30:5.2f}s  win={s[i]*100:5.2f}%")
print("min", s.min()*100, "at", s.argmin()/30)
