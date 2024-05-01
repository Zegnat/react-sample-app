import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

type ResultProps = {
  numWords: number;
  numLetters: number;
};

export const Result = ({ numWords, numLetters }: ResultProps) => (
  <Container maxWidth="sm" sx={{ marginTop: 8, marginBottom: 8 }}>
    <Typography align="center">
      Your text consists of {numWords} words {numLetters} letters
    </Typography>
  </Container>
);
