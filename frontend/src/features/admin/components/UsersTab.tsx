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

import { useUsers } from "../hooks/useUsers";

export default function UsersTab() {
  const { user } = useAuth();

  const { users, loading, error } = useUsers(user?.workspace_id);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
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
          Users
        </Typography>

        <Button variant="contained">Add User</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee No.</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Shift</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                {error}
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>No users found.</TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.employee_no}</TableCell>

                <TableCell>{user.display_name}</TableCell>

                <TableCell>{user.email}</TableCell>

                <TableCell>{user.role}</TableCell>

                <TableCell>{user.department ?? "-"}</TableCell>

                <TableCell>{user.position ?? "-"}</TableCell>

                <TableCell>{user.shift ?? "-"}</TableCell>

                <TableCell>
                  <Chip
                    label={user.employment_status}
                    color={user.employment_status === "ACTIVE" ? "success" : "default"}
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
    </Paper>
  );
}
