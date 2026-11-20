(() => {
  const { W, H, path, shape, line, circle, rect, text, layer, rng, silk,
    progress, mix, register } = Paper;
  const paper = "#f3e9d2", pencil = "#6e6559", sage = "#627c58";
  const hills = [
    "M-50 375Q88 263 194 281Q336 239 446 347Q551 238 659 301Q743 259 824 316Q1051 186 1330 320V718H-50Z",
    "M-55 473Q77 365 245 405Q420 421 526 354Q719 312 874 413Q1047 322 1330 381V720H-55Z",
    "M-55 575Q104 441 303 473Q374 483 437 506Q552 569 709 487Q925 408 1130 457L1330 500V745H-55Z",
    "M-55 640Q126 575 296 619Q411 670 502 637Q731 554 869 591Q1090 606 1330 513V745H-55Z",
  ];
  const shell = "M-172-119Q-189-193-118-239Q-60-280 26-253Q105-226 118-156Q129-75 63-39Q-43-4-130-61Q-156-83-172-119Z";
  const body = "M-220-36Q-186-58-147-70Q-95-86-13-63Q51-50 83-82Q121-120 136-159Q153-191 186-178Q219-169 213-135Q204-87 184-56Q145-5 62 5L-179 4Q-205 1-235 8Q-248-9-220-36Z";
  const spiral = "M77-170C65-216 6-239-54-224C-115-211-137-151-97-106C-59-63 16-71 43-112C71-154 41-199 0-195C-45-193-62-156-41-138C-22-118 9-124 17-147";
  let sketch, wash, field, figure;

  function graphite(c, d, width = 1.45) {
    shape(c, d, null, "#524a438f", width);
    c.save();
    c.translate(2, -1.5);
    shape(c, d, null, "#705d483d", 1);
    c.restore();
  }

  function paint(c, d, fill, seed, fibers, bounds) {
    c.save();
    c.clip(path(d));
    rect(c, ...bounds, fill);
    const [x, y, w, h] = bounds;
    const random = rng(seed);
    for (let i = 0; i < fibers; i++) {
      const dx = x + random() * w, dy = y + random() * h;
      line(c, [[dx, dy], [dx + 2 + random() * w * .047, dy - random() * 5]],
        i % 4 === 0 ? "#fff0c67e" : i % 3 === 0 ? "#3e493b36" : "#fff1ca33", .34 + random() * 2.4);
    }
    c.restore();
    shape(c, d, null, "#61584956", 1.5);
  }

  function stem(c, x, y, s, seed, fill) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    const random = rng(seed);
    for (let i = 0; i < 7; i++) {
      const dx = (i - 3) * 7, height = 29 + random() * 62;
      const d = `M0 0Q${dx*.4} ${-height*.62} ${dx} ${-height}Q${dx*.85-11} ${-height*.59} -2 0Z`;
      shape(c, d, fill, "#5f654c6b", 1);
    }
    c.restore();
  }

  function flower(c, x, y, s, color, seed) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    shape(c, "M5 63Q12 34-1 3M7 41Q-20 33-23 21Q-1 19 7 41ZM7 43Q21 17 35 26Q31 38 7 43Z",
      "#718452", sage, 1.8);
    const random = rng(seed);
    for (let i = 0; i < 7; i++) {
      c.rotate(Math.PI * 2 / 7);
      shape(c, "M0-6Q-17-15-12-30Q-6-43 5-34Q16-25 4-7Z", color, "#725b5269", 1);
      line(c, [[0, -11], [random() * 3 - 1, -26]], "#ead0a580", 1);
    }
    circle(c, 0, 0, 10, "#ce9b50");
    circle(c, -2, -2, 4, "#f0cb7f");
    c.restore();
  }

  function mushroom(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    paint(c, "M-9 4Q0-18-3-49H14Q10-26 23 0Q10 7-9 4Z", "#d9c7a2", 921, 110, [-12, -51, 39, 59]);
    paint(c, "M-44-42Q-21-89 15-83Q52-79 64-41Q22-32-44-42Z", "#a97760", 9271, 270, [-47, -86, 116, 56]);
    for (const [dx, dy, r] of [[-19, -59, 5], [2, -67, 3], [22, -61, 4], [41, -50, 3.5]]) {
      circle(c, dx, dy, r, "#e5c998bf", r * .65);
    }
    c.restore();
  }

  function build() {
    sketch = layer((c) => {
      rect(c, 0, 0, W, H, paper);
      for (const d of hills) graphite(c, d, 1.35);
      const random = rng(8273);
      for (let i = 0; i < 220; i++) {
        const x = random() * W, y = 292 + random() * 378;
        line(c, [[x, y], [x + 7 + random() * 18, y - 6 + random() * 9]], "#6a5b4845", .7);
      }
    });
    wash = layer((c) => {
      paint(c, "M-5 0H1285V362Q1120 317 945 328Q823 386 653 338Q399 302 205 342Q112 369-5 333Z",
        "#a5beb371", 431, 880, [0, 0, W, 370]);
      for (const d of [
        "M84 182Q151 147 187 179Q210 155 247 181Q290 185 312 193Q216 205 84 197Z",
        "M779 143Q824 117 872 133Q912 105 961 140Q1027 130 1081 154Q944 176 791 163Z",
        "M1000 225Q1085 194 1130 216Q1176 197 1218 224L1201 231Q1067 242 1000 225Z",
      ]) shape(c, d, "#f3e7c5ad");
      paint(c, hills[0], "#84998865", 200, 720, [0, 258, W, 450]);
      paint(c, hills[1], "#9dad747b", 14, 1140, [0, 334, W, 390]);
    });
    field = layer((c) => {
      paint(c, hills[2], "#adad71b0", 451, 1580, [0, 399, W, 322]);
      paint(c, "M227 486Q299 457 456 460Q559 446 690 467Q744 483 664 502Q590 515 483 503Q360 503 281 510Q219 510 227 486Z",
        "#9ebbb17c", 9272, 540, [220, 447, 521, 64]);
      shape(c, "M264 496Q332 483 399 491M414 474Q463 469 505 477M512 495Q573 490 629 495",
        null, "#eaddbba9", 2.7);
      paint(c, hills[3], "#6f8e61", 330, 2110, [0, 508, W, 216]);
      const random = rng(51);
      for (let i = 0; i < 80; i++) {
        const x = random() * W, y = 492 + random() * 220;
        if (y > 607 || x < 345 || x > 988) {
          stem(c, x, y, .12 + random() * .50, i + 8, i % 3 ? "#729259" : "#9ba263");
        }
      }
      for (const [x, y, s, color, seed] of [
        [77, 603, 1.18, "#ddc09d", 12], [154, 551, .72, "#b97468", 13], [232, 626, .87, "#ddbc81", 14],
        [1077, 580, .61, "#c98063", 15], [1198, 622, 1.24, "#d9bb7a", 16], [1123, 665, 1, "#d8a790", 10],
        [352, 657, .46, "#dbbf91", 87], [971, 582, .55, "#e3cc98", 11],
      ]) flower(c, x, y, s, color, seed);
      mushroom(c, 264, 579, 1.3);
      mushroom(c, 321, 602, .83);
    });
    figure = layer((c) => {
      c.translate(256, 282);
      paint(c, body, "#d1aa58", 111, 1150, [-255, -201, 490, 232]);
      shape(c, "M-215-24Q-132-45-28-26Q87-12 158-64Q132-8 59 3H-157Q-206 0-235 8Z", "#e5c47793");
      paint(c, shell, "#b96148", 141, 2000, [-189, -280, 321, 260]);
      c.save();
      c.clip(path(shell));
      shape(c, "M-173-161Q-71-279 46-235Q-50-275-126-187Q-168-133-111-78Q-157-89-173-161Z", "#e5976e8f");
      shape(c, "M92-181Q125-46-9-44Q-88-36-139-69Q-92-11 30-35Q133-45 127-130Z", "#814c478c");
      shape(c, spiral, null, "#783f39", 8);
      c.translate(-3.6, -4);
      shape(c, spiral, null, "#ecaa7b", 4.2);
      c.restore();
    });
  }

  function antenna(c, t, color) {
    for (const [x, y, d] of [[159, -188, -13], [185, -183, 16]]) {
      const tip = x + d + 4 * Math.sin(t * 2.7);
      line(c, [[x, y + 13], [x + d * .46, y - 11], [tip, y - 32]], color, 3.2);
      circle(c, tip, y - 32, 5.4, color);
    }
  }

  function umbrella(c, x, y, t, open) {
    c.save();
    c.translate(x, y);
    c.rotate(-.07 + .05 * Math.sin(t * 2.1));
    shape(c, "M-6 213Q4 103 3-2L12-2Q15 87 3 213Z", "#657b4b", "#43573c", 1);
    c.scale(.07 + .93 * open, .68 + .32 * open);
    const leaf = "M-205 27Q-131-89-52-57Q-5-52 6-94Q54-58 111-72Q155-67 213-1Q132-4 119 35Q67 1 33 37Q3 8-32 44Q-76 8-107 36Q-139 7-205 27Z";
    paint(c, leaf, "#567b54", 8502, 625, [-208, -96, 425, 146]);
    shape(c, "M-203 27Q-79-13 7-22Q105-36 211-1M8-24L4-89M-99 4Q-68-35-50-55M82-26Q106-35 111-67M33-26L37 26M-74-9L-101 32M135-28Q127 7 120 29",
      null, "#b4b979", 2.7);
    for (const [dx, dy, r] of [[-95, -18, 4], [56, -45, 5], [109, -27, 3.2]]) circle(c, dx, dy, r, "#d0dcc6a3", r * .68);
    c.restore();
  }

  function draw(c, t) {
    c.drawImage(sketch, 0, 0);
    c.save();
    c.globalAlpha = .18 + .82 * progress(t, .3, 2.6);
    c.drawImage(wash, 0, 0);
    c.globalAlpha = progress(t, 1.4, 2.3);
    c.drawImage(field, 0, 0);
    c.restore();
    const x = 525 + 196 * progress(t, 3.9, 4.6), y = 561 + 4 * Math.sin(t * 2.3);
    c.save();
    c.translate(x, y);
    graphite(c, shell, 2.2);
    graphite(c, spiral, 1.4);
    graphite(c, body, 2.2);
    antenna(c, t, pencil);
    const painted = progress(t, 2.7, 2.1);
    c.save();
    c.globalAlpha = .19 + .81 * painted;
    c.drawImage(figure, -256, -282);
    c.restore();
    circle(c, 188, -150, 3.9, "#3e3c35");
    shape(c, "M193-139Q199-132 205-139", null, "#574835", 1.65);
    c.restore();

    const open = progress(t, 5.15, 1.3);
    if (open > 0) {
      c.save();
      c.globalAlpha = progress(t, 5.15, .22);
      umbrella(c, x + 163, y - 318, t, open);
      c.restore();
    }

    const bug = progress(t, 6.25, 1.82);
    c.save();
    c.translate(mix(1073, 972, bug), 534 + 3 * Math.sin(t * 6));
    circle(c, 0, 0, 17, "#b35142", 14);
    circle(c, -16, 2, 7, "#494535", 6);
    line(c, [[-4, -11], [7, 11]], "#593e34", 2);
    for (const [dx, dy] of [[-5, -5], [4, 4], [7, -5], [12, 1]]) circle(c, dx, dy, 2.15, "#543f38");
    c.restore();

    const random = rng(91);
    for (let i = 0; i < 32; i++) {
      const rx = random() * W, ry = ((random() * H + t * (80 + random() * 100)) % H);
      if (ry > 165 && (rx < x - 50 || rx > x + 382)) {
        line(c, [[rx, ry], [rx - 7, ry + 14]], "#4c777a61", 1.35);
      }
    }
    silk(c, 1.4);
    text(c, "蜗牛送伞", 88, 151, 78, "#5b5b46", "Brush");
  }

  register("minjian", draw, build);
})();
