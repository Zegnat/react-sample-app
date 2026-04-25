import type { SubmitEventHandler } from "react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { analyzeText } from "./../analysis";
import { Error } from "./Error";
import { Form } from "./Form";
import { Loader } from "./Loader";
import { Result } from "./Result";

enum State {
  WaitingForInput,
  Loading,
  ShowingResult,
  Error,
}

const App = () => {
  const [state, setState] = useState(State.WaitingForInput);

  const [results, setResults] = useState({ numWords: 0, numLetters: 0 });

  const analyse: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!(event.target instanceof HTMLFormElement)) {
      return;
    }
    const value = new FormData(event.target).get("data");
    if (typeof value !== "string") {
      return;
    }
    setState(State.Loading);
    void analyzeText(value).then(
      (result) => {
        setResults(result);
        setState(State.ShowingResult);
      },
      () => {
        setState(State.Error);
      },
    );
  };

  let appState = <Form onSubmit={analyse} />;
  if (state === State.Loading) {
    appState = <Loader />;
  } else if (state === State.ShowingResult) {
    appState = (
      <Result numWords={results.numWords} numLetters={results.numLetters} />
    );
  } else if (state === State.Error) {
    appState = <Error />;
  }

  return <StrictMode>{appState}</StrictMode>;
};

const main = document.body.firstElementChild;
if (main) {
  const root = createRoot(main);
  root.render(<App />);
}
