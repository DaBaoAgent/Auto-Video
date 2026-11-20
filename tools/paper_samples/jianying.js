(() => {
  const { W, H, shape, circle, line, rect, text, layer, rng, silk, seal, caption,
    progress, camera, register } = Paper;
  const ink = "#263e39", red = "#a43b29", paper = "#e9d3a8", gold = "#ac8960";
  const hill = "M0 398 Q165 273 295 351 T538 325 T886 353 T1280 309 L1280 550H0Z";
  let market;

  function shop(c, x, y, scale, mirrored) {
    c.save();
    c.translate(x, y);
    c.scale(mirrored ? -scale : scale, scale);
    shape(c, "M-136 8L0-111 151 8 127 26 101 17V180H-104V16Z", "#9a8060", ink, 2);
    shape(c, "M-166 13Q-94-15-41-89L2-108Q91-23 171 8L152 25Q9-1-151 28Z", ink);
    shape(c, "M-151 90L-96 35H102L153 88 144 103Q12 80-147 108Z", "#874f38", ink, 2.5);
    for (let i = -8; i <= 8; i++) {
      line(c, [[i * 10, -7], [i * 17, 15]], "#dac49b68", 1.5);
      line(c, [[i * 10, 45], [i * 16, 93]], "#e3bb806a", 1.5);
    }
    rect(c, -41, 111, 82, 69, "#332f25");
    for (const dx of [-91, 60]) {
      rect(c, dx, 110, 27, 52, "#e5bc81");
      for (let i = 0; i < 4; i++) line(c, [[dx + i * 7, 110], [dx + i * 7, 162]], ink, 1.6);
      line(c, [[dx, 135], [dx + 27, 135]], ink, 1.6);
    }
    c.restore();
  }

  function porter(c, x, y, scale, garment) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    shape(c, "M-30-67Q-50-37-52 10L-30 19-12-13-9 61 15 60 21 15 38 57 58 51 36-1Q36-52 14-67Z", garment, "#2f392e", 1.1);
    shape(c, "M-11-63Q-20-69-15-85L5-99 21-85 27-74 15-68 12-61Z", "#b58b60", "#3b382a", 1.5);
    shape(c, "M-25-85L-8-108Q8-112 17-101L39-87Z", ink);
    line(c, [[-79, -39], [-7, -58], [87, -45]], "#655136", 4);
    for (const side of [-1, 1]) {
      c.save();
      c.translate(83 * side, -6);
      line(c, [[-10 * side, -39], [-10, 0], [10, 0], [-10 * side, -39]], "#604e32", 1);
      shape(c, "M-22 0Q0-8 22 0L16 20Q0 29-16 20Z", "#986c43", ink, 1.8);
      c.restore();
    }
    c.restore();
  }

  function coin(c, x, y, angle, radius) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(1, 0.83);
    circle(c, 2, 7, radius, "#2f3025");
    shape(c, `M${radius} 0A${radius} ${radius} 0 1 0 ${-radius} 0A${radius} ${radius} 0 1 0 ${radius} 0ZM-12-12H12V12H-12Z`,
      "#68684e", "#c5aa7a", 2.5);
    c.strokeStyle = "#303b34";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, radius * 0.81, 0, 2 * Math.PI);
    c.stroke();
    if (radius > 28) {
      for (const [word, dx, dy] of [["鐵", 0, -21], ["錢", 0, 35]]) {
        text(c, word, dx, dy, radius * 0.30, "#d2b286", "Kai", "center");
      }
    }
    c.restore();
  }

  function receipt(c, x, y, scale, angle, stamped) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(scale, scale);
    c.shadowColor = "#231c1c78";
    c.shadowBlur = 22;
    c.shadowOffsetY = 14;
    shape(c, "M-165-219L165-222 169 219-169 223Z", "#eddbb2");
    c.shadowColor = "transparent";
    c.strokeStyle = "#8c6342";
    c.lineWidth = 1.5;
    c.strokeRect(-146, -201, 292, 400);
    c.strokeRect(-138, -193, 276, 384);
    for (let i = 0; i < 6; i++) {
      const y = -172 + i * 15;
      shape(c, `M-134 ${y}Q-92 ${y-52}-54 ${y}T26 ${y}T105 ${y}T133 ${y}`, null, "#8c634275", 1);
    }
    text(c, "交　子", 0, -53, 76, ink, "Brush", "center");
    line(c, [[-116, -32], [116, -32]], gold, 1.2);
    shape(c, "M-120 119L-73 87-49 95-9 58 29 101 58 91 116 118M-112 130Q-63 107-45 130T31 132T113 130M-80 151Q-19 137 88 151",
      null, "#4d6053", 2);
    shape(c, "M-47 113Q0 61 53 113M-48 113H54M-28 111L-33 131M34 109L41 128", null, ink, 4);
    text(c, "蜀 地 錢 鋪", 0, 177, 23, "#5f4d36", "Kai", "center");
    text(c, "存", -87, 33, 33, "#80664b", "Kai", "center");
    text(c, "取", 87, 33, 33, "#80664b", "Kai", "center");
    if (stamped > 0) {
      c.save();
      c.globalAlpha = stamped;
      seal(c, 7, -17, "收訖", 77);
      c.restore();
    }
    const random = rng(21);
    for (let i = 0; i < 800; i++) rect(c, random() * 310 - 155, random() * 420 - 210, 2 + random() * 6, .55, "#88552a19");
    c.restore();
  }

  function labels(c, location, title, secondary) {
    text(c, location, 99, 125, 27, red);
    line(c, [[99, 145], [275, 145]], "#96714f", 1.3);
    text(c, title, 92, 267, 108, ink, "Brush");
    text(c, secondary, 103, 324, 28, "#63533e");
  }

  function build() {
    market = layer((c) => {
      rect(c, 0, 0, W, H, paper);
      circle(c, 1066, 156, 79, "#b1593f82");
      shape(c, hill, "#b1a180", "#897e61", 2);
      shape(c, "M-60 460Q173 394 365 461T689 439T1100 432T1350 464V720H-60Z", "#a69b77");
      shape(c, "M350 720Q614 527 681 429Q624 529 1074 720Z", "#ddc69d");
      const random = rng(71);
      for (let i = 0; i < 270; i++) {
        const x = random() * W, y = 344 + random() * 281;
        line(c, [[x, y], [x + 8 + random() * 35, y + 2]], "#64503838", 1);
      }
      shop(c, 670, 325, .43, false);
      shop(c, 779, 372, .68, false);
      shop(c, 1111, 331, .99, true);
      shop(c, 960, 342, .60, true);
      shop(c, 1239, 426, 1.16, true);
      porter(c, 891, 471, .44, "#9c4e35");
      porter(c, 1019, 509, .56, "#6e7754");
      porter(c, 706, 425, .28, "#60523f");
      const wash = c.createLinearGradient(660, 0, 0, 0);
      wash.addColorStop(0, "#e9d3a800");
      wash.addColorStop(.87, paper);
      rect(c, 0, 0, 660, H, wash);
    });
  }

  function draw(c, t) {
    const [second, third] = window.SHOTS.jianying.slice(1);
    if (t < second) {
      camera(c, market, 820, 360, 1.012 + t * 0.013);
      labels(c, "北宋 · 蜀地", "鐵錢", "一串錢，一路沉");
      c.save();
      c.translate(0, -10 * progress(t, 0, 1.8));
      shape(c, "M118 402C382 454 330 586 534 513S658 342 804 373", null, "#574632", 12);
      shape(c, "M118 397C382 449 330 581 534 508S658 337 804 368", null, "#bc9c68", 3);
      for (const [x, y, a, r] of [[169, 419, -.28, 53], [269, 457, .25, 67],
        [355, 509, -.17, 62], [451, 526, .4, 72], [569, 470, -.21, 58]]) coin(c, x, y, a, r);
      c.restore();
    } else if (t < third) {
      const d = progress(t, second, .52);
      rect(c, 0, 0, W, H, "#e2c799");
      shape(c, "M636-10H1300V600L608 540Z", "#385048");
      shape(c, "M651 0H1280V104L642 26ZM643 440L1280 495V650L635 571Z", "#496158");
      for (let i = 0; i < 10; i++) {
        line(c, [[665, 62 + i * 49], [1280, 102 + i * 51]], "#c9be8a3c", 1.2);
      }
      labels(c, "錢鋪收存", "紙券", "存下鐵錢，領走紙券");
      receipt(c, 893 + (1 - d) * 220, 296 + (1 - d) * 27, 1.13, -.08 + (1 - d) * .17,
        progress(t, second + 1.2, .11));
      const stampDown = progress(t, second + .68, .52), stampUp = progress(t, second + 1.22, .33);
      if (stampDown > 0 && stampUp < 1) {
        c.save();
        c.translate(940 + 170 * (1 - stampDown + stampUp), 326 - 455 * (1 - stampDown + stampUp));
        c.rotate(-.09);
        shape(c, "M-42 0L-43-43-18-55-16-124Q-4-151 16-124L19-54 43-43 44 0Z",
          "#8a4d34", "#4d3428", 2.5);
        shape(c, "M-42 0L44 0 40 11-38 11Z", "#8d3327", "#582b22", 2);
        line(c, [[-33, -34], [-24, -8], [-16, -9]], "#d09b67", 2.5);
        c.restore();
      }
      coin(c, 584, 501, -.17, 68);
      coin(c, 542, 525, .21, 60);
    } else {
      c.drawImage(market, 0, 0);
      rect(c, 0, 0, W, H, "#f0dfb78a");
      labels(c, "從存錢憑證到交易", "交子", "一張紙，帶著錢走");
      const handover = progress(t, third, 1.8);
      c.save();
      c.translate(-80 * handover, 0);
      shape(c, "M1300 400L1152 366 1054 374Q974 330 916 354L862 387 881 414 963 396 919 441 924 465 1003 450 1091 485 1300 518Z",
        "#b88054", "#65452f", 3);
      shape(c, "M1299 366L1122 348 1090 483 1300 559Z", red, "#663b2e", 3);
      shape(c, "M1260 368L1131 356 1105 481 1257 528", null, "#e0ad6d", 4);
      receipt(c, 890, 289, .98, -.19, 1);
      c.restore();
      c.save();
      c.translate(150 * (1 - handover), 0);
      shape(c, "M389 567L526 441 624 428Q683 390 729 433L767 448 760 472 710 476 770 487 725 514 633 523 562 591 418 637Z",
        "#bd9065", "#735439", 3);
      shape(c, "M281 668L474 474 572 576 473 677 423 718H257Z", "#354d44", "#223e36", 3);
      line(c, [[466, 490], [556, 580], [463, 679]], "#ac9372", 4);
      c.restore();
    }
    const veil = c.createLinearGradient(0, 578, 0, 720);
    veil.addColorStop(0, "#eddbb200");
    veil.addColorStop(.55, "#eddbb2");
    rect(c, 0, 578, W, 142, veil);
    c.strokeStyle = "#674a36";
    c.lineWidth = 1.15;
    c.strokeRect(30, 31, 1220, 658);
    c.strokeStyle = "#8e71526f";
    c.strokeRect(37, 38, 1206, 644);
    silk(c);
    caption(c, "jianying", t, "clause");
  }

  register("jianying", draw, build);
})();
