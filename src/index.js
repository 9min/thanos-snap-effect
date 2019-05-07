const targetEl = document.getElementById("app");
const imageDataArray = [];
const canvasCount = 35;

const createBlankImageData = pixelArr => {
  for (let i = 0; i < canvasCount; i++) {
    let uinit8clampedArray = new Uint8ClampedArray(pixelArr);
    uinit8clampedArray = uinit8clampedArray.map(v => 0);

    imageDataArray.push(uinit8clampedArray);
  }
};

const weightedRandomDistrib = peak => {
  const prob = [];
  const seq = [];

  for (let i = 0; i < canvasCount; i++) {
    prob.push(Math.pow(canvasCount - Math.abs(peak - i), 3));
    seq.push(i);
  }
  return chance.weighted(seq, prob);
};

const newCanvasFromImageData = (arrData, w, h) => {
  const canvas = document.createElement("canvas");

  canvas.width = w;
  canvas.height = h;

  const tempCtx = canvas.getContext("2d");

  tempCtx.putImageData(new ImageData(arrData, w, h), 0, 0);

  return canvas;
};

const animateBlur = (elem, radius, duration) => {
  $({ rad: 0 }).animate(
    { rad: radius },
    {
      duration: duration,
      easing: "easeOutQuad",
      step: (now) => {
        elem.css({
          filter: "blur(" + now + "px)"
        });
      }
    }
  );
};

const animateTransform = (elem, sx, sy, angle, duration) => {
  var td = (tx = ty = 0);
  $({ x: 0, y: 0, deg: 0 }).animate(
    { x: sx, y: sy, deg: angle },
    {
      duration: duration,
      easing: "easeInQuad",
      step: (now, { prop }) => {
        if (prop === "x") tx = now;
        if (prop === "y") ty = now;
        if (prop === "deg") td = now;

        elem.css({
          transform: `rotate(${td}deg) translate(${tx}px, ${ty}px)`
        });
      }
    }
  );
};

const appendCanvas = (canvas) => {
  for (let i = 0; i < canvasCount; i++) {
    let convertCanvas = newCanvasFromImageData(
      imageDataArray[i],
      canvas.width,
      canvas.height
    );
    convertCanvas.classList.add("dust");

    $("body").append(convertCanvas);
  }
}

const hideOriginalEl = () => {
  $("#app")
    .children()
    .not(".dust")
    .fadeOut(3500);
}

const convertElToImg = () => {
  html2canvas(targetEl).then(canvas => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelArr = imageData.data;
    const pixelArrLen = pixelArr.length;

    createBlankImageData(pixelArr);

    for (let i = 0; i < pixelArrLen; i += 4) {
      const p = Math.floor((i / pixelArrLen) * canvasCount);
      const a = imageDataArray[weightedRandomDistrib(p)];

      a[i] = pixelArr[i];
      a[i + 1] = pixelArr[i + 1];
      a[i + 2] = pixelArr[i + 2];
      a[i + 3] = pixelArr[i + 3];
    }

    appendCanvas(canvas);

    hideOriginalEl();

    $(".dust").each(function(index) {
      animateBlur($(this), 0.8, 800);
      setTimeout(() => {
        animateTransform(
          $(this),
          100,
          -100,
          chance.integer({ min: -15, max: 15 }),
          800 + 110 * index
        );
      }, 70 * index);

      $(this)
        .delay(70 * index)
        .fadeOut(110 * index + 800, "easeInQuint", () => {
          $(this).remove();
        });
    });
  });
};

document.getElementById("btnEffect").addEventListener("click", convertElToImg);
