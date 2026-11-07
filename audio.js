// 고품질 프로덕션 사운드 엔진 (Web Audio API 절차적 오디오 합성)
// 단순 오실레이터 삐빅거림을 완전히 배제하고,
// 노이즈 버퍼, 멀티 레이어 트랜지언트, 바이쿼드 필터, 지수 피치 엔벨로프를 결합하여
// 롤토체스(TFT) 본게임 특유의 묵직하고 찰진 시네마틱 효과음을 완벽 구현합니다.

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.masterGain = null;
    this.noiseBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.createNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 타격감, 카드 셔플, 폭발 연출을 위한 1초 노이즈 버퍼 생성 (메모리 재활용)
  createNoiseBuffer() {
    if (!this.ctx || this.noiseBuffer) return;
    const bufferSize = this.ctx.sampleRate; // 1초
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // 1. 묵직하고 찰진 평타 물리 타격음 (어택 트랜지언트 크런치 + 묵직한 서브 바디 쿵)
  playAttack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Layer A: 찰진 타격 어택 스냅 (노이즈 버퍼 + 저역 통과 스윕 = "챡/퍽")
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(150, t + 0.06);
      noiseFilter.Q.setValueAtTime(1.8, t);

      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.08);
    }

    // Layer B: 묵직한 바디 서브 쿵 (피치 다운 160Hz -> 45Hz)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = "sine";
    bodyOsc.frequency.setValueAtTime(160, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

    bodyGain.gain.setValueAtTime(0.32, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.masterGain);

    bodyOsc.start(t);
    bodyOsc.stop(t + 0.12);
  }

  // 2. 상점 리롤 (D키): 덱 카드를 촤라락 섞는 쾌감 있는 셔플 사운드
  playReroll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 카드가 손가락을 스치며 넘어가는 연속 플러터 펄스 5회
    for (let i = 0; i < 5; i++) {
      const pt = t + i * 0.032;
      if (this.noiseBuffer) {
        const cardNoise = this.ctx.createBufferSource();
        cardNoise.buffer = this.noiseBuffer;
        const cFilter = this.ctx.createBiquadFilter();
        const cGain = this.ctx.createGain();

        cFilter.type = "bandpass";
        cFilter.frequency.setValueAtTime(1800 + i * 250, pt);
        cFilter.Q.setValueAtTime(3.5, pt);

        const vol = 0.18 + (i === 4 ? 0.08 : 0);
        cGain.gain.setValueAtTime(vol, pt);
        cGain.gain.exponentialRampToValueAtTime(0.001, pt + 0.045);

        cardNoise.connect(cFilter);
        cFilter.connect(cGain);
        cGain.connect(this.masterGain);

        cardNoise.start(pt);
        cardNoise.stop(pt + 0.05);
      }
    }

    // 뒤따라오는 은은한 마법 쉬머링 벨
    const chimeFreqs = [784, 987, 1174, 1567]; // G5, B5, D6, G6
    chimeFreqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + 0.08 + idx * 0.025);

      gain.gain.setValueAtTime(0.05, t + 0.08 + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + idx * 0.025 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + 0.08 + idx * 0.025);
      osc.stop(t + 0.08 + idx * 0.025 + 0.2);
    });
  }

  // 3. 기물 구매: 짤랑이는 고급 크리스탈 골드 코인 사운드 (진짜 동전 충돌 하모닉스)
  playBuy() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 동전 부딪히는 맑은 찰칵 (어택 클릭)
    if (this.noiseBuffer) {
      const click = this.ctx.createBufferSource();
      click.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      f.type = "highpass";
      f.frequency.setValueAtTime(4000, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      click.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      click.start(t);
      click.stop(t + 0.035);
    }

    // 롤토체스 특유의 영롱한 황금 벨 링잉
    const coinHarmonics = [1480, 2637, 3951, 5274]; // 크리스탈 메탈 공명
    coinHarmonics.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.02);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(6.0, t);

      gain.gain.setValueAtTime(0.12 / (idx + 1), t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.02);
      osc.stop(t + idx * 0.02 + 0.4);
    });
  }

  // 4. 판매 사운드: 주머니로 골드가 회수되는 묵직한 금화음
  playSell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 회수 스우시
    if (this.noiseBuffer) {
      const swoosh = this.ctx.createBufferSource();
      swoosh.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      f.type = "lowpass";
      f.frequency.setValueAtTime(2500, t);
      f.frequency.exponentialRampToValueAtTime(300, t + 0.16);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      swoosh.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      swoosh.start(t);
      swoosh.stop(t + 0.19);
    }

    // 동전 회수 착!
    const freqs = [1046, 880, 523];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + idx * 0.03);
      gain.gain.setValueAtTime(0.1, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.16);
    });
  }

  // 5. 초대형 레벨업 사운드 (808 서브 베이스 쿵 + 브라스 팡파르 + 마법 라이징)
  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. 대형 808 서브 우퍼 쿵 (110Hz -> 38Hz)
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + 0.55);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.7);

    // 2. 마법 라이징 스위프
    if (this.noiseBuffer) {
      const rise = this.ctx.createBufferSource();
      rise.buffer = this.noiseBuffer;
      const rf = this.ctx.createBiquadFilter();
      const rg = this.ctx.createGain();
      rf.type = "bandpass";
      rf.frequency.setValueAtTime(300, t);
      rf.frequency.exponentialRampToValueAtTime(3500, t + 0.4);
      rf.Q.setValueAtTime(3.0, t);
      rg.gain.setValueAtTime(0.25, t);
      rg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      rise.connect(rf);
      rf.connect(rg);
      rg.connect(this.masterGain);
      rise.start(t);
      rise.stop(t + 0.48);
    }

    // 3. 웅장한 천상의 메이저 화음 (C4, G4, C5, E5, G5, C6)
    const chord = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    chord.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i < 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, t + i * 0.04);

      gain.gain.setValueAtTime(0.14, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.65);
    });
  }

  // 6. 챔피언 합성 / 진급 (2성 / 3성 / 4성) - 황금빛 영광의 벨 & 파워업
  playCombine(star = 2) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = star === 4 ? 880 : star === 3 ? 659.25 : 523.25;
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0];

    // 성급에 따른 충격파
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(star >= 3 ? 140 : 110, t);
    sub.frequency.exponentialRampToValueAtTime(45, t + 0.4);
    subGain.gain.setValueAtTime(star >= 3 ? 0.35 : 0.22, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.5);

    // 크리스탈 챠임
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + i * 0.06);

      gain.gain.setValueAtTime(0.18, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.6);
    });
  }

  // 7. 스킬 사운드 (검기 슬래시, 거대 강타, 마법 폭발, 탄환 저격 등)
  playSkillSound(type = "default") {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === "galio" || type === "slam") {
      // 거대 지면 강타 폭발음 (갈리오/세트 궁극기)
      if (this.noiseBuffer) {
        const crash = this.ctx.createBufferSource();
        crash.buffer = this.noiseBuffer;
        const cf = this.ctx.createBiquadFilter();
        const cg = this.ctx.createGain();
        cf.type = "lowpass";
        cf.frequency.setValueAtTime(900, t);
        cf.frequency.exponentialRampToValueAtTime(60, t + 0.7);
        cg.gain.setValueAtTime(0.55, t);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        crash.connect(cf);
        cf.connect(cg);
        cg.connect(this.masterGain);
        crash.start(t);
        crash.stop(t + 0.85);
      }

      const sub = this.ctx.createOscillator();
      const subG = this.ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(95, t);
      sub.frequency.exponentialRampToValueAtTime(25, t + 0.8);
      subG.gain.setValueAtTime(0.55, t);
      subG.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      sub.connect(subG);
      subG.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.9);

    } else if (type === "slash") {
      // 야스오, 요네, 칼리스타의 날카로운 칼날 베기
      if (this.noiseBuffer) {
        const slash = this.ctx.createBufferSource();
        slash.buffer = this.noiseBuffer;
        const sf = this.ctx.createBiquadFilter();
        const sg = this.ctx.createGain();
        sf.type = "bandpass";
        sf.frequency.setValueAtTime(3200, t);
        sf.frequency.exponentialRampToValueAtTime(800, t + 0.12);
        sf.Q.setValueAtTime(2.5, t);
        sg.gain.setValueAtTime(0.4, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        slash.connect(sf);
        sf.connect(sg);
        sg.connect(this.masterGain);
        slash.start(t);
        slash.stop(t + 0.16);
      }

      const ring = this.ctx.createOscillator();
      const ringG = this.ctx.createGain();
      ring.type = "triangle";
      ring.frequency.setValueAtTime(1100, t);
      ring.frequency.exponentialRampToValueAtTime(400, t + 0.12);
      ringG.gain.setValueAtTime(0.2, t);
      ringG.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      ring.connect(ringG);
      ringG.connect(this.masterGain);
      ring.start(t);
      ring.stop(t + 0.15);

    } else {
      // 마법/폭발 에너지 방출
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(850, t + 0.18);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.25);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  // 8. 짧은 단음 (UI 클릭/배치 피드백)
  playTone(freq = 440, type = "sine", volume = 0.1, duration = 0.08) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  // 9. 승리 사운드 (웅장한 승리 팡파르)
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t + i * 0.09);

      gain.gain.setValueAtTime(0.16, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.7);
    });
  }

  // 10. 패배 사운드 (묵직한 디미니쉬드)
  playDefeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [311.13, 293.66, 277.18, 220.0];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t + i * 0.12);

      gain.gain.setValueAtTime(0.14, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.55);
    });
  }

  // 11. 은은한 롤토체스 운명 테마 BGM (사용자가 극찬한 신비로운 앰비언스 패드)
  initBGM() {
    let savedVol = 0.35;
    try {
      const stored = localStorage.getItem("tft_bgm_volume");
      if (stored !== null) savedVol = parseFloat(stored);
    } catch (e) {}

    this.bgmVolume = isNaN(savedVol) ? 0.35 : Math.max(0, Math.min(1, savedVol));
    this.lastNonZeroVolume = this.bgmVolume > 0 ? this.bgmVolume : 0.35;
    this.bgmPlaying = this.bgmVolume > 0;
  }

  setBGMVolume(val) {
    const num = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.bgmVolume = num;
    if (num > 0) {
      this.lastNonZeroVolume = num;
    }

    try {
      localStorage.setItem("tft_bgm_volume", num);
    } catch (e) {}

    // 볼륨이 0이면 즉시 음악 정지, 0보다 크면 즉시 시작
    if (num === 0) {
      this.bgmPlaying = false;
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    } else {
      if (!this.bgmPlaying || !this.bgmTimer) {
        this.bgmPlaying = true;
        this.init();
        this.startBGMLoop();
      }
    }
  }

  toggleMute() {
    if (this.bgmVolume > 0) {
      this.setBGMVolume(0);
      return 0;
    } else {
      const restore = this.lastNonZeroVolume || 0.35;
      this.setBGMVolume(restore);
      return restore;
    }
  }

  playBGMAuto() {
    if (this.bgmVolume === undefined) {
      this.initBGM();
    }
    if (this.bgmVolume > 0 && !this.bgmTimer) {
      this.init();
      this.bgmPlaying = true;
      this.startBGMLoop();
    }
  }

  startBGMLoop() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (!this.bgmPlaying || !this.ctx || this.bgmVolume <= 0) return;

    // TFT 운명 테마: 신비로운 동양풍 영혼의 산맥 시네마틱 코드 하모니 (Am7 -> Fmaj7 -> G -> Em)
    const chords = [
      {
        root: 110, // A2
        fifth: 164.81, // E3
        notes: [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63] // Am7
      },
      {
        root: 87.31, // F2
        fifth: 130.81, // C3
        notes: [174.61, 220, 261.63, 329.63, 349.23, 329.63, 261.63, 220] // Fmaj7
      },
      {
        root: 98.00, // G2
        fifth: 146.83, // D3
        notes: [196, 246.94, 293.66, 392, 493.88, 392, 293.66, 246.94] // G
      },
      {
        root: 82.41, // E2
        fifth: 123.47, // B2
        notes: [164.81, 196, 246.94, 329.63, 392, 329.63, 246.94, 196] // Em
      }
    ];
    let chordIdx = 0;
    let step = 0;

    const playStep = () => {
      if (!this.bgmPlaying || !this.ctx || this.bgmVolume <= 0) return;
      const t = this.ctx.currentTime;
      const current = chords[chordIdx];

      // 1. 코드 전환 시(step === 0) 웅장하고 따스한 운해 앰비언트 베이스 드론 패드
      if (step === 0) {
        // Root bass pad (따스한 삼각파 드론)
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassOsc.type = "triangle";
        bassOsc.frequency.setValueAtTime(current.root, t);

        bassFilter.type = "lowpass";
        bassFilter.frequency.setValueAtTime(260, t);
        bassFilter.Q.setValueAtTime(1.0, t);

        const bassVol = 0.042 * this.bgmVolume;
        bassGain.gain.setValueAtTime(0.0001, t);
        bassGain.gain.linearRampToValueAtTime(bassVol, t + 0.6);
        bassGain.gain.setValueAtTime(bassVol, t + 2.0);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.masterGain);

        bassOsc.start(t);
        bassOsc.stop(t + 2.7);

        // Sub 5th warm drone (은은한 5도 배음 화음)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        const subFilter = this.ctx.createBiquadFilter();

        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(current.fifth, t);
        subFilter.type = "lowpass";
        subFilter.frequency.setValueAtTime(320, t);

        const subVol = 0.026 * this.bgmVolume;
        subGain.gain.setValueAtTime(0.0001, t);
        subGain.gain.linearRampToValueAtTime(subVol, t + 0.7);
        subGain.gain.setValueAtTime(subVol, t + 1.9);
        subGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

        subOsc.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(this.masterGain);

        subOsc.start(t);
        subOsc.stop(t + 2.6);

        // 주기적 천공의 영혼 풍경(Wind Chime / Bell)
        if (chordIdx === 0 || chordIdx === 2) {
          const bellOsc = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bellOsc.type = "sine";
          bellOsc.frequency.setValueAtTime(chordIdx === 0 ? 1760 : 1567.98, t + 0.1);
          bellGain.gain.setValueAtTime(0.016 * this.bgmVolume, t + 0.1);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          bellOsc.connect(bellGain);
          bellGain.connect(this.masterGain);
          bellOsc.start(t + 0.1);
          bellOsc.stop(t + 1.5);
        }
      }

      // 2. 가야금 / 고토 / 켈틱 하프 질감의 맑고 영롱한 아르페지오 (듀얼 레이어 핑거 플럭)
      const noteFreq = current.notes[step % current.notes.length];
      const pluckT = t;

      // 주음(Fundamental Pluck)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(noteFreq * 1.5, pluckT);

      filter1.type = "lowpass";
      filter1.frequency.setValueAtTime(1600, pluckT);
      filter1.frequency.exponentialRampToValueAtTime(450, pluckT + 0.35);
      filter1.Q.setValueAtTime(1.8, pluckT);

      const mainVol = 0.05 * this.bgmVolume;
      gain1.gain.setValueAtTime(0.001, pluckT);
      gain1.gain.linearRampToValueAtTime(mainVol, pluckT + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.0001, pluckT + 0.55);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.masterGain);

      osc1.start(pluckT);
      osc1.stop(pluckT + 0.6);

      // 배음 현 울림(Acoustic Sparkle Overtone)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(noteFreq * 3.0, pluckT);

      const overtoneVol = 0.012 * this.bgmVolume;
      gain2.gain.setValueAtTime(overtoneVol, pluckT);
      gain2.gain.exponentialRampToValueAtTime(0.0001, pluckT + 0.22);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);

      osc2.start(pluckT);
      osc2.stop(pluckT + 0.25);

      step++;
      if (step >= 8) {
        step = 0;
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    this.bgmTimer = setInterval(playStep, 310);
  }
}

export const sound = new SoundSystem();
