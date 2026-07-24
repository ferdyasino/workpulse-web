import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatTime } from "@/utils/time";

import { useShifts } from "../hooks/useShifts";

export default function ShiftsTab() {
  const { user } = useAuth();

  const { shifts, loading, error } = useShifts(user?.workspace_id);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        width: "100%",
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
          Shifts
        </Typography>

        <Button variant="contained">Add Shift</Button>
      </Box>

      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 900,
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Timezone</TableCell>
              <TableCell>Grace</TableCell>
              <TableCell>Break</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {error}
                </TableCell>
              </TableRow>
            ) : shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No shifts found.</TableCell>
              </TableRow>
            ) : (
              shifts.map((shift) => (
                <TableRow key={shift.id} hover>
                  <TableCell>{shift.name}</TableCell>

                  <TableCell>{formatTime(shift.start_time, "12h")}</TableCell>

                  <TableCell>{formatTime(shift.end_time, "12h")}</TableCell>

                  <TableCell>{shift.timezone}</TableCell>

                  <TableCell>{shift.grace_minutes} min</TableCell>

                  <TableCell>{shift.break_minutes} min</TableCell>

                  <TableCell>
                    <Chip
                      label={shift.status}
                      color={shift.status === "ACTIVE" ? "success" : "default"}
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
      </Box>
    </Paper>
  );
}
