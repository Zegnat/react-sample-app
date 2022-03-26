import * as React from "react";
import { analyzeText } from "./../analysis";
import { render } from "react-dom";
import Form from "./Form";
import Loader from "./Loader";
import Result from "./Result";

const App: React.FC = () => {
  enum State {
    WaitingForInput,
    Loading,
    ShowingResult,
  }

  const [state, setState] = React.useState(State.WaitingForInput);

  const [results, setResults] = React.useState({ numWords: 0, numLetters: 0 });

  const analyse = async (
    event: React.FormEvent<HTMLFormElement>,
    value: string
  ) => {
    event.preventDefault();
    setState(State.Loading);
    setResults(await analyzeText(value));
    setState(State.ShowingResult);
  };

  if (state === State.Loading) {
    return <Loader />;
  } else if (state === State.ShowingResult) {
    return (
      <Result numWords={results.numWords} numLetters={results.numLetters} />
    );
  } else {
    return <Form onSubmit={analyse} />;
  }
};

render(<App />, document.body.firstElementChild);
