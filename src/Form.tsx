import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import TextField from "@material-ui/core/TextField";

const SpacedContainer = withStyles((theme) => ({
  root: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
}))(Container);

const RightHandButton = withStyles((theme) => ({
  root: {
    float: "right",
    marginTop: theme.spacing(2),
  },
}))(Button);

type ExtendedOnSubmit<Base extends (...args: any) => any> = (
  ...args: [...inherit: Parameters<Base>, value: string]
) => ReturnType<Base>;

interface FormSettings {
  label?: string;
  button?: string;
  onSubmit: ExtendedOnSubmit<React.FormEventHandler<HTMLFormElement>>;
}

const Form: React.FC<FormSettings> = (settings) => {
  const [textFieldValue, setTextFieldValue] = React.useState("");

  const { label = "User types text here", button = "Submit" } = settings;
  return (
    <SpacedContainer
      maxWidth="sm"
      component="form"
      onSubmit={(event) => settings.onSubmit(event, textFieldValue)}
    >
      <TextField
        label={label}
        multiline
        variant="outlined"
        fullWidth
        rows="5"
        onChange={(event) => setTextFieldValue(event.target.value)}
      />
      <RightHandButton
        disabled={textFieldValue.length === 0}
        type="submit"
        color="primary"
        variant="contained"
      >
        {button}
      </RightHandButton>
    </SpacedContainer>
  );
};

export default Form;
