import { withStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";

const Loader = withStyles((theme) => ({
  root: {
    marginTop: theme.spacing(8),
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
}))(CircularProgress);

export default Loader;
