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

import { useDepartments } from "../hooks/useDepartments";

export default function DepartmentsTab() {
  const { departments, loading, error } = useDepartments();

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
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
          Departments
        </Typography>

        <Button variant="contained">Add Department</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
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
          ) : departments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>No departments found.</TableCell>
            </TableRow>
          ) : (
            departments.map((department) => (
              <TableRow key={department.id} hover>
                <TableCell>{department.name}</TableCell>

                <TableCell>{department.description ?? "-"}</TableCell>

                <TableCell>
                  <Chip
                    label={department.status}
                    color={department.status === "ACTIVE" ? "success" : "default"}
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
