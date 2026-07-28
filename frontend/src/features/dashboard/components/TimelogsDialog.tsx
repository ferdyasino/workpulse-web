import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useSettingsContext } from "@/features/settings/context/SettingsContext";
import { useAttendanceContext } from "@/features/dashboard/context/AttendanceContext";
import { formatDateInput } from "@/utils/time";

type Timelog = {
  id: string;

  event_time_utc: string;

  event_type: string;

  work_date: string;
};

type Props = {
  open: boolean;

  onClose: () => void;

  timelogs: Timelog[];
};

export default function TimelogsDialog({ open, onClose, timelogs }: Props) {
  const { settings } = useSettingsContext();

  const { state } = useAttendanceContext();

  const timezone =
    state?.shift?.timezone ??
    settings?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const locale = settings?.locale ?? "en-US";

  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [eventFilter, setEventFilter] = useState("ALL");

  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setDateFilter(formatDateInput(new Date(), timezone));
  }, [timezone]);

  const filteredTimelogs = useMemo(() => {
    return [...timelogs]
      .filter((log) => {
        if (eventFilter !== "ALL" && log.event_type !== eventFilter) {
          return false;
        }

        if (dateFilter && log.work_date !== dateFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const first = new Date(a.event_time_utc).getTime();

        const second = new Date(b.event_time_utc).getTime();

        return sortOrder === "newest" ? second - first : first - second;
      });
  }, [timelogs, sortOrder, eventFilter, dateFilter]);

  const eventTypes = ["ALL", ...new Set(timelogs.map((log) => log.event_type))];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Timelogs</DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: 600,
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 2,
            flexShrink: 0,
          }}
        >
          <TextField
            size="small"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <Select
            size="small"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          >
            <MenuItem value="newest">Newest First</MenuItem>

            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>

          <Select size="small" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            {eventTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
          }}
        >
          Display timezone: <strong>{timezone}</strong>
        </Typography>

        <TableContainer
          sx={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>

                <TableCell>Time</TableCell>

                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTimelogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3}>No timelogs found.</TableCell>
                </TableRow>
              ) : (
                filteredTimelogs.map((log) => {
                  const date = new Date(log.event_time_utc);

                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        {date.toLocaleDateString(locale, {
                          timeZone: timezone,
                        })}
                      </TableCell>

                      <TableCell>
                        {date.toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: timezone,
                        })}
                      </TableCell>

                      <TableCell>{log.event_type}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
