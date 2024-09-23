import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { FormEventHandler } from "react";
import { useId } from "react";

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
  const inputId = useId();

  return (
    <Container
      maxWidth="sm"
      component="form"
      onSubmit={onSubmit}
      sx={{ marginTop: 8, marginBottom: 8 }}
    >
      <FormControl fullWidth required>
        <InputLabel htmlFor={inputId}>{label}</InputLabel>
        <OutlinedInput
          label={label} // Set label one more time: https://github.com/mui/material-ui/issues/31287
          id={inputId}
          name="data"
          multiline
          rows={5}
        />
      </FormControl>
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
