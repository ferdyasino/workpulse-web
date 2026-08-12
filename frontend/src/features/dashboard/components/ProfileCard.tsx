import { Avatar, Box, Chip, Divider, Paper, Typography } from "@mui/material";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAttendanceContext } from "@/features/dashboard/context/AttendanceContext";

import { formatShiftTime } from "@/utils/time";

export default function ProfileCard() {
  const { user } = useAuth();
  const { state } = useAttendanceContext();

  const shift = state?.shift ?? user?.shift ?? null;
  const status = state?.status ?? "OFF";

  const avatarUrl = user?.avatar_url ?? undefined;

  const name = user?.display_name ?? user?.email?.split("@")[0] ?? "Guest User";

  const initials = name
    .split(/[.\s_-]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const department = user?.department?.name ?? "Unassigned";
  const position = user?.position?.name ?? "Unassigned";
  const employeeNo = user?.employee_no ?? "--";

  const timeFormat: "12h" | "24h" = "12h";

  const statusColor =
    status === "WORKING"
      ? "success"
      : status === "BREAK"
        ? "warning"
        : status === "LUNCH"
          ? "info"
          : status === "ABSENT"
            ? "error"
            : "default";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
        }}
      >
        {/* HEADER */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "auto 1fr auto",
            },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Avatar
            src={avatarUrl}
            sx={{
              width: 96,
              height: 96,
              fontSize: 34,
              fontWeight: 700,
              mx: {
                xs: "auto",
                md: 0,
              },
            }}
          >
            {initials}
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
              textAlign: {
                xs: "center",
                md: "left",
              },
            }}
          >
            <Typography
              variant="h5"
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
              {user?.email ?? "--"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.5,
              }}
            >
              Employee # {employeeNo}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: {
                xs: "center",
                md: "flex-end",
              },
            }}
          >
            <Chip size="small" label={user?.role ?? "EMPLOYEE"} />

            <Chip
              size="small"
              label={user?.employment_status ?? "ACTIVE"}
              color="primary"
              variant="outlined"
            />

            <Chip size="small" label={status} color={statusColor} />
          </Box>
        </Box>

        <Divider />

        {/* DETAILS */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
            },
            gap: 3,
          }}
        >
          {/* LEFT */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              rowGap: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Department
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {department}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Position
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {position}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Timezone
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {shift?.timezone ?? "--"}
            </Typography>
          </Box>

          {/* RIGHT */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              rowGap: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Shift
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {shift?.name ?? "Unassigned"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Schedule
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {shift
                ? `${formatShiftTime(shift.start_time, timeFormat)} - ${formatShiftTime(
                    shift.end_time,
                    timeFormat,
                  )}`
                : "--"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Since
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {user?.hire_date ?? "--"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
