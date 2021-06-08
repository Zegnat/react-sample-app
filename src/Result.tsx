import * as React from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

interface ResultValues {
  numWords: number;
  numLetters: number;
}

const Result: React.FC<ResultValues> = (results) => {
  return (
    <Box textAlign="center" marginTop={8}>
      <Typography>
        Your text consists of {results.numWords} words ({results.numLetters}{" "}
        letters)
      </Typography>
    </Box>
  );
};

export default Result;
