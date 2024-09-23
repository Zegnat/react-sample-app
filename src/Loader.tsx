import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";

export const Loader = () => (
  <Container
    maxWidth="sm"
    sx={{ textAlign: "center", marginTop: 8, marginBottom: 8 }}
  >
    <CircularProgress />
  </Container>
);
