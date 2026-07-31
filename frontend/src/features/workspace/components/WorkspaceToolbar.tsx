import { Button, FormControlLabel, Stack, Switch, TextField } from "@mui/material";

interface WorkspaceToolbarProps {
  search: string;
  includeDeleted: boolean;

  onSearchChange: (value: string) => void;
  onIncludeDeletedChange: (value: boolean) => void;
  onCreate: () => void;
}

export default function WorkspaceToolbar({
  search,
  includeDeleted,
  onSearchChange,
  onIncludeDeletedChange,
  onCreate,
}: WorkspaceToolbarProps) {
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        size="small"
        label="Search Workspace"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={includeDeleted}
              onChange={(e) => onIncludeDeletedChange(e.target.checked)}
            />
          }
          label="Include Deleted"
        />

        <Button variant="contained" onClick={onCreate}>
          New Workspace
        </Button>
      </Stack>
    </Stack>
  );
}
