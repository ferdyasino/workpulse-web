import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

import DepartmentsTab from "../components/DepartmentsTab";
import PositionsTab from "../components/PositionsTab";
import ShiftsTab from "../components/ShiftsTab";
import UsersTab from "../components/UsersTab";

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        Admin Dashboard
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        sx={{
          mb: 3,
        }}
      >
        <Tab label="Users" />
        <Tab label="Departments" />
        <Tab label="Positions" />
        <Tab label="Shifts" />
      </Tabs>

      <Box>
        {tab === 0 && <UsersTab />}
        {tab === 1 && <DepartmentsTab />}
        {tab === 2 && <PositionsTab />}
        {tab === 3 && <ShiftsTab />}
      </Box>
    </Paper>
  );
}
