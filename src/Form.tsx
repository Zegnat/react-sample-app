import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { useState } from "react";

const useStyles = makeStyles((theme) => ({
  containerMargins: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
  buttonPositioning: {
    float: "right",
    marginTop: theme.spacing(2),
  },
}));

type ExtendedOnSubmit<Base extends (...args: any) => any> = (
  ...args: [...inherit: Parameters<Base>, value: string]
) => ReturnType<Base>;

type FormProps = {
  label?: string;
  button?: string;
  onSubmit: ExtendedOnSubmit<React.FormEventHandler<HTMLFormElement>>;
};

export const Form = ({
  label = "User types text here",
  button = "Submit",
  onSubmit,
}: FormProps) => {
  const [textFieldValue, setTextFieldValue] = useState("");
  const classes = useStyles();

  return (
    <Container
      maxWidth="sm"
      component="form"
      onSubmit={(event) => onSubmit(event, textFieldValue)}
      classes={{ root: classes.containerMargins }}
    >
      <TextField
        label={label}
        multiline
        variant="outlined"
        fullWidth
        rows="5"
        onChange={(event) => setTextFieldValue(event.target.value)}
      />
      <Button
        disabled={textFieldValue.length === 0}
        type="submit"
        color="primary"
        variant="contained"
        classes={{ root: classes.buttonPositioning }}
      >
        {button}
      </Button>
    </Container>
  );
};
