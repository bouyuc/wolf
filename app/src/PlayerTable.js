import React from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Checkbox from "@material-ui/core/Checkbox";
import { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/client";
import {
  fade,
  withStyles,
  makeStyles,
  createMuiTheme,
} from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
  },
  table: {
    minWidth: 750,
  },
  title: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
}));

const SET_DIE_STATUS = gql`
  mutation SetDieStatus($id: Int!) {
    setDieStatus(id: $id)
  }
`;
const SET_CHIEF_ID = gql`
  mutation SetChiefId($id: Int!) {
    setChiefId(id: $id)
  }
`;

const SET_VOTE_WEIGHTED_ID = gql`
  mutation SetVoteWeightedId($id: Int!) {
    setVoteWeightedId(id: $id)
  }
`;

const RESET_CHIEF_CANDIDATE = gql`
  mutation ResetChiefCandidate($id: Int!){
    resetChiefCaniddate(id: $id)
  }
`;

//voteWeightedId

export default function PlayerTable(props) {
  const classes = useStyles();
  const [setDie] = useMutation(SET_DIE_STATUS);
  const [setChiefId] = useMutation(SET_CHIEF_ID);
  const [setVoteWeightedId] = useMutation(SET_VOTE_WEIGHTED_ID);
  const [resetChiefCandidate] = useMutation(RESET_CHIEF_CANDIDATE);
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>警長</TableCell>
            <TableCell>死亡</TableCell>
            <TableCell>放逐加權</TableCell>
            <TableCell>ID</TableCell>

            <TableCell align="left">玩家</TableCell>
            <TableCell align="right">角色</TableCell>
            <TableCell align="right">投票</TableCell>
            <TableCell align="center">警長</TableCell>
            <TableCell align="center">放逐</TableCell>
            <TableCell align="right">上線</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                {(row.id === 0 ||
                  props.chiefId >= 0 ||
                  (row.chiefVoteState &&
                    row.chiefVoteState.isCandidate &&
                    !row.chiefVoteState.isDropedOut)) && (
                  <Checkbox
                    onChange={(e) => {
                      setChiefId({ variables: { id: row.id } });
                    }}
                    checked={row.id === props.chiefId}
                    color="primary"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                  />
                )}

                {row.chiefVoteState.type && (
                  <button onClick={()=>{
                    resetChiefCandidate({ variables: { id: row.id } });
                  }}>重置 {`(${row.chiefVoteState.type})`}</button>
                )}
              </TableCell>
              <TableCell>
                {row.id ? (
                  <Checkbox
                    onChange={(e) => {
                      setDie({ variables: { id: row.id } });
                    }}
                    checked={row.isDie}
                    color="primary"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                  />
                ) : null}
              </TableCell>
              <TableCell>
                <Checkbox
                  onChange={(e) => {
                    //setChiefId({variables:{id:row.id}});
                    setVoteWeightedId({ variables: { id: row.id } });
                  }}
                  checked={row.id === props.voteWeightedId}
                  color="primary"
                  inputProps={{ "aria-label": "secondary checkbox" }}
                />
              </TableCell>
              <TableCell component="th" scope="row">
                {row.id}
              </TableCell>
              <TableCell align="right">{row.name}</TableCell>
              <TableCell align="right">{row.roleName}</TableCell>
              <TableCell align="right">{row.votedNumber}</TableCell>
              <TableCell align="right">{row.chiefVote.toString()}</TableCell>
              <TableCell align="right">{row.vote.toString()}</TableCell>
              <TableCell align="right">
                <span
                  style={{
                    color: row.isEmpty
                      ? "gray"
                      : row.isVoteFinish
                      ? "lightgreen"
                      : "orange",
                    transition: "all .3s ease",
                    fontSize: "24px",
                    marginRight: "10px",
                  }}
                >
                  &#x25cf;
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
