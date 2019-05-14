/*
  Dependency
    - jquery
    - jquery-ui
    - html2canvas
    - chance
*/

class ThanosEffect {
  constructor(options) {
    const { target } = options;

    this.state = {
      dataArray: [],
      effectClass: '.thanos-effect',
    };

    this.checkTargetElement(target);
    this.freezeState(options);
    this.convertElementToCanvas();
  }

  checkTargetElement(element) {
    if (!element || typeof element !== 'object' || !element.nodeName) {
      throw Error('target element is not defined!');
    }
  }

  freezeState(options) {
    const {
      target,
      count = 10,
      time = 1000,
    } = options;

    Object.assign(this.state, { target, count, time });
    Object.freeze(this.state);
  }

  createBlankPixelData(pixelDatas) {
    const { dataArray, count } = this.state;

    for (let i = 0; i < count; i++) {
      const uinit8clampedArray = pixelDatas.map(v => 0);
  
      dataArray.push(uinit8clampedArray);
    }
  };

  getWeightedRandomDistrib(peak) {
    const { count } = this.state;
    const prob = [];
    const seq = [];
  
    for (let i = 0; i < count; i++) {
      prob.push(Math.pow(count - Math.abs(peak - i), 3));
      seq.push(i);
    }
  
    return chance.weighted(seq, prob);
  };

  convertPixelDatas(pixelDatas) {
    const { dataArray, count } = this.state;
    const pixelDatasLength = pixelDatas.length;

    for (let i = 0; i < pixelDatasLength; i += 4) {
      const peak = Math.floor((i / pixelDatasLength) * count);
      const randomDist = this.getWeightedRandomDistrib(peak);
      const targetData = dataArray[randomDist];
  
      for (let j = 0; j < 4; j++) {
        const n = i + j;
  
        targetData[n] = pixelDatas[n];
      }
    }
  }

  getNewCanvasFromImageData(datas, w, h) {
    const canvas = document.createElement('canvas');
    const tempCtx = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;
  
    tempCtx.putImageData(new ImageData(datas, w, h), 0, 0);
  
    return canvas;
  };

  appendEffectCanvas(canvas) {
    const { dataArray, target, count, effectClass } = this.state;
    const ratio = window.devicePixelRatio || 1;

    for (let i = 0; i < count; i++) {
      const newCanvas = this.getNewCanvasFromImageData(
        dataArray[i],
        canvas.width,
        canvas.height
      );

      newCanvas.getContext('2d').scale(ratio, ratio);
      newCanvas.classList.add(effectClass.replace(/\./g, ''));
      newCanvas.style = `
        position: absolute;
        top: 0;
        left: 0;
        width: ${newCanvas.width / ratio}px;
        height: ${newCanvas.height / ratio}px;
      `;
  
      target.appendChild(newCanvas);
    }
  }

  async convertElementToCanvas() {
    const { target } = this.state;
    const canvas = await html2canvas(target);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelDatas = imageData.data;

    // 데이터 배열에 비어있는 픽셀 데이터 배열들 추가
    this.createBlankPixelData(pixelDatas);

    // 픽셀 데이터 배열들 값 변조
    this.convertPixelDatas(pixelDatas);

    // 타겟 엘리먼트에 이펙트 캔버스들 추가
    this.appendEffectCanvas(canvas);

    // 이펙트 효과 시작
    this.start();
  }

  hideOriginalElements() {
    const { target, time, effectClass } = this.state;

    $(target).children().not(effectClass).fadeOut(time);
  }

  animateTransform($element, sx, sy, deg, duration) {
    let tx = 0;
    let ty = 0;
    let td = 0;

    $({ x: 0, y: 0, deg: 0 }).animate(
      { x: sx, y: sy, deg },
      {
        duration,
        easing: 'easeInQuad',
        step: (now, { prop }) => {
          if (prop === 'x') tx = now;
          if (prop === 'y') ty = now;
          if (prop === 'deg') td = now;
  
          $element.css({ transform: `rotate(${td}deg) translate(${tx}px, ${ty}px)` });
        }
      }
    );
  };

  animateBlur($element, rad, duration) {
    $({ rad: 0 }).animate(
      { rad },
      {
        duration,
        easing: 'easeOutQuad',
        step: now => $element.css({ filter: `blur(${now}px)` })
      }
    );
  };

  effect() {
    const { animateBlur, animateTransform } = this;
    const { effectClass } = this.state;

    $(effectClass).each(function(index) {
      const $this = $(this);
      const x = 100;
      const y = -100;
      const angle = chance.integer({ min: -15, max: 15 });
      const duration = 1000 + (500 * index);
      const delay = 100 * index;
  
      animateBlur($this, 1, duration);
  
      setTimeout(() => animateTransform($this, x, y, angle, duration), delay);
  
      $this.delay(delay).fadeOut(duration, 'easeInQuint', () => $this.remove());
    });
  }

  start() {
    // 기존에 있었던 엘리먼트들은 사라지게
    this.hideOriginalElements();
    // 이펙트 적용
    this.effect();
  }
}
