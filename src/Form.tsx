import { Button, Container, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { FormEventHandler, useState } from "react";

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
  onSubmit: ExtendedOnSubmit<FormEventHandler<HTMLFormElement>>;
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
      // Had to add `as` casting, Typescript otherwise errored thinking `event` has an `any` type.
      onSubmit={
        ((event) =>
          onSubmit(event, textFieldValue)) as FormEventHandler<HTMLFormElement>
      }
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
