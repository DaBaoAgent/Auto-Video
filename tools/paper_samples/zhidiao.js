(() => {
  const { W, H, shape, circle, line, rect, text, silk, caption, mix, progress, layer, rng, register } = Paper;
  let backdrop;

  function cut(c, d, color, edge = "#d3ded580", thickness = 5) {
    c.save();
    c.translate(1, thickness);
    c.shadowColor = "#11292dc2";
    c.shadowBlur = thickness * 2.8;
    c.shadowOffsetY = thickness * .7;
    shape(c, d, "#25373c");
    c.restore();
    shape(c, d, color, edge, 1.25);
  }

  function pine(c, x, y, scale, fill, snow) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    cut(c, "M-6 8L-4-46Q-34-27-78-54Q-48-68-35-95Q-64-90-59-104Q-31-123-28-144Q-49-142-37-155Q-15-174 1-218Q16-179 40-155Q51-139 29-144Q37-121 62-102Q67-88 38-96Q56-64 77-55Q42-29 9-46L12 8Z",
      fill, "#d0ddd134");
    if (snow) {
      shape(c, "M-61-57Q-35-72-33-92Q-16-79-23-64Q-41-55-61-57ZM72-56Q43-70 35-93Q24-74 34-62Q43-56 72-56ZM-52-105Q-27-124-27-141Q-8-130-26-113Q-39-107-52-105ZM9-193Q20-171 35-155Q16-155 12-165Z",
        snow);
    }
    c.restore();
  }

  function build() {
    backdrop = layer((c) => {
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#20374c");
      sky.addColorStop(.52, "#5c7780");
      sky.addColorStop(1, "#bec9ba");
      rect(c, 0, 0, W, H, sky);
      const moon = c.createRadialGradient(928, 128, 15, 928, 128, 115);
      moon.addColorStop(0, "#edf2d994");
      moon.addColorStop(1, "#edf2d900");
      circle(c, 928, 128, 115, moon);
      circle(c, 928, 128, 48, "#d3e0cc");
      cut(c, "M-10 406L101 334 167 342 288 255 368 295 428 277 559 357 641 304 706 327 782 276 903 369 1006 312 1219 365 1300 325V721H-10Z",
        "#7d9a9a", "#c9d7cc48");
      cut(c, "M-10 437Q86 378 193 411Q318 379 424 420Q529 439 686 375Q792 349 949 401T1300 377V731H-10Z",
        "#9fafa5", "#e2e4cf7d");
      const random = rng(984);
      for (let i = 0; i < 49; i++) {
        const x = 20 + i * 27, y = 415 + 37 * Math.sin(x * .009) + random() * 15;
        pine(c, x, y, .12 + random() * .20, i % 4 ? "#5b7878" : "#788f86");
      }
    });
  }

  function station(c, light) {
    cut(c, "M771 539L782 399H1136L1157 535Z", "#788c85", "#d8dbbe6a", 7);
    cut(c, "M796 506L791 394 818 334 1070 327 1129 386 1138 506Z", "#576e64");
    shape(c, "M1036 356L1068 329 1129 386 1138 506 1055 505Z", "#405656");
    for (let i = 0; i < 9; i++) {
      line(c, [[803, 417 + i * 10], [1044, 412 + i * 10]], "#aeb8a86c", 1);
    }
    cut(c, "M763 399L800 346 979 305 1053 334 1104 386Q976 369 763 399Z", "#334d56");
    cut(c, "M751 388Q777 358 789 343L976 296 1050 321 1120 380Q1052 382 994 373Q923 367 820 386Z",
      "#dce1ca", "#f0efcf");
    cut(c, "M1031 365L1095 380 1154 391 1142 400 1097 392 1052 391Z", "#6a817a");
    const pool = c.createRadialGradient(938, 442, 8, 938, 442, 164);
    pool.addColorStop(0, "#eecb7a98");
    pool.addColorStop(1, "#e6bb6300");
    c.save();
    c.globalAlpha = light;
    circle(c, 938, 442, 164, pool, 99);
    c.restore();
    for (const x of [822, 957, 1012]) {
      rect(c, x, 420, 35, 39, "#263e43");
      rect(c, x + 4, 424, 27, 29, light > .1 ? "#f3d38b" : "#788b79");
      line(c, [[x + 18, 424], [x + 18, 453]], "#68796a", 2);
      line(c, [[x + 4, 439], [x + 31, 439]], "#68796a", 2);
    }
    cut(c, "M872 505V418L923 414 933 504Z", "#324c50");
    shape(c, "M883 492V434L914 431 918 491Z", light > .1 ? "#ebbc78" : "#60746d");
    rect(c, 871, 394, 62, 26, "#e4d8b5");
    text(c, "郵站", 902, 413, 19, "#314849", "Kai", "center");
    cut(c, "M757 513L1132 496 1176 512 1156 532 760 542 728 529Z", "#b6c6b5");
    line(c, [[739, 536], [1161, 523]], "#3e5b5e68", 4);
  }

  function steam(c, x, y, t) {
    for (let i = 7; i >= 0; i--) {
      const age = (t * .89 + i / 8) % 1;
      c.save();
      c.translate(x - 220 * age, y - 86 * age + 11 * Math.sin(5 * age + i));
      c.scale(.3 + 1.62 * age, .3 + 1.26 * age);
      c.globalAlpha = (1 - age) * .38;
      shape(c, "M-36 7Q-38-17-17-15Q-10-34 10-24Q25-30 32-8Q52 8 29 17Q5 25-12 21Q-33 25-36 7Z",
        "#dce4d8", "#c3d6cb", 2);
      c.restore();
    }
  }

  function train(c, x, y, travel, t) {
    c.save();
    c.translate(x, y);
    steam(c, 105, -119, t);
    cut(c, "M-351-18V-90Q-342-101-326-101H-175Q-159-96-159-79V-17Z", "#426665", "#acba9d");
    line(c, [[-338, -37], [-169, -37]], "#c3a96e", 2.2);
    for (const wx of [-326, -283, -240, -197]) {
      rect(c, wx, -77, 25, 27, "#d7ab66");
      line(c, [[wx + 12, -76], [wx + 12, -51]], "#7f7759", 2);
    }
    line(c, [[-166, -29], [-144, -29]], "#263e41", 7);
    cut(c, "M-148-7L-148-102H-43V-73Q39-92 105-76L146-67 153-18 183 3 167 17H-119Z",
      "#345756", "#e4d4aa88", 7);
    cut(c, "M-165-102Q-134-127-64-120L-29-107-43-99H-150Z", "#263e48", "#bdc5aa77");
    shape(c, "M93-80L92-120 84-123 86-133H118L122-125 112-118 113-78Z", "#344d52", "#a7b6a2", 1.5);
    rect(c, -128, -90, 42, 42, "#263e41");
    rect(c, -122, -84, 31, 27, "#f0bc77");
    line(c, [[-105, -84], [-105, -57]], "#807354", 2.1);
    shape(c, "M-43-69Q52-80 123-65L127-23H-43Z", "#4d7470");
    shape(c, "M-44-28L146-24 147-8-44-13Z", "#a46249");
    circle(c, 153, -53, 13, "#edc479");
    circle(c, 155, -54, 7.2, "#ffe2a2");
    for (const [wx, r] of [[-323, 14], [-190, 14], [-98, 22], [-37, 22], [27, 25], [91, 21]]) {
      circle(c, wx, 13, r, "#273d43");
      circle(c, wx, 13, r - 4, "#7c7862");
      circle(c, wx, 13, r - 7, "#3e5a59");
      for (let n = 0; n < 7; n++) {
        const a = n * Math.PI * 2 / 7 + travel * .042;
        line(c, [[wx, 13], [wx + Math.cos(a) * (r - 6), 13 + Math.sin(a) * (r - 6)]], "#c0a5718c", 1.8);
      }
      circle(c, wx, 13, 4.5, "#748a7e");
    }
    const turn = travel * .042;
    line(c, [[-98 + 9 * Math.cos(turn), 13 + 9 * Math.sin(turn)],
      [91 + 9 * Math.cos(turn), 13 + 9 * Math.sin(turn)]], "#c4b486", 4);
    c.restore();
  }

  function carrier(c, x, y, swing) {
    c.save();
    c.translate(x, y);
    cut(c, "M-16 4L-12-39Q-6-55 9-53Q22-49 23-36L25 2 14 1 10 16 0 16-3 1Z",
      "#293c43", "#a1a9967a", 3);
    circle(c, 3, -57, 10, "#3f4f4e");
    shape(c, "M-12-61L-5-69H10L18-60Z", "#283c43");
    line(c, [[12, -38], [23, -25], [39, -32 + swing]], "#2d4244", 7);
    line(c, [[39, -32 + swing], [40, -17 + swing]], "#353f38", 1.7);
    circle(c, 40, -11 + swing, 11, "#e8ac63", 9);
    rect(c, 36, -16 + swing, 8, 10, "#f8df9d");
    c.restore();
  }

  function draw(c, t) {
    const travel = 535 * (1 - (1 - Math.min(t / 8.45, 1)) ** 1.55);
    const reach = progress(t, 6.4, 3.15);
    c.drawImage(backdrop, 0, 0);
    c.save();
    c.translate(-33 * progress(t, 0, 10), 0);
    cut(c, "M-55 488Q105 422 221 445T537 449T858 455T1340 411V735H-55Z", "#adc1b7");
    cut(c, "M-55 546Q145 482 299 487Q558 497 769 465Q1102 463 1340 492V735H-55Z", "#c1cec1");
    station(c, progress(t, 3.66, .65));
    for (let i = 0; i < 33; i++) {
      const x = -80 + 47 * i, y = 562 - x * .028;
      line(c, [[x, y], [x + 25, y + 24]], "#677b74", 5.5);
    }
    line(c, [[-80, 571], [1340, 532]], "#536971", 3.2);
    line(c, [[-80, 589], [1340, 550]], "#4b6569", 3.7);
    train(c, 128 + travel, 550 - travel * .025, travel, t);
    carrier(c, mix(929, 857, reach), 516, Math.sin(t * 5) * (1 - reach) * 3);
    c.restore();
    c.save();
    c.translate(-51 * progress(t, 0, 10), 0);
    cut(c, "M-90 617Q79 576 315 612Q449 621 559 602Q712 579 881 617Q1130 586 1360 585V748H-90Z",
      "#a4b9ac");
    cut(c, "M-90 648Q155 615 277 660Q430 690 652 646Q862 616 992 641Q1145 619 1360 635V748H-90Z",
      "#839d98");
    pine(c, 45, 677, 1.20, "#2b4951", "#abc0af");
    pine(c, 114, 684, .81, "#385862", "#a7bdac");
    pine(c, 1269, 693, 1.53, "#294a54", "#adc2b1");
    pine(c, 1198, 696, .85, "#32545e", "#b5c7af");
    c.restore();

    const random = rng(1701);
    for (let i = 0; i < 58; i++) {
      const x = (1340 + random() * 1340 - t * (10 + random() * 17)) % 1340;
      const y = (random() * H + t * (19 + random() * 50)) % H;
      circle(c, x, y, .65 + random() * 1.9, i > 48 ? "#eef3ddce" : "#f4eed387");
    }
    const vignette = c.createRadialGradient(654, 452, 410, 654, 452, 817);
    vignette.addColorStop(0, "#162b3900");
    vignette.addColorStop(1, "#132636ba");
    rect(c, 0, 0, W, H, vignette);
    text(c, "雪夜郵車", 79, 139, 63, "#f2deb0", "Brush");
    line(c, [[84, 159], [260, 159]], "#d3ccaa85", 1.2);
    silk(c, 1.2);
    caption(c, "zhidiao", t, "words");
  }

  register("zhidiao", draw, build);
})();
