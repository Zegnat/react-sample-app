import type { FormEventHandler } from "react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { analyzeText } from "./../analysis";
import { Form } from "./Form";
import { Loader } from "./Loader";
import { Result } from "./Result";

const App = () => {
  enum State {
    WaitingForInput,
    Loading,
    ShowingResult,
  }

  const [state, setState] = useState(State.WaitingForInput);

  const [results, setResults] = useState({ numWords: 0, numLetters: 0 });

  const analyse = (async (event) => {
    event.preventDefault();
    if (event.target instanceof HTMLFormElement === false) {
      return;
    }
    const value = new FormData(event.target).get("data");
    if (typeof value !== "string") {
      return;
    }
    setState(State.Loading);
    setResults(await analyzeText(value));
    setState(State.ShowingResult);
  }) satisfies FormEventHandler<HTMLFormElement>;

  let appState = <Form onSubmit={analyse} />;
  if (state === State.Loading) {
    appState = <Loader />;
  } else if (state === State.ShowingResult) {
    appState = (
      <Result numWords={results.numWords} numLetters={results.numLetters} />
    );
  }

  return <StrictMode>{appState}</StrictMode>;
};

const root = createRoot(document.body.firstElementChild!);
root.render(<App />);
