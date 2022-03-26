import { FormEvent, StrictMode, useState } from "react";
import { render } from "react-dom";
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

  const analyse = async (event: FormEvent<HTMLFormElement>, value: string) => {
    event.preventDefault();
    setState(State.Loading);
    setResults(await analyzeText(value));
    setState(State.ShowingResult);
  };

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

render(<App />, document.body.firstElementChild);
