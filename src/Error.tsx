import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export const Error = () => (
  <Container maxWidth="sm" sx={{ marginTop: 8, marginBottom: 8 }}>
    <Typography align="center" color="error">
      Something went wrong. Please refresh and try again.
    </Typography>
  </Container>
);
