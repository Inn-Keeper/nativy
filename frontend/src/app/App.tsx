import { PracticeScreen } from '../practice/PracticeScreen';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <a className="wordmark" href="/" aria-label="Nativy home">nativy<span>.</span></a>
        <span className="language">Swedish <span lang="sv">SV</span></span>
      </header>
      <PracticeScreen />
      <footer>Your voice. Your pace.</footer>
    </div>
  );
}
