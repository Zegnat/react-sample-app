import { Container, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(8),
    marginBottom: theme.spacing(8),
  },
}));

type ResultProps = {
  numWords: number;
  numLetters: number;
};

export const Result = ({ numWords, numLetters }: ResultProps) => (
  <Container maxWidth="sm" classes={useStyles()}>
    <Typography align="center">
      Your text consists of {numWords} words {numLetters} letters
    </Typography>
  </Container>
);
