import { Avatar, Box, Paper, Typography } from "@mui/material";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAttendanceContext } from "@/providers/AttendanceProvider";

export default function ProfileCard() {
  const { user } = useAuth();
  const { state } = useAttendanceContext();

  const name = user?.email?.split("@")[0] ?? "Guest User";

  const initials = name
    .split(/[.\s_-]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const status = state?.status ?? "OFF";

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
          alignItems: "center",
          gap: 3,
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            fontSize: 28,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            {name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            {user?.role ?? "Employee"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Shift: {user?.shift_id ?? "Unassigned"}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontWeight: 700,
            }}
          >
            {status}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
