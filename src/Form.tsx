import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import { FormEventHandler, useState } from "react";

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

  return (
    <Container
      maxWidth="sm"
      component="form"
      onSubmit={(event) => onSubmit(event, textFieldValue)}
      sx={{ marginTop: 8, marginBottom: 8 }}
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
        sx={{ float: "right", marginTop: 2 }}
      >
        {button}
      </Button>
    </Container>
  );
};
