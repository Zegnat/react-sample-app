import { CircularProgress, Container } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: "center",
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
}));

export const Loader = () => (
  <Container maxWidth="sm" classes={useStyles()}>
    <CircularProgress></CircularProgress>
  </Container>
);
