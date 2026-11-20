(() => {
  const { W, H, shape, circle, line, rect, text, silk, caption, mix, progress, register } = Paper;
  const light = [929, 281];

  function cut(c, d, color, edge = "#e0d6a370", thickness = 5) {
    c.save();
    c.translate(1, thickness);
    c.shadowColor = "#011f2999";
    c.shadowBlur = thickness * 2.8;
    c.shadowOffsetY = thickness * 0.7;
    shape(c, d, "#223e41");
    c.restore();
    shape(c, d, color, edge, 1.35);
  }

  function surf(c, t) {
    const strips = [
      ["M-60 487Q81 475 204 492T445 485T723 478T983 469T1340 452V755H-60Z", "#87a69a"],
      ["M-60 533Q66 536 186 507T419 517T658 515T927 500T1340 483V755H-60Z", "#689083"],
      ["M-60 567Q78 579 240 549T501 546T754 539T1022 532T1340 511V755H-60Z", "#4d756e"],
      ["M-60 608Q122 614 291 584T553 580T878 567T1340 540V755H-60Z", "#38645f"],
      ["M-60 669Q149 640 309 631T566 614T898 606T1145 569T1340 577V755H-60Z", "#2b5354"],
      ["M-60 711Q160 702 287 680T584 670T861 638T1340 627V755H-60Z", "#1d4348"],
    ];
    strips.forEach(([d, color], i) => {
      c.save();
      c.translate(Math.sin(t * .86 + i * 1.15) * (2 + i * 2.2), Math.cos(t + i * .75) * (i + 1) * .7);
      cut(c, d, color, i < 3 ? "#e4e0b68a" : "#b6ccb177", 5 + i);
      c.restore();
    });
  }

  function headland(c) {
    cut(c, "M775 488L814 439 838 422 873 390 918 383 939 364 978 383 1010 369 1050 401 1097 401 1123 417 1280 381 1330 429V575L1249 589 1103 543 962 554 883 532 827 537Z", "#49685e");
    cut(c, "M802 524L841 479 879 474 902 428 953 399 978 421 1025 398 1065 430 1127 443 1162 432 1289 449 1340 479V583L1211 578 1144 557 1074 569 1006 542 930 560 853 549 814 559Z", "#304e4a");
    cut(c, "M855 546L893 521 936 510 969 486 990 500 1057 503 1094 522 1157 516 1194 526 1280 504 1340 532V603L1240 612 1123 585 1070 593 929 568Z", "#203d41", "#a6aa8790");
    for (const d of ["M837 504L876 492 894 461", "M961 506L977 490 981 502",
      "M1115 547L1184 540 1263 559", "M1029 470L1042 454 1098 467"]) shape(c, d, null, "#c2b89158", 2);
    for (let i = 0; i < 12; i++) {
      const x = 1001 + i * 13, y = 462 + 20 * Math.sin(i * 1.35);
      c.save();
      c.translate(x, y);
      shape(c, "M0 0Q4-17 13-21Q8-14 7 0Z", "#263f3d");
      c.restore();
    }
  }

  function tower(c, glow) {
    cut(c, "M882 426L889 389 967 383 991 414 977 438 885 445Z", "#849487");
    cut(c, "M902 413L911 293H950L963 414 948 419 918 420Z", "#e4cba0", "#fff0cbab");
    shape(c, "M937 297H950L963 414 948 419Z", "#b6a282");
    shape(c, "M906 344L955 340 957 359 905 364Z", "#a46147");
    shape(c, "M921 418V394Q929 383 938 392V417Z", "#40463c");
    shape(c, "M922 321Q928 310 934 319V330H922Z", "#353c34");
    cut(c, "M895 295L900 286H961L972 295L960 304 901 304Z", "#4b5e55");
    shape(c, "M910 285V261H950V285Z", glow > .1 ? "#f5bf6b" : "#87795c", "#233e42", 5);
    line(c, [[929, 263], [929, 285]], "#454b3e", 3);
    cut(c, "M897 264L924 243 930 231 937 243 964 263 958 267H901Z", "#566b60");
    circle(c, 930, 230, 4, "#c4ae83");
  }

  function beam(c, t, glow) {
    const y = 438 - 103 * Math.cos((t - 3.1) * .47);
    c.save();
    c.globalAlpha = glow;
    const ray = c.createLinearGradient(light[0], light[1], 21, y);
    ray.addColorStop(0, "#ffe8a5c9");
    ray.addColorStop(.46, "#ffe5a271");
    ray.addColorStop(1, "#fff6bf05");
    c.beginPath();
    c.moveTo(925, 269);
    c.lineTo(-35, y - 107);
    c.lineTo(-35, y + 109);
    c.lineTo(931, 286);
    c.closePath();
    c.fillStyle = ray;
    c.fill();
    const halo = c.createRadialGradient(929, 275, 4, 929, 275, 65);
    halo.addColorStop(0, "#ffedb4ca");
    halo.addColorStop(1, "#ffde9200");
    circle(c, 929, 275, 65, halo);
    c.restore();
  }

  function boat(c, x, y, t) {
    c.save();
    c.translate(x, y + 3 * Math.sin(t * 2.9));
    c.rotate(Math.sin(t * 2.9) * .032);
    cut(c, "M-105-12Q-31 8 102-12L74 15Q-20 38-79 17Z", "#303c35", "#dac19b", 4);
    shape(c, "M-96-9Q-15 12 91-9", null, "#d5bd8499", 1.5);
    shape(c, "M0-16L-1-147", null, "#4b4736", 4);
    cut(c, "M-6-135Q-17-74-73-27Q-39-31-9-22Z", "#ceae7c", "#f4dda5", 4);
    cut(c, "M6-121Q56-76 76-36Q49-39 7-25Z", "#ead2a2", "#f8e6b5", 5);
    shape(c, "M9-99Q26-77 41-40M-14-107Q-27-76-47-38M-79-24L-94-9", null, "#8a72588e", 1.5);
    shape(c, "M-1-147Q15-154 34-142Q16-145 0-134Z", "#9e5540");
    c.restore();
  }

  function draw(c, t) {
    const glow = progress(t, 3.42, 1.0);
    const reveal = progress(t, 6.28, 3.65);
    const mid = progress(t, 0, 2.95);
    const zoom = 1.04 + .04 * mid - .035 * reveal;
    const sky = c.createLinearGradient(0, 0, 0, 563);
    sky.addColorStop(0, "#294d55");
    sky.addColorStop(.38, "#537476");
    sky.addColorStop(1, "#dbc99e");
    rect(c, 0, 0, W, H, sky);
    c.save();
    c.translate(893, 371);
    c.scale(zoom, zoom);
    c.translate(-893 - 19 * reveal, -371);
    cut(c, "M-90 421L51 342 173 390 275 302 382 383 498 344 614 403 746 359 891 431 1046 382 1320 399 1360 533H-90Z",
      "#8a9c8b", "#d8cda57d", 5);
    cut(c, "M-90 465Q43 433 135 436L222 411 349 443 421 431 516 468 674 422 745 435 855 414 998 462 1146 439 1360 455V568H-90Z",
      "#a6b2a0", "#e6d9b28a", 4);
    surf(c, t);
    headland(c);
    tower(c, glow);
    beam(c, t, glow);
    // Thin translucent sheets read as fog when they glide across the edges of the cut paper.
    for (let i = 0; i < 4; i++) {
      c.save();
      c.translate((t * (i + 1) * 6) - 120, 75 * i);
      shape(c, "M-210 373Q66 347 321 376T724 366T1493 352L1493 378Q1041 418 727 393T323 398T-210 401Z",
        i < 2 ? "#e6dec318" : "#ebe8c910");
      c.restore();
    }
    const bx = mix(365, 455, mid) + 292 * reveal;
    const by = 561 - 47 * reveal;
    c.save();
    c.translate(bx - 17, by + 19);
    c.scale(1 - reveal * .24, 1);
    shape(c, "M-180 0Q-120-14-61 0T88-2M-228 12Q-156 15-111 12T-14 13M-154 25Q-84 20-32 26",
      null, "#cee1bc9a", 2);
    c.restore();
    boat(c, bx, by, t);
    c.restore();
    const border = c.createRadialGradient(637, 362, 412, 637, 362, 778);
    border.addColorStop(0, "#11282c00");
    border.addColorStop(1, "#10282ad7");
    rect(c, 0, 0, W, H, border);
    text(c, "霧港引航", 79, 130, 58, "#f5dcab", "Brush");
    line(c, [[82, 150], [255, 150]], "#e2cb9b95", 1.2);
    silk(c, 1.2);
    caption(c, "zhidiao", t, "words");
  }

  register("zhidiao", draw);
})();
