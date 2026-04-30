(function () {
  const root = window.DeepakDemo = window.DeepakDemo || {};
  const musicTracks = [
    "music/Circuit Pe Dhol.mp3",
    "music/Monsoon Office Drift.mp3",
    "music/Shatranj Ka Badshah.mp3",
    "music/Steel Raja.mp3"
  ];

  const userMessageSound = "music/(1998) Windows 98_CHIMES.WAV";
  const cowAmbientSound = "music/cow-moo-sound-short.mp3";
  const musicEnabledStorageKey = "deepakDemoMusicEnabled";

  function pickRandomTrack(exceptTrack) {
    const availableTracks = musicTracks.filter((track) => track !== exceptTrack);
    const pool = availableTracks.length > 0 ? availableTracks : musicTracks;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function initAudio(state) {
    if (!state.audio) {
      state.audio = new Audio();
      state.audio.volume = 0.35;
      state.audio.addEventListener("ended", () => playRandomTrack(state));
    }
    if (!state.userAudio) {
      state.userAudio = new Audio(userMessageSound);
      state.userAudio.volume = 0.9;
    }
    if (!state.cowAudio) {
      state.cowAudio = new Audio(cowAmbientSound);
      state.cowAudio.volume = 0.18;
    }
  }

  function playRandomTrack(state) {
    if (!state.audio || !state.musicStarted || !state.isMusicEnabled) return;
    const currentTrack = state.audio.getAttribute("data-track");
    const nextTrack = pickRandomTrack(currentTrack);
    state.audio.src = nextTrack;
    state.audio.setAttribute("data-track", nextTrack);
    state.audio.play().catch(() => { state.musicStarted = false; });
  }

  function startMusic(state) {
    initAudio(state);
    if (!state.isMusicEnabled) return;
    if (state.musicStarted && !state.audio.paused) return;
    state.musicStarted = true;
    playRandomTrack(state);
  }

  function toggleBackgroundMusic(state) {
    initAudio(state);
    state.isMusicEnabled = !state.isMusicEnabled;
    localStorage.setItem(musicEnabledStorageKey, String(state.isMusicEnabled));
    if (state.isMusicEnabled) {
      state.musicStarted = true;
      if (!state.audio.src || state.audio.ended) playRandomTrack(state);
      else state.audio.play().catch(() => {});
    } else {
      state.audio.pause();
      state.musicStarted = false;
    }
  }

  function playUserMessageSound(state) {
    if (!state.userAudio || !state.musicUnlocked) return;
    state.userAudio.currentTime = 0;
    state.userAudio.play().catch(() => {});
  }

  function playCowAmbient(state) {
    if (!state.cowAudio || !state.musicUnlocked) return;
    state.cowAudio.currentTime = 0;
    state.cowAudio.play().catch(() => {});
  }

  root.audio = {
    musicEnabledStorageKey,
    initAudio,
    playRandomTrack,
    startMusic,
    toggleBackgroundMusic,
    playUserMessageSound,
    playCowAmbient
  };
})();
