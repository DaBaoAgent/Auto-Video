(() => {
  const { W, H, shape, line, rect, text, circle, layer, rng, silk, seal, caption,
    progress, camera, register } = Paper;
  const indigo = "#273847", red = "#a7442d", gold = "#a88b56";
  const skyColor = "#e4d3ad";
  let panorama, profile, comparison;

  function terrace(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    shape(c, "M-286 128L-164 16 318 13 465 120 316 178-236 182Z", "#ae9c79", "#6b634f", 2);
    for (let i = -6; i <= 5; i++) {
      line(c, [[-32 + i * 51, 21], [-20 + i * 65, 160]], "#75685375", 1.15);
    }
    for (let i = 0; i < 5; i++) {
      line(c, [[-267 + i * 26, 113 - i * 21], [443 - i * 25, 108 - i * 19]], "#78695369", 1.2);
    }
    c.restore();
  }

  function observatory(c) {
    rect(c, 0, 0, W, H, skyColor);
    circle(c, 383, 224, 69, "#a64b35b8");
    shape(c, "M0 388Q77 324 163 334L226 258 276 282 359 199 435 293 492 263 546 328Q628 258 714 364L782 314 894 370 1011 300 1090 334 1193 239 1280 300V720H0Z",
      "#868776", "#757b6b", 1.2);
    shape(c, "M0 432L65 401 97 397 147 361 176 333 211 362 262 384 298 360 329 352 365 319 395 346 405 373 488 413 510 401 566 365 603 396 673 425 725 409 894 438 975 398 1031 413 1098 419 1152 379 1206 362 1280 321V720H0Z",
      "#5e706c");
    for (const ridge of [
      "M176 339L157 363 129 382 108 412M172 347L193 368 199 385 237 404",
      "M363 325L348 352 316 369 302 400M366 328L385 361 382 378 427 400",
      "M563 372L546 396 531 402 516 432M576 380L602 401 622 413",
      "M1274 330L1234 361 1216 368 1180 405 1143 417",
    ]) shape(c, ridge, null, "#dacba563", 1.65);
    shape(c, "M0 479C209 428 365 434 536 460S1045 494 1280 428V720H0Z", "#9d9b7a");
    shape(c, "M0 528Q472 412 640 480T1280 502V720H0Z", "#beb08d");
    const random = rng(192);
    for (let i = 0; i < 480; i++) {
      const x = random() * W, y = 424 + random() * 175;
      line(c, [[x, y], [x + 6 + random() * 23, y + 1.5]], "#3e463b33", .9);
    }
    for (const [x, y, s] of [[180, 465, .82], [261, 479, .68], [1120, 460, .92], [1181, 470, .66]]) {
      c.save();
      c.translate(x, y);
      c.scale(s, s);
      shape(c, "M-6 4Q-1-51-14-102L-6-120 6-90 11-54 6 3Z", "#434d45");
      for (let i = 0; i < 5; i++) {
        const y = -24 * i - 19;
        shape(c, `M-43 ${y}Q-32 ${y-10}-14 ${y-18}L-9 ${y-43}Q12 ${y-14}40 ${y-7}L45 ${y+1}Q9 ${y-4}-43 ${y}`, "#475a50");
      }
      c.restore();
    }
    terrace(c, 628, 440, 1.01);
  }

  function instrument(c, x, y, s, shadow) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    shape(c, "M-28 0L7-31 439-48 489-18 445 5-2 26Z", "#5b564b");
    shape(c, "M-28-16L7-46 439-62 489-31 447-9-3 11Z", "#cebc8e", "#776449", 2);
    shape(c, "M-3 11L447-9 489-31 489-16 447 8-3 26Z", "#8d7858");
    shape(c, "M21-19L460-42 463-34 24-9Z", "#c7aa75");
    for (let i = 0; i < 30; i++) {
      const dx = i * 14.2 + 37, y = -15 - i * .66;
      line(c, [[dx, y], [dx - (i % 5 === 0 ? 8 : 4), y - (i % 5 === 0 ? 20 : 10)]],
        i % 5 === 0 ? "#594833" : "#7c6343", i % 5 === 0 ? 2.2 : 1);
    }
    shape(c, `M4-26L${shadow} ${-27-shadow*.047}L${shadow+6} ${-15-shadow*.047}L12-11Z`, "#303d469e");
    shape(c, "M-15-17L-5-229 15-235 23-23 10-11Z", indigo, "#24313a", 1.7);
    shape(c, "M-5-229L3-227 2-15-15-17Z", "#626d6b");
    shape(c, "M-5-229L13-236 22-231 3-224Z", "#c3ab79");
    line(c, [[7, -210], [9, -45]], "#ba9d656d", 1.1);
    c.restore();
  }

  function build() {
    panorama = layer((c) => {
      observatory(c);
      instrument(c, 500, 565, 1.17, 250);
      // An observer faces the instrument, with the knees and sleeves picked out in dry ink.
      shape(c, "M391 458Q414 448 438 464L456 527 440 555 387 552 358 539 382 516Z",
        indigo, "#282e33", 2.1);
      shape(c, "M394 460Q383 442 401 427Q418 418 433 435L430 457 419 466Z", "#b78f61", "#443c31", 1.6);
      shape(c, "M388 435Q391 415 423 416L437 432 423 441Z", "#313842");
      shape(c, "M430 476L451 470 488 493 481 503 450 497 425 493Z", "#495a61");
      shape(c, "M390 535Q416 526 439 541M402 470L398 508 378 531", null, "#a09174", 2);
    });
    profile = layer((c) => {
      observatory(c);
      rect(c, 0, 0, W, H, "#bcb08c48");
      instrument(c, 435, 555, 1.47, 246);
      line(c, [[442, 221], [359, 163], [270, 163]], "#554831", 1.2);
      circle(c, 442, 221, 3.5, red);
      text(c, "表", 272, 153, 34, red);
      line(c, [[802, 516], [895, 440], [1007, 440]], "#554831", 1.2);
      circle(c, 802, 516, 3.5, red);
      text(c, "圭", 970, 430, 34, red);
    });
    comparison = layer((c) => {
      observatory(c);
      rect(c, 0, 0, W, H, "#dcc799c2");
      instrument(c, 505, 533, 1.30, 357);
      const long = [[519, 548], [963, 524]], short = [[519, 571], [692, 561]];
      line(c, long, red, 2.3);
      line(c, short, "#476457", 2.3);
      line(c, [[963, 524], [971, 457], [997, 433], [1116, 433]], red, 1.6);
      line(c, [[692, 561], [692, 487], [712, 462], [817, 462]], indigo, 1.6);
      circle(c, 963, 524, 4, red);
      circle(c, 692, 561, 4, indigo);
      text(c, "冬至影長", 989, 419, 33, red);
      text(c, "夏至影短", 708, 448, 33, indigo);
    });
  }

  function draw(c, t) {
    const [second, third] = window.SHOTS.lishi.slice(1);
    if (t < second) {
      camera(c, panorama, 560, 414, 1.02 + t * .021, t * 3, 0);
      text(c, "圭表", 94, 184, 108, indigo, "Brush");
      text(c, "用一根竿，量四季的影", 106, 241, 29, "#5c513f");
    } else if (t < third) {
      const p = progress(t, second, third - second);
      camera(c, profile, 645, 455, 1.093 - p * .055, -13 * p, 0);
      text(c, "立表測影", 96, 163, 66, indigo, "Brush");
    } else {
      const p = progress(t, third, 10 - third);
      camera(c, comparison, 786, 516, 1.024 + p * .060, -p * 17, 0);
      text(c, "同是正午", 98, 164, 78, indigo, "Brush");
      text(c, "影長隨節氣變化", 105, 216, 28, "#544635");
    }
    const veil = c.createLinearGradient(0, 573, 0, H);
    veil.addColorStop(0, "#e4d3ad00");
    veil.addColorStop(.70, "#e4d3ad");
    rect(c, 0, 573, W, H - 573, veil);
    c.strokeStyle = "#6f553c9a";
    c.lineWidth = 1.2;
    c.strokeRect(33, 34, 1214, 651);
    c.strokeStyle = "#9f835776";
    c.strokeRect(42, 43, 1196, 633);
    seal(c, 1153, 66, "測影", 52);
    const vignette = c.createRadialGradient(644, 343, 380, 644, 343, 800);
    vignette.addColorStop(0, "#4f3a2000");
    vignette.addColorStop(1, "#4f3a2044");
    rect(c, 0, 0, W, H, vignette);
    silk(c, 1.1);
    caption(c, "lishi", t, "clause");
  }

  register("lishi", draw, build);
})();
