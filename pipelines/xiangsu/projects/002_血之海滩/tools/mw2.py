import numpy as np, subprocess, glob, os
FF=r"D:\@kaifa\tools\ffmpeg\bin\ffmpeg.exe"
D=r"D:\@kaifa\Auto-Video\xiangsu\projects\002_血之海滩\out\frames"
p=subprocess.run([FF,"-v","quiet","-framerate","30","-i",os.path.join(D,"%05d.png"),"-vf","scale=192:108:flags=area","-pix_fmt","gray","-f","rawvideo","-"],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
a=np.frombuffer(p.stdout,np.uint8).astype(np.int16).reshape(-1,108,192)
d=(np.abs(np.diff(a,axis=0))>8).mean(axis=(1,2))
s=np.convolve(d,np.ones(60)/60,mode="valid")
print("frames",len(a),"win min %.2f%% at %.2fs"%(s.min()*100,s.argmin()/30),"max %.2f%%"%(s.max()*100))
run=longest=0
for m in d:
    run=run+1 if m<0.002 else 0
    longest=max(longest,run)
print("longest static %.2fs"%(longest/30))
