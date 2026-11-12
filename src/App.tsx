import { useEffect, useState } from 'react';

import { Board } from './components/Board';
import { HomeLink } from './components/HomeLink';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import { Confetti } from './components/Confetti';
import {
  initialStats,
  initialStore,
  isMatched,
  newRound,
  pour,
  recordWin,
  startOver,
  undo,
  type Level,
  type Paint,
  type Round,
  type Stats,
  type Store,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useCheer, usePlop } from './lib/use-cheer';
import { useLanguage, useSound } from './lib/use-shared-settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<Store>('paint', initialStore);
  const [stats, setStats] = useStoredState<Stats>('paint-stats', initialStats);

  const [language, setLanguage] = useLanguage();
  const lang = language === 'auto' ? detectLang() : language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  const [view, setViewState] = useState<View>(store.round ? 'play' : 'new');
  // Menus open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => {
    if (store.round) setViewState('play');
  });
  useWakeLock();
  const [sound, setSound] = useSound();
  const cheer = useCheer(sound);
  const plop = usePlop(sound);
  const [celebrating, setCelebrating] = useState(false);

  const round = store.round;

  const start = (level: Level) => {
    setStore({
      round: newRound(level, Math.random, round?.target),
    });
    setView('play');
  };

  const update = (next: Round) => {
    if (!round || next === round) return;
    setStore({ round: next });
    if (isMatched(next)) {
      setStats(recordWin(stats, next));
      // Once the last drop has mixed in.
      setTimeout(() => {
        setCelebrating(true);
        cheer();
      }, 500);
    }
  };

  const onPour = (paint: Paint) => {
    if (!round) return;
    const next = pour(round, paint);
    if (next !== round) plop(next.drops.length);
    update(next);
  };

  const solved = round && isMatched(round);

  return (
    <main className={view === 'play' && round ? 'app app--play' : 'app'}>
      <header className='header'>
        <div className='header__title'>
          <HomeLink label={t.allGames} />
          <h1>{t.title}</h1>
        </div>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('new')}
              >
                {t.newGame}
              </button>
              <button
                className='button button--small button--icon'
                onClick={() => setView('settings')}
                aria-label={t.settings}
              >
                <Icon name='settings' />
              </button>
            </>
          ) : (
            round && (
              <button
                className='button button--small'
                onClick={() => setView('play')}
              >
                {view === 'new' ? t.cancel : t.done}
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          language={language}
          setLanguage={setLanguage}
          sound={sound}
          setSound={setSound}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && round && (
        <>
          <div className='stage'>
            <Board round={round} onPour={onPour} t={t} />
          </div>

          {solved ? (
            <section className='card solved'>
              <h2>{t.solved}</h2>
              <div className='solved__actions'>
                <button className='button' onClick={() => start(round.level)}>
                  {t.next}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  {t.changeLevel}
                </button>
              </div>
            </section>
          ) : (
            <div className='bar'>
              <div className='tools'>
                <button
                  className='tool'
                  onClick={() => update(undo(round))}
                  disabled={!round.history.length}
                  aria-label={t.undo}
                >
                  <Icon name='undo' />
                </button>
                <button
                  className='tool'
                  onClick={() => update(startOver(round))}
                  disabled={!round.drops.length}
                  aria-label={t.startOver}
                >
                  <Icon name='clear' />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='/des-kids-games/'>{t.allGames}</a>
          <a href='https://github.com/mardesnic/des-paint'>{t.source}</a>
          <span className='footer__version'>
            {t.version} {__VERSION__}
          </span>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
