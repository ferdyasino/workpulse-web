import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { useAuth } from "@/features/auth/hooks/useAuth";

import { usePositions } from "../hooks/usePositions";

export default function PositionsTab() {
  const { user } = useAuth();

  const { positions, loading, error } = usePositions(user?.workspace_id);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Positions
        </Typography>

        <Button variant="contained">Add Position</Button>
      </Box>

      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {error}
                </TableCell>
              </TableRow>
            ) : positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No positions found.</TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id} hover>
                  <TableCell>{position.title}</TableCell>

                  <TableCell>{position.description ?? "-"}</TableCell>

                  <TableCell>
                    <Chip
                      label={position.status}
                      color={position.status === "ACTIVE" ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Button size="small">Edit</Button>

                    <Button size="small" color="error">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
