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

interface FormSettings {
  label?: string;
  button?: string;
  onSubmit: React.FormEventHandler;
  ref: any;
}

const Form: React.FC<FormSettings> = React.forwardRef((settings, ref) => {
  const [submitable, setSubmitable] = React.useState(true);

  const { label = "User types text here", button = "Submit" } = settings;
  return (
    <SpacedContainer
      maxWidth="sm"
      component="form"
      onSubmit={settings.onSubmit}
    >
      <TextField
        inputRef={ref}
        label={label}
        multiline
        variant="outlined"
        fullWidth
        rows="5"
        onChange={() => {
          ref.current.value.length > 0
            ? setSubmitable(false)
            : setSubmitable(true);
        }}
      />
      <RightHandButton
        disabled={submitable}
        type="submit"
        color="primary"
        variant="contained"
      >
        {button}
      </RightHandButton>
    </SpacedContainer>
  );
});

export default Form;
