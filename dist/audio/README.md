# Original recordings

These three original recordings were composed and rendered for this user in REAPER, then explicitly authorized for this game's song library. No commercial-game songs or third-party samples are included.

- `bossa.mp3`: 庭院明信片 / Courtyard Postcard, final v3, 112 BPM, 48 bars.
- `synthwave.mp3`: 玻璃公路 / Glass Highway, final v4, 112 BPM, 40 bars.
- `breakbeat.mp3`: 银色湍流 / Silver Current, final v3, 172 BPM, 64 bars.

At 100% the game decodes and plays these exact MP3 files using its AudioContext clock. At other practice rates it uses the accompanying final composition score to synthesize a clearly labeled practice arrangement. That arrangement is not the REAPER recording and does not reproduce every instrument or stereo detail.

The chart compiler maps real score onsets, not reverb tails, to targets. See `../../scripts/build-charts.py`. Initial target voices: Bossa pluck → flute; Synthwave arpeggio → lead; DnB piano → lead and bell answers. Dense accompaniment is deliberately not mapped wholesale.

`../../audio-alignment.json` records numerical comparison of the bundled MP3 against its final REAPER WAV over the first 20 seconds, decoded at 8 kHz mono. All measured lags were zero samples; correlation exceeded 0.99998. This establishes encoder alignment in the tested decoder, not subjective listening or browser-device latency.
