import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import type { FormEventHandler } from "react";

type FormProps = {
  label?: string;
  button?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export const Form = ({
  label = "User types text here",
  button = "Submit",
  onSubmit,
}: FormProps) => {
  return (
    <Container
      maxWidth="sm"
      component="form"
      onSubmit={onSubmit}
      sx={{ marginTop: 8, marginBottom: 8 }}
    >
      <TextField
        label={label}
        name="data"
        multiline
        variant="outlined"
        fullWidth
        rows="5"
        required
      />
      <Button
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
