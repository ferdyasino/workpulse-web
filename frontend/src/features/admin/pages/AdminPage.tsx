import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import DepartmentsTab from "../components/DepartmentsTab";
import PositionsTab from "../components/PositionsTab";
import ShiftsTab from "../components/ShiftsTab";
import UsersTab from "../components/UsersTab";
import UserShiftOverridesTab from "../components/UserShiftOverridesTab";
import UserShiftsTab from "../components/UserShiftsTab";

import { useUsers } from "../hooks/useUsers";

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  const { user } = useAuth();

  const { users } = useUsers();

  console.log("ADMIN AUTH USER:", user);
  console.log("ADMIN USERS:", users);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 2,
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
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
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
        }}
      >
        <Tab label="Users" />
        <Tab label="Departments" />
        <Tab label="Positions" />
        <Tab label="Shifts" />
        <Tab label="User Shift Overrides" />
        <Tab label="User Shifts" />
      </Tabs>

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {tab === 0 && <UsersTab />}

        {tab === 1 && <DepartmentsTab />}

        {tab === 2 && <PositionsTab />}

        {tab === 3 && <ShiftsTab />}

        {tab === 4 && <UserShiftOverridesTab />}

        {tab === 5 && (
          <UserShiftsTab
            users={users.map((user) => ({
              id: user.id,
              display_name: user.display_name,
              email: user.email,
            }))}
          />
        )}
      </Box>
    </Paper>
  );
}
