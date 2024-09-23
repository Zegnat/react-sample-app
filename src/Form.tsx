import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
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
      <FormControl fullWidth>
        <InputLabel htmlFor="data">
          {label}
        </InputLabel>
        <OutlinedInput
          label={label} // Set label one more time: https://github.com/mui/material-ui/issues/31287
          id="data"
          name="data"
          multiline
          rows={5}
          required
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
