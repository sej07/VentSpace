import { useState } from "react";
import AuthPages from "./pages/AuthPages";
import MainApp from "./pages/MainApp";

export default function App() {
  const [authed, setAuthed] = useState(false);
  return authed
    ? <MainApp onLogout={() => setAuthed(false)} />
    : <AuthPages onAuth={() => setAuthed(true)} />;
}
